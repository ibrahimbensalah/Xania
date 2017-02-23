import { Xania as xania, ForEach, fs, View, Dom, Reactive as Re, Template } from "../src/xania"
import { UrlHelper, ViewResult } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import { TodoApp } from "../sample/layout/todo";
import DataGrid from "./grid"

var time = new Observables.Time();
var store = new Re.Store({
    user: "Ibrahim",
    time,
    currentRow: null
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

export function users() {
    var onRowChanged = (row) => {
        store.get("currentRow").set(row);
        store.refresh();
    }
    var onCancel = () => {
        store.get("currentRow").set(null);
        store.refresh();
    }
    return new ViewResult(
        <div style="height: 95%;" className="row">
            <div className={[fs("currentRow -> 'col-6'"), fs("not currentRow -> 'col-12'")]}>
                <section className="section" style="height: 100%">
                    <div style="padding: 0px 16px 100px 16px; height: 100%;">
                        <header style="height: 50px"><span className="fa fa-adjust"></span> <span>Users</span></header>
                        <DataGrid onRowChanged={onRowChanged} />
                        <footer style="height: 50px; margin: 0 16px; padding: 0;"><button className="btn btn-primary" data-bind="click: users.create"><span className="glyphicon glyphicon-plus"></span> Add New</button></footer>
                    </div>
                </section>
            </div>
            <ForEach expr={fs("currentRow")}>
                <div className="col-6">
                    <section className="section" style="height: 100%">
                        <button type="button" className="close" aria-hidden="true" style="margin: 16px 16px 0 0;" onClick={onCancel}>×</button>
                        <header style="height: 50px"><span className="fa fa-adjust"></span> <span>User</span></header>

                        <div style="padding: 0px 16px 100px 16px; height: 100%;"><header style="height: 50px">
                            <span className="glyphicon glyphicon-adjust"></span>
                            <span data-bind="text: UserName || '&nbsp;'">{fs("data.Name")}</span></header>
                            <div className="col-lg-12 col-md-3"><label className="control-label" for="UserName">User name</label><div>
                                <input className="form-control" type="text" placeholder="User name" name="data.Name" />
                            </div>
                            </div>
                            <div className="col-lg-12 col-md-3"><label className="control-label" for="Email">Email</label>
                                <div><input id="Email" className="form-control" type="text" placeholder="Email" name="data.Email" /></div>
                            </div>
                            <div className="col-lg-12 col-md-3"><div>
                                <input type="checkbox" checked={ fs("data.EmailConfirmed") } /> <label className="control-label" for="EmailConfirmed">Email confirmed</label>
                            </div>
                            </div>
                            <div className="col-lg-12 col-md-3"><label className="control-label" for="Projects">Projects</label>

                                <div data-name="Projects" className="dropdown input-group-btn" data-bind="multiselect: Projects" data-url="/api/project" data-valuefield="Id" data-textfield="Name" data-multiselect="true">
                                    <div className="dropdown-toggle form-control" data-toggle="dropdown" style="padding: 4px; width: 100%; overflow: auto; height: auto; min-height: 34px; white-space: normal;">

                                        <span style="line-height: 23px; margin-left: 10px; color: #AAA;" data-bind="visible: !selected().length &amp;&amp; !ds.includeNull()">Projects</span>
                                        <a className="xn-focus-point" href="#" onfocus="$(this).closest('.dropdown-toggle').dropdown('toggle')">&nbsp;</a>
                                    </div>
                                    <div data-bind="dataSource: ds" className="xn-list dropdown-menu pull-right" role="listbox" aria-labelledby="dropdownMenu1" style="padding: 0px 0px; width: 100%;">
                                        <input tabindex="-1" className="xn-list-filter" placeholder="Search..." onclick="event.stopPropagation()" data-bind="value: filter" />
                                        <div className="xn-list-scrollable" style="max-height: 200px; overflow: auto;" role="listbox">
                                            <div className="xn-content" style="padding-top: 0px; height: 0px;">
                                                <table className="xn-grid" style="width: 100%;">
                                                    <tbody>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div>
                                            <button data-bind="click: post.bind($data, 'Name', filter())">Add new</button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div className="col-lg-12 col-md-3"><div className="xn-files" style="height: 100px;" data-bind="files: ''"></div></div>
                            <div className="col-lg-12 col-md-3">
                                <button className="btn btn-primary" data-bind="click: save">
                                    <span className="glyphicon glyphicon-floppy-disk"></span> Save</button>
                            </div>
                        </div>

                    </section>
                </div>
            </ForEach>
        </div>, store);
}

var MenuItem = ({name}) => <li><a href="http://www.google.nl">menu item {name}</a></li>;

var mainMenu: (url: UrlHelper) => Template.INode = (url: UrlHelper) =>
    <ul className="main-menu-ul">
        {["timesheet", "invoices", "todos", "users"].map(actionName => (
            <li className="main-menuitem">
                <a className="main-menuitem-link" href="" onClick={url.action(actionName)}>{actionName}</a>
            </li>))}
    </ul>;

var panel = n =>
    <section className="mdl-layout__tab-panel" id={"scroll-tab-" + n}>
        <div className="page-content">tab {n}</div>
    </section>;