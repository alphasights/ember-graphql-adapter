import DS from 'ember-data';
import Ember from 'ember';

const {
  String: {
    camelize,
    pluralize,
    singularize,
    underscore
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

  serializeBelongsTo(snapshot, json, relationship) {
    let {key, kind, options} = relationship;
    let embeddedSnapshot = snapshot.belongsTo(key);
    if (options.async) {
      let serializedKey = this.keyForRelationship(key, kind, 'serialize');
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
      let serializedKey = this.keyForRelationship(key, kind, 'serialize');
      json[serializedKey] = snapshot.hasMany(key, { ids: true });
    } else {
      this._serializeEmbeddedHasMany(snapshot, json, relationship);
    }
  },

  normalizeResponse(store, primaryModelClass, payload, id, requestType) {
    let data = payload['data'];
    const type = this.normalizeCase(primaryModelClass.modelName);
    const root = data[type] || data[pluralize(type)];

    Ember.assert('The root of the result must be the model class name or the plural model class name', Ember.typeOf(root) !== 'undefined');

    return this._super(store, primaryModelClass, root, id, requestType);
  },

  extractRelationships(modelClass, resourceHash) {
    let relationships = {};

    modelClass.eachRelationship((key, {kind, type, options}) => {
      let relationship = null;
      let relationshipKey = this.keyForRelationship(key, kind, 'deserialize', options);

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

  keyForAttribute(key, method) {
    if (method === 'deserialize') {
      return this.normalizeCase(key);
    }
    return underscore(key);
  },

  keyForRelationship(key, kind, method, options) {
    if (method === 'deserialize') {
      if (options.async) {
        let suffix = kind === 'hasMany' ? 'Ids' : 'Id';
        return this.normalizeCase(singularize(key) + suffix);
      } else {
        return this.normalizeCase(key);
      }
    }
    return underscore(key);
  }
});
