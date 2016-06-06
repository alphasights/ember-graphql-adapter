import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';
import {module, test} from 'qunit';
import Serializer from 'ember-graphql-adapter';

let run = Ember.run;
let env, store;
let Author, Profile, Post;
let author;

module("integration/serializer - GraphQL serializer", {
  beforeEach() {
    Post = DS.Model.extend({
      title: DS.attr('string')
    });

    Author = DS.Model.extend({
      name: DS.attr('string'),
      authorProfile: DS.belongsTo('profile'),
      publishedBooks: DS.hasMany('post')
    });

    Profile = DS.Model.extend({
      age: DS.attr('number')
    });

    env = setupStore({
      serializer: Serializer.extend({}),
      post: Post,
      author: Author,
      profile: Profile
    });

    store = env.store;

    run(function() {
      store.push({
        data: {
          type: 'post',
          id: '1',
          attributes: { title: 'Deception Point' },
          relationships: {}
        }
      });

      store.push({
        data: {
          type: 'profile',
          id: '1',
          attributes: { age: '45' },
          relationships: {}
        }
      });

      let post = store.peekRecord('post', 1);
      let authorProfile = store.peekRecord('profile', 1);
      author = store.createRecord('author', { name: 'Dan Brown', authorProfile });
      author.get('publishedBooks').pushObject(post);
    });
  }
});

test('serializes json api style data to a query usable as an ArgumentSet', function(assert) {
  assert.expect(1);

  let expected = {
    'name': 'Dan Brown',
    'authorProfile': '1',
    'publishedBooks': ['1']
  };

  run(function() {
    assert.deepEqual(author.serialize(), expected);
  });
});
