"use strict";
var xania_1 = require("../src/xania");
var mvc_1 = require("../src/mvc");
require("./admin.css");
var observables_1 = require("../src/observables");
var app_1 = require("../sample/clock/app");
var todo_1 = require("../sample/layout/todo");
var grid_1 = require("./grid");
var Lib = require("../diagram/lib");
var store = new xania_1.Reactive.Store({
    user: "Ibrahim",
    users: new xania_1.RemoteObject('/api/query/', "users"),
    currentUser: {},
    saveUser: function () {
        console.log("save user", this.currentUser);
    }
});
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
    { path: "graph", display: "Graph" }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQXdHO0FBQ3hHLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5Qyw4Q0FBZ0Q7QUFDaEQsK0JBQTZCO0FBQzdCLG9DQUF1QztBQUN2QyxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO0lBQ3JCLElBQUksRUFBRSxTQUFTO0lBQ2YsS0FBSyxFQUFFLElBQUksb0JBQVksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDO0lBQy9DLFdBQVcsRUFBRSxFQUFFO0lBQ2YsUUFBUTtRQUNKLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMvQyxDQUFDO0NBQ0osQ0FBQyxDQUFDO0FBR0g7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDLHVDQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFGRCxzQkFFQztBQUVELGNBQXFCLEVBQXFCO1FBQW5CLGtCQUFNLEVBQUUsY0FBSSxFQUFFLFlBQUc7SUFDcEMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRTtTQUNmLE1BQU0sQ0FBQyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFIRCxvQkFHQztBQUVEO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FDakI7UUFDSTs7WUFBZSxZQUFJLENBQUMsTUFBTSxDQUFDLENBQU87UUFDbEMsa0JBQUMsY0FBTSxJQUFDLE1BQU0sRUFBRSxZQUFJLENBQUMsYUFBYSxDQUFDO1lBQy9CO2dCQUFNLFlBQUksQ0FBQyxNQUFNLENBQUM7O2dCQUFHLFlBQUksQ0FBQyxPQUFPLENBQUM7O2dCQUFHLFlBQUksQ0FBQyxP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LE9BQU8sRUFBRTtJQUNuQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtDQUN0QyxDQUFDO0FBRUYsSUFBSSxRQUFRLEdBQXVDLFVBQUMsR0FBYztJQUM5RCxPQUFBLDBCQUFJLFNBQVMsRUFBQyxjQUFjLElBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUNkLDBCQUFJLFNBQVMsRUFBQyxlQUFlO1FBQ3pCLHlCQUFHLFNBQVMsRUFBQyxvQkFBb0IsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUssQ0FDL0YsQ0FBQyxFQUhRLENBR1IsQ0FBQyxDQUNWO0FBTEwsQ0FLSyxDQUFDO0FBRVYsSUFBSSxLQUFLLEdBQUcsVUFBQSxDQUFDO0lBQ1QsT0FBQSwrQkFBUyxTQUFTLEVBQUMsdUJBQXVCLEVBQUMsRUFBRSxFQUFFLGFBQWEsR0FBRyxDQUFDO1FBQzVELDJCQUFLLFNBQVMsRUFBQyxjQUFjOztZQUFNLENBQUMsQ0FBTyxDQUNyQztBQUZWLENBRVUsQ0FBQztBQUVmO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQyxrQkFBQyxHQUFHLENBQUMsUUFBUSxPQUFHLEVBQUUsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFGRCxzQkFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFhhbmlhIGFzIHhhbmlhLCBSZXBlYXQsIGV4cHIsIERvbSwgUmVtb3RlT2JqZWN0LCBSZWFjdGl2ZSBhcyBSZSwgVGVtcGxhdGUgfSBmcm9tIFwiLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgVXJsSGVscGVyLCBWaWV3UmVzdWx0IH0gZnJvbSBcIi4uL3NyYy9tdmNcIlxyXG5pbXBvcnQgJy4vYWRtaW4uY3NzJ1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi9zcmMvb2JzZXJ2YWJsZXNcIjtcclxuaW1wb3J0IHsgQ2xvY2tBcHAgfSBmcm9tICcuLi9zYW1wbGUvY2xvY2svYXBwJ1xyXG5pbXBvcnQgeyBUb2RvQXBwIH0gZnJvbSBcIi4uL3NhbXBsZS9sYXlvdXQvdG9kb1wiO1xyXG5pbXBvcnQgRGF0YUdyaWQgZnJvbSBcIi4vZ3JpZFwiXHJcbmltcG9ydCBMaWIgPSByZXF1aXJlKFwiLi4vZGlhZ3JhbS9saWJcIik7XHJcbnZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICB1c2VyOiBcIklicmFoaW1cIixcclxuICAgIHVzZXJzOiBuZXcgUmVtb3RlT2JqZWN0KCcvYXBpL3F1ZXJ5LycsIFwidXNlcnNcIiksXHJcbiAgICBjdXJyZW50VXNlcjoge30sXHJcbiAgICBzYXZlVXNlcigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcInNhdmUgdXNlclwiLCB0aGlzLmN1cnJlbnRVc2VyKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+aW5kZXg8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lbnUoeyBkcml2ZXIsIGh0bWwsIHVybCB9KSB7XHJcbiAgICBtYWluTWVudSh1cmwpLmJpbmQoKVxyXG4gICAgICAgIC51cGRhdGUobmV3IFJlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGludm9pY2VzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxkaXY+aW52b2ljZXMge2V4cHIoXCJ1c2VyXCIpfTwvZGl2PlxyXG4gICAgICAgICAgICA8UmVwZWF0IHNvdXJjZT17ZXhwcihcImF3YWl0IHVzZXJzXCIpfT5cclxuICAgICAgICAgICAgICAgIDxkaXY+e2V4cHIoXCJuYW1lXCIpfSB7ZXhwcihcImVtYWlsXCIpfSB7ZXhwcihcInJvbGVzXCIpfTwvZGl2PlxyXG4gICAgICAgICAgICA8L1JlcGVhdD5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVzaGVldCgpIHtcclxuICAgIHZhciB0aW1lID0gbmV3IE9ic2VydmFibGVzLlRpbWUoKTtcclxuICAgIHZhciB0b2dnbGVUaW1lID0gKCkgPT4ge1xyXG4gICAgICAgIHRpbWUudG9nZ2xlKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+dGltZXNoZWV0IHtleHByKFwiYXdhaXQgdGltZVwiKX1cclxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RvZ2dsZVRpbWV9PnRvZ2dsZSB0aW1lPC9idXR0b24+XHJcbiAgICAgICAgPENsb2NrQXBwIHRpbWU9e2V4cHIoXCJhd2FpdCB0aW1lXCIpfSAvPlxyXG4gICAgPC9kaXY+LCBuZXcgUmUuU3RvcmUoeyB0aW1lIH0pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvZG9zKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxUb2RvQXBwIC8+KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVzZXJzKCkge1xyXG4gICAgdmFyIG9uQ2FuY2VsID0gKCkgPT4ge1xyXG4gICAgICAgIHN0b3JlLmdldChcImN1cnJlbnRVc2VyXCIpLnNldCh7fSk7XHJcbiAgICAgICAgc3RvcmUucmVmcmVzaCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJoZWlnaHQ6IDk1JTtcIiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e1tleHByKFwiY3VycmVudFVzZXIgLT4gJ2NvbC04J1wiKSwgZXhwcihcIm5vdCBjdXJyZW50VXNlciAtPiAnY29sLTEyJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwic2VjdGlvblwiIHN0eWxlPVwiaGVpZ2h0OiAxMDAlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDBweCAxNnB4IDEwMHB4IDE2cHg7IGhlaWdodDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhlYWRlciBzdHlsZT1cImhlaWdodDogNTBweFwiPjxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFkanVzdFwiPjwvc3Bhbj4gPHNwYW4+VXNlcnM8L3NwYW4+PC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxEYXRhR3JpZCBhY3RpdmVSZWNvcmQ9e2V4cHIoXCJjdXJyZW50VXNlclwiKX0gZGF0YT17ZXhwcihcImF3YWl0IHVzZXJzXCIpfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4OyBtYXJnaW46IDAgMTZweDsgcGFkZGluZzogMDtcIj48YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIGRhdGEtYmluZD1cImNsaWNrOiB1c2Vycy5jcmVhdGVcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj48L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTRcIj5cclxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInNlY3Rpb25cIiBzdHlsZT1cImhlaWdodDogMTAwJVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImNsb3NlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgc3R5bGU9XCJtYXJnaW46IDE2cHggMTZweCAwIDA7XCIgb25DbGljaz17b25DYW5jZWx9PsOXPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPGhlYWRlciBzdHlsZT1cImhlaWdodDogNTBweFwiPjxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFkanVzdFwiPjwvc3Bhbj4gPHNwYW4+VXNlcjwvc3Bhbj48L2hlYWRlcj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDBweCAxNnB4IDEwMHB4IDE2cHg7IGhlaWdodDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhlYWRlciBzdHlsZT1cImhlaWdodDogNTBweFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e2V4cHIoXCJjdXJyZW50VXNlci5OYW1lXCIpfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJVc2VyTmFtZVwiPlVzZXIgbmFtZTwvbGFiZWw+PGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiVXNlciBuYW1lXCIgbmFtZT1cImN1cnJlbnRVc2VyLk5hbWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJFbWFpbFwiPkVtYWlsPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PGlucHV0IGlkPVwiRW1haWxcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiRW1haWxcIiBuYW1lPVwiY3VycmVudFVzZXIuRW1haWxcIiAvPjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj48ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ9e2V4cHIoXCJjdXJyZW50VXNlci5FbWFpbENvbmZpcm1lZFwiKX0gLz4gPGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJFbWFpbENvbmZpcm1lZFwiPkVtYWlsIGNvbmZpcm1lZDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBvbkNsaWNrPXtleHByKFwic2F2ZVVzZXIgKClcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXNhdmVcIj48L3NwYW4+IFNhdmU8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG52YXIgTWVudUl0ZW0gPSAoe25hbWV9KSA9PiA8bGk+PGEgaHJlZj1cImh0dHA6Ly93d3cuZ29vZ2xlLm5sXCI+bWVudSBpdGVtIHtuYW1lfTwvYT48L2xpPjtcclxuXHJcbmludGVyZmFjZSBJQXBwQWN0aW9uIHtcclxuICAgIHBhdGg6IHN0cmluZyxcclxuICAgIGRpc3BsYXk/OiBzdHJpbmc7XHJcbn1cclxuXHJcbnZhciBhY3Rpb25zOiBJQXBwQWN0aW9uW10gPSBbXHJcbiAgICB7IHBhdGg6IFwidGltZXNoZWV0XCIsIGRpc3BsYXk6IFwiVGltZXNoZWV0XCIgfSxcclxuICAgIHsgcGF0aDogXCJpbnZvaWNlc1wiLCBkaXNwbGF5OiBcIkludm9pY2VzXCIgfSxcclxuICAgIHsgcGF0aDogXCJ0b2Rvc1wiLCBkaXNwbGF5OiBcIlRvZG9zXCIgfSxcclxuICAgIHsgcGF0aDogXCJ1c2Vyc1wiLCBkaXNwbGF5OiBcIlVzZXJzXCIgfSxcclxuICAgIHsgcGF0aDogXCJncmFwaFwiLCBkaXNwbGF5OiBcIkdyYXBoXCIgfVxyXG5dO1xyXG5cclxudmFyIG1haW5NZW51OiAodXJsOiBVcmxIZWxwZXIpID0+IFRlbXBsYXRlLklOb2RlID0gKHVybDogVXJsSGVscGVyKSA9PlxyXG4gICAgPHVsIGNsYXNzTmFtZT1cIm1haW4tbWVudS11bFwiPlxyXG4gICAgICAgIHthY3Rpb25zLm1hcCh4ID0+IChcclxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW1cIj5cclxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW0tbGlua1wiIGhyZWY9XCJcIiBvbkNsaWNrPXt1cmwuYWN0aW9uKHgucGF0aCl9Pnt4LmRpc3BsYXkgfHwgeC5wYXRofTwvYT5cclxuICAgICAgICAgICAgPC9saT4pKX1cclxuICAgIDwvdWw+O1xyXG5cclxudmFyIHBhbmVsID0gbiA9PlxyXG4gICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwibWRsLWxheW91dF9fdGFiLXBhbmVsXCIgaWQ9e1wic2Nyb2xsLXRhYi1cIiArIG59PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnZS1jb250ZW50XCI+dGFiIHtufTwvZGl2PlxyXG4gICAgPC9zZWN0aW9uPjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBncmFwaCgpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8TGliLkdyYXBoQXBwIC8+LCBuZXcgUmUuU3RvcmUoe30pKTtcclxufSJdfQ==