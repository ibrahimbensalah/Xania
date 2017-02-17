"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
var clock_1 = require("./clock");
var todo_1 = require("./todo");
var app_1 = require("./../balls/app");
function store(appContext) {
    return new xania_1.Reactive.Store({
        time: new observables_1.Observables.Time(),
        user: { firstName: "Ibrahim", lastName: "ben Salah" },
        size: function (ts) {
            return Math.floor((ts % 1000) / 50);
        }
    }, [Math, appContext]);
}
exports.store = store;
var layout = function (view, url) {
    return xania_1.Xania.tag("div", null,
        xania_1.Xania.tag("h1", null,
            xania_1.fs("user.firstName"),
            " ",
            xania_1.fs("user.lastName")),
        xania_1.Xania.tag("div", { style: "clear: both;" },
            xania_1.Xania.tag("a", { onClick: url.action('todos') }, "todos")),
        xania_1.Xania.tag("div", null,
            "view:",
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
function run(target, appContext) {
    var mainView = appContext.url.map(function (viewName) {
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
    xania_1.Xania.view(layout(mainView, appContext.url))
        .bind(target, store(appContext));
}
exports.run = run;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUE2RjtBQUM3RixpQ0FBa0M7QUFDbEMsK0JBQWdDO0FBQ2hDLHNDQUF5QztBQUd6QyxlQUFzQixVQUFVO0lBQzVCLE1BQU0sQ0FBQyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ2hCLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNyRCxJQUFJLFlBQUMsRUFBRTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDSixFQUFFLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQVJELHNCQVFDO0FBRUQsSUFBSSxNQUFNLEdBQVEsVUFBQyxJQUFJLEVBQUUsR0FBYztJQUNuQyxPQUFBO1FBQ0k7WUFBSyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7O1lBQUcsVUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFNO1FBQ3JELDJCQUFLLEtBQUssRUFBQyxjQUFjO1lBQ3JCLHlCQUFHLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFXLENBQ3hDO1FBQ047O1lBRUksOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWlCO1lBQ3JELDhCQUFRLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFpQjtZQUNyRCw4QkFBUSxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBZ0I7WUFDcEQsOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQWdCO1lBQ3BELDhCQUFRLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFnQjs7WUFHcEQsOEJBQVEsT0FBTyxFQUFFLFVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxXQUFlO1lBQzlELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsNkJBQTZCLENBQUMsY0FBa0I7O1lBR3BFLDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUMsYUFBaUIsQ0FDcEQ7UUFDTiwyQkFBSyxLQUFLLEVBQUMsZ0JBQWdCLElBQ3RCLFlBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FDckUsQ0FDSjtBQXZCTixDQXVCTSxDQUFDO0FBR1gsYUFBb0IsTUFBTSxFQUFFLFVBQVU7SUFDbEMsSUFBSSxRQUFRLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBQSxRQUFRO1FBQ3RDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDZixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDOztvQkFBYyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7O29CQUFHLFVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBTyxDQUFDO1lBQ3hFLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsQ0FDSDtvQkFDSyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7b0JBQ3JCLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLDRDQUE0QyxDQUFDO3dCQUMzRCx5QkFBRyxLQUFLLEVBQUMsV0FBVzs0QkFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUM7OzRCQUFJLFVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBSyxDQUNwRDtvQkFDViwwQkFBSSxLQUFLLEVBQUMsd0JBQXdCLEdBQUc7b0JBQ3JDLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLGlEQUFpRCxDQUFDO3dCQUNoRSx5QkFBRyxLQUFLLEVBQUMsV0FBVzs0QkFBRSxVQUFFLENBQUMsZUFBZSxDQUFDOzs0QkFBSSxVQUFFLENBQUMsR0FBRyxDQUFDLENBQUssQ0FDbkQsQ0FDUixDQUNULENBQUM7WUFDTixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGdCQUFRLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBSSxDQUFDO1lBQzFDLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsa0JBQUMsY0FBTyxPQUFHLENBQUM7WUFDdkIsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxjQUFRLE9BQUcsQ0FBQztRQUM1QixDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxhQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3ZDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQTdCRCxrQkE2QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5cclxuaW1wb3J0IHsgWGFuaWEgYXMgeGFuaWEsIEZvckVhY2gsIGZzLCBWaWV3LCBSZWFjdGl2ZSBhcyBSZSwgVGVtcGxhdGUgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgQ2xvY2tBcHAgfSBmcm9tIFwiLi9jbG9ja1wiXHJcbmltcG9ydCB7IFRvZG9BcHAgfSBmcm9tIFwiLi90b2RvXCJcclxuaW1wb3J0IHsgQmFsbHNBcHAgfSBmcm9tIFwiLi8uLi9iYWxscy9hcHBcIlxyXG5pbXBvcnQgeyBVcmxIZWxwZXIgfSBmcm9tIFwiLi4vLi4vc3JjL212Y1wiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RvcmUoYXBwQ29udGV4dCkge1xyXG4gICAgcmV0dXJuIG5ldyBSZS5TdG9yZSh7XHJcbiAgICAgICAgdGltZTogbmV3IE9ic2VydmFibGVzLlRpbWUoKSxcclxuICAgICAgICB1c2VyOiB7IGZpcnN0TmFtZTogXCJJYnJhaGltXCIsIGxhc3ROYW1lOiBcImJlbiBTYWxhaFwiIH0sXHJcbiAgICAgICAgc2l6ZSh0cykge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcigodHMgJSAxMDAwKSAvIDUwKTtcclxuICAgICAgICB9XHJcbiAgICB9LCBbTWF0aCwgYXBwQ29udGV4dF0pO1xyXG59XHJcblxyXG52YXIgbGF5b3V0OiBhbnkgPSAodmlldywgdXJsOiBVcmxIZWxwZXIpID0+XHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxoMT57ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX0ge2ZzKFwidXNlci5sYXN0TmFtZVwiKX08L2gxPlxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJjbGVhcjogYm90aDtcIj5cclxuICAgICAgICAgICAgPGEgb25DbGljaz17dXJsLmFjdGlvbigndG9kb3MnKX0+dG9kb3M8L2E+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgdmlldzpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt1cmwuYWN0aW9uKCd2aWV3MScpfT52aWV3IDE8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt1cmwuYWN0aW9uKCd2aWV3MicpfT52aWV3IDI8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt1cmwuYWN0aW9uKCdjbG9jaycpfT5jbG9jazwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ3RvZG9zJyl9PnRvZG9zPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbignYmFsbHMnKX0+YmFsbHM8L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIG1vZGVsOlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwidXNlci5maXJzdE5hbWUgPC0gJ1JhbXknXCIpfT5SYW15PC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnSWJyYWhpbSdcIil9PklicmFoaW08L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIHRpbWU6XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJ0aW1lLnRvZ2dsZSAoKVwiKX0+dG9nZ2xlPC9idXR0b24+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDEwcHg7XCI+XHJcbiAgICAgICAgICAgIHtWaWV3LnBhcnRpYWwodmlldywgeyB1c2VyOiBmcyhcInVzZXJcIiksIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCkgfSl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj47XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJ1bih0YXJnZXQsIGFwcENvbnRleHQpIHtcclxuICAgIHZhciBtYWluVmlldyA9IGFwcENvbnRleHQudXJsLm1hcCh2aWV3TmFtZSA9PiB7XHJcbiAgICAgICAgc3dpdGNoICh2aWV3TmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3MSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj52aWV3IDE6IHtmcyhcInVzZXIuZmlyc3ROYW1lXCIpfSB7ZnMoXCJhd2FpdCB0aW1lXCIpfTwvZGl2PjtcclxuICAgICAgICAgICAgY2FzZSAndmlldzInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgdiBpbiBbMS4uKG1pbiAoc2l6ZSAoYXdhaXQgdGltZSkpIDEwKV1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDBcIj57ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX06IHtmcyhcInZcIil9PC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxociBzdHlsZT1cInBhZGRpbmc6IDA7IG1hcmdpbjogMDtcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciBnIGluIFsoMSArIG1pbiAoc2l6ZSAoYXdhaXQgdGltZSkpIDEwKS4uMTBdXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOiAwXCI+e2ZzKFwidXNlci5sYXN0TmFtZVwiKX06IHtmcyhcImdcIil9PC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBjYXNlICdjbG9jayc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPENsb2NrQXBwIHRpbWU9e2ZzKFwidGltZVwiKX0gLz47XHJcbiAgICAgICAgICAgIGNhc2UgJ3RvZG9zJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8VG9kb0FwcCAvPjtcclxuICAgICAgICAgICAgY2FzZSAnYmFsbHMnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxCYWxsc0FwcCAvPjtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB4YW5pYS52aWV3KGxheW91dChtYWluVmlldywgYXBwQ29udGV4dC51cmwpKVxyXG4gICAgICAgIC5iaW5kKHRhcmdldCwgc3RvcmUoYXBwQ29udGV4dCkpO1xyXG59Il19