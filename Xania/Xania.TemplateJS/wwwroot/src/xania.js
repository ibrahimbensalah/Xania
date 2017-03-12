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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4YW5pYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1Q0FBcUM7QUFrSWxCLHVDQUFRO0FBakkzQiw2QkFBMkI7QUFpSUUsd0JBQUc7QUFoSWhDLHFDQUFpRDtBQUNqRCx1Q0FBcUM7QUErSDVCLHVDQUFRO0FBN0hqQjtJQUFBO0lBOEVBLENBQUM7SUE3RVUsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQztZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQW1CLEtBQUssRUFBRSxTQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNwRixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5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SSxDQUFDLFVBQUMsUUFBYTtZQUNqRCxLQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDbEIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBQ0wsdUJBQUM7QUFBRCxDQUFDLEFBNUNELElBNENDO0FBNUNZLDRDQUFnQjtBQThDN0I7SUFJSSx5QkFBWSxHQUFXLEVBQUUsSUFBWTtRQUYzQixlQUFVLEdBQUcsSUFBSSxDQUFDO1FBR3hCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVELDhCQUFJLEdBQUo7UUFDSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxnQ0FBTSxHQUFOO1FBQ0ksSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUdMLHNCQUFDO0FBQUQsQ0FBQyxBQWxCRCxJQWtCQztBQWxCcUIsMENBQWU7QUFvQnJDO0lBQUE7SUFZQSxDQUFDO0lBWFUsZUFBTSxHQUFiLFVBQWMsR0FBRyxFQUFFLElBQUk7UUFDbkIsSUFBSSxNQUFNLEdBQUc7WUFDVCxNQUFNLEVBQUUsTUFBTTtZQUNkLE9BQU8sRUFBRTtnQkFDTCxjQUFjLEVBQUUsa0JBQWtCO2FBQ3JDO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1NBQzdCLENBQUM7UUFFRixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBQ0wsZUFBQztBQUFELENBQUMsQUFaRCxJQVlDO0FBWlksNEJBQVEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gXCIuL3RlbXBsYXRlXCJcclxuaW1wb3J0IHsgRG9tIH0gZnJvbSBcIi4vZG9tXCJcclxuaW1wb3J0IGNvbXBpbGUsIHsgU2NvcGUsIHBhcnNlIH0gZnJvbSBcIi4vY29tcGlsZVwiXHJcbmltcG9ydCB7IFJlYWN0aXZlIH0gZnJvbSBcIi4vcmVhY3RpdmVcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFhhbmlhIHtcclxuICAgIHN0YXRpYyB0ZW1wbGF0ZXMoZWxlbWVudHMpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBlbGVtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGlsZCA9PT0gbnVsbCB8fCBjaGlsZCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBjaGlsZCA9PT0gXCJudW1iZXJcIiB8fCB0eXBlb2YgY2hpbGQgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIGNoaWxkLmV4ZWN1dGUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFRlbXBsYXRlLlRleHRUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihjaGlsZCwgRG9tLkRvbVZpc2l0b3IpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGNoaWxkKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjaGlsZFRlbXBsYXRlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkVGVtcGxhdGVzW2pdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY2hpbGQudmlldyA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChDb21wb25lbnQoY2hpbGQsIHt9KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBzdmdFbGVtZW50cyA9IFtcInN2Z1wiLCBcImNpcmNsZVwiLCBcImxpbmVcIiwgXCJnXCIsIFwicGF0aFwiLCBcIm1hcmtlclwiXTtcclxuXHJcbiAgICBzdGF0aWMgdGFnKGVsZW1lbnQsIGF0dHJzLCAuLi5jaGlsZHJlbik6IFRlbXBsYXRlLklOb2RlIHtcclxuICAgICAgICB2YXIgY2hpbGRUZW1wbGF0ZXMgPSB0aGlzLnRlbXBsYXRlcyhjaGlsZHJlbik7XHJcblxyXG4gICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgVGVtcGxhdGUuVGFnVGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB2YXIgbnMgPSBYYW5pYS5zdmdFbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpID49IDAgPyBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgOiBudWxsO1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRlbXBsYXRlLlRhZ1RlbXBsYXRlPFJlYWN0aXZlLkJpbmRpbmc+KGVsZW1lbnQsIG5zLCBjaGlsZFRlbXBsYXRlcywgRG9tLkRvbVZpc2l0b3IpO1xyXG4gICAgICAgICAgICBpZiAoYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IGF0dHJzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcCA9PT0gXCJjbGFzc05hbWVcIiB8fCBwcm9wID09PSBcImNsYXNzbmFtZVwiIHx8IHByb3AgPT09IFwiY2xhenpcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocHJvcCA9PT0gXCJodG1sRm9yXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcImZvclwiLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihwcm9wLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXR0cnMubmFtZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy50eXBlID09PSBcInRleHRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWF0dHJzLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcInZhbHVlXCIsIGNvbXBpbGUoYXR0cnMubmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5wcm90b3R5cGUuYmluZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KGVsZW1lbnQsIFthdHRycyB8fCB7fSwgY2hpbGRUZW1wbGF0ZXNdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LnByb3RvdHlwZS52aWV3KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQ29tcG9uZW50KFJlZmxlY3QuY29uc3RydWN0KGVsZW1lbnQsIFthdHRycyB8fCB7fSwgY2hpbGRUZW1wbGF0ZXNdKSwgYXR0cnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBlbGVtZW50KGF0dHJzIHx8IHt9LCBjaGlsZFRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXZpZXcpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdmlld1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJ0YWcgdW5yZXNvbHZlZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbmRlcihlbGVtZW50LCBkcml2ZXIpIHtcclxuICAgICAgICByZXR1cm4gWGFuaWEudGFnKGVsZW1lbnQsIHt9KVxyXG4gICAgICAgICAgICAuYmluZCgpXHJcbiAgICAgICAgICAgIC51cGRhdGUobmV3IFJlYWN0aXZlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gQ29tcG9uZW50KGNvbXBvbmVudCwgcHJvcHMpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY29tcG9uZW50LFxyXG4gICAgICAgIGJpbmQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50QmluZGluZyh0aGlzLmNvbXBvbmVudCwgcHJvcHMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbmNsYXNzIENvbXBvbmVudEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHByaXZhdGUgYmluZGluZzogRnJhZ21lbnRCaW5kaW5nO1xyXG4gICAgcHJpdmF0ZSBjb21wb25lbnRTdG9yZSA9IG5ldyBSZWFjdGl2ZS5TdG9yZSh0aGlzLmNvbXBvbmVudCk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnQsIHByaXZhdGUgcHJvcHMpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYmluZGluZyA9IG5ldyBGcmFnbWVudEJpbmRpbmcoW2NvbXBvbmVudC52aWV3KFhhbmlhKV0pO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShjb250ZXh0LCBkcml2ZXIpOiB0aGlzIHtcclxuICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlKHRoaXMuY29tcG9uZW50U3RvcmUsIGRyaXZlcik7XHJcbiAgICAgICAgc3VwZXIudXBkYXRlKGNvbnRleHQsIGRyaXZlcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICBsZXQgcHJvcHMgPSB0aGlzLnByb3BzO1xyXG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gcHJvcHMpIHtcclxuICAgICAgICAgICAgaWYgKHByb3BzLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXhwciA9IHByb3BzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZVZhbHVlID0gZXhwci5leGVjdXRlID8gZXhwci5leGVjdXRlKHRoaXMsIGNvbnRleHQpIDogZXhwcjtcclxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2VWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50W3Byb3BdID0gc291cmNlVmFsdWUudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29tcG9uZW50U3RvcmUucmVmcmVzaCgpO1xyXG4gICAgICAgIHRoaXMuYmluZGluZy5leGVjdXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmJpbmRpbmcuZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IHsgUmVhY3RpdmUsIFRlbXBsYXRlLCBEb20gfVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIFJlcGVhdChhdHRycywgY2hpbGRyZW4pIHtcclxuICAgIHJldHVybiBuZXcgUmVwZWF0VGVtcGxhdGU8UmVhY3RpdmUuQmluZGluZz4oYXR0cnMucGFyYW0sIGF0dHJzLnNvdXJjZSwgY2hpbGRyZW4sIERvbS5Eb21WaXNpdG9yKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEZvckVhY2goYXR0cnMsIGNoaWxkcmVuKSB7XHJcbiAgICByZXR1cm4gbmV3IEZvckVhY2hUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihhdHRycy5wYXJhbSwgYXR0cnMuc291cmNlLCBjaGlsZHJlbiwgRG9tLkRvbVZpc2l0b3IpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gV2l0aChhdHRycywgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYmluZCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBXaXRoQmluZGluZyhhdHRycy5vYmplY3QsIGNoaWxkcmVuKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBXaXRoQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBjb25kaXRpb25hbEJpbmRpbmdzID0gW107XHJcbiAgICBwcml2YXRlIG9iamVjdDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZU9iamVjdCh0aGlzLmV4cHIsIGNvbnRleHQpO1xyXG4gICAgICAgIHRoaXMub2JqZWN0ID0gcmVzdWx0O1xyXG5cclxuICAgICAgICB2YXIgdmFsdWUgPSByZXN1bHQgJiYgISFyZXN1bHQudmFsdWVPZigpO1xyXG4gICAgICAgIHZhciBjaGlsZEJpbmRpbmdzOiBhbnlbXSA9IHRoaXMuY29uZGl0aW9uYWxCaW5kaW5ncyxcclxuICAgICAgICAgICAgaSA9IGNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKCFpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goeCA9PiBjaGlsZEJpbmRpbmdzLnB1c2goeC5iaW5kKCkudXBkYXRlKHRoaXMsIGRyaXZlcikpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZEJpbmRpbmdzW2ldLnVwZGF0ZSh0aGlzLCBkcml2ZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgY2hpbGRCaW5kaW5nc1tpXS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2hpbGRCaW5kaW5ncy5sZW5ndGggPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0LmdldChuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICByZWZyZXNoKCkge1xyXG4gICAgICAgIHRoaXMuY29udGV4dC5yZWZyZXNoKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBJZihhdHRycywgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYmluZCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBJZkJpbmRpbmcoYXR0cnMuZXhwciwgY2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIElmQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBjb25kaXRpb25hbEJpbmRpbmdzID0gW107XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZU9iamVjdCh0aGlzLmV4cHIsIGNvbnRleHQpO1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHJlc3VsdCAmJiAhIXJlc3VsdC52YWx1ZU9mKCk7XHJcbiAgICAgICAgdmFyIGNoaWxkQmluZGluZ3M6IGFueVtdID0gdGhpcy5jb25kaXRpb25hbEJpbmRpbmdzLFxyXG4gICAgICAgICAgICBpID0gY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoIWkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaCh4ID0+IGNoaWxkQmluZGluZ3MucHVzaCh4LmJpbmQoKS51cGRhdGUoY29udGV4dCwgZHJpdmVyKSkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNoaWxkQmluZGluZ3NbaV0udXBkYXRlKGNvbnRleHQsIGRyaXZlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBjaGlsZEJpbmRpbmdzW2ldLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjaGlsZEJpbmRpbmdzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXhwcihjb2RlOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiBjb21waWxlKGNvZGUpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVwZWF0VGVtcGxhdGU8VD4gaW1wbGVtZW50cyBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmFtLCBwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10sIHByaXZhdGUgdmlzaXRvcjogVGVtcGxhdGUuSVZpc2l0b3I8VD4pIHsgfVxyXG5cclxuICAgIGJpbmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBlYXRCaW5kaW5nKHRoaXMucGFyYW0sIHRoaXMuZXhwciwgdGhpcy5jaGlsZHJlbik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGb3JFYWNoVGVtcGxhdGU8VD4gaW1wbGVtZW50cyBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmFtLCBwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10sIHByaXZhdGUgdmlzaXRvcjogVGVtcGxhdGUuSVZpc2l0b3I8VD4pIHsgfVxyXG5cclxuICAgIGJpbmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBGb3JFYWNoQmluZGluZyh0aGlzLnBhcmFtLCB0aGlzLmV4cHIsIHRoaXMuY2hpbGRyZW4pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBGb3JFYWNoQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHVibGljIGZyYWdtZW50czogRnJhZ21lbnRbXSA9IFtdO1xyXG5cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgdmFyIHRvdGFsID0gMCwgbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHBhcmFtLCBwcml2YXRlIGV4cHIsIHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgb2YgY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgaWYgKCFjaGlsZC5iaW5kKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJjaGlsZCBpcyBub3QgYSBub2RlXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudHNbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBzd2FwKGFycjogRnJhZ21lbnRbXSwgc3JjSW5kZXgsIHRhckluZGV4KSB7XHJcbiAgICAgICAgaWYgKHNyY0luZGV4ID4gdGFySW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGkgPSBzcmNJbmRleDtcclxuICAgICAgICAgICAgc3JjSW5kZXggPSB0YXJJbmRleDtcclxuICAgICAgICAgICAgdGFySW5kZXggPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgc3JjID0gYXJyW3NyY0luZGV4XTtcclxuICAgICAgICAgICAgYXJyW3NyY0luZGV4XSA9IGFyclt0YXJJbmRleF07XHJcbiAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB2YXIgc3RyZWFtID0gdGhpcy5leHByLmV4ZWN1dGUodGhpcywgY29udGV4dCkuaXRlcmF0b3IoKTtcclxuXHJcbiAgICAgICAgdmFyIGkgPSBzdHJlYW0ubGVuZ3RoLFxyXG4gICAgICAgICAgICBmcmFnbWVudHMgPSB0aGlzLmZyYWdtZW50cyxcclxuICAgICAgICAgICAgZnJhZ21lbnRMZW5ndGggPSBmcmFnbWVudHMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVtID0gc3RyZWFtLmdldCA/IHN0cmVhbS5nZXQoaSkgOiBzdHJlYW1baV0sIGZyYWdtZW50O1xyXG5cclxuICAgICAgICAgICAgaWYgKGkgPCBmcmFnbWVudExlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudHNbaV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBGcmFnbWVudCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoKGZyYWdtZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmcmFnbWVudC51cGRhdGUoaXRlbSwgZHJpdmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoaWxlIChmcmFnbWVudHMubGVuZ3RoID4gc3RyZWFtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBmcmFnbWVudHMucG9wKCkuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoZnJhZ21lbnQ6IEZyYWdtZW50LCBkb20sIGlkeCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRyaXZlcikge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgZnJhZ21lbnRzID0gdGhpcy5mcmFnbWVudHMsIGkgPSBmcmFnbWVudHMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZyID0gZnJhZ21lbnRzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZyID09PSBmcmFnbWVudClcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIG9mZnNldCArPSBmci5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kcml2ZXIuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaWR4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5jbGFzcyBSZXBlYXRCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwdWJsaWMgZnJhZ21lbnRzOiBGcmFnbWVudFtdID0gW107XHJcbiAgICBwcml2YXRlIHN0cmVhbTtcclxuXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHZhciB0b3RhbCA9IDAsIGxlbmd0aCA9IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRvdGFsICs9IHRoaXMuZnJhZ21lbnRzW2ldLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRvdGFsO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBwYXJhbSwgcHJpdmF0ZSBleHByLCBwdWJsaWMgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIGZvciAodmFyIGNoaWxkIG9mIGNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgIGlmICghY2hpbGQuYmluZClcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwiY2hpbGQgaXMgbm90IGEgbm9kZVwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbm90aWZ5KCkge1xyXG4gICAgICAgIHZhciBzdHJlYW0sIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XHJcbiAgICAgICAgaWYgKCEhdGhpcy5leHByICYmICEhdGhpcy5leHByLmV4ZWN1dGUpIHtcclxuICAgICAgICAgICAgc3RyZWFtID0gdGhpcy5leHByLmV4ZWN1dGUodGhpcywgY29udGV4dCk7XHJcbiAgICAgICAgICAgIGlmIChzdHJlYW0ubGVuZ3RoID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLnZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gW107XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbSA9IFtzdHJlYW1dO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN0cmVhbSA9IFtjb250ZXh0XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zdHJlYW0gPSBzdHJlYW07XHJcblxyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICB3aGlsZSAoaSA8IHRoaXMuZnJhZ21lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgZnJhZyA9IHRoaXMuZnJhZ21lbnRzW2ldO1xyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLmluZGV4T2YoZnJhZy5jb250ZXh0KSA8IDApIHtcclxuICAgICAgICAgICAgICAgIGZyYWcuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmZyYWdtZW50c1tpXS5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBzd2FwKGFycjogRnJhZ21lbnRbXSwgc3JjSW5kZXgsIHRhckluZGV4KSB7XHJcbiAgICAgICAgaWYgKHNyY0luZGV4ID4gdGFySW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGkgPSBzcmNJbmRleDtcclxuICAgICAgICAgICAgc3JjSW5kZXggPSB0YXJJbmRleDtcclxuICAgICAgICAgICAgdGFySW5kZXggPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgc3JjID0gYXJyW3NyY0luZGV4XTtcclxuICAgICAgICAgICAgYXJyW3NyY0luZGV4XSA9IGFyclt0YXJJbmRleF07XHJcbiAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB0aGlzLm5vdGlmeSgpO1xyXG4gICAgICAgIHZhciBzdHJlYW0gPSB0aGlzLnN0cmVhbTtcclxuXHJcbiAgICAgICAgdmFyIGZyOiBGcmFnbWVudCwgc3RyZWFtbGVuZ3RoID0gc3RyZWFtLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmVhbWxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVtID0gc3RyZWFtLmdldCA/IHN0cmVhbS5nZXQoaSkgOiBzdHJlYW1baV07XHJcblxyXG4gICAgICAgICAgICB2YXIgZnJhZ21lbnQ6IEZyYWdtZW50ID0gbnVsbCwgZnJhZ2xlbmd0aCA9IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yIChsZXQgZSA9IGk7IGUgPCBmcmFnbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIGZyID0gdGhpcy5mcmFnbWVudHNbZV07XHJcbiAgICAgICAgICAgICAgICBpZiAoZnIuY29udGV4dCA9PT0gaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gZnI7XHJcbiAgICAgICAgICAgICAgICAgICAgUmVwZWF0QmluZGluZy5zd2FwKHRoaXMuZnJhZ21lbnRzLCBlLCBpKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGZyYWdtZW50ID09PSBudWxsIC8qIG5vdCBmb3VuZCAqLykge1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBuZXcgRnJhZ21lbnQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5wdXNoKGZyYWdtZW50KTtcclxuICAgICAgICAgICAgICAgIFJlcGVhdEJpbmRpbmcuc3dhcCh0aGlzLmZyYWdtZW50cywgZnJhZ2xlbmd0aCwgaSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZyYWdtZW50LnVwZGF0ZShpdGVtLCBkcml2ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKHRoaXMuZnJhZ21lbnRzLmxlbmd0aCA+IHN0cmVhbS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGZyYWcgPSB0aGlzLmZyYWdtZW50cy5wb3AoKTtcclxuICAgICAgICAgICAgZnJhZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChmcmFnbWVudDogRnJhZ21lbnQsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZHJpdmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mcmFnbWVudHNbaV0gPT09IGZyYWdtZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuZnJhZ21lbnRzW2ldLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRyaXZlci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgRnJhZ21lbnRCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwdWJsaWMgZnJhZ21lbnQ6IEZyYWdtZW50O1xyXG4gICAgcHJpdmF0ZSBzdHJlYW07XHJcblxyXG4gICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5mcmFnbWVudC5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICBmb3IgKHZhciBjaGlsZCBvZiBjaGlsZHJlbikge1xyXG4gICAgICAgICAgICBpZiAoIWNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcImNoaWxkIGlzIG5vdCBhIG5vZGVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZnJhZ21lbnQgPSBuZXcgRnJhZ21lbnQodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICB0aGlzLmZyYWdtZW50LmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgdGhpcy5mcmFnbWVudC51cGRhdGUoY29udGV4dCwgZHJpdmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoZnJhZ21lbnQ6IEZyYWdtZW50LCBkb20sIGlkeCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRyaXZlcikge1xyXG4gICAgICAgICAgICB0aGlzLmRyaXZlci5pbnNlcnQodGhpcywgZG9tLCBpZHgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZyYWdtZW50IHtcclxuICAgIHB1YmxpYyBjaGlsZEJpbmRpbmdzOiBhbnlbXSA9IFtdO1xyXG4gICAgcHVibGljIGNvbnRleHQ7XHJcbiAgICBwdWJsaWMgZHJpdmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgb3duZXI6IHsgcGFyYW0/LCBjaGlsZHJlbjsgY29udGV4dDsgaW5zZXJ0IH0pIHtcclxuICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IHRoaXMub3duZXIuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzW2VdID1cclxuICAgICAgICAgICAgICAgIG93bmVyLmNoaWxkcmVuW2VdLmJpbmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGlmICh0aGlzLm93bmVyLnBhcmFtKSB7XHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSB0aGlzLm93bmVyLnBhcmFtKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZXh0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXMuY29udGV4dDtcclxuICAgICAgICB2YXIgdmFsdWUgPSBjb250ZXh0LmdldCA/IGNvbnRleHQuZ2V0KG5hbWUpIDogY29udGV4dFtuYW1lXTtcclxuICAgICAgICBpZiAodmFsdWUgIT09IHZvaWQgMClcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5vd25lci5jb250ZXh0LmdldChuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICByZWZyZXNoKCkge1xyXG4gICAgICAgIHRoaXMub3duZXIuY29udGV4dC5yZWZyZXNoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB2YXIgYiA9IHRoaXMuY2hpbGRCaW5kaW5nc1tqXTtcclxuICAgICAgICAgICAgYi5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgdmFyIHRvdGFsID0gMDtcclxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0b3RhbCArPSB0aGlzLmNoaWxkQmluZGluZ3Nbal0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICAgICAgdGhpcy5kcml2ZXIgPSBkcml2ZXI7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMub3duZXIuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzW2VdLnVwZGF0ZSh0aGlzLCB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaW5zZXJ0KGJpbmRpbmcsIGRvbSwgaW5kZXgpIHtcclxuICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkQmluZGluZ3NbaV0gPT09IGJpbmRpbmcpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMub3duZXIuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaW5kZXgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uKGV2ZW50TmFtZSwgZG9tLCBldmVudEJpbmRpbmcpIHtcclxuICAgICAgICB0aGlzLmRyaXZlci5vbihldmVudE5hbWUsIGRvbSwgZXZlbnRCaW5kaW5nKTtcclxuICAgIH1cclxufVxyXG5cclxuZGVjbGFyZSBmdW5jdGlvbiBmZXRjaDxUPih1cmw6IHN0cmluZywgY29uZmlnPyk6IFByb21pc2U8VD47XHJcblxyXG5leHBvcnQgY2xhc3MgUmVtb3RlRGF0YVNvdXJjZSB7XHJcbiAgICBwcml2YXRlIG9ic2VydmVycyA9IFtdO1xyXG4gICAgcHJpdmF0ZSBvYmplY3QgPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHVybDogc3RyaW5nLCBwcml2YXRlIGJvZHkpIHtcclxuICAgICAgICB0aGlzLnJlbG9hZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbG9hZCgpIHtcclxuICAgICAgICB2YXIgY29uZmlnID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGFyc2UodGhpcy5ib2R5KSlcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBmZXRjaCh0aGlzLnVybCArIFwicXVlcnlcIiwgY29uZmlnKVxyXG4gICAgICAgICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9iamVjdCA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub2JzZXJ2ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYnNlcnZlcnNbaV0ub25OZXh0KHRoaXMub2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3Vic2NyaWJlKG9ic2VydmVyKSB7XHJcbiAgICAgICAgaWYgKHRoaXMub2JqZWN0ICE9PSBudWxsKVxyXG4gICAgICAgICAgICBvYnNlcnZlci5vbk5leHQodGhpcy5vYmplY3QpO1xyXG5cclxuICAgICAgICB0aGlzLm9ic2VydmVycy5wdXNoKG9ic2VydmVyKTtcclxuICAgIH1cclxuXHJcbiAgICB2YWx1ZU9mKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdDtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlKHJlY29yZCkge1xyXG4gICAgICAgIFJlc291cmNlLmNyZWF0ZSh0aGlzLnVybCwgcmVjb3JkKS50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucmVsb2FkKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBNb2RlbFJlcG9zaXRvcnkge1xyXG4gICAgcHJpdmF0ZSBkYXRhU291cmNlO1xyXG4gICAgcHJvdGVjdGVkIGN1cnJlbnRSb3cgPSBudWxsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHVybDogc3RyaW5nLCBleHByOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLmRhdGFTb3VyY2UgPSBuZXcgUmVtb3RlRGF0YVNvdXJjZSh1cmwsIGV4cHIpO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmUoKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhU291cmNlLnNhdmUodGhpcy5jdXJyZW50Um93KTtcclxuICAgICAgICB0aGlzLmNhbmNlbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNhbmNlbCgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRSb3cgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGFic3RyYWN0IGNyZWF0ZU5ldygpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVzb3VyY2Uge1xyXG4gICAgc3RhdGljIGNyZWF0ZSh1cmwsIGJvZHkpIHtcclxuICAgICAgICB2YXIgY29uZmlnID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSlcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gZmV0Y2godXJsLCBjb25maWcpO1xyXG4gICAgfVxyXG59Il19