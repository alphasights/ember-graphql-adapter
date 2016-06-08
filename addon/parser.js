import * as Type from 'ember-graphql-adapter/types';
import Ember from 'ember';

class Parser {
  constructor({normalizeCaseFn, parseSelectionSet}) {
    this.agenda = [];
    this.normalizeCaseFn = normalizeCaseFn;
    this.parseSelectionSet = parseSelectionSet;
    this.visited = [];
  }

  parse(model, store, operation, rootField) {
    rootField.selectionSet.push(new Type.Field('id'));

    if (this.parseSelectionSet) {
      this.agenda.unshift(model);
      this.visited.push(model.modelName);
      this._recursiveParse(store, rootField);
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

  _buildSyncRelationship(store, relName, {kind, type}) {
    let normalizedRelName = this.normalizeCaseFn(relName);
    let normalizedType = this.normalizeCaseFn(this._getInflectedType(kind, type));
    let aliasedNameOrNull = this._getAliasedName(normalizedRelName, normalizedType);

    let field = new Type.Field(
      normalizedType,
      aliasedNameOrNull,
      new Type.ArgumentSet(),
      new Type.SelectionSet(new Type.Field('id'))
    );

    this._recursiveParse(store, field);

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

  _recursiveParse(store, field) {
    let currentModel = this.agenda.pop();
    currentModel.eachAttribute((attr) => {
      let relField = this._buildField(attr);
      field.selectionSet.push(relField);
    });

    currentModel.eachRelationship((relName, relationship) => {
      let relField;
      let {type, options} = relationship;

      if (options.async) {
        relField = this._buildAsyncRelationship(relName, relationship);
      } else {
        let relModel = store.modelFor(type);
        if (this.visited.indexOf(relName) === -1) {
          this.agenda.unshift(relModel);
          this.visited.push(relName);
          relField = this._buildSyncRelationship(store, relName, relationship);
        }
      }

      if (relField) {
        field.selectionSet.push(relField);
      }
    });
  }
}

export default {
  parse(model, store, operation, rootField, options) {
    let parser = new Parser(options);

    return parser.parse(model, store, operation, rootField);
  }
};
