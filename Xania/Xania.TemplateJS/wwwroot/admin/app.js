"use strict";
var xania_1 = require("../src/xania");
var mvc_1 = require("../src/mvc");
require("./admin.css");
var observables_1 = require("../src/observables");
var app_1 = require("../sample/clock/app");
var todo_1 = require("../sample/layout/todo");
var grid_1 = require("./grid");
var time = new observables_1.Observables.Time();
var store = new xania_1.Reactive.Store({
    user: "Ibrahim",
    time: time,
    currentRow: null
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
        xania_1.fs("user")), store);
}
exports.invoices = invoices;
var toggleTime = function () {
    time.toggle();
};
function timesheet() {
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", null,
        "timesheet ",
        xania_1.fs("await time"),
        xania_1.Xania.tag("button", { onClick: toggleTime }, "toggle time"),
        xania_1.Xania.tag(app_1.ClockApp, { time: time })), store);
}
exports.timesheet = timesheet;
function todos() {
    return new mvc_1.ViewResult(xania_1.Xania.tag(todo_1.TodoApp, null));
}
exports.todos = todos;
function users() {
    var onRowChanged = function (row) {
        store.get("currentRow").set(row);
        store.refresh();
    };
    var onCancel = function () {
        store.get("currentRow").set(null);
        store.refresh();
    };
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", { style: "height: 95%;", className: "row" },
        xania_1.Xania.tag("div", { className: [xania_1.fs("currentRow -> 'col-6'"), xania_1.fs("not currentRow -> 'col-12'")] },
            xania_1.Xania.tag("section", { className: "section", style: "height: 100%" },
                xania_1.Xania.tag("div", { style: "padding: 0px 16px 100px 16px; height: 100%;" },
                    xania_1.Xania.tag("header", { style: "height: 50px" },
                        xania_1.Xania.tag("span", { className: "fa fa-adjust" }),
                        " ",
                        xania_1.Xania.tag("span", null, "Users")),
                    xania_1.Xania.tag(grid_1.default, { onRowChanged: onRowChanged }),
                    xania_1.Xania.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", "data-bind": "click: users.create" },
                            xania_1.Xania.tag("span", { className: "glyphicon glyphicon-plus" }),
                            " Add New"))))),
        xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("currentRow") },
            xania_1.Xania.tag("div", { className: "col-6" },
                xania_1.Xania.tag("section", { className: "section", style: "height: 100%" },
                    xania_1.Xania.tag("button", { type: "button", className: "close", "aria-hidden": "true", style: "margin: 16px 16px 0 0;", onClick: onCancel }, "\u00D7"),
                    xania_1.Xania.tag("header", { style: "height: 50px" },
                        xania_1.Xania.tag("span", { className: "fa fa-adjust" }),
                        " ",
                        xania_1.Xania.tag("span", null, "User")),
                    xania_1.Xania.tag("div", { style: "padding: 0px 16px 100px 16px; height: 100%;" },
                        xania_1.Xania.tag("header", { style: "height: 50px" },
                            xania_1.Xania.tag("span", { className: "glyphicon glyphicon-adjust" }),
                            xania_1.Xania.tag("span", { "data-bind": "text: UserName || '\u00A0'" }, xania_1.fs("data.Name"))),
                        xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                            xania_1.Xania.tag("label", { className: "control-label", for: "UserName" }, "User name"),
                            xania_1.Xania.tag("div", null,
                                xania_1.Xania.tag("input", { className: "form-control", type: "text", placeholder: "User name", name: "data.Name" }))),
                        xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                            xania_1.Xania.tag("label", { className: "control-label", for: "Email" }, "Email"),
                            xania_1.Xania.tag("div", null,
                                xania_1.Xania.tag("input", { id: "Email", className: "form-control", type: "text", placeholder: "Email", name: "data.Email" }))),
                        xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                            xania_1.Xania.tag("div", null,
                                xania_1.Xania.tag("input", { type: "checkbox", checked: xania_1.fs("data.EmailConfirmed") }),
                                " ",
                                xania_1.Xania.tag("label", { className: "control-label", for: "EmailConfirmed" }, "Email confirmed"))),
                        xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                            xania_1.Xania.tag("label", { className: "control-label", for: "Projects" }, "Projects"),
                            xania_1.Xania.tag("div", { "data-name": "Projects", className: "dropdown input-group-btn", "data-bind": "multiselect: Projects", "data-url": "/api/project", "data-valuefield": "Id", "data-textfield": "Name", "data-multiselect": "true" },
                                xania_1.Xania.tag("div", { className: "dropdown-toggle form-control", "data-toggle": "dropdown", style: "padding: 4px; width: 100%; overflow: auto; height: auto; min-height: 34px; white-space: normal;" },
                                    xania_1.Xania.tag("span", { style: "line-height: 23px; margin-left: 10px; color: #AAA;", "data-bind": "visible: !selected().length && !ds.includeNull()" }, "Projects"),
                                    xania_1.Xania.tag("a", { className: "xn-focus-point", href: "#", onfocus: "$(this).closest('.dropdown-toggle').dropdown('toggle')" }, "\u00A0")),
                                xania_1.Xania.tag("div", { "data-bind": "dataSource: ds", className: "xn-list dropdown-menu pull-right", role: "listbox", "aria-labelledby": "dropdownMenu1", style: "padding: 0px 0px; width: 100%;" },
                                    xania_1.Xania.tag("input", { tabindex: "-1", className: "xn-list-filter", placeholder: "Search...", onclick: "event.stopPropagation()", "data-bind": "value: filter" }),
                                    xania_1.Xania.tag("div", { className: "xn-list-scrollable", style: "max-height: 200px; overflow: auto;", role: "listbox" },
                                        xania_1.Xania.tag("div", { className: "xn-content", style: "padding-top: 0px; height: 0px;" },
                                            xania_1.Xania.tag("table", { className: "xn-grid", style: "width: 100%;" },
                                                xania_1.Xania.tag("tbody", null)))),
                                    xania_1.Xania.tag("div", null,
                                        xania_1.Xania.tag("button", { "data-bind": "click: post.bind($data, 'Name', filter())" }, "Add new"))))),
                        xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                            xania_1.Xania.tag("div", { className: "xn-files", style: "height: 100px;", "data-bind": "files: ''" })),
                        xania_1.Xania.tag("div", { className: "col-lg-12 col-md-3" },
                            xania_1.Xania.tag("button", { className: "btn btn-primary", "data-bind": "click: save" },
                                xania_1.Xania.tag("span", { className: "glyphicon glyphicon-floppy-disk" }),
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
var mainMenu = function (url) {
    return xania_1.Xania.tag("ul", { className: "main-menu-ul" }, ["timesheet", "invoices", "todos", "users"].map(function (actionName) { return (xania_1.Xania.tag("li", { className: "main-menuitem" },
        xania_1.Xania.tag("a", { className: "main-menuitem-link", href: "", onClick: url.action(actionName) }, actionName))); }));
};
var panel = function (n) {
    return xania_1.Xania.tag("section", { className: "mdl-layout__tab-panel", id: "scroll-tab-" + n },
        xania_1.Xania.tag("div", { className: "page-content" },
            "tab ",
            n));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQStGO0FBQy9GLGtDQUFrRDtBQUNsRCx1QkFBb0I7QUFDcEIsa0RBQWlEO0FBQ2pELDJDQUE4QztBQUM5Qyw4Q0FBZ0Q7QUFDaEQsK0JBQTZCO0FBRTdCLElBQUksSUFBSSxHQUFHLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNsQyxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO0lBQ3JCLElBQUksRUFBRSxTQUFTO0lBQ2YsSUFBSSxNQUFBO0lBQ0osVUFBVSxFQUFFLElBQUk7Q0FDbkIsQ0FBQyxDQUFDO0FBRUg7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUFDLHVDQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFGRCxzQkFFQztBQUVELGNBQXFCLEVBQXFCO1FBQW5CLGtCQUFNLEVBQUUsY0FBSSxFQUFFLFlBQUc7SUFDcEMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBYSxXQUFHLENBQUMsVUFBVSxDQUFDO1NBQ3pDLE1BQU0sQ0FBQyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFIRCxvQkFHQztBQUVEO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FBQzs7UUFBZSxVQUFFLENBQUMsTUFBTSxDQUFDLENBQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNuRSxDQUFDO0FBRkQsNEJBRUM7QUFFRCxJQUFJLFVBQVUsR0FBRztJQUNiLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNsQixDQUFDLENBQUM7QUFFRjtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQUM7O1FBQWdCLFVBQUUsQ0FBQyxZQUFZLENBQUM7UUFDbEQsOEJBQVEsT0FBTyxFQUFF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UyxFQUFDLHVCQUF1QixFQUFDLEVBQUUsRUFBRSxhQUFhLEdBQUcsQ0FBQztRQUM1RCwyQkFBSyxTQUFTLEVBQUMsY0FBYzs7WUFBTSxDQUFDLENBQU8sQ0FDckM7QUFGVixDQUVVLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgRm9yRWFjaCwgZnMsIFZpZXcsIERvbSwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IFVybEhlbHBlciwgVmlld1Jlc3VsdCB9IGZyb20gXCIuLi9zcmMvbXZjXCJcclxuaW1wb3J0ICcuL2FkbWluLmNzcydcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vc3JjL29ic2VydmFibGVzXCI7XHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSAnLi4vc2FtcGxlL2Nsb2NrL2FwcCdcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuLi9zYW1wbGUvbGF5b3V0L3RvZG9cIjtcclxuaW1wb3J0IERhdGFHcmlkIGZyb20gXCIuL2dyaWRcIlxyXG5cclxudmFyIHRpbWUgPSBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpO1xyXG52YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUoe1xyXG4gICAgdXNlcjogXCJJYnJhaGltXCIsXHJcbiAgICB0aW1lLFxyXG4gICAgY3VycmVudFJvdzogbnVsbFxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbmRleCgpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8ZGl2PmluZGV4PC9kaXY+LCBzdG9yZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZW51KHsgZHJpdmVyLCBodG1sLCB1cmwgfSkge1xyXG4gICAgbWFpbk1lbnUodXJsKS5iaW5kPFJlLkJpbmRpbmc+KERvbS5Eb21WaXNpdG9yKVxyXG4gICAgICAgIC51cGRhdGUobmV3IFJlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGludm9pY2VzKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KDxkaXY+aW52b2ljZXMge2ZzKFwidXNlclwiKX08L2Rpdj4sIHN0b3JlKTtcclxufVxyXG5cclxudmFyIHRvZ2dsZVRpbWUgPSAoKSA9PiB7XHJcbiAgICB0aW1lLnRvZ2dsZSgpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVzaGVldCgpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdCg8ZGl2PnRpbWVzaGVldCB7ZnMoXCJhd2FpdCB0aW1lXCIpfVxyXG4gICAgICAgIDxidXR0b24gb25DbGljaz17dG9nZ2xlVGltZX0+dG9nZ2xlIHRpbWU8L2J1dHRvbj5cclxuICAgICAgICA8Q2xvY2tBcHAgdGltZT17dGltZX0gLz5cclxuICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdG9kb3MoKSB7XHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoPFRvZG9BcHAgLz4pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlcnMoKSB7XHJcbiAgICB2YXIgb25Sb3dDaGFuZ2VkID0gKHJvdykgPT4ge1xyXG4gICAgICAgIHN0b3JlLmdldChcImN1cnJlbnRSb3dcIikuc2V0KHJvdyk7XHJcbiAgICAgICAgc3RvcmUucmVmcmVzaCgpO1xyXG4gICAgfVxyXG4gICAgdmFyIG9uQ2FuY2VsID0gKCkgPT4ge1xyXG4gICAgICAgIHN0b3JlLmdldChcImN1cnJlbnRSb3dcIikuc2V0KG51bGwpO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdChcclxuICAgICAgICA8ZGl2IHN0eWxlPVwiaGVpZ2h0OiA5NSU7XCIgY2xhc3NOYW1lPVwicm93XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbZnMoXCJjdXJyZW50Um93IC0+ICdjb2wtNidcIiksIGZzKFwibm90IGN1cnJlbnRSb3cgLT4gJ2NvbC0xMidcIildfT5cclxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInNlY3Rpb25cIiBzdHlsZT1cImhlaWdodDogMTAwJVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAwcHggMTZweCAxMDBweCAxNnB4OyBoZWlnaHQ6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj48c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hZGp1c3RcIj48L3NwYW4+IDxzcGFuPlVzZXJzPC9zcGFuPjwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgb25Sb3dDaGFuZ2VkPXtvblJvd0NoYW5nZWR9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPjxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgZGF0YS1iaW5kPVwiY2xpY2s6IHVzZXJzLmNyZWF0ZVwiPjxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tcGx1c1wiPjwvc3Bhbj4gQWRkIE5ldzwvYnV0dG9uPjwvZm9vdGVyPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJjdXJyZW50Um93XCIpfT5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTZcIj5cclxuICAgICAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiY2xvc2VcIiBhcmlhLWhpZGRlbj1cInRydWVcIiBzdHlsZT1cIm1hcmdpbjogMTZweCAxNnB4IDAgMDtcIiBvbkNsaWNrPXtvbkNhbmNlbH0+w5c8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhlYWRlciBzdHlsZT1cImhlaWdodDogNTBweFwiPjxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLWFkanVzdFwiPjwvc3Bhbj4gPHNwYW4+VXNlcjwvc3Bhbj48L2hlYWRlcj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAwcHggMTZweCAxMDBweCAxNnB4OyBoZWlnaHQ6IDEwMCU7XCI+PGhlYWRlciBzdHlsZT1cImhlaWdodDogNTBweFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1hZGp1c3RcIj48L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBkYXRhLWJpbmQ9XCJ0ZXh0OiBVc2VyTmFtZSB8fCAnJm5ic3A7J1wiPntmcyhcImRhdGEuTmFtZVwiKX08L3NwYW4+PC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiVXNlck5hbWVcIj5Vc2VyIG5hbWU8L2xhYmVsPjxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJVc2VyIG5hbWVcIiBuYW1lPVwiZGF0YS5OYW1lXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiRW1haWxcIj5FbWFpbDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj48aW5wdXQgaWQ9XCJFbWFpbFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJFbWFpbFwiIG5hbWU9XCJkYXRhLkVtYWlsXCIgLz48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj48ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXsgZnMoXCJkYXRhLkVtYWlsQ29uZmlybWVkXCIpIH0gLz4gPGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJFbWFpbENvbmZpcm1lZFwiPkVtYWlsIGNvbmZpcm1lZDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbGctMTIgY29sLW1kLTNcIj48bGFiZWwgY2xhc3NOYW1lPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cIlByb2plY3RzXCI+UHJvamVjdHM8L2xhYmVsPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGRhdGEtbmFtZT1cIlByb2plY3RzXCIgY2xhc3NOYW1lPVwiZHJvcGRvd24gaW5wdXQtZ3JvdXAtYnRuXCIgZGF0YS1iaW5kPVwibXVsdGlzZWxlY3Q6IFByb2plY3RzXCIgZGF0YS11cmw9XCIvYXBpL3Byb2plY3RcIiBkYXRhLXZhbHVlZmllbGQ9XCJJZFwiIGRhdGEtdGV4dGZpZWxkPVwiTmFtZVwiIGRhdGEtbXVsdGlzZWxlY3Q9XCJ0cnVlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZHJvcGRvd24tdG9nZ2xlIGZvcm0tY29udHJvbFwiIGRhdGEtdG9nZ2xlPVwiZHJvcGRvd25cIiBzdHlsZT1cInBhZGRpbmc6IDRweDsgd2lkdGg6IDEwMCU7IG92ZXJmbG93OiBhdXRvOyBoZWlnaHQ6IGF1dG87IG1pbi1oZWlnaHQ6IDM0cHg7IHdoaXRlLXNwYWNlOiBub3JtYWw7XCI+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gc3R5bGU9XCJsaW5lLWhlaWdodDogMjNweDsgbWFyZ2luLWxlZnQ6IDEwcHg7IGNvbG9yOiAjQUFBO1wiIGRhdGEtYmluZD1cInZpc2libGU6ICFzZWxlY3RlZCgpLmxlbmd0aCAmYW1wOyZhbXA7ICFkcy5pbmNsdWRlTnVsbCgpXCI+UHJvamVjdHM8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9XCJ4bi1mb2N1cy1wb2ludFwiIGhyZWY9XCIjXCIgb25mb2N1cz1cIiQodGhpcykuY2xvc2VzdCgnLmRyb3Bkb3duLXRvZ2dsZScpLmRyb3Bkb3duKCd0b2dnbGUnKVwiPiZuYnNwOzwvYT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgZGF0YS1iaW5kPVwiZGF0YVNvdXJjZTogZHNcIiBjbGFzc05hbWU9XCJ4bi1saXN0IGRyb3Bkb3duLW1lbnUgcHVsbC1yaWdodFwiIHJvbGU9XCJsaXN0Ym94XCIgYXJpYS1sYWJlbGxlZGJ5PVwiZHJvcGRvd25NZW51MVwiIHN0eWxlPVwicGFkZGluZzogMHB4IDBweDsgd2lkdGg6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdGFiaW5kZXg9XCItMVwiIGNsYXNzTmFtZT1cInhuLWxpc3QtZmlsdGVyXCIgcGxhY2Vob2xkZXI9XCJTZWFyY2guLi5cIiBvbmNsaWNrPVwiZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcIiBkYXRhLWJpbmQ9XCJ2YWx1ZTogZmlsdGVyXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwieG4tbGlzdC1zY3JvbGxhYmxlXCIgc3R5bGU9XCJtYXgtaGVpZ2h0OiAyMDBweDsgb3ZlcmZsb3c6IGF1dG87XCIgcm9sZT1cImxpc3Rib3hcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWNvbnRlbnRcIiBzdHlsZT1cInBhZGRpbmctdG9wOiAwcHg7IGhlaWdodDogMHB4O1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwieG4tZ3JpZFwiIHN0eWxlPVwid2lkdGg6IDEwMCU7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gZGF0YS1iaW5kPVwiY2xpY2s6IHBvc3QuYmluZCgkZGF0YSwgJ05hbWUnLCBmaWx0ZXIoKSlcIj5BZGQgbmV3PC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPjxkaXYgY2xhc3NOYW1lPVwieG4tZmlsZXNcIiBzdHlsZT1cImhlaWdodDogMTAwcHg7XCIgZGF0YS1iaW5kPVwiZmlsZXM6ICcnXCI+PC9kaXY+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy0xMiBjb2wtbWQtM1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgZGF0YS1iaW5kPVwiY2xpY2s6IHNhdmVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1mbG9wcHktZGlza1wiPjwvc3Bhbj4gU2F2ZTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgIDwvZGl2Piwgc3RvcmUpO1xyXG59XHJcblxyXG52YXIgTWVudUl0ZW0gPSAoe25hbWV9KSA9PiA8bGk+PGEgaHJlZj1cImh0dHA6Ly93d3cuZ29vZ2xlLm5sXCI+bWVudSBpdGVtIHtuYW1lfTwvYT48L2xpPjtcclxuXHJcbnZhciBtYWluTWVudTogKHVybDogVXJsSGVscGVyKSA9PiBUZW1wbGF0ZS5JTm9kZSA9ICh1cmw6IFVybEhlbHBlcikgPT5cclxuICAgIDx1bCBjbGFzc05hbWU9XCJtYWluLW1lbnUtdWxcIj5cclxuICAgICAgICB7W1widGltZXNoZWV0XCIsIFwiaW52b2ljZXNcIiwgXCJ0b2Rvc1wiLCBcInVzZXJzXCJdLm1hcChhY3Rpb25OYW1lID0+IChcclxuICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW1cIj5cclxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW0tbGlua1wiIGhyZWY9XCJcIiBvbkNsaWNrPXt1cmwuYWN0aW9uKGFjdGlvbk5hbWUpfT57YWN0aW9uTmFtZX08L2E+XHJcbiAgICAgICAgICAgIDwvbGk+KSl9XHJcbiAgICA8L3VsPjtcclxuXHJcbnZhciBwYW5lbCA9IG4gPT5cclxuICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm1kbC1sYXlvdXRfX3RhYi1wYW5lbFwiIGlkPXtcInNjcm9sbC10YWItXCIgKyBufT5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2UtY29udGVudFwiPnRhYiB7bn08L2Rpdj5cclxuICAgIDwvc2VjdGlvbj47Il19