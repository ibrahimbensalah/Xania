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
Xania.svgElements = ["svg", "circle", "line", "g", "path"];
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
            new MapTemplate(attrs.source, children, dom_1.Dom.DomVisitor);
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
    function MapTemplate(expr, children, visitor) {
        this.expr = expr;
        this.children = children;
        this.visitor = visitor;
    }
    MapTemplate.prototype.child = function (child) {
        this.children.push(child);
        return this;
    };
    MapTemplate.prototype.bind = function () {
        return new MapBinding(this.expr, this.children);
    };
    return MapTemplate;
}());
exports.MapTemplate = MapTemplate;
var MapBinding = (function (_super) {
    __extends(MapBinding, _super);
    function MapBinding(expr, children) {
        var _this = _super.call(this) || this;
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
            fragment.update(item);
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
    FragmentBinding.swap = function (arr, srcIndex, tarIndex) {
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
    FragmentBinding.prototype.render = function (context, driver) {
        this.fragment.update(context);
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
        var context = this.context;
        var value = context.get ? context.get(name) : context[name];
        if (value !== void 0)
            return value;
        return this.owner.context.get(name);
    };
    Fragment.prototype.refresh = function () {
        this.context.refresh();
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
    Fragment.prototype.update = function (context) {
        this.context = context;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4YW5pYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1Q0FBcUM7QUEySmxCLHVDQUFRO0FBMUozQiw2QkFBMkI7QUEwSkUsd0JBQUc7QUF6SmhDLHFDQUFpRDtBQUNqRCx1Q0FBcUM7QUF3SjVCLHVDQUFRO0FBdEpqQjtJQUFBO0lBaUZBLENBQUM7SUFoRlUsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQztZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQW1CLEtBQUssRUFBRSxTQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNwRixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5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Q29udGVudCI6WyJpbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gXCIuL3RlbXBsYXRlXCJcclxuaW1wb3J0IHsgRG9tIH0gZnJvbSBcIi4vZG9tXCJcclxuaW1wb3J0IGNvbXBpbGUsIHsgU2NvcGUsIHBhcnNlIH0gZnJvbSBcIi4vY29tcGlsZVwiXHJcbmltcG9ydCB7IFJlYWN0aXZlIH0gZnJvbSBcIi4vcmVhY3RpdmVcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFhhbmlhIHtcclxuICAgIHN0YXRpYyB0ZW1wbGF0ZXMoZWxlbWVudHMpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBlbGVtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGlsZCA9PT0gbnVsbCB8fCBjaGlsZCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBjaGlsZCA9PT0gXCJudW1iZXJcIiB8fCB0eXBlb2YgY2hpbGQgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIGNoaWxkLmV4ZWN1dGUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFRlbXBsYXRlLlRleHRUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihjaGlsZCwgRG9tLkRvbVZpc2l0b3IpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGNoaWxkKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjaGlsZFRlbXBsYXRlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkVGVtcGxhdGVzW2pdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY2hpbGQudmlldyA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiBjaGlsZCxcclxuICAgICAgICAgICAgICAgICAgICBiaW5kKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvbXBvbmVudEJpbmRpbmcodGhpcy5jb21wb25lbnQsIHt9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgc3ZnRWxlbWVudHMgPSBbXCJzdmdcIiwgXCJjaXJjbGVcIiwgXCJsaW5lXCIsIFwiZ1wiLCBcInBhdGhcIl07XHJcblxyXG4gICAgc3RhdGljIHRhZyhlbGVtZW50LCBhdHRycywgLi4uY2hpbGRyZW4pOiBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFRlbXBsYXRlLlRhZ1RlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdmFyIG5zID0gWGFuaWEuc3ZnRWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA+PSAwID8gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIDogbnVsbDtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUZW1wbGF0ZS5UYWdUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihlbGVtZW50LCBucywgY2hpbGRUZW1wbGF0ZXMsIERvbS5Eb21WaXNpdG9yKTtcclxuICAgICAgICAgICAgaWYgKGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGF0dHJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhdHRyVmFsdWUgPSBhdHRyc1twcm9wXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3AgPT09IFwiY2xhc3NOYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGFzc25hbWVcIiB8fCBwcm9wID09PSBcImNsYXp6XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcImNsYXNzXCIsIGF0dHJWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKHByb3AsIGF0dHJWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhdHRycy5uYW1lID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLnR5cGUgPT09IFwidGV4dFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYXR0cnMudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwidmFsdWVcIiwgY29tcGlsZShhdHRycy5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnByb3RvdHlwZS5iaW5kKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3QoZWxlbWVudCwgW2F0dHJzIHx8IHt9LCBjaGlsZFRlbXBsYXRlc10pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQucHJvdG90eXBlLnZpZXcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50QmluZGluZyhSZWZsZWN0LmNvbnN0cnVjdChlbGVtZW50LCBbYXR0cnMgfHwge30sIGNoaWxkVGVtcGxhdGVzXSksIGF0dHJzKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciB2aWV3ID0gZWxlbWVudChhdHRycyB8fCB7fSwgY2hpbGRUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF2aWV3KVxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBsb2FkIHZpZXdcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmlldztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwidGFnIHVucmVzb2x2ZWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW5kZXIoZWxlbWVudCwgZHJpdmVyKSB7XHJcbiAgICAgICAgcmV0dXJuIFhhbmlhLnRhZyhlbGVtZW50LCB7fSlcclxuICAgICAgICAgICAgLmJpbmQoKVxyXG4gICAgICAgICAgICAudXBkYXRlKG5ldyBSZWFjdGl2ZS5TdG9yZSh7fSksIGRyaXZlcik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIENvbXBvbmVudEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHByaXZhdGUgYmluZGluZzogRnJhZ21lbnRCaW5kaW5nO1xyXG4gICAgcHJpdmF0ZSBjb21wb25lbnRTdG9yZSA9IG5ldyBSZWFjdGl2ZS5TdG9yZSh0aGlzLmNvbXBvbmVudCk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnQsIHByaXZhdGUgcHJvcHMpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYmluZGluZyA9IG5ldyBGcmFnbWVudEJpbmRpbmcoW2NvbXBvbmVudC52aWV3KFhhbmlhKV0pO1xyXG4gICAgfVxyXG5cclxuICAgIGJpbmQoKTogdGhpcyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKGNvbnRleHQsIGRyaXZlcik6IHRoaXMge1xyXG4gICAgICAgIHRoaXMuYmluZGluZy51cGRhdGUodGhpcy5jb21wb25lbnRTdG9yZSwgZHJpdmVyKTtcclxuICAgICAgICBzdXBlci51cGRhdGUoY29udGV4dCwgZHJpdmVyKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgIGxldCBwcm9wcyA9IHRoaXMucHJvcHM7XHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBwcm9wcykge1xyXG4gICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBleHByID0gcHJvcHNbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlVmFsdWUgPSBleHByLmV4ZWN1dGUgPyBleHByLmV4ZWN1dGUodGhpcywgY29udGV4dCkgOiBleHByO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZVZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRbcHJvcF0gPSBzb3VyY2VWYWx1ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRTdG9yZS5yZWZyZXNoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmJpbmRpbmcuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuLy9jbGFzcyBQYXJ0aWFsQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4vLyAgICBwcml2YXRlIGJpbmRpbmc7XHJcbi8vICAgIHByaXZhdGUgY2FjaGUgPSBbXTtcclxuLy8gICAgY29uc3RydWN0b3IocHJpdmF0ZSB2aWV3LCBwcml2YXRlIG1vZGVsKSB7XHJcbi8vICAgICAgICBzdXBlcigpO1xyXG4vLyAgICB9XHJcblxyXG4vLyAgICByZW5kZXIoY29udGV4dCwgcGFyZW50KSB7XHJcbi8vICAgICAgICB2YXIgdmlldyA9IHRoaXMuZXZhbHVhdGVPYmplY3QodGhpcy52aWV3KS52YWx1ZU9mKCk7XHJcblxyXG4vLyAgICAgICAgaWYgKCF2aWV3KVxyXG4vLyAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInZpZXcgaXMgZW1wdHlcIik7XHJcblxyXG4vLyAgICAgICAgaWYgKHRoaXMuYmluZGluZykge1xyXG4vLyAgICAgICAgICAgIHRoaXMuYmluZGluZy5kaXNwb3NlKCk7XHJcbi8vICAgICAgICB9XHJcblxyXG4vLyAgICAgICAgdmFyIG5ld0JpbmRpbmcgPSBuZXcgRG9tLkZyYWdtZW50QmluZGluZyh0aGlzLm1vZGVsLCBbdmlld10pO1xyXG5cclxuLy8gICAgICAgIHRoaXMuYmluZGluZyA9IG5ld0JpbmRpbmc7XHJcbi8vICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlKGNvbnRleHQsIHBhcmVudCk7XHJcbi8vICAgIH1cclxuXHJcbi8vICAgIG9uTmV4dChfKSB7XHJcbi8vICAgICAgICB0aGlzLmV4ZWN1dGUoKTtcclxuLy8gICAgfVxyXG4vL31cclxuXHJcbmV4cG9ydCB7IFJlYWN0aXZlLCBUZW1wbGF0ZSwgRG9tIH1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUmVwZWF0IHtcclxuICAgIHByaXZhdGUgdGVtcGxhdGU6IE1hcFRlbXBsYXRlPFJlYWN0aXZlLkJpbmRpbmc+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGF0dHJzLCBjaGlsZHJlbikge1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGUgPVxyXG4gICAgICAgICAgICBuZXcgTWFwVGVtcGxhdGU8UmVhY3RpdmUuQmluZGluZz4oYXR0cnMuc291cmNlLCBjaGlsZHJlbiwgRG9tLkRvbVZpc2l0b3IpO1xyXG4gICAgfVxyXG5cclxuICAgIGJpbmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGUuYmluZCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXhwcihjb2RlOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiBjb21waWxlKGNvZGUpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWFwVGVtcGxhdGU8VD4gaW1wbGVtZW50cyBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10sIHByaXZhdGUgdmlzaXRvcjogVGVtcGxhdGUuSVZpc2l0b3I8VD4pIHsgfVxyXG5cclxuICAgIGNoaWxkKGNoaWxkOiBUZW1wbGF0ZS5JTm9kZSkge1xyXG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYmluZCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IE1hcEJpbmRpbmcodGhpcy5leHByLCB0aGlzLmNoaWxkcmVuKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgTWFwQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHVibGljIGZyYWdtZW50czogRnJhZ21lbnRbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBzdHJlYW07XHJcblxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICB2YXIgdG90YWwgPSAwLCBsZW5ndGggPSB0aGlzLmZyYWdtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0b3RhbCArPSB0aGlzLmZyYWdtZW50c1tpXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIsIHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgb2YgY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgaWYgKCFjaGlsZC5iaW5kKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJjaGlsZCBpcyBub3QgYSBub2RlXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBub3RpZnkoKSB7XHJcbiAgICAgICAgdmFyIHN0cmVhbSwgY29udGV4dCA9IHRoaXMuY29udGV4dDtcclxuICAgICAgICBpZiAoISF0aGlzLmV4cHIgJiYgISF0aGlzLmV4cHIuZXhlY3V0ZSkge1xyXG4gICAgICAgICAgICBzdHJlYW0gPSB0aGlzLmV4cHIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS5sZW5ndGggPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0udmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0gPSBbXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gW3N0cmVhbV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3RyZWFtID0gW2NvbnRleHRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0cmVhbSA9IHN0cmVhbTtcclxuXHJcbiAgICAgICAgdmFyIGkgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBmcmFnID0gdGhpcy5mcmFnbWVudHNbaV07XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0uaW5kZXhPZihmcmFnLmNvbnRleHQpIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgZnJhZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzW2ldLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgc3dhcChhcnI6IEZyYWdtZW50W10sIHNyY0luZGV4LCB0YXJJbmRleCkge1xyXG4gICAgICAgIGlmIChzcmNJbmRleCA+IHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBpID0gc3JjSW5kZXg7XHJcbiAgICAgICAgICAgIHNyY0luZGV4ID0gdGFySW5kZXg7XHJcbiAgICAgICAgICAgIHRhckluZGV4ID0gaTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHNyY0luZGV4IDwgdGFySW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIHNyYyA9IGFycltzcmNJbmRleF07XHJcbiAgICAgICAgICAgIGFycltzcmNJbmRleF0gPSBhcnJbdGFySW5kZXhdO1xyXG4gICAgICAgICAgICBhcnJbdGFySW5kZXhdID0gc3JjO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgdGhpcy5ub3RpZnkoKTtcclxuICAgICAgICB2YXIgc3RyZWFtID0gdGhpcy5zdHJlYW07XHJcblxyXG4gICAgICAgIHZhciBmcjogRnJhZ21lbnQsIHN0cmVhbWxlbmd0aCA9IHN0cmVhbS5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJlYW1sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgaXRlbSA9IHN0cmVhbS5nZXQgPyBzdHJlYW0uZ2V0KGkpIDogc3RyZWFtW2ldO1xyXG5cclxuICAgICAgICAgICAgdmFyIGZyYWdtZW50OiBGcmFnbWVudCA9IG51bGwsIGZyYWdsZW5ndGggPSB0aGlzLmZyYWdtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGUgPSBpOyBlIDwgZnJhZ2xlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICBmciA9IHRoaXMuZnJhZ21lbnRzW2VdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZyLmNvbnRleHQgPT09IGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IGZyO1xyXG4gICAgICAgICAgICAgICAgICAgIE1hcEJpbmRpbmcuc3dhcCh0aGlzLmZyYWdtZW50cywgZSwgaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChmcmFnbWVudCA9PT0gbnVsbCAvKiBub3QgZm91bmQgKi8pIHtcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gbmV3IEZyYWdtZW50KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHMucHVzaChmcmFnbWVudCk7XHJcbiAgICAgICAgICAgICAgICBNYXBCaW5kaW5nLnN3YXAodGhpcy5mcmFnbWVudHMsIGZyYWdsZW5ndGgsIGkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmcmFnbWVudC51cGRhdGUoaXRlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aGlsZSAodGhpcy5mcmFnbWVudHMubGVuZ3RoID4gc3RyZWFtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgZnJhZyA9IHRoaXMuZnJhZ21lbnRzLnBvcCgpO1xyXG4gICAgICAgICAgICBmcmFnLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW5zZXJ0KGZyYWdtZW50OiBGcmFnbWVudCwgZG9tLCBpZHgpIHtcclxuICAgICAgICBpZiAodGhpcy5kcml2ZXIpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZyYWdtZW50c1tpXSA9PT0gZnJhZ21lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZHJpdmVyLmluc2VydCh0aGlzLCBkb20sIG9mZnNldCArIGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBGcmFnbWVudEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHB1YmxpYyBmcmFnbWVudDogRnJhZ21lbnQ7XHJcbiAgICBwcml2YXRlIHN0cmVhbTtcclxuXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZyYWdtZW50Lmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIGZvciAodmFyIGNoaWxkIG9mIGNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgIGlmICghY2hpbGQuYmluZClcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiY2hpbGQgaXMgbm90IGEgbm9kZVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5mcmFnbWVudCA9IG5ldyBGcmFnbWVudCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZnJhZ21lbnQuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIHN3YXAoYXJyOiBGcmFnbWVudFtdLCBzcmNJbmRleCwgdGFySW5kZXgpIHtcclxuICAgICAgICBpZiAoc3JjSW5kZXggPiB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgaSA9IHNyY0luZGV4O1xyXG4gICAgICAgICAgICBzcmNJbmRleCA9IHRhckluZGV4O1xyXG4gICAgICAgICAgICB0YXJJbmRleCA9IGk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzcmNJbmRleCA8IHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBzcmMgPSBhcnJbc3JjSW5kZXhdO1xyXG4gICAgICAgICAgICBhcnJbc3JjSW5kZXhdID0gYXJyW3RhckluZGV4XTtcclxuICAgICAgICAgICAgYXJyW3RhckluZGV4XSA9IHNyYztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHRoaXMuZnJhZ21lbnQudXBkYXRlKGNvbnRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChmcmFnbWVudDogRnJhZ21lbnQsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZHJpdmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJpdmVyLmluc2VydCh0aGlzLCBkb20sIGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRnJhZ21lbnQge1xyXG4gICAgcHVibGljIGNoaWxkQmluZGluZ3M6IGFueVtdID0gW107XHJcbiAgICBwdWJsaWMgY29udGV4dDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG93bmVyOiB7IGNoaWxkcmVuOyBjb250ZXh0OyBpbnNlcnQgfSkge1xyXG4gICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgdGhpcy5vd25lci5jaGlsZHJlbi5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbZV0gPVxyXG4gICAgICAgICAgICAgICAgb3duZXIuY2hpbGRyZW5bZV0uYmluZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gY29udGV4dC5nZXQgPyBjb250ZXh0LmdldChuYW1lKSA6IGNvbnRleHRbbmFtZV07XHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSB2b2lkIDApXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3duZXIuY29udGV4dC5nZXQobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaCgpIHtcclxuICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdmFyIGIgPSB0aGlzLmNoaWxkQmluZGluZ3Nbal07XHJcbiAgICAgICAgICAgIGIuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHZhciB0b3RhbCA9IDA7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5jaGlsZEJpbmRpbmdzW2pdLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRvdGFsO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShjb250ZXh0KSB7XHJcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5vd25lci5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBsZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbZV0udXBkYXRlKHRoaXMsIHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoYmluZGluZywgZG9tLCBpbmRleCkge1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRCaW5kaW5nc1tpXSA9PT0gYmluZGluZylcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5jaGlsZEJpbmRpbmdzW2ldLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5vd25lci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpbmRleCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmRlY2xhcmUgZnVuY3Rpb24gZmV0Y2g8VD4odXJsOiBzdHJpbmcsIGNvbmZpZz8pOiBQcm9taXNlPFQ+O1xyXG5cclxuZXhwb3J0IGNsYXNzIFJlbW90ZU9iamVjdCB7XHJcbiAgICBwcm9taXNlOiBQcm9taXNlPE9iamVjdD47XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB1cmw6IHN0cmluZywgcHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBhcnNlKGV4cHIpKVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucHJvbWlzZSA9IGZldGNoKHVybCwgY29uZmlnKS50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3Vic2NyaWJlKG9ic2VydmVyKSB7XHJcbiAgICAgICAgdGhpcy5wcm9taXNlLnRoZW4oKGRhdGE6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBvYnNlcnZlci5vbk5leHQoZGF0YSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==