"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
function bind(target) {
    var store = new xania_1.Store({
        time: new observables_1.Observables.Time(),
        message: "hello, dbmon",
        databases: ENV.generateData(true).toArray()
    });
    var load = function () {
        ENV.generateData(true);
        store.update();
        Monitoring.renderRate.ping();
        window.setTimeout(load, ENV.timeout);
    };
    load();
    view().bind(target, store);
}
exports.bind = bind;
function view() {
    var view = xania_1.Xania.tag("table", { clazz: "table table-striped latest-data" },
        xania_1.Xania.tag("tbody", null,
            xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for db in databases") },
                xania_1.Xania.tag("tr", null,
                    xania_1.Xania.tag("td", { clazz: "dbname" }, xania_1.fs("db.dbname")),
                    xania_1.Xania.tag("td", { clazz: "query-count" },
                        xania_1.Xania.tag("span", { clazz: xania_1.fs("db.lastSample.countClassName") }, xania_1.fs("db.lastSample.nbQueries"))),
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for q in db.lastSample.topFiveQueries") },
                        xania_1.Xania.tag("td", { clazz: xania_1.fs("q.elapsedClassName") },
                            xania_1.fs("q.formatElapsed"),
                            xania_1.Xania.tag("div", { clazz: "popover left" },
                                xania_1.Xania.tag("div", { clazz: "popover-content" }, xania_1.fs("q.query")),
                                xania_1.Xania.tag("div", { clazz: "arrow" }))))))));
    return view;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2RibW9uL2FwcC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFEQUFtRDtBQUVuRCx5Q0FBMkQ7QUFPM0QsY0FBcUIsTUFBWTtJQUU3QixJQUFJLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQztRQUNsQixJQUFJLEVBQUUsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRTtRQUM1QixPQUFPLEVBQUUsY0FBYztRQUN2QixTQUFTLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUU7S0FDOUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxJQUFJLEdBQUc7UUFDUCxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQztJQUVGLElBQUksRUFBRSxDQUFDO0lBQ1AsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUUvQixDQUFDO0FBbEJELG9CQWtCQztBQUVEO0lBQ0ksSUFBSSxJQUFJLEdBQ0osNkJBQU8sS0FBSyxFQUFDLGlDQUFpQztRQUMxQztZQUNJLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLHFCQUFxQixDQUFDO2dCQUNwQztvQkFDSSwwQkFBSSxLQUFLLEVBQUMsUUFBUSxJQUNiLFVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FDZjtvQkFDTCwwQkFBSSxLQUFLLEVBQUMsYUFBYTt3QkFDbkIsNEJBQU0sS0FBSyxFQUFFLFVBQUUsQ0FBQyw4QkFBOEIsQ0FBQyxJQUMxQyxVQUFFLENBQUMseUJBQXlCLENBQUMsQ0FDM0IsQ0FDTjtvQkFDTCxrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyx1Q0FBdUMsQ0FBQzt3QkFDdEQsMEJBQUksS0FBSyxFQUFFLFVBQUUsQ0FBQyxvQkFBb0IsQ0FBQzs0QkFDOUIsVUFBRSxDQUFDLGlCQUFpQixDQUFDOzRCQUN0QiwyQkFBSyxLQUFLLEVBQUMsY0FBYztnQ0FDckIsMkJBQUssS0FBSyxFQUFDLGlCQUFpQixJQUN2QixVQUFFLENBQUMsU0FBUyxDQUFDLENBQ1o7Z0NBQ04sMkJBQUssS0FBSyxFQUFDLE9BQU8sR0FBTyxDQUN2QixDQUNMLENBQ0MsQ0FDVCxDQUNDLENBQ04sQ0FDSixDQUFDO0lBRWIsTUFBTSxDQUFDLElBQVcsQ0FBQztBQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmltcG9ydCB7IFhhbmlhLCBGb3JFYWNoLCBmcywgU3RvcmUgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuXHJcbi8vIFJlU2hhcnBlciBkaXNhYmxlIEluY29uc2lzdGVudE5hbWluZ1xyXG5kZWNsYXJlIHZhciBFTlY7XHJcbmRlY2xhcmUgdmFyIE1vbml0b3Jpbmc7XHJcbi8vIFJlU2hhcnBlciByZXN0b3JlIEluY29uc2lzdGVudE5hbWluZ1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQodGFyZ2V0OiBOb2RlKSB7XHJcblxyXG4gICAgdmFyIHN0b3JlID0gbmV3IFN0b3JlKHtcclxuICAgICAgICB0aW1lOiBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwiaGVsbG8sIGRibW9uXCIsXHJcbiAgICAgICAgZGF0YWJhc2VzOiBFTlYuZ2VuZXJhdGVEYXRhKHRydWUpLnRvQXJyYXkoKVxyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIGxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgRU5WLmdlbmVyYXRlRGF0YSh0cnVlKTtcclxuICAgICAgICBzdG9yZS51cGRhdGUoKTtcclxuICAgICAgICBNb25pdG9yaW5nLnJlbmRlclJhdGUucGluZygpO1xyXG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGxvYWQsIEVOVi50aW1lb3V0KTtcclxuICAgIH07XHJcblxyXG4gICAgbG9hZCgpO1xyXG4gICAgdmlldygpLmJpbmQodGFyZ2V0LCBzdG9yZSk7XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiB2aWV3KCkge1xyXG4gICAgdmFyIHZpZXcgPVxyXG4gICAgICAgIDx0YWJsZSBjbGF6ej1cInRhYmxlIHRhYmxlLXN0cmlwZWQgbGF0ZXN0LWRhdGFcIj5cclxuICAgICAgICAgICAgPHRib2R5PlxyXG4gICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgZGIgaW4gZGF0YWJhc2VzXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGF6ej1cImRibmFtZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge2ZzKFwiZGIuZGJuYW1lXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xheno9XCJxdWVyeS1jb3VudFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xheno9e2ZzKFwiZGIubGFzdFNhbXBsZS5jb3VudENsYXNzTmFtZVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2ZzKFwiZGIubGFzdFNhbXBsZS5uYlF1ZXJpZXNcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHEgaW4gZGIubGFzdFNhbXBsZS50b3BGaXZlUXVlcmllc1wiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xheno9e2ZzKFwicS5lbGFwc2VkQ2xhc3NOYW1lXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZnMoXCJxLmZvcm1hdEVsYXBzZWRcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGF6ej1cInBvcG92ZXIgbGVmdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXp6PVwicG9wb3Zlci1jb250ZW50XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZnMoXCJxLnF1ZXJ5XCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGF6ej1cImFycm93XCI+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICA8L3RhYmxlPjtcclxuXHJcbiAgICByZXR1cm4gdmlldyBhcyBhbnk7XHJcbn0iXX0=