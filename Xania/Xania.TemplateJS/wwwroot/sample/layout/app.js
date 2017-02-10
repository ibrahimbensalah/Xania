"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
var clock_1 = require("./clock");
var todo_1 = require("./todo");
var index_1 = require("./../motion/index");
var Animate = (function (_super) {
    __extends(Animate, _super);
    function Animate(attrs, children) {
        var _this = _super.call(this) || this;
        _this.children = children;
        return _this;
    }
    Animate.prototype.update = function (context, sinks) {
        for (var i = 0; i < this.bindings.length; i++) {
            this.bindings[i].update(context, sinks);
        }
        return _super.prototype.update.call(this, context, sinks);
    };
    Animate.prototype.render = function (context, sinks) {
    };
    Animate.prototype.accept = function (visitor) {
        this.bindings = this.children.map(function (x) { return x.accept(visitor, null); });
        return this;
    };
    Animate.prototype.view = function (xania) {
        return this;
    };
    return Animate;
}(xania_1.Reactive.Binding));
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
                return xania_1.Xania.tag(Animate, null,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2xheW91dC9hcHAudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHFEQUFtRDtBQUVuRCx5Q0FBNkY7QUFDN0YsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQywyQ0FBNkM7QUFFN0M7SUFBc0IsMkJBQVU7SUFJNUIsaUJBQVksS0FBSyxFQUFVLFFBQTBCO1FBQXJELFlBQ0ksaUJBQU8sU0FDVjtRQUYwQixjQUFRLEdBQVIsUUFBUSxDQUFrQjs7SUFFckQsQ0FBQztJQUNELHdCQUFNLEdBQU4sVUFBTyxPQUFPLEVBQUUsS0FBSztRQUNqQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDNUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxNQUFNLENBQUMsaUJBQU0sTUFBTSxZQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBQ0Qsd0JBQU0sR0FBTixVQUFPLE9BQU8sRUFBRSxLQUFLO0lBQ3JCLENBQUM7SUFDRCx3QkFBTSxHQUFOLFVBQU8sT0FBTztRQUNWLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBdkIsQ0FBdUIsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUNELHNCQUFJLEdBQUosVUFBSyxLQUFLO1FBQ04sTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQ0ws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QUFDLFlBQWdCO1lBQ3BELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUMsYUFBaUI7O1lBR3RELDhCQUFRLE9BQU8sRUFBRSxVQUFFLENBQUMsMEJBQTBCLENBQUMsV0FBZTtZQUM5RCw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLDZCQUE2QixDQUFDLGNBQWtCOztZQUdwRSw4QkFBUSxPQUFPLEVBQUUsVUFBRSxDQUFDLGdCQUFnQixDQUFDLGFBQWlCLENBQ3BEO1FBQ04sMkJBQUssS0FBSyxFQUFDLGdCQUFnQixJQUN0QixZQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxVQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQ3JFLENBQ0o7QUFwQk4sQ0FvQk0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4uLy4uL3NyYy9vYnNlcnZhYmxlc1wiXHJcblxyXG5pbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgRm9yRWFjaCwgZnMsIFZpZXcsIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBDbG9ja0FwcCB9IGZyb20gXCIuL2Nsb2NrXCJcclxuaW1wb3J0IHsgVG9kb0FwcCB9IGZyb20gXCIuL3RvZG9cIlxyXG5pbXBvcnQgeyBNb3Rpb25BcHAgfSBmcm9tIFwiLi8uLi9tb3Rpb24vaW5kZXhcIlxyXG5cclxuY2xhc3MgQW5pbWF0ZSBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG5cclxuICAgIGJpbmRpbmdzOiBhbnlbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhdHRycywgcHJpdmF0ZSBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICB9XHJcbiAgICB1cGRhdGUoY29udGV4dCwgc2lua3MpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYmluZGluZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tpXS51cGRhdGUoY29udGV4dCwgc2lua3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3VwZXIudXBkYXRlKGNvbnRleHQsIHNpbmtzKTtcclxuICAgIH1cclxuICAgIHJlbmRlcihjb250ZXh0LCBzaW5rcykge1xyXG4gICAgfVxyXG4gICAgYWNjZXB0KHZpc2l0b3IpIHtcclxuICAgICAgICB0aGlzLmJpbmRpbmdzID0gdGhpcy5jaGlsZHJlbi5tYXAoeCA9PiB4LmFjY2VwdCh2aXNpdG9yLCBudWxsKSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbiAgICB2aWV3KHhhbmlhKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiaW5kKHRhcmdldDogTm9kZSkge1xyXG4gICAgdmFyIHZpZXcgPSBuZXcgT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZShcIm1vdGlvblwiKTtcclxuICAgIHZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICAgICAgdmlldyxcclxuICAgICAgICB0aW1lOiBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpLFxyXG4gICAgICAgIHVzZXI6IHsgZmlyc3ROYW1lOiBcIklicmFoaW1cIiwgbGFzdE5hbWU6IFwiYmVuIFNhbGFoXCIgfSxcclxuICAgICAgICByb3V0ZSh2aWV3TmFtZSkge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcub25OZXh0KHZpZXdOYW1lKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNpemUodHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoKHRzICUgMTAwMCkgLyA1MCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgW01hdGhdKTtcclxuXHJcbiAgICB2YXIgbWFpblZpZXcgPSB2aWV3Lm1hcCh2aWV3TmFtZSA9PiB7XHJcbiAgICAgICAgc3dpdGNoICh2aWV3TmFtZSkge1xyXG4gICAgICAgICAgICBjYXNlICd2aWV3MSc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPEFuaW1hdGU+PGRpdj52aWV3IDE6IHtmcyhcInVzZXIuZmlyc3ROYW1lXCIpfSB7ZnMoXCJhd2FpdCB0aW1lXCIpfTwvZGl2PjwvQW5pbWF0ZT47XHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZXcyJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge2ZzKFwidXNlci5maXJzdE5hbWVcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHYgaW4gWzEuLihtaW4gKHNpemUgKGF3YWl0IHRpbWUpKSAxMCldXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxwIHN0eWxlPVwibWFyZ2luOiAwXCI+e2ZzKFwidXNlci5maXJzdE5hbWVcIil9OiB7ZnMoXCJ2XCIpfTwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aHIgc3R5bGU9XCJwYWRkaW5nOiAwOyBtYXJnaW46IDA7XCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgZyBpbiBbKDEgKyBtaW4gKHNpemUgKGF3YWl0IHRpbWUpKSAxMCkuLjEwXVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cIm1hcmdpbjogMFwiPntmcyhcInVzZXIubGFzdE5hbWVcIil9OiB7ZnMoXCJnXCIpfTwvcD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY2FzZSAnY2xvY2snOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxDbG9ja0FwcCB0aW1lPXtmcyhcInRpbWVcIil9IC8+O1xyXG4gICAgICAgICAgICBjYXNlICd0b2Rvcyc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPFRvZG9BcHAgLz47XHJcbiAgICAgICAgICAgIGNhc2UgJ21vdGlvbic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gPE1vdGlvbkFwcCAvPjtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB4YW5pYS52aWV3KGxheW91dChtYWluVmlldykpLmJpbmQodGFyZ2V0LCBzdG9yZSk7XHJcbn1cclxuXHJcbnZhciBsYXlvdXQ6IGFueSA9IHZpZXcgPT5cclxuICAgIDxkaXY+XHJcbiAgICAgICAgPGgxPntmcyhcInVzZXIuZmlyc3ROYW1lXCIpfSB7ZnMoXCJ1c2VyLmxhc3ROYW1lXCIpfSAoe2ZzKFwiYXdhaXQgdmlld1wiKX0pPC9oMT5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICB2aWV3OlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ3ZpZXcxJ1wiKX0+dmlldyAxPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJyb3V0ZSAndmlldzInXCIpfT52aWV3IDI8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInJvdXRlICdjbG9jaydcIil9PmNsb2NrPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJyb3V0ZSAndG9kb3MnXCIpfT50b2RvczwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2ZzKFwicm91dGUgJ21vdGlvbidcIil9Pm1vdGlvbjwvYnV0dG9uPlxyXG4gICAgICAgICAgICAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDtcclxuICAgICAgICAgICAgbW9kZWw6XHJcbiAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZnMoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnUmFteSdcIil9PlJhbXk8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInVzZXIuZmlyc3ROYW1lIDwtICdJYnJhaGltJ1wiKX0+SWJyYWhpbTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDtcclxuICAgICAgICAgICAgdGltZTpcclxuICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtmcyhcInRpbWUudG9nZ2xlICgpXCIpfT50b2dnbGU8L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMTBweDtcIj5cclxuICAgICAgICAgICAge1ZpZXcucGFydGlhbCh2aWV3LCB7IHVzZXI6IGZzKFwidXNlclwiKSwgdGltZTogbmV3IE9ic2VydmFibGVzLlRpbWUoKSB9KX1cclxuICAgICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PjtcclxuXHJcbiJdfQ==