"use strict";
var xania_1 = require("../src/xania");
var mvc_1 = require("../src/mvc");
require("./admin.css");
var observables_1 = require("../src/observables");
var app_1 = require("../sample/clock/app");
var todo_1 = require("../sample/layout/todo");
var grid_1 = require("./grid");
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
    var setProps1 = function (obj, symbols) {
        var i = symbols.length;
        while (i--) {
            var sym = symbols[i];
            obj[sym] = i;
        }
    };
    var setProps2 = function (obj, symbols) {
        var key = Symbol();
        var values = [];
        obj[key] = values;
        var i = symbols.length;
        while (i--) {
            var sym = symbols[i];
            values.push({ sym: i });
        }
    };
    function test() {
        var props = [];
        var i = 1000;
        while (i--) {
            props.push("prop" + i);
        }
        var iterations = 100000;
        for (var e = 0; e < iterations; e++) {
            var o = {};
            setProps1(o, props);
        }
        for (var e = 0; e < iterations; e++) {
            var o = {};
            setProps2(o, props);
        }
    }
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", null,
        "invoices ",
        xania_1.expr("user"),
        xania_1.Xania.tag("button", { onClick: test }, "test"),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQXdHO0FBQ3hHLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5Qyw4Q0FBZ0Q7QUFDaEQsK0JBQTZCO0FBRTdCLElBQUksS0FBSyxHQUFHLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUM7SUFDckIsSUFBSSxFQUFFLFNBQVM7SUFDZixLQUFLLEVBQUUsSUFBSSxvQkFBWSxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUM7SUFDL0MsV0FBVyxFQUFFLEVBQUU7SUFDZixRQUFRO1FBQ0osT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FDSixDQUFDLENBQUM7QUFHSDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsdUNBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUZELHNCQUVDO0FBRUQsY0FBcUIsRUFBcUI7UUFBbkIsa0JBQU0sRUFBRSxjQUFJLEVBQUUsWUFBRztJQUNwQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFO1NBQ2YsTUFBTSxDQUFDLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDMUMsQ0FBQztBQUhELG9CQUdDO0FBRUQ7SUFDSSxJQUFJLFNBQVMsR0FBRyxVQUFDLEdBQU8sRUFBRSxPQUFjO1FBQ3BDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFDdkIsT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ1QsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakIsQ0FBQztJ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QUM7QUFPeEYsSUFBSSxPQUFPLEdBQWlCO0lBQ3hCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFO0lBQzNDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFO0lBQ3pDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0lBQ25DLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0NBQ3RDLENBQUM7QUFFRixJQUFJLFFBQVEsR0FBdUMsVUFBQyxHQUFjO0lBQzlELE9BQUEsMEJBQUksU0FBUyxFQUFDLGNBQWMsSUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQ2QsMEJBQUksU0FBUyxFQUFDLGVBQWU7UUFDekIseUJBQUcsU0FBUyxFQUFDLG9CQUFvQixFQUFDLElBQUksRUFBQyxFQUFFLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFHLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBSyxDQUMvRixDQUFDLEVBSFEsQ0FHUixDQUFDLENBQ1Y7QUFMTCxDQUtLLENBQUM7QUFFVixJQUFJLEtBQUssR0FBRyxVQUFBLENBQUM7SUFDVCxPQUFBLCtCQUFTLFNBQVMsRUFBQyx1QkFBdUIsRUFBQyxFQUFFLEVBQUUsYUFBYSxHQUFHLENBQUM7UUFDNUQsMkJBQUssU0FBUyxFQUFDLGNBQWM7O1lBQU0sQ0FBQyxDQUFPLENBQ3JDO0FBRlYsQ0FFVSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgWGFuaWEgYXMgeGFuaWEsIFJlcGVhdCwgZXhwciwgRG9tLCBSZW1vdGVPYmplY3QsIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBVcmxIZWxwZXIsIFZpZXdSZXN1bHQgfSBmcm9tIFwiLi4vc3JjL212Y1wiXHJcbmltcG9ydCAnLi9hZG1pbi5jc3MnXHJcbmltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4uL3NyYy9vYnNlcnZhYmxlc1wiO1xyXG5pbXBvcnQgeyBDbG9ja0FwcCB9IGZyb20gJy4uL3NhbXBsZS9jbG9jay9hcHAnXHJcbmltcG9ydCB7IFRvZG9BcHAgfSBmcm9tIFwiLi4vc2FtcGxlL2xheW91dC90b2RvXCI7XHJcbmltcG9ydCBEYXRhR3JpZCBmcm9tIFwiLi9ncmlkXCJcclxuXHJcbnZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICB1c2VyOiBcIklicmFoaW1cIixcclxuICAgIHVzZXJzOiBuZXcgUmVtb3RlT2JqZWN0KCcvYXBpL3F1ZXJ5LycsIFwidXNlcnNcIiksXHJcbiAgICBjdXJyZW50VXNlcjoge30sXHJcbiAgICBzYXZlVXNlcigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcInNhdmUgdXNlclwiLCB0aGlzLmN1cnJlbnRVc2VyKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+aW5kZXg8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lbnUoeyBkcml2ZXIsIGh0bWwsIHVybCB9KSB7XHJcbiAgICBtYWluTWVudSh1cmwpLmJpbmQoKVxyXG4gICAgICAgIC51cGRhdGUobmV3IFJlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGludm9pY2VzKCkge1xyXG4gICAgdmFyIHNldFByb3BzMSA9IChvYmo6IHt9LCBzeW1ib2xzOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgIHZhciBpID0gc3ltYm9scy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICB2YXIgc3ltID0gc3ltYm9sc1tpXTtcclxuICAgICAgICAgICAgb2JqW3N5bV0gPSBpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB2YXIgc2V0UHJvcHMyID0gKG9iajoge30sIHN5bWJvbHM6IGFueVtdKSA9PiB7XHJcbiAgICAgICAgdmFyIGtleSA9IFN5bWJvbCgpO1xyXG4gICAgICAgIHZhciB2YWx1ZXMgPSBbXTtcclxuICAgICAgICBvYmpba2V5XSA9IHZhbHVlcztcclxuICAgICAgICB2YXIgaSA9IHN5bWJvbHMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgdmFyIHN5bSA9IHN5bWJvbHNbaV07XHJcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKHtzeW06IGl9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIHRlc3QoKSB7XHJcbiAgICAgICAgdmFyIHByb3BzID0gW107XHJcbiAgICAgICAgdmFyIGkgPSAxMDAwO1xyXG4gICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgcHJvcHMucHVzaChcInByb3BcIisgaSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgaXRlcmF0aW9ucyA9IDEwMDAwMDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZSA9IDA7IGUgPCBpdGVyYXRpb25zOyBlKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbyA9IHt9O1xyXG4gICAgICAgICAgICBzZXRQcm9wczEobywgcHJvcHMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgZSA9IDA7IGUgPCBpdGVyYXRpb25zOyBlKyspIHtcclxuICAgICAgICAgICAgY29uc3QgbyA9IHt9O1xyXG4gICAgICAgICAgICBzZXRQcm9wczIobywgcHJvcHMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgaW52b2ljZXMge2V4cHIoXCJ1c2VyXCIpfVxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3Rlc3R9PnRlc3Q8L2J1dHRvbj5cclxuICAgICAgICAgICAgPFJlcGVhdCBzb3VyY2U9e2V4cHIoXCJhd2FpdCB1c2Vyc1wiKX0+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PntleHByKFwibmFtZVwiKX0ge2V4cHIoXCJlbWFpbFwiKX0ge2V4cHIoXCJyb2xlc1wiKX08L2Rpdj5cclxuICAgICAgICAgICAgPC9SZXBlYXQ+XHJcbiAgICAgICAgPC9kaXY+LCBzdG9yZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0aW1lc2hlZXQoKSB7XHJcbiAgICB2YXIgdGltZSA9IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCk7XHJcbiAgICB2YXIgdG9nZ2xlVGltZSA9ICgpID0+IHtcclxuICAgICAgICB0aW1lLnRvZ2dsZSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8ZGl2PnRpbWVzaGVldCB7ZXhwcihcImF3YWl0IHRpbWVcIil9XHJcbiAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt0b2dnbGVUaW1lfT50b2dnbGUgdGltZTwvYnV0dG9uPlxyXG4gICAgICAgIDxDbG9ja0FwcCB0aW1lPXtleHByKFwiYXdhaXQgdGltZVwiKX0gLz5cclxuICAgIDwvZGl2PiwgbmV3IFJlLlN0b3JlKHsgdGltZSB9KSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0b2RvcygpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8VG9kb0FwcCAvPik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1c2VycygpIHtcclxuICAgIHZhciBvbkNhbmNlbCA9ICgpID0+IHtcclxuICAgICAgICBzdG9yZS5nZXQoXCJjdXJyZW50VXNlclwiKS5zZXQoe30pO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdChcclxuICAgICAgICA8ZGl2IHN0eWxlPVwiaGVpZ2h0OiA5NSU7XCIgY2xhc3NOYW1lPVwicm93XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbZXhwcihcImN1cnJlbnRVc2VyIC0+ICdjb2wtOCdcIiksIGV4cHIoXCJub3QgY3VycmVudFVzZXIgLT4gJ2NvbC0xMidcIildfT5cclxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInNlY3Rpb25cIiBzdHlsZT1cImhlaWdodDogMTAwJVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAwcHggMTZweCAxMDBweCAxNnB4OyBoZWlnaHQ6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj48c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hZGp1c3RcIj48L3NwYW4+IDxzcGFuPlVzZXJzPC9zcGFuPjwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgYWN0aXZlUmVjb3JkPXtleHByKFwiY3VycmVudFVzZXJcIil9IGRhdGE9e2V4cHIoXCJhd2FpdCB1c2Vyc1wiKX0gLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGZvb3RlciBzdHlsZT1cImhlaWdodDogNTBweDsgbWFyZ2luOiAwIDE2cHg7IHBhZGRpbmc6IDA7XCI+PGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBkYXRhLWJpbmQ9XCJjbGljazogdXNlcnMuY3JlYXRlXCI+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzXCI+PC9zcGFuPiBBZGQgTmV3PC9idXR0b24+PC9mb290ZXI+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC00XCI+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHN0eWxlPVwibWFyZ2luOiAxNnB4IDE2cHggMCAwO1wiIG9uQ2xpY2s9e29uQ2FuY2VsfT7DlzwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj48c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hZGp1c3RcIj48L3NwYW4+IDxzcGFuPlVzZXI8L3NwYW4+PC9oZWFkZXI+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAwcHggMTZweCAxMDBweCAxNnB4OyBoZWlnaHQ6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFkanVzdFwiPjwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntleHByKFwiY3VycmVudFVzZXIuTmFtZVwiKX08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiVXNlck5hbWVcIj5Vc2VyIG5hbWU8L2xhYmVsPjxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIlVzZXIgbmFtZVwiIG5hbWU9XCJjdXJyZW50VXNlci5OYW1lXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiRW1haWxcIj5FbWFpbDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PjxpbnB1dCBpZD1cIkVtYWlsXCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIkVtYWlsXCIgbmFtZT1cImN1cnJlbnRVc2VyLkVtYWlsXCIgLz48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTEyIGNvbC1tZC0zXCI+PGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtleHByKFwiY3VycmVudFVzZXIuRW1haWxDb25maXJtZWRcIil9IC8+IDxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiRW1haWxDb25maXJtZWRcIj5FbWFpbCBjb25maXJtZWQ8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcInNhdmVVc2VyICgpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1zYXZlXCI+PC9zcGFuPiBTYXZlPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxudmFyIE1lbnVJdGVtID0gKHtuYW1lfSkgPT4gPGxpPjxhIGhyZWY9XCJodHRwOi8vd3d3Lmdvb2dsZS5ubFwiPm1lbnUgaXRlbSB7bmFtZX08L2E+PC9saT47XHJcblxyXG5pbnRlcmZhY2UgSUFwcEFjdGlvbiB7XHJcbiAgICBwYXRoOiBzdHJpbmcsXHJcbiAgICBkaXNwbGF5Pzogc3RyaW5nO1xyXG59XHJcblxyXG52YXIgYWN0aW9uczogSUFwcEFjdGlvbltdID0gW1xyXG4gICAgeyBwYXRoOiBcInRpbWVzaGVldFwiLCBkaXNwbGF5OiBcIlRpbWVzaGVldFwiIH0sXHJcbiAgICB7IHBhdGg6IFwiaW52b2ljZXNcIiwgZGlzcGxheTogXCJJbnZvaWNlc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidG9kb3NcIiwgZGlzcGxheTogXCJUb2Rvc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidXNlcnNcIiwgZGlzcGxheTogXCJVc2Vyc1wiIH1cclxuXTtcclxuXHJcbnZhciBtYWluTWVudTogKHVybDogVXJsSGVscGVyKSA9PiBUZW1wbGF0ZS5JTm9kZSA9ICh1cmw6IFVybEhlbHBlcikgPT5cclxuICAgIDx1bCBjbGFzc05hbWU9XCJtYWluLW1lbnUtdWxcIj5cclxuICAgICAgICB7YWN0aW9ucy5tYXAoeCA9PiAoXHJcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtXCI+XHJcbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtLWxpbmtcIiBocmVmPVwiXCIgb25DbGljaz17dXJsLmFjdGlvbih4LnBhdGgpfT57eC5kaXNwbGF5IHx8IHgucGF0aH08L2E+XHJcbiAgICAgICAgICAgIDwvbGk+KSl9XHJcbiAgICA8L3VsPjtcclxuXHJcbnZhciBwYW5lbCA9IG4gPT5cclxuICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm1kbC1sYXlvdXRfX3RhYi1wYW5lbFwiIGlkPXtcInNjcm9sbC10YWItXCIgKyBufT5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2UtY29udGVudFwiPnRhYiB7bn08L2Rpdj5cclxuICAgIDwvc2VjdGlvbj47Il19