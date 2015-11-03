import Parser from 'graphql-adapter/parser';
import Generator from 'graphql-adapter/generator';

export default function Compiler() {}

Compiler.compile = function(model) {
  let parseTree = Parser.parse(model, 'query', 'projectQuery', 'projects');

  return Generator.generate(parseTree);
};
