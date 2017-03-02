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
            xania_1.expr("user.firstName"),
            " ",
            xania_1.expr("user.lastName")),
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
            xania_1.Xania.tag("button", { onClick: xania_1.expr("user.firstName <- 'Ramy'") }, "Ramy"),
            xania_1.Xania.tag("button", { onClick: xania_1.expr("user.firstName <- 'Ibrahim'") }, "Ibrahim"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "time:",
            xania_1.Xania.tag("button", { onClick: xania_1.expr("time.toggle ()") }, "toggle")),
        xania_1.Xania.tag("div", { style: "padding: 10px;" }));
};
function execute(_a) {
    var driver = _a.driver, html = _a.html, url = _a.url;
    var mainView = url.route(function (path) {
        switch (path) {
            case 'view1':
                return xania_1.Xania.tag("div", null,
                    "view 1: ",
                    xania_1.expr("user.firstName"),
                    " ",
                    xania_1.expr("await time"));
            case 'view2':
                return (xania_1.Xania.tag("div", null,
                    xania_1.expr("user.firstName"),
                    xania_1.Xania.tag(xania_1.Repeat, { source: xania_1.expr("for v in [1..(min (size (await time)) 10)]") },
                        xania_1.Xania.tag("p", { style: "margin: 0" },
                            xania_1.expr("user.firstName"),
                            ": ",
                            xania_1.expr("v"))),
                    xania_1.Xania.tag("hr", { style: "padding: 0; margin: 0;" }),
                    xania_1.Xania.tag(xania_1.Repeat, { expr: xania_1.expr("for g in [(1 + min (size (await time)) 10)..10]") },
                        xania_1.Xania.tag("p", { style: "margin: 0" },
                            xania_1.expr("user.lastName"),
                            ": ",
                            xania_1.expr("g")))));
            case 'clock':
                return xania_1.Xania.tag(app_1.ClockApp, { time: xania_1.expr("time") });
            case 'clock2':
                return xania_1.Xania.tag(app_1.ClockApp, { time: xania_1.expr("time") });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUE2RjtBQUM3RixzQ0FBeUM7QUFDekMsK0JBQWdDO0FBQ2hDLHNDQUF5QztBQUd6QztJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ2hCLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNyRCxJQUFJLFlBQUMsRUFBRTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDSixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUM7QUFSRCxzQkFRQztBQUVELElBQUksTUFBTSxHQUFRLFVBQUMsSUFBSSxFQUFFLEdBQWM7SUFDbkMsT0FBQTtRQUNJO1lBQUssWUFBSSxDQUFDLGdCQUFnQixDQUFDOztZQUFHLFlBQUksQ0FBQyxlQUFlLENBQUMsQ0FBTTtRQUN6RCwyQkFBSyxLQUFLLEVBQUMsY0FBYztZQUNyQix5QkFBRyxJQUFJLEVBQUMsR0FBRyxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFXLENBQ2pEO1FBQ047O1lBRUksOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQWU7WUFDbkQsOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWlCO1lBQ3JELDhCQUFRLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFpQjtZQUNyRCw4QkFBUSxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBZ0I7WUFDcEQsOEJBQVEsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWtCO1lBQ3ZELDhCQUFRLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxZQUFnQjtZQUNwRCw4QkFBUSxPQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBZ0I7O1lBR3BELDhCQUFRLE9BQU8sRUFBRSxZQUFJLENBQUMsMEJBQTBCLENBQUMsV0FBZTtZQUNoRSw4QkFBUSxPQUFPLEVBQUUsWUFBSSxDQUFDLDZCQUE2QixDQUFDLGNBQWtCOztZQUd0RSw4QkFBUSxPQUFPLEVBQUUsWUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWlCLENBQ3REO1FBQ04sMkJBQUssS0FBSyxFQUFDLGdCQUFnQixHQUNyQixDQUNKO0FBeEJOLENBd0JNLENBQUM7QUFHWCxpQkFBd0IsRUFBcUI7UUFBbkIsa0JBQU0sRUFBRSxjQUFJLEVBQUUsWUFBRztJQUN2QyxJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQUEsSUFBSTtRQUN6QixNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ1gsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQzs7b0JBQWMsWUFBSSxDQUFDLGdCQUFnQixDQUFDOztvQkFBRyxZQUFJLENBQUMsWUFBWSxDQUFDLENBQU8sQ0FBQztZQUM1RSxLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLENBQ0g7b0JBQ0ssWUFBSSxDQUFDLGdCQUFnQixDQUFDO29CQUN2QixrQkFBQyxjQUFNLElBQUMsTUFBTSxFQUFFLFlBQUksQ0FBQyw0Q0FBNEMsQ0FBQzt3QkFDOUQseUJBQUcsS0FBSyxFQUFDLFdBQVc7NEJBQUUsWUFBSSxDQUFDLGdCQUFnQixDQUFDOzs0QkFBSSxZQUFJLENBQUMsR0FBRyxDQUFDLENBQUssQ0FDekQ7b0JBQ1QsMEJBQUksS0FBSyxFQUFDLHdCQUF3QixHQUFHO29CQUNyQyxrQkFBQyxjQUFNLElBQUMsSUFBSSxFQUFFLFlBQUksQ0FBQyxpREFBaUQsQ0FBQzt3QkFDakUseUJBQUcsS0FBSyxFQUFDLFdBQVc7NEJBQUUsWUFBSSxDQUFDLGVBQWUsQ0FBQzs7NEJBQUksWUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFLLENBQ3hELENBQ1AsQ0FDVCxDQUFDO1lBQ04sS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxrQkFBQyxjQUFRLElBQUMsSUFBSSxFQUFFLFlBQUksQ0FBQyxNQUFNLENBQUMsR0FBSSxDQUFDO1lBQzVDLEtBQUssUUFBUTtnQkFDVCxNQUFNLENBQUMsa0JBQUMsY0FBUSxJQUFDLElBQUksRUFBRSxZQUFJLENBQUMsTUFBTSxDQUFDLEdBQUksQ0FBQztZQUM1QyxLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGNBQU8sT0FBRyxDQUFDO1lBQ3ZCLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsa0JBQUMsY0FBUSxPQUFHLENBQUM7WUFDeEI7Z0JBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUlQLENBQUM7QUFqQ0QsMEJBaUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmltcG9ydCB7IFhhbmlhIGFzIHhhbmlhLCBSZXBlYXQsIGV4cHIsIERvbSwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uLy4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IENsb2NrQXBwIH0gZnJvbSBcIi4vLi4vY2xvY2svYXBwXCJcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuL3RvZG9cIlxyXG5pbXBvcnQgeyBCYWxsc0FwcCB9IGZyb20gXCIuLy4uL2JhbGxzL2FwcFwiXHJcbmltcG9ydCB7IFVybEhlbHBlciwgSHRtbEhlbHBlciB9IGZyb20gXCIuLi8uLi9zcmMvbXZjXCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdG9yZSgpIHtcclxuICAgIHJldHVybiBuZXcgUmUuU3RvcmUoe1xyXG4gICAgICAgIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCksXHJcbiAgICAgICAgdXNlcjogeyBmaXJzdE5hbWU6IFwiSWJyYWhpbVwiLCBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIiB9LFxyXG4gICAgICAgIHNpemUodHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoKHRzICUgMTAwMCkgLyA1MCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgW01hdGhdKTtcclxufVxyXG5cclxudmFyIGxheW91dDogYW55ID0gKHZpZXcsIHVybDogVXJsSGVscGVyKSA9PlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8aDE+e2V4cHIoXCJ1c2VyLmZpcnN0TmFtZVwiKX0ge2V4cHIoXCJ1c2VyLmxhc3ROYW1lXCIpfTwvaDE+XHJcbiAgICAgICAgPGRpdiBzdHlsZT1cImNsZWFyOiBib3RoO1wiPlxyXG4gICAgICAgICAgICA8YSBocmVmPVwiI1wiIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ3RvZG9zJyl9PnRvZG9zPC9hPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIHZpZXc6XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbignaW5kZXgnKX0+aG9tZTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ3ZpZXcxJyl9PnZpZXcgMTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ3ZpZXcyJyl9PnZpZXcgMjwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ2Nsb2NrJyl9PmNsb2NrPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17dXJsLmFjdGlvbignY2xvY2syJyl9PmNsb2NrIDI8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXt1cmwuYWN0aW9uKCd0b2RvcycpfT50b2RvczwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e3VybC5hY3Rpb24oJ2JhbGxzJyl9PmJhbGxzPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICBtb2RlbDpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtleHByKFwidXNlci5maXJzdE5hbWUgPC0gJ1JhbXknXCIpfT5SYW15PC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZXhwcihcInVzZXIuZmlyc3ROYW1lIDwtICdJYnJhaGltJ1wiKX0+SWJyYWhpbTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDtcclxuICAgICAgICAgICAgdGltZTpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtleHByKFwidGltZS50b2dnbGUgKClcIil9PnRvZ2dsZTwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAxMHB4O1wiPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+O1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlKHsgZHJpdmVyLCBodG1sLCB1cmwgfSkge1xyXG4gICAgdmFyIG1haW5WaWV3ID0gdXJsLnJvdXRlKHBhdGggPT4ge1xyXG4gICAgICAgIHN3aXRjaCAocGF0aCkge1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3MSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj52aWV3IDE6IHtleHByKFwidXNlci5maXJzdE5hbWVcIil9IHtleHByKFwiYXdhaXQgdGltZVwiKX08L2Rpdj47XHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXcyJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge2V4cHIoXCJ1c2VyLmZpcnN0TmFtZVwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFJlcGVhdCBzb3VyY2U9e2V4cHIoXCJmb3IgdiBpbiBbMS4uKG1pbiAoc2l6ZSAoYXdhaXQgdGltZSkpIDEwKV1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW46IDBcIj57ZXhwcihcInVzZXIuZmlyc3ROYW1lXCIpfToge2V4cHIoXCJ2XCIpfTwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9SZXBlYXQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxociBzdHlsZT1cInBhZGRpbmc6IDA7IG1hcmdpbjogMDtcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8UmVwZWF0IGV4cHI9e2V4cHIoXCJmb3IgZyBpbiBbKDEgKyBtaW4gKHNpemUgKGF3YWl0IHRpbWUpKSAxMCkuLjEwXVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogMFwiPntleHByKFwidXNlci5sYXN0TmFtZVwiKX06IHtleHByKFwiZ1wiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvUmVwZWF0PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY2FzZSAnY2xvY2snOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxDbG9ja0FwcCB0aW1lPXtleHByKFwidGltZVwiKX0gLz47XHJcbiAgICAgICAgICAgIGNhc2UgJ2Nsb2NrMic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPENsb2NrQXBwIHRpbWU9e2V4cHIoXCJ0aW1lXCIpfSAvPjtcclxuICAgICAgICAgICAgY2FzZSAndG9kb3MnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxUb2RvQXBwIC8+O1xyXG4gICAgICAgICAgICBjYXNlICdiYWxscyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPEJhbGxzQXBwIC8+O1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0bWwucGFydGlhbChwYXRoLCB7fSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8geGFuaWEudmlldyhsYXlvdXQobWFpblZpZXcsIHVybCkpXHJcbiAgICAgICAvLyAuYmluZChzdG9yZSgpLCBkcml2ZXIpO1xyXG59Il19