import { test, module } from 'qunit';
// import DS from 'ember-data';
import Compiler from 'graphql-adapter/compiler';

module('unit:graphql-adapter/compiler');

test("takes an Model and responds with GraphQL query", function(assert) {
  let model = DS.Model.extend({
    status: DS.attr('string')
  });

  let query = {
    status: 'active',
    limit: 10
  };

  assert.equal(Compiler.compile(model, query), 'query projectQuery { projects(status: "active", limit: 10) { id  status } } ');
});
