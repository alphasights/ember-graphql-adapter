import { test, module } from 'qunit';
import Ember from 'ember';
import ModelDouble from '../helpers/model-double';
import Serializer from 'graphql-adapter/serializer';

module('unit:graphql-adapter/serializer');

// test('takes a model and a resource hash and converts graphql style single relationship responses to json-api style', function(assert) {
//   let model = new ModelDouble('project', ['name'], ['client'])
//   let hash = {
//     'name': 'Project name',
//     'client': {
//       'id': 1
//     }
//   };

//   let serializer = new Serializer();
//   let normalized = serializer.normalize(model, hash);
//   assert.deepEqual(normalized, {
//     'name': 'Project name',
//     'client': '1'
//   });
// });
