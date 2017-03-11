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
var InvoiceRepository = (function (_super) {
    __extends(InvoiceRepository, _super);
    function InvoiceRepository() {
        return _super.call(this, "/api/invoice/", "invoices") || this;
    }
    InvoiceRepository.prototype.addLine = function () {
        this.currentRow.lines.push({
            description: "new line",
            amount: Math.floor(Math.random() * 10)
        });
    };
    InvoiceRepository.prototype.createNew = function () {
        return {
            description: null,
            lines: []
        };
    };
    return InvoiceRepository;
}(xania_1.ModelRepository));
var store = new xania_1.Reactive.Store(new InvoiceRepository());
var onSelect = function (row) {
    store.get("currentRow").set(row);
    store.refresh();
};
function action() {
    return new mvc_1.ViewResult(xania_1.Xania.tag("div", { style: "height: 95%;", className: "row" },
        xania_1.Xania.tag("div", { className: [xania_1.expr("currentRow -> 'col-8'"), xania_1.expr("not currentRow -> 'col-12'")] },
            xania_1.Xania.tag(layout_1.Section, { title: "Invoices" },
                xania_1.Xania.tag(grid_1.default, { data: xania_1.expr("await dataSource"), onSelectionChanged: onSelect },
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "description", display: "Description" }),
                    xania_1.Xania.tag(grid_1.TextColumn, { field: "invoiceDate", display: "Invoice Date" })),
                xania_1.Xania.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                    xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("currentRow <- createNew()") },
                        xania_1.Xania.tag("span", { className: "fa fa-plus" }),
                        " Add New")))),
        xania_1.Xania.tag(xania_1.With, { object: xania_1.expr("currentRow") },
            xania_1.Xania.tag("div", { className: "col-4" },
                xania_1.Xania.tag(layout_1.Section, { title: xania_1.expr("description"), onCancel: xania_1.expr("cancel") },
                    xania_1.Xania.tag(html_1.default.TextEditor, { field: "description", display: "Description" }),
                    xania_1.Xania.tag("button", { onClick: xania_1.expr("addLine ()") }, "add"),
                    xania_1.Xania.tag("div", { className: "row" },
                        xania_1.Xania.tag(xania_1.Repeat, { source: xania_1.expr("lines") },
                            xania_1.Xania.tag("div", { className: "col-6" },
                                xania_1.Xania.tag("input", { type: "text", className: "form-control", name: "description" })),
                            xania_1.Xania.tag("div", { className: "col-6" },
                                xania_1.Xania.tag("input", { type: "text", className: "form-control", name: "amount" })))),
                    xania_1.Xania.tag("div", { className: "form-group", style: "padding: 10px; background-color: #EEE; border: 1px solid #DDD;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("save ()") },
                            xania_1.Xania.tag("span", { className: "fa fa-save" }),
                            " Save")))))), store);
}
exports.action = action;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52b2ljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnZvaWNlcy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EseUNBQTBJO0FBQzFJLHFDQUEwQztBQUMxQyxvQ0FBbUM7QUFDbkMsZ0NBQThDO0FBQzlDLHVDQUFpQztBQUVqQztJQUFnQyxxQ0FBZTtJQUUzQztlQUNJLGtCQUFNLGVBQWUsRUFBRSxVQUFVLENBQUM7SUFDdEMsQ0FBQztJQUVELG1DQUFPLEdBQVA7UUFDSSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDdkIsV0FBVyxFQUFFLFVBQVU7WUFDdkIsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztTQUN6QyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQscUNBQVMsR0FBVDtRQUNJLE1BQU0sQ0FBQztZQUNILFdBQVcsRUFBRSxJQUFJO1lBQ2pCLEtBQUssRUFBRSxFQUFFO1NBQ1osQ0FBQztJQUNOLENBQUM7SUFDTCx3QkFBQztBQUFELENBQUMsQUFuQkQsQ0FBZ0MsdUJBQWUsR0FtQjlDO0FBRUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxnQkFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFpQixFQUFFLENBQUMsQ0FBQztBQUVsRCxJQUFJLFFBQVEsR0FBRyxVQUFBLEdBQUc7SUFDZCxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDcEIsQ0FBQyxDQUFBO0FBRUQ7SUFDSSxNQUFNLENBQUMsSUFBSSxnQkFBVSxDQUNqQiwyQkFBSyxLQUFLLEVBQUMsY0FBYyxFQUFDLFNBQVMsRUFBQyxLQUFLO1FBQ3JDLDJCQUFLLFNBQVMsRUFBRSxDQUFDLFlBQUksQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLFlBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1lBQy9FLGtCQUFDLGdCQUFPLElBQUMsS0FBSyxFQUFDLFVBQVU7Z0JBQ3JCLGtCQUFDLGNBQVEsSUFBQyxJQUFJLEVBQUUsWUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsa0JBQWtCLEVBQUUsUUFBUTtvQkFDbEUsa0JBQUMsaUJBQVUsSUFBQyxLQUFLLEVBQUMsYUFBYSxFQUFDLE9BQU8sRUFBQyxhQUFhLEdBQUc7b0JBQ3hELGtCQUFDLGlCQUFVLElBQUMsS0FBSyxFQUFDLGFBQWEsRUFBQyxPQUFPLEVBQUMsY0FBYyxHQUFHLENBQ2xEO2dCQUNYLDhCQUFRLEtBQUssRUFBQywyQ0FBMkM7b0JBQ3JELDhCQUFRLFNBQVMsRUFBQyxpQkFBaUIsRUFBQyxPQUFPLEVBQUUsWUFBSSxDQUFDLDJCQUEyQixDQUFDO3dCQUMxRSw0QkFBTSxTQUFTLEVBQUMsWUFBWSxHQUFRO21DQUFpQixDQUNwRCxDQUNILENBQ1I7UUFDTixrQkFBQyxZQUFJLElBQUMsTUFBTSxFQUFFLFlBQUksQ0FBQyxZQUFZLENBQUM7WUFDNUIsMkJBQUssU0FBUyxFQUFDLE9BQU87Z0JBQ2xCLGtCQUFDLGdCQUFPLElBQUMsS0FBSyxFQUFFLFlBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxRQUFRLEVBQUUsWUFBSSxDQUFDLFFBQVEsQ0FBQztvQkFDekQsa0JBQUMsY0FBSSxDQUFDLFVBQVUsSUFBQyxLQUFLLEVBQUMsYUFBYSxFQUFDLE9BQU8sRUFBQyxhQUFhLEdBQUc7b0JBQzdELDhCQUFRLE9BQU8sRUFBRSxZQUFJLENBQUMsWUFBWSxDQUFDLFVBQWM7b0JBQ2pELDJCQUFLLFNBQVMsRUFBQyxLQUFLO3dCQUNoQixrQkFBQyxjQUFNLElBQUMsTUFBTSxFQUFFLFlBQUksQ0FBQyxPQUFPLENBQUM7NEJBQ3pCLDJCQUFLLFNBQVMsRUFBQyxPQUFPO2dDQUFDLDZCQUFPLElBQUksRUFBQyxNQUFNLEVBQUMsU0FBUyxFQUFDLGNBQWMsRUFBQyxJQUFJLEVBQUMsYUFBYSxHQUFHLENBQ2xGOzRCQUNOLDJCQUFLLFNBQVMsRUFBQyxPQUFPO2dDQUFDLDZCQUFPLElBQUksRUFBQyxNQUFNLEVBQUMsU0FBUyxFQUFDLGNBQWMsRUFBQyxJQUFJLEVBQUMsUUFBUSxHQUFHLENBQzdFLENBQ0QsQ0FDUDtvQkFFTiwyQkFBSyxTQUFTLEVBQUMsWUFBWSxFQUFDLEtBQUssRUFBQyxnRUFBZ0U7d0JBQzlGLDhCQUFRLFNBQVMsRUFBQyxpQkFBaUIsRUFBQyxPQUFPLEVBQUUsWUFBSSxDQUFDLFNBQVMsQ0FBQzs0QkFDeEQsNEJBQU0sU0FBUyxFQUFDLFlBQVksR0FBUTtvQ0FBYyxDQUNwRCxDQUNBLENBQ1IsQ0FDSCxDQUNMLEVBQ04sS0FBSyxDQUFDLENBQUM7QUFDZixDQUFDO0FBdENELHdCQXNDQyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5pbXBvcnQgeyBYYW5pYSBhcyB4YW5pYSwgUmVwZWF0LCBXaXRoLCBJZiwgZXhwciwgRG9tLCBSZW1vdGVEYXRhU291cmNlLCBNb2RlbFJlcG9zaXRvcnksIFJlYWN0aXZlIGFzIFJlLCBUZW1wbGF0ZSB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBWaWV3UmVzdWx0IH0gZnJvbSBcIi4uLy4uL3NyYy9tdmNcIlxyXG5pbXBvcnQgeyBTZWN0aW9uIH0gZnJvbSBcIi4uL2xheW91dFwiXHJcbmltcG9ydCBEYXRhR3JpZCwgeyBUZXh0Q29sdW1uIH0gZnJvbSBcIi4uL2dyaWRcIlxyXG5pbXBvcnQgSHRtbCBmcm9tICcuLi8uLi9zcmMvaHRtbCdcclxuXHJcbmNsYXNzIEludm9pY2VSZXBvc2l0b3J5IGV4dGVuZHMgTW9kZWxSZXBvc2l0b3J5IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcihcIi9hcGkvaW52b2ljZS9cIiwgXCJpbnZvaWNlc1wiKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRMaW5lKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFJvdy5saW5lcy5wdXNoKHtcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwibmV3IGxpbmVcIixcclxuICAgICAgICAgICAgYW1vdW50OiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMClcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVOZXcoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgICAgIGxpbmVzOiBbXVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbnZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZShuZXcgSW52b2ljZVJlcG9zaXRvcnkoKSk7XHJcblxyXG52YXIgb25TZWxlY3QgPSByb3cgPT4ge1xyXG4gICAgc3RvcmUuZ2V0KFwiY3VycmVudFJvd1wiKS5zZXQocm93KTtcclxuICAgIHN0b3JlLnJlZnJlc2goKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFjdGlvbigpIHtcclxuICAgIHJldHVybiBuZXcgVmlld1Jlc3VsdChcclxuICAgICAgICA8ZGl2IHN0eWxlPVwiaGVpZ2h0OiA5NSU7XCIgY2xhc3NOYW1lPVwicm93XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbZXhwcihcImN1cnJlbnRSb3cgLT4gJ2NvbC04J1wiKSwgZXhwcihcIm5vdCBjdXJyZW50Um93IC0+ICdjb2wtMTInXCIpXX0+XHJcbiAgICAgICAgICAgICAgICA8U2VjdGlvbiB0aXRsZT1cIkludm9pY2VzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPERhdGFHcmlkIGRhdGE9e2V4cHIoXCJhd2FpdCBkYXRhU291cmNlXCIpfSBvblNlbGVjdGlvbkNoYW5nZWQ9e29uU2VsZWN0fT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHRDb2x1bW4gZmllbGQ9XCJkZXNjcmlwdGlvblwiIGRpc3BsYXk9XCJEZXNjcmlwdGlvblwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwiaW52b2ljZURhdGVcIiBkaXNwbGF5PVwiSW52b2ljZSBEYXRlXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJjdXJyZW50Um93IDwtIGNyZWF0ZU5ldygpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxXaXRoIG9iamVjdD17ZXhwcihcImN1cnJlbnRSb3dcIil9PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPXtleHByKFwiZGVzY3JpcHRpb25cIil9IG9uQ2FuY2VsPXtleHByKFwiY2FuY2VsXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEh0bWwuVGV4dEVkaXRvciBmaWVsZD1cImRlc2NyaXB0aW9uXCIgZGlzcGxheT1cIkRlc2NyaXB0aW9uXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtleHByKFwiYWRkTGluZSAoKVwiKX0+YWRkPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UmVwZWF0IHNvdXJjZT17ZXhwcihcImxpbmVzXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC02XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgbmFtZT1cImRlc2NyaXB0aW9uXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC02XCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgbmFtZT1cImFtb3VudFwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1JlcGVhdD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIiBzdHlsZT1cInBhZGRpbmc6IDEwcHg7IGJhY2tncm91bmQtY29sb3I6ICNFRUU7IGJvcmRlcjogMXB4IHNvbGlkICNEREQ7XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJzYXZlICgpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1zYXZlXCI+PC9zcGFuPiBTYXZlPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L1dpdGg+XHJcbiAgICAgICAgPC9kaXY+LFxyXG4gICAgICAgIHN0b3JlKTtcclxufSJdfQ==