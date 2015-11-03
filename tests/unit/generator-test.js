import { test, module } from 'qunit';
import Generator from 'graphql-adapter/generator';
import * as Type from 'graphql-adapter/types';

module('unit:graphql-adapter/generator');

test('all the things', function(assert) {
  let fieldId = new Type.Field('id');
  let fieldStatus = new Type.Field('status');
  let set = new Type.SelectionSet(fieldId, fieldStatus);
  let operation = new Type.Operation('query', 'projectsQuery', set);

  assert.equal(Generator.generate(operation), '{query projectsQuery { id  status }}');
});
