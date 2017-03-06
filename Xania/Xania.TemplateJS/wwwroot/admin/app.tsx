import { Xania as xania, Repeat, expr, Dom, RemoteObject, Reactive as Re, Template, Resource } from "../src/xania"
import { UrlHelper, ViewResult } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import TodoApp from "../sample/todos/app";
import DataGrid, { TextColumn } from "./grid"
import Lib = require("../diagram/lib");
import BallsApp from '../sample/balls/app';

var store = new Re.Store({
    user: "Ibrahim",
    users: new RemoteObject('/api/query/', "users"),
    currentUser: {},
    saveUser() {
        Resource.create("/api/user", this.currentUser).then((response: any) => {
            console.log("saved");
        });
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

export function users() {
    var onCancel = () => {
        store.get("currentUser").set({});
        store.refresh();
    }
    var onSelectUser = user => {
        store.get("currentUser").set(user);
        store.refresh();
    }

    return new ViewResult(
        <div style="height: 95%;" className="row">
            <div className={[expr("currentUser -> 'col-8'"), expr("not currentUser -> 'col-12'")]}>
                <section className="section" style="height: 100%">
                    <div style="padding: 0px 16px 100px 16px; height: 100%;">
                        <header style="height: 50px"><span className="fa fa-adjust"></span> <span>Users</span></header>
                        <DataGrid data={expr("await users")} onSelectionChanged={onSelectUser} >
                            <TextColumn field="name" display="User name" />
                            <TextColumn field="emailConfirmed" display="Email confirmed" />
                        </DataGrid>
                        <footer style="height: 50px; margin: 0 16px; padding: 0;"><button className="btn btn-primary" data-bind="click: users.create"><span className="glyphicon glyphicon-plus"></span> Add New</button></footer>
                    </div>
                </section>
            </div>
            <div className="col-4">
                <section className="section" style="height: 100%">
                    <button type="button" className="close" aria-hidden="true" style="margin: 16px 16px 0 0;" onClick={onCancel}>×</button>
                    <header style="height: 50px"><span className="fa fa-adjust"></span> <span>{expr("currentUser.name")}</span></header>

                    <div style="padding: 0px 16px 100px 16px; height: 100%;">
                        <div className="col-lg-12 col-md-3"><label className="control-label" for="UserName">User name</label><div>
                            <input className="form-control" type="text" placeholder="User name" name="currentUser.name" />
                        </div>
                        </div>
                        <div className="col-lg-12 col-md-3"><label className="control-label" for="Email">Email</label>
                            <div><input id="Email" className="form-control" type="text" placeholder="Email" name="currentUser.email" /></div>
                        </div>
                        <div className="col-lg-12 col-md-3"><div>
                            <input type="checkbox" checked={expr("currentUser.emailConfirmed")} /> <label className="control-label" for="EmailConfirmed">Email confirmed</label>
                        </div></div>
                        <div className="col-lg-12 col-md-3">
                            <button className="btn btn-primary" onClick={expr("saveUser ()")}>
                                <span className="fa fa-save"></span> Save</button>
                        </div>
                    </div>
                </section>
            </div>
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