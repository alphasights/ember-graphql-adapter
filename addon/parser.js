import * as Type from 'ember-graphql-adapter/types';
import Ember from 'ember';

export default {
  parse(model, store, operation, rootField) {
    rootField.selectionSet.push(new Type.Field('id'));

    model.eachAttribute((attr) => {
      let field = new Type.Field(attr);
      rootField.selectionSet.push(field);
    });

    model.eachRelationship((relName, {kind, type, options}) => {
      if (options.async) {
        let suffix = kind === 'hasMany' ? 'Ids' : 'Id';
        let field = new Type.Field(Ember.String.singularize(relName) + suffix);
        rootField.selectionSet.push(field);
      } else {
        let relModel = store.modelFor(type);
        let modelName = kind === 'hasMany' ? Ember.String.pluralize(type) : type;
        let alias = modelName !== relName && relName;

        let field = new Type.Field(
          modelName,
          alias,
          new Type.ArgumentSet(),
          new Type.SelectionSet(new Type.Field('id'))
        );

        relModel.eachAttribute(function(attr) {
          let relField = new Type.Field(attr);
          field.selectionSet.push(relField);
        });

        rootField.selectionSet.push(field);
      }
    });

    operation.selectionSet.push(rootField);

    return operation;
  }
};
