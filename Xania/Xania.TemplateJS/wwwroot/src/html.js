"use strict";
var xania_1 = require("./xania");
function TextEditor(attrs) {
    var id = Math.random();
    return xania_1.default.tag("div", Object.assign({ "class": "form-group" }, attrs), [
        xania_1.default.tag("label", { htmlFor: id }, attrs.display),
        xania_1.default.tag("input", { className: "form-control", id: id, type: "text", placeholder: attrs.display, name: attrs.field })
    ]);
}
exports.TextEditor = TextEditor;
function BooleanEditor(attrs) {
    var id = Math.random();
    return xania_1.default.tag("div", Object.assign({ "class": "form-check" }, attrs), [
        xania_1.default.tag("label", { className: "form-check-label", htmlFor: id },
            xania_1.default.tag("input", { className: "form-check-input", id: id, type: "checkbox", checked: xania_1.expr(attrs.field) }),
            " ",
            attrs.display)
    ]);
}
exports.BooleanEditor = BooleanEditor;
var Select = (function () {
    function Select(attrs) {
        this.attrs = attrs;
        this.value = null;
        this.options = [];
    }
    Select.prototype.view = function () {
        var _this = this;
        var id = Math.floor(new Date().getTime() + Math.random() * 10000) % 10000000;
        var onChange = function (event) {
            var target = event.target;
            return _this.attrs.onChange(target.value);
        };
        return (xania_1.default.tag("div", { className: "form-group" },
            xania_1.default.tag("label", { htmlFor: id }, this.attrs.display),
            xania_1.default.tag("select", { className: "form-control", id: id, onChange: onChange },
                xania_1.default.tag("option", null),
                xania_1.default.tag(xania_1.Repeat, { source: xania_1.expr("for option in options") },
                    xania_1.default.tag("option", { selected: xania_1.expr("option.value = value -> 'selected'"), value: xania_1.expr("option.value") }, xania_1.expr("option.text"))))));
    };
    return Select;
}());
exports.Select = Select;
var DropDown = (function () {
    function DropDown(attrs) {
        var _this = this;
        this.attrs = attrs;
        this.expanded = false;
        this.selected = "Default Value";
        this.onToggle = function () {
            _this.expanded = !_this.expanded;
        };
    }
    DropDown.prototype.selectItem = function (event, item) {
        event.preventDefault();
        this.selected = item;
        this.expanded = false;
    };
    DropDown.prototype.view = function () {
        return (xania_1.default.tag("div", null,
            xania_1.default.tag("label", { className: "form-check-label" }, "Company"),
            xania_1.default.tag("div", { className: ["btn-group", xania_1.expr("expanded -> ' show'")] },
                xania_1.default.tag("button", { className: "btn btn-secondary btn-sm dropdown-toggle", onClick: this.onToggle, type: "button", "aria-haspopup": "true", "aria-expanded": xania_1.expr("expanded") }, xania_1.expr("selected")),
                xania_1.default.tag("div", { className: "dropdown-menu" },
                    xania_1.default.tag("a", { className: "dropdown-item", href: "", onClick: xania_1.expr("selectItem event 'Xania'") }, "Xania Software"),
                    xania_1.default.tag("a", { className: "dropdown-item", href: "", onClick: xania_1.expr("selectItem event 'Rider International'") }, "Rider Internation"),
                    xania_1.default.tag("div", { className: "dropdown-divider" }),
                    xania_1.default.tag("a", { className: "dropdown-item", href: "", onClick: xania_1.expr("selectItem event 'Darwin Recruitement'") }, "Darwin Recruitement")))));
    };
    return DropDown;
}());
exports.DropDown = DropDown;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = { TextEditor: TextEditor, BooleanEditor: BooleanEditor, DropDown: DropDown, Select: Select };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0bWwudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxpQ0FBOEM7QUFFOUMsb0JBQTJCLEtBQUs7SUFDNUIsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3ZCLE1BQU0sQ0FBQyxlQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFDbEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFDL0M7UUFDSSwrQkFBTyxPQUFPLEVBQUUsRUFBRSxJQUFHLEtBQUssQ0FBQyxPQUFPLENBQVM7UUFDM0MsK0JBQU8sU0FBUyxFQUFDLGNBQWMsRUFBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBQyxNQUFNLEVBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLEdBQUk7S0FDeEcsQ0FDSixDQUFDO0FBQ04sQ0FBQztBQVRELGdDQVNDO0FBRUQsdUJBQThCLEtBQUs7SUFDL0IsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3ZCLE1BQU0sQ0FBQyxlQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFDbEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFDL0M7UUFDSSwrQkFBTyxTQUFTLEVBQUMsa0JBQWtCLEVBQUMsT0FBTyxFQUFFLEVBQUU7WUFDM0MsK0JBQU8sU0FBUyxFQUFDLGtCQUFrQixFQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFDLFVBQVUsRUFBQyxPQUFPLEVBQUUsWUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBSTs7WUFBRSxLQUFLLENBQUMsT0FBTyxDQUNyRztLQUNYLENBQ0osQ0FBQztBQUNOLENBQUM7QUFW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QUFDLE9BQU8sRUFBRSxZQUFJLENBQUMsd0NBQXdDLENBQUMsMEJBQXlCLENBQ25ILENBQ0osQ0FDSixDQUNULENBQUM7SUFDTixDQUFDO0lBQ0wsZUFBQztBQUFELENBQUMsQUFsQ0QsSUFrQ0M7QUFsQ1ksNEJBQVE7O0FBb0NyQixrQkFBZSxFQUFFLFVBQVUsWUFBQSxFQUFFLGFBQWEsZUFBQSxFQUFFLFFBQVEsVUFBQSxFQUFFLE1BQU0sUUFBQSxFQUFFLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeGFuaWEsIHsgZXhwciwgUmVwZWF0IH0gZnJvbSBcIi4veGFuaWFcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBUZXh0RWRpdG9yKGF0dHJzKSB7XHJcbiAgICB2YXIgaWQgPSBNYXRoLnJhbmRvbSgpO1xyXG4gICAgcmV0dXJuIHhhbmlhLnRhZyhcImRpdlwiLFxyXG4gICAgICAgIE9iamVjdC5hc3NpZ24oeyBcImNsYXNzXCI6IFwiZm9ybS1ncm91cFwiIH0sIGF0dHJzKSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPXtpZH0+e2F0dHJzLmRpc3BsYXl9PC9sYWJlbD4sXHJcbiAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiBpZD17aWR9IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9e2F0dHJzLmRpc3BsYXl9IG5hbWU9e2F0dHJzLmZpZWxkfSAvPlxyXG4gICAgICAgIF1cclxuICAgICk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBCb29sZWFuRWRpdG9yKGF0dHJzKSB7XHJcbiAgICB2YXIgaWQgPSBNYXRoLnJhbmRvbSgpO1xyXG4gICAgcmV0dXJuIHhhbmlhLnRhZyhcImRpdlwiLFxyXG4gICAgICAgIE9iamVjdC5hc3NpZ24oeyBcImNsYXNzXCI6IFwiZm9ybS1jaGVja1wiIH0sIGF0dHJzKSxcclxuICAgICAgICBbXHJcbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJmb3JtLWNoZWNrLWxhYmVsXCIgaHRtbEZvcj17aWR9PlxyXG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cImZvcm0tY2hlY2staW5wdXRcIiBpZD17aWR9IHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ9e2V4cHIoYXR0cnMuZmllbGQpfSAvPiB7YXR0cnMuZGlzcGxheX1cclxuICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICBdXHJcbiAgICApO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU2VsZWN0IHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXR0cnMpIHsgfVxyXG5cclxuICAgIHByaXZhdGUgdmFsdWU6IHN0cmluZyA9IG51bGw7XHJcbiAgICBwcml2YXRlIG9wdGlvbnMgPSBbXTtcclxuXHJcbiAgICB2aWV3KCkge1xyXG4gICAgICAgIHZhciBpZCA9IE1hdGguZmxvb3IobmV3IERhdGUoKS5nZXRUaW1lKCkgKyBNYXRoLnJhbmRvbSgpICogMTAwMDApICUgMTAwMDAwMDA7XHJcbiAgICAgICAgdmFyIG9uQ2hhbmdlID0gZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXR0cnMub25DaGFuZ2UodGFyZ2V0LnZhbHVlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiID5cclxuICAgICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPXtpZH0+e3RoaXMuYXR0cnMuZGlzcGxheX08L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiBpZD17aWR9IG9uQ2hhbmdlPXtvbkNoYW5nZX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbj48L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICA8UmVwZWF0IHNvdXJjZT17ZXhwcihcImZvciBvcHRpb24gaW4gb3B0aW9uc1wiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gc2VsZWN0ZWQ9e2V4cHIoXCJvcHRpb24udmFsdWUgPSB2YWx1ZSAtPiAnc2VsZWN0ZWQnXCIpfSB2YWx1ZT17ZXhwcihcIm9wdGlvbi52YWx1ZVwiKX0+e2V4cHIoXCJvcHRpb24udGV4dFwiKX08L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L1JlcGVhdD5cclxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRHJvcERvd24ge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhdHRycykgeyB9XHJcblxyXG4gICAgcHJpdmF0ZSBleHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBzZWxlY3RlZDogc3RyaW5nID0gXCJEZWZhdWx0IFZhbHVlXCI7XHJcblxyXG4gICAgcHJpdmF0ZSBvblRvZ2dsZSA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLmV4cGFuZGVkID0gIXRoaXMuZXhwYW5kZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZWxlY3RJdGVtKGV2ZW50LCBpdGVtKSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkID0gaXRlbTtcclxuICAgICAgICB0aGlzLmV4cGFuZGVkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdmlldygpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImZvcm0tY2hlY2stbGFiZWxcIj5Db21wYW55PC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbXCJidG4tZ3JvdXBcIiwgZXhwcihcImV4cGFuZGVkIC0+ICcgc2hvdydcIildfT5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tc2Vjb25kYXJ5IGJ0bi1zbSBkcm9wZG93bi10b2dnbGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uVG9nZ2xlfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCIgYXJpYS1oYXNwb3B1cD1cInRydWVcIiBhcmlhLWV4cGFuZGVkPXtleHByKFwiZXhwYW5kZWRcIil9PntleHByKFwic2VsZWN0ZWRcIil9PC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkcm9wZG93bi1tZW51XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImRyb3Bkb3duLWl0ZW1cIiBocmVmPVwiXCIgb25DbGljaz17ZXhwcihcInNlbGVjdEl0ZW0gZXZlbnQgJ1hhbmlhJ1wiKX0+WGFuaWEgU29mdHdhcmU8L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImRyb3Bkb3duLWl0ZW1cIiBocmVmPVwiXCIgb25DbGljaz17ZXhwcihcInNlbGVjdEl0ZW0gZXZlbnQgJ1JpZGVyIEludGVybmF0aW9uYWwnXCIpfT5SaWRlciBJbnRlcm5hdGlvbjwvYT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkcm9wZG93bi1kaXZpZGVyXCI+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImRyb3Bkb3duLWl0ZW1cIiBocmVmPVwiXCIgb25DbGljaz17ZXhwcihcInNlbGVjdEl0ZW0gZXZlbnQgJ0RhcndpbiBSZWNydWl0ZW1lbnQnXCIpfT5EYXJ3aW4gUmVjcnVpdGVtZW50PC9hPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHsgVGV4dEVkaXRvciwgQm9vbGVhbkVkaXRvciwgRHJvcERvd24sIFNlbGVjdCB9Il19