import { test, module } from 'qunit';
import Serializer from 'ember-graphql-adapter/serializer';
import ModelDouble from '../helpers/model-double';
import StoreDouble from '../helpers/store-double';

module('unit:ember-graphql-adapter/serializer');

test('normalizing simple scalars', function(assert) {
  let postModel = new ModelDouble('post', ['title', 'body']);
  let store = new StoreDouble({ 'post': postModel });
  let serializer = new Serializer();
  serializer.store = store;

  let payload = {
    'data': {
      'post': {
        'id': '1',
        'title': 'The post title',
        'body': 'The body title',
      }
    }
  };

  let expectedNormalization = {
    'data': {
      'type': 'post',
      'id': '1',
      'attributes': {
        'title': 'The post title',
        'body': 'The body title',
      },
      'relationships': {}

    },
    'included': []
  };

  assert.deepEqual(serializer.normalizeResponse(store, postModel, payload, '1', 'findRecord'), expectedNormalization);
});

test('normalizing simple scalars in array payload', function(assert) {
  let postModel = new ModelDouble('post', ['title', 'body']);
  let store = new StoreDouble({ 'post': postModel });
  let serializer = new Serializer();
  serializer.store = store;

  let payload = {
    'data': {
      'posts': [{
        'id': '1',
        'title': 'The post title',
        'body': 'The body title'
      }, {
        'id': '2',
        'title': 'The other post title',
        'body': 'The other body title'
      }]
    }
  };

  let expectedNormalization = {
    'data': [{
      'type': 'post',
      'id': '1',
      'attributes': {
        'title': 'The post title',
        'body': 'The body title',
      },
      'relationships': {}
    }, {
      'type': 'post',
      'id': '2',
      'attributes': {
        'title': 'The other post title',
        'body': 'The other body title',
      },
      'relationships': {}
    }],
    'included': []
  };

  assert.deepEqual(serializer.normalizeResponse(store, postModel, payload, '1', 'query'), expectedNormalization);
});

test('normalizing with asynchronous relationships', function(assert) {
  let postModel = new ModelDouble('post', ['title', 'body'], [
    ['user', { kind: 'belongsTo', type: 'user', options: { async: true }}],
    ['comments', { kind: 'hasMany', type: 'comment', options: { async: true }}]
  ]);
  let userModel = new ModelDouble('user', ['email', 'name']);
  let commentModel = new ModelDouble('comment', ['body']);
  let store = new StoreDouble({ 'post': postModel, 'user': userModel, 'comment': commentModel });
  let serializer = new Serializer();
  serializer.store = store;

  let payload = {
    'data': {
      'post': {
        'id': '1',
        'title': 'The post title',
        'body': 'The body title',
        'userId': '2',
        'commentIds': ['3', '4']
      }
    }
  };

  let expectedNormalization = {
    'data': {
      'type': 'post',
      'id': '1',
      'attributes': {
        'title': 'The post title',
        'body': 'The body title',
      },
      'relationships': {
        'user': {
          'data': {
            'type': 'user',
            'id': '2'
          }
        },
        'comments': {
          'data': [
            { 'type': 'comment', 'id': '3' },
            { 'type': 'comment', 'id': '4' }
          ]
        }
      }
    },
    'included': []
  };

  assert.deepEqual(serializer.normalizeResponse(store, postModel, payload, '1', 'findRecord'), expectedNormalization);
});

test('normalizing with synchronous relationships', function(assert) {
  let postModel = new ModelDouble('post', ['title', 'body'], [
    ['user', { kind: 'belongsTo', type: 'user', options: { async: false }}],
    ['comments', { kind: 'hasMany', type: 'comment', options: { async: false }}]
  ]);
  let userModel = new ModelDouble('user', ['email', 'name'], [
    ['profile', { kind: 'belongsTo', type: 'profile', options: { async: false }}],
    ['places', { kind: 'hasMany', type: 'place', options: { async: false }}]
  ]);
  let commentModel = new ModelDouble('comment', ['body'], [
    ['replies', { kind: 'hasMany', type: 'reply', options: { async: false }}]
  ]);
  let profileModel = new ModelDouble('profile', ['age']);
  let placeModel = new ModelDouble('place', ['street', 'city', 'country']);
  let replyModel = new ModelDouble('reply', ['body']);
  let store = new StoreDouble({ 'post': postModel, 'user': userModel, 'comment': commentModel, 'place': placeModel, 'reply': replyModel, 'profile': profileModel });
  let serializer = new Serializer();
  serializer.store = store;

  let payload = {
    'data': {
      'post': {
        'id': '1',
        'title': 'The post title',
        'body': 'The body title',
        'user': {
          'id': '2',
          'email': 'jjbohn@gmail.com',
          'name': 'John Bohn',
          'profile': {
            'id': '11',
            'age': '30'
          },
          'places': [{
            'id': '5',
            'street': 'Park Avenue',
            'city': 'New York, NY',
            'country': 'United States'
          }, {
            'id': '6',
            'street': 'New Hope Road',
            'city': 'Raleigh, NC',
            'country': 'United States'
          }]
        },
        'comments': [{
          'id': '3',
          'body': 'The first comment body',
          'replies': [{
            'id': '7',
            'body': 'The first reply to the first comment'
          }, {
            'id': '8',
            'body': 'The second reply to the first comment'
          }]
        }, {
          'id': '4',
          'body': 'The second comment body',
          'replies': [{
            'id': '9',
            'body': 'The first reply to the second comment'
          }, {
            'id': '10',
            'body': 'The second reply to the second comment'
          }]
        }]
      }
    }
  };

  let expectedNormalization = {
    'data': {
      'type': 'post',
      'id': '1',
      'attributes': {
        'title': 'The post title',
        'body': 'The body title',
      },
      'relationships': {
        'user': {
          'data': {
            'type': 'user',
            'id': '2'
          }
        },
        'comments': {
          'data': [
            { 'type': 'comment', 'id': '3' },
            { 'type': 'comment', 'id': '4' }
          ]
        }
      }
    },
    'included': [{
      'type': 'user',
      'id': '2',
      'attributes': {
        'email': 'jjbohn@gmail.com',
        'name': 'John Bohn'
      },
      'relationships': {
        'places': {
          'data': [
            { 'type': 'place', 'id': '5' },
            { 'type': 'place', 'id': '6' }
          ]
        },
        'profile': {
          'data': { 'type': 'profile', 'id': '11' }
        }
      }
    }, {
      'type': 'profile',
      'id': '11',
      'attributes': {
        'age': '30'
      },
      'relationships': {}
    }, {
      'type': 'place',
      'id': '5',
      'attributes': {
        'street': 'Park Avenue',
        'city': 'New York, NY',
        'country': 'United States'
      },
      'relationships': {}
    }, {
      'type': 'place',
      'id': '6',
      'attributes': {
        'street': 'New Hope Road',
        'city': 'Raleigh, NC',
        'country': 'United States'
      },
      'relationships': {}
    }, {
      'type': 'comment',
      'id': '3',
      'attributes': {
        'body': 'The first comment body'
      },
      'relationships': {
        'replies': {
          'data': [
            { 'type': 'reply', 'id': '7' },
            { 'type': 'reply', 'id': '8' }
          ]
        }
      }
    }, {
      'type': 'reply',
      'id': '7',
      'attributes': {
        'body': 'The first reply to the first comment'
      },
      'relationships': {}
    }, {
      'type': 'reply',
      'id': '8',
      'attributes': {
        'body': 'The second reply to the first comment'
      },
      'relationships': {}
    }, {
      'type': 'comment',
      'id': '4',
      'attributes': {
        'body': 'The second comment body'
      },
      'relationships': {
        'replies': {
          'data': [
            { 'type': 'reply', 'id': '9' },
            { 'type': 'reply', 'id': '10' }
          ]
        }
      }
    }, {
      'type': 'reply',
      'id': '9',
      'attributes': {
        'body': 'The first reply to the second comment'
      },
      'relationships': {}
    }, {
      'type': 'reply',
      'id': '10',
      'attributes': {
        'body': 'The second reply to the second comment'
      },
      'relationships': {}
    }]
  };

  assert.deepEqual(serializer.normalizeResponse(store, postModel, payload, '1', 'findRecord'), expectedNormalization);
});
