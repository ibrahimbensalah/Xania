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
    user: "Ibrahim",
    users: new xania_1.RemoteObject('/api/query/', "users"),
    currentUser: {},
    saveUser: function () {
        xania_1.Resource.create("/api/user", this.currentUser).then(function (response) {
            console.log("saved");
        });
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
    var onCancel = function () {
        store.get("currentUser").set({});
        store.refresh();
    };
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
                        xania_1.Xania.tag("button", { className: "btn btn-primary", "data-bind": "click: users.create" },
                            xania_1.Xania.tag("span", { className: "glyphicon glyphicon-plus" }),
                            " Add New"))))),
        xania_1.Xania.tag("div", { className: "col-4" },
            xania_1.Xania.tag("section", { className: "section", style: "height: 100%" },
                xania_1.Xania.tag("button", { type: "button", className: "close", "aria-hidden": "true", style: "margin: 16px 16px 0 0;", onClick: onCancel }, "\u00D7"),
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
function action() {
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQWtIO0FBQ2xILGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5QywyQ0FBMEM7QUFDMUMsK0JBQTZDO0FBQzdDLG9DQUF1QztBQUN2QywyQ0FBMkM7QUFFM0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQztJQUNyQixJQUFJLEVBQUUsU0FBUztJQUNmLEtBQUssRUFBRSxJQUFJLG9CQUFZLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQztJQUMvQyxXQUFXLEVBQUUsRUFBRTtJQUNmLFFBQVE7UUFDSixnQkFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFDLFFBQWE7WUFDOUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6QixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSixDQUFDLENBQUM7QUFFSDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsYUFBUSxPQUFHLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRkQsc0JBRUM7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsdUNBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUZELHNCQUVDO0FBRUQsY0FBcUIsRUFBcUI7UUFBbkIsa0JBQU0sRUFBRSxjQUFJLEVBQUUsWUFBRztJQUNwQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFO1NBQ2YsTUFBTSxDQUFDLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDMUMsQ0FBQztBQUhELG9CQUdDO0FBRUQ7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUNqQjtRQUNJOztZQUFlLFlBQUksQ0FBQyxNQUFNLENBQUMsQ0FBTztRQUNsQyxrQkFBQyxjQUFNLElBQUMsTUFBTSxFQUFFLFlBQUksQ0FBQyxhQUFhLENBQUM7WUFDL0I7Z0JBQU0sWUFBSSxDQUFDLE1BQU0sQ0FBQzs7Z0JBQUcsWUFBSSxDQUFDLE9BQU8sQ0FBQzs7Z0JBQUcsWUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFPLENBQ3BELENBQ1AsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN2QixDQUFDO0FBUkQsNEJBUUM7QUFFRDtJQUNJLElBQUksSUFBSSxHQUFHLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNsQyxJQUFJLFVBQVUsR0FBRztRQUNiLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNsQixDQUFDLENBQUM7SUFDRixNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDOztRQUFnQixZQUFJLENBQUMsWUFBWSxDQUFDO1FBQ3BELDhCQUFRLE9BQU8sRUFBRSxVQUFVLGtCQUFzQjtRQUNqRCxrQkFBQyxjQUFRLElBQUMsSUFBSSxFQUFFLFlBQUksQ0FBQyxZQUFZLENBQUMsR0FBSSxDQUNwQyxFQUFFLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLE1BQUEsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBVEQsOEJBU0M7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsYUFBTyxPQUFHLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBRkQsc0JBRUM7QUFFRDtJQUNJLElBQUksUUFBUSxHQUFHO1FBQ1gsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3BCLENBQUMsQ0FBQTtJQUNELElBQUksWUFBWSxHQUFHLFVBQUEsSUFBSTtRQUNuQixLQUFLLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEIsQ0FBQyxDQUFBO0lBRUQsTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FDakIsMkJBQUssS0FBSyxFQUFDLGNBQWMsRUFBQyxTQUFTLEVBQUMsS0FBSztRQUNyQywyQkFBSyxTQUFTLEVBQUUsQ0FBQyxZQUFJLENBQUMsd0JBQXdCLENBQUMsRUFBRSxZQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQztZQUNqRiwrQkFBUyxTQUFTLEVBQUMsU0FBUyxFQUFDLEtBQUssRUFBQyxjQUFjO2dCQUM3QywyQkFBSyxLQUFLLEVBQUMsNkNBQTZDO29CQUNwRCw4QkFBUSxLQUFLLEVBQUMsY0FBYzt3QkFBQyw0QkFBTSxTQUFTLEVBQUMsY0FBYyxHQUFROzt3QkFBQyx3Q0FBa0IsQ0FBUztvQkFDL0Ysa0JBQUMsY0FBUSxJQUFDLElBQUksRUFBRSxZQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsWUFBWTt3QkFDakUsa0JBQUMsaUJBQVUsSUFBQyxLQUFLLEVBQUMsTUFBTSxFQUFDLE9BQU8sRUFBQyxXQUFXLEdBQUc7d0JBQy9DLGtCQUFDLGlCQUFVLElBQUMsS0FBSyxFQUFDLGdCQUFnQixFQUFDLE9BQU8sRUFBQyxpQkFBaUIsR0FBRyxDQUN4RDtvQkFDWCw4QkFBUSxLQUFLLEVBQUMsMkNBQTJDO3dCQUFDLDhCQUFRLFNBQVMsRUFBQyxpQkFBaUIsZUFBVyxxQkFBcUI7NEJBQUMsNEJBQU0sU0FBUyxFQUFDLDBCQUEwQixHQUFRO3VDQUFpQixDQUFTLENBQ3hNLENBQ0EsQ0FDUjtRQUNOLDJCQUFLLFNBQVMsRUFBQyxPQUFPO1lBQ2xCLCtCQUFTLFNBQVMsRUFBQyxTQUFTLEVBQUMsS0FBSyxFQUFDLGNBQWM7Z0JBQzdDLDhCQUFRLElBQUksRUFBQyxRQUFRLEVBQUMsU0FBUyxFQUFDLE9BQU8saUJBQWEsTUFBTSxFQUFDLEtBQUssRUFBQyx3QkFBd0IsRUFBQyxPQUFPLEVBQUUsUUFBUSxhQUFZO2dCQUN2SCw4QkFBUSxLQUFLLEVBQUMsY0FBYztvQkFBQyw0QkFBTSxTQUFTLEVBQUMsY0FBYyxHQUFROztvQkFBQyxnQ0FBTyxZQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBUSxDQUFTO2dCQUVwSCwyQkFBSyxLQUFLLEVBQUMsNkNBQTZDO29CQUNwRCwyQkFBSyxTQUFTLEVBQUMsb0JBQW9CO3dCQUFDLDZCQUFPLFNBQVMsRUFBQyxlQUFlLEVBQUMsR0FBRyxFQUFDLFVBQVUsZ0JBQWtCO3dCQUFBOzRCQUNqRyw2QkFBTyxTQUFTLEVBQUMsY0FBYyxFQUFDLElBQUksRUFBQyxNQUFNLEVBQUMsV0FBVyxFQUFDLFdBQVcsRUFBQyxJQUFJLEVBQUMsa0JBQWtCLEdBQUcsQ0FDNUYsQ0FDQTtvQkFDTiwyQkFBSyxTQUFTLEVBQUMsb0JBQW9CO3dCQUFDLDZCQUFPLFNBQVMsRUFBQyxlQUFlLEVBQUMsR0FBRyxFQUFDLE9BQU8sWUFBYzt3QkFDMUY7NEJBQUssNkJBQU8sRUFBRSxFQUFDLE9BQU8sRUFBQyxTQUFTLEVBQUMsY0FBYyxFQUFDLElBQUksRUFBQyxNQUFNLEVBQUMsV0FBVyxFQUFDLE9BQU8sRUFBQyxJQUFJLEVBQUMsbUJBQW1CLEdBQUcsQ0FBTSxDQUMvRztvQkFDTiwyQkFBSyxTQUFTLEVBQUMsb0JBQW9CO3dCQUFDOzRCQUNoQyw2QkFBTyxJQUFJLEVBQUMsVUFBVSxFQUFDLE9BQU8sRUFBRSxZQUFJLENBQUMsNEJBQTRCLENBQUMsR0FBSTs7NEJBQUMsNkJBQU8sU0FBUyxFQUFDLGVBQWUsRUFBQyxHQUFHLEVBQUMsZ0JBQWdCLHNCQUF3QixDQUNsSixDQUFNO29CQUNaLDJCQUFLLFNBQVMsRUFBQyxvQkFBb0I7d0JBQy9CLDhCQUFRLFNBQVMsRUFBQyxpQkFBaUIsRUFBQyxPQUFPLEVBQUUsWUFBSSxDQUFDLGFBQWEsQ0FBQzs0QkFDNUQsNEJBQU0sU0FBUyxFQUFDLFlBQVksR0FBUTtvQ0FBYyxDQUNwRCxDQUNKLENBQ0EsQ0FDUixDQUNKLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDdkIsQ0FBQztBQWhERCxzQkFnREM7QUFFRCxJQUFJLFFBQVEsR0FBRyxVQUFDLEVBQU07UUFBTCxjQUFJO0lBQU0sT0FBQTtRQUFJLHlCQUFHLElBQUksRUFBQyxzQkFBc0I7O1lBQVksSUFBSSxDQUFLLENBQUs7QUFBNUQsQ0FBNEQsQ0FBQztBQU94RixJQUFJLE9BQU8sR0FBaUI7SUFDeEIsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUU7SUFDM0MsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUU7SUFDekMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7SUFDbkMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7SUFDbkMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7SUFDbkMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7Q0FDdEMsQ0FBQztBQUVGLElBQUksUUFBUSxHQUF1QyxVQUFDLEdBQWM7SUFDOUQsT0FBQSwwQkFBSSxTQUFTLEVBQUMsY0FBYyxJQUN2QixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FDZCwwQkFBSSxTQUFTLEVBQUMsZUFBZTtRQUN6Qix5QkFBRyxTQUFTLEVBQUMsb0JBQW9CLEVBQUMsSUFBSSxFQUFDLEVBQUUsRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFLLENBQy9GLENBQUMsRUFIUSxDQUdSLENBQUMsQ0FDVjtBQUxMLENBS0ssQ0FBQztBQUVWLElBQUksS0FBSyxHQUFHLFVBQUEsQ0FBQztJQUNULE9BQUEsK0JBQVMsU0FBUyxFQUFDLHVCQUF1QixFQUFDLEVBQUUsRUFBRSxhQUFhLEdBQUcsQ0FBQztRQUM1RCwyQkFBSyxTQUFTLEVBQUMsY0FBYzs7WUFBTSxDQUFDLENBQU8sQ0FDckM7QUFGVixDQUVVLENBQUM7QUFFZjtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsR0FBRyxDQUFDLFFBQVEsT0FBRyxFQUFFLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRkQsc0JBRUM7QUFFRDtBQUVBLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgUmVwZWF0LCBleHByLCBEb20sIFJlbW90ZU9iamVjdCwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlLCBSZXNvdXJjZSB9IGZyb20gXCIuLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBVcmxIZWxwZXIsIFZpZXdSZXN1bHQgfSBmcm9tIFwiLi4vc3JjL212Y1wiXHJcbmltcG9ydCAnLi9hZG1pbi5jc3MnXHJcbmltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4uL3NyYy9vYnNlcnZhYmxlc1wiO1xyXG5pbXBvcnQgeyBDbG9ja0FwcCB9IGZyb20gJy4uL3NhbXBsZS9jbG9jay9hcHAnXHJcbmltcG9ydCBUb2RvQXBwIGZyb20gXCIuLi9zYW1wbGUvdG9kb3MvYXBwXCI7XHJcbmltcG9ydCBEYXRhR3JpZCwgeyBUZXh0Q29sdW1uIH0gZnJvbSBcIi4vZ3JpZFwiXHJcbmltcG9ydCBMaWIgPSByZXF1aXJlKFwiLi4vZGlhZ3JhbS9saWJcIik7XHJcbmltcG9ydCBCYWxsc0FwcCBmcm9tICcuLi9zYW1wbGUvYmFsbHMvYXBwJztcclxuXHJcbnZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICB1c2VyOiBcIklicmFoaW1cIixcclxuICAgIHVzZXJzOiBuZXcgUmVtb3RlT2JqZWN0KCcvYXBpL3F1ZXJ5LycsIFwidXNlcnNcIiksXHJcbiAgICBjdXJyZW50VXNlcjoge30sXHJcbiAgICBzYXZlVXNlcigpIHtcclxuICAgICAgICBSZXNvdXJjZS5jcmVhdGUoXCIvYXBpL3VzZXJcIiwgdGhpcy5jdXJyZW50VXNlcikudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInNhdmVkXCIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiYWxscygpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8QmFsbHNBcHAgLz4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXgoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj5pbmRleDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVudSh7IGRyaXZlciwgaHRtbCwgdXJsIH0pIHtcclxuICAgIG1haW5NZW51KHVybCkuYmluZCgpXHJcbiAgICAgICAgLnVwZGF0ZShuZXcgUmUuU3RvcmUoe30pLCBkcml2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW52b2ljZXMoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGRpdj5pbnZvaWNlcyB7ZXhwcihcInVzZXJcIil9PC9kaXY+XHJcbiAgICAgICAgICAgIDxSZXBlYXQgc291cmNlPXtleHByKFwiYXdhaXQgdXNlcnNcIil9PlxyXG4gICAgICAgICAgICAgICAgPGRpdj57ZXhwcihcIm5hbWVcIil9IHtleHByKFwiZW1haWxcIil9IHtleHByKFwicm9sZXNcIil9PC9kaXY+XHJcbiAgICAgICAgICAgIDwvUmVwZWF0PlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZXNoZWV0KCkge1xyXG4gICAgdmFyIHRpbWUgPSBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpO1xyXG4gICAgdmFyIHRvZ2dsZVRpbWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGltZS50b2dnbGUoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj50aW1lc2hlZXQge2V4cHIoXCJhd2FpdCB0aW1lXCIpfVxyXG4gICAgICAgIDxidXR0b24gb25DbGljaz17dG9nZ2xlVGltZX0+dG9nZ2xlIHRpbWU8L2J1dHRvbj5cclxuICAgICAgICA8Q2xvY2tBcHAgdGltZT17ZXhwcihcImF3YWl0IHRpbWVcIil9IC8+XHJcbiAgICA8L2Rpdj4sIG5ldyBSZS5TdG9yZSh7IHRpbWUgfSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9kb3MoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPFRvZG9BcHAgLz4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlcnMoKSB7XHJcbiAgICB2YXIgb25DYW5jZWwgPSAoKSA9PiB7XHJcbiAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFVzZXJcIikuc2V0KHt9KTtcclxuICAgICAgICBzdG9yZS5yZWZyZXNoKCk7XHJcbiAgICB9XHJcbiAgICB2YXIgb25TZWxlY3RVc2VyID0gdXNlciA9PiB7XHJcbiAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFVzZXJcIikuc2V0KHVzZXIpO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogOTUlO1wiIGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17W2V4cHIoXCJjdXJyZW50VXNlciAtPiAnY29sLTgnXCIpLCBleHByKFwibm90IGN1cnJlbnRVc2VyIC0+ICdjb2wtMTInXCIpXX0+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMHB4IDE2cHggMTAwcHggMTZweDsgaGVpZ2h0OiAxMDAlO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aGVhZGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4XCI+PHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPiA8c3Bhbj5Vc2Vyczwvc3Bhbj48L2hlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPERhdGFHcmlkIGRhdGE9e2V4cHIoXCJhd2FpdCB1c2Vyc1wiKX0gb25TZWxlY3Rpb25DaGFuZ2VkPXtvblNlbGVjdFVzZXJ9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwibmFtZVwiIGRpc3BsYXk9XCJVc2VyIG5hbWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJlbWFpbENvbmZpcm1lZFwiIGRpc3BsYXk9XCJFbWFpbCBjb25maXJtZWRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4OyBtYXJnaW46IDAgMTZweDsgcGFkZGluZzogMDtcIj48YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIGRhdGEtYmluZD1cImNsaWNrOiB1c2Vycy5jcmVhdGVcIj48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj48L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTRcIj5cclxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInNlY3Rpb25cIiBzdHlsZT1cImhlaWdodDogMTAwJVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImNsb3NlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgc3R5bGU9XCJtYXJnaW46IDE2cHggMTZweCAwIDA7XCIgb25DbGljaz17b25DYW5jZWx9PsOXPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPGhlYWRlciBzdHlsZT1cImhlaWdodDogNTBweFwiPjxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFkanVzdFwiPjwvc3Bhbj4gPHNwYW4+e2V4cHIoXCJjdXJyZW50VXNlci5uYW1lXCIpfTwvc3Bhbj48L2hlYWRlcj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDBweCAxNnB4IDEwMHB4IDE2cHg7IGhlaWdodDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj48bGFiZWwgY2xhc3NOYW1lPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cIlVzZXJOYW1lXCI+VXNlciBuYW1lPC9sYWJlbD48ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJVc2VyIG5hbWVcIiBuYW1lPVwiY3VycmVudFVzZXIubmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj48bGFiZWwgY2xhc3NOYW1lPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cIkVtYWlsXCI+RW1haWw8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48aW5wdXQgaWQ9XCJFbWFpbFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJFbWFpbFwiIG5hbWU9XCJjdXJyZW50VXNlci5lbWFpbFwiIC8+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD17ZXhwcihcImN1cnJlbnRVc2VyLmVtYWlsQ29uZmlybWVkXCIpfSAvPiA8bGFiZWwgY2xhc3NOYW1lPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cIkVtYWlsQ29uZmlybWVkXCI+RW1haWwgY29uZmlybWVkPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJzYXZlVXNlciAoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtc2F2ZVwiPjwvc3Bhbj4gU2F2ZTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+LCBzdG9yZSk7XHJcbn1cclxuXHJcbnZhciBNZW51SXRlbSA9ICh7bmFtZX0pID0+IDxsaT48YSBocmVmPVwiaHR0cDovL3d3dy5nb29nbGUubmxcIj5tZW51IGl0ZW0ge25hbWV9PC9hPjwvbGk+O1xyXG5cclxuaW50ZXJmYWNlIElBcHBBY3Rpb24ge1xyXG4gICAgcGF0aDogc3RyaW5nLFxyXG4gICAgZGlzcGxheT86IHN0cmluZztcclxufVxyXG5cclxudmFyIGFjdGlvbnM6IElBcHBBY3Rpb25bXSA9IFtcclxuICAgIHsgcGF0aDogXCJ0aW1lc2hlZXRcIiwgZGlzcGxheTogXCJUaW1lc2hlZXRcIiB9LFxyXG4gICAgeyBwYXRoOiBcImludm9pY2VzXCIsIGRpc3BsYXk6IFwiSW52b2ljZXNcIiB9LFxyXG4gICAgeyBwYXRoOiBcInRvZG9zXCIsIGRpc3BsYXk6IFwiVG9kb3NcIiB9LFxyXG4gICAgeyBwYXRoOiBcInVzZXJzXCIsIGRpc3BsYXk6IFwiVXNlcnNcIiB9LFxyXG4gICAgeyBwYXRoOiBcImdyYXBoXCIsIGRpc3BsYXk6IFwiR3JhcGhcIiB9LFxyXG4gICAgeyBwYXRoOiBcImJhbGxzXCIsIGRpc3BsYXk6IFwiQmFsbHNcIiB9XHJcbl07XHJcblxyXG52YXIgbWFpbk1lbnU6ICh1cmw6IFVybEhlbHBlcikgPT4gVGVtcGxhdGUuSU5vZGUgPSAodXJsOiBVcmxIZWxwZXIpID0+XHJcbiAgICA8dWwgY2xhc3NOYW1lPVwibWFpbi1tZW51LXVsXCI+XHJcbiAgICAgICAge2FjdGlvbnMubWFwKHggPT4gKFxyXG4gICAgICAgICAgICA8bGkgY2xhc3NOYW1lPVwibWFpbi1tZW51aXRlbVwiPlxyXG4gICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwibWFpbi1tZW51aXRlbS1saW5rXCIgaHJlZj1cIlwiIG9uQ2xpY2s9e3VybC5hY3Rpb24oeC5wYXRoKX0+e3guZGlzcGxheSB8fCB4LnBhdGh9PC9hPlxyXG4gICAgICAgICAgICA8L2xpPikpfVxyXG4gICAgPC91bD47XHJcblxyXG52YXIgcGFuZWwgPSBuID0+XHJcbiAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJtZGwtbGF5b3V0X190YWItcGFuZWxcIiBpZD17XCJzY3JvbGwtdGFiLVwiICsgbn0+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdlLWNvbnRlbnRcIj50YWIge259PC9kaXY+XHJcbiAgICA8L3NlY3Rpb24+O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdyYXBoKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxMaWIuR3JhcGhBcHAgLz4sIG5ldyBSZS5TdG9yZSh7fSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhY3Rpb24oKSB7XHJcblxyXG59Il19