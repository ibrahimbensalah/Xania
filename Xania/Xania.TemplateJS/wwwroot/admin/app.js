"use strict";
var xania_1 = require("../src/xania");
var mvc_1 = require("../src/mvc");
require("./admin.css");
var observables_1 = require("../src/observables");
var app_1 = require("../sample/clock/app");
var app_2 = require("../sample/todos/app");
var Lib = require("../diagram/lib");
var app_3 = require("../sample/balls/app");
function menu(_a) {
    var driver = _a.driver, html = _a.html, url = _a.url;
    mainMenu(url).bind()
        .update(new xania_1.Reactive.Store({}), driver);
}
exports.menu = menu;
var actions = [
    { path: "timesheet", display: "Timesheet" },
    { path: "views/invoices", display: "Invoices" },
    { path: "todos", display: "Todos" },
    { path: "views/companies", display: "Companies" },
    { path: "views/users", display: "Users" },
    { path: "graph", display: "Graph" },
    { path: "balls", display: "Balls" }
];
var mainMenu = function (url) {
    return xania_1.Xania.tag("ul", { className: "main-menu-ul" }, actions.map(function (x) { return (xania_1.Xania.tag("li", { className: "main-menuitem" },
        xania_1.Xania.tag("a", { className: "main-menuitem-link", href: "", onClick: url.action(x.path) }, x.display || x.path))); }));
};
function index() {
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", null, "index"));
}
exports.index = index;
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
function graph() {
    return new mvc_1.ViewResult(xania_1.Xania.tag(Lib.GraphApp, null), new xania_1.Reactive.Store({}));
}
exports.graph = graph;
function balls() {
    return new mvc_1.ViewResult(xania_1.Xania.tag(app_3.default, null));
}
exports.balls = balls;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQXVJO0FBRXZJLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5QywyQ0FBMEM7QUFFMUMsb0NBQXVDO0FBQ3ZDLDJDQUEyQztBQUczQyxjQUFxQixFQUFxQjtRQUFuQixrQkFBTSxFQUFFLGNBQUksRUFBRSxZQUFHO0lBQ3BDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUU7U0FDZixNQUFNLENBQUMsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBSEQsb0JBR0M7QUFPRCxJQUFJLE9BQU8sR0FBaUI7SUFDeEIsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUU7SUFDM0MsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRTtJQUMvQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtJQUNuQyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFO0lBQ2pELEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0lBQ3pDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0lBQ25DLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0NBQ3RDLENBQUM7QUFFRixJQUFJLFFBQVEsR0FBdUMsVUFBQyxHQUFjO0lBQzlELE9BQUEsMEJBQUksU0FBUyxFQUFDLGNBQWMsSUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQ2QsMEJBQUksU0FBUyxFQUFDLGVBQWU7UUFDekIseUJBQUcsU0FBUyxFQUFDLG9CQUFvQixFQUFDLElBQUksRUFBQyxFQUFFLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFHLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBSyxDQUMvRixDQUFDLEVBSFEsQ0FHUixDQUFDLENBQ1Y7QUFMTCxDQUtLLENBQUM7QUFFVjtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsdUNBQWdCLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRkQsc0JBRUM7QUFFRDtJQUNJLElBQUksSUFBSSxHQUFHLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNsQyxJQUFJLFVBQVUsR0FBRztRQUNiLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNsQixDQUFDLENBQUM7SUFDRixNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDOztRQUFnQixZQUFJLENBQUMsWUFBWSxDQUFDO1FBQ3BELDhCQUFRLE9BQU8sRUFBRSxVQUFVLGtCQUFzQjtRQUNqRCxrQkFBQyxjQUFRLElBQUMsSUFBSSxFQUFFLFlBQUksQ0FBQyxZQUFZLENBQUMsR0FBSSxDQUNwQyxFQUFFLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLE1BQUEsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBVEQsOEJBU0M7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsYUFBTyxPQUFHLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBRkQsc0JBRUM7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsR0FBRyxDQUFDLFFBQVEsT0FBRyxFQUFFLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRkQsc0JBRUM7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUMsa0JBQUMsYUFBUSxPQUFHLENBQUMsQ0FBQztBQUN4QyxDQUFDO0FBRkQsc0JBRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgUmVwZWF0LCBXaXRoLCBJZiwgZXhwciwgRG9tLCBSZW1vdGVEYXRhU291cmNlLCBNb2RlbFJlcG9zaXRvcnksIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgSHRtbCBmcm9tICcuLi9zcmMvaHRtbCdcclxuaW1wb3J0IHsgVXJsSGVscGVyLCBWaWV3UmVzdWx0IH0gZnJvbSBcIi4uL3NyYy9tdmNcIlxyXG5pbXBvcnQgJy4vYWRtaW4uY3NzJ1xyXG5pbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi9zcmMvb2JzZXJ2YWJsZXNcIjtcclxuaW1wb3J0IHsgQ2xvY2tBcHAgfSBmcm9tICcuLi9zYW1wbGUvY2xvY2svYXBwJ1xyXG5pbXBvcnQgVG9kb0FwcCBmcm9tIFwiLi4vc2FtcGxlL3RvZG9zL2FwcFwiO1xyXG5pbXBvcnQgRGF0YUdyaWQsIHsgVGV4dENvbHVtbiB9IGZyb20gXCIuL2dyaWRcIlxyXG5pbXBvcnQgTGliID0gcmVxdWlyZShcIi4uL2RpYWdyYW0vbGliXCIpO1xyXG5pbXBvcnQgQmFsbHNBcHAgZnJvbSBcIi4uL3NhbXBsZS9iYWxscy9hcHBcIjtcclxuaW1wb3J0IHsgU2VjdGlvbiB9IGZyb20gXCIuL2xheW91dFwiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVudSh7IGRyaXZlciwgaHRtbCwgdXJsIH0pIHtcclxuICAgIG1haW5NZW51KHVybCkuYmluZCgpXHJcbiAgICAgICAgLnVwZGF0ZShuZXcgUmUuU3RvcmUoe30pLCBkcml2ZXIpO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUFwcEFjdGlvbiB7XHJcbiAgICBwYXRoOiBzdHJpbmcsXHJcbiAgICBkaXNwbGF5Pzogc3RyaW5nO1xyXG59XHJcblxyXG52YXIgYWN0aW9uczogSUFwcEFjdGlvbltdID0gW1xyXG4gICAgeyBwYXRoOiBcInRpbWVzaGVldFwiLCBkaXNwbGF5OiBcIlRpbWVzaGVldFwiIH0sXHJcbiAgICB7IHBhdGg6IFwidmlld3MvaW52b2ljZXNcIiwgZGlzcGxheTogXCJJbnZvaWNlc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidG9kb3NcIiwgZGlzcGxheTogXCJUb2Rvc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidmlld3MvY29tcGFuaWVzXCIsIGRpc3BsYXk6IFwiQ29tcGFuaWVzXCIgfSxcclxuICAgIHsgcGF0aDogXCJ2aWV3cy91c2Vyc1wiLCBkaXNwbGF5OiBcIlVzZXJzXCIgfSxcclxuICAgIHsgcGF0aDogXCJncmFwaFwiLCBkaXNwbGF5OiBcIkdyYXBoXCIgfSxcclxuICAgIHsgcGF0aDogXCJiYWxsc1wiLCBkaXNwbGF5OiBcIkJhbGxzXCIgfVxyXG5dO1xyXG5cclxudmFyIG1haW5NZW51OiAodXJsOiBVcmxIZWxwZXIpID0+IFRlbXBsYXRlLklOb2RlID0gKHVybDogVXJsSGVscGVyKSA9PlxyXG4gICAgPHVsIGNsYXNzTmFtZT1cIm1haW4tbWVudS11bFwiPlxyXG4gICAgICAgIHthY3Rpb25zLm1hcCh4ID0+IChcclxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW1cIj5cclxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW0tbGlua1wiIGhyZWY9XCJcIiBvbkNsaWNrPXt1cmwuYWN0aW9uKHgucGF0aCl9Pnt4LmRpc3BsYXkgfHwgeC5wYXRofTwvYT5cclxuICAgICAgICAgICAgPC9saT4pKX1cclxuICAgIDwvdWw+O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+aW5kZXg8L2Rpdj4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZXNoZWV0KCkge1xyXG4gICAgdmFyIHRpbWUgPSBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpO1xyXG4gICAgdmFyIHRvZ2dsZVRpbWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGltZS50b2dnbGUoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj50aW1lc2hlZXQge2V4cHIoXCJhd2FpdCB0aW1lXCIpfVxyXG4gICAgICAgIDxidXR0b24gb25DbGljaz17dG9nZ2xlVGltZX0+dG9nZ2xlIHRpbWU8L2J1dHRvbj5cclxuICAgICAgICA8Q2xvY2tBcHAgdGltZT17ZXhwcihcImF3YWl0IHRpbWVcIil9IC8+XHJcbiAgICA8L2Rpdj4sIG5ldyBSZS5TdG9yZSh7IHRpbWUgfSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9kb3MoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPFRvZG9BcHAgLz4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ3JhcGgoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPExpYi5HcmFwaEFwcCAvPiwgbmV3IFJlLlN0b3JlKHt9KSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiYWxscygpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8QmFsbHNBcHAgLz4pO1xyXG59XHJcblxyXG4iXX0=