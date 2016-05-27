import Ember from 'ember';

export default {
  openingToken: ' {',
  closingToken: ' }',
  separatorToken: ' ',
  aliasSeparatorToken: ': ',
  emptyToken: '',

  argumentArrayClosingToken: ']',
  argumentArrayOpeningToken: '[',
  argumentKeyValueSeparateToken: ': ',
  argumentObjectClosingToken: ' }',
  argumentObjectOpeningToken: '{ ',
  argumentSeparatorToken: ', ',
  argumentSetClosingToken: ')',
  argumentSetOpeningToken: '(',
  argumentStringWrapperToken: '"',

  generate(parseTree) {
    return parseTree.type + this.generateField(parseTree);
  },

  generateField(field) {
    let acc = this.separatorToken;

    if (field.alias) {
      acc = acc + field.alias + this.aliasSeparatorToken;
    }

    acc = acc + field.name;

    if (field.argumentSet.length > 0) {
      acc = acc + `${this.argumentSetOpeningToken}${this.generateArgumentSet(field.argumentSet)}${this.argumentSetClosingToken}`;
    }

    if (field.selectionSet.length > 0) {
      acc = acc + `${this.openingToken}${this.generateSelectionSet(field.selectionSet)}${this.closingToken}`;
    }

    return acc;
  },

  generateSelectionSet(set) {
    return set.map(field => this.generateField(field)).join('');
  },

  generateArgumentSet(set) {
    return set.map(argument => this.generateArgument(argument)).join(this.argumentSeparatorToken);
  },

  generateArgument({name, value}) {
    if (Ember.typeOf(value) === 'string') {
      value = this.wrapInStringTokens(value);
    } else if (Ember.typeOf(value) === 'array') {
      value = this.argumentArrayOpeningToken + this.wrapArrayInStringTokens(value) + this.argumentArrayClosingToken;
    } else if (Ember.typeOf(value) === 'object') {
      value = this.argumentObjectOpeningToken + this.generateArgumentSet(value) + this.argumentObjectClosingToken;
    }

    return name + this.argumentKeyValueSeparateToken + value;
  },

  wrapArrayInStringTokens(array) {
    return array.map((ele) => {
      return this.wrapInStringTokens(ele);
    }).join();
  },

  wrapInStringTokens(value) {
    return this.argumentStringWrapperToken + value + this.argumentStringWrapperToken;
  }
};
