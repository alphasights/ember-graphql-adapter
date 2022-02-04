import { camelize } from '@ember/string';
import { test, module } from 'qunit';
import Parser from 'ember-graphql-adapter/parser';
import * as Type from 'ember-graphql-adapter/types';
import ArgumentSet from 'ember-graphql-adapter/types/argument-set';
import ModelDouble from '../helpers/model-double';
import StoreDouble from '../helpers/store-double';

const normalizeCaseFn = function (string) {
  return camelize(string);
};

let nodeParseTree, projectsParseTree;

module('unit:ember-graphql-adapter/parser', function (hooks) {
  hooks.before(function () {
    let projectModel = new ModelDouble(
      'project',
      ['status', 'name'],
      [['user', { type: 'user', kind: 'belongsTo', options: { async: false } }]]
    );
    let userModel = new ModelDouble(
      'user',
      ['name'],
      [
        [
          'address',
          { type: 'address', kind: 'belongsTo', options: { async: false } },
        ],
        [
          'project',
          { type: 'project', kind: 'belongsTo', options: { async: false } },
        ],
      ]
    );
    let addressModel = new ModelDouble(
      'address',
      ['city', 'country'],
      [['user', { type: 'user', kind: 'belongsTo', options: { async: false } }]]
    );

    let nodeModel = new ModelDouble(
      'node',
      ['name'],
      [
        [
          'parent',
          { type: 'node', kind: 'belongsTo', options: { async: false } },
        ],
        [
          'children',
          { type: 'node', kind: 'hasMany', options: { async: false } },
        ],
      ]
    );

    let store = new StoreDouble({
      project: projectModel,
      user: userModel,
      address: addressModel,
      node: nodeModel,
    });

    let nodeRootField = new Type.Field('node');
    let projectsRootField = new Type.Field('projects');
    let nodeOperation = new Type.Operation(
      'query',
      'nodeQuery',
      ArgumentSet.fromQuery({ id: 'my_node_id' })
    );
    let projectsOperation = new Type.Operation(
      'query',
      'projectsQuery',
      ArgumentSet.fromQuery({ status: 'active' })
    );

    nodeParseTree = Parser.parse(
      nodeModel,
      store,
      nodeOperation,
      nodeRootField,
      {
        normalizeCaseFn: normalizeCaseFn,
        parseSelectionSet: true,
      }
    );

    projectsParseTree = Parser.parse(
      projectModel,
      store,
      projectsOperation,
      projectsRootField,
      {
        normalizeCaseFn: normalizeCaseFn,
        parseSelectionSet: true,
      }
    );
  });

  test('makes the root of the tree an Operation', function (assert) {
    assert.true(projectsParseTree instanceof Type.Operation);
    assert.strictEqual(projectsParseTree.type, 'query');
    assert.strictEqual(projectsParseTree.name, 'projectsQuery');

    let rootSelectionSet = projectsParseTree.selectionSet;
    assert.true(rootSelectionSet instanceof Type.SelectionSet);
    assert.strictEqual(rootSelectionSet.length, 1);
  });

  test('root field is generated in the selection set', function (assert) {
    let rootField = projectsParseTree.selectionSet.get(0);
    assert.true(rootField instanceof Type.Field);
    assert.strictEqual(rootField.name, 'projects');
  });

  test('there are as many elements in the selection set as there are top level fields (plus the id field)', function (assert) {
    let rootField = projectsParseTree.selectionSet.get(0);
    let projectsSelectionSet = rootField.selectionSet;

    assert.strictEqual(projectsSelectionSet.length, 4);
  });

  test('nested fields are generated in the root field selection set', function (assert) {
    let rootField = projectsParseTree.selectionSet.get(0);
    let projectsSelectionSet = rootField.selectionSet;

    let expectedIdField = projectsSelectionSet.get(0);
    assert.true(expectedIdField instanceof Type.Field);
    assert.strictEqual(expectedIdField.name, 'id');

    let expectedStatusField = projectsSelectionSet.get(1);
    assert.true(expectedStatusField instanceof Type.Field);
    assert.strictEqual(expectedStatusField.name, 'status');

    let expectedNameField = projectsSelectionSet.get(2);
    assert.true(expectedNameField instanceof Type.Field);
    assert.strictEqual(expectedNameField.name, 'name');

    let expectedUserField = projectsSelectionSet.get(3);
    assert.true(expectedUserField instanceof Type.Field);
    assert.strictEqual(expectedUserField.name, 'user');

    let expectedUserIdField = expectedUserField.selectionSet.get(0);
    assert.true(expectedUserIdField instanceof Type.Field);
    assert.strictEqual(expectedUserIdField.name, 'id');

    let expectedUserNameField = expectedUserField.selectionSet.get(1);
    assert.true(expectedUserNameField instanceof Type.Field);
    assert.strictEqual(expectedUserNameField.name, 'name');

    let expectedUserAddressField = expectedUserField.selectionSet.get(2);
    assert.true(expectedUserAddressField instanceof Type.Field);
    assert.strictEqual(expectedUserAddressField.name, 'address');

    let expectedUserAddressIdField =
      expectedUserAddressField.selectionSet.get(0);
    assert.true(expectedUserAddressIdField instanceof Type.Field);
    assert.strictEqual(expectedUserAddressIdField.name, 'id');

    let expectedUserAddressCityField =
      expectedUserAddressField.selectionSet.get(1);
    assert.true(expectedUserAddressCityField instanceof Type.Field);
    assert.strictEqual(expectedUserAddressCityField.name, 'city');

    let expectedUserAddressCountryField =
      expectedUserAddressField.selectionSet.get(2);
    assert.true(expectedUserAddressCountryField instanceof Type.Field);
    assert.strictEqual(expectedUserAddressCountryField.name, 'country');
  });

  test('belongsTo id injection', function (assert) {
    let rootField = projectsParseTree.selectionSet.get(0);
    let projectsSelectionSet = rootField.selectionSet;
    let expectedUserField = projectsSelectionSet.get(3);

    assert.strictEqual(expectedUserField.selectionSet.length, 3);

    let expectedUserIdField = expectedUserField.selectionSet.get(0);
    assert.true(expectedUserIdField instanceof Type.Field);
    assert.strictEqual(expectedUserIdField.name, 'id');

    let expectedUserNameField = expectedUserField.selectionSet.get(1);
    assert.true(expectedUserNameField instanceof Type.Field);
    assert.strictEqual(expectedUserNameField.name, 'name');

    let expectedUserAddressField = expectedUserField.selectionSet.get(2);
    assert.true(expectedUserAddressField instanceof Type.Field);
    assert.strictEqual(expectedUserAddressField.name, 'address');

    let expectedUserAddressIdField =
      expectedUserAddressField.selectionSet.get(0);
    assert.true(expectedUserAddressIdField instanceof Type.Field);
    assert.strictEqual(expectedUserAddressIdField.name, 'id');

    let expectedUserAddressCityField =
      expectedUserAddressField.selectionSet.get(1);
    assert.true(expectedUserAddressCityField instanceof Type.Field);
    assert.strictEqual(expectedUserAddressCityField.name, 'city');

    let expectedUserAddressCountryField =
      expectedUserAddressField.selectionSet.get(2);
    assert.true(expectedUserAddressCountryField instanceof Type.Field);
    assert.strictEqual(expectedUserAddressCountryField.name, 'country');
  });

  test('reflexive relationships', function (assert) {
    let rootField = nodeParseTree.selectionSet.get(0);
    let nodeSelectionSet = rootField.selectionSet;

    let expectedIdField = nodeSelectionSet.get(0);
    assert.true(expectedIdField instanceof Type.Field);
    assert.strictEqual(expectedIdField.name, 'id');

    let expectedNameField = nodeSelectionSet.get(1);
    assert.true(expectedNameField instanceof Type.Field);
    assert.strictEqual(expectedNameField.name, 'name');

    let expectedParentField = nodeSelectionSet.get(2);
    assert.true(expectedParentField instanceof Type.Field);
    assert.strictEqual(expectedParentField.name, 'parent');

    let expectedParentIdField = expectedParentField.selectionSet.get(0);
    assert.true(expectedParentIdField instanceof Type.Field);
    assert.strictEqual(expectedParentIdField.name, 'id');

    let expectedParentNameField = expectedParentField.selectionSet.get(1);
    assert.true(expectedParentNameField instanceof Type.Field);
    assert.strictEqual(expectedParentNameField.name, 'name');

    let expectedChildrenField = nodeSelectionSet.get(3);
    assert.true(expectedChildrenField instanceof Type.Field);
    assert.strictEqual(expectedChildrenField.name, 'children');

    let expectedChildrenIdField = expectedChildrenField.selectionSet.get(0);
    assert.true(expectedChildrenIdField instanceof Type.Field);
    assert.strictEqual(expectedChildrenIdField.name, 'id');

    let expectedChildrenNameField = expectedChildrenField.selectionSet.get(1);
    assert.true(expectedChildrenNameField instanceof Type.Field);
    assert.strictEqual(expectedChildrenNameField.name, 'name');
  });
});
