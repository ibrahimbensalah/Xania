import { Observables } from "../../src/observables"

import { Xania, ForEach, fs, Store } from "../../src/xania"

// ReSharper disable InconsistentNaming
declare var ENV;
declare var Monitoring;
// ReSharper restore InconsistentNaming

class BufferedDispatcher {
    private buffer = new Set();
    dispatch(action) {
        this.buffer.add(action);
    }

    static executeAction(action) {
        action.execute();
    }

    flush() {
        this.buffer.forEach(BufferedDispatcher.executeAction);
        this.buffer.clear();
    }
}


export function bind(target: Node) {

    // var dispatcher = new BufferedDispatcher();
    var store = new Store({
            time: new Observables.Time(),
            message: "hello, dbmon",
            databases: ENV.generateData(true).toArray()
        },
        {});
    view().bind(target, store);

    var load = () => {
        ENV.generateData(true);

        store.update();
        // dispatcher.flush();

        //for (var i = 0; i < 100; i++) {
        //    var $db = $databases.get(i);
        //    var $lastSample = $db.get("lastSample");
        //    var $countClassName = $lastSample.get("countClassName");
        //    var $nbQueries = $lastSample.get("nbQueries");
        //    var $topFiveQueries = $lastSample.get("topFiveQueries");

        //    // $countClassName.update($db.value['countClassName']);
        //    // $nbQueries.update($db.value['nbQueries']);

        //    for (var j = 0; j < 5; j++) {
        //        var $q = $topFiveQueries.get(j);

        //        var q = $q.value;

        //        $q.get('elapsedClassName').update2(q);
        //        $q.get('formatElapsed').update2(q);
        //        $q.get("query").update2(q);
        //    }

        //}

        Monitoring.renderRate.ping();
        window.setTimeout(load, ENV.timeout);
    };
    load();

}

function view() {
    var view =
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

    return view as any;
}