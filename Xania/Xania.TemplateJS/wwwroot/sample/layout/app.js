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
            xania_1.fs("user.firstName"),
            " ",
            xania_1.fs("user.lastName")),
        xania_1.Xania.tag("div", { style: "clear: both;" },
            xania_1.Xania.tag("a", { href: "#", onClick: url.action('todos') }, "todos")),
        xania_1.Xania.tag("div", null,
            "view:",
            xania_1.Xania.tag("button", { onClick: url.action('index') }, "home"),
            xania_1.Xania.tag("button", { onClick: url.action('view1') }, "view 1"),
            xania_1.Xania.tag("button", { onClick: url.action('view2') }, "view 2"),
            xania_1.Xania.tag("button", { onClick: url.action('clock') }, "clock"),
            xania_1.Xania.tag("button", { onClick: url.action('todos') }, "todos"),
            xania_1.Xania.tag("button", { onClick: url.action('balls') }, "balls"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "model:",
            xania_1.Xania.tag("button", { onClick: xania_1.fs("user.firstName <- 'Ramy'") }, "Ramy"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("user.firstName <- 'Ibrahim'") }, "Ibrahim"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "time:",
            xania_1.Xania.tag("button", { onClick: xania_1.fs("time.toggle ()") }, "toggle")),
        xania_1.Xania.tag("div", { style: "padding: 10px;" }, xania_1.View.partial(view, { user: xania_1.fs("user"), time: new observables_1.Observables.Time() })));
};
function run(target, _a) {
    var html = _a.html, url = _a.url;
    var mainView = url.map(function (viewName) {
        switch (viewName) {
            case 'view1':
                return xania_1.Xania.tag("div", null,
                    "view 1: ",
                    xania_1.fs("user.firstName"),
                    " ",
                    xania_1.fs("await time"));
            case 'view2':
                return (xania_1.Xania.tag("div", null,
                    xania_1.fs("user.firstName"),
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for v in [1..(min (size (await time)) 10)]") },
                        xania_1.Xania.tag("p", { style: "margin: 0" },
                            xania_1.fs("user.firstName"),
                            ": ",
                            xania_1.fs("v"))),
                    xania_1.Xania.tag("hr", { style: "padding: 0; margin: 0;" }),
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for g in [(1 + min (size (await time)) 10)..10]") },
                        xania_1.Xania.tag("p", { style: "margin: 0" },
                            xania_1.fs("user.lastName"),
                            ": ",
                            xania_1.fs("g")))));
            case 'clock':
                return xania_1.Xania.tag(app_1.ClockApp, { time: xania_1.fs("time") });
            case 'todos':
                return xania_1.Xania.tag(todo_1.TodoApp, null);
            case 'balls':
                return xania_1.Xania.tag(app_2.BallsApp, null);
            case "":
                return html.partial("index", {});
            default:
                return html.partial(viewName, {});
        }
    });
    xania_1.Xania.view(layout(mainView, url))
        .bind(target, store());
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUE2RjtBQUM3RixzQ0FBeUM7QUFDekMsK0JBQWdDO0FBQ2hDLHNDQUF5QztBQUd6QztJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ2hCLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNyRCxJQUFJLFlBQUMsRUFBRTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDSixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUM7QUFSRCxzQkFRQztBQUVELElBQUksTUFBTSxHQUFRLFVBQUMsSUFBSSxFQUFFLEdBQWM7SUFDbkMsT0FBQTtRQUNJO1lBQUssVUFBRSxDQUFDLGdCQUFnQixDQUFDOztZQUFHLFVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBTTtRQUNyRCwyQkFBSyxLQUFLLEVBQUMsY0FBYztZQUNyQix5QkFBRyxJQUFJLEVBQUMsR0FBRyxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFXLENBQ2pEO1FBQ047O1lBRUksOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQWU7WUFDbkQsOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWlCO1lBQ3JELDhCQUFRLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFpQjtZQUNyRCw4QkFBUSxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBZ0I7WUFDcEQsOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQWdCO1lBQ3BELDhCQUFRLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFnQjs7WUFHcEQsOEJBQVEsT0FBTyxFQUFFLFVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxXQUFlO1lBQzlELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsNkJBQTZCLENBQUMsY0FBa0I7O1lBR3BFLDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUMsYUFBaUIsQ0FDcEQ7UUFDTiwyQkFBSyxLQUFLLEVBQUMsZ0JBQWdCLElBQ3RCLFlBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FDckUsQ0FDSjtBQXhCTixDQXdCTSxDQUFDO0FBR1gsYUFBb0IsTUFBTSxFQUFFLEVBQWE7UUFBWCxjQUFJLEVBQUUsWUFBRztJQUNuQyxJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQUEsUUFBUTtRQUMzQixNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2YsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQzs7b0JBQWMsVUFBRSxDQUFDLGdCQUFnQixDQUFDOztvQkFBRyxVQUFFLENBQUMsWUFBWSxDQUFDLENBQU8sQ0FBQztZQUN4RSxLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLENBQ0g7b0JBQ0ssVUFBRSxDQUFDLGdCQUFnQixDQUFDO29CQUNyQixrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyw0Q0FBNEMsQ0FBQzt3QkFDM0QseUJBQUcsS0FBSyxFQUFDLFdBQVc7NEJBQUUsVUFBRSxDQUFDLGdCQUFnQixDQUFDOzs0QkFBSSxVQUFFLENBQUMsR0FBRyxDQUFDLENBQUssQ0FDcEQ7b0JBQ1YsMEJBQUksS0FBSyxFQUFDLHdCQUF3QixHQUFHO29CQUNyQyxrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxpREFBaUQsQ0FBQzt3QkFDaEUseUJBQUcsS0FBSyxFQUFDLFdBQVc7NEJBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQzs7NEJBQUksVUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFLLENBQ25ELENBQ1IsQ0FDVCxDQUFDO1lBQ04sS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxjQUFRLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBSSxDQUFDO1lBQzFDLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsa0JBQUMsY0FBTyxPQUFHLENBQUM7WUFDdkIsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxjQUFRLE9BQUcsQ0FBQztZQUN4QixLQUFLLEVBQUU7Z0JBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDO2dCQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMxQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxhQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDNUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBQy9CLENBQUM7QUFqQ0Qsa0JBaUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmltcG9ydCB7IFhhbmlhIGFzIHhhbmlhLCBGb3JFYWNoLCBmcywgVmlldywgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uLy4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSBcIi4vLi4vY2xvY2svYXBwXCJcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuL3RvZG9cIlxyXG5pbXBvcnQgeyBCYWxsc0FwcCB9IGZyb20gXCIuLy4uL2JhbGxzL2FwcFwiXHJcbmltcG9ydCB7IFVybEhlbHBlciB9IGZyb20gXCIuLi8uLi9zcmMvbXZjXCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdG9yZSgpIHtcclxuICAgIHJldHVybiBuZXcgUmUuU3RvcmUoe1xyXG4gICAgICAgIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCksXHJcbiAgICAgICAgdXNlcjogeyBmaXJzdE5hbWU6IFwiSWJyYWhpbVwiLCBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIiB9LFxyXG4gICAgICAgIHNpemUodHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoKHRzICUgMTAwMCkgLyA1MCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgW01hdGhdKTtcclxufVxyXG5cclxudmFyIGxheW91dDogYW55ID0gKHZpZXcsIHVybDogVXJsSGVscGVyKSA9PlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8aDE+e2ZzKFwidXNlci5maXJzdE5hbWVcIil9IHtmcyhcInVzZXIubGFzdE5hbWVcIil9PC9oMT5cclxuICAgICAgICA8ZGl2IHN0eWxlPVwiY2xlYXI6IGJvdGg7XCI+XHJcbiAgICAgICAgICAgIDxhIGhyZWY9XCIjXCIgb25DbGljaz17dXJsLmFjdGlvbigndG9kb3MnKX0+dG9kb3M8L2E+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgdmlldzpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt1cmwuYWN0aW9uKCdpbmRleCcpfT5ob21lPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbigndmlldzEnKX0+dmlldyAxPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbigndmlldzInKX0+dmlldyAyPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbignY2xvY2snKX0+Y2xvY2s8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt1cmwuYWN0aW9uKCd0b2RvcycpfT50b2RvczwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ2JhbGxzJyl9PmJhbGxzPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICBtb2RlbDpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInVzZXIuZmlyc3ROYW1lIDwtICdSYW15J1wiKX0+UmFteTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwidXNlci5maXJzdE5hbWUgPC0gJ0licmFoaW0nXCIpfT5JYnJhaGltPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICB0aW1lOlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwidGltZS50b2dnbGUgKClcIil9PnRvZ2dsZTwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAxMHB4O1wiPlxyXG4gICAgICAgICAgICB7Vmlldy5wYXJ0aWFsKHZpZXcsIHsgdXNlcjogZnMoXCJ1c2VyXCIpLCB0aW1lOiBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpIH0pfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+O1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBydW4odGFyZ2V0LCB7IGh0bWwsIHVybCB9KSB7XHJcbiAgICB2YXIgbWFpblZpZXcgPSB1cmwubWFwKHZpZXdOYW1lID0+IHtcclxuICAgICAgICBzd2l0Y2ggKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXcxJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PnZpZXcgMToge2ZzKFwidXNlci5maXJzdE5hbWVcIil9IHtmcyhcImF3YWl0IHRpbWVcIil9PC9kaXY+O1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3Mic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmcyhcInVzZXIuZmlyc3ROYW1lXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciB2IGluIFsxLi4obWluIChzaXplIChhd2FpdCB0aW1lKSkgMTApXVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogMFwiPntmcyhcInVzZXIuZmlyc3ROYW1lXCIpfToge2ZzKFwidlwiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhyIHN0eWxlPVwicGFkZGluZzogMDsgbWFyZ2luOiAwO1wiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIGcgaW4gWygxICsgbWluIChzaXplIChhd2FpdCB0aW1lKSkgMTApLi4xMF1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDBcIj57ZnMoXCJ1c2VyLmxhc3ROYW1lXCIpfToge2ZzKFwiZ1wiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Nsb2NrJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8Q2xvY2tBcHAgdGltZT17ZnMoXCJ0aW1lXCIpfSAvPjtcclxuICAgICAgICAgICAgY2FzZSAndG9kb3MnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxUb2RvQXBwIC8+O1xyXG4gICAgICAgICAgICBjYXNlICdiYWxscyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPEJhbGxzQXBwIC8+O1xyXG4gICAgICAgICAgICBjYXNlIFwiXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaHRtbC5wYXJ0aWFsKFwiaW5kZXhcIiwge30pO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0bWwucGFydGlhbCh2aWV3TmFtZSwge30pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHhhbmlhLnZpZXcobGF5b3V0KG1haW5WaWV3LCB1cmwpKVxyXG4gICAgICAgIC5iaW5kKHRhcmdldCwgc3RvcmUoKSk7XHJcbn0iXX0=