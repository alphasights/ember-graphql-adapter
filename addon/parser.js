import * as Type from 'ember-graphql-adapter/types';
import Ember from 'ember';

class Parser {
  constructor({normalizeCaseFn, parseSelectionSet}) {
    this.normalizeCaseFn = normalizeCaseFn;
    this.parseSelectionSet = parseSelectionSet;
  }

  parse(model, store, operation, rootField) {
    rootField.selectionSet.push(new Type.Field('id'));

    if (this.parseSelectionSet) {
      this._recursiveParse(model, store, rootField);
    }

    operation.selectionSet.push(rootField);

    return operation;
  }

  _buildField(attr) {
    return new Type.Field(this.normalizeCaseFn(attr));
  }

  _buildAsyncRelationship(relName, {kind}) {
    let suffix = kind === 'hasMany' ? 'Ids' : 'Id';
    return this._buildField(Ember.String.singularize(relName) + suffix);
  }

  _buildSyncRelationship(relModel, store, relName, {kind, type}) {
    let normalizedRelName = this.normalizeCaseFn(relName);
    let normalizedType = this.normalizeCaseFn(this._getInflectedType(kind, type));
    let aliasedNameOrNull = this._getAliasedName(normalizedRelName, normalizedType);

    let field = new Type.Field(
      normalizedType,
      aliasedNameOrNull,
      new Type.ArgumentSet(),
      new Type.SelectionSet(new Type.Field('id'))
    );

    this._recursiveParse(relModel, store, field);

    return field;
  }

  _getInflectedType(kind, type) {
    if (kind === 'hasMany') {
      return Ember.String.pluralize(type);
    } else {
      return type;
    }
  }

  _getAliasedName(relName, type) {
    if (relName !== type) {
      return relName;
    }
  }

  _recursiveParse(model, store, rootField) {
    model.eachAttribute((attr) => {
      let field = this._buildField(attr);
      rootField.selectionSet.push(field);
    });

    model.eachRelationship((relName, relationship) => {
      let field;
      let {type, options} = relationship;

      if (options.async) {
        field = this._buildAsyncRelationship(relName, relationship);
      } else {
        let relModel = store.modelFor(type);
        field = this._buildSyncRelationship(relModel, store, relName, relationship);
      }

      rootField.selectionSet.push(field);
    });
  }
}

export default {
  parse(model, store, operation, rootField, options) {
    let parser = new Parser(options);

    return parser.parse(model, store, operation, rootField);
  }
};
