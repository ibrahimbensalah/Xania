﻿import xania, { expr, ModelRepository, Reactive as Re } from "../../src/xania"
import { parse } from "../../src/compile"
import { View, UrlHelper } from "../../src/mvc"
import DataGrid, { RemoveColumn, TextColumn } from "../../src/data/datagrid"
import Html, { DataSource } from '../../src/html'
import './invoices.css'

class InvoiceRepository extends ModelRepository {
    constructor() {
        super("/api/invoice/", "invoices"); // 
        var query = 
            ` for i in invoices
              join c in companies on i.companyId = c.id
              select { invoiceId: i, companyName: c.name }
            `;
        var config = {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(parse(query))
        };

        fetch("/api/invoice/query", config)
            .then((response: any) => {
                return response.json();
            })
            .then(data => {
                console.debug("data", data);
            });

        try {
            var ast = parse(query);
            console.debug("ast", ast);
        } catch (ex) {
            console.error(ex);
        }
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

    var descriptionTpl = <span><span className="invoice-number">{expr("row.invoiceNumber")}</span>{expr("row.companyId")}</span>;
    return View([
        <DataGrid data={expr("await dataSource")} onSelectionChanged={onSelectRow} style="height: 100%;">
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
            var invoiceStore = new Re.Store(data)
                .onChange(() => {
                    fetch("/api/invoice/" + invoiceId, {
                        method: 'PUT',
                        body: JSON.stringify(data),
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

            function removeLine(evt, context) {
                
            }

            return View(
                [<div style="height: 100%;">
                    <div>
                        <label>Company</label>
                        <Html.DropDown dataSource={new DataSource()} value={expr("companyId")} >
                            {expr("display")}
                        </Html.DropDown>
                    </div>
                    <Html.TextEditor display="Number" field="invoiceNumber" placeholder="invoice number" />
                    <Html.TextEditor display="Description" field="description" placeholder="July 2017" />

                    <DataGrid data={expr("lines")}>
                        <TextColumn field="description" display="Description" template={<input type="text" name="row.description" />} />
                        <TextColumn field="hours" display="Hours" template={<input type="text" name="row.hours" />} />
                        <TextColumn field="hourlyRate" display="Hourly Rate" template={<input type="text" name="row.hourlyRate" />} />
                        <RemoveColumn />
                    </DataGrid>
                    <div>
                        <button onClick={addLine}>add</button>
                    </div>
                </div>,
                <footer style="height: 50px; margin: 0 16px; padding: 0;">
                    <div className="btn-group">
                        <button className="btn btn-primary" onClick={url.action("report")}>
                            <span className="fa fa-plus"></span> Preview</button>
                        <a className="btn btn-default" href={"/api/invoice/" + invoiceId + "/pdf"} >Download</a>
                    </div>
                </footer>
                ]
                ,
                invoiceStore
            ).mapRoute("report", (context, args) => {
                return View(
                    <iframe src={"/api/invoice/" + invoiceId + "/pdf"} width="600px" height="100%"></iframe>,
                    invoiceStore);
            });
        });
}


