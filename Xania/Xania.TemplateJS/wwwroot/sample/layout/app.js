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
            xania_1.fs("user.lastName")),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2xheW91dC9hcHAudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxREFBbUQ7QUFFbkQseUNBQW1GO0FBQ25GLGlDQUFrQztBQUNsQywrQkFBZ0M7QUFDaEMsMkNBQTZDO0FBRTdDLGNBQXFCLE1BQVk7SUFDN0IsSUFBSSxJQUFJLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoRCxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ3JCLElBQUksTUFBQTtRQUNKLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNyRCxLQUFLLFlBQUMsUUFBUTtZQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFDRCxJQUFJLFlBQUMsRUFBRTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDSixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUVYLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBQSxRQUFRO1FBQzVCLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDZixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDOztvQkFBYyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7O29CQUFHLFVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBTyxDQUFDO1lBQ3hFLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsQ0FDSDtvQkFDSyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7b0JBQ3JCLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLDRDQUE0QyxDQUFDO3dCQUMzRCx5QkFBRyxLQUFLLEVBQUMsV0FBVzs0QkFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUM7OzRCQUFJLFVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBSyxDQUNwRDtvQkFDViwwQkFBSSxLQUFLLEVBQUMsd0JBQXdCLEdBQUc7b0JBQ3JDLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLGlEQUFpRCxDQUFDO3dCQUNoRSx5QkFBRyxLQUFLLEVBQUMsV0FBVzs0QkFBRSxVQUFFLENBQUMsZUFBZSxDQUFDOzs0QkFBSSxVQUFFLENBQUMsR0FBRyxDQUFDLENBQUssQ0FDbkQsQ0FDUixDQUNULENBQUM7WUFDTixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGdCQUFRLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBSSxDQUFDO1lBQzFDLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsa0JBQUMsY0FBTyxPQUFHLENBQUM7WUFDdkIsS0FBSyxRQUFRO2dCQUNULE1BQU0sQ0FBQyxrQkFBQyxpQkFBUyxPQUFHLENBQUM7UUFDN0IsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsYUFBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3JELENBQUM7QUF6Q0Qsb0JBeUNDO0FBRUQsSUFBSSxNQUFNLEdBQVEsVUFBQSxJQUFJO0lBQ2xCLE9BQUE7UUFDSTtZQUFLLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzs7WUFBRyxVQUFFLENBQUMsZUFBZSxDQUFDLENBQU07UUFDckQ7O1lBRUksOEJBQVEsT0FBTyxFQUFFLFVBQUUsQ0FBQyxlQUFlLENBQUMsYUFBaUI7WUFDckQsOEJBQVEsT0FBTyxFQUFFLFVBQUUsQ0FBQyxlQUFlLENBQUMsYUFBaUI7WUFDckQsOEJBQVEsT0FBTyxFQUFFLFVBQUUsQ0FBQyxlQUFlLENBQUMsWUFBZ0I7WUFDcEQsOEJBQVEsT0FBTyxFQUFFLFVBQUUsQ0FBQyxlQUFlLENBQUMsWUFBZ0I7WUFDcEQsOEJBQVEsT0FBTyxFQUFFLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFpQjs7WUFHdEQsOEJBQVEsT0FBTyxFQUFFLFVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxXQUFlO1lBQzlELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsNkJBQTZCLENBQUMsY0FBa0I7O1lBR3BFLDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUMsYUFBaUIsQ0FDcEQ7UUFDTiwyQkFBSyxLQUFLLEVBQUMsZ0JBQWdCLElBQ3RCLFlBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FDckUsQ0FDSjtBQXBCTixDQW9CTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmltcG9ydCB7IFhhbmlhIGFzIHhhbmlhLCBGb3JFYWNoLCBmcywgVmlldywgUmVhY3RpdmUgYXMgUmUgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgQ2xvY2tBcHAgfSBmcm9tIFwiLi9jbG9ja1wiXHJcbmltcG9ydCB7IFRvZG9BcHAgfSBmcm9tIFwiLi90b2RvXCJcclxuaW1wb3J0IHsgTW90aW9uQXBwIH0gZnJvbSBcIi4vLi4vbW90aW9uL2luZGV4XCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiaW5kKHRhcmdldDogTm9kZSkge1xyXG4gICAgdmFyIHZpZXcgPSBuZXcgT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZShcIm1vdGlvblwiKTtcclxuICAgIHZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICAgICAgdmlldyxcclxuICAgICAgICB0aW1lOiBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpLFxyXG4gICAgICAgIHVzZXI6IHsgZmlyc3ROYW1lOiBcIklicmFoaW1cIiwgbGFzdE5hbWU6IFwiYmVuIFNhbGFoXCIgfSxcclxuICAgICAgICByb3V0ZSh2aWV3TmFtZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcub25OZXh0KHZpZXdOYW1lKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNpemUodHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoKHRzICUgMTAwMCkgLyA1MCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgW01hdGhdKTtcclxuXHJcbiAgICB2YXIgbWFpblZpZXcgPSB2aWV3Lm1hcCh2aWV3TmFtZSA9PiB7XHJcbiAgICAgICAgc3dpdGNoICh2aWV3TmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3MSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj52aWV3IDE6IHtmcyhcInVzZXIuZmlyc3ROYW1lXCIpfSB7ZnMoXCJhd2FpdCB0aW1lXCIpfTwvZGl2PjtcclxuICAgICAgICAgICAgY2FzZSAndmlldzInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgdiBpbiBbMS4uKG1pbiAoc2l6ZSAoYXdhaXQgdGltZSkpIDEwKV1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDBcIj57ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX06IHtmcyhcInZcIil9PC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxociBzdHlsZT1cInBhZGRpbmc6IDA7IG1hcmdpbjogMDtcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciBnIGluIFsoMSArIG1pbiAoc2l6ZSAoYXdhaXQgdGltZSkpIDEwKS4uMTBdXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOiAwXCI+e2ZzKFwidXNlci5sYXN0TmFtZVwiKX06IHtmcyhcImdcIil9PC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBjYXNlICdjbG9jayc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPENsb2NrQXBwIHRpbWU9e2ZzKFwidGltZVwiKX0gLz47XHJcbiAgICAgICAgICAgIGNhc2UgJ3RvZG9zJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8VG9kb0FwcCAvPjtcclxuICAgICAgICAgICAgY2FzZSAnbW90aW9uJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8TW90aW9uQXBwIC8+O1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHhhbmlhLnZpZXcobGF5b3V0KG1haW5WaWV3KSkuYmluZCh0YXJnZXQsIHN0b3JlKTtcclxufVxyXG5cclxudmFyIGxheW91dDogYW55ID0gdmlldyA9PlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8aDE+e2ZzKFwidXNlci5maXJzdE5hbWVcIil9IHtmcyhcInVzZXIubGFzdE5hbWVcIil9PC9oMT5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICB2aWV3OlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ3ZpZXcxJ1wiKX0+dmlldyAxPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJyb3V0ZSAndmlldzInXCIpfT52aWV3IDI8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInJvdXRlICdjbG9jaydcIil9PmNsb2NrPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJyb3V0ZSAndG9kb3MnXCIpfT50b2RvczwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ21vdGlvbidcIil9Pm1vdGlvbjwvYnV0dG9uPlxyXG4gICAgICAgICAgICAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDtcclxuICAgICAgICAgICAgbW9kZWw6XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnUmFteSdcIil9PlJhbXk8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInVzZXIuZmlyc3ROYW1lIDwtICdJYnJhaGltJ1wiKX0+SWJyYWhpbTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDtcclxuICAgICAgICAgICAgdGltZTpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInRpbWUudG9nZ2xlICgpXCIpfT50b2dnbGU8L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMTBweDtcIj5cclxuICAgICAgICAgICAge1ZpZXcucGFydGlhbCh2aWV3LCB7IHVzZXI6IGZzKFwidXNlclwiKSwgdGltZTogbmV3IE9ic2VydmFibGVzLlRpbWUoKSB9KX1cclxuICAgICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PjtcclxuXHJcbiJdfQ==