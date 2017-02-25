"use strict";
var xania_1 = require("../src/xania");
var mvc_1 = require("../src/mvc");
require("./admin.css");
var observables_1 = require("../src/observables");
var app_1 = require("../sample/clock/app");
var todo_1 = require("../sample/layout/todo");
var grid_1 = require("./grid");
var RemoteObject = (function () {
    function RemoteObject(url) {
        this.url = url;
    }
    RemoteObject.prototype.subscribe = function (observer) {
    };
    return RemoteObject;
}());
var store = new xania_1.Reactive.Store({
    user: "Ibrahim",
    users: new RemoteObject(''),
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
    mainMenu(url).bind(xania_1.Dom.DomVisitor)
        .update(new xania_1.Reactive.Store({}), driver);
}
exports.menu = menu;
function invoices() {
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", null,
        "invoices ",
        xania_1.query("user")), store);
}
exports.invoices = invoices;
function timesheet() {
    var time = new observables_1.Observables.Time();
    var toggleTime = function () {
        time.toggle();
    };
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", null,
        "timesheet ",
        xania_1.query("await time"),
        xania_1.Xania.tag("button", { onClick: toggleTime }, "toggle time"),
        xania_1.Xania.tag(app_1.ClockApp, { time: time })), new xania_1.Reactive.Store({ time: time }));
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
        xania_1.Xania.tag("div", { className: [xania_1.query("currentUser -> 'col-8'"), xania_1.query("not currentUser -> 'col-12'")] },
            xania_1.Xania.tag("section", { className: "section", style: "height: 100%" },
                xania_1.Xania.tag("div", { style: "padding: 0px 16px 100px 16px; height: 100%;" },
                    xania_1.Xania.tag("header", { style: "height: 50px" },
                        xania_1.Xania.tag("span", { className: "fa fa-adjust" }),
                        " ",
                        xania_1.Xania.tag("span", null, "Users")),
                    xania_1.Xania.tag(grid_1.default, { activeRecord: xania_1.query("currentUser") }),
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
                        xania_1.Xania.tag("span", null, xania_1.query("currentUser.Name"))),
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
                            xania_1.Xania.tag("input", { type: "checkbox", checked: xania_1.query("currentUser.EmailConfirmed") }),
                            " ",
                            xania_1.Xania.tag("label", { className: "control-label", for: "EmailConfirmed" }, "Email confirmed"))),
                    xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.query("saveUser ()") },
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
    { path: "users", display: "Users" }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQWtHO0FBQ2xHLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5Qyw4Q0FBZ0Q7QUFDaEQsK0JBQTZCO0FBRTdCO0lBQ0ksc0JBQW9CLEdBQVc7UUFBWCxRQUFHLEdBQUgsR0FBRyxDQUFRO0lBQy9CLENBQUM7SUFFRCxnQ0FBUyxHQUFULFVBQVUsUUFBb0M7SUFDOUMsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0FBQyxBQU5ELElBTUM7QUFFRCxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO0lBQ3JCLElBQUksRUFBRSxTQUFTO0lBQ2YsS0FBSyxFQUFFLElBQUksWUFBWSxDQUFDLEVBQUUsQ0FBQztJQUMzQixXQUFXLEVBQUUsRUFBRTtJQUNmLFFBQVE7UUFDSixPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDL0MsQ0FBQztDQUNKLENBQUMsQ0FBQztBQUlIO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQyx1Q0FBZ0IsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRkQsc0JBRUM7QUFFRCxjQUFxQixFQUFxQjtRQUFuQixrQkFBTSxFQUFFLGNBQUksRUFBRSxZQUFHO0lBQ3BDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQWEsV0FBRyxDQUFDLFVBQVUsQ0FBQztTQUN6QyxNQUFNLENBQUMsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBSEQsb0JBR0M7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUM7O1FBQWUsYUFBSyxDQUFDLE1BQU0sQ0FBQyxDQUFPLEVBQUUsS0FBSyxD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QUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FDZCwwQkFBSSxTQUFTLEVBQUMsZUFBZTtRQUN6Qix5QkFBRyxTQUFTLEVBQUMsb0JBQW9CLEVBQUMsSUFBSSxFQUFDLEVBQUUsRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFLLENBQy9GLENBQUMsRUFIUSxDQUdSLENBQUMsQ0FDVjtBQUxMLENBS0ssQ0FBQztBQUVWLElBQUksS0FBSyxHQUFHLFVBQUEsQ0FBQztJQUNULE9BQUEsK0JBQVMsU0FBUyxFQUFDLHVCQUF1QixFQUFDLEVBQUUsRUFBRSxhQUFhLEdBQUcsQ0FBQztRQUM1RCwyQkFBSyxTQUFTLEVBQUMsY0FBYzs7WUFBTSxDQUFDLENBQU8sQ0FDckM7QUFGVixDQUVVLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgRm9yRWFjaCwgcXVlcnksIFZpZXcsIERvbSwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IFVybEhlbHBlciwgVmlld1Jlc3VsdCB9IGZyb20gXCIuLi9zcmMvbXZjXCJcclxuaW1wb3J0ICcuL2FkbWluLmNzcydcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vc3JjL29ic2VydmFibGVzXCI7XHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSAnLi4vc2FtcGxlL2Nsb2NrL2FwcCdcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuLi9zYW1wbGUvbGF5b3V0L3RvZG9cIjtcclxuaW1wb3J0IERhdGFHcmlkIGZyb20gXCIuL2dyaWRcIlxyXG5cclxuY2xhc3MgUmVtb3RlT2JqZWN0IHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdXJsOiBzdHJpbmcpIHtcclxuICAgIH1cclxuXHJcbiAgICBzdWJzY3JpYmUob2JzZXJ2ZXI6IE9ic2VydmFibGVzLklPYnNlcnZlcjxhbnk+KSB7XHJcbiAgICB9XHJcbn1cclxuXHJcbnZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICB1c2VyOiBcIklicmFoaW1cIixcclxuICAgIHVzZXJzOiBuZXcgUmVtb3RlT2JqZWN0KCcnKSxcclxuICAgIGN1cnJlbnRVc2VyOiB7fSxcclxuICAgIHNhdmVVc2VyKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwic2F2ZSB1c2VyXCIsIHRoaXMuY3VycmVudFVzZXIpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+aW5kZXg8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lbnUoeyBkcml2ZXIsIGh0bWwsIHVybCB9KSB7XHJcbiAgICBtYWluTWVudSh1cmwpLmJpbmQ8UmUuQmluZGluZz4oRG9tLkRvbVZpc2l0b3IpXHJcbiAgICAgICAgLnVwZGF0ZShuZXcgUmUuU3RvcmUoe30pLCBkcml2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW52b2ljZXMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj5pbnZvaWNlcyB7cXVlcnkoXCJ1c2VyXCIpfTwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZXNoZWV0KCkge1xyXG4gICAgdmFyIHRpbWUgPSBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpO1xyXG4gICAgdmFyIHRvZ2dsZVRpbWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGltZS50b2dnbGUoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj50aW1lc2hlZXQge3F1ZXJ5KFwiYXdhaXQgdGltZVwiKX1cclxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RvZ2dsZVRpbWV9PnRvZ2dsZSB0aW1lPC9idXR0b24+XHJcbiAgICAgICAgPENsb2NrQXBwIHRpbWU9e3RpbWV9IC8+XHJcbiAgICA8L2Rpdj4sIG5ldyBSZS5TdG9yZSh7IHRpbWUgfSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9kb3MoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPFRvZG9BcHAgLz4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlcnMoKSB7XHJcbiAgICB2YXIgb25DYW5jZWwgPSAoKSA9PiB7XHJcbiAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFVzZXJcIikuc2V0KHt9KTtcclxuICAgICAgICBzdG9yZS5yZWZyZXNoKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogOTUlO1wiIGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17W3F1ZXJ5KFwiY3VycmVudFVzZXIgLT4gJ2NvbC04J1wiKSwgcXVlcnkoXCJub3QgY3VycmVudFVzZXIgLT4gJ2NvbC0xMidcIildfT5cclxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInNlY3Rpb25cIiBzdHlsZT1cImhlaWdodDogMTAwJVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAwcHggMTZweCAxMDBweCAxNnB4OyBoZWlnaHQ6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj48c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hZGp1c3RcIj48L3NwYW4+IDxzcGFuPlVzZXJzPC9zcGFuPjwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgYWN0aXZlUmVjb3JkPXtxdWVyeShcImN1cnJlbnRVc2VyXCIpfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4OyBtYXJnaW46IDAgMTZweDsgcGFkZGluZzogMDtcIj48YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIGRhdGEtYmluZD1cImNsaWNrOiB1c2Vycy5jcmVhdGVcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj48L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTRcIj5cclxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInNlY3Rpb25cIiBzdHlsZT1cImhlaWdodDogMTAwJVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImNsb3NlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgc3R5bGU9XCJtYXJnaW46IDE2cHggMTZweCAwIDA7XCIgb25DbGljaz17b25DYW5jZWx9PsOXPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPGhlYWRlciBzdHlsZT1cImhlaWdodDogNTBweFwiPjxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFkanVzdFwiPjwvc3Bhbj4gPHNwYW4+VXNlcjwvc3Bhbj48L2hlYWRlcj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDBweCAxNnB4IDEwMHB4IDE2cHg7IGhlaWdodDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhlYWRlciBzdHlsZT1cImhlaWdodDogNTBweFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+e3F1ZXJ5KFwiY3VycmVudFVzZXIuTmFtZVwiKX08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiVXNlck5hbWVcIj5Vc2VyIG5hbWU8L2xhYmVsPjxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIlVzZXIgbmFtZVwiIG5hbWU9XCJjdXJyZW50VXNlci5OYW1lXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiRW1haWxcIj5FbWFpbDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjxpbnB1dCBpZD1cIkVtYWlsXCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIkVtYWlsXCIgbmFtZT1cImN1cnJlbnRVc2VyLkVtYWlsXCIgLz48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtxdWVyeShcImN1cnJlbnRVc2VyLkVtYWlsQ29uZmlybWVkXCIpfSAvPiA8bGFiZWwgY2xhc3NOYW1lPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cIkVtYWlsQ29uZmlybWVkXCI+RW1haWwgY29uZmlybWVkPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e3F1ZXJ5KFwic2F2ZVVzZXIgKClcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXNhdmVcIj48L3NwYW4+IFNhdmU8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG52YXIgTWVudUl0ZW0gPSAoe25hbWV9KSA9PiA8bGk+PGEgaHJlZj1cImh0dHA6Ly93d3cuZ29vZ2xlLm5sXCI+bWVudSBpdGVtIHtuYW1lfTwvYT48L2xpPjtcclxuXHJcbmludGVyZmFjZSBJQXBwQWN0aW9uIHtcclxuICAgIHBhdGg6IHN0cmluZyxcclxuICAgIGRpc3BsYXk/OiBzdHJpbmc7XHJcbn1cclxuXHJcbnZhciBhY3Rpb25zOiBJQXBwQWN0aW9uW10gPSBbXHJcbiAgICB7IHBhdGg6IFwidGltZXNoZWV0XCIsIGRpc3BsYXk6IFwiVGltZXNoZWV0XCIgfSxcclxuICAgIHsgcGF0aDogXCJpbnZvaWNlc1wiLCBkaXNwbGF5OiBcIkludm9pY2VzXCIgfSxcclxuICAgIHsgcGF0aDogXCJ0b2Rvc1wiLCBkaXNwbGF5OiBcIlRvZG9zXCIgfSxcclxuICAgIHsgcGF0aDogXCJ1c2Vyc1wiLCBkaXNwbGF5OiBcIlVzZXJzXCIgfVxyXG5dO1xyXG5cclxudmFyIG1haW5NZW51OiAodXJsOiBVcmxIZWxwZXIpID0+IFRlbXBsYXRlLklOb2RlID0gKHVybDogVXJsSGVscGVyKSA9PlxyXG4gICAgPHVsIGNsYXNzTmFtZT1cIm1haW4tbWVudS11bFwiPlxyXG4gICAgICAgIHthY3Rpb25zLm1hcCh4ID0+IChcclxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW1cIj5cclxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW0tbGlua1wiIGhyZWY9XCJcIiBvbkNsaWNrPXt1cmwuYWN0aW9uKHgucGF0aCl9Pnt4LmRpc3BsYXkgfHwgeC5wYXRofTwvYT5cclxuICAgICAgICAgICAgPC9saT4pKX1cclxuICAgIDwvdWw+O1xyXG5cclxudmFyIHBhbmVsID0gbiA9PlxyXG4gICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwibWRsLWxheW91dF9fdGFiLXBhbmVsXCIgaWQ9e1wic2Nyb2xsLXRhYi1cIiArIG59PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnZS1jb250ZW50XCI+dGFiIHtufTwvZGl2PlxyXG4gICAgPC9zZWN0aW9uPjsiXX0=