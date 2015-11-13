export default function SnapshotDouble(modelName, attributes, relationships) {
  this.attributes = attributes || {};
  this.relationships = relationships || {};
  this.modelName = modelName;

  this.eachAttribute = function(cb, binding) {
    let attrs = Object.keys(this.attributes);
    for (let i = 0; i < attrs.length; i++) {
      cb.bind(binding)(attrs[i], this.attributes[attrs[i]]);
    }
  };

  this.eachRelationship = function(cb, binding) {
    let rels = Object.keys(this.relationships);
    for (let i = 0; i < rels.length; i++) {
      cb.bind(binding)(rels[i], this.relationships[rels[i]]);
    }
  };

  this.attr = (key) => { return this.attributes[key]; };
  this.belongsTo = function(key) {
    return this.relationships[key]['data'];
  };
}
