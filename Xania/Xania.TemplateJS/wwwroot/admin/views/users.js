"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var xania_1 = require("../../src/xania");
var mvc_1 = require("../../src/mvc");
var layout_1 = require("../layout");
var grid_1 = require("../grid");
var html_1 = require("../../src/html");
var UserRepository = (function (_super) {
    __extends(UserRepository, _super);
    function UserRepository() {
        return _super.call(this, '/api/user/', "users") || this;
    }
    UserRepository.prototype.createNew = function () {
        return {
            name: "",
            email: "",
            emailConfirmed: false
        };
    };
    return UserRepository;
}(xania_1.ModelRepository));
var store = new xania_1.Reactive.Store(new UserRepository());
var onSelect = function (row) {
    store.get("currentRow").set(row);
    store.refresh();
};
function action() {
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", { style: "height: 95%;", className: "row" },
        xania_1.Xania.tag("div", { className: [xania_1.expr("currentRow -> 'col-8'"), xania_1.expr("not currentRow -> 'col-12'")] },
            xania_1.Xania.tag(layout_1.Section, { title: "Users" },
                xania_1.Xania.tag(grid_1.default, { data: xania_1.expr("await dataSource"), onSelectionChanged: onSelect },
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "name", display: "User name" }),
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "emailConfirmed", display: "Email confirmed" })),
                xania_1.Xania.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                    xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("currentRow <- createNew()") },
                        xania_1.Xania.tag("span", { className: "fa fa-plus" }),
                        " Add New")))),
        xania_1.Xania.tag(xania_1.With, { object: xania_1.expr("currentRow") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag(layout_1.Section, { title: xania_1.expr("name"), onCancel: xania_1.expr("cancel") },
                    xania_1.Xania.tag(html_1.default.TextEditor, { field: "name", display: "User Name" }),
                    xania_1.Xania.tag(html_1.default.TextEditor, { field: "email", display: "Email" }),
                    xania_1.Xania.tag(html_1.default.BooleanEditor, { field: "emailConfirmed", display: "Email confirmed" }),
                    xania_1.Xania.tag("div", { className: "form-group", style: "padding: 10px; background-color: #EEE; border: 1px solid #DDD;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("save ()") },
                            xania_1.Xania.tag("span", { className: "fa fa-save" }),
                            " Save")))))), store);
}
exports.action = action;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c2Vycy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EseUNBQTBJO0FBQzFJLHFDQUEwQztBQUMxQyxvQ0FBbUM7QUFDbkMsZ0NBQThDO0FBQzlDLHVDQUFpQztBQUVqQztJQUE2QixrQ0FBZTtJQUV4QztlQUNJLGtCQUFNLFlBQVksRUFBRSxPQUFPLENBQUM7SUFDaEMsQ0FBQztJQUVELGtDQUFTLEdBQVQ7UUFDSSxNQUFNLENBQUM7WUFDSCxJQUFJLEVBQUUsRUFBRTtZQUNSLEtBQUssRUFBRSxFQUFFO1lBQ1QsY0FBYyxFQUFFLEtBQUs7U0FDeEIsQ0FBQTtJQUNMLENBQUM7SUFDTCxxQkFBQztBQUFELENBQUMsQUFiRCxDQUE2Qix1QkFBZSxHQWEzQztBQUVELElBQUksS0FBSyxHQUFHLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxjQUFjLEVBQUUsQ0FBQyxDQUFDO0FBRS9DLElBQUksUUFBUSxHQUFHLFVBQUEsR0FBRztJQUNkLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNwQixDQUFDLENBQUE7QUFFRDtJQUNJLE1BQU0sQ0FBQyxJQUFJLGdCQUFVLENBQ2pCLDJCQUFLLEtBQUssRUFBQyxjQUFjLEVBQUMsU0FBUyxFQUFDLEtBQUs7UUFDckMsMkJBQUssU0FBUyxFQUFFLENBQUMsWUFBSSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsWUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDL0Usa0JBQUMsZ0JBQU8sSUFBQyxLQUFLLEVBQUMsT0FBTztnQkFDbEIsa0JBQUMsY0FBUSxJQUFDLElBQUksRUFBRSxZQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxrQkFBa0IsRUFBRSxRQUFRO29CQUNsRSxrQkFBQyxpQkFBVSxJQUFDLEtBQUssRUFBQyxNQUFNLEVBQUMsT0FBTyxFQUFDLFdBQVcsR0FBRztvQkFDL0Msa0JBQUMsaUJBQVUsSUFBQyxLQUFLLEVBQUMsZ0JBQWdCLEVBQUMsT0FBTyxFQUFDLGlCQUFpQixHQUFHLENBQ3hEO2dCQUNYLDhCQUFRLEtBQUssRUFBQywyQ0FBMkM7b0JBQ3JELDhCQUFRLFNBQVMsRUFBQyxpQkFBaUIsRUFBQyxPQUFPLEVBQUUsWUFBSSxDQUFDLDJCQUEyQixDQUFDO3dCQUMxRSw0QkFBTSxTQUFTLEVBQUMsWUFBWSxHQUFRO21DQUFpQixDQUNwRCxDQUNILENBQ1I7UUFDTixrQkFBQyxZQUFJLElBQUMsTUFBTSxFQUFFLFlBQUksQ0FBQyxZQUFZLENBQUM7WUFDNUIsMkJBQUssU0FBUyxFQUFDLE9BQU87Z0JBQ2xCLGtCQUFDLGdCQUFPLElBQUMsS0FBSyxFQUFFLFlBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsWUFBSSxDQUFDLFFBQVEsQ0FBQztvQkFDbEQsa0JBQUMsY0FBSSxDQUFDLFVBQVUsSUFBQyxLQUFLLEVBQUMsTUFBTSxFQUFDLE9BQU8sRUFBQyxXQUFXLEdBQUc7b0JBQ3BELGtCQUFDLGNBQUksQ0FBQyxVQUFVLElBQUMsS0FBSyxFQUFDLE9BQU8sRUFBQyxPQUFPLEVBQUMsT0FBTyxHQUFHO29CQUNqRCxrQkFBQyxjQUFJLENBQUMsYUFBYSxJQUFDLEtBQUssRUFBQyxnQkFBZ0IsRUFBQyxPQUFPLEVBQUMsaUJBQWlCLEdBQUc7b0JBRXZFLDJCQUFLLFNBQVMsRUFBQyxZQUFZLEVBQUMsS0FBSyxFQUFDLGdFQUFnRTt3QkFDOUYsOEJBQVEsU0FBUyxFQUFDLGlCQUFpQixFQUFDLE9BQU8sRUFBRSxZQUFJLENBQUMsU0FBUyxDQUFDOzRCQUN4RCw0QkFBTSxTQUFTLEVBQUMsWUFBWSxHQUFRO29DQUFjLENBQ3BELENBQ0EsQ0FDUixDQUNILENBQ0wsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN2QixDQUFDO0FBOUJELHdCQThCQyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgUmVwZWF0LCBXaXRoLCBJZiwgZXhwciwgRG9tLCBSZW1vdGVEYXRhU291cmNlLCBNb2RlbFJlcG9zaXRvcnksIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBWaWV3UmVzdWx0IH0gZnJvbSBcIi4uLy4uL3NyYy9tdmNcIlxyXG5pbXBvcnQgeyBTZWN0aW9uIH0gZnJvbSBcIi4uL2xheW91dFwiXHJcbmltcG9ydCBEYXRhR3JpZCwgeyBUZXh0Q29sdW1uIH0gZnJvbSBcIi4uL2dyaWRcIlxyXG5pbXBvcnQgSHRtbCBmcm9tICcuLi8uLi9zcmMvaHRtbCdcclxuXHJcbmNsYXNzIFVzZXJSZXBvc2l0b3J5IGV4dGVuZHMgTW9kZWxSZXBvc2l0b3J5IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcignL2FwaS91c2VyLycsIFwidXNlcnNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlTmV3KCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiXCIsXHJcbiAgICAgICAgICAgIGVtYWlsOiBcIlwiLFxyXG4gICAgICAgICAgICBlbWFpbENvbmZpcm1lZDogZmFsc2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZShuZXcgVXNlclJlcG9zaXRvcnkoKSk7XHJcblxyXG52YXIgb25TZWxlY3QgPSByb3cgPT4ge1xyXG4gICAgc3RvcmUuZ2V0KFwiY3VycmVudFJvd1wiKS5zZXQocm93KTtcclxuICAgIHN0b3JlLnJlZnJlc2goKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFjdGlvbigpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdChcclxuICAgICAgICA8ZGl2IHN0eWxlPVwiaGVpZ2h0OiA5NSU7XCIgY2xhc3NOYW1lPVwicm93XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbZXhwcihcImN1cnJlbnRSb3cgLT4gJ2NvbC04J1wiKSwgZXhwcihcIm5vdCBjdXJyZW50Um93IC0+ICdjb2wtMTInXCIpXX0+XHJcbiAgICAgICAgICAgICAgICA8U2VjdGlvbiB0aXRsZT1cIlVzZXJzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPERhdGFHcmlkIGRhdGE9e2V4cHIoXCJhd2FpdCBkYXRhU291cmNlXCIpfSBvblNlbGVjdGlvbkNoYW5nZWQ9e29uU2VsZWN0fSA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwibmFtZVwiIGRpc3BsYXk9XCJVc2VyIG5hbWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8VGV4dENvbHVtbiBmaWVsZD1cImVtYWlsQ29uZmlybWVkXCIgZGlzcGxheT1cIkVtYWlsIGNvbmZpcm1lZFwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9EYXRhR3JpZD5cclxuICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4OyBtYXJnaW46IDAgMTZweDsgcGFkZGluZzogMDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBvbkNsaWNrPXtleHByKFwiY3VycmVudFJvdyA8LSBjcmVhdGVOZXcoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1wbHVzXCI+PC9zcGFuPiBBZGQgTmV3PC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9mb290ZXI+XHJcbiAgICAgICAgICAgICAgICA8L1NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8V2l0aCBvYmplY3Q9e2V4cHIoXCJjdXJyZW50Um93XCIpfT5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8U2VjdGlvbiB0aXRsZT17ZXhwcihcIm5hbWVcIil9IG9uQ2FuY2VsPXtleHByKFwiY2FuY2VsXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEh0bWwuVGV4dEVkaXRvciBmaWVsZD1cIm5hbWVcIiBkaXNwbGF5PVwiVXNlciBOYW1lXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEh0bWwuVGV4dEVkaXRvciBmaWVsZD1cImVtYWlsXCIgZGlzcGxheT1cIkVtYWlsXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEh0bWwuQm9vbGVhbkVkaXRvciBmaWVsZD1cImVtYWlsQ29uZmlybWVkXCIgZGlzcGxheT1cIkVtYWlsIGNvbmZpcm1lZFwiIC8+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIiBzdHlsZT1cInBhZGRpbmc6IDEwcHg7IGJhY2tncm91bmQtY29sb3I6ICNFRUU7IGJvcmRlcjogMXB4IHNvbGlkICNEREQ7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJzYXZlICgpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1zYXZlXCI+PC9zcGFuPiBTYXZlPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L1dpdGg+XHJcbiAgICAgICAgPC9kaXY+LCBzdG9yZSk7XHJcbn0iXX0=