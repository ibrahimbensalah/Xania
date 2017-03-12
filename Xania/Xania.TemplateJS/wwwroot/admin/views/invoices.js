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
            companyId: null,
            lines: []
        };
    };
    return InvoiceRepository;
}(xania_1.ModelRepository));
function action() {
    var companies = [
        { value: 1, text: "Rider International" },
        { value: 2, text: "Xania BV" }
    ];
    var controller = new InvoiceRepository();
    var store = new xania_1.Reactive.Store(controller);
    var onSelect = function (row) {
        if (store.get("currentRow").valueOf() !== row) {
            store.get("currentRow").set(row);
            store.refresh();
        }
    };
    var onSelectCompany = function (value) {
        store.get("currentRow").get("companyId").set(parseInt(value));
        store.refresh();
    };
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
                    xania_1.Xania.tag(html_1.default.Select, { value: xania_1.expr("companyId"), display: "Company", options: companies, onChange: onSelectCompany }),
                    xania_1.Xania.tag(html_1.default.TextEditor, { field: "description", display: "Description" }),
                    xania_1.Xania.tag("div", { className: "row" },
                        xania_1.Xania.tag("table", null,
                            xania_1.Xania.tag(xania_1.Repeat, { source: xania_1.expr("lines") },
                                xania_1.Xania.tag("tr", null,
                                    xania_1.Xania.tag("td", null,
                                        xania_1.Xania.tag("input", { type: "text", className: "form-control", name: "description" })),
                                    xania_1.Xania.tag("td", null,
                                        xania_1.Xania.tag("input", { type: "text", className: "form-control", name: "amount" })),
                                    xania_1.Xania.tag("td", null,
                                        xania_1.Xania.tag("input", { type: "text", className: "form-control", name: "amount" })))))),
                    xania_1.Xania.tag("button", { onClick: xania_1.expr("addLine ()") }, "add"),
                    xania_1.Xania.tag("div", { className: "form-group", style: "padding: 10px; background-color: #EEE; border: 1px solid #DDD;" },
                        xania_1.Xania.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("save ()") },
                            xania_1.Xania.tag("span", { className: "fa fa-save" }),
                            " Save")))))), store);
}
exports.action = action;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52b2ljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnZvaWNlcy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EseUNBQTBJO0FBQzFJLHFDQUEwQztBQUMxQyxvQ0FBbUM7QUFDbkMsZ0NBQThDO0FBQzlDLHVDQUFpQztBQUVqQztJQUFnQyxxQ0FBZTtJQUMzQztlQUNJLGtCQUFNLGVBQWUsRUFBRSxVQUFVLENBQUM7SUFDdEMsQ0FBQztJQUVELG1DQUFPLEdBQVA7UUFDSSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDdkIsV0FBVyxFQUFFLFVBQVU7WUFDdkIsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztTQUN6QyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQscUNBQVMsR0FBVDtRQUNJLE1BQU0sQ0FBQztZQUNILFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsS0FBSyxFQUFFLEVBQUU7U0FDWixDQUFDO0lBQ04sQ0FBQztJQUNMLHdCQUFDO0FBQUQsQ0FBQyxBQW5CRCxDQUFnQyx1QkFBZSxHQW1COUM7QUFFRDtJQUNJLElBQUksU0FBUyxHQUFHO1FBQ1osRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRTtRQUN6QyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtLQUNqQyxDQUFDO0lBRUYsSUFBSSxVQUFVLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO0lBQ3pDLElBQUksS0FBSyxHQUFHLElBQUksZ0JBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFckMsSUFBSSxRQUFRLEdBQUcsVUFBQSxHQUFHO1FBQ2QsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FB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LDRCQUFNLFNBQVMsRUFBQyxZQUFZLEdBQVE7b0NBQWMsQ0FDcEQsQ0FDQSxDQUNSLENBQ0gsQ0FDSixFQUNQLEtBQUssQ0FBQyxDQUFDO0FBQ2YsQ0FBQztBQS9ERCx3QkErREMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IHsgWGFuaWEgYXMgeGFuaWEsIFJlcGVhdCwgV2l0aCwgSWYsIGV4cHIsIERvbSwgUmVtb3RlRGF0YVNvdXJjZSwgTW9kZWxSZXBvc2l0b3J5LCBSZWFjdGl2ZSBhcyBSZSwgVGVtcGxhdGUgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgVmlld1Jlc3VsdCB9IGZyb20gXCIuLi8uLi9zcmMvbXZjXCJcclxuaW1wb3J0IHsgU2VjdGlvbiB9IGZyb20gXCIuLi9sYXlvdXRcIlxyXG5pbXBvcnQgRGF0YUdyaWQsIHsgVGV4dENvbHVtbiB9IGZyb20gXCIuLi9ncmlkXCJcclxuaW1wb3J0IEh0bWwgZnJvbSAnLi4vLi4vc3JjL2h0bWwnXHJcblxyXG5jbGFzcyBJbnZvaWNlUmVwb3NpdG9yeSBleHRlbmRzIE1vZGVsUmVwb3NpdG9yeSB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcihcIi9hcGkvaW52b2ljZS9cIiwgXCJpbnZvaWNlc1wiKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRMaW5lKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFJvdy5saW5lcy5wdXNoKHtcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwibmV3IGxpbmVcIixcclxuICAgICAgICAgICAgYW1vdW50OiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMClcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVOZXcoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgICAgIGNvbXBhbnlJZDogbnVsbCxcclxuICAgICAgICAgICAgbGluZXM6IFtdXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFjdGlvbigpIHtcclxuICAgIHZhciBjb21wYW5pZXMgPSBbXHJcbiAgICAgICAgeyB2YWx1ZTogMSwgdGV4dDogXCJSaWRlciBJbnRlcm5hdGlvbmFsXCIgfSxcclxuICAgICAgICB7IHZhbHVlOiAyLCB0ZXh0OiBcIlhhbmlhIEJWXCIgfVxyXG4gICAgXTtcclxuXHJcbiAgICB2YXIgY29udHJvbGxlciA9IG5ldyBJbnZvaWNlUmVwb3NpdG9yeSgpO1xyXG4gICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKGNvbnRyb2xsZXIpO1xyXG5cclxuICAgIHZhciBvblNlbGVjdCA9IHJvdyA9PiB7XHJcbiAgICAgICAgaWYgKHN0b3JlLmdldChcImN1cnJlbnRSb3dcIikudmFsdWVPZigpICE9PSByb3cpIHtcclxuICAgICAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFJvd1wiKS5zZXQocm93KTtcclxuICAgICAgICAgICAgc3RvcmUucmVmcmVzaCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgb25TZWxlY3RDb21wYW55ID0gdmFsdWUgPT4ge1xyXG4gICAgICAgIHN0b3JlLmdldChcImN1cnJlbnRSb3dcIikuZ2V0KFwiY29tcGFueUlkXCIpLnNldChwYXJzZUludCh2YWx1ZSkpO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogOTUlO1wiIGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17W2V4cHIoXCJjdXJyZW50Um93IC0+ICdjb2wtOCdcIiksIGV4cHIoXCJub3QgY3VycmVudFJvdyAtPiAnY29sLTEyJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgPFNlY3Rpb24gdGl0bGU9XCJJbnZvaWNlc1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxEYXRhR3JpZCBkYXRhPXtleHByKFwiYXdhaXQgZGF0YVNvdXJjZVwiKX0gb25TZWxlY3Rpb25DaGFuZ2VkPXtvblNlbGVjdH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwiZGVzY3JpcHRpb25cIiBkaXNwbGF5PVwiRGVzY3JpcHRpb25cIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8VGV4dENvbHVtbiBmaWVsZD1cImludm9pY2VEYXRlXCIgZGlzcGxheT1cIkludm9pY2UgRGF0ZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9EYXRhR3JpZD5cclxuICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyIHN0eWxlPVwiaGVpZ2h0OiA1MHB4OyBtYXJnaW46IDAgMTZweDsgcGFkZGluZzogMDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBvbkNsaWNrPXtleHByKFwiY3VycmVudFJvdyA8LSBjcmVhdGVOZXcoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1wbHVzXCI+PC9zcGFuPiBBZGQgTmV3PC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9mb290ZXI+XHJcbiAgICAgICAgICAgICAgICA8L1NlY3Rpb24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8V2l0aCBvYmplY3Q9e2V4cHIoXCJjdXJyZW50Um93XCIpfT5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8U2VjdGlvbiB0aXRsZT17ZXhwcihcImRlc2NyaXB0aW9uXCIpfSBvbkNhbmNlbD17ZXhwcihcImNhbmNlbFwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxIdG1sLlNlbGVjdCB2YWx1ZT17ZXhwcihcImNvbXBhbnlJZFwiKX0gZGlzcGxheT1cIkNvbXBhbnlcIiBvcHRpb25zPXtjb21wYW5pZXN9IG9uQ2hhbmdlPXtvblNlbGVjdENvbXBhbnl9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxIdG1sLlRleHRFZGl0b3IgZmllbGQ9XCJkZXNjcmlwdGlvblwiIGRpc3BsYXk9XCJEZXNjcmlwdGlvblwiIC8+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxSZXBlYXQgc291cmNlPXtleHByKFwibGluZXNcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgbmFtZT1cImRlc2NyaXB0aW9uXCIgLz48L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIG5hbWU9XCJhbW91bnRcIiAvPjwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgbmFtZT1cImFtb3VudFwiIC8+PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1JlcGVhdD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2V4cHIoXCJhZGRMaW5lICgpXCIpfT5hZGQ8L2J1dHRvbj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiIHN0eWxlPVwicGFkZGluZzogMTBweDsgYmFja2dyb3VuZC1jb2xvcjogI0VFRTsgYm9yZGVyOiAxcHggc29saWQgI0RERDtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17ZXhwcihcInNhdmUgKClcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXNhdmVcIj48L3NwYW4+IFNhdmU8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9TZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvV2l0aD5cclxuICAgICAgICA8L2RpdiA+LFxyXG4gICAgICAgIHN0b3JlKTtcclxufSJdfQ==