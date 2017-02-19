"use strict";
var xania_1 = require("../src/xania");
var store = new xania_1.Reactive.Store({ user: "Ibrahim" });
function execute(_a) {
    var driver = _a.driver, html = _a.html, url = _a.url;
    var mainView = url.route(function (path) {
        switch (path) {
            case "index":
                return xania_1.Xania.tag("div", null, "index");
            default: {
                return xania_1.Xania.tag("div", null,
                    "undefined: ",
                    path);
            }
        }
    });
    xania_1.Xania.partial(mainView, store)
        .bind()
        .update(store, driver);
}
exports.execute = execute;
function menu(_a) {
    var driver = _a.driver, html = _a.html, url = _a.url;
    mainMenu(url).bind(xania_1.Dom.DomVisitor)
        .update(new xania_1.Reactive.Store({}), driver);
}
exports.menu = menu;
function invoices(url) {
    return xania_1.Xania.tag("div", null,
        "invoices ",
        xania_1.fs("user"));
}
exports.invoices = invoices;
var MenuItem = function (_a) {
    var name = _a.name;
    return xania_1.Xania.tag("li", null,
        xania_1.Xania.tag("a", { href: "http://www.google.nl" },
            "menu item ",
            name));
};
var mainMenu = function (url) {
    return xania_1.Xania.tag("ul", { className: "main-menu-ul" },
        xania_1.Xania.tag("li", { className: "main-menuitem" },
            xania_1.Xania.tag("a", { className: "main-menuitem-link", href: "", onClick: url.action('timesheet') }, "Timesheet")),
        xania_1.Xania.tag("li", { className: "main-menuitem" },
            xania_1.Xania.tag("a", { className: "main-menuitem-link", href: "", onClick: url.action('invoices') }, "Invoices")));
};
var panel = function (n) {
    return xania_1.Xania.tag("section", { className: "mdl-layout__tab-panel", id: "scroll-tab-" + n },
        xania_1.Xania.tag("div", { className: "page-content" },
            "tab ",
            n));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQStGO0FBRy9GLElBQUksS0FBSyxHQUFHLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDLENBQUMsQ0FBQztBQUU1QyxpQkFBd0IsRUFBcUI7UUFBbkIsa0JBQU0sRUFBRSxjQUFJLEVBQUUsWUFBRztJQUV2QyxJQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQUEsSUFBSTtRQUMzQixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ1gsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyx1Q0FBZ0IsQ0FBQztZQUM1QixTQUFTLENBQUM7Z0JBQ04sTUFBTSxDQUFDOztvQkFBaUIsSUFBSSxDQUFPLENBQUM7WUFDeEMsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILGFBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQztTQUN6QixJQUFJLEVBQUU7U0FDTixNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFmRCwwQkFlQztBQUVELGNBQXFCLEVBQXFCO1FBQW5CLGtCQUFNLEVBQUUsY0FBSSxFQUFFLFlBQUc7SUFDcEMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBYSxXQUFHLENBQUMsVUFBVSxDQUFDO1NBQ3pDLE1BQU0sQ0FBQyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFIRCxvQkFHQztBQUVELGtCQUF5QixHQUFHO0lBQ3hCLE1BQU0sQ0FBQzs7UUFBaUIsVUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFRLENBQUM7QUFDL0MsQ0FBQztBQUZELDRCQUVDO0FBRUQsSUFBSSxRQUFRLEdBQUcsVUFBQyxFQUFNO1FBQUwsY0FBSTtJQUFNLE9BQUE7UUFBSSx5QkFBRyxJQUFJLEVBQUMsc0JBQXNCOztZQUFZLElBQUksQ0FBSyxDQUFLO0FBQTVELENBQTRELENBQUM7QUFFeEYsSUFBSSxRQUFRLEdBQXVDLFVBQUMsR0FBYztJQUM5RCxPQUFBLDBCQUFJLFNBQVMsRUFBQyxjQUFjO1FBQ3hCLDBCQUFJLFNBQVMsRUFBQyxlQUFlO1lBQUMseUJBQUcsU0FBUyxFQUFDLG9CQUFvQixFQUFDLElBQUksRUFBQyxFQUFFLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFlLENBQUs7UUFDNUgsMEJBQUksU0FBUyxFQUFDLGVBQWU7WUFBQyx5QkFBRyxTQUFTLEVBQUMsb0JBQW9CLEVBQUMsSUFBSSxFQUFDLEVBQUUsRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsZUFBYyxDQUFLLENBQ3pIO0FBSEwsQ0FHSyxDQUFDO0FBRVYsSUFBSSxLQUFLLEdBQUcsVUFBQSxDQUFDO0lBQ1QsT0FBQSwrQkFBUyxTQUFTLEVBQUMsdUJBQXVCLEVBQUMsRUFBRSxFQUFFLGFBQWEsR0FBRyxDQUFDO1FBQzVELDJCQUFLLFNBQVMsRUFBQyxjQUFjOztZQUFNLENBQUMsQ0FBTyxDQUNyQztBQUZWLENBRVUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFhhbmlhIGFzIHhhbmlhLCBGb3JFYWNoLCBmcywgVmlldywgRG9tLCBSZWFjdGl2ZSBhcyBSZSwgVGVtcGxhdGUgfSBmcm9tIFwiLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgVXJsSGVscGVyIH0gZnJvbSBcIi4uL3NyYy9tdmNcIlxyXG5cclxudmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHt1c2VyOiBcIklicmFoaW1cIn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGUoeyBkcml2ZXIsIGh0bWwsIHVybCB9KSB7XHJcblxyXG4gICAgY29uc3QgbWFpblZpZXcgPSB1cmwucm91dGUocGF0aCA9PiB7XHJcbiAgICAgICAgc3dpdGNoIChwYXRoKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJpbmRleFwiOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+aW5kZXg8L2Rpdj47XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PnVuZGVmaW5lZDoge3BhdGh9PC9kaXY+O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgeGFuaWEucGFydGlhbChtYWluVmlldywgc3RvcmUpXHJcbiAgICAgICAgLmJpbmQoKVxyXG4gICAgICAgIC51cGRhdGUoc3RvcmUsIGRyaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZW51KHsgZHJpdmVyLCBodG1sLCB1cmwgfSkge1xyXG4gICAgbWFpbk1lbnUodXJsKS5iaW5kPFJlLkJpbmRpbmc+KERvbS5Eb21WaXNpdG9yKVxyXG4gICAgICAgIC51cGRhdGUobmV3IFJlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGludm9pY2VzKHVybCkge1xyXG4gICAgcmV0dXJuIDxkaXYgPmludm9pY2VzIHsgZnMoXCJ1c2VyXCIpIH08L2Rpdj47XHJcbn1cclxuXHJcbnZhciBNZW51SXRlbSA9ICh7bmFtZX0pID0+IDxsaT48YSBocmVmPVwiaHR0cDovL3d3dy5nb29nbGUubmxcIj5tZW51IGl0ZW0ge25hbWV9PC9hPjwvbGk+O1xyXG5cclxudmFyIG1haW5NZW51OiAodXJsOiBVcmxIZWxwZXIpID0+IFRlbXBsYXRlLklOb2RlID0gKHVybDogVXJsSGVscGVyKSA9PlxyXG4gICAgPHVsIGNsYXNzTmFtZT1cIm1haW4tbWVudS11bFwiPlxyXG4gICAgICAgIDxsaSBjbGFzc05hbWU9XCJtYWluLW1lbnVpdGVtXCI+PGEgY2xhc3NOYW1lPVwibWFpbi1tZW51aXRlbS1saW5rXCIgaHJlZj1cIlwiIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ3RpbWVzaGVldCcpfT5UaW1lc2hlZXQ8L2E+PC9saT5cclxuICAgICAgICA8bGkgY2xhc3NOYW1lPVwibWFpbi1tZW51aXRlbVwiPjxhIGNsYXNzTmFtZT1cIm1haW4tbWVudWl0ZW0tbGlua1wiIGhyZWY9XCJcIiBvbkNsaWNrPXt1cmwuYWN0aW9uKCdpbnZvaWNlcycpfT5JbnZvaWNlczwvYT48L2xpPlxyXG4gICAgPC91bD47XHJcblxyXG52YXIgcGFuZWwgPSBuID0+XHJcbiAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJtZGwtbGF5b3V0X190YWItcGFuZWxcIiBpZD17XCJzY3JvbGwtdGFiLVwiICsgbn0+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdlLWNvbnRlbnRcIj50YWIge259PC9kaXY+XHJcbiAgICA8L3NlY3Rpb24+OyJdfQ==