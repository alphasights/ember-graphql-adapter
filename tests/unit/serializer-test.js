import { test, module } from 'qunit';
import Serializer from 'ember-graphql-adapter/serializer';
import ModelDouble from '../helpers/model-double';
import StoreDouble from '../helpers/store-double';
import ContainerDouble from '../helpers/container-double';
import SnapshotDouble from '../helpers/snapshot-double';

module('unit:ember-graphql-adapter/serializer');

test ('normalizing simple scalars', function(assert) {
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

test ('normalizing simple scalars in array payload', function(assert) {
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

test('normalizing with relationships', function(assert) {
  let postModel = new ModelDouble('post', ['title', 'body'], ['user']);
  let userModel = new ModelDouble('user', ['email', 'name']);
  let store = new StoreDouble({ 'post': postModel, 'user': userModel });
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
          'name': 'John Bohn'
        }
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
      'relationships': {}
    }]
  };

  assert.deepEqual(serializer.normalizeResponse(store, postModel, payload, '1', 'findRecord'), expectedNormalization);
});


test("serializes json api style data to a query usable as an ArgumentSet", function(assert) {
  let serializer = new Serializer();
  serializer.container = new ContainerDouble({
    'transform:string': { serialize: function(v) { return v; } }
  });

  let expected = {
    'title': 'The title',
    'body': 'The body',
    'author_id': '1'
  };

  let projectAttrs = {
    title: 'The title',
    body: 'The body'
  };

  let projectRels = {
    author: { kind: 'belongsTo', key: 'author', data: { id: '1', modelName: 'user' } }
  };

  assert.deepEqual(serializer.serialize(new SnapshotDouble('project', projectAttrs, projectRels)), expected);
});
