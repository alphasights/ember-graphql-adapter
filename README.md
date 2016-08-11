# Ember Data GraphQL Adapter

[![Npm Version](https://badge.fury.io/js/ember-graphql-adapter.svg)](http://badge.fury.io/js/ember-graphql-adapter)
[![Code Climate](https://codeclimate.com/repos/56718e7b080d2e007b000e1d/badges/8a110d437cbb217f1924/gpa.svg)](https://codeclimate.com/repos/56718e7b080d2e007b000e1d/feed)
[![Circle CI](https://circleci.com/gh/alphasights/ember-graphql-adapter/tree/master.svg?style=shield&circle-token=b7ad9e9231130c64c6f7bf0e9a7f870cea9ca8e4)](https://circleci.com/gh/alphasights/ember-graphql-adapter/tree/master)
[![Ember Observer Score](http://emberobserver.com/badges/ember-graphql-adapter.svg)](http://emberobserver.com/addons/ember-graphql-adapter)

A  Ember CLI adapter for using GraphQL with Ember Data.

## Installation

`ember install ember-graphql-adapter`

## Usage

Create your adapter first

```js
// app/adapters/post.js
import GraphQLAdapter from 'ember-graphql-adapter';

export default GraphQLAdapter.extend({
  endpoint: `${EmberENV.apiBaseUrl}/graph`
});
```

Now define your serializer

```js
// app/serializers/post.js
import { Serializer } from 'ember-graphql-adapter';

export default Serializer.extend({});
```

And you're done!

## Features

* Queries and mutations are automatically generated for you
* Field aliases are supported
* Belongs to relationships are fully supported
* Has many relationships are fully supported
* Async relationships and request coalescing is supported with `coalesceFindRequests: true`

## Rails Example

By using the fantastic [graphql](https://github.com/rmosolgo/graphql-ruby) gem,
you can expose your relational database as a GraphQL endpoint.

We start by creating a new type

```ruby
# app/models/graph/post_type.rb
module Graph
  PostType = GraphQL::ObjectType.define do
    name "Post"
    description "A post"

    field :id, types.ID
    field :name, types.String
  end
end
```

Then we create the query type

```ruby
# app/models/graph/query_type.rb
module Graph
  QueryType = GraphQL::ObjectType.define do
    name "Query"
    description "The query root of this schema"

    field :post do
      type PostType
      argument :id, !types.ID, "The ID of the post"
      resolve -> (obj, args, ctw) do
        Post.find(args[:id])
      end
    end
  end
end
```

After that, it's time for the mutation type

```ruby
# app/models/graph/mutation_type.rb
module Graph
  MutationType = GraphQL::ObjectType.define do
    name "Mutation"
    description "Mutations"

    field :postCreate do
      type PostType
      argument :name, !types.String, "The post name"
      resolve -> (obj, args, ctw) do
        Post.create(name: args[:name])
      end
    end
  end
end
```

Now, we can build the whole schema

```ruby
# app/models/graph/schema.rb
module Graph
  Schema = GraphQL::Schema.new(
    query: Graph::QueryType,
    mutation: Graph::MutationType
  )
end
```

In the controller we just delegate to the GraphQL schema

```ruby
# app/controllers/graph_controller.rb
class GraphController < ApplicationController
  def index
    render json: ::Graph::Schema.execute(
      params.fetch("query"),
      context: {} # you can pass the current_user here
    )
  end
end
```

Finally, we just expose the GraphQL endpoint in the route

```ruby
# config/routes.rb
get 'graph', to: 'graph#index'
```

And that's it!

## Developing

### Installation

* `git clone https://github.com/alphasights/ember-graphql-adapter.git`
* `npm install && bower install`

### Running

* `ember server`

### Running Tests

* `ember test --server`

### Building

* `ember build`
