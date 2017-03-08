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
    users: new xania_1.RemoteObject('/api/query/', "users"),
    currentUser: null,
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
function users() {
    var onSelectUser = function (user) {
        store.get("currentUser").set(user);
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
                    xania_1.Xania.tag(grid_1.default, { data: xania_1.expr("await users"), onSelectionChanged: onSelectUser },
                        xania_1.Xania.tag(grid_1.TextColumn, { field: "name", display: "User name" }),
                        xania_1.Xania.tag(grid_1.TextColumn, { field: "emailConfirmed", display: "Email confirmed" })),
                    xania_1.Xania.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("addUser") },
                            xania_1.Xania.tag("span", { className: "fa fa-plus" }),
                            " Add New"))))),
        xania_1.Xania.tag(xania_1.If, { expr: xania_1.expr("currentUser") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag("section", { className: "section", style: "height: 100%" },
                    xania_1.Xania.tag("button", { type: "button", className: "close", "aria-hidden": "true", style: "margin: 16px 16px 0 0;", onClick: xania_1.expr("cancel") }, "\u00D7"),
                    xania_1.Xania.tag("header", { style: "height: 50px" },
                        xania_1.Xania.tag("span", { className: "fa fa-adjust" }),
                        " ",
                        xania_1.Xania.tag("span", null, xania_1.expr("currentUser.name"))),
                    xania_1.Xania.tag("div", { style: "padding: 0px 16px 100px 16px; height: 100%;" },
                        xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                            xania_1.Xania.tag("label", { className: "control-label", for: "UserName" }, "User name"),
                            xania_1.Xania.tag("div", null,
                                xania_1.Xania.tag("input", { className: "form-control", type: "text", placeholder: "User name", name: "currentUser.name" }))),
                        xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                            xania_1.Xania.tag("label", { className: "control-label", for: "Email" }, "Email"),
                            xania_1.Xania.tag("div", null,
                                xania_1.Xania.tag("input", { id: "Email", className: "form-control", type: "text", placeholder: "Email", name: "currentUser.email" }))),
                        xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                            xania_1.Xania.tag("div", null,
                                xania_1.Xania.tag("input", { type: "checkbox", checked: xania_1.expr("currentUser.emailConfirmed") }),
                                " ",
                                xania_1.Xania.tag("label", { className: "control-label", for: "EmailConfirmed" }, "Email confirmed"))),
                        xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                            xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("saveUser ()") },
                                xania_1.Xania.tag("span", { className: "fa fa-save" }),
                                " Save"))))))), store);
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
function action() {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQTRHO0FBQzVHLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5QywyQ0FBMEM7QUFDMUMsK0JBQTZDO0FBQzdDLG9DQUF1QztBQUN2QywyQ0FBMkM7QUFFM0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQztJQUNyQixNQUFNLEVBQUUsRUFBRTtJQUNWLElBQUksRUFBRSxTQUFTO0lBQ2YsS0FBSyxFQUFFLElBQUksb0JBQVksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDO0lBQy9DLFdBQVcsRUFBRSxJQUFJO0lBQ2pCLFFBQVE7UUFDSixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFDRCxNQUFNO1FBQ0YsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFDN0IsQ0FBQztJQUNELE9BQU87UUFDSCxJQUFJLENBQUMsV0FBVyxHQUFHO1lBQ2YsSUFBSSxFQUFFLEVBQUU7WUFDUixLQUFLLEVBQUUsRUFBRTtZQUNULGNBQWMsRUFBRSxLQUFLO1NBQ3hCLENBQUE7SUFDTCxDQUFDO0NBQ0osQ0FBQyxDQUFDO0FBRUg7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDLGtCQUFDLGFBQVEsT0FBRyxDQUFDLENBQUM7QUFDeEMsQ0FBQztBQUZELHNCQUVDO0FBRUQ7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDLHVDQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFGRCxzQkFFQztBQUVELGNBQXFCLEVBQXFCO1FBQW5CLGtCQUFNLEVBQUUsY0FBSSxFQUFFLFlBQUc7SUFDcEMsUUFBUSxDQUFD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Q0FDVjtBQUxMLENBS0ssQ0FBQztBQUVWLElBQUksS0FBSyxHQUFHLFVBQUEsQ0FBQztJQUNULE9BQUEsK0JBQVMsU0FBUyxFQUFDLHVCQUF1QixFQUFDLEVBQUUsRUFBRSxhQUFhLEdBQUcsQ0FBQztRQUM1RCwyQkFBSyxTQUFTLEVBQUMsY0FBYzs7WUFBTSxDQUFDLENBQU8sQ0FDckM7QUFGVixDQUVVLENBQUM7QUFFZjtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsR0FBRyxDQUFDLFFBQVEsT0FBRyxFQUFFLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRkQsc0JBRUM7QUFFRDtBQUVBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgUmVwZWF0LCBJZiwgZXhwciwgRG9tLCBSZW1vdGVPYmplY3QsIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBVcmxIZWxwZXIsIFZpZXdSZXN1bHQgfSBmcm9tIFwiLi4vc3JjL212Y1wiXHJcbmltcG9ydCAnLi9hZG1pbi5jc3MnXHJcbmltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4uL3NyYy9vYnNlcnZhYmxlc1wiO1xyXG5pbXBvcnQgeyBDbG9ja0FwcCB9IGZyb20gJy4uL3NhbXBsZS9jbG9jay9hcHAnXHJcbmltcG9ydCBUb2RvQXBwIGZyb20gXCIuLi9zYW1wbGUvdG9kb3MvYXBwXCI7XHJcbmltcG9ydCBEYXRhR3JpZCwgeyBUZXh0Q29sdW1uIH0gZnJvbSBcIi4vZ3JpZFwiXHJcbmltcG9ydCBMaWIgPSByZXF1aXJlKFwiLi4vZGlhZ3JhbS9saWJcIik7XHJcbmltcG9ydCBCYWxsc0FwcCBmcm9tICcuLi9zYW1wbGUvYmFsbHMvYXBwJztcclxuXHJcbnZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICBmaWx0ZXI6IFwiXCIsXHJcbiAgICB1c2VyOiBcIklicmFoaW1cIixcclxuICAgIHVzZXJzOiBuZXcgUmVtb3RlT2JqZWN0KCcvYXBpL3F1ZXJ5LycsIFwidXNlcnNcIiksXHJcbiAgICBjdXJyZW50VXNlcjogbnVsbCxcclxuICAgIHNhdmVVc2VyKCkge1xyXG4gICAgICAgIHRoaXMudXNlcnMuc2F2ZSh0aGlzLmN1cnJlbnRVc2VyKTtcclxuICAgICAgICB0aGlzLmNhbmNlbCgpO1xyXG4gICAgfSxcclxuICAgIGNhbmNlbCgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRVc2VyID0gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgYWRkVXNlcigpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRVc2VyID0ge1xyXG4gICAgICAgICAgICBuYW1lOiBcIlwiLFxyXG4gICAgICAgICAgICBlbWFpbDogXCJcIixcclxuICAgICAgICAgICAgZW1haWxDb25maXJtZWQ6IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiYWxscygpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8QmFsbHNBcHAgLz4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXgoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj5pbmRleDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVudSh7IGRyaXZlciwgaHRtbCwgdXJsIH0pIHtcclxuICAgIG1haW5NZW51KHVybCkuYmluZCgpXHJcbiAgICAgICAgLnVwZGF0ZShuZXcgUmUuU3RvcmUoe30pLCBkcml2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW52b2ljZXMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGRpdj5pbnZvaWNlcyB7ZXhwcihcInVzZXJcIil9PC9kaXY+XHJcbiAgICAgICAgICAgIDxSZXBlYXQgc291cmNlPXtleHByKFwiYXdhaXQgdXNlcnNcIil9PlxyXG4gICAgICAgICAgICAgICAgPGRpdj57ZXhwcihcIm5hbWVcIil9IHtleHByKFwiZW1haWxcIil9IHtleHByKFwicm9sZXNcIil9PC9kaXY+XHJcbiAgICAgICAgICAgIDwvUmVwZWF0PlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZXNoZWV0KCkge1xyXG4gICAgdmFyIHRpbWUgPSBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpO1xyXG4gICAgdmFyIHRvZ2dsZVRpbWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGltZS50b2dnbGUoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj50aW1lc2hlZXQge2V4cHIoXCJhd2FpdCB0aW1lXCIpfVxyXG4gICAgICAgIDxidXR0b24gb25DbGljaz17dG9nZ2xlVGltZX0+dG9nZ2xlIHRpbWU8L2J1dHRvbj5cclxuICAgICAgICA8Q2xvY2tBcHAgdGltZT17ZXhwcihcImF3YWl0IHRpbWVcIil9IC8+XHJcbiAgICA8L2Rpdj4sIG5ldyBSZS5TdG9yZSh7IHRpbWUgfSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9kb3MoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPFRvZG9BcHAgLz4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlcnMoKSB7XHJcbiAgICB2YXIgb25TZWxlY3RVc2VyID0gdXNlciA9PiB7XHJcbiAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFVzZXJcIikuc2V0KHVzZXIpO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogOTUlO1wiIGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17W2V4cHIoXCJjdXJyZW50VXNlciAtPiAnY29sLTgnXCIpLCBleHByKFwibm90IGN1cnJlbnRVc2VyIC0+ICdjb2wtMTInXCIpXX0+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMHB4IDE2cHggMTAwcHggMTZweDsgaGVpZ2h0OiAxMDAlO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aGVhZGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4XCI+PHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPiA8c3Bhbj5Vc2Vyczwvc3Bhbj48L2hlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPERhdGFHcmlkIGRhdGE9e2V4cHIoXCJhd2FpdCB1c2Vyc1wiKX0gb25TZWxlY3Rpb25DaGFuZ2VkPXtvblNlbGVjdFVzZXJ9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwibmFtZVwiIGRpc3BsYXk9XCJVc2VyIG5hbWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJlbWFpbENvbmZpcm1lZFwiIGRpc3BsYXk9XCJFbWFpbCBjb25maXJtZWRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4OyBtYXJnaW46IDAgMTZweDsgcGFkZGluZzogMDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcImFkZFVzZXJcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXBsdXNcIj48L3NwYW4+IEFkZCBOZXdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxJZiBleHByPXtleHByKFwiY3VycmVudFVzZXJcIil9PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInNlY3Rpb25cIiBzdHlsZT1cImhlaWdodDogMTAwJVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHN0eWxlPVwibWFyZ2luOiAxNnB4IDE2cHggMCAwO1wiIG9uQ2xpY2s9e2V4cHIoXCJjYW5jZWxcIil9PsOXPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj48c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hZGp1c3RcIj48L3NwYW4+IDxzcGFuPntleHByKFwiY3VycmVudFVzZXIubmFtZVwiKX08L3NwYW4+PC9oZWFkZXI+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMHB4IDE2cHggMTAwcHggMTZweDsgaGVpZ2h0OiAxMDAlO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj48bGFiZWwgY2xhc3NOYW1lPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cIlVzZXJOYW1lXCI+VXNlciBuYW1lPC9sYWJlbD48ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiVXNlciBuYW1lXCIgbmFtZT1cImN1cnJlbnRVc2VyLm5hbWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJFbWFpbFwiPkVtYWlsPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjxpbnB1dCBpZD1cIkVtYWlsXCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIkVtYWlsXCIgbmFtZT1cImN1cnJlbnRVc2VyLmVtYWlsXCIgLz48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj48ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtleHByKFwiY3VycmVudFVzZXIuZW1haWxDb25maXJtZWRcIil9IC8+IDxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiRW1haWxDb25maXJtZWRcIj5FbWFpbCBjb25maXJtZWQ8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcInNhdmVVc2VyICgpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtc2F2ZVwiPjwvc3Bhbj4gU2F2ZTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L0lmPlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG52YXIgTWVudUl0ZW0gPSAoe25hbWV9KSA9PiA8bGk+PGEgaHJlZj1cImh0dHA6Ly93d3cuZ29vZ2xlLm5sXCI+bWVudSBpdGVtIHtuYW1lfTwvYT48L2xpPjtcclxuXHJcbmludGVyZmFjZSBJQXBwQWN0aW9uIHtcclxuICAgIHBhdGg6IHN0cmluZyxcclxuICAgIGRpc3BsYXk/OiBzdHJpbmc7XHJcbn1cclxuXHJcbnZhciBhY3Rpb25zOiBJQXBwQWN0aW9uW10gPSBbXHJcbiAgICB7IHBhdGg6IFwidGltZXNoZWV0XCIsIGRpc3BsYXk6IFwiVGltZXNoZWV0XCIgfSxcclxuICAgIHsgcGF0aDogXCJpbnZvaWNlc1wiLCBkaXNwbGF5OiBcIkludm9pY2VzXCIgfSxcclxuICAgIHsgcGF0aDogXCJ0b2Rvc1wiLCBkaXNwbGF5OiBcIlRvZG9zXCIgfSxcclxuICAgIHsgcGF0aDogXCJ1c2Vyc1wiLCBkaXNwbGF5OiBcIlVzZXJzXCIgfSxcclxuICAgIHsgcGF0aDogXCJncmFwaFwiLCBkaXNwbGF5OiBcIkdyYXBoXCIgfSxcclxuICAgIHsgcGF0aDogXCJiYWxsc1wiLCBkaXNwbGF5OiBcIkJhbGxzXCIgfVxyXG5dO1xyXG5cclxudmFyIG1haW5NZW51OiAodXJsOiBVcmxIZWxwZXIpID0+IFRlbXBsYXRlLklOb2RlID0gKHVybDogVXJsSGVscGVyKSA9PlxyXG4gICAgPHVsIGNsYXNzTmFtZT1cIm1haW4tbWVudS11bFwiPlxyXG4gICAgICAgIHthY3Rpb25zLm1hcCh4ID0+IChcclxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW1cIj5cclxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW0tbGlua1wiIGhyZWY9XCJcIiBvbkNsaWNrPXt1cmwuYWN0aW9uKHgucGF0aCl9Pnt4LmRpc3BsYXkgfHwgeC5wYXRofTwvYT5cclxuICAgICAgICAgICAgPC9saT4pKX1cclxuICAgIDwvdWw+O1xyXG5cclxudmFyIHBhbmVsID0gbiA9PlxyXG4gICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwibWRsLWxheW91dF9fdGFiLXBhbmVsXCIgaWQ9e1wic2Nyb2xsLXRhYi1cIiArIG59PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnZS1jb250ZW50XCI+dGFiIHtufTwvZGl2PlxyXG4gICAgPC9zZWN0aW9uPjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBncmFwaCgpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8TGliLkdyYXBoQXBwIC8+LCBuZXcgUmUuU3RvcmUoe30pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWN0aW9uKCkge1xyXG5cclxufSJdfQ==