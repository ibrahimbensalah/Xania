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
            xania.tag(xania_1.ForEach, { expr: xania_1.query("for db in databases") },
                xania.tag("tr", null,
                    xania.tag("td", { className: "dbname" }, xania_1.query("db.dbname")),
                    xania.tag("td", { className: "query-count" },
                        xania.tag("span", { className: xania_1.query("db.lastSample.countClassName") }, xania_1.query("db.lastSample.nbQueries"))),
                    xania.tag(xania_1.ForEach, { expr: xania_1.query("for q in db.lastSample.topFiveQueries") },
                        xania.tag("td", { className: xania_1.query("q.elapsedClassName") },
                            xania_1.query("q.formatElapsed"),
                            xania.tag("div", { className: "popover left" },
                                xania.tag("div", { className: "popover-content" }, xania_1.query("q.query")),
                                xania.tag("div", { className: "arrow" }))))))));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEseUNBQTRFO0FBUTVFLGFBQW9CLE1BQVk7SUFFNUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUUxRSxLQUFLLENBQUMsYUFBSyxDQUFDO1NBQ1AsSUFBSSxDQUFDLFdBQUcsQ0FBQyxVQUFVLENBQUM7U0FDcEIsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLFdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUU5QyxJQUFJLElBQUksR0FBRztRQUNQLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRWhCLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQztJQUNGLElBQUksRUFBRSxDQUFDO0FBRVgsQ0FBQztBQWpCRCxrQkFpQkM7QUFFRCxJQUFJLEtBQUssR0FBUSxVQUFDLEtBQUs7SUFDbkIsT0FBQSxxQkFBTyxLQUFLLEVBQUMsaUNBQWlDO1FBQzFDO1lBQ0EsVUFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLGFBQUssQ0FBQyxxQkFBcUIsQ0FBQztnQkFDdkM7b0JBQ0ksa0JBQUksU0FBUyxFQUFDLFFBQVEsSUFDakIsYUFBSyxDQUFDLFdBQVcsQ0FBQyxDQUNsQjtvQkFDTCxrQkFBSSxTQUFTLEVBQUMsYUFBYTt3QkFDdkIsb0JBQU0sU0FBUyxFQUFFLGFBQUssQ0FBQyw4QkFBOEIsQ0FBQyxJQUNqRCxhQUFLLENBQUMseUJBQXlCLENBQUMsQ0FDOUIsQ0FDTjtvQkFDTCxVQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsYUFBSyxDQUFDLHVDQUF1QyxDQUFDO3dCQUN6RCxrQkFBSSxTQUFTLEVBQUUsYUFBSyxDQUFDLG9CQUFvQixDQUFDOzRCQUNyQyxhQUFLLENBQUMsaUJBQWlCLENBQUM7NEJBQ3pCLG1CQUFLLFNBQVMsRUFBQyxjQUFjO2dDQUN6QixtQkFBSyxTQUFTLEVBQUMsaUJBQWlCLElBQzNCLGFBQUssQ0FBQyxTQUFTLENBQUMsQ0FDZjtnQ0FDTixtQkFBSyxTQUFTLEVBQUMsT0FBTyxHQUFPLENBQzNCLENBQ0wsQ0FDQyxDQUNULENBQ0MsQ0FDRixDQUNKO0FBMUJSLENBMEJRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYYW5pYSwgRm9yRWFjaCwgcXVlcnksIFJlYWN0aXZlIGFzIFJlLCBEb20gfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuXHJcbi8vIFJlU2hhcnBlciBkaXNhYmxlIEluY29uc2lzdGVudE5hbWluZ1xyXG5kZWNsYXJlIHZhciBFTlY7XHJcbmRlY2xhcmUgdmFyIE1vbml0b3Jpbmc7XHJcbi8vIFJlU2hhcnBlciByZXN0b3JlIEluY29uc2lzdGVudE5hbWluZ1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBydW4odGFyZ2V0OiBOb2RlKSB7XHJcblxyXG4gICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHsgZGF0YWJhc2VzOiBFTlYuZ2VuZXJhdGVEYXRhKHRydWUpLnRvQXJyYXkoKSB9KTtcclxuXHJcbiAgICBkYm1vbihYYW5pYSlcclxuICAgICAgICAuYmluZChEb20uRG9tVmlzaXRvcilcclxuICAgICAgICAudXBkYXRlKHN0b3JlLCBuZXcgRG9tLkRvbURyaXZlcih0YXJnZXQpKTtcclxuXHJcbiAgICB2YXIgbG9hZCA9ICgpID0+IHtcclxuICAgICAgICBFTlYuZ2VuZXJhdGVEYXRhKHRydWUpO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuXHJcbiAgICAgICAgTW9uaXRvcmluZy5yZW5kZXJSYXRlLnBpbmcoKTtcclxuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChsb2FkLCBFTlYudGltZW91dCk7XHJcbiAgICB9O1xyXG4gICAgbG9hZCgpO1xyXG5cclxufVxyXG5cclxudmFyIGRibW9uOiBhbnkgPSAoeGFuaWEpID0+XHJcbiAgICA8dGFibGUgY2xheno9XCJ0YWJsZSB0YWJsZS1zdHJpcGVkIGxhdGVzdC1kYXRhXCI+XHJcbiAgICAgICAgPHRib2R5PlxyXG4gICAgICAgIDxGb3JFYWNoIGV4cHI9e3F1ZXJ5KFwiZm9yIGRiIGluIGRhdGFiYXNlc1wiKX0+XHJcbiAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJkYm5hbWVcIj5cclxuICAgICAgICAgICAgICAgICAgICB7cXVlcnkoXCJkYi5kYm5hbWVcIil9XHJcbiAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInF1ZXJ5LWNvdW50XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtxdWVyeShcImRiLmxhc3RTYW1wbGUuY291bnRDbGFzc05hbWVcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cXVlcnkoXCJkYi5sYXN0U2FtcGxlLm5iUXVlcmllc1wiKX1cclxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17cXVlcnkoXCJmb3IgcSBpbiBkYi5sYXN0U2FtcGxlLnRvcEZpdmVRdWVyaWVzXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPXtxdWVyeShcInEuZWxhcHNlZENsYXNzTmFtZVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtxdWVyeShcInEuZm9ybWF0RWxhcHNlZFwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwb3BvdmVyIGxlZnRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicG9wb3Zlci1jb250ZW50XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3F1ZXJ5KFwicS5xdWVyeVwiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhcnJvd1wiPjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICA8L3Rib2R5PlxyXG4gICAgPC90YWJsZT47Il19