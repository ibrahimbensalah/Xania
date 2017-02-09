"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
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
    ClockApp.prototype.render = function (xania) {
        return (xania.tag("div", { style: "height: 200px;" },
            xania.tag("svg", { viewBox: "0 0 200 200" },
                xania.tag("g", { transform: "scale(2) translate(50,50)" },
                    xania.tag("circle", { className: "clock-face", r: "35" }),
                    xania.tag(xania_1.ForEach, { expr: xania_1.fs("for p in [ 0..59 ]") },
                        xania.tag("line", { className: "minor", y1: "42", y2: "45", transform: ["rotate(", xania_1.fs("p * 6"), ")"] })),
                    xania.tag(xania_1.ForEach, { expr: xania_1.fs("for p in [ 0..11 ]") },
                        xania.tag("line", { className: "major", y1: "35", y2: "45", transform: ["rotate(", xania_1.fs("p * 30"), ")"] })),
                    xania.tag("line", { className: "hour", y1: "2", y2: "-20", transform: ["rotate(", xania_1.fs("hoursAngle (await time)"), ")"] }),
                    xania.tag("line", { className: "minute", y1: "4", y2: "-30", transform: ["rotate(", xania_1.fs("minutesAngle (await time)"), ")"] }),
                    xania.tag("g", { transform: ["rotate(", xania_1.fs("secondsAngle (await time)"), ")"] },
                        xania.tag("line", { className: "second", y1: "10", y2: "-38" }),
                        xania.tag("line", { className: "second-counterweight", y1: "10", y2: "2" }))))));
    };
    return ClockApp;
}());
exports.ClockApp = ClockApp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zYW1wbGUvbGF5b3V0L2Nsb2NrLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBQ25ELHlDQUE2QztBQUU3QztJQUFBO1FBQ0ksU0FBSSxHQUFHLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQXdDbEMsQ0FBQztJQXRDVSxxQkFBWSxHQUFuQixVQUFvQixJQUFJO1FBQ3BCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVNLHFCQUFZLEdBQW5CLFVBQW9CLElBQUk7UUFDcEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDdkIsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVNLG1CQUFVLEdBQWpCLFVBQWtCLElBQUk7UUFDbEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRCx5QkFBTSxHQUFOLFVBQU8sS0FBSztRQUNSLE1BQU0sQ0FBQyxDQUNILG1CQUFLLEtBQUssRUFBQyxnQkFBZ0I7WUFDdkIsbUJBQUssT0FBTyxFQUFDLGFBQWE7Z0JBQ3RCLGlCQUFHLFNBQVMsRUFBQywyQkFBMkI7b0JBQ3BDLHNCQUFRLFNBQVMsRUFBQyxZQUFZLEVBQUMsQ0FBQyxFQUFDLElBQUksR0FBVTtvQkFDL0MsVUFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxvQkFBb0IsQ0FBQzt3QkFDbkMsb0JBQU0sU0FBUyxFQUFDLE9BQU8sRUFBQyxFQUFFLEVBQUMsSUFBSSxFQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUMsU0FBUyxFQUFFLENBQUMsU0FBUyxFQUFFLFVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBSSxDQUM5RTtvQkFDVixVQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLG9CQUFvQixDQUFDO3dCQUNuQyxvQkFBTSxTQUFTLEVBQUMsT0FBTyxFQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLElBQUksRUFBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsVUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFJLENBQy9FO29CQUNWLG9CQUFNLFNBQVMsRUFBQyxNQUFNLEVBQUMsRUFBRSxFQUFDLEdBQUcsRUFBQyxFQUFFLEVBQUMsS0FBSyxFQUFDLFNBQVMsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFFLENBQUMseUJBQXlCLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBSTtvQkFDckcsb0JBQU0sU0FBUyxFQUFDLFFBQVEsRUFBQyxFQUFFLEVBQUMsR0FBRyxFQUFDLEVBQUUsRUFBQyxLQUFLLEVBQUMsU0FBUyxFQUFFLENBQUMsU0FBUyxFQUFFLFVBQUUsQ0FBQywyQkFBMkIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFJO29CQUN6RyxpQkFBRyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsVUFBRSxDQUFDLDJCQUEyQixDQUFDLEVBQUUsR0FBRyxDQUFDO3dCQUMzRCxvQkFBTSxTQUFTLEVBQUMsUUFBUSxFQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLEtBQUssR0FBUTt3QkFDakQsb0JBQU0sU0FBUyxFQUFDLHNCQUFzQixFQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUMsRUFBRSxFQUFDLEdBQUcsR0FBUSxDQUM3RCxDQUNKLENBQ0YsQ0FDSixDQUNULENBQUM7SUFDTixDQUFDO0lBQ0wsZUFBQztBQUFELENBQUMsQUF6Q0QsSUF5Q0M7QUF6Q1ksNEJBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5pbXBvcnQgeyBGb3JFYWNoLCBmcyB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5cclxuZXhwb3J0IGNsYXNzIENsb2NrQXBwIHtcclxuICAgIHRpbWUgPSBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpO1xyXG5cclxuICAgIHN0YXRpYyBzZWNvbmRzQW5nbGUodGltZSkge1xyXG4gICAgICAgIHZhciBmID0gNDtcclxuICAgICAgICByZXR1cm4gMzYwICogKE1hdGguZmxvb3IodGltZSAvICgxMDAwIC8gZikpICUgKDYwICogZikpIC8gKDYwICogZik7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIG1pbnV0ZXNBbmdsZSh0aW1lKSB7XHJcbiAgICAgICAgdmFyIGYgPSA2MCAqIDYwICogMTAwMDtcclxuICAgICAgICByZXR1cm4gMzYwICogKHRpbWUgJSBmKSAvIGY7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGhvdXJzQW5nbGUodGltZSkge1xyXG4gICAgICAgIHZhciBmID0gMTIgKiA2MCAqIDYwICogMTAwMDtcclxuICAgICAgICByZXR1cm4gMzYwICogKHRpbWUgJSBmKSAvIGY7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKHhhbmlhKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogMjAwcHg7XCI+XHJcbiAgICAgICAgICAgICAgICA8c3ZnIHZpZXdCb3g9XCIwIDAgMjAwIDIwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxnIHRyYW5zZm9ybT1cInNjYWxlKDIpIHRyYW5zbGF0ZSg1MCw1MClcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGNpcmNsZSBjbGFzc05hbWU9XCJjbG9jay1mYWNlXCIgcj1cIjM1XCI+PC9jaXJjbGU+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHAgaW4gWyAwLi41OSBdXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaW5lIGNsYXNzTmFtZT1cIm1pbm9yXCIgeTE9XCI0MlwiIHkyPVwiNDVcIiB0cmFuc2Zvcm09e1tcInJvdGF0ZShcIiwgZnMoXCJwICogNlwiKSwgXCIpXCJdfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHAgaW4gWyAwLi4xMSBdXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaW5lIGNsYXNzTmFtZT1cIm1ham9yXCIgeTE9XCIzNVwiIHkyPVwiNDVcIiB0cmFuc2Zvcm09e1tcInJvdGF0ZShcIiwgZnMoXCJwICogMzBcIiksIFwiKVwiXX0gLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGluZSBjbGFzc05hbWU9XCJob3VyXCIgeTE9XCIyXCIgeTI9XCItMjBcIiB0cmFuc2Zvcm09e1tcInJvdGF0ZShcIiwgZnMoXCJob3Vyc0FuZ2xlIChhd2FpdCB0aW1lKVwiKSwgXCIpXCJdfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGluZSBjbGFzc05hbWU9XCJtaW51dGVcIiB5MT1cIjRcIiB5Mj1cIi0zMFwiIHRyYW5zZm9ybT17W1wicm90YXRlKFwiLCBmcyhcIm1pbnV0ZXNBbmdsZSAoYXdhaXQgdGltZSlcIiksIFwiKVwiXX0gLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGcgdHJhbnNmb3JtPXtbXCJyb3RhdGUoXCIsIGZzKFwic2Vjb25kc0FuZ2xlIChhd2FpdCB0aW1lKVwiKSwgXCIpXCJdfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaW5lIGNsYXNzTmFtZT1cInNlY29uZFwiIHkxPVwiMTBcIiB5Mj1cIi0zOFwiPjwvbGluZT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaW5lIGNsYXNzTmFtZT1cInNlY29uZC1jb3VudGVyd2VpZ2h0XCIgeTE9XCIxMFwiIHkyPVwiMlwiPjwvbGluZT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9nPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZz5cclxuICAgICAgICAgICAgICAgIDwvc3ZnPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=