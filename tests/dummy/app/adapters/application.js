import GraphQLAdapter from 'ember-graphql-adapter';

export default class ApplicationAdapter extends GraphQLAdapter {
  endpoint = '/graph';
}
