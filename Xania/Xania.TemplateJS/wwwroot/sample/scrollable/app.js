"use strict";
var observables_1 = require("../../src/observables");
var xania_1 = require("../../src/xania");
function bind(target) {
    var view = new observables_1.Observables.Observable("view1");
    var store = new xania_1.Store({
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
    xania_1.Xania.view(template()).bind(target, store);
}
exports.bind = bind;
var template = function () {
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
        xania_1.Xania.tag("div", { style: "border: solid 1px red; padding: 10px;" },
            xania_1.Xania.tag(xania_1.Partial, { view: xania_1.fs("resolve (await view) user"), model: xania_1.fs("user") })));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL3Njcm9sbGFibGUvYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUFvRTtBQUVwRSxjQUFxQixNQUFZO0lBQzdCLElBQUksSUFBSSxHQUFHLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDL0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUM7UUFDbEIsSUFBSSxNQUFBO1FBQ0osSUFBSSxFQUFFLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUU7UUFDNUIsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO1FBQ3JELEtBQUssWUFBQyxRQUFRO1lBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUNELE9BQU8sWUFBQyxRQUFRO1lBQ1osTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDZixLQUFLLE9BQU87b0JBQ1IsTUFBTSxDQUFDOzt3QkFBYyxVQUFFLENBQUMsV0FBVyxDQUFDLENBQU8sQ0FBQztnQkFDaEQsS0FBSyxPQUFPO29CQUNSLE1BQU0sQ0FBQyxrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxpQkFBaUIsQ0FBQzt3QkFBRSw4QkFBSyxVQUFFLENBQUMsV0FBVyxDQUFDLENBQU07O3dCQUFTLFVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBVyxDQUFDO1lBQzNHLENBQUM7UUFDTCxDQUFDO0tBQ0osQ0FBQyxDQUFDO0lBRUgsYUFBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQXBCRCxvQkFvQkM7QUFFRCxJQUFJLFFBQVEsR0FBUTtJQUNoQixPQUFBO1FBQ0k7WUFBSyxVQUFFLENBQUMsZ0JBQWdCLENBQUM7O1lBQUcsVUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFNO1FBQ3JEOztZQUVJLDhCQUFRLEtBQUssRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLGFBQWlCO1lBQ25ELDhCQUFRLEtBQUssRUFBRSxVQUFFLENBQUMsZUFBZSxDQUFDLGFBQWlCOztZQUduRCw4QkFBUSxLQUFLLEVBQUUsVUFBRSxDQUFDLDBCQUEwQixDQUFDLFdBQWU7WUFDNUQsOEJBQVEsS0FBSyxFQUFFLFVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxjQUFrQixDQUNoRTtRQUNOLDJCQUFLLEtBQUssRUFBQyx1Q0FBdUM7WUFDOUMsa0JBQUMsZUFBTyxJQUFDLElBQUksRUFBRSxVQUFFLENBQUMsMkJBQTJCLENBQUMsRUFBRSxLQUFLLEVBQUUsVUFBRSxDQUFDLE1BQU0sQ0FBQyxHQUFJLENBQ25FLENBQ0o7QUFkTixDQWNNLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5cclxuaW1wb3J0IHsgWGFuaWEsIEZvckVhY2gsIGZzLCBTdG9yZSwgUGFydGlhbCB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJpbmQodGFyZ2V0OiBOb2RlKSB7XHJcbiAgICB2YXIgdmlldyA9IG5ldyBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlKFwidmlldzFcIik7XHJcbiAgICB2YXIgc3RvcmUgPSBuZXcgU3RvcmUoe1xyXG4gICAgICAgIHZpZXcsXHJcbiAgICAgICAgdGltZTogbmV3IE9ic2VydmFibGVzLlRpbWUoKSxcclxuICAgICAgICB1c2VyOiB7IGZpcnN0TmFtZTogXCJJYnJhaGltXCIsIGxhc3ROYW1lOiBcImJlbiBTYWxhaFwiIH0sXHJcbiAgICAgICAgcm91dGUodmlld05hbWUpIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3Lm9uTmV4dCh2aWV3TmFtZSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXNvbHZlKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodmlld05hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3ZpZXcxJzpcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGRpdj52aWV3IDE6IHtmcyhcImZpcnN0TmFtZVwiKX08L2Rpdj47XHJcbiAgICAgICAgICAgICAgICBjYXNlICd2aWV3Mic6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHYgaW4gWzEuLjNdXCIpfT48aDE+e2ZzKFwiZmlyc3ROYW1lXCIpfTwvaDE+VmlldyAyOiB7ZnMoXCJ2XCIpfTwvRm9yRWFjaD47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBYYW5pYS52aWV3KHRlbXBsYXRlKCkpLmJpbmQodGFyZ2V0LCBzdG9yZSk7XHJcbn1cclxuXHJcbnZhciB0ZW1wbGF0ZTogYW55ID0gKCkgPT5cclxuICAgIDxkaXY+XHJcbiAgICAgICAgPGgxPntmcyhcInVzZXIuZmlyc3ROYW1lXCIpfSB7ZnMoXCJ1c2VyLmxhc3ROYW1lXCIpfTwvaDE+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgdmlldzpcclxuICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJyb3V0ZSAndmlldzEnXCIpfT52aWV3IDE8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJyb3V0ZSAndmlldzInXCIpfT52aWV3IDI8L2J1dHRvbj5cclxuICAgICAgICAgICAgJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7XHJcbiAgICAgICAgICAgIG1vZGVsOlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInVzZXIuZmlyc3ROYW1lIDwtICdSYW15J1wiKX0+UmFteTwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInVzZXIuZmlyc3ROYW1lIDwtICdJYnJhaGltJ1wiKX0+SWJyYWhpbTwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJib3JkZXI6IHNvbGlkIDFweCByZWQ7IHBhZGRpbmc6IDEwcHg7XCI+XHJcbiAgICAgICAgICAgIDxQYXJ0aWFsIHZpZXc9e2ZzKFwicmVzb2x2ZSAoYXdhaXQgdmlldykgdXNlclwiKX0gbW9kZWw9e2ZzKFwidXNlclwiKX0gLz5cclxuICAgICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PjtcclxuIl19