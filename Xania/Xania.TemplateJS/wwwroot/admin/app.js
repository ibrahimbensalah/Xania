"use strict";
var xania_1 = require("../src/xania");
var mvc_1 = require("../src/mvc");
require("./admin.css");
var observables_1 = require("../src/observables");
var app_1 = require("../sample/clock/app");
var todo_1 = require("../sample/layout/todo");
var grid_1 = require("./grid");
var RemoteObject = (function () {
    function RemoteObject(url, expr) {
        this.url = url;
        this.expr = expr;
        var config = {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(xania_1.query(expr).ast)
        };
        this.promise = fetch(url, config).then(function (response) {
            return response.json();
        });
    }
    RemoteObject.prototype.subscribe = function (observer) {
        this.promise.then(function (data) {
            observer.onNext(data);
        });
    };
    return RemoteObject;
}());
var store = new xania_1.Reactive.Store({
    user: "Ibrahim",
    users: new RemoteObject('http://localhost:9880/api/query/', "users"),
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
        xania_1.query("user"),
        xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.query("for user in await users") },
            xania_1.Xania.tag("div", null,
                xania_1.query("user.name"),
                " ",
                xania_1.query("user.email"),
                " ",
                xania_1.query("user.roles")))), store);
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
        xania_1.Xania.tag(app_1.ClockApp, { time: xania_1.query("await time") })), new xania_1.Reactive.Store({ time: time }));
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
                    xania_1.Xania.tag(grid_1.default, { activeRecord: xania_1.query("currentUser"), data: xania_1.query("await users") }),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQWtHO0FBQ2xHLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5Qyw4Q0FBZ0Q7QUFDaEQsK0JBQTZCO0FBSTdCO0lBR0ksc0JBQW9CLEdBQVcsRUFBVSxJQUFJO1FBQXpCLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFBVSxTQUFJLEdBQUosSUFBSSxDQUFBO1FBQ3pDLElBQUksTUFBTSxHQUFHO1lBQ1QsTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLGtCQUFrQjthQUNyQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUM7U0FDeEMsQ0FBQztRQUVGLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxRQUFhO1lBQ2pELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsZ0NBQVMsR0FBVCxVQUFVLFFBQW9DO1FBQzFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBUztZQUN4QixRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0FBQyxBQXRCRCxJQXNCQztBQUVELElBQUksS0FBSyxHQUFHLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUM7SUFDckIsSUFBSSxFQUFFLFNBQVM7SUFDZixLQUFLLEVBQUUsSUFBSSxZQUFZLENBQUMsa0NBQWtDLEVBQUUsT0FBTyxDQUFDO0lBQ3BFLFdBQVcsRUFBRSxFQUFF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USxDQUdSLENBQUMsQ0FDVjtBQUxMLENBS0ssQ0FBQztBQUVWLElBQUksS0FBSyxHQUFHLFVBQUEsQ0FBQztJQUNULE9BQUEsK0JBQVMsU0FBUyxFQUFDLHVCQUF1QixFQUFDLEVBQUUsRUFBRSxhQUFhLEdBQUcsQ0FBQztRQUM1RCwyQkFBSyxTQUFTLEVBQUMsY0FBYzs7WUFBTSxDQUFDLENBQU8sQ0FDckM7QUFGVixDQUVVLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgRm9yRWFjaCwgcXVlcnksIFZpZXcsIERvbSwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IFVybEhlbHBlciwgVmlld1Jlc3VsdCB9IGZyb20gXCIuLi9zcmMvbXZjXCJcclxuaW1wb3J0ICcuL2FkbWluLmNzcydcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vc3JjL29ic2VydmFibGVzXCI7XHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSAnLi4vc2FtcGxlL2Nsb2NrL2FwcCdcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuLi9zYW1wbGUvbGF5b3V0L3RvZG9cIjtcclxuaW1wb3J0IERhdGFHcmlkIGZyb20gXCIuL2dyaWRcIlxyXG5cclxuZGVjbGFyZSBmdW5jdGlvbiBmZXRjaDxUPih1cmw6IHN0cmluZywgY29uZmlnPyk6IFByb21pc2U8VD47XHJcblxyXG5jbGFzcyBSZW1vdGVPYmplY3Qge1xyXG4gICAgcHJvbWlzZTogUHJvbWlzZTxPYmplY3Q+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdXJsOiBzdHJpbmcsIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgIHZhciBjb25maWcgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShxdWVyeShleHByKS5hc3QpXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9taXNlID0gZmV0Y2godXJsLCBjb25maWcpLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJzY3JpYmUob2JzZXJ2ZXI6IE9ic2VydmFibGVzLklPYnNlcnZlcjxhbnk+KSB7XHJcbiAgICAgICAgdGhpcy5wcm9taXNlLnRoZW4oKGRhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBvYnNlcnZlci5vbk5leHQoZGF0YSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbnZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICB1c2VyOiBcIklicmFoaW1cIixcclxuICAgIHVzZXJzOiBuZXcgUmVtb3RlT2JqZWN0KCdodHRwOi8vbG9jYWxob3N0Ojk4ODAvYXBpL3F1ZXJ5LycsIFwidXNlcnNcIiksXHJcbiAgICBjdXJyZW50VXNlcjoge30sXHJcbiAgICBzYXZlVXNlcigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcInNhdmUgdXNlclwiLCB0aGlzLmN1cnJlbnRVc2VyKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+aW5kZXg8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lbnUoeyBkcml2ZXIsIGh0bWwsIHVybCB9KSB7XHJcbiAgICBtYWluTWVudSh1cmwpLmJpbmQ8UmUuQmluZGluZz4oRG9tLkRvbVZpc2l0b3IpXHJcbiAgICAgICAgLnVwZGF0ZShuZXcgUmUuU3RvcmUoe30pLCBkcml2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW52b2ljZXMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgaW52b2ljZXMge3F1ZXJ5KFwidXNlclwiKX1cclxuICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17cXVlcnkoXCJmb3IgdXNlciBpbiBhd2FpdCB1c2Vyc1wiKX0+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PntxdWVyeShcInVzZXIubmFtZVwiKX0ge3F1ZXJ5KFwidXNlci5lbWFpbFwiKX0ge3F1ZXJ5KFwidXNlci5yb2xlc1wiKX08L2Rpdj5cclxuICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZXNoZWV0KCkge1xyXG4gICAgdmFyIHRpbWUgPSBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpO1xyXG4gICAgdmFyIHRvZ2dsZVRpbWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGltZS50b2dnbGUoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj50aW1lc2hlZXQge3F1ZXJ5KFwiYXdhaXQgdGltZVwiKX1cclxuICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3RvZ2dsZVRpbWV9PnRvZ2dsZSB0aW1lPC9idXR0b24+XHJcbiAgICAgICAgPENsb2NrQXBwIHRpbWU9e3F1ZXJ5KFwiYXdhaXQgdGltZVwiKX0gLz5cclxuICAgIDwvZGl2PiwgbmV3IFJlLlN0b3JlKHsgdGltZSB9KSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2RvcygpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8VG9kb0FwcCAvPik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1c2VycygpIHtcclxuICAgIHZhciBvbkNhbmNlbCA9ICgpID0+IHtcclxuICAgICAgICBzdG9yZS5nZXQoXCJjdXJyZW50VXNlclwiKS5zZXQoe30pO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdChcclxuICAgICAgICA8ZGl2IHN0eWxlPVwiaGVpZ2h0OiA5NSU7XCIgY2xhc3NOYW1lPVwicm93XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbcXVlcnkoXCJjdXJyZW50VXNlciAtPiAnY29sLTgnXCIpLCBxdWVyeShcIm5vdCBjdXJyZW50VXNlciAtPiAnY29sLTEyJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwic2VjdGlvblwiIHN0eWxlPVwiaGVpZ2h0OiAxMDAlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDBweCAxNnB4IDEwMHB4IDE2cHg7IGhlaWdodDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhlYWRlciBzdHlsZT1cImhlaWdodDogNTBweFwiPjxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFkanVzdFwiPjwvc3Bhbj4gPHNwYW4+VXNlcnM8L3NwYW4+PC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxEYXRhR3JpZCBhY3RpdmVSZWNvcmQ9e3F1ZXJ5KFwiY3VycmVudFVzZXJcIil9IGRhdGE9e3F1ZXJ5KFwiYXdhaXQgdXNlcnNcIil9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPjxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgZGF0YS1iaW5kPVwiY2xpY2s6IHVzZXJzLmNyZWF0ZVwiPjxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tcGx1c1wiPjwvc3Bhbj4gQWRkIE5ldzwvYnV0dG9uPjwvZm9vdGVyPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtNFwiPlxyXG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwic2VjdGlvblwiIHN0eWxlPVwiaGVpZ2h0OiAxMDAlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBhcmlhLWhpZGRlbj1cInRydWVcIiBzdHlsZT1cIm1hcmdpbjogMTZweCAxNnB4IDAgMDtcIiBvbkNsaWNrPXtvbkNhbmNlbH0+w5c8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8aGVhZGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4XCI+PHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPiA8c3Bhbj5Vc2VyPC9zcGFuPjwvaGVhZGVyPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMHB4IDE2cHggMTAwcHggMTZweDsgaGVpZ2h0OiAxMDAlO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aGVhZGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hZGp1c3RcIj48L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj57cXVlcnkoXCJjdXJyZW50VXNlci5OYW1lXCIpfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJVc2VyTmFtZVwiPlVzZXIgbmFtZTwvbGFiZWw+PGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiVXNlciBuYW1lXCIgbmFtZT1cImN1cnJlbnRVc2VyLk5hbWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJFbWFpbFwiPkVtYWlsPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+PGlucHV0IGlkPVwiRW1haWxcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiRW1haWxcIiBuYW1lPVwiY3VycmVudFVzZXIuRW1haWxcIiAvPjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj48ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ9e3F1ZXJ5KFwiY3VycmVudFVzZXIuRW1haWxDb25maXJtZWRcIil9IC8+IDxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiRW1haWxDb25maXJtZWRcIj5FbWFpbCBjb25maXJtZWQ8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17cXVlcnkoXCJzYXZlVXNlciAoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtc2F2ZVwiPjwvc3Bhbj4gU2F2ZTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+LCBzdG9yZSk7XHJcbn1cclxuXHJcbnZhciBNZW51SXRlbSA9ICh7bmFtZX0pID0+IDxsaT48YSBocmVmPVwiaHR0cDovL3d3dy5nb29nbGUubmxcIj5tZW51IGl0ZW0ge25hbWV9PC9hPjwvbGk+O1xyXG5cclxuaW50ZXJmYWNlIElBcHBBY3Rpb24ge1xyXG4gICAgcGF0aDogc3RyaW5nLFxyXG4gICAgZGlzcGxheT86IHN0cmluZztcclxufVxyXG5cclxudmFyIGFjdGlvbnM6IElBcHBBY3Rpb25bXSA9IFtcclxuICAgIHsgcGF0aDogXCJ0aW1lc2hlZXRcIiwgZGlzcGxheTogXCJUaW1lc2hlZXRcIiB9LFxyXG4gICAgeyBwYXRoOiBcImludm9pY2VzXCIsIGRpc3BsYXk6IFwiSW52b2ljZXNcIiB9LFxyXG4gICAgeyBwYXRoOiBcInRvZG9zXCIsIGRpc3BsYXk6IFwiVG9kb3NcIiB9LFxyXG4gICAgeyBwYXRoOiBcInVzZXJzXCIsIGRpc3BsYXk6IFwiVXNlcnNcIiB9XHJcbl07XHJcblxyXG52YXIgbWFpbk1lbnU6ICh1cmw6IFVybEhlbHBlcikgPT4gVGVtcGxhdGUuSU5vZGUgPSAodXJsOiBVcmxIZWxwZXIpID0+XHJcbiAgICA8dWwgY2xhc3NOYW1lPVwibWFpbi1tZW51LXVsXCI+XHJcbiAgICAgICAge2FjdGlvbnMubWFwKHggPT4gKFxyXG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibWFpbi1tZW51aXRlbVwiPlxyXG4gICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwibWFpbi1tZW51aXRlbS1saW5rXCIgaHJlZj1cIlwiIG9uQ2xpY2s9e3VybC5hY3Rpb24oeC5wYXRoKX0+e3guZGlzcGxheSB8fCB4LnBhdGh9PC9hPlxyXG4gICAgICAgICAgICA8L2xpPikpfVxyXG4gICAgPC91bD47XHJcblxyXG52YXIgcGFuZWwgPSBuID0+XHJcbiAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJtZGwtbGF5b3V0X190YWItcGFuZWxcIiBpZD17XCJzY3JvbGwtdGFiLVwiICsgbn0+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdlLWNvbnRlbnRcIj50YWIge259PC9kaXY+XHJcbiAgICA8L3NlY3Rpb24+OyJdfQ==