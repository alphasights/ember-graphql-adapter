import DS from 'ember-data';
import Ember from 'ember';

const {
  String: {
    camelize,
    singularize,
    pluralize,
    underscore
  }
} = Ember;

export default DS.JSONAPISerializer.extend({
  isNewSerializerAPI: true,

  normalizeCase: function(string) {
    return camelize(string);
  },

  serialize: function(snapshot) {
    let data = {};

    if (snapshot.id) {
      data[Ember.get(this, 'primaryKey')] = snapshot.id;
    }

    snapshot.eachAttribute((key, attribute) => {
      this.__serializeAttribute(snapshot, data, key, attribute);
    });

    snapshot.eachRelationship((_relName, relationship) => {
      if (relationship.kind === 'belongsTo') {
        this.__serializeBelongsTo(snapshot, data, relationship);
      } else if (relationship.kind === 'hasMany') {
        this.__serializeHasMany(snapshot, data, relationship);
      }
    });

    return data;
  },

  __serializeBelongsTo: function(snapshot, data, relationship) {
    let key = relationship.key;

    if (this._canSerialize(key)) {
      let belongsTo = snapshot.belongsTo(key);

      if (belongsTo !== undefined) {
        let payloadKey = this._getMappedKey(key, snapshot.type);
        if (payloadKey === key && this.keyForRelationship) {
          payloadKey = this.keyForRelationship(key, 'belongsTo', 'serialize');
        }

        let associationKey = this.normalizeCase(`${payloadKey}Id`);
        data[associationKey] = belongsTo.id;
      }
    }
  },

  __serializeHasMany(snapshot, data, relationship) {
    let key = relationship.key;

    if (this._shouldSerializeHasMany(snapshot, key, relationship)) {
      let hasMany = snapshot.hasMany(key);

      if (hasMany !== undefined) {
        let payloadKey = this._getMappedKey(key, snapshot.type);
        if (payloadKey === key && this.keyForRelationship) {
          payloadKey = this.keyForRelationship(key, 'hasMany', 'serialize');
        }

        let associationKey = this.normalizeCase(`${singularize(payloadKey)}Ids`);
        data[associationKey] = hasMany.map(el => el.id);
      }
    }
  },

  __serializeAttribute: function(snapshot, data, key, attribute) {
    let type = attribute.type;
    let value = snapshot.attr(key);

    if (this._canSerialize(key)) {
      if (type) {
        let transform = this.transformFor(type);
        value = transform.serialize(value);
      }
      let payloadKey =  this._getMappedKey(key, snapshot.type);
      if (payloadKey === key) {
        payloadKey = this.keyForAttribute(key, 'serialize');
      }

      data[payloadKey] = value;
    }
  },

  normalizeResponse: function(store, primaryModelClass, payload, id, requestType) {
    let data = payload['data'];
    const documentHash = { 'data': [], 'included': [] };
    const type = this.normalizeCase(primaryModelClass.modelName);
    const root = data[type] || data[pluralize(type)];

    Ember.assert('The root of the result must be the model class name or the plural model class name', Ember.typeOf(root) !== 'undefined');

    const singular = requestType.match(/^.*Record$/) || requestType === 'belongsTo';
    data = singular ? [root] : root;

    data.forEach((item) => {
      documentHash['data'].push({
        'type': type,
        'id': this.__extractId(item),
        'attributes': this.__extractAttributes(primaryModelClass, item, this),
        'relationships': this.__extractRelationships(primaryModelClass, item)
      });

      primaryModelClass.eachRelationship((relName, {kind, type}) => {
        let normalizedRelName = this.normalizeCase(relName);
        let includes = item[normalizedRelName];
        if (!includes) { return; }

        if (Ember.typeOf(includes) !== 'array') {
          includes = [includes];
        }

        const includeModelClass = store.modelFor(type);
        const serializer = store.serializerFor(includeModelClass.modelName);

        includes = this.__normalizeIncludes(store, includes, includeModelClass, serializer);
        includes.forEach((include) => {
          documentHash['included'].push(include);
        });
      });
    });

    if (singular) { documentHash['data'] = documentHash['data'][0]; }

    return this._super(store, primaryModelClass, documentHash, id, requestType);
  },

  __normalizeIncludes: function(store, includes, includeModelClass, serializer) {
    return includes.map((include) => {
      return {
        'type': includeModelClass.modelName,
        'id': this.__extractId(include),
        'attributes': this.__extractAttributes(includeModelClass, include, serializer),
      };
    });
  },

  __extractId: function(resourceHash) {
    return resourceHash['id'];
  },

  __extractAttributes: function(modelClass, resourceHash, serializer) {
    const attributes = {};

    modelClass.eachAttribute((key) => {
      let normalizedKey = this.normalizeCase(key);
      attributes[serializer.keyForAttribute(key)] = resourceHash[normalizedKey];
    });

    return attributes;
  },

  __extractRelationships: function(modelClass, resourceHash) {
    const relationships = {};

    modelClass.eachRelationship((relName, {kind, type, options}) => {
      let data;

      if (options.async) {
        let suffix = kind === 'hasMany' ? 'Ids' : 'Id';
        let key = singularize(relName) + suffix;
        let normalizedKey = this.normalizeCase(key);
        data = this.__buildRelationships(type, resourceHash[normalizedKey], (elem) => elem);
      } else {
        let normalizedRelName = this.normalizeCase(relName);
        data = this.__buildRelationships(type, resourceHash[normalizedRelName], (elem) => elem.id);
      }

      if (Ember.isPresent(data)) {
        relationships[this.keyForRelationship(relName)] = { 'data': data };
      }
    });

    return relationships;
  },

  __buildRelationships: function(type, data, extractIdFn) {
    if (!data) {
      return;
    }

    if (Ember.typeOf(data) === 'array') {
      return data.map((elem) => {
        return this.__buildRelationship(extractIdFn(elem), type);
      });
    } else {
      return this.__buildRelationship(extractIdFn(data), type);
    }
  },

  __buildRelationship: function(id, type) {
    return {
      'id': id,
      'type': type
    };
  },

  keyForAttribute: function(key) {
    return underscore(key);
  },

  keyForRelationship: function(key) {
    return underscore(key);
  }
});
