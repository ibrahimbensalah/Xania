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
var CompanyRepository = (function (_super) {
    __extends(CompanyRepository, _super);
    function CompanyRepository() {
        return _super.call(this, "/api/company/", "companies") || this;
    }
    CompanyRepository.prototype.createNew = function () {
        return {
            name: null
        };
    };
    return CompanyRepository;
}(xania_1.ModelRepository));
function action() {
    var store = new xania_1.Reactive.Store(new CompanyRepository());
    var onSelect = function (row) {
        store.get("currentRow").set(row);
        store.refresh();
    };
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", { style: "height: 95%;", className: "row" },
        xania_1.Xania.tag("div", { className: [xania_1.expr("currentRow -> 'col-8'"), xania_1.expr("not currentRow -> 'col-12'")] },
            xania_1.Xania.tag(layout_1.Section, { title: "Companies" },
                xania_1.Xania.tag(grid_1.default, { data: xania_1.expr("await dataSource"), onSelectionChanged: onSelect },
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "name", display: "Company Name" })),
                xania_1.Xania.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                    xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("currentRow <- createNew()") },
                        xania_1.Xania.tag("span", { className: "fa fa-plus" }),
                        " Add New")))),
        xania_1.Xania.tag(xania_1.With, { object: xania_1.expr("currentRow") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag(layout_1.Section, { title: xania_1.expr("description"), onCancel: xania_1.expr("cancel") },
                    xania_1.Xania.tag(html_1.default.TextEditor, { field: "name", display: "Company Name" }),
                    xania_1.Xania.tag("div", { className: "form-group", style: "padding: 10px; background-color: #EEE; border: 1px solid #DDD;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("save ()") },
                            xania_1.Xania.tag("span", { className: "fa fa-save" }),
                            " Save")))))), store);
}
exports.action = action;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGFuaWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tcGFuaWVzLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx5Q0FBMEk7QUFDMUkscUNBQTBDO0FBQzFDLG9DQUFtQztBQUNuQyxnQ0FBOEM7QUFDOUMsdUNBQWlDO0FBR2pDO0lBQWdDLHFDQUFlO0lBQzNDO2VBQ0ksa0JBQU0sZUFBZSxFQUFFLFdBQVcsQ0FBQztJQUN2QyxDQUFDO0lBRUQscUNBQVMsR0FBVDtRQUNJLE1BQU0sQ0FBQztZQUNILElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQztJQUNOLENBQUM7SUFDTCx3QkFBQztBQUFELENBQUMsQUFWRCxDQUFnQyx1QkFBZSxHQVU5QztBQUVEO0lBQ0ksSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFpQixFQUFFLENBQUMsQ0FBQztJQUVsRCxJQUFJLFFBQVEsR0FBRyxVQUFBLEdBQUc7UUFDZCxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEIsQ0FBQyxDQUFBO0lBRUQsTUFBTSxDQUFDLElBQUksZ0JBQVUsQ0FDakIsMkJBQUssS0FBSyxFQUFDLGNBQWMsRUFBQyxTQUFTLEVBQUMsS0FBSztRQUNyQywyQkFBSyxTQUFTLEVBQUUsQ0FBQyxZQUFJLENBQUMsdUJBQXVCLENBQUMsRUFBRSxZQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUMvRSxrQkFBQyxnQkFBTyxJQUFDLEtBQUssRUFBQyxXQUFXO2dCQUN0QixrQkFBQyxjQUFRLElBQUMsSUFBSSxFQUFFLFlBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLFFBQVE7b0JBQ2xFLGtCQUFDLGlCQUFVLElBQUMsS0FBSyxFQUFDLE1BQU0sRUFBQyxPQUFPLEVBQUMsY0FBYyxHQUFHLENBQzNDO2dCQUNYLDhCQUFRLEtBQUssRUFBQywyQ0FBMkM7b0JBQ3JELDhCQUFRLFNBQVMsRUFBQyxpQkFBaUIsRUFBQyxPQUFPLEVBQUUsWUFBSSxDQUFDLDJCQUEyQixDQUFDO3dCQUMxRSw0QkFBTSxTQUFTLEVBQUMsWUFBWSxHQUFRO21DQUFpQixDQUNwRCxDQUNILENBQ1I7UUFDTixrQkFBQyxZQUFJLElBQUMsTUFBTSxFQUFFLFlBQUksQ0FBQyxZQUFZLENBQUM7WUFDNUIsMkJBQUssU0FBUyxFQUFDLE9BQU87Z0JBQ2xCLGtCQUFDLGdCQUFPLElBQUMsS0FBSyxFQUFFLFlBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxRQUFRLEVBQUUsWUFBSSxDQUFDLFFBQVEsQ0FBQztvQkFDekQsa0JBQUMsY0FBSSxDQUFDLFVBQVUsSUFBQyxLQUFLLEVBQUMsTUFBTSxFQUFDLE9BQU8sRUFBQyxjQUFjLEdBQUc7b0JBRXZELDJCQUFLLFNBQVMsRUFBQyxZQUFZLEVBQUMsS0FBSyxFQUFDLGdFQUFnRTt3QkFDOUYsOEJBQVEsU0FBUyxFQUFDLGlCQUFpQixFQUFDLE9BQU8sRUFBRSxZQUFJLENBQUMsU0FBUyxDQUFDOzRCQUN4RCw0QkFBTSxTQUFTLEVBQUMsWUFBWSxHQUFRO29DQUFjLENBQ3BELENBQ0EsQ0FDUixDQUNILENBQ0wsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN2QixDQUFDO0FBbENELHdCQWtDQyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgUmVwZWF0LCBXaXRoLCBJZiwgZXhwciwgRG9tLCBSZW1vdGVEYXRhU291cmNlLCBNb2RlbFJlcG9zaXRvcnksIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBWaWV3UmVzdWx0IH0gZnJvbSBcIi4uLy4uL3NyYy9tdmNcIlxyXG5pbXBvcnQgeyBTZWN0aW9uIH0gZnJvbSBcIi4uL2xheW91dFwiXHJcbmltcG9ydCBEYXRhR3JpZCwgeyBUZXh0Q29sdW1uIH0gZnJvbSBcIi4uL2dyaWRcIlxyXG5pbXBvcnQgSHRtbCBmcm9tICcuLi8uLi9zcmMvaHRtbCdcclxuXHJcblxyXG5jbGFzcyBDb21wYW55UmVwb3NpdG9yeSBleHRlbmRzIE1vZGVsUmVwb3NpdG9yeSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcihcIi9hcGkvY29tcGFueS9cIiwgXCJjb21wYW5pZXNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlTmV3KCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG5hbWU6IG51bGxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWN0aW9uKCkge1xyXG4gICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKG5ldyBDb21wYW55UmVwb3NpdG9yeSgpKTtcclxuXHJcbiAgICB2YXIgb25TZWxlY3QgPSByb3cgPT4ge1xyXG4gICAgICAgIHN0b3JlLmdldChcImN1cnJlbnRSb3dcIikuc2V0KHJvdyk7XHJcbiAgICAgICAgc3RvcmUucmVmcmVzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdChcclxuICAgICAgICA8ZGl2IHN0eWxlPVwiaGVpZ2h0OiA5NSU7XCIgY2xhc3NOYW1lPVwicm93XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbZXhwcihcImN1cnJlbnRSb3cgLT4gJ2NvbC04J1wiKSwgZXhwcihcIm5vdCBjdXJyZW50Um93IC0+ICdjb2wtMTInXCIpXX0+XHJcbiAgICAgICAgICAgICAgICA8U2VjdGlvbiB0aXRsZT1cIkNvbXBhbmllc1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxEYXRhR3JpZCBkYXRhPXtleHByKFwiYXdhaXQgZGF0YVNvdXJjZVwiKX0gb25TZWxlY3Rpb25DaGFuZ2VkPXtvblNlbGVjdH0gPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8VGV4dENvbHVtbiBmaWVsZD1cIm5hbWVcIiBkaXNwbGF5PVwiQ29tcGFueSBOYW1lXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJjdXJyZW50Um93IDwtIGNyZWF0ZU5ldygpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxXaXRoIG9iamVjdD17ZXhwcihcImN1cnJlbnRSb3dcIil9PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPXtleHByKFwiZGVzY3JpcHRpb25cIil9IG9uQ2FuY2VsPXtleHByKFwiY2FuY2VsXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEh0bWwuVGV4dEVkaXRvciBmaWVsZD1cIm5hbWVcIiBkaXNwbGF5PVwiQ29tcGFueSBOYW1lXCIgLz5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiIHN0eWxlPVwicGFkZGluZzogMTBweDsgYmFja2dyb3VuZC1jb2xvcjogI0VFRTsgYm9yZGVyOiAxcHggc29saWQgI0RERDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcInNhdmUgKClcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXNhdmVcIj48L3NwYW4+IFNhdmU8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9TZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvV2l0aD5cclxuICAgICAgICA8L2Rpdj4sIHN0b3JlKTtcclxufVxyXG4iXX0=