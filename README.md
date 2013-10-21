# Backbone Caching Sync

An extension to [Backbone] providing localStorage caching for Backbone sync operations

## Introduction

Backbone by default persists models/collections to the server by making RESTful JSON requests. It also makes it easy to implement alternative storage layers by simply overriding the `sync` function in your models/collections. Several alternative implementations exist for instance using MongoDB or XMPP PubSub.

Backbone.cachingSync does not provide a new storage. It merely caches sync operations in the browser's localStorage allowing you to have a readily available cache while still using the sync of your choice.

## Usage

In order to decorate your original sync function with caching capabilities, you simply wrap it in an instance of **Backbone.cachingSync**. So for example, assuming you had a collection `MyCollection` using the default `Backbone.sync()` you would:

```javascript
var MyModel = Backbone.Model.extend({

    sync: Backbone.cachingSync(Backbone.sync, 'mystuff'),

});

var MyCollection = Backbone.Collection.extend({

    model: MyModel,
    sync: Backbone.cachingSync(Backbone.sync, 'mystuff'),
    ...
});
```

**Backbone.cachingSync** takes as parameters `wrapped` the sync function you are decorating, and optionally `ns` a namespace to be used when composing localStorage keys for the cache and `ttl` the time-to-live of your cache in minutes (defaults to infinity).

Note that in order for it to work, your original sync function is expected to return for every operation a jQuery *promise*. The default Backbone sync is doing that already since it relies on `jQuery.ajax()`.

## Behavior

Backbone.cachingSync behaves as follows for the CRUD sync operations:

* On `create` it will resolve as soon as the server-side sync resolves caching the model to localStorage.
* On `read` if the model/collection already exists in the cache will resolve immediately returning the cached version. When the server-side sync resolves new data will be set on the model(s) triggering `change` events if necessary.
* On `update` it will immediately update the cache and resolve when the server-side resolves. If the server-side update fails it will revert the cache.
* On `delete` it will immediately remove the model from the cache and resolve when the server-side resolves. If the server-side deletion fails it will restore the model in the cache.

## AMD-loading

Backbone.cachingSync supports AMD loaders such as [require.js]. Since Underscore and Backbone do not have built-in support for AMD, you will need to provide a `shim`. For instance in your `require.config` you should have:

```javascript
shim: {
    backbone: {
        deps: ['underscore', 'jquery'],
        exports: "Backbone"
    },

    underscore: {
        exports: '_'
    },
    ...
}
```

## Dependencies

Backbone.cachingSync depends on [burry.js], a memcache-like localStorage cache, and jQuery.

## License

Backbone.cachingSync is Copyright (C) 2012 Yiorgis Gozadinos, Crypho AS
It is distributed under the MIT license.

[Backbone]: http://documentcloud.github.com/backbone
[require.js]: http://requirejs.org/
[burry.js]: http://github.com/ggozad/burry.js
