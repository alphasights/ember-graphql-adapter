import { test, module } from 'qunit';
import SelectionSet from 'ember-graphql-adapter/types/selection-set';

module('unit:ember-graphql-adapter/types/selection-set', function () {
  test('is stack-like', function (assert) {
    let set = new SelectionSet(1, 2);

    set.push(3);

    assert.strictEqual(set.get(0), 1);
    assert.strictEqual(set.get(1), 2);
    assert.strictEqual(set.get(2), 3);

    let popped = set.pop();

    assert.strictEqual(popped, 3);
    assert.strictEqual(set.get(2), undefined);
  });

  test('it can be iterated over', function (assert) {
    let set = new SelectionSet(1, 2);
    let acc = [];

    set.toArray().forEach(function (el) {
      acc.push(el);
    });

    assert.strictEqual(acc[0], 1);
    assert.strictEqual(acc[1], 2);
  });
});
