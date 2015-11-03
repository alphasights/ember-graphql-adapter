import { Field } from 'graphql-adapter/types';

export default function Generator() {}

Generator.openingToken = '{';
Generator.closingToken = '}';
Generator.separatorToken = ' ';

Generator.generate = function(parseTree) {
  return this.openOperation(parseTree);
};

Generator.openOperation = function(operation) {
  let acc = operation.type;
  return acc + this.generateField(operation, false);
};

Generator.closeOperation = function(acc) {
  return acc + this.closingToken;
};

Generator.generateField = function(field, injectId) {
  let acc = this.separatorToken + field.name + this.separatorToken;
  injectId = injectId === false ? false : true;

  if (field.selectionSet != null) {
    acc = this.generateSelectionSet(field.selectionSet, acc, injectId);
  }

  return acc;
};

Generator.generateSelectionSet = function(set, acc, injectId) {
  acc = acc + this.openingToken;

  if (injectId === true) {
    acc = acc + this.generateField(new Field('id'), acc);
  }

  set.forEach((field) => {
    if(field.name === 'id') { return; }
    acc = acc + this.generateField(field, acc);
  });

  return acc + this.closingToken + this.separatorToken;
};
