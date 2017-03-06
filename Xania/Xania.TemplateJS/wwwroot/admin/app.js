"use strict";
var xania_1 = require("../src/xania");
var mvc_1 = require("../src/mvc");
require("./admin.css");
var observables_1 = require("../src/observables");
var app_1 = require("../sample/clock/app");
var todo_1 = require("../sample/layout/todo");
var grid_1 = require("./grid");
var Lib = require("../diagram/lib");
var app_2 = require("../sample/balls/app");
var store = new xania_1.Reactive.Store({
    user: "Ibrahim",
    users: new xania_1.RemoteObject('/api/query/', "users"),
    currentUser: {},
    saveUser: function () {
        console.log("save user", this.currentUser);
    }
});
function balls() {
    return new mvc_1.ViewResult(xania_1.Xania.tag(app_2.default, null));
}
exports.balls = balls;
function index() {
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", null, "index"), store);
}
exports.index = index;
function menu(_a) {
    var driver = _a.driver, html = _a.html, url = _a.url;
    mainMenu(url).bind()
        .update(new xania_1.Reactive.Store({}), driver);
}
exports.menu = menu;
function invoices() {
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", null,
        xania_1.Xania.tag("div", null,
            "invoices ",
            xania_1.expr("user")),
        xania_1.Xania.tag(xania_1.Repeat, { source: xania_1.expr("await users") },
            xania_1.Xania.tag("div", null,
                xania_1.expr("name"),
                " ",
                xania_1.expr("email"),
                " ",
                xania_1.expr("roles")))), store);
}
exports.invoices = invoices;
function timesheet() {
    var time = new observables_1.Observables.Time();
    var toggleTime = function () {
        time.toggle();
    };
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", null,
        "timesheet ",
        xania_1.expr("await time"),
        xania_1.Xania.tag("button", { onClick: toggleTime }, "toggle time"),
        xania_1.Xania.tag(app_1.ClockApp, { time: xania_1.expr("await time") })), new xania_1.Reactive.Store({ time: time }));
}
exports.timesheet = timesheet;
function todos() {
    return new mvc_1.ViewResult(xania_1.Xania.tag(todo_1.TodoApp, null));
}
exports.todos = todos;
function users() {
    var onCancel = function () {
        store.get("currentUser").set({});
        store.refresh();
    };
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", { style: "height: 95%;", className: "row" },
        xania_1.Xania.tag("div", { className: [xania_1.expr("currentUser -> 'col-8'"), xania_1.expr("not currentUser -> 'col-12'")] },
            xania_1.Xania.tag("section", { className: "section", style: "height: 100%" },
                xania_1.Xania.tag("div", { style: "padding: 0px 16px 100px 16px; height: 100%;" },
                    xania_1.Xania.tag("header", { style: "height: 50px" },
                        xania_1.Xania.tag("span", { className: "fa fa-adjust" }),
                        " ",
                        xania_1.Xania.tag("span", null, "Users")),
                    xania_1.Xania.tag(grid_1.default, { activeRecord: xania_1.expr("currentUser"), data: xania_1.expr("await users") }),
                    xania_1.Xania.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", "data-bind": "click: users.create" },
                            xania_1.Xania.tag("span", { className: "glyphicon glyphicon-plus" }),
                            " Add New"))))),
        xania_1.Xania.tag("div", { className: "col-4" },
            xania_1.Xania.tag("section", { className: "section", style: "height: 100%" },
                xania_1.Xania.tag("button", { type: "button", className: "close", "aria-hidden": "true", style: "margin: 16px 16px 0 0;", onClick: onCancel }, "\u00D7"),
                xania_1.Xania.tag("header", { style: "height: 50px" },
                    xania_1.Xania.tag("span", { className: "fa fa-adjust" }),
                    " ",
                    xania_1.Xania.tag("span", null, "User")),
                xania_1.Xania.tag("div", { style: "padding: 0px 16px 100px 16px; height: 100%;" },
                    xania_1.Xania.tag("header", { style: "height: 50px" },
                        xania_1.Xania.tag("span", { className: "fa fa-adjust" }),
                        xania_1.Xania.tag("span", null, xania_1.expr("currentUser.Name"))),
                    xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                        xania_1.Xania.tag("label", { className: "control-label", for: "UserName" }, "User name"),
                        xania_1.Xania.tag("div", null,
                            xania_1.Xania.tag("input", { className: "form-control", type: "text", placeholder: "User name", name: "currentUser.Name" }))),
                    xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                        xania_1.Xania.tag("label", { className: "control-label", for: "Email" }, "Email"),
                        xania_1.Xania.tag("div", null,
                            xania_1.Xania.tag("input", { id: "Email", className: "form-control", type: "text", placeholder: "Email", name: "currentUser.Email" }))),
                    xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                        xania_1.Xania.tag("div", null,
                            xania_1.Xania.tag("input", { type: "checkbox", checked: xania_1.expr("currentUser.EmailConfirmed") }),
                            " ",
                            xania_1.Xania.tag("label", { className: "control-label", for: "EmailConfirmed" }, "Email confirmed"))),
                    xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("saveUser ()") },
                            xania_1.Xania.tag("span", { className: "fa fa-save" }),
                            " Save")))))), store);
}
exports.users = users;
var MenuItem = function (_a) {
    var name = _a.name;
    return xania_1.Xania.tag("li", null,
        xania_1.Xania.tag("a", { href: "http://www.google.nl" },
            "menu item ",
            name));
};
var actions = [
    { path: "timesheet", display: "Timesheet" },
    { path: "invoices", display: "Invoices" },
    { path: "todos", display: "Todos" },
    { path: "users", display: "Users" },
    { path: "graph", display: "Graph" },
    { path: "balls", display: "Balls" }
];
var mainMenu = function (url) {
    return xania_1.Xania.tag("ul", { className: "main-menu-ul" }, actions.map(function (x) { return (xania_1.Xania.tag("li", { className: "main-menuitem" },
        xania_1.Xania.tag("a", { className: "main-menuitem-link", href: "", onClick: url.action(x.path) }, x.display || x.path))); }));
};
var panel = function (n) {
    return xania_1.Xania.tag("section", { className: "mdl-layout__tab-panel", id: "scroll-tab-" + n },
        xania_1.Xania.tag("div", { className: "page-content" },
            "tab ",
            n));
};
function graph() {
    return new mvc_1.ViewResult(xania_1.Xania.tag(Lib.GraphApp, null), new xania_1.Reactive.Store({}));
}
exports.graph = graph;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQXdHO0FBQ3hHLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5Qyw4Q0FBZ0Q7QUFDaEQsK0JBQTZCO0FBQzdCLG9DQUF1QztBQUN2QywyQ0FBMkM7QUFFM0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQztJQUNyQixJQUFJLEVBQUUsU0FBUztJQUNmLEtBQUssRUFBRSxJQUFJLG9CQUFZLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQztJQUMvQyxXQUFXLEVBQUUsRUFBRTtJQUNmLFFBQVE7UUFDSixPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDL0MsQ0FBQztDQUNKLENBQUMsQ0FBQztBQUVIO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQyxrQkFBQyxhQUFRLE9BQUcsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUFGRCxzQkFFQztBQUVEO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQyx1Q0FBZ0IsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRkQsc0JBRUM7QUFFRCxjQUFxQixFQUFxQjtRQUFuQixrQkFBTSxFQUFFLGNBQUksRUFBRSxZQUFHO0lBQ3BDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUU7U0FDZixNQUFNLENBQUMsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBSEQsb0JBR0M7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQ2pCO1FBQ0k7O1lBQWUsWUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFPO1FBQ2xDLGtCQUFDLGNBQU0sSUFBQyxNQUFNLEVBQUUs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LCBEb20sIFJlbW90ZU9iamVjdCwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IFVybEhlbHBlciwgVmlld1Jlc3VsdCB9IGZyb20gXCIuLi9zcmMvbXZjXCJcclxuaW1wb3J0ICcuL2FkbWluLmNzcydcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vc3JjL29ic2VydmFibGVzXCI7XHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSAnLi4vc2FtcGxlL2Nsb2NrL2FwcCdcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuLi9zYW1wbGUvbGF5b3V0L3RvZG9cIjtcclxuaW1wb3J0IERhdGFHcmlkIGZyb20gXCIuL2dyaWRcIlxyXG5pbXBvcnQgTGliID0gcmVxdWlyZShcIi4uL2RpYWdyYW0vbGliXCIpO1xyXG5pbXBvcnQgQmFsbHNBcHAgZnJvbSAnLi4vc2FtcGxlL2JhbGxzL2FwcCc7XHJcblxyXG52YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUoe1xyXG4gICAgdXNlcjogXCJJYnJhaGltXCIsXHJcbiAgICB1c2VyczogbmV3IFJlbW90ZU9iamVjdCgnL2FwaS9xdWVyeS8nLCBcInVzZXJzXCIpLFxyXG4gICAgY3VycmVudFVzZXI6IHt9LFxyXG4gICAgc2F2ZVVzZXIoKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJzYXZlIHVzZXJcIiwgdGhpcy5jdXJyZW50VXNlcik7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJhbGxzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxCYWxsc0FwcCAvPik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbmRleCgpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8ZGl2PmluZGV4PC9kaXY+LCBzdG9yZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZW51KHsgZHJpdmVyLCBodG1sLCB1cmwgfSkge1xyXG4gICAgbWFpbk1lbnUodXJsKS5iaW5kKClcclxuICAgICAgICAudXBkYXRlKG5ldyBSZS5TdG9yZSh7fSksIGRyaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbnZvaWNlcygpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdChcclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICA8ZGl2Pmludm9pY2VzIHtleHByKFwidXNlclwiKX08L2Rpdj5cclxuICAgICAgICAgICAgPFJlcGVhdCBzb3VyY2U9e2V4cHIoXCJhd2FpdCB1c2Vyc1wiKX0+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PntleHByKFwibmFtZVwiKX0ge2V4cHIoXCJlbWFpbFwiKX0ge2V4cHIoXCJyb2xlc1wiKX08L2Rpdj5cclxuICAgICAgICAgICAgPC9SZXBlYXQ+XHJcbiAgICAgICAgPC9kaXY+LCBzdG9yZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0aW1lc2hlZXQoKSB7XHJcbiAgICB2YXIgdGltZSA9IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCk7XHJcbiAgICB2YXIgdG9nZ2xlVGltZSA9ICgpID0+IHtcclxuICAgICAgICB0aW1lLnRvZ2dsZSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8ZGl2PnRpbWVzaGVldCB7ZXhwcihcImF3YWl0IHRpbWVcIil9XHJcbiAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0b2dnbGVUaW1lfT50b2dnbGUgdGltZTwvYnV0dG9uPlxyXG4gICAgICAgIDxDbG9ja0FwcCB0aW1lPXtleHByKFwiYXdhaXQgdGltZVwiKX0gLz5cclxuICAgIDwvZGl2PiwgbmV3IFJlLlN0b3JlKHsgdGltZSB9KSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2RvcygpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8VG9kb0FwcCAvPik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1c2VycygpIHtcclxuICAgIHZhciBvbkNhbmNlbCA9ICgpID0+IHtcclxuICAgICAgICBzdG9yZS5nZXQoXCJjdXJyZW50VXNlclwiKS5zZXQoe30pO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdChcclxuICAgICAgICA8ZGl2IHN0eWxlPVwiaGVpZ2h0OiA5NSU7XCIgY2xhc3NOYW1lPVwicm93XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbZXhwcihcImN1cnJlbnRVc2VyIC0+ICdjb2wtOCdcIiksIGV4cHIoXCJub3QgY3VycmVudFVzZXIgLT4gJ2NvbC0xMidcIildfT5cclxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInNlY3Rpb25cIiBzdHlsZT1cImhlaWdodDogMTAwJVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAwcHggMTZweCAxMDBweCAxNnB4OyBoZWlnaHQ6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj48c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hZGp1c3RcIj48L3NwYW4+IDxzcGFuPlVzZXJzPC9zcGFuPjwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgYWN0aXZlUmVjb3JkPXtleHByKFwiY3VycmVudFVzZXJcIil9IGRhdGE9e2V4cHIoXCJhd2FpdCB1c2Vyc1wiKX0gLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGZvb3RlciBzdHlsZT1cImhlaWdodDogNTBweDsgbWFyZ2luOiAwIDE2cHg7IHBhZGRpbmc6IDA7XCI+PGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBkYXRhLWJpbmQ9XCJjbGljazogdXNlcnMuY3JlYXRlXCI+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzXCI+PC9zcGFuPiBBZGQgTmV3PC9idXR0b24+PC9mb290ZXI+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC00XCI+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHN0eWxlPVwibWFyZ2luOiAxNnB4IDE2cHggMCAwO1wiIG9uQ2xpY2s9e29uQ2FuY2VsfT7DlzwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj48c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hZGp1c3RcIj48L3NwYW4+IDxzcGFuPlVzZXI8L3NwYW4+PC9oZWFkZXI+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAwcHggMTZweCAxMDBweCAxNnB4OyBoZWlnaHQ6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFkanVzdFwiPjwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntleHByKFwiY3VycmVudFVzZXIuTmFtZVwiKX08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiVXNlck5hbWVcIj5Vc2VyIG5hbWU8L2xhYmVsPjxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIlVzZXIgbmFtZVwiIG5hbWU9XCJjdXJyZW50VXNlci5OYW1lXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiRW1haWxcIj5FbWFpbDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjxpbnB1dCBpZD1cIkVtYWlsXCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIkVtYWlsXCIgbmFtZT1cImN1cnJlbnRVc2VyLkVtYWlsXCIgLz48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtleHByKFwiY3VycmVudFVzZXIuRW1haWxDb25maXJtZWRcIil9IC8+IDxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiRW1haWxDb25maXJtZWRcIj5FbWFpbCBjb25maXJtZWQ8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcInNhdmVVc2VyICgpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1zYXZlXCI+PC9zcGFuPiBTYXZlPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxudmFyIE1lbnVJdGVtID0gKHtuYW1lfSkgPT4gPGxpPjxhIGhyZWY9XCJodHRwOi8vd3d3Lmdvb2dsZS5ubFwiPm1lbnUgaXRlbSB7bmFtZX08L2E+PC9saT47XHJcblxyXG5pbnRlcmZhY2UgSUFwcEFjdGlvbiB7XHJcbiAgICBwYXRoOiBzdHJpbmcsXHJcbiAgICBkaXNwbGF5Pzogc3RyaW5nO1xyXG59XHJcblxyXG52YXIgYWN0aW9uczogSUFwcEFjdGlvbltdID0gW1xyXG4gICAgeyBwYXRoOiBcInRpbWVzaGVldFwiLCBkaXNwbGF5OiBcIlRpbWVzaGVldFwiIH0sXHJcbiAgICB7IHBhdGg6IFwiaW52b2ljZXNcIiwgZGlzcGxheTogXCJJbnZvaWNlc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidG9kb3NcIiwgZGlzcGxheTogXCJUb2Rvc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidXNlcnNcIiwgZGlzcGxheTogXCJVc2Vyc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwiZ3JhcGhcIiwgZGlzcGxheTogXCJHcmFwaFwiIH0sXHJcbiAgICB7IHBhdGg6IFwiYmFsbHNcIiwgZGlzcGxheTogXCJCYWxsc1wiIH1cclxuXTtcclxuXHJcbnZhciBtYWluTWVudTogKHVybDogVXJsSGVscGVyKSA9PiBUZW1wbGF0ZS5JTm9kZSA9ICh1cmw6IFVybEhlbHBlcikgPT5cclxuICAgIDx1bCBjbGFzc05hbWU9XCJtYWluLW1lbnUtdWxcIj5cclxuICAgICAgICB7YWN0aW9ucy5tYXAoeCA9PiAoXHJcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtXCI+XHJcbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtLWxpbmtcIiBocmVmPVwiXCIgb25DbGljaz17dXJsLmFjdGlvbih4LnBhdGgpfT57eC5kaXNwbGF5IHx8IHgucGF0aH08L2E+XHJcbiAgICAgICAgICAgIDwvbGk+KSl9XHJcbiAgICA8L3VsPjtcclxuXHJcbnZhciBwYW5lbCA9IG4gPT5cclxuICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm1kbC1sYXlvdXRfX3RhYi1wYW5lbFwiIGlkPXtcInNjcm9sbC10YWItXCIgKyBufT5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2UtY29udGVudFwiPnRhYiB7bn08L2Rpdj5cclxuICAgIDwvc2VjdGlvbj47XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ3JhcGgoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPExpYi5HcmFwaEFwcCAvPiwgbmV3IFJlLlN0b3JlKHt9KSk7XHJcbn0iXX0=