import { Xania as xania, Repeat, If, expr, Dom, RemoteObject, Reactive as Re, Template } from "../src/xania"
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
    ds: new RemoteObject('/api/query/', "users"),
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

export function invoices() {
    return new ViewResult(
        <div>
            <div>invoices {expr("user")}</div>
            <Repeat source={expr("await users")}>
                <div>{expr("name")} {expr("email")} {expr("roles")}</div>
            </Repeat>
        </div>, store);
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
            <header style="height: 50px"><span className="fa fa-adjust"></span> <span>Users</span></header>
            <div style="padding: 0px 16px 100px 16px; height: 100%;">
                {children}
            </div>
        </section>
    );
}

export function users() {
    var store = new Re.Store({
        dataSource: new RemoteObject('/api/query/', "users"),
        currentRow: null,
        save() {
            this.dataSource.save(this.currentRow);
            this.cancel();
        },
        cancel() {
            this.currentRow = false;
        },
        createNew() {
            return {
                name: "",
                email: "",
                emailConfirmed: false
            }
        }
    });

    var onSelect = user => {
        store.get("currentRow").set(user);
        store.refresh();
    }

    return new ViewResult(
        <div style="height: 95%;" className="row">
            <div className={[expr("currentRow -> 'col-8'"), expr("not currentRow -> 'col-12'")]}>
                <Section>
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
                    <Section onCancel={expr("cancel")}>
                        <div className="col-lg-12 col-md-3"><label className="control-label" for="UserName">User name</label><div>
                            <input className="form-control" type="text" placeholder="User name" name="currentRow.name" />
                        </div>
                        </div>
                        <div className="col-lg-12 col-md-3"><label className="control-label" for="Email">Email</label>
                            <div><input id="Email" className="form-control" type="text" placeholder="Email" name="currentRow.email" /></div>
                        </div>
                        <div className="col-lg-12 col-md-3"><div>
                            <input type="checkbox" checked={expr("currentRow.emailConfirmed")} /> <label className="control-label" for="EmailConfirmed">Email confirmed</label>
                        </div></div>
                        <div className="col-lg-12 col-md-3">
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