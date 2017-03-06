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
var compile_1 = require("./compile");
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
                result.push(new template_1.Template.TextTemplate(child, dom_1.Dom.DomVisitor));
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
            var tag = new template_1.Template.TagTemplate(element, ns, childTemplates, dom_1.Dom.DomVisitor);
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
                            tag.attr("value", compile_1.default(attrs.name));
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
        else {
            throw Error("tag unresolved");
        }
    };
    Xania.render = function (element, driver) {
        return Xania.tag(element, {})
            .bind()
            .update(new reactive_1.Reactive.Store({}), driver);
    };
    return Xania;
}());
Xania.svgElements = ["svg", "circle", "line", "g", "path", "marker"];
exports.Xania = Xania;
var ComponentBinding = (function (_super) {
    __extends(ComponentBinding, _super);
    function ComponentBinding(component, props) {
        var _this = _super.call(this) || this;
        _this.component = component;
        _this.props = props;
        _this.componentStore = new reactive_1.Reactive.Store(_this.component);
        _this.binding = new FragmentBinding([component.view(Xania)]);
        return _this;
    }
    ComponentBinding.prototype.bind = function () {
        return this;
    };
    ComponentBinding.prototype.update = function (context, driver) {
        this.binding.update(this.componentStore, driver);
        _super.prototype.update.call(this, context, driver);
        return this;
    };
    ComponentBinding.prototype.render = function (context) {
        var props = this.props;
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                var expr = props[prop];
                var sourceValue = expr.execute ? expr.execute(this, context) : expr;
                if (sourceValue) {
                    this.component[prop] = sourceValue.valueOf();
                }
            }
        }
        this.componentStore.refresh();
    };
    ComponentBinding.prototype.dispose = function () {
        this.binding.dispose();
    };
    return ComponentBinding;
}(reactive_1.Reactive.Binding));
var Repeat = (function () {
    function Repeat(attrs, children) {
        this.template =
            new MapTemplate(attrs.param, attrs.source, children, dom_1.Dom.DomVisitor);
    }
    Repeat.prototype.bind = function () {
        return this.template.bind();
    };
    return Repeat;
}());
exports.Repeat = Repeat;
function expr(code) {
    return compile_1.default(code);
}
exports.expr = expr;
var MapTemplate = (function () {
    function MapTemplate(param, expr, children, visitor) {
        this.param = param;
        this.expr = expr;
        this.children = children;
        this.visitor = visitor;
    }
    MapTemplate.prototype.child = function (child) {
        this.children.push(child);
        return this;
    };
    MapTemplate.prototype.bind = function () {
        return new MapBinding(this.param, this.expr, this.children);
    };
    return MapTemplate;
}());
exports.MapTemplate = MapTemplate;
var MapBinding = (function (_super) {
    __extends(MapBinding, _super);
    function MapBinding(param, expr, children) {
        var _this = _super.call(this) || this;
        _this.param = param;
        _this.expr = expr;
        _this.children = children;
        _this.fragments = [];
        for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
            var child = children_1[_i];
            if (!child.bind)
                throw Error("child is not a node");
        }
        return _this;
    }
    Object.defineProperty(MapBinding.prototype, "length", {
        get: function () {
            var total = 0, length = this.fragments.length;
            for (var i = 0; i < length; i++) {
                total += this.fragments[i].length;
            }
            return total;
        },
        enumerable: true,
        configurable: true
    });
    MapBinding.prototype.notify = function () {
        var stream, context = this.context;
        if (!!this.expr && !!this.expr.execute) {
            stream = this.expr.execute(this, context);
            if (stream.length === void 0)
                if (stream.value === null) {
                    stream = [];
                }
                else {
                    stream = [stream];
                }
        }
        else {
            stream = [context];
        }
        this.stream = stream;
        var i = 0;
        while (i < this.fragments.length) {
            var frag = this.fragments[i];
            if (stream.indexOf(frag.context) < 0) {
                frag.dispose();
                this.fragments.splice(i, 1);
            }
            else {
                i++;
            }
        }
    };
    MapBinding.prototype.dispose = function () {
        for (var i = 0; i < this.fragments.length; i++) {
            this.fragments[i].dispose();
        }
    };
    MapBinding.swap = function (arr, srcIndex, tarIndex) {
        if (srcIndex > tarIndex) {
            var i = srcIndex;
            srcIndex = tarIndex;
            tarIndex = i;
        }
        if (srcIndex < tarIndex) {
            var src = arr[srcIndex];
            arr[srcIndex] = arr[tarIndex];
            arr[tarIndex] = src;
        }
    };
    MapBinding.prototype.render = function (context, driver) {
        this.notify();
        var stream = this.stream;
        var fr, streamlength = stream.length;
        for (var i = 0; i < streamlength; i++) {
            var item = stream.get ? stream.get(i) : stream[i];
            var fragment = null, fraglength = this.fragments.length;
            for (var e = i; e < fraglength; e++) {
                fr = this.fragments[e];
                if (fr.context === item) {
                    fragment = fr;
                    MapBinding.swap(this.fragments, e, i);
                    break;
                }
            }
            if (fragment === null) {
                fragment = new Fragment(this);
                this.fragments.push(fragment);
                MapBinding.swap(this.fragments, fraglength, i);
            }
            fragment.update(item, driver);
        }
        while (this.fragments.length > stream.length) {
            var frag = this.fragments.pop();
            frag.dispose();
        }
    };
    MapBinding.prototype.insert = function (fragment, dom, idx) {
        if (this.driver) {
            var offset = 0;
            for (var i = 0; i < this.fragments.length; i++) {
                if (this.fragments[i] === fragment)
                    break;
                offset += this.fragments[i].length;
            }
            this.driver.insert(this, dom, offset + idx);
        }
    };
    return MapBinding;
}(reactive_1.Reactive.Binding));
var FragmentBinding = (function (_super) {
    __extends(FragmentBinding, _super);
    function FragmentBinding(children) {
        var _this = _super.call(this) || this;
        _this.children = children;
        for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
            var child = children_2[_i];
            if (!child.bind)
                throw Error("child is not a node");
        }
        _this.fragment = new Fragment(_this);
        return _this;
    }
    Object.defineProperty(FragmentBinding.prototype, "length", {
        get: function () {
            return this.fragment.length;
        },
        enumerable: true,
        configurable: true
    });
    FragmentBinding.prototype.dispose = function () {
        this.fragment.dispose();
    };
    FragmentBinding.prototype.render = function (context, driver) {
        this.fragment.update(context, driver);
    };
    FragmentBinding.prototype.insert = function (fragment, dom, idx) {
        if (this.driver) {
            this.driver.insert(this, dom, idx);
        }
    };
    return FragmentBinding;
}(reactive_1.Reactive.Binding));
var Fragment = (function () {
    function Fragment(owner) {
        this.owner = owner;
        this.childBindings = [];
        for (var e = 0; e < this.owner.children.length; e++) {
            this.childBindings[e] =
                owner.children[e].bind();
        }
    }
    Fragment.prototype.get = function (name) {
        if (this.owner.param) {
            if (name === this.owner.param) {
                return this.context;
            }
        }
        var context = this.context;
        var value = context.get ? context.get(name) : context[name];
        if (value !== void 0)
            return value;
        return this.owner.context.get(name);
    };
    Fragment.prototype.refresh = function () {
        this.owner.context.refresh();
    };
    Fragment.prototype.dispose = function () {
        for (var j = 0; j < this.childBindings.length; j++) {
            var b = this.childBindings[j];
            b.dispose();
        }
    };
    Object.defineProperty(Fragment.prototype, "length", {
        get: function () {
            var total = 0;
            for (var j = 0; j < this.childBindings.length; j++) {
                total += this.childBindings[j].length;
            }
            return total;
        },
        enumerable: true,
        configurable: true
    });
    Fragment.prototype.update = function (context, driver) {
        this.context = context;
        this.driver = driver;
        var length = this.owner.children.length;
        for (var e = 0; e < length; e++) {
            this.childBindings[e].update(this, this);
        }
        return this;
    };
    Fragment.prototype.insert = function (binding, dom, index) {
        var offset = 0, length = this.childBindings.length;
        for (var i = 0; i < length; i++) {
            if (this.childBindings[i] === binding)
                break;
            offset += this.childBindings[i].length;
        }
        this.owner.insert(this, dom, offset + index);
    };
    Fragment.prototype.on = function (eventName, dom, eventBinding) {
        this.driver.on(eventName, dom, eventBinding);
    };
    return Fragment;
}());
exports.Fragment = Fragment;
var RemoteObject = (function () {
    function RemoteObject(url, expr) {
        this.url = url;
        this.expr = expr;
        var config = {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(compile_1.parse(expr))
        };
        this.promise = fetch(url, config).then(function (response) {
            return response.json();
        });
    }
    RemoteObject.prototype.subscribe = function (observer) {
        this.promise.then(function (data) {
            observer.onNext(data);
        });
    };
    return RemoteObject;
}());
exports.RemoteObject = RemoteObject;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4YW5pYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1Q0FBcUM7QUEySmxCLHVDQUFRO0FBMUozQiw2QkFBMkI7QUEwSkUsd0JBQUc7QUF6SmhDLHFDQUFpRDtBQUNqRCx1Q0FBcUM7QUF3SjVCLHVDQUFRO0FBdEpqQjtJQUFBO0lBaUZBLENBQUM7SUFoRlUsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQztZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQW1CLEtBQUssRUFBRSxTQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNwRixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5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TSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0FBQyxBQXRCRCxJQXNCQztBQXRCWSxvQ0FBWSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRlbXBsYXRlIH0gZnJvbSBcIi4vdGVtcGxhdGVcIlxyXG5pbXBvcnQgeyBEb20gfSBmcm9tIFwiLi9kb21cIlxyXG5pbXBvcnQgY29tcGlsZSwgeyBTY29wZSwgcGFyc2UgfSBmcm9tIFwiLi9jb21waWxlXCJcclxuaW1wb3J0IHsgUmVhY3RpdmUgfSBmcm9tIFwiLi9yZWFjdGl2ZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgWGFuaWEge1xyXG4gICAgc3RhdGljIHRlbXBsYXRlcyhlbGVtZW50cykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGVsZW1lbnRzW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoaWxkID09PSBudWxsIHx8IGNoaWxkID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoY2hpbGQuYmluZClcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGNoaWxkID09PSBcIm51bWJlclwiIHx8IHR5cGVvZiBjaGlsZCA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgY2hpbGQuZXhlY3V0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlPFJlYWN0aXZlLkJpbmRpbmc+KGNoaWxkLCBEb20uRG9tVmlzaXRvcikpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGQpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRUZW1wbGF0ZXMgPSB0aGlzLnRlbXBsYXRlcyhjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNoaWxkVGVtcGxhdGVzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2hpbGRUZW1wbGF0ZXNbal0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjaGlsZC52aWV3ID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IGNoaWxkLFxyXG4gICAgICAgICAgICAgICAgICAgIGJpbmQoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50QmluZGluZyh0aGlzLmNvbXBvbmVudCwge30pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBzdmdFbGVtZW50cyA9IFtcInN2Z1wiLCBcImNpcmNsZVwiLCBcImxpbmVcIiwgXCJnXCIsIFwicGF0aFwiLCBcIm1hcmtlclwiXTtcclxuXHJcbiAgICBzdGF0aWMgdGFnKGVsZW1lbnQsIGF0dHJzLCAuLi5jaGlsZHJlbik6IFRlbXBsYXRlLklOb2RlIHtcclxuICAgICAgICB2YXIgY2hpbGRUZW1wbGF0ZXMgPSB0aGlzLnRlbXBsYXRlcyhjaGlsZHJlbik7XHJcblxyXG4gICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgVGVtcGxhdGUuVGFnVGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB2YXIgbnMgPSBYYW5pYS5zdmdFbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpID49IDAgPyBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgOiBudWxsO1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRlbXBsYXRlLlRhZ1RlbXBsYXRlPFJlYWN0aXZlLkJpbmRpbmc+KGVsZW1lbnQsIG5zLCBjaGlsZFRlbXBsYXRlcywgRG9tLkRvbVZpc2l0b3IpO1xyXG4gICAgICAgICAgICBpZiAoYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IGF0dHJzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcCA9PT0gXCJjbGFzc05hbWVcIiB8fCBwcm9wID09PSBcImNsYXNzbmFtZVwiIHx8IHByb3AgPT09IFwiY2xhenpcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIocHJvcCwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGF0dHJzLm5hbWUgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMudHlwZSA9PT0gXCJ0ZXh0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhdHRycy52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIoXCJ2YWx1ZVwiLCBjb21waWxlKGF0dHJzLm5hbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50ID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQucHJvdG90eXBlLmJpbmQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBSZWZsZWN0LmNvbnN0cnVjdChlbGVtZW50LCBbYXR0cnMgfHwge30sIGNoaWxkVGVtcGxhdGVzXSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC5wcm90b3R5cGUudmlldykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRCaW5kaW5nKFJlZmxlY3QuY29uc3RydWN0KGVsZW1lbnQsIFthdHRycyB8fCB7fSwgY2hpbGRUZW1wbGF0ZXNdKSwgYXR0cnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBlbGVtZW50KGF0dHJzIHx8IHt9LCBjaGlsZFRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXZpZXcpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdmlld1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJ0YWcgdW5yZXNvbHZlZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbmRlcihlbGVtZW50LCBkcml2ZXIpIHtcclxuICAgICAgICByZXR1cm4gWGFuaWEudGFnKGVsZW1lbnQsIHt9KVxyXG4gICAgICAgICAgICAuYmluZCgpXHJcbiAgICAgICAgICAgIC51cGRhdGUobmV3IFJlYWN0aXZlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgQ29tcG9uZW50QmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBiaW5kaW5nOiBGcmFnbWVudEJpbmRpbmc7XHJcbiAgICBwcml2YXRlIGNvbXBvbmVudFN0b3JlID0gbmV3IFJlYWN0aXZlLlN0b3JlKHRoaXMuY29tcG9uZW50KTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudCwgcHJpdmF0ZSBwcm9wcykge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nID0gbmV3IEZyYWdtZW50QmluZGluZyhbY29tcG9uZW50LnZpZXcoWGFuaWEpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgYmluZCgpOiB0aGlzIHtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoY29udGV4dCwgZHJpdmVyKTogdGhpcyB7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nLnVwZGF0ZSh0aGlzLmNvbXBvbmVudFN0b3JlLCBkcml2ZXIpO1xyXG4gICAgICAgIHN1cGVyLnVwZGF0ZShjb250ZXh0LCBkcml2ZXIpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0KSB7XHJcbiAgICAgICAgbGV0IHByb3BzID0gdGhpcy5wcm9wcztcclxuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHByb3BzKSB7XHJcbiAgICAgICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV4cHIgPSBwcm9wc1twcm9wXTtcclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VWYWx1ZSA9IGV4cHIuZXhlY3V0ZSA/IGV4cHIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KSA6IGV4cHI7XHJcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFtwcm9wXSA9IHNvdXJjZVZhbHVlLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNvbXBvbmVudFN0b3JlLnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuYmluZGluZy5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4vL2NsYXNzIFBhcnRpYWxCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbi8vICAgIHByaXZhdGUgYmluZGluZztcclxuLy8gICAgcHJpdmF0ZSBjYWNoZSA9IFtdO1xyXG4vLyAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZpZXcsIHByaXZhdGUgbW9kZWwpIHtcclxuLy8gICAgICAgIHN1cGVyKCk7XHJcbi8vICAgIH1cclxuXHJcbi8vICAgIHJlbmRlcihjb250ZXh0LCBwYXJlbnQpIHtcclxuLy8gICAgICAgIHZhciB2aWV3ID0gdGhpcy5ldmFsdWF0ZU9iamVjdCh0aGlzLnZpZXcpLnZhbHVlT2YoKTtcclxuXHJcbi8vICAgICAgICBpZiAoIXZpZXcpXHJcbi8vICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidmlldyBpcyBlbXB0eVwiKTtcclxuXHJcbi8vICAgICAgICBpZiAodGhpcy5iaW5kaW5nKSB7XHJcbi8vICAgICAgICAgICAgdGhpcy5iaW5kaW5nLmRpc3Bvc2UoKTtcclxuLy8gICAgICAgIH1cclxuXHJcbi8vICAgICAgICB2YXIgbmV3QmluZGluZyA9IG5ldyBEb20uRnJhZ21lbnRCaW5kaW5nKHRoaXMubW9kZWwsIFt2aWV3XSk7XHJcblxyXG4vLyAgICAgICAgdGhpcy5iaW5kaW5nID0gbmV3QmluZGluZztcclxuLy8gICAgICAgIHRoaXMuYmluZGluZy51cGRhdGUoY29udGV4dCwgcGFyZW50KTtcclxuLy8gICAgfVxyXG5cclxuLy8gICAgb25OZXh0KF8pIHtcclxuLy8gICAgICAgIHRoaXMuZXhlY3V0ZSgpO1xyXG4vLyAgICB9XHJcbi8vfVxyXG5cclxuZXhwb3J0IHsgUmVhY3RpdmUsIFRlbXBsYXRlLCBEb20gfVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBSZXBlYXQge1xyXG4gICAgcHJpdmF0ZSB0ZW1wbGF0ZTogTWFwVGVtcGxhdGU8UmVhY3RpdmUuQmluZGluZz47XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXR0cnMsIGNoaWxkcmVuKSB7XHJcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9XHJcbiAgICAgICAgICAgIG5ldyBNYXBUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihhdHRycy5wYXJhbSwgYXR0cnMuc291cmNlLCBjaGlsZHJlbiwgRG9tLkRvbVZpc2l0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIGJpbmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGUuYmluZCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXhwcihjb2RlOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiBjb21waWxlKGNvZGUpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWFwVGVtcGxhdGU8VD4gaW1wbGVtZW50cyBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmFtLCBwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10sIHByaXZhdGUgdmlzaXRvcjogVGVtcGxhdGUuSVZpc2l0b3I8VD4pIHsgfVxyXG5cclxuICAgIGNoaWxkKGNoaWxkOiBUZW1wbGF0ZS5JTm9kZSkge1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYmluZCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IE1hcEJpbmRpbmcodGhpcy5wYXJhbSwgdGhpcy5leHByLCB0aGlzLmNoaWxkcmVuKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgTWFwQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHVibGljIGZyYWdtZW50czogRnJhZ21lbnRbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBzdHJlYW07XHJcblxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICB2YXIgdG90YWwgPSAwLCBsZW5ndGggPSB0aGlzLmZyYWdtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0b3RhbCArPSB0aGlzLmZyYWdtZW50c1tpXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyYW0sIHByaXZhdGUgZXhwciwgcHVibGljIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICBmb3IgKHZhciBjaGlsZCBvZiBjaGlsZHJlbikge1xyXG4gICAgICAgICAgICBpZiAoIWNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcImNoaWxkIGlzIG5vdCBhIG5vZGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG5vdGlmeSgpIHtcclxuICAgICAgICB2YXIgc3RyZWFtLCBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xyXG4gICAgICAgIGlmICghIXRoaXMuZXhwciAmJiAhIXRoaXMuZXhwci5leGVjdXRlKSB7XHJcbiAgICAgICAgICAgIHN0cmVhbSA9IHRoaXMuZXhwci5leGVjdXRlKHRoaXMsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLmxlbmd0aCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS52YWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0gPSBbc3RyZWFtXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzdHJlYW0gPSBbY29udGV4dF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RyZWFtID0gc3RyZWFtO1xyXG5cclxuICAgICAgICB2YXIgaSA9IDA7XHJcbiAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGZyYWcgPSB0aGlzLmZyYWdtZW50c1tpXTtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS5pbmRleE9mKGZyYWcuY29udGV4dCkgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBmcmFnLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudHNbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBzd2FwKGFycjogRnJhZ21lbnRbXSwgc3JjSW5kZXgsIHRhckluZGV4KSB7XHJcbiAgICAgICAgaWYgKHNyY0luZGV4ID4gdGFySW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGkgPSBzcmNJbmRleDtcclxuICAgICAgICAgICAgc3JjSW5kZXggPSB0YXJJbmRleDtcclxuICAgICAgICAgICAgdGFySW5kZXggPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgc3JjID0gYXJyW3NyY0luZGV4XTtcclxuICAgICAgICAgICAgYXJyW3NyY0luZGV4XSA9IGFyclt0YXJJbmRleF07XHJcbiAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB0aGlzLm5vdGlmeSgpO1xyXG4gICAgICAgIHZhciBzdHJlYW0gPSB0aGlzLnN0cmVhbTtcclxuXHJcbiAgICAgICAgdmFyIGZyOiBGcmFnbWVudCwgc3RyZWFtbGVuZ3RoID0gc3RyZWFtLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmVhbWxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVtID0gc3RyZWFtLmdldCA/IHN0cmVhbS5nZXQoaSkgOiBzdHJlYW1baV07XHJcblxyXG4gICAgICAgICAgICB2YXIgZnJhZ21lbnQ6IEZyYWdtZW50ID0gbnVsbCwgZnJhZ2xlbmd0aCA9IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yIChsZXQgZSA9IGk7IGUgPCBmcmFnbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIGZyID0gdGhpcy5mcmFnbWVudHNbZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoZnIuY29udGV4dCA9PT0gaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gZnI7XHJcbiAgICAgICAgICAgICAgICAgICAgTWFwQmluZGluZy5zd2FwKHRoaXMuZnJhZ21lbnRzLCBlLCBpKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGZyYWdtZW50ID09PSBudWxsIC8qIG5vdCBmb3VuZCAqLykge1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBuZXcgRnJhZ21lbnQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5wdXNoKGZyYWdtZW50KTtcclxuICAgICAgICAgICAgICAgIE1hcEJpbmRpbmcuc3dhcCh0aGlzLmZyYWdtZW50cywgZnJhZ2xlbmd0aCwgaSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZyYWdtZW50LnVwZGF0ZShpdGVtLCBkcml2ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKHRoaXMuZnJhZ21lbnRzLmxlbmd0aCA+IHN0cmVhbS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGZyYWcgPSB0aGlzLmZyYWdtZW50cy5wb3AoKTtcclxuICAgICAgICAgICAgZnJhZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChmcmFnbWVudDogRnJhZ21lbnQsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZHJpdmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mcmFnbWVudHNbaV0gPT09IGZyYWdtZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuZnJhZ21lbnRzW2ldLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRyaXZlci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgRnJhZ21lbnRCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwdWJsaWMgZnJhZ21lbnQ6IEZyYWdtZW50O1xyXG4gICAgcHJpdmF0ZSBzdHJlYW07XHJcblxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5mcmFnbWVudC5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICBmb3IgKHZhciBjaGlsZCBvZiBjaGlsZHJlbikge1xyXG4gICAgICAgICAgICBpZiAoIWNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcImNoaWxkIGlzIG5vdCBhIG5vZGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZnJhZ21lbnQgPSBuZXcgRnJhZ21lbnQodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmZyYWdtZW50LmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgdGhpcy5mcmFnbWVudC51cGRhdGUoY29udGV4dCwgZHJpdmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoZnJhZ21lbnQ6IEZyYWdtZW50LCBkb20sIGlkeCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRyaXZlcikge1xyXG4gICAgICAgICAgICB0aGlzLmRyaXZlci5pbnNlcnQodGhpcywgZG9tLCBpZHgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZyYWdtZW50IHtcclxuICAgIHB1YmxpYyBjaGlsZEJpbmRpbmdzOiBhbnlbXSA9IFtdO1xyXG4gICAgcHVibGljIGNvbnRleHQ7XHJcbiAgICBwdWJsaWMgZHJpdmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgb3duZXI6IHsgcGFyYW0/LCBjaGlsZHJlbjsgY29udGV4dDsgaW5zZXJ0IH0pIHtcclxuICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IHRoaXMub3duZXIuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzW2VdID1cclxuICAgICAgICAgICAgICAgIG93bmVyLmNoaWxkcmVuW2VdLmJpbmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLm93bmVyLnBhcmFtKSB7XHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSB0aGlzLm93bmVyLnBhcmFtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZXh0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMuY29udGV4dDtcclxuICAgICAgICB2YXIgdmFsdWUgPSBjb250ZXh0LmdldCA/IGNvbnRleHQuZ2V0KG5hbWUpIDogY29udGV4dFtuYW1lXTtcclxuICAgICAgICBpZiAodmFsdWUgIT09IHZvaWQgMClcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5vd25lci5jb250ZXh0LmdldChuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICByZWZyZXNoKCkge1xyXG4gICAgICAgIHRoaXMub3duZXIuY29udGV4dC5yZWZyZXNoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB2YXIgYiA9IHRoaXMuY2hpbGRCaW5kaW5nc1tqXTtcclxuICAgICAgICAgICAgYi5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgdmFyIHRvdGFsID0gMDtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0b3RhbCArPSB0aGlzLmNoaWxkQmluZGluZ3Nbal0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICAgICAgdGhpcy5kcml2ZXIgPSBkcml2ZXI7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMub3duZXIuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzW2VdLnVwZGF0ZSh0aGlzLCB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaW5zZXJ0KGJpbmRpbmcsIGRvbSwgaW5kZXgpIHtcclxuICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkQmluZGluZ3NbaV0gPT09IGJpbmRpbmcpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMub3duZXIuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaW5kZXgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uKGV2ZW50TmFtZSwgZG9tLCBldmVudEJpbmRpbmcpIHtcclxuICAgICAgICB0aGlzLmRyaXZlci5vbihldmVudE5hbWUsIGRvbSwgZXZlbnRCaW5kaW5nKTtcclxuICAgIH1cclxufVxyXG5cclxuZGVjbGFyZSBmdW5jdGlvbiBmZXRjaDxUPih1cmw6IHN0cmluZywgY29uZmlnPyk6IFByb21pc2U8VD47XHJcblxyXG5leHBvcnQgY2xhc3MgUmVtb3RlT2JqZWN0IHtcclxuICAgIHByb21pc2U6IFByb21pc2U8T2JqZWN0PjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHVybDogc3RyaW5nLCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICB2YXIgY29uZmlnID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGFyc2UoZXhwcikpXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9taXNlID0gZmV0Y2godXJsLCBjb25maWcpLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJzY3JpYmUob2JzZXJ2ZXIpIHtcclxuICAgICAgICB0aGlzLnByb21pc2UudGhlbigoZGF0YTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIG9ic2VydmVyLm9uTmV4dChkYXRhKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuIl19