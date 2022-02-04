export default function ModelDouble(name, attributes, relationships) {
  this.attributes = attributes || [];
  this.relationships = relationships || [];
  this.modelName = name;

  this.eachAttribute = (cb, binding) => {
    this.attributes.forEach(cb, binding);
  };
  this.eachTransformedAttribute = function () {};
  this.eachRelationship = (cb) => {
    this.relationships.forEach(function ([relName, relationship]) {
      cb(relName, relationship);
    });
  };
}
