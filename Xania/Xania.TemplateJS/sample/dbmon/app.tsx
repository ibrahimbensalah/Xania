import { Observables } from "../../src/observables"

import { Xania, ForEach, fs, Reactive as Re } from "../../src/xania"

// ReSharper disable InconsistentNaming
declare var ENV;
declare var Monitoring;
// ReSharper restore InconsistentNaming


class BufferedDispatcher {
    private buffer = new Set();

    dispatch(action) {
        this.buffer.add(action);
    }

    flush() {
        this.buffer.forEach(BufferedDispatcher.executeAction);
        this.buffer.clear();
    }

    static executeAction(action) {
        action.execute();
    }
}

export function bind(target: Node) {

    var dispatcher = new BufferedDispatcher();
    var store = new Re.Store({
            time: new Observables.Time(),
            message: "hello, dbmon",
            databases: ENV.generateData(true).toArray()
    });
    Xania.view(dbmon(Xania), dispatcher).bind(target, store);

    var load = () => {
        ENV.generateData(true);

        store.refresh();
        dispatcher.flush();

        Monitoring.renderRate.ping();
        window.setTimeout(load, ENV.timeout);
    };
    load();

}

var dbmon: any = (xania) =>
    <table clazz="table table-striped latest-data">
        <tbody>
        <ForEach expr={fs("for db in databases")}>
            <tr>
                <td className="dbname">
                    {fs("db.dbname")}
                </td>
                <td className="query-count">
                    <span className={fs("db.lastSample.countClassName")}>
                        {fs("db.lastSample.nbQueries")}
                    </span>
                </td>
                <ForEach expr={fs("for q in db.lastSample.topFiveQueries")}>
                    <td className={fs("q.elapsedClassName")}>
                        {fs("q.formatElapsed")}
                        <div className="popover left">
                            <div className="popover-content">
                                {fs("q.query")}
                            </div>
                            <div className="arrow"></div>
                        </div>
                    </td>
                </ForEach>
            </tr>
        </ForEach>
        </tbody>
    </table>;