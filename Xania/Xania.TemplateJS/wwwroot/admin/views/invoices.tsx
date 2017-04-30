import xania, { expr, ModelRepository, Reactive as Re } from "../../src/xania"
import { View, IViewContext } from "../../src/mvc"
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

export function view({ url }: IViewContext) {
    var controller = new InvoiceRepository();
    var store = new Re.Store(controller);

    var onSelectRow = row => {
        if (store.get("currentRow").valueOf() !== row) {
            store.get("currentRow").set(row);
            store.refresh();

            url.goto(row.id);
        }
    }

    function statusTemplate() {
        var success = expr("row.invoiceDate -> 'success'");
        var pending = expr("not row.invoiceDate -> 'default'");
        return (
            <span className={["badge badge-", success, pending]}>{[success, pending]}</span>
        );
    }

    return View([
        <DataGrid data={expr("await dataSource")} onSelectionChanged={onSelectRow}>
            <TextColumn field="description" template={<span><span className="invoice-number">{expr(
                "row.invoiceNumber")
            }</span>{expr(
                "row.description")}</span>} display="Description" />
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

function invoiceView({ url }, invoiceId) {
    var store = new Re.Store({ invoiceNumber: invoiceId, companyId: 1 });
    var companyDs = new DataSource();
    return View(
        <div className="row no-gutters">
            <form>
                {Html.TextEditor({ display: "Number", field: "invoiceNumber" })}
                {Html.TextEditor({ display: "Email", field: "Email", placeholder: "abdellah@morocco.nr1" })}
                <Html.DropDown dataSource={companyDs} />
            </form>
            <div className="input-group col-6">
                <span className="input-group-addon" id="basic-addon3">https://example.com/users/</span>
                <input type="text" className="form-control" id="basic-url" aria-describedby="basic-addon3" />
            </div>
            <div className="input-group col-6">
                <span className="input-group-addon" id="basic-addon3">https://example.com/users/</span>
                <input type="text" className="form-control" id="basic-url" aria-describedby="basic-addon3" />
            </div>
            <div>Date</div>
            <div>Description</div>
            <div>Company</div>
            <div>
                <header>line numbers</header>
            </div>
        </div>,
        store
    );
}
