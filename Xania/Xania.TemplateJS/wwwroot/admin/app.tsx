import xania, { Repeat, List, With, If, expr, Dom, RemoteDataSource, ModelRepository, Reactive as Re, Template, Component } from "../src/xania"
import Html from '../src/html'
import { UrlHelper, View, ViewResult, IViewContext } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import TodoApp from "../sample/todos/app";
import DataGrid, { TextColumn } from "./grid"
import Lib = require("../diagram/lib");
import BallsApp from "../sample/balls/app";
import { Section } from "./layout"
import StackLayout from '../layout/stack'

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
    { path: "invoices", display: "Invoices" },
    { path: "todos", display: "Todos" },
    { path: "companies", display: "Companies" },
    { path: "users", display: "Users" },
    { path: "graph", display: "Graph" },
    { path: "balls", display: "Balls" },
    { path: "stacked", display: "Stacked" },
    { path: "hierachical", display: "Hierarchical url" }
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

export function stacked({ url }) {
    return View(<StackLayout url={url} />)
        // child route
        .route("foo", ({ url }) => {
            return View(<div>hello child <a href="" onClick={() => url.action("bar")}>bar</a></div>)
                // child child route
                .route("bar", () => View(<div>hello child of child</div>));
        });
}

export function hierachical({ url }) {
    var rootView =
        <div>
            <h3>root</h3>
            goto <a href="" onClick={url.action("level1")}>level 1</a>
        </div>;
    return new StackLayoutView(View(rootView).route("level1", level1));
}

function level1({ url }) {
    return View(
        <div>
            <h3>level 1</h3>
            goto <a href="" onClick={url.action("level2")}>level 2</a>
        </div>
    ).route("level2", level2);
}

function level2() {
    return View(
        <div>
            <h3>level 2 {expr("firstName")}</h3>
        </div>, new Re.Store({ firstName: "ibrahim" })
    );
}

class StackLayoutView {
    private layout;
    private views = [];

    constructor(private viewResult: ViewResult, parent: StackLayoutView = null) {
        this.layout = View(
            <div>
                <h3>Layout</h3>
                <Repeat source={expr("for vw in views")} >
                    <Html.Partial template={expr("vw")} />
                </Repeat>
            </div>, new Re.Store(this)
        );
        this.views = parent
            ? parent.views.concat([viewResult])
            : [viewResult];
    }

    get(path: string, viewContext: IViewContext) {
        return new StackLayoutView(this.viewResult.get(path, viewContext), this);
    }

    execute(driver) {
        this.layout.execute(driver);
    }
}
