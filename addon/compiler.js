import Parser from 'graphql-adapter/parser';
import Generator from 'graphql-adapter/generator';
import ArgumentSet from 'graphql-adapter/types/argument-set';
import { Field, Operation } from 'graphql-adapter/types';
import String from 'ember';

export default function Compiler() {}

Compiler.compile = function(model, store, options) {
  options = options || {};
  let operationType = options['operationType']; // TODO: Must be query or mutation
  let operationName = String.underscore(options['operationName']);
  let rootFieldQuery = String.underscore(options['rootFieldQuery'] || {});
  let rootFieldName = String.underscore(options['rootFieldName'] || model.modelName);

  let rootField = new Field(rootFieldName, ArgumentSet.fromQuery(rootFieldQuery));
  let operation = new Operation(operationType, operationName);
  let parseTree = Parser.parse(model, store, operation, rootField);

  return Generator.generate(parseTree);
};
