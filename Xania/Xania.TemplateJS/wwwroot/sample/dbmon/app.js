// @Xania.Component
var Monitoring, ENV;
var DbmonApp = (function () {
    function DbmonApp() {
        this.databases = ENV.generateData(true).toArray();
        //static cache = new Map<any, any>();
        //static track(db, lastMutationId) {
        //    var prevMutationId = DbmonApp.cache.get(db);
        //    if (prevMutationId === null || prevMutationId === undefined || prevMutationId !== lastMutationId) {
        //        DbmonApp.cache.set(db, lastMutationId);
        //        return true;
        //    }
        //    return false;
        //}
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