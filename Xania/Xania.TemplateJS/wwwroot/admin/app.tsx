import { Xania as xania, Repeat, If, expr, Dom, RemoteDataSource, Reactive as Re, Template } from "../src/xania"
import { UrlHelper, ViewResult } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import TodoApp from "../sample/todos/app";
import DataGrid, { TextColumn } from "./grid"
import Lib = require("../diagram/lib");
import BallsApp from '../sample/balls/app';

var store = new Re.Store({
    filter: "",
    user: "Ibrahim",
    ds: new RemoteDataSource('/api/user/', "users"),
    current: null,
    saveUser() {
        this.users.save(this.currentUser);
        this.cancel();
    },
    cancel() {
        this.currentUser = false;
    },
    addUser() {
        this.currentUser = {
            name: "",
            email: "",
            emailConfirmed: false
        }
    }
});

export function balls() {
    return new ViewResult(<BallsApp />);
}

export function index() {
    return new ViewResult(<div>index</div>, store);
}

export function menu({ driver, html, url }) {
    mainMenu(url).bind()
        .update(new Re.Store({}), driver);
}

export function timesheet() {
    var time = new Observables.Time();
    var toggleTime = () => {
        time.toggle();
    };
    return new ViewResult(<div>timesheet {expr("await time")}
        <button onClick={toggleTime}>toggle time</button>
        <ClockApp time={expr("await time")} />
    </div>, new Re.Store({ time }));
}

export function todos() {
    return new ViewResult(<TodoApp />);
}

function Section(attrs, children) {
    return (
        <section className="section" style="height: 100%">
            <If expr={attrs.onCancel}>
                <button type="button" className="close" aria-hidden="true" style="margin: 16px 16px 0 0;" onClick={attrs.onCancel}>×</button>
            </If>
            <header style="height: 50px"><span className="fa fa-adjust"></span> <span>{attrs.title || 'Untitled'}</span></header>
            <div style="padding: 0px 16px 100px 16px; height: 100%;">
                {children}
            </div>
        </section>
    );
}

function TextEditor(attrs) {
    var id = Math.random();
    return xania.tag("div",
        Object.assign({ className: "form-group" }, attrs),
        [
            <label for={id}>{attrs.display}</label>,
            <input className="form-control" id={id} type="text" placeholder={attrs.display} name={"currentRow." + attrs.field} />
        ]
    );
}

function BooleanEditor(attrs) {
    var id = Math.random();
    return xania.tag("div",
        Object.assign({ className: "form-check" }, attrs),
        [
            <label className="form-check-label" htmlFor={id}>
                <input className="form-check-input" id={id} type="checkbox" checked={expr("currentRow." + attrs.field)} /> {attrs.display}
            </label>
        ]
    );
}

abstract class ModelRepository {
    private dataSource;
    private currentRow = null;

    constructor(url: string, expr: string) {
        this.dataSource = new RemoteDataSource(url, expr);
    }

    save() {
        this.dataSource.save(this.currentRow);
        this.cancel();
    }

    cancel() {
        this.currentRow = false;
    }

    abstract createNew();
}

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

class InvoiceRepository extends ModelRepository {
    constructor() {
        super("/api/invoice/", "invoices");
    }

    createNew() {
        return {
            description: null
        };
    }
}

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

export function users() {
    var store = new Re.Store(new UserRepository());

    var onSelect = row => {
        store.get("currentRow").set(row);
        store.refresh();
    }

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
            <If expr={expr("currentRow")}>
                <div className="col-4">
                    <Section title={expr("currentRow.name")} onCancel={expr("cancel")}>
                        <TextEditor field="name" display="User Name" />
                        <TextEditor field="email" display="Email" />
                        <BooleanEditor field="emailConfirmed" display="Email confirmed" />

                        <div className="form-group" style="padding: 10px; background-color: #EEE; border: 1px solid #DDD;">
                            <button className="btn btn-primary" onClick={expr("save ()")}>
                                <span className="fa fa-save"></span> Save</button>
                        </div>
                    </Section>
                </div>
            </If>
        </div>, store);
}

export function invoices() {
    var store = new Re.Store(new InvoiceRepository());

    var onSelect = row => {
        store.get("currentRow").set(row);
        store.refresh();
    }

    return new ViewResult(
        <div style="height: 95%;" className="row">
            <div className={[expr("currentRow -> 'col-8'"), expr("not currentRow -> 'col-12'")]}>
                <Section title="Invoices">
                    <DataGrid data={expr("await dataSource")} onSelectionChanged={onSelect} >
                        <TextColumn field="description" display="Description" />
                        <TextColumn field="invoiceDate" display="Invoice Date" />
                    </DataGrid>
                    <footer style="height: 50px; margin: 0 16px; padding: 0;">
                        <button className="btn btn-primary" onClick={expr("currentRow <- createNew()")}>
                            <span className="fa fa-plus"></span> Add New</button>
                    </footer>
                </Section>
            </div>
            <If expr={expr("currentRow")}>
                <div className="col-4">
                    <Section title={expr("currentRow.description")} onCancel={expr("cancel")}>
                        <TextEditor field="description" display="Description" />

                        <div className="form-group" style="padding: 10px; background-color: #EEE; border: 1px solid #DDD;">
                            <button className="btn btn-primary" onClick={expr("save ()")}>
                                <span className="fa fa-save"></span> Save</button>
                        </div>
                    </Section>
                </div>
            </If>
        </div>, store);
}

export function companies() {
    var store = new Re.Store(new CompanyRepository());

    var onSelect = row => {
        store.get("currentRow").set(row);
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
            <If expr={expr("currentRow")}>
                <div className="col-4">
                    <Section title={expr("currentRow.description")} onCancel={expr("cancel")}>
                        <TextEditor field="name" display="Company Name" />

                        <div className="form-group" style="padding: 10px; background-color: #EEE; border: 1px solid #DDD;">
                            <button className="btn btn-primary" onClick={expr("save ()")}>
                                <span className="fa fa-save"></span> Save</button>
                        </div>
                    </Section>
                </div>
            </If>
        </div>, store);
}

var MenuItem = ({name}) => <li><a href="http://www.google.nl">menu item {name}</a></li>;

interface IAppAction {
    path: string,
    display?: string;
}

var actions: IAppAction[] = [
    { path: "timesheet", display: "Timesheet" },
    { path: "invoices", display: "Invoices" },
    { path: "todos", display: "Todos" },
    { path: "companies", display: "Companies" },
    { path: "users", display: "Users" },
    { path: "graph", display: "Graph" },
    { path: "balls", display: "Balls" }
];

var mainMenu: (url: UrlHelper) => Template.INode = (url: UrlHelper) =>
    <ul className="main-menu-ul">
        {actions.map(x => (
            <li className="main-menuitem">
                <a className="main-menuitem-link" href="" onClick={url.action(x.path)}>{x.display || x.path}</a>
            </li>))}
    </ul>;

var panel = n =>
    <section className="mdl-layout__tab-panel" id={"scroll-tab-" + n}>
        <div className="page-content">tab {n}</div>
    </section>;

export function graph() {
    return new ViewResult(<Lib.GraphApp />, new Re.Store({}));
}

function action() {

}