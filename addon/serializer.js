import DS from 'ember-data';
import Ember from 'ember';

export default DS.JSONAPISerializer.extend({
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
