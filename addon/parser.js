import * as Type from 'graphql-adapter/types';

export default function Parser() {}

Parser.parse = function(model, operationType, operationName, fieldName, fieldQuery) {
  let rootFieldArgumentSet = new Type.ArgumentSet();

  Object.keys(fieldQuery).forEach((key) => {
    rootFieldArgumentSet.push(new Type.Argument(key, fieldQuery[key]));
  });

  let rootField = new Type.Field(fieldName, rootFieldArgumentSet);
  let rootSet = new Type.SelectionSet(rootField);
  let operationArgumentSet = new Type.ArgumentSet();

  model.eachAttribute(function(attr) {
    let field = new Type.Field(attr);

    rootField.selectionSet.push(field);
  });

  return new Type.Operation(operationType, operationName, operationArgumentSet, rootSet);
};
