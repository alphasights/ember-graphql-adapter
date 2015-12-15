import { Adapter, Serializer } from 'ember-graphql-adapter';

export default {
  name: 'ember-graphql-adapter',
  initialize: function() {
    var application = arguments[1] || arguments[0];
    application.register('adapter:-graphql', Adapter);
    application.register('serializer:-graphql', Serializer);
  }
};
