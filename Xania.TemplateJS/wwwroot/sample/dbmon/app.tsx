import xania, { expr, FixedArray as Arr, Reactive as Re, Dom, mount } from "../../src/xania"

// ReSharper disable InconsistentNaming
declare var ENV;
declare var Monitoring;
// ReSharper restore InconsistentNaming


export function run(target: Node) {

    var state = {
        databases: ENV.generateData(true).toArray()
    };
    var store = new Re.Store(state);

    var binding = dbmon
        .bind(new Dom.DomDriver(target))
        .update(store);

    mount(binding);

    var load = () => {
        ENV.generateData(true);
        store.refresh();

        Monitoring.renderRate.ping();
        window.setTimeout(load, ENV.timeout);
    };
    load();

}

var dbmon: any = (
    <table clazz="table table-striped latest-data">
        <tbody>
            <Arr source={expr("databases")} length={100}>
                <tr>
                    <td className="dbname">
                        {expr("dbname")}
                    </td>
                    <td className="query-count">
                        <span className={expr("lastSample.countClassName")}>
                            {expr("lastSample.nbQueries")}
                        </span>
                    </td>
                    <Arr source={expr("lastSample.topFiveQueries")} length={5} >
                        <td className={expr("elapsedClassName")}>
                            {expr("formatElapsed")}
                            <div className="popover left">
                                <div className="popover-content">
                                    {expr("query")}
                                </div>
                                <div className="arrow"></div>
                            </div>
                        </td>
                    </Arr>
                </tr>
            </Arr>
        </tbody>
    </table>
);