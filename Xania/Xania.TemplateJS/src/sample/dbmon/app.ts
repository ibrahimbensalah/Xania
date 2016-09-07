/// <reference path="../../core.ts" />
/// <reference path="../../fun.ts" />
var ENV = window['ENV'];
var Monitoring = window['Monitoring'];

class DbmonApp {
    databases;
    constructor() {
        this.databases = ENV.generateData(true).toArray();
    }
}

var app = Xania.app()
    // .bind("dbmon-app.html", DbmonApp, document.querySelector("dbmon-app"));
    .component(DbmonApp)
    .start();

var load = () => {
    ENV.generateData(true);
    app.update();
    Monitoring.renderRate.ping();
    window.setTimeout(load, ENV.timeout);
};
load();
