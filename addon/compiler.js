import Parser from 'graphql-adapter/parser';
import Generator from 'graphql-adapter/generator';
import ArgumentSet from 'graphql-adapter/types/argument-set';
import { Field, Operation } from 'graphql-adapter/types';

export default function Compiler() {}

Compiler.compile = function(model, store, rootFieldQuery) {
  let rootField = new Field(model.modelName, ArgumentSet.fromQuery(rootFieldQuery));
  let operation = new Operation('query', model.modelName + 'Query');
  let parseTree = Parser.parse(model, store, operation, rootField);

  return Generator.generate(parseTree);
};
