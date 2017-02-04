"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
function bind(target) {
    var view = new observables_1.Observables.Observable("view1");
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
                return xania_1.Xania.tag(ClockApp, { time: xania_1.fs("time") });
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
            "\u00A0\u00A0\u00A0\u00A0" + " " + "model:",
            xania_1.Xania.tag("button", { click: xania_1.fs("user.firstName <- 'Ramy'") }, "Ramy"),
            xania_1.Xania.tag("button", { click: xania_1.fs("user.firstName <- 'Ibrahim'") }, "Ibrahim"),
            "\u00A0\u00A0\u00A0\u00A0" + " " + "time:",
            xania_1.Xania.tag("button", { click: xania_1.fs("time.toggle ()") }, "toggle")),
        xania_1.Xania.tag("div", { style: "padding: 10px;" }, xania_1.View.partial(view, { user: xania_1.fs("user"), time: new observables_1.Observables.Time() })),
        xania_1.Xania.tag(ClockApp, null));
};
var ClockApp = (function () {
    function ClockApp() {
        this.time = new observables_1.Observables.Time();
    }
    ClockApp.secondsAngle = function (time) {
        var f = 4;
        return 360 * (Math.floor(time / (1000 / f)) % (60 * f)) / (60 * f);
    };
    ClockApp.minutesAngle = function (time) {
        var f = 60 * 60 * 1000;
        return 360 * (time % f) / f;
    };
    ClockApp.hoursAngle = function (time) {
        var f = 12 * 60 * 60 * 1000;
        return 360 * (time % f) / f;
    };
    ClockApp.prototype.render = function () {
        return (xania_1.Xania.tag("div", { style: "height: 200px;" },
            xania_1.Xania.tag("svg", { viewBox: "0 0 200 200" },
                xania_1.Xania.tag("g", { transform: "scale(2) translate(50,50)" },
                    xania_1.Xania.tag("circle", { className: "clock-face", r: "35" }),
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for p in [ 0..59 ]") },
                        xania_1.Xania.tag("line", { className: "minor", y1: "42", y2: "45", transform: ["rotate(", xania_1.fs("p * 6"), ")"] })),
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for p in [ 0..11 ]") },
                        xania_1.Xania.tag("line", { className: "major", y1: "35", y2: "45", transform: ["rotate(", xania_1.fs("p * 30"), ")"] })),
                    xania_1.Xania.tag("line", { className: "hour", y1: "2", y2: "-20", transform: ["rotate(", xania_1.fs("hoursAngle (await time)"), ")"] }),
                    xania_1.Xania.tag("line", { className: "minute", y1: "4", y2: "-30", transform: ["rotate(", xania_1.fs("minutesAngle (await time)"), ")"] }),
                    xania_1.Xania.tag("g", { transform: ["rotate(", xania_1.fs("secondsAngle (await time)"), ")"] },
                        xania_1.Xania.tag("line", { className: "second", y1: "10", y2: "-38" }),
                        xania_1.Xania.tag("line", { className: "second-counterweight", y1: "10", y2: "2" }))))));
    };
    return ClockApp;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2xheW91dC9hcHAudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxREFBbUQ7QUFFbkQseUNBQTBFO0FBRTFFLGNBQXFCLE1BQVk7SUFDN0IsSUFBSSxJQUFJLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQyxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ3JCLElBQUksTUFBQTtRQUNKLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNyRCxLQUFLLFlBQUMsUUFBUTtZQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFDRCxJQUFJLFlBQUMsRUFBRTtZQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDSixFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUVYLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBQSxRQUFRO1FBQzVCLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDZixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDOztvQkFBYyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7O29CQUFHLFVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBTyxDQUFDO1lBQ3hFLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsQ0FDSDtvQkFDSyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7b0JBQ3JCLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsVUFB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QkFBTSxTQUFTLEVBQUMsUUFBUSxFQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLEtBQUssR0FBUTt3QkFDakQsNEJBQU0sU0FBUyxFQUFDLHNCQUFzQixFQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLEdBQUcsR0FBUSxDQUM3RCxDQUNKLENBQ0YsQ0FDSixDQUNULENBQUM7SUFDTixDQUFDO0lBQ0wsZUFBQztBQUFELENBQUMsQUF6Q0QsSUF5Q0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5cclxuaW1wb3J0IHsgWGFuaWEsIEZvckVhY2gsIGZzLCBWaWV3LCBSZWFjdGl2ZSBhcyBSZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQodGFyZ2V0OiBOb2RlKSB7XHJcbiAgICB2YXIgdmlldyA9IG5ldyBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlKFwidmlldzFcIik7XHJcbiAgICB2YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUoe1xyXG4gICAgICAgIHZpZXcsXHJcbiAgICAgICAgdGltZTogbmV3IE9ic2VydmFibGVzLlRpbWUoKSxcclxuICAgICAgICB1c2VyOiB7IGZpcnN0TmFtZTogXCJJYnJhaGltXCIsIGxhc3ROYW1lOiBcImJlbiBTYWxhaFwiIH0sXHJcbiAgICAgICAgcm91dGUodmlld05hbWUpIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3Lm9uTmV4dCh2aWV3TmFtZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaXplKHRzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKCh0cyAlIDEwMDApIC8gNTApO1xyXG4gICAgICAgIH1cclxuICAgIH0sIFtNYXRoXSk7XHJcblxyXG4gICAgdmFyIG1haW5WaWV3ID0gdmlldy5tYXAodmlld05hbWUgPT4ge1xyXG4gICAgICAgIHN3aXRjaCAodmlld05hbWUpIHtcclxuICAgICAgICAgICAgY2FzZSAndmlldzEnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+dmlldyAxOiB7ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX0ge2ZzKFwiYXdhaXQgdGltZVwiKX08L2Rpdj47XHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXcyJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge2ZzKFwidXNlci5maXJzdE5hbWVcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHYgaW4gWzEuLihtaW4gKHNpemUgKGF3YWl0IHRpbWUpKSAxMCldXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOiAwXCI+e2ZzKFwidXNlci5maXJzdE5hbWVcIil9OiB7ZnMoXCJ2XCIpfTwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aHIgc3R5bGU9XCJwYWRkaW5nOiAwOyBtYXJnaW46IDA7XCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgZyBpbiBbKDEgKyBtaW4gKHNpemUgKGF3YWl0IHRpbWUpKSAxMCkuLjEwXVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogMFwiPntmcyhcInVzZXIubGFzdE5hbWVcIil9OiB7ZnMoXCJnXCIpfTwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY2FzZSAnY2xvY2snOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxDbG9ja0FwcCB0aW1lPXtmcyhcInRpbWVcIil9IC8+O1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIFhhbmlhLnZpZXcobGF5b3V0KG1haW5WaWV3KSkuYmluZCh0YXJnZXQsIHN0b3JlKTtcclxufVxyXG5cclxudmFyIGxheW91dDogYW55ID0gdmlldyA9PlxyXG4gICAgPGRpdj5cclxuICAgICAgICA8aDE+e2ZzKFwidXNlci5maXJzdE5hbWVcIil9IHtmcyhcInVzZXIubGFzdE5hbWVcIil9PC9oMT5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICB2aWV3OlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInJvdXRlICd2aWV3MSdcIil9PnZpZXcgMTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInJvdXRlICd2aWV3MidcIil9PnZpZXcgMjwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInJvdXRlICdjbG9jaydcIil9PmNsb2NrPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICBtb2RlbDpcclxuICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnUmFteSdcIil9PlJhbXk8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnSWJyYWhpbSdcIil9PklicmFoaW08L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIHRpbWU6XHJcbiAgICAgICAgICAgIDxidXR0b24gY2xpY2s9e2ZzKFwidGltZS50b2dnbGUgKClcIil9PnRvZ2dsZTwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAxMHB4O1wiPlxyXG4gICAgICAgICAgICB7Vmlldy5wYXJ0aWFsKHZpZXcsIHsgdXNlcjogZnMoXCJ1c2VyXCIpLCB0aW1lOiBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpIH0pfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxDbG9ja0FwcCAvPlxyXG4gICAgPC9kaXY+O1xyXG5cclxuY2xhc3MgQ2xvY2tBcHAge1xyXG4gICAgdGltZSA9IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCk7XHJcblxyXG4gICAgc3RhdGljIHNlY29uZHNBbmdsZSh0aW1lKSB7XHJcbiAgICAgICAgdmFyIGYgPSA0O1xyXG4gICAgICAgIHJldHVybiAzNjAgKiAoTWF0aC5mbG9vcih0aW1lIC8gKDEwMDAgLyBmKSkgJSAoNjAgKiBmKSkgLyAoNjAgKiBmKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgbWludXRlc0FuZ2xlKHRpbWUpIHtcclxuICAgICAgICB2YXIgZiA9IDYwICogNjAgKiAxMDAwO1xyXG4gICAgICAgIHJldHVybiAzNjAgKiAodGltZSAlIGYpIC8gZjtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaG91cnNBbmdsZSh0aW1lKSB7XHJcbiAgICAgICAgdmFyIGYgPSAxMiAqIDYwICogNjAgKiAxMDAwO1xyXG4gICAgICAgIHJldHVybiAzNjAgKiAodGltZSAlIGYpIC8gZjtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogMjAwcHg7XCI+XHJcbiAgICAgICAgICAgICAgICA8c3ZnIHZpZXdCb3g9XCIwIDAgMjAwIDIwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxnIHRyYW5zZm9ybT1cInNjYWxlKDIpIHRyYW5zbGF0ZSg1MCw1MClcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGNpcmNsZSBjbGFzc05hbWU9XCJjbG9jay1mYWNlXCIgcj1cIjM1XCI+PC9jaXJjbGU+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHAgaW4gWyAwLi41OSBdXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaW5lIGNsYXNzTmFtZT1cIm1pbm9yXCIgeTE9XCI0MlwiIHkyPVwiNDVcIiB0cmFuc2Zvcm09eyBbXCJyb3RhdGUoXCIsIGZzKFwicCAqIDZcIiksIFwiKVwiIF0gfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHAgaW4gWyAwLi4xMSBdXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaW5lIGNsYXNzTmFtZT1cIm1ham9yXCIgeTE9XCIzNVwiIHkyPVwiNDVcIiB0cmFuc2Zvcm09eyBbIFwicm90YXRlKFwiLCBmcyhcInAgKiAzMFwiKSwgXCIpXCIgXSB9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpbmUgY2xhc3NOYW1lPVwiaG91clwiIHkxPVwiMlwiIHkyPVwiLTIwXCIgdHJhbnNmb3JtPXtbIFwicm90YXRlKFwiLCBmcyhcImhvdXJzQW5nbGUgKGF3YWl0IHRpbWUpXCIpLCBcIilcIiBdfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGluZSBjbGFzc05hbWU9XCJtaW51dGVcIiB5MT1cIjRcIiB5Mj1cIi0zMFwiIHRyYW5zZm9ybT17W1wicm90YXRlKFwiLCBmcyhcIm1pbnV0ZXNBbmdsZSAoYXdhaXQgdGltZSlcIiksIFwiKVwiIF19IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxnIHRyYW5zZm9ybT17W1wicm90YXRlKFwiLCBmcyhcInNlY29uZHNBbmdsZSAoYXdhaXQgdGltZSlcIiksIFwiKVwiXSB9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpbmUgY2xhc3NOYW1lPVwic2Vjb25kXCIgeTE9XCIxMFwiIHkyPVwiLTM4XCI+PC9saW5lPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpbmUgY2xhc3NOYW1lPVwic2Vjb25kLWNvdW50ZXJ3ZWlnaHRcIiB5MT1cIjEwXCIgeTI9XCIyXCI+PC9saW5lPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2c+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9nPlxyXG4gICAgICAgICAgICAgICAgPC9zdmc+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==