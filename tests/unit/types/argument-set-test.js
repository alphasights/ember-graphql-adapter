import { test, module } from 'qunit';
import ArgumentSet from 'ember-graphql-adapter/types/argument-set';
import Argument from 'ember-graphql-adapter/types/argument';

module('unit:ember-graphql-adapter/types/argument-set');

test("is stack-like", function(assert) {
  let set = new ArgumentSet(1, 2);

  set.push(3);

  assert.equal(set.toArray()[0], 1);
  assert.equal(set.toArray()[1], 2);
  assert.equal(set.toArray()[2], 3);

  let popped = set.pop();

  assert.equal(popped, 3);
  assert.equal(set.toArray()[2], null);
});

test("it can be iterated over", function(assert) {
  let set = new ArgumentSet(1, 2);
  let acc = [];

  set.toArray().forEach(function(el){
    acc.push(el);
  });

  assert.equal(acc[0], 1);
  assert.equal(acc[1], 2);
});

test("it will filter out Arguments with an undefined value", function(assert) {
  let set = new ArgumentSet();
  set.push(new Argument("status", undefined));

  assert.equal(set.toArray().length, 0);
});

test("it will not filter out Arguments with a null value", function(assert) {
  let set = new ArgumentSet();
  set.push(new Argument("status", null));

  assert.equal(set.toArray().length, 1);
});


test("it can be made from a query", function(assert) {
  let set = ArgumentSet.fromQuery({ status: 'active', limit: 10 });

  assert.equal(set.toArray().length, 2);
  assert.equal(set.toArray()[0].name, 'status');
  assert.equal(set.toArray()[0].value, 'active');
  assert.equal(set.toArray()[1].name, 'limit');
  assert.equal(set.toArray()[1].value, 10);
});

test("does not filter out null arguments from a query", function(assert) {
  let set = ArgumentSet.fromQuery({ status: null, limit: 10 });

  assert.equal(set.toArray().length, 2);
  assert.equal(set.toArray()[0].name, 'status');
  assert.equal(set.toArray()[0].value, null);
  assert.equal(set.toArray()[1].name, 'limit');
  assert.equal(set.toArray()[1].value, 10);
});

test("filters out undefined arguments from a query", function(assert) {
  let set = ArgumentSet.fromQuery({ status: undefined, limit: 10 });

  assert.equal(set.toArray().length, 1);
  assert.equal(set.toArray()[0].name, 'limit');
  assert.equal(set.toArray()[0].value, 10);
});

test("it can be made from a nested query", function(assert) {
  let set = ArgumentSet.fromQuery({ project: { id: 1 }, limit: 10 });

  assert.equal(set.toArray().length, 2);
  assert.equal(set.toArray()[0].name, 'project');
  assert.equal(set.toArray()[0].value instanceof ArgumentSet, true);
  assert.equal(set.toArray()[0].value.toArray()[0].name, 'id');
  assert.equal(set.toArray()[0].value.toArray()[0].value, 1);
  assert.equal(set.toArray()[1].name, 'limit');
  assert.equal(set.toArray()[1].value, 10);
});
