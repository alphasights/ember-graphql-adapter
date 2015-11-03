import { test, module } from 'qunit';
import Generator from 'graphql-adapter/generator';
import * as Type from 'graphql-adapter/types';

module('unit:graphql-adapter/generator');

test('all the things', function(assert) {
  let fieldId = new Type.Field('id');
  let fieldStatus = new Type.Field('status');

  let authorId = new Type.Field('id');
  let authorUsername = new Type.Field('username');
  let authorSet = new Type.SelectionSet(authorId, authorUsername);
  let fieldAuthor = new Type.Field('author', authorSet);

  let postSet = new Type.SelectionSet(fieldId, fieldStatus, fieldAuthor);
  let post = new Type.Field('post', postSet);

  let operationSelectionSet = new Type.SelectionSet(post);
  let operation = new Type.Operation('query', 'postsQuery', operationSelectionSet);

  assert.equal(Generator.generate(operation), 'query postsQuery { post { id  status  author { id  username } } } ');
});
