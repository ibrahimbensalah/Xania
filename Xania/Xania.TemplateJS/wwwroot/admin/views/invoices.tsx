
import { Xania as xania, Repeat, With, If, expr, Dom, RemoteDataSource, ModelRepository, Reactive as Re, Template } from "../../src/xania"
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
            amount: Math.floor(Math.random() * 10)
        });
    }

    createNew() {
        return {
            description: null,
            companyId: null,
            lines: []
        };
    }
}

export function action() {
    var companies = [
        { value: 1, text: "Rider International" },
        { value: 2, text: "Xania BV" }
    ];

    var controller = new InvoiceRepository();
    var store = new Re.Store(controller);

    var onSelect = row => {
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
                    <DataGrid data={expr("await dataSource")} onSelectionChanged={onSelect}>
                        <TextColumn field="description" display="Description" />
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
                        <Html.Select value={expr("companyId")} display="Company" options={companies} onChange={onSelectCompany} />
                        <Html.TextEditor field="description" display="Description" />

                        <div className="row">
                            <table>
                                <Repeat source={expr("lines")}>
                                    <tr>
                                        <td><input type="text" className="form-control" name="description" /></td>
                                        <td><input type="text" className="form-control" name="amount" /></td>
                                        <td><input type="text" className="form-control" name="amount" /></td>
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