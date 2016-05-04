import Parser from 'ember-graphql-adapter/parser';
import Generator from 'ember-graphql-adapter/generator';
import ArgumentSet from 'ember-graphql-adapter/types/argument-set';
import { Field, Operation } from 'ember-graphql-adapter/types';

export default {
  compile(model, store, options) {
    options = options || {};

    let operationType = options['operationType']; // TODO: Must be query or mutation
    let operationName = options['operationName'];
    let operation = new Operation(operationType, operationName);

    let rootFieldQuery = options['rootFieldQuery'] || {};
    let rootFieldName = options['rootFieldName'] || model.modelName;
    let rootFieldAlias = options['rootFieldAlias'];
    let rootField = new Field(rootFieldName, rootFieldAlias, ArgumentSet.fromQuery(rootFieldQuery));

    Parser.parse(model, store, operation, rootField, options);

    return Generator.generate(operation);
  }
};
