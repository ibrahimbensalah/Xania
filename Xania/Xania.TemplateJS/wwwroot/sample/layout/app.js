"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
var clock_1 = require("./clock");
var todo_1 = require("./todo");
var app_1 = require("./../balls/app");
var menu = new observables_1.Observables.Observable("balls");
function view() {
    var mainView = menu.map(function (viewName) {
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
                return xania_1.Xania.tag(clock_1.ClockApp, { time: xania_1.fs("time") });
            case 'todos':
                return xania_1.Xania.tag(todo_1.TodoApp, null);
            case 'balls':
                return xania_1.Xania.tag(app_1.BallsApp, null);
        }
    });
    return xania_1.Xania.view(layout(mainView));
}
exports.view = view;
function store() {
    return new xania_1.Reactive.Store({
        menu: menu,
        time: new observables_1.Observables.Time(),
        user: { firstName: "Ibrahim", lastName: "ben Salah" },
        route: function (viewName) {
            this.menu.onNext(viewName);
        },
        size: function (ts) {
            return Math.floor((ts % 1000) / 50);
        }
    }, [Math]);
}
exports.store = store;
var layout = function (view) {
    return xania_1.Xania.tag("div", null,
        xania_1.Xania.tag("h1", null,
            xania_1.fs("user.firstName"),
            " ",
            xania_1.fs("user.lastName"),
            " (",
            xania_1.fs("await menu"),
            ")"),
        xania_1.Xania.tag("div", null,
            "view:",
            xania_1.Xania.tag("button", { onClick: xania_1.fs("route 'view1'") }, "view 1"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("route 'view2'") }, "view 2"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("route 'clock'") }, "clock"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("route 'todos'") }, "todos"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("route 'balls'") }, "balls"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "model:",
            xania_1.Xania.tag("button", { onClick: xania_1.fs("user.firstName <- 'Ramy'") }, "Ramy"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("user.firstName <- 'Ibrahim'") }, "Ibrahim"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "time:",
            xania_1.Xania.tag("button", { onClick: xania_1.fs("time.toggle ()") }, "toggle")),
        xania_1.Xania.tag("div", { style: "padding: 10px;" }, xania_1.View.partial(view, { user: xania_1.fs("user"), time: new observables_1.Observables.Time() })));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUE2RjtBQUM3RixpQ0FBa0M7QUFDbEMsK0JBQWdDO0FBQ2hDLHNDQUF5QztBQUV6QyxJQUFJLElBQUksR0FBRyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRS9DO0lBQ0ksSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFBLFFBQVE7UUFDNUIsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNmLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUM7O29CQUFjLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzs7b0JBQUcsVUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFPLENBQUM7WUFDeEUsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxDQUNIO29CQUNLLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztvQkFDckIsa0JBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsNENBQTRDLENBQUM7d0JBQzNELHlCQUFHLEtBQUssRUFBQyxXQUFXOzRCQUFFLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzs7NEJBQUksVUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFLLENBQ3BEO29CQUNWLDBCQUFJLEtBQUssRUFBQyx3QkFBd0IsR0FBRztvQkFDckMsa0JBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsaURBQWlELENBQUM7d0JBQ2hFLHlCQUFHLEtBQUssRUFBQyxXQUFXOzRCQUFFLFVBQUUsQ0FBQyxlQUFlLENBQUM7OzRCQUFJLFVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBSyxDQUNuRCxDQUNSLENBQ1QsQ0FBQztZQUNOLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsa0JBQUMsZ0JBQVEsSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFJLENBQUM7WUFDMUMsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxjQUFPLE9BQUcsQ0FBQztZQUN2QixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGNBQVEsT0FBRyxDQUFDO1FBQzVCLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUE1QkQsb0JBNEJDO0FBRUQ7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQztRQUNoQixJQUFJLE1BQUE7UUFDSixJQUFJLEVBQUUsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRTtRQUM1QixJQUFJLEVBQUUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUU7UUFDckQsS0FBSyxZQUFDLFFBQVE7WUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBQ0QsSUFBSSxZQUFDLEVBQUU7WUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN4QyxDQUFDO0tBQ0osRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDZixDQUFDO0FBWkQsc0JBWUM7QUFFRCxJQUFJLE1BQU0sR0FBUSxVQUFBLElBQUk7SUFDbEIsT0FBQTtRQUNJO1lBQUssVUFBRSxDQUFDLGdCQUFnQixDQUFDOztZQUFHLFVBQUUsQ0FBQyxlQUFlLENBQUM7O1lBQUksVUFBRSxDQUFDLFlBQVksQ0FBQztnQkFBTztRQUMxRTs7WUFFSSw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxhQUFpQjtZQUNyRCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxhQUFpQjtZQUNyRCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxZQUFnQjtZQUNwRCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxZQUFnQjtZQUNwRCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxZQUFnQjs7WUFHcEQsOEJBQVEsT0FBTyxFQUFFLFVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxXQUFlO1lBQzlELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsNkJBQTZCLENBQUMsY0FBa0I7O1lBR3BFLDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUMsYUFBaUIsQ0FDcEQ7UUFDTiwyQkFBSyxLQUFLLEVBQUMsZ0JBQWdCLElBQ3RCLFlBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FDckUsQ0FDSjtBQXBCTixDQW9CTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmltcG9ydCB7IFhhbmlhIGFzIHhhbmlhLCBGb3JFYWNoLCBmcywgVmlldywgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uLy4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSBcIi4vY2xvY2tcIlxyXG5pbXBvcnQgeyBUb2RvQXBwIH0gZnJvbSBcIi4vdG9kb1wiXHJcbmltcG9ydCB7IEJhbGxzQXBwIH0gZnJvbSBcIi4vLi4vYmFsbHMvYXBwXCJcclxuXHJcbnZhciBtZW51ID0gbmV3IE9ic2VydmFibGVzLk9ic2VydmFibGUoXCJiYWxsc1wiKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB2aWV3KCkge1xyXG4gICAgdmFyIG1haW5WaWV3ID0gbWVudS5tYXAodmlld05hbWUgPT4ge1xyXG4gICAgICAgIHN3aXRjaCAodmlld05hbWUpIHtcclxuICAgICAgICAgICAgY2FzZSAndmlldzEnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+dmlldyAxOiB7ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX0ge2ZzKFwiYXdhaXQgdGltZVwiKX08L2Rpdj47XHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXcyJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge2ZzKFwidXNlci5maXJzdE5hbWVcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHYgaW4gWzEuLihtaW4gKHNpemUgKGF3YWl0IHRpbWUpKSAxMCldXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOiAwXCI+e2ZzKFwidXNlci5maXJzdE5hbWVcIil9OiB7ZnMoXCJ2XCIpfTwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aHIgc3R5bGU9XCJwYWRkaW5nOiAwOyBtYXJnaW46IDA7XCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgZyBpbiBbKDEgKyBtaW4gKHNpemUgKGF3YWl0IHRpbWUpKSAxMCkuLjEwXVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogMFwiPntmcyhcInVzZXIubGFzdE5hbWVcIil9OiB7ZnMoXCJnXCIpfTwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY2FzZSAnY2xvY2snOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxDbG9ja0FwcCB0aW1lPXtmcyhcInRpbWVcIil9IC8+O1xyXG4gICAgICAgICAgICBjYXNlICd0b2Rvcyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPFRvZG9BcHAgLz47XHJcbiAgICAgICAgICAgIGNhc2UgJ2JhbGxzJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8QmFsbHNBcHAgLz47XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHhhbmlhLnZpZXcobGF5b3V0KG1haW5WaWV3KSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdG9yZSgpIHtcclxuICAgIHJldHVybiBuZXcgUmUuU3RvcmUoe1xyXG4gICAgICAgIG1lbnUsXHJcbiAgICAgICAgdGltZTogbmV3IE9ic2VydmFibGVzLlRpbWUoKSxcclxuICAgICAgICB1c2VyOiB7IGZpcnN0TmFtZTogXCJJYnJhaGltXCIsIGxhc3ROYW1lOiBcImJlbiBTYWxhaFwiIH0sXHJcbiAgICAgICAgcm91dGUodmlld05hbWUpIHtcclxuICAgICAgICAgICAgdGhpcy5tZW51Lm9uTmV4dCh2aWV3TmFtZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaXplKHRzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKCh0cyAlIDEwMDApIC8gNTApO1xyXG4gICAgICAgIH1cclxuICAgIH0sIFtNYXRoXSk7XHJcbn1cclxuXHJcbnZhciBsYXlvdXQ6IGFueSA9IHZpZXcgPT5cclxuICAgIDxkaXY+XHJcbiAgICAgICAgPGgxPntmcyhcInVzZXIuZmlyc3ROYW1lXCIpfSB7ZnMoXCJ1c2VyLmxhc3ROYW1lXCIpfSAoe2ZzKFwiYXdhaXQgbWVudVwiKX0pPC9oMT5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICB2aWV3OlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ3ZpZXcxJ1wiKX0+dmlldyAxPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJyb3V0ZSAndmlldzInXCIpfT52aWV3IDI8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInJvdXRlICdjbG9jaydcIil9PmNsb2NrPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJyb3V0ZSAndG9kb3MnXCIpfT50b2RvczwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ2JhbGxzJ1wiKX0+YmFsbHM8L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIG1vZGVsOlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwidXNlci5maXJzdE5hbWUgPC0gJ1JhbXknXCIpfT5SYW15PC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnSWJyYWhpbSdcIil9PklicmFoaW08L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIHRpbWU6XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJ0aW1lLnRvZ2dsZSAoKVwiKX0+dG9nZ2xlPC9idXR0b24+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDEwcHg7XCI+XHJcbiAgICAgICAgICAgIHtWaWV3LnBhcnRpYWwodmlldywgeyB1c2VyOiBmcyhcInVzZXJcIiksIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCkgfSl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj47XHJcblxyXG4iXX0=