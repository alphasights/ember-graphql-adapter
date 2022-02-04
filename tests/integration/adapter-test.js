import { underscore } from '@ember/string';
import RSVP from 'rsvp';
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';
import GraphQLAdapter, { Serializer } from 'ember-graphql-adapter';

let mockResponse, passedUrl, passedQuery;

class Post extends Model {
  @attr('string') name;
}

class Comment extends Model {
  @attr('string') name;
}

class Author extends Model {
  @attr('string') name;
}

class Profile extends Model {
  @attr('number') age;
}

class PostCategory extends Model {
  @attr('string') name;
}

class ApplicationAdapter extends GraphQLAdapter {
  endpoint = '/graph';

  ajax(url, { data }) {
    passedUrl = url;
    passedQuery = data.query;

    return RSVP.resolve(mockResponse);
  }
}

module('integration/adapter - GraphQL adapter', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('model:post', Post);
    this.owner.register('model:comment', Comment);
    this.owner.register('model:author', Author);
    this.owner.register('model:profile', Profile);
    this.owner.register('model:post-category', PostCategory);

    this.owner.register('serializer:application', Serializer);
    this.owner.register('adapter:application', ApplicationAdapter);

    this.store = this.owner.lookup('service:store');
    this.adapter = this.store.adapterFor('post');
  });

  function ajaxResponse(value) {
    mockResponse = value;
  }

  test('findRecord - finds a single record', async function (assert) {
    assert.expect(4);

    ajaxResponse({
      data: {
        post: {
          id: '1',
          name: 'Ember.js rocks',
        },
      },
    });

    let post = await this.store.findRecord('post', 1);

    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(passedQuery, 'query post { post(id: "1") { id name } }');

    assert.strictEqual(post.id, '1');
    assert.strictEqual(post.name, 'Ember.js rocks');
  });

  test('findAll - finds all records', async function (assert) {
    assert.expect(4);

    ajaxResponse({
      data: {
        posts: [
          {
            id: '1',
            name: 'Ember.js rocks',
          },
        ],
      },
    });

    let posts = await this.store.findAll('post');
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(passedQuery, 'query posts { posts { id name } }');

    assert.strictEqual(posts.length, 1);
    assert.strictEqual(posts.firstObject.name, 'Ember.js rocks');
  });

  test('query - finds all records matching query', async function (assert) {
    assert.expect(4);

    ajaxResponse({
      data: {
        posts: [
          {
            id: '1',
            name: 'Ember.js rocks',
          },
        ],
      },
    });

    let posts = await this.store.query('post', { id: 1 });
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(passedQuery, 'query posts { posts(id: 1) { id name } }');

    assert.strictEqual(posts.length, 1);
    assert.strictEqual(posts.firstObject.name, 'Ember.js rocks');
  });

  test('queryRecord - finds a single record matching a query', async function (assert) {
    assert.expect(3);

    ajaxResponse({
      data: {
        post: {
          id: '1',
          name: 'Ember.js rocks',
        },
      },
    });

    let post = await this.store.queryRecord('post', { name: 'Ember.js rocks' });
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'query post { post(name: "Ember.js rocks") { id name } }'
    );

    assert.strictEqual(post.name, 'Ember.js rocks');
  });

  test('findMany - finds many records coalescing in a single request', async function (assert) {
    assert.expect(3);

    class PostWithComments extends Post {
      @hasMany('comment', { async: true }) comments;
    }
    this.owner.register('model:post', PostWithComments);
    this.adapter.coalesceFindRequests = true;

    this.store.push({
      data: {
        type: 'post',
        id: '1',
        attributes: {
          name: 'Rails is omakase',
        },
        relationships: {
          comments: {
            data: [
              { type: 'comment', id: '1' },
              { type: 'comment', id: '2' },
              { type: 'comment', id: '3' },
            ],
          },
        },
      },
    });

    let post = this.store.peekRecord('post', 1);

    ajaxResponse({
      data: {
        comments: [
          { id: 1, name: 'FIRST' },
          { id: 2, name: 'Rails is unagi' },
          { id: 3, name: 'What is omakase?' },
        ],
      },
    });

    let comments = await post.get('comments');
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'query comments { comments(ids: ["1","2","3"]) { id name } }'
    );
    assert.strictEqual(comments.length, 3);
  });

  test('createRecord - creates new record', async function (assert) {
    assert.expect(3);

    ajaxResponse({
      data: {
        post: {
          id: '1',
          name: 'Ember.js rocks',
        },
      },
    });

    let post = this.store.createRecord('post', { name: 'Ember.js rocks' });

    post = await post.save();
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'mutation postCreate { post: postCreate(name: "Ember.js rocks") { id name } }'
    );

    assert.strictEqual(post.name, 'Ember.js rocks');
  });

  test('updateRecord - updates existing record', async function (assert) {
    assert.expect(3);

    this.store.push({
      data: {
        type: 'post',
        id: '1',
        attributes: {
          name: 'Rails is omakase',
        },
      },
    });

    ajaxResponse({
      data: {
        post: {
          id: '1',
          name: 'Ember.js rocks',
        },
      },
    });

    let post = this.store.peekRecord('post', 1);

    post.name = 'Ember.js rocks';

    post = await post.save();
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'mutation postUpdate { post: postUpdate(id: "1", name: "Ember.js rocks") { id name } }'
    );

    assert.strictEqual(post.get('name'), 'Ember.js rocks');
  });

  test('deleteRecord - deletes existing record', async function (assert) {
    assert.expect(3);

    this.store.push({
      data: {
        type: 'post',
        id: '1',
        attributes: {
          name: 'Rails is omakase',
        },
      },
    });

    ajaxResponse({
      data: {
        post: {
          id: '1',
          name: 'Ember.js rocks',
        },
      },
    });

    let post = this.store.peekRecord('post', 1);

    await post.destroyRecord();
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'mutation postDelete { post: postDelete(id: "1") { id } }'
    );

    assert.strictEqual(this.store.peekAll('post').length, 0);
  });

  test('Synchronous relationships are included', async function (assert) {
    assert.expect(22);

    class PostWithComments extends Post {
      @belongsTo('postCategory', { async: false }) postCategory;
      @hasMany('comment', { async: false }) comments;
      @hasMany('comment', { async: false }) topComments;
    }
    this.owner.register('model:post', PostWithComments);

    Author.reopen({
      posts: hasMany('post', { async: false }),
      profile: belongsTo('profile', { async: false }),
    });

    class AuthorWithPosts extends Author {
      @hasMany('post', { async: false }) posts;
      @belongsTo('profile', { async: false }) profile;
    }
    this.owner.register('model:author', AuthorWithPosts);

    ajaxResponse({
      data: {
        author: {
          id: '1',
          name: 'Jeffrey Archer',
          profile: {
            id: '1',
            age: 30,
          },
          posts: [
            {
              id: '1',
              name: 'Ember.js rocks',
              postCategory: { id: '1', name: 'Tutorials' },
              comments: [{ id: '1', name: 'FIRST' }],
              topComments: [{ id: '2', name: 'SECOND' }],
            },
            {
              id: '2',
              name: 'React has a smaller footprint than Ember.',
              postCategory: { id: '2', name: 'Controversial' },
              comments: [{ id: '3', name: 'THIRD' }],
              topComments: [{ id: '4', name: 'FOURTH' }],
            },
          ],
        },
      },
    });

    let author = await this.store.findRecord('author', 1);
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'query author { author(id: "1") { id name posts { id name postCategory { id name } comments { id name } topComments { id name } } profile { id age } } }'
    );

    assert.strictEqual(author.id, '1');
    assert.strictEqual(author.name, 'Jeffrey Archer');

    assert.strictEqual(author.profile.id, '1');
    assert.strictEqual(author.profile.age, 30);

    assert.strictEqual(author.posts.firstObject.id, '1');
    assert.strictEqual(author.posts.firstObject.name, 'Ember.js rocks');

    assert.strictEqual(author.posts.firstObject.postCategory.id, '1');
    assert.strictEqual(author.posts.firstObject.postCategory.name, 'Tutorials');

    assert.strictEqual(author.posts.firstObject.comments.firstObject.id, '1');
    assert.strictEqual(
      author.posts.firstObject.comments.firstObject.name,
      'FIRST'
    );

    assert.strictEqual(
      author.posts.firstObject.topComments.firstObject.id,
      '2'
    );
    assert.strictEqual(
      author.posts.firstObject.topComments.firstObject.name,
      'SECOND'
    );

    assert.strictEqual(author.posts.lastObject.id, '2');
    assert.strictEqual(
      author.posts.lastObject.name,
      'React has a smaller footprint than Ember.'
    );

    assert.strictEqual(author.posts.lastObject.postCategory.id, '2');
    assert.strictEqual(
      author.posts.lastObject.postCategory.name,
      'Controversial'
    );

    assert.strictEqual(author.posts.lastObject.comments.firstObject.id, '3');
    assert.strictEqual(
      author.posts.lastObject.comments.firstObject.name,
      'THIRD'
    );

    assert.strictEqual(author.posts.lastObject.topComments.firstObject.id, '4');
    assert.strictEqual(
      author.posts.lastObject.topComments.firstObject.name,
      'FOURTH'
    );
  });

  test('Asynchronous relationships only include ids', async function (assert) {
    assert.expect(10);

    this.store.push({
      data: {
        type: 'comment',
        id: '1',
        attributes: {
          name: 'FIRST',
        },
      },
    });

    this.store.push({
      data: {
        type: 'comment',
        id: '2',
        attributes: {
          name: 'SECOND',
        },
      },
    });

    this.store.push({
      data: {
        type: 'post-category',
        id: '1',
        attributes: {
          name: 'Tutorials',
        },
      },
    });

    class PostWithComments extends Post {
      @belongsTo('postCategory', { async: true }) postCategory;
      @hasMany('comment', { async: true }) comments;
      @hasMany('comment', { async: true }) topComments;
    }
    this.owner.register('model:post', PostWithComments);

    ajaxResponse({
      data: {
        post: {
          id: '1',
          name: 'Ember.js rocks',
          postCategoryId: 1,
          commentIds: [1],
          topCommentIds: [2],
        },
      },
    });

    let post = await this.store.findRecord('post', 1);
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'query post { post(id: "1") { id name postCategoryId commentIds topCommentIds } }'
    );

    assert.strictEqual(post.id, '1');
    assert.strictEqual(post.name, 'Ember.js rocks');

    let category = await post.get('postCategory');
    assert.strictEqual(category.id, '1');
    assert.strictEqual(category.name, 'Tutorials');

    let comments = await post.get('comments');
    assert.strictEqual(comments.firstObject.id, '1');
    assert.strictEqual(comments.firstObject.name, 'FIRST');

    let topComments = await post.get('topComments');
    assert.strictEqual(topComments.firstObject.id, '2');
    assert.strictEqual(topComments.firstObject.name, 'SECOND');
  });

  test('Resources and attributes with multiple words are camelized', async function (assert) {
    assert.expect(5);

    class PostCategoryWithCount extends PostCategory {
      @attr('number') postsCount;
    }
    this.owner.register('model:post-category', PostCategoryWithCount);

    ajaxResponse({
      data: {
        postCategory: {
          id: '1',
          name: 'Ember.js rocks',
          postsCount: '10',
        },
      },
    });

    let category = await this.store.findRecord('postCategory', 1);
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'query postCategory { postCategory(id: "1") { id postsCount name } }'
    );

    assert.strictEqual(category.id, '1');
    assert.strictEqual(category.name, 'Ember.js rocks');
    assert.strictEqual(category.postsCount, 10);
  });

  test('Resources and attributes with multiple words are snake cased in times of need', async function (assert) {
    assert.expect(5);

    let normalizeCaseFn = (name) => underscore(name);

    this.adapter.normalizeCase = normalizeCaseFn;

    this.owner.register(
      'serializer:application',
      class SnakeSerializer extends Serializer {
        normalizeCase = normalizeCaseFn;
      }
    );

    class PostCategoryWithCount extends PostCategory {
      @attr('number') postsCount;
    }
    this.owner.register('model:post-category', PostCategoryWithCount);

    ajaxResponse({
      data: {
        post_category: {
          id: '1',
          name: 'Tutorials',
          posts_count: '10',
        },
      },
    });

    let category = await this.store.findRecord('postCategory', 1);
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'query post_category { post_category(id: "1") { id posts_count name } }'
    );

    assert.strictEqual(category.id, '1');
    assert.strictEqual(category.name, 'Tutorials');
    assert.strictEqual(category.postsCount, 10);
  });

  test('Mutation names can be snake cased too', async function (assert) {
    assert.expect(4);

    let normalizeCaseFn = (name) => underscore(name);

    this.adapter.normalizeCase = normalizeCaseFn;

    this.owner.register(
      'serializer:application',
      class SnakeSerializer extends Serializer {
        normalizeCase = normalizeCaseFn;
      }
    );

    ajaxResponse({
      data: {
        post_category: {
          id: '1',
          name: 'Tutorials',
        },
      },
    });

    let category = this.store.createRecord('postCategory', {
      name: 'Tutorials',
    });

    category = await category.save();
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      `mutation post_category_create { post_category: post_category_create(name: "Tutorials") { id name } }`
    );

    assert.strictEqual(category.id, '1');
    assert.strictEqual(category.name, 'Tutorials');
  });

  test('Saving a record with a quotes in a string attribute', async function (assert) {
    assert.expect(3);

    this.store.push({
      data: {
        type: 'post',
        id: '1',
        attributes: {
          name: 'Rails is omakase',
        },
      },
    });

    ajaxResponse({
      data: {
        post: {
          id: '1',
          name: 'Ember.js is "da bomb".',
        },
      },
    });

    let post = this.store.peekRecord('post', 1);

    post.name = 'Ember.js is "da bomb".';

    post = await post.save();
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'mutation postUpdate { post: postUpdate(id: "1", name: "Ember.js is \\"da bomb\\".") { id name } }'
    );

    assert.strictEqual(post.name, 'Ember.js is "da bomb".');
  });

  test('Saving a record with a backslash in a string attribute', async function (assert) {
    assert.expect(3);

    this.store.push({
      data: {
        type: 'post',
        id: '1',
        attributes: {
          name: 'Rails is omakase',
        },
      },
    });

    ajaxResponse({
      data: {
        post: {
          id: '1',
          name: 'Ember.js is da \\ the bomb.',
        },
      },
    });

    let post = this.store.peekRecord('post', 1);

    post.name = 'Ember.js is da \\ the bomb.';

    post = await post.save();
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'mutation postUpdate { post: postUpdate(id: "1", name: "Ember.js is da \\\\ the bomb.") { id name } }'
    );

    assert.strictEqual(post.name, 'Ember.js is da \\ the bomb.');
  });

  test('query - querying a record with double quotes in the query', async function (assert) {
    assert.expect(4);

    ajaxResponse({
      data: {
        posts: [
          {
            id: '1',
            name: 'Ember.js "rocks"',
          },
        ],
      },
    });

    let posts = await this.store.query('post', { name: 'Ember.js "rocks"' });
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'query posts { posts(name: "Ember.js \\"rocks\\"") { id name } }'
    );

    assert.strictEqual(posts.length, 1);
    assert.strictEqual(posts.firstObject.name, 'Ember.js "rocks"');
  });

  test('query - querying a record with backslashes in the query', async function (assert) {
    assert.expect(4);

    ajaxResponse({
      data: {
        posts: [
          {
            id: '1',
            name: 'Ember.js \\ rocks',
          },
        ],
      },
    });

    let posts = await this.store.query('post', { name: 'Ember.js \\ rocks' });
    assert.strictEqual(passedUrl, '/graph');
    assert.strictEqual(
      passedQuery,
      'query posts { posts(name: "Ember.js \\\\ rocks") { id name } }'
    );

    assert.strictEqual(posts.length, 1);
    assert.strictEqual(posts.firstObject.name, 'Ember.js \\ rocks');
  });
});
