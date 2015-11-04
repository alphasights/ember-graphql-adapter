export default function ModelDouble(name, attributes, relationships) {
  this.attributes = attributes || [];
  this.relationships = relationships || [];
  this.modelName = name;

  this.eachAttribute = (cb) => { this.attributes.forEach(cb); };
  this.eachRelationship = (cb) => { this.relationships.forEach(cb); };
}
