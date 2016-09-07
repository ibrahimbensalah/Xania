/// <reference path="../../core.ts" />
/// <reference path="../../fun.ts" />
var ENV = window['ENV'];
var Monitoring = window['Monitoring'];
var DbmonApp = (function () {
    function DbmonApp() {
        this.databases = ENV.generateData(true).toArray();
    }
    return DbmonApp;
})();
var app = Xania.app()
    .component(DbmonApp)
    .start();
var load = function () {
    ENV.generateData(true);
    app.update();
    Monitoring.renderRate.ping();
    window.setTimeout(load, ENV.timeout);
};
load();
