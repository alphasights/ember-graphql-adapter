import Parser from 'graphql-adapter/parser';
import Generator from 'graphql-adapter/generator';
import ArgumentSet from 'graphql-adapter/types/argument-set';
import { Field, Operation } from 'graphql-adapter/types';

export default function Compiler() {}

Compiler.compile = function(model, rootFieldQuery) {
  let rootField = new Field('projects', ArgumentSet.fromQuery(rootFieldQuery));
  let operation = new Operation('query', 'projectQuery');
  let parseTree = Parser.parse(model, operation, rootField);

  return Generator.generate(parseTree);
};
