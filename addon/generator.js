import Ember from 'ember';

export default {
  openingToken: '{',
  closingToken: '}',
  aliasSeparatorToken: ': ',

  argumentSetOpeningToken: '(',
  argumentSetClosingToken: ')',
  argumentKeyValueSeparateToken: ': ',
  argumentStringWrapperToken: '"',
  argumentSeparatorToken: ', ',
  argumentArrayOpeningToken: '[',
  argumentArrayClosingToken: ']',

  separatorToken: ' ',
  emptyToken: '',

  generate(parseTree) {
    return this.openOperation(parseTree);
  },

  openOperation(operation) {
    let acc = operation.type;
    return acc + this.generateField(operation);
  },

  closeOperation(acc) {
    return acc + this.closingToken;
  },

  generateField(field) {
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
  },

  generateSelectionSet(set, acc) {
    acc = acc + this.openingToken;

    set.forEach((field) => {
      acc = acc + this.generateField(field, acc);
    });

    return acc + this.closingToken + this.separatorToken;
  },

  generateArgumentSet(set, acc) {
    acc = acc + set.map((argument) => {
      return this.generateArgument(argument);
    }).join(this.argumentSeparatorToken);

    return acc;
  },

  generateArgument(argument) {
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
  }
};
