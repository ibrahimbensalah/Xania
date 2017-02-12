"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var reactive_1 = require("./reactive");
var Animate = (function () {
    function Animate(attrs, children) {
        this.attrs = attrs;
        this.children = children;
    }
    Animate.prototype.bind = function (visitor) {
        var bindings = this.children.map(function (x) { return x.bind(visitor); });
        return new AnimateBinding(this.attrs, bindings);
    };
    return Animate;
}());
exports.Animate = Animate;
var AnimateBinding = (function (_super) {
    __extends(AnimateBinding, _super);
    function AnimateBinding(attrs, childBindings) {
        var _this = _super.call(this) || this;
        _this.attrs = attrs;
        _this.domElements = [];
        _this.defaults = {
            transform: "translate3d(0, 0, 0) scale(0)",
            width: "0",
            height: "0"
        };
        _this.players = {};
        _this.values = {};
        _this.childBindings = childBindings;
        return _this;
    }
    Object.defineProperty(AnimateBinding.prototype, "length", {
        get: function () {
            var length = 0;
            for (var i = 0; i < this.childBindings.length; i++) {
                length += this.childBindings[i].length;
            }
            return length;
        },
        enumerable: true,
        configurable: true
    });
    AnimateBinding.prototype.update = function (context, driver) {
        _super.prototype.update.call(this, context, driver);
        for (var i = 0; i < this.childBindings.length; i++) {
            this.childBindings[i].update(context, this);
        }
        return this;
    };
    AnimateBinding.prototype.insert = function (binding, dom, idx) {
        this.driver.insert(this, dom, idx);
        this.domElements.push(dom);
        this.transform(dom, this.defaults);
    };
    AnimateBinding.prototype.transform = function (dom, defaults) {
        var values = this.values;
        if (Object.keys(values).length === 0)
            return;
        for (var k in values) {
            if (values.hasOwnProperty(k)) {
                var value = values[k];
                if (!value)
                    continue;
                var start = defaults[k] || this.defaults[k];
                var frames = (Array.isArray(value) ? value : [start, value]);
                var keyframes = frames.map(function (x) {
                    var frame = {};
                    frame[k] = x;
                    return frame;
                });
                if (this.players[k]) {
                    this.players[k].cancel();
                    delete this.players[k];
                }
                var timing = { duration: 200, iterations: 1, easing: 'ease-out' };
                var player = dom.animate(keyframes, timing);
                player.onfinish = (function (k, value) { return function (e) {
                    dom.style[k] = Array.isArray(value) ? value[value.length - 1] : value;
                }; })(k, value);
                this.players[k] = player;
            }
        }
    };
    AnimateBinding.prototype.render = function (context) {
        this.values = {};
        var attrs = this.attrs;
        for (var k in attrs) {
            if (attrs.hasOwnProperty(k) && k !== "dispose") {
                var v = this.evaluateObject(attrs[k]);
                this.values[k] = v;
            }
        }
        for (var i = 0; i < this.domElements.length && i < 1; i++) {
            var dom = this.domElements[i];
            this.transform(dom, window.getComputedStyle(dom));
        }
    };
    AnimateBinding.prototype.dispose = function () {
        var bindings = this.childBindings;
        this.childBindings = [];
        var dispose = this.attrs.dispose;
        if (!dispose) {
            for (var e = 0; e < bindings.length; e++) {
                var b = bindings[e];
                b.dispose();
            }
        }
        else {
            var counter = this.domElements.length;
            var onfinish = function () {
                counter--;
                if (counter === 0) {
                    for (var e = 0; e < bindings.length; e++) {
                        var b = bindings[e];
                        b.dispose();
                    }
                }
            };
            for (var i = 0; i < this.domElements.length; i++) {
                var dom = this.domElements[i];
                var timing = { duration: 200, iterations: 1 };
                var animation = dom.animate(dispose, timing);
                animation.onfinish = onfinish;
            }
        }
    };
    return AnimateBinding;
}(reactive_1.Reactive.Binding));
exports.AnimateBinding = AnimateBinding;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hbmltLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHVDQUFxQztBQUdyQztJQUNJLGlCQUFvQixLQUE4QixFQUFVLFFBQTBCO1FBQWxFLFVBQUssR0FBTCxLQUFLLENBQXlCO1FBQVUsYUFBUSxHQUFSLFFBQVEsQ0FBa0I7SUFDdEYsQ0FBQztJQUVELHNCQUFJLEdBQUosVUFBSyxPQUFPO1FBQ1IsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFmLENBQWUsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sQ0FBQyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFDTCxjQUFDO0FBQUQsQ0FBQyxBQVJELElBUUM7QUFSWSwwQkFBTztBQVVwQjtJQUFvQyxrQ0FBZ0I7SUFJaEQsd0JBQW9CLEtBQStCLEVBQUUsYUFBb0I7UUFBekUsWUFDSSxpQkFBTyxTQUVWO1FBSG1CLFdBQUssR0FBTCxLQUFLLENBQTBCO1FBRm5ELGlCQUFXLEdBQUcsRUFBRSxDQUFDO1FBOEJqQixjQUFRLEdBQUc7WUFDUCxTQUFTLEVBQUUsK0JBQStCO1lBQzFDLEtBQUssRUFBRSxHQUFHO1lBQ1YsTUFBTSxFQUFFLEdBQUc7U0FDZCxDQUFBO1FBc0NPLGFBQU8sR0FBRyxFQUFFLENBQUM7UUFDYixZQUFNLEdBQTRCLEVBQUUsQ0FBQztRQXJFekMsS0FBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7O0lBQ3ZDLENBQUM7SUFFRCxzQkFBSSxrQ0FBTTthQUFWO1lBQ0ksSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMs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QUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU5QixJQUFJLE1BQU0sR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDN0MsU0FBUyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDbEMsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBQ0wscUJBQUM7QUFBRCxDQUFDLEFBMUhELENBQW9DLG1CQUFRLENBQUMsT0FBTyxHQTBIbkQ7QUExSFksd0NBQWMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSZWFjdGl2ZSB9IGZyb20gXCIuL3JlYWN0aXZlXCJcclxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tIFwiLi90ZW1wbGF0ZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgQW5pbWF0ZSBpbXBsZW1lbnRzIFRlbXBsYXRlLklOb2RlIHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXR0cnM6IHsgdHJhbnNmb3JtPywgZGlzcG9zZT99LCBwcml2YXRlIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICB9XHJcblxyXG4gICAgYmluZCh2aXNpdG9yKSB7XHJcbiAgICAgICAgY29uc3QgYmluZGluZ3MgPSB0aGlzLmNoaWxkcmVuLm1hcCh4ID0+IHguYmluZCh2aXNpdG9yKSk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBBbmltYXRlQmluZGluZyh0aGlzLmF0dHJzLCBiaW5kaW5ncyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBbmltYXRlQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG5cclxuICAgIGRvbUVsZW1lbnRzID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhdHRyczogeyB0cmFuc2Zvcm0/LCBkaXNwb3NlPyB9LCBjaGlsZEJpbmRpbmdzOiBhbnlbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzID0gY2hpbGRCaW5kaW5ncztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxlbmd0aCArPSB0aGlzLmNoaWxkQmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICBzdXBlci51cGRhdGUoY29udGV4dCwgZHJpdmVyKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbaV0udXBkYXRlKGNvbnRleHQsIHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoYmluZGluZywgZG9tLCBpZHgpIHtcclxuICAgICAgICB0aGlzLmRyaXZlci5pbnNlcnQodGhpcywgZG9tLCBpZHgpO1xyXG4gICAgICAgIHRoaXMuZG9tRWxlbWVudHMucHVzaChkb20pO1xyXG5cclxuICAgICAgICB0aGlzLnRyYW5zZm9ybShkb20sIHRoaXMuZGVmYXVsdHMpO1xyXG4gICAgfVxyXG5cclxuICAgIGRlZmF1bHRzID0ge1xyXG4gICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUzZCgwLCAwLCAwKSBzY2FsZSgwKVwiLFxyXG4gICAgICAgIHdpZHRoOiBcIjBcIixcclxuICAgICAgICBoZWlnaHQ6IFwiMFwiXHJcbiAgICB9XHJcblxyXG4gICAgdHJhbnNmb3JtKGRvbSwgZGVmYXVsdHMpIHtcclxuICAgICAgICBsZXQgdmFsdWVzID0gdGhpcy52YWx1ZXM7XHJcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHZhbHVlcykubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIGZvciAodmFyIGsgaW4gdmFsdWVzKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZXMuaGFzT3duUHJvcGVydHkoaykpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1trXTtcclxuICAgICAgICAgICAgICAgIGlmICghdmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gZGVmYXVsdHNba10gfHwgdGhpcy5kZWZhdWx0c1trXTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZnJhbWVzID0gKEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiBbc3RhcnQsIHZhbHVlXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGtleWZyYW1lcyA9IGZyYW1lcy5tYXAoeCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZyYW1lID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgZnJhbWVba10gPSB4O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmcmFtZTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBsYXllcnNba10pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXllcnNba10uY2FuY2VsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMucGxheWVyc1trXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdGltaW5nID0geyBkdXJhdGlvbjogMjAwLCBpdGVyYXRpb25zOiAxLCBlYXNpbmc6ICdlYXNlLW91dCcgfTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXIgPSBkb20uYW5pbWF0ZShrZXlmcmFtZXMsIHRpbWluZyk7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIub25maW5pc2ggPSAoKGssIHZhbHVlKSA9PiBlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBkb20uc3R5bGVba10gPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlW3ZhbHVlLmxlbmd0aCAtIDFdIDogdmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9KShrLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllcnNba10gPSBwbGF5ZXI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwbGF5ZXJzID0ge307XHJcbiAgICBwcml2YXRlIHZhbHVlczogeyB0cmFuc2Zvcm0/OyBoZWlnaHQ/IH0gPSB7fTtcclxuICAgIHJlbmRlcihjb250ZXh0KSB7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcclxuICAgICAgICBsZXQgYXR0cnMgPSB0aGlzLmF0dHJzO1xyXG4gICAgICAgIGZvciAodmFyIGsgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KGspICYmIGsgIT09IFwiZGlzcG9zZVwiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHRoaXMuZXZhbHVhdGVPYmplY3QoYXR0cnNba10pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy52YWx1ZXNba10gPSB2O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZG9tRWxlbWVudHMubGVuZ3RoICYmIGkgPCAxOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGRvbSA9IHRoaXMuZG9tRWxlbWVudHNbaV07XHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNmb3JtKGRvbSwgd2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9tKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdmFyIGJpbmRpbmdzID0gdGhpcy5jaGlsZEJpbmRpbmdzO1xyXG4gICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncyA9IFtdO1xyXG4gICAgICAgIHZhciBkaXNwb3NlID0gdGhpcy5hdHRycy5kaXNwb3NlO1xyXG4gICAgICAgIGlmICghZGlzcG9zZSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBlID0gMDsgZSA8IGJpbmRpbmdzLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYjogYW55ID0gYmluZGluZ3NbZV07XHJcbiAgICAgICAgICAgICAgICBiLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBjb3VudGVyID0gdGhpcy5kb21FbGVtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHZhciBvbmZpbmlzaCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvdW50ZXItLTtcclxuICAgICAgICAgICAgICAgIGlmIChjb3VudGVyID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZSA9IDA7IGUgPCBiaW5kaW5ncy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYjogYW55ID0gYmluZGluZ3NbZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGIuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5kb21FbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvbSA9IHRoaXMuZG9tRWxlbWVudHNbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHRpbWluZyA9IHsgZHVyYXRpb246IDIwMCwgaXRlcmF0aW9uczogMSB9O1xyXG4gICAgICAgICAgICAgICAgdmFyIGFuaW1hdGlvbiA9IGRvbS5hbmltYXRlKGRpc3Bvc2UsIHRpbWluZyk7XHJcbiAgICAgICAgICAgICAgICBhbmltYXRpb24ub25maW5pc2ggPSBvbmZpbmlzaDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=