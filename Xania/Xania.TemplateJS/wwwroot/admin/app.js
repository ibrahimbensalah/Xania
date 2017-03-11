"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
    ds: new xania_1.RemoteDataSource('/api/user/', "users"),
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
        xania_1.Xania.tag("input", { className: "form-control", id: id, type: "text", placeholder: attrs.display, name: attrs.field })
    ]);
}
function BooleanEditor(attrs) {
    var id = Math.random();
    return xania_1.Xania.tag("div", Object.assign({ className: "form-check" }, attrs), [
        xania_1.Xania.tag("label", { className: "form-check-label", htmlFor: id },
            xania_1.Xania.tag("input", { className: "form-check-input", id: id, type: "checkbox", checked: xania_1.expr(attrs.field) }),
            " ",
            attrs.display)
    ]);
}
var ModelRepository = (function () {
    function ModelRepository(url, expr) {
        this.currentRow = null;
        this.dataSource = new xania_1.RemoteDataSource(url, expr);
    }
    ModelRepository.prototype.save = function () {
        this.dataSource.save(this.currentRow);
        this.cancel();
    };
    ModelRepository.prototype.cancel = function () {
        this.currentRow = null;
    };
    return ModelRepository;
}());
var UserRepository = (function (_super) {
    __extends(UserRepository, _super);
    function UserRepository() {
        return _super.call(this, '/api/user/', "users") || this;
    }
    UserRepository.prototype.createNew = function () {
        return {
            name: "",
            email: "",
            emailConfirmed: false
        };
    };
    return UserRepository;
}(ModelRepository));
var InvoiceRepository = (function (_super) {
    __extends(InvoiceRepository, _super);
    function InvoiceRepository() {
        return _super.call(this, "/api/invoice/", "invoices") || this;
    }
    InvoiceRepository.prototype.addLine = function () {
        this.currentRow.lines.push({
            description: "new line",
            amount: Math.floor(Math.random() * 10)
        });
    };
    InvoiceRepository.prototype.createNew = function () {
        return {
            description: null,
            lines: []
        };
    };
    return InvoiceRepository;
}(ModelRepository));
var CompanyRepository = (function (_super) {
    __extends(CompanyRepository, _super);
    function CompanyRepository() {
        return _super.call(this, "/api/company/", "companies") || this;
    }
    CompanyRepository.prototype.createNew = function () {
        return {
            name: null
        };
    };
    return CompanyRepository;
}(ModelRepository));
function users() {
    var store = new xania_1.Reactive.Store(new UserRepository());
    var onSelect = function (row) {
        store.get("currentRow").set(row);
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
        xania_1.Xania.tag(xania_1.With, { object: xania_1.expr("currentRow") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag(Section, { title: xania_1.expr("name"), onCancel: xania_1.expr("cancel") },
                    xania_1.Xania.tag(TextEditor, { field: "name", display: "User Name" }),
                    xania_1.Xania.tag(TextEditor, { field: "email", display: "Email" }),
                    xania_1.Xania.tag(BooleanEditor, { field: "emailConfirmed", display: "Email confirmed" }),
                    xania_1.Xania.tag("div", { className: "form-group", style: "padding: 10px; background-color: #EEE; border: 1px solid #DDD;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("save ()") },
                            xania_1.Xania.tag("span", { className: "fa fa-save" }),
                            " Save")))))), store);
}
exports.users = users;
function invoices() {
    var store = new xania_1.Reactive.Store(new InvoiceRepository());
    var onSelect = function (row) {
        store.get("currentRow").set(row);
        store.refresh();
    };
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", { style: "height: 95%;", className: "row" },
        xania_1.Xania.tag("div", { className: [xania_1.expr("currentRow -> 'col-8'"), xania_1.expr("not currentRow -> 'col-12'")] },
            xania_1.Xania.tag(Section, { title: "Invoices" },
                xania_1.Xania.tag(grid_1.default, { data: xania_1.expr("await dataSource"), onSelectionChanged: onSelect },
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "description", display: "Description" }),
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "invoiceDate", display: "Invoice Date" })),
                xania_1.Xania.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                    xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("currentRow <- createNew()") },
                        xania_1.Xania.tag("span", { className: "fa fa-plus" }),
                        " Add New")))),
        xania_1.Xania.tag(xania_1.With, { object: xania_1.expr("currentRow") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag(Section, { title: xania_1.expr("description"), onCancel: xania_1.expr("cancel") },
                    xania_1.Xania.tag(TextEditor, { field: "description", display: "Description" }),
                    xania_1.Xania.tag("button", { onClick: xania_1.expr("addLine ()") }, "add"),
                    xania_1.Xania.tag("div", { className: "row" },
                        xania_1.Xania.tag(xania_1.Repeat, { source: xania_1.expr("lines") },
                            xania_1.Xania.tag("div", { className: "col-6" },
                                xania_1.Xania.tag("input", { type: "text", className: "form-control", name: "description" })),
                            xania_1.Xania.tag("div", { className: "col-6" },
                                xania_1.Xania.tag("input", { type: "text", className: "form-control", name: "amount" })))),
                    xania_1.Xania.tag("div", { className: "form-group", style: "padding: 10px; background-color: #EEE; border: 1px solid #DDD;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("save ()") },
                            xania_1.Xania.tag("span", { className: "fa fa-save" }),
                            " Save")))))), store);
}
exports.invoices = invoices;
function companies() {
    var store = new xania_1.Reactive.Store(new CompanyRepository());
    var onSelect = function (row) {
        store.get("currentRow").set(row);
        store.refresh();
    };
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", { style: "height: 95%;", className: "row" },
        xania_1.Xania.tag("div", { className: [xania_1.expr("currentRow -> 'col-8'"), xania_1.expr("not currentRow -> 'col-12'")] },
            xania_1.Xania.tag(Section, { title: "Companies" },
                xania_1.Xania.tag(grid_1.default, { data: xania_1.expr("await dataSource"), onSelectionChanged: onSelect },
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "name", display: "Company Name" })),
                xania_1.Xania.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                    xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("currentRow <- createNew()") },
                        xania_1.Xania.tag("span", { className: "fa fa-plus" }),
                        " Add New")))),
        xania_1.Xania.tag(xania_1.With, { object: xania_1.expr("currentRow") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag(Section, { title: xania_1.expr("description"), onCancel: xania_1.expr("cancel") },
                    xania_1.Xania.tag(TextEditor, { field: "name", display: "Company Name" }),
                    xania_1.Xania.tag("div", { className: "form-group", style: "padding: 10px; background-color: #EEE; border: 1px solid #DDD;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("save ()") },
                            xania_1.Xania.tag("span", { className: "fa fa-save" }),
                            " Save")))))), store);
}
exports.companies = companies;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxzQ0FBc0g7QUFDdEgsa0NBQWtEO0FBQ2xELHVCQUFvQjtBQUNwQixrREFBaUQ7QUFDakQsMkNBQThDO0FBQzlDLDJDQUEwQztBQUMxQywrQkFBNkM7QUFDN0Msb0NBQXVDO0FBQ3ZDLDJDQUEyQztBQUUzQyxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO0lBQ3JCLE1BQU0sRUFBRSxFQUFFO0lBQ1YsSUFBSSxFQUFFLFNBQVM7SUFDZixFQUFFLEVBQUUsSUFBSSx3QkFBZ0IsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDO0lBQy9DLE9BQU8sRUFBRSxJQUFJO0lBQ2IsUUFBUTtRQUNKLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUNELE1BQU07UUFDRixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztJQUM3QixDQUFDO0lBQ0QsT0FBTztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUc7WUFDZixJQUFJLEVBQUUsRUFBRTtZQUNSLEtBQUssRUFBRSxFQUFFO1lBQ1QsY0FBYyxFQUFFLEtBQUs7U0FDeEIsQ0FBQTtJQUNMLENBQUM7Q0FDSixDQUFDLENBQUM7QUFFSDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsYUFBUSxPQUFHLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRkQsc0JBRUM7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsdUNBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUZELHNCQUVDO0FBRUQsY0FBcUIsRUFBcUI7UUFBbkIsa0JBQU0sRUFBRSxjQUFJLEVBQUUsWUFBRztJQUNwQyxRQUFR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LEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUZELHNCQUVDO0FBRUQ7QUFFQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgWGFuaWEgYXMgeGFuaWEsIFJlcGVhdCwgV2l0aCwgSWYsIGV4cHIsIERvbSwgUmVtb3RlRGF0YVNvdXJjZSwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IFVybEhlbHBlciwgVmlld1Jlc3VsdCB9IGZyb20gXCIuLi9zcmMvbXZjXCJcclxuaW1wb3J0ICcuL2FkbWluLmNzcydcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vc3JjL29ic2VydmFibGVzXCI7XHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSAnLi4vc2FtcGxlL2Nsb2NrL2FwcCdcclxuaW1wb3J0IFRvZG9BcHAgZnJvbSBcIi4uL3NhbXBsZS90b2Rvcy9hcHBcIjtcclxuaW1wb3J0IERhdGFHcmlkLCB7IFRleHRDb2x1bW4gfSBmcm9tIFwiLi9ncmlkXCJcclxuaW1wb3J0IExpYiA9IHJlcXVpcmUoXCIuLi9kaWFncmFtL2xpYlwiKTtcclxuaW1wb3J0IEJhbGxzQXBwIGZyb20gJy4uL3NhbXBsZS9iYWxscy9hcHAnO1xyXG5cclxudmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHtcclxuICAgIGZpbHRlcjogXCJcIixcclxuICAgIHVzZXI6IFwiSWJyYWhpbVwiLFxyXG4gICAgZHM6IG5ldyBSZW1vdGVEYXRhU291cmNlKCcvYXBpL3VzZXIvJywgXCJ1c2Vyc1wiKSxcclxuICAgIGN1cnJlbnQ6IG51bGwsXHJcbiAgICBzYXZlVXNlcigpIHtcclxuICAgICAgICB0aGlzLnVzZXJzLnNhdmUodGhpcy5jdXJyZW50VXNlcik7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgIH0sXHJcbiAgICBjYW5jZWwoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGFkZFVzZXIoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IHtcclxuICAgICAgICAgICAgbmFtZTogXCJcIixcclxuICAgICAgICAgICAgZW1haWw6IFwiXCIsXHJcbiAgICAgICAgICAgIGVtYWlsQ29uZmlybWVkOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYmFsbHMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPEJhbGxzQXBwIC8+KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+aW5kZXg8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lbnUoeyBkcml2ZXIsIGh0bWwsIHVybCB9KSB7XHJcbiAgICBtYWluTWVudSh1cmwpLmJpbmQoKVxyXG4gICAgICAgIC51cGRhdGUobmV3IFJlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVzaGVldCgpIHtcclxuICAgIHZhciB0aW1lID0gbmV3IE9ic2VydmFibGVzLlRpbWUoKTtcclxuICAgIHZhciB0b2dnbGVUaW1lID0gKCkgPT4ge1xyXG4gICAgICAgIHRpbWUudG9nZ2xlKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+dGltZXNoZWV0IHtleHByKFwiYXdhaXQgdGltZVwiKX1cclxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RvZ2dsZVRpbWV9PnRvZ2dsZSB0aW1lPC9idXR0b24+XHJcbiAgICAgICAgPENsb2NrQXBwIHRpbWU9e2V4cHIoXCJhd2FpdCB0aW1lXCIpfSAvPlxyXG4gICAgPC9kaXY+LCBuZXcgUmUuU3RvcmUoeyB0aW1lIH0pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvZG9zKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxUb2RvQXBwIC8+KTtcclxufVxyXG5cclxuZnVuY3Rpb24gU2VjdGlvbihhdHRycywgY2hpbGRyZW4pIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwic2VjdGlvblwiIHN0eWxlPVwiaGVpZ2h0OiAxMDAlXCI+XHJcbiAgICAgICAgICAgIDxJZiBleHByPXthdHRycy5vbkNhbmNlbH0+XHJcbiAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHN0eWxlPVwibWFyZ2luOiAxNnB4IDE2cHggMCAwO1wiIG9uQ2xpY2s9e2F0dHJzLm9uQ2FuY2VsfT7DlzwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8L0lmPlxyXG4gICAgICAgICAgICA8aGVhZGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4XCI+PHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPiA8c3Bhbj57YXR0cnMudGl0bGUgfHwgJ1VudGl0bGVkJ308L3NwYW4+PC9oZWFkZXI+XHJcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAwcHggMTZweCAxMDBweCAxNnB4OyBoZWlnaHQ6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICB7Y2hpbGRyZW59XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvc2VjdGlvbj5cclxuICAgICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFRleHRFZGl0b3IoYXR0cnMpIHtcclxuICAgIHZhciBpZCA9IE1hdGgucmFuZG9tKCk7XHJcbiAgICByZXR1cm4geGFuaWEudGFnKFwiZGl2XCIsXHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbih7IGNsYXNzTmFtZTogXCJmb3JtLWdyb3VwXCIgfSwgYXR0cnMpLFxyXG4gICAgICAgIFtcclxuICAgICAgICAgICAgPGxhYmVsIGZvcj17aWR9PnthdHRycy5kaXNwbGF5fTwvbGFiZWw+LFxyXG4gICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgaWQ9e2lkfSB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPXthdHRycy5kaXNwbGF5fSBuYW1lPXthdHRycy5maWVsZH0gLz5cclxuICAgICAgICBdXHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBCb29sZWFuRWRpdG9yKGF0dHJzKSB7XHJcbiAgICB2YXIgaWQgPSBNYXRoLnJhbmRvbSgpO1xyXG4gICAgcmV0dXJuIHhhbmlhLnRhZyhcImRpdlwiLFxyXG4gICAgICAgIE9iamVjdC5hc3NpZ24oeyBjbGFzc05hbWU6IFwiZm9ybS1jaGVja1wiIH0sIGF0dHJzKSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJmb3JtLWNoZWNrLWxhYmVsXCIgaHRtbEZvcj17aWR9PlxyXG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cImZvcm0tY2hlY2staW5wdXRcIiBpZD17aWR9IHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ9e2V4cHIoYXR0cnMuZmllbGQpfSAvPiB7YXR0cnMuZGlzcGxheX1cclxuICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICBdXHJcbiAgICApO1xyXG59XHJcblxyXG5hYnN0cmFjdCBjbGFzcyBNb2RlbFJlcG9zaXRvcnkge1xyXG4gICAgcHJpdmF0ZSBkYXRhU291cmNlO1xyXG4gICAgcHJvdGVjdGVkIGN1cnJlbnRSb3cgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHVybDogc3RyaW5nLCBleHByOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLmRhdGFTb3VyY2UgPSBuZXcgUmVtb3RlRGF0YVNvdXJjZSh1cmwsIGV4cHIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmUoKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhU291cmNlLnNhdmUodGhpcy5jdXJyZW50Um93KTtcclxuICAgICAgICB0aGlzLmNhbmNlbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNhbmNlbCgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRSb3cgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IGNyZWF0ZU5ldygpO1xyXG59XHJcblxyXG5jbGFzcyBVc2VyUmVwb3NpdG9yeSBleHRlbmRzIE1vZGVsUmVwb3NpdG9yeSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoJy9hcGkvdXNlci8nLCBcInVzZXJzXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZU5ldygpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBuYW1lOiBcIlwiLFxyXG4gICAgICAgICAgICBlbWFpbDogXCJcIixcclxuICAgICAgICAgICAgZW1haWxDb25maXJtZWQ6IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBJbnZvaWNlUmVwb3NpdG9yeSBleHRlbmRzIE1vZGVsUmVwb3NpdG9yeSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoXCIvYXBpL2ludm9pY2UvXCIsIFwiaW52b2ljZXNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkTGluZSgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRSb3cubGluZXMucHVzaCh7XHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIm5ldyBsaW5lXCIsXHJcbiAgICAgICAgICAgIGFtb3VudDogTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlTmV3KCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBudWxsLFxyXG4gICAgICAgICAgICBsaW5lczogW11cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBDb21wYW55UmVwb3NpdG9yeSBleHRlbmRzIE1vZGVsUmVwb3NpdG9yeSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcihcIi9hcGkvY29tcGFueS9cIiwgXCJjb21wYW5pZXNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlTmV3KCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG5hbWU6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlcnMoKSB7XHJcbiAgICB2YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUobmV3IFVzZXJSZXBvc2l0b3J5KCkpO1xyXG5cclxuICAgIHZhciBvblNlbGVjdCA9IHJvdyA9PiB7XHJcbiAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFJvd1wiKS5zZXQocm93KTtcclxuICAgICAgICBzdG9yZS5yZWZyZXNoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJoZWlnaHQ6IDk1JTtcIiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e1tleHByKFwiY3VycmVudFJvdyAtPiAnY29sLTgnXCIpLCBleHByKFwibm90IGN1cnJlbnRSb3cgLT4gJ2NvbC0xMidcIildfT5cclxuICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPVwiVXNlcnNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgZGF0YT17ZXhwcihcImF3YWl0IGRhdGFTb3VyY2VcIil9IG9uU2VsZWN0aW9uQ2hhbmdlZD17b25TZWxlY3R9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJuYW1lXCIgZGlzcGxheT1cIlVzZXIgbmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwiZW1haWxDb25maXJtZWRcIiBkaXNwbGF5PVwiRW1haWwgY29uZmlybWVkXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJjdXJyZW50Um93IDwtIGNyZWF0ZU5ldygpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxXaXRoIG9iamVjdD17ZXhwcihcImN1cnJlbnRSb3dcIil9PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPXtleHByKFwibmFtZVwiKX0gb25DYW5jZWw9e2V4cHIoXCJjYW5jZWxcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8VGV4dEVkaXRvciBmaWVsZD1cIm5hbWVcIiBkaXNwbGF5PVwiVXNlciBOYW1lXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRFZGl0b3IgZmllbGQ9XCJlbWFpbFwiIGRpc3BsYXk9XCJFbWFpbFwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxCb29sZWFuRWRpdG9yIGZpZWxkPVwiZW1haWxDb25maXJtZWRcIiBkaXNwbGF5PVwiRW1haWwgY29uZmlybWVkXCIgLz5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiIHN0eWxlPVwicGFkZGluZzogMTBweDsgYmFja2dyb3VuZC1jb2xvcjogI0VFRTsgYm9yZGVyOiAxcHggc29saWQgI0RERDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcInNhdmUgKClcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXNhdmVcIj48L3NwYW4+IFNhdmU8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9TZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvV2l0aD5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGludm9pY2VzKCkge1xyXG4gICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKG5ldyBJbnZvaWNlUmVwb3NpdG9yeSgpKTtcclxuXHJcbiAgICB2YXIgb25TZWxlY3QgPSByb3cgPT4ge1xyXG4gICAgICAgIHN0b3JlLmdldChcImN1cnJlbnRSb3dcIikuc2V0KHJvdyk7XHJcbiAgICAgICAgc3RvcmUucmVmcmVzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdChcclxuICAgICAgICA8ZGl2IHN0eWxlPVwiaGVpZ2h0OiA5NSU7XCIgY2xhc3NOYW1lPVwicm93XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbZXhwcihcImN1cnJlbnRSb3cgLT4gJ2NvbC04J1wiKSwgZXhwcihcIm5vdCBjdXJyZW50Um93IC0+ICdjb2wtMTInXCIpXX0+XHJcbiAgICAgICAgICAgICAgICA8U2VjdGlvbiB0aXRsZT1cIkludm9pY2VzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPERhdGFHcmlkIGRhdGE9e2V4cHIoXCJhd2FpdCBkYXRhU291cmNlXCIpfSBvblNlbGVjdGlvbkNoYW5nZWQ9e29uU2VsZWN0fSA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwiZGVzY3JpcHRpb25cIiBkaXNwbGF5PVwiRGVzY3JpcHRpb25cIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8VGV4dENvbHVtbiBmaWVsZD1cImludm9pY2VEYXRlXCIgZGlzcGxheT1cIkludm9pY2UgRGF0ZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9EYXRhR3JpZD5cclxuICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4OyBtYXJnaW46IDAgMTZweDsgcGFkZGluZzogMDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBvbkNsaWNrPXtleHByKFwiY3VycmVudFJvdyA8LSBjcmVhdGVOZXcoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1wbHVzXCI+PC9zcGFuPiBBZGQgTmV3PC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9mb290ZXI+XHJcbiAgICAgICAgICAgICAgICA8L1NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8V2l0aCBvYmplY3Q9e2V4cHIoXCJjdXJyZW50Um93XCIpfT5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8U2VjdGlvbiB0aXRsZT17ZXhwcihcImRlc2NyaXB0aW9uXCIpfSBvbkNhbmNlbD17ZXhwcihcImNhbmNlbFwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0RWRpdG9yIGZpZWxkPVwiZGVzY3JpcHRpb25cIiBkaXNwbGF5PVwiRGVzY3JpcHRpb25cIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2V4cHIoXCJhZGRMaW5lICgpXCIpfT5hZGQ8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSZXBlYXQgc291cmNlPXtleHByKFwibGluZXNcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTZcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiBuYW1lPVwiZGVzY3JpcHRpb25cIiAvPjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTZcIj48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiBuYW1lPVwiYW1vdW50XCIgLz48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvUmVwZWF0PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiIHN0eWxlPVwicGFkZGluZzogMTBweDsgYmFja2dyb3VuZC1jb2xvcjogI0VFRTsgYm9yZGVyOiAxcHggc29saWQgI0RERDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcInNhdmUgKClcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXNhdmVcIj48L3NwYW4+IFNhdmU8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9TZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvV2l0aD5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhbmllcygpIHtcclxuICAgIHZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZShuZXcgQ29tcGFueVJlcG9zaXRvcnkoKSk7XHJcblxyXG4gICAgdmFyIG9uU2VsZWN0ID0gcm93ID0+IHtcclxuICAgICAgICBzdG9yZS5nZXQoXCJjdXJyZW50Um93XCIpLnNldChyb3cpO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogOTUlO1wiIGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17W2V4cHIoXCJjdXJyZW50Um93IC0+ICdjb2wtOCdcIiksIGV4cHIoXCJub3QgY3VycmVudFJvdyAtPiAnY29sLTEyJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgPFNlY3Rpb24gdGl0bGU9XCJDb21wYW5pZXNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgZGF0YT17ZXhwcihcImF3YWl0IGRhdGFTb3VyY2VcIil9IG9uU2VsZWN0aW9uQ2hhbmdlZD17b25TZWxlY3R9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJuYW1lXCIgZGlzcGxheT1cIkNvbXBhbnkgTmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9EYXRhR3JpZD5cclxuICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4OyBtYXJnaW46IDAgMTZweDsgcGFkZGluZzogMDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBvbkNsaWNrPXtleHByKFwiY3VycmVudFJvdyA8LSBjcmVhdGVOZXcoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1wbHVzXCI+PC9zcGFuPiBBZGQgTmV3PC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9mb290ZXI+XHJcbiAgICAgICAgICAgICAgICA8L1NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8V2l0aCBvYmplY3Q9e2V4cHIoXCJjdXJyZW50Um93XCIpfT5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8U2VjdGlvbiB0aXRsZT17ZXhwcihcImRlc2NyaXB0aW9uXCIpfSBvbkNhbmNlbD17ZXhwcihcImNhbmNlbFwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0RWRpdG9yIGZpZWxkPVwibmFtZVwiIGRpc3BsYXk9XCJDb21wYW55IE5hbWVcIiAvPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCIgc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyBiYWNrZ3JvdW5kLWNvbG9yOiAjRUVFOyBib3JkZXI6IDFweCBzb2xpZCAjREREO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBvbkNsaWNrPXtleHByKFwic2F2ZSAoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtc2F2ZVwiPjwvc3Bhbj4gU2F2ZTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L1NlY3Rpb24+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9XaXRoPlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG52YXIgTWVudUl0ZW0gPSAoe25hbWV9KSA9PiA8bGk+PGEgaHJlZj1cImh0dHA6Ly93d3cuZ29vZ2xlLm5sXCI+bWVudSBpdGVtIHtuYW1lfTwvYT48L2xpPjtcclxuXHJcbmludGVyZmFjZSBJQXBwQWN0aW9uIHtcclxuICAgIHBhdGg6IHN0cmluZyxcclxuICAgIGRpc3BsYXk/OiBzdHJpbmc7XHJcbn1cclxuXHJcbnZhciBhY3Rpb25zOiBJQXBwQWN0aW9uW10gPSBbXHJcbiAgICB7IHBhdGg6IFwidGltZXNoZWV0XCIsIGRpc3BsYXk6IFwiVGltZXNoZWV0XCIgfSxcclxuICAgIHsgcGF0aDogXCJpbnZvaWNlc1wiLCBkaXNwbGF5OiBcIkludm9pY2VzXCIgfSxcclxuICAgIHsgcGF0aDogXCJ0b2Rvc1wiLCBkaXNwbGF5OiBcIlRvZG9zXCIgfSxcclxuICAgIHsgcGF0aDogXCJjb21wYW5pZXNcIiwgZGlzcGxheTogXCJDb21wYW5pZXNcIiB9LFxyXG4gICAgeyBwYXRoOiBcInVzZXJzXCIsIGRpc3BsYXk6IFwiVXNlcnNcIiB9LFxyXG4gICAgeyBwYXRoOiBcImdyYXBoXCIsIGRpc3BsYXk6IFwiR3JhcGhcIiB9LFxyXG4gICAgeyBwYXRoOiBcImJhbGxzXCIsIGRpc3BsYXk6IFwiQmFsbHNcIiB9XHJcbl07XHJcblxyXG52YXIgbWFpbk1lbnU6ICh1cmw6IFVybEhlbHBlcikgPT4gVGVtcGxhdGUuSU5vZGUgPSAodXJsOiBVcmxIZWxwZXIpID0+XHJcbiAgICA8dWwgY2xhc3NOYW1lPVwibWFpbi1tZW51LXVsXCI+XHJcbiAgICAgICAge2FjdGlvbnMubWFwKHggPT4gKFxyXG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibWFpbi1tZW51aXRlbVwiPlxyXG4gICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwibWFpbi1tZW51aXRlbS1saW5rXCIgaHJlZj1cIlwiIG9uQ2xpY2s9e3VybC5hY3Rpb24oeC5wYXRoKX0+e3guZGlzcGxheSB8fCB4LnBhdGh9PC9hPlxyXG4gICAgICAgICAgICA8L2xpPikpfVxyXG4gICAgPC91bD47XHJcblxyXG52YXIgcGFuZWwgPSBuID0+XHJcbiAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJtZGwtbGF5b3V0X190YWItcGFuZWxcIiBpZD17XCJzY3JvbGwtdGFiLVwiICsgbn0+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdlLWNvbnRlbnRcIj50YWIge259PC9kaXY+XHJcbiAgICA8L3NlY3Rpb24+O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdyYXBoKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxMaWIuR3JhcGhBcHAgLz4sIG5ldyBSZS5TdG9yZSh7fSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhY3Rpb24oKSB7XHJcblxyXG59Il19