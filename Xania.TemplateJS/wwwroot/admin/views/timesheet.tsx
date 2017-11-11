import xania, { subscribe, call, expr, List, ModelRepository, Reactive as Re, RemoteDataSource, RemoteStore } from "../../src/xania"
import { View, UrlHelper } from "../../src/mvc"
import DataGrid, { TextColumn } from "../../src/data/datagrid"
import Html from '../../src/html'
import './invoices.css'

class TimeSheetRepository extends ModelRepository {
    constructor() {
        super("/api/xaniadb", `for c in companies select { companyName : c.name, companyId: c.id }`);
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
var formatters = {
    timeSpan: {
        parse(str) {
            return str;
        },
        format(obj) {
            var str = obj.toString();
            var matches = /(\d{2}:\d{2}):\d{2}/.exec(str);
            return matches ? matches[1] : str;
        }
    },
    dateTime: {
        parse(str) {
            return new Date(str);
        },
        format(date) {
            return date.toDateString();
        }
    }
}
function format(expr, formatter) {
    return {
        execute(context, binding) {
            return {
                inner: expr.execute(context, binding),
                toString() {
                    return formatter.format(this.inner && this.inner.valueOf());
                },
                update(value) {
                    this.inner.update(formatter.parse(value));
                }
            }
        }
    }
}
function timeSpan(code: string) {
    return format(expr(code), formatters.timeSpan);
}
function dateTime(code: string) {
    return format(expr(code), formatters.dateTime);
}

export function view({ url }: { url: UrlHelper }) {
    var remote = new RemoteStore("/api/xaniadb");
    var view = View([
        <DataGrid data={expr("await companies", { companies: remote.execute("companies") })} onSelectionChanged={expr("url.goto id", { url })} >
            <TextColumn field="name" template={<span>{expr("row.name")}</span>} display="Company" />
        </DataGrid>
    ], { title: "Companies"});

    view.mapRoute(guid, (ctx, companyId) => viewTimeSheet(ctx, companyId));

    return view;
}

export function viewTimeSheet({ url }: { url: UrlHelper }, companyId) {
    var declarations = new RemoteDataSource("/api/xaniadb", `declarations where companyId = '${companyId}'`);
    var controller = new TimeSheetRepository();
    var store = new Re.Store(controller);

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
            rest.put('/api/timedeclaration', d);
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

    function deleteTimeDeclaration(id) {
        rest.delete('/api/timedeclaration/' + id).then(() => declarations.reload());
    }

    var repository = {
        create() {
            return {
                companyId,
                date: new Date(),
                timeSpan: "08:00",
                description: null
            };
        },
        save(item) {
            rest.put('/api/timedeclaration/', item).then(() => {
                declarations.reload();
                url.pop();
            });
        }
    }

    return View([
        <div>
            <List source={expr("await declarations |> groupData", { declarations, groupData })}>
                <div style="float: left; height: auto; overflow: auto; clear: both;">
                    <label style="line-height: 30px;">
                        {expr("key")}</label>
                </div>
                <div style="float: left;">
                    <List source={expr("items")}>
                        <div style="float: left; overflow: auto; clear: both;">
                            <label style="width: 20px; line-height: 30px; margin: 0 10px; text-align: center;">
                                {expr("key + 1")}</label>
                        </div>
                        <div style="float: left;">
                            <List source={expr("items")}>
                                <div style="overflow: auto; float: left; clear: both;">
                                    <label style="line-height: 30px; margin: 0 4px; width: 20px; font-weight: bold; text-align: center; margin-right: 10px;">
                                        {expr("key + 1")}</label>
                                </div>
                                <div style="float: left;">
                                    <List source={expr("items |> mapData", { mapData })}>
                                        <div class="input-group">
                                            <input class="form-control" type="text" placeholder="Time" name="timeSpan" value={
                                                timeSpan("timeSpan")} style="width: 70px" />
                                            <input class="form-control" type="text" placeholder="Notes" value={expr(
                                                "description")} style="width: 200px" />
                                            <a class="btn-delete-record" href="" style="" onClick={call(
                                                deleteTimeDeclaration,
                                                "id")}>&times;</a>
                                        </div>
                                    </List>
                                </div>
                            </List>
                        </div>
                    </List>
                </div>
            </List>
            <div style="clear: both; display: block;">
                <a href="" class="btn btn-primary" onClick={url.action("new")}>Add</a>
            </div>
        </div>
    ],
        [store, { title: "Timesheet"}]
    ).route({
        report: reportView,
        new: ctx => timesheetView(ctx, repository)
    });
}

function newuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
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

var rest = {
    put(url, body) {
        return fetch(url,
            {
                method: "PUT",
                body: JSON.stringify(body),
                headers: {
                    'Content-Type': "application/json"
                }
            });
    },
    delete(url) {
        return fetch(url, {
            method: "DELETE",
            headers: {
                'Content-Type': "application/json"
            }
        });
    }
}

function timesheetView({ url }, repository: { save(item); create(): any }) {
    var td = repository.create();
    var timesheetStore = new Re.Store(td);

    var myFormatter = {
        parse(str: string) {
            return str && new Date(str);
        },
        format(date) {
            return date.toLocaleDateString();
        }
    };

    var dateTime = (code: string) => format(expr(code), myFormatter);

    return View([
        <div style="height: 100%;">
            <div>
                <label>Company</label>
                <Html.DropDown data={subscribe(companiesDS)} value={expr("companyId")}>
                    {expr("display")}
                </Html.DropDown>
            </div>
            <Html.TextEditor display="Date" placeholder="Date" value={dateTime("date")} />
            <Html.TextEditor display="Description" field="description" placeholder="Desc.." value={expr("description")} />
            <Html.TextEditor display="Time" field="timeSpan" placeholder="08:00" value={timeSpan("timeSpan")} />
            <button class="btn btn-primary" onClick={repository.save.bind(repository, td)}>Save</button>
        </div>
    ], timesheetStore);
}


function reportView() {
    return View(
        <div>report</div>
    );
}