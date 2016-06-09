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

module('unit:ember-graphql-adapter/parser', {
  setup: function() {
    let projectModel = new ModelDouble(
      'projects',
      ['status', 'name'],
      [['user', { type: 'user', kind: 'belongsTo', options: { async: false }}]]
    );
    let userModel = new ModelDouble('user', ['name'],
      [['address', { type: 'address', kind: 'belongsTo', options: { async: false }}]]
    );
    let addressModel = new ModelDouble('address', ['city', 'country']);
    let store = new StoreDouble({ 'project': projectModel, 'user': userModel, 'address': addressModel });

    let rootField = new Type.Field('projects');
    let operation = new Type.Operation('query', 'projectsQuery', ArgumentSet.fromQuery({ status: 'active' }));

    this.parseTree = Parser.parse(projectModel, store, operation, rootField, {
      normalizeCaseFn: normalizeCaseFn,
      parseSelectionSet: true
    });
  }
});

test('makes the root of the tree an Operation', function(assert) {
  assert.equal(this.parseTree instanceof Type.Operation, true);
  assert.equal(this.parseTree.type, 'query');
  assert.equal(this.parseTree.name, 'projectsQuery');

  let rootSelectionSet = this.parseTree.selectionSet;
  assert.equal(rootSelectionSet instanceof Type.SelectionSet, true);
  assert.equal(rootSelectionSet.length, 1);
});

test('root field is generated in the selection set', function(assert){
  let rootField = this.parseTree.selectionSet[0];
  assert.equal(rootField instanceof Type.Field, true);
  assert.equal(rootField.name, 'projects');
});

test('there are as many elements in the selection set as there are top level fields (plus the id field)', function(assert){
  let rootField = this.parseTree.selectionSet[0];
  let projectsSelectionSet = rootField.selectionSet;

  assert.equal(projectsSelectionSet.length, 4);
});

test('nested fields are generated in the root field selection set', function(assert){
  let rootField = this.parseTree.selectionSet[0];
  let projectsSelectionSet = rootField.selectionSet;

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

  let expectedUserIdField = expectedUserField.selectionSet[0];
  assert.equal(expectedUserIdField instanceof Type.Field, true);
  assert.equal(expectedUserIdField.name, 'id');

  let expectedUserNameField = expectedUserField.selectionSet[1];
  assert.equal(expectedUserNameField instanceof Type.Field, true);
  assert.equal(expectedUserNameField.name, 'name');

  let expectedUserAddressField = expectedUserField.selectionSet[2];
  assert.equal(expectedUserAddressField instanceof Type.Field, true);
  assert.equal(expectedUserAddressField.name, 'address');

  let expectedUserAddressIdField = expectedUserAddressField.selectionSet[0];
  assert.equal(expectedUserAddressIdField instanceof Type.Field, true);
  assert.equal(expectedUserAddressIdField.name, 'id');

  let expectedUserAddressCityField = expectedUserAddressField.selectionSet[1];
  assert.equal(expectedUserAddressCityField instanceof Type.Field, true);
  assert.equal(expectedUserAddressCityField.name, 'city');

  let expectedUserAddressCountryField = expectedUserAddressField.selectionSet[2];
  assert.equal(expectedUserAddressCountryField instanceof Type.Field, true);
  assert.equal(expectedUserAddressCountryField.name, 'country');
});

test('belongsTo id injection', function(assert) {
  let rootField = this.parseTree.selectionSet[0];
  let projectsSelectionSet = rootField.selectionSet;
  let expectedUserField = projectsSelectionSet[3];

  assert.equal(expectedUserField.selectionSet.length, 3);

  let expectedUserIdField = expectedUserField.selectionSet[0];
  assert.equal(expectedUserIdField instanceof Type.Field, true);
  assert.equal(expectedUserIdField.name, 'id');

  let expectedUserNameField = expectedUserField.selectionSet[1];
  assert.equal(expectedUserNameField instanceof Type.Field, true);
  assert.equal(expectedUserNameField.name, 'name');

  let expectedUserAddressField = expectedUserField.selectionSet[2];
  assert.equal(expectedUserAddressField instanceof Type.Field, true);
  assert.equal(expectedUserAddressField.name, 'address');

  let expectedUserAddressIdField = expectedUserAddressField.selectionSet[0];
  assert.equal(expectedUserAddressIdField instanceof Type.Field, true);
  assert.equal(expectedUserAddressIdField.name, 'id');

  let expectedUserAddressCityField = expectedUserAddressField.selectionSet[1];
  assert.equal(expectedUserAddressCityField instanceof Type.Field, true);
  assert.equal(expectedUserAddressCityField.name, 'city');

  let expectedUserAddressCountryField = expectedUserAddressField.selectionSet[2];
  assert.equal(expectedUserAddressCountryField instanceof Type.Field, true);
  assert.equal(expectedUserAddressCountryField.name, 'country');
});
