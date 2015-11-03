import { test, module } from 'qunit';
import SelectionSet from 'graphql-adapter/types/selection-set';

module('unit:graphql-adapter/types/selection-set');

test("is stack-like", function(assert) {
  let set = new SelectionSet(1, 2);

  set.push(3);

  assert.equal(set[0], 1);
  assert.equal(set[1], 2);
  assert.equal(set[2], 3);

  let popped = set.pop();

  assert.equal(popped, 3);
  assert.equal(set[2], null);
});

test("it can be iterated over", function(assert) {
  let set = new SelectionSet(1, 2);
  let acc = [];

  set.forEach(function(el){
    acc.push(el);
  });

  assert.equal(acc[0], 1);
  assert.equal(acc[1], 2);
});
