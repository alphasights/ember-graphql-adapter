import * as Type from 'graphql-adapter/types';

export default function Parser() {}

Parser.parse = function(model, operationType, operationName, fieldName) {
  let rootField = new Type.Field(fieldName);
  let rootSet = new Type.SelectionSet(rootField);
  let argumentSet = new Type.ArgumentSet();

  model.eachAttribute(function(attr) {
    let field = new Type.Field(attr);

    rootField.selectionSet.push(field);
  });

  return new Type.Operation(operationType, operationName, argumentSet, rootSet);
};
