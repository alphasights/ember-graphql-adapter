import DS from 'ember-data';
import Ember from 'ember';

const {
  String: {
    camelize,
    pluralize,
    singularize
  }
} = Ember;

export default DS.JSONSerializer.extend(DS.EmbeddedRecordsMixin, {
  isNewSerializerAPI: true,

  normalizeCase(string) {
    return camelize(string);
  },

  serializeIntoHash(hash, typeClass, snapshot, options) {
    if (snapshot.id) {
      hash[Ember.get(this, 'primaryKey')] = snapshot.id;
    }
    this._super(hash, typeClass, snapshot, options);
  },

  serializeAttribute(snapshot, json, key, attribute) {
    let type = attribute.type;

    if (this._canSerialize(key)) {
      let value = snapshot.attr(key);
      if (type) {
        if (type === 'string') {
          if (!Ember.isNone(value)) {
            value = value.replace(/\"/g, '\\"');
          }
        } else {
          let transform = this.transformFor(type);
          value = transform.serialize(value, attribute.options);
        }
      }

      // if provided, use the mapping provided by `attrs` in
      // the serializer
      let payloadKey =  this._getMappedKey(key, snapshot.type);

      if (payloadKey === key && this.keyForAttribute) {
        payloadKey = this.keyForAttribute(key);
      }

      json[payloadKey] = value;
    }
  },

  serializeBelongsTo(snapshot, json, relationship) {
    let {key, kind, options} = relationship;
    let embeddedSnapshot = snapshot.belongsTo(key);
    if (options.async) {
      let serializedKey = this.keyForRelationship(key, kind, options);
      if (!embeddedSnapshot) {
        json[serializedKey] = null;
      } else {
        json[serializedKey] = embeddedSnapshot.id;

        if (options.polymorphic) {
          this.serializePolymorphicType(snapshot, json, relationship);
        }
      }
    } else {
      this._serializeEmbeddedBelongsTo(snapshot, json, relationship);
    }
  },

  serializeHasMany(snapshot, json, relationship) {
    let {key, kind, options} = relationship;
    if (options.async) {
      let serializedKey = this.keyForRelationship(key, kind, options);
      json[serializedKey] = snapshot.hasMany(key, { ids: true });
    } else {
      this._serializeEmbeddedHasMany(snapshot, json, relationship);
    }
  },

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    let data = payload['data'];
    let meta = payload['meta'];

    const type = this.normalizeCase(primaryModelClass.modelName);
    let root = data[type];
    if (Ember.typeOf(root) === 'undefined') {
      root = data[pluralize(type)];
    }

    Ember.assert('The root of the result must be the model class name or the plural model class name', Ember.typeOf(root) !== 'undefined');

    if (meta) { root['meta'] = meta; }

    return this._super(store, primaryModelClass, root, id, requestType);
  },

  extractRelationships(modelClass, resourceHash) {
    let relationships = {};

    modelClass.eachRelationship((key, {kind, type, options}) => {
      let relationship = null;
      let relationshipKey = this.keyForRelationship(key, kind, options);

      if (resourceHash.hasOwnProperty(relationshipKey)) {
        let data = null;
        let relationshipHash = resourceHash[relationshipKey];
        if (kind === 'belongsTo') {
          data = this.extractRelationship(type, relationshipHash);
        } else if (kind === 'hasMany') {
          if (!Ember.isNone(relationshipHash)) {
            data = new Array(relationshipHash.length);
            for (let i = 0, l = relationshipHash.length; i < l; i++) {
              let item = relationshipHash[i];
              data[i] = this.extractRelationship(type, item);
            }
          }
        }
        relationship = { data };
      }

      let linkKey = this.keyForLink(key, kind);
      if (resourceHash.links && resourceHash.links.hasOwnProperty(linkKey)) {
        let related = resourceHash.links[linkKey];
        relationship = relationship || {};
        relationship.links = { related };
      }

      if (relationship) {
        relationships[key] = relationship;
      }
    });

    return relationships;
  },

  _extractEmbeddedRecords(serializer, store, typeClass, partial) {
    typeClass.eachRelationship((key, relationship) => {
      if (!relationship.options.async) {
        if (relationship.kind === "hasMany") {
          this._extractEmbeddedHasMany(store, key, partial, relationship);
        }
        if (relationship.kind === "belongsTo") {
          this._extractEmbeddedBelongsTo(store, key, partial, relationship);
        }
      }
    });
    return partial;
  },

  keyForAttribute(key) {
    return this.normalizeCase(key);
  },

  keyForRelationship(key, kind, options) {
    if (options && options.async) {
      let suffix = kind === 'hasMany' ? 'Ids' : 'Id';
      return this.normalizeCase(singularize(key) + suffix);
    } else {
      return this.normalizeCase(key);
    }
  }
});
