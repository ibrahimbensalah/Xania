import xania, { If, expr, List, ModelRepository, Reactive as Re, RemoteDataSource, RemoteStore } from "../../src/xania"
import { View, UrlHelper } from "../../src/mvc"
import DataGrid, { RemoveColumn, TextColumn } from "../../src/data/datagrid"
import Html from '../../src/html'
import './invoices.css'
import { parse } from "../../src/compile";

class TimeSheetRepository extends ModelRepository {
    constructor() {
        var query =
            ` for c in companies
              select { 
                    companyName : c.name,
                    companyId: c.id
              }
            `;
        super("/api/xaniadb", query);
    }

    createNew() {
        return {
            date: new Date(),
            timeSpan: "08:00",
            companyName: "Software Development"
        };
    }
}

var guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var any = path => path;

export function view({ url }: { url: UrlHelper }) {
    var remote = new RemoteStore("/api/xaniadb");
    var view = View([
        <DataGrid data={expr("await companies", { companies: remote.execute("companies") })} onSelectionChanged={expr("url.goto id", { url })} >
            <TextColumn field="name" template={<span>{expr("row.name")}</span>} display="Company" />
        </DataGrid>
    ]);

    view.mapRoute(guid, (ctx, companyId) => viewTimeSheet(ctx, companyId));

    return view;
}

export function viewTimeSheet({ url }: { url: UrlHelper }, companyId) {
    var declarations = new RemoteStore("/api/xaniadb").execute(
        `declarations where companyId = '${companyId}'`
    );
    var controller = new TimeSheetRepository();
    var store = new Re.Store(controller);

    var onSelectRow = row => {
        if (store.get("currentRow").valueOf() !== row) {
            store.get("currentRow").update(row);
            store.refresh();

            url.goto(row.id);
        }
    }

    function statusTemplate() {
        var badge = expr("row.date ? 'success' : 'danger'");
        return (
            <span className={["badge badge-", badge]}>{[badge]}</span>
        );
    }

    function formatDate(raw) {
        var date = new Date(raw);
        var monthNames = [
            "Jan", "Feb", "Mar",
            "April", "May", "Jun", "Jul",
            "Aug", "Sep", "Oct",
            "Nov", "Dec"
        ];

        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();

        return `${day} ${monthNames[monthIndex]} ${year}`;
    }

    function parseDate(value) {
        return value.target.value;
    }

    var groupBy = (xs, keyProp) => xs.reduce((rv, x) => {
        var key = typeof keyProp === "function" ? keyProp(x) : x[keyProp];
        var i = rv.length;
        while (i--) {
            const r = rv[i];
            if (r.key === key) {
                r.items.push(x);
                return rv;
            }
        }
        rv.push({ key, items: [x] });
        return rv;
    }, []);

    /**
     * List.map createStore
     * @param row
     */
    function mapData(row) {
        return row.map(d => new Re.Store(d).onChange(i => {
            put('/api/timedeclaration', d);
        }));
    }

    function groupData(row) {
        return groupBy(row, x => new Date(x.date).getUTCFullYear()).map(g => {
            return {
                key: g.key,
                items: groupBy(g.items, x => new Date(x.date).getUTCMonth())
                    .map(j => {
                        return {
                            key: j.key,
                            items: groupBy(j.items, y => new Date(y.date).getUTCDate())
                                .sort((a, b) => {
                                    return a.key > b.key ? 1 : -1;
                                })
                        }
                    })
            }
        });
    }

    var descriptionTpl = <span><span className="invoice-number">{expr("row.invoiceNumber")}</span>{
        expr("row.companyName")}</span>;
    return View([
        <div>
            <List source={expr("await declarations |> groupData", { declarations, groupData })}>
                <div style="float: left; height: auto; overflow: auto; clear: both;"><label style="line-height: 30px;">{expr("key")}</label></div>
                <div style="float: left;">
                    <List source={expr("items")}>
                        <div style="float: left; overflow: auto; clear: both;"><label style="line-height: 30px; margin: 0 10px;">{expr("key + 1")}</label></div>
                        <div style="float: left;">
                            <List source={expr("items")}>
                                <div style="overflow: auto; float: left; clear: both;"><label style="line-height: 30px; margin: 0 4px; width: 60px; font-weight: bold;">day {expr("key + 1")}</label></div>
                                <div style="float: left;">
                                    <List source={expr("items |> mapData", { mapData })}>
                                        <div class="input-group">
                                            <input class="form-control" type="text" placeholder="Time" value={expr("timeSpan")} style="width: 90px" />
                                            <input class="form-control" type="text" placeholder="Description" value={expr("description")} style="width: 200px" />
                                            <a href="" style="padding: 3px; font-weight: bold; color: red; display: block">&times;</a>
                                        </div>
                                    </List>
                                </div>
                            </List>
                        </div>
                    </List>
                </div>
            </List>
        </div>
    ], store
    ).route({
        report: reportView,
        new: ctx => timesheetView(ctx, {
            companyId: null,
            date: new Date(),
            timeSpan: "08:00",
            companyName: "Software Development"
        })
    }).mapRoute(loadTimesheet, (ctx, promise: any) => promise.then(data => timesheetView(ctx, data)));
}

declare function fetch<T>(url: string, config?): Promise<T>;

var companiesDS = new RemoteDataSource("/api/xaniadb", 'for c in companies select { id: c.id, display: c.name }');

function loadTimesheet(id) {
    return fetch("/api/TimeDeclaration/" + id, {
        method: "GET",
        headers: {
            'Content-Type': "application/json"
        }
    }).then((response: any) => response.json());
}

function put(url, body) {
    return fetch(url, {
        method: "PUT",
        body: JSON.stringify(body),
        headers: {
            'Content-Type': "application/json"
        }
    });
}

function timesheetView({ url }, timeDeclaration) {
    var timesheetStore = new Re.Store(timeDeclaration)
        .onChange(() => {
            fetch("/api/timedeclaration/", {
                method: 'PUT',
                body: JSON.stringify(timeDeclaration),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            });
        });

    function addLine(evt, context) {
        context.get('lines').valueOf().push({
            description: 'untitled',
            hourlyRate: 75,
            hours: 8
        });
    }

    return View([
        <div style="height: 100%;">
            <div>
                <label>Company</label>
                <Html.DropDown data={expr('await companiesDS')} value={expr("companyId")}>
                    {expr("display")}
                </Html.DropDown>
            </div>
            <Html.TextEditor display="Date" field="date" placeholder="Date" />
            <Html.TextEditor display="Description" field="description" placeholder="July 2017" />
            <Html.TextEditor display="Time" field="timeSpan" placeholder="08:00" />
            <div>
                <button onClick={addLine}>add</button>
            </div>
        </div>
    ], [timesheetStore, { companiesDS }]);
}


function reportView() {
    return View(
        <div>report</div>
    );
}