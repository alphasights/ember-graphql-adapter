import Parser from 'graphql-adapter/parser';
import Generator from 'graphql-adapter/generator';
import ArgumentSet from 'graphql-adapter/types/argument-set';
import { Field, Operation } from 'graphql-adapter/types';

export default function Compiler() {}

Compiler.compile = function(model, store, options) {
  options = options || {};
  let rootFieldQuery = options['rootFieldQuery'] || {};
  let rootFieldName = options['rootFieldName'] || model.modelName;

  let rootField = new Field(rootFieldName, ArgumentSet.fromQuery(rootFieldQuery));
  let operation = new Operation('query', rootFieldName + 'Query');
  let parseTree = Parser.parse(model, store, operation, rootField);

  return Generator.generate(parseTree);
};
