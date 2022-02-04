import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';
import GraphQLAdapter, { Serializer } from 'ember-graphql-adapter';

class Address extends Model {
  @attr('string') city;
}

class Blog extends Model {
  @attr('string') title;
  @hasMany('post', { async: true }) posts;
}

class Post extends Model {
  @attr('string') title;
}

class Profile extends Model {
  @attr('number') age;
  @hasMany('address', { async: false }) addresses;
}

class User extends Model {
  @attr('string') name;
  @belongsTo('profile', { async: false }) profile;
}

class NullUndefined extends Model {
  @attr('string') undefinedStringField;
  @attr('string') nullStringField;
}

module('integration/serializer - GraphQL serializer', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('model:address', Address);
    this.owner.register('model:blog', Blog);
    this.owner.register('model:post', Post);
    this.owner.register('model:profile', Profile);
    this.owner.register('model:user', User);
    this.owner.register('model:null-undefined', NullUndefined);

    this.owner.register('serializer:application', Serializer);
    this.owner.register('adapter:application', GraphQLAdapter);

    this.store = this.owner.lookup('service:store');
    this.adapter = this.store.adapterFor('post');
  });

  test('normalize - null record', function (assert) {
    assert.expect(1);

    let id = '1';
    let method = 'findRecord';
    let modelName = 'post';

    let payload = {
      data: {
        post: null,
      },
    };

    let expected = {
      data: null,
      included: [],
    };

    let model = this.store.modelFor(modelName);
    let serializer = this.store.serializerFor(modelName);
    let result = serializer.normalizeResponse(
      this.store,
      model,
      payload,
      id,
      method
    );
    assert.deepEqual(result, expected);
  });

  test('normalize - single record', function (assert) {
    assert.expect(1);

    let id = '1';
    let method = 'findRecord';
    let modelName = 'post';

    let payload = {
      data: {
        post: {
          id: '1',
          title: 'The post title',
        },
      },
    };

    let expected = {
      data: {
        type: 'post',
        id: '1',
        attributes: {
          title: 'The post title',
        },
        relationships: {},
      },
      included: [],
    };

    let model = this.store.modelFor(modelName);
    let serializer = this.store.serializerFor(modelName);
    let result = serializer.normalizeResponse(
      this.store,
      model,
      payload,
      id,
      method
    );
    assert.deepEqual(result, expected);
  });

  test('normalize - multiple records', function (assert) {
    assert.expect(1);

    let id = '1'; //doesn't matter
    let method = 'query';
    let modelName = 'post';

    let payload = {
      data: {
        posts: [
          {
            id: '1',
            title: 'The post title',
          },
          {
            id: '2',
            title: 'The other post title',
          },
        ],
      },
    };

    let expected = {
      data: [
        {
          type: 'post',
          id: '1',
          attributes: {
            title: 'The post title',
          },
          relationships: {},
        },
        {
          type: 'post',
          id: '2',
          attributes: {
            title: 'The other post title',
          },
          relationships: {},
        },
      ],
      included: [],
    };

    let model = this.store.modelFor(modelName);
    let serializer = this.store.serializerFor(modelName);
    let result = serializer.normalizeResponse(
      this.store,
      model,
      payload,
      id,
      method
    );
    assert.deepEqual(result, expected);
  });

  test('normalize - asynchronous relationships', function (assert) {
    assert.expect(1);

    let id = '1';
    let method = 'findRecord';
    let modelName = 'blog';

    let payload = {
      data: {
        blog: {
          id: '1',
          title: 'The blog title',
          postIds: ['3', '4'],
        },
      },
    };

    let expected = {
      data: {
        type: 'blog',
        id: '1',
        attributes: {
          title: 'The blog title',
        },
        relationships: {
          posts: {
            data: [
              { type: 'post', id: '3' },
              { type: 'post', id: '4' },
            ],
          },
        },
      },
      included: [],
    };

    let model = this.store.modelFor(modelName);
    let serializer = this.store.serializerFor(modelName);
    let result = serializer.normalizeResponse(
      this.store,
      model,
      payload,
      id,
      method
    );
    assert.deepEqual(result, expected);
  });

  test('normalize - synchronous relationships', function (assert) {
    assert.expect(1);

    let id = '1';
    let method = 'findRecord';
    let modelName = 'user';

    let payload = {
      data: {
        user: {
          id: '1',
          name: 'Dan Brown',
          profile: {
            id: '1',
            age: 45,
            addresses: [
              {
                id: '1',
                city: 'New York, NY',
              },
              {
                id: '2',
                city: 'Boston, MA',
              },
            ],
          },
        },
      },
    };

    let expected = {
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Dan Brown' },
        relationships: {
          profile: {
            data: { type: 'profile', id: '1' },
          },
        },
      },
      included: [
        {
          type: 'profile',
          id: '1',
          attributes: { age: 45 },
          relationships: {
            addresses: {
              data: [
                { type: 'address', id: '1' },
                { type: 'address', id: '2' },
              ],
            },
          },
        },
        {
          type: 'address',
          id: '1',
          attributes: {
            city: 'New York, NY',
          },
          relationships: {},
        },
        {
          type: 'address',
          id: '2',
          attributes: {
            city: 'Boston, MA',
          },
          relationships: {},
        },
      ],
    };

    let model = this.store.modelFor(modelName);
    let serializer = this.store.serializerFor(modelName);
    let result = serializer.normalizeResponse(
      this.store,
      model,
      payload,
      id,
      method
    );
    assert.deepEqual(result, expected);
  });

  test('normalize - meta', function (assert) {
    assert.expect(1);

    let id = '1';
    let method = 'query';
    let modelName = 'post';

    let payload = {
      data: {
        posts: [
          {
            id: '1',
            title: 'The post title',
          },
        ],
      },
      meta: {
        total_count: 1,
        total_pages: 1,
        current_page: 1,
      },
    };

    let expected = {
      data: [
        {
          type: 'post',
          id: '1',
          attributes: {
            title: 'The post title',
          },
          relationships: {},
        },
      ],
      included: [],
      meta: {
        total_count: 1,
        total_pages: 1,
        current_page: 1,
      },
    };

    let model = this.store.modelFor(modelName);
    let serializer = this.store.serializerFor(modelName);
    let result = serializer.normalizeResponse(
      this.store,
      model,
      payload,
      id,
      method
    );
    assert.deepEqual(result, expected);
  });

  test('serialize - simple', function (assert) {
    assert.expect(1);

    this.store.push({
      data: {
        type: 'blog',
        id: '1',
        attributes: { title: 'Book reviews' },
        relationships: {
          posts: {
            data: [
              { type: 'post', id: '1' },
              { type: 'post', id: '2' },
            ],
          },
        },
      },
    });

    this.store.push({
      data: [
        {
          type: 'post',
          id: '1',
          attributes: { title: 'Deception Point' },
          relationships: {},
        },
        {
          type: 'post',
          id: '2',
          attributes: { title: 'Angels & Demons' },
          relationships: {},
        },
      ],
    });

    let expected = {
      title: 'Book reviews',
      postIds: ['1', '2'],
    };

    let blog = this.store.peekRecord('blog', 1);
    assert.deepEqual(blog.serialize(), expected);
  });

  test('serialize - extra simple null undefined cases', function (assert) {
    assert.expect(1);

    this.store.push({
      data: {
        type: 'null-undefined',
        id: '1',
        attributes: {
          nullStringField: null,
          undefinedStringField: undefined,
        },
      },
    });

    let expected = {
      nullStringField: null,
      undefinedStringField: null,
    };

    let entity = this.store.peekRecord('null-undefined', 1);
    assert.deepEqual(entity.serialize(), expected);
  });

  test('serialize - complex', function (assert) {
    assert.expect(1);

    this.store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Dan Brown' },
        relationships: {
          profile: {
            data: { type: 'profile', id: '1' },
          },
        },
      },
      included: [
        {
          type: 'profile',
          id: '1',
          attributes: { age: '45' },
          relationships: {
            addresses: {
              data: [
                { type: 'address', id: '1' },
                { type: 'address', id: '2' },
              ],
            },
          },
        },
        {
          type: 'address',
          id: '1',
          attributes: {
            city: 'New York, NY',
          },
          relationships: {},
        },
        {
          type: 'address',
          id: '2',
          attributes: {
            city: 'Boston, MA',
          },
          relationships: {},
        },
      ],
    });

    let expected = {
      name: 'Dan Brown',
      profile: {
        id: '1',
        age: 45,
        addresses: [
          {
            id: '1',
            city: 'New York, NY',
          },
          {
            id: '2',
            city: 'Boston, MA',
          },
        ],
      },
    };

    let user = this.store.peekRecord('user', 1);
    assert.deepEqual(user.serialize(), expected);
  });
});
