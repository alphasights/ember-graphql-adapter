import { test, module } from 'qunit';
import ArgumentSet from 'graphql-adapter/types/argument-set';

module('unit:graphql-adapter/types/argument-set');

test("is stack-like", function(assert) {
  let set = new ArgumentSet(1, 2);

  set.push(3);

  assert.equal(set[0], 1);
  assert.equal(set[1], 2);
  assert.equal(set[2], 3);

  let popped = set.pop();

  assert.equal(popped, 3);
  assert.equal(set[2], null);
});

test("it can be iterated over", function(assert) {
  let set = new ArgumentSet(1, 2);
  let acc = [];

  set.forEach(function(el){
    acc.push(el);
  });

  assert.equal(acc[0], 1);
  assert.equal(acc[1], 2);
});

test("it can be made from a query", function(assert) {
  let set = ArgumentSet.fromQuery({ status: 'active', limit: 10 });

  assert.equal(set.length, 2);
  assert.equal(set[0].name, 'status');
  assert.equal(set[0].value, 'active');
  assert.equal(set[1].name, 'limit');
  assert.equal(set[1].value, 10);
});
