"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
var app_1 = require("./../clock/app");
var todo_1 = require("./todo");
var app_2 = require("./../balls/app");
function store() {
    return new xania_1.Reactive.Store({
        time: new observables_1.Observables.Time(),
        user: { firstName: "Ibrahim", lastName: "ben Salah" },
        size: function (ts) {
            return Math.floor((ts % 1000) / 50);
        }
    }, [Math]);
}
exports.store = store;
var layout = function (view, url) {
    return xania_1.Xania.tag("div", null,
        xania_1.Xania.tag("h1", null,
            xania_1.query("user.firstName"),
            " ",
            xania_1.query("user.lastName")),
        xania_1.Xania.tag("div", { style: "clear: both;" },
            xania_1.Xania.tag("a", { href: "#", onClick: url.action('todos') }, "todos")),
        xania_1.Xania.tag("div", null,
            "view:",
            xania_1.Xania.tag("button", { onClick: url.action('index') }, "home"),
            xania_1.Xania.tag("button", { onClick: url.action('view1') }, "view 1"),
            xania_1.Xania.tag("button", { onClick: url.action('view2') }, "view 2"),
            xania_1.Xania.tag("button", { onClick: url.action('clock') }, "clock"),
            xania_1.Xania.tag("button", { onClick: url.action('clock2') }, "clock 2"),
            xania_1.Xania.tag("button", { onClick: url.action('todos') }, "todos"),
            xania_1.Xania.tag("button", { onClick: url.action('balls') }, "balls"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "model:",
            xania_1.Xania.tag("button", { onClick: xania_1.query("user.firstName <- 'Ramy'") }, "Ramy"),
            xania_1.Xania.tag("button", { onClick: xania_1.query("user.firstName <- 'Ibrahim'") }, "Ibrahim"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "time:",
            xania_1.Xania.tag("button", { onClick: xania_1.query("time.toggle ()") }, "toggle")),
        xania_1.Xania.tag("div", { style: "padding: 10px;" }, xania_1.View.partial(view, { user: xania_1.query("user"), time: new observables_1.Observables.Time() })));
};
function execute(_a) {
    var driver = _a.driver, html = _a.html, url = _a.url;
    var mainView = url.route(function (path) {
        switch (path) {
            case 'view1':
                return xania_1.Xania.tag("div", null,
                    "view 1: ",
                    xania_1.query("user.firstName"),
                    " ",
                    xania_1.query("await time"));
            case 'view2':
                return (xania_1.Xania.tag("div", null,
                    xania_1.query("user.firstName"),
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.query("for v in [1..(min (size (await time)) 10)]") },
                        xania_1.Xania.tag("p", { style: "margin: 0" },
                            xania_1.query("user.firstName"),
                            ": ",
                            xania_1.query("v"))),
                    xania_1.Xania.tag("hr", { style: "padding: 0; margin: 0;" }),
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.query("for g in [(1 + min (size (await time)) 10)..10]") },
                        xania_1.Xania.tag("p", { style: "margin: 0" },
                            xania_1.query("user.lastName"),
                            ": ",
                            xania_1.query("g")))));
            case 'clock':
                return xania_1.Xania.tag(app_1.ClockApp, { time: xania_1.query("time") });
            case 'clock2':
                return xania_1.Xania.tag(app_1.ClockApp, { time: xania_1.query("time") });
            case 'todos':
                return xania_1.Xania.tag(todo_1.TodoApp, null);
            case 'balls':
                return xania_1.Xania.tag(app_2.BallsApp, null);
            default:
                return html.partial(path, {});
        }
    });
    xania_1.Xania.view(layout(mainView, url))
        .bind(store(), driver);
}
exports.execute = execute;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUFxRztBQUNyRyxzQ0FBeUM7QUFDekMsK0JBQWdDO0FBQ2hDLHNDQUF5QztBQUd6QztJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ2hCLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNyRCxJQUFJLFlBQUMsRUFBRTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDSixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUM7QUFSRCxzQkFRQztBQUVELElBQUksTUFBTSxHQUFRLFVBQUMsSUFBSSxFQUFFLEdBQWM7SUFDbkMsT0FBQTtRQUNJO1lBQUssYUFBSyxDQUFDLGdCQUFnQixDQUFDOztZQUFHLGFBQUssQ0FBQyxlQUFlLENBQUMsQ0FBTTtRQUMzRCwyQkFBSyxLQUFLLEVBQUMsY0FBYztZQUNyQix5QkFBRyxJQUFJLEVBQUMsR0FBRyxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFXLENBQ2pEO1FBQ047O1lBRUksOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQWU7WUFDbkQsOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWlCO1lBQ3JELDhCQUFRLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFpQjtZQUNyRCw4QkFBUSxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBZ0I7WUFDcEQsOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWtCO1lBQ3ZELDhCQUFRLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFnQjtZQUNwRCw4QkFBUSxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBZ0I7O1lBR3BELDhCQUFRLE9BQU8sRUFBRSxhQUFLLENBQUMsMEJBQTBCLENBQUMsV0FBZTtZQUNqRSw4QkFBUSxPQUFPLEVBQUUsYUFBSyxDQUFDLDZCQUE2QixDQUFDLGNBQWtCOztZQUd2RSw4QkFBUSxPQUFPLEVBQUUsYUFBSyxDQUFDLGdCQUFnQixDQUFDLGFBQWlCLENBQ3ZEO1FBQ04sMkJBQUssS0FBSyxFQUFDLGdCQUFnQixJQUN0QixZQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxhQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQ3hFLENBQ0o7QUF6Qk4sQ0F5Qk0sQ0FBQztBQUdYLGlCQUF3QixFQUFxQjtRQUFuQixrQkFBTSxFQUFFLGNBQUksRUFBRSxZQUFHO0lBQ3ZDLElBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBQSxJQUFJO1FBQ3pCLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDWCxLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDOztvQkFBYyxhQUFLLENBQUMsZ0JBQWdCLENBQUM7O29CQUFHLGFBQUssQ0FBQyxZQUFZLENBQUMsQ0FBTyxDQUFDO1lBQzlFLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsQ0FDSDtvQkFDSyxhQUFLLENBQUMsZ0JBQWdCLENBQUM7b0JBQ3hCLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsYUFBSyxDQUFDLDRDQUE0QyxDQUFDO3dCQUM5RCx5QkFBRyxLQUFLLEVBQUMsV0FBVzs0QkFBRSxhQUFLLENBQUMsZ0JBQWdCLENBQUM7OzRCQUFJLGFBQUssQ0FBQyxHQUFHLENBQUMsQ0FBSyxDQUMxRDtvQkFDViwwQkFBSSxLQUFLLEVBQUMsd0JBQXdCLEdBQUc7b0JBQ3JDLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsYUFBSyxDQUFDLGlEQUFpRCxDQUFDO3dCQUNuRSx5QkFBRyxLQUFLLEVBQUMsV0FBVzs0QkFBRSxhQUFLLENBQUMsZUFBZSxDQUFDOzs0QkFBSSxhQUFLLENBQUMsR0FBRyxDQUFDLENBQUssQ0FDekQsQ0FDUixDQUNULENBQUM7WUFDTixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGNBQVEsSUFBQyxJQUFJLEVBQUUsYUFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFJLENBQUM7WUFDN0MsS0FBSyxRQUFRO2dCQUNULE1BQU0sQ0FBQyxrQkFBQyxjQUFRLElBQUMsSUFBSSxFQUFFLGFBQUssQ0FBQyxNQUFNLENBQUMsR0FBSSxDQUFDO1lBQzdDLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsa0JBQUMsY0FBTyxPQUFHLENBQUM7WUFDdkIsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxjQUFRLE9BQUcsQ0FBQztZQUN4QjtnQkFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsYUFBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzVCLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBakNELDBCQWlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4uLy4uL3NyYy9vYnNlcnZhYmxlc1wiXHJcblxyXG5pbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgRm9yRWFjaCwgcXVlcnksIFZpZXcsIERvbSwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uLy4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSBcIi4vLi4vY2xvY2svYXBwXCJcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuL3RvZG9cIlxyXG5pbXBvcnQgeyBCYWxsc0FwcCB9IGZyb20gXCIuLy4uL2JhbGxzL2FwcFwiXHJcbmltcG9ydCB7IFVybEhlbHBlciwgSHRtbEhlbHBlciB9IGZyb20gXCIuLi8uLi9zcmMvbXZjXCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdG9yZSgpIHtcclxuICAgIHJldHVybiBuZXcgUmUuU3RvcmUoe1xyXG4gICAgICAgIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCksXHJcbiAgICAgICAgdXNlcjogeyBmaXJzdE5hbWU6IFwiSWJyYWhpbVwiLCBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIiB9LFxyXG4gICAgICAgIHNpemUodHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoKHRzICUgMTAwMCkgLyA1MCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgW01hdGhdKTtcclxufVxyXG5cclxudmFyIGxheW91dDogYW55ID0gKHZpZXcsIHVybDogVXJsSGVscGVyKSA9PlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8aDE+e3F1ZXJ5KFwidXNlci5maXJzdE5hbWVcIil9IHtxdWVyeShcInVzZXIubGFzdE5hbWVcIil9PC9oMT5cclxuICAgICAgICA8ZGl2IHN0eWxlPVwiY2xlYXI6IGJvdGg7XCI+XHJcbiAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgb25DbGljaz17dXJsLmFjdGlvbigndG9kb3MnKX0+dG9kb3M8L2E+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgdmlldzpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt1cmwuYWN0aW9uKCdpbmRleCcpfT5ob21lPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbigndmlldzEnKX0+dmlldyAxPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbigndmlldzInKX0+dmlldyAyPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbignY2xvY2snKX0+Y2xvY2s8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt1cmwuYWN0aW9uKCdjbG9jazInKX0+Y2xvY2sgMjwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ3RvZG9zJyl9PnRvZG9zPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbignYmFsbHMnKX0+YmFsbHM8L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIG1vZGVsOlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3F1ZXJ5KFwidXNlci5maXJzdE5hbWUgPC0gJ1JhbXknXCIpfT5SYW15PC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17cXVlcnkoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnSWJyYWhpbSdcIil9PklicmFoaW08L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIHRpbWU6XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17cXVlcnkoXCJ0aW1lLnRvZ2dsZSAoKVwiKX0+dG9nZ2xlPC9idXR0b24+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDEwcHg7XCI+XHJcbiAgICAgICAgICAgIHtWaWV3LnBhcnRpYWwodmlldywgeyB1c2VyOiBxdWVyeShcInVzZXJcIiksIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCkgfSl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj47XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGUoeyBkcml2ZXIsIGh0bWwsIHVybCB9KSB7XHJcbiAgICB2YXIgbWFpblZpZXcgPSB1cmwucm91dGUocGF0aCA9PiB7XHJcbiAgICAgICAgc3dpdGNoIChwYXRoKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXcxJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PnZpZXcgMToge3F1ZXJ5KFwidXNlci5maXJzdE5hbWVcIil9IHtxdWVyeShcImF3YWl0IHRpbWVcIil9PC9kaXY+O1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3Mic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtxdWVyeShcInVzZXIuZmlyc3ROYW1lXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtxdWVyeShcImZvciB2IGluIFsxLi4obWluIChzaXplIChhd2FpdCB0aW1lKSkgMTApXVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogMFwiPntxdWVyeShcInVzZXIuZmlyc3ROYW1lXCIpfToge3F1ZXJ5KFwidlwiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhyIHN0eWxlPVwicGFkZGluZzogMDsgbWFyZ2luOiAwO1wiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e3F1ZXJ5KFwiZm9yIGcgaW4gWygxICsgbWluIChzaXplIChhd2FpdCB0aW1lKSkgMTApLi4xMF1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDBcIj57cXVlcnkoXCJ1c2VyLmxhc3ROYW1lXCIpfToge3F1ZXJ5KFwiZ1wiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Nsb2NrJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8Q2xvY2tBcHAgdGltZT17cXVlcnkoXCJ0aW1lXCIpfSAvPjtcclxuICAgICAgICAgICAgY2FzZSAnY2xvY2syJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8Q2xvY2tBcHAgdGltZT17cXVlcnkoXCJ0aW1lXCIpfSAvPjtcclxuICAgICAgICAgICAgY2FzZSAndG9kb3MnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxUb2RvQXBwIC8+O1xyXG4gICAgICAgICAgICBjYXNlICdiYWxscyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPEJhbGxzQXBwIC8+O1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0bWwucGFydGlhbChwYXRoLCB7fSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgeGFuaWEudmlldyhsYXlvdXQobWFpblZpZXcsIHVybCkpXHJcbiAgICAgICAgLmJpbmQoc3RvcmUoKSwgZHJpdmVyKTtcclxufSJdfQ==