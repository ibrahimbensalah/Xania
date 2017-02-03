"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var template_1 = require("./template");
var dom_1 = require("./dom");
var fsharp_1 = require("./fsharp");
exports.fs = fsharp_1.fs;
var reactive_1 = require("./reactive");
exports.Reactive = reactive_1.Reactive;
var Xania = (function () {
    function Xania() {
    }
    Xania.templates = function (elements) {
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            var child = elements[i];
            if (child.accept)
                result.push(child);
            else {
                result.push(new template_1.Template.TextTemplate(child));
            }
        }
        return result;
    };
    Xania.tag = function (element, attr) {
        var children = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            children[_i - 2] = arguments[_i];
        }
        var childTemplates = this.templates(children);
        if (typeof element === "string") {
            var tag = new template_1.Template.TagTemplate(element, null, childTemplates);
            for (var prop in attr) {
                if (prop === "className" || prop === "classname" || prop === "clazz")
                    tag.attr("class", attr[prop]);
                else
                    tag.attr(prop, attr[prop]);
            }
            return tag;
        }
        else if (typeof element === "function") {
            return element(attr, childTemplates);
        }
    };
    Xania.view = function (tpl, dispatcher) {
        return dom_1.Dom.view(tpl, dispatcher);
    };
    return Xania;
}());
exports.Xania = Xania;
function ForEach(attr, children) {
    var tpl = new template_1.Template.FragmentTemplate(attr.expr || null);
    for (var i = 0; i < children.length; i++) {
        tpl.child(children[i]);
    }
    return tpl;
}
exports.ForEach = ForEach;
var View;
(function (View) {
    function partial(view, model) {
        return {
            accept: function () {
                return new PartialBinding(view, model);
            }
        };
    }
    View.partial = partial;
})(View = exports.View || (exports.View = {}));
var PartialBinding = (function (_super) {
    __extends(PartialBinding, _super);
    function PartialBinding(view, model) {
        var _this = _super.call(this) || this;
        _this.view = view;
        _this.model = model;
        return _this;
    }
    Object.defineProperty(PartialBinding.prototype, "template", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    PartialBinding.prototype.accept = function (visitor, options) {
        return this;
    };
    PartialBinding.prototype.map = function (parent) {
        this.parent = parent;
        if (this.binding)
            this.binding.map(this);
        return this;
    };
    PartialBinding.prototype.insert = function (_, dom, idx) {
        this.parent.insert(this, dom, idx);
    };
    PartialBinding.prototype.render = function (context) {
        var view = this.evaluate(this.view).valueOf();
        if (this.binding)
            this.binding.dispose();
        this.binding = new dom_1.Dom.FragmentBinding(this.model, [view])
            .map(this);
        this.binding.update(context);
    };
    return PartialBinding;
}(reactive_1.Reactive.Binding));
exports.PartialBinding = PartialBinding;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMveGFuaWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdUNBQXFDO0FBQ3JDLDZCQUEyQjtBQUMzQixtQ0FBNkI7QUFtR3BCLHlCQUFFO0FBbEdYLHVDQUFxQztBQWtHeEIsdUNBQVE7QUFoR3JCO0lBQUE7SUFrQ0EsQ0FBQztJQWpDVSxlQUFTLEdBQWhCLFVBQWlCLFFBQVE7UUFDckIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3ZDLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4QixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLENBQUM7Z0JBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLG1CQUFRLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDbEQsQ0FBQztRQUNMLENBQUM7UUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFDTSxTQUFHLEdBQVYsVUFBVyxPQUFPLEVBQUUsSUFBSTtRQUFFLGtCQUFXO2FBQVgsVUFBVyxFQUFYLHFCQUFXLEVBQVgsSUFBVztZQUFYLGlDQUFXOztRQUNqQyxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTlDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDOUIsSUFBSSxHQUFHLEdBQUcsSUFBSSxtQkFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUs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QUFNLEdBQU4sVUFBTyxPQUFPO1FBQ1YsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFOUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNiLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLFNBQUcsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3JELEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFDTCxxQkFBQztBQUFELENBQUMsQUFyQ0QsQ0FBb0MsbUJBQVEsQ0FBQyxPQUFPLEdBcUNuRDtBQXJDWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRlbXBsYXRlIH0gZnJvbSBcIi4vdGVtcGxhdGVcIlxyXG5pbXBvcnQgeyBEb20gfSBmcm9tIFwiLi9kb21cIlxyXG5pbXBvcnQgeyBmcyB9IGZyb20gXCIuL2ZzaGFycFwiXHJcbmltcG9ydCB7IFJlYWN0aXZlIH0gZnJvbSBcIi4vcmVhY3RpdmVcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFhhbmlhIHtcclxuICAgIHN0YXRpYyB0ZW1wbGF0ZXMoZWxlbWVudHMpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBlbGVtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGlsZC5hY2NlcHQpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFRlbXBsYXRlLlRleHRUZW1wbGF0ZShjaGlsZCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgdGFnKGVsZW1lbnQsIGF0dHIsIC4uLmNoaWxkcmVuKTogVGVtcGxhdGUuSU5vZGUge1xyXG4gICAgICAgIHZhciBjaGlsZFRlbXBsYXRlcyA9IHRoaXMudGVtcGxhdGVzKGNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGVtcGxhdGUuVGFnVGVtcGxhdGUoZWxlbWVudCwgbnVsbCwgY2hpbGRUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGF0dHIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wID09PSBcImNsYXNzTmFtZVwiIHx8IHByb3AgPT09IFwiY2xhc3NuYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGF6elwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgYXR0cltwcm9wXSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIocHJvcCwgYXR0cltwcm9wXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50KGF0dHIsIGNoaWxkVGVtcGxhdGVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgdmlldyh0cGw6IFRlbXBsYXRlLklOb2RlLCBkaXNwYXRjaGVyPykge1xyXG4gICAgICAgIHJldHVybiBEb20udmlldyh0cGwsIGRpc3BhdGNoZXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEZvckVhY2goYXR0ciwgY2hpbGRyZW4pIHtcclxuICAgIHZhciB0cGwgPSBuZXcgVGVtcGxhdGUuRnJhZ21lbnRUZW1wbGF0ZShhdHRyLmV4cHIgfHwgbnVsbCk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRwbC5jaGlsZChjaGlsZHJlbltpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxufVxyXG5cclxuZXhwb3J0IG1vZHVsZSBWaWV3IHtcclxuICAgIGV4cG9ydCBmdW5jdGlvbiBwYXJ0aWFsKHZpZXcsIG1vZGVsKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgYWNjZXB0KCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQYXJ0aWFsQmluZGluZyh2aWV3LCBtb2RlbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQYXJ0aWFsQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBwYXJlbnQ7XHJcbiAgICBwcml2YXRlIGJpbmRpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB2aWV3LCBwcml2YXRlIG1vZGVsKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgdGVtcGxhdGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYWNjZXB0KHZpc2l0b3IsIG9wdGlvbnM6IGFueSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIG1hcChwYXJlbnQpIHtcclxuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuICAgICAgICBpZiAodGhpcy5iaW5kaW5nKVxyXG4gICAgICAgICAgICB0aGlzLmJpbmRpbmcubWFwKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChfLCBkb20sIGlkeCkge1xyXG4gICAgICAgIHRoaXMucGFyZW50Lmluc2VydCh0aGlzLCBkb20sIGlkeCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgdmlldyA9IHRoaXMuZXZhbHVhdGUodGhpcy52aWV3KS52YWx1ZU9mKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJpbmRpbmcpXHJcbiAgICAgICAgICAgIHRoaXMuYmluZGluZy5kaXNwb3NlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZGluZyA9IG5ldyBEb20uRnJhZ21lbnRCaW5kaW5nKHRoaXMubW9kZWwsIFt2aWV3XSlcclxuICAgICAgICAgICAgLm1hcCh0aGlzKTtcclxuICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlKGNvbnRleHQpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgeyBmcywgUmVhY3RpdmUgfVxyXG4iXX0=