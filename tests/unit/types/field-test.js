import { test, module } from 'qunit';
import { ArgumentSet, Field, SelectionSet } from 'ember-graphql-adapter/types';

module('unit:ember-graphql-adapter/types/field', function () {
  test('can be constructed', function (assert) {
    let selectionSet = new SelectionSet();
    let argumentSet = new ArgumentSet();
    let field = new Field(
      'projects',
      'projectsAlias',
      argumentSet,
      selectionSet
    );

    assert.strictEqual(field.name, 'projects');
    assert.strictEqual(field.alias, 'projectsAlias');
    assert.strictEqual(field.argumentSet, argumentSet);
    assert.strictEqual(field.selectionSet, selectionSet);
  });

  test('if no argument or selection sets are provided, they default to new empty sets', function (assert) {
    let field = new Field('projects');

    assert.strictEqual(field.name, 'projects');
    assert.strictEqual(field.alias, undefined);

    assert.true(field.argumentSet instanceof ArgumentSet);
    assert.strictEqual(field.argumentSet.length, 0);

    assert.true(field.selectionSet instanceof SelectionSet);
    assert.strictEqual(field.selectionSet.length, 0);
  });
});
