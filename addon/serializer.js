import DS from 'ember-data';
import Ember from 'ember';

export default DS.JSONAPISerializer.extend({
  serialize: function(snapshot) {
    let data = {};
    snapshot.eachAttribute((key, attribute) => {
      this.__serializeAttribute(snapshot, data, key, attribute);
    });

    snapshot.eachRelationship((key, relationship) => {
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

      if (belongsTo !== undefined) {
        var payloadKey = this._getMappedKey(key);
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
      var payloadKey =  this._getMappedKey(key);
      if (payloadKey === key) {
        payloadKey = this.keyForAttribute(key, 'serialize');
      }

      data[payloadKey] = value;
    }
  },

  normalizeResponse: function(store, primaryModelClass, payload, id, requestType) {
    let data = payload['data'];
    const documentHash = { 'data': [], 'included': [] };
    const type = primaryModelClass.modelName;
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

      primaryModelClass.eachRelationship((key) => {
        const include = item[key];
        if (!include) { return; }

        const includeModelClass = store.modelFor(Ember.String.singularize(key));
        const serializer = store.serializerFor(includeModelClass.modelName);

        documentHash['included'].push({
          'type': includeModelClass.modelName,
          'id': this.__extractId(include),
          'attributes': this.__extractAttributes(includeModelClass, include, serializer),
        });
      });
    });

    if (singular) { documentHash['data'] = documentHash['data'][0]; }

    return this._super(store, primaryModelClass, documentHash, id, requestType);
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

    modelClass.eachRelationship((key) => {
      const relHash = resourceHash[key];
      if (!relHash) { return; }
      relationships[this.keyForRelationship(key)] = {
        'data': {
          'id': relHash['id'],
          'type': Ember.String.singularize(key)
        }
      };
    });

    return relationships;
  }
});
