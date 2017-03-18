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
    if (store.get("currentRow").valueOf() !== row) {
        store.get("currentRow").set(row);
        store.refresh();
    }
};
function action() {
    return new mvc_1.ViewResult(xania_1.default.tag("div", { style: "height: 95%;", className: "row" },
        xania_1.default.tag("div", { className: [xania_1.expr("currentRow -> 'col-8'"), xania_1.expr("not currentRow -> 'col-12'")] },
            xania_1.default.tag(layout_1.Section, { title: "Users" },
                xania_1.default.tag(grid_1.default, { data: xania_1.expr("await dataSource"), onSelectionChanged: onSelect },
                    xania_1.default.tag(grid_1.TextColumn, { field: "name", display: "User name" }),
                    xania_1.default.tag(grid_1.TextColumn, { field: "emailConfirmed", display: "Email confirmed" })),
                xania_1.default.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                    xania_1.default.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("currentRow <- createNew()") },
                        xania_1.default.tag("span", { className: "fa fa-plus" }),
                        " Add New")))),
        xania_1.default.tag(xania_1.With, { object: xania_1.expr("currentRow") },
            xania_1.default.tag("div", { className: "col-4" },
                xania_1.default.tag(layout_1.Section, { title: xania_1.expr("name"), onCancel: xania_1.expr("cancel") },
                    xania_1.default.tag(html_1.default.TextEditor, { field: "name", display: "User Name" }),
                    xania_1.default.tag(html_1.default.TextEditor, { field: "email", display: "Email" }),
                    xania_1.default.tag(html_1.default.BooleanEditor, { field: "emailConfirmed", display: "Email confirmed" }),
                    xania_1.default.tag("div", { className: "form-group", style: "padding: 10px; background-color: #EEE; border: 1px solid #DDD;" },
                        xania_1.default.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("save ()") },
                            xania_1.default.tag("span", { className: "fa fa-save" }),
                            " Save")))))), store);
}
exports.action = action;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1c2Vycy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EseUNBQWlJO0FBQ2pJLHFDQUEwQztBQUMxQyxvQ0FBbUM7QUFDbkMsZ0NBQThDO0FBQzlDLHVDQUFpQztBQUVqQztJQUE2QixrQ0FBZTtJQUV4QztlQUNJLGtCQUFNLFlBQVksRUFBRSxPQUFPLENBQUM7SUFDaEMsQ0FBQztJQUVELGtDQUFTLEdBQVQ7UUFDSSxNQUFNLENBQUM7WUFDSCxJQUFJLEVBQUUsRUFBRTtZQUNSLEtBQUssRUFBRSxFQUFFO1lBQ1QsY0FBYyxFQUFFLEtBQUs7U0FDeEIsQ0FBQTtJQUNMLENBQUM7SUFDTCxxQkFBQztBQUFELENBQUMsQUFiRCxDQUE2Qix1QkFBZSxHQWEzQztBQUVELElBQUksS0FBSyxHQUFHLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxjQUFjLEVBQUUsQ0FBQyxDQUFDO0FBRS9DLElBQUksUUFBUSxHQUFHLFVBQUEsR0FBRztJQUNkLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEIsQ0FBQztBQUNMLENBQUMsQ0FBQTtBQUVEO0lBQ0ksTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FDakIsNkJBQUssS0FBSyxFQUFDLGNBQWMsRUFBQyxTQUFTLEVBQUMsS0FBSztRQUNyQyw2QkFBSyxTQUFTLEVBQUUsQ0FBQyxZQUFJLENBQUMsdUJBQXVCLENBQUMsRUFBRSxZQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUMvRSxvQkFBQyxnQkFBTyxJQUFDLEtBQUssRUFBQyxPQUFPO2dCQUNsQixvQkFBQyxjQUFRLElBQUMsSUFBSSxFQUFFLFlBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLFFBQVE7b0JBQ2xFLG9CQUFDLGlCQUFVLElBQUMsS0FBSyxFQUFDLE1BQU0sRUFBQyxPQUFPLEVBQUMsV0FBVyxHQUFHO29CQUMvQyxvQkFBQyxpQkFBVSxJQUFDLEtBQUssRUFBQyxnQkFBZ0IsRUFBQyxPQUFPLEVBQUMsaUJBQWlCLEdBQUcsQ0FDeEQ7Z0JBQ1gsZ0NBQVEsS0FBSyxFQUFDLDJDQUEyQztvQkFDckQsZ0NBQVEsU0FBUyxFQUFDLGlCQUFpQixFQUFDLE9BQU8sRUFBRSxZQUFJLENBQUMsMkJBQTJCLENBQUM7d0JBQzFFLDhCQUFNLFNBQVMsRUFBQyxZQUFZLEdBQVE7bUNBQWlCLENBQ3BELENBQ0gsQ0FDUjtRQUNOLG9CQUFDLFlBQUksSUFBQyxNQUFNLEVBQUUsWUFBSSxDQUFDLFlBQVksQ0FBQztZQUM1Qiw2QkFBSyxTQUFTLEVBQUMsT0FBTztnQkFDbEIsb0JBQUMsZ0JBQU8sSUFBQyxLQUFLLEVBQUUsWUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxZQUFJLENBQUMsUUFBUSxDQUFDO29CQUNsRCxvQkFBQyxjQUFJLENBQUMsVUFBVSxJQUFDLEtBQUssRUFBQyxNQUFNLEVBQUMsT0FBTyxFQUFDLFdBQVcsR0FBRztvQkFDcEQsb0JBQUMsY0FBSSxDQUFDLFVBQVUsSUFBQyxLQUFLLEVBQUMsT0FBTyxFQUFDLE9BQU8sRUFBQyxPQUFPLEdBQUc7b0JBQ2pELG9CQUFDLGNBQUksQ0FBQyxhQUFhLElBQUMsS0FBSyxFQUFDLGdCQUFnQixFQUFDLE9BQU8sRUFBQyxpQkFBaUIsR0FBRztvQkFFdkUsNkJBQUssU0FBUyxFQUFDLFlBQVksRUFBQyxLQUFLLEVBQUMsZ0VBQWdFO3dCQUM5RixnQ0FBUSxTQUFTLEVBQUMsaUJBQWlCLEVBQUMsT0FBTyxFQUFFLFlBQUksQ0FBQyxTQUFTLENBQUM7NEJBQ3hELDhCQUFNLFNBQVMsRUFBQyxZQUFZLEdBQVE7b0NBQWMsQ0FDcEQsQ0FDQSxDQUNSLENBQ0gsQ0FDTCxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7QUE5QkQsd0JBOEJDIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmltcG9ydCB4YW5pYSwgeyBSZXBlYXQsIFdpdGgsIElmLCBleHByLCBEb20sIFJlbW90ZURhdGFTb3VyY2UsIE1vZGVsUmVwb3NpdG9yeSwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uLy4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IFZpZXdSZXN1bHQgfSBmcm9tIFwiLi4vLi4vc3JjL212Y1wiXHJcbmltcG9ydCB7IFNlY3Rpb24gfSBmcm9tIFwiLi4vbGF5b3V0XCJcclxuaW1wb3J0IERhdGFHcmlkLCB7IFRleHRDb2x1bW4gfSBmcm9tIFwiLi4vZ3JpZFwiXHJcbmltcG9ydCBIdG1sIGZyb20gJy4uLy4uL3NyYy9odG1sJ1xyXG5cclxuY2xhc3MgVXNlclJlcG9zaXRvcnkgZXh0ZW5kcyBNb2RlbFJlcG9zaXRvcnkge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKCcvYXBpL3VzZXIvJywgXCJ1c2Vyc1wiKTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVOZXcoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbmFtZTogXCJcIixcclxuICAgICAgICAgICAgZW1haWw6IFwiXCIsXHJcbiAgICAgICAgICAgIGVtYWlsQ29uZmlybWVkOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxudmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKG5ldyBVc2VyUmVwb3NpdG9yeSgpKTtcclxuXHJcbnZhciBvblNlbGVjdCA9IHJvdyA9PiB7XHJcbiAgICBpZiAoc3RvcmUuZ2V0KFwiY3VycmVudFJvd1wiKS52YWx1ZU9mKCkgIT09IHJvdykge1xyXG4gICAgICAgIHN0b3JlLmdldChcImN1cnJlbnRSb3dcIikuc2V0KHJvdyk7XHJcbiAgICAgICAgc3RvcmUucmVmcmVzaCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWN0aW9uKCkge1xyXG4gICAgcmV0dXJuIG5ldyBWaWV3UmVzdWx0KFxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJoZWlnaHQ6IDk1JTtcIiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e1tleHByKFwiY3VycmVudFJvdyAtPiAnY29sLTgnXCIpLCBleHByKFwibm90IGN1cnJlbnRSb3cgLT4gJ2NvbC0xMidcIildfT5cclxuICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPVwiVXNlcnNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8RGF0YUdyaWQgZGF0YT17ZXhwcihcImF3YWl0IGRhdGFTb3VyY2VcIil9IG9uU2VsZWN0aW9uQ2hhbmdlZD17b25TZWxlY3R9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJuYW1lXCIgZGlzcGxheT1cIlVzZXIgbmFtZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwiZW1haWxDb25maXJtZWRcIiBkaXNwbGF5PVwiRW1haWwgY29uZmlybWVkXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJjdXJyZW50Um93IDwtIGNyZWF0ZU5ldygpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxXaXRoIG9iamVjdD17ZXhwcihcImN1cnJlbnRSb3dcIil9PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPXtleHByKFwibmFtZVwiKX0gb25DYW5jZWw9e2V4cHIoXCJjYW5jZWxcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SHRtbC5UZXh0RWRpdG9yIGZpZWxkPVwibmFtZVwiIGRpc3BsYXk9XCJVc2VyIE5hbWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SHRtbC5UZXh0RWRpdG9yIGZpZWxkPVwiZW1haWxcIiBkaXNwbGF5PVwiRW1haWxcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SHRtbC5Cb29sZWFuRWRpdG9yIGZpZWxkPVwiZW1haWxDb25maXJtZWRcIiBkaXNwbGF5PVwiRW1haWwgY29uZmlybWVkXCIgLz5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiIHN0eWxlPVwicGFkZGluZzogMTBweDsgYmFja2dyb3VuZC1jb2xvcjogI0VFRTsgYm9yZGVyOiAxcHggc29saWQgI0RERDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcInNhdmUgKClcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXNhdmVcIj48L3NwYW4+IFNhdmU8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9TZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvV2l0aD5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufSJdfQ==