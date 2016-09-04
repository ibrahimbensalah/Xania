// angular.module('app', []).controller('DBMonCtrl', function ($scope, $timeout) {
var viewModel = {
    databases: []
};

var binder = new Binder(viewModel, [Fun.List], document.body);
binder.bind("template", "#content");

var load = function () {
    var observable = binder.track(viewModel);
    observable.databases = ENV.generateData(false).toArray();
    binder.update();
    Monitoring.renderRate.ping();
    window.setTimeout(load, ENV.timeout);
};
load();
// });
