import { Xania as xania, ForEach, fs, View, Dom, Reactive as Re, Template } from "../src/xania"
import { UrlHelper } from "../src/mvc"

var store = new Re.Store({user: "Ibrahim"});

export function execute({ driver, html, url }) {

    const mainView = url.route(path => {
        switch (path) {
            case "index":
                return <div>index</div>;
            default: {
                return <div>undefined: {path}</div>;
            }
        }
    });

    xania.partial(mainView, store)
        .bind()
        .update(store, driver);
}

export function menu({ driver, html, url }) {
    mainMenu(url).bind<Re.Binding>(Dom.DomVisitor)
        .update(new Re.Store({}), driver);
}

export function invoices(url) {
    return <div >invoices { fs("user") }</div>;
}

var MenuItem = ({name}) => <li><a href="http://www.google.nl">menu item {name}</a></li>;

var mainMenu: (url: UrlHelper) => Template.INode = (url: UrlHelper) =>
    <ul className="main-menu-ul">
        <li className="main-menuitem"><a className="main-menuitem-link" href="" onClick={url.action('timesheet')}>Timesheet</a></li>
        <li className="main-menuitem"><a className="main-menuitem-link" href="" onClick={url.action('invoices')}>Invoices</a></li>
    </ul>;

var panel = n =>
    <section className="mdl-layout__tab-panel" id={"scroll-tab-" + n}>
        <div className="page-content">tab {n}</div>
    </section>;