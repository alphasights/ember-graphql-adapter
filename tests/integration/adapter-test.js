import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';
import {module, test} from 'qunit';
import {Adapter, Serializer} from 'ember-graphql-adapter';

var env, store, adapter;
var passedUrl, passedQuery;
var run = Ember.run;
var Author, Profile, Post, Comment, PostCategory;

module("integration/adapter - GraphQL adapter", {
  beforeEach: function() {
    Post = DS.Model.extend({
      name: DS.attr('string')
    });

    Comment = DS.Model.extend({
      name: DS.attr('string')
    });

    Author = DS.Model.extend({
      name: DS.attr('string')
    });

    Profile = DS.Model.extend({
      age: DS.attr('number')
    });

    PostCategory = DS.Model.extend({
      name: DS.attr('string')
    });

    env = setupStore({
      adapter: Adapter.extend({ endpoint: '/graph' }),
      post: Post,
      author: Author,
      profile: Profile,
      comment: Comment,
      postCategory: PostCategory
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
      assert.equal(passedQuery, 'query comments { comments(ids: ["1","2","3"]) { id name } }');
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
      assert.equal(passedQuery, 'mutation postDelete { post: postDelete(id: "1") { id } }');

      assert.equal(store.peekAll('post').get('length'), 0);
    });
  });
});

test('Synchronous relationships are included', function(assert) {
  assert.expect(22);

  Post.reopen({
    postCategory: DS.belongsTo('postCategory', { async: false }),
    comments: DS.hasMany('comment', { async: false }),
    topComments: DS.hasMany('comment', { async: false })
  });

  Author.reopen({
    posts: DS.hasMany('post', { async: false }),
    profile: DS.belongsTo('profile', { async: false })
  });

  ajaxResponse({
    data: {
      author: {
        id: '1',
        name: 'Jeffrey Archer',
        profile: {
          id: '1',
          age: 30
        },
        posts: [
          {
            id: '1',
            name: 'Ember.js rocks',
            postCategory: { id: '1', name: 'Tutorials' },
            comments: [
              { id: '1', name: 'FIRST' }
            ],
            topComments: [
              { id: '2', name: 'SECOND' }
            ]
          }, {
            id: '2',
            name: 'React has a smaller footprint than Ember.',
            postCategory: { id: '2', name: 'Controversial' },
            comments: [
              { id: '3', name: 'THIRD' }
            ],
            topComments: [
              { id: '4', name: 'FOURTH' }
            ]
          }
        ]
      }
    }
  });

  run(function() {
    store.findRecord('author', 1).then(function(author) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'query author { author(id: "1") { id name posts { id name postCategory { id name } comments { id name } topComments { id name } } profile { id age } } }');

      assert.equal(author.get('id'), '1');
      assert.equal(author.get('name'), 'Jeffrey Archer');

      assert.equal(author.get('profile.id'), '1');
      assert.equal(author.get('profile.age'), 30);

      assert.equal(author.get('posts.firstObject.id'), '1');
      assert.equal(author.get('posts.firstObject.name'), 'Ember.js rocks');

      assert.equal(author.get('posts.firstObject.postCategory.id'), '1');
      assert.equal(author.get('posts.firstObject.postCategory.name'), 'Tutorials');

      assert.equal(author.get('posts.firstObject.comments.firstObject.id'), '1');
      assert.equal(author.get('posts.firstObject.comments.firstObject.name'), 'FIRST');

      assert.equal(author.get('posts.firstObject.topComments.firstObject.id'), '2');
      assert.equal(author.get('posts.firstObject.topComments.firstObject.name'), 'SECOND');

      assert.equal(author.get('posts.lastObject.id'), '2');
      assert.equal(author.get('posts.lastObject.name'), 'React has a smaller footprint than Ember.');

      assert.equal(author.get('posts.lastObject.postCategory.id'), '2');
      assert.equal(author.get('posts.lastObject.postCategory.name'), 'Controversial');

      assert.equal(author.get('posts.lastObject.comments.firstObject.id'), '3');
      assert.equal(author.get('posts.lastObject.comments.firstObject.name'), 'THIRD');

      assert.equal(author.get('posts.lastObject.topComments.firstObject.id'), '4');
      assert.equal(author.get('posts.lastObject.topComments.firstObject.name'), 'FOURTH');
    });
  });
});

test('Asynchronous relationships only include ids', function(assert) {
  assert.expect(10);

  run(function() {
    store.push({
      data: {
        type: 'comment',
        id: '1',
        attributes: {
          name: 'FIRST'
        }
      }
    });

    store.push({
      data: {
        type: 'comment',
        id: '2',
        attributes: {
          name: 'SECOND'
        }
      }
    });

    store.push({
      data: {
        type: 'post-category',
        id: '1',
        attributes: {
          name: 'Tutorials'
        }
      }
    });
  });

  Post.reopen({
    postCategory: DS.belongsTo('postCategory', { async: true }),
    comments: DS.hasMany('comment', { async: true }),
    topComments: DS.hasMany('comment', { async: true })
  });

  ajaxResponse({
    data: {
      post: {
        id: '1',
        name: 'Ember.js rocks',
        postCategoryId: 1,
        commentIds: [1],
        topCommentIds: [2]
      }
    }
  });

  run(function() {
    store.findRecord('post', 1).then(function(post) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'query post { post(id: "1") { id name postCategoryId commentIds topCommentIds } }');

      assert.equal(post.get('id'), '1');
      assert.equal(post.get('name'), 'Ember.js rocks');

      post.get('postCategory').then(function(category) {
        assert.equal(category.get('id'), '1');
        assert.equal(category.get('name'), 'Tutorials');
      });

      post.get('comments').then(function(comments) {
        assert.equal(comments.get('firstObject.id'), '1');
        assert.equal(comments.get('firstObject.name'), 'FIRST');
      });

      post.get('topComments').then(function(comments) {
        assert.equal(comments.get('firstObject.id'), '2');
        assert.equal(comments.get('firstObject.name'), 'SECOND');
      });
    });
  });
});

test('Resources and attributes with multiple words are camelized', function(assert) {
  assert.expect(5);

  PostCategory.reopen({
    postsCount: DS.attr('number')
  });

  ajaxResponse({
    data: {
      postCategory: {
        id: '1',
        name: 'Ember.js rocks',
        postsCount: '10'
      }
    }
  });

  run(function() {
    store.findRecord('postCategory', 1).then(function(category) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'query postCategory { postCategory(id: "1") { id name postsCount } }');

      assert.equal(category.get('id'), '1');
      assert.equal(category.get('name'), 'Ember.js rocks');
      assert.equal(category.get('postsCount'), 10);
    });
  });
});

test('Resources and attributes with multiple words are snake cased in times of need', function(assert) {
  assert.expect(5);

  let normalizeCaseFn = function(name) {
    return Ember.String.underscore(name);
  };

  adapter.normalizeCase = normalizeCaseFn;

  env.registry.register('serializer:-graphql', Serializer.extend({
    normalizeCase: normalizeCaseFn
  }));

  PostCategory.reopen({
    postsCount: DS.attr('number')
  });

  ajaxResponse({
    data: {
      post_category: {
        id: '1',
        name: 'Tutorials',
        posts_count: '10'
      }
    }
  });

  run(function() {
    store.findRecord('postCategory', 1).then(function(category) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'query post_category { post_category(id: "1") { id name posts_count } }');

      assert.equal(category.get('id'), '1');
      assert.equal(category.get('name'), 'Tutorials');
      assert.equal(category.get('postsCount'), 10);
    });
  });
});

test('Mutation names can be snake cased too', function(assert) {
  assert.expect(4);

  let normalizeCaseFn = function(name) {
    return Ember.String.underscore(name);
  };

  adapter.normalizeCase = normalizeCaseFn;

  env.registry.register('serializer:-graphql', Serializer.extend({
    normalizeCase: normalizeCaseFn
  }));

  ajaxResponse({
    data: {
      post_category: {
        id: '1',
        name: 'Tutorials'
      }
    }
  });

  run(function() {
    let category = store.createRecord('postCategory', { name: 'Tutorials' });

    category.save().then(function(category) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, `mutation post_category_create { post_category: post_category_create(name: "Tutorials") { id name } }`);

      assert.equal(category.get('id'), '1');
      assert.equal(category.get('name'), 'Tutorials');
    });
  });
});

test('Saving a record with a quotes in a string attribute', function(assert) {
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
        name: 'Ember.js is "da bomb".'
      }
    }
  });

  run(function() {
    let post = store.peekRecord('post', 1);

    post.set('name', 'Ember.js is "da bomb".');

    post.save().then(function(post) {
      assert.equal(passedUrl, '/graph');
      assert.equal(passedQuery, 'mutation postUpdate { post: postUpdate(id: "1", name: "Ember.js is \\"da bomb\\".") { id name } }');

      assert.equal(post.get('name'), 'Ember.js is "da bomb".');
    });
  });
});
