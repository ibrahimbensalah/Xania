
import xania, { Repeat, With, If, expr, Dom, RemoteDataSource, ModelRepository, Reactive as Re, Template } from "../../src/xania"
import { ViewResult } from "../../src/mvc"
import { Section } from "../layout"
import DataGrid, { TextColumn } from "../grid"
import Html from '../../src/html'


class CompanyRepository extends ModelRepository {
    constructor() {
        super("/api/company/", "companies");
    }

    createNew() {
        return {
            name: null
        };
    }
}

export function view() {
    var store = new Re.Store(new CompanyRepository());

    var onSelect = row => {
        store.get("currentRow").update(row);
        store.refresh();
    }

    return new ViewResult(
        <div style="height: 95%;" className="row">
            <div className={[expr("currentRow -> 'col-8'"), expr("not currentRow -> 'col-12'")]}>
                <Section title="Companies">
                    <DataGrid data={expr("await dataSource")} onSelectionChanged={onSelect} >
                        <TextColumn field="name" display="Company Name" />
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
                        <Html.TextEditor field="name" display="Company Name" />

                        <div className="form-group" style="padding: 10px; background-color: #EEE; border: 1px solid #DDD;">
                            <button className="btn btn-primary" onClick={expr("save ()")}>
                                <span className="fa fa-save"></span> Save</button>
                        </div>
                    </Section>
                </div>
            </With>
        </div>, store);
}
