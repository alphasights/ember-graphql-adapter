import * as Type from 'graphql-adapter/types';

export default function Parser() {}

Parser.parse = function(model, store, operation, rootField) {
  this.store = store;

  model.eachAttribute((attr) => {
    let field = new Type.Field(attr);

    rootField.selectionSet.push(field);
  });

  model.eachRelationship((rel) => {
    let relModel = this.store.modelFor(rel);
    let field = new Type.Field(rel);

    relModel.eachAttribute(function(attr) {
      let relField = new Type.Field(attr);

      field.selectionSet.push(relField);
    });

    rootField.selectionSet.push(field);
  });

  operation.selectionSet.push(rootField);
  return operation;
};
