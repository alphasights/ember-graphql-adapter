import DS from 'ember-data';

export default DS.JSONSerializer.extend({
  normalize: function(typeClass, hash) {
    typeClass.eachRelationship((rel) => {
      if (!hash[rel]) {
        hash[rel] = hash[rel];
      } else if (Array.isArray(hash[rel])) {
        hash[rel] = hash[rel].map((obj) => { return obj.id; });
      } else {
        hash[rel] = hash[rel].id;
      }
    });

    return this._super.apply(this, arguments)
  }
});
