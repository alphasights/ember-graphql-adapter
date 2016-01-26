import DS from 'ember-data';
import Ember from 'ember';
import Compiler from './compiler';

export default DS.Adapter.extend({
  endpoint: null,
  param: 'query',
  defaultSerializer: '-graphql',
  coalesceFindRequests: false,

  /**
    Called by the store in order to fetch the JSON for a given
    type and ID.

    The `findRecord` method makes an Ajax (HTTP GET) request to the GraphQL
    endpoint, and returns a promise for the resulting payload.

    @method findRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {String} id
    @return {Promise} promise
  */
  findRecord: function(store, type, id) {
    let operationName = this._normalizeModelName(type.modelName);

    return this.request(store, type, {
      'rootFieldQuery': { 'id': id },
      'rootFieldName': operationName,
      'operationType': 'query',
      'operationName': operationName
    });
  },

  /**
    Called by the store in order to fetch a JSON array for all
    of the records for a given type.

    The `findAll` method makes an Ajax (HTTP GET) request to the GraphQL
    endpoint, and returns a promise for the resulting payload.

    @method findAll
    @param {DS.Store} store
    @param {DS.Model} type
    @return {Promise} promise
  */
  findAll: function(store, type) {
    let operationName = this._normalizeModelName(Ember.String.pluralize(type.modelName));

    let options = {
      'rootFieldName': operationName,
      'operationName': operationName,
      'operationType': 'query'
    };

    return this.request(store, type, options);
  },

  /**
    Called by the store in order to fetch JSON for
    the records that match a particular query.

    The `query` method makes an Ajax (HTTP GET) request to the GraphQL
    endpoint, and returns a promise for the resulting payload.

    The `query` argument is a simple JavaScript object that will be
    passed to the GraphQL compiler and becomes arguments for the
    GraphQL query.

    @method query
    @param {DS.Store} store
    @param {DS.Model} type
    @param {Object} query
    @return {Promise} promise
  */
  query: function(store, type, query) {
    let operationName = this._normalizeModelName(Ember.String.pluralize(type.modelName));

    return this.request(store, type, {
      'rootFieldName': operationName,
      'rootFieldQuery': query,
      'operationType': 'query',
      'operationName': operationName
    });
  },

  /**
    Called by the store in order to fetch JSON for a single record that
    matches a particular query.

    The `query` method makes an Ajax (HTTP GET) request to the GraphQL
    endpoint, and returns a promise for the resulting payload.

    The `query` argument is a simple JavaScript object that will be
    passed to the GraphQL compiler and becomes arguments for the
    GraphQL query.

    @method queryRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {Object} query
    @return {Promise} promise
  */
  queryRecord: function(store, type, query) {
    let operationName = this._normalizeModelName(type.modelName);

    return this.request(store, type, {
      'rootFieldName': operationName,
      'rootFieldQuery': query,
      'operationType': 'query',
      'operationName': operationName
    });
  },

  /**
    Called by the store in order to fetch several records together if `coalesceFindRequests` is true

    @method findMany
    @param {DS.Store} store
    @param {DS.Model} type
    @param {Array} ids
    @return {Promise} promise
  */
  findMany(store, type, ids) {
    let operationName = this._normalizeModelName(Ember.String.pluralize(type.modelName));

    return this.request(store, type, {
      'rootFieldQuery': { 'ids': ids },
      'rootFieldName': operationName,
      'operationType': 'query',
      'operationName': operationName
    });
  },

  /**
    Called by the store when a newly created record is
    saved via the `save` method on a model record instance.

    @method createRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {DS.Snapshot} snapshot
    @return {Promise} promise
  */
  createRecord: function(store, type, snapshot) {
    let data = {};
    let serializer = store.serializerFor(type.modelName);
    let operationName = this._normalizeModelName(type.modelName);

    serializer.serializeIntoHash(data, type, snapshot);

    return this.request(store, type, {
      'rootFieldQuery': data,
      'rootFieldAlias': operationName,
      'rootFieldName': operationName + 'Create',
      'operationType': 'mutation',
      'operationName': operationName + 'Create'
    });
  },

  /**
    Called by the store when an existing record is saved
    via the `save` method on a model record instance.

    The `updateRecord` method  makes an Ajax (HTTP GET) request to the GraphQL endpoint.

    @method updateRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {DS.Snapshot} snapshot
    @return {Promise} promise
  */
  updateRecord: function(store, type, snapshot) {
    let data = {};
    let serializer = store.serializerFor(type.modelName);
    let operationName = this._normalizeModelName(type.modelName);

    serializer.serializeIntoHash(data, type, snapshot);

    // I don't think this changeset thing will work if you update relations
    let payload = { id: data['id'] };
    Object.keys(snapshot.changedAttributes()).forEach((key) => {
      payload[key] = data[key];
    });

    return this.request(store, type, {
      'rootFieldQuery': payload,
      'rootFieldAlias': operationName,
      'rootFieldName': operationName + 'Update',
      'operationType': 'mutation',
      'operationName': operationName + 'Update'
    });
  },

  /**
    Called by the store when a record is deleted.

    The `deleteRecord` method  makes an Ajax (HTTP GET) request to the GraphQL endpoint.

    @method deleteRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {DS.Snapshot} snapshot
    @return {Promise} promise
  */
  deleteRecord: function(store, type, snapshot) {
    let data = this.serialize(snapshot, { includeId: true });
    let operationName = this._normalizeModelName(type.modelName);

    return this.request(store, type, {
      'rootFieldName': operationName + 'Delete',
      'rootFieldAlias': operationName,
      'rootFieldQuery': { 'id': data.id },
      'operationType': 'mutation',
      'operationName': operationName + 'Delete'
    });
  },

  /**
    @method compile
    @private
    @param {DS.Store} store
    @param {DS.Model} type
    @params {Object} options
    @return {String} result
  */
  compile: function(store, type, options) {
    return Compiler.compile(type, store, options);
  },

  /**
    @method request
    @private
    @param {DS.Store} store
    @param {DS.Model} type
    @params {Object} options
    @return {Promise} promise
  */
  request: function(store, type, options) {
    let compiledQuery = this.compile(store, type, options);
    let url = this.endpoint;
    let ajaxOpts = this.ajaxOptions(url, { query: compiledQuery });

    return this.ajax(ajaxOpts);
  },

  /**
    @method ajax
    @private
    @params {Object} options
    @return {Promise} promise
  */
  ajax: function(options) {
    let adapter = this;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      options.success = function(payload, textStatus, jqXHR) {
        let response;

        if (!(response instanceof DS.AdapterError)) {
          response = adapter.handleResponse(
            jqXHR.status,
            parseResponseHeaders(jqXHR.getAllResponseHeaders()),
            response || payload,
            options
          );
        }

        if (response instanceof DS.AdapterError) {
          Ember.run(null, reject, response);
        } else {
          Ember.run(null, resolve, response);
        }
      };

      options.error = function(jqXHR, textStatus, errorThrown) {
        let error;

        if (!(error instanceof DS.Error)) {
          if (errorThrown instanceof Error) {
            error = errorThrown;
          } else if (textStatus === 'timeout') {
            error = new DS.TimeoutError();
          } else if (textStatus === 'abort') {
            error = new DS.AbortError();
          } else {
            error = adapter.handleResponse(
              jqXHR.status,
              parseResponseHeaders(jqXHR.getAllResponseHeaders()),
              adapter.parseErrorResponse(jqXHR.responseText) || errorThrown,
              options
            );
          }
        }

        Ember.run(null, reject, error);
      };

      Ember.$.ajax(options);
    }, `GraphQLAdapter#ajax to '${options.url}' with query '${options.data.query}'`);
  },

  /**
    @method ajaxOptions
    @private
    @param {String} url
    @return {Object}
  */
  ajaxOptions: function(url, data) {
    let opts =  {
      'url': url,
      'dataType': 'json',
      'data': data,
      'type': 'GET',
      'context': this
    };

    let headers = Ember.get(this, 'headers');
    if (headers !== undefined) {
      opts.beforeSend = function (xhr) {
        Object.keys(headers).forEach((key) =>  xhr.setRequestHeader(key, headers[key]));
      };
    }

    return opts;
  },

  /**
    Takes an ajax response, and returns the json payload or an error.
    By default this hook just returns the json payload passed to it.

    You might want to override it in two cases:
    1. Your API might return useful results in the response headers.
    Response headers are passed in as the second argument.
    2. Your API might return errors as successful responses with status code
    200 and an Errors text or object. You can return a `DS.InvalidError` or a
    `DS.AdapterError` (or a sub class) from this hook and it will automatically
    reject the promise and put your record into the invalid or error state.

    Returning a `DS.InvalidError` from this method will cause the
    record to transition into the `invalid` state and make the
    `errors` object available on the record. When returning an
    `DS.InvalidError` the store will attempt to normalize the error data
    returned from the server using the serializer's `extractErrors`
    method.

    @method handleResponse
    @param  {Number} status
    @param  {Object} headers
    @param  {Object} payload
    @param  {Object} options
    @return {Object | DS.AdapterError} response
  */
  handleResponse: function(status, headers, payload) {
    if (payload['errors']) {
      return new DS.InvalidError(payload['errors'].map((error) => { return error.message; }));
    } else {
      return payload;
    }
  },

  _normalizeModelName: function(modelName) {
    return Ember.String.camelize(modelName);
  }
});

function parseResponseHeaders(headerStr) {
  let headers = {};
  if (!headerStr) { return headers; }

  let headerPairs = headerStr.split('\u000d\u000a');

  for (let i = 0; i < headerPairs.length; i++) {
    let headerPair = headerPairs[i];
    // Can't use split() here because it does the wrong thing
    // if the header value has the string ": " in it.
    let index = headerPair.indexOf('\u003a\u0020');

    if (index > 0) {
      let key = headerPair.substring(0, index);
      let val = headerPair.substring(index + 2);
      headers[key] = val;
    }
  }

  return headers;
}
