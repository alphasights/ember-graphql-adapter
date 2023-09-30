import { test, module } from 'qunit';
import Argument from 'ember-graphql-adapter/types/argument';

module('unit:ember-graphql-adapter/types/argument');

test('can be constructed', function(assert){
  let argument = new Argument('theName', 'theValue');

  assert.equal(argument.name, 'theName');
  assert.equal(argument.value, 'theValue');
});

test('can be set piecewise', function(assert){
  let argument = new Argument();

  assert.notOk(argument.name);
  assert.notOk(argument.value);

  argument.name = 'theName';
  assert.equal(argument.name, 'theName');

  argument.value = 'theValue';
  assert.equal(argument.value, 'theValue');
});
