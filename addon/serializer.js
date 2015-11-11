import DS from 'ember-data';
import Ember from 'ember';

export default DS.JSONAPISerializer.extend({
  extractId: function(modelClass, resourceHash) {
    return resourceHash[modelClass.modelName]['id'];
  },

  _extractType: function(modelClass) {
    return modelClass.modelName;
  },

  extractAttributes: function(modelClass, resourceHash) {
    let attributes = {};

    modelClass.eachAttribute((key) => {
      attributes[this.keyForAttribute(key)] = resourceHash[modelClass.modelName][key];
    });

    return attributes;
  },

  extractRelationships: function(modelClass, resourceHash) {
    let relationships = {};

    modelClass.eachRelationship((key) => {
      let relHash = resourceHash[modelClass.modelName][key];
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
