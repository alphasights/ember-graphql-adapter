import { test, module } from 'qunit';
import { ArgumentSet, Field, SelectionSet } from 'graphql-adapter/types';

module('unit:graphql-adapter/types/field');

test('can be constructed', function(assert) {
  let selectionSet = new SelectionSet();
  let argumentSet = new ArgumentSet();
  let field = new Field('projects', 'projectsAlias', argumentSet, selectionSet);

  assert.equal(field.name, 'projects');
  assert.equal(field.alias, 'projectsAlias');
  assert.equal(field.argumentSet, argumentSet);
  assert.equal(field.selectionSet, selectionSet);
});

test('if no argument or selection sets are provided, they default to new empty sets', function(assert) {
  let field = new Field('projects');

  assert.equal(field.name, 'projects');
  assert.equal(field.alias, null);

  assert.equal(field.argumentSet instanceof ArgumentSet, true);
  assert.equal(field.argumentSet.length, 0);

  assert.equal(field.selectionSet instanceof SelectionSet, true);
  assert.equal(field.selectionSet.length, 0);
});
