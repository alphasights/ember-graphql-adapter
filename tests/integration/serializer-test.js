import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';
import {module, test} from 'qunit';

let run = Ember.run;
let env, store;
let Address, Blog, Profile, Post, User;

module("integration/serializer - GraphQL serializer", {
  beforeEach() {
    Address = DS.Model.extend({
      city: DS.attr('string')
    });

    Blog = DS.Model.extend({
      title: DS.attr('string'),
      posts: DS.hasMany('post', { async: true })
    });

    Post = DS.Model.extend({
      title: DS.attr('string')
    });

    Profile = DS.Model.extend({
      age: DS.attr('number'),
      addresses: DS.hasMany('address', { async: false })
    });

    User = DS.Model.extend({
      name: DS.attr('string'),
      profile: DS.belongsTo('profile', { async: false })
    });

    env = setupStore({
      adapter: '-graphql',
      address: Address,
      blog: Blog,
      post: Post,
      profile: Profile,
      user: User
    });

    store = env.store;
  }
});

test('serialize - simple', function(assert) {
  assert.expect(1);

  run(function() {
    store.push({
      data: {
        type: 'blog',
        id: '1',
        attributes: { title: 'Book reviews' },
        relationships: {
          posts: {
            data: [
              { type: 'post', id: '1' },
              { type: 'post', id: '2' }
            ]
          }
        }
      }
    });

    store.push({
      data: [{
        type: 'post',
        id: '1',
        attributes: { title: 'Deception Point' },
        relationships: {}
      }, {
        type: 'post',
        id: '2',
        attributes: { title: 'Angels & Demons' },
        relationships: {}
      }]
    });
  });

  let expected = {
    'title': 'Book reviews',
    'posts': ['1', '2']
  };

  run(function() {
    let blog = store.peekRecord('blog', 1);
    assert.deepEqual(blog.serialize(), expected);
  });
});

test('serialize - complex', function(assert) {
  assert.expect(1);

  run(function() {
    store.push({
      data: {
        type: 'user',
        id: '1',
        attributes: { name: 'Dan Brown' },
        relationships: {
          profile: {
            data: { type: 'profile', id: '1' }
          }
        }
      },
      included: [{
        type: 'profile',
        id: '1',
        attributes: { age: '45' },
        relationships: {
          addresses: {
            data: [
              { type: 'address', id: '1' },
              { type: 'address', id: '2' }
            ]
          }
        }
      }, {
        type: 'address',
        id: '1',
        attributes: {
          city: 'New York, NY'
        },
        relationships: {}
      }, {
        type: 'address',
        id: '2',
        attributes: {
          city: 'Boston, MA'
        },
        relationships: {}
      }]
    });
  });

  let expected = {
    'name': 'Dan Brown',
    'profile': {
      'id': '1',
      'age': 45,
      'addresses': [{
        'id': '1',
        'city': 'New York, NY'
      }, {
        'id': '2',
        'city': 'Boston, MA',
      }]
    }
  };

  run(function() {
    let user = store.peekRecord('user', 1);
    assert.deepEqual(user.serialize(), expected);
  });
});
