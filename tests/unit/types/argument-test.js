import { test, module } from 'qunit';
import Argument from 'ember-graphql-adapter/types/argument';

module('unit:ember-graphql-adapter/types/argument', function () {
  test('can be constructed', function (assert) {
    let argument = new Argument('theName', 'theValue');

    assert.strictEqual(argument.name, 'theName');
    assert.strictEqual(argument.value, 'theValue');
  });

  test('can be set piecewise', function (assert) {
    let argument = new Argument();

    assert.notOk(argument.name);
    assert.notOk(argument.value);

    argument.name = 'theName';
    assert.strictEqual(argument.name, 'theName');

    argument.value = 'theValue';
    assert.strictEqual(argument.value, 'theValue');
  });
});
