"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
var clock_1 = require("./clock");
var todo_1 = require("./todo");
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
            xania_1.fs("user.lastName")),
        xania_1.Xania.tag("div", null,
            "view:",
            xania_1.Xania.tag("button", { click: xania_1.fs("route 'view1'") }, "view 1"),
            xania_1.Xania.tag("button", { click: xania_1.fs("route 'view2'") }, "view 2"),
            xania_1.Xania.tag("button", { click: xania_1.fs("route 'clock'") }, "clock"),
            xania_1.Xania.tag("button", { click: xania_1.fs("route 'todos'") }, "todos"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "model:",
            xania_1.Xania.tag("button", { click: xania_1.fs("user.firstName <- 'Ramy'") }, "Ramy"),
            xania_1.Xania.tag("button", { click: xania_1.fs("user.firstName <- 'Ibrahim'") }, "Ibrahim"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "time:",
            xania_1.Xania.tag("button", { click: xania_1.fs("time.toggle ()") }, "toggle")),
        xania_1.Xania.tag("div", { style: "padding: 10px;" }, xania_1.View.partial(view, { user: xania_1.fs("user"), time: new observables_1.Observables.Time() })));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2xheW91dC9hcHAudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxREFBbUQ7QUFFbkQseUNBQTBFO0FBQzFFLGlDQUFrQztBQUNsQywrQkFBZ0M7QUFFaEMsY0FBcUIsTUFBWTtJQUM3QixJQUFJLElBQUksR0FBRyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9DLElBQUksS0FBSyxHQUFHLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUM7UUFDckIsSUFBSSxNQUFBO1FBQ0osSUFBSSxFQUFFLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUU7UUFDNUIsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO1FBQ3JELEtBQUssWUFBQyxRQUFRO1lBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUNELElBQUksWUFBQyxFQUFFO1lBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDeEMsQ0FBQztLQUNKLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRVgsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFBLFFBQVE7UUFDNUIsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNmLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUM7O29CQUFjLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzs7b0JBQUcsVUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFPLENBQUM7WUFDeEUsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxDQUNIO29CQUNLLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztvQkFDckIsa0JBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsNENBQTRDLENBQUM7d0JBQzNELHlCQUFHLEtBQUssRUFBQyxXQUFXOzRCQUFFLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzs7NEJBQUksVUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFLLENBQ3BEO29CQUNWLDBCQUFJLEtBQUssRUFBQyx3QkFBd0IsR0FBRztvQkFDckMsa0JBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsaURBQWlELENBQUM7d0JBQ2hFLHlCQUFHLEtBQUssRUFBQyxXQUFXOzRCQUFFLFVBQUUsQ0FBQyxlQUFlLENBQUM7OzRCQUFJLFVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBSyxDQUNuRCxDQUNSLENBQ1QsQ0FBQztZQUNOLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsa0JBQUMsZ0JBQVEsSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFJLENBQUM7WUFDMUMsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxjQUFPLE9BQUcsQ0FBQztRQUMzQixDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxhQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDckQsQ0FBQztBQXZDRCxvQkF1Q0M7QUFFRCxJQUFJLE1BQU0sR0FBUSxVQUFBLElBQUk7SUFDbEIsT0FBQTtRQUNJO1lBQUssVUFBRSxDQUFDLGdCQUFnQixDQUFDOztZQUFHLFVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBTTtRQUNyRDs7WUFFSSw4QkFBUSxLQUFLLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxhQUFpQjtZQUNuRCw4QkFBUSxLQUFLLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxhQUFpQjtZQUNuRCw4QkFBUSxLQUFLLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxZQUFnQjtZQUNsRCw4QkFBUSxLQUFLLEVBQUUsVUFBRSxDQUFDLGVBQWUsQ0FBQyxZQUFnQjs7WUFHbEQsOEJBQVEsS0FBSyxFQUFFLFVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxXQUFlO1lBQzVELDhCQUFRLEtBQUssRUFBRSxVQUFFLENBQUMsNkJBQTZCLENBQUMsY0FBa0I7O1lBR2xFLDhCQUFRLEtBQUssRUFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUMsYUFBaUIsQ0FDbEQ7UUFDTiwyQkFBSyxLQUFLLEVBQUMsZ0JBQWdCLElBQ3RCLFlBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FDckUsQ0FDSjtBQW5CTixDQW1CTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmltcG9ydCB7IFhhbmlhLCBGb3JFYWNoLCBmcywgVmlldywgUmVhY3RpdmUgYXMgUmUgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgQ2xvY2tBcHAgfSBmcm9tIFwiLi9jbG9ja1wiXHJcbmltcG9ydCB7IFRvZG9BcHAgfSBmcm9tIFwiLi90b2RvXCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiaW5kKHRhcmdldDogTm9kZSkge1xyXG4gICAgdmFyIHZpZXcgPSBuZXcgT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZShcInRvZG9zXCIpO1xyXG4gICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHtcclxuICAgICAgICB2aWV3LFxyXG4gICAgICAgIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCksXHJcbiAgICAgICAgdXNlcjogeyBmaXJzdE5hbWU6IFwiSWJyYWhpbVwiLCBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIiB9LFxyXG4gICAgICAgIHJvdXRlKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5vbk5leHQodmlld05hbWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2l6ZSh0cykge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcigodHMgJSAxMDAwKSAvIDUwKTtcclxuICAgICAgICB9XHJcbiAgICB9LCBbTWF0aF0pO1xyXG5cclxuICAgIHZhciBtYWluVmlldyA9IHZpZXcubWFwKHZpZXdOYW1lID0+IHtcclxuICAgICAgICBzd2l0Y2ggKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXcxJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2PnZpZXcgMToge2ZzKFwidXNlci5maXJzdE5hbWVcIil9IHtmcyhcImF3YWl0IHRpbWVcIil9PC9kaXY+O1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3Mic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmcyhcInVzZXIuZmlyc3ROYW1lXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciB2IGluIFsxLi4obWluIChzaXplIChhd2FpdCB0aW1lKSkgMTApXVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogMFwiPntmcyhcInVzZXIuZmlyc3ROYW1lXCIpfToge2ZzKFwidlwiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhyIHN0eWxlPVwicGFkZGluZzogMDsgbWFyZ2luOiAwO1wiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIGcgaW4gWygxICsgbWluIChzaXplIChhd2FpdCB0aW1lKSkgMTApLi4xMF1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDBcIj57ZnMoXCJ1c2VyLmxhc3ROYW1lXCIpfToge2ZzKFwiZ1wiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Nsb2NrJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8Q2xvY2tBcHAgdGltZT17ZnMoXCJ0aW1lXCIpfSAvPjtcclxuICAgICAgICAgICAgY2FzZSAndG9kb3MnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxUb2RvQXBwIC8+O1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIFhhbmlhLnZpZXcobGF5b3V0KG1haW5WaWV3KSkuYmluZCh0YXJnZXQsIHN0b3JlKTtcclxufVxyXG5cclxudmFyIGxheW91dDogYW55ID0gdmlldyA9PlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8aDE+e2ZzKFwidXNlci5maXJzdE5hbWVcIil9IHtmcyhcInVzZXIubGFzdE5hbWVcIil9PC9oMT5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICB2aWV3OlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInJvdXRlICd2aWV3MSdcIil9PnZpZXcgMTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInJvdXRlICd2aWV3MidcIil9PnZpZXcgMjwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInJvdXRlICdjbG9jaydcIil9PmNsb2NrPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gY2xpY2s9e2ZzKFwicm91dGUgJ3RvZG9zJ1wiKX0+dG9kb3M8L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIG1vZGVsOlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInVzZXIuZmlyc3ROYW1lIDwtICdSYW15J1wiKX0+UmFteTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInVzZXIuZmlyc3ROYW1lIDwtICdJYnJhaGltJ1wiKX0+SWJyYWhpbTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDtcclxuICAgICAgICAgICAgdGltZTpcclxuICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJ0aW1lLnRvZ2dsZSAoKVwiKX0+dG9nZ2xlPC9idXR0b24+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDEwcHg7XCI+XHJcbiAgICAgICAgICAgIHtWaWV3LnBhcnRpYWwodmlldywgeyB1c2VyOiBmcyhcInVzZXJcIiksIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCkgfSl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj47XHJcblxyXG4iXX0=