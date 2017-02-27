import { Xania, ForEach, query, Reactive as Re, Dom } from "../../src/xania"

// ReSharper disable InconsistentNaming
declare var ENV;
declare var Monitoring;
// ReSharper restore InconsistentNaming


export function run(target: Node) {

    var tracks = {};

    var state = {
        databases: ENV.generateData().toArray(),
        trackByIndex(key, stream) {
            let list: any[];
            if (key in tracks) {
                list = tracks[key];
            } else {
                tracks[key] = list = [];
            }
            for (let i = 0; i < stream.length; i++) {
                if (i in list) {
                    var src = stream[i];
                    var dest = list[i];
                    dest.db = src.db;
                } else
                    list[i] = stream[i];
            }
            list.length = stream.length;

            return list;
        }
    };
    var store = new Re.Store(state);

    dbmon(Xania)
        .bind(Dom.DomVisitor)
        .update(store, new Dom.DomDriver(target));

    var load = () => {
        state.databases = ENV.generateData().toArray();
        store.refresh();

        Monitoring.renderRate.ping();
        window.setTimeout(load, ENV.timeout);
    };
    load();

}

var dbmon: any = (xania) =>
    <table clazz="table table-striped latest-data">
        <tbody>
        <ForEach expr={query("for db in (trackByIndex 'db' databases)")}>
            <tr>
                <td className="dbname">
                    {query("db.dbname")}
                </td>
                <td className="query-count">
                    <span className={query("db.lastSample.countClassName")}>
                        {query("db.lastSample.nbQueries")}
                    </span>
                </td>
                <ForEach expr={query("for q in (trackByIndex 'q' db.lastSample.topFiveQueries)")}>
                    <td className={query("q.elapsedClassName")}>
                        {query("q.formatElapsed")}
                        <div className="popover left">
                            <div className="popover-content">
                                {query("q.query")}
                            </div>
                            <div className="arrow"></div>
                        </div>
                    </td>
                </ForEach>
            </tr>
        </ForEach>
        </tbody>
    </table>;