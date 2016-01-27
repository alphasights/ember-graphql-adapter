import DS from 'ember-data';
import Ember from 'ember';

export default DS.JSONAPISerializer.extend({
  isNewSerializerAPI: true,

  serialize: function(snapshot) {
    let data = {};

    if (snapshot.id) {
      data[Ember.get(this, 'primaryKey')] = snapshot.id;
    }

    snapshot.eachAttribute((key, attribute) => {
      this.__serializeAttribute(snapshot, data, key, attribute);
    });

    snapshot.eachRelationship((relName, relationship) => {
      if (relationship.kind === 'belongsTo') {
        this.__serializeBelongsTo(snapshot, data, relationship);
      } else if (relationship.kind === 'hasMany') {
        this.__serializeHasMany(snapshot, data, relationship);
      }
    });

    return data;
  },

  __serializeBelongsTo: function(snapshot, data, relationship) {
    var key = relationship.key;

    if (this._canSerialize(key)) {
      var belongsTo = snapshot.belongsTo(key);

      if (belongsTo) {
        var payloadKey = this._getMappedKey(key, snapshot.type);
        if (payloadKey === key) {
          payloadKey = this.keyForRelationship(key, 'belongsTo', 'serialize');
        }

        data[payloadKey + '_id'] = belongsTo.id;
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
      var payloadKey =  this._getMappedKey(key, snapshot.type);
      if (payloadKey === key) {
        payloadKey = this.keyForAttribute(key, 'serialize');
      }

      data[payloadKey] = value;
    }
  },

  normalizeResponse: function(store, primaryModelClass, payload, id, requestType) {
    let data = payload['data'];
    const documentHash = { 'data': [], 'included': [] };
    const type = Ember.String.camelize(primaryModelClass.modelName);
    const root = data[type] || data[Ember.String.pluralize(type)];

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
        let includes = item[relName];
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
      attributes[serializer.keyForAttribute(key)] = resourceHash[key];
    });

    return attributes;
  },

  __extractRelationships: function(modelClass, resourceHash) {
    const relationships = {};

    modelClass.eachRelationship((relName, {kind, type, options}) => {
      let data;

      if (options.async) {
        let suffix = kind === 'hasMany' ? 'Ids' : 'Id';
        let key = Ember.String.singularize(relName) + suffix;
        data = this.__buildRelationships(type, resourceHash[key], (elem) => elem);
      } else {
        data = this.__buildRelationships(type, resourceHash[relName], (elem) => elem.id);
      }

      if (Ember.isPresent(data)) {
        relationships[this.keyForRelationship(relName)] = { 'data': data };
      }
    });

    return relationships;
  },

  __buildRelationships: function(type, collection, extractIdFn) {
    if (!collection) {
      return;
    }

    if (Ember.typeOf(collection) !== 'array') {
      return this.__buildRelationship(extractIdFn(collection), type);
    } else {
      return collection.map((elem) => {
        return this.__buildRelationship(extractIdFn(elem), type);
      });
    }
  },

  __buildRelationship: function(id, type) {
    return {
      'id': id,
      'type': type
    };
  },

  keyForAttribute: function(key) {
    return Ember.String.underscore(key);
  },

  keyForRelationship: function(key) {
    return Ember.String.underscore(key);
  }
});
