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
        _this.childBindings = [component.view(Xania).bind()];
        return _this;
    }
    ComponentBinding.prototype.updateChildren = function (context) {
        _super.prototype.updateChildren.call(this, this.componentStore);
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
        var childBindings = this.childBindings;
        if (childBindings) {
            var i = childBindings.length || 0;
            while (i--) {
                var child = childBindings[i];
                child.dispose();
            }
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4YW5pYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1Q0FBcUM7QUF1SWxCLHVDQUFRO0FBdEkzQiw2QkFBMkI7QUFzSUUsd0JBQUc7QUFySWhDLHFDQUFpRDtBQUNqRCx1Q0FBcUM7QUFvSTVCLHVDQUFRO0FBbElqQjtJQUFBO0lBOEVBLENBQUM7SUE3RVUsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQztZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQW1CLEtBQUssRUFBRSxTQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNwRixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5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LCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gXCIuL3RlbXBsYXRlXCJcclxuaW1wb3J0IHsgRG9tIH0gZnJvbSBcIi4vZG9tXCJcclxuaW1wb3J0IGNvbXBpbGUsIHsgU2NvcGUsIHBhcnNlIH0gZnJvbSBcIi4vY29tcGlsZVwiXHJcbmltcG9ydCB7IFJlYWN0aXZlIH0gZnJvbSBcIi4vcmVhY3RpdmVcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFhhbmlhIHtcclxuICAgIHN0YXRpYyB0ZW1wbGF0ZXMoZWxlbWVudHMpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBlbGVtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGlsZCA9PT0gbnVsbCB8fCBjaGlsZCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBjaGlsZCA9PT0gXCJudW1iZXJcIiB8fCB0eXBlb2YgY2hpbGQgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIGNoaWxkLmV4ZWN1dGUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFRlbXBsYXRlLlRleHRUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihjaGlsZCwgRG9tLkRvbVZpc2l0b3IpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGNoaWxkKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjaGlsZFRlbXBsYXRlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkVGVtcGxhdGVzW2pdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY2hpbGQudmlldyA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChDb21wb25lbnQoY2hpbGQsIHt9KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBzdmdFbGVtZW50cyA9IFtcInN2Z1wiLCBcImNpcmNsZVwiLCBcImxpbmVcIiwgXCJnXCIsIFwicGF0aFwiLCBcIm1hcmtlclwiXTtcclxuXHJcbiAgICBzdGF0aWMgdGFnKGVsZW1lbnQsIGF0dHJzLCAuLi5jaGlsZHJlbik6IFRlbXBsYXRlLklOb2RlIHtcclxuICAgICAgICB2YXIgY2hpbGRUZW1wbGF0ZXMgPSB0aGlzLnRlbXBsYXRlcyhjaGlsZHJlbik7XHJcblxyXG4gICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgVGVtcGxhdGUuVGFnVGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB2YXIgbnMgPSBYYW5pYS5zdmdFbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpID49IDAgPyBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgOiBudWxsO1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRlbXBsYXRlLlRhZ1RlbXBsYXRlPFJlYWN0aXZlLkJpbmRpbmc+KGVsZW1lbnQsIG5zLCBjaGlsZFRlbXBsYXRlcywgRG9tLkRvbVZpc2l0b3IpO1xyXG4gICAgICAgICAgICBpZiAoYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IGF0dHJzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcCA9PT0gXCJjbGFzc05hbWVcIiB8fCBwcm9wID09PSBcImNsYXNzbmFtZVwiIHx8IHByb3AgPT09IFwiY2xhenpcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocHJvcCA9PT0gXCJodG1sRm9yXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcImZvclwiLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihwcm9wLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXR0cnMubmFtZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy50eXBlID09PSBcInRleHRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWF0dHJzLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcInZhbHVlXCIsIGNvbXBpbGUoYXR0cnMubmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5wcm90b3R5cGUuYmluZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KGVsZW1lbnQsIFthdHRycyB8fCB7fSwgY2hpbGRUZW1wbGF0ZXNdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LnByb3RvdHlwZS52aWV3KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQ29tcG9uZW50KFJlZmxlY3QuY29uc3RydWN0KGVsZW1lbnQsIFthdHRycyB8fCB7fSwgY2hpbGRUZW1wbGF0ZXNdKSwgYXR0cnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBlbGVtZW50KGF0dHJzIHx8IHt9LCBjaGlsZFRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXZpZXcpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdmlld1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJ0YWcgdW5yZXNvbHZlZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbmRlcihlbGVtZW50LCBkcml2ZXIpIHtcclxuICAgICAgICByZXR1cm4gWGFuaWEudGFnKGVsZW1lbnQsIHt9KVxyXG4gICAgICAgICAgICAuYmluZCgpXHJcbiAgICAgICAgICAgIC51cGRhdGUobmV3IFJlYWN0aXZlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gQ29tcG9uZW50KGNvbXBvbmVudCwgcHJvcHMpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY29tcG9uZW50LFxyXG4gICAgICAgIGJpbmQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50QmluZGluZyh0aGlzLmNvbXBvbmVudCwgcHJvcHMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmNsYXNzIENvbXBvbmVudEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHByaXZhdGUgY29tcG9uZW50U3RvcmUgPSBuZXcgUmVhY3RpdmUuU3RvcmUodGhpcy5jb21wb25lbnQpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50LCBwcml2YXRlIHByb3BzKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MgPSBbY29tcG9uZW50LnZpZXcoWGFuaWEpLmJpbmQoKV07XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlQ2hpbGRyZW4oY29udGV4dCkge1xyXG4gICAgICAgIHN1cGVyLnVwZGF0ZUNoaWxkcmVuKHRoaXMuY29tcG9uZW50U3RvcmUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0KSB7XHJcbiAgICAgICAgbGV0IHByb3BzID0gdGhpcy5wcm9wcztcclxuICAgICAgICBmb3IgKGxldCBwcm9wIGluIHByb3BzKSB7XHJcbiAgICAgICAgICAgIGlmIChwcm9wcy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV4cHIgPSBwcm9wc1twcm9wXTtcclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VWYWx1ZSA9IGV4cHIuZXhlY3V0ZSA/IGV4cHIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KSA6IGV4cHI7XHJcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudFtwcm9wXSA9IHNvdXJjZVZhbHVlLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNvbXBvbmVudFN0b3JlLnJlZnJlc2goKTtcclxuICAgICAgICAvLyB0aGlzLmJpbmRpbmcuZXhlY3V0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdmFyIHsgY2hpbGRCaW5kaW5ncyB9ID0gdGhpcztcclxuICAgICAgICBpZiAoY2hpbGRCaW5kaW5ncykge1xyXG4gICAgICAgICAgICB2YXIgaSA9IGNoaWxkQmluZGluZ3MubGVuZ3RoIHx8IDA7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBjaGlsZDogYW55ID0gY2hpbGRCaW5kaW5nc1tpXTtcclxuICAgICAgICAgICAgICAgIGNoaWxkLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyB0aGlzLmJpbmRpbmcuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IHsgUmVhY3RpdmUsIFRlbXBsYXRlLCBEb20gfVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIFJlcGVhdChhdHRycywgY2hpbGRyZW4pIHtcclxuICAgIHJldHVybiBuZXcgUmVwZWF0VGVtcGxhdGU8UmVhY3RpdmUuQmluZGluZz4oYXR0cnMucGFyYW0sIGF0dHJzLnNvdXJjZSwgY2hpbGRyZW4sIERvbS5Eb21WaXNpdG9yKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEZvckVhY2goYXR0cnMsIGNoaWxkcmVuKSB7XHJcbiAgICByZXR1cm4gbmV3IEZvckVhY2hUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihhdHRycy5wYXJhbSwgYXR0cnMuc291cmNlLCBjaGlsZHJlbiwgRG9tLkRvbVZpc2l0b3IpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gV2l0aChhdHRycywgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYmluZCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBXaXRoQmluZGluZyhhdHRycy5vYmplY3QsIGNoaWxkcmVuKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBXaXRoQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBjb25kaXRpb25hbEJpbmRpbmdzID0gW107XHJcbiAgICBwcml2YXRlIG9iamVjdDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZU9iamVjdCh0aGlzLmV4cHIsIGNvbnRleHQpO1xyXG4gICAgICAgIHRoaXMub2JqZWN0ID0gcmVzdWx0O1xyXG5cclxuICAgICAgICB2YXIgdmFsdWUgPSByZXN1bHQgJiYgISFyZXN1bHQudmFsdWVPZigpO1xyXG4gICAgICAgIHZhciBjaGlsZEJpbmRpbmdzOiBhbnlbXSA9IHRoaXMuY29uZGl0aW9uYWxCaW5kaW5ncyxcclxuICAgICAgICAgICAgaSA9IGNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKCFpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goeCA9PiBjaGlsZEJpbmRpbmdzLnB1c2goeC5iaW5kKCkudXBkYXRlKHRoaXMsIGRyaXZlcikpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZEJpbmRpbmdzW2ldLnVwZGF0ZSh0aGlzLCBkcml2ZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgY2hpbGRCaW5kaW5nc1tpXS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2hpbGRCaW5kaW5ncy5sZW5ndGggPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0LmdldChuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICByZWZyZXNoKCkge1xyXG4gICAgICAgIHRoaXMuY29udGV4dC5yZWZyZXNoKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBJZihhdHRycywgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYmluZCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBJZkJpbmRpbmcoYXR0cnMuZXhwciwgY2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIElmQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBjb25kaXRpb25hbEJpbmRpbmdzID0gW107XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZU9iamVjdCh0aGlzLmV4cHIsIGNvbnRleHQpO1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHJlc3VsdCAmJiAhIXJlc3VsdC52YWx1ZU9mKCk7XHJcbiAgICAgICAgdmFyIGNoaWxkQmluZGluZ3M6IGFueVtdID0gdGhpcy5jb25kaXRpb25hbEJpbmRpbmdzLFxyXG4gICAgICAgICAgICBpID0gY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoIWkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaCh4ID0+IGNoaWxkQmluZGluZ3MucHVzaCh4LmJpbmQoKS51cGRhdGUoY29udGV4dCwgZHJpdmVyKSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkQmluZGluZ3NbaV0udXBkYXRlKGNvbnRleHQsIGRyaXZlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBjaGlsZEJpbmRpbmdzW2ldLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjaGlsZEJpbmRpbmdzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXhwcihjb2RlOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiBjb21waWxlKGNvZGUpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVwZWF0VGVtcGxhdGU8VD4gaW1wbGVtZW50cyBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmFtLCBwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10sIHByaXZhdGUgdmlzaXRvcjogVGVtcGxhdGUuSVZpc2l0b3I8VD4pIHsgfVxyXG5cclxuICAgIGJpbmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBlYXRCaW5kaW5nKHRoaXMucGFyYW0sIHRoaXMuZXhwciwgdGhpcy5jaGlsZHJlbik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGb3JFYWNoVGVtcGxhdGU8VD4gaW1wbGVtZW50cyBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmFtLCBwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10sIHByaXZhdGUgdmlzaXRvcjogVGVtcGxhdGUuSVZpc2l0b3I8VD4pIHsgfVxyXG5cclxuICAgIGJpbmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBGb3JFYWNoQmluZGluZyh0aGlzLnBhcmFtLCB0aGlzLmV4cHIsIHRoaXMuY2hpbGRyZW4pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBGb3JFYWNoQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHVibGljIGZyYWdtZW50czogRnJhZ21lbnRbXSA9IFtdO1xyXG5cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgdmFyIHRvdGFsID0gMCwgbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHBhcmFtLCBwcml2YXRlIGV4cHIsIHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgb2YgY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgaWYgKCFjaGlsZC5iaW5kKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJjaGlsZCBpcyBub3QgYSBub2RlXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudHNbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBzd2FwKGFycjogRnJhZ21lbnRbXSwgc3JjSW5kZXgsIHRhckluZGV4KSB7XHJcbiAgICAgICAgaWYgKHNyY0luZGV4ID4gdGFySW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGkgPSBzcmNJbmRleDtcclxuICAgICAgICAgICAgc3JjSW5kZXggPSB0YXJJbmRleDtcclxuICAgICAgICAgICAgdGFySW5kZXggPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgc3JjID0gYXJyW3NyY0luZGV4XTtcclxuICAgICAgICAgICAgYXJyW3NyY0luZGV4XSA9IGFyclt0YXJJbmRleF07XHJcbiAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB2YXIgc3RyZWFtID0gdGhpcy5leHByLmV4ZWN1dGUodGhpcywgY29udGV4dCkuaXRlcmF0b3IoKTtcclxuXHJcbiAgICAgICAgdmFyIGkgPSBzdHJlYW0ubGVuZ3RoLFxyXG4gICAgICAgICAgICBmcmFnbWVudHMgPSB0aGlzLmZyYWdtZW50cyxcclxuICAgICAgICAgICAgZnJhZ21lbnRMZW5ndGggPSBmcmFnbWVudHMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVtID0gc3RyZWFtLmdldCA/IHN0cmVhbS5nZXQoaSkgOiBzdHJlYW1baV0sIGZyYWdtZW50O1xyXG5cclxuICAgICAgICAgICAgaWYgKGkgPCBmcmFnbWVudExlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudHNbaV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBGcmFnbWVudCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoKGZyYWdtZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmcmFnbWVudC51cGRhdGUoaXRlbSwgZHJpdmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoaWxlIChmcmFnbWVudHMubGVuZ3RoID4gc3RyZWFtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBmcmFnbWVudHMucG9wKCkuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoZnJhZ21lbnQ6IEZyYWdtZW50LCBkb20sIGlkeCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRyaXZlcikge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgZnJhZ21lbnRzID0gdGhpcy5mcmFnbWVudHMsIGkgPSBmcmFnbWVudHMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZyID0gZnJhZ21lbnRzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZyID09PSBmcmFnbWVudClcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIG9mZnNldCArPSBmci5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kcml2ZXIuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaWR4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5jbGFzcyBSZXBlYXRCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwdWJsaWMgZnJhZ21lbnRzOiBGcmFnbWVudFtdID0gW107XHJcbiAgICBwcml2YXRlIHN0cmVhbTtcclxuXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHZhciB0b3RhbCA9IDAsIGxlbmd0aCA9IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRvdGFsICs9IHRoaXMuZnJhZ21lbnRzW2ldLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRvdGFsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXJhbSwgcHJpdmF0ZSBleHByLCBwdWJsaWMgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIGZvciAodmFyIGNoaWxkIG9mIGNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgIGlmICghY2hpbGQuYmluZClcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiY2hpbGQgaXMgbm90IGEgbm9kZVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbm90aWZ5KCkge1xyXG4gICAgICAgIHZhciBzdHJlYW0sIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XHJcbiAgICAgICAgaWYgKCEhdGhpcy5leHByICYmICEhdGhpcy5leHByLmV4ZWN1dGUpIHtcclxuICAgICAgICAgICAgc3RyZWFtID0gdGhpcy5leHByLmV4ZWN1dGUodGhpcywgY29udGV4dCk7XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0ubGVuZ3RoID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLnZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gW107XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbSA9IFtzdHJlYW1dO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN0cmVhbSA9IFtjb250ZXh0XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zdHJlYW0gPSBzdHJlYW07XHJcblxyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuZnJhZ21lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgZnJhZyA9IHRoaXMuZnJhZ21lbnRzW2ldO1xyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLmluZGV4T2YoZnJhZy5jb250ZXh0KSA8IDApIHtcclxuICAgICAgICAgICAgICAgIGZyYWcuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50c1tpXS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBzd2FwKGFycjogRnJhZ21lbnRbXSwgc3JjSW5kZXgsIHRhckluZGV4KSB7XHJcbiAgICAgICAgaWYgKHNyY0luZGV4ID4gdGFySW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGkgPSBzcmNJbmRleDtcclxuICAgICAgICAgICAgc3JjSW5kZXggPSB0YXJJbmRleDtcclxuICAgICAgICAgICAgdGFySW5kZXggPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgc3JjID0gYXJyW3NyY0luZGV4XTtcclxuICAgICAgICAgICAgYXJyW3NyY0luZGV4XSA9IGFyclt0YXJJbmRleF07XHJcbiAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB0aGlzLm5vdGlmeSgpO1xyXG4gICAgICAgIHZhciBzdHJlYW0gPSB0aGlzLnN0cmVhbTtcclxuXHJcbiAgICAgICAgdmFyIGZyOiBGcmFnbWVudCwgc3RyZWFtbGVuZ3RoID0gc3RyZWFtLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmVhbWxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVtID0gc3RyZWFtLmdldCA/IHN0cmVhbS5nZXQoaSkgOiBzdHJlYW1baV07XHJcblxyXG4gICAgICAgICAgICB2YXIgZnJhZ21lbnQ6IEZyYWdtZW50ID0gbnVsbCwgZnJhZ2xlbmd0aCA9IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yIChsZXQgZSA9IGk7IGUgPCBmcmFnbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIGZyID0gdGhpcy5mcmFnbWVudHNbZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoZnIuY29udGV4dCA9PT0gaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gZnI7XHJcbiAgICAgICAgICAgICAgICAgICAgUmVwZWF0QmluZGluZy5zd2FwKHRoaXMuZnJhZ21lbnRzLCBlLCBpKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGZyYWdtZW50ID09PSBudWxsIC8qIG5vdCBmb3VuZCAqLykge1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBuZXcgRnJhZ21lbnQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5wdXNoKGZyYWdtZW50KTtcclxuICAgICAgICAgICAgICAgIFJlcGVhdEJpbmRpbmcuc3dhcCh0aGlzLmZyYWdtZW50cywgZnJhZ2xlbmd0aCwgaSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZyYWdtZW50LnVwZGF0ZTIoaXRlbSwgZHJpdmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoaWxlICh0aGlzLmZyYWdtZW50cy5sZW5ndGggPiBzdHJlYW0ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBmcmFnID0gdGhpcy5mcmFnbWVudHMucG9wKCk7XHJcbiAgICAgICAgICAgIGZyYWcuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoZnJhZ21lbnQ6IEZyYWdtZW50LCBkb20sIGlkeCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRyaXZlcikge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZnJhZ21lbnRzW2ldID09PSBmcmFnbWVudClcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmZyYWdtZW50c1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kcml2ZXIuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaWR4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEZyYWdtZW50QmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHVibGljIGZyYWdtZW50OiBGcmFnbWVudDtcclxuICAgIHByaXZhdGUgc3RyZWFtO1xyXG5cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZnJhZ21lbnQubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgb2YgY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgaWYgKCFjaGlsZC5iaW5kKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJjaGlsZCBpcyBub3QgYSBub2RlXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmZyYWdtZW50ID0gbmV3IEZyYWdtZW50KHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5mcmFnbWVudC5kaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHRoaXMuZnJhZ21lbnQudXBkYXRlMihjb250ZXh0LCBkcml2ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChmcmFnbWVudDogRnJhZ21lbnQsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZHJpdmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJpdmVyLmluc2VydCh0aGlzLCBkb20sIGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRnJhZ21lbnQge1xyXG4gICAgcHVibGljIGNoaWxkQmluZGluZ3M6IGFueVtdID0gW107XHJcbiAgICBwdWJsaWMgY29udGV4dDtcclxuICAgIHB1YmxpYyBkcml2ZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBvd25lcjogeyBwYXJhbT8sIGNoaWxkcmVuOyBjb250ZXh0OyBpbnNlcnQgfSkge1xyXG4gICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgdGhpcy5vd25lci5jaGlsZHJlbi5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbZV0gPVxyXG4gICAgICAgICAgICAgICAgb3duZXIuY2hpbGRyZW5bZV0uYmluZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub3duZXIucGFyYW0pIHtcclxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IHRoaXMub3duZXIucGFyYW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRleHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IGNvbnRleHQuZ2V0ID8gY29udGV4dC5nZXQobmFtZSkgOiBjb250ZXh0W25hbWVdO1xyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdm9pZCAwKVxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLm93bmVyLmNvbnRleHQuZ2V0KG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlZnJlc2goKSB7XHJcbiAgICAgICAgdGhpcy5vd25lci5jb250ZXh0LnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHZhciBiID0gdGhpcy5jaGlsZEJpbmRpbmdzW2pdO1xyXG4gICAgICAgICAgICBiLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICB2YXIgdG90YWwgPSAwO1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRvdGFsICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tqXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICAgICAgdGhpcy5kcml2ZXIgPSBkcml2ZXI7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMub3duZXIuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzW2VdLnVwZGF0ZTIodGhpcywgdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGV4ZWN1dGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hpbGRCaW5kaW5ncztcclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoYmluZGluZywgZG9tLCBpbmRleCkge1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRCaW5kaW5nc1tpXSA9PT0gYmluZGluZylcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5jaGlsZEJpbmRpbmdzW2ldLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5vd25lci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpbmRleCk7XHJcbiAgICB9XHJcblxyXG4gICAgb24oZXZlbnROYW1lLCBkb20sIGV2ZW50QmluZGluZykge1xyXG4gICAgICAgIHRoaXMuZHJpdmVyLm9uKGV2ZW50TmFtZSwgZG9tLCBldmVudEJpbmRpbmcpO1xyXG4gICAgfVxyXG59XHJcblxyXG5kZWNsYXJlIGZ1bmN0aW9uIGZldGNoPFQ+KHVybDogc3RyaW5nLCBjb25maWc/KTogUHJvbWlzZTxUPjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZW1vdGVEYXRhU291cmNlIHtcclxuICAgIHByaXZhdGUgb2JzZXJ2ZXJzID0gW107XHJcbiAgICBwcml2YXRlIG9iamVjdCA9IFtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdXJsOiBzdHJpbmcsIHByaXZhdGUgYm9keSkge1xyXG4gICAgICAgIHRoaXMucmVsb2FkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVsb2FkKCkge1xyXG4gICAgICAgIHZhciBjb25maWcgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXJzZSh0aGlzLmJvZHkpKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIGZldGNoKHRoaXMudXJsICsgXCJxdWVyeVwiLCBjb25maWcpXHJcbiAgICAgICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0ID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vYnNlcnZlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9ic2VydmVyc1tpXS5vbk5leHQodGhpcy5vYmplY3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJzY3JpYmUob2JzZXJ2ZXIpIHtcclxuICAgICAgICBpZiAodGhpcy5vYmplY3QgIT09IG51bGwpXHJcbiAgICAgICAgICAgIG9ic2VydmVyLm9uTmV4dCh0aGlzLm9iamVjdCk7XHJcblxyXG4gICAgICAgIHRoaXMub2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0O1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmUocmVjb3JkKSB7XHJcbiAgICAgICAgUmVzb3VyY2UuY3JlYXRlKHRoaXMudXJsLCByZWNvcmQpLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5yZWxvYWQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE1vZGVsUmVwb3NpdG9yeSB7XHJcbiAgICBwcml2YXRlIGRhdGFTb3VyY2U7XHJcbiAgICBwcm90ZWN0ZWQgY3VycmVudFJvdyA9IG51bGw7XHJcblxyXG4gICAgY29uc3RydWN0b3IodXJsOiBzdHJpbmcsIGV4cHI6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuZGF0YVNvdXJjZSA9IG5ldyBSZW1vdGVEYXRhU291cmNlKHVybCwgZXhwcik7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZSgpIHtcclxuICAgICAgICB0aGlzLmRhdGFTb3VyY2Uuc2F2ZSh0aGlzLmN1cnJlbnRSb3cpO1xyXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2FuY2VsKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFJvdyA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgY3JlYXRlTmV3KCk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBSZXNvdXJjZSB7XHJcbiAgICBzdGF0aWMgY3JlYXRlKHVybCwgYm9keSkge1xyXG4gICAgICAgIHZhciBjb25maWcgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBmZXRjaCh1cmwsIGNvbmZpZyk7XHJcbiAgICB9XHJcbn0iXX0=