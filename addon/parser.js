import * as Type from 'graphql-adapter/types';
import String from 'ember';

export default function Parser() {}

Parser.parse = function(model, store, operation, rootField) {
  this.store = store;

  rootField.selectionSet.push(new Type.Field('id'));

  model.eachAttribute((attr) => {
    let field = new Type.Field(String.underscore(attr));

    rootField.selectionSet.push(field);
  });

  model.eachRelationship((rel) => {
    let relModel = this.store.modelFor(rel);
    let field = new Type.Field(String.underscore(rel), new Type.ArgumentSet(), new Type.SelectionSet(new Type.Field('id')));

    // relModel.eachAttribute(function(attr) {
    //   let relField = new Type.Field(attr);

    //   field.selectionSet.push(relField);
    // });

    rootField.selectionSet.push(field);
  });

  operation.selectionSet.push(rootField);

  return operation;
};
