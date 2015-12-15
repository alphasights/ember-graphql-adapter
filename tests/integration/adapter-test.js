import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';
import {module, test} from 'qunit';
import Adapter from 'graphql-adapter';

var env, store, adapter;
var passedUrl, passedQuery;
var run = Ember.run;
var Post, Comment;

module("integration/adapter - GraphQL adapter", {
  beforeEach: function() {
    Post = DS.Model.extend({
      name: DS.attr('string')
    });

    Comment = DS.Model.extend({
      name: DS.attr('string')
    });

    env = setupStore({
      adapter: Adapter.extend({ endpoint: '/graph' }),
      post: Post,
      comment: Comment
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

test('findRecord - finds a single record', function(assert) {
  assert.expect(4);

  ajaxResponse({
    data: {
      post: {
        id: '1',
        name: 'Ember.js rocks'
      }
    }
  });

  run(function() {
    store.findRecord('post', 1).then(function(post) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'query post { post(id: "1") { id  name } } ');

      assert.equal(post.get('id'), '1');
      assert.equal(post.get('name'), 'Ember.js rocks');
    });
  });
});

test('findMany - find many records coalescing', function(assert) {
  assert.expect(3);

  Post.reopen({ comments: DS.hasMany('comment', { async: true }) });
  adapter.coalesceFindRequests = true;

  run(function() {
    store.push({
      data: {
        type: 'post',
        id: '1',
        attributes: {
          name: "Rails is omakase"
        },
        relationships: {
          comments: {
            data: [
              { type: 'comment', id: '1' },
              { type: 'comment', id: '2' },
              { type: 'comment', id: '3' }
            ]
          }
        }
      }
    });
  });

  let post = store.peekRecord('post', 1);

  ajaxResponse({
    data: {
      comments: [
        { id: 1, name: "FIRST" },
        { id: 2, name: "Rails is unagi" },
        { id: 3, name: "What is omakase?" }
      ]
    }
  });

  run(function() {
    post.get('comments').then(function(comments) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'query comments { comments(ids: [1,2,3]) { id  name } } ');
      assert.equal(comments.length, 3);
    });
  });
});
