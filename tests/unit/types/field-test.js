import { test, module } from 'qunit';
import Field from 'graphql-adapter/types/field';
import SelectionSet from 'graphql-adapter/types/selection-set';

module('unit:graphql-adapter/types/field');

test('can be constructed', function(assert) {
  let set = new SelectionSet();
  let field = new Field('projects', set);

  assert.equal(field.name, 'projects');
  assert.equal(field.selectionSet, set);
});
