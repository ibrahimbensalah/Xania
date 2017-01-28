import { Observables } from "../../src/observables"

import { Xania, ForEach, fs, Store } from "../../src/xania"

// ReSharper disable InconsistentNaming
declare var ENV;
declare var Monitoring;
// ReSharper restore InconsistentNaming

export function bind(target: Node) {

    var store = new Store({
        time: new Observables.Time(),
        message: "hello, dbmon",
        databases: ENV.generateData(true).toArray()
    });

    var load = () => {
        ENV.generateData(true);
        store.update();
        Monitoring.renderRate.ping();
        window.setTimeout(load, ENV.timeout);
    };

    load();
    view().bind(target, store);

}

function view() {
    var view =
        <table clazz="table table-striped latest-data">
            <tbody>
                <ForEach expr={fs("for db in databases")}>
                    <tr>
                        <td clazz="dbname">
                            {fs("db.dbname")}
                        </td>
                        <td clazz="query-count">
                            <span clazz={fs("db.lastSample.countClassName")}>
                                {fs("db.lastSample.nbQueries")}
                            </span>
                        </td>
                        <ForEach expr={fs("for q in db.lastSample.topFiveQueries")}>
                            <td clazz={fs("q.elapsedClassName")}>
                                {fs("q.formatElapsed")}
                                <div clazz="popover left">
                                    <div clazz="popover-content">
                                        {fs("q.query")}
                                    </div>
                                    <div clazz="arrow"></div>
                                </div>
                            </td>
                        </ForEach>
                    </tr>
                </ForEach>
            </tbody>
        </table>;

    return view as any;
}