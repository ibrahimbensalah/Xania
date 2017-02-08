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
    var store = new xania_1.Reactive.Store({
        time: new observables_1.Observables.Time(),
        message: "hello, dbmon",
        databases: ENV.generateData(true).toArray()
    });
    xania_1.Xania.view(dbmon(), dispatcher).bind(target, store);
    var load = function () {
        ENV.generateData(true);
        store.refresh();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL2RibW9uL2FwcC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFEQUFtRDtBQUVuRCx5Q0FBb0U7QUFRcEU7SUFBQTtRQUNZLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBYy9CLENBQUM7SUFaRyxxQ0FBUSxHQUFSLFVBQVMsTUFBTTtRQUNYLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxrQ0FBSyxHQUFMO1FBQ0ksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDdEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBRU0sZ0NBQWEsR0FBcEIsVUFBcUIsTUFBTTtRQUN2QixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUNMLHlCQUFDO0FBQUQsQ0FBQyxBQWZELElBZUM7QUFFRCxjQUFxQixNQUFZO0lBRTdCLElBQUksVUFBVSxHQUFHLElBQUksa0JBQWtCLEVBQUUsQ0FBQztJQUMxQyxJQUFJLEtBQUssR0FBRyxJQUFJLGdCQUFFLENBQUMsS0FBSyxDQUFDO1FBQ2pCLElBQUksRUFBRSxJQUFJLHlCQUFXLENBQUMsSUFBSSxFQUFFO1FBQzVCLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFNBQVMsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRTtLQUM5QyxDQUFDLENBQUM7SUFDUCxhQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFcEQsSUFBSSxJQUFJLEdBQUc7UUFDUCxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXZCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNoQixVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFbkIsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM3QixNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDekMsQ0FBQyxDQUFDO0lBQ0YsSUFBSSxFQUFFLENBQUM7QUFFWCxDQUFDO0FBckJELG9CQXFCQztBQUVELElBQUksS0FBSyxHQUFRO0lBQ2IsT0FBQSw2QkFBTyxLQUFLLEVBQUMsaUNBQWlDO1FBQzFDO1lBQ0Esa0JBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMscUJBQXFCLENBQUM7Z0JBQ3BDO29CQUNJLDBCQUFJLFNBQVMsRUFBQyxRQUFRLElBQ2pCLFVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FDZjtvQkFDTCwwQkFBSSxTQUFTLEVBQUMsYUFBYTt3QkFDdkIsNEJBQU0sU0FBUyxFQUFFLFVBQUUsQ0FBQyw4QkFBOEIsQ0FBQyxJQUM5QyxVQUFFLENBQUMseUJBQXlCLENBQUMsQ0FDM0IsQ0FDTjtvQkFDTCxrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyx1Q0FBdUMsQ0FBQzt3QkFDdEQsMEJBQUksU0FBUyxFQUFFLFVBQUUsQ0FBQyxvQkFBb0IsQ0FBQzs0QkFDbEMsVUFBRSxDQUFDLGlCQUFpQixDQUFDOzRCQUN0QiwyQkFBSyxTQUFTLEVBQUMsY0FBYztnQ0FDekIsMkJBQUssU0FBUyxFQUFDLGlCQUFpQixJQUMzQixVQUFFLENBQUMsU0FBUyxDQUFDLENBQ1o7Z0NBQ04sMkJBQUssU0FBUyxFQUFDLE9BQU8sR0FBTyxDQUMzQixDQUNMLENBQ0MsQ0FDVCxDQUNDLENBQ0YsQ0FDSjtBQTFCUixDQTBCUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmltcG9ydCB7IFhhbmlhLCBGb3JFYWNoLCBmcywgUmVhY3RpdmUgYXMgUmUgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuXHJcbi8vIFJlU2hhcnBlciBkaXNhYmxlIEluY29uc2lzdGVudE5hbWluZ1xyXG5kZWNsYXJlIHZhciBFTlY7XHJcbmRlY2xhcmUgdmFyIE1vbml0b3Jpbmc7XHJcbi8vIFJlU2hhcnBlciByZXN0b3JlIEluY29uc2lzdGVudE5hbWluZ1xyXG5cclxuXHJcbmNsYXNzIEJ1ZmZlcmVkRGlzcGF0Y2hlciB7XHJcbiAgICBwcml2YXRlIGJ1ZmZlciA9IG5ldyBTZXQoKTtcclxuXHJcbiAgICBkaXNwYXRjaChhY3Rpb24pIHtcclxuICAgICAgICB0aGlzLmJ1ZmZlci5hZGQoYWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBmbHVzaCgpIHtcclxuICAgICAgICB0aGlzLmJ1ZmZlci5mb3JFYWNoKEJ1ZmZlcmVkRGlzcGF0Y2hlci5leGVjdXRlQWN0aW9uKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlci5jbGVhcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBleGVjdXRlQWN0aW9uKGFjdGlvbikge1xyXG4gICAgICAgIGFjdGlvbi5leGVjdXRlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiaW5kKHRhcmdldDogTm9kZSkge1xyXG5cclxuICAgIHZhciBkaXNwYXRjaGVyID0gbmV3IEJ1ZmZlcmVkRGlzcGF0Y2hlcigpO1xyXG4gICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHtcclxuICAgICAgICAgICAgdGltZTogbmV3IE9ic2VydmFibGVzLlRpbWUoKSxcclxuICAgICAgICAgICAgbWVzc2FnZTogXCJoZWxsbywgZGJtb25cIixcclxuICAgICAgICAgICAgZGF0YWJhc2VzOiBFTlYuZ2VuZXJhdGVEYXRhKHRydWUpLnRvQXJyYXkoKVxyXG4gICAgICAgIH0pO1xyXG4gICAgWGFuaWEudmlldyhkYm1vbigpLCBkaXNwYXRjaGVyKS5iaW5kKHRhcmdldCwgc3RvcmUpO1xyXG5cclxuICAgIHZhciBsb2FkID0gKCkgPT4ge1xyXG4gICAgICAgIEVOVi5nZW5lcmF0ZURhdGEodHJ1ZSk7XHJcblxyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgICAgICBkaXNwYXRjaGVyLmZsdXNoKCk7XHJcblxyXG4gICAgICAgIE1vbml0b3JpbmcucmVuZGVyUmF0ZS5waW5nKCk7XHJcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQobG9hZCwgRU5WLnRpbWVvdXQpO1xyXG4gICAgfTtcclxuICAgIGxvYWQoKTtcclxuXHJcbn1cclxuXHJcbnZhciBkYm1vbjogYW55ID0gKCkgPT5cclxuICAgIDx0YWJsZSBjbGF6ej1cInRhYmxlIHRhYmxlLXN0cmlwZWQgbGF0ZXN0LWRhdGFcIj5cclxuICAgICAgICA8dGJvZHk+XHJcbiAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgZGIgaW4gZGF0YWJhc2VzXCIpfT5cclxuICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cImRibmFtZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHtmcyhcImRiLmRibmFtZVwiKX1cclxuICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicXVlcnktY291bnRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2ZzKFwiZGIubGFzdFNhbXBsZS5jb3VudENsYXNzTmFtZVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmcyhcImRiLmxhc3RTYW1wbGUubmJRdWVyaWVzXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciBxIGluIGRiLmxhc3RTYW1wbGUudG9wRml2ZVF1ZXJpZXNcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9e2ZzKFwicS5lbGFwc2VkQ2xhc3NOYW1lXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAge2ZzKFwicS5mb3JtYXRFbGFwc2VkXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBvcG92ZXIgbGVmdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwb3BvdmVyLWNvbnRlbnRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZnMoXCJxLnF1ZXJ5XCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFycm93XCI+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgIDwvdGJvZHk+XHJcbiAgICA8L3RhYmxlPjsiXX0=