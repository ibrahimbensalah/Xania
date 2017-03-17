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
    return mainMenu(url)
        .bind()
        .update2(new xania_1.Reactive.Store({}), driver);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQXVJO0FBRXZJLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5QywyQ0FBMEM7QUFFMUMsb0NBQXVDO0FBQ3ZDLDJDQUEyQztBQUczQyxjQUFxQixFQUFxQjtRQUFuQixrQkFBTSxFQUFFLGNBQUksRUFBRSxZQUFHO0lBQ3BDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO1NBQ2YsSUFBSSxFQUFFO1NBQ04sT0FBTyxDQUFDLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUpELG9CQUlDO0FBT0QsSUFBSSxPQUFPLEdBQWlCO0lBQ3hCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFO0lBQzNDLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUU7SUFDL0MsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUU7SUFDbkMsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRTtJQUNqRCxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtJQUN6QyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtJQUNuQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtDQUN0QyxDQUFDO0FBRUYsSUFBSSxRQUFRLEdBQXVDLFVBQUMsR0FBYztJQUM5RCxPQUFBLDBCQUFJLFNBQVMsRUFBQyxjQUFjLElBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUNkLDBCQUFJLFNBQVMsRUFBQyxlQUFlO1FBQ3pCLHlCQUFHLFNBQVMsRUFBQyxvQkFBb0IsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBRyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUssQ0FDL0YsQ0FBQyxFQUhRLENBR1IsQ0FBQyxDQUNWO0FBTEwsQ0FLSyxDQUFDO0FBRVY7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDLHVDQUFnQixDQUFDLENBQUM7QUFDNUMsQ0FBQztBQUZELHNCQUVDO0FBRUQ7SUFDSSxJQUFJLElBQUksR0FBRyxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDbEMsSUFBSSxVQUFVLEdBQUc7UUFDYixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDbEIsQ0FBQyxDQUFDO0lBQ0YsTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQzs7UUFBZ0IsWUFBSSxDQUFDLFlBQVksQ0FBQztRQUNwRCw4QkFBUSxPQUFPLEVBQUUsVUFBVSxrQkFBc0I7UUFDakQsa0JBQUMsY0FBUSxJQUFDLElBQUksRUFBRSxZQUFJLENBQUMsWUFBWSxDQUFDLEdBQUksQ0FDcEMsRUFBRSxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxNQUFBLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDcEMsQ0FBQztBQVRELDhCQVNDO0FBRUQ7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDLGtCQUFDLGFBQU8sT0FBRyxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUZELHNCQUVDO0FBRUQ7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDLGtCQUFDLEdBQUcsQ0FBQyxRQUFRLE9BQUcsRUFBRSxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDOUQsQ0FBQztBQUZELHNCQUVDO0FBRUQ7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDLGtCQUFDLGFBQVEsT0FBRyxDQUFDLENBQUM7QUFDeEMsQ0FBQztBQUZELHNCQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgWGFuaWEgYXMgeGFuaWEsIFJlcGVhdCwgV2l0aCwgSWYsIGV4cHIsIERvbSwgUmVtb3RlRGF0YVNvdXJjZSwgTW9kZWxSZXBvc2l0b3J5LCBSZWFjdGl2ZSBhcyBSZSwgVGVtcGxhdGUgfSBmcm9tIFwiLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IEh0bWwgZnJvbSAnLi4vc3JjL2h0bWwnXHJcbmltcG9ydCB7IFVybEhlbHBlciwgVmlld1Jlc3VsdCB9IGZyb20gXCIuLi9zcmMvbXZjXCJcclxuaW1wb3J0ICcuL2FkbWluLmNzcydcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vc3JjL29ic2VydmFibGVzXCI7XHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSAnLi4vc2FtcGxlL2Nsb2NrL2FwcCdcclxuaW1wb3J0IFRvZG9BcHAgZnJvbSBcIi4uL3NhbXBsZS90b2Rvcy9hcHBcIjtcclxuaW1wb3J0IERhdGFHcmlkLCB7IFRleHRDb2x1bW4gfSBmcm9tIFwiLi9ncmlkXCJcclxuaW1wb3J0IExpYiA9IHJlcXVpcmUoXCIuLi9kaWFncmFtL2xpYlwiKTtcclxuaW1wb3J0IEJhbGxzQXBwIGZyb20gXCIuLi9zYW1wbGUvYmFsbHMvYXBwXCI7XHJcbmltcG9ydCB7IFNlY3Rpb24gfSBmcm9tIFwiLi9sYXlvdXRcIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1lbnUoeyBkcml2ZXIsIGh0bWwsIHVybCB9KSB7XHJcbiAgICByZXR1cm4gbWFpbk1lbnUodXJsKVxyXG4gICAgICAgIC5iaW5kKClcclxuICAgICAgICAudXBkYXRlMihuZXcgUmUuU3RvcmUoe30pLCBkcml2ZXIpO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUFwcEFjdGlvbiB7XHJcbiAgICBwYXRoOiBzdHJpbmcsXHJcbiAgICBkaXNwbGF5Pzogc3RyaW5nO1xyXG59XHJcblxyXG52YXIgYWN0aW9uczogSUFwcEFjdGlvbltdID0gW1xyXG4gICAgeyBwYXRoOiBcInRpbWVzaGVldFwiLCBkaXNwbGF5OiBcIlRpbWVzaGVldFwiIH0sXHJcbiAgICB7IHBhdGg6IFwidmlld3MvaW52b2ljZXNcIiwgZGlzcGxheTogXCJJbnZvaWNlc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidG9kb3NcIiwgZGlzcGxheTogXCJUb2Rvc1wiIH0sXHJcbiAgICB7IHBhdGg6IFwidmlld3MvY29tcGFuaWVzXCIsIGRpc3BsYXk6IFwiQ29tcGFuaWVzXCIgfSxcclxuICAgIHsgcGF0aDogXCJ2aWV3cy91c2Vyc1wiLCBkaXNwbGF5OiBcIlVzZXJzXCIgfSxcclxuICAgIHsgcGF0aDogXCJncmFwaFwiLCBkaXNwbGF5OiBcIkdyYXBoXCIgfSxcclxuICAgIHsgcGF0aDogXCJiYWxsc1wiLCBkaXNwbGF5OiBcIkJhbGxzXCIgfVxyXG5dO1xyXG5cclxudmFyIG1haW5NZW51OiAodXJsOiBVcmxIZWxwZXIpID0+IFRlbXBsYXRlLklOb2RlID0gKHVybDogVXJsSGVscGVyKSA9PlxyXG4gICAgPHVsIGNsYXNzTmFtZT1cIm1haW4tbWVudS11bFwiPlxyXG4gICAgICAgIHthY3Rpb25zLm1hcCh4ID0+IChcclxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW1cIj5cclxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW0tbGlua1wiIGhyZWY9XCJcIiBvbkNsaWNrPXt1cmwuYWN0aW9uKHgucGF0aCl9Pnt4LmRpc3BsYXkgfHwgeC5wYXRofTwvYT5cclxuICAgICAgICAgICAgPC9saT4pKX1cclxuICAgIDwvdWw+O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4KCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+aW5kZXg8L2Rpdj4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZXNoZWV0KCkge1xyXG4gICAgdmFyIHRpbWUgPSBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpO1xyXG4gICAgdmFyIHRvZ2dsZVRpbWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGltZS50b2dnbGUoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPGRpdj50aW1lc2hlZXQge2V4cHIoXCJhd2FpdCB0aW1lXCIpfVxyXG4gICAgICAgIDxidXR0b24gb25DbGljaz17dG9nZ2xlVGltZX0+dG9nZ2xlIHRpbWU8L2J1dHRvbj5cclxuICAgICAgICA8Q2xvY2tBcHAgdGltZT17ZXhwcihcImF3YWl0IHRpbWVcIil9IC8+XHJcbiAgICA8L2Rpdj4sIG5ldyBSZS5TdG9yZSh7IHRpbWUgfSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9kb3MoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPFRvZG9BcHAgLz4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ3JhcGgoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPExpYi5HcmFwaEFwcCAvPiwgbmV3IFJlLlN0b3JlKHt9KSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiYWxscygpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8QmFsbHNBcHAgLz4pO1xyXG59XHJcblxyXG4iXX0=