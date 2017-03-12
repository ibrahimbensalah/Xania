"use strict";
var xania_1 = require("./xania");
function TextEditor(attrs) {
    var id = Math.random();
    return xania_1.Xania.tag("div", Object.assign({ "class": "form-group" }, attrs), [
        xania_1.Xania.tag("label", { htmlFor: id }, attrs.display),
        xania_1.Xania.tag("input", { className: "form-control", id: id, type: "text", placeholder: attrs.display, name: attrs.field })
    ]);
}
exports.TextEditor = TextEditor;
function BooleanEditor(attrs) {
    var id = Math.random();
    return xania_1.Xania.tag("div", Object.assign({ "class": "form-check" }, attrs), [
        xania_1.Xania.tag("label", { className: "form-check-label", htmlFor: id },
            xania_1.Xania.tag("input", { className: "form-check-input", id: id, type: "checkbox", checked: xania_1.expr(attrs.field) }),
            " ",
            attrs.display)
    ]);
}
exports.BooleanEditor = BooleanEditor;
var Select = (function () {
    function Select(attrs) {
        var _this = this;
        this.attrs = attrs;
        this.value = null;
        this.options = [];
        this.onChange = function (event) {
            var target = event.target;
            return _this.attrs.onChange(target.value);
        };
    }
    Select.prototype.view = function () {
        var id = Math.floor(new Date().getTime() + Math.random() * 10000) % 10000000;
        return (xania_1.Xania.tag("div", { className: "form-group", style: "select component" },
            xania_1.Xania.tag("label", { htmlFor: id }, this.attrs.display),
            xania_1.Xania.tag("select", { className: "form-control", id: id, onChange: this.onChange },
                xania_1.Xania.tag("option", null),
                xania_1.Xania.tag(xania_1.Repeat, { source: xania_1.expr("for option in options") },
                    xania_1.Xania.tag("option", { selected: xania_1.expr("option.value = value -> 'selected'"), value: xania_1.expr("option.value") }, xania_1.expr("option.text"))))));
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
        return (xania_1.Xania.tag("div", null,
            xania_1.Xania.tag("label", { className: "form-check-label" }, "Company"),
            xania_1.Xania.tag("div", { className: ["btn-group", xania_1.expr("expanded -> ' show'")] },
                xania_1.Xania.tag("button", { className: "btn btn-secondary btn-sm dropdown-toggle", onClick: this.onToggle, type: "button", "aria-haspopup": "true", "aria-expanded": xania_1.expr("expanded") }, xania_1.expr("selected")),
                xania_1.Xania.tag("div", { className: "dropdown-menu" },
                    xania_1.Xania.tag("a", { className: "dropdown-item", href: "", onClick: xania_1.expr("selectItem event 'Xania'") }, "Xania Software"),
                    xania_1.Xania.tag("a", { className: "dropdown-item", href: "", onClick: xania_1.expr("selectItem event 'Rider International'") }, "Rider Internation"),
                    xania_1.Xania.tag("div", { className: "dropdown-divider" }),
                    xania_1.Xania.tag("a", { className: "dropdown-item", href: "", onClick: xania_1.expr("selectItem event 'Darwin Recruitement'") }, "Darwin Recruitement")))));
    };
    return DropDown;
}());
exports.DropDown = DropDown;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = { TextEditor: TextEditor, BooleanEditor: BooleanEditor, DropDown: DropDown, Select: Select };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0bWwudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxpQ0FBdUQ7QUFFdkQsb0JBQTJCLEtBQUs7SUFDNUIsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3ZCLE1BQU0sQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFDbEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFDL0M7UUFDSSw2QkFBTyxPQUFPLEVBQUUsRUFBRSxJQUFHLEtBQUssQ0FBQyxPQUFPLENBQVM7UUFDM0MsNkJBQU8sU0FBUyxFQUFDLGNBQWMsRUFBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBQyxNQUFNLEVBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLEdBQUk7S0FDeEcsQ0FDSixDQUFDO0FBQ04sQ0FBQztBQVRELGdDQVNDO0FBRUQsdUJBQThCLEtBQUs7SUFDL0IsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3ZCLE1BQU0sQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFDbEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLENBQUMsRUFDL0M7UUFDSSw2QkFBTyxTQUFTLEVBQUMsa0JBQWtCLEVBQUMsT0FBTyxFQUFFLEVBQUU7WUFDM0MsNkJBQU8sU0FBUyxFQUFDLGtCQUFrQixFQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFDLFVBQVUsRUFBQyxPQUFPLEVBQUUsWUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBSTs7WUFBRSxLQUFLLENBQUMsT0FBTyxDQUNyRztLQUNYLENBQ0osQ0FBQztBQUNOLENBQUM7QUFW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QyxlQUFlLEVBQUMsSUFBSSxFQUFDLEVBQUUsRUFBQyxPQUFPLEVBQUUsWUFBSSxDQUFDLHdDQUF3QyxDQUFDLDBCQUF5QixDQUNuSCxDQUNKLENBQ0osQ0FDVCxDQUFDO0lBQ04sQ0FBQztJQUNMLGVBQUM7QUFBRCxDQUFDLEFBbENELElBa0NDO0FBbENZLDRCQUFROztBQW9DckIsa0JBQWUsRUFBRSxVQUFVLFlBQUEsRUFBRSxhQUFhLGVBQUEsRUFBRSxRQUFRLFVBQUEsRUFBRSxNQUFNLFFBQUEsRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgWGFuaWEgYXMgeGFuaWEsIGV4cHIsIFJlcGVhdCB9IGZyb20gXCIuL3hhbmlhXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gVGV4dEVkaXRvcihhdHRycykge1xyXG4gICAgdmFyIGlkID0gTWF0aC5yYW5kb20oKTtcclxuICAgIHJldHVybiB4YW5pYS50YWcoXCJkaXZcIixcclxuICAgICAgICBPYmplY3QuYXNzaWduKHsgXCJjbGFzc1wiOiBcImZvcm0tZ3JvdXBcIiB9LCBhdHRycyksXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj17aWR9PnthdHRycy5kaXNwbGF5fTwvbGFiZWw+LFxyXG4gICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgaWQ9e2lkfSB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPXthdHRycy5kaXNwbGF5fSBuYW1lPXthdHRycy5maWVsZH0gLz5cclxuICAgICAgICBdXHJcbiAgICApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gQm9vbGVhbkVkaXRvcihhdHRycykge1xyXG4gICAgdmFyIGlkID0gTWF0aC5yYW5kb20oKTtcclxuICAgIHJldHVybiB4YW5pYS50YWcoXCJkaXZcIixcclxuICAgICAgICBPYmplY3QuYXNzaWduKHsgXCJjbGFzc1wiOiBcImZvcm0tY2hlY2tcIiB9LCBhdHRycyksXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiZm9ybS1jaGVjay1sYWJlbFwiIGh0bWxGb3I9e2lkfT5cclxuICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJmb3JtLWNoZWNrLWlucHV0XCIgaWQ9e2lkfSB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtleHByKGF0dHJzLmZpZWxkKX0gLz4ge2F0dHJzLmRpc3BsYXl9XHJcbiAgICAgICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgXVxyXG4gICAgKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNlbGVjdCB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGF0dHJzKSB7IH1cclxuXHJcbiAgICBwcml2YXRlIHZhbHVlOiBzdHJpbmcgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSBvcHRpb25zID0gW107XHJcblxyXG4gICAgcHJpdmF0ZSBvbkNoYW5nZSA9IGV2ZW50ID0+IHtcclxuICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRycy5vbkNoYW5nZSh0YXJnZXQudmFsdWUpO1xyXG4gICAgfTtcclxuXHJcbiAgICB2aWV3KCkge1xyXG4gICAgICAgIHZhciBpZCA9IE1hdGguZmxvb3IobmV3IERhdGUoKS5nZXRUaW1lKCkgKyBNYXRoLnJhbmRvbSgpICogMTAwMDApICUgMTAwMDAwMDA7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCIgc3R5bGU9XCJzZWxlY3QgY29tcG9uZW50XCI+XHJcbiAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj17aWR9Pnt0aGlzLmF0dHJzLmRpc3BsYXl9PC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgaWQ9e2lkfSBvbkNoYW5nZT17dGhpcy5vbkNoYW5nZX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbj48L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICA8UmVwZWF0IHNvdXJjZT17ZXhwcihcImZvciBvcHRpb24gaW4gb3B0aW9uc1wiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gc2VsZWN0ZWQ9e2V4cHIoXCJvcHRpb24udmFsdWUgPSB2YWx1ZSAtPiAnc2VsZWN0ZWQnXCIpfSB2YWx1ZT17ZXhwcihcIm9wdGlvbi52YWx1ZVwiKX0+e2V4cHIoXCJvcHRpb24udGV4dFwiKX08L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICA8L1JlcGVhdD5cclxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRHJvcERvd24ge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhdHRycykgeyB9XHJcblxyXG4gICAgcHJpdmF0ZSBleHBhbmRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBzZWxlY3RlZDogc3RyaW5nID0gXCJEZWZhdWx0IFZhbHVlXCI7XHJcblxyXG4gICAgcHJpdmF0ZSBvblRvZ2dsZSA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLmV4cGFuZGVkID0gIXRoaXMuZXhwYW5kZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZWxlY3RJdGVtKGV2ZW50LCBpdGVtKSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkID0gaXRlbTtcclxuICAgICAgICB0aGlzLmV4cGFuZGVkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgdmlldygpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImZvcm0tY2hlY2stbGFiZWxcIj5Db21wYW55PC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbXCJidG4tZ3JvdXBcIiwgZXhwcihcImV4cGFuZGVkIC0+ICcgc2hvdydcIildfT5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tc2Vjb25kYXJ5IGJ0bi1zbSBkcm9wZG93bi10b2dnbGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uVG9nZ2xlfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCIgYXJpYS1oYXNwb3B1cD1cInRydWVcIiBhcmlhLWV4cGFuZGVkPXtleHByKFwiZXhwYW5kZWRcIil9PntleHByKFwic2VsZWN0ZWRcIil9PC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkcm9wZG93bi1tZW51XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImRyb3Bkb3duLWl0ZW1cIiBocmVmPVwiXCIgb25DbGljaz17ZXhwcihcInNlbGVjdEl0ZW0gZXZlbnQgJ1hhbmlhJ1wiKX0+WGFuaWEgU29mdHdhcmU8L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImRyb3Bkb3duLWl0ZW1cIiBocmVmPVwiXCIgb25DbGljaz17ZXhwcihcInNlbGVjdEl0ZW0gZXZlbnQgJ1JpZGVyIEludGVybmF0aW9uYWwnXCIpfT5SaWRlciBJbnRlcm5hdGlvbjwvYT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJkcm9wZG93bi1kaXZpZGVyXCI+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImRyb3Bkb3duLWl0ZW1cIiBocmVmPVwiXCIgb25DbGljaz17ZXhwcihcInNlbGVjdEl0ZW0gZXZlbnQgJ0RhcndpbiBSZWNydWl0ZW1lbnQnXCIpfT5EYXJ3aW4gUmVjcnVpdGVtZW50PC9hPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHsgVGV4dEVkaXRvciwgQm9vbGVhbkVkaXRvciwgRHJvcERvd24sIFNlbGVjdCB9Il19