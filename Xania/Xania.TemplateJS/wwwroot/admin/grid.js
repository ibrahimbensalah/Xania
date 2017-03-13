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
                                    this.columns.map(function (column) { return (xania.tag("td", { role: "gridcell", tabindex: "-1", className: "xn-grid-cell" },
                                        xania.tag("div", { className: "xn-grid-cell-content" },
                                            xania.tag("a", null, column.template)))); }),
                                    xania.tag("td", { role: "gridcell", tabindex: "-1", className: "xn-grid-cell", style: "width: 100%;" })))))))));
    };
    return DataGrid;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DataGrid;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdyaWQudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxzQ0FBMkM7QUFDM0Msc0JBQW1CO0FBR25CLG9CQUEyQixLQUFLO0lBQzVCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDaEMsTUFBTSxLQUFLLENBQUMsNEJBQTRCLENBQUMsQ0FBQztJQUU5QyxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO0lBQzlCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLEtBQUssS0FBSyxRQUFRLENBQUM7UUFDaEMsUUFBUSxHQUFHLFlBQUksQ0FBQyxNQUFNLEdBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXhDLE1BQU0sQ0FBQztRQUNILEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSztRQUNsQixRQUFRLFVBQUE7UUFDUixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsS0FBSztLQUN4QyxDQUFDO0FBQ04sQ0FBQztBQWJELGdDQWFDO0FBRUQ7SUFNSSxrQkFBb0IsS0FBSyxFQUFVLE9BQVk7UUFBWix3QkFBQSxFQUFBLFlBQVk7UUFBL0MsaUJBQ0M7UUFEbUIsVUFBSyxHQUFMLEtBQUssQ0FBQTtRQUFVLFlBQU8sR0FBUCxPQUFPLENBQUs7UUFMdkMsU0FBSSxHQUFHLEVBQUUsQ0FBQztRQUNWLGNBQVMsR0FBRyxJQUFJLENBQUM7UUFDakIsaUJBQVksR0FBRyxJQUFJLENBQUM7UUFDcEIsdUJBQWtCLEdBQUcsSUFBSSxDQUFDO1FBS2xDLGVBQVUsR0FBRyxVQUFDLEdBQUc7WUFDYixFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsU0FBUyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLEtBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDO2dCQUVyQixFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO29CQUMxQixLQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLEtBQUksQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUMsQ0FBQztJQVZGLENBQUM7SUFZRCx1QkFBSSxHQUFKLFVBQUssS0FBSztRQUNOLE1BQU0sQ0FBQyxDQUNILG1CQUFLLEVBQUUsRUFBQyxPQUFPLGtCQUFjLElBQUksRUFBQyxTQUFTLEVBQUMsU0FBUyxFQUFDLElBQUksRUFBQyxNQUFNLHFCQUFpQixJQUFJO1lBQ2xGLG1CQUFLLFNBQVMsRUFBQyw4QkFBOEIsRUFBQyxLQUFLLEVBQUMsY0FBYztnQkFDOUQsbUJBQUssSUFBSSxFQUFDLFdBQVcsRUFBQyxTQUFTLEVBQUMsd0NBQXdDLGFBQWE7Z0JBQ3JGLFVBQUMsY0FBTSxJQUFDLE1BQU0sRUFBRSxZQUFJLENBQUMsdUJBQXVCLENBQUM7b0JBQ3pDLCtCQUFjLFVBQVUsRUFBQyxJQUFJLEVBQUMsVUFBVSxFQUFDLFNBQVMsRUFBQyxxQkFBcUI7d0JBQ3BFLG1CQUFLLFNBQVMsRUFBQyxzQkFBc0I7NEJBQUMsOEJBQWEscUNBQXFDLElBQUUsWUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUssQ0FBTSxDQUN6SCxDQUNEO2dCQUNULG1CQUFLLFNBQVMsRUFBQyxxQkFBcUIsRUFBQyxLQUFLLEVBQUMsK0JBQStCLGFBQWEsQ0FDckY7WUFFTixtQkFBSyxTQUFTLEVBQUMsb0JBQW9CLEVBQUMsS0FBSyxFQUFDLCtCQUErQixFQUFDLElBQUksRUFBQyxTQUFTO2dCQUNwRixtQkFBSyxTQUFTLEVBQUMsWUFBWSxFQUFDLEtBQUssRUFBQyxvQkFBb0I7b0JBQ2xELHFCQUFPLEtBQUssRUFBQyxjQUFjO3dCQUN2QixrQ0FBaUIsZUFBZTs0QkFDNUIsVUFBQyxjQUFNLElBQUMsTUFBTSxFQUFFLFlBQUksQ0FBQyxpQkFBaUIsQ0FBQztnQ0FDbkMsa0JBQUksSUFBSSxFQUFDLFVBQVUsRUFDZixTQUFTLEVBQUUsQ0FBQyxjQUFjLEVBQUUsWUFBSSxDQUFDLDZDQUE2QyxDQUFDO3dDQUMzRSxZQUFJLENBQUMsMkNBQTJDLENBQUMsRUFBRSxZQUFJLENBQUMsdUNBQXVDLENBQUMsQ0FBQztvQ0FDckc7d0NBQ0ksbUJBQUssU0FBUyxFQUFDLG9CQUFvQixFQUFDLE9BQU8sRUFBRSxZQUFJLENBQUMsZ0JBQWdCLENBQUM7NENBQy9ELG9CQUFNLFNBQVMsRUFBRSxDQUFDLElBQUksRUFBRSxZQUFJLENBQUMsK0JBQStCLENBQUMsQ0FBQyxHQUFTOzRDQUN2RSxxQkFBTyxJQUFJLEVBQUMsT0FBTyxFQUFDLEtBQUssRUFBRSxZQUFJLENBQUMsc0NBQXNDLENBQUMsR0FBSSxDQUN6RSxDQUNMO29DQUNKLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUMsTUFBVyxJQUFLLE9BQUEsQ0FDL0Isa0JBQUksSUFBSSxFQUFDLFVBQVUsRUFBQyxRQUFRLEVBQUMsSUFBSSxFQUFDLFNBQVMsRUFBQyxjQUFjO3dDQUN0RCxtQkFBSyxTQUFTLEVBQUMsc0JBQXNCOzRDQUFDLHFCQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUssQ0FBTSxDQUNuRSxDQUFDLEVBSHlCLENBR3pCLENBQ1Q7b0NBQ0Qsa0JBQUksSUFBSSxFQUFDLFVBQVUsRUFBQyxRQUFRLEVBQUMsSUFBSSxFQUFDLFNBQVMsRUFBQyxjQUFjLEVBQUMsS0FBSyxFQUFDLGNBQWMsR0FBTSxDQUNwRixDQUNBLENBQ0wsQ0FDSixDQUNOLENBQ0osQ0FDSixDQUNULENBQUM7SUFDTixDQUFDO0lBQ0wsZUFBQztBQUFELENBQUMsQUE3REQsSUE2REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZXBlYXQsIGV4cHIgfSBmcm9tIFwiLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0ICcuL2dyaWQuY3NzJ1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBUZXh0Q29sdW1uKGF0dHJzKSB7XHJcbiAgICBpZiAoIWF0dHJzLmZpZWxkICYmICFhdHRycy50ZW1wbGF0ZSlcclxuICAgICAgICB0aHJvdyBFcnJvcihcInByb3BlcnR5IGZpZWxkIGlzIHJlcXVpcmVkXCIpO1xyXG5cclxuICAgIHZhciB0ZW1wbGF0ZSA9IGF0dHJzLnRlbXBsYXRlO1xyXG4gICAgaWYgKHR5cGVvZiBhdHRycy5maWVsZCA9PT0gXCJzdHJpbmdcIilcclxuICAgICAgICB0ZW1wbGF0ZSA9IGV4cHIoXCJyb3cuXCIrYXR0cnMuZmllbGQpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZmllbGQ6IGF0dHJzLmZpZWxkLFxyXG4gICAgICAgIHRlbXBsYXRlLFxyXG4gICAgICAgIGRpc3BsYXk6IGF0dHJzLmRpc3BsYXkgfHwgYXR0cnMuZmllbGRcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERhdGFHcmlkIHtcclxuICAgIHByaXZhdGUgZGF0YSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBhY3RpdmVSb3cgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSBhY3RpdmVSZWNvcmQgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSBvblNlbGVjdGlvbkNoYW5nZWQgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXR0cnMsIHByaXZhdGUgY29sdW1ucyA9IFtdKSB7XHJcbiAgICB9XHJcblxyXG4gICAgb25Sb3dDbGljayA9IChyb3cpID0+IHtcclxuICAgICAgICBpZiAodGhpcy5hY3RpdmVSb3cgIT09IHJvdykge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVJvdyA9IHJvdztcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9uU2VsZWN0aW9uQ2hhbmdlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblNlbGVjdGlvbkNoYW5nZWQocm93LCB0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdmlldyh4YW5pYSkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJ1c2Vyc1wiIGRhdGEtbW9kZWxpZD1cIklkXCIgY2xhc3NOYW1lPVwieG4tZ3JpZFwiIHJvbGU9XCJncmlkXCIgZGF0YS1pdGVtaGVpZ2h0PVwiMzFcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwieG4tYm9yZGVyLWJveCB4bi1ncmlkLWhlYWRlclwiIHN0eWxlPVwiei1pbmRleDogMTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiByb2xlPVwicm93aGVhZGVyXCIgY2xhc3NOYW1lPVwieG4tZ3JpZC1yb3ctaGVhZGVyIHhuLWdyaWQtaGVhZGVyLWNlbGxcIj4mbmJzcDs8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8UmVwZWF0IHNvdXJjZT17ZXhwcihcImZvciBjb2x1bW4gaW4gY29sdW1uc1wiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgZGF0YS1pZHg9XCJVc2VyTmFtZVwiIHJvbGU9XCJncmlkY2VsbFwiIGNsYXNzTmFtZT1cInhuLWdyaWQtaGVhZGVyLWNlbGxcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwieG4tZ3JpZC1jZWxsLWNvbnRlbnRcIj48YSBkYXRhLWJpbmQ9XCJjbGljazogc29ydC5iaW5kKCRkYXRhLCAnVXNlck5hbWUnKVwiPntleHByKFwiY29sdW1uLmRpc3BsYXlcIil9PC9hPjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L1JlcGVhdD5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWdyaWQtaGVhZGVyLWNlbGxcIiBzdHlsZT1cIndpZHRoOiAxMDAlOyBtaW4td2lkdGg6IDEwMHB4XCI+Jm5ic3A7PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWxpc3Qtc2Nyb2xsYWJsZVwiIHN0eWxlPVwib3ZlcmZsb3c6IGF1dG87IGhlaWdodDogMTAwJTtcIiByb2xlPVwibGlzdGJveFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwieG4tY29udGVudFwiIHN0eWxlPVwicGFkZGluZy10b3A6IDBweDsgXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZSBzdHlsZT1cIndpZHRoOiAxMDAlO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5IGRhdGEtYmluZD1cImZvcmVhY2g6IHZpZXdcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UmVwZWF0IHNvdXJjZT17ZXhwcihcImZvciByb3cgaW4gZGF0YVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciByb2xlPVwibGlzdGl0ZW1cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtbXCJ4bi1saXN0LWl0ZW1cIiwgZXhwcihcInJvdyA9IGFjdGl2ZVJvdyAtPiAnIHhuLWdyaWQtcm93LWFjdGl2YXRlZCdcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwcihcInJvdy5hbHRlcm5hdGUgLT4gJyB4bi1ncmlkLXJvdy1hbHRlcm5hdGUnXCIpLCBleHByKFwicm93LnVwZGF0ZWQgLT4gJyB4bi1ncmlkLXJvdy11cGRhdGVkJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwieG4tZ3JpZC1yb3ctaGVhZGVyXCIgb25DbGljaz17ZXhwcihcIm9uUm93Q2xpY2sgcm93XCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtbXCJmYVwiLCBleHByKFwicm93ID0gYWN0aXZlUm93IC0+ICcgZmEtZWRpdCdcIildfT48L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBzdHlsZT17ZXhwcihcInJvdyA9IGFjdGl2ZVJvdyAtPiAnOyBkaXNwbGF5OiBub25lJ1wiKX0gLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5jb2x1bW5zLm1hcCgoY29sdW1uOiBhbnkpID0+IChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgcm9sZT1cImdyaWRjZWxsXCIgdGFiaW5kZXg9XCItMVwiIGNsYXNzTmFtZT1cInhuLWdyaWQtY2VsbFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInhuLWdyaWQtY2VsbC1jb250ZW50XCI+PGE+e2NvbHVtbi50ZW1wbGF0ZX08L2E+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD4pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIHJvbGU9XCJncmlkY2VsbFwiIHRhYmluZGV4PVwiLTFcIiBjbGFzc05hbWU9XCJ4bi1ncmlkLWNlbGxcIiBzdHlsZT1cIndpZHRoOiAxMDAlO1wiPjwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9SZXBlYXQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuIl19