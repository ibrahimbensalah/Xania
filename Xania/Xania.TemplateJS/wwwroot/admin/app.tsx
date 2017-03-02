import { Xania as xania, Repeat, expr, Dom, RemoteObject, Reactive as Re, Template } from "../src/xania"
import { UrlHelper, ViewResult } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import { TodoApp } from "../sample/layout/todo";
import DataGrid from "./grid"

var store = new Re.Store({
    user: "Ibrahim",
    users: new RemoteObject('/api/query/', "users"),
    currentUser: {},
    saveUser() {
        console.log("save user", this.currentUser);
    }
});


export function index() {
    return new ViewResult(<div>index</div>, store);
}

export function menu({ driver, html, url }) {
    mainMenu(url).bind()
        .update(new Re.Store({}), driver);
}

export function invoices() {
    var setProps1 = (obj: {}, symbols: any[]) => {
        var i = symbols.length;
        while (i--) {
            var sym = symbols[i];
            obj[sym] = i;
        }
    };
    var setProps2 = (obj: {}, symbols: any[]) => {
        var key = Symbol();
        var values = [];
        obj[key] = values;
        var i = symbols.length;
        while (i--) {
            var sym = symbols[i];
            values.push({sym: i});
        }
    };

    function test() {
        var props = [];
        var i = 1000;
        while (i--) {
            props.push("prop"+ i);
        }

        var iterations = 100000;

        for (let e = 0; e < iterations; e++) {
            const o = {};
            setProps1(o, props);
        }

        for (let e = 0; e < iterations; e++) {
            const o = {};
            setProps2(o, props);
        }
    }

    return new ViewResult(
        <div>
            invoices {expr("user")}
            <button onClick={test}>test</button>
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
    return new ViewResult(
        <div style="height: 95%;" className="row">
            <div className={[expr("currentUser -> 'col-8'"), expr("not currentUser -> 'col-12'")]}>
                <section className="section" style="height: 100%">
                    <div style="padding: 0px 16px 100px 16px; height: 100%;">
                        <header style="height: 50px"><span className="fa fa-adjust"></span> <span>Users</span></header>
                        <DataGrid activeRecord={expr("currentUser")} data={expr("await users")} />
                        <footer style="height: 50px; margin: 0 16px; padding: 0;"><button className="btn btn-primary" data-bind="click: users.create"><span className="glyphicon glyphicon-plus"></span> Add New</button></footer>
                    </div>
                </section>
            </div>
            <div className="col-4">
                <section className="section" style="height: 100%">
                    <button type="button" className="close" aria-hidden="true" style="margin: 16px 16px 0 0;" onClick={onCancel}>×</button>
                    <header style="height: 50px"><span className="fa fa-adjust"></span> <span>User</span></header>

                    <div style="padding: 0px 16px 100px 16px; height: 100%;">
                        <header style="height: 50px">
                            <span className="fa fa-adjust"></span>
                            <span>{expr("currentUser.Name")}</span>
                        </header>
                        <div className="col-lg-12 col-md-3"><label className="control-label" for="UserName">User name</label><div>
                            <input className="form-control" type="text" placeholder="User name" name="currentUser.Name" />
                        </div>
                        </div>
                        <div className="col-lg-12 col-md-3"><label className="control-label" for="Email">Email</label>
                            <div><input id="Email" className="form-control" type="text" placeholder="Email" name="currentUser.Email" /></div>
                        </div>
                        <div className="col-lg-12 col-md-3"><div>
                            <input type="checkbox" checked={expr("currentUser.EmailConfirmed")} /> <label className="control-label" for="EmailConfirmed">Email confirmed</label>
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
    { path: "users", display: "Users" }
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