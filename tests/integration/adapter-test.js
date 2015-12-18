import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';
import {module, test} from 'qunit';
import Adapter from 'ember-graphql-adapter';

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
      assert.equal(passedQuery, 'query post { post(id: "1") { id name } }');

      assert.equal(post.get('id'), '1');
      assert.equal(post.get('name'), 'Ember.js rocks');
    });
  });
});

test('findAll - finds all records', function(assert) {
  assert.expect(4);

  ajaxResponse({
    data: {
      posts: [{
        id: '1',
        name: 'Ember.js rocks'
      }]
    }
  });

  run(function() {
    store.findAll('post').then(function(posts) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'query posts { posts { id name } }');

      assert.equal(posts.get('length'), 1);
      assert.equal(posts.get('firstObject.name'), 'Ember.js rocks');
    });
  });
});

test('query - finds all records matching query', function(assert) {
  assert.expect(4);

  ajaxResponse({
    data: {
      posts: [{
        id: '1',
        name: 'Ember.js rocks'
      }]
    }
  });

  run(function() {
    store.query('post', { id: 1 }).then(function(posts) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'query posts { posts(id: 1) { id name } }');

      assert.equal(posts.get('length'), 1);
      assert.equal(posts.get('firstObject.name'), 'Ember.js rocks');
    });
  });
});

test('queryRecord - finds a single record matching a query', function(assert) {
  assert.expect(3);

  ajaxResponse({
    data: {
      post: {
        id: '1',
        name: 'Ember.js rocks'
      }
    }
  });

  run(function() {
    store.queryRecord('post', { name: 'Ember.js rocks' }).then(function(post) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'query post { post(name: "Ember.js rocks") { id name } }');

      assert.equal(post.get('name'), 'Ember.js rocks');
    });
  });
});

test('findMany - finds many records coalescing in a single request', function(assert) {
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
      assert.equal(passedQuery, 'query comments { comments(ids: [1,2,3]) { id name } }');
      assert.equal(comments.length, 3);
    });
  });
});

test('createRecord - creates new record', function(assert) {
  assert.expect(3);

  ajaxResponse({
    data: {
      post: {
        id: '1',
        name: 'Ember.js rocks'
      }
    }
  });

  run(function() {
    let post = store.createRecord('post', { name: 'Ember.js rocks' });

    post.save().then(function(post) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'mutation postCreate { post: postCreate(name: "Ember.js rocks") { id name } }');

      assert.equal(post.get('name'), 'Ember.js rocks');
    });
  });
});

test('updateRecord - updates existing record', function(assert) {
  assert.expect(3);

  run(function() {
    store.push({
      data: {
        type: 'post',
        id: '1',
        attributes: {
          name: 'Rails is omakase'
        }
      }
    });
  });

  ajaxResponse({
    data: {
      post: {
        id: '1',
        name: 'Ember.js rocks'
      }
    }
  });

  run(function() {
    let post = store.peekRecord('post', 1);

    post.set('name', 'Ember.js rocks');

    post.save().then(function(post) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'mutation postUpdate { post: postUpdate(id: "1", name: "Ember.js rocks") { id name } }');

      assert.equal(post.get('name'), 'Ember.js rocks');
    });
  });
});

test('deleteRecord - deletes existing record', function(assert) {
  assert.expect(3);

  run(function() {
    store.push({
      data: {
        type: 'post',
        id: '1',
        attributes: {
          name: 'Rails is omakase'
        }
      }
    });
 });

  ajaxResponse({
    data: {
      post: {
        id: '1',
        name: 'Ember.js rocks'
      }
    }
  });

  run(function() {
    let post = store.peekRecord('post', 1);

    post.destroyRecord().then(function() {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'mutation postDelete { post: postDelete(id: "1") { id name } }');

      assert.equal(store.peekAll('post').get('length'), 0);
    });
  });
});
