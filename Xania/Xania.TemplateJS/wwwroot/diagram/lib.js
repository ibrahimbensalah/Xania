"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
require("./diagram.css");
var dom_1 = require("../src/dom");
var compile_1 = require("../src/compile");
var GraphApp = (function () {
    function GraphApp() {
        this.P1 = { x: 0, y: 0 };
        this.P2 = { x: 250, y: 200 };
    }
    GraphApp.horizontalArrow = function (_a, _b) {
        var x1 = _a.x, y1 = _a.y;
        var x2 = _b.x, y2 = _b.y;
        var d = (x2 - x1) / 2;
        return "m" + x1 + "," + y1 + " C" + (x1 + d) + "," + y1 + " " + (x2 - d) + "," + y2 + " " + x2 + "," + y2;
    };
    GraphApp.input = function (x, y) {
        return { x: x, y: y + 50 };
    };
    GraphApp.output = function (x, y) {
        return { x: x + 100, y: y + 50 };
    };
    GraphApp.prototype.view = function (xania) {
        return (xania.tag("div", { style: "height: 100%;" },
            xania.tag("div", null,
                compile_1.default("P1.x"),
                " ",
                compile_1.default("P1.y")),
            xania.tag("div", { className: ["xania-diagram", compile_1.default("pressed -> ' pressed'")] },
                xania.tag(Draggable, { x: compile_1.default("P1.x"), y: compile_1.default("P1.y"), style: "background-color: blue;" }),
                xania.tag(Draggable, { x: compile_1.default("P2.x"), y: compile_1.default("P2.y"), style: "background-color: orange;" }),
                xania.tag(Draggable, { x: 0, y: compile_1.default("P1.y + 200"), style: "background-color: green;" }),
                xania.tag(Draggable, { x: compile_1.default("P1.x + 250"), y: 0, style: "background-color: red;" }),
                xania.tag("svg", null,
                    xania.tag("g", null,
                        xania.tag("path", { d: compile_1.default("horizontalArrow (output P1.x P1.y) (input P2.x P2.y)"), stroke: "blue" }),
                        xania.tag("path", { d: compile_1.default("horizontalArrow (output 0 (P1.y + 200)) (input P2.x P2.y)"), stroke: "green" }),
                        xania.tag("path", { d: compile_1.default("horizontalArrow (output P1.x P1.y) (input (P1.x + 250) 0)"), stroke: "red" }))))));
    };
    return GraphApp;
}());
exports.GraphApp = GraphApp;
var Draggable = (function () {
    function Draggable(attrs, children) {
        this.attrs = attrs;
        this.children = children;
    }
    Draggable.prototype.bind = function () {
        var tag = new DraggableBinding(this.attrs, this.children.map(function (x) { return x.bind(); })), attrs = this.attrs;
        tag.attr("class", "xania-draggable");
        for (var prop in attrs) {
            if (attrs.hasOwnProperty(prop) && prop !== "x" && prop !== "y") {
                var attrValue = attrs[prop];
                if (prop === "className" || prop === "classname" || prop === "clazz")
                    tag.attr("class", "xania-draggable " + attrValue);
                else
                    tag.attr(prop.toLowerCase(), attrValue);
            }
        }
        return tag;
    };
    return Draggable;
}());
var DraggableBinding = (function (_super) {
    __extends(DraggableBinding, _super);
    function DraggableBinding(props, childBindings) {
        var _this = _super.call(this, "div", null, childBindings) || this;
        _this.props = props;
        _this.pressed = null;
        _this.state = { left: 0, top: 0, clientX: 0, clientY: 0 };
        _this.press = function (event) {
            var clientX = event.clientX, clientY = event.clientY, target = event.target;
            do {
                if (target.classList.contains("xania-draggable"))
                    break;
                target = target.parentElement;
            } while (target);
            if (!target)
                return;
            var _a = window.getComputedStyle(target), top = _a.top, left = _a.left;
            _this.state = {
                top: DraggableBinding.prixels(top),
                left: DraggableBinding.prixels(left),
                clientX: clientX,
                clientY: clientY
            };
            _this.pressed = target;
        };
        _this.release = function () {
            _this.pressed = null;
            _this.state = null;
        };
        _this.drag = function (event) {
            if (event.buttons !== 1)
                return;
            var clientX = event.clientX, clientY = event.clientY;
            var state = _this.state;
            if (!state)
                return;
            var left = state.left + clientX - state.clientX;
            var top = state.top + clientY - state.clientY;
            if (state.left !== left || state.top !== top) {
                state.clientX = clientX;
                state.clientY = clientY;
                state.left = left;
                state.top = top;
                var x = _this.evaluateObject(_this.props.x);
                var y = _this.evaluateObject(_this.props.y);
                if (typeof x.set === "function")
                    x.set(left);
                if (typeof y.set === "function")
                    y.set(top);
            }
        };
        _this.event("mousedown", _this.press);
        _this.event("mousemove", _this.drag);
        _this.event("mouseup", _this.release);
        return _this;
    }
    DraggableBinding.prixels = function (px) {
        return parseFloat(px.replace("px", "")) || 0;
    };
    DraggableBinding.prototype.render = function (context, driver) {
        _super.prototype.render.call(this, context, driver);
        var x = this.evaluateText(this.props.x);
        var y = this.evaluateText(this.props.y);
        var style = this.tagNode.style;
        style.left = x + "px";
        style.top = y + "px";
    };
    return DraggableBinding;
}(dom_1.Dom.TagBinding));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGliLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx5QkFBc0I7QUFFdEIsa0NBQWlDO0FBQ2pDLDBDQUFrQztBQUVsQztJQUFBO1FBRVksT0FBRSxHQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDM0IsT0FBRSxHQUFVLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFtQzNDLENBQUM7SUFqQ1Usd0JBQWUsR0FBdEIsVUFBdUIsRUFBYyxFQUFFLEVBQWM7WUFBN0IsU0FBSyxFQUFFLFNBQUs7WUFBSSxTQUFLLEVBQUUsU0FBSztRQUNoRCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEIsTUFBTSxDQUFDLE1BQUksRUFBRSxTQUFJLEVBQUUsV0FBSyxFQUFFLEdBQUcsQ0FBQyxVQUFJLEVBQUUsVUFBSSxFQUFFLEdBQUcsQ0FBQyxVQUFJLEVBQUUsU0FBSSxFQUFFLFNBQUksRUFBSSxDQUFDO0lBQ3ZFLENBQUM7SUFFTSxjQUFLLEdBQVosVUFBYSxDQUFDLEVBQUUsQ0FBQztRQUNiLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBQSxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVNLGVBQU0sR0FBYixVQUFjLENBQUMsRUFBRSxDQUFDO1FBQ2QsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0lBRUQsdUJBQUksR0FBSixVQUFLLEtBQUs7UUFDTixNQUFNLENBQUMsQ0FDSCxtQkFBSyxLQUFLLEVBQUMsZUFBZTtZQUN0QjtnQkFBTSxpQkFBSSxDQUFDLE1B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QUFDLFdBQVcsRUFBRSxLQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsS0FBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsS0FBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25DLEtBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzs7SUFDeEMsQ0FBQztJQTRCTSx3QkFBTyxHQUFkLFVBQWUsRUFBVTtRQUNyQixNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFtQ0QsaUNBQU0sR0FBTixVQUFPLE9BQU8sRUFBRSxNQUFNO1FBQ2xCLGlCQUFNLE1BQU0sWUFBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFOUIsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV4QyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUMvQixLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDdEIsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLENBQUM7SUFDTCx1QkFBQztBQUFELENBQUMsQUFqRkQsQ0FBK0IsU0FBRyxDQUFDLFVBQVUsR0FpRjVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuL2RpYWdyYW0uY3NzJ1xyXG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gXCIuLi9zcmMvdGVtcGxhdGVcIjtcclxuaW1wb3J0IHsgRG9tIH0gZnJvbSBcIi4uL3NyYy9kb21cIjtcclxuaW1wb3J0IGV4cHIgZnJvbSBcIi4uL3NyYy9jb21waWxlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgR3JhcGhBcHAge1xyXG5cclxuICAgIHByaXZhdGUgUDE6IFBvaW50ID0geyB4OiAwLCB5OiAwIH07XHJcbiAgICBwcml2YXRlIFAyOiBQb2ludCA9IHsgeDogMjUwLCB5OiAyMDAgfTtcclxuXHJcbiAgICBzdGF0aWMgaG9yaXpvbnRhbEFycm93KHt4OiB4MSwgeTogeTF9LCB7eDogeDIsIHk6IHkyfSkge1xyXG4gICAgICAgIHZhciBkID0gKHgyIC0geDEpIC8gMjtcclxuICAgICAgICByZXR1cm4gYG0ke3gxfSwke3kxfSBDJHt4MSArIGR9LCR7eTF9ICR7eDIgLSBkfSwke3kyfSAke3gyfSwke3kyfWA7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGlucHV0KHgsIHkpIHtcclxuICAgICAgICByZXR1cm4geyB4LCB5OiB5ICsgNTAgfTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgb3V0cHV0KHgsIHkpIHtcclxuICAgICAgICByZXR1cm4geyB4OiB4ICsgMTAwLCB5OiB5ICsgNTAgfTtcclxuICAgIH1cclxuXHJcbiAgICB2aWV3KHhhbmlhKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cImhlaWdodDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgIDxkaXY+e2V4cHIoXCJQMS54XCIpfSB7ZXhwcihcIlAxLnlcIil9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17W1wieGFuaWEtZGlhZ3JhbVwiLCBleHByKFwicHJlc3NlZCAtPiAnIHByZXNzZWQnXCIpXX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPERyYWdnYWJsZSB4PXtleHByKFwiUDEueFwiKX0geT17ZXhwcihcIlAxLnlcIil9IHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogYmx1ZTtcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDxEcmFnZ2FibGUgeD17ZXhwcihcIlAyLnhcIil9IHk9e2V4cHIoXCJQMi55XCIpfSBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6IG9yYW5nZTtcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDxEcmFnZ2FibGUgeD17MH0geT17ZXhwcihcIlAxLnkgKyAyMDBcIil9IHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogZ3JlZW47XCIgLz5cclxuICAgICAgICAgICAgICAgICAgICA8RHJhZ2dhYmxlIHg9e2V4cHIoXCJQMS54ICsgMjUwXCIpfSB5PXswfSBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6IHJlZDtcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzdmc+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxnPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD17ZXhwcihcImhvcml6b250YWxBcnJvdyAob3V0cHV0IFAxLnggUDEueSkgKGlucHV0IFAyLnggUDIueSlcIil9IHN0cm9rZT1cImJsdWVcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD17ZXhwcihcImhvcml6b250YWxBcnJvdyAob3V0cHV0IDAgKFAxLnkgKyAyMDApKSAoaW5wdXQgUDIueCBQMi55KVwiKX0gc3Ryb2tlPVwiZ3JlZW5cIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD17ZXhwcihcImhvcml6b250YWxBcnJvdyAob3V0cHV0IFAxLnggUDEueSkgKGlucHV0IChQMS54ICsgMjUwKSAwKVwiKX0gc3Ryb2tlPVwicmVkXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9nPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmludGVyZmFjZSBQb2ludCB7XHJcbiAgICB4OiBudW1iZXI7XHJcbiAgICB5OiBudW1iZXI7XHJcbn1cclxuXHJcbmNsYXNzIERyYWdnYWJsZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGF0dHJzLCBwcml2YXRlIGNoaWxkcmVuKSB7XHJcbiAgICB9XHJcblxyXG4gICAgYmluZCgpIHtcclxuICAgICAgICB2YXIgdGFnID0gbmV3IERyYWdnYWJsZUJpbmRpbmcodGhpcy5hdHRycywgdGhpcy5jaGlsZHJlbi5tYXAoeCA9PiB4LmJpbmQoKSkpLFxyXG4gICAgICAgICAgICBhdHRycyA9IHRoaXMuYXR0cnM7XHJcblxyXG4gICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgXCJ4YW5pYS1kcmFnZ2FibGVcIik7XHJcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhdHRycykge1xyXG4gICAgICAgICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkocHJvcCkgJiYgcHJvcCAhPT0gXCJ4XCIgJiYgcHJvcCAhPT0gXCJ5XCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyVmFsdWUgPSBhdHRyc1twcm9wXTtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wID09PSBcImNsYXNzTmFtZVwiIHx8IHByb3AgPT09IFwiY2xhc3NuYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGF6elwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgXCJ4YW5pYS1kcmFnZ2FibGUgXCIgKyBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKHByb3AudG9Mb3dlckNhc2UoKSwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRhZztcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgRHJhZ2dhYmxlQmluZGluZyBleHRlbmRzIERvbS5UYWdCaW5kaW5nIHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcHJvcHMsIGNoaWxkQmluZGluZ3MpIHtcclxuICAgICAgICBzdXBlcihcImRpdlwiLCBudWxsLCBjaGlsZEJpbmRpbmdzKTtcclxuICAgICAgICB0aGlzLmV2ZW50KFwibW91c2Vkb3duXCIsIHRoaXMucHJlc3MpO1xyXG4gICAgICAgIHRoaXMuZXZlbnQoXCJtb3VzZW1vdmVcIiwgdGhpcy5kcmFnKTtcclxuICAgICAgICB0aGlzLmV2ZW50KFwibW91c2V1cFwiLCB0aGlzLnJlbGVhc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcHJlc3NlZDogYW55ID0gbnVsbDtcclxuICAgIHByaXZhdGUgc3RhdGUgPSB7IGxlZnQ6IDAsIHRvcDogMCwgY2xpZW50WDogMCwgY2xpZW50WTogMCB9O1xyXG5cclxuICAgIHByaXZhdGUgcHJlc3MgPSBldmVudCA9PiB7XHJcbiAgICAgICAgdmFyIHsgY2xpZW50WCwgY2xpZW50WSwgdGFyZ2V0IH0gPSBldmVudDtcclxuXHJcbiAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICBpZiAodGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcInhhbmlhLWRyYWdnYWJsZVwiKSlcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9IHdoaWxlICh0YXJnZXQpO1xyXG5cclxuICAgICAgICBpZiAoIXRhcmdldClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgeyB0b3AsIGxlZnQgfSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCk7XHJcblxyXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XHJcbiAgICAgICAgICAgIHRvcDogRHJhZ2dhYmxlQmluZGluZy5wcml4ZWxzKHRvcCksXHJcbiAgICAgICAgICAgIGxlZnQ6IERyYWdnYWJsZUJpbmRpbmcucHJpeGVscyhsZWZ0KSxcclxuICAgICAgICAgICAgY2xpZW50WCxcclxuICAgICAgICAgICAgY2xpZW50WVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5wcmVzc2VkID0gdGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBwcml4ZWxzKHB4OiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChweC5yZXBsYWNlKFwicHhcIiwgXCJcIikpIHx8IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZWxlYXNlID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMucHJlc3NlZCA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkcmFnID0gZXZlbnQgPT4ge1xyXG4gICAgICAgIGlmIChldmVudC5idXR0b25zICE9PSAxKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciB7IGNsaWVudFgsIGNsaWVudFkgfSA9IGV2ZW50O1xyXG4gICAgICAgIHZhciB7IHN0YXRlIH0gPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBsZWZ0ID0gc3RhdGUubGVmdCArIGNsaWVudFggLSBzdGF0ZS5jbGllbnRYO1xyXG4gICAgICAgIHZhciB0b3AgPSBzdGF0ZS50b3AgKyBjbGllbnRZIC0gc3RhdGUuY2xpZW50WTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlLmxlZnQgIT09IGxlZnQgfHwgc3RhdGUudG9wICE9PSB0b3ApIHtcclxuICAgICAgICAgICAgc3RhdGUuY2xpZW50WCA9IGNsaWVudFg7XHJcbiAgICAgICAgICAgIHN0YXRlLmNsaWVudFkgPSBjbGllbnRZO1xyXG4gICAgICAgICAgICBzdGF0ZS5sZWZ0ID0gbGVmdDtcclxuICAgICAgICAgICAgc3RhdGUudG9wID0gdG9wO1xyXG5cclxuICAgICAgICAgICAgdmFyIHggPSB0aGlzLmV2YWx1YXRlT2JqZWN0KHRoaXMucHJvcHMueCk7XHJcbiAgICAgICAgICAgIHZhciB5ID0gdGhpcy5ldmFsdWF0ZU9iamVjdCh0aGlzLnByb3BzLnkpO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHguc2V0ID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICB4LnNldChsZWZ0KTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB5LnNldCA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgeS5zZXQodG9wKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHN1cGVyLnJlbmRlcihjb250ZXh0LCBkcml2ZXIpO1xyXG5cclxuICAgICAgICB2YXIgeCA9IHRoaXMuZXZhbHVhdGVUZXh0KHRoaXMucHJvcHMueCk7XHJcbiAgICAgICAgdmFyIHkgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLnByb3BzLnkpO1xyXG5cclxuICAgICAgICB2YXIgc3R5bGUgPSB0aGlzLnRhZ05vZGUuc3R5bGU7XHJcbiAgICAgICAgc3R5bGUubGVmdCA9IHggKyBcInB4XCI7XHJcbiAgICAgICAgc3R5bGUudG9wID0geSArIFwicHhcIjtcclxuICAgIH1cclxufSJdfQ==