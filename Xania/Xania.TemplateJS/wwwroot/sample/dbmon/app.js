"use strict";
var xania_1 = require("../../src/xania");
function run(target) {
    var store = new xania_1.Reactive.Store({ databases: ENV.generateData(true).toArray() });
    dbmon(xania_1.Xania)
        .bind(xania_1.Dom.DomVisitor)
        .update(store, new xania_1.Dom.DomDriver(target));
    var load = function () {
        ENV.generateData(true);
        store.refresh();
        Monitoring.renderRate.ping();
        window.setTimeout(load, ENV.timeout);
    };
    load();
}
exports.run = run;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEseUNBQXlFO0FBUXpFLGFBQW9CLE1BQVk7SUFFNUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUUxRSxLQUFLLENBQUMsYUFBSyxDQUFDO1NBQ1AsSUFBSSxDQUFDLFdBQUcsQ0FBQyxVQUFVLENBQUM7U0FDcEIsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLFdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUU5QyxJQUFJLElBQUksR0FBRztRQUNQLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQztJQUNGLElBQUksRUFBRSxDQUFDO0FBRVgsQ0FBQztBQWhCRCxrQkFnQkM7QUFFRCxJQUFJLEtBQUssR0FBUSxVQUFDLEtBQUs7SUFDbkIsT0FBQSxxQkFBTyxLQUFLLEVBQUMsaUNBQWlDO1FBQzFDO1lBQ0EsVUFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxxQkFBcUIsQ0FBQztnQkFDcEM7b0JBQ0ksa0JBQUksU0FBUyxFQUFDLFFBQVEsSUFDakIsVUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUNmO29CQUNMLGtCQUFJLFNBQVMsRUFBQyxhQUFhO3dCQUN2QixvQkFBTSxTQUFTLEVBQUUsVUFBRSxDQUFDLDhCQUE4QixDQUFDLElBQzlDLFVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxDQUMzQixDQUNOO29CQUNMLFVBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsdUNBQXVDLENBQUM7d0JBQ3RELGtCQUFJLFNBQVMsRUFBRSxVQUFFLENBQUMsb0JBQW9CLENBQUM7NEJBQ2xDLFVBQUUsQ0FBQyxpQkFBaUIsQ0FBQzs0QkFDdEIsbUJBQUssU0FBUyxFQUFDLGNBQWM7Z0NBQ3pCLG1CQUFLLFNBQVMsRUFBQyxpQkFBaUIsSUFDM0IsVUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUNaO2dDQUNOLG1CQUFLLFNBQVMsRUFBQyxPQUFPLEdBQU8sQ0FDM0IsQ0FDTCxDQUNDLENBQ1QsQ0FDQyxDQUNGLENBQ0o7QUExQlIsQ0EwQlEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFhhbmlhLCBGb3JFYWNoLCBmcywgUmVhY3RpdmUgYXMgUmUsIERvbSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5cclxuLy8gUmVTaGFycGVyIGRpc2FibGUgSW5jb25zaXN0ZW50TmFtaW5nXHJcbmRlY2xhcmUgdmFyIEVOVjtcclxuZGVjbGFyZSB2YXIgTW9uaXRvcmluZztcclxuLy8gUmVTaGFycGVyIHJlc3RvcmUgSW5jb25zaXN0ZW50TmFtaW5nXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJ1bih0YXJnZXQ6IE5vZGUpIHtcclxuXHJcbiAgICB2YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUoeyBkYXRhYmFzZXM6IEVOVi5nZW5lcmF0ZURhdGEodHJ1ZSkudG9BcnJheSgpIH0pO1xyXG5cclxuICAgIGRibW9uKFhhbmlhKVxyXG4gICAgICAgIC5iaW5kKERvbS5Eb21WaXNpdG9yKVxyXG4gICAgICAgIC51cGRhdGUoc3RvcmUsIG5ldyBEb20uRG9tRHJpdmVyKHRhcmdldCkpO1xyXG5cclxuICAgIHZhciBsb2FkID0gKCkgPT4ge1xyXG4gICAgICAgIEVOVi5nZW5lcmF0ZURhdGEodHJ1ZSk7XHJcbiAgICAgICAgc3RvcmUucmVmcmVzaCgpO1xyXG4gICAgICAgIE1vbml0b3JpbmcucmVuZGVyUmF0ZS5waW5nKCk7XHJcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQobG9hZCwgRU5WLnRpbWVvdXQpO1xyXG4gICAgfTtcclxuICAgIGxvYWQoKTtcclxuXHJcbn1cclxuXHJcbnZhciBkYm1vbjogYW55ID0gKHhhbmlhKSA9PlxyXG4gICAgPHRhYmxlIGNsYXp6PVwidGFibGUgdGFibGUtc3RyaXBlZCBsYXRlc3QtZGF0YVwiPlxyXG4gICAgICAgIDx0Ym9keT5cclxuICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciBkYiBpbiBkYXRhYmFzZXNcIil9PlxyXG4gICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwiZGJuYW1lXCI+XHJcbiAgICAgICAgICAgICAgICAgICAge2ZzKFwiZGIuZGJuYW1lXCIpfVxyXG4gICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJxdWVyeS1jb3VudFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17ZnMoXCJkYi5sYXN0U2FtcGxlLmNvdW50Q2xhc3NOYW1lXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAge2ZzKFwiZGIubGFzdFNhbXBsZS5uYlF1ZXJpZXNcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHEgaW4gZGIubGFzdFNhbXBsZS50b3BGaXZlUXVlcmllc1wiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT17ZnMoXCJxLmVsYXBzZWRDbGFzc05hbWVcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZnMoXCJxLmZvcm1hdEVsYXBzZWRcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9wb3ZlciBsZWZ0XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBvcG92ZXItY29udGVudFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtmcyhcInEucXVlcnlcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYXJyb3dcIj48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgPC90cj5cclxuICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgPC90Ym9keT5cclxuICAgIDwvdGFibGU+OyJdfQ==