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
        this.currentRow = false;
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
    InvoiceRepository.prototype.createNew = function () {
        return {
            description: null
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
        xania_1.Xania.tag(xania_1.If, { expr: xania_1.expr("currentRow") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag(Section, { title: xania_1.expr("currentRow.description"), onCancel: xania_1.expr("cancel") },
                    xania_1.Xania.tag(TextEditor, { field: "description", display: "Description" }),
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
        xania_1.Xania.tag(xania_1.If, { expr: xania_1.expr("currentRow") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag(Section, { title: xania_1.expr("currentRow.description"), onCancel: xania_1.expr("cancel") },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxzQ0FBZ0g7QUFDaEgsa0NBQWtEO0FBQ2xELHVCQUFvQjtBQUNwQixrREFBaUQ7QUFDakQsMkNBQThDO0FBQzlDLDJDQUEwQztBQUMxQywrQkFBNkM7QUFDN0Msb0NBQXVDO0FBQ3ZDLDJDQUEyQztBQUUzQyxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO0lBQ3JCLE1BQU0sRUFBRSxFQUFFO0lBQ1YsSUFBSSxFQUFFLFNBQVM7SUFDZixFQUFFLEVBQUUsSUFBSSx3QkFBZ0IsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDO0lBQy9DLE9BQU8sRUFBRSxJQUFJO0lBQ2IsUUFBUTtRQUNKLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUNELE1BQU07UUFDRixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztJQUM3QixDQUFDO0lBQ0QsT0FBTztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUc7WUFDZixJQUFJLEVBQUUsRUFBRTtZQUNSLEtBQUssRUFBRSxFQUFFO1lBQ1QsY0FBYyxFQUFFLEtBQUs7U0FDeEIsQ0FBQTtJQUNMLENBQUM7Q0FDSixDQUFDLENBQUM7QUFFSDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsYUFBUSxPQUFHLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRkQsc0JBRUM7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsdUNBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUZELHNCQUVDO0FBRUQsY0FBcUIsRUFBcUI7UUFBbkIsa0JBQU0sRUFBRSxjQUFJLEVBQUUsWUFBRztJQUNwQyxRQUFR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LENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUssQ0FDL0YsQ0FBQyxFQUhRLENBR1IsQ0FBQyxDQUNWO0FBTEwsQ0FLSyxDQUFDO0FBRVYsSUFBSSxLQUFLLEdBQUcsVUFBQSxDQUFDO0lBQ1QsT0FBQSwrQkFBUyxTQUFTLEVBQUMsdUJBQXVCLEVBQUMsRUFBRSxFQUFFLGFBQWEsR0FBRyxDQUFDO1FBQzVELDJCQUFLLFNBQVMsRUFBQyxjQUFjOztZQUFNLENBQUMsQ0FBTyxDQUNyQztBQUZWLENBRVUsQ0FBQztBQUVmO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQyxrQkFBQyxHQUFHLENBQUMsUUFBUSxPQUFHLEVBQUUsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUM7QUFGRCxzQkFFQztBQUVEO0FBRUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFhhbmlhIGFzIHhhbmlhLCBSZXBlYXQsIElmLCBleHByLCBEb20sIFJlbW90ZURhdGFTb3VyY2UsIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBVcmxIZWxwZXIsIFZpZXdSZXN1bHQgfSBmcm9tIFwiLi4vc3JjL212Y1wiXHJcbmltcG9ydCAnLi9hZG1pbi5jc3MnXHJcbmltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4uL3NyYy9vYnNlcnZhYmxlc1wiO1xyXG5pbXBvcnQgeyBDbG9ja0FwcCB9IGZyb20gJy4uL3NhbXBsZS9jbG9jay9hcHAnXHJcbmltcG9ydCBUb2RvQXBwIGZyb20gXCIuLi9zYW1wbGUvdG9kb3MvYXBwXCI7XHJcbmltcG9ydCBEYXRhR3JpZCwgeyBUZXh0Q29sdW1uIH0gZnJvbSBcIi4vZ3JpZFwiXHJcbmltcG9ydCBMaWIgPSByZXF1aXJlKFwiLi4vZGlhZ3JhbS9saWJcIik7XHJcbmltcG9ydCBCYWxsc0FwcCBmcm9tICcuLi9zYW1wbGUvYmFsbHMvYXBwJztcclxuXHJcbnZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICBmaWx0ZXI6IFwiXCIsXHJcbiAgICB1c2VyOiBcIklicmFoaW1cIixcclxuICAgIGRzOiBuZXcgUmVtb3RlRGF0YVNvdXJjZSgnL2FwaS91c2VyLycsIFwidXNlcnNcIiksXHJcbiAgICBjdXJyZW50OiBudWxsLFxyXG4gICAgc2F2ZVVzZXIoKSB7XHJcbiAgICAgICAgdGhpcy51c2Vycy5zYXZlKHRoaXMuY3VycmVudFVzZXIpO1xyXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICB9LFxyXG4gICAgY2FuY2VsKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFVzZXIgPSBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBhZGRVc2VyKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFVzZXIgPSB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiXCIsXHJcbiAgICAgICAgICAgIGVtYWlsOiBcIlwiLFxyXG4gICAgICAgICAgICBlbWFpbENvbmZpcm1lZDogZmFsc2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJhbGxzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxCYWxsc0FwcCAvPik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbmRleCgpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8ZGl2PmluZGV4PC9kaXY+LCBzdG9yZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZW51KHsgZHJpdmVyLCBodG1sLCB1cmwgfSkge1xyXG4gICAgbWFpbk1lbnUodXJsKS5iaW5kKClcclxuICAgICAgICAudXBkYXRlKG5ldyBSZS5TdG9yZSh7fSksIGRyaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0aW1lc2hlZXQoKSB7XHJcbiAgICB2YXIgdGltZSA9IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCk7XHJcbiAgICB2YXIgdG9nZ2xlVGltZSA9ICgpID0+IHtcclxuICAgICAgICB0aW1lLnRvZ2dsZSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8ZGl2PnRpbWVzaGVldCB7ZXhwcihcImF3YWl0IHRpbWVcIil9XHJcbiAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0b2dnbGVUaW1lfT50b2dnbGUgdGltZTwvYnV0dG9uPlxyXG4gICAgICAgIDxDbG9ja0FwcCB0aW1lPXtleHByKFwiYXdhaXQgdGltZVwiKX0gLz5cclxuICAgIDwvZGl2PiwgbmV3IFJlLlN0b3JlKHsgdGltZSB9KSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2RvcygpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8VG9kb0FwcCAvPik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNlY3Rpb24oYXR0cnMsIGNoaWxkcmVuKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInNlY3Rpb25cIiBzdHlsZT1cImhlaWdodDogMTAwJVwiPlxyXG4gICAgICAgICAgICA8SWYgZXhwcj17YXR0cnMub25DYW5jZWx9PlxyXG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBhcmlhLWhpZGRlbj1cInRydWVcIiBzdHlsZT1cIm1hcmdpbjogMTZweCAxNnB4IDAgMDtcIiBvbkNsaWNrPXthdHRycy5vbkNhbmNlbH0+w5c8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9JZj5cclxuICAgICAgICAgICAgPGhlYWRlciBzdHlsZT1cImhlaWdodDogNTBweFwiPjxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFkanVzdFwiPjwvc3Bhbj4gPHNwYW4+e2F0dHJzLnRpdGxlIHx8ICdVbnRpdGxlZCd9PC9zcGFuPjwvaGVhZGVyPlxyXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMHB4IDE2cHggMTAwcHggMTZweDsgaGVpZ2h0OiAxMDAlO1wiPlxyXG4gICAgICAgICAgICAgICAge2NoaWxkcmVufVxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBUZXh0RWRpdG9yKGF0dHJzKSB7XHJcbiAgICB2YXIgaWQgPSBNYXRoLnJhbmRvbSgpO1xyXG4gICAgcmV0dXJuIHhhbmlhLnRhZyhcImRpdlwiLFxyXG4gICAgICAgIE9iamVjdC5hc3NpZ24oeyBjbGFzc05hbWU6IFwiZm9ybS1ncm91cFwiIH0sIGF0dHJzKSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICAgIDxsYWJlbCBmb3I9e2lkfT57YXR0cnMuZGlzcGxheX08L2xhYmVsPixcclxuICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIGlkPXtpZH0gdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj17YXR0cnMuZGlzcGxheX0gbmFtZT17XCJjdXJyZW50Um93LlwiICsgYXR0cnMuZmllbGR9IC8+XHJcbiAgICAgICAgXVxyXG4gICAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gQm9vbGVhbkVkaXRvcihhdHRycykge1xyXG4gICAgdmFyIGlkID0gTWF0aC5yYW5kb20oKTtcclxuICAgIHJldHVybiB4YW5pYS50YWcoXCJkaXZcIixcclxuICAgICAgICBPYmplY3QuYXNzaWduKHsgY2xhc3NOYW1lOiBcImZvcm0tY2hlY2tcIiB9LCBhdHRycyksXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiZm9ybS1jaGVjay1sYWJlbFwiIGh0bWxGb3I9e2lkfT5cclxuICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJmb3JtLWNoZWNrLWlucHV0XCIgaWQ9e2lkfSB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtleHByKFwiY3VycmVudFJvdy5cIiArIGF0dHJzLmZpZWxkKX0gLz4ge2F0dHJzLmRpc3BsYXl9XHJcbiAgICAgICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgXVxyXG4gICAgKTtcclxufVxyXG5cclxuYWJzdHJhY3QgY2xhc3MgTW9kZWxSZXBvc2l0b3J5IHtcclxuICAgIHByaXZhdGUgZGF0YVNvdXJjZTtcclxuICAgIHByaXZhdGUgY3VycmVudFJvdyA9IG51bGw7XHJcblxyXG4gICAgY29uc3RydWN0b3IodXJsOiBzdHJpbmcsIGV4cHI6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuZGF0YVNvdXJjZSA9IG5ldyBSZW1vdGVEYXRhU291cmNlKHVybCwgZXhwcik7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZSgpIHtcclxuICAgICAgICB0aGlzLmRhdGFTb3VyY2Uuc2F2ZSh0aGlzLmN1cnJlbnRSb3cpO1xyXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2FuY2VsKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFJvdyA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IGNyZWF0ZU5ldygpO1xyXG59XHJcblxyXG5jbGFzcyBVc2VyUmVwb3NpdG9yeSBleHRlbmRzIE1vZGVsUmVwb3NpdG9yeSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoJy9hcGkvdXNlci8nLCBcInVzZXJzXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZU5ldygpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBuYW1lOiBcIlwiLFxyXG4gICAgICAgICAgICBlbWFpbDogXCJcIixcclxuICAgICAgICAgICAgZW1haWxDb25maXJtZWQ6IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBJbnZvaWNlUmVwb3NpdG9yeSBleHRlbmRzIE1vZGVsUmVwb3NpdG9yeSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcihcIi9hcGkvaW52b2ljZS9cIiwgXCJpbnZvaWNlc1wiKTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVOZXcoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBDb21wYW55UmVwb3NpdG9yeSBleHRlbmRzIE1vZGVsUmVwb3NpdG9yeSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcihcIi9hcGkvY29tcGFueS9cIiwgXCJjb21wYW5pZXNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlTmV3KCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG5hbWU6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlcnMoKSB7XHJcbiAgICB2YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUobmV3IFVzZXJSZXBvc2l0b3J5KCkpO1xyXG5cclxuICAgIHZhciBvblNlbGVjdCA9IHJvdyA9PiB7XHJcbiAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFJvd1wiKS5zZXQocm93KTtcclxuICAgICAgICBzdG9yZS5yZWZyZXNoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJoZWlnaHQ6IDk1JTtcIiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e1tleHByKFwiY3VycmVudFJvdyAtPiAnY29sLTgnXCIpLCBleHByKFwibm90IGN1cnJlbnRSb3cgLT4gJ2NvbC0xMidcIildfT5cclxuICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPVwiVXNlcnNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgZGF0YT17ZXhwcihcImF3YWl0IGRhdGFTb3VyY2VcIil9IG9uU2VsZWN0aW9uQ2hhbmdlZD17b25TZWxlY3R9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJuYW1lXCIgZGlzcGxheT1cIlVzZXIgbmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwiZW1haWxDb25maXJtZWRcIiBkaXNwbGF5PVwiRW1haWwgY29uZmlybWVkXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJjdXJyZW50Um93IDwtIGNyZWF0ZU5ldygpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxJZiBleHByPXtleHByKFwiY3VycmVudFJvd1wiKX0+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPFNlY3Rpb24gdGl0bGU9e2V4cHIoXCJjdXJyZW50Um93Lm5hbWVcIil9IG9uQ2FuY2VsPXtleHByKFwiY2FuY2VsXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRFZGl0b3IgZmllbGQ9XCJuYW1lXCIgZGlzcGxheT1cIlVzZXIgTmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0RWRpdG9yIGZpZWxkPVwiZW1haWxcIiBkaXNwbGF5PVwiRW1haWxcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Qm9vbGVhbkVkaXRvciBmaWVsZD1cImVtYWlsQ29uZmlybWVkXCIgZGlzcGxheT1cIkVtYWlsIGNvbmZpcm1lZFwiIC8+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIiBzdHlsZT1cInBhZGRpbmc6IDEwcHg7IGJhY2tncm91bmQtY29sb3I6ICNFRUU7IGJvcmRlcjogMXB4IHNvbGlkICNEREQ7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJzYXZlICgpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1zYXZlXCI+PC9zcGFuPiBTYXZlPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L0lmPlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW52b2ljZXMoKSB7XHJcbiAgICB2YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUobmV3IEludm9pY2VSZXBvc2l0b3J5KCkpO1xyXG5cclxuICAgIHZhciBvblNlbGVjdCA9IHJvdyA9PiB7XHJcbiAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFJvd1wiKS5zZXQocm93KTtcclxuICAgICAgICBzdG9yZS5yZWZyZXNoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJoZWlnaHQ6IDk1JTtcIiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e1tleHByKFwiY3VycmVudFJvdyAtPiAnY29sLTgnXCIpLCBleHByKFwibm90IGN1cnJlbnRSb3cgLT4gJ2NvbC0xMidcIildfT5cclxuICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPVwiSW52b2ljZXNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgZGF0YT17ZXhwcihcImF3YWl0IGRhdGFTb3VyY2VcIil9IG9uU2VsZWN0aW9uQ2hhbmdlZD17b25TZWxlY3R9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJkZXNjcmlwdGlvblwiIGRpc3BsYXk9XCJEZXNjcmlwdGlvblwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwiaW52b2ljZURhdGVcIiBkaXNwbGF5PVwiSW52b2ljZSBEYXRlXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJjdXJyZW50Um93IDwtIGNyZWF0ZU5ldygpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxJZiBleHByPXtleHByKFwiY3VycmVudFJvd1wiKX0+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPFNlY3Rpb24gdGl0bGU9e2V4cHIoXCJjdXJyZW50Um93LmRlc2NyaXB0aW9uXCIpfSBvbkNhbmNlbD17ZXhwcihcImNhbmNlbFwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0RWRpdG9yIGZpZWxkPVwiZGVzY3JpcHRpb25cIiBkaXNwbGF5PVwiRGVzY3JpcHRpb25cIiAvPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCIgc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyBiYWNrZ3JvdW5kLWNvbG9yOiAjRUVFOyBib3JkZXI6IDFweCBzb2xpZCAjREREO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBvbkNsaWNrPXtleHByKFwic2F2ZSAoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtc2F2ZVwiPjwvc3Bhbj4gU2F2ZTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L1NlY3Rpb24+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9JZj5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhbmllcygpIHtcclxuICAgIHZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZShuZXcgQ29tcGFueVJlcG9zaXRvcnkoKSk7XHJcblxyXG4gICAgdmFyIG9uU2VsZWN0ID0gcm93ID0+IHtcclxuICAgICAgICBzdG9yZS5nZXQoXCJjdXJyZW50Um93XCIpLnNldChyb3cpO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogOTUlO1wiIGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17W2V4cHIoXCJjdXJyZW50Um93IC0+ICdjb2wtOCdcIiksIGV4cHIoXCJub3QgY3VycmVudFJvdyAtPiAnY29sLTEyJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgPFNlY3Rpb24gdGl0bGU9XCJDb21wYW5pZXNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgZGF0YT17ZXhwcihcImF3YWl0IGRhdGFTb3VyY2VcIil9IG9uU2VsZWN0aW9uQ2hhbmdlZD17b25TZWxlY3R9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJuYW1lXCIgZGlzcGxheT1cIkNvbXBhbnkgTmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9EYXRhR3JpZD5cclxuICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4OyBtYXJnaW46IDAgMTZweDsgcGFkZGluZzogMDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBvbkNsaWNrPXtleHByKFwiY3VycmVudFJvdyA8LSBjcmVhdGVOZXcoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1wbHVzXCI+PC9zcGFuPiBBZGQgTmV3PC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9mb290ZXI+XHJcbiAgICAgICAgICAgICAgICA8L1NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8SWYgZXhwcj17ZXhwcihcImN1cnJlbnRSb3dcIil9PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPXtleHByKFwiY3VycmVudFJvdy5kZXNjcmlwdGlvblwiKX0gb25DYW5jZWw9e2V4cHIoXCJjYW5jZWxcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8VGV4dEVkaXRvciBmaWVsZD1cIm5hbWVcIiBkaXNwbGF5PVwiQ29tcGFueSBOYW1lXCIgLz5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiIHN0eWxlPVwicGFkZGluZzogMTBweDsgYmFja2dyb3VuZC1jb2xvcjogI0VFRTsgYm9yZGVyOiAxcHggc29saWQgI0RERDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcInNhdmUgKClcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXNhdmVcIj48L3NwYW4+IFNhdmU8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9TZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvSWY+XHJcbiAgICAgICAgPC9kaXY+LCBzdG9yZSk7XHJcbn1cclxuXHJcbnZhciBNZW51SXRlbSA9ICh7bmFtZX0pID0+IDxsaT48YSBocmVmPVwiaHR0cDovL3d3dy5nb29nbGUubmxcIj5tZW51IGl0ZW0ge25hbWV9PC9hPjwvbGk+O1xyXG5cclxuaW50ZXJmYWNlIElBcHBBY3Rpb24ge1xyXG4gICAgcGF0aDogc3RyaW5nLFxyXG4gICAgZGlzcGxheT86IHN0cmluZztcclxufVxyXG5cclxudmFyIGFjdGlvbnM6IElBcHBBY3Rpb25bXSA9IFtcclxuICAgIHsgcGF0aDogXCJ0aW1lc2hlZXRcIiwgZGlzcGxheTogXCJUaW1lc2hlZXRcIiB9LFxyXG4gICAgeyBwYXRoOiBcImludm9pY2VzXCIsIGRpc3BsYXk6IFwiSW52b2ljZXNcIiB9LFxyXG4gICAgeyBwYXRoOiBcInRvZG9zXCIsIGRpc3BsYXk6IFwiVG9kb3NcIiB9LFxyXG4gICAgeyBwYXRoOiBcImNvbXBhbmllc1wiLCBkaXNwbGF5OiBcIkNvbXBhbmllc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidXNlcnNcIiwgZGlzcGxheTogXCJVc2Vyc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwiZ3JhcGhcIiwgZGlzcGxheTogXCJHcmFwaFwiIH0sXHJcbiAgICB7IHBhdGg6IFwiYmFsbHNcIiwgZGlzcGxheTogXCJCYWxsc1wiIH1cclxuXTtcclxuXHJcbnZhciBtYWluTWVudTogKHVybDogVXJsSGVscGVyKSA9PiBUZW1wbGF0ZS5JTm9kZSA9ICh1cmw6IFVybEhlbHBlcikgPT5cclxuICAgIDx1bCBjbGFzc05hbWU9XCJtYWluLW1lbnUtdWxcIj5cclxuICAgICAgICB7YWN0aW9ucy5tYXAoeCA9PiAoXHJcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtXCI+XHJcbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtLWxpbmtcIiBocmVmPVwiXCIgb25DbGljaz17dXJsLmFjdGlvbih4LnBhdGgpfT57eC5kaXNwbGF5IHx8IHgucGF0aH08L2E+XHJcbiAgICAgICAgICAgIDwvbGk+KSl9XHJcbiAgICA8L3VsPjtcclxuXHJcbnZhciBwYW5lbCA9IG4gPT5cclxuICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm1kbC1sYXlvdXRfX3RhYi1wYW5lbFwiIGlkPXtcInNjcm9sbC10YWItXCIgKyBufT5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2UtY29udGVudFwiPnRhYiB7bn08L2Rpdj5cclxuICAgIDwvc2VjdGlvbj47XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ3JhcGgoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPExpYi5HcmFwaEFwcCAvPiwgbmV3IFJlLlN0b3JlKHt9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFjdGlvbigpIHtcclxuXHJcbn0iXX0=