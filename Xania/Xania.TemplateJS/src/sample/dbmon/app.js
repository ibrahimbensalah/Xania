// angular.module('app', []).controller('DBMonCtrl', function ($scope, $timeout) {
var viewModel = {
    databases: []
};

var binder = new Binder(new Ast.Context([ viewModel, Fun.List ]));
binder.bind("template", "#content");
var observable = binder.observer.track(viewModel);

var load = function () {
    observable.databases = ENV.generateData(false).toArray();
    //for (var i = 0; i < arr.length; i++) {
    //    if (!observable.databases[i])
    //        observable.databases[i] = arr[i];

    //    var db = observable.databases[i];
    //    var lastSample = db.lastSample;
    //    lastSample.countClassName = arr[i].lastSample.countClassName;
    //    lastSample.nbQueries = arr[i].lastSample.nbQueries;

    //    var topFiveQueries = lastSample.topFiveQueries;

    //    for (var n = 0; n < arr[i].lastSample.topFiveQueries.length; n++) {
    //        var q = topFiveQueries[n];
    //        q.formatElapsed = arr[i].lastSample.topFiveQueries[n].formatElapsed;
    //        q.query = arr[i].lastSample.topFiveQueries[n].query;
    //    }
    //}
    binder.observer.update();
    Monitoring.renderRate.ping();
    window.setTimeout(load, ENV.timeout);
};
load();
// });
