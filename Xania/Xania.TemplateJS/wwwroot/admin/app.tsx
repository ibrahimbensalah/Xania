import { Xania as xania, ForEach, fs, View, Dom, Reactive as Re, Template } from "../src/xania"
import { UrlHelper, ViewResult } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import { TodoApp } from "../sample/layout/todo";
var time = new Observables.Time();
var store = new Re.Store({
    user: "Ibrahim",
    time
});

export function index() {
    return new ViewResult(<div>index</div>, store);
}

export function menu({ driver, html, url }) {
    mainMenu(url).bind<Re.Binding>(Dom.DomVisitor)
        .update(new Re.Store({}), driver);
}

export function invoices() {
    return new ViewResult(<div>invoices {fs("user")}</div>, store);
}

var toggleTime = () => {
    time.toggle();
};

export function timesheet() {
    return new ViewResult(<div>timesheet {fs("await time")}
        <button onClick={toggleTime}>toggle time</button>
        <ClockApp time={time} />
    </div>, store);
}

export function todos() {
    return new ViewResult(<TodoApp />);
}

var MenuItem = ({name}) => <li><a href="http://www.google.nl">menu item {name}</a></li>;

var mainMenu: (url: UrlHelper) => Template.INode = (url: UrlHelper) =>
    <ul className="main-menu-ul">
        {["timesheet", "invoices", "todos"].map(actionName => (
            <li className="main-menuitem">
                <a className="main-menuitem-link" href="" onClick={url.action(actionName)}>{actionName}</a>
            </li>))}
    </ul>;

var panel = n =>
    <section className="mdl-layout__tab-panel" id={"scroll-tab-" + n}>
        <div className="page-content">tab {n}</div>
    </section>;