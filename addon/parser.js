import * as Type from 'graphql-adapter/types';

export default function Parser() {}

Parser.parse = function(model, operationType, operationName, fieldName) {
  let rootField = new Type.Field(fieldName, new Type.SelectionSet());
  let rootSet = new Type.SelectionSet(rootField);

  model.eachAttribute(function(attr) {
    let field = new Type.Field(attr);

    rootField.selectionSet.push(field);
  });

  return new Type.Operation(operationType, operationName, rootSet);
};
