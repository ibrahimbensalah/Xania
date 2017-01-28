"use strict";
var observables_1 = require("../../src/observables");
var dom_1 = require("../../src/dom");
var reactive_1 = require("../../src/reactive");
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
function init(tpl, target) {
    var store = new reactive_1.Reactive.Store(new ClockApp());
    dom_1.Dom.parse(tpl).bind(target, store);
}
exports.init = init;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2Nsb2NrL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBQ25ELHFDQUFtQztBQUNuQywrQ0FBbUQ7QUFFbkQ7SUFBQTtRQUNJLFNBQUksR0FBRyxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7SUFnQmxDLENBQUM7SUFkVSxxQkFBWSxHQUFuQixVQUFvQixJQUFJO1FBQ3BCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVNLHFCQUFZLEdBQW5CLFVBQW9CLElBQUk7UUFDcEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDdkIsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVNLG1CQUFVLEdBQWpCLFVBQWtCLElBQUk7UUFDbEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFDTCxlQUFDO0FBQUQsQ0FBQyxBQWpCRCxJQWlCQztBQUVELGNBQXFCLEdBQUcsRUFBRSxNQUFZO0lBQ2xDLElBQUksS0FBSyxHQUFHLElBQUksbUJBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLFNBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBSEQsb0JBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5pbXBvcnQgeyBEb20gfSBmcm9tIFwiLi4vLi4vc3JjL2RvbVwiXHJcbmltcG9ydCB7IFJlYWN0aXZlIGFzIFJlIH0gZnJvbSAnLi4vLi4vc3JjL3JlYWN0aXZlJ1xyXG5cclxuY2xhc3MgQ2xvY2tBcHAge1xyXG4gICAgdGltZSA9IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCk7XHJcblxyXG4gICAgc3RhdGljIHNlY29uZHNBbmdsZSh0aW1lKSB7XHJcbiAgICAgICAgdmFyIGYgPSA0O1xyXG4gICAgICAgIHJldHVybiAzNjAgKiAoTWF0aC5mbG9vcih0aW1lIC8gKDEwMDAgLyBmKSkgJSAoNjAgKiBmKSkgLyAoNjAgKiBmKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgbWludXRlc0FuZ2xlKHRpbWUpIHtcclxuICAgICAgICB2YXIgZiA9IDYwICogNjAgKiAxMDAwO1xyXG4gICAgICAgIHJldHVybiAzNjAgKiAodGltZSAlIGYpIC8gZjtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaG91cnNBbmdsZSh0aW1lKSB7XHJcbiAgICAgICAgdmFyIGYgPSAxMiAqIDYwICogNjAgKiAxMDAwO1xyXG4gICAgICAgIHJldHVybiAzNjAgKiAodGltZSAlIGYpIC8gZjtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluaXQodHBsLCB0YXJnZXQ6IE5vZGUpIHtcclxuICAgIHZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZShuZXcgQ2xvY2tBcHAoKSk7XHJcbiAgICBEb20ucGFyc2UodHBsKS5iaW5kKHRhcmdldCwgc3RvcmUpO1xyXG59XHJcbiJdfQ==