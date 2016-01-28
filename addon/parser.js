import * as Type from 'ember-graphql-adapter/types';
import Ember from 'ember';

class Parser {
  constructor({normalizeCaseFn}) {
    this.normalizeCaseFn = normalizeCaseFn;
  }

  parse(model, store, operation, rootField) {
    rootField.selectionSet.push(new Type.Field('id'));

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
        field = this._buildSyncRelationship(relModel, relName, relationship);
      }

      rootField.selectionSet.push(field);
    });

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

  _buildSyncRelationship(relModel, relName, {kind, type}) {
    let normalizedRelName = this.normalizeCaseFn(relName);
    let normalizedType = this.normalizeCaseFn(this._getInflectedType(kind, type));
    let aliasedNameOrNull = this._getAliasedName(normalizedRelName, normalizedType);

    let field = new Type.Field(
      normalizedType,
      aliasedNameOrNull,
      new Type.ArgumentSet(),
      new Type.SelectionSet(new Type.Field('id'))
    );

    relModel.eachAttribute((attr) => {
      let relField = this._buildField(attr);
      field.selectionSet.push(relField);
    });

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
}

export default {
  parse(model, store, operation, rootField, normalizeCaseFn) {
    let parser = new Parser({
      normalizeCaseFn: normalizeCaseFn
    });

    return parser.parse(model, store, operation, rootField);
  }
};
