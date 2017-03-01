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
}
exports.execute = execute;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUFxRztBQUNyRyxzQ0FBeUM7QUFDekMsK0JBQWdDO0FBQ2hDLHNDQUF5QztBQUd6QztJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ2hCLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNyRCxJQUFJLFlBQUMsRUFBRTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDSixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUM7QUFSRCxzQkFRQztBQUVELElBQUksTUFBTSxHQUFRLFVBQUMsSUFBSSxFQUFFLEdBQWM7SUFDbkMsT0FBQTtRQUNJO1lBQUssYUFBSyxDQUFDLGdCQUFnQixDQUFDOztZQUFHLGFBQUssQ0FBQyxlQUFlLENBQUMsQ0FBTTtRQUMzRCwyQkFBSyxLQUFLLEVBQUMsY0FBYztZQUNyQix5QkFBRyxJQUFJLEVBQUMsR0FBRyxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFXLENBQ2pEO1FBQ047O1lBRUksOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQWU7WUFDbkQsOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWlCO1lBQ3JELDhCQUFRLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFpQjtZQUNyRCw4QkFBUSxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBZ0I7WUFDcEQsOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWtCO1lBQ3ZELDhCQUFRLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFnQjtZQUNwRCw4QkFBUSxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBZ0I7O1lBR3BELDhCQUFRLE9BQU8sRUFBRSxhQUFLLENBQUMsMEJBQTBCLENBQUMsV0FBZTtZQUNqRSw4QkFBUSxPQUFPLEVBQUUsYUFBSyxDQUFDLDZCQUE2QixDQUFDLGNBQWtCOztZQUd2RSw4QkFBUSxPQUFPLEVBQUUsYUFBSyxDQUFDLGdCQUFnQixDQUFDLGFBQWlCLENBQ3ZEO1FBQ04sMkJBQUssS0FBSyxFQUFDLGdCQUFnQixJQUN0QixZQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxhQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQ3hFLENBQ0o7QUF6Qk4sQ0F5Qk0sQ0FBQztBQUdYLGlCQUF3QixFQUFxQjtRQUFuQixrQkFBTSxFQUFFLGNBQUksRUFBRSxZQUFHO0lBQ3ZDLElBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBQSxJQUFJO1FBQ3pCLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDWCxLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDOztvQkFBYyxhQUFLLENBQUMsZ0JBQWdCLENBQUM7O29CQUFHLGFBQUssQ0FBQyxZQUFZLENBQUMsQ0FBTyxDQUFDO1lBQzlFLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsQ0FDSDtvQkFDSyxhQUFLLENBQUMsZ0JBQWdCLENBQUM7b0JBQ3hCLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsYUFBSyxDQUFDLDRDQUE0QyxDQUFDO3dCQUM5RCx5QkFBRyxLQUFLLEVBQUMsV0FBVzs0QkFBRSxhQUFLLENBQUMsZ0JBQWdCLENBQUM7OzRCQUFJLGFBQUssQ0FBQyxHQUFHLENBQUMsQ0FBSyxDQUMxRDtvQkFDViwwQkFBSSxLQUFLLEVBQUMsd0JBQXdCLEdBQUc7b0JBQ3JDLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsYUFBSyxDQUFDLGlEQUFpRCxDQUFDO3dCQUNuRSx5QkFBRyxLQUFLLEVBQUMsV0FBVzs0QkFBRSxhQUFLLENBQUMsZUFBZSxDQUFDOzs0QkFBSSxhQUFLLENBQUMsR0FBRyxDQUFDLENBQUssQ0FDekQsQ0FDUixDQUNULENBQUM7WUFDTixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGNBQVEsSUFBQyxJQUFJLEVBQUUsYUFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFJLENBQUM7WUFDN0MsS0FBSyxRQUFRO2dCQUNULE1BQU0sQ0FBQyxrQkFBQyxjQUFRLElBQUMsSUFBSSxFQUFFLGFBQUssQ0FBQyxNQUFNLENBQUMsR0FBSSxDQUFDO1lBQzdDLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsa0JBQUMsY0FBTyxPQUFHLENBQUM7WUFDdkIsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxjQUFRLE9BQUcsQ0FBQztZQUN4QjtnQkFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBSVAsQ0FBQztBQWpDRCwwQkFpQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5cclxuaW1wb3J0IHsgWGFuaWEgYXMgeGFuaWEsIEZvckVhY2gsIHF1ZXJ5LCBWaWV3LCBEb20sIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBDbG9ja0FwcCB9IGZyb20gXCIuLy4uL2Nsb2NrL2FwcFwiXHJcbmltcG9ydCB7IFRvZG9BcHAgfSBmcm9tIFwiLi90b2RvXCJcclxuaW1wb3J0IHsgQmFsbHNBcHAgfSBmcm9tIFwiLi8uLi9iYWxscy9hcHBcIlxyXG5pbXBvcnQgeyBVcmxIZWxwZXIsIEh0bWxIZWxwZXIgfSBmcm9tIFwiLi4vLi4vc3JjL212Y1wiXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RvcmUoKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlLlN0b3JlKHtcclxuICAgICAgICB0aW1lOiBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpLFxyXG4gICAgICAgIHVzZXI6IHsgZmlyc3ROYW1lOiBcIklicmFoaW1cIiwgbGFzdE5hbWU6IFwiYmVuIFNhbGFoXCIgfSxcclxuICAgICAgICBzaXplKHRzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKCh0cyAlIDEwMDApIC8gNTApO1xyXG4gICAgICAgIH1cclxuICAgIH0sIFtNYXRoXSk7XHJcbn1cclxuXHJcbnZhciBsYXlvdXQ6IGFueSA9ICh2aWV3LCB1cmw6IFVybEhlbHBlcikgPT5cclxuICAgIDxkaXY+XHJcbiAgICAgICAgPGgxPntxdWVyeShcInVzZXIuZmlyc3ROYW1lXCIpfSB7cXVlcnkoXCJ1c2VyLmxhc3ROYW1lXCIpfTwvaDE+XHJcbiAgICAgICAgPGRpdiBzdHlsZT1cImNsZWFyOiBib3RoO1wiPlxyXG4gICAgICAgICAgICA8YSBocmVmPVwiI1wiIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ3RvZG9zJyl9PnRvZG9zPC9hPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIHZpZXc6XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbignaW5kZXgnKX0+aG9tZTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ3ZpZXcxJyl9PnZpZXcgMTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ3ZpZXcyJyl9PnZpZXcgMjwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ2Nsb2NrJyl9PmNsb2NrPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbignY2xvY2syJyl9PmNsb2NrIDI8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt1cmwuYWN0aW9uKCd0b2RvcycpfT50b2RvczwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ2JhbGxzJyl9PmJhbGxzPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICBtb2RlbDpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtxdWVyeShcInVzZXIuZmlyc3ROYW1lIDwtICdSYW15J1wiKX0+UmFteTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3F1ZXJ5KFwidXNlci5maXJzdE5hbWUgPC0gJ0licmFoaW0nXCIpfT5JYnJhaGltPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICB0aW1lOlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3F1ZXJ5KFwidGltZS50b2dnbGUgKClcIil9PnRvZ2dsZTwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAxMHB4O1wiPlxyXG4gICAgICAgICAgICB7Vmlldy5wYXJ0aWFsKHZpZXcsIHsgdXNlcjogcXVlcnkoXCJ1c2VyXCIpLCB0aW1lOiBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpIH0pfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+O1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlKHsgZHJpdmVyLCBodG1sLCB1cmwgfSkge1xyXG4gICAgdmFyIG1haW5WaWV3ID0gdXJsLnJvdXRlKHBhdGggPT4ge1xyXG4gICAgICAgIHN3aXRjaCAocGF0aCkge1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3MSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj52aWV3IDE6IHtxdWVyeShcInVzZXIuZmlyc3ROYW1lXCIpfSB7cXVlcnkoXCJhd2FpdCB0aW1lXCIpfTwvZGl2PjtcclxuICAgICAgICAgICAgY2FzZSAndmlldzInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cXVlcnkoXCJ1c2VyLmZpcnN0TmFtZVwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17cXVlcnkoXCJmb3IgdiBpbiBbMS4uKG1pbiAoc2l6ZSAoYXdhaXQgdGltZSkpIDEwKV1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDBcIj57cXVlcnkoXCJ1c2VyLmZpcnN0TmFtZVwiKX06IHtxdWVyeShcInZcIil9PC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxociBzdHlsZT1cInBhZGRpbmc6IDA7IG1hcmdpbjogMDtcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtxdWVyeShcImZvciBnIGluIFsoMSArIG1pbiAoc2l6ZSAoYXdhaXQgdGltZSkpIDEwKS4uMTBdXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOiAwXCI+e3F1ZXJ5KFwidXNlci5sYXN0TmFtZVwiKX06IHtxdWVyeShcImdcIil9PC9wPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBjYXNlICdjbG9jayc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPENsb2NrQXBwIHRpbWU9e3F1ZXJ5KFwidGltZVwiKX0gLz47XHJcbiAgICAgICAgICAgIGNhc2UgJ2Nsb2NrMic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPENsb2NrQXBwIHRpbWU9e3F1ZXJ5KFwidGltZVwiKX0gLz47XHJcbiAgICAgICAgICAgIGNhc2UgJ3RvZG9zJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiA8VG9kb0FwcCAvPjtcclxuICAgICAgICAgICAgY2FzZSAnYmFsbHMnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxCYWxsc0FwcCAvPjtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBodG1sLnBhcnRpYWwocGF0aCwge30pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIHhhbmlhLnZpZXcobGF5b3V0KG1haW5WaWV3LCB1cmwpKVxyXG4gICAgICAgLy8gLmJpbmQoc3RvcmUoKSwgZHJpdmVyKTtcclxufSJdfQ==