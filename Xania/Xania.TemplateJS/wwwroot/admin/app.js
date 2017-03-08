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
                        xania_1.Xania.tag("button", { className: "btn btn-primary" },
                            xania_1.Xania.tag("span", { className: "glyphicon glyphicon-plus" }),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQTRHO0FBQzVHLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5QywyQ0FBMEM7QUFDMUMsK0JBQTZDO0FBQzdDLG9DQUF1QztBQUN2QywyQ0FBMkM7QUFFM0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQztJQUNyQixNQUFNLEVBQUUsRUFBRTtJQUNWLElBQUksRUFBRSxTQUFTO0lBQ2YsS0FBSyxFQUFFLElBQUksb0JBQVksQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDO0lBQy9DLFdBQVcsRUFBRSxJQUFJO0lBQ2pCLFFBQVE7UUFDSixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFDRCxNQUFNO1FBQ0YsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFDN0IsQ0FBQztDQUNKLENBQUMsQ0FBQztBQUVIO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQyxrQkFBQyxhQUFRLE9BQUcsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUFGRCxzQkFFQztBQUVEO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQyx1Q0FBZ0IsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRkQsc0JBRUM7QUFFRCxjQUFxQixFQUFxQjtRQUFuQixrQkFBTSxFQUFFLGNBQUksRUFBRSxZQUFHO0lBQ3BDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUU7U0FDZixNQUFNLENBQUMsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBSEQsb0JB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QyxDQUFPLENBQ3JDO0FBRlYsQ0FFVSxDQUFDO0FBRWY7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDLGtCQUFDLEdBQUcsQ0FBQyxRQUFRLE9BQUcsRUFBRSxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUZELHNCQUVDO0FBRUQ7QUFFQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgWGFuaWEgYXMgeGFuaWEsIFJlcGVhdCwgSWYsIGV4cHIsIERvbSwgUmVtb3RlT2JqZWN0LCBSZWFjdGl2ZSBhcyBSZSwgVGVtcGxhdGUgfSBmcm9tIFwiLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgVXJsSGVscGVyLCBWaWV3UmVzdWx0IH0gZnJvbSBcIi4uL3NyYy9tdmNcIlxyXG5pbXBvcnQgJy4vYWRtaW4uY3NzJ1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi9zcmMvb2JzZXJ2YWJsZXNcIjtcclxuaW1wb3J0IHsgQ2xvY2tBcHAgfSBmcm9tICcuLi9zYW1wbGUvY2xvY2svYXBwJ1xyXG5pbXBvcnQgVG9kb0FwcCBmcm9tIFwiLi4vc2FtcGxlL3RvZG9zL2FwcFwiO1xyXG5pbXBvcnQgRGF0YUdyaWQsIHsgVGV4dENvbHVtbiB9IGZyb20gXCIuL2dyaWRcIlxyXG5pbXBvcnQgTGliID0gcmVxdWlyZShcIi4uL2RpYWdyYW0vbGliXCIpO1xyXG5pbXBvcnQgQmFsbHNBcHAgZnJvbSAnLi4vc2FtcGxlL2JhbGxzL2FwcCc7XHJcblxyXG52YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUoe1xyXG4gICAgZmlsdGVyOiBcIlwiLFxyXG4gICAgdXNlcjogXCJJYnJhaGltXCIsXHJcbiAgICB1c2VyczogbmV3IFJlbW90ZU9iamVjdCgnL2FwaS9xdWVyeS8nLCBcInVzZXJzXCIpLFxyXG4gICAgY3VycmVudFVzZXI6IG51bGwsXHJcbiAgICBzYXZlVXNlcigpIHtcclxuICAgICAgICB0aGlzLnVzZXJzLnNhdmUodGhpcy5jdXJyZW50VXNlcik7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgIH0sXHJcbiAgICBjYW5jZWwoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlciA9IGZhbHNlO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiYWxscygpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8QmFsbHNBcHAgLz4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXgoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj5pbmRleDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVudSh7IGRyaXZlciwgaHRtbCwgdXJsIH0pIHtcclxuICAgIG1haW5NZW51KHVybCkuYmluZCgpXHJcbiAgICAgICAgLnVwZGF0ZShuZXcgUmUuU3RvcmUoe30pLCBkcml2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW52b2ljZXMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGRpdj5pbnZvaWNlcyB7ZXhwcihcInVzZXJcIil9PC9kaXY+XHJcbiAgICAgICAgICAgIDxSZXBlYXQgc291cmNlPXtleHByKFwiYXdhaXQgdXNlcnNcIil9PlxyXG4gICAgICAgICAgICAgICAgPGRpdj57ZXhwcihcIm5hbWVcIil9IHtleHByKFwiZW1haWxcIil9IHtleHByKFwicm9sZXNcIil9PC9kaXY+XHJcbiAgICAgICAgICAgIDwvUmVwZWF0PlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZXNoZWV0KCkge1xyXG4gICAgdmFyIHRpbWUgPSBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpO1xyXG4gICAgdmFyIHRvZ2dsZVRpbWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGltZS50b2dnbGUoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj50aW1lc2hlZXQge2V4cHIoXCJhd2FpdCB0aW1lXCIpfVxyXG4gICAgICAgIDxidXR0b24gb25DbGljaz17dG9nZ2xlVGltZX0+dG9nZ2xlIHRpbWU8L2J1dHRvbj5cclxuICAgICAgICA8Q2xvY2tBcHAgdGltZT17ZXhwcihcImF3YWl0IHRpbWVcIil9IC8+XHJcbiAgICA8L2Rpdj4sIG5ldyBSZS5TdG9yZSh7IHRpbWUgfSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9kb3MoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPFRvZG9BcHAgLz4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlcnMoKSB7XHJcbiAgICB2YXIgb25TZWxlY3RVc2VyID0gdXNlciA9PiB7XHJcbiAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFVzZXJcIikuc2V0KHVzZXIpO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogOTUlO1wiIGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17W2V4cHIoXCJjdXJyZW50VXNlciAtPiAnY29sLTgnXCIpLCBleHByKFwibm90IGN1cnJlbnRVc2VyIC0+ICdjb2wtMTInXCIpXX0+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMHB4IDE2cHggMTAwcHggMTZweDsgaGVpZ2h0OiAxMDAlO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aGVhZGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4XCI+PHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPiA8c3Bhbj5Vc2Vyczwvc3Bhbj48L2hlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPERhdGFHcmlkIGRhdGE9e2V4cHIoXCJhd2FpdCB1c2Vyc1wiKX0gb25TZWxlY3Rpb25DaGFuZ2VkPXtvblNlbGVjdFVzZXJ9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwibmFtZVwiIGRpc3BsYXk9XCJVc2VyIG5hbWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJlbWFpbENvbmZpcm1lZFwiIGRpc3BsYXk9XCJFbWFpbCBjb25maXJtZWRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4OyBtYXJnaW46IDAgMTZweDsgcGFkZGluZzogMDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzXCI+PC9zcGFuPiBBZGQgTmV3XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9mb290ZXI+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8SWYgZXhwcj17ZXhwcihcImN1cnJlbnRVc2VyXCIpfT5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBhcmlhLWhpZGRlbj1cInRydWVcIiBzdHlsZT1cIm1hcmdpbjogMTZweCAxNnB4IDAgMDtcIiBvbkNsaWNrPXtleHByKFwiY2FuY2VsXCIpfT7DlzwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aGVhZGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4XCI+PHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPiA8c3Bhbj57ZXhwcihcImN1cnJlbnRVc2VyLm5hbWVcIil9PC9zcGFuPjwvaGVhZGVyPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDBweCAxNnB4IDEwMHB4IDE2cHg7IGhlaWdodDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJVc2VyTmFtZVwiPlVzZXIgbmFtZTwvbGFiZWw+PGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIlVzZXIgbmFtZVwiIG5hbWU9XCJjdXJyZW50VXNlci5uYW1lXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiRW1haWxcIj5FbWFpbDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48aW5wdXQgaWQ9XCJFbWFpbFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJFbWFpbFwiIG5hbWU9XCJjdXJyZW50VXNlci5lbWFpbFwiIC8+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD17ZXhwcihcImN1cnJlbnRVc2VyLmVtYWlsQ29uZmlybWVkXCIpfSAvPiA8bGFiZWwgY2xhc3NOYW1lPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cIkVtYWlsQ29uZmlybWVkXCI+RW1haWwgY29uZmlybWVkPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJzYXZlVXNlciAoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXNhdmVcIj48L3NwYW4+IFNhdmU8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9JZj5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxudmFyIE1lbnVJdGVtID0gKHtuYW1lfSkgPT4gPGxpPjxhIGhyZWY9XCJodHRwOi8vd3d3Lmdvb2dsZS5ubFwiPm1lbnUgaXRlbSB7bmFtZX08L2E+PC9saT47XHJcblxyXG5pbnRlcmZhY2UgSUFwcEFjdGlvbiB7XHJcbiAgICBwYXRoOiBzdHJpbmcsXHJcbiAgICBkaXNwbGF5Pzogc3RyaW5nO1xyXG59XHJcblxyXG52YXIgYWN0aW9uczogSUFwcEFjdGlvbltdID0gW1xyXG4gICAgeyBwYXRoOiBcInRpbWVzaGVldFwiLCBkaXNwbGF5OiBcIlRpbWVzaGVldFwiIH0sXHJcbiAgICB7IHBhdGg6IFwiaW52b2ljZXNcIiwgZGlzcGxheTogXCJJbnZvaWNlc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidG9kb3NcIiwgZGlzcGxheTogXCJUb2Rvc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidXNlcnNcIiwgZGlzcGxheTogXCJVc2Vyc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwiZ3JhcGhcIiwgZGlzcGxheTogXCJHcmFwaFwiIH0sXHJcbiAgICB7IHBhdGg6IFwiYmFsbHNcIiwgZGlzcGxheTogXCJCYWxsc1wiIH1cclxuXTtcclxuXHJcbnZhciBtYWluTWVudTogKHVybDogVXJsSGVscGVyKSA9PiBUZW1wbGF0ZS5JTm9kZSA9ICh1cmw6IFVybEhlbHBlcikgPT5cclxuICAgIDx1bCBjbGFzc05hbWU9XCJtYWluLW1lbnUtdWxcIj5cclxuICAgICAgICB7YWN0aW9ucy5tYXAoeCA9PiAoXHJcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtXCI+XHJcbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtLWxpbmtcIiBocmVmPVwiXCIgb25DbGljaz17dXJsLmFjdGlvbih4LnBhdGgpfT57eC5kaXNwbGF5IHx8IHgucGF0aH08L2E+XHJcbiAgICAgICAgICAgIDwvbGk+KSl9XHJcbiAgICA8L3VsPjtcclxuXHJcbnZhciBwYW5lbCA9IG4gPT5cclxuICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm1kbC1sYXlvdXRfX3RhYi1wYW5lbFwiIGlkPXtcInNjcm9sbC10YWItXCIgKyBufT5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2UtY29udGVudFwiPnRhYiB7bn08L2Rpdj5cclxuICAgIDwvc2VjdGlvbj47XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ3JhcGgoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPExpYi5HcmFwaEFwcCAvPiwgbmV3IFJlLlN0b3JlKHt9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFjdGlvbigpIHtcclxuXHJcbn0iXX0=