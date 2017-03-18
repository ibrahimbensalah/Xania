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
            hours: null,
            hourlyRate: null
        });
    };
    InvoiceRepository.prototype.removeLine = function (event, line) {
        var idx = this.currentRow.lines.indexOf(line);
        if (idx >= 0) {
            this.currentRow.lines.splice(idx, 1);
        }
        event.preventDefault();
    };
    InvoiceRepository.prototype.createNew = function () {
        return {
            description: null,
            companyId: null,
            invoiceNumber: null,
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
    var onSelectRow = function (row) {
        if (store.get("currentRow").valueOf() !== row) {
            store.get("currentRow").set(row);
            store.refresh();
        }
    };
    var onSelectCompany = function (value) {
        store.get("currentRow").get("companyId").set(parseInt(value));
        store.refresh();
    };
    return new mvc_1.ViewResult(xania_1.default.tag("div", { style: "height: 95%;", className: "row" },
        xania_1.default.tag("div", { className: [xania_1.expr("currentRow -> 'col-8'"), xania_1.expr("not currentRow -> 'col-12'")] },
            xania_1.default.tag(layout_1.Section, { title: "Invoices" },
                xania_1.default.tag(grid_1.default, { data: xania_1.expr("await dataSource"), onSelectionChanged: onSelectRow },
                    xania_1.default.tag(grid_1.TextColumn, { template: xania_1.default.tag("span", null,
                            xania_1.default.tag("span", { className: "invoice-number" }, xania_1.expr("row.invoiceNumber")),
                            xania_1.expr("row.description")), display: "Description" }),
                    xania_1.default.tag(grid_1.TextColumn, { field: "invoiceDate", display: "Invoice Date" })),
                xania_1.default.tag("footer", { style: "height: 50px; margin: 0 16px; padding: 0;" },
                    xania_1.default.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("currentRow <- createNew()") },
                        xania_1.default.tag("span", { className: "fa fa-plus" }),
                        " Add New")))),
        xania_1.default.tag(xania_1.With, { object: xania_1.expr("currentRow") },
            xania_1.default.tag("div", { className: "col-4" },
                xania_1.default.tag(layout_1.Section, { title: xania_1.expr("description"), onCancel: xania_1.expr("cancel") },
                    xania_1.default.tag(html_1.default.TextEditor, { field: "invoiceNumber", display: "Invoice Number" }),
                    xania_1.default.tag(html_1.default.Select, { value: xania_1.expr("companyId"), display: "Company", options: companies, onChange: onSelectCompany }),
                    xania_1.default.tag(html_1.default.TextEditor, { field: "description", display: "Description" }),
                    xania_1.default.tag("div", { className: "row" },
                        xania_1.default.tag("header", { style: "height: 50px" },
                            xania_1.default.tag("span", { className: "fa fa-bolt" }),
                            " ",
                            xania_1.default.tag("span", null, "Hour Declarations")),
                        xania_1.default.tag("table", null,
                            xania_1.default.tag(xania_1.Repeat, { source: xania_1.expr("for line in lines") },
                                xania_1.default.tag("tr", null,
                                    xania_1.default.tag("td", { colspan: "3" },
                                        xania_1.default.tag("input", { type: "text", className: "form-control", name: "line.description" }))),
                                xania_1.default.tag("tr", { style: "border-bottom: 10px solid rgba(0, 0, 0, 0);" },
                                    xania_1.default.tag("td", null,
                                        xania_1.default.tag("input", { type: "text", className: "form-control", placeholder: "Rate", name: "line.hourlyRate" })),
                                    xania_1.default.tag("td", null,
                                        xania_1.default.tag("input", { type: "text", className: "form-control", placeholder: "Hours", name: "line.hours" })),
                                    xania_1.default.tag("td", { style: "width: 120px; text-align: right; padding: 0 20px; font-weight: bold; color: gray;" },
                                        "\u20AC ",
                                        xania_1.expr("line.hours * line.hourlyRate"),
                                        xania_1.default.tag("a", { href: "", onClick: xania_1.expr("removeLine event line") }, "\u00D7")))))),
                    xania_1.default.tag("button", { onClick: xania_1.expr("addLine ()") }, "add"),
                    xania_1.default.tag("div", { className: "form-group", style: "padding: 10px; background-color: #EEE; border: 1px solid #DDD;" },
                        xania_1.default.tag("button", { className: "btn btn-primary", onClick: xania_1.expr("save ()") },
                            xania_1.default.tag("span", { className: "fa fa-save" }),
                            " Save")))))), store);
}
exports.action = action;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52b2ljZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnZvaWNlcy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0EseUNBQWlJO0FBQ2pJLHFDQUEwQztBQUMxQyxvQ0FBbUM7QUFDbkMsZ0NBQThDO0FBQzlDLHVDQUFpQztBQUVqQztJQUFnQyxxQ0FBZTtJQUMzQztlQUNJLGtCQUFNLGVBQWUsRUFBRSxVQUFVLENBQUM7SUFDdEMsQ0FBQztJQUVELG1DQUFPLEdBQVA7UUFDSSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDdkIsV0FBVyxFQUFFLFVBQVU7WUFDdkIsS0FBSyxFQUFFLElBQUk7WUFDWCxVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsc0NBQVUsR0FBVixVQUFXLEtBQUssRUFBRSxJQUFJO1FBQ2xCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNYLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQscUNBQVMsR0FBVDtRQUNJLE1BQU0sQ0FBQztZQUNILFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsYUFBYSxFQUFFLElBQUk7WUFDbkIsS0FBSyxFQUFFLEVBQUU7U0FDWixDQUFDO0lBQ04sQ0FBQztJQUNMLHdCQUFDO0FBQUQsQ0FBQyxBQTlCRCxDQUFnQyx1QkFBZSxHQThCOUM7QUFFRDtJQUNJLElBQUksU0FBUyxHQUFHO1FBQ1osRUFBRSxLQUFLLEVBQUUsQ0FBQyxF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ZXBlYXQsIFdpdGgsIElmLCBleHByLCBEb20sIFJlbW90ZURhdGFTb3VyY2UsIE1vZGVsUmVwb3NpdG9yeSwgUmVhY3RpdmUgYXMgUmUsIFRlbXBsYXRlIH0gZnJvbSBcIi4uLy4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IFZpZXdSZXN1bHQgfSBmcm9tIFwiLi4vLi4vc3JjL212Y1wiXHJcbmltcG9ydCB7IFNlY3Rpb24gfSBmcm9tIFwiLi4vbGF5b3V0XCJcclxuaW1wb3J0IERhdGFHcmlkLCB7IFRleHRDb2x1bW4gfSBmcm9tIFwiLi4vZ3JpZFwiXHJcbmltcG9ydCBIdG1sIGZyb20gJy4uLy4uL3NyYy9odG1sJ1xyXG5cclxuY2xhc3MgSW52b2ljZVJlcG9zaXRvcnkgZXh0ZW5kcyBNb2RlbFJlcG9zaXRvcnkge1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoXCIvYXBpL2ludm9pY2UvXCIsIFwiaW52b2ljZXNcIik7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkTGluZSgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRSb3cubGluZXMucHVzaCh7XHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIm5ldyBsaW5lXCIsXHJcbiAgICAgICAgICAgIGhvdXJzOiBudWxsLFxyXG4gICAgICAgICAgICBob3VybHlSYXRlOiBudWxsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlTGluZShldmVudCwgbGluZSkge1xyXG4gICAgICAgIHZhciBpZHggPSB0aGlzLmN1cnJlbnRSb3cubGluZXMuaW5kZXhPZihsaW5lKTtcclxuICAgICAgICBpZiAoaWR4ID49IDApIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Um93LmxpbmVzLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVOZXcoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgICAgIGNvbXBhbnlJZDogbnVsbCxcclxuICAgICAgICAgICAgaW52b2ljZU51bWJlcjogbnVsbCxcclxuICAgICAgICAgICAgbGluZXM6IFtdXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFjdGlvbigpIHtcclxuICAgIHZhciBjb21wYW5pZXMgPSBbXHJcbiAgICAgICAgeyB2YWx1ZTogMSwgdGV4dDogXCJSaWRlciBJbnRlcm5hdGlvbmFsXCIgfSxcclxuICAgICAgICB7IHZhbHVlOiAyLCB0ZXh0OiBcIlhhbmlhIEJWXCIgfVxyXG4gICAgXTtcclxuXHJcbiAgICB2YXIgY29udHJvbGxlciA9IG5ldyBJbnZvaWNlUmVwb3NpdG9yeSgpO1xyXG4gICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKGNvbnRyb2xsZXIpO1xyXG5cclxuICAgIHZhciBvblNlbGVjdFJvdyA9IHJvdyA9PiB7XHJcbiAgICAgICAgaWYgKHN0b3JlLmdldChcImN1cnJlbnRSb3dcIikudmFsdWVPZigpICE9PSByb3cpIHtcclxuICAgICAgICAgICAgc3RvcmUuZ2V0KFwiY3VycmVudFJvd1wiKS5zZXQocm93KTtcclxuICAgICAgICAgICAgc3RvcmUucmVmcmVzaCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgb25TZWxlY3RDb21wYW55ID0gdmFsdWUgPT4ge1xyXG4gICAgICAgIHN0b3JlLmdldChcImN1cnJlbnRSb3dcIikuZ2V0KFwiY29tcGFueUlkXCIpLnNldChwYXJzZUludCh2YWx1ZSkpO1xyXG4gICAgICAgIHN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFZpZXdSZXN1bHQoXHJcbiAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogOTUlO1wiIGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17W2V4cHIoXCJjdXJyZW50Um93IC0+ICdjb2wtOCdcIiksIGV4cHIoXCJub3QgY3VycmVudFJvdyAtPiAnY29sLTEyJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgPFNlY3Rpb24gdGl0bGU9XCJJbnZvaWNlc1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxEYXRhR3JpZCBkYXRhPXtleHByKFwiYXdhaXQgZGF0YVNvdXJjZVwiKX0gb25TZWxlY3Rpb25DaGFuZ2VkPXtvblNlbGVjdFJvd30+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIHRlbXBsYXRlPXs8c3Bhbj48c3BhbiBjbGFzc05hbWU9XCJpbnZvaWNlLW51bWJlclwiPntleHByKFwicm93Lmludm9pY2VOdW1iZXJcIil9PC9zcGFuPntleHByKFwicm93LmRlc2NyaXB0aW9uXCIpfTwvc3Bhbj59IGRpc3BsYXk9XCJEZXNjcmlwdGlvblwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Q29sdW1uIGZpZWxkPVwiaW52b2ljZURhdGVcIiBkaXNwbGF5PVwiSW52b2ljZSBEYXRlXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L0RhdGFHcmlkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxmb290ZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHg7IG1hcmdpbjogMCAxNnB4OyBwYWRkaW5nOiAwO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeVwiIG9uQ2xpY2s9e2V4cHIoXCJjdXJyZW50Um93IDwtIGNyZWF0ZU5ldygpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZhIGZhLXBsdXNcIj48L3NwYW4+IEFkZCBOZXc8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgICAgIDwvU2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxXaXRoIG9iamVjdD17ZXhwcihcImN1cnJlbnRSb3dcIil9PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxTZWN0aW9uIHRpdGxlPXtleHByKFwiZGVzY3JpcHRpb25cIil9IG9uQ2FuY2VsPXtleHByKFwiY2FuY2VsXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEh0bWwuVGV4dEVkaXRvciBmaWVsZD1cImludm9pY2VOdW1iZXJcIiBkaXNwbGF5PVwiSW52b2ljZSBOdW1iZXJcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SHRtbC5TZWxlY3QgdmFsdWU9e2V4cHIoXCJjb21wYW55SWRcIil9IGRpc3BsYXk9XCJDb21wYW55XCIgb3B0aW9ucz17Y29tcGFuaWVzfSBvbkNoYW5nZT17b25TZWxlY3RDb21wYW55fSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8SHRtbC5UZXh0RWRpdG9yIGZpZWxkPVwiZGVzY3JpcHRpb25cIiBkaXNwbGF5PVwiRGVzY3JpcHRpb25cIiAvPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj48c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1ib2x0XCI+PC9zcGFuPiA8c3Bhbj5Ib3VyIERlY2xhcmF0aW9uczwvc3Bhbj48L2hlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0YWJsZT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8UmVwZWF0IHNvdXJjZT17ZXhwcihcImZvciBsaW5lIGluIGxpbmVzXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIzXCI+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgbmFtZT1cImxpbmUuZGVzY3JpcHRpb25cIiAvPjwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ciBzdHlsZT1cImJvcmRlci1ib3R0b206IDEwcHggc29saWQgcmdiYSgwLCAwLCAwLCAwKTtcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiBwbGFjZWhvbGRlcj1cIlJhdGVcIiBuYW1lPVwibGluZS5ob3VybHlSYXRlXCIgLz48L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbFwiIHBsYWNlaG9sZGVyPVwiSG91cnNcIiBuYW1lPVwibGluZS5ob3Vyc1wiIC8+PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cIndpZHRoOiAxMjBweDsgdGV4dC1hbGlnbjogcmlnaHQ7IHBhZGRpbmc6IDAgMjBweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiBncmF5O1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICZldXJvOyB7ZXhwcihcImxpbmUuaG91cnMgKiBsaW5lLmhvdXJseVJhdGVcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIlwiIG9uQ2xpY2s9e2V4cHIoXCJyZW1vdmVMaW5lIGV2ZW50IGxpbmVcIil9PiZ0aW1lczs8L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvUmVwZWF0PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17ZXhwcihcImFkZExpbmUgKClcIil9PmFkZDwvYnV0dG9uPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCIgc3R5bGU9XCJwYWRkaW5nOiAxMHB4OyBiYWNrZ3JvdW5kLWNvbG9yOiAjRUVFOyBib3JkZXI6IDFweCBzb2xpZCAjREREO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIiBvbkNsaWNrPXtleHByKFwic2F2ZSAoKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZmEgZmEtc2F2ZVwiPjwvc3Bhbj4gU2F2ZTwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L1NlY3Rpb24+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9XaXRoPlxyXG4gICAgICAgIDwvZGl2ID4sXHJcbiAgICAgICAgc3RvcmUpO1xyXG59Il19