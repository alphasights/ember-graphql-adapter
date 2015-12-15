import { test, module } from 'qunit';
import Generator from 'ember-graphql-adapter/generator';
import * as Type from 'ember-graphql-adapter/types';

module('unit:ember-graphql-adapter/generator');

test('all the things', function(assert) {
  let fieldId = new Type.Field('id');
  let fieldStatus = new Type.Field('status');

  let authorId = new Type.Field('id');
  let authorUsername = new Type.Field('username');
  let authorSelectionSet = new Type.SelectionSet(authorId, authorUsername);
  let fieldAuthor = new Type.Field('author', null, new Type.ArgumentSet(), authorSelectionSet);

  let postSelectionSet = new Type.SelectionSet(fieldId, fieldStatus, fieldAuthor);
  let postArgumentSet = new Type.ArgumentSet(
    new Type.Argument('ids', [1,2,3]),
    new Type.Argument('status', 'active'),
    new Type.Argument('embedded', new Type.ArgumentSet(new Type.Argument('id', 1))),
    new Type.Argument('limit', 10),
    new Type.Argument('offset', 0)
  );
  let post = new Type.Field('post', 'postAlias', postArgumentSet, postSelectionSet);

  let operationSelectionSet = new Type.SelectionSet(post);
  let operationArgumentSet = new Type.ArgumentSet();
  let operation = new Type.Operation('query', 'postsQuery', operationArgumentSet, operationSelectionSet);

  assert.equal(Generator.generate(operation), `query postsQuery { postAlias: post(ids: [1,2,3], status: "active", embedded: { id: 1 }, limit: 10, offset: 0) { id  status  author { id  username } } } `);
});
