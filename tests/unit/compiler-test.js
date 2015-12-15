import { test, module } from 'qunit';
import ModelDouble from '../helpers/model-double';
import StoreDouble from '../helpers/store-double';
import Compiler from 'ember-graphql-adapter/compiler';

module('unit:ember-graphql-adapter/compiler');

test("takes an Model and responds with GraphQL query", function(assert) {
  let model = new ModelDouble('project', ['status']);
  let store = new StoreDouble({ 'project': model });
  let options = {
    'operationType': 'query',
    'operationName': 'projectsQuery',
    'rootFieldName': 'projects',
    'rootFieldQuery': {
      'status': 'active',
      'limit': 10
    }
  };

  assert.equal(Compiler.compile(model, store, options), 'query projectsQuery { projects(status: "active", limit: 10) { id  status } } ');
});

test("mutation", function(assert){
  let model = new ModelDouble('project', ['name', 'status']);
  let store = new StoreDouble({ 'project': model });
  let options = {
    'operationType': 'mutation',
    'operationName': 'projectCreate',
    'rootFieldName': 'projectCreate',
    'rootFieldQuery': {
      'name': 'Test Project',
      'status': 'active'
    }
  };

  assert.equal(Compiler.compile(model, store, options), 'mutation projectCreate { projectCreate(name: "Test Project", status: "active") { id  name  status } } ');
});

test("mutation with root alias", function(assert){
  let model = new ModelDouble('project', ['name', 'status']);
  let store = new StoreDouble({ 'project': model });
  let options = {
    'operationType': 'mutation',
    'operationName': 'projectCreate',
    'rootFieldName': 'projectCreate',
    'rootFieldAlias': 'project',
    'rootFieldQuery': {
      'name': 'Test Project',
      'status': 'active'
    }
  };

  assert.equal(Compiler.compile(model, store, options), 'mutation projectCreate { project: projectCreate(name: "Test Project", status: "active") { id  name  status } } ');
});
