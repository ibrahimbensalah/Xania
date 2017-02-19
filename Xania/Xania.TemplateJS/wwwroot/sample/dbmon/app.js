"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
function bind(target) {
    var store = new xania_1.Reactive.Store({
        time: new observables_1.Observables.Time(),
        message: "hello, dbmon",
        databases: ENV.generateData(true).toArray()
    });
    xania_1.Xania.view(dbmon(xania_1.Xania)).bind(store, new xania_1.Dom.DomDriver(target));
    var load = function () {
        ENV.generateData(true);
        store.refresh();
        Monitoring.renderRate.ping();
        window.setTimeout(load, ENV.timeout);
    };
    load();
}
exports.bind = bind;
var dbmon = function (xania) {
    return xania.tag("table", { clazz: "table table-striped latest-data" },
        xania.tag("tbody", null,
            xania.tag(xania_1.ForEach, { expr: xania_1.fs("for db in databases") },
                xania.tag("tr", null,
                    xania.tag("td", { className: "dbname" }, xania_1.fs("db.dbname")),
                    xania.tag("td", { className: "query-count" },
                        xania.tag("span", { className: xania_1.fs("db.lastSample.countClassName") }, xania_1.fs("db.lastSample.nbQueries"))),
                    xania.tag(xania_1.ForEach, { expr: xania_1.fs("for q in db.lastSample.topFiveQueries") },
                        xania.tag("td", { className: xania_1.fs("q.elapsedClassName") },
                            xania_1.fs("q.formatElapsed"),
                            xania.tag("div", { className: "popover left" },
                                xania.tag("div", { className: "popover-content" }, xania_1.fs("q.query")),
                                xania.tag("div", { className: "arrow" }))))))));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUF5RTtBQVF6RSxjQUFxQixNQUFZO0lBRTdCLElBQUksS0FBSyxHQUFHLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUM7UUFDakIsSUFBSSxFQUFFLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUU7UUFDNUIsT0FBTyxFQUFFLGNBQWM7UUFDdkIsU0FBUyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFO0tBQ2xELENBQUMsQ0FBQztJQUNILGFBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLFdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUVoRSxJQUFJLElBQUksR0FBRztRQUNQLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdkIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRWhCLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQztJQUNGLElBQUksRUFBRSxDQUFDO0FBRVgsQ0FBQztBQW5CRCxvQkFtQkM7QUFFRCxJQUFJLEtBQUssR0FBUSxVQUFDLEtBQUs7SUFDbkIsT0FBQSxxQkFBTyxLQUFLLEVBQUMsaUNBQWlDO1FBQzFDO1lBQ0EsVUFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxxQkFBcUIsQ0FBQztnQkFDcEM7b0JBQ0ksa0JBQUksU0FBUyxFQUFDLFFBQVEsSUFDakIsVUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUNmO29CQUNMLGtCQUFJLFNBQVMsRUFBQyxhQUFhO3dCQUN2QixvQkFBTSxTQUFTLEVBQUUsVUFBRSxDQUFDLDhCQUE4QixDQUFDLElBQzlDLFVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxDQUMzQixDQUNOO29CQUNMLFVBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsdUNBQXVDLENBQUM7d0JBQ3RELGtCQUFJLFNBQVMsRUFBRSxVQUFFLENBQUMsb0JBQW9CLENBQUM7NEJBQ2xDLFVBQUUsQ0FBQyxpQkFBaUIsQ0FBQzs0QkFDdEIsbUJBQUssU0FBUyxFQUFDLGNBQWM7Z0NBQ3pCLG1CQUFLLFNBQVMsRUFBQyxpQkFBaUIsSUFDM0IsVUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUNaO2dDQUNOLG1CQUFLLFNBQVMsRUFBQyxPQUFPLEdBQU8sQ0FDM0IsQ0FDTCxDQUNDLENBQ1QsQ0FDQyxDQUNGLENBQ0o7QUExQlIsQ0EwQlEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4uLy4uL3NyYy9vYnNlcnZhYmxlc1wiXHJcblxyXG5pbXBvcnQgeyBYYW5pYSwgRm9yRWFjaCwgZnMsIFJlYWN0aXZlIGFzIFJlLCBEb20gfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuXHJcbi8vIFJlU2hhcnBlciBkaXNhYmxlIEluY29uc2lzdGVudE5hbWluZ1xyXG5kZWNsYXJlIHZhciBFTlY7XHJcbmRlY2xhcmUgdmFyIE1vbml0b3Jpbmc7XHJcbi8vIFJlU2hhcnBlciByZXN0b3JlIEluY29uc2lzdGVudE5hbWluZ1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiaW5kKHRhcmdldDogTm9kZSkge1xyXG5cclxuICAgIHZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICAgICAgICAgIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCksXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiaGVsbG8sIGRibW9uXCIsXHJcbiAgICAgICAgICAgIGRhdGFiYXNlczogRU5WLmdlbmVyYXRlRGF0YSh0cnVlKS50b0FycmF5KClcclxuICAgIH0pO1xyXG4gICAgWGFuaWEudmlldyhkYm1vbihYYW5pYSkpLmJpbmQoc3RvcmUsIG5ldyBEb20uRG9tRHJpdmVyKHRhcmdldCkpO1xyXG5cclxuICAgIHZhciBsb2FkID0gKCkgPT4ge1xyXG4gICAgICAgIEVOVi5nZW5lcmF0ZURhdGEodHJ1ZSk7XHJcblxyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuXHJcbiAgICAgICAgTW9uaXRvcmluZy5yZW5kZXJSYXRlLnBpbmcoKTtcclxuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChsb2FkLCBFTlYudGltZW91dCk7XHJcbiAgICB9O1xyXG4gICAgbG9hZCgpO1xyXG5cclxufVxyXG5cclxudmFyIGRibW9uOiBhbnkgPSAoeGFuaWEpID0+XHJcbiAgICA8dGFibGUgY2xheno9XCJ0YWJsZSB0YWJsZS1zdHJpcGVkIGxhdGVzdC1kYXRhXCI+XHJcbiAgICAgICAgPHRib2R5PlxyXG4gICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIGRiIGluIGRhdGFiYXNlc1wiKX0+XHJcbiAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJkYm5hbWVcIj5cclxuICAgICAgICAgICAgICAgICAgICB7ZnMoXCJkYi5kYm5hbWVcIil9XHJcbiAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInF1ZXJ5LWNvdW50XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtmcyhcImRiLmxhc3RTYW1wbGUuY291bnRDbGFzc05hbWVcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZnMoXCJkYi5sYXN0U2FtcGxlLm5iUXVlcmllc1wiKX1cclxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgcSBpbiBkYi5sYXN0U2FtcGxlLnRvcEZpdmVRdWVyaWVzXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPXtmcyhcInEuZWxhcHNlZENsYXNzTmFtZVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmcyhcInEuZm9ybWF0RWxhcHNlZFwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwb3BvdmVyIGxlZnRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9wb3Zlci1jb250ZW50XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2ZzKFwicS5xdWVyeVwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhcnJvd1wiPjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICA8L3Rib2R5PlxyXG4gICAgPC90YWJsZT47Il19