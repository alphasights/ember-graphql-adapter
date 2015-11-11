import DS from 'ember-data';

export default DS.JSONAPISerializer.extend({
  extractId: function(modelClass, resourceHash) {
    return resourceHash[modelClass.modelName]['id'];
  },

  _extractType: function(modelClass) {
    return modelClass.modelName;
  },

  extractAttributes: function(modelClass, resourceHash) {
    let attributes = resourceHash[modelClass.modelName];
    let nonIdAttributes = {};
    let nonIdKeys = Object.keys(attributes).filter((attr) => { return attr !== 'id'; });
    nonIdKeys.forEach((key) => { nonIdAttributes[this.keyForAttribute(key)] = attributes[key]; });

    return nonIdAttributes;
  },

  extractRelationships: function() {
    return {};
  }
});
