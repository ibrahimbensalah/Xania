import { Xania, ForEach, query, text, Reactive as Re, Dom } from "../../src/xania"

// ReSharper disable InconsistentNaming
declare var ENV;
declare var Monitoring;
// ReSharper restore InconsistentNaming


export function run(target: Node) {

    var state = {
        databases: ENV.generateData(true).toArray()
    };
    var store = new Re.Store(state);

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
            {query("databases").map(
                <tr>
                    <td className="dbname">
                        {text("dbname")}
                    </td>
                    <td className="query-count">
                        <span className={text("lastSample.countClassName")}>
                            {text("lastSample.nbQueries")}
                        </span>
                    </td>
                    {query("lastSample.topFiveQueries").map(
                        <td className={text("elapsedClassName")}>
                            {text("formatElapsed")}
                            <div className="popover left">
                                <div className="popover-content">
                                    {text("query")}
                                </div>
                                <div className="arrow"></div>
                            </div>
                        </td>
                    )}
                </tr>
            )}
        </tbody>
    </table>;