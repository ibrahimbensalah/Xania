var Monitoring, ENV;
var DbmonApp = (function () {
    function DbmonApp() {
        this.databases = ENV.generateData(true).toArray();
    }
    DbmonApp.prototype.init = function (app) {
        var load = function () {
            ENV.generateData(true);
            app.update();
            Monitoring.renderRate.ping();
            window.setTimeout(load, ENV.timeout);
        };
        load();
    };
    return DbmonApp;
}());
//# sourceMappingURL=app.js.map