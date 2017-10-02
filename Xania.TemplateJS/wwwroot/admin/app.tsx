import xania, { expr, Reactive as Re, Template } from "../src/xania"
import { UrlHelper, View } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import TodoApp from "../sample/todos/app";
import { GraphApp } from "../diagram/lib";
import BallsApp from "../sample/balls/app";
import defaultLayout from "./layout";

export function menu({ driver, html, url }) {
    return mainMenu(url)
        .bind(driver)
        .update(new Re.Store({}));
}

interface IAppAction {
    path: string,
    display?: string;
    icon?: string;
}

var actions: IAppAction[] = [
    { path: "clock", display: "Clock", icon: "icon-clock" },
    { path: "invoices", display: "Invoices" },
    { path: "companies", display: "Companies" },
    { path: "users", display: "Users" },
    { path: "graph", display: "Graph" },
    { path: "balls", display: "Balls" },
    { path: "hierachical", display: "Hierarchical url", icon: "icon-speedometer" }
];

var mainMenu: (url: UrlHelper) => Template.INode = (url: UrlHelper) =>
    <ul className="nav">
        <li className="nav-title">
            Demos
        </li>
        {actions.map(x => (
            <li className="nav-item">
                <a className="nav-link" href="" onClick={url.action(x.path)}><i className={x.icon || "icon-star"}></i> {x.display || x.path}</a>
            </li>))}
    </ul>;

export function index() {
    return View(<div>index</div>);
}

export function clock() {
    var time = new Observables.Time();
    var toggleTime = () => {
        time.toggle();
    };
    return View(<div>Clock {expr("await time")}
        <button onClick={toggleTime}>toggle time</button>
        <ClockApp time={expr("await time")} />
    </div>, new Re.Store({ time }));
}

export function graph() {
    return View(<GraphApp />, new Re.Store({}));
}

export function balls() {
    return View(<BallsApp />);
}

export function hierachical({ url }) {
    var rootView =
        <div>
            <h3>root</h3>
            <input />
            <div>
                goto <a href="" onClick={url.action("level1a")}>level 1a</a>
            </div>
            <div>
                goto <a href="" onClick={url.action("level1b")}>level 1b</a>
            </div>
        </div>;
    return View(rootView).route({ level1a, level1b });
}

function level1a({ url }) {
    return View(
        <div>
            <h3>level 1a</h3>
            goto <a href="" onClick={url.action("todos")}>Todos</a>
        </div>
    ).route({ todos });
}

function level1b({ url }) {
    return View(
        <div>
            <h3>level 1b</h3>
            goto <a href="" onClick={url.action("todos")}>Todos</a>
        </div>
    ).route({ todos });
}

function todos() {
    return View(
        <div>
            <h3>level 2 [{expr("firstName")}] {expr("show")}</h3>
            <TodoApp show={expr("show")} />
            <div>
                show <input type="text" name="show" />
            </div>
        </div>,
        new Re.Store({ firstName: "ibrahim", show: "active" })
    );
}

export var layout = defaultLayout;