"use strict";
var xania_1 = require("../src/xania");
require("./grid.css");
function TextColumn(attrs) {
    if (!attrs.field && !attrs.template)
        throw Error("property field is required");
    var template = attrs.template;
    if (typeof attrs.field === "string")
        template = xania_1.expr("row." + attrs.field);
    return {
        field: attrs.field,
        template: template,
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
    DataGrid.prototype.view = function (xania) {
        return (xania.tag("div", { id: "users", "data-modelid": "Id", className: "xn-grid", role: "grid", "data-itemheight": "31" },
            xania.tag("div", { className: "xn-border-box xn-grid-header", style: "z-index: 100" },
                xania.tag("div", { role: "rowheader", className: "xn-grid-row-header xn-grid-header-cell" }, "\u00A0"),
                xania.tag(xania_1.Repeat, { source: xania_1.expr("for column in columns") },
                    xania.tag("div", { "data-idx": "UserName", role: "gridcell", className: "xn-grid-header-cell" },
                        xania.tag("div", { className: "xn-grid-cell-content" },
                            xania.tag("a", { href: true }, xania_1.expr("column.display"))))),
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
                                    this.columns.map(function (column) { return (xania.tag("td", { role: "gridcell", tabindex: "-1", className: "xn-grid-cell" },
                                        xania.tag("div", { className: "xn-grid-cell-content" },
                                            xania.tag("a", null, column.template)))); }),
                                    xania.tag("td", { role: "gridcell", tabindex: "-1", className: "xn-grid-cell", style: "width: 100%;" })))))))));
    };
    return DataGrid;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DataGrid;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdyaWQudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxzQ0FBMkM7QUFDM0Msc0JBQW1CO0FBR25CLG9CQUEyQixLQUFLO0lBQzVCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDaEMsTUFBTSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztJQUU5QyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO0lBQzlCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLEtBQUssS0FBSyxRQUFRLENBQUM7UUFDaEMsUUFBUSxHQUFHLFlBQUksQ0FBQyxNQUFNLEdBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXhDLE1BQU0sQ0FBQztRQUNILEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSztRQUNsQixRQUFRLFVBQUE7UUFDUixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsS0FBSztLQUN4QyxDQUFDO0FBQ04sQ0FBQztBQWJELGdDQWFDO0FBRUQ7SUFNSSxrQkFBb0IsS0FBSyxFQUFVLE9BQVk7UUFBWix3QkFBQSxFQUFBLFlBQVk7UUFBL0MsaUJBQ0M7UUFEbUIsVUFBSyxHQUFMLEtBQUssQ0FBQTtRQUFVLFlBQU8sR0FBUCxPQUFPLENBQUs7UUFMdkMsU0FBSSxHQUFHLEVBQUUsQ0FBQztRQUNWLGNBQVMsR0FBRyxJQUFJLENBQUM7UUFDakIsaUJBQVksR0FBRyxJQUFJLENBQUM7UUFDcEIsdUJBQWtCLEdBQUcsSUFBSSxDQUFDO1FBS2xDLGVBQVUsR0FBRyxVQUFDLEdBQUc7WUFDYixFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsU0FBUyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLEtBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDO2dCQUVyQixFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO29CQUMxQixLQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLEtBQUksQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUMsQ0FBQztJQVZGLENBQUM7SUFZRCx1QkFBSSxHQUFKLFVBQUssS0FBSztRQUNOLE1BQU0sQ0FBQyxDQUNILG1CQUFLLEVBQUUsRUFBQyxPQUFPLGtCQUFjLElBQUksRUFBQyxTQUFTLEVBQUMsU0FBUyxFQUFDLElBQUksRUFBQyxNQUFNLHFCQUFpQixJQUFJO1lBQ2xGLG1CQUFLLFNBQVMsRUFBQyw4QkFBOEIsRUFBQyxLQUFLLEVBQUMsY0FBYztnQkFDOUQsbUJBQUssSUFBSSxFQUFDLFdBQVcsRUFBQyxTQUFTLEVBQUMsd0NBQXdDLGFBQWE7Z0JBQ3JGLFVBQUMsY0FBTSxJQUFDLE1BQU0sRUFBRSxZQUFJLENBQUMsdUJBQXVCLENBQUM7b0JBQ3pDLCtCQUFjLFVBQVUsRUFBQyxJQUFJLEVBQUMsVUFBVSxFQUFDLFNBQVMsRUFBQyxxQkFBcUI7d0JBQ3BFLG1CQUFLLFNBQVMsRUFBQyxzQkFBc0I7NEJBQUMsaUJBQUcsSUFBSSxVQUFFLFlBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFLLENBQU0sQ0FDOUUsQ0FDRDtnQkFDVCxtQkFBSyxTQUFTLEVBQUMscUJBQXFCLEVBQUMsS0FBSyxFQUFDLCtCQUErQixhQUFhLENBQ3JGO1lBRU4sbUJBQUssU0FBUyxFQUFDLG9CQUFvQixFQUFDLEtBQUssRUFBQywrQkFBK0IsRUFBQyxJQUFJLEVBQUMsU0FBUztnQkFDcEYsbUJBQUssU0FBUyxFQUFDLFlBQVksRUFBQyxLQUFLLEVBQUMsb0JBQW9CO29CQUNsRCxxQkFBTyxLQUFLLEVBQUMsY0FBYzt3QkFDdkIsa0NBQWlCLGVBQWU7NEJBQzVCLFVBQUMsY0FBTSxJQUFDLE1BQU0sRUFBRSxZQUFJLENBQUMsaUJBQWlCLENBQUM7Z0NBQ25DLGtCQUFJLElBQUksRUFBQyxVQUFVLEVBQ2YsU0FBUyxFQUFFLENBQUMsY0FBYyxFQUFFLFlBQUksQ0FBQyw2Q0FBNkMsQ0FBQzt3Q0FDM0UsWUFBSSxDQUFDLDJDQUEyQyxDQUFDLEVBQUUsWUFBSSxDQUFDLHVDQUF1QyxDQUFDLENBQUM7b0NBQ3JHO3dDQUNJLG1CQUFLLFNBQVMsRUFBQyxvQkFBb0IsRUFBQyxPQUFPLEVBQUUsWUFBSSxDQUFDLGdCQUFnQixDQUFDOzRDQUMvRCxvQkFBTSxTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsWUFBSSxDQUFDLCtCQUErQixDQUFDLENBQUMsR0FBUzs0Q0FDdkUscUJBQU8sSUFBSSxFQUFDLE9BQU8sRUFBQyxLQUFLLEVBQUUsWUFBSSxDQUFDLHNDQUFzQyxDQUFDLEdBQUksQ0FDekUsQ0FDTDtvQ0FDSixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFDLE1BQVcsSUFBSyxPQUFBLENBQy9CLGtCQUFJLElBQUksRUFBQyxVQUFVLEVBQUMsUUFBUSxFQUFDLElBQUksRUFBQyxTQUFTLEVBQUMsY0FBYzt3Q0FDdEQsbUJBQUssU0FBUyxFQUFDLHNCQUFzQjs0Q0FBQyxxQkFBSSxNQUFNLENBQUMsUUFBUSxDQUFLLENBQU0sQ0FDbkUsQ0FBQyxFQUh5QixDQUd6QixDQUNUO29DQUNELGtCQUFJLElBQUksRUFBQyxVQUFVLEVBQUMsUUFBUSxFQUFDLElBQUksRUFBQyxTQUFTLEVBQUMsY0FBYyxFQUFDLEtBQUssRUFBQyxjQUFjLEdBQU0sQ0FDcEYsQ0FDQSxDQUNMLENBQ0osQ0FDTixDQUNKLENBQ0osQ0FDVCxDQUFDO0lBQ04sQ0FBQztJQUNMLGVBQUM7QUFBRCxDQUFDLEFBN0RELElBNkRDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVwZWF0LCBleHByIH0gZnJvbSBcIi4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCAnLi9ncmlkLmNzcydcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gVGV4dENvbHVtbihhdHRycykge1xyXG4gICAgaWYgKCFhdHRycy5maWVsZCAmJiAhYXR0cnMudGVtcGxhdGUpXHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJwcm9wZXJ0eSBmaWVsZCBpcyByZXF1aXJlZFwiKTtcclxuXHJcbiAgICB2YXIgdGVtcGxhdGUgPSBhdHRycy50ZW1wbGF0ZTtcclxuICAgIGlmICh0eXBlb2YgYXR0cnMuZmllbGQgPT09IFwic3RyaW5nXCIpXHJcbiAgICAgICAgdGVtcGxhdGUgPSBleHByKFwicm93LlwiK2F0dHJzLmZpZWxkKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGZpZWxkOiBhdHRycy5maWVsZCxcclxuICAgICAgICB0ZW1wbGF0ZSxcclxuICAgICAgICBkaXNwbGF5OiBhdHRycy5kaXNwbGF5IHx8IGF0dHJzLmZpZWxkXHJcbiAgICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEYXRhR3JpZCB7XHJcbiAgICBwcml2YXRlIGRhdGEgPSBbXTtcclxuICAgIHByaXZhdGUgYWN0aXZlUm93ID0gbnVsbDtcclxuICAgIHByaXZhdGUgYWN0aXZlUmVjb3JkID0gbnVsbDtcclxuICAgIHByaXZhdGUgb25TZWxlY3Rpb25DaGFuZ2VkID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGF0dHJzLCBwcml2YXRlIGNvbHVtbnMgPSBbXSkge1xyXG4gICAgfVxyXG5cclxuICAgIG9uUm93Q2xpY2sgPSAocm93KSA9PiB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlUm93ICE9PSByb3cpIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVSb3cgPSByb3c7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5vblNlbGVjdGlvbkNoYW5nZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub25TZWxlY3Rpb25DaGFuZ2VkKHJvdywgdGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHZpZXcoeGFuaWEpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2IGlkPVwidXNlcnNcIiBkYXRhLW1vZGVsaWQ9XCJJZFwiIGNsYXNzTmFtZT1cInhuLWdyaWRcIiByb2xlPVwiZ3JpZFwiIGRhdGEtaXRlbWhlaWdodD1cIjMxXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWJvcmRlci1ib3ggeG4tZ3JpZC1oZWFkZXJcIiBzdHlsZT1cInotaW5kZXg6IDEwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgcm9sZT1cInJvd2hlYWRlclwiIGNsYXNzTmFtZT1cInhuLWdyaWQtcm93LWhlYWRlciB4bi1ncmlkLWhlYWRlci1jZWxsXCI+Jm5ic3A7PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPFJlcGVhdCBzb3VyY2U9e2V4cHIoXCJmb3IgY29sdW1uIGluIGNvbHVtbnNcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGRhdGEtaWR4PVwiVXNlck5hbWVcIiByb2xlPVwiZ3JpZGNlbGxcIiBjbGFzc05hbWU9XCJ4bi1ncmlkLWhlYWRlci1jZWxsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWdyaWQtY2VsbC1jb250ZW50XCI+PGEgaHJlZj57ZXhwcihcImNvbHVtbi5kaXNwbGF5XCIpfTwvYT48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9SZXBlYXQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ4bi1ncmlkLWhlYWRlci1jZWxsXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTsgbWluLXdpZHRoOiAxMDBweFwiPiZuYnNwOzwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ4bi1saXN0LXNjcm9sbGFibGVcIiBzdHlsZT1cIm92ZXJmbG93OiBhdXRvOyBoZWlnaHQ6IDEwMCU7XCIgcm9sZT1cImxpc3Rib3hcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWNvbnRlbnRcIiBzdHlsZT1cInBhZGRpbmctdG9wOiAwcHg7IFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgc3R5bGU9XCJ3aWR0aDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keSBkYXRhLWJpbmQ9XCJmb3JlYWNoOiB2aWV3XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFJlcGVhdCBzb3VyY2U9e2V4cHIoXCJmb3Igcm93IGluIGRhdGFcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgcm9sZT1cImxpc3RpdGVtXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17W1wieG4tbGlzdC1pdGVtXCIsIGV4cHIoXCJyb3cgPSBhY3RpdmVSb3cgLT4gJyB4bi1ncmlkLXJvdy1hY3RpdmF0ZWQnXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cHIoXCJyb3cuYWx0ZXJuYXRlIC0+ICcgeG4tZ3JpZC1yb3ctYWx0ZXJuYXRlJ1wiKSwgZXhwcihcInJvdy51cGRhdGVkIC0+ICcgeG4tZ3JpZC1yb3ctdXBkYXRlZCdcIildfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWdyaWQtcm93LWhlYWRlclwiIG9uQ2xpY2s9e2V4cHIoXCJvblJvd0NsaWNrIHJvd1wiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17W1wiZmFcIiwgZXhwcihcInJvdyA9IGFjdGl2ZVJvdyAtPiAnIGZhLWVkaXQnXCIpXX0+PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgc3R5bGU9e2V4cHIoXCJyb3cgPSBhY3RpdmVSb3cgLT4gJzsgZGlzcGxheTogbm9uZSdcIil9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3RoaXMuY29sdW1ucy5tYXAoKGNvbHVtbjogYW55KSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIHJvbGU9XCJncmlkY2VsbFwiIHRhYmluZGV4PVwiLTFcIiBjbGFzc05hbWU9XCJ4bi1ncmlkLWNlbGxcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ4bi1ncmlkLWNlbGwtY29udGVudFwiPjxhPntjb2x1bW4udGVtcGxhdGV9PC9hPjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCByb2xlPVwiZ3JpZGNlbGxcIiB0YWJpbmRleD1cIi0xXCIgY2xhc3NOYW1lPVwieG4tZ3JpZC1jZWxsXCIgc3R5bGU9XCJ3aWR0aDogMTAwJTtcIj48L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvUmVwZWF0PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==