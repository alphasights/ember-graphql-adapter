import { test, module } from 'qunit';
// import DS from 'ember-data';
import Compiler from 'graphql-adapter/compiler';

module('unit:graphql-adapter/compiler');

test("takes an Model and responds with GraphQL query", function(assert) {
  let model = DS.Model.extend({
    status: DS.attr('string')
  });

  assert.equal(Compiler.compile(model), "query projectQuery { projects { id  status } } ");
});
