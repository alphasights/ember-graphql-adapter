import { typeOf } from '@ember/utils';

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
    return set.toArray().map(field => this.generateField(field)).join('');
  },

  generateArgumentSet(set) {
    return set.toArray().map(argument => this.generateArgument(argument)).join(this.argumentSeparatorToken);
  },

  generateArgument({name, value}) {
    if (typeOf(value) === 'string') {
      value = this.wrapInStringTokens(value);
    } else if (typeOf(value) === 'array') {
      value = this.argumentArrayOpeningToken + this.wrapArrayInStringTokens(value) + this.argumentArrayClosingToken;
    } else if (typeOf(value) === 'object') {
      value = this.argumentObjectOpeningToken + this.generateArgumentSet(value) + this.argumentObjectClosingToken;
    }

    return name + this.argumentKeyValueSeparateToken + value;
  },

  wrapArrayInStringTokens(array) {
    return array.map(ele => {
      if (typeof ele === 'object') {
        let generatedElements = [];
        let eleKeys = Object.keys(ele);

        eleKeys.forEach(key => {
          let generatedValue = this.generateArgument({ name: key, value: ele[key] });
          generatedElements.push(generatedValue);
        });

        return this.argumentObjectOpeningToken + generatedElements.join(', ') + this.argumentObjectClosingToken;
      } else {
        return this.wrapInStringTokens(ele);
      }
    }).join();
  },

  wrapInStringTokens(value) {
    return this.argumentStringWrapperToken + value + this.argumentStringWrapperToken;
  }
};
