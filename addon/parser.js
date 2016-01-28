import * as Type from 'ember-graphql-adapter/types';
import Ember from 'ember';

export default {
  parse(model, store, operation, rootField, normalizeCaseFn) {
    rootField.selectionSet.push(new Type.Field('id'));

    model.eachAttribute((attr) => {
      let field = this._buildField(attr, normalizeCaseFn);
      rootField.selectionSet.push(field);
    });

    model.eachRelationship((relName, relationship) => {
      let field;
      let {type, options} = relationship;

      if (options.async) {
        field = this._buildAsyncRelationship(relName, relationship, normalizeCaseFn);
      } else {
        let relModel = store.modelFor(type);
        field = this._buildSyncRelationship(relModel, relName, relationship, normalizeCaseFn);
      }

      rootField.selectionSet.push(field);
    });

    operation.selectionSet.push(rootField);

    return operation;
  },

  _buildField(attr, normalizeCaseFn) {
    return new Type.Field(normalizeCaseFn(attr));
  },

  _buildAsyncRelationship(relName, {kind}, normalizeCaseFn) {
    let suffix = kind === 'hasMany' ? 'Ids' : 'Id';
    return this._buildField(Ember.String.singularize(relName) + suffix, normalizeCaseFn);
  },

  _buildSyncRelationship(relModel, relName, {kind, type}, normalizeCaseFn) {
    let normalizedRelName = normalizeCaseFn(relName);
    let normalizedType = normalizeCaseFn(this._getInflectedType(kind, type));
    let aliasedNameOrNull = this._getAliasedName(normalizedRelName, normalizedType);

    let field = new Type.Field(
      normalizedType,
      aliasedNameOrNull,
      new Type.ArgumentSet(),
      new Type.SelectionSet(new Type.Field('id'))
    );

    relModel.eachAttribute(function(attr) {
      let relField = new Type.Field(attr);
      field.selectionSet.push(relField);
    });

    return field;
  },

  _getInflectedType(kind, type) {
    if (kind === 'hasMany') {
      return Ember.String.pluralize(type);
    } else {
      return type;
    }
  },

  _getAliasedName(relName, type) {
    if (relName !== type) {
      return relName;
    }
  }
};
