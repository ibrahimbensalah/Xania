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
            return (ts % 1000) / 50;
        }
    }, [ClockApp, Math]);
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
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for v in [0..(min (size (await time)) 10)]") },
                        xania_1.Xania.tag("p", null,
                            xania_1.fs("user.firstName"),
                            ": ",
                            xania_1.fs("v"))),
                    xania_1.Xania.tag("hr", null),
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for g in [0..(min (10 - size (await time)) 10)]") },
                        xania_1.Xania.tag("p", null,
                            xania_1.fs("user.lastName"),
                            ": ",
                            xania_1.fs("g")))));
            case 'clock':
                return clock;
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
        xania_1.Xania.tag("div", { style: "padding: 10px;" }, xania_1.View.partial(view, { user: xania_1.fs("user"), time: new observables_1.Observables.Time() })));
};
var clock = (xania_1.Xania.tag("svg", { viewBox: "0 0 200 200" },
    xania_1.Xania.tag("g", { transform: "scale(2) translate(50,50)" },
        xania_1.Xania.tag("circle", { className: "clock-face", r: "35" }),
        xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for p in [ 0..59 ]") },
            xania_1.Xania.tag("line", { className: "minor", y1: "42", y2: "45", transform: xania_1.parseTpl("rotate( {{ p * 6 }} )") })),
        xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for p in [ 0..11 ]") },
            xania_1.Xania.tag("line", { className: "major", y1: "35", y2: "45", transform: xania_1.parseTpl("rotate( {{ p * 30 }} )") })),
        xania_1.Xania.tag("line", { className: "hour", y1: "2", y2: "-20", transform: xania_1.parseTpl("rotate( {{ hoursAngle (await time) }} )") }),
        xania_1.Xania.tag("line", { className: "minute", y1: "4", y2: "-30", transform: xania_1.parseTpl("rotate( {{ minutesAngle (await time) }} )") }),
        xania_1.Xania.tag("g", { transform: xania_1.parseTpl("rotate( {{ secondsAngle (await time) }} )") },
            xania_1.Xania.tag("line", { className: "second", y1: "10", y2: "-38" }),
            xania_1.Xania.tag("line", { className: "second-counterweight", y1: "10", y2: "2" })))));
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
    return ClockApp;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2xheW91dC9hcHAudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxREFBbUQ7QUFFbkQseUNBQW9GO0FBRXBGLGNBQXFCLE1BQVk7SUFDN0IsSUFBSSxJQUFJLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQyxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ3JCLElBQUksTUFBQTtRQUNKLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRTtRQUNyRCxLQUFLLFlBQUMsUUFBUTtZQUNWLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFDRCxJQUFJLFlBQUMsRUFBRTtZQUNILE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDNUIsQ0FBQztLQUNKLEVBQUUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUVyQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUEsUUFBUTtRQUM1QixNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2YsS0FBSyxPQUFPO2dCQUNSLE1BQU0sQ0FBQzs7b0JBQWMsVUFBRSxDQUFDLGdCQUFnQixDQUFDOztvQkFBRyxVQUFFLENBQUMsWUFBWSxDQUFDLENBQU8sQ0FBQztZQUN4RSxLQUFLLE9BQU87Z0JBQ1IsTUFBTSxDQUFDLENBQ0g7b0JBQ0ssVUFBRSxDQUFDLGdCQUFnQixDQUFDO29CQUNyQixrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyw0Q0FBNEMs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SyxHQUFRO1lBQ2pELDRCQUFNLFNBQVMsRUFBQyxzQkFBc0IsRUFBQyxFQUFFLEVBQUMsSUFBSSxFQUFDLEVBQUUsRUFBQyxHQUFHLEdBQVEsQ0FDN0QsQ0FDSixDQUNGLENBQ1QsQ0FBQztBQUVGO0lBQUE7UUFDSSxTQUFJLEdBQUcsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRSxDQUFDO0lBZ0JsQyxDQUFDO0lBZFUscUJBQVksR0FBbkIsVUFBb0IsSUFBSTtRQUNwQixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFTSxxQkFBWSxHQUFuQixVQUFvQixJQUFJO1FBQ3BCLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSxtQkFBVSxHQUFqQixVQUFrQixJQUFJO1FBQ2xCLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztRQUM1QixNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBQ0wsZUFBQztBQUFELENBQUMsQUFqQkQsSUFpQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5cclxuaW1wb3J0IHsgWGFuaWEsIEZvckVhY2gsIGZzLCBwYXJzZVRwbCwgVmlldywgUmVhY3RpdmUgYXMgUmUgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiaW5kKHRhcmdldDogTm9kZSkge1xyXG4gICAgdmFyIHZpZXcgPSBuZXcgT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZShcInZpZXcxXCIpO1xyXG4gICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHtcclxuICAgICAgICB2aWV3LFxyXG4gICAgICAgIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCksXHJcbiAgICAgICAgdXNlcjogeyBmaXJzdE5hbWU6IFwiSWJyYWhpbVwiLCBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIiB9LFxyXG4gICAgICAgIHJvdXRlKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5vbk5leHQodmlld05hbWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2l6ZSh0cykge1xyXG4gICAgICAgICAgICByZXR1cm4gKHRzICUgMTAwMCkgLyA1MDtcclxuICAgICAgICB9XHJcbiAgICB9LCBbQ2xvY2tBcHAsIE1hdGhdKTtcclxuXHJcbiAgICB2YXIgbWFpblZpZXcgPSB2aWV3Lm1hcCh2aWV3TmFtZSA9PiB7XHJcbiAgICAgICAgc3dpdGNoICh2aWV3TmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3MSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj52aWV3IDE6IHtmcyhcInVzZXIuZmlyc3ROYW1lXCIpfSB7ZnMoXCJhd2FpdCB0aW1lXCIpfTwvZGl2PjtcclxuICAgICAgICAgICAgY2FzZSAndmlldzInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgdiBpbiBbMC4uKG1pbiAoc2l6ZSAoYXdhaXQgdGltZSkpIDEwKV1cIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHA+e2ZzKFwidXNlci5maXJzdE5hbWVcIil9OiB7ZnMoXCJ2XCIpfTwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aHIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgZyBpbiBbMC4uKG1pbiAoMTAgLSBzaXplIChhd2FpdCB0aW1lKSkgMTApXVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cD57ZnMoXCJ1c2VyLmxhc3ROYW1lXCIpfToge2ZzKFwiZ1wiKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Nsb2NrJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiBjbG9jaztcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBYYW5pYS52aWV3KGxheW91dChtYWluVmlldykpLmJpbmQodGFyZ2V0LCBzdG9yZSk7XHJcbn1cclxuXHJcbnZhciBsYXlvdXQ6IGFueSA9IHZpZXcgPT5cclxuICAgIDxkaXY+XHJcbiAgICAgICAgPGgxPntmcyhcInVzZXIuZmlyc3ROYW1lXCIpfSB7ZnMoXCJ1c2VyLmxhc3ROYW1lXCIpfTwvaDE+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgdmlldzpcclxuICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJyb3V0ZSAndmlldzEnXCIpfT52aWV3IDE8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJyb3V0ZSAndmlldzInXCIpfT52aWV3IDI8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJyb3V0ZSAnY2xvY2snXCIpfT5jbG9jazwvYnV0dG9uPlxyXG4gICAgICAgICAgICAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDtcclxuICAgICAgICAgICAgbW9kZWw6XHJcbiAgICAgICAgICAgIDxidXR0b24gY2xpY2s9e2ZzKFwidXNlci5maXJzdE5hbWUgPC0gJ1JhbXknXCIpfT5SYW15PC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gY2xpY2s9e2ZzKFwidXNlci5maXJzdE5hbWUgPC0gJ0licmFoaW0nXCIpfT5JYnJhaGltPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICB0aW1lOlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInRpbWUudG9nZ2xlICgpXCIpfT50b2dnbGU8L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMTBweDtcIj5cclxuICAgICAgICAgICAge1ZpZXcucGFydGlhbCh2aWV3LCB7IHVzZXI6IGZzKFwidXNlclwiKSwgdGltZTogbmV3IE9ic2VydmFibGVzLlRpbWUoKSB9KX1cclxuICAgICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PjtcclxuXHJcbnZhciBjbG9jayA9IChcclxuICAgIDxzdmcgdmlld0JveD1cIjAgMCAyMDAgMjAwXCI+XHJcbiAgICAgICAgPGcgdHJhbnNmb3JtPVwic2NhbGUoMikgdHJhbnNsYXRlKDUwLDUwKVwiPlxyXG4gICAgICAgICAgICA8Y2lyY2xlIGNsYXNzTmFtZT1cImNsb2NrLWZhY2VcIiByPVwiMzVcIj48L2NpcmNsZT5cclxuICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgcCBpbiBbIDAuLjU5IF1cIil9PlxyXG4gICAgICAgICAgICAgICAgPGxpbmUgY2xhc3NOYW1lPVwibWlub3JcIiB5MT1cIjQyXCIgeTI9XCI0NVwiIHRyYW5zZm9ybT17cGFyc2VUcGwoXCJyb3RhdGUoIHt7IHAgKiA2IH19IClcIil9IC8+XHJcbiAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgcCBpbiBbIDAuLjExIF1cIil9PlxyXG4gICAgICAgICAgICAgICAgPGxpbmUgY2xhc3NOYW1lPVwibWFqb3JcIiB5MT1cIjM1XCIgeTI9XCI0NVwiIHRyYW5zZm9ybT17cGFyc2VUcGwoXCJyb3RhdGUoIHt7IHAgKiAzMCB9fSApXCIpfSAvPlxyXG4gICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgIDxsaW5lIGNsYXNzTmFtZT1cImhvdXJcIiB5MT1cIjJcIiB5Mj1cIi0yMFwiIHRyYW5zZm9ybT17cGFyc2VUcGwoXCJyb3RhdGUoIHt7IGhvdXJzQW5nbGUgKGF3YWl0IHRpbWUpIH19IClcIil9IC8+XHJcbiAgICAgICAgICAgIDxsaW5lIGNsYXNzTmFtZT1cIm1pbnV0ZVwiIHkxPVwiNFwiIHkyPVwiLTMwXCIgdHJhbnNmb3JtPXtwYXJzZVRwbChcInJvdGF0ZSgge3sgbWludXRlc0FuZ2xlIChhd2FpdCB0aW1lKSB9fSApXCIpfSAvPlxyXG4gICAgICAgICAgICA8ZyB0cmFuc2Zvcm09e3BhcnNlVHBsKFwicm90YXRlKCB7eyBzZWNvbmRzQW5nbGUgKGF3YWl0IHRpbWUpIH19IClcIil9PlxyXG4gICAgICAgICAgICAgICAgPGxpbmUgY2xhc3NOYW1lPVwic2Vjb25kXCIgeTE9XCIxMFwiIHkyPVwiLTM4XCI+PC9saW5lPlxyXG4gICAgICAgICAgICAgICAgPGxpbmUgY2xhc3NOYW1lPVwic2Vjb25kLWNvdW50ZXJ3ZWlnaHRcIiB5MT1cIjEwXCIgeTI9XCIyXCI+PC9saW5lPlxyXG4gICAgICAgICAgICA8L2c+XHJcbiAgICAgICAgPC9nPlxyXG4gICAgPC9zdmc+XHJcbik7XHJcblxyXG5jbGFzcyBDbG9ja0FwcCB7XHJcbiAgICB0aW1lID0gbmV3IE9ic2VydmFibGVzLlRpbWUoKTtcclxuXHJcbiAgICBzdGF0aWMgc2Vjb25kc0FuZ2xlKHRpbWUpIHtcclxuICAgICAgICB2YXIgZiA9IDQ7XHJcbiAgICAgICAgcmV0dXJuIDM2MCAqIChNYXRoLmZsb29yKHRpbWUgLyAoMTAwMCAvIGYpKSAlICg2MCAqIGYpKSAvICg2MCAqIGYpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBtaW51dGVzQW5nbGUodGltZSkge1xyXG4gICAgICAgIHZhciBmID0gNjAgKiA2MCAqIDEwMDA7XHJcbiAgICAgICAgcmV0dXJuIDM2MCAqICh0aW1lICUgZikgLyBmO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBob3Vyc0FuZ2xlKHRpbWUpIHtcclxuICAgICAgICB2YXIgZiA9IDEyICogNjAgKiA2MCAqIDEwMDA7XHJcbiAgICAgICAgcmV0dXJuIDM2MCAqICh0aW1lICUgZikgLyBmO1xyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=