import { test, module } from 'qunit';
import Serializer from 'graphql-adapter/serializer';
import ModelDouble from '../helpers/model-double';

module('unit:graphql-adapter/serializer');

test ('normalizing simple scalars', function(assert) {
  let postModel = new ModelDouble('post', ['title', 'body']);
  let serializer = new Serializer();

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
    }
  };

  assert.deepEqual(serializer.normalize(postModel, payload['data']), expectedNormalization);
});

test('normalizing with relationships', function(assert) {
  let postModel = new ModelDouble('post', ['title', 'body'], ['user']);
  let serializer = new Serializer();

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
    }
  };

  assert.deepEqual(serializer.normalize(postModel, payload['data']), expectedNormalization);
});
