import Xania, { expr, List, Reactive as Re, Dom, mount } from "../../src/xania"

// ReSharper disable InconsistentNaming
declare var ENV;
declare var Monitoring;
// ReSharper restore InconsistentNaming


export function run(target: Node) {

    var state = {
        databases: ENV.generateData(true).toArray()
    };
    var store = new Re.Store(state);

    var binding = dbmon(Xania)
        .bind(Dom.DomVisitor)
        .update2(store, new Dom.DomDriver(target));
    mount(binding);

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
            <List source={expr("databases")}>
                <tr>
                    <td className="dbname">
                        {expr("dbname")}
                    </td>
                    <td className="query-count">
                        <span className={expr("lastSample.countClassName")}>
                            {expr("lastSample.nbQueries")}
                        </span>
                    </td>
                    <List source={expr("lastSample.topFiveQueries")} >
                        <td className={expr("elapsedClassName")}>
                            {expr("formatElapsed")}
                            <div className="popover left">
                                <div className="popover-content">
                                    {expr("query")}
                                </div>
                                <div className="arrow"></div>
                            </div>
                        </td>
                    </List>
                </tr>
            </List>
        </tbody>
    </table>;