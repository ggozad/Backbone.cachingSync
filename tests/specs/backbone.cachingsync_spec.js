(function ($, Backbone, Burry) {

    describe('backbone.cachingsync', function () {

        var p, ajax, model, collection, burry;

        var Model = Backbone.Model.extend({
            url: '/testing/mymodel',
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

    });

})(this.jQuery, this.Backbone, this.Burry);