
import xania, { Repeat, With, If, expr, Dom, RemoteDataSource, ModelRepository, Reactive as Re, Template } from "../../src/xania"
import { ViewResult } from "../../src/mvc"
import { Section } from "../layout"
import DataGrid, { TextColumn } from "../grid"
import Html from '../../src/html'

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

export function view() {
    var companies = [
        { value: 1, text: "Rider International" },
        { value: 2, text: "Xania BV" }
    ];

    var controller = new InvoiceRepository();
    var store = new Re.Store(controller);

    var onSelectRow = row => {
        if (store.get("currentRow").valueOf() !== row) {
            store.get("currentRow").set(row);
            store.refresh();
        }
    }

    var onSelectCompany = value => {
        store.get("currentRow").get("companyId").set(parseInt(value));
        store.refresh();
    }

    return new ViewResult(
        <div style="height: 95%;" className="row">
            <div className={[expr("currentRow -> 'col-8'"), expr("not currentRow -> 'col-12'")]}>
                <Section title="Invoices">
                    <DataGrid data={expr("await dataSource")} onSelectionChanged={onSelectRow}>
                        <TextColumn template={<span><span className="invoice-number">{expr("row.invoiceNumber")}</span>{expr("row.description")}</span>} display="Description" />
                        <TextColumn field="invoiceDate" display="Invoice Date" />
                    </DataGrid>
                    <footer style="height: 50px; margin: 0 16px; padding: 0;">
                        <button className="btn btn-primary" onClick={expr("currentRow <- createNew()")}>
                            <span className="fa fa-plus"></span> Add New</button>
                    </footer>
                </Section>
            </div>
            <With object={expr("currentRow")}>
                <div className="col-4">
                    <Section title={expr("description")} onCancel={expr("cancel")}>
                        <Html.TextEditor field="invoiceNumber" display="Invoice Number" />
                        <Html.Select value={expr("companyId")} display="Company" options={companies} onChange={onSelectCompany} />
                        <Html.TextEditor field="description" display="Description" />

                        <div className="row">
                            <header style="height: 50px"><span className="fa fa-calendar-times-o"></span> <span>Hour Declarations</span></header>
                            <table>
                                <Repeat source={expr("for line in lines")}>
                                    <tr>
                                        <td colspan="3"><input type="text" className="form-control" name="line.description" /></td>
                                    </tr>
                                    <tr style="border-bottom: 10px solid rgba(0, 0, 0, 0);">
                                        <td><input type="text" className="form-control" placeholder="Rate" name="line.hourlyRate" /></td>
                                        <td><input type="text" className="form-control" placeholder="Hours" name="line.hours" /></td>
                                        <td style="width: 120px; text-align: right; padding: 0 20px; font-weight: bold; color: gray;">
                                            &euro; {expr("line.hours * line.hourlyRate")}
                                            <a href="" onClick={expr("removeLine event line")}>&times;</a>
                                        </td>
                                    </tr>
                                </Repeat>
                            </table>
                        </div>
                        <button onClick={expr("addLine ()")}>add</button>

                        <div className="form-group" style="padding: 10px; background-color: #EEE; border: 1px solid #DDD;">
                            <button className="btn btn-primary" onClick={expr("save ()")}>
                                <span className="fa fa-save"></span> Save</button>
                        </div>
                    </Section>
                </div>
            </With>
        </div >,
        store);
}