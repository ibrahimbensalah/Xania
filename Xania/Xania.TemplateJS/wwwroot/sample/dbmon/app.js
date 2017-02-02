"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
var BufferedDispatcher = (function () {
    function BufferedDispatcher() {
        this.buffer = new Set();
    }
    BufferedDispatcher.prototype.dispatch = function (action) {
        this.buffer.add(action);
    };
    BufferedDispatcher.prototype.flush = function () {
        this.buffer.forEach(BufferedDispatcher.executeAction);
        this.buffer.clear();
    };
    BufferedDispatcher.executeAction = function (action) {
        action.execute();
    };
    return BufferedDispatcher;
}());
function bind(target) {
    var dispatcher = new BufferedDispatcher();
    var store = new xania_1.Store({
        time: new observables_1.Observables.Time(),
        message: "hello, dbmon",
        databases: ENV.generateData(true).toArray()
    });
    xania_1.Xania.view(dbmon(), dispatcher).bind(target, store);
    var load = function () {
        ENV.generateData(true);
        store.update();
        dispatcher.flush();
        Monitoring.renderRate.ping();
        window.setTimeout(load, ENV.timeout);
    };
    load();
}
exports.bind = bind;
var dbmon = function () {
    return xania_1.Xania.tag("table", { clazz: "table table-striped latest-data" },
        xania_1.Xania.tag("tbody", null,
            xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for db in databases") },
                xania_1.Xania.tag("tr", null,
                    xania_1.Xania.tag("td", { className: "dbname" }, xania_1.fs("db.dbname")),
                    xania_1.Xania.tag("td", { className: "query-count" },
                        xania_1.Xania.tag("span", { className: xania_1.fs("db.lastSample.countClassName") }, xania_1.fs("db.lastSample.nbQueries"))),
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for q in db.lastSample.topFiveQueries") },
                        xania_1.Xania.tag("td", { className: xania_1.fs("q.elapsedClassName") },
                            xania_1.fs("q.formatElapsed"),
                            xania_1.Xania.tag("div", { className: "popover left" },
                                xania_1.Xania.tag("div", { className: "popover-content" }, xania_1.fs("q.query")),
                                xania_1.Xania.tag("div", { className: "arrow" }))))))));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2RibW9uL2FwcC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFEQUFtRDtBQUVuRCx5Q0FBMkQ7QUFRM0Q7SUFBQTtRQUNZLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBYy9CLENBQUM7SUFaRyxxQ0FBUSxHQUFSLFVBQVMsTUFBTTtRQUNYLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxrQ0FBSyxHQUFMO1FBQ0ksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDdEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBRU0sZ0NBQWEsR0FBcEIsVUFBcUIsTUFBTTtRQUN2QixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUNMLHlCQUFDO0FBQUQsQ0FBQyxBQWZELElBZUM7QUFFRCxjQUFxQixNQUFZO0lBRTdCLElBQUksVUFBVSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztJQUMxQyxJQUFJLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQztRQUNkLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFNBQVMsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRTtLQUM5QyxDQUFDLENBQUM7SUFDUCxhQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFcEQsSUFBSSxJQUFJLEdBQUc7UUFDUCxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXZCLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUVuQixVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN6QyxDQUFDLENBQUM7SUFDRixJQUFJLEVBQUUsQ0FBQztBQUVYLENBQUM7QUFyQkQsb0JBcUJDO0FBRUQsSUFBSSxLQUFLLEdBQVE7SUFDYixPQUFBLDZCQUFPLEtBQUssRUFBQyxpQ0FBaUM7UUFDMUM7WUFDQSxrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxxQkFBcUIsQ0FBQztnQkFDcEM7b0JBQ0ksMEJBQUksU0FBUyxFQUFDLFFBQVEsSUFDakIsVUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUNmO29CQUNMLDBCQUFJLFNBQVMsRUFBQyxhQUFhO3dCQUN2Qiw0QkFBTSxTQUFTLEVBQUUsVUFBRSxDQUFDLDhCQUE4QixDQUFDLElBQzlDLFVBQUUsQ0FBQyx5QkFBeUIsQ0FBQyxDQUMzQixDQUNOO29CQUNMLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLHVDQUF1QyxDQUFDO3dCQUN0RCwwQkFBSSxTQUFTLEVBQUUsVUFBRSxDQUFDLG9CQUFvQixDQUFDOzRCQUNsQyxVQUFFLENBQUMsaUJBQWlCLENBQUM7NEJBQ3RCLDJCQUFLLFNBQVMsRUFBQyxjQUFjO2dDQUN6QiwyQkFBSyxTQUFTLEVBQUMsaUJBQWlCLElBQzNCLFVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FDWjtnQ0FDTiwyQkFBSyxTQUFTLEVBQUMsT0FBTyxHQUFPLENBQzNCLENBQ0wsQ0FDQyxDQUNULENBQ0MsQ0FDRixDQUNKO0FBMUJSLENBMEJRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5cclxuaW1wb3J0IHsgWGFuaWEsIEZvckVhY2gsIGZzLCBTdG9yZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5cclxuLy8gUmVTaGFycGVyIGRpc2FibGUgSW5jb25zaXN0ZW50TmFtaW5nXHJcbmRlY2xhcmUgdmFyIEVOVjtcclxuZGVjbGFyZSB2YXIgTW9uaXRvcmluZztcclxuLy8gUmVTaGFycGVyIHJlc3RvcmUgSW5jb25zaXN0ZW50TmFtaW5nXHJcblxyXG5cclxuY2xhc3MgQnVmZmVyZWREaXNwYXRjaGVyIHtcclxuICAgIHByaXZhdGUgYnVmZmVyID0gbmV3IFNldCgpO1xyXG5cclxuICAgIGRpc3BhdGNoKGFjdGlvbikge1xyXG4gICAgICAgIHRoaXMuYnVmZmVyLmFkZChhY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGZsdXNoKCkge1xyXG4gICAgICAgIHRoaXMuYnVmZmVyLmZvckVhY2goQnVmZmVyZWREaXNwYXRjaGVyLmV4ZWN1dGVBY3Rpb24pO1xyXG4gICAgICAgIHRoaXMuYnVmZmVyLmNsZWFyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGV4ZWN1dGVBY3Rpb24oYWN0aW9uKSB7XHJcbiAgICAgICAgYWN0aW9uLmV4ZWN1dGUoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQodGFyZ2V0OiBOb2RlKSB7XHJcblxyXG4gICAgdmFyIGRpc3BhdGNoZXIgPSBuZXcgQnVmZmVyZWREaXNwYXRjaGVyKCk7XHJcbiAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmUoe1xyXG4gICAgICAgICAgICB0aW1lOiBuZXcgT2JzZXJ2YWJsZXMuVGltZSgpLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcImhlbGxvLCBkYm1vblwiLFxyXG4gICAgICAgICAgICBkYXRhYmFzZXM6IEVOVi5nZW5lcmF0ZURhdGEodHJ1ZSkudG9BcnJheSgpXHJcbiAgICAgICAgfSk7XHJcbiAgICBYYW5pYS52aWV3KGRibW9uKCksIGRpc3BhdGNoZXIpLmJpbmQodGFyZ2V0LCBzdG9yZSk7XHJcblxyXG4gICAgdmFyIGxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgRU5WLmdlbmVyYXRlRGF0YSh0cnVlKTtcclxuXHJcbiAgICAgICAgc3RvcmUudXBkYXRlKCk7XHJcbiAgICAgICAgZGlzcGF0Y2hlci5mbHVzaCgpO1xyXG5cclxuICAgICAgICBNb25pdG9yaW5nLnJlbmRlclJhdGUucGluZygpO1xyXG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGxvYWQsIEVOVi50aW1lb3V0KTtcclxuICAgIH07XHJcbiAgICBsb2FkKCk7XHJcblxyXG59XHJcblxyXG52YXIgZGJtb246IGFueSA9ICgpID0+XHJcbiAgICA8dGFibGUgY2xheno9XCJ0YWJsZSB0YWJsZS1zdHJpcGVkIGxhdGVzdC1kYXRhXCI+XHJcbiAgICAgICAgPHRib2R5PlxyXG4gICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIGRiIGluIGRhdGFiYXNlc1wiKX0+XHJcbiAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJkYm5hbWVcIj5cclxuICAgICAgICAgICAgICAgICAgICB7ZnMoXCJkYi5kYm5hbWVcIil9XHJcbiAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInF1ZXJ5LWNvdW50XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtmcyhcImRiLmxhc3RTYW1wbGUuY291bnRDbGFzc05hbWVcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ZnMoXCJkYi5sYXN0U2FtcGxlLm5iUXVlcmllc1wiKX1cclxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgcSBpbiBkYi5sYXN0U2FtcGxlLnRvcEZpdmVRdWVyaWVzXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPXtmcyhcInEuZWxhcHNlZENsYXNzTmFtZVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmcyhcInEuZm9ybWF0RWxhcHNlZFwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwb3BvdmVyIGxlZnRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9wb3Zlci1jb250ZW50XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2ZzKFwicS5xdWVyeVwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhcnJvd1wiPjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICA8L3Rib2R5PlxyXG4gICAgPC90YWJsZT47Il19