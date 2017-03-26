import xania, { Repeat, List, With, If, expr, Dom, RemoteDataSource, ModelRepository, Reactive as Re, Template } from "../src/xania"
import Html from '../src/html'
import { UrlHelper, View } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import TodoApp from "../sample/todos/app";
import DataGrid, { TextColumn } from "./grid"
import Lib = require("../diagram/lib");
import BallsApp from "../sample/balls/app";
import { Section } from "./layout"

export function menu({ driver, html, url }) {
    return mainMenu(url)
        .bind(driver)
        .update(new Re.Store({}));
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
    { path: "balls", display: "Balls" },
    { path: "stacked", display: "Stacked" }
];

var mainMenu: (url: UrlHelper) => Template.INode = (url: UrlHelper) =>
    <ul className="main-menu-ul">
        {actions.map(x => (
            <li className="main-menuitem">
                <a className="main-menuitem-link" href="" onClick={url.action(x.path)}>{x.display || x.path}</a>
            </li>))}
    </ul>;

export function index() {
    return View(<div>index</div>);
}

export function timesheet() {
    var time = new Observables.Time();
    var toggleTime = () => {
        time.toggle();
    };
    return View(<div>timesheet {expr("await time")}
        <button onClick={toggleTime}>toggle time</button>
        <ClockApp time={expr("await time")} />
    </div>, new Re.Store({ time }));
}

export function todos() {
    return View(<TodoApp />);
}

export function graph() {
    return View(<Lib.GraphApp />, new Re.Store({}));
}

export function balls() {
    return View(<BallsApp />);
}

export function stacked() {
    return View(
        <div>
            <div>
                <button onClick={expr("templates.push tpl1")}>push 1</button>
                <button onClick={expr("templates.push tpl2")}>push 2</button>
                <button onClick={expr("templates.pop ()")}>Pop</button>
            </div>
            <Repeat source={expr("for n in templates")} >
                <section>
                    <Html.Partial template={expr("n")} />
                </section>
            </Repeat>
        </div>, new Re.Store({
            templates: [],
            tpl1: <div style="border: 1px solid red; color: red; padding: 2px 10px; margin: 2px; float: left;">template 1</div>,
            tpl2: <div style="border: 1px solid green; color: green; padding: 2px 10px; margin: 2px; float: left;">template 2</div>
        })
    );
}

