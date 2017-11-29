import { camelize } from '@ember/string';
import { test, module } from 'qunit';
import ModelDouble from '../helpers/model-double';
import StoreDouble from '../helpers/store-double';
import Compiler from 'ember-graphql-adapter/compiler';

module('unit:ember-graphql-adapter/compiler');

const normalizeCaseFn = function(string) {
  return camelize(string);
};

test("takes an Model and responds with GraphQL query", function(assert) {
  let model = new ModelDouble('project', ['status']);
  let store = new StoreDouble({ 'project': model });
  let options = {
    'normalizeCaseFn': normalizeCaseFn,
    'operationType': 'query',
    'operationName': 'projectsQuery',
    'parseSelectionSet': true,
    'rootFieldName': 'projects',
    'rootFieldQuery': {
      'status': 'active',
      'limit': 10
    }
  };

  assert.equal(Compiler.compile(model, store, options), 'query projectsQuery { projects(status: "active", limit: 10) { id status } }');
});

test("mutation", function(assert){
  let model = new ModelDouble('project', ['name', 'status']);
  let store = new StoreDouble({ 'project': model });
  let options = {
    'normalizeCaseFn': normalizeCaseFn,
    'operationType': 'mutation',
    'operationName': 'projectCreate',
    'parseSelectionSet': true,
    'rootFieldName': 'projectCreate',
    'rootFieldQuery': {
      'name': 'Test Project',
      'status': 'active'
    }
  };

  assert.equal(Compiler.compile(model, store, options), 'mutation projectCreate { projectCreate(name: "Test Project", status: "active") { id name status } }');
});

test("mutation with root alias", function(assert){
  let model = new ModelDouble('project', ['name', 'status']);
  let store = new StoreDouble({ 'project': model });
  let options = {
    'normalizeCaseFn': normalizeCaseFn,
    'operationType': 'mutation',
    'operationName': 'projectCreate',
    'parseSelectionSet': true,
    'rootFieldName': 'projectCreate',
    'rootFieldAlias': 'project',
    'rootFieldQuery': {
      'name': 'Test Project',
      'status': 'active'
    }
  };

  assert.equal(Compiler.compile(model, store, options), 'mutation projectCreate { project: projectCreate(name: "Test Project", status: "active") { id name status } }');
});

test("disable automatic selection parsing", function(assert) {
  let model = new ModelDouble('project', ['name', 'status']);
  let store = new StoreDouble({ 'project': model });
  let options = {
    'normalizeCaseFn': normalizeCaseFn,
    'operationType': 'mutation',
    'operationName': 'projectDelete',
    'parseSelectionSet': false,
    'rootFieldName': 'projectDelete',
    'rootFieldAlias': 'project',
    'rootFieldQuery': {
      'id': '667'
    }
  };

  assert.equal(Compiler.compile(model, store, options), 'mutation projectDelete { project: projectDelete(id: "667") { id } }');
});
