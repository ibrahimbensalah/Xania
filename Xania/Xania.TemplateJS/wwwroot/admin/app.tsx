import xania, { Repeat, expr, Reactive as Re, Template } from "../src/xania"
import Html from '../src/html'
import { UrlHelper, View, ViewResult, IViewContext } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import TodoApp from "../sample/todos/app";
import Lib = require("../diagram/lib");
import BallsApp from "../sample/balls/app";
import StackLayout from '../layout/stack'
import { IDriver } from "../src/template";
import { StackContainer } from "../layout/stack"

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
    { path: "timesheet", display: "Timesheet", icon: "icon-puzzle" },
    { path: "invoices", display: "Invoices" },
    { path: "companies", display: "Companies" },
    { path: "users", display: "Users" },
    { path: "graph", display: "Graph" },
    { path: "balls", display: "Balls" },
    { path: "stacked", display: "Stacked" },
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

export function graph() {
    return View(<Lib.GraphApp />, new Re.Store({}));
}

export function balls() {
    return View(<BallsApp />);
}

export function stacked({ url }) {
    return View(<StackLayout url={url} />)
        // child route
        .route({
            foo: ({ url }) => {
                return View(<div>hello child <a href="" onClick={() => url.action("bar")}>bar</a></div>)
                    // child child route
                    .route({
                        bar: () => View(<div>hello child of child</div>)
                    });
            }
        });
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

class StackLayoutView {
    private view;
    private views = [];

    constructor(private layout: Layout, private viewResult: ViewResult, parent: StackLayoutView = null) {
        this.views = parent
            ? parent.views.concat([viewResult])
            : [viewResult];

        this.view = View(
            <Repeat source={expr("for vw in views")}>
                <Html.Partial template={expr("vw")} />
            </Repeat>,
            new Re.Store({ views: this.views })
        );
    }

    get(path: string, viewContext: IViewContext) {
        return new StackLayoutView(this.layout, this.viewResult.get(path, viewContext), this);
    }

    bind(driver: IDriver) {
        return this.view.bind(driver);
    }
}

class Layout {
    private views = [];
    private store = new Re.Store(this);
    private view = View(
        <Repeat source={expr("for vw in views")}>
            <Html.Partial template={expr("vw")} />
        </Repeat>,
        this.store
    );

    update(views) {
        this.views = views;
        this.store.refresh();
    }
}

export var layout = source => (
    <StackContainer className="stack-container">
        <Repeat param="vw" source={ source }>
            <section className="stack-item">
                <div className="stack-item-content">
                    <header>Header 1</header>
                    <Html.Partial template={expr("await vw")} />
                </div>
            </section>
        </Repeat>
    </StackContainer>
);
