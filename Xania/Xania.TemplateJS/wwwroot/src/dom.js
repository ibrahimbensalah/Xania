var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="template.ts" />
/// <reference path="store.ts" />
/// <reference path="zone.ts" />
/// <reference path="core.ts" />
/// <reference path="fun.ts" />
var Xania;
(function (Xania) {
    var Dom;
    (function (Dom) {
        var DomBinding = (function () {
            function DomBinding() {
                this.subscriptions = [];
            }
            DomBinding.prototype.update = function (context) {
                this.context = context;
                var binding = this;
                return ready(binding.state, function (s) {
                    return binding.state = binding.render(context, s);
                });
            };
            DomBinding.prototype.get = function (obj, name) {
                var result = obj.get(name);
                if (!!result && !!result.subscribe) {
                    var subscription = result.subscribe(this);
                    this.subscriptions.push(subscription);
                }
                return result;
            };
            DomBinding.prototype.extend = function (context, varName, x) {
                return new Xania.Data.Extension(context, varName, x);
            };
            DomBinding.prototype.invoke = function (root, invocable, args) {
                var runtime = {
                    binding: this,
                    get: function (target, name) {
                        var result = target.get(name);
                        if (!!result && !!result.subscribe)
                            result.subscribe(this.binding);
                        var value = result.valueOf();
                        var type = typeof value;
                        if (value === null ||
                            type === "function" ||
                            type === "undefined" ||
                            type === "boolean" ||
                            type === "number" ||
                            type === "string")
                            return value;
                        return result;
                    },
                    set: function (target, name, value) {
                        target.set(name, value.valueOf());
                    },
                    invoke: function (target, fn) {
                        return fn.apply(target.value);
                    }
                };
                var zone = new Xania.Zone(runtime);
                var arr = args.map(function (result) {
                    var type = typeof result.value;
                    if (result.value === null ||
                        type === "function" ||
                        type === "boolean" ||
                        type === "number" ||
                        type === "string")
                        return result.value;
                    return result;
                });
                var result = zone.run(invocable, null, arr);
                if (!!result && result.subscribe) {
                    return result;
                }
                return new Xania.Data.Immutable(result);
            };
            DomBinding.prototype.forEach = function (context, fn) {
                if (!!context.get)
                    context.get("length").subscribe(this);
                return context.forEach(fn);
            };
            DomBinding.prototype.notify = function () {
                this.update(this.context);
            };
            return DomBinding;
        }());
        var ContentBinding = (function (_super) {
            __extends(ContentBinding, _super);
            function ContentBinding() {
                var _this = _super.call(this) || this;
                _this.dom = document.createDocumentFragment();
                return _this;
            }
            ContentBinding.prototype.render = function () {
                return this.dom;
            };
            return ContentBinding;
        }(DomBinding));
        Dom.ContentBinding = ContentBinding;
        var TextBinding = (function (_super) {
            __extends(TextBinding, _super);
            function TextBinding(modelAccessor, context) {
                var _this = _super.call(this) || this;
                _this.modelAccessor = modelAccessor;
                _this.dom = document.createTextNode("");
                _this.context = context;
                return _this;
            }
            TextBinding.prototype.render = function (context) {
                var newValue = this.modelAccessor.execute(context, this);
                if (!!newValue && !!newValue.onNext) {
                    newValue.subscribe(this);
                }
                else {
                    this.onNext(newValue.valueOf());
                }
            };
            TextBinding.prototype.onNext = function (newValue) {
                this.dom.textContent = newValue;
            };
            return TextBinding;
        }(DomBinding));
        Dom.TextBinding = TextBinding;
        var TagBinding = (function (_super) {
            __extends(TagBinding, _super);
            function TagBinding(name, ns, attributes, events) {
                var _this = _super.call(this) || this;
                _this.ns = ns;
                _this.events = events;
                _this.attributeBindings = [];
                if (ns === null)
                    _this.dom = document.createElement(name);
                else {
                    _this.dom = document.createElementNS(ns, name.toLowerCase());
                }
                _this.dom.attributes["__binding"] = _this;
                var classBinding = new ClassBinding(_this);
                var length = attributes.length;
                for (var i = 0; i < length; i++) {
                    var attr = attributes[i];
                    var attrTpl = attr.tpl;
                    var attrName = attr.name;
                    if (attrName === "class") {
                        classBinding.setBaseClass(attrTpl);
                    }
                    else if (attrName.startsWith("class.")) {
                        classBinding.addClass(attrName.substr(6), attrTpl);
                    }
                    else {
                        var attrBinding = new AttributeBinding(_this, attrName, attrTpl);
                        _this.attributeBindings.push(attrBinding);
                    }
                }
                ;
                _this.attributeBindings.push(classBinding);
                return _this;
            }
            TagBinding.prototype.render = function (context) {
                for (var i = 0; i < this.attributeBindings.length; i++) {
                    this.attributeBindings[i].render(context);
                }
                return this.dom;
            };
            TagBinding.prototype.trigger = function (name) {
                var handler = this.events.get(name);
                if (!!handler) {
                    var result = handler.execute(this.context, {
                        get: function (obj, name) {
                            return obj.get(name);
                        },
                        set: function (obj, name, value) {
                            obj.get(name).set(value);
                        },
                        invoke: function (_, fn, args) {
                            if (!!fn.invoke) {
                                var xs = args.map(function (x) { return x.valueOf(); });
                                return fn.invoke(xs);
                            }
                            return fn;
                        }
                    });
                    if (!!result && typeof result.value === "function")
                        result.invoke();
                }
            };
            return TagBinding;
        }(DomBinding));
        Dom.TagBinding = TagBinding;
        var ClassBinding = (function (_super) {
            __extends(ClassBinding, _super);
            function ClassBinding(parent) {
                var _this = _super.call(this) || this;
                _this.parent = parent;
                _this.conditions = [];
                return _this;
            }
            ClassBinding.prototype.setBaseClass = function (tpl) {
                this.baseClassTpl = tpl;
            };
            ClassBinding.prototype.addClass = function (className, condition) {
                this.conditions.push({ className: className, condition: condition });
            };
            ClassBinding.prototype.render = function (context) {
                this.context = context;
                var classes = [];
                if (!!this.baseClassTpl) {
                    var value = this.baseClassTpl.execute(context, this).valueOf();
                    classes.push(value);
                }
                for (var i = 0; i < this.conditions.length; i++) {
                    var _a = this.conditions[i], className = _a.className, condition = _a.condition;
                    if (!!condition.execute(context, this).valueOf()) {
                        classes.push(className);
                    }
                }
                this.setAttribute("class", classes.length > 0 ? join(" ", classes) : null);
            };
            ClassBinding.prototype.setAttribute = function (attrName, newValue) {
                var oldValue = this.oldValue;
                var tag = this.parent.dom;
                if (typeof newValue === "undefined" || newValue === null) {
                    tag[attrName] = void 0;
                    tag.removeAttribute(attrName);
                }
                else {
                    if (typeof oldValue === "undefined") {
                        var attr = document.createAttribute(attrName);
                        attr.value = newValue;
                        tag.setAttributeNode(attr);
                    }
                    else {
                        tag.className = newValue;
                    }
                }
                this.oldValue = newValue;
            };
            return ClassBinding;
        }(DomBinding));
        Dom.ClassBinding = ClassBinding;
        var AttributeBinding = (function (_super) {
            __extends(AttributeBinding, _super);
            function AttributeBinding(parent, name, tpl) {
                var _this = _super.call(this) || this;
                _this.parent = parent;
                _this.name = name;
                _this.tpl = tpl;
                return _this;
            }
            AttributeBinding.prototype.render = function (context) {
                this.context = context;
                var value = this.tpl.execute(context, this);
                if (!!value && !!value.onNext) {
                    value.subscribe(this);
                }
                else {
                    this.onNext(value);
                }
            };
            AttributeBinding.prototype.onNext = function (value) {
                if (value !== null && value !== void 0 && !!value.valueOf)
                    value = value.valueOf();
                var newValue;
                if (this.name === "checked") {
                    newValue = !!value ? "checked" : null;
                }
                else {
                    newValue = value;
                }
                var oldValue = this.oldValue;
                var attrName = this.name;
                var tag = this.parent.dom;
                if (typeof newValue === "undefined" || newValue === null) {
                    tag[attrName] = void 0;
                    tag.removeAttribute(attrName);
                }
                else {
                    if (typeof oldValue === "undefined") {
                        var attr = document.createAttribute(attrName);
                        attr.value = newValue;
                        tag.setAttributeNode(attr);
                    }
                    else {
                        tag[attrName] = newValue;
                        tag.setAttribute(attrName, newValue);
                    }
                }
                this.oldValue = newValue;
            };
            return AttributeBinding;
        }(DomBinding));
        Dom.AttributeBinding = AttributeBinding;
        var ReactiveBinding = (function (_super) {
            __extends(ReactiveBinding, _super);
            function ReactiveBinding(tpl, target, offset) {
                var _this = _super.call(this) || this;
                _this.tpl = tpl;
                _this.target = target;
                _this.offset = offset;
                _this.bindings = [];
                return _this;
            }
            ReactiveBinding.prototype.render = function (context) {
                var _this = this;
                var _a = this, bindings = _a.bindings, target = _a.target, tpl = _a.tpl;
                if (!!tpl.modelAccessor) {
                    var stream = tpl.modelAccessor.execute(context, this);
                    this.length = 0;
                    stream.forEach(function (ctx, idx) {
                        _this.length = idx + 1;
                        for (var i = 0; i < bindings.length; i++) {
                            var binding = bindings[i];
                            if (binding.context.value === ctx.value) {
                                if (i !== idx) {
                                    bindings[i] = bindings[idx];
                                    bindings[idx] = binding;
                                }
                                return;
                            }
                        }
                        _this.execute(ctx, idx);
                    });
                }
                else {
                    this.execute(context, 0);
                    this.length = 1;
                }
                while (bindings.length > this.length) {
                    var oldBinding = bindings.pop();
                    target.removeChild(oldBinding.dom);
                }
                return this;
            };
            ReactiveBinding.prototype.execute = function (result, idx) {
                this.addBinding(this.tpl.bind(result), idx);
            };
            ReactiveBinding.prototype.addBinding = function (newBinding, idx) {
                var _a = this, offset = _a.offset, target = _a.target, bindings = _a.bindings;
                var insertAt = offset + idx;
                if (insertAt < target.childNodes.length) {
                    var beforeElement = target.childNodes[insertAt];
                    target.insertBefore(newBinding.dom, beforeElement);
                }
                else {
                    target.appendChild(newBinding.dom);
                }
                bindings.splice(idx, 0, newBinding);
            };
            return ReactiveBinding;
        }(DomBinding));
        function executeTemplate(observable, tpl, target, offset) {
            return new ReactiveBinding(tpl, target, offset).update(observable);
        }
        Dom.executeTemplate = executeTemplate;
        var Binder = (function () {
            function Binder(libs) {
                this.libs = libs;
                this.contexts = [];
                this.compiler = new Xania.Ast.Compiler();
                this.compile = this.compiler.template.bind(this.compiler);
            }
            Binder.listen = function (target, store) {
                var eventHandler = function (target, name) {
                    var binding = target.attributes["__binding"];
                    if (!!binding) {
                        binding.trigger(name);
                        store.update();
                    }
                };
                target.addEventListener("click", function (evt) { return eventHandler(evt.target, evt.type); });
                var onchange = function (evt) {
                    var binding = evt.target.attributes["__binding"];
                    if (binding != null) {
                        var nameAttr = evt.target.attributes["name"];
                        if (!!nameAttr) {
                            var arr = nameAttr.value.split('.');
                            var context = binding.context;
                            for (var i = 0; i < arr.length; i++) {
                                var p = arr[i];
                                context = context.get(p);
                            }
                            context.set(evt.target.value);
                            store.update();
                        }
                    }
                };
                target.addEventListener("keyup", function (evt) {
                    if (evt.keyCode === 13) {
                        eventHandler(evt.target, "keyup.enter");
                    }
                    else {
                        onchange(evt);
                    }
                });
                target.addEventListener("mouseover", function (evt) {
                    eventHandler(evt.target, "mouseover");
                });
                target.addEventListener("mouseout", function (evt) {
                    eventHandler(evt.target, "mouseout");
                });
            };
            Binder.prototype.update2 = function () {
                for (var i = 0; i < this.contexts.length; i++) {
                    var ctx = this.contexts[i];
                    ctx.update(null);
                }
            };
            Binder.prototype.parseDom = function (rootDom) {
                var stack = [];
                var i;
                var rootTpl;
                stack.push({
                    node: rootDom,
                    push: function (e) {
                        rootTpl = e;
                    }
                });
                while (stack.length > 0) {
                    var cur = stack.pop();
                    var node = cur.node;
                    var push = cur.push;
                    if (!!node["content"]) {
                        var elt = node["content"];
                        var template = new Xania.Template.ContentTemplate();
                        for (i = elt.childNodes.length - 1; i >= 0; i--) {
                            stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
                        }
                        push(template);
                    }
                    else if (node.nodeType === 1) {
                        var elt = node;
                        var template_1 = new Xania.Template.TagTemplate(elt.tagName, elt.namespaceURI);
                        for (i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                            var attribute = elt.attributes[i];
                            this.parseAttr(template_1, attribute);
                        }
                        for (i = elt.childNodes.length - 1; i >= 0; i--) {
                            stack.push({ node: elt.childNodes[i], push: template_1.addChild.bind(template_1) });
                        }
                        push(template_1);
                    }
                    else if (node.nodeType === 3) {
                        var textContent = node.textContent;
                        if (textContent.trim().length > 0) {
                            var tpl = this.compile(textContent);
                            push(new Xania.Template.TextTemplate(tpl || node.textContent));
                        }
                    }
                }
                return rootTpl;
            };
            Binder.prototype.parseAttr = function (tagElement, attr) {
                var name = attr.name;
                if (name === "click" || name.match(/keyup\./) || name === "mouseover" || name === "mouseout") {
                    var fn = this.compile(attr.value);
                    tagElement.addEvent(name, fn);
                }
                else if (name === "data-select" || name === "data-from") {
                    var fn = this.compile(attr.value);
                    tagElement.select(fn);
                }
                else {
                    var tpl = this.compile(attr.value);
                    tagElement.attr(name, tpl || attr.value);
                    // conventions
                    if (!!tagElement.name.match(/^input$/i) &&
                        !!attr.name.match(/^name$/i) &&
                        !tagElement.getAttribute("value")) {
                        var valueAccessor = this.compile("{{ " + attr.value + " }}");
                        tagElement.attr("value", valueAccessor);
                    }
                }
            };
            return Binder;
        }());
        function importView(view) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (!("import" in document.createElement("link"))) {
                throw new Error("HTML import is not supported in this browser");
            }
            var deferred = defer();
            var link = document.createElement('link');
            link.rel = 'import';
            link.href = view;
            link.setAttribute('async', ""); // make it async!
            link.onload = function (e) {
                var link = e.target;
                deferred.notify(link.import.querySelector("template"));
                link.onload = null;
            };
            document.head.appendChild(link);
            return deferred;
        }
        Dom.importView = importView;
        function defer() {
            return {
                value: void 0,
                resolvers: [],
                notify: function (value) {
                    if (value === void 0)
                        throw new Error("undefined result");
                    this.value = value;
                    for (var i = 0; i < this.resolvers.length; i++) {
                        this.resolvers[i].call(null, value);
                    }
                },
                then: function (resolve) {
                    if (this.value === void 0) {
                        this.resolvers.push(resolve);
                    }
                    else {
                        resolve.call(null, this.value);
                    }
                }
            };
        }
        function bind(dom, store) {
            var binder = new Binder([Xania.Core.List, Xania.Core.Math, Xania.Core.Dates]);
            var fragment = document.createDocumentFragment();
            Dom.executeTemplate(store, binder.parseDom(dom), fragment, 0);
            for (var i = 0; i < fragment.childNodes.length; i++) {
                var child = fragment.childNodes[i];
                Binder.listen(child, store);
            }
            return fragment;
        }
        Dom.bind = bind;
    })(Dom = Xania.Dom || (Xania.Dom = {}));
    function ready(data, resolve) {
        if (data !== null && data !== void 0 && !!data.then)
            return data.then(resolve);
        if (!!resolve.execute)
            return resolve.execute.call(resolve, data);
        return resolve.call(resolve, data);
    }
    Xania.ready = ready;
    function join(separator, value) {
        if (Array.isArray(value)) {
            return value.length > 0 ? value.sort().join(separator) : null;
        }
        return value;
    }
    Xania.join = join;
    // ReSharper restore InconsistentNaming
})(Xania || (Xania = {}));
//# sourceMappingURL=dom.js.map