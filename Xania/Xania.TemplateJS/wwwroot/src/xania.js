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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Xania;
function mount(root) {
    var stack = [root];
    while (stack.length) {
        var binding = stack.pop();
        var children = binding.execute();
        if (children) {
            var i = children.length;
            while (i--) {
                stack.push(children[i]);
            }
        }
    }
}
exports.mount = mount;
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
    ComponentBinding.prototype.insert = function (binding, dom, idx) {
        var offset = 0, length = this.childBindings.length;
        for (var i = 0; i < length; i++) {
            if (this.childBindings[i] === binding)
                break;
            offset += this.childBindings[i].length;
        }
        this.driver.insert(this, dom, offset + idx);
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
    function WithBinding(expr, childTemplates) {
        var _this = _super.call(this) || this;
        _this.expr = expr;
        _this.childTemplates = childTemplates;
        _this.conditionalBindings = [];
        return _this;
    }
    WithBinding.prototype.execute = function () {
        this.render(this.context, this.driver);
        return void 0;
    };
    WithBinding.prototype.render = function (context, driver) {
        var _this = this;
        var result = this.evaluateObject(this.expr, context);
        this.object = result;
        var value = result && !!result.valueOf();
        var childBindings = this.conditionalBindings, i = childBindings.length;
        if (value) {
            if (!i) {
                this.childTemplates.map(function (x) { return x.bind().update2(_this, driver); }).forEach(function (x) {
                    mount(x);
                    childBindings.push(x);
                });
            }
            else {
                while (i--) {
                    childBindings[i].update2(this, driver);
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
    WithBinding.prototype.dispose = function () {
        throw Error("not implemented");
    };
    return WithBinding;
}(reactive_1.Reactive.Binding));
exports.WithBinding = WithBinding;
function If(attrs, children) {
    return {
        bind: function () {
            return new WithBinding(attrs.expr, children);
        }
    };
}
exports.If = If;
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
        for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
            var child = children_2[_i];
            if (!child.bind)
                throw Error("child is not a node");
        }
        return _this;
    }
    Object.defineProperty(RepeatBinding.prototype, "length", {
        get: function () {
            var total = 0, length = this.childBindings.length;
            for (var i = 0; i < length; i++) {
                total += this.childBindings[i].length;
            }
            return total;
        },
        enumerable: true,
        configurable: true
    });
    RepeatBinding.prototype.execute = function () {
        this.render(this.context, this.driver);
        return void 0;
    };
    RepeatBinding.prototype.dispose = function () {
        var childBindings = this.childBindings, i = childBindings.length;
        while (i--) {
            childBindings[i].dispose();
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
        var stream;
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
        var i = 0, childBindings = this.childBindings;
        while (i < childBindings.length) {
            var frag = childBindings[i];
            if (stream.indexOf(frag.context) < 0) {
                frag.dispose();
                childBindings.splice(i, 1);
            }
            else {
                i++;
            }
        }
        var fr, streamlength = stream.length;
        for (var i = 0; i < streamlength; i++) {
            var item = stream.get ? stream.get(i) : stream[i];
            var fragment = null, fraglength = childBindings.length;
            for (var e = i; e < fraglength; e++) {
                fr = childBindings[e];
                if (fr.context === item) {
                    fragment = fr;
                    RepeatBinding.swap(childBindings, e, i);
                    break;
                }
            }
            if (fragment === null) {
                fragment = new FragmentBinding(this.param, this.children);
                childBindings.push(fragment);
                RepeatBinding.swap(childBindings, fraglength, i);
            }
            mount(fragment.update2(item, this));
        }
    };
    RepeatBinding.prototype.insert = function (fragment, dom, idx) {
        if (this.driver) {
            var offset = 0, childBindings = this.childBindings;
            for (var i = 0; i < childBindings.length; i++) {
                if (childBindings[i] === fragment)
                    break;
                offset += childBindings[i].length;
            }
            this.driver.insert(this, dom, offset + idx);
        }
    };
    RepeatBinding.prototype.refresh = function () {
        this.context.refresh();
    };
    return RepeatBinding;
}(reactive_1.Reactive.Binding));
var FragmentBinding = (function (_super) {
    __extends(FragmentBinding, _super);
    function FragmentBinding(param, children) {
        var _this = _super.call(this) || this;
        _this.param = param;
        _this.children = children;
        _this.childBindings = children.map(function (x) { return x.bind(); });
        return _this;
    }
    Object.defineProperty(FragmentBinding.prototype, "length", {
        get: function () {
            var childBindings = this.childBindings, i = childBindings.length, length = 0;
            while (i--) {
                length += childBindings[i].length;
            }
            return length;
        },
        enumerable: true,
        configurable: true
    });
    FragmentBinding.prototype.get = function (name) {
        if (name === this.param)
            return this.context;
        return void 0;
    };
    FragmentBinding.prototype.updateChildren = function (context) {
        if (this.param !== void 0)
            _super.prototype.updateChildren.call(this, this);
        else
            _super.prototype.updateChildren.call(this, context);
    };
    FragmentBinding.prototype.render = function () {
    };
    FragmentBinding.prototype.insert = function (binding, dom, idx) {
        var offset = 0, length = this.childBindings.length;
        for (var i = 0; i < length; i++) {
            if (this.childBindings[i] === binding)
                break;
            offset += this.childBindings[i].length;
        }
        this.driver.insert(this, dom, offset + idx);
    };
    FragmentBinding.prototype.refresh = function () {
        var driver = this.driver;
        driver.context.refresh();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ4YW5pYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSx1Q0FBcUM7QUFrS2xCLHVDQUFRO0FBakszQiw2QkFBMkI7QUFpS0Usd0JBQUc7QUFoS2hDLHFDQUFpRDtBQUNqRCx1Q0FBcUM7QUErSjVCLHVDQUFRO0FBN0pqQjtJQUFBO0lBOEVBLENBQUM7SUE3RVUsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQztZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUNoQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNyRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQW1CLEtBQUssRUFBRSxTQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNwRixDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5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QUFDO1FBQ3RDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNsQixDQUFDO0lBRUQsZ0NBQU0sR0FBTjtRQUNJLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQzNCLENBQUM7SUFHTCxzQkFBQztBQUFELENBQUMsQUFsQkQsSUFrQkM7QUFsQnFCLDBDQUFlO0FBb0JyQztJQUFBO0lBWUEsQ0FBQztJQVhVLGVBQU0sR0FBYixVQUFjLEdBQUcsRUFBRSxJQUFJO1FBQ25CLElBQUksTUFBTSxHQUFHO1lBQ1QsTUFBTSxFQUFFLE1BQU07WUFDZCxPQUFPLEVBQUU7Z0JBQ0wsY0FBYyxFQUFFLGtCQUFrQjthQUNyQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztTQUM3QixDQUFDO1FBRUYsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUNMLGVBQUM7QUFBRCxDQUFDLEFBWkQsSUFZQztBQVpZLDRCQUFRIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tIFwiLi90ZW1wbGF0ZVwiXHJcbmltcG9ydCB7IERvbSB9IGZyb20gXCIuL2RvbVwiXHJcbmltcG9ydCBjb21waWxlLCB7IFNjb3BlLCBwYXJzZSB9IGZyb20gXCIuL2NvbXBpbGVcIlxyXG5pbXBvcnQgeyBSZWFjdGl2ZSB9IGZyb20gXCIuL3JlYWN0aXZlXCJcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFhhbmlhIHtcclxuICAgIHN0YXRpYyB0ZW1wbGF0ZXMoZWxlbWVudHMpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBlbGVtZW50c1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjaGlsZCA9PT0gbnVsbCB8fCBjaGlsZCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGNoaWxkLmJpbmQpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBjaGlsZCA9PT0gXCJudW1iZXJcIiB8fCB0eXBlb2YgY2hpbGQgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIGNoaWxkLmV4ZWN1dGUgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFRlbXBsYXRlLlRleHRUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihjaGlsZCwgRG9tLkRvbVZpc2l0b3IpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGNoaWxkKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjaGlsZFRlbXBsYXRlcy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkVGVtcGxhdGVzW2pdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY2hpbGQudmlldyA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChDb21wb25lbnQoY2hpbGQsIHt9KSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBzdmdFbGVtZW50cyA9IFtcInN2Z1wiLCBcImNpcmNsZVwiLCBcImxpbmVcIiwgXCJnXCIsIFwicGF0aFwiLCBcIm1hcmtlclwiXTtcclxuXHJcbiAgICBzdGF0aWMgdGFnKGVsZW1lbnQsIGF0dHJzLCAuLi5jaGlsZHJlbik6IFRlbXBsYXRlLklOb2RlIHtcclxuICAgICAgICB2YXIgY2hpbGRUZW1wbGF0ZXMgPSB0aGlzLnRlbXBsYXRlcyhjaGlsZHJlbik7XHJcblxyXG4gICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgVGVtcGxhdGUuVGFnVGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB2YXIgbnMgPSBYYW5pYS5zdmdFbGVtZW50cy5pbmRleE9mKGVsZW1lbnQpID49IDAgPyBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgOiBudWxsO1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRlbXBsYXRlLlRhZ1RlbXBsYXRlPFJlYWN0aXZlLkJpbmRpbmc+KGVsZW1lbnQsIG5zLCBjaGlsZFRlbXBsYXRlcywgRG9tLkRvbVZpc2l0b3IpO1xyXG4gICAgICAgICAgICBpZiAoYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IGF0dHJzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcCA9PT0gXCJjbGFzc05hbWVcIiB8fCBwcm9wID09PSBcImNsYXNzbmFtZVwiIHx8IHByb3AgPT09IFwiY2xhenpcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgYXR0clZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocHJvcCA9PT0gXCJodG1sRm9yXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcImZvclwiLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihwcm9wLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXR0cnMubmFtZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhdHRycy50eXBlID09PSBcInRleHRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWF0dHJzLnZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcInZhbHVlXCIsIGNvbXBpbGUoYXR0cnMubmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5wcm90b3R5cGUuYmluZCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3QuY29uc3RydWN0KGVsZW1lbnQsIFthdHRycyB8fCB7fSwgY2hpbGRUZW1wbGF0ZXNdKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChlbGVtZW50LnByb3RvdHlwZS52aWV3KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQ29tcG9uZW50KFJlZmxlY3QuY29uc3RydWN0KGVsZW1lbnQsIFthdHRycyB8fCB7fSwgY2hpbGRUZW1wbGF0ZXNdKSwgYXR0cnMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBlbGVtZW50KGF0dHJzIHx8IHt9LCBjaGlsZFRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXZpZXcpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGxvYWQgdmlld1wiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2aWV3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJ0YWcgdW5yZXNvbHZlZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbmRlcihlbGVtZW50LCBkcml2ZXIpIHtcclxuICAgICAgICByZXR1cm4gWGFuaWEudGFnKGVsZW1lbnQsIHt9KVxyXG4gICAgICAgICAgICAuYmluZCgpXHJcbiAgICAgICAgICAgIC51cGRhdGUobmV3IFJlYWN0aXZlLlN0b3JlKHt9KSwgZHJpdmVyKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtb3VudChyb290OiBSZWFjdGl2ZS5CaW5kaW5nKSB7XHJcbiAgICB2YXIgc3RhY2sgPSBbcm9vdF07XHJcbiAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XHJcbiAgICAgICAgY29uc3QgYmluZGluZyA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gYmluZGluZy5leGVjdXRlKCk7XHJcbiAgICAgICAgaWYgKGNoaWxkcmVuKSB7XHJcbiAgICAgICAgICAgIHZhciBpID0gY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKGNoaWxkcmVuW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIENvbXBvbmVudChjb21wb25lbnQsIHByb3BzKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGNvbXBvbmVudCxcclxuICAgICAgICBiaW5kKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbXBvbmVudEJpbmRpbmcodGhpcy5jb21wb25lbnQsIHByb3BzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5jbGFzcyBDb21wb25lbnRCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwcml2YXRlIGNvbXBvbmVudFN0b3JlID0gbmV3IFJlYWN0aXZlLlN0b3JlKHRoaXMuY29tcG9uZW50KTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbXBvbmVudCwgcHJpdmF0ZSBwcm9wcykge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzID0gW2NvbXBvbmVudC52aWV3KFhhbmlhKS5iaW5kKCldO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZUNoaWxkcmVuKGNvbnRleHQpIHtcclxuICAgICAgICBzdXBlci51cGRhdGVDaGlsZHJlbih0aGlzLmNvbXBvbmVudFN0b3JlKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgIGxldCBwcm9wcyA9IHRoaXMucHJvcHM7XHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBwcm9wcykge1xyXG4gICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBleHByID0gcHJvcHNbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlVmFsdWUgPSBleHByLmV4ZWN1dGUgPyBleHByLmV4ZWN1dGUodGhpcywgY29udGV4dCkgOiBleHByO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZVZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRbcHJvcF0gPSBzb3VyY2VWYWx1ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRTdG9yZS5yZWZyZXNoKCk7XHJcbiAgICAgICAgLy8gdGhpcy5iaW5kaW5nLmV4ZWN1dGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIHZhciB7IGNoaWxkQmluZGluZ3MgfSA9IHRoaXM7XHJcbiAgICAgICAgaWYgKGNoaWxkQmluZGluZ3MpIHtcclxuICAgICAgICAgICAgdmFyIGkgPSBjaGlsZEJpbmRpbmdzLmxlbmd0aCB8fCAwO1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQ6IGFueSA9IGNoaWxkQmluZGluZ3NbaV07XHJcbiAgICAgICAgICAgICAgICBjaGlsZC5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gdGhpcy5iaW5kaW5nLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgaW5zZXJ0KGJpbmRpbmcsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDAsXHJcbiAgICAgICAgICAgIGxlbmd0aCA9IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmNoaWxkQmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRyaXZlci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgeyBSZWFjdGl2ZSwgVGVtcGxhdGUsIERvbSB9XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gUmVwZWF0KGF0dHJzLCBjaGlsZHJlbikge1xyXG4gICAgcmV0dXJuIG5ldyBSZXBlYXRUZW1wbGF0ZTxSZWFjdGl2ZS5CaW5kaW5nPihhdHRycy5wYXJhbSwgYXR0cnMuc291cmNlLCBjaGlsZHJlbiwgRG9tLkRvbVZpc2l0b3IpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gRm9yRWFjaChhdHRycywgY2hpbGRyZW4pIHtcclxuICAgIHJldHVybiBuZXcgRm9yRWFjaFRlbXBsYXRlPFJlYWN0aXZlLkJpbmRpbmc+KGF0dHJzLnBhcmFtLCBhdHRycy5zb3VyY2UsIGNoaWxkcmVuLCBEb20uRG9tVmlzaXRvcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBXaXRoKGF0dHJzLCBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBiaW5kKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFdpdGhCaW5kaW5nKGF0dHJzLm9iamVjdCwgY2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFdpdGhCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwcml2YXRlIGNvbmRpdGlvbmFsQmluZGluZ3MgPSBbXTtcclxuICAgIHByaXZhdGUgb2JqZWN0O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwciwgcHJpdmF0ZSBjaGlsZFRlbXBsYXRlczogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZSgpIHtcclxuICAgICAgICB0aGlzLnJlbmRlcih0aGlzLmNvbnRleHQsIHRoaXMuZHJpdmVyKTtcclxuICAgICAgICAvLyB3aGlsZSBtb3N0IChpZiBub3QgYWxsIG90aGVyKSBiaW5kaW5ncyByZXR1cm4gdGhlIGxpc3Qgb2YgY2hpbGRCaW5kaW5ncyB0byBiZSBtb3VudGVkLCBcclxuICAgICAgICAvLyB0aGlzIHJldHVybnMgdW5kZWZpbmVkIHRvIGJlIGFibGUgdG8gc2VsZiBtYW5hZ2UgbW91bnRpbmcgb2YgY2hpbGRCaW5kaW5ncy5cclxuICAgICAgICAvLyBOb3Qgc3VyZSBpZiB0aGlzIG5lZWRzIHJlZmFjdG9yaW5nLCByZW5hbWluZyBvciBjb252aW5jZSBteXNlbGYgdGhpcyBpcyB0aGUgcHVyZSBhcHByb2FjaC5cclxuICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZU9iamVjdCh0aGlzLmV4cHIsIGNvbnRleHQpO1xyXG4gICAgICAgIHRoaXMub2JqZWN0ID0gcmVzdWx0O1xyXG5cclxuICAgICAgICB2YXIgdmFsdWUgPSByZXN1bHQgJiYgISFyZXN1bHQudmFsdWVPZigpO1xyXG4gICAgICAgIHZhciBjaGlsZEJpbmRpbmdzOiBhbnlbXSA9IHRoaXMuY29uZGl0aW9uYWxCaW5kaW5ncyxcclxuICAgICAgICAgICAgaSA9IGNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKCFpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkVGVtcGxhdGVzLm1hcCh4ID0+IHguYmluZCgpLnVwZGF0ZTIodGhpcywgZHJpdmVyKSkuZm9yRWFjaCh4ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBtb3VudCh4KTtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZEJpbmRpbmdzLnB1c2goeCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZEJpbmRpbmdzW2ldLnVwZGF0ZTIodGhpcywgZHJpdmVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGNoaWxkQmluZGluZ3NbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNoaWxkQmluZGluZ3MubGVuZ3RoID0gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdC5nZXQobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaCgpIHtcclxuICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgdGhyb3cgRXJyb3IoXCJub3QgaW1wbGVtZW50ZWRcIik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBJZihhdHRycywgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgYmluZCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBXaXRoQmluZGluZyhhdHRycy5leHByLCBjaGlsZHJlbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZXhwcihjb2RlOiBzdHJpbmcpIHtcclxuICAgIHJldHVybiBjb21waWxlKGNvZGUpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUmVwZWF0VGVtcGxhdGU8VD4gaW1wbGVtZW50cyBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmFtLCBwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10sIHByaXZhdGUgdmlzaXRvcjogVGVtcGxhdGUuSVZpc2l0b3I8VD4pIHsgfVxyXG5cclxuICAgIGJpbmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZXBlYXRCaW5kaW5nKHRoaXMucGFyYW0sIHRoaXMuZXhwciwgdGhpcy5jaGlsZHJlbik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGb3JFYWNoVGVtcGxhdGU8VD4gaW1wbGVtZW50cyBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmFtLCBwcml2YXRlIGV4cHIsIHByaXZhdGUgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10sIHByaXZhdGUgdmlzaXRvcjogVGVtcGxhdGUuSVZpc2l0b3I8VD4pIHsgfVxyXG5cclxuICAgIGJpbmQoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBGb3JFYWNoQmluZGluZyh0aGlzLnBhcmFtLCB0aGlzLmV4cHIsIHRoaXMuY2hpbGRyZW4pO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBGb3JFYWNoQmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHVibGljIGZyYWdtZW50czogRnJhZ21lbnRbXSA9IFtdO1xyXG5cclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgdmFyIHRvdGFsID0gMCwgbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHBhcmFtLCBwcml2YXRlIGV4cHIsIHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgb2YgY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgaWYgKCFjaGlsZC5iaW5kKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJjaGlsZCBpcyBub3QgYSBub2RlXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5mcmFnbWVudHNbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBzd2FwKGFycjogRnJhZ21lbnRbXSwgc3JjSW5kZXgsIHRhckluZGV4KSB7XHJcbiAgICAgICAgaWYgKHNyY0luZGV4ID4gdGFySW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGkgPSBzcmNJbmRleDtcclxuICAgICAgICAgICAgc3JjSW5kZXggPSB0YXJJbmRleDtcclxuICAgICAgICAgICAgdGFySW5kZXggPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgc3JjID0gYXJyW3NyY0luZGV4XTtcclxuICAgICAgICAgICAgYXJyW3NyY0luZGV4XSA9IGFyclt0YXJJbmRleF07XHJcbiAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB2YXIgc3RyZWFtID0gdGhpcy5leHByLmV4ZWN1dGUodGhpcywgY29udGV4dCkuaXRlcmF0b3IoKTtcclxuXHJcbiAgICAgICAgdmFyIGkgPSBzdHJlYW0ubGVuZ3RoLFxyXG4gICAgICAgICAgICBmcmFnbWVudHMgPSB0aGlzLmZyYWdtZW50cyxcclxuICAgICAgICAgICAgZnJhZ21lbnRMZW5ndGggPSBmcmFnbWVudHMubGVuZ3RoO1xyXG5cclxuICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgIHZhciBpdGVtID0gc3RyZWFtLmdldCA/IHN0cmVhbS5nZXQoaSkgOiBzdHJlYW1baV0sIGZyYWdtZW50O1xyXG5cclxuICAgICAgICAgICAgaWYgKGkgPCBmcmFnbWVudExlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudHNbaV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBGcmFnbWVudCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGZyYWdtZW50cy5wdXNoKGZyYWdtZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmcmFnbWVudC51cGRhdGUoaXRlbSwgZHJpdmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdoaWxlIChmcmFnbWVudHMubGVuZ3RoID4gc3RyZWFtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBmcmFnbWVudHMucG9wKCkuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoZnJhZ21lbnQ6IEZyYWdtZW50LCBkb20sIGlkeCkge1xyXG4gICAgICAgIGlmICh0aGlzLmRyaXZlcikge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgZnJhZ21lbnRzID0gdGhpcy5mcmFnbWVudHMsIGkgPSBmcmFnbWVudHMubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZyID0gZnJhZ21lbnRzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZyID09PSBmcmFnbWVudClcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIG9mZnNldCArPSBmci5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kcml2ZXIuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaWR4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5jbGFzcyBSZXBlYXRCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHZhciB0b3RhbCA9IDAsIGxlbmd0aCA9IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0b3RhbCArPSB0aGlzLmNoaWxkQmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIHBhcmFtLCBwcml2YXRlIGV4cHIsIHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgZm9yICh2YXIgY2hpbGQgb2YgY2hpbGRyZW4pIHtcclxuICAgICAgICAgICAgaWYgKCFjaGlsZC5iaW5kKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJjaGlsZCBpcyBub3QgYSBub2RlXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlKCkge1xyXG4gICAgICAgIHRoaXMucmVuZGVyKHRoaXMuY29udGV4dCwgdGhpcy5kcml2ZXIpO1xyXG4gICAgICAgIC8vIHdoaWxlIG1vc3QgKGlmIG5vdCBhbGwgb3RoZXIpIGJpbmRpbmdzIHJldHVybiB0aGUgbGlzdCBvZiBjaGlsZEJpbmRpbmdzIHRvIGJlIG1vdW50ZWQsIFxyXG4gICAgICAgIC8vIHRoaXMgcmV0dXJucyB1bmRlZmluZWQgdG8gYmUgYWJsZSB0byBzZWxmIG1hbmFnZSBtb3VudGluZyBvZiBjaGlsZEJpbmRpbmdzLlxyXG4gICAgICAgIC8vIE5vdCBzdXJlIGlmIHRoaXMgbmVlZHMgcmVmYWN0b3JpbmcsIHJlbmFtaW5nIG9yIGNvbnZpbmNlIG15c2VsZiB0aGlzIGlzIHRoZSBwdXJlIGFwcHJvYWNoLlxyXG4gICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBsZXQgeyBjaGlsZEJpbmRpbmdzIH0gPSB0aGlzLCBpID0gY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICBjaGlsZEJpbmRpbmdzW2ldLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHN3YXAoYXJyOiBhbnlbXSwgc3JjSW5kZXgsIHRhckluZGV4KSB7XHJcbiAgICAgICAgaWYgKHNyY0luZGV4ID4gdGFySW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGkgPSBzcmNJbmRleDtcclxuICAgICAgICAgICAgc3JjSW5kZXggPSB0YXJJbmRleDtcclxuICAgICAgICAgICAgdGFySW5kZXggPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgc3JjID0gYXJyW3NyY0luZGV4XTtcclxuICAgICAgICAgICAgYXJyW3NyY0luZGV4XSA9IGFyclt0YXJJbmRleF07XHJcbiAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICB2YXIgc3RyZWFtO1xyXG4gICAgICAgIGlmICghIXRoaXMuZXhwciAmJiAhIXRoaXMuZXhwci5leGVjdXRlKSB7XHJcbiAgICAgICAgICAgIHN0cmVhbSA9IHRoaXMuZXhwci5leGVjdXRlKHRoaXMsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICBpZiAoc3RyZWFtLmxlbmd0aCA9PT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS52YWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0gPSBbc3RyZWFtXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzdHJlYW0gPSBbY29udGV4dF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgaSA9IDAsIHsgY2hpbGRCaW5kaW5ncyB9ID0gdGhpcztcclxuICAgICAgICB3aGlsZSAoaSA8IGNoaWxkQmluZGluZ3MubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBmcmFnID0gY2hpbGRCaW5kaW5nc1tpXTtcclxuICAgICAgICAgICAgaWYgKHN0cmVhbS5pbmRleE9mKGZyYWcuY29udGV4dCkgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICBmcmFnLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIGNoaWxkQmluZGluZ3Muc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZnI6IFJlYWN0aXZlLkJpbmRpbmcsIHN0cmVhbWxlbmd0aCA9IHN0cmVhbS5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJlYW1sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgaXRlbSA9IHN0cmVhbS5nZXQgPyBzdHJlYW0uZ2V0KGkpIDogc3RyZWFtW2ldO1xyXG5cclxuICAgICAgICAgICAgdmFyIGZyYWdtZW50OiBSZWFjdGl2ZS5CaW5kaW5nID0gbnVsbCwgZnJhZ2xlbmd0aCA9IGNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBlID0gaTsgZSA8IGZyYWdsZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgZnIgPSBjaGlsZEJpbmRpbmdzW2VdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZyLmNvbnRleHQgPT09IGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IGZyO1xyXG4gICAgICAgICAgICAgICAgICAgIFJlcGVhdEJpbmRpbmcuc3dhcChjaGlsZEJpbmRpbmdzLCBlLCBpKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGZyYWdtZW50ID09PSBudWxsIC8qIG5vdCBmb3VuZCAqLykge1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBuZXcgRnJhZ21lbnRCaW5kaW5nKHRoaXMucGFyYW0sIHRoaXMuY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICAgICAgY2hpbGRCaW5kaW5ncy5wdXNoKGZyYWdtZW50KTtcclxuICAgICAgICAgICAgICAgIFJlcGVhdEJpbmRpbmcuc3dhcChjaGlsZEJpbmRpbmdzLCBmcmFnbGVuZ3RoLCBpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbW91bnQoZnJhZ21lbnQudXBkYXRlMihpdGVtLCB0aGlzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChmcmFnbWVudCwgZG9tLCBpZHgpIHtcclxuICAgICAgICBpZiAodGhpcy5kcml2ZXIpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDAsIHsgY2hpbGRCaW5kaW5ncyB9ID0gdGhpcztcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZEJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2hpbGRCaW5kaW5nc1tpXSA9PT0gZnJhZ21lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gY2hpbGRCaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kcml2ZXIuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaWR4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaCgpIHtcclxuICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBGcmFnbWVudEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgdmFyIHsgY2hpbGRCaW5kaW5ncyB9ID0gdGhpcywgaSA9IGNoaWxkQmluZGluZ3MubGVuZ3RoLCBsZW5ndGggPSAwO1xyXG4gICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgbGVuZ3RoICs9IGNoaWxkQmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyYW06IHN0cmluZywgcHVibGljIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MgPSBjaGlsZHJlbi5tYXAoeCA9PiB4LmJpbmQoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgIGlmIChuYW1lID09PSB0aGlzLnBhcmFtKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb250ZXh0O1xyXG4gICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlQ2hpbGRyZW4oY29udGV4dCkge1xyXG4gICAgICAgIGlmICh0aGlzLnBhcmFtICE9PSB2b2lkIDApXHJcbiAgICAgICAgICAgIHN1cGVyLnVwZGF0ZUNoaWxkcmVuKHRoaXMpO1xyXG4gICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHN1cGVyLnVwZGF0ZUNoaWxkcmVuKGNvbnRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcigpIHtcclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoYmluZGluZzogUmVhY3RpdmUuQmluZGluZywgZG9tLCBpZHgpIHtcclxuICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkQmluZGluZ3NbaV0gPT09IGJpbmRpbmcpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZHJpdmVyLmluc2VydCh0aGlzLCBkb20sIG9mZnNldCArIGlkeCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaCgpIHtcclxuICAgICAgICB2YXIgZHJpdmVyOiBhbnkgPSB0aGlzLmRyaXZlcjtcclxuICAgICAgICBkcml2ZXIuY29udGV4dC5yZWZyZXNoKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGcmFnbWVudCB7XHJcbiAgICBwdWJsaWMgY2hpbGRCaW5kaW5nczogYW55W10gPSBbXTtcclxuICAgIHB1YmxpYyBjb250ZXh0O1xyXG4gICAgcHVibGljIGRyaXZlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG93bmVyOiB7IHBhcmFtPywgY2hpbGRyZW47IGNvbnRleHQ7IGluc2VydCB9KSB7XHJcbiAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCB0aGlzLm93bmVyLmNoaWxkcmVuLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5nc1tlXSA9XHJcbiAgICAgICAgICAgICAgICBvd25lci5jaGlsZHJlbltlXS5iaW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldChuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy5vd25lci5wYXJhbSkge1xyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gdGhpcy5vd25lci5wYXJhbSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29udGV4dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLmNvbnRleHQ7XHJcbiAgICAgICAgdmFyIHZhbHVlID0gY29udGV4dC5nZXQgPyBjb250ZXh0LmdldChuYW1lKSA6IGNvbnRleHRbbmFtZV07XHJcbiAgICAgICAgaWYgKHZhbHVlICE9PSB2b2lkIDApXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3duZXIuY29udGV4dC5nZXQobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVmcmVzaCgpIHtcclxuICAgICAgICB0aGlzLm93bmVyLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdmFyIGIgPSB0aGlzLmNoaWxkQmluZGluZ3Nbal07XHJcbiAgICAgICAgICAgIGIuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgbGVuZ3RoKCkge1xyXG4gICAgICAgIHZhciB0b3RhbCA9IDA7XHJcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5jaGlsZEJpbmRpbmdzW2pdLmxlbmd0aDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRvdGFsO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZTIoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICB0aGlzLmRyaXZlciA9IGRyaXZlcjtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5vd25lci5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBsZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbZV0udXBkYXRlMih0aGlzLCB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZEJpbmRpbmdzO1xyXG4gICAgfVxyXG5cclxuICAgIGluc2VydChiaW5kaW5nLCBkb20sIGluZGV4KSB7XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDAsIGxlbmd0aCA9IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmNoaWxkQmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm93bmVyLmluc2VydCh0aGlzLCBkb20sIG9mZnNldCArIGluZGV4KTtcclxuICAgIH1cclxuXHJcbiAgICBvbihldmVudE5hbWUsIGRvbSwgZXZlbnRCaW5kaW5nKSB7XHJcbiAgICAgICAgdGhpcy5kcml2ZXIub24oZXZlbnROYW1lLCBkb20sIGV2ZW50QmluZGluZyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmRlY2xhcmUgZnVuY3Rpb24gZmV0Y2g8VD4odXJsOiBzdHJpbmcsIGNvbmZpZz8pOiBQcm9taXNlPFQ+O1xyXG5cclxuZXhwb3J0IGNsYXNzIFJlbW90ZURhdGFTb3VyY2Uge1xyXG4gICAgcHJpdmF0ZSBvYnNlcnZlcnMgPSBbXTtcclxuICAgIHByaXZhdGUgb2JqZWN0ID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB1cmw6IHN0cmluZywgcHJpdmF0ZSBib2R5KSB7XHJcbiAgICAgICAgdGhpcy5yZWxvYWQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZWxvYWQoKSB7XHJcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBhcnNlKHRoaXMuYm9keSkpXHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gZmV0Y2godGhpcy51cmwgKyBcInF1ZXJ5XCIsIGNvbmZpZylcclxuICAgICAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vYmplY3QgPSBkYXRhO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm9ic2VydmVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JzZXJ2ZXJzW2ldLm9uTmV4dCh0aGlzLm9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHN1YnNjcmliZShvYnNlcnZlcikge1xyXG4gICAgICAgIGlmICh0aGlzLm9iamVjdCAhPT0gbnVsbClcclxuICAgICAgICAgICAgb2JzZXJ2ZXIub25OZXh0KHRoaXMub2JqZWN0KTtcclxuXHJcbiAgICAgICAgdGhpcy5vYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XHJcbiAgICB9XHJcblxyXG4gICAgdmFsdWVPZigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYmplY3Q7XHJcbiAgICB9XHJcblxyXG4gICAgc2F2ZShyZWNvcmQpIHtcclxuICAgICAgICBSZXNvdXJjZS5jcmVhdGUodGhpcy51cmwsIHJlY29yZCkudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnJlbG9hZCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTW9kZWxSZXBvc2l0b3J5IHtcclxuICAgIHByaXZhdGUgZGF0YVNvdXJjZTtcclxuICAgIHByb3RlY3RlZCBjdXJyZW50Um93ID0gbnVsbDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih1cmw6IHN0cmluZywgZXhwcjogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhU291cmNlID0gbmV3IFJlbW90ZURhdGFTb3VyY2UodXJsLCBleHByKTtcclxuICAgIH1cclxuXHJcbiAgICBzYXZlKCkge1xyXG4gICAgICAgIHRoaXMuZGF0YVNvdXJjZS5zYXZlKHRoaXMuY3VycmVudFJvdyk7XHJcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgIH1cclxuXHJcbiAgICBjYW5jZWwoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50Um93ID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBjcmVhdGVOZXcoKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFJlc291cmNlIHtcclxuICAgIHN0YXRpYyBjcmVhdGUodXJsLCBib2R5KSB7XHJcbiAgICAgICAgdmFyIGNvbmZpZyA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGJvZHkpXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZldGNoKHVybCwgY29uZmlnKTtcclxuICAgIH1cclxufSJdfQ==