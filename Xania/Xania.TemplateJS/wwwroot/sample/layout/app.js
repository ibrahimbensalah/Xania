"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
var clock_1 = require("./clock");
var todo_1 = require("./todo");
var index_1 = require("./../motion/index");
function bind(target) {
    var view = new observables_1.Observables.Observable("motion");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2xheW91dC9hcHAudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxREFBbUQ7QUFFbkQseUNBQXNHO0FBQ3RHLGlDQUFrQztBQUNsQywrQkFBZ0M7QUFDaEMsMkNBQTZDO0FBRTdDLGNBQXFCLE1BQVk7SUFDN0IsSUFBSSxJQUFJLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoRCxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ3JCLElBQUksTUFBQTtRQUNKLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNyRCxLQUFLLFlBQUMsUUFBUTtZQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFDRCxJQUFJLFlBQUMsRUFBRTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDSixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUVYLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBQSxRQUFRO1FBQzVCLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDZixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGVBQU87b0JBQUM7O3dCQUFjLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzs7d0JBQUcsVUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFPLENBQVUsQ0FBQztZQUMzRixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLENBQ0g7b0JBQ0ssVUFBRSxDQUFDLGdCQUFnQixDQUFDO29CQUNyQixrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyw0Q0FBNEMsQ0FBQzt3QkFDM0QseUJBQUcsS0FBSyxFQUFDLFdBQVc7NEJBQUUsVUFBRSxDQUFDLGdCQUFnQixDQUFDOzs0QkFBSSxVQUFFLENBQUMsR0FBRyxDQUFDLENBQUssQ0FDcEQ7b0JBQ1YsMEJBQUksS0FBSyxFQUFDLHdCQUF3QixHQUFHO29CQUNyQyxrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxpREFBaUQsQ0FBQzt3QkFDaEUseUJBQUcsS0FBSyxFQUFDLFdBQVc7NEJBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQzs7NEJBQUksVUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFLLENBQ25ELENBQ1IsQ0FDVCxDQUFDO1lBQ04sS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxnQkFBUSxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsTUFBTSxDQUFDLEdBQUksQ0FBQztZQUMxQyxLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGNBQU8sT0FBRyxDQUFDO1lBQ3ZCLEtBQUssUUFBUTtnQkFDVCxNQUFNLENBQUMsa0JBQUMsaUJBQVMsT0FBRyxDQUFDO1FBQzdCLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILGFBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyRCxDQUFDO0FBekNELG9CQXlDQztBQUVELElBQUksTUFBTSxHQUFRLFVBQUEsSUFBSTtJQUNsQixPQUFBO1FBQ0k7WUFBSyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7O1lBQUcsVUFBRSxDQUFDLGVBQWUsQ0FBQzs7WUFBSSxVQUFFLENBQUMsWUFBWSxDQUFDO2dCQUFPO1FBQzFFOztZQUVJLDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLGFBQWlCO1lBQ3JELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLGFBQWlCO1lBQ3JELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLFlBQWdCO1lBQ3BELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLFlBQWdCO1lBQ3BELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUMsYUFBaUI7O1lBR3RELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsMEJBQTBCLENBQUMsV0FBZTtZQUM5RCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLDZCQUE2QixDQUFDLGNBQWtCOztZQUdwRSw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGdCQUFnQixDQUFDLGFBQWlCLENBQ3BEO1FBQ04sMkJBQUssS0FBSyxFQUFDLGdCQUFnQixJQUN0QixZQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxVQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQ3JFLENBQ0o7QUFwQk4sQ0FvQk0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4uLy4uL3NyYy9vYnNlcnZhYmxlc1wiXHJcblxyXG5pbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgRm9yRWFjaCwgQW5pbWF0ZSwgZnMsIFZpZXcsIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBDbG9ja0FwcCB9IGZyb20gXCIuL2Nsb2NrXCJcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuL3RvZG9cIlxyXG5pbXBvcnQgeyBNb3Rpb25BcHAgfSBmcm9tIFwiLi8uLi9tb3Rpb24vaW5kZXhcIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQodGFyZ2V0OiBOb2RlKSB7XHJcbiAgICB2YXIgdmlldyA9IG5ldyBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlKFwibW90aW9uXCIpO1xyXG4gICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHtcclxuICAgICAgICB2aWV3LFxyXG4gICAgICAgIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCksXHJcbiAgICAgICAgdXNlcjogeyBmaXJzdE5hbWU6IFwiSWJyYWhpbVwiLCBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIiB9LFxyXG4gICAgICAgIHJvdXRlKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5vbk5leHQodmlld05hbWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2l6ZSh0cykge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcigodHMgJSAxMDAwKSAvIDUwKTtcclxuICAgICAgICB9XHJcbiAgICB9LCBbTWF0aF0pO1xyXG5cclxuICAgIHZhciBtYWluVmlldyA9IHZpZXcubWFwKHZpZXdOYW1lID0+IHtcclxuICAgICAgICBzd2l0Y2ggKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXcxJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8QW5pbWF0ZT48ZGl2PnZpZXcgMToge2ZzKFwidXNlci5maXJzdE5hbWVcIil9IHtmcyhcImF3YWl0IHRpbWVcIil9PC9kaXY+PC9BbmltYXRlPjtcclxuICAgICAgICAgICAgY2FzZSAndmlldzInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgdiBpbiBbMS4uKG1pbiAoc2l6ZSAoYXdhaXQgdGltZSkpIDEwKV1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDBcIj57ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX06IHtmcyhcInZcIil9PC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxociBzdHlsZT1cInBhZGRpbmc6IDA7IG1hcmdpbjogMDtcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciBnIGluIFsoMSArIG1pbiAoc2l6ZSAoYXdhaXQgdGltZSkpIDEwKS4uMTBdXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOiAwXCI+e2ZzKFwidXNlci5sYXN0TmFtZVwiKX06IHtmcyhcImdcIil9PC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBjYXNlICdjbG9jayc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPENsb2NrQXBwIHRpbWU9e2ZzKFwidGltZVwiKX0gLz47XHJcbiAgICAgICAgICAgIGNhc2UgJ3RvZG9zJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8VG9kb0FwcCAvPjtcclxuICAgICAgICAgICAgY2FzZSAnbW90aW9uJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8TW90aW9uQXBwIC8+O1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHhhbmlhLnZpZXcobGF5b3V0KG1haW5WaWV3KSkuYmluZCh0YXJnZXQsIHN0b3JlKTtcclxufVxyXG5cclxudmFyIGxheW91dDogYW55ID0gdmlldyA9PlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8aDE+e2ZzKFwidXNlci5maXJzdE5hbWVcIil9IHtmcyhcInVzZXIubGFzdE5hbWVcIil9ICh7ZnMoXCJhd2FpdCB2aWV3XCIpfSk8L2gxPlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIHZpZXc6XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJyb3V0ZSAndmlldzEnXCIpfT52aWV3IDE8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInJvdXRlICd2aWV3MidcIil9PnZpZXcgMjwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ2Nsb2NrJ1wiKX0+Y2xvY2s8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInJvdXRlICd0b2RvcydcIil9PnRvZG9zPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJyb3V0ZSAnbW90aW9uJ1wiKX0+bW90aW9uPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICBtb2RlbDpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInVzZXIuZmlyc3ROYW1lIDwtICdSYW15J1wiKX0+UmFteTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwidXNlci5maXJzdE5hbWUgPC0gJ0licmFoaW0nXCIpfT5JYnJhaGltPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICB0aW1lOlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwidGltZS50b2dnbGUgKClcIil9PnRvZ2dsZTwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAxMHB4O1wiPlxyXG4gICAgICAgICAgICB7Vmlldy5wYXJ0aWFsKHZpZXcsIHsgdXNlcjogZnMoXCJ1c2VyXCIpLCB0aW1lOiBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpIH0pfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+O1xyXG5cclxuIl19