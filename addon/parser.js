import * as Type from 'ember-graphql-adapter/types';
import Ember from 'ember';

export default {
  parse(model, store, operation, rootField) {
    rootField.selectionSet.push(new Type.Field('id'));

    model.eachAttribute((attr) => {
      let field = new Type.Field(attr);
      rootField.selectionSet.push(field);
    });

    model.eachRelationship((rel) => {
      let relModel = store.modelFor(Ember.String.singularize(rel));
      let field = new Type.Field(
        rel,
        null,
        new Type.ArgumentSet(),
        new Type.SelectionSet(new Type.Field('id'))
      );

      relModel.eachAttribute(function(attr) {
        let relField = new Type.Field(attr);
        field.selectionSet.push(relField);
      });

      rootField.selectionSet.push(field);
    });

    operation.selectionSet.push(rootField);

    return operation;
  }
};
