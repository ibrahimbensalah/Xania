import { Xania, ForEach, query, Reactive as Re, Dom } from "../../src/xania"

// ReSharper disable InconsistentNaming
declare var ENV;
declare var Monitoring;
// ReSharper restore InconsistentNaming


export function run(target: Node) {

    var store = new Re.Store({ databases: ENV.generateData(true).toArray() });

    dbmon(Xania)
        .bind(Dom.DomVisitor)
        .update(store, new Dom.DomDriver(target));

    var load = () => {
        ENV.generateData(true);
        store.refresh();

        Monitoring.renderRate.ping();
        window.setTimeout(load, ENV.timeout);
    };
    load();

}

var dbmon: any = (xania) =>
    <table clazz="table table-striped latest-data">
        <tbody>
        <ForEach expr={query("for db in databases")}>
            <tr>
                <td className="dbname">
                    {query("db.dbname")}
                </td>
                <td className="query-count">
                    <span className={query("db.lastSample.countClassName")}>
                        {query("db.lastSample.nbQueries")}
                    </span>
                </td>
                <ForEach expr={query("for q in db.lastSample.topFiveQueries")}>
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