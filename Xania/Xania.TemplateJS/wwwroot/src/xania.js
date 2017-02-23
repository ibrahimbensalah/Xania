"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var template_1 = require("./template");
exports.Template = template_1.Template;
var dom_1 = require("./dom");
exports.Dom = dom_1.Dom;
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
            if (child === null || child === void 0)
                continue;
            else if (child.bind)
                result.push(child);
            else if (typeof child === "number" || typeof child === "string" || typeof child.execute === "function") {
                result.push(new template_1.Template.TextTemplate(child));
            }
            else if (Array.isArray(child)) {
                var childTemplates = this.templates(child);
                for (var j = 0; j < childTemplates.length; j++) {
                    result.push(childTemplates[j]);
                }
            }
            else if (typeof child.view === "function") {
                result.push({
                    component: child,
                    bind: function () {
                        return new ComponentBinding(this.component, {});
                    }
                });
            }
            else {
                throw Error("");
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
                return Reflect.construct(element, [attrs || {}, childTemplates]);
            }
            else if (element.prototype.view) {
                return new ComponentBinding(Reflect.construct(element, [attrs || {}, childTemplates]), attrs);
            }
            else {
                var view = element(attrs || {}, childTemplates);
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
    Xania.render = function (element, driver) {
        return Xania.tag(element, {})
            .bind(dom_1.Dom.DomVisitor)
            .update(new reactive_1.Reactive.Store({}), driver);
    };
    Xania.partial = function (view, model) {
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
        _this.componentStore = new reactive_1.Reactive.Store(_this.component);
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
                var sourceValue = expr.execute ? expr.execute(this, context) : expr;
                this.component[prop] = sourceValue;
                if (sourceValue.set) {
                    this.componentStore.get(prop).change({
                        sourceValue: sourceValue,
                        propertyName: prop,
                        component: this.component,
                        sourceContext: context,
                        execute: function () {
                            this.sourceValue.set(this.component[this.propertyName]);
                            this.sourceContext.refresh();
                        }
                    });
                }
            }
        }
        this.binding.update(this.componentStore, driver);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4YW5pYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1Q0FBcUM7QUFpTmQsdUNBQVE7QUFoTi9CLDZCQUEyQjtBQWdOTSx3QkFBRztBQS9NcEMsbUNBQTZCO0FBK01wQix5QkFBRTtBQTlNWCx1Q0FBcUM7QUE4TXhCLHVDQUFRO0FBNU1yQjtJQUFBO0lBcUdBLENBQUM7SUFwR1UsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQztZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNsRCxDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixJQUFJLGNB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Q0FBQyxDQUFDO1FBRTdELElBQUksQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDO1FBQzFCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRUQsK0JBQU0sR0FBTixVQUFPLENBQUM7UUFDSixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUNMLHFCQUFDO0FBQUQsQ0FBQyxBQTFCRCxDQUE2QixtQkFBUSxDQUFDLE9BQU8sR0EwQjVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tIFwiLi90ZW1wbGF0ZVwiXHJcbmltcG9ydCB7IERvbSB9IGZyb20gXCIuL2RvbVwiXHJcbmltcG9ydCB7IGZzIH0gZnJvbSBcIi4vZnNoYXJwXCJcclxuaW1wb3J0IHsgUmVhY3RpdmUgfSBmcm9tIFwiLi9yZWFjdGl2ZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgWGFuaWEge1xyXG4gICAgc3RhdGljIHRlbXBsYXRlcyhlbGVtZW50cykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGVsZW1lbnRzW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoaWxkID09PSBudWxsIHx8IGNoaWxkID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoY2hpbGQuYmluZClcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGNoaWxkID09PSBcIm51bWJlclwiIHx8IHR5cGVvZiBjaGlsZCA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgY2hpbGQuZXhlY3V0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKGNoaWxkKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShjaGlsZCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjaGlsZFRlbXBsYXRlcyA9IHRoaXMudGVtcGxhdGVzKGNoaWxkKTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2hpbGRUZW1wbGF0ZXMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZFRlbXBsYXRlc1tqXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNoaWxkLnZpZXcgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogY2hpbGQsXHJcbiAgICAgICAgICAgICAgICAgICAgYmluZCgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRCaW5kaW5nKHRoaXMuY29tcG9uZW50LCB7fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHN2Z0VsZW1lbnRzID0gW1wic3ZnXCIsIFwiY2lyY2xlXCIsIFwibGluZVwiLCBcImdcIl07XHJcblxyXG4gICAgc3RhdGljIHRhZyhlbGVtZW50LCBhdHRycywgLi4uY2hpbGRyZW4pOiBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFRlbXBsYXRlLlRhZ1RlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdmFyIG5zID0gWGFuaWEuc3ZnRWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA+PSAwID8gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIDogbnVsbDtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUZW1wbGF0ZS5UYWdUZW1wbGF0ZShlbGVtZW50LCBucywgY2hpbGRUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICBpZiAoYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IGF0dHJzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcCA9PT0gXCJjbGFzc05hbWVcIiB8fCBwcm9wID09PSBcImNsYXNzbmFtZVwiIHx8IHByb3AgPT09IFwiY2xhenpcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIocHJvcCwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF0dHJzLm5hbWUgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMudHlwZSA9PT0gXCJ0ZXh0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhdHRycy52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIoXCJ2YWx1ZVwiLCBmcyhhdHRycy5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnByb3RvdHlwZS5iaW5kKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3QoZWxlbWVudCwgW2F0dHJzIHx8IHt9LCBjaGlsZFRlbXBsYXRlc10pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQucHJvdG90eXBlLnZpZXcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50QmluZGluZyhSZWZsZWN0LmNvbnN0cnVjdChlbGVtZW50LCBbYXR0cnMgfHwge30sIGNoaWxkVGVtcGxhdGVzXSksIGF0dHJzKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciB2aWV3ID0gZWxlbWVudChhdHRycyB8fCB7fSwgY2hpbGRUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF2aWV3KVxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBsb2FkIHZpZXdcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmlldztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQucmVuZGVyID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgdmFyIHRwbCA9IGVsZW1lbnQucmVuZGVyKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBWaWV3LnBhcnRpYWwodHBsLCBuZXcgUmVhY3RpdmUuU3RvcmUoZWxlbWVudCkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwidGFnIHVucmVzb2x2ZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBUT0RPIG9ic29sZXRlXHJcbiAgICAgKiBAcGFyYW0gdHBsXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyB2aWV3KHRwbDogVGVtcGxhdGUuSU5vZGUpIHtcclxuICAgICAgICByZXR1cm4gRG9tLnZpZXcodHBsKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcmVuZGVyKGVsZW1lbnQsIGRyaXZlcikge1xyXG4gICAgICAgIHJldHVybiBYYW5pYS50YWcoZWxlbWVudCwge30pXHJcbiAgICAgICAgICAgIC5iaW5kPFJlYWN0aXZlLkJpbmRpbmc+KERvbS5Eb21WaXNpdG9yKVxyXG4gICAgICAgICAgICAudXBkYXRlKG5ldyBSZWFjdGl2ZS5TdG9yZSh7fSksIGRyaXZlcik7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgcGFydGlhbCh2aWV3LCBtb2RlbCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGJpbmQoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBQYXJ0aWFsQmluZGluZyh2aWV3LCBtb2RlbCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodmlldy5zdWJzY3JpYmUpIHZpZXcuc3Vic2NyaWJlKGJpbmRpbmcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1vZGVsLnN1YnNjcmliZSkgbW9kZWwuc3Vic2NyaWJlKGJpbmRpbmcpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBGb3JFYWNoKGF0dHIsIGNoaWxkcmVuKSB7XHJcbiAgICB2YXIgdHBsID0gbmV3IFRlbXBsYXRlLkZyYWdtZW50VGVtcGxhdGUoYXR0ci5leHByIHx8IG51bGwpO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB0cGwuY2hpbGQoY2hpbGRyZW5baV0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cGw7XHJcbn1cclxuXHJcbmV4cG9ydCBtb2R1bGUgVmlldyB7XHJcbiAgICBleHBvcnQgZnVuY3Rpb24gcGFydGlhbCh2aWV3LCBtb2RlbCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGJpbmQoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBQYXJ0aWFsQmluZGluZyh2aWV3LCBtb2RlbCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodmlldy5zdWJzY3JpYmUpIHZpZXcuc3Vic2NyaWJlKGJpbmRpbmcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1vZGVsLnN1YnNjcmliZSkgbW9kZWwuc3Vic2NyaWJlKGJpbmRpbmcpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIENvbXBvbmVudEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHByaXZhdGUgYmluZGluZzogRG9tLkZyYWdtZW50QmluZGluZztcclxuICAgIHByaXZhdGUgY29tcG9uZW50U3RvcmUgPSBuZXcgUmVhY3RpdmUuU3RvcmUodGhpcy5jb21wb25lbnQpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50LCBwcml2YXRlIHByb3BzKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmJpbmRpbmcgPSBuZXcgRG9tLkZyYWdtZW50QmluZGluZyhudWxsLCBbY29tcG9uZW50LnZpZXcoWGFuaWEpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYmluZCgpOiB0aGlzIHtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoY29udGV4dCwgZHJpdmVyKTogdGhpcyB7XHJcbiAgICAgICAgbGV0IHByb3BzID0gdGhpcy5wcm9wcztcclxuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHByb3BzKSB7XHJcbiAgICAgICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV4cHIgPSBwcm9wc1twcm9wXTtcclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VWYWx1ZSA9IGV4cHIuZXhlY3V0ZSA/IGV4cHIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KSA6IGV4cHI7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFtwcm9wXSA9IHNvdXJjZVZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2VWYWx1ZS5zZXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFN0b3JlLmdldChwcm9wKS5jaGFuZ2Uoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VWYWx1ZTogc291cmNlVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZTogcHJvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiB0aGlzLmNvbXBvbmVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlQ29udGV4dDogY29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZSgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc291cmNlVmFsdWUuc2V0KHRoaXMuY29tcG9uZW50W3RoaXMucHJvcGVydHlOYW1lXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZUNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nLnVwZGF0ZSh0aGlzLmNvbXBvbmVudFN0b3JlLCBkcml2ZXIpO1xyXG4gICAgICAgIHN1cGVyLnVwZGF0ZShjb250ZXh0LCBkcml2ZXIpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcigpIHtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuYmluZGluZy5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5jbGFzcyBQYXJ0aWFsQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBiaW5kaW5nO1xyXG4gICAgcHJpdmF0ZSBjYWNoZSA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB2aWV3LCBwcml2YXRlIG1vZGVsKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCwgcGFyZW50KSB7XHJcbiAgICAgICAgdmFyIHZpZXcgPSB0aGlzLmV2YWx1YXRlT2JqZWN0KHRoaXMudmlldykudmFsdWVPZigpO1xyXG5cclxuICAgICAgICBpZiAoIXZpZXcpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInZpZXcgaXMgZW1wdHlcIik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJpbmRpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5iaW5kaW5nLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBuZXdCaW5kaW5nID0gbmV3IERvbS5GcmFnbWVudEJpbmRpbmcodGhpcy5tb2RlbCwgW3ZpZXddKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kaW5nID0gbmV3QmluZGluZztcclxuICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlKGNvbnRleHQsIHBhcmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25OZXh0KF8pIHtcclxuICAgICAgICB0aGlzLmV4ZWN1dGUoKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmV4cG9ydCB7IGZzLCBSZWFjdGl2ZSwgVGVtcGxhdGUsIERvbSB9XHJcblxyXG4iXX0=