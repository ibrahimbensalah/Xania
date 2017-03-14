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
                result.push(Component(child, {}));
            }
            else {
                result.push(child);
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
                        else if (prop === "htmlFor")
                            tag.attr("for", attrValue);
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
                return Component(Reflect.construct(element, [attrs || {}, childTemplates]), attrs);
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
function Component(component, props) {
    return {
        component: component,
        bind: function () {
            return new ComponentBinding(this.component, props);
        }
    };
}
;
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
    ComponentBinding.prototype.update2 = function (context, driver) {
        this.binding.update2(this.componentStore, driver);
        _super.prototype.update2.call(this, context, driver);
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
        this.binding.execute();
    };
    ComponentBinding.prototype.dispose = function () {
        this.binding.dispose();
    };
    return ComponentBinding;
}(reactive_1.Reactive.Binding));
function Repeat(attrs, children) {
    return new RepeatTemplate(attrs.param, attrs.source, children, dom_1.Dom.DomVisitor);
}
exports.Repeat = Repeat;
function ForEach(attrs, children) {
    return new ForEachTemplate(attrs.param, attrs.source, children, dom_1.Dom.DomVisitor);
}
exports.ForEach = ForEach;
function With(attrs, children) {
    return {
        bind: function () {
            return new WithBinding(attrs.object, children);
        }
    };
}
exports.With = With;
var WithBinding = (function (_super) {
    __extends(WithBinding, _super);
    function WithBinding(expr, children) {
        var _this = _super.call(this) || this;
        _this.expr = expr;
        _this.children = children;
        _this.conditionalBindings = [];
        return _this;
    }
    WithBinding.prototype.render = function (context, driver) {
        var _this = this;
        var result = this.evaluateObject(this.expr, context);
        this.object = result;
        var value = result && !!result.valueOf();
        var childBindings = this.conditionalBindings, i = childBindings.length;
        if (value) {
            if (!i) {
                this.children.forEach(function (x) { return childBindings.push(x.bind().update(_this, driver)); });
            }
            else {
                while (i--) {
                    childBindings[i].update(this, driver);
                }
            }
        }
        else {
            while (i--) {
                childBindings[i].dispose();
            }
            childBindings.length = 0;
        }
    };
    WithBinding.prototype.get = function (name) {
        return this.object.get(name);
    };
    WithBinding.prototype.refresh = function () {
        this.context.refresh();
    };
    return WithBinding;
}(reactive_1.Reactive.Binding));
exports.WithBinding = WithBinding;
function If(attrs, children) {
    return {
        bind: function () {
            return new IfBinding(attrs.expr, children);
        }
    };
}
exports.If = If;
var IfBinding = (function (_super) {
    __extends(IfBinding, _super);
    function IfBinding(expr, children) {
        var _this = _super.call(this) || this;
        _this.expr = expr;
        _this.children = children;
        _this.conditionalBindings = [];
        return _this;
    }
    IfBinding.prototype.render = function (context, driver) {
        var result = this.evaluateObject(this.expr, context);
        var value = result && !!result.valueOf();
        var childBindings = this.conditionalBindings, i = childBindings.length;
        if (value) {
            if (!i) {
                this.children.forEach(function (x) { return childBindings.push(x.bind().update(context, driver)); });
            }
            else {
                while (i--) {
                    childBindings[i].update(context, driver);
                }
            }
        }
        else {
            while (i--) {
                childBindings[i].dispose();
            }
            childBindings.length = 0;
        }
    };
    return IfBinding;
}(reactive_1.Reactive.Binding));
exports.IfBinding = IfBinding;
function expr(code) {
    return compile_1.default(code);
}
exports.expr = expr;
var RepeatTemplate = (function () {
    function RepeatTemplate(param, expr, children, visitor) {
        this.param = param;
        this.expr = expr;
        this.children = children;
        this.visitor = visitor;
    }
    RepeatTemplate.prototype.bind = function () {
        return new RepeatBinding(this.param, this.expr, this.children);
    };
    return RepeatTemplate;
}());
exports.RepeatTemplate = RepeatTemplate;
var ForEachTemplate = (function () {
    function ForEachTemplate(param, expr, children, visitor) {
        this.param = param;
        this.expr = expr;
        this.children = children;
        this.visitor = visitor;
    }
    ForEachTemplate.prototype.bind = function () {
        return new ForEachBinding(this.param, this.expr, this.children);
    };
    return ForEachTemplate;
}());
exports.ForEachTemplate = ForEachTemplate;
var ForEachBinding = (function (_super) {
    __extends(ForEachBinding, _super);
    function ForEachBinding(param, expr, children) {
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
    Object.defineProperty(ForEachBinding.prototype, "length", {
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
    ForEachBinding.prototype.dispose = function () {
        for (var i = 0; i < this.fragments.length; i++) {
            this.fragments[i].dispose();
        }
    };
    ForEachBinding.swap = function (arr, srcIndex, tarIndex) {
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
    ForEachBinding.prototype.render = function (context, driver) {
        var stream = this.expr.execute(this, context).iterator();
        var i = stream.length, fragments = this.fragments, fragmentLength = fragments.length;
        while (i--) {
            var item = stream.get ? stream.get(i) : stream[i], fragment;
            if (i < fragmentLength) {
                fragment = fragments[i];
            }
            else {
                fragment = new Fragment(this);
                fragments.push(fragment);
            }
            fragment.update(item, driver);
        }
        while (fragments.length > stream.length) {
            fragments.pop().dispose();
        }
    };
    ForEachBinding.prototype.insert = function (fragment, dom, idx) {
        if (this.driver) {
            var offset = 0, fragments = this.fragments, i = fragments.length;
            while (i--) {
                var fr = fragments[i];
                if (fr === fragment)
                    break;
                offset += fr.length;
            }
            this.driver.insert(this, dom, offset + idx);
        }
    };
    return ForEachBinding;
}(reactive_1.Reactive.Binding));
var RepeatBinding = (function (_super) {
    __extends(RepeatBinding, _super);
    function RepeatBinding(param, expr, children) {
        var _this = _super.call(this) || this;
        _this.param = param;
        _this.expr = expr;
        _this.children = children;
        _this.fragments = [];
        for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
            var child = children_2[_i];
            if (!child.bind)
                throw Error("child is not a node");
        }
        return _this;
    }
    Object.defineProperty(RepeatBinding.prototype, "length", {
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
    RepeatBinding.prototype.notify = function () {
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
    RepeatBinding.prototype.dispose = function () {
        for (var i = 0; i < this.fragments.length; i++) {
            this.fragments[i].dispose();
        }
    };
    RepeatBinding.swap = function (arr, srcIndex, tarIndex) {
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
    RepeatBinding.prototype.render = function (context, driver) {
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
                    RepeatBinding.swap(this.fragments, e, i);
                    break;
                }
            }
            if (fragment === null) {
                fragment = new Fragment(this);
                this.fragments.push(fragment);
                RepeatBinding.swap(this.fragments, fraglength, i);
            }
            fragment.update2(item, driver);
        }
        while (this.fragments.length > stream.length) {
            var frag = this.fragments.pop();
            frag.dispose();
        }
    };
    RepeatBinding.prototype.insert = function (fragment, dom, idx) {
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
    return RepeatBinding;
}(reactive_1.Reactive.Binding));
var FragmentBinding = (function (_super) {
    __extends(FragmentBinding, _super);
    function FragmentBinding(children) {
        var _this = _super.call(this) || this;
        _this.children = children;
        for (var _i = 0, children_3 = children; _i < children_3.length; _i++) {
            var child = children_3[_i];
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
        this.fragment.update2(context, driver);
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
    Fragment.prototype.update2 = function (context, driver) {
        this.context = context;
        this.driver = driver;
        var length = this.owner.children.length;
        for (var e = 0; e < length; e++) {
            this.childBindings[e].update2(this, this);
        }
        return this;
    };
    Fragment.prototype.execute = function () {
        return this.childBindings;
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
var RemoteDataSource = (function () {
    function RemoteDataSource(url, body) {
        this.url = url;
        this.body = body;
        this.observers = [];
        this.object = [];
        this.reload();
    }
    RemoteDataSource.prototype.reload = function () {
        var _this = this;
        var config = {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(compile_1.parse(this.body))
        };
        return fetch(this.url + "query", config)
            .then(function (response) {
            return response.json();
        })
            .then(function (data) {
            _this.object = data;
            for (var i = 0; i < _this.observers.length; i++) {
                _this.observers[i].onNext(_this.object);
            }
        });
    };
    RemoteDataSource.prototype.subscribe = function (observer) {
        if (this.object !== null)
            observer.onNext(this.object);
        this.observers.push(observer);
    };
    RemoteDataSource.prototype.valueOf = function () {
        return this.object;
    };
    RemoteDataSource.prototype.save = function (record) {
        var _this = this;
        Resource.create(this.url, record).then(function (response) {
            _this.reload();
        });
    };
    return RemoteDataSource;
}());
exports.RemoteDataSource = RemoteDataSource;
var ModelRepository = (function () {
    function ModelRepository(url, expr) {
        this.currentRow = null;
        this.dataSource = new RemoteDataSource(url, expr);
    }
    ModelRepository.prototype.save = function () {
        this.dataSource.save(this.currentRow);
        this.cancel();
    };
    ModelRepository.prototype.cancel = function () {
        this.currentRow = null;
    };
    return ModelRepository;
}());
exports.ModelRepository = ModelRepository;
var Resource = (function () {
    function Resource() {
    }
    Resource.create = function (url, body) {
        var config = {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(body)
        };
        return fetch(url, config);
    };
    return Resource;
}());
exports.Resource = Resource;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4YW5pYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1Q0FBcUM7QUFrSWxCLHVDQUFRO0FBakkzQiw2QkFBMkI7QUFpSUUsd0JBQUc7QUFoSWhDLHFDQUFpRDtBQUNqRCx1Q0FBcUM7QUErSDVCLHVDQUFRO0FBN0hqQjtJQUFBO0lBOEVBLENBQUM7SUE3RVUsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQztZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQW1CLEtBQUssRUFBRSxTQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNwRixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5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dGVtcGxhdGVcIlxyXG5pbXBvcnQgeyBEb20gfSBmcm9tIFwiLi9kb21cIlxyXG5pbXBvcnQgY29tcGlsZSwgeyBTY29wZSwgcGFyc2UgfSBmcm9tIFwiLi9jb21waWxlXCJcclxuaW1wb3J0IHsgUmVhY3RpdmUgfSBmcm9tIFwiLi9yZWFjdGl2ZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgWGFuaWEge1xyXG4gICAgc3RhdGljIHRlbXBsYXRlcyhlbGVtZW50cykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGVsZW1lbnRzW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoaWxkID09PSBudWxsIHx8IGNoaWxkID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoY2hpbGQuYmluZClcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGNoaWxkID09PSBcIm51bWJlclwiIHx8IHR5cGVvZiBjaGlsZCA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgY2hpbGQuZXhlY3V0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlPFJlYWN0aXZlLkJpbmRpbmc+KGNoaWxkLCBEb20uRG9tVmlzaXRvcikpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoY2hpbGQpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRUZW1wbGF0ZXMgPSB0aGlzLnRlbXBsYXRlcyhjaGlsZCk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNoaWxkVGVtcGxhdGVzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2hpbGRUZW1wbGF0ZXNbal0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjaGlsZC52aWV3ID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKENvbXBvbmVudChjaGlsZCwge30pKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHN2Z0VsZW1lbnRzID0gW1wic3ZnXCIsIFwiY2lyY2xlXCIsIFwibGluZVwiLCBcImdcIiwgXCJwYXRoXCIsIFwibWFya2VyXCJdO1xyXG5cclxuICAgIHN0YXRpYyB0YWcoZWxlbWVudCwgYXR0cnMsIC4uLmNoaWxkcmVuKTogVGVtcGxhdGUuSU5vZGUge1xyXG4gICAgICAgIHZhciBjaGlsZFRlbXBsYXRlcyA9IHRoaXMudGVtcGxhdGVzKGNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBUZW1wbGF0ZS5UYWdUZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHZhciBucyA9IFhhbmlhLnN2Z0VsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPj0gMCA/IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiA6IG51bGw7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGVtcGxhdGUuVGFnVGVtcGxhdGU8UmVhY3RpdmUuQmluZGluZz4oZWxlbWVudCwgbnMsIGNoaWxkVGVtcGxhdGVzLCBEb20uRG9tVmlzaXRvcik7XHJcbiAgICAgICAgICAgIGlmIChhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXR0clZhbHVlID0gYXR0cnNbcHJvcF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wID09PSBcImNsYXNzTmFtZVwiIHx8IHByb3AgPT09IFwiY2xhc3NuYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGF6elwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIoXCJjbGFzc1wiLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChwcm9wID09PSBcImh0bWxGb3JcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiZm9yXCIsIGF0dHJWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKHByb3AsIGF0dHJWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhdHRycy5uYW1lID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGF0dHJzLnR5cGUgPT09IFwidGV4dFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYXR0cnMudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwidmFsdWVcIiwgY29tcGlsZShhdHRycy5uYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LnByb3RvdHlwZS5iaW5kKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUmVmbGVjdC5jb25zdHJ1Y3QoZWxlbWVudCwgW2F0dHJzIHx8IHt9LCBjaGlsZFRlbXBsYXRlc10pO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQucHJvdG90eXBlLnZpZXcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBDb21wb25lbnQoUmVmbGVjdC5jb25zdHJ1Y3QoZWxlbWVudCwgW2F0dHJzIHx8IHt9LCBjaGlsZFRlbXBsYXRlc10pLCBhdHRycyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmlldyA9IGVsZW1lbnQoYXR0cnMgfHwge30sIGNoaWxkVGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgICAgIGlmICghdmlldylcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gbG9hZCB2aWV3XCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZpZXc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcInRhZyB1bnJlc29sdmVkXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcmVuZGVyKGVsZW1lbnQsIGRyaXZlcikge1xyXG4gICAgICAgIHJldHVybiBYYW5pYS50YWcoZWxlbWVudCwge30pXHJcbiAgICAgICAgICAgIC5iaW5kKClcclxuICAgICAgICAgICAgLnVwZGF0ZShuZXcgUmVhY3RpdmUuU3RvcmUoe30pLCBkcml2ZXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBDb21wb25lbnQoY29tcG9uZW50LCBwcm9wcykge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjb21wb25lbnQsXHJcbiAgICAgICAgYmluZCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRCaW5kaW5nKHRoaXMuY29tcG9uZW50LCBwcm9wcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuY2xhc3MgQ29tcG9uZW50QmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBiaW5kaW5nOiBGcmFnbWVudEJpbmRpbmc7XHJcbiAgICBwcml2YXRlIGNvbXBvbmVudFN0b3JlID0gbmV3IFJlYWN0aXZlLlN0b3JlKHRoaXMuY29tcG9uZW50KTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudCwgcHJpdmF0ZSBwcm9wcykge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nID0gbmV3IEZyYWdtZW50QmluZGluZyhbY29tcG9uZW50LnZpZXcoWGFuaWEpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlMihjb250ZXh0LCBkcml2ZXIpOiB0aGlzIHtcclxuICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlMih0aGlzLmNvbXBvbmVudFN0b3JlLCBkcml2ZXIpO1xyXG4gICAgICAgIHN1cGVyLnVwZGF0ZTIoY29udGV4dCwgZHJpdmVyKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgIGxldCBwcm9wcyA9IHRoaXMucHJvcHM7XHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBwcm9wcykge1xyXG4gICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBleHByID0gcHJvcHNbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlVmFsdWUgPSBleHByLmV4ZWN1dGUgPyBleHByLmV4ZWN1dGUodGhpcywgY29udGV4dCkgOiBleHByO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZVZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRbcHJvcF0gPSBzb3VyY2VWYWx1ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRTdG9yZS5yZWZyZXNoKCk7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nLmV4ZWN1dGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuYmluZGluZy5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5leHBvcnQgeyBSZWFjdGl2ZSwgVGVtcGxhdGUsIERvbSB9XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gUmVwZWF0KGF0dHJzLCBjaGlsZHJlbikge1xyXG4gICAgcmV0dXJuIG5ldyBSZXBlYXRUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihhdHRycy5wYXJhbSwgYXR0cnMuc291cmNlLCBjaGlsZHJlbiwgRG9tLkRvbVZpc2l0b3IpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gRm9yRWFjaChhdHRycywgY2hpbGRyZW4pIHtcclxuICAgIHJldHVybiBuZXcgRm9yRWFjaFRlbXBsYXRlPFJlYWN0aXZlLkJpbmRpbmc+KGF0dHJzLnBhcmFtLCBhdHRycy5zb3VyY2UsIGNoaWxkcmVuLCBEb20uRG9tVmlzaXRvcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBXaXRoKGF0dHJzLCBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBiaW5kKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFdpdGhCaW5kaW5nKGF0dHJzLm9iamVjdCwgY2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFdpdGhCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwcml2YXRlIGNvbmRpdGlvbmFsQmluZGluZ3MgPSBbXTtcclxuICAgIHByaXZhdGUgb2JqZWN0O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwciwgcHJpdmF0ZSBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmV2YWx1YXRlT2JqZWN0KHRoaXMuZXhwciwgY29udGV4dCk7XHJcbiAgICAgICAgdGhpcy5vYmplY3QgPSByZXN1bHQ7XHJcblxyXG4gICAgICAgIHZhciB2YWx1ZSA9IHJlc3VsdCAmJiAhIXJlc3VsdC52YWx1ZU9mKCk7XHJcbiAgICAgICAgdmFyIGNoaWxkQmluZGluZ3M6IGFueVtdID0gdGhpcy5jb25kaXRpb25hbEJpbmRpbmdzLFxyXG4gICAgICAgICAgICBpID0gY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoIWkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaCh4ID0+IGNoaWxkQmluZGluZ3MucHVzaCh4LmJpbmQoKS51cGRhdGUodGhpcywgZHJpdmVyKSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkQmluZGluZ3NbaV0udXBkYXRlKHRoaXMsIGRyaXZlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBjaGlsZEJpbmRpbmdzW2ldLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjaGlsZEJpbmRpbmdzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYmplY3QuZ2V0KG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlZnJlc2goKSB7XHJcbiAgICAgICAgdGhpcy5jb250ZXh0LnJlZnJlc2goKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIElmKGF0dHJzLCBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBiaW5kKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IElmQmluZGluZyhhdHRycy5leHByLCBjaGlsZHJlbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSWZCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwcml2YXRlIGNvbmRpdGlvbmFsQmluZGluZ3MgPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwciwgcHJpdmF0ZSBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmV2YWx1YXRlT2JqZWN0KHRoaXMuZXhwciwgY29udGV4dCk7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gcmVzdWx0ICYmICEhcmVzdWx0LnZhbHVlT2YoKTtcclxuICAgICAgICB2YXIgY2hpbGRCaW5kaW5nczogYW55W10gPSB0aGlzLmNvbmRpdGlvbmFsQmluZGluZ3MsXHJcbiAgICAgICAgICAgIGkgPSBjaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICghaSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKHggPT4gY2hpbGRCaW5kaW5ncy5wdXNoKHguYmluZCgpLnVwZGF0ZShjb250ZXh0LCBkcml2ZXIpKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRCaW5kaW5nc1tpXS51cGRhdGUoY29udGV4dCwgZHJpdmVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGNoaWxkQmluZGluZ3NbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNoaWxkQmluZGluZ3MubGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHByKGNvZGU6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIGNvbXBpbGUoY29kZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBSZXBlYXRUZW1wbGF0ZTxUPiBpbXBsZW1lbnRzIFRlbXBsYXRlLklOb2RlIHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyYW0sIHByaXZhdGUgZXhwciwgcHJpdmF0ZSBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSwgcHJpdmF0ZSB2aXNpdG9yOiBUZW1wbGF0ZS5JVmlzaXRvcjxUPikgeyB9XHJcblxyXG4gICAgYmluZCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlcGVhdEJpbmRpbmcodGhpcy5wYXJhbSwgdGhpcy5leHByLCB0aGlzLmNoaWxkcmVuKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZvckVhY2hUZW1wbGF0ZTxUPiBpbXBsZW1lbnRzIFRlbXBsYXRlLklOb2RlIHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyYW0sIHByaXZhdGUgZXhwciwgcHJpdmF0ZSBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSwgcHJpdmF0ZSB2aXNpdG9yOiBUZW1wbGF0ZS5JVmlzaXRvcjxUPikgeyB9XHJcblxyXG4gICAgYmluZCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEZvckVhY2hCaW5kaW5nKHRoaXMucGFyYW0sIHRoaXMuZXhwciwgdGhpcy5jaGlsZHJlbik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEZvckVhY2hCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwdWJsaWMgZnJhZ21lbnRzOiBGcmFnbWVudFtdID0gW107XHJcblxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICB2YXIgdG90YWwgPSAwLCBsZW5ndGggPSB0aGlzLmZyYWdtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0b3RhbCArPSB0aGlzLmZyYWdtZW50c1tpXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyYW0sIHByaXZhdGUgZXhwciwgcHVibGljIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICBmb3IgKHZhciBjaGlsZCBvZiBjaGlsZHJlbikge1xyXG4gICAgICAgICAgICBpZiAoIWNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcImNoaWxkIGlzIG5vdCBhIG5vZGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50c1tpXS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIHN3YXAoYXJyOiBGcmFnbWVudFtdLCBzcmNJbmRleCwgdGFySW5kZXgpIHtcclxuICAgICAgICBpZiAoc3JjSW5kZXggPiB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgaSA9IHNyY0luZGV4O1xyXG4gICAgICAgICAgICBzcmNJbmRleCA9IHRhckluZGV4O1xyXG4gICAgICAgICAgICB0YXJJbmRleCA9IGk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzcmNJbmRleCA8IHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBzcmMgPSBhcnJbc3JjSW5kZXhdO1xyXG4gICAgICAgICAgICBhcnJbc3JjSW5kZXhdID0gYXJyW3RhckluZGV4XTtcclxuICAgICAgICAgICAgYXJyW3RhckluZGV4XSA9IHNyYztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHZhciBzdHJlYW0gPSB0aGlzLmV4cHIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KS5pdGVyYXRvcigpO1xyXG5cclxuICAgICAgICB2YXIgaSA9IHN0cmVhbS5sZW5ndGgsXHJcbiAgICAgICAgICAgIGZyYWdtZW50cyA9IHRoaXMuZnJhZ21lbnRzLFxyXG4gICAgICAgICAgICBmcmFnbWVudExlbmd0aCA9IGZyYWdtZW50cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgdmFyIGl0ZW0gPSBzdHJlYW0uZ2V0ID8gc3RyZWFtLmdldChpKSA6IHN0cmVhbVtpXSwgZnJhZ21lbnQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA8IGZyYWdtZW50TGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudCA9IGZyYWdtZW50c1tpXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gbmV3IEZyYWdtZW50KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2goZnJhZ21lbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZyYWdtZW50LnVwZGF0ZShpdGVtLCBkcml2ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKGZyYWdtZW50cy5sZW5ndGggPiBzdHJlYW0ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGZyYWdtZW50cy5wb3AoKS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChmcmFnbWVudDogRnJhZ21lbnQsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZHJpdmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwLCBmcmFnbWVudHMgPSB0aGlzLmZyYWdtZW50cywgaSA9IGZyYWdtZW50cy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZnIgPSBmcmFnbWVudHNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoZnIgPT09IGZyYWdtZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IGZyLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRyaXZlci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbmNsYXNzIFJlcGVhdEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHB1YmxpYyBmcmFnbWVudHM6IEZyYWdtZW50W10gPSBbXTtcclxuICAgIHByaXZhdGUgc3RyZWFtO1xyXG5cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgdmFyIHRvdGFsID0gMCwgbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHBhcmFtLCBwcml2YXRlIGV4cHIsIHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgb2YgY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgaWYgKCFjaGlsZC5iaW5kKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJjaGlsZCBpcyBub3QgYSBub2RlXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBub3RpZnkoKSB7XHJcbiAgICAgICAgdmFyIHN0cmVhbSwgY29udGV4dCA9IHRoaXMuY29udGV4dDtcclxuICAgICAgICBpZiAoISF0aGlzLmV4cHIgJiYgISF0aGlzLmV4cHIuZXhlY3V0ZSkge1xyXG4gICAgICAgICAgICBzdHJlYW0gPSB0aGlzLmV4cHIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS5sZW5ndGggPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0udmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0gPSBbXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gW3N0cmVhbV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3RyZWFtID0gW2NvbnRleHRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0cmVhbSA9IHN0cmVhbTtcclxuXHJcbiAgICAgICAgdmFyIGkgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBmcmFnID0gdGhpcy5mcmFnbWVudHNbaV07XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0uaW5kZXhPZihmcmFnLmNvbnRleHQpIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgZnJhZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzW2ldLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHN3YXAoYXJyOiBGcmFnbWVudFtdLCBzcmNJbmRleCwgdGFySW5kZXgpIHtcclxuICAgICAgICBpZiAoc3JjSW5kZXggPiB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgaSA9IHNyY0luZGV4O1xyXG4gICAgICAgICAgICBzcmNJbmRleCA9IHRhckluZGV4O1xyXG4gICAgICAgICAgICB0YXJJbmRleCA9IGk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzcmNJbmRleCA8IHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBzcmMgPSBhcnJbc3JjSW5kZXhdO1xyXG4gICAgICAgICAgICBhcnJbc3JjSW5kZXhdID0gYXJyW3RhckluZGV4XTtcclxuICAgICAgICAgICAgYXJyW3RhckluZGV4XSA9IHNyYztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHRoaXMubm90aWZ5KCk7XHJcbiAgICAgICAgdmFyIHN0cmVhbSA9IHRoaXMuc3RyZWFtO1xyXG5cclxuICAgICAgICB2YXIgZnI6IEZyYWdtZW50LCBzdHJlYW1sZW5ndGggPSBzdHJlYW0ubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyZWFtbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGl0ZW0gPSBzdHJlYW0uZ2V0ID8gc3RyZWFtLmdldChpKSA6IHN0cmVhbVtpXTtcclxuXHJcbiAgICAgICAgICAgIHZhciBmcmFnbWVudDogRnJhZ21lbnQgPSBudWxsLCBmcmFnbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBlID0gaTsgZSA8IGZyYWdsZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgZnIgPSB0aGlzLmZyYWdtZW50c1tlXTtcclxuICAgICAgICAgICAgICAgIGlmIChmci5jb250ZXh0ID09PSBpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBmcjtcclxuICAgICAgICAgICAgICAgICAgICBSZXBlYXRCaW5kaW5nLnN3YXAodGhpcy5mcmFnbWVudHMsIGUsIGkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZnJhZ21lbnQgPT09IG51bGwgLyogbm90IGZvdW5kICovKSB7XHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBGcmFnbWVudCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzLnB1c2goZnJhZ21lbnQpO1xyXG4gICAgICAgICAgICAgICAgUmVwZWF0QmluZGluZy5zd2FwKHRoaXMuZnJhZ21lbnRzLCBmcmFnbGVuZ3RoLCBpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnJhZ21lbnQudXBkYXRlMihpdGVtLCBkcml2ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKHRoaXMuZnJhZ21lbnRzLmxlbmd0aCA+IHN0cmVhbS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGZyYWcgPSB0aGlzLmZyYWdtZW50cy5wb3AoKTtcclxuICAgICAgICAgICAgZnJhZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChmcmFnbWVudDogRnJhZ21lbnQsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZHJpdmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mcmFnbWVudHNbaV0gPT09IGZyYWdtZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuZnJhZ21lbnRzW2ldLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRyaXZlci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgRnJhZ21lbnRCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwdWJsaWMgZnJhZ21lbnQ6IEZyYWdtZW50O1xyXG4gICAgcHJpdmF0ZSBzdHJlYW07XHJcblxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5mcmFnbWVudC5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICBmb3IgKHZhciBjaGlsZCBvZiBjaGlsZHJlbikge1xyXG4gICAgICAgICAgICBpZiAoIWNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcImNoaWxkIGlzIG5vdCBhIG5vZGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZnJhZ21lbnQgPSBuZXcgRnJhZ21lbnQodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmZyYWdtZW50LmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgdGhpcy5mcmFnbWVudC51cGRhdGUyKGNvbnRleHQsIGRyaXZlcik7XHJcbiAgICB9XHJcblxyXG4gICAgaW5zZXJ0KGZyYWdtZW50OiBGcmFnbWVudCwgZG9tLCBpZHgpIHtcclxuICAgICAgICBpZiAodGhpcy5kcml2ZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5kcml2ZXIuaW5zZXJ0KHRoaXMsIGRvbSwgaWR4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGcmFnbWVudCB7XHJcbiAgICBwdWJsaWMgY2hpbGRCaW5kaW5nczogYW55W10gPSBbXTtcclxuICAgIHB1YmxpYyBjb250ZXh0O1xyXG4gICAgcHVibGljIGRyaXZlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG93bmVyOiB7IHBhcmFtPywgY2hpbGRyZW47IGNvbnRleHQ7IGluc2VydCB9KSB7XHJcbiAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCB0aGlzLm93bmVyLmNoaWxkcmVuLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5nc1tlXSA9XHJcbiAgICAgICAgICAgICAgICBvd25lci5jaGlsZHJlbltlXS5iaW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy5vd25lci5wYXJhbSkge1xyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gdGhpcy5vd25lci5wYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGV4dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gY29udGV4dC5nZXQgPyBjb250ZXh0LmdldChuYW1lKSA6IGNvbnRleHRbbmFtZV07XHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSB2b2lkIDApXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3duZXIuY29udGV4dC5nZXQobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaCgpIHtcclxuICAgICAgICB0aGlzLm93bmVyLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdmFyIGIgPSB0aGlzLmNoaWxkQmluZGluZ3Nbal07XHJcbiAgICAgICAgICAgIGIuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHZhciB0b3RhbCA9IDA7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5jaGlsZEJpbmRpbmdzW2pdLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRvdGFsO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZTIoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICB0aGlzLmRyaXZlciA9IGRyaXZlcjtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5vd25lci5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBsZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbZV0udXBkYXRlMih0aGlzLCB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZEJpbmRpbmdzO1xyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChiaW5kaW5nLCBkb20sIGluZGV4KSB7XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDAsIGxlbmd0aCA9IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmNoaWxkQmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm93bmVyLmluc2VydCh0aGlzLCBkb20sIG9mZnNldCArIGluZGV4KTtcclxuICAgIH1cclxuXHJcbiAgICBvbihldmVudE5hbWUsIGRvbSwgZXZlbnRCaW5kaW5nKSB7XHJcbiAgICAgICAgdGhpcy5kcml2ZXIub24oZXZlbnROYW1lLCBkb20sIGV2ZW50QmluZGluZyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmRlY2xhcmUgZnVuY3Rpb24gZmV0Y2g8VD4odXJsOiBzdHJpbmcsIGNvbmZpZz8pOiBQcm9taXNlPFQ+O1xyXG5cclxuZXhwb3J0IGNsYXNzIFJlbW90ZURhdGFTb3VyY2Uge1xyXG4gICAgcHJpdmF0ZSBvYnNlcnZlcnMgPSBbXTtcclxuICAgIHByaXZhdGUgb2JqZWN0ID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB1cmw6IHN0cmluZywgcHJpdmF0ZSBib2R5KSB7XHJcbiAgICAgICAgdGhpcy5yZWxvYWQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZWxvYWQoKSB7XHJcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBhcnNlKHRoaXMuYm9keSkpXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gZmV0Y2godGhpcy51cmwgKyBcInF1ZXJ5XCIsIGNvbmZpZylcclxuICAgICAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vYmplY3QgPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm9ic2VydmVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JzZXJ2ZXJzW2ldLm9uTmV4dCh0aGlzLm9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN1YnNjcmliZShvYnNlcnZlcikge1xyXG4gICAgICAgIGlmICh0aGlzLm9iamVjdCAhPT0gbnVsbClcclxuICAgICAgICAgICAgb2JzZXJ2ZXIub25OZXh0KHRoaXMub2JqZWN0KTtcclxuXHJcbiAgICAgICAgdGhpcy5vYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFsdWVPZigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYmplY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZShyZWNvcmQpIHtcclxuICAgICAgICBSZXNvdXJjZS5jcmVhdGUodGhpcy51cmwsIHJlY29yZCkudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnJlbG9hZCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTW9kZWxSZXBvc2l0b3J5IHtcclxuICAgIHByaXZhdGUgZGF0YVNvdXJjZTtcclxuICAgIHByb3RlY3RlZCBjdXJyZW50Um93ID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih1cmw6IHN0cmluZywgZXhwcjogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhU291cmNlID0gbmV3IFJlbW90ZURhdGFTb3VyY2UodXJsLCBleHByKTtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuZGF0YVNvdXJjZS5zYXZlKHRoaXMuY3VycmVudFJvdyk7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgIH1cclxuXHJcbiAgICBjYW5jZWwoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50Um93ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjcmVhdGVOZXcoKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFJlc291cmNlIHtcclxuICAgIHN0YXRpYyBjcmVhdGUodXJsLCBib2R5KSB7XHJcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZldGNoKHVybCwgY29uZmlnKTtcclxuICAgIH1cclxufSJdfQ==