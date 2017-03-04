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
    }
    GraphApp.prototype.view = function (xania) {
        return (xania.tag(Canvas, null,
            xania.tag("div", { className: ["xania-diagram", compile_1.default("pressed -> ' pressed'")] },
                xania.tag(Draggable, { style: "background-color: yellow;" }),
                xania.tag("svg", null,
                    xania.tag("path", { d: "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80", stroke: "black", fill: "transparent" })))));
    };
    return GraphApp;
}());
exports.GraphApp = GraphApp;
var Canvas = (function () {
    function Canvas(attrs, children) {
        var _this = this;
        this.attrs = attrs;
        this.children = children;
        this.pressed = null;
        this.state = { left: 0, top: 0, clientX: 0, clientY: 0 };
        this.press = function (event) {
            event.stopPropagation();
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
                top: Canvas.prixels(top),
                left: Canvas.prixels(left),
                clientX: clientX,
                clientY: clientY
            };
            _this.pressed = target;
            console.log("init", _this.state, target);
        };
        this.release = function (event) {
            _this.pressed = null;
            _this.state = null;
        };
        this.drag = function (event) {
            if (!_this.pressed || event.buttons !== 1)
                return;
            var clientX = event.clientX, clientY = event.clientY;
            var _a = _this, pressed = _a.pressed, state = _a.state;
            if (clientX === state.clientX && clientY === state.clientY)
                return;
            state.left += clientX - state.clientX;
            state.top += clientY - state.clientY;
            pressed.style.left = state.left + "px";
            pressed.style.top = state.top + "px";
            state.clientX = clientX;
            state.clientY = clientY;
        };
    }
    Canvas.prixels = function (px) {
        return parseFloat(px.replace("px", "")) || 0;
    };
    Canvas.prototype.bind = function () {
        var tag = new dom_1.Dom.TagBinding("div", null, this.children.map(function (x) { return x.bind(); })), attrs = this.attrs;
        for (var prop in attrs) {
            if (attrs.hasOwnProperty(prop)) {
                var attrValue = attrs[prop];
                tag.attr(prop.toLowerCase(), attrValue);
            }
        }
        tag.event("mousedown", this.press);
        tag.event("mousemove", this.drag);
        tag.event("mouseup", this.release);
        return tag;
    };
    return Canvas;
}());
var Draggable = (function () {
    function Draggable(attrs, children) {
        this.attrs = attrs;
        this.children = children;
    }
    Draggable.prototype.bind = function () {
        var tag = new DraggableBinding(this.children.map(function (x) { return x.bind(); })), attrs = this.attrs;
        tag.attr("class", "xania-draggable");
        for (var prop in attrs) {
            if (attrs.hasOwnProperty(prop)) {
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
    function DraggableBinding(childBindings) {
        return _super.call(this, "div", null, childBindings) || this;
    }
    return DraggableBinding;
}(dom_1.Dom.TagBinding));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGliLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGliLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx5QkFBc0I7QUFFdEIsa0NBQWlDO0FBQ2pDLDBDQUFvQztBQUVwQztJQUFBO0lBYUEsQ0FBQztJQVpHLHVCQUFJLEdBQUosVUFBSyxLQUFLO1FBQ04sTUFBTSxDQUFDLENBQ0gsVUFBQyxNQUFNO1lBQ0gsbUJBQUssU0FBUyxFQUFFLENBQUMsZUFBZSxFQUFFLGlCQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztnQkFDL0QsVUFBQyxTQUFTLElBQUMsS0FBSyxFQUFDLDJCQUEyQixHQUFHO2dCQUMvQztvQkFDSSxvQkFBTSxDQUFDLEVBQUMsZ0RBQWdELEVBQUMsTUFBTSxFQUFDLE9BQU8sRUFBQyxJQUFJLEVBQUMsYUFBYSxHQUFHLENBQzNGLENBQ0osQ0FDRCxDQUNaLENBQUM7SUFDTixDQUFDO0lBQ0wsZUFBQztBQUFELENBQUMsQUFiRCxJQWFDO0FBYlksNEJBQVE7QUFlckI7SUFDSSxnQkFBb0IsS0FBSyxFQUFVLFFBQVE7UUFBM0MsaUJBQ0M7UUFEbUIsVUFBSyxHQUFMLEtBQUssQ0FBQTtRQUFVLGFBQVEsR0FBUixRQUFRLENBQUE7UUFHbkMsWUFBTyxHQUFRLElBQUksQ0FBQztRQUNwQixVQUFLLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFFcEQsVUFBSyxHQUFHLFVBQUEsS0FBSztZQUNqQixLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFbEIsSUFBQSx1QkFBTyxFQUFFLHVCQUFPLEVBQUUscUJBQU0sQ0FBVztZQUV6QyxHQUFHLENBQUM7Z0JBQ0EsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQkFDN0MsS0FBSyxDQUFDO2dCQUNWLE1BQU0sR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1lBQ2xDLENBQUMsUUFBUSxNQUFNLEVBQUU7WUFFakIsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7Z0JBQ1IsTUFBTSxDQUFDO1lBRVAsSUFBQSxvQ0FBK0MsRUFBN0MsWUFBRyxFQUFFLGNBQUksQ0FBcUM7WUFFcEQsS0FBSSxDQUFDLEtBQUssR0FBRztnQkFDVCxHQUFHLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7Z0JBQ3hCLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxTQUFBO2dCQUNQLE9BQU8sU0FBQTthQUNWLENBQUM7WUFDRixLQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxLQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRTVDLENBQUMsQ0FBQTtRQU1PLFlBQU8sR0FBRyxVQUFBLEtBQUs7WUFDbkIsS0FBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7WUFDcEIsS0FBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDdEIsQ0FBQyxDQUFBO1FBRU8sU0FBSSxHQUFHLFVBQUEsS0FBSztZQUNoQixFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUksQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sQ0FBQztZQUVMLElBQUEsdUJBQU8sRUFBRSx1QkFBTyxDQUFXO1lBQzdCLElBQUEsVUFBeUIsRUFBdkIsb0JBQU8sRUFBRSxnQkFBSyxDQUFVO1lBRTlCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUMsT0FBTyxJQUFJLE9BQU8sS0FBSyxLQUFLLENBQUMsT0FBTyxDQUFDO2dCQUN2RCxNQUFNLENBQUM7WUFFWCxLQUFLLENBQUMsSUFBSSxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO1lBQ3RDLEtBQUssQ0FBQyxHQUFHLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7WUFFckMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDdkMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7WUFFckMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDeEIsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDNUIsQ0FBQyxDQUFBO0lBM0RELENBQUM7SUFnQ00sY0FBTyxHQUFkLFVBQWUsRUFBVTtRQUNyQixNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUEyQkQscUJBQUksR0FBSjtRQUNJLElBQUksR0FBRyxHQUFHLElBQUksU0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFSLENBQVEsQ0FBQyxDQUFDLEVBQ3ZFLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBRXZCLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDckIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUIsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDNUMsQ0FBQztRQUNMLENBQUM7UUFFRCxHQUFHLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsR0FBRyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWxDLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVuQyxNQUFNLENBQUMsR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUNMLGFBQUM7QUFBRCxDQUFDLEFBakZELElBaUZDO0FBRUQ7SUFDSSxtQkFBb0IsS0FBSyxFQUFVLFFBQVE7UUFBdkIsVUFBSyxHQUFMLEtBQUssQ0FBQTtRQUFVLGFBQVEsR0FBUixRQUFRLENBQUE7SUFDM0MsQ0FBQztJQUVELHdCQUFJLEdBQUo7UUFDSSxJQUFJLEdBQUcsR0FBRyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFSLENBQVEsQ0FBQyxDQUFDLEVBQzVELEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBRXZCLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDckMsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNyQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QixFQUFFLENBQUMsQ0FBQyxJQUFJLEtBQUssV0FBVyxJQUFJLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxLQUFLLE9BQU8sQ0FBQztvQkFDakUsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLEdBQUcsU0FBUyxDQUFDLENBQUM7Z0JBQ3RELElBQUk7b0JBQ0EsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNMLENBQUM7UUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQXJCRCxJQXFCQztBQUVEO0lBQStCLG9DQUFjO0lBQ3pDLDBCQUFZLGFBQWE7ZUFDckIsa0JBQU0sS0FBSyxFQUFFLElBQUksRUFBRSxhQUFhLENBQUM7SUFDckMsQ0FBQztJQUNMLHVCQUFDO0FBQUQsQ0FBQyxBQUpELENBQStCLFNBQUcsQ0FBQyxVQUFVLEdBSTVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuL2RpYWdyYW0uY3NzJ1xyXG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gXCIuLi9zcmMvdGVtcGxhdGVcIjtcclxuaW1wb3J0IHsgRG9tIH0gZnJvbSBcIi4uL3NyYy9kb21cIjtcclxuaW1wb3J0IGNvbXBpbGUgZnJvbSBcIi4uL3NyYy9jb21waWxlXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBHcmFwaEFwcCB7XHJcbiAgICB2aWV3KHhhbmlhKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPENhbnZhcz5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtbXCJ4YW5pYS1kaWFncmFtXCIsIGNvbXBpbGUoXCJwcmVzc2VkIC0+ICcgcHJlc3NlZCdcIildfT5cclxuICAgICAgICAgICAgICAgICAgICA8RHJhZ2dhYmxlIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjogeWVsbG93O1wiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPHN2ZyA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMTAgODAgQyA0MCAxMCwgNjUgMTAsIDk1IDgwIFMgMTUwIDE1MCwgMTgwIDgwXCIgc3Ryb2tlPVwiYmxhY2tcIiBmaWxsPVwidHJhbnNwYXJlbnRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvc3ZnPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvQ2FudmFzPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIENhbnZhcyB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGF0dHJzLCBwcml2YXRlIGNoaWxkcmVuKSB7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwcmVzc2VkOiBhbnkgPSBudWxsO1xyXG4gICAgcHJpdmF0ZSBzdGF0ZSA9IHsgbGVmdDogMCwgdG9wOiAwLCBjbGllbnRYOiAwLCBjbGllbnRZOiAwIH07XHJcblxyXG4gICAgcHJpdmF0ZSBwcmVzcyA9IGV2ZW50ID0+IHtcclxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgdmFyIHsgY2xpZW50WCwgY2xpZW50WSwgdGFyZ2V0IH0gPSBldmVudDtcclxuXHJcbiAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICBpZiAodGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhcInhhbmlhLWRyYWdnYWJsZVwiKSlcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9IHdoaWxlICh0YXJnZXQpO1xyXG5cclxuICAgICAgICBpZiAoIXRhcmdldClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgeyB0b3AsIGxlZnQgfSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRhcmdldCk7XHJcblxyXG4gICAgICAgIHRoaXMuc3RhdGUgPSB7XHJcbiAgICAgICAgICAgIHRvcDogQ2FudmFzLnByaXhlbHModG9wKSxcclxuICAgICAgICAgICAgbGVmdDogQ2FudmFzLnByaXhlbHMobGVmdCksXHJcbiAgICAgICAgICAgIGNsaWVudFgsXHJcbiAgICAgICAgICAgIGNsaWVudFlcclxuICAgICAgICB9O1xyXG4gICAgICAgIHRoaXMucHJlc3NlZCA9IHRhcmdldDtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImluaXRcIiwgdGhpcy5zdGF0ZSwgdGFyZ2V0KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHByaXhlbHMocHg6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHB4LnJlcGxhY2UoXCJweFwiLCBcIlwiKSkgfHwgMDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlbGVhc2UgPSBldmVudCA9PiB7XHJcbiAgICAgICAgdGhpcy5wcmVzc2VkID0gbnVsbDtcclxuICAgICAgICB0aGlzLnN0YXRlID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRyYWcgPSBldmVudCA9PiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnByZXNzZWQgfHwgZXZlbnQuYnV0dG9ucyAhPT0gMSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgeyBjbGllbnRYLCBjbGllbnRZIH0gPSBldmVudDtcclxuICAgICAgICB2YXIgeyBwcmVzc2VkLCBzdGF0ZSB9ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGNsaWVudFggPT09IHN0YXRlLmNsaWVudFggJiYgY2xpZW50WSA9PT0gc3RhdGUuY2xpZW50WSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICBzdGF0ZS5sZWZ0ICs9IGNsaWVudFggLSBzdGF0ZS5jbGllbnRYO1xyXG4gICAgICAgIHN0YXRlLnRvcCArPSBjbGllbnRZIC0gc3RhdGUuY2xpZW50WTtcclxuXHJcbiAgICAgICAgcHJlc3NlZC5zdHlsZS5sZWZ0ID0gc3RhdGUubGVmdCArIFwicHhcIjtcclxuICAgICAgICBwcmVzc2VkLnN0eWxlLnRvcCA9IHN0YXRlLnRvcCArIFwicHhcIjtcclxuXHJcbiAgICAgICAgc3RhdGUuY2xpZW50WCA9IGNsaWVudFg7XHJcbiAgICAgICAgc3RhdGUuY2xpZW50WSA9IGNsaWVudFk7XHJcbiAgICB9XHJcblxyXG4gICAgYmluZCgpIHtcclxuICAgICAgICB2YXIgdGFnID0gbmV3IERvbS5UYWdCaW5kaW5nKFwiZGl2XCIsIG51bGwsIHRoaXMuY2hpbGRyZW4ubWFwKHggPT4geC5iaW5kKCkpKSxcclxuICAgICAgICAgICAgYXR0cnMgPSB0aGlzLmF0dHJzO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBwcm9wIGluIGF0dHJzKSB7XHJcbiAgICAgICAgICAgIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IGF0dHJzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgdGFnLmF0dHIocHJvcC50b0xvd2VyQ2FzZSgpLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0YWcuZXZlbnQoXCJtb3VzZWRvd25cIiwgdGhpcy5wcmVzcyk7XHJcbiAgICAgICAgdGFnLmV2ZW50KFwibW91c2Vtb3ZlXCIsIHRoaXMuZHJhZyk7XHJcbiAgICAgICAgLy9vbk1vdXNlTW92ZSA9IHsgY29tcGlsZShcInByZXNzZWQgLT4gZHJhZyBldmVudCBzdGF0ZVwiKX1cclxuICAgICAgICB0YWcuZXZlbnQoXCJtb3VzZXVwXCIsIHRoaXMucmVsZWFzZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0YWc7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIERyYWdnYWJsZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGF0dHJzLCBwcml2YXRlIGNoaWxkcmVuKSB7XHJcbiAgICB9XHJcblxyXG4gICAgYmluZCgpIHtcclxuICAgICAgICB2YXIgdGFnID0gbmV3IERyYWdnYWJsZUJpbmRpbmcodGhpcy5jaGlsZHJlbi5tYXAoeCA9PiB4LmJpbmQoKSkpLFxyXG4gICAgICAgICAgICBhdHRycyA9IHRoaXMuYXR0cnM7XHJcblxyXG4gICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgXCJ4YW5pYS1kcmFnZ2FibGVcIik7XHJcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhdHRycykge1xyXG4gICAgICAgICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyVmFsdWUgPSBhdHRyc1twcm9wXTtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wID09PSBcImNsYXNzTmFtZVwiIHx8IHByb3AgPT09IFwiY2xhc3NuYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGF6elwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgXCJ4YW5pYS1kcmFnZ2FibGUgXCIgKyBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKHByb3AudG9Mb3dlckNhc2UoKSwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRhZztcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgRHJhZ2dhYmxlQmluZGluZyBleHRlbmRzIERvbS5UYWdCaW5kaW5nIHtcclxuICAgIGNvbnN0cnVjdG9yKGNoaWxkQmluZGluZ3MpIHtcclxuICAgICAgICBzdXBlcihcImRpdlwiLCBudWxsLCBjaGlsZEJpbmRpbmdzKTtcclxuICAgIH1cclxufSJdfQ==