import xania, { List, expr, Reactive as Re } from "../src/xania"
import { UrlHelper, View } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import TodoApp from "../sample/todos/app";
import { GraphApp } from "../diagram/lib";
import BallsApp from "../sample/balls/app";
import defaultLayout from "./layout";
import { parse } from "../src/compile";
import { LineGraph, DotGraph, PieChart } from "./charts"

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

declare function fetch<T>(url: string, config?): Promise<T>;

var actions: IAppAction[] = [
    // { path: "companies", display: "Companies" },
    // { path: "users", display: "Users" }
];

function menuItems() {
    var config = {
        method: "POST",
        headers: { 'Content-Type': "application/json" },
        body: JSON.stringify(parse("menuItems")),
        credentials: 'same-origin'
    };

    return fetch('/api/xaniadb', config)
        .then((response: any) => {
            return response.json();
        });
}

function goto(url, path) {
    document.body.classList.remove('sidebar-mobile-show');
    return url.goto(path);
}

var mainMenu: (url: UrlHelper) => any = (url: UrlHelper) =>
    <ul className="nav">
        <li className="nav-title">
            Demos
        </li>
        <li className="nav-item">
            <a className="nav-link" href="#" onClick={url.action('/index')}><i className={"icon-star"}></i> Dashboard</a>
        </li>
        {menuItems().then(items => (
            <List source={items}>
                <li className="nav-item">
                    <a className="nav-link" href="#" onClick={expr("goto path", { goto: ((path) => goto(url, path)) })}><i className={"icon-star"}></i> {expr("display")}</a>
                </li>
            </List>
        ))}
        {actions.map(x => (
            <li className="nav-item">
                <a className="nav-link" href="" onClick={url.action(x.path)}><i className={x.icon || "icon-star"}></i> {x.display || x.path}</a>
            </li>))}
        <li className="nav-item">
            <a className="nav-link" href="/sample/dbmon/index.html"><i className="icon-star"></i> dbmon</a>
        </li>
    </ul>;

export function index() {
    var model = new Re.Store({
        x: "0", title: "Dashboard"
    });
    return View(
        <div class="row">
            <div class="col-6">
                <LineGraph />
            </div>
            <div class="col-6" style="overflow: hidden">
                <DotGraph />
            </div>
            <div class="col-6">
                <PieChart />
            </div>
        </div>,
        model
    );
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