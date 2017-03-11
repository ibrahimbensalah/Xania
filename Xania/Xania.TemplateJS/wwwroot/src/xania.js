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
            fragment.update(item, driver);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4YW5pYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1Q0FBcUM7QUErSGxCLHVDQUFRO0FBOUgzQiw2QkFBMkI7QUE4SEUsd0JBQUc7QUE3SGhDLHFDQUFpRDtBQUNqRCx1Q0FBcUM7QUE0SDVCLHVDQUFRO0FBMUhqQjtJQUFBO0lBaUZBLENBQUM7SUFoRlUsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQztZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQW1CLEtBQUssRUFBRSxTQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNwRixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5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SUFBSSxDQUFDO1FBR3hCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVELDhCQUFJLEdBQUo7UUFDSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxnQ0FBTSxHQUFOO1FBQ0ksSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUdMLHNCQUFDO0FBQUQsQ0FBQyxBQWxCRCxJQWtCQztBQWxCcUIsMENBQWU7QUFvQnJDO0lBQUE7SUFZQSxDQUFDO0lBWFUsZUFBTSxHQUFiLFVBQWMsR0FBRyxFQUFFLElBQUk7UUFDbkIsSUFBSSxNQUFNLEdBQUc7WUFDVCxNQUFNLEVBQUUsTUFBTTtZQUNkLE9BQU8sRUFBRTtnQkFDTCxjQUFjLEVBQUUsa0JBQWtCO2FBQ3JDO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1NBQzdCLENBQUM7UUFFRixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBQ0wsZUFBQztBQUFELENBQUMsQUFaRCxJQVlDO0FBWlksNEJBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gXCIuL3RlbXBsYXRlXCJcclxuaW1wb3J0IHsgRG9tIH0gZnJvbSBcIi4vZG9tXCJcclxuaW1wb3J0IGNvbXBpbGUsIHsgU2NvcGUsIHBhcnNlIH0gZnJvbSBcIi4vY29tcGlsZVwiXHJcbmltcG9ydCB7IFJlYWN0aXZlIH0gZnJvbSBcIi4vcmVhY3RpdmVcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFhhbmlhIHtcclxuICAgIHN0YXRpYyB0ZW1wbGF0ZXMoZWxlbWVudHMpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBlbGVtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGlsZCA9PT0gbnVsbCB8fCBjaGlsZCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBjaGlsZCA9PT0gXCJudW1iZXJcIiB8fCB0eXBlb2YgY2hpbGQgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIGNoaWxkLmV4ZWN1dGUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFRlbXBsYXRlLlRleHRUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihjaGlsZCwgRG9tLkRvbVZpc2l0b3IpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGNoaWxkKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjaGlsZFRlbXBsYXRlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkVGVtcGxhdGVzW2pdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY2hpbGQudmlldyA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiBjaGlsZCxcclxuICAgICAgICAgICAgICAgICAgICBiaW5kKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvbXBvbmVudEJpbmRpbmcodGhpcy5jb21wb25lbnQsIHt9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHN2Z0VsZW1lbnRzID0gW1wic3ZnXCIsIFwiY2lyY2xlXCIsIFwibGluZVwiLCBcImdcIiwgXCJwYXRoXCIsIFwibWFya2VyXCJdO1xyXG5cclxuICAgIHN0YXRpYyB0YWcoZWxlbWVudCwgYXR0cnMsIC4uLmNoaWxkcmVuKTogVGVtcGxhdGUuSU5vZGUge1xyXG4gICAgICAgIHZhciBjaGlsZFRlbXBsYXRlcyA9IHRoaXMudGVtcGxhdGVzKGNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBUZW1wbGF0ZS5UYWdUZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHZhciBucyA9IFhhbmlhLnN2Z0VsZW1lbnRzLmluZGV4T2YoZWxlbWVudCkgPj0gMCA/IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiA6IG51bGw7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGVtcGxhdGUuVGFnVGVtcGxhdGU8UmVhY3RpdmUuQmluZGluZz4oZWxlbWVudCwgbnMsIGNoaWxkVGVtcGxhdGVzLCBEb20uRG9tVmlzaXRvcik7XHJcbiAgICAgICAgICAgIGlmIChhdHRycykge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXR0clZhbHVlID0gYXR0cnNbcHJvcF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wID09PSBcImNsYXNzTmFtZVwiIHx8IHByb3AgPT09IFwiY2xhc3NuYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGF6elwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIoXCJjbGFzc1wiLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihwcm9wLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXR0cnMubmFtZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy50eXBlID09PSBcInRleHRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWF0dHJzLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcInZhbHVlXCIsIGNvbXBpbGUoYXR0cnMubmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5wcm90b3R5cGUuYmluZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KGVsZW1lbnQsIFthdHRycyB8fCB7fSwgY2hpbGRUZW1wbGF0ZXNdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LnByb3RvdHlwZS52aWV3KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvbXBvbmVudEJpbmRpbmcoUmVmbGVjdC5jb25zdHJ1Y3QoZWxlbWVudCwgW2F0dHJzIHx8IHt9LCBjaGlsZFRlbXBsYXRlc10pLCBhdHRycyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmlldyA9IGVsZW1lbnQoYXR0cnMgfHwge30sIGNoaWxkVGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgICAgIGlmICghdmlldylcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gbG9hZCB2aWV3XCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZpZXc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcInRhZyB1bnJlc29sdmVkXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcmVuZGVyKGVsZW1lbnQsIGRyaXZlcikge1xyXG4gICAgICAgIHJldHVybiBYYW5pYS50YWcoZWxlbWVudCwge30pXHJcbiAgICAgICAgICAgIC5iaW5kKClcclxuICAgICAgICAgICAgLnVwZGF0ZShuZXcgUmVhY3RpdmUuU3RvcmUoe30pLCBkcml2ZXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBDb21wb25lbnRCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwcml2YXRlIGJpbmRpbmc6IEZyYWdtZW50QmluZGluZztcclxuICAgIHByaXZhdGUgY29tcG9uZW50U3RvcmUgPSBuZXcgUmVhY3RpdmUuU3RvcmUodGhpcy5jb21wb25lbnQpO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgY29tcG9uZW50LCBwcml2YXRlIHByb3BzKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmJpbmRpbmcgPSBuZXcgRnJhZ21lbnRCaW5kaW5nKFtjb21wb25lbnQudmlldyhYYW5pYSldKTtcclxuICAgIH1cclxuXHJcbiAgICBiaW5kKCk6IHRoaXMge1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShjb250ZXh0LCBkcml2ZXIpOiB0aGlzIHtcclxuICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlKHRoaXMuY29tcG9uZW50U3RvcmUsIGRyaXZlcik7XHJcbiAgICAgICAgc3VwZXIudXBkYXRlKGNvbnRleHQsIGRyaXZlcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICBsZXQgcHJvcHMgPSB0aGlzLnByb3BzO1xyXG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gcHJvcHMpIHtcclxuICAgICAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXhwciA9IHByb3BzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZVZhbHVlID0gZXhwci5leGVjdXRlID8gZXhwci5leGVjdXRlKHRoaXMsIGNvbnRleHQpIDogZXhwcjtcclxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2VWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50W3Byb3BdID0gc291cmNlVmFsdWUudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29tcG9uZW50U3RvcmUucmVmcmVzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCB7IFJlYWN0aXZlLCBUZW1wbGF0ZSwgRG9tIH1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBSZXBlYXQoYXR0cnMsIGNoaWxkcmVuKSB7XHJcbiAgICByZXR1cm4gbmV3IFJlcGVhdFRlbXBsYXRlPFJlYWN0aXZlLkJpbmRpbmc+KGF0dHJzLnBhcmFtLCBhdHRycy5zb3VyY2UsIGNoaWxkcmVuLCBEb20uRG9tVmlzaXRvcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBGb3JFYWNoKGF0dHJzLCBjaGlsZHJlbikge1xyXG4gICAgcmV0dXJuIG5ldyBGb3JFYWNoVGVtcGxhdGU8UmVhY3RpdmUuQmluZGluZz4oYXR0cnMucGFyYW0sIGF0dHJzLnNvdXJjZSwgY2hpbGRyZW4sIERvbS5Eb21WaXNpdG9yKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIFdpdGgoYXR0cnMsIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGJpbmQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgV2l0aEJpbmRpbmcoYXR0cnMub2JqZWN0LCBjaGlsZHJlbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgV2l0aEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHByaXZhdGUgY29uZGl0aW9uYWxCaW5kaW5ncyA9IFtdO1xyXG4gICAgcHJpdmF0ZSBvYmplY3Q7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBleHByLCBwcml2YXRlIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuZXZhbHVhdGVPYmplY3QodGhpcy5leHByLCBjb250ZXh0KTtcclxuICAgICAgICB0aGlzLm9iamVjdCA9IHJlc3VsdDtcclxuXHJcbiAgICAgICAgdmFyIHZhbHVlID0gcmVzdWx0ICYmICEhcmVzdWx0LnZhbHVlT2YoKTtcclxuICAgICAgICB2YXIgY2hpbGRCaW5kaW5nczogYW55W10gPSB0aGlzLmNvbmRpdGlvbmFsQmluZGluZ3MsXHJcbiAgICAgICAgICAgIGkgPSBjaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICghaSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKHggPT4gY2hpbGRCaW5kaW5ncy5wdXNoKHguYmluZCgpLnVwZGF0ZSh0aGlzLCBkcml2ZXIpKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRCaW5kaW5nc1tpXS51cGRhdGUodGhpcywgZHJpdmVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGNoaWxkQmluZGluZ3NbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNoaWxkQmluZGluZ3MubGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdC5nZXQobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaCgpIHtcclxuICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gSWYoYXR0cnMsIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGJpbmQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgSWZCaW5kaW5nKGF0dHJzLmV4cHIsIGNoaWxkcmVuKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBJZkJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHByaXZhdGUgY29uZGl0aW9uYWxCaW5kaW5ncyA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBleHByLCBwcml2YXRlIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuZXZhbHVhdGVPYmplY3QodGhpcy5leHByLCBjb250ZXh0KTtcclxuICAgICAgICB2YXIgdmFsdWUgPSByZXN1bHQgJiYgISFyZXN1bHQudmFsdWVPZigpOyBcclxuICAgICAgICB2YXIgY2hpbGRCaW5kaW5nczogYW55W10gPSB0aGlzLmNvbmRpdGlvbmFsQmluZGluZ3MsXHJcbiAgICAgICAgICAgIGkgPSBjaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICghaSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKHggPT4gY2hpbGRCaW5kaW5ncy5wdXNoKHguYmluZCgpLnVwZGF0ZShjb250ZXh0LCBkcml2ZXIpKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRCaW5kaW5nc1tpXS51cGRhdGUoY29udGV4dCwgZHJpdmVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGNoaWxkQmluZGluZ3NbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNoaWxkQmluZGluZ3MubGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBleHByKGNvZGU6IHN0cmluZykge1xyXG4gICAgcmV0dXJuIGNvbXBpbGUoY29kZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBSZXBlYXRUZW1wbGF0ZTxUPiBpbXBsZW1lbnRzIFRlbXBsYXRlLklOb2RlIHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyYW0sIHByaXZhdGUgZXhwciwgcHJpdmF0ZSBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSwgcHJpdmF0ZSB2aXNpdG9yOiBUZW1wbGF0ZS5JVmlzaXRvcjxUPikgeyB9XHJcblxyXG4gICAgYmluZCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlcGVhdEJpbmRpbmcodGhpcy5wYXJhbSwgdGhpcy5leHByLCB0aGlzLmNoaWxkcmVuKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZvckVhY2hUZW1wbGF0ZTxUPiBpbXBsZW1lbnRzIFRlbXBsYXRlLklOb2RlIHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyYW0sIHByaXZhdGUgZXhwciwgcHJpdmF0ZSBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSwgcHJpdmF0ZSB2aXNpdG9yOiBUZW1wbGF0ZS5JVmlzaXRvcjxUPikgeyB9XHJcblxyXG4gICAgYmluZCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEZvckVhY2hCaW5kaW5nKHRoaXMucGFyYW0sIHRoaXMuZXhwciwgdGhpcy5jaGlsZHJlbik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEZvckVhY2hCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwdWJsaWMgZnJhZ21lbnRzOiBGcmFnbWVudFtdID0gW107XHJcblxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICB2YXIgdG90YWwgPSAwLCBsZW5ndGggPSB0aGlzLmZyYWdtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0b3RhbCArPSB0aGlzLmZyYWdtZW50c1tpXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcGFyYW0sIHByaXZhdGUgZXhwciwgcHVibGljIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICBmb3IgKHZhciBjaGlsZCBvZiBjaGlsZHJlbikge1xyXG4gICAgICAgICAgICBpZiAoIWNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcImNoaWxkIGlzIG5vdCBhIG5vZGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50c1tpXS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIHN3YXAoYXJyOiBGcmFnbWVudFtdLCBzcmNJbmRleCwgdGFySW5kZXgpIHtcclxuICAgICAgICBpZiAoc3JjSW5kZXggPiB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgaSA9IHNyY0luZGV4O1xyXG4gICAgICAgICAgICBzcmNJbmRleCA9IHRhckluZGV4O1xyXG4gICAgICAgICAgICB0YXJJbmRleCA9IGk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzcmNJbmRleCA8IHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBzcmMgPSBhcnJbc3JjSW5kZXhdO1xyXG4gICAgICAgICAgICBhcnJbc3JjSW5kZXhdID0gYXJyW3RhckluZGV4XTtcclxuICAgICAgICAgICAgYXJyW3RhckluZGV4XSA9IHNyYztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHZhciBzdHJlYW0gPSB0aGlzLmV4cHIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KS5pdGVyYXRvcigpO1xyXG5cclxuICAgICAgICB2YXIgaSA9IHN0cmVhbS5sZW5ndGgsXHJcbiAgICAgICAgICAgIGZyYWdtZW50cyA9IHRoaXMuZnJhZ21lbnRzLFxyXG4gICAgICAgICAgICBmcmFnbWVudExlbmd0aCA9IGZyYWdtZW50cy5sZW5ndGg7XHJcblxyXG4gICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgdmFyIGl0ZW0gPSBzdHJlYW0uZ2V0ID8gc3RyZWFtLmdldChpKSA6IHN0cmVhbVtpXSwgZnJhZ21lbnQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoaSA8IGZyYWdtZW50TGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudCA9IGZyYWdtZW50c1tpXTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gbmV3IEZyYWdtZW50KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnRzLnB1c2goZnJhZ21lbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZyYWdtZW50LnVwZGF0ZShpdGVtLCBkcml2ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKGZyYWdtZW50cy5sZW5ndGggPiBzdHJlYW0ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGZyYWdtZW50cy5wb3AoKS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChmcmFnbWVudDogRnJhZ21lbnQsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZHJpdmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwLCBmcmFnbWVudHMgPSB0aGlzLmZyYWdtZW50cywgaSA9IGZyYWdtZW50cy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZnIgPSBmcmFnbWVudHNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoZnIgPT09IGZyYWdtZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IGZyLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRyaXZlci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbmNsYXNzIFJlcGVhdEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHB1YmxpYyBmcmFnbWVudHM6IEZyYWdtZW50W10gPSBbXTtcclxuICAgIHByaXZhdGUgc3RyZWFtO1xyXG5cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgdmFyIHRvdGFsID0gMCwgbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHBhcmFtLCBwcml2YXRlIGV4cHIsIHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgb2YgY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgaWYgKCFjaGlsZC5iaW5kKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJjaGlsZCBpcyBub3QgYSBub2RlXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBub3RpZnkoKSB7XHJcbiAgICAgICAgdmFyIHN0cmVhbSwgY29udGV4dCA9IHRoaXMuY29udGV4dDtcclxuICAgICAgICBpZiAoISF0aGlzLmV4cHIgJiYgISF0aGlzLmV4cHIuZXhlY3V0ZSkge1xyXG4gICAgICAgICAgICBzdHJlYW0gPSB0aGlzLmV4cHIuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS5sZW5ndGggPT09IHZvaWQgMClcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0udmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0gPSBbXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gW3N0cmVhbV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3RyZWFtID0gW2NvbnRleHRdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0cmVhbSA9IHN0cmVhbTtcclxuXHJcbiAgICAgICAgdmFyIGkgPSAwO1xyXG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBmcmFnID0gdGhpcy5mcmFnbWVudHNbaV07XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0uaW5kZXhPZihmcmFnLmNvbnRleHQpIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgZnJhZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzW2ldLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHN3YXAoYXJyOiBGcmFnbWVudFtdLCBzcmNJbmRleCwgdGFySW5kZXgpIHtcclxuICAgICAgICBpZiAoc3JjSW5kZXggPiB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgaSA9IHNyY0luZGV4O1xyXG4gICAgICAgICAgICBzcmNJbmRleCA9IHRhckluZGV4O1xyXG4gICAgICAgICAgICB0YXJJbmRleCA9IGk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChzcmNJbmRleCA8IHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBzcmMgPSBhcnJbc3JjSW5kZXhdO1xyXG4gICAgICAgICAgICBhcnJbc3JjSW5kZXhdID0gYXJyW3RhckluZGV4XTtcclxuICAgICAgICAgICAgYXJyW3RhckluZGV4XSA9IHNyYztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHRoaXMubm90aWZ5KCk7XHJcbiAgICAgICAgdmFyIHN0cmVhbSA9IHRoaXMuc3RyZWFtO1xyXG5cclxuICAgICAgICB2YXIgZnI6IEZyYWdtZW50LCBzdHJlYW1sZW5ndGggPSBzdHJlYW0ubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyZWFtbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGl0ZW0gPSBzdHJlYW0uZ2V0ID8gc3RyZWFtLmdldChpKSA6IHN0cmVhbVtpXTtcclxuXHJcbiAgICAgICAgICAgIHZhciBmcmFnbWVudDogRnJhZ21lbnQgPSBudWxsLCBmcmFnbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBlID0gaTsgZSA8IGZyYWdsZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgZnIgPSB0aGlzLmZyYWdtZW50c1tlXTtcclxuICAgICAgICAgICAgICAgIGlmIChmci5jb250ZXh0ID09PSBpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBmcjtcclxuICAgICAgICAgICAgICAgICAgICBSZXBlYXRCaW5kaW5nLnN3YXAodGhpcy5mcmFnbWVudHMsIGUsIGkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZnJhZ21lbnQgPT09IG51bGwgLyogbm90IGZvdW5kICovKSB7XHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBGcmFnbWVudCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzLnB1c2goZnJhZ21lbnQpO1xyXG4gICAgICAgICAgICAgICAgUmVwZWF0QmluZGluZy5zd2FwKHRoaXMuZnJhZ21lbnRzLCBmcmFnbGVuZ3RoLCBpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnJhZ21lbnQudXBkYXRlKGl0ZW0sIGRyaXZlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aGlsZSAodGhpcy5mcmFnbWVudHMubGVuZ3RoID4gc3RyZWFtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgZnJhZyA9IHRoaXMuZnJhZ21lbnRzLnBvcCgpO1xyXG4gICAgICAgICAgICBmcmFnLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW5zZXJ0KGZyYWdtZW50OiBGcmFnbWVudCwgZG9tLCBpZHgpIHtcclxuICAgICAgICBpZiAodGhpcy5kcml2ZXIpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZyYWdtZW50c1tpXSA9PT0gZnJhZ21lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZHJpdmVyLmluc2VydCh0aGlzLCBkb20sIG9mZnNldCArIGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBGcmFnbWVudEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHB1YmxpYyBmcmFnbWVudDogRnJhZ21lbnQ7XHJcbiAgICBwcml2YXRlIHN0cmVhbTtcclxuXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmZyYWdtZW50Lmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIGZvciAodmFyIGNoaWxkIG9mIGNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgIGlmICghY2hpbGQuYmluZClcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiY2hpbGQgaXMgbm90IGEgbm9kZVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5mcmFnbWVudCA9IG5ldyBGcmFnbWVudCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHRoaXMuZnJhZ21lbnQuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB0aGlzLmZyYWdtZW50LnVwZGF0ZShjb250ZXh0LCBkcml2ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChmcmFnbWVudDogRnJhZ21lbnQsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZHJpdmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJpdmVyLmluc2VydCh0aGlzLCBkb20sIGlkeCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRnJhZ21lbnQge1xyXG4gICAgcHVibGljIGNoaWxkQmluZGluZ3M6IGFueVtdID0gW107XHJcbiAgICBwdWJsaWMgY29udGV4dDtcclxuICAgIHB1YmxpYyBkcml2ZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBvd25lcjogeyBwYXJhbT8sIGNoaWxkcmVuOyBjb250ZXh0OyBpbnNlcnQgfSkge1xyXG4gICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgdGhpcy5vd25lci5jaGlsZHJlbi5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbZV0gPVxyXG4gICAgICAgICAgICAgICAgb3duZXIuY2hpbGRyZW5bZV0uYmluZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub3duZXIucGFyYW0pIHtcclxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IHRoaXMub3duZXIucGFyYW0pIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbnRleHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcy5jb250ZXh0O1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IGNvbnRleHQuZ2V0ID8gY29udGV4dC5nZXQobmFtZSkgOiBjb250ZXh0W25hbWVdO1xyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdm9pZCAwKVxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLm93bmVyLmNvbnRleHQuZ2V0KG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlZnJlc2goKSB7XHJcbiAgICAgICAgdGhpcy5vd25lci5jb250ZXh0LnJlZnJlc2goKTtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHZhciBiID0gdGhpcy5jaGlsZEJpbmRpbmdzW2pdO1xyXG4gICAgICAgICAgICBiLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICB2YXIgdG90YWwgPSAwO1xyXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRvdGFsICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tqXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICB0aGlzLmRyaXZlciA9IGRyaXZlcjtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5vd25lci5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBsZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbZV0udXBkYXRlKHRoaXMsIHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoYmluZGluZywgZG9tLCBpbmRleCkge1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRCaW5kaW5nc1tpXSA9PT0gYmluZGluZylcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5jaGlsZEJpbmRpbmdzW2ldLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5vd25lci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpbmRleCk7XHJcbiAgICB9XHJcblxyXG4gICAgb24oZXZlbnROYW1lLCBkb20sIGV2ZW50QmluZGluZykge1xyXG4gICAgICAgIHRoaXMuZHJpdmVyLm9uKGV2ZW50TmFtZSwgZG9tLCBldmVudEJpbmRpbmcpO1xyXG4gICAgfVxyXG59XHJcblxyXG5kZWNsYXJlIGZ1bmN0aW9uIGZldGNoPFQ+KHVybDogc3RyaW5nLCBjb25maWc/KTogUHJvbWlzZTxUPjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZW1vdGVEYXRhU291cmNlIHtcclxuICAgIHByaXZhdGUgb2JzZXJ2ZXJzID0gW107XHJcbiAgICBwcml2YXRlIG9iamVjdCA9IFtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdXJsOiBzdHJpbmcsIHByaXZhdGUgYm9keSkge1xyXG4gICAgICAgIHRoaXMucmVsb2FkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVsb2FkKCkge1xyXG4gICAgICAgIHZhciBjb25maWcgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXJzZSh0aGlzLmJvZHkpKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIGZldGNoKHRoaXMudXJsICsgXCJxdWVyeVwiLCBjb25maWcpXHJcbiAgICAgICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0ID0gZGF0YTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vYnNlcnZlcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9ic2VydmVyc1tpXS5vbk5leHQodGhpcy5vYmplY3QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJzY3JpYmUob2JzZXJ2ZXIpIHtcclxuICAgICAgICBpZiAodGhpcy5vYmplY3QgIT09IG51bGwpXHJcbiAgICAgICAgICAgIG9ic2VydmVyLm9uTmV4dCh0aGlzLm9iamVjdCk7XHJcblxyXG4gICAgICAgIHRoaXMub2JzZXJ2ZXJzLnB1c2gob2JzZXJ2ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0O1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmUocmVjb3JkKSB7XHJcbiAgICAgICAgUmVzb3VyY2UuY3JlYXRlKHRoaXMudXJsLCByZWNvcmQpLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5yZWxvYWQoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE1vZGVsUmVwb3NpdG9yeSB7XHJcbiAgICBwcml2YXRlIGRhdGFTb3VyY2U7XHJcbiAgICBwcm90ZWN0ZWQgY3VycmVudFJvdyA9IG51bGw7XHJcblxyXG4gICAgY29uc3RydWN0b3IodXJsOiBzdHJpbmcsIGV4cHI6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuZGF0YVNvdXJjZSA9IG5ldyBSZW1vdGVEYXRhU291cmNlKHVybCwgZXhwcik7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZSgpIHtcclxuICAgICAgICB0aGlzLmRhdGFTb3VyY2Uuc2F2ZSh0aGlzLmN1cnJlbnRSb3cpO1xyXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY2FuY2VsKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFJvdyA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgY3JlYXRlTmV3KCk7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBSZXNvdXJjZSB7XHJcbiAgICBzdGF0aWMgY3JlYXRlKHVybCwgYm9keSkge1xyXG4gICAgICAgIHZhciBjb25maWcgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHJldHVybiBmZXRjaCh1cmwsIGNvbmZpZyk7XHJcbiAgICB9XHJcbn0iXX0=