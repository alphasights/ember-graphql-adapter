import { test, module } from 'qunit';
import Ember from 'ember';
import Parser from 'ember-graphql-adapter/parser';
import * as Type from 'ember-graphql-adapter/types';
import ArgumentSet from 'ember-graphql-adapter/types/argument-set';
import ModelDouble from '../helpers/model-double';
import StoreDouble from '../helpers/store-double';

const normalizeCaseFn = function(string) {
  return Ember.String.camelize(string);
};

let nodeParseTree, projectsParseTree;

module('unit:ember-graphql-adapter/parser', {
  before() {
    let projectModel = new ModelDouble(
      'project',
      ['status', 'name'],
      [['user', { type: 'user', kind: 'belongsTo', options: { async: false }}]]
    );
    let userModel = new ModelDouble('user', ['name'],
      [['address', { type: 'address', kind: 'belongsTo', options: { async: false }}],
      ['project', { type: 'project', kind: 'belongsTo', options: { async: false }}]]
    );
    let addressModel = new ModelDouble('address', ['city', 'country'],
      [['user', { type: 'user', kind: 'belongsTo', options: { async: false }}]]
    );

    let nodeModel = new ModelDouble(
      'node',
      ['name'],
      [['parent', { type: 'node', kind: 'belongsTo', options: { async: false }}],
      ['children', { type: 'node', kind: 'hasMany', options: { async: false }}]]
    );

    let store = new StoreDouble({
      'project': projectModel, 'user': userModel, 'address': addressModel, 'node': nodeModel
    });

    let nodeRootField = new Type.Field('node');
    let projectsRootField = new Type.Field('projects');
    let nodeOperation = new Type.Operation('query', 'nodeQuery', ArgumentSet.fromQuery({ id: 'my_node_id' }));
    let projectsOperation = new Type.Operation('query', 'projectsQuery', ArgumentSet.fromQuery({ status: 'active' }));

    nodeParseTree = Parser.parse(nodeModel, store, nodeOperation, nodeRootField, {
      normalizeCaseFn: normalizeCaseFn,
      parseSelectionSet: true
    });

    projectsParseTree = Parser.parse(projectModel, store, projectsOperation, projectsRootField, {
      normalizeCaseFn: normalizeCaseFn,
      parseSelectionSet: true
    });
  }
});

test('makes the root of the tree an Operation', function(assert) {
  assert.equal(projectsParseTree instanceof Type.Operation, true);
  assert.equal(projectsParseTree.type, 'query');
  assert.equal(projectsParseTree.name, 'projectsQuery');

  let rootSelectionSet = projectsParseTree.selectionSet;
  assert.equal(rootSelectionSet instanceof Type.SelectionSet, true);
  assert.equal(rootSelectionSet.toArray().length, 1);
});

test('root field is generated in the selection set', function(assert){
  let rootField = projectsParseTree.selectionSet.toArray()[0];
  assert.equal(rootField instanceof Type.Field, true);
  assert.equal(rootField.name, 'projects');
});

test('there are as many elements in the selection set as there are top level fields (plus the id field)', function(assert){
  let rootField = projectsParseTree.selectionSet.toArray()[0];
  let projectsSelectionSet = rootField.selectionSet;

  assert.equal(projectsSelectionSet.toArray().length, 4);
});

test('nested fields are generated in the root field selection set', function(assert){
  let rootField = projectsParseTree.selectionSet.toArray()[0];
  let projectsSelectionSet = rootField.selectionSet.toArray();

  let expectedIdField = projectsSelectionSet[0];
  assert.equal(expectedIdField instanceof Type.Field, true);
  assert.equal(expectedIdField.name, 'id');

  let expectedStatusField = projectsSelectionSet[1];
  assert.equal(expectedStatusField instanceof Type.Field, true);
  assert.equal(expectedStatusField.name, 'status');

  let expectedNameField = projectsSelectionSet[2];
  assert.equal(expectedNameField instanceof Type.Field, true);
  assert.equal(expectedNameField.name, 'name');

  let expectedUserField = projectsSelectionSet[3];
  assert.equal(expectedUserField instanceof Type.Field, true);
  assert.equal(expectedUserField.name, 'user');

  let expectedUserIdField = expectedUserField.selectionSet.toArray()[0];
  assert.equal(expectedUserIdField instanceof Type.Field, true);
  assert.equal(expectedUserIdField.name, 'id');

  let expectedUserNameField = expectedUserField.selectionSet.toArray()[1];
  assert.equal(expectedUserNameField instanceof Type.Field, true);
  assert.equal(expectedUserNameField.name, 'name');

  let expectedUserAddressField = expectedUserField.selectionSet.toArray()[2];
  assert.equal(expectedUserAddressField instanceof Type.Field, true);
  assert.equal(expectedUserAddressField.name, 'address');

  let expectedUserAddressIdField = expectedUserAddressField.selectionSet.toArray()[0];
  assert.equal(expectedUserAddressIdField instanceof Type.Field, true);
  assert.equal(expectedUserAddressIdField.name, 'id');

  let expectedUserAddressCityField = expectedUserAddressField.selectionSet.toArray()[1];
  assert.equal(expectedUserAddressCityField instanceof Type.Field, true);
  assert.equal(expectedUserAddressCityField.name, 'city');

  let expectedUserAddressCountryField = expectedUserAddressField.selectionSet.toArray()[2];
  assert.equal(expectedUserAddressCountryField instanceof Type.Field, true);
  assert.equal(expectedUserAddressCountryField.name, 'country');
});

test('belongsTo id injection', function(assert) {
  let rootField = projectsParseTree.selectionSet.toArray()[0];
  let projectsSelectionSet = rootField.selectionSet.toArray();
  let expectedUserField = projectsSelectionSet[3];

  assert.equal(expectedUserField.selectionSet.toArray().length, 3);

  let expectedUserIdField = expectedUserField.selectionSet.toArray()[0];
  assert.equal(expectedUserIdField instanceof Type.Field, true);
  assert.equal(expectedUserIdField.name, 'id');

  let expectedUserNameField = expectedUserField.selectionSet.toArray()[1];
  assert.equal(expectedUserNameField instanceof Type.Field, true);
  assert.equal(expectedUserNameField.name, 'name');

  let expectedUserAddressField = expectedUserField.selectionSet.toArray()[2];
  assert.equal(expectedUserAddressField instanceof Type.Field, true);
  assert.equal(expectedUserAddressField.name, 'address');

  let expectedUserAddressIdField = expectedUserAddressField.selectionSet.toArray()[0];
  assert.equal(expectedUserAddressIdField instanceof Type.Field, true);
  assert.equal(expectedUserAddressIdField.name, 'id');

  let expectedUserAddressCityField = expectedUserAddressField.selectionSet.toArray()[1];
  assert.equal(expectedUserAddressCityField instanceof Type.Field, true);
  assert.equal(expectedUserAddressCityField.name, 'city');

  let expectedUserAddressCountryField = expectedUserAddressField.selectionSet.toArray()[2];
  assert.equal(expectedUserAddressCountryField instanceof Type.Field, true);
  assert.equal(expectedUserAddressCountryField.name, 'country');
});

test('reflexive relationships', function(assert) {
  let rootField = nodeParseTree.selectionSet.toArray()[0];
  let nodeSelectionSet = rootField.selectionSet.toArray();

  let expectedIdField = nodeSelectionSet[0];
  assert.equal(expectedIdField instanceof Type.Field, true);
  assert.equal(expectedIdField.name, 'id');

  let expectedNameField = nodeSelectionSet[1];
  assert.equal(expectedNameField instanceof Type.Field, true);
  assert.equal(expectedNameField.name, 'name');

  let expectedParentField = nodeSelectionSet[2];
  assert.equal(expectedParentField instanceof Type.Field, true);
  assert.equal(expectedParentField.name, 'parent');

  let expectedParentIdField = expectedParentField.selectionSet.toArray()[0];
  assert.equal(expectedParentIdField instanceof Type.Field, true);
  assert.equal(expectedParentIdField.name, 'id');

  let expectedParentNameField = expectedParentField.selectionSet.toArray()[1];
  assert.equal(expectedParentNameField instanceof Type.Field, true);
  assert.equal(expectedParentNameField.name, 'name');

  let expectedChildrenField = nodeSelectionSet[3];
  assert.equal(expectedChildrenField instanceof Type.Field, true);
  assert.equal(expectedChildrenField.name, 'children');

  let expectedChildrenIdField = expectedChildrenField.selectionSet.toArray()[0];
  assert.equal(expectedChildrenIdField instanceof Type.Field, true);
  assert.equal(expectedChildrenIdField.name, 'id');

  let expectedChildrenNameField = expectedChildrenField.selectionSet.toArray()[1];
  assert.equal(expectedChildrenNameField instanceof Type.Field, true);
  assert.equal(expectedChildrenNameField.name, 'name');
});
