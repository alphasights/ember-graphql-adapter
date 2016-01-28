import * as Type from 'ember-graphql-adapter/types';
import Ember from 'ember';

export default {
  parse(model, store, operation, rootField) {
    rootField.selectionSet.push(new Type.Field('id'));

    model.eachAttribute((attr) => {
      let field = new Type.Field(attr);
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
  },

  _buildAsyncRelationship(relName, {kind}) {
    let suffix = kind === 'hasMany' ? 'Ids' : 'Id';
    return new Type.Field(Ember.String.singularize(relName) + suffix);
  },

  _buildSyncRelationship(relModel, relName, {kind, type}) {
    let normalizedType = this._getNormalizedType(kind, type);
    let aliasedNameOrNull = this._getAliasedName(relName, normalizedType);

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

  _getNormalizedType(kind, type) {
    let camelizedType = Ember.String.camelize(type);

    if (kind === 'hasMany') {
      return Ember.String.pluralize(camelizedType);
    } else {
      return camelizedType;
    }
  },

  _getAliasedName(relName, normalizedType) {
    if (relName !== normalizedType) {
      return relName;
    }
  }
};
