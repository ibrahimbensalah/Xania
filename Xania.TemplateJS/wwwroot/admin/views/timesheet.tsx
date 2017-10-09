import xania, { If, expr, List, ModelRepository, Reactive as Re, RemoteDataSource, RemoteStore } from "../../src/xania"
import { View, UrlHelper } from "../../src/mvc"
import DataGrid, { RemoveColumn, TextColumn } from "../../src/data/datagrid"
import Html from '../../src/html'
import './invoices.css'
import { parse } from "../../src/compile";

class TimeSheetRepository extends ModelRepository {
    constructor() {
        var query =
            ` for d in declarations
              join c in companies on d.companyId = c.id
              select { 
                    id: d.id,
                    companyName : c.name,
                    companyId: c.id,
                    timeSpan: d.timeSpan,
                    date: d.date
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

var guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var any = path => path;

export function view({ url }: { url: UrlHelper }) {
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

    /**
     * List.map createStore
     * @param row
     */
    function mapData(row) {
        return row.map(d => new Re.Store(d).onChange(i => {
            put('/api/timedeclaration', d);
        }));
    }

    var descriptionTpl = <span><span className="invoice-number">{expr("row.invoiceNumber")}</span>{
        expr("row.companyName")}</span>;
    return View([
        <table>
            <List source={expr("await dataSource |> mapData", { mapData })}>
                <tr>
                    <td><input class="form-control" type="text"
                        placeholder="Date" name="date"
                        onChange={expr("date <- parseDate value", { parseDate })}
                        value={expr("formatDate date", { formatDate })} /></td>
                    <td><input class="form-control" type="text"
                            placeholder="Time"
                            value={expr("timeSpan")} /></td>
                    <td><Html.DropDown data={expr('await companiesDS', { companiesDS })} value={expr("companyId")} >
                        {expr("display")}
                    </Html.DropDown></td>
                </tr>
            </List>
        </table>,
        <footer style="height: 50px; margin: 0 16px; padding: 0;">
            <button className="btn btn-primary" onClick={url.action("new")}>
                <span className="fa fa-plus"></span> Add New</button>
        </footer>
    ],
        store
    ).route({
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
        </div>,
    ], [timesheetStore, { companiesDS }]);
}


