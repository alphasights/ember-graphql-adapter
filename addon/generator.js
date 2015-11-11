export default function Generator() {}

Generator.openingToken = '{';
Generator.closingToken = '}';

Generator.aliasSeparatorToken = ': ';

Generator.argumentSetOpeningToken = '(';
Generator.argumentSetClosingToken = ')';
Generator.argumentKeyValueSeparateToken = ': ';
Generator.argumentStringWrapperToken = '"';
Generator.argumentSeparatorToken = ', ';

Generator.separatorToken = ' ';

Generator.emptyToken = '';

Generator.generate = function(parseTree) {
  return this.openOperation(parseTree);
};

Generator.openOperation = function(operation) {
  let acc = operation.type;
  return acc + this.generateField(operation);
};

Generator.closeOperation = function(acc) {
  return acc + this.closingToken;
};

Generator.generateField = function(field) {
  let acc = this.separatorToken;

  if (field.alias) {
    acc = acc + field.alias + this.aliasSeparatorToken;
  }

  acc = acc + field.name;

  if (field.argumentSet.length > 0) {
    acc = this.generateArgumentSet(field.argumentSet, acc);
  }

  acc = acc + this.separatorToken;

  if (field.selectionSet.length > 0) {
    acc = this.generateSelectionSet(field.selectionSet, acc);
  }

  return acc;
};

Generator.generateSelectionSet = function(set, acc) {
  acc = acc + this.openingToken;

  set.forEach((field) => {
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
