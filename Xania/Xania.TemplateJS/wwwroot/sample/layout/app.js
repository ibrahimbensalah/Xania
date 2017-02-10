"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
var clock_1 = require("./clock");
var todo_1 = require("./todo");
var index_1 = require("./../motion/index");
function bind(target) {
    var view = new observables_1.Observables.Observable("todos");
    var store = new xania_1.Reactive.Store({
        view: view,
        time: new observables_1.Observables.Time(),
        user: { firstName: "Ibrahim", lastName: "ben Salah" },
        route: function (viewName) {
            this.view.onNext(viewName);
        },
        size: function (ts) {
            return Math.floor((ts % 1000) / 50);
        }
    }, [Math]);
    var mainView = view.map(function (viewName) {
        switch (viewName) {
            case 'view1':
                return xania_1.Xania.tag(xania_1.Animate, null,
                    xania_1.Xania.tag("div", null,
                        "view 1: ",
                        xania_1.fs("user.firstName"),
                        " ",
                        xania_1.fs("await time")));
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
            case 'motion':
                return xania_1.Xania.tag(index_1.MotionApp, null);
        }
    });
    xania_1.Xania.view(layout(mainView)).bind(target, store);
}
exports.bind = bind;
var layout = function (view) {
    return xania_1.Xania.tag("div", null,
        xania_1.Xania.tag("h1", null,
            xania_1.fs("user.firstName"),
            " ",
            xania_1.fs("user.lastName"),
            " (",
            xania_1.fs("await view"),
            ")"),
        xania_1.Xania.tag("div", null,
            "view:",
            xania_1.Xania.tag("button", { onClick: xania_1.fs("route 'view1'") }, "view 1"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("route 'view2'") }, "view 2"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("route 'clock'") }, "clock"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("route 'todos'") }, "todos"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("route 'motion'") }, "motion"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "model:",
            xania_1.Xania.tag("button", { onClick: xania_1.fs("user.firstName <- 'Ramy'") }, "Ramy"),
            xania_1.Xania.tag("button", { onClick: xania_1.fs("user.firstName <- 'Ibrahim'") }, "Ibrahim"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "time:",
            xania_1.Xania.tag("button", { onClick: xania_1.fs("time.toggle ()") }, "toggle")),
        xania_1.Xania.tag("div", { style: "padding: 10px;" }, xania_1.View.partial(view, { user: xania_1.fs("user"), time: new observables_1.Observables.Time() })));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2xheW91dC9hcHAudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxREFBbUQ7QUFFbkQseUNBQXNHO0FBQ3RHLGlDQUFrQztBQUNsQywrQkFBZ0M7QUFDaEMsMkNBQTZDO0FBRTdDLGNBQXFCLE1BQVk7SUFDN0IsSUFBSSxJQUFJLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQyxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ3JCLElBQUksTUFBQTtRQUNKLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNyRCxLQUFLLFlBQUMsUUFBUTtZQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFDRCxJQUFJLFlBQUMsRUFBRTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDSixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUVYLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBQSxRQUFRO1FBQzVCLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDZixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGVBQU87b0JBQUM7O3dCQUFjLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzs7d0JBQUcsVUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFPLENBQVUsQ0FBQztZQUMzRixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLENBQ0g7b0JBQ0ssVUFBRSxDQUFDLGdCQUFnQixDQUFDO29CQUNyQixrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyw0Q0FBNEMsQ0FBQzt3QkFDM0QseUJBQUcsS0FBSyxFQUFDLFdBQVc7NEJBQUUsVUFBRSxDQUFDLGdCQUFnQixDQUFDOzs0QkFBSSxVQUFFLENBQUMsR0FBRyxDQUFDLENBQUssQ0FDcEQ7b0JBQ1YsMEJBQUksS0FBSyxFQUFDLHdCQUF3QixHQUFHO29CQUNyQyxrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxpREFBaUQsQ0FBQzt3QkFDaEUseUJBQUcsS0FBSyxFQUFDLFdBQVc7NEJBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQzs7NEJBQUksVUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFLLENBQ25ELENBQ1IsQ0FDVCxDQUFDO1lBQ04sS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxnQkFBUSxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsTUFBTSxDQUFDLEdBQUksQ0FBQztZQUMxQyxLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGNBQU8sT0FBRyxDQUFDO1lBQ3ZCLEtBQUssUUFBUTtnQkFDVCxNQUFNLENBQUMsa0JBQUMsaUJBQVMsT0FBRyxDQUFDO1FBQzdCLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILGFBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBekNELG9CQXlDQztBQUVELElBQUksTUFBTSxHQUFRLFVBQUEsSUFBSTtJQUNsQixPQUFBO1FBQ0k7WUFBSyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7O1lBQUcsVUFBRSxDQUFDLGVBQWUsQ0FBQzs7WUFBSSxVQUFFLENBQUMsWUFBWSxDQUFDO2dCQUFPO1FBQzFFOztZQUVJLDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLGFBQWlCO1lBQ3JELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLGFBQWlCO1lBQ3JELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLFlBQWdCO1lBQ3BELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLFlBQWdCO1lBQ3BELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUMsYUFBaUI7O1lBR3RELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsMEJBQTBCLENBQUMsV0FBZTtZQUM5RCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLDZCQUE2QixDQUFDLGNBQWtCOztZQUdwRSw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGdCQUFnQixDQUFDLGFBQWlCLENBQ3BEO1FBQ04sMkJBQUssS0FBSyxFQUFDLGdCQUFnQixJQUN0QixZQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxVQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQ3JFLENBQ0o7QUFwQk4sQ0FvQk0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4uLy4uL3NyYy9vYnNlcnZhYmxlc1wiXHJcblxyXG5pbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgRm9yRWFjaCwgQW5pbWF0ZSwgZnMsIFZpZXcsIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBDbG9ja0FwcCB9IGZyb20gXCIuL2Nsb2NrXCJcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuL3RvZG9cIlxyXG5pbXBvcnQgeyBNb3Rpb25BcHAgfSBmcm9tIFwiLi8uLi9tb3Rpb24vaW5kZXhcIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQodGFyZ2V0OiBOb2RlKSB7XHJcbiAgICB2YXIgdmlldyA9IG5ldyBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlKFwidG9kb3NcIik7XHJcbiAgICB2YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUoe1xyXG4gICAgICAgIHZpZXcsXHJcbiAgICAgICAgdGltZTogbmV3IE9ic2VydmFibGVzLlRpbWUoKSxcclxuICAgICAgICB1c2VyOiB7IGZpcnN0TmFtZTogXCJJYnJhaGltXCIsIGxhc3ROYW1lOiBcImJlbiBTYWxhaFwiIH0sXHJcbiAgICAgICAgcm91dGUodmlld05hbWUpIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3Lm9uTmV4dCh2aWV3TmFtZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaXplKHRzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKCh0cyAlIDEwMDApIC8gNTApO1xyXG4gICAgICAgIH1cclxuICAgIH0sIFtNYXRoXSk7XHJcblxyXG4gICAgdmFyIG1haW5WaWV3ID0gdmlldy5tYXAodmlld05hbWUgPT4ge1xyXG4gICAgICAgIHN3aXRjaCAodmlld05hbWUpIHtcclxuICAgICAgICAgICAgY2FzZSAndmlldzEnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxBbmltYXRlPjxkaXY+dmlldyAxOiB7ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX0ge2ZzKFwiYXdhaXQgdGltZVwiKX08L2Rpdj48L0FuaW1hdGU+O1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3Mic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmcyhcInVzZXIuZmlyc3ROYW1lXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciB2IGluIFsxLi4obWluIChzaXplIChhd2FpdCB0aW1lKSkgMTApXVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogMFwiPntmcyhcInVzZXIuZmlyc3ROYW1lXCIpfToge2ZzKFwidlwiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhyIHN0eWxlPVwicGFkZGluZzogMDsgbWFyZ2luOiAwO1wiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIGcgaW4gWygxICsgbWluIChzaXplIChhd2FpdCB0aW1lKSkgMTApLi4xMF1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDBcIj57ZnMoXCJ1c2VyLmxhc3ROYW1lXCIpfToge2ZzKFwiZ1wiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Nsb2NrJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8Q2xvY2tBcHAgdGltZT17ZnMoXCJ0aW1lXCIpfSAvPjtcclxuICAgICAgICAgICAgY2FzZSAndG9kb3MnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxUb2RvQXBwIC8+O1xyXG4gICAgICAgICAgICBjYXNlICdtb3Rpb24nOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxNb3Rpb25BcHAgLz47XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgeGFuaWEudmlldyhsYXlvdXQobWFpblZpZXcpKS5iaW5kKHRhcmdldCwgc3RvcmUpO1xyXG59XHJcblxyXG52YXIgbGF5b3V0OiBhbnkgPSB2aWV3ID0+XHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxoMT57ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX0ge2ZzKFwidXNlci5sYXN0TmFtZVwiKX0gKHtmcyhcImF3YWl0IHZpZXdcIil9KTwvaDE+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgdmlldzpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInJvdXRlICd2aWV3MSdcIil9PnZpZXcgMTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ3ZpZXcyJ1wiKX0+dmlldyAyPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJyb3V0ZSAnY2xvY2snXCIpfT5jbG9jazwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ3RvZG9zJ1wiKX0+dG9kb3M8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInJvdXRlICdtb3Rpb24nXCIpfT5tb3Rpb248L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIG1vZGVsOlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwidXNlci5maXJzdE5hbWUgPC0gJ1JhbXknXCIpfT5SYW15PC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnSWJyYWhpbSdcIil9PklicmFoaW08L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIHRpbWU6XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJ0aW1lLnRvZ2dsZSAoKVwiKX0+dG9nZ2xlPC9idXR0b24+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDEwcHg7XCI+XHJcbiAgICAgICAgICAgIHtWaWV3LnBhcnRpYWwodmlldywgeyB1c2VyOiBmcyhcInVzZXJcIiksIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCkgfSl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj47XHJcblxyXG4iXX0=