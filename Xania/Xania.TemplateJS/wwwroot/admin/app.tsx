import { Xania as xania, Repeat, With, If, expr, Dom, RemoteDataSource, ModelRepository, Reactive as Re, Template } from "../src/xania"
import Html from '../src/html'
import { UrlHelper, ViewResult } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import TodoApp from "../sample/todos/app";
import DataGrid, { TextColumn } from "./grid"
import Lib = require("../diagram/lib");
import BallsApp from "../sample/balls/app";
import { Section } from "./layout"

export function menu({ driver, html, url }) {
    mainMenu(url).bind()
        .update(new Re.Store({}), driver);
}

interface IAppAction {
    path: string,
    display?: string;
}

var actions: IAppAction[] = [
    { path: "timesheet", display: "Timesheet" },
    { path: "views/invoices", display: "Invoices" },
    { path: "todos", display: "Todos" },
    { path: "views/companies", display: "Companies" },
    { path: "views/users", display: "Users" },
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

export function index() {
    return new ViewResult(<div>index</div>);
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

export function graph() {
    return new ViewResult(<Lib.GraphApp />, new Re.Store({}));
}

export function balls() {
    return new ViewResult(<BallsApp />);
}

