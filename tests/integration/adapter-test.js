import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';
import {module, test} from 'qunit';
import Adapter from 'graphql-adapter';

var env, store, adapter;
var passedUrl, passedQuery;
var run = Ember.run;
var Post;

module("GraphQL adapter", {
  beforeEach: function() {
    Post =
      DS.Model.extend({
      title: DS.attr('string'),
    });

    env = setupStore({
      adapter: Adapter.extend({
        endpoint: 'graph'
      }),
      post: Post
    });

    store = env.store;
    adapter = env.adapter;
  }
});

function ajaxResponse(value) {
  adapter.ajax = function({url, data}) {
    passedUrl = url;
    passedQuery = data.query;

    return run(Ember.RSVP, 'resolve', Ember.copy(value, true));
  };
}

test('find a single record', function(assert) {
  assert.expect(4);

  ajaxResponse({
    data: {
      post: {
        id: '1',
        title: 'Ember.js rocks'
      }
    }
  });

  run(function() {
    store.findRecord('post', 1).then(function(post) {
      assert.equal(passedUrl, 'graph');
      assert.equal(passedQuery, 'query post { post(id: "1") { id  title } } ');

      assert.equal(post.get('id'), '1');
      assert.equal(post.get('title'), 'Ember.js rocks');
    });
  });
});
