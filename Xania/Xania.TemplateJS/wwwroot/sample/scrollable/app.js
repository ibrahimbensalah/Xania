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
    template().bind(target, store);
}
exports.bind = bind;
function template() {
    var view = xania_1.Xania.tag("div", null,
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
    return view;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL3Njcm9sbGFibGUvYXBwLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscURBQW1EO0FBRW5ELHlDQUFvRTtBQUVwRSxjQUFxQixNQUFZO0lBQzdCLElBQUksSUFBSSxHQUFHLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDL0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUM7UUFDbEIsSUFBSSxNQUFBO1FBQ0osSUFBSSxFQUFFLElBQUkseUJBQVcsQ0FBQyxJQUFJLEVBQUU7UUFDNUIsSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO1FBQ3JELEtBQUssWUFBQyxRQUFRO1lBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUNELE9BQU8sWUFBQyxRQUFRO1lBQ1osTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDZixLQUFLLE9BQU87b0JBQ1IsTUFBTSxDQUFDOzt3QkFBYyxVQUFFLENBQUMsV0FBVyxDQUFDLENBQU8sQ0FBQztnQkFDaEQsS0FBSyxPQUFPO29CQUNSLE1BQU0sQ0FBQyxrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxpQkFBaUIsQ0FBQzt3QkFBRSw4QkFBSyxVQUFFLENBQUMsV0FBVyxDQUFDLENBQU07O3dCQUFTLFVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBVyxDQUFDO1lBQzNHLENBQUM7UUFDTCxDQUFDO0tBQ0osQ0FBQyxDQUFDO0lBRUgsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNuQyxDQUFDO0FBcEJELG9CQW9CQztBQUVEO0lBQ0ksSUFBSSxJQUFJLEdBQ0o7UUFDSTtZQUFLLFVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzs7WUFBRyxVQUFFLENBQUMsZUFBZSxDQUFDLENBQU07UUFDckQ7O1lBRUksOEJBQVEsS0FBSyxFQUFFLFVBQUUsQ0FBQyxlQUFlLENBQUMsYUFBaUI7WUFDbkQsOEJBQVEsS0FBSyxFQUFFLFVBQUUsQ0FBQyxlQUFlLENBQUMsYUFBaUI7O1lBR25ELDhCQUFRLEtBQUssRUFBRSxVQUFFLENBQUMsMEJBQTBCLENBQUMsV0FBZTtZQUM1RCw4QkFBUSxLQUFLLEVBQUUsVUFBRSxDQUFDLDZCQUE2QixDQUFDLGNBQWtCLENBQ2hFO1FBQ04sMkJBQUssS0FBSyxFQUFDLHVDQUF1QztZQUM5QyxrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQywyQkFBMkIsQ0FBQyxFQUFFLEtBQUssRUFBRSxVQUFFLENBQUMsTUFBTSxDQUFDLEdBQUksQ0FDbkUsQ0FDSixDQUFDO0lBRVgsTUFBTSxDQUFDLElBQVcsQ0FBQztBQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmltcG9ydCB7IFhhbmlhLCBGb3JFYWNoLCBmcywgU3RvcmUsIFBhcnRpYWwgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiaW5kKHRhcmdldDogTm9kZSkge1xyXG4gICAgdmFyIHZpZXcgPSBuZXcgT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZShcInZpZXcxXCIpO1xyXG4gICAgdmFyIHN0b3JlID0gbmV3IFN0b3JlKHtcclxuICAgICAgICB2aWV3LFxyXG4gICAgICAgIHRpbWU6IG5ldyBPYnNlcnZhYmxlcy5UaW1lKCksXHJcbiAgICAgICAgdXNlcjogeyBmaXJzdE5hbWU6IFwiSWJyYWhpbVwiLCBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIiB9LFxyXG4gICAgICAgIHJvdXRlKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5vbk5leHQodmlld05hbWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmVzb2x2ZSh2aWV3TmFtZSkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHZpZXdOYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd2aWV3MSc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDxkaXY+dmlldyAxOiB7ZnMoXCJmaXJzdE5hbWVcIil9PC9kaXY+O1xyXG4gICAgICAgICAgICAgICAgY2FzZSAndmlldzInOlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiA8Rm9yRWFjaCBleHByPXtmcyhcImZvciB2IGluIFsxLi4zXVwiKX0+PGgxPntmcyhcImZpcnN0TmFtZVwiKX08L2gxPlZpZXcgMjoge2ZzKFwidlwiKX08L0ZvckVhY2g+O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGVtcGxhdGUoKS5iaW5kKHRhcmdldCwgc3RvcmUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZW1wbGF0ZSgpIHtcclxuICAgIHZhciB2aWV3ID1cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICA8aDE+e2ZzKFwidXNlci5maXJzdE5hbWVcIil9IHtmcyhcInVzZXIubGFzdE5hbWVcIil9PC9oMT5cclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgIHZpZXc6XHJcbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInJvdXRlICd2aWV3MSdcIil9PnZpZXcgMTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJyb3V0ZSAndmlldzInXCIpfT52aWV3IDI8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwO1xyXG4gICAgICAgICAgICAgICAgbW9kZWw6XHJcbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsaWNrPXtmcyhcInVzZXIuZmlyc3ROYW1lIDwtICdSYW15J1wiKX0+UmFteTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGljaz17ZnMoXCJ1c2VyLmZpcnN0TmFtZSA8LSAnSWJyYWhpbSdcIil9PklicmFoaW08L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJib3JkZXI6IHNvbGlkIDFweCByZWQ7IHBhZGRpbmc6IDEwcHg7XCI+XHJcbiAgICAgICAgICAgICAgICA8UGFydGlhbCB2aWV3PXtmcyhcInJlc29sdmUgKGF3YWl0IHZpZXcpIHVzZXJcIil9IG1vZGVsPXtmcyhcInVzZXJcIil9IC8+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PjtcclxuXHJcbiAgICByZXR1cm4gdmlldyBhcyBhbnk7XHJcbn0iXX0=