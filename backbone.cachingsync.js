//    Backbone.cachingSync v0.1.0

//    (c) 2012 Yiorgis Gozadinos, Crypho AS.
//    Backbone.cachingSync is distributed under the MIT license.
//    http://github.com/ggozad/Backbone.cachingSync

// AMD/global registrations
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'underscore', 'backbone', 'burry'], function ($, _, Backbone, Burry) {
            return (root.Backbone.cachingSync = factory($, _, Backbone, Burry));
        });
    } else {
        // Browser globals
        root.Backbone.cachingSync = factory(root.$, root._, root.Backbone, root.Burry);
    }
}(this, function ($, _, Backbone, Burry) {

    // **Backbone.cachingSync** provides `localStorage` caching for your models/collections.
    // In order to use it assign your model/collection's **sync** function to a wrapped
    // version. For instance `Collection.sync = Backbone.cachingSync(Backbone.sync, 'mycollection');`
    // will cache sync operations in the `mycollection` localStorage store.
    // Parameters are: `wrapped` the original sync function you are wrapping,
    // `ns`, the namespace you want your Store to have,
    // `default_ttl`, a default time-to-live for the cache in minutes.
    var cachingSync = function (wrapped, ns, default_ttl, maintain_own_ids) {

        // Create the `Burry.Store`
        var burry = new Burry.Store(ns, default_ttl);

        // **get** caches *read* operations on a model. If the model is cached,
        // it will resolve immediately with the updated attributes, triggering a `change`
        // event when the server *read* gets resolved. If no cache exists, the operation resolves
        // normally (i.e. when the server *read* resolves).
        function get (model, options) {
            var item = burry.get(model.id),
                d = $.Deferred(),
                updated = {},
                wp;

            wp = wrapped('read', model, options).done(function (attrs) {
                model.set(attrs);
                burry.set(model.id, model.toJSON());
            });

            if (typeof item !== 'undefined') {
                _.each(item, function (value, key) {
                    if (model.get(key) !== value) updated[key] = value;
                });
                d.resolve(updated);
            } else {
                wp.done(d.resolve).fail(d.reject);
            }

            return d.promise();
        }

        // **gets** behaves similarly to **get** except it applies to collections.
        function gets (collection, options) {
            var ids = burry.get('__ids__'),
                d = $.Deferred(),
                wp;

            wp = wrapped('read', collection, options).done(function (models) {
                options.fromServer = true;
                _.each(models, function (model) { burry.set(model.id, model); });

                if (!maintain_own_ids) {
                  burry.set('__ids__', _.pluck(models, 'id'));
                }
                else {
                  collection.trigger('set_cache_ids');
                }

                // Respect the fetch "update" option.
                if (options.update) {
                  collection.update(models, options);
                }
                else {
                  collection.reset(models, options);
                }
            });

            if (typeof ids !== 'undefined') {
                d.resolve(_.map(ids, function (id) {
                    json = burry.get(id);
                    json.id = id;
                    return json;
                }));
            } else {
                wp.done(d.resolve).fail(d.reject);
            }

            return d.promise();
        }

        // **create** saves a model on the server, and when the server save is resolved,
        // the model (and potentially its collection) is cached.
        function create (model, options) {
            return wrapped('create', model, options)
                .done(function () {
                    burry.set(model.id, model.attributes);
                    if (model.collection)
                        if (!maintain_own_ids) {
                          burry.set('__ids__', _(model.collection.models).chain()
                              .pluck('id')
                              .union([model.id])
                              .without(undefined).value());
                        }
                        else {
                          model.collection.trigger('set_cache_ids');
                        }

                }).promise();
        }

        // **update** resolves immediately by caching the model. Additionally it calls the wrapped sync
        // to perform a server-side save, which if it fails reverts the cache.
        function update (model, options) {
            var old = burry.get(model.id);
            burry.set(model.id, model.attributes);
            return wrapped('update', model, options)
                .fail(function () {
                    if (old) {
                        burry.set(model.id, old);
                    } else {
                        burry.remove(model.id);
                    }
                })
                .promise();
        }

        // **destroy** removes immediately the model from the cache. Additionally it calls the wrapped sync
        // to perform a server-side delete, which if it fails reverts the cache.
        function destroy (model, options) {
            var old = burry.get(model.id);
            burry.remove(model.id);
            return wrapped('destroy', model, options)
                .fail(function () { if (old) burry.set(model.id, old); })
                .promise();
        }

        // The actual wrapping sync function
        return function (method, model, options) {
            var p;

            // Give access to the cache on the implementing collection.
            this.burry = burry;

            options = options || {};
            switch (method) {
                case 'read':    p = typeof model.id !== 'undefined' ? get(model, options) : gets(model, options); break;
                case 'create':  p = create(model, options); break;
                case 'update':  p = update(model, options); break;
                case 'delete':  p = destroy(model, options); break;
            }

            // Fallback for old-style callbacks.
            if (options.success) p.done(options.success);
            if (options.error) p.fail(options.error);

            // In order to distinguish in our fetch success callback between response
            // from the server and cache, now that the cache callback has returned,
            // set on options that the next response is from the server.
            options.fromServer = true;

            return p;
        };
    };

    return cachingSync;


}));
