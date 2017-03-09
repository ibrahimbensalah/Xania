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
            xania_1.Xania.tag("span", null, "Users")),
        xania_1.Xania.tag("div", { style: "padding: 0px 16px 100px 16px; height: 100%;" }, children)));
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
            xania_1.Xania.tag(Section, null,
                xania_1.Xania.tag(grid_1.default, { data: xania_1.expr("await dataSource"), onSelectionChanged: onSelect },
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "name", display: "User name" }),
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "emailConfirmed", display: "Email confirmed" })),
                xania_1.Xania.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                    xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("currentRow <- createNew()") },
                        xania_1.Xania.tag("span", { className: "fa fa-plus" }),
                        " Add New")))),
        xania_1.Xania.tag(xania_1.If, { expr: xania_1.expr("currentRow") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag(Section, { onCancel: xania_1.expr("cancel") },
                    xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                        xania_1.Xania.tag("label", { className: "control-label", for: "UserName" }, "User name"),
                        xania_1.Xania.tag("div", null,
                            xania_1.Xania.tag("input", { className: "form-control", type: "text", placeholder: "User name", name: "currentRow.name" }))),
                    xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                        xania_1.Xania.tag("label", { className: "control-label", for: "Email" }, "Email"),
                        xania_1.Xania.tag("div", null,
                            xania_1.Xania.tag("input", { id: "Email", className: "form-control", type: "text", placeholder: "Email", name: "currentRow.email" }))),
                    xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                        xania_1.Xania.tag("div", null,
                            xania_1.Xania.tag("input", { type: "checkbox", checked: xania_1.expr("currentRow.emailConfirmed") }),
                            " ",
                            xania_1.Xania.tag("label", { className: "control-label", for: "EmailConfirmed" }, "Email confirmed"))),
                    xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQTRHO0FBQzVHLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5QywyQ0FBMEM7QUFDMUMsK0JBQTZDO0FBQzdDLG9DQUF1QztBQUN2QywyQ0FBMkM7QUFFM0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQztJQUNyQixNQUFNLEVBQUUsRUFBRTtJQUNWLElBQUksRUFBRSxTQUFTO0lBQ2YsRUFBRSxFQUFFLElBQUksb0JBQVksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDO0lBQzVDLE9BQU8sRUFBRSxJQUFJO0lBQ2IsUUFBUTtRQUNKLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUNELE1BQU07UUFDRixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztJQUM3QixDQUFDO0lBQ0QsT0FBTztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUc7WUFDZixJQUFJLEVBQUUsRUFBRTtZQUNSLEtBQUssRUFBRSxFQUFFO1lBQ1QsY0FBYyxFQUFFLEtBQUs7U0FDeEIsQ0FBQTtJQUNMLENBQUM7Q0FDSixDQUFDLENBQUM7QUFFSDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsYUFBUSxPQUFHLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRkQsc0JBRUM7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsdUNBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUZELHNCQUVDO0FBRUQsY0FBcUIsRUFBcUI7UUFBbkIsa0JBQU0sRUFBRSxjQUFJLEVBQUUsWUFBRztJQUNwQyxRQUFRLENBQUMs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QUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtJQUNuQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtJQUNuQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtDQUN0QyxDQUFDO0FBRUYsSUFBSSxRQUFRLEdBQXVDLFVBQUMsR0FBYztJQUM5RCxPQUFBLDBCQUFJLFNBQVMsRUFBQyxjQUFjLElBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUNkLDBCQUFJLFNBQVMsRUFBQyxlQUFlO1FBQ3pCLHlCQUFHLFNBQVMsRUFBQyxvQkFBb0IsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUssQ0FDL0YsQ0FBQyxFQUhRLENBR1IsQ0FBQyxDQUNWO0FBTEwsQ0FLSyxDQUFDO0FBRVYsSUFBSSxLQUFLLEdBQUcsVUFBQSxDQUFDO0lBQ1QsT0FBQSwrQkFBUyxTQUFTLEVBQUMsdUJBQXVCLEVBQUMsRUFBRSxFQUFFLGFBQWEsR0FBRyxDQUFDO1FBQzVELDJCQUFLLFNBQVMsRUFBQyxjQUFjOztZQUFNLENBQUMsQ0FBTyxDQUNyQztBQUZWLENBRVUsQ0FBQztBQUVmO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQyxrQkFBQyxHQUFHLENBQUMsUUFBUSxPQUFHLEVBQUUsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFGRCxzQkFFQztBQUVEO0FBRUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFhhbmlhIGFzIHhhbmlhLCBSZXBlYXQsIElmLCBleHByLCBEb20sIFJlbW90ZU9iamVjdCwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IFVybEhlbHBlciwgVmlld1Jlc3VsdCB9IGZyb20gXCIuLi9zcmMvbXZjXCJcclxuaW1wb3J0ICcuL2FkbWluLmNzcydcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vc3JjL29ic2VydmFibGVzXCI7XHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSAnLi4vc2FtcGxlL2Nsb2NrL2FwcCdcclxuaW1wb3J0IFRvZG9BcHAgZnJvbSBcIi4uL3NhbXBsZS90b2Rvcy9hcHBcIjtcclxuaW1wb3J0IERhdGFHcmlkLCB7IFRleHRDb2x1bW4gfSBmcm9tIFwiLi9ncmlkXCJcclxuaW1wb3J0IExpYiA9IHJlcXVpcmUoXCIuLi9kaWFncmFtL2xpYlwiKTtcclxuaW1wb3J0IEJhbGxzQXBwIGZyb20gJy4uL3NhbXBsZS9iYWxscy9hcHAnO1xyXG5cclxudmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHtcclxuICAgIGZpbHRlcjogXCJcIixcclxuICAgIHVzZXI6IFwiSWJyYWhpbVwiLFxyXG4gICAgZHM6IG5ldyBSZW1vdGVPYmplY3QoJy9hcGkvcXVlcnkvJywgXCJ1c2Vyc1wiKSxcclxuICAgIGN1cnJlbnQ6IG51bGwsXHJcbiAgICBzYXZlVXNlcigpIHtcclxuICAgICAgICB0aGlzLnVzZXJzLnNhdmUodGhpcy5jdXJyZW50VXNlcik7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgIH0sXHJcbiAgICBjYW5jZWwoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGFkZFVzZXIoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IHtcclxuICAgICAgICAgICAgbmFtZTogXCJcIixcclxuICAgICAgICAgICAgZW1haWw6IFwiXCIsXHJcbiAgICAgICAgICAgIGVtYWlsQ29uZmlybWVkOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYmFsbHMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPEJhbGxzQXBwIC8+KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+aW5kZXg8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lbnUoeyBkcml2ZXIsIGh0bWwsIHVybCB9KSB7XHJcbiAgICBtYWluTWVudSh1cmwpLmJpbmQoKVxyXG4gICAgICAgIC51cGRhdGUobmV3IFJlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGludm9pY2VzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxkaXY+aW52b2ljZXMge2V4cHIoXCJ1c2VyXCIpfTwvZGl2PlxyXG4gICAgICAgICAgICA8UmVwZWF0IHNvdXJjZT17ZXhwcihcImF3YWl0IHVzZXJzXCIpfT5cclxuICAgICAgICAgICAgICAgIDxkaXY+e2V4cHIoXCJuYW1lXCIpfSB7ZXhwcihcImVtYWlsXCIpfSB7ZXhwcihcInJvbGVzXCIpfTwvZGl2PlxyXG4gICAgICAgICAgICA8L1JlcGVhdD5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVzaGVldCgpIHtcclxuICAgIHZhciB0aW1lID0gbmV3IE9ic2VydmFibGVzLlRpbWUoKTtcclxuICAgIHZhciB0b2dnbGVUaW1lID0gKCkgPT4ge1xyXG4gICAgICAgIHRpbWUudG9nZ2xlKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+dGltZXNoZWV0IHtleHByKFwiYXdhaXQgdGltZVwiKX1cclxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RvZ2dsZVRpbWV9PnRvZ2dsZSB0aW1lPC9idXR0b24+XHJcbiAgICAgICAgPENsb2NrQXBwIHRpbWU9e2V4cHIoXCJhd2FpdCB0aW1lXCIpfSAvPlxyXG4gICAgPC9kaXY+LCBuZXcgUmUuU3RvcmUoeyB0aW1lIH0pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvZG9zKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxUb2RvQXBwIC8+KTtcclxufVxyXG5cclxuZnVuY3Rpb24gU2VjdGlvbihhdHRycywgY2hpbGRyZW4pIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwic2VjdGlvblwiIHN0eWxlPVwiaGVpZ2h0OiAxMDAlXCI+XHJcbiAgICAgICAgICAgIDxJZiBleHByPXthdHRycy5vbkNhbmNlbH0+XHJcbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHN0eWxlPVwibWFyZ2luOiAxNnB4IDE2cHggMCAwO1wiIG9uQ2xpY2s9e2F0dHJzLm9uQ2FuY2VsfT7DlzwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8L0lmPlxyXG4gICAgICAgICAgICA8aGVhZGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4XCI+PHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPiA8c3Bhbj5Vc2Vyczwvc3Bhbj48L2hlYWRlcj5cclxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDBweCAxNnB4IDEwMHB4IDE2cHg7IGhlaWdodDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgIHtjaGlsZHJlbn1cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVzZXJzKCkge1xyXG4gICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHtcclxuICAgICAgICBkYXRhU291cmNlOiBuZXcgUmVtb3RlT2JqZWN0KCcvYXBpL3F1ZXJ5LycsIFwidXNlcnNcIiksXHJcbiAgICAgICAgY3VycmVudFJvdzogbnVsbCxcclxuICAgICAgICBzYXZlKCkge1xyXG4gICAgICAgICAgICB0aGlzLmRhdGFTb3VyY2Uuc2F2ZSh0aGlzLmN1cnJlbnRSb3cpO1xyXG4gICAgICAgICAgICB0aGlzLmNhbmNlbCgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FuY2VsKCkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSb3cgPSBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNyZWF0ZU5ldygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICBlbWFpbDogXCJcIixcclxuICAgICAgICAgICAgICAgIGVtYWlsQ29uZmlybWVkOiBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIG9uU2VsZWN0ID0gdXNlciA9PiB7XHJcbiAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFJvd1wiKS5zZXQodXNlcik7XHJcbiAgICAgICAgc3RvcmUucmVmcmVzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdChcclxuICAgICAgICA8ZGl2IHN0eWxlPVwiaGVpZ2h0OiA5NSU7XCIgY2xhc3NOYW1lPVwicm93XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbZXhwcihcImN1cnJlbnRSb3cgLT4gJ2NvbC04J1wiKSwgZXhwcihcIm5vdCBjdXJyZW50Um93IC0+ICdjb2wtMTInXCIpXX0+XHJcbiAgICAgICAgICAgICAgICA8U2VjdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgZGF0YT17ZXhwcihcImF3YWl0IGRhdGFTb3VyY2VcIil9IG9uU2VsZWN0aW9uQ2hhbmdlZD17b25TZWxlY3R9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJuYW1lXCIgZGlzcGxheT1cIlVzZXIgbmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwiZW1haWxDb25maXJtZWRcIiBkaXNwbGF5PVwiRW1haWwgY29uZmlybWVkXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJjdXJyZW50Um93IDwtIGNyZWF0ZU5ldygpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxJZiBleHByPXtleHByKFwiY3VycmVudFJvd1wiKX0+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPFNlY3Rpb24gb25DYW5jZWw9e2V4cHIoXCJjYW5jZWxcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiVXNlck5hbWVcIj5Vc2VyIG5hbWU8L2xhYmVsPjxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIlVzZXIgbmFtZVwiIG5hbWU9XCJjdXJyZW50Um93Lm5hbWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJFbWFpbFwiPkVtYWlsPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PGlucHV0IGlkPVwiRW1haWxcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiRW1haWxcIiBuYW1lPVwiY3VycmVudFJvdy5lbWFpbFwiIC8+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD17ZXhwcihcImN1cnJlbnRSb3cuZW1haWxDb25maXJtZWRcIil9IC8+IDxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiRW1haWxDb25maXJtZWRcIj5FbWFpbCBjb25maXJtZWQ8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcInNhdmUgKClcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXNhdmVcIj48L3NwYW4+IFNhdmU8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9TZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvSWY+XHJcbiAgICAgICAgPC9kaXY+LCBzdG9yZSk7XHJcbn1cclxuXHJcbnZhciBNZW51SXRlbSA9ICh7bmFtZX0pID0+IDxsaT48YSBocmVmPVwiaHR0cDovL3d3dy5nb29nbGUubmxcIj5tZW51IGl0ZW0ge25hbWV9PC9hPjwvbGk+O1xyXG5cclxuaW50ZXJmYWNlIElBcHBBY3Rpb24ge1xyXG4gICAgcGF0aDogc3RyaW5nLFxyXG4gICAgZGlzcGxheT86IHN0cmluZztcclxufVxyXG5cclxudmFyIGFjdGlvbnM6IElBcHBBY3Rpb25bXSA9IFtcclxuICAgIHsgcGF0aDogXCJ0aW1lc2hlZXRcIiwgZGlzcGxheTogXCJUaW1lc2hlZXRcIiB9LFxyXG4gICAgeyBwYXRoOiBcImludm9pY2VzXCIsIGRpc3BsYXk6IFwiSW52b2ljZXNcIiB9LFxyXG4gICAgeyBwYXRoOiBcInRvZG9zXCIsIGRpc3BsYXk6IFwiVG9kb3NcIiB9LFxyXG4gICAgeyBwYXRoOiBcImNvbXBhbmllc1wiLCBkaXNwbGF5OiBcIkNvbXBhbmllc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidXNlcnNcIiwgZGlzcGxheTogXCJVc2Vyc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwiZ3JhcGhcIiwgZGlzcGxheTogXCJHcmFwaFwiIH0sXHJcbiAgICB7IHBhdGg6IFwiYmFsbHNcIiwgZGlzcGxheTogXCJCYWxsc1wiIH1cclxuXTtcclxuXHJcbnZhciBtYWluTWVudTogKHVybDogVXJsSGVscGVyKSA9PiBUZW1wbGF0ZS5JTm9kZSA9ICh1cmw6IFVybEhlbHBlcikgPT5cclxuICAgIDx1bCBjbGFzc05hbWU9XCJtYWluLW1lbnUtdWxcIj5cclxuICAgICAgICB7YWN0aW9ucy5tYXAoeCA9PiAoXHJcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtXCI+XHJcbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtLWxpbmtcIiBocmVmPVwiXCIgb25DbGljaz17dXJsLmFjdGlvbih4LnBhdGgpfT57eC5kaXNwbGF5IHx8IHgucGF0aH08L2E+XHJcbiAgICAgICAgICAgIDwvbGk+KSl9XHJcbiAgICA8L3VsPjtcclxuXHJcbnZhciBwYW5lbCA9IG4gPT5cclxuICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm1kbC1sYXlvdXRfX3RhYi1wYW5lbFwiIGlkPXtcInNjcm9sbC10YWItXCIgKyBufT5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2UtY29udGVudFwiPnRhYiB7bn08L2Rpdj5cclxuICAgIDwvc2VjdGlvbj47XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ3JhcGgoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPExpYi5HcmFwaEFwcCAvPiwgbmV3IFJlLlN0b3JlKHt9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFjdGlvbigpIHtcclxuXHJcbn0iXX0=