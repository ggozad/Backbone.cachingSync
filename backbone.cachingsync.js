//    Backbone.cachingSync v0.1

//    (c) 2012 Yiorgis Gozadinos, Riot AS.
//    Backbone.cachingSync is distributed under the MIT license.
//    http://github.com/ggozad/Backbone.cachingSync

(function ($, _, Backbone, Burry) {

    Backbone.cachingSync = function (wrapped, ns) {

        var burry = new Burry.Store(ns);

        function getItem (model, options) {
            var item = burry.get(model.id),
                d = $.Deferred(),
                updated = {},
                wp;

            wp = wrapped('read', model, options);
            wp.done(function (attrs) {
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

        function getItems (collection, options) {

        }

        function create (model, options) {

        }

        function update (model, options) {

        }

        function destroy (model, options) {

        }

        return function (method, model, options) {
            var p;

            options = options || {};
            switch (method) {
                case 'read': p = typeof model.id !== 'undefined' ? getItem(model, options) : getItems(collection, options); break;
                case 'create':  p = create(model); break;
                case 'update':  p = update(model); break;
                case 'delete':  p = destroy(model); break;
            }

            // Fallback for old-style callbacks.
            if (options.success) p.done(options.success);
            if (options.error) p.fail(options.error);

            return p;

        };
    };


})(this.jQuery, this._, this.Backbone, this.Burry);
