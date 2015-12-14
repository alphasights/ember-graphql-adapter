import { Adapter, Serializer } from 'graphql-adapter';

export default {
  name: 'graphql-adapter',
  initialize: function() {
    var application = arguments[1] || arguments[0];
    application.register('adapter:-graphql', Adapter);
    application.register('serializer:-graphql', Serializer);
  }
};
