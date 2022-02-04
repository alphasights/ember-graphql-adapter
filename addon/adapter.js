import { join } from '@ember/runloop';
import { Promise as EmberPromise } from 'rsvp';
import { camelize } from '@ember/string';
import Adapter from '@ember-data/adapter';
import { InvalidError } from '@ember-data/adapter/error';
import Compiler from './compiler';
import { inject as service } from '@ember/service';
import { pluralize } from 'ember-inflector';

export default class GraphqlAdapter extends Adapter {
  @service fetch;

  endpoint = null;
  httpMethod = 'GET';
  param = 'query';
  defaultSerializer = '-graphql';
  coalesceFindRequests = false;

  /**
    This function controls the normalization of all compound words.

    @method normalizeCase
    @param {String} string
    @return {String} string
  */
  normalizeCase(string) {
    return camelize(string);
  }

  /**
    Normalizes query parameters to avoid ParseErrors on the server side.

    @method normalizeQuery
    @param {Object} query
    @return {Object} normalized query
  */
  normalizeQuery(query) {
    let normalizedQuery = {};

    Object.keys(query).forEach((key) => {
      let value = query[key];

      if (typeof value === 'string') {
        normalizedQuery[key] = value
          .replace(/\\/g, '\\\\')
          .replace(/\"/g, '\\"'); //eslint-disable-line no-useless-escape
      } else {
        normalizedQuery[key] = value;
      }
    });

    return normalizedQuery;
  }

  /**
    Called by the store in order to fetch the JSON for a given
    type and ID.

    The `findRecord` method makes an Ajax request to the GraphQL
    endpoint, and returns a promise for the resulting payload.

    @method findRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {String} id
    @return {Promise} promise
  */
  findRecord(store, type, id) {
    let operationName = this.normalizeCase(type.modelName);

    return this.request(store, type, {
      operationName: operationName,
      operationType: 'query',
      parseSelectionSet: true,
      rootFieldName: operationName,
      rootFieldQuery: { id: id },
    });
  }

  /**
    Called by the store in order to fetch a JSON array for all
    of the records for a given type.

    The `findAll` method makes an Ajax request to the GraphQL
    endpoint, and returns a promise for the resulting payload.

    @method findAll
    @param {DS.Store} store
    @param {DS.Model} type
    @return {Promise} promise
  */
  findAll(store, type) {
    let operationName = this.normalizeCase(pluralize(type.modelName));

    return this.request(store, type, {
      operationName: operationName,
      operationType: 'query',
      parseSelectionSet: true,
      rootFieldName: operationName,
    });
  }

  /**
    Called by the store in order to fetch JSON for
    the records that match a particular query.

    The `query` method makes an Ajax request to the GraphQL
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
  query(store, type, query) {
    let operationName = this.normalizeCase(pluralize(type.modelName));

    return this.request(store, type, {
      operationName: operationName,
      operationType: 'query',
      parseSelectionSet: true,
      rootFieldName: operationName,
      rootFieldQuery: this.normalizeQuery(query),
    });
  }

  /**
    Called by the store in order to fetch JSON for a single record that
    matches a particular query.

    The `query` method makes an Ajax request to the GraphQL
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
  queryRecord(store, type, query) {
    let operationName = this.normalizeCase(type.modelName);

    return this.request(store, type, {
      operationName: operationName,
      operationType: 'query',
      parseSelectionSet: true,
      rootFieldName: operationName,
      rootFieldQuery: this.normalizeQuery(query),
    });
  }

  /**
    Called by the store in order to fetch several records together if `coalesceFindRequests` is true

    @method findMany
    @param {DS.Store} store
    @param {DS.Model} type
    @param {Array} ids
    @return {Promise} promise
  */
  findMany(store, type, ids) {
    let operationName = this.normalizeCase(pluralize(type.modelName));

    return this.request(store, type, {
      operationName: operationName,
      operationType: 'query',
      parseSelectionSet: true,
      rootFieldName: operationName,
      rootFieldQuery: { ids: ids },
    });
  }

  saveRecord(store, type, snapshot, options) {
    let data = {};
    let serializer = store.serializerFor(type.modelName);
    let modelName = this.normalizeCase(type.modelName);
    let operationName = this.normalizeCase(modelName + options.action);

    serializer.serializeIntoHash(data, type, snapshot);

    let payload = { id: data['id'] };
    Object.keys(snapshot.changedAttributes()).forEach((key) => {
      let payloadKey = serializer.keyForAttribute(key);
      payload[payloadKey] = data[payloadKey];
    });

    snapshot.eachRelationship((key, { kind, options }) => {
      let payloadKey = serializer.keyForRelationship(key, kind, options);
      payload[payloadKey] = data[payloadKey];
    });

    return this.request(store, type, {
      operationName: operationName,
      operationType: 'mutation',
      parseSelectionSet: true,
      rootFieldAlias: modelName,
      rootFieldName: operationName,
      rootFieldQuery: payload,
    });
  }

  /**
    Called by the store when a newly created record is
    saved via the `save` method on a model record instance.

    @method createRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {DS.Snapshot} snapshot
    @return {Promise} promise
  */
  createRecord(store, type, snapshot) {
    return this.saveRecord(store, type, snapshot, { action: 'Create' });
  }

  /**
    Called by the store when an existing record is saved
    via the `save` method on a model record instance.

    The `updateRecord` method  makes an Ajax request to the GraphQL endpoint.

    @method updateRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {DS.Snapshot} snapshot
    @return {Promise} promise
  */
  updateRecord(store, type, snapshot) {
    return this.saveRecord(store, type, snapshot, { action: 'Update' });
  }

  /**
    Called by the store when a record is deleted.

    The `deleteRecord` method  makes an Ajax request to the GraphQL endpoint.

    @method deleteRecord
    @param {DS.Store} store
    @param {DS.Model} type
    @param {DS.Snapshot} snapshot
    @return {Promise} promise
  */
  deleteRecord(store, type, snapshot) {
    let data = this.serialize(snapshot, { includeId: true });
    let modelName = this.normalizeCase(type.modelName);
    let operationName = this.normalizeCase(`${modelName}Delete`);

    return this.request(store, type, {
      operationName: operationName,
      operationType: 'mutation',
      parseSelectionSet: false,
      rootFieldAlias: modelName,
      rootFieldName: operationName,
      rootFieldQuery: { id: data.id },
    });
  }

  /**
    @method compile
    @private
    @param {DS.Store} store
    @param {DS.Model} type
    @params {Object} options
    @return {String} result
  */
  compile(store, type, options) {
    options['normalizeCaseFn'] = this.normalizeCase;
    return Compiler.compile(type, store, options);
  }

  /**
    @method request
    @private
    @param {DS.Store} store
    @param {DS.Model} type
    @params {Object} options
    @return {Promise} promise
  */
  request(store, type, options) {
    let compiledQuery = this.compile(store, type, options);
    let url = this.endpoint;
    let ajaxOpts = this.ajaxOptions({ query: compiledQuery });

    return this.ajax(url, ajaxOpts);
  }

  /**
    @method ajax
    @private
    @params {Object} options
    @return {Promise} promise
  */
  ajax(url, options) {
    let adapter = this;

    return new EmberPromise((resolve, reject) => {
      return this.fetch.request(url, options).then(
        (response) => {
          const adapterResponse = adapter.handleResponse(null, null, response);

          if (response && adapterResponse.isAdapterError) {
            join(null, reject, response);
          } else {
            join(null, resolve, response);
          }
        },
        (error) => {
          join(null, reject, error);
        }
      );
    });
  }

  /**
    @method parseErrorResponse
    @private
    @param {String} responseText
    @return {Object}
  */
  parseErrorResponse(responseText) {
    var json = responseText;

    try {
      json = JSON.parse(responseText);
    } catch (e) {
      // empty
    }

    return json;
  }

  /**
    @method ajaxOptions
    @private
    @param {String} url
    @return {Object}
  */
  ajaxOptions(data) {
    let opts = {
      dataType: 'json',
      data: data,
      type: this.httpMethod,
      context: this,
    };

    let headers = this.headers;
    if (headers !== undefined) {
      opts.beforeSend = function (xhr) {
        Object.keys(headers).forEach((key) =>
          xhr.setRequestHeader(key, headers[key])
        );
      };
    }

    return opts;
  }

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
  handleResponse(status, headers, payload) {
    if (payload['errors']) {
      return new InvalidError(payload['errors']);
    } else {
      return payload;
    }
  }
}
