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
function run(target, routeArgs) {
    view().bind(target, store());
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUE2RjtBQUM3RixpQ0FBa0M7QUFDbEMsK0JBQWdDO0FBQ2hDLHNDQUF5QztBQUV6QyxJQUFJLElBQUksR0FBRyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRS9DO0lBQ0ksSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFBLFFBQVE7UUFDNUIsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNmLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUM7O29CQUFjLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzs7b0JBQUcsVUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFPLENBQUM7WUFDeEUsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxDQUNIO29CQUNLLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztvQkFDckIsa0JBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsNENBQTRDLENBQUM7d0JBQzNELHlCQUFHLEtBQUssRUFBQyxXQUFXOzRCQUFFLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzs7NEJBQUksVUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFLLENBQ3BEO29CQUNWLDBCQUFJLEtBQUssRUFBQyx3QkFBd0IsR0FBRztvQkFDckMsa0JBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsaURBQWlELENBQUM7d0JBQ2hFLHlCQUFHLEtBQUssRUFBQyxXQUFXOzRCQUFFLFVBQUUsQ0FBQyxlQUFlLENBQUM7OzRCQUFJLFVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBSyxDQUNuRCxDQUNSLENBQ1QsQ0FBQztZQUNOLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsa0JBQUMsZ0JBQVEsSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFJLENBQUM7WUFDMUMsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxjQUFPLE9BQUcsQ0FBQztZQUN2QixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGNBQVEsT0FBRyxDQUFDO1FBQzVCLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILE1BQU0sQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUE1QkQsb0JBNEJDO0FBRUQ7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQztRQUNoQixJQUFJLE1BQUE7UUFDSixJQUFJLEVBQUUsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRTtRQUM1QixJQUFJLEVBQUUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUU7UUFDckQsS0FBSyxZQUFDLFFBQVE7WUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBQ0QsSUFBSSxZQUFDLEVBQUU7WUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN4QyxDQUFDO0tBQ0osRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDZixDQUFDO0FBWkQsc0JBWUM7QUFFRCxJQUFJLE1BQU0sR0FBUSxVQUFBLElBQUk7SUFDbEIsT0FBQTtRQUNJO1lBQUssVUFBRSxDQUFDLGdCQUFnQixDQUFDOztZQUFHLFVBQUUsQ0FBQyxlQUFlLENBQUM7O1lBQUksVUFBRSxDQUFDLFlBQVksQ0FBQztnQkFBTztRQUMxRTs7WUFFSSw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxhQUFpQjtZQUNyRCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxhQUFpQjtZQUNyRCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxZQUFnQjtZQUNwRCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxZQUFnQjtZQUNwRCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxZQUFnQjs7WUFHcEQsOEJBQVEsT0FBTyxFQUFFLFVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxXQUFlO1lBQzlELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsNkJBQTZCLENBQUMsY0FBa0I7O1lBR3BFLDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUMsYUFBaUIsQ0FDcEQ7UUFDTiwyQkFBSyxLQUFLLEVBQUMsZ0JBQWdCLElBQ3RCLFlBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FDckUsQ0FDSjtBQXBCTixDQW9CTSxDQUFDO0FBR1gsYUFBb0IsTUFBTSxFQUFFLFNBQVM7SUFDakMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBQ2pDLENBQUM7QUFGRCxrQkFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4uLy4uL3NyYy9vYnNlcnZhYmxlc1wiXHJcblxyXG5pbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgRm9yRWFjaCwgZnMsIFZpZXcsIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBDbG9ja0FwcCB9IGZyb20gXCIuL2Nsb2NrXCJcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuL3RvZG9cIlxyXG5pbXBvcnQgeyBCYWxsc0FwcCB9IGZyb20gXCIuLy4uL2JhbGxzL2FwcFwiXHJcblxyXG52YXIgbWVudSA9IG5ldyBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlKFwiYmFsbHNcIik7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdmlldygpIHtcclxuICAgIHZhciBtYWluVmlldyA9IG1lbnUubWFwKHZpZXdOYW1lID0+IHtcclxuICAgICAgICBzd2l0Y2ggKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXcxJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PnZpZXcgMToge2ZzKFwidXNlci5maXJzdE5hbWVcIil9IHtmcyhcImF3YWl0IHRpbWVcIil9PC9kaXY+O1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3Mic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmcyhcInVzZXIuZmlyc3ROYW1lXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciB2IGluIFsxLi4obWluIChzaXplIChhd2FpdCB0aW1lKSkgMTApXVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogMFwiPntmcyhcInVzZXIuZmlyc3ROYW1lXCIpfToge2ZzKFwidlwiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhyIHN0eWxlPVwicGFkZGluZzogMDsgbWFyZ2luOiAwO1wiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIGcgaW4gWygxICsgbWluIChzaXplIChhd2FpdCB0aW1lKSkgMTApLi4xMF1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDBcIj57ZnMoXCJ1c2VyLmxhc3ROYW1lXCIpfToge2ZzKFwiZ1wiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Nsb2NrJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8Q2xvY2tBcHAgdGltZT17ZnMoXCJ0aW1lXCIpfSAvPjtcclxuICAgICAgICAgICAgY2FzZSAndG9kb3MnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxUb2RvQXBwIC8+O1xyXG4gICAgICAgICAgICBjYXNlICdiYWxscyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPEJhbGxzQXBwIC8+O1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB4YW5pYS52aWV3KGxheW91dChtYWluVmlldykpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RvcmUoKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlLlN0b3JlKHtcclxuICAgICAgICBtZW51LFxyXG4gICAgICAgIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCksXHJcbiAgICAgICAgdXNlcjogeyBmaXJzdE5hbWU6IFwiSWJyYWhpbVwiLCBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIiB9LFxyXG4gICAgICAgIHJvdXRlKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWVudS5vbk5leHQodmlld05hbWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2l6ZSh0cykge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcigodHMgJSAxMDAwKSAvIDUwKTtcclxuICAgICAgICB9XHJcbiAgICB9LCBbTWF0aF0pO1xyXG59XHJcblxyXG52YXIgbGF5b3V0OiBhbnkgPSB2aWV3ID0+XHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxoMT57ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX0ge2ZzKFwidXNlci5sYXN0TmFtZVwiKX0gKHtmcyhcImF3YWl0IG1lbnVcIil9KTwvaDE+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgdmlldzpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInJvdXRlICd2aWV3MSdcIil9PnZpZXcgMTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ3ZpZXcyJ1wiKX0+dmlldyAyPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJyb3V0ZSAnY2xvY2snXCIpfT5jbG9jazwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ3RvZG9zJ1wiKX0+dG9kb3M8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInJvdXRlICdiYWxscydcIil9PmJhbGxzPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICBtb2RlbDpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInVzZXIuZmlyc3ROYW1lIDwtICdSYW15J1wiKX0+UmFteTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwidXNlci5maXJzdE5hbWUgPC0gJ0licmFoaW0nXCIpfT5JYnJhaGltPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICB0aW1lOlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwidGltZS50b2dnbGUgKClcIil9PnRvZ2dsZTwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAxMHB4O1wiPlxyXG4gICAgICAgICAgICB7Vmlldy5wYXJ0aWFsKHZpZXcsIHsgdXNlcjogZnMoXCJ1c2VyXCIpLCB0aW1lOiBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpIH0pfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+O1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBydW4odGFyZ2V0LCByb3V0ZUFyZ3MpIHtcclxuICAgIHZpZXcoKS5iaW5kKHRhcmdldCwgc3RvcmUoKSk7XHJcbn0iXX0=