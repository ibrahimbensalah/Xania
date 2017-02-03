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
        resolve: function (viewName) {
            switch (viewName) {
                case 'view1':
                    return xania_1.Xania.tag("div", null,
                        "view 1: ",
                        xania_1.fs("firstName"));
                case 'view2':
                    return xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for v in [1..3]") },
                        xania_1.Xania.tag("h1", null, xania_1.fs("firstName")),
                        "View 2: ",
                        xania_1.fs("v"));
            }
        }
    });
    var mainView = view.map(function (viewName) {
        switch (viewName) {
            case 'view1':
                return xania_1.Xania.tag("div", null,
                    "view 1: ",
                    xania_1.fs("firstName"));
            case 'view2':
                return xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for v in [1..3]") },
                    xania_1.Xania.tag("h1", null, xania_1.fs("firstName")),
                    "View 2: ",
                    xania_1.fs("v"));
        }
    });
    xania_1.Xania.view(layout(new xania_1.Reactive.Awaited(mainView))).bind(target, store);
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
            "\u00A0\u00A0\u00A0\u00A0" + " " + "model:",
            xania_1.Xania.tag("button", { click: xania_1.fs("user.firstName <- 'Ramy'") }, "Ramy"),
            xania_1.Xania.tag("button", { click: xania_1.fs("user.firstName <- 'Ibrahim'") }, "Ibrahim")),
        xania_1.Xania.tag("div", { style: "border: solid 1px red; padding: 10px;" }, xania_1.View.partial(view, xania_1.fs("user"))));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL3Njcm9sbGFibGUvYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUEwRTtBQUUxRSxjQUFxQixNQUFZO0lBQzdCLElBQUksSUFBSSxHQUFHLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDL0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQztRQUNyQixJQUFJLE1BQUE7UUFDSixJQUFJLEVBQUUsSUFBSSx5QkFBVyxDQUFDLElBQUksRUFBRTtRQUM1QixJQUFJLEVBQUUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUU7UUFDckQsS0FBSyxZQUFDLFFBQVE7WUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBQ0QsT0FBTyxZQUFDLFFBQVE7WUFDWixNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNmLEtBQUssT0FBTztvQkFDUixNQUFNLENBQUM7O3dCQUFjLFVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBTyxDQUFDO2dCQUNoRCxLQUFLLE9BQU87b0JBQ1IsTUFBTSxDQUFDLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLGlCQUFpQixDQUFDO3dCQUFFLDhCQUFLLFVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBTTs7d0JBQVMsVUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFXLENBQUM7WUFDM0csQ0FBQztRQUNMLENBQUM7S0FDSixDQUFDLENBQUM7SUFFSCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUEsUUFBUTtRQUM1QixNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ25CLEtBQUssT0FBTztnQkFDUixNQUFNLENBQUM7O29CQUFjLFVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBTyxDQUFDO1lBQ2hELEtBQUssT0FBTztnQkFDUixNQUFNLENBQUMsa0JBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsaUJBQWlCLENBQUM7b0JBQ2hDLDhCQUFLLFVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBTTs7b0JBQVMsVUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFXLENBQUM7UUFDckUsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsYUFBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxnQkFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyRSxDQUFDO0FBOUJELG9CQThCQztBQUVELElBQUksTUFBTSxHQUFRLFVBQUMsSUFBSTtJQUNuQixPQUFBO1FBQ0k7WUFBSyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7O1lBQUcsVUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFNO1FBQ3JEOztZQUVJLDhCQUFRLEtBQUssRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLGFBQWlCO1lBQ25ELDhCQUFRLEtBQUssRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLGFBQWlCOztZQUduRCw4QkFBUSxLQUFLLEVBQUUsVUFBRSxDQUFDLDBCQUEwQixDQUFDLFdBQWU7WUFDNUQsOEJBQVEsS0FBSyxFQUFFLFVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxjQUFrQixDQUNoRTtRQUNOLDJCQUFLLEtBQUssRUFBQyx1Q0FBdUMsSUFDN0MsWUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQzdCLENBQ0o7QUFkTixDQWNNLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5cclxuaW1wb3J0IHsgWGFuaWEsIEZvckVhY2gsIGZzLCBWaWV3LCBSZWFjdGl2ZSBhcyBSZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQodGFyZ2V0OiBOb2RlKSB7XHJcbiAgICB2YXIgdmlldyA9IG5ldyBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlKFwidmlldzFcIik7XHJcbiAgICB2YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUoe1xyXG4gICAgICAgIHZpZXcsXHJcbiAgICAgICAgdGltZTogbmV3IE9ic2VydmFibGVzLlRpbWUoKSxcclxuICAgICAgICB1c2VyOiB7IGZpcnN0TmFtZTogXCJJYnJhaGltXCIsIGxhc3ROYW1lOiBcImJlbiBTYWxhaFwiIH0sXHJcbiAgICAgICAgcm91dGUodmlld05hbWUpIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3Lm9uTmV4dCh2aWV3TmFtZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXNvbHZlKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodmlld05hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3ZpZXcxJzpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj52aWV3IDE6IHtmcyhcImZpcnN0TmFtZVwiKX08L2Rpdj47XHJcbiAgICAgICAgICAgICAgICBjYXNlICd2aWV3Mic6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHYgaW4gWzEuLjNdXCIpfT48aDE+e2ZzKFwiZmlyc3ROYW1lXCIpfTwvaDE+VmlldyAyOiB7ZnMoXCJ2XCIpfTwvRm9yRWFjaD47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgbWFpblZpZXcgPSB2aWV3Lm1hcCh2aWV3TmFtZSA9PiB7XHJcbiAgICAgICAgc3dpdGNoICh2aWV3TmFtZSkge1xyXG4gICAgICAgIGNhc2UgJ3ZpZXcxJzpcclxuICAgICAgICAgICAgcmV0dXJuIDxkaXY+dmlldyAxOiB7ZnMoXCJmaXJzdE5hbWVcIil9PC9kaXY+O1xyXG4gICAgICAgIGNhc2UgJ3ZpZXcyJzpcclxuICAgICAgICAgICAgcmV0dXJuIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHYgaW4gWzEuLjNdXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICA8aDE+e2ZzKFwiZmlyc3ROYW1lXCIpfTwvaDE+VmlldyAyOiB7ZnMoXCJ2XCIpfTwvRm9yRWFjaD47XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgWGFuaWEudmlldyhsYXlvdXQobmV3IFJlLkF3YWl0ZWQobWFpblZpZXcpKSkuYmluZCh0YXJnZXQsIHN0b3JlKTtcclxufVxyXG5cclxudmFyIGxheW91dDogYW55ID0gKHZpZXcpID0+XHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxoMT57ZnMoXCJ1c2VyLmZpcnN0TmFtZVwiKX0ge2ZzKFwidXNlci5sYXN0TmFtZVwiKX08L2gxPlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIHZpZXc6XHJcbiAgICAgICAgICAgIDxidXR0b24gY2xpY2s9e2ZzKFwicm91dGUgJ3ZpZXcxJ1wiKX0+dmlldyAxPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gY2xpY2s9e2ZzKFwicm91dGUgJ3ZpZXcyJ1wiKX0+dmlldyAyPC9idXR0b24+XHJcbiAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICBtb2RlbDpcclxuICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnUmFteSdcIil9PlJhbXk8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnSWJyYWhpbSdcIil9PklicmFoaW08L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IHN0eWxlPVwiYm9yZGVyOiBzb2xpZCAxcHggcmVkOyBwYWRkaW5nOiAxMHB4O1wiPlxyXG4gICAgICAgICAgICB7Vmlldy5wYXJ0aWFsKHZpZXcsIGZzKFwidXNlclwiKSl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj47XHJcbiJdfQ==