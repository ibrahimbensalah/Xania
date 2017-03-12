
import { Xania as xania, Repeat, With, If, expr, Dom, RemoteDataSource, ModelRepository, Reactive as Re, Template } from "../../src/xania"
import { ViewResult } from "../../src/mvc"
import { Section } from "../layout"
import DataGrid, { TextColumn } from "../grid"
import Html from '../../src/html'

class UserRepository extends ModelRepository {

    constructor() {
        super('/api/user/', "users");
    }

    createNew() {
        return {
            name: "",
            email: "",
            emailConfirmed: false
        }
    }
}

var store = new Re.Store(new UserRepository());

var onSelect = row => {
    if (store.get("currentRow").valueOf() !== row) {
        store.get("currentRow").set(row);
        store.refresh();
    }
}

export function action() {
    return new ViewResult(
        <div style="height: 95%;" className="row">
            <div className={[expr("currentRow -> 'col-8'"), expr("not currentRow -> 'col-12'")]}>
                <Section title="Users">
                    <DataGrid data={expr("await dataSource")} onSelectionChanged={onSelect} >
                        <TextColumn field="name" display="User name" />
                        <TextColumn field="emailConfirmed" display="Email confirmed" />
                    </DataGrid>
                    <footer style="height: 50px; margin: 0 16px; padding: 0;">
                        <button className="btn btn-primary" onClick={expr("currentRow <- createNew()")}>
                            <span className="fa fa-plus"></span> Add New</button>
                    </footer>
                </Section>
            </div>
            <With object={expr("currentRow")}>
                <div className="col-4">
                    <Section title={expr("name")} onCancel={expr("cancel")}>
                        <Html.TextEditor field="name" display="User Name" />
                        <Html.TextEditor field="email" display="Email" />
                        <Html.BooleanEditor field="emailConfirmed" display="Email confirmed" />

                        <div className="form-group" style="padding: 10px; background-color: #EEE; border: 1px solid #DDD;">
                            <button className="btn btn-primary" onClick={expr("save ()")}>
                                <span className="fa fa-save"></span> Save</button>
                        </div>
                    </Section>
                </div>
            </With>
        </div>, store);
}