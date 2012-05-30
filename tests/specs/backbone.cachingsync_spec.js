(function ($, Backbone, Burry) {

    describe('backbone.cachingsync', function () {

        var p, ajax, model, collection, burry;

        var Model = Backbone.Model.extend({
            url: '/testing/mymodel',
            sync: Backbone.cachingSync(Backbone.sync, 'testing')
        });

        var Collection = Backbone.Collection.extend({
            url: '/testing/mycollection',
            model: Model,
            sync: Backbone.cachingSync(Backbone.sync, 'testing')
        });

        beforeEach(function () {
            burry = new Burry.Store('testing');
        });

        afterEach(function () {
            localStorage.clear();
        });

        it('caches a read on a model', function () {

            // In the beginning, we have no cache.
            model = new Model({id: 'mymodel'});
            ajax = spyOn($, 'ajax').andCallFake(function () {
                return $.Deferred()
                    .resolve({foo: 'bar'})
                    .promise();
            });
            p = model.fetch();
            expect(p.isResolved()).toBeTruthy();
            expect(ajax).toHaveBeenCalled();
            expect(model.attributes).toEqual({id: 'mymodel', foo: 'bar'});
            expect(burry.get(model.id)).toEqual({id: 'mymodel', foo: 'bar'});

            // Now that we have a cache, let's create a new model with the same id and also make ajax fail
            var model2 = new Model({id: 'mymodel'});
            ajax.andCallFake(function () {
                return $.Deferred().reject();
            });
            p = model2.fetch();
            expect(p.isResolved()).toBeTruthy();
            expect(ajax).toHaveBeenCalled();
            expect(model.attributes).toEqual({id: 'mymodel', foo: 'bar'});
        });

        it('caches a read on a collection', function () {

            // In the beginning, we have no cache.
            collection = new Collection();
            ajax = spyOn($, 'ajax').andCallFake(function () {
                return $.Deferred()
                    .resolve([{id: 1, foo: 'bar'}, {id: 2, bar: 'foo'}])
                    .promise();
            });
            p = collection.fetch();
            expect(p.isResolved()).toBeTruthy();
            expect(ajax).toHaveBeenCalled();
            expect(collection.models[0].attributes).toEqual({id: 1, foo: 'bar'});
            expect(collection.models[1].attributes).toEqual({id: 2, bar: 'foo'});
            expect(burry.get('__ids__')).toEqual([1, 2]);

            // Now that we have a cache, let's create a new collection with the same ns and also make ajax fail
            var collection2 = new Collection();
            ajax.andCallFake(function () {
                return $.Deferred().reject();
            });
            p = collection2.fetch();
            expect(p.isResolved()).toBeTruthy();
            expect(ajax).toHaveBeenCalled();
            expect(collection2.models[0].attributes).toEqual({id: 1, foo: 'bar'});
            expect(collection2.models[1].attributes).toEqual({id: 2, bar: 'foo'});
        });

        it('caches a create on a model', function () {
            model = new Model({foo: 'bar'});
            ajax = spyOn($, 'ajax').andCallFake(function (req) {
                return $.Deferred()
                    .resolve(new Model({id: 1, foo: 'bar'}))
                    .promise();
            });
            model.save();
            expect(model.id).toEqual(1);
            expect(burry.get('1')).toEqual({id: 1, foo: 'bar'});
        });

        it('caches a create on a collection', function () {
            collection = new Collection([{id: 1, bar: 'foo'}, {foo: 'bar'}]);
            ajax = spyOn($, 'ajax').andCallFake(function (req) {
                return $.Deferred()
                    .resolve(new Model({id: 2, foobar: 'barfoo'}))
                    .promise();
            });
            collection.create({foobar: 'barfoo'});
            expect(collection.models[2].id).toEqual(2);
            expect(burry.get('2')).toEqual({id: 2, foobar: 'barfoo'});
            expect(burry.get('__ids__')).toEqual([1, 2]);
        });

        it('caches an update on a model', function () {
            model = new Model({foo: 'bar'});
            ajax = spyOn($, 'ajax').andCallFake(function (req) {
                return $.Deferred()
                    .resolve(new Model({id: 1, foo: 'bar'}))
                    .promise();
            });
            model.save();
            ajax.andCallFake(function (req) {
                return $.Deferred()
                    .resolve(new Model({id: 1, foo: 'bar', bar: 'foo'}))
                    .promise();
            });
            model.save({bar: 'foo'});
            expect(model.get('bar')).toEqual('foo');
            expect(burry.get('1')).toEqual({id: 1, foo: 'bar', bar: 'foo'});
            // Let's now fake another update with a server failure this time
            ajax.andCallFake(function (req) {
                return $.Deferred()
                    .reject()
                    .promise();
            });
            model.save({barfoo: 'foobar'});
            expect(burry.get('1')).toEqual({id: 1, foo: 'bar', bar: 'foo'});
        });

        it('caches a destroy on a model', function () {
            model = new Model({foo: 'bar'});
            ajax = spyOn($, 'ajax').andCallFake(function (req) {
                return $.Deferred()
                    .resolve(new Model({id: 1, foo: 'bar'}))
                    .promise();
            });
            model.save();
            ajax.andCallFake(function (req) {
                return $.Deferred()
                    .resolve(new Model({id: 1, foo: 'bar', bar: 'foo'}))
                    .promise();
            });
            model.destroy();
            expect(burry.get('1')).toBeUndefined();
        });

        it('can use a Burry store with a default ttl', function () {
            var store;
            model = new Model({foo: 'bar'});
            model.sync = Backbone.cachingSync(Backbone.sync, 'testingttl', 10);
            ajax = spyOn($, 'ajax').andCallFake(function (req) {
                return $.Deferred()
                    .resolve(new Model({id: 1, foo: 'bar'}))
                    .promise();
            });
            model.save();
            store = new Burry.Store('testingttl');
            expect(_.keys(store.expirableKeys())).toEqual(["1"]);
        });

    });

})(this.jQuery, this.Backbone, this.Burry);