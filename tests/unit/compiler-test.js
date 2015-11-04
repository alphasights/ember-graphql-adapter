import { test, module } from 'qunit';
import ModelDouble from '../helpers/model-double';
import StoreDouble from '../helpers/store-double';
import Compiler from 'graphql-adapter/compiler';

module('unit:graphql-adapter/compiler');

test("takes an Model and responds with GraphQL query", function(assert) {
  let model = new ModelDouble('projects', ['status']);
  let store = new StoreDouble({ 'projects': model });
  let query = {
    status: 'active',
    limit: 10
  };

  assert.equal(Compiler.compile(model, store, query), 'query projectsQuery { projects(status: "active", limit: 10) { id  status } } ');
});
