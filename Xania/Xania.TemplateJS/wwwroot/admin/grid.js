"use strict";
var xania_1 = require("../src/xania");
require("./grid.css");
function TextColumn(attrs) {
    if (!attrs.field)
        throw Error("property field is required");
    return {
        field: attrs.field,
        display: attrs.display || attrs.field
    };
}
exports.TextColumn = TextColumn;
var DataGrid = (function () {
    function DataGrid(attrs, columns) {
        if (columns === void 0) { columns = []; }
        var _this = this;
        this.attrs = attrs;
        this.columns = columns;
        this.data = [];
        this.activeRow = null;
        this.activeRecord = null;
        this.onSelectionChanged = null;
        this.onRowClick = function (row) {
            if (_this.activeRow !== row) {
                _this.activeRow = row;
                if (_this.onSelectionChanged) {
                    _this.onSelectionChanged(row, _this);
                }
            }
        };
    }
    DataGrid.prototype.cellValue = function (row, column) {
        return row[column.field];
    };
    DataGrid.prototype.view = function (xania) {
        return (xania.tag("div", { id: "users", "data-modelid": "Id", className: "xn-grid", role: "grid", "data-itemheight": "31" },
            xania.tag("div", { className: "xn-border-box xn-grid-header", style: "z-index: 100" },
                xania.tag("div", { role: "rowheader", className: "xn-grid-row-header xn-grid-header-cell" }, "\u00A0"),
                xania.tag(xania_1.Repeat, { source: xania_1.expr("for column in columns") },
                    xania.tag("div", { "data-idx": "UserName", role: "gridcell", className: "xn-grid-header-cell" },
                        xania.tag("div", { className: "xn-grid-cell-content" },
                            xania.tag("a", { "data-bind": "click: sort.bind($data, 'UserName')" }, xania_1.expr("column.display"))))),
                xania.tag("div", { className: "xn-grid-header-cell", style: "width: 100%; min-width: 100px" }, "\u00A0")),
            xania.tag("div", { className: "xn-list-scrollable", style: "overflow: auto; height: 100%;", role: "listbox" },
                xania.tag("div", { className: "xn-content", style: "padding-top: 0px; " },
                    xania.tag("table", { style: "width: 100%;" },
                        xania.tag("tbody", { "data-bind": "foreach: view" },
                            xania.tag(xania_1.Repeat, { source: xania_1.expr("for row in data") },
                                xania.tag("tr", { role: "listitem", className: ["xn-list-item", xania_1.expr("row = activeRow -> ' xn-grid-row-activated'"),
                                        xania_1.expr("row.alternate -> ' xn-grid-row-alternate'"), xania_1.expr("row.updated -> ' xn-grid-row-updated'")] },
                                    xania.tag("td", null,
                                        xania.tag("div", { className: "xn-grid-row-header", onClick: xania_1.expr("onRowClick row") },
                                            xania.tag("span", { className: ["fa", xania_1.expr("row = activeRow -> ' fa-edit'")] }),
                                            xania.tag("input", { type: "radio", style: xania_1.expr("row = activeRow -> '; display: none'") }))),
                                    xania.tag(xania_1.Repeat, { source: xania_1.expr("for column in columns") },
                                        xania.tag("td", { role: "gridcell", tabindex: "-1", className: "xn-grid-cell" },
                                            xania.tag("div", { className: "xn-grid-cell-content" },
                                                xania.tag("a", null, xania_1.expr("cellValue row column"))))),
                                    xania.tag("td", { role: "gridcell", tabindex: "-1", className: "xn-grid-cell", style: "width: 100%;" })))))))));
    };
    return DataGrid;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DataGrid;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdyaWQudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxzQ0FBMkM7QUFDM0Msc0JBQW1CO0FBR25CLG9CQUEyQixLQUFLO0lBQzVCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUNiLE1BQU0sS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFFOUMsTUFBTSxDQUFDO1FBQ0gsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO1FBQ2xCLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxLQUFLO0tBQ3hDLENBQUM7QUFDTixDQUFDO0FBUkQsZ0NBUUM7QUFFRDtJQU1JLGtCQUFvQixLQUFLLEVBQVUsT0FBWTtRQUFaLHdCQUFBLEVBQUEsWUFBWTtRQUEvQyxpQkFDQztRQURtQixVQUFLLEdBQUwsS0FBSyxDQUFBO1FBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBSztRQUx2QyxTQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ1YsY0FBUyxHQUFHLElBQUksQ0FBQztRQUNqQixpQkFBWSxHQUFHLElBQUksQ0FBQztRQUNwQix1QkFBa0IsR0FBRyxJQUFJLENBQUM7UUFLbEMsZUFBVSxHQUFHLFVBQUMsR0FBRztZQUNiLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxTQUFTLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDekIsS0FBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7Z0JBRXJCLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7b0JBQzFCLEtBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsS0FBSSxDQUFDLENBQUM7Z0JBQ3ZDLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQyxDQUFDO0lBVkYsQ0FBQztJQVlELDRCQUFTLEdBQVQsVUFBVSxHQUFHLEVBQUUsTUFBTTtRQUNqQixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRUQsdUJBQUksR0FBSixVQUFLLEtBQUs7UUFDTixNQUFNLENBQUMsQ0FDSCxtQkFBSyxFQUFFLEVBQUMsT0FBTyxrQkFBYyxJQUFJLEVBQUMsU0FBUyxFQUFDLFNBQVMsRUFBQyxJQUFJLEVBQUMsTUFBTSxxQkFBaUIsSUFBSTtZQUNsRixtQkFBSyxTQUFTLEVBQUMsOEJBQThCLEVBQUMsS0FBSyxFQUFDLGNBQWM7Z0JBQzlELG1CQUFLLElBQUksRUFBQyxXQUFXLEVBQUMsU0FBUyxFQUFDLHdDQUF3QyxhQUFhO2dCQUNyRixVQUFDLGNBQU0sSUFBQyxNQUFNLEVBQUUsWUFBSSxDQUFDLHVCQUF1QixDQUFDO29CQUN6QywrQkFBYyxVQUFVLEVBQUMsSUFBSSxFQUFDLFVBQVUsRUFBQyxTQUFTLEVBQUMscUJBQXFCO3dCQUNwRSxtQkFBSyxTQUFTLEVBQUMsc0JBQXNCOzRCQUFDLDhCQUFhLHFDQUFxQyxJQUFFLFlBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFLLENBQU0sQ0FDekgsQ0FDRDtnQkFDVCxtQkFBSyxTQUFTLEVBQUMscUJBQXFCLEVBQUMsS0FBSyxFQUFDLCtCQUErQixhQUFhLENBQ3JGO1lBRU4sbUJBQUssU0FBUyxFQUFDLG9CQUFvQixFQUFDLEtBQUssRUFBQywrQkFBK0IsRUFBQyxJQUFJLEVBQUMsU0FBUztnQkFDcEYsbUJBQUssU0FBUyxFQUFDLFlBQVksRUFBQyxLQUFLLEVBQUMsb0JBQW9CO29CQUNsRCxxQkFBTyxLQUFLLEVBQUMsY0FBYzt3QkFDdkIsa0NBQWlCLGVBQWU7NEJBQzVCLFVBQUMsY0FBTSxJQUFDLE1BQU0sRUFBRSxZQUFJLENBQUMsaUJBQWlCLENBQUM7Z0NBQ25DLGtCQUFJLElBQUksRUFBQyxVQUFVLEVBQ2YsU0FBUyxFQUFFLENBQUMsY0FBYyxFQUFFLFlBQUksQ0FBQyw2Q0FBNkMsQ0FBQzt3Q0FDM0UsWUFBSSxDQUFDLDJDQUEyQyxDQUFDLEVBQUUsWUFBSSxDQUFDLHVDQUF1QyxDQUFDLENBQUM7b0NBQ3JHO3dDQUNJLG1CQUFLLFNBQVMsRUFBQyxvQkFBb0IsRUFBQyxPQUFPLEVBQUUsWUFBSSxDQUFDLGdCQUFnQixDQUFDOzRDQUMvRCxvQkFBTSxTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsWUFBSSxDQUFDLCtCQUErQixDQUFDLENBQUMsR0FBUzs0Q0FDdkUscUJBQU8sSUFBSSxFQUFDLE9BQU8sRUFBQyxLQUFLLEVBQUUsWUFBSSxDQUFDLHNDQUFzQyxDQUFDLEdBQUksQ0FDekUsQ0FDTDtvQ0FDTCxVQUFDLGNBQU0sSUFBQyxNQUFNLEVBQUUsWUFBSSxDQUFDLHVCQUF1QixDQUFDO3dDQUN6QyxrQkFBSSxJQUFJLEVBQUMsVUFBVSxFQUFDLFFBQVEsRUFBQyxJQUFJLEVBQUMsU0FBUyxFQUFDLGNBQWM7NENBQ3RELG1CQUFLLFNBQVMsRUFBQyxzQkFBc0I7Z0RBQUMscUJBQUksWUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUssQ0FBTSxDQUNoRixDQUNBO29DQUNULGtCQUFJLElBQUksRUFBQyxVQUFVLEVBQUMsUUFBUSxFQUFDLElBQUksRUFBQyxTQUFTLEVBQUMsY0FBYyxFQUFDLEtBQUssRUFBQyxjQUFjLEdBQU0sQ0FDcEYsQ0FDQSxDQUNMLENBQ0osQ0FDTixDQUNKLENBQ0osQ0FDVCxDQUFDO0lBQ04sQ0FBQztJQUNMLGVBQUM7QUFBRCxDQUFDLEFBakVELElBaUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVwZWF0LCBleHByIH0gZnJvbSBcIi4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCAnLi9ncmlkLmNzcydcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gVGV4dENvbHVtbihhdHRycykge1xyXG4gICAgaWYgKCFhdHRycy5maWVsZClcclxuICAgICAgICB0aHJvdyBFcnJvcihcInByb3BlcnR5IGZpZWxkIGlzIHJlcXVpcmVkXCIpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZmllbGQ6IGF0dHJzLmZpZWxkLFxyXG4gICAgICAgIGRpc3BsYXk6IGF0dHJzLmRpc3BsYXkgfHwgYXR0cnMuZmllbGRcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERhdGFHcmlkIHtcclxuICAgIHByaXZhdGUgZGF0YSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBhY3RpdmVSb3cgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSBhY3RpdmVSZWNvcmQgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSBvblNlbGVjdGlvbkNoYW5nZWQgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXR0cnMsIHByaXZhdGUgY29sdW1ucyA9IFtdKSB7XHJcbiAgICB9XHJcblxyXG4gICAgb25Sb3dDbGljayA9IChyb3cpID0+IHtcclxuICAgICAgICBpZiAodGhpcy5hY3RpdmVSb3cgIT09IHJvdykge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVJvdyA9IHJvdztcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9uU2VsZWN0aW9uQ2hhbmdlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblNlbGVjdGlvbkNoYW5nZWQocm93LCB0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgY2VsbFZhbHVlKHJvdywgY29sdW1uKSB7XHJcbiAgICAgICAgcmV0dXJuIHJvd1tjb2x1bW4uZmllbGRdO1xyXG4gICAgfVxyXG5cclxuICAgIHZpZXcoeGFuaWEpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2IGlkPVwidXNlcnNcIiBkYXRhLW1vZGVsaWQ9XCJJZFwiIGNsYXNzTmFtZT1cInhuLWdyaWRcIiByb2xlPVwiZ3JpZFwiIGRhdGEtaXRlbWhlaWdodD1cIjMxXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWJvcmRlci1ib3ggeG4tZ3JpZC1oZWFkZXJcIiBzdHlsZT1cInotaW5kZXg6IDEwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgcm9sZT1cInJvd2hlYWRlclwiIGNsYXNzTmFtZT1cInhuLWdyaWQtcm93LWhlYWRlciB4bi1ncmlkLWhlYWRlci1jZWxsXCI+Jm5ic3A7PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPFJlcGVhdCBzb3VyY2U9e2V4cHIoXCJmb3IgY29sdW1uIGluIGNvbHVtbnNcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGRhdGEtaWR4PVwiVXNlck5hbWVcIiByb2xlPVwiZ3JpZGNlbGxcIiBjbGFzc05hbWU9XCJ4bi1ncmlkLWhlYWRlci1jZWxsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWdyaWQtY2VsbC1jb250ZW50XCI+PGEgZGF0YS1iaW5kPVwiY2xpY2s6IHNvcnQuYmluZCgkZGF0YSwgJ1VzZXJOYW1lJylcIj57ZXhwcihcImNvbHVtbi5kaXNwbGF5XCIpfTwvYT48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9SZXBlYXQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ4bi1ncmlkLWhlYWRlci1jZWxsXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgbWluLXdpZHRoOiAxMDBweFwiPiZuYnNwOzwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ4bi1saXN0LXNjcm9sbGFibGVcIiBzdHlsZT1cIm92ZXJmbG93OiBhdXRvOyBoZWlnaHQ6IDEwMCU7XCIgcm9sZT1cImxpc3Rib3hcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWNvbnRlbnRcIiBzdHlsZT1cInBhZGRpbmctdG9wOiAwcHg7IFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgc3R5bGU9XCJ3aWR0aDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keSBkYXRhLWJpbmQ9XCJmb3JlYWNoOiB2aWV3XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFJlcGVhdCBzb3VyY2U9e2V4cHIoXCJmb3Igcm93IGluIGRhdGFcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgcm9sZT1cImxpc3RpdGVtXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17W1wieG4tbGlzdC1pdGVtXCIsIGV4cHIoXCJyb3cgPSBhY3RpdmVSb3cgLT4gJyB4bi1ncmlkLXJvdy1hY3RpdmF0ZWQnXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cHIoXCJyb3cuYWx0ZXJuYXRlIC0+ICcgeG4tZ3JpZC1yb3ctYWx0ZXJuYXRlJ1wiKSwgZXhwcihcInJvdy51cGRhdGVkIC0+ICcgeG4tZ3JpZC1yb3ctdXBkYXRlZCdcIildfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWdyaWQtcm93LWhlYWRlclwiIG9uQ2xpY2s9e2V4cHIoXCJvblJvd0NsaWNrIHJvd1wiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17W1wiZmFcIiwgZXhwcihcInJvdyA9IGFjdGl2ZVJvdyAtPiAnIGZhLWVkaXQnXCIpXX0+PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgc3R5bGU9e2V4cHIoXCJyb3cgPSBhY3RpdmVSb3cgLT4gJzsgZGlzcGxheTogbm9uZSdcIil9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFJlcGVhdCBzb3VyY2U9e2V4cHIoXCJmb3IgY29sdW1uIGluIGNvbHVtbnNcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCByb2xlPVwiZ3JpZGNlbGxcIiB0YWJpbmRleD1cIi0xXCIgY2xhc3NOYW1lPVwieG4tZ3JpZC1jZWxsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwieG4tZ3JpZC1jZWxsLWNvbnRlbnRcIj48YT57ZXhwcihcImNlbGxWYWx1ZSByb3cgY29sdW1uXCIpfTwvYT48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9SZXBlYXQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgcm9sZT1cImdyaWRjZWxsXCIgdGFiaW5kZXg9XCItMVwiIGNsYXNzTmFtZT1cInhuLWdyaWQtY2VsbFwiIHN0eWxlPVwid2lkdGg6IDEwMCU7XCI+PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1JlcGVhdD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG4iXX0=