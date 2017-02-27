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
    users: new RemoteObject('/api/query/', "users"),
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
        xania_1.query("user"),
        xania_1.Xania.tag("button", { onClick: test }, "test"),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQWtHO0FBQ2xHLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5Qyw4Q0FBZ0Q7QUFDaEQsK0JBQTZCO0FBSTdCO0lBR0ksc0JBQW9CLEdBQVcsRUFBVSxJQUFJO1FBQXpCLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFBVSxTQUFJLEdBQUosSUFBSSxDQUFBO1FBQ3pDLElBQUksTUFBTSxHQUFHO1lBQ1QsTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLGtCQUFrQjthQUNyQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUM7U0FDeEMsQ0FBQztRQUVGLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxRQUFhO1lBQ2pELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsZ0NBQVMsR0FBVCxVQUFVLFFBQW9DO1FBQzFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBUztZQUN4QixRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0FBQyxBQXRCRCxJQXNCQztBQUVELElBQUksS0FBSyxHQUFHLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUM7SUFDckIsSUFBSSxFQUFFLFNBQVM7SUFDZixLQUFLLEVBQUUsSUFBSSxZQUFZLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQztJQUMvQyxXQUFXLEVBQUUsRUFBRTtJ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QUFjLElBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUNkLDBCQUFJLFNBQVMsRUFBQyxlQUFlO1FBQ3pCLHlCQUFHLFNBQVMsRUFBQyxvQkFBb0IsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUssQ0FDL0YsQ0FBQyxFQUhRLENBR1IsQ0FBQyxDQUNWO0FBTEwsQ0FLSyxDQUFDO0FBRVYsSUFBSSxLQUFLLEdBQUcsVUFBQSxDQUFDO0lBQ1QsT0FBQSwrQkFBUyxTQUFTLEVBQUMsdUJBQXVCLEVBQUMsRUFBRSxFQUFFLGFBQWEsR0FBRyxDQUFDO1FBQzVELDJCQUFLLFNBQVMsRUFBQyxjQUFjOztZQUFNLENBQUMsQ0FBTyxDQUNyQztBQUZWLENBRVUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFhhbmlhIGFzIHhhbmlhLCBGb3JFYWNoLCBxdWVyeSwgVmlldywgRG9tLCBSZWFjdGl2ZSBhcyBSZSwgVGVtcGxhdGUgfSBmcm9tIFwiLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgVXJsSGVscGVyLCBWaWV3UmVzdWx0IH0gZnJvbSBcIi4uL3NyYy9tdmNcIlxyXG5pbXBvcnQgJy4vYWRtaW4uY3NzJ1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi9zcmMvb2JzZXJ2YWJsZXNcIjtcclxuaW1wb3J0IHsgQ2xvY2tBcHAgfSBmcm9tICcuLi9zYW1wbGUvY2xvY2svYXBwJ1xyXG5pbXBvcnQgeyBUb2RvQXBwIH0gZnJvbSBcIi4uL3NhbXBsZS9sYXlvdXQvdG9kb1wiO1xyXG5pbXBvcnQgRGF0YUdyaWQgZnJvbSBcIi4vZ3JpZFwiXHJcblxyXG5kZWNsYXJlIGZ1bmN0aW9uIGZldGNoPFQ+KHVybDogc3RyaW5nLCBjb25maWc/KTogUHJvbWlzZTxUPjtcclxuXHJcbmNsYXNzIFJlbW90ZU9iamVjdCB7XHJcbiAgICBwcm9taXNlOiBQcm9taXNlPE9iamVjdD47XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB1cmw6IHN0cmluZywgcHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHF1ZXJ5KGV4cHIpLmFzdClcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnByb21pc2UgPSBmZXRjaCh1cmwsIGNvbmZpZykudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN1YnNjcmliZShvYnNlcnZlcjogT2JzZXJ2YWJsZXMuSU9ic2VydmVyPGFueT4pIHtcclxuICAgICAgICB0aGlzLnByb21pc2UudGhlbigoZGF0YTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIG9ic2VydmVyLm9uTmV4dChkYXRhKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxudmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHtcclxuICAgIHVzZXI6IFwiSWJyYWhpbVwiLFxyXG4gICAgdXNlcnM6IG5ldyBSZW1vdGVPYmplY3QoJy9hcGkvcXVlcnkvJywgXCJ1c2Vyc1wiKSxcclxuICAgIGN1cnJlbnRVc2VyOiB7fSxcclxuICAgIHNhdmVVc2VyKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKFwic2F2ZSB1c2VyXCIsIHRoaXMuY3VycmVudFVzZXIpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5kZXgoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj5pbmRleDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVudSh7IGRyaXZlciwgaHRtbCwgdXJsIH0pIHtcclxuICAgIG1haW5NZW51KHVybCkuYmluZDxSZS5CaW5kaW5nPihEb20uRG9tVmlzaXRvcilcclxuICAgICAgICAudXBkYXRlKG5ldyBSZS5TdG9yZSh7fSksIGRyaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbnZvaWNlcygpIHtcclxuICAgIHZhciBzZXRQcm9wczEgPSAob2JqOiB7fSwgc3ltYm9sczogYW55W10pID0+IHtcclxuICAgICAgICB2YXIgaSA9IHN5bWJvbHMubGVuZ3RoO1xyXG4gICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgdmFyIHN5bSA9IHN5bWJvbHNbaV07XHJcbiAgICAgICAgICAgIG9ialtzeW1dID0gaTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdmFyIHNldFByb3BzMiA9IChvYmo6IHt9LCBzeW1ib2xzOiBhbnlbXSkgPT4ge1xyXG4gICAgICAgIHZhciBrZXkgPSBTeW1ib2woKTtcclxuICAgICAgICB2YXIgdmFsdWVzID0gW107XHJcbiAgICAgICAgb2JqW2tleV0gPSB2YWx1ZXM7XHJcbiAgICAgICAgdmFyIGkgPSBzeW1ib2xzLmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBzeW0gPSBzeW1ib2xzW2ldO1xyXG4gICAgICAgICAgICB2YWx1ZXMucHVzaCh7c3ltOiBpfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiB0ZXN0KCkge1xyXG4gICAgICAgIHZhciBwcm9wcyA9IFtdO1xyXG4gICAgICAgIHZhciBpID0gMTAwMDtcclxuICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgIHByb3BzLnB1c2goXCJwcm9wXCIrIGkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAxMDAwMDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGUgPSAwOyBlIDwgaXRlcmF0aW9uczsgZSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG8gPSB7fTtcclxuICAgICAgICAgICAgc2V0UHJvcHMxKG8sIHByb3BzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGUgPSAwOyBlIDwgaXRlcmF0aW9uczsgZSsrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG8gPSB7fTtcclxuICAgICAgICAgICAgc2V0UHJvcHMyKG8sIHByb3BzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIGludm9pY2VzIHtxdWVyeShcInVzZXJcIil9XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dGVzdH0+dGVzdDwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtxdWVyeShcImZvciB1c2VyIGluIGF3YWl0IHVzZXJzXCIpfT5cclxuICAgICAgICAgICAgICAgIDxkaXY+e3F1ZXJ5KFwidXNlci5uYW1lXCIpfSB7cXVlcnkoXCJ1c2VyLmVtYWlsXCIpfSB7cXVlcnkoXCJ1c2VyLnJvbGVzXCIpfTwvZGl2PlxyXG4gICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgPC9kaXY+LCBzdG9yZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0aW1lc2hlZXQoKSB7XHJcbiAgICB2YXIgdGltZSA9IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCk7XHJcbiAgICB2YXIgdG9nZ2xlVGltZSA9ICgpID0+IHtcclxuICAgICAgICB0aW1lLnRvZ2dsZSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8ZGl2PnRpbWVzaGVldCB7cXVlcnkoXCJhd2FpdCB0aW1lXCIpfVxyXG4gICAgICAgIDxidXR0b24gb25DbGljaz17dG9nZ2xlVGltZX0+dG9nZ2xlIHRpbWU8L2J1dHRvbj5cclxuICAgICAgICA8Q2xvY2tBcHAgdGltZT17cXVlcnkoXCJhd2FpdCB0aW1lXCIpfSAvPlxyXG4gICAgPC9kaXY+LCBuZXcgUmUuU3RvcmUoeyB0aW1lIH0pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvZG9zKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxUb2RvQXBwIC8+KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVzZXJzKCkge1xyXG4gICAgdmFyIG9uQ2FuY2VsID0gKCkgPT4ge1xyXG4gICAgICAgIHN0b3JlLmdldChcImN1cnJlbnRVc2VyXCIpLnNldCh7fSk7XHJcbiAgICAgICAgc3RvcmUucmVmcmVzaCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJoZWlnaHQ6IDk1JTtcIiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e1txdWVyeShcImN1cnJlbnRVc2VyIC0+ICdjb2wtOCdcIiksIHF1ZXJ5KFwibm90IGN1cnJlbnRVc2VyIC0+ICdjb2wtMTInXCIpXX0+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMHB4IDE2cHggMTAwcHggMTZweDsgaGVpZ2h0OiAxMDAlO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aGVhZGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4XCI+PHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtYWRqdXN0XCI+PC9zcGFuPiA8c3Bhbj5Vc2Vyczwvc3Bhbj48L2hlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPERhdGFHcmlkIGFjdGl2ZVJlY29yZD17cXVlcnkoXCJjdXJyZW50VXNlclwiKX0gZGF0YT17cXVlcnkoXCJhd2FpdCB1c2Vyc1wiKX0gLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGZvb3RlciBzdHlsZT1cImhlaWdodDogNTBweDsgbWFyZ2luOiAwIDE2cHg7IHBhZGRpbmc6IDA7XCI+PGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBkYXRhLWJpbmQ9XCJjbGljazogdXNlcnMuY3JlYXRlXCI+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1wbHVzXCI+PC9zcGFuPiBBZGQgTmV3PC9idXR0b24+PC9mb290ZXI+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC00XCI+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzc05hbWU9XCJjbG9zZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiIHN0eWxlPVwibWFyZ2luOiAxNnB4IDE2cHggMCAwO1wiIG9uQ2xpY2s9e29uQ2FuY2VsfT7DlzwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj48c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hZGp1c3RcIj48L3NwYW4+IDxzcGFuPlVzZXI8L3NwYW4+PC9oZWFkZXI+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAwcHggMTZweCAxMDBweCAxNnB4OyBoZWlnaHQ6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFkanVzdFwiPjwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPntxdWVyeShcImN1cnJlbnRVc2VyLk5hbWVcIil9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2hlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj48bGFiZWwgY2xhc3NOYW1lPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cIlVzZXJOYW1lXCI+VXNlciBuYW1lPC9sYWJlbD48ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJVc2VyIG5hbWVcIiBuYW1lPVwiY3VycmVudFVzZXIuTmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj48bGFiZWwgY2xhc3NOYW1lPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cIkVtYWlsXCI+RW1haWw8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48aW5wdXQgaWQ9XCJFbWFpbFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJFbWFpbFwiIG5hbWU9XCJjdXJyZW50VXNlci5FbWFpbFwiIC8+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD17cXVlcnkoXCJjdXJyZW50VXNlci5FbWFpbENvbmZpcm1lZFwiKX0gLz4gPGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJFbWFpbENvbmZpcm1lZFwiPkVtYWlsIGNvbmZpcm1lZDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBvbkNsaWNrPXtxdWVyeShcInNhdmVVc2VyICgpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1zYXZlXCI+PC9zcGFuPiBTYXZlPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxudmFyIE1lbnVJdGVtID0gKHtuYW1lfSkgPT4gPGxpPjxhIGhyZWY9XCJodHRwOi8vd3d3Lmdvb2dsZS5ubFwiPm1lbnUgaXRlbSB7bmFtZX08L2E+PC9saT47XHJcblxyXG5pbnRlcmZhY2UgSUFwcEFjdGlvbiB7XHJcbiAgICBwYXRoOiBzdHJpbmcsXHJcbiAgICBkaXNwbGF5Pzogc3RyaW5nO1xyXG59XHJcblxyXG52YXIgYWN0aW9uczogSUFwcEFjdGlvbltdID0gW1xyXG4gICAgeyBwYXRoOiBcInRpbWVzaGVldFwiLCBkaXNwbGF5OiBcIlRpbWVzaGVldFwiIH0sXHJcbiAgICB7IHBhdGg6IFwiaW52b2ljZXNcIiwgZGlzcGxheTogXCJJbnZvaWNlc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidG9kb3NcIiwgZGlzcGxheTogXCJUb2Rvc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidXNlcnNcIiwgZGlzcGxheTogXCJVc2Vyc1wiIH1cclxuXTtcclxuXHJcbnZhciBtYWluTWVudTogKHVybDogVXJsSGVscGVyKSA9PiBUZW1wbGF0ZS5JTm9kZSA9ICh1cmw6IFVybEhlbHBlcikgPT5cclxuICAgIDx1bCBjbGFzc05hbWU9XCJtYWluLW1lbnUtdWxcIj5cclxuICAgICAgICB7YWN0aW9ucy5tYXAoeCA9PiAoXHJcbiAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtXCI+XHJcbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtLWxpbmtcIiBocmVmPVwiXCIgb25DbGljaz17dXJsLmFjdGlvbih4LnBhdGgpfT57eC5kaXNwbGF5IHx8IHgucGF0aH08L2E+XHJcbiAgICAgICAgICAgIDwvbGk+KSl9XHJcbiAgICA8L3VsPjtcclxuXHJcbnZhciBwYW5lbCA9IG4gPT5cclxuICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm1kbC1sYXlvdXRfX3RhYi1wYW5lbFwiIGlkPXtcInNjcm9sbC10YWItXCIgKyBufT5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2UtY29udGVudFwiPnRhYiB7bn08L2Rpdj5cclxuICAgIDwvc2VjdGlvbj47Il19