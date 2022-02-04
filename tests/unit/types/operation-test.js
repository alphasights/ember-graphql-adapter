import { test, module } from 'qunit';
import Operation from 'ember-graphql-adapter/types/operation';

module('unit:ember-graphql-adapter/types/operation', function () {
  test('can be initialized', function (assert) {
    let operation = new Operation('query', 'projects');

    assert.strictEqual(operation.type, 'query');
    assert.strictEqual(operation.name, 'projects');
  });
});
