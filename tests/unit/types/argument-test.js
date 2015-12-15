import { test, module } from 'qunit';
import Argument from 'ember-graphql-adapter/types/argument';

module('unit:ember-graphql-adapter/types/argument');

test('can be constructed', function(assert){
  let argument = new Argument('theName', 'theValue');

  assert.equal(argument.name, 'theName');
  assert.equal(argument.value, 'theValue');
});
