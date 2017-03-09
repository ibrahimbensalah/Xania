"use strict";
var xania_1 = require("../src/xania");
var mvc_1 = require("../src/mvc");
require("./admin.css");
var observables_1 = require("../src/observables");
var app_1 = require("../sample/clock/app");
var app_2 = require("../sample/todos/app");
var grid_1 = require("./grid");
var Lib = require("../diagram/lib");
var app_3 = require("../sample/balls/app");
var store = new xania_1.Reactive.Store({
    filter: "",
    user: "Ibrahim",
    ds: new xania_1.RemoteObject('/api/query/', "users"),
    current: null,
    saveUser: function () {
        this.users.save(this.currentUser);
        this.cancel();
    },
    cancel: function () {
        this.currentUser = false;
    },
    addUser: function () {
        this.currentUser = {
            name: "",
            email: "",
            emailConfirmed: false
        };
    }
});
function balls() {
    return new mvc_1.ViewResult(xania_1.Xania.tag(app_3.default, null));
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
    return new mvc_1.ViewResult(xania_1.Xania.tag(app_2.default, null));
}
exports.todos = todos;
function Section(attrs, children) {
    return (xania_1.Xania.tag("section", { className: "section", style: "height: 100%" },
        xania_1.Xania.tag(xania_1.If, { expr: attrs.onCancel },
            xania_1.Xania.tag("button", { type: "button", className: "close", "aria-hidden": "true", style: "margin: 16px 16px 0 0;", onClick: attrs.onCancel }, "\u00D7")),
        xania_1.Xania.tag("header", { style: "height: 50px" },
            xania_1.Xania.tag("span", { className: "fa fa-adjust" }),
            " ",
            xania_1.Xania.tag("span", null, attrs.title || 'Untitled')),
        xania_1.Xania.tag("div", { style: "padding: 0px 16px 100px 16px; height: 100%;" }, children)));
}
function TextEditor(attrs) {
    var id = Math.random();
    return xania_1.Xania.tag("div", Object.assign({ className: "form-group" }, attrs), [
        xania_1.Xania.tag("label", { for: id }, attrs.display),
        xania_1.Xania.tag("input", { className: "form-control", id: id, type: "text", placeholder: attrs.display, name: "currentRow." + attrs.field })
    ]);
}
function BooleanEditor(attrs) {
    var id = Math.random();
    return xania_1.Xania.tag("div", Object.assign({ className: "form-check" }, attrs), [
        xania_1.Xania.tag("label", { className: "form-check-label", htmlFor: id },
            xania_1.Xania.tag("input", { className: "form-check-input", id: id, type: "checkbox", checked: xania_1.expr("currentRow." + attrs.field) }),
            " ",
            attrs.display)
    ]);
}
function users() {
    var store = new xania_1.Reactive.Store({
        dataSource: new xania_1.RemoteObject('/api/query/', "users"),
        currentRow: null,
        save: function () {
            this.dataSource.save(this.currentRow);
            this.cancel();
        },
        cancel: function () {
            this.currentRow = false;
        },
        createNew: function () {
            return {
                name: "",
                email: "",
                emailConfirmed: false
            };
        }
    });
    var onSelect = function (user) {
        store.get("currentRow").set(user);
        store.refresh();
    };
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", { style: "height: 95%;", className: "row" },
        xania_1.Xania.tag("div", { className: [xania_1.expr("currentRow -> 'col-8'"), xania_1.expr("not currentRow -> 'col-12'")] },
            xania_1.Xania.tag(Section, { title: "Users" },
                xania_1.Xania.tag(grid_1.default, { data: xania_1.expr("await dataSource"), onSelectionChanged: onSelect },
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "name", display: "User name" }),
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "emailConfirmed", display: "Email confirmed" })),
                xania_1.Xania.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                    xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("currentRow <- createNew()") },
                        xania_1.Xania.tag("span", { className: "fa fa-plus" }),
                        " Add New")))),
        xania_1.Xania.tag(xania_1.If, { expr: xania_1.expr("currentRow") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag(Section, { title: xania_1.expr("currentRow.name"), onCancel: xania_1.expr("cancel") },
                    xania_1.Xania.tag(TextEditor, { field: "name", display: "User Name" }),
                    xania_1.Xania.tag(TextEditor, { field: "email", display: "Email" }),
                    xania_1.Xania.tag(BooleanEditor, { field: "emailConfirmed", display: "Email confirmed" }),
                    xania_1.Xania.tag("div", { className: "form-group", style: "padding: 10px; background-color: #EEE; border: 1px solid #DDD;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("save ()") },
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
    { path: "companies", display: "Companies" },
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
function action() {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQTRHO0FBQzVHLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5QywyQ0FBMEM7QUFDMUMsK0JBQTZDO0FBQzdDLG9DQUF1QztBQUN2QywyQ0FBMkM7QUFFM0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQztJQUNyQixNQUFNLEVBQUUsRUFBRTtJQUNWLElBQUksRUFBRSxTQUFTO0lBQ2YsRUFBRSxFQUFFLElBQUksb0JBQVksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDO0lBQzVDLE9BQU8sRUFBRSxJQUFJO0lBQ2IsUUFBUTtRQUNKLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUNELE1BQU07UUFDRixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztJQUM3QixDQUFDO0lBQ0QsT0FBTztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUc7WUFDZixJQUFJLEVBQUUsRUFBRTtZQUNSLEtBQUssRUFBRSxFQUFFO1lBQ1QsY0FBYyxFQUFFLEtBQUs7U0FDeEIsQ0FBQTtJQUNMLENBQUM7Q0FDSixDQUFDLENBQUM7QUFFSDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsYUFBUSxPQUFHLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRkQsc0JBRUM7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsdUNBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUZELHNCQUVDO0FBRUQsY0FBcUIsRUFBcUI7UUFBbkIsa0JBQU0sRUFBRSxjQUFJLEVBQUUsWUFBRztJQUNwQyxRQUFRLENBQUMs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Q0FBQyxJQUFJLENBQUMsSUFBRyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUssQ0FDL0YsQ0FBQyxFQUhRLENBR1IsQ0FBQyxDQUNWO0FBTEwsQ0FLSyxDQUFDO0FBRVYsSUFBSSxLQUFLLEdBQUcsVUFBQSxDQUFDO0lBQ1QsT0FBQSwrQkFBUyxTQUFTLEVBQUMsdUJBQXVCLEVBQUMsRUFBRSxFQUFFLGFBQWEsR0FBRyxDQUFDO1FBQzVELDJCQUFLLFNBQVMsRUFBQyxjQUFjOztZQUFNLENBQUMsQ0FBTyxDQUNyQztBQUZWLENBRVUsQ0FBQztBQUVmO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQyxrQkFBQyxHQUFHLENBQUMsUUFBUSxPQUFHLEVBQUUsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFGRCxzQkFFQztBQUVEO0FBRUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFhhbmlhIGFzIHhhbmlhLCBSZXBlYXQsIElmLCBleHByLCBEb20sIFJlbW90ZU9iamVjdCwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IFVybEhlbHBlciwgVmlld1Jlc3VsdCB9IGZyb20gXCIuLi9zcmMvbXZjXCJcclxuaW1wb3J0ICcuL2FkbWluLmNzcydcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vc3JjL29ic2VydmFibGVzXCI7XHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSAnLi4vc2FtcGxlL2Nsb2NrL2FwcCdcclxuaW1wb3J0IFRvZG9BcHAgZnJvbSBcIi4uL3NhbXBsZS90b2Rvcy9hcHBcIjtcclxuaW1wb3J0IERhdGFHcmlkLCB7IFRleHRDb2x1bW4gfSBmcm9tIFwiLi9ncmlkXCJcclxuaW1wb3J0IExpYiA9IHJlcXVpcmUoXCIuLi9kaWFncmFtL2xpYlwiKTtcclxuaW1wb3J0IEJhbGxzQXBwIGZyb20gJy4uL3NhbXBsZS9iYWxscy9hcHAnO1xyXG5cclxudmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHtcclxuICAgIGZpbHRlcjogXCJcIixcclxuICAgIHVzZXI6IFwiSWJyYWhpbVwiLFxyXG4gICAgZHM6IG5ldyBSZW1vdGVPYmplY3QoJy9hcGkvcXVlcnkvJywgXCJ1c2Vyc1wiKSxcclxuICAgIGN1cnJlbnQ6IG51bGwsXHJcbiAgICBzYXZlVXNlcigpIHtcclxuICAgICAgICB0aGlzLnVzZXJzLnNhdmUodGhpcy5jdXJyZW50VXNlcik7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgIH0sXHJcbiAgICBjYW5jZWwoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGFkZFVzZXIoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IHtcclxuICAgICAgICAgICAgbmFtZTogXCJcIixcclxuICAgICAgICAgICAgZW1haWw6IFwiXCIsXHJcbiAgICAgICAgICAgIGVtYWlsQ29uZmlybWVkOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYmFsbHMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPEJhbGxzQXBwIC8+KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+aW5kZXg8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lbnUoeyBkcml2ZXIsIGh0bWwsIHVybCB9KSB7XHJcbiAgICBtYWluTWVudSh1cmwpLmJpbmQoKVxyXG4gICAgICAgIC51cGRhdGUobmV3IFJlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGludm9pY2VzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxkaXY+aW52b2ljZXMge2V4cHIoXCJ1c2VyXCIpfTwvZGl2PlxyXG4gICAgICAgICAgICA8UmVwZWF0IHNvdXJjZT17ZXhwcihcImF3YWl0IHVzZXJzXCIpfT5cclxuICAgICAgICAgICAgICAgIDxkaXY+e2V4cHIoXCJuYW1lXCIpfSB7ZXhwcihcImVtYWlsXCIpfSB7ZXhwcihcInJvbGVzXCIpfTwvZGl2PlxyXG4gICAgICAgICAgICA8L1JlcGVhdD5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVzaGVldCgpIHtcclxuICAgIHZhciB0aW1lID0gbmV3IE9ic2VydmFibGVzLlRpbWUoKTtcclxuICAgIHZhciB0b2dnbGVUaW1lID0gKCkgPT4ge1xyXG4gICAgICAgIHRpbWUudG9nZ2xlKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+dGltZXNoZWV0IHtleHByKFwiYXdhaXQgdGltZVwiKX1cclxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RvZ2dsZVRpbWV9PnRvZ2dsZSB0aW1lPC9idXR0b24+XHJcbiAgICAgICAgPENsb2NrQXBwIHRpbWU9e2V4cHIoXCJhd2FpdCB0aW1lXCIpfSAvPlxyXG4gICAgPC9kaXY+LCBuZXcgUmUuU3RvcmUoeyB0aW1lIH0pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvZG9zKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxUb2RvQXBwIC8+KTtcclxufVxyXG5cclxuZnVuY3Rpb24gU2VjdGlvbihhdHRycywgY2hpbGRyZW4pIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwic2VjdGlvblwiIHN0eWxlPVwiaGVpZ2h0OiAxMDAlXCI+XHJcbiAgICAgICAgICAgIDxJZiBleHByPXthdHRycy5vbkNhbmNlbH0+XHJcbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHN0eWxlPVwibWFyZ2luOiAxNnB4IDE2cHggMCAwO1wiIG9uQ2xpY2s9e2F0dHJzLm9uQ2FuY2VsfT7DlzwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8L0lmPlxyXG4gICAgICAgICAgICA8aGVhZGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4XCI+PHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPiA8c3Bhbj57YXR0cnMudGl0bGUgfHwgJ1VudGl0bGVkJ308L3NwYW4+PC9oZWFkZXI+XHJcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAwcHggMTZweCAxMDBweCAxNnB4OyBoZWlnaHQ6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICB7Y2hpbGRyZW59XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvc2VjdGlvbj5cclxuICAgICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFRleHRFZGl0b3IoYXR0cnMpIHtcclxuICAgIHZhciBpZCA9IE1hdGgucmFuZG9tKCk7XHJcbiAgICByZXR1cm4geGFuaWEudGFnKFwiZGl2XCIsXHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbih7IGNsYXNzTmFtZTogXCJmb3JtLWdyb3VwXCIgfSwgYXR0cnMpLFxyXG4gICAgICAgIFtcclxuICAgICAgICAgICAgPGxhYmVsIGZvcj17aWR9PnthdHRycy5kaXNwbGF5fTwvbGFiZWw+LFxyXG4gICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgaWQ9e2lkfSB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPXthdHRycy5kaXNwbGF5fSBuYW1lPXtcImN1cnJlbnRSb3cuXCIgKyBhdHRycy5maWVsZH0gLz5cclxuICAgICAgICBdXHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBCb29sZWFuRWRpdG9yKGF0dHJzKSB7XHJcbiAgICB2YXIgaWQgPSBNYXRoLnJhbmRvbSgpO1xyXG4gICAgcmV0dXJuIHhhbmlhLnRhZyhcImRpdlwiLFxyXG4gICAgICAgIE9iamVjdC5hc3NpZ24oeyBjbGFzc05hbWU6IFwiZm9ybS1jaGVja1wiIH0sIGF0dHJzKSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJmb3JtLWNoZWNrLWxhYmVsXCIgaHRtbEZvcj17aWR9PlxyXG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cImZvcm0tY2hlY2staW5wdXRcIiBpZD17aWR9IHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ9e2V4cHIoXCJjdXJyZW50Um93LlwiICsgYXR0cnMuZmllbGQpfSAvPiB7YXR0cnMuZGlzcGxheX1cclxuICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICBdXHJcbiAgICApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlcnMoKSB7XHJcbiAgICB2YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUoe1xyXG4gICAgICAgIGRhdGFTb3VyY2U6IG5ldyBSZW1vdGVPYmplY3QoJy9hcGkvcXVlcnkvJywgXCJ1c2Vyc1wiKSxcclxuICAgICAgICBjdXJyZW50Um93OiBudWxsLFxyXG4gICAgICAgIHNhdmUoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YVNvdXJjZS5zYXZlKHRoaXMuY3VycmVudFJvdyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjYW5jZWwoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJvdyA9IGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3JlYXRlTmV3KCkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJcIixcclxuICAgICAgICAgICAgICAgIGVtYWlsOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgZW1haWxDb25maXJtZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgb25TZWxlY3QgPSB1c2VyID0+IHtcclxuICAgICAgICBzdG9yZS5nZXQoXCJjdXJyZW50Um93XCIpLnNldCh1c2VyKTtcclxuICAgICAgICBzdG9yZS5yZWZyZXNoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJoZWlnaHQ6IDk1JTtcIiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e1tleHByKFwiY3VycmVudFJvdyAtPiAnY29sLTgnXCIpLCBleHByKFwibm90IGN1cnJlbnRSb3cgLT4gJ2NvbC0xMidcIildfT5cclxuICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPVwiVXNlcnNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgZGF0YT17ZXhwcihcImF3YWl0IGRhdGFTb3VyY2VcIil9IG9uU2VsZWN0aW9uQ2hhbmdlZD17b25TZWxlY3R9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJuYW1lXCIgZGlzcGxheT1cIlVzZXIgbmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwiZW1haWxDb25maXJtZWRcIiBkaXNwbGF5PVwiRW1haWwgY29uZmlybWVkXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJjdXJyZW50Um93IDwtIGNyZWF0ZU5ldygpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxJZiBleHByPXtleHByKFwiY3VycmVudFJvd1wiKX0+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPFNlY3Rpb24gdGl0bGU9e2V4cHIoXCJjdXJyZW50Um93Lm5hbWVcIil9IG9uQ2FuY2VsPXtleHByKFwiY2FuY2VsXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRFZGl0b3IgZmllbGQ9XCJuYW1lXCIgZGlzcGxheT1cIlVzZXIgTmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0RWRpdG9yIGZpZWxkPVwiZW1haWxcIiBkaXNwbGF5PVwiRW1haWxcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Qm9vbGVhbkVkaXRvciBmaWVsZD1cImVtYWlsQ29uZmlybWVkXCIgZGlzcGxheT1cIkVtYWlsIGNvbmZpcm1lZFwiIC8+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIiBzdHlsZT1cInBhZGRpbmc6IDEwcHg7IGJhY2tncm91bmQtY29sb3I6ICNFRUU7IGJvcmRlcjogMXB4IHNvbGlkICNEREQ7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJzYXZlICgpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1zYXZlXCI+PC9zcGFuPiBTYXZlPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L0lmPlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG52YXIgTWVudUl0ZW0gPSAoe25hbWV9KSA9PiA8bGk+PGEgaHJlZj1cImh0dHA6Ly93d3cuZ29vZ2xlLm5sXCI+bWVudSBpdGVtIHtuYW1lfTwvYT48L2xpPjtcclxuXHJcbmludGVyZmFjZSBJQXBwQWN0aW9uIHtcclxuICAgIHBhdGg6IHN0cmluZyxcclxuICAgIGRpc3BsYXk/OiBzdHJpbmc7XHJcbn1cclxuXHJcbnZhciBhY3Rpb25zOiBJQXBwQWN0aW9uW10gPSBbXHJcbiAgICB7IHBhdGg6IFwidGltZXNoZWV0XCIsIGRpc3BsYXk6IFwiVGltZXNoZWV0XCIgfSxcclxuICAgIHsgcGF0aDogXCJpbnZvaWNlc1wiLCBkaXNwbGF5OiBcIkludm9pY2VzXCIgfSxcclxuICAgIHsgcGF0aDogXCJ0b2Rvc1wiLCBkaXNwbGF5OiBcIlRvZG9zXCIgfSxcclxuICAgIHsgcGF0aDogXCJjb21wYW5pZXNcIiwgZGlzcGxheTogXCJDb21wYW5pZXNcIiB9LFxyXG4gICAgeyBwYXRoOiBcInVzZXJzXCIsIGRpc3BsYXk6IFwiVXNlcnNcIiB9LFxyXG4gICAgeyBwYXRoOiBcImdyYXBoXCIsIGRpc3BsYXk6IFwiR3JhcGhcIiB9LFxyXG4gICAgeyBwYXRoOiBcImJhbGxzXCIsIGRpc3BsYXk6IFwiQmFsbHNcIiB9XHJcbl07XHJcblxyXG52YXIgbWFpbk1lbnU6ICh1cmw6IFVybEhlbHBlcikgPT4gVGVtcGxhdGUuSU5vZGUgPSAodXJsOiBVcmxIZWxwZXIpID0+XHJcbiAgICA8dWwgY2xhc3NOYW1lPVwibWFpbi1tZW51LXVsXCI+XHJcbiAgICAgICAge2FjdGlvbnMubWFwKHggPT4gKFxyXG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibWFpbi1tZW51aXRlbVwiPlxyXG4gICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwibWFpbi1tZW51aXRlbS1saW5rXCIgaHJlZj1cIlwiIG9uQ2xpY2s9e3VybC5hY3Rpb24oeC5wYXRoKX0+e3guZGlzcGxheSB8fCB4LnBhdGh9PC9hPlxyXG4gICAgICAgICAgICA8L2xpPikpfVxyXG4gICAgPC91bD47XHJcblxyXG52YXIgcGFuZWwgPSBuID0+XHJcbiAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJtZGwtbGF5b3V0X190YWItcGFuZWxcIiBpZD17XCJzY3JvbGwtdGFiLVwiICsgbn0+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdlLWNvbnRlbnRcIj50YWIge259PC9kaXY+XHJcbiAgICA8L3NlY3Rpb24+O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdyYXBoKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxMaWIuR3JhcGhBcHAgLz4sIG5ldyBSZS5TdG9yZSh7fSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhY3Rpb24oKSB7XHJcblxyXG59Il19