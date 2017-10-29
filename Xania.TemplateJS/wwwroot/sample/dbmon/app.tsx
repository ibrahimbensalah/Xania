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

var once = (property: string) => ({
    execute(context: Re.Store) {
        var parts = property.split(".");
        var result = context.get(parts[0]);
        var i = 0;
        while (++i < parts.length) {
            result = result.get(parts[i]);
        }
        return result;
    }
});

var value = (property: string) => ({
    execute(context: Re.Store) {
        var parts = property.split(".");
        var result = context.value[parts[0]];
        var i = 0;
        while (++i < parts.length) {
            result = result.get[parts[i]];
        }
        return result.valueOf();
    }
});

var property = (name: string) => {
    var parts = name.split(".");
    if (parts.length === 1)
        return ({
            execute(context: Re.Store, binding: Re.Binding) {
                var result = context.get(name);
                result.change(binding);
                return result.valueOf();
            }
        });
    return ({
        execute(context: Re.Store, binding: Re.Binding) {
            var result = context.get(parts[0]);
            var i = 0;
            while (++i < parts.length) {
                result = result.get(parts[i]);
            }
            result.change(binding);
            return result.valueOf();
        }
    });
};

var dbmon: any = (
    <table clazz="table table-striped latest-data">
        <tbody>
            <Arr source={once("databases")} length={100}>
                <tr>
                    <td className="dbname">
                        {property("dbname")}
                    </td>
                    <td className="query-count">
                        <span className={property("lastSample.countClassName")}>
                            {property("lastSample.nbQueries")}
                        </span>
                    </td>
                    <Arr source={once("lastSample.topFiveQueries")} length={5} >
                        <td className={property("elapsedClassName")}>
                            {property("formatElapsed")}
                            <div className="popover left">
                                <div className="popover-content">
                                    {property("query")}
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