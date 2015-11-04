import * as Type from 'graphql-adapter/types';

export default function Parser() {}

Parser.parse = function(model, operation, rootField) {
  model.eachAttribute(function(attr) {
    let field = new Type.Field(attr);

    rootField.selectionSet.push(field);
  });

  operation.selectionSet.push(rootField);
  return operation;
};
