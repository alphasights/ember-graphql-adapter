import { test, module } from 'qunit';
import Parser from 'graphql-adapter/parser';
import * as Type from 'graphql-adapter/types';
import DS from 'ember-data';

module('unit:graphql-adapter/parser');

test('parsing a model', function(assert) {
  let model = DS.Model.extend({
    status: DS.attr('string'),
    name: DS.attr('string'),
  });

  let operationType = 'query';
  let operationName = 'projectsQuery';
  let fieldName = 'projects';

  let parseTree = Parser.parse(model, operationType, operationName, fieldName);

  assert.equal(parseTree instanceof Type.Operation, true);
  assert.equal(parseTree.type, operationType);
  assert.equal(parseTree.name, operationName);

  let rootSelectionSet = parseTree.selectionSet;
  assert.equal(rootSelectionSet instanceof Type.SelectionSet, true);
  assert.equal(rootSelectionSet.length, 1);

  let rootField = rootSelectionSet[0];
  assert.equal(rootField instanceof Type.Field, true);
  assert.equal(rootField.name, fieldName);

  let projectsSelectionSet = rootField.selectionSet;
  assert.equal(projectsSelectionSet.length, 2);

  let expectedStatusField = projectsSelectionSet[0];
  assert.equal(expectedStatusField instanceof Type.Field, true);
  assert.equal(expectedStatusField.name, 'status');
  assert.equal(expectedStatusField.selectionSet, null);

  let expectedNameField = projectsSelectionSet[1];
  assert.equal(expectedNameField instanceof Type.Field, true);
  assert.equal(expectedNameField.name, 'name');
  assert.equal(expectedNameField.selectionSet, null);
});
