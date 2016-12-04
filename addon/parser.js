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

  _buildSyncRelationship(store, relName) {
    let field = new Type.Field(
      this.normalizeCaseFn(relName),
      null,
      new Type.ArgumentSet(),
      new Type.SelectionSet(new Type.Field('id'))
    );

    this._recursiveParse(store, field);

    return field;
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
          relField = this._buildSyncRelationship(store, relName);
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
