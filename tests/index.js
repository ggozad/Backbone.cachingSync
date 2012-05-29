/*globals jasmine:false */

(function ($) {
    $(function () {
        var trivialReporter = new jasmine.TrivialReporter();
        var jasmineEnv = jasmine.getEnv();
        jasmineEnv.addReporter(trivialReporter);
        jasmineEnv.specFilter = function(spec) {
             return trivialReporter.specFilter(spec);
        };
        jasmineEnv.execute();
    });
})(this.jQuery);