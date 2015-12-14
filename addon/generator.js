import Ember from 'ember';

export default function Generator() {}

Generator.openingToken = '{';
Generator.closingToken = '}';

Generator.aliasSeparatorToken = ': ';

Generator.argumentSetOpeningToken = '(';
Generator.argumentSetClosingToken = ')';
Generator.argumentKeyValueSeparateToken = ': ';
Generator.argumentStringWrapperToken = '"';
Generator.argumentSeparatorToken = ', ';
Generator.argumentArrayOpeningToken = '[';
Generator.argumentArrayClosingToken = ']';

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
    acc = acc + this.argumentSetOpeningToken;
    acc = this.generateArgumentSet(field.argumentSet, acc);
    acc = acc + this.argumentSetClosingToken;
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
  acc = acc + set.map((argument) => {
    return this.generateArgument(argument);
  }).join(this.argumentSeparatorToken);

  return acc;
};

Generator.generateArgument = function(argument) {
  let value;
  if (Ember.typeOf(argument.value) === 'string') {
    value = this.argumentStringWrapperToken + argument.value + this.argumentStringWrapperToken;
  } else if (Ember.typeOf(argument.value) === 'array') {
    value = this.argumentArrayOpeningToken + argument.value + this.argumentArrayClosingToken;
  } else if (Ember.typeOf(argument.value) === 'object') {
    value = this.generateArgumentSet(argument.value, "{ ") + " }";
  } else {
    value = argument.value;
  }

  return argument.name + this.argumentKeyValueSeparateToken + value;
};
