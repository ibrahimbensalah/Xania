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
            if (child.accept)
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
            if (element.prototype.view) {
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
    Xania.view = function (tpl, dispatcher) {
        return dom_1.Dom.view(tpl, dispatcher);
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
            accept: function () {
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
    ComponentBinding.prototype.accept = function () {
        return this;
    };
    ComponentBinding.prototype.update = function (context, sinks) {
        var props = this.props;
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                var expr = props[prop];
                var value = expr.execute(this, context).valueOf();
                this.component[prop] = value;
            }
        }
        this.binding.update(this.store, sinks);
        _super.prototype.update.call(this, context, sinks);
        return this;
    };
    ComponentBinding.prototype.render = function () {
    };
    ComponentBinding.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
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
        var view = this.evaluate(this.view).valueOf();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMveGFuaWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdUNBQXFDO0FBOEpkLHVDQUFRO0FBN0ovQiw2QkFBMkI7QUFDM0IsbUNBQTZCO0FBNEpwQix5QkFBRTtBQTNKWCx1Q0FBcUM7QUEySnhCLHVDQUFRO0FBekpyQjtJQUFBO0lBK0RBLENBQUM7SUE5RFUsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDYixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxDQUFDO2dCQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxtQkFBUSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2xELENBQUM7UUFDTCxDQUFDO1FBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBR00sU0FBRyxHQUFWLFVBQVcsT0FBTyxFQUFFLEtBQUs7UUFBRSxrQkFBVzthQUFYLFVBQVcsRUFBWCxxQkFBVyxFQUFYLElBQVc7WUFBWCxpQ0FBVzs7UUFDbEMsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU5QyxFQUFFLENBQUMsQ0FBQyxPQUFPLFlBQVksbUJBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDbkIsQ0FBQztR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R0FBTixVQUFPLENBQUM7UUFDSixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUNMLHFCQUFDO0FBQUQsQ0FBQyxBQTFCRCxDQUE2QixtQkFBUSxDQUFDLE9BQU8sR0EwQjVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tIFwiLi90ZW1wbGF0ZVwiXHJcbmltcG9ydCB7IERvbSB9IGZyb20gXCIuL2RvbVwiXHJcbmltcG9ydCB7IGZzIH0gZnJvbSBcIi4vZnNoYXJwXCJcclxuaW1wb3J0IHsgUmVhY3RpdmUgfSBmcm9tIFwiLi9yZWFjdGl2ZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgWGFuaWEge1xyXG4gICAgc3RhdGljIHRlbXBsYXRlcyhlbGVtZW50cykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGVsZW1lbnRzW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoaWxkLmFjY2VwdClcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKGNoaWxkKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBzdmdFbGVtZW50cyA9IFtcInN2Z1wiLCBcImNpcmNsZVwiLCBcImxpbmVcIiwgXCJnXCJdO1xyXG5cclxuICAgIHN0YXRpYyB0YWcoZWxlbWVudCwgYXR0cnMsIC4uLmNoaWxkcmVuKTogVGVtcGxhdGUuSU5vZGUge1xyXG4gICAgICAgIHZhciBjaGlsZFRlbXBsYXRlcyA9IHRoaXMudGVtcGxhdGVzKGNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBUZW1wbGF0ZS5UYWdUZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHZhciBucyA9IFhhbmlhLnN2Z0VsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPj0gMCA/IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiA6IG51bGw7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGVtcGxhdGUuVGFnVGVtcGxhdGUoZWxlbWVudCwgbnMsIGNoaWxkVGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgaWYgKGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdHRyVmFsdWUgPSBhdHRyc1twcm9wXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3AgPT09IFwiY2xhc3NOYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGFzc25hbWVcIiB8fCBwcm9wID09PSBcImNsYXp6XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcImNsYXNzXCIsIGF0dHJWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKHByb3AsIGF0dHJWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhdHRycy5uYW1lID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLnR5cGUgPT09IFwidGV4dFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYXR0cnMudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwidmFsdWVcIiwgZnMoYXR0cnMubmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5wcm90b3R5cGUudmlldykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRCaW5kaW5nKFJlZmxlY3QuY29uc3RydWN0KGVsZW1lbnQsIFthdHRycywgY2hpbGRUZW1wbGF0ZXNdKSwgYXR0cnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBlbGVtZW50KGF0dHJzLCBjaGlsZFRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXZpZXcpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdmlld1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudC5yZW5kZXIgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICB2YXIgdHBsID0gZWxlbWVudC5yZW5kZXIoKTtcclxuICAgICAgICAgICAgcmV0dXJuIFZpZXcucGFydGlhbCh0cGwsIG5ldyBSZWFjdGl2ZS5TdG9yZShlbGVtZW50KSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJ0YWcgdW5yZXNvbHZlZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgdmlldyh0cGw6IFRlbXBsYXRlLklOb2RlLCBkaXNwYXRjaGVyPykge1xyXG4gICAgICAgIHJldHVybiBEb20udmlldyh0cGwsIGRpc3BhdGNoZXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gRm9yRWFjaChhdHRyLCBjaGlsZHJlbikge1xyXG4gICAgdmFyIHRwbCA9IG5ldyBUZW1wbGF0ZS5GcmFnbWVudFRlbXBsYXRlKGF0dHIuZXhwciB8fCBudWxsKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdHBsLmNoaWxkKGNoaWxkcmVuW2ldKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHBsO1xyXG59XHJcblxyXG5leHBvcnQgbW9kdWxlIFZpZXcge1xyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHBhcnRpYWwodmlldywgbW9kZWwpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBhY2NlcHQoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBQYXJ0aWFsQmluZGluZyh2aWV3LCBtb2RlbCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodmlldy5zdWJzY3JpYmUpIHZpZXcuc3Vic2NyaWJlKGJpbmRpbmcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1vZGVsLnN1YnNjcmliZSkgbW9kZWwuc3Vic2NyaWJlKGJpbmRpbmcpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIENvbXBvbmVudEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHByaXZhdGUgYmluZGluZzogRG9tLkZyYWdtZW50QmluZGluZztcclxuICAgIHByaXZhdGUgc3RvcmUgPSBuZXcgUmVhY3RpdmUuU3RvcmUodGhpcy5jb21wb25lbnQpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50LCBwcml2YXRlIHByb3BzKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmJpbmRpbmcgPSBuZXcgRG9tLkZyYWdtZW50QmluZGluZyhudWxsLCBbY29tcG9uZW50LnZpZXcoWGFuaWEpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWNjZXB0KCk6IHRoaXMge1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShjb250ZXh0LCBzaW5rcyk6IHRoaXMge1xyXG4gICAgICAgIGxldCBwcm9wcyA9IHRoaXMucHJvcHM7XHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBwcm9wcykge1xyXG4gICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBleHByID0gcHJvcHNbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBleHByLmV4ZWN1dGUodGhpcywgY29udGV4dCkudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRbcHJvcF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlKHRoaXMuc3RvcmUsIHNpbmtzKTtcclxuICAgICAgICBzdXBlci51cGRhdGUoY29udGV4dCwgc2lua3MpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcigpIHtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICAgICAgICB0aGlzLmJpbmRpbmcuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuY2xhc3MgUGFydGlhbEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHByaXZhdGUgYmluZGluZztcclxuICAgIHByaXZhdGUgY2FjaGUgPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdmlldywgcHJpdmF0ZSBtb2RlbCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQsIHBhcmVudCkge1xyXG4gICAgICAgIHZhciB2aWV3ID0gdGhpcy5ldmFsdWF0ZSh0aGlzLnZpZXcpLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgaWYgKCF2aWV3KVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ2aWV3IGlzIGVtcHR5XCIpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5iaW5kaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmluZGluZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbmV3QmluZGluZyA9IG5ldyBEb20uRnJhZ21lbnRCaW5kaW5nKHRoaXMubW9kZWwsIFt2aWV3XSk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZGluZyA9IG5ld0JpbmRpbmc7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nLnVwZGF0ZShjb250ZXh0LCBwYXJlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uTmV4dChfKSB7XHJcbiAgICAgICAgdGhpcy5leGVjdXRlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IGZzLCBSZWFjdGl2ZSwgVGVtcGxhdGUgfVxyXG4iXX0=