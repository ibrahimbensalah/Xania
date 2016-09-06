// angular.module('app', []).controller('DBMonCtrl', function ($scope, $timeout) {
var viewModel = {
    databases: ENV.generateData(true).toArray()
};

var binder = new Binder(viewModel, [Fun.List], document.body);
binder.bind("template", "#content");

var load = function () {
    ENV.generateData(true);
    binder.update();
    Monitoring.renderRate.ping();
    window.setTimeout(load, ENV.timeout);
};
load();
// });
