import { test, module } from 'qunit';
import Operation from 'graphql-adapter/types/operation';

module('unit:graphql-adapter/types/operation');

test("can be initialized", function(assert) {
  let operation = new Operation('query', 'projects');

  assert.equal(operation.type, 'query');
  assert.equal(operation.name, 'projects');
});
