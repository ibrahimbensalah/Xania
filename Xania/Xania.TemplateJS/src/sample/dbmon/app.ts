
// @Xania.Component
var Monitoring, ENV;

class DbmonApp {
    databases = ENV.generateData(true).toArray();

    init(app) {
        var load = () => {
            ENV.generateData(true);
            app.update();
            Monitoring.renderRate.ping();
            window.setTimeout(load, ENV.timeout);
        };
        load();
    }

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
