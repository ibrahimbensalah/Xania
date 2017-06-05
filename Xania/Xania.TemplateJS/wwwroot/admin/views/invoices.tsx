import xania, { expr, Repeat, ModelRepository, Reactive as Re } from "../../src/xania"
import { View, UrlHelper } from "../../src/mvc"
import DataGrid, { TextColumn } from "../../src/data/datagrid"
import Html, { DataSource } from '../../src/html'
import './invoices.css'

class InvoiceRepository extends ModelRepository {
    constructor() {
        super("/api/invoice/", "invoices");
    }

    addLine() {
        this.currentRow.lines.push({
            description: "new line",
            hours: null,
            hourlyRate: null
        });
    }

    removeLine(event, line) {
        var idx = this.currentRow.lines.indexOf(line);
        if (idx >= 0) {
            this.currentRow.lines.splice(idx, 1);
        }

        event.preventDefault();
    }

    createNew() {
        return {
            description: null,
            companyId: null,
            invoiceNumber: null,
            lines: []
        };
    }
}

export function view({ url }: { url: UrlHelper }) {
    var controller = new InvoiceRepository();
    var store = new Re.Store(controller);

    var onSelectRow = row => {
        if (store.get("currentRow").valueOf() !== row) {
            store.get("currentRow").update(row);
            store.refresh();

            url.goto(row.id);
        }
    }

    function statusTemplate() {
        var badge = expr("row.invoiceDate ? 'success' : 'default'");
        return (
            <span className={["badge badge-", badge]}>{[badge]}</span>
        );
    }

    var descriptionTpl = <span><span className="invoice-number">{expr("row.invoiceNumber")}</span>{expr("row.description")}</span>;
    return View([
        <DataGrid data={expr("await dataSource")} onSelectionChanged={onSelectRow}>
            <TextColumn field="description" template={descriptionTpl} display="Description" />
            <TextColumn field="invoiceDate" display="Invoice Date" />
            <TextColumn field="status" template={statusTemplate()} display="Status" />
        </DataGrid>,
        <footer style="height: 50px; margin: 0 16px; padding: 0;">
            <button className="btn btn-primary" onClick={url.action("test")}>
                <span className="fa fa-plus"></span> Add New</button>
        </footer>
    ], store
    ).route({
        test: () => View(<div>test</div>)
    }).mapRoute(guid, invoiceView);

    function guid(str: string) {
        return str;
    }
}

declare function fetch<T>(url: string, config?): Promise<T>;

function invoiceView({ url }, invoiceId) {
    var config = {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        }
    };

    return fetch("/api/invoice/" + invoiceId, config)
        .then((response: any) => {
            return response.json();
        })
        .then(data => {
            var store = new Re.Store(data)
                .onChange(() => {
                    fetch("/api/invoice/" + invoiceId, {
                        method: 'PUT',
                        body: JSON.stringify(data),
                        headers: new Headers({
                            'Content-Type': 'application/json'
                        })
                    });
                });

            return View(
                <div>
                    <Html.TextEditor display="Number" field="invoiceNumber" placeholder="invoice number" />
                    <Html.TextEditor display="Description" field="description" placeholder="July 2017" />
                    <div>
                        <label>Company</label>
                        <Html.DropDown dataSource={new DataSource()} value={expr("companyId")} >
                            {expr("display")}
                        </Html.DropDown>
                    </div>

                    <DataGrid data={expr("lines")}>
                        <TextColumn field="description" display="Description" />
                        <TextColumn field="hourlyRate" display="Hourly Rate" template={<input type="text" name="row.hourlyRate" /> } />
                        <TextColumn field="hours" display="hours" />
                    </DataGrid>
                </div>
                ,
                store
            ).mapRoute("lines", (context, args) => {
                return View(<div>lines</div>);
            });
        });
}


