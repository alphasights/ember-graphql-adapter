import { Field } from 'graphql-adapter/types';

export default function Generator() {}

Generator.openingToken = '{';
Generator.closingToken = '}';

Generator.argumentSetOpeningToken = '(';
Generator.argumentSetClosingToken = ')';
Generator.argumentKeyValueSeparateToken = ': ';
Generator.argumentStringWrapperToken = '"';
Generator.argumentSeparatorToken = ', ';

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
  let acc = this.separatorToken + field.name;
  injectId = injectId === false ? false : true;

  if (field.argumentSet.length > 0) {
    acc = this.generateArgumentSet(field.argumentSet, acc);
  }

  acc = acc + this.separatorToken;

  if (field.selectionSet.length > 0) {
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

Generator.generateArgumentSet = function(set, acc) {
  acc = acc + this.argumentSetOpeningToken;

  acc = acc + set.map((argument) => {
    let value;
    if (typeof(argument.value) === 'string') {
      value = this.argumentStringWrapperToken + argument.value + this.argumentStringWrapperToken;
    } else {
      value = argument.value;
    }

    return argument.name + this.argumentKeyValueSeparateToken + value;
  }).join(this.argumentSeparatorToken);

  return acc + this.argumentSetClosingToken;
};
