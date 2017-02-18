"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var template_1 = require("./template");
exports.Template = template_1.Template;
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
            if (child.bind)
                result.push(child);
            else {
                result.push(new template_1.Template.TextTemplate(child));
            }
        }
        return result;
    };
    Xania.tag = function (element, attrs) {
        var children = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            children[_i - 2] = arguments[_i];
        }
        var childTemplates = this.templates(children);
        if (element instanceof template_1.Template.TagTemplate) {
            return element;
        }
        else if (typeof element === "string") {
            var ns = Xania.svgElements.indexOf(element) >= 0 ? "http://www.w3.org/2000/svg" : null;
            var tag = new template_1.Template.TagTemplate(element, ns, childTemplates);
            if (attrs) {
                for (var prop in attrs) {
                    if (attrs.hasOwnProperty(prop)) {
                        var attrValue = attrs[prop];
                        if (prop === "className" || prop === "classname" || prop === "clazz")
                            tag.attr("class", attrValue);
                        else
                            tag.attr(prop, attrValue);
                    }
                }
                if (typeof attrs.name === "string") {
                    if (attrs.type === "text") {
                        if (!attrs.value) {
                            tag.attr("value", fsharp_1.fs(attrs.name));
                        }
                    }
                }
            }
            return tag;
        }
        else if (typeof element === "function") {
            if (element.prototype.bind) {
                return Reflect.construct(element, [attrs, childTemplates]);
            }
            else if (element.prototype.view) {
                return new ComponentBinding(Reflect.construct(element, [attrs, childTemplates]), attrs);
            }
            else {
                var view = element(attrs, childTemplates);
                if (!view)
                    throw new Error("Failed to load view");
                return view;
            }
        }
        else if (typeof element.render === "function") {
            var tpl = element.render();
            return View.partial(tpl, new reactive_1.Reactive.Store(element));
        }
        else {
            throw Error("tag unresolved");
        }
    };
    Xania.view = function (tpl) {
        return dom_1.Dom.view(tpl);
    };
    return Xania;
}());
Xania.svgElements = ["svg", "circle", "line", "g"];
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
            bind: function () {
                var binding = new PartialBinding(view, model);
                if (view.subscribe)
                    view.subscribe(binding);
                if (model.subscribe)
                    model.subscribe(binding);
                return binding;
            }
        };
    }
    View.partial = partial;
})(View = exports.View || (exports.View = {}));
var ComponentBinding = (function (_super) {
    __extends(ComponentBinding, _super);
    function ComponentBinding(component, props) {
        var _this = _super.call(this) || this;
        _this.component = component;
        _this.props = props;
        _this.store = new reactive_1.Reactive.Store(_this.component);
        _this.binding = new dom_1.Dom.FragmentBinding(null, [component.view(Xania)]);
        return _this;
    }
    ComponentBinding.prototype.bind = function () {
        return this;
    };
    ComponentBinding.prototype.update = function (context, driver) {
        var props = this.props;
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                var expr = props[prop];
                var value = expr.execute(this, context).valueOf();
                this.component[prop] = value;
            }
        }
        this.binding.update(this.store, driver);
        _super.prototype.update.call(this, context, driver);
        return this;
    };
    ComponentBinding.prototype.render = function () {
    };
    ComponentBinding.prototype.dispose = function () {
        this.binding.dispose();
    };
    return ComponentBinding;
}(reactive_1.Reactive.Binding));
var PartialBinding = (function (_super) {
    __extends(PartialBinding, _super);
    function PartialBinding(view, model) {
        var _this = _super.call(this) || this;
        _this.view = view;
        _this.model = model;
        _this.cache = [];
        return _this;
    }
    PartialBinding.prototype.render = function (context, parent) {
        var view = this.evaluateObject(this.view).valueOf();
        if (!view)
            throw new Error("view is empty");
        if (this.binding) {
            this.binding.dispose();
        }
        var newBinding = new dom_1.Dom.FragmentBinding(this.model, [view]);
        this.binding = newBinding;
        this.binding.update(context, parent);
    };
    PartialBinding.prototype.onNext = function (_) {
        this.execute();
    };
    return PartialBinding;
}(reactive_1.Reactive.Binding));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4YW5pYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1Q0FBcUM7QUFnS2QsdUNBQVE7QUEvSi9CLDZCQUEyQjtBQUMzQixtQ0FBNkI7QUE4SnBCLHlCQUFFO0FBN0pYLHVDQUFxQztBQTZKeEIsdUNBQVE7QUEzSnJCO0lBQUE7SUFpRUEsQ0FBQztJQWhFVSxlQUFTLEdBQWhCLFVBQWlCLFFBQVE7UUFDckIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3ZDLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4QixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNYLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLENBQUM7Z0JBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLG1CQUFRLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDbEQsQ0FBQztRQUNMLENBQUM7UUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFHTSxTQUFHLEdBQVYsVUFBVyxPQUFPLEVBQUUsS0FBSztRQUFFLGtCQUFXO2FBQVgsVUFBVyxFQUFYLHFCQUFXLEVBQVgsSUFBVztZQUFYLGlDQUFXOztRQUNsQyxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTlDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sWUFBWSxtQkFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUNuQixDQUFDO1FBQUMsSUFBSSxD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QUMsT0FBTyxHQUFHLFVBQVUsQ0FBQztRQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVELCtCQUFNLEdBQU4sVUFBTyxDQUFDO1FBQ0osSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFDTCxxQkFBQztBQUFELENBQUMsQUExQkQsQ0FBNkIsbUJBQVEsQ0FBQyxPQUFPLEdBMEI1QyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRlbXBsYXRlIH0gZnJvbSBcIi4vdGVtcGxhdGVcIlxyXG5pbXBvcnQgeyBEb20gfSBmcm9tIFwiLi9kb21cIlxyXG5pbXBvcnQgeyBmcyB9IGZyb20gXCIuL2ZzaGFycFwiXHJcbmltcG9ydCB7IFJlYWN0aXZlIH0gZnJvbSBcIi4vcmVhY3RpdmVcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFhhbmlhIHtcclxuICAgIHN0YXRpYyB0ZW1wbGF0ZXMoZWxlbWVudHMpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBlbGVtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGlsZC5iaW5kKVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBUZW1wbGF0ZS5UZXh0VGVtcGxhdGUoY2hpbGQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHN2Z0VsZW1lbnRzID0gW1wic3ZnXCIsIFwiY2lyY2xlXCIsIFwibGluZVwiLCBcImdcIl07XHJcblxyXG4gICAgc3RhdGljIHRhZyhlbGVtZW50LCBhdHRycywgLi4uY2hpbGRyZW4pOiBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFRlbXBsYXRlLlRhZ1RlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdmFyIG5zID0gWGFuaWEuc3ZnRWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA+PSAwID8gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIDogbnVsbDtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUZW1wbGF0ZS5UYWdUZW1wbGF0ZShlbGVtZW50LCBucywgY2hpbGRUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICBpZiAoYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IGF0dHJzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcCA9PT0gXCJjbGFzc05hbWVcIiB8fCBwcm9wID09PSBcImNsYXNzbmFtZVwiIHx8IHByb3AgPT09IFwiY2xhenpcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIocHJvcCwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF0dHJzLm5hbWUgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMudHlwZSA9PT0gXCJ0ZXh0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhdHRycy52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIoXCJ2YWx1ZVwiLCBmcyhhdHRycy5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnByb3RvdHlwZS5iaW5kKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3QoZWxlbWVudCwgW2F0dHJzLCBjaGlsZFRlbXBsYXRlc10pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQucHJvdG90eXBlLnZpZXcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50QmluZGluZyhSZWZsZWN0LmNvbnN0cnVjdChlbGVtZW50LCBbYXR0cnMsIGNoaWxkVGVtcGxhdGVzXSksIGF0dHJzKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciB2aWV3ID0gZWxlbWVudChhdHRycywgY2hpbGRUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF2aWV3KVxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBsb2FkIHZpZXdcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmlldztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQucmVuZGVyID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgdmFyIHRwbCA9IGVsZW1lbnQucmVuZGVyKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBWaWV3LnBhcnRpYWwodHBsLCBuZXcgUmVhY3RpdmUuU3RvcmUoZWxlbWVudCkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwidGFnIHVucmVzb2x2ZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgc3RhdGljIHZpZXcodHBsOiBUZW1wbGF0ZS5JTm9kZSkge1xyXG4gICAgICAgIHJldHVybiBEb20udmlldyh0cGwpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gRm9yRWFjaChhdHRyLCBjaGlsZHJlbikge1xyXG4gICAgdmFyIHRwbCA9IG5ldyBUZW1wbGF0ZS5GcmFnbWVudFRlbXBsYXRlKGF0dHIuZXhwciB8fCBudWxsKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdHBsLmNoaWxkKGNoaWxkcmVuW2ldKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHBsO1xyXG59XHJcblxyXG5leHBvcnQgbW9kdWxlIFZpZXcge1xyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHBhcnRpYWwodmlldywgbW9kZWwpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBiaW5kKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgUGFydGlhbEJpbmRpbmcodmlldywgbW9kZWwpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZpZXcuc3Vic2NyaWJlKSB2aWV3LnN1YnNjcmliZShiaW5kaW5nKTtcclxuICAgICAgICAgICAgICAgIGlmIChtb2RlbC5zdWJzY3JpYmUpIG1vZGVsLnN1YnNjcmliZShiaW5kaW5nKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaW5kaW5nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBDb21wb25lbnRCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwcml2YXRlIGJpbmRpbmc6IERvbS5GcmFnbWVudEJpbmRpbmc7XHJcbiAgICBwcml2YXRlIHN0b3JlID0gbmV3IFJlYWN0aXZlLlN0b3JlKHRoaXMuY29tcG9uZW50KTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudCwgcHJpdmF0ZSBwcm9wcykge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nID0gbmV3IERvbS5GcmFnbWVudEJpbmRpbmcobnVsbCwgW2NvbXBvbmVudC52aWV3KFhhbmlhKV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGJpbmQoKTogdGhpcyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKGNvbnRleHQsIGRyaXZlcik6IHRoaXMge1xyXG4gICAgICAgIGxldCBwcm9wcyA9IHRoaXMucHJvcHM7XHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBwcm9wcykge1xyXG4gICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBleHByID0gcHJvcHNbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBleHByLmV4ZWN1dGUodGhpcywgY29udGV4dCkudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRbcHJvcF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlKHRoaXMuc3RvcmUsIGRyaXZlcik7XHJcbiAgICAgICAgc3VwZXIudXBkYXRlKGNvbnRleHQsIGRyaXZlcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmNsYXNzIFBhcnRpYWxCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwcml2YXRlIGJpbmRpbmc7XHJcbiAgICBwcml2YXRlIGNhY2hlID0gW107XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZpZXcsIHByaXZhdGUgbW9kZWwpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBwYXJlbnQpIHtcclxuICAgICAgICB2YXIgdmlldyA9IHRoaXMuZXZhbHVhdGVPYmplY3QodGhpcy52aWV3KS52YWx1ZU9mKCk7XHJcblxyXG4gICAgICAgIGlmICghdmlldylcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidmlldyBpcyBlbXB0eVwiKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYmluZGluZykge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmRpbmcuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIG5ld0JpbmRpbmcgPSBuZXcgRG9tLkZyYWdtZW50QmluZGluZyh0aGlzLm1vZGVsLCBbdmlld10pO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmRpbmcgPSBuZXdCaW5kaW5nO1xyXG4gICAgICAgIHRoaXMuYmluZGluZy51cGRhdGUoY29udGV4dCwgcGFyZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBvbk5leHQoXykge1xyXG4gICAgICAgIHRoaXMuZXhlY3V0ZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZXhwb3J0IHsgZnMsIFJlYWN0aXZlLCBUZW1wbGF0ZSB9XHJcblxyXG4iXX0=