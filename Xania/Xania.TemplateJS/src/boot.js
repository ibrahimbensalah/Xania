var Xania;
(function (Xania) {
    "use strict";
    var Application = (function () {
        function Application(libs) {
            this.libs = libs;
            this.contexts = [];
            this.compiler = new Xania.Ast.Compiler();
            this.compile = this.compiler.template.bind(this.compiler);
        }
        Application.prototype.listen = function (target) {
            var _this = this;
            var eventHandler = function (target, name) {
                var binding = target.attributes["__binding"];
                if (!!binding) {
                    binding.trigger(name);
                    _this.update();
                }
            };
            target.addEventListener("click", function (evt) { return eventHandler(evt.target, evt.type); });
            var onchange = function (evt) {
                var binding = evt.target.attributes["__binding"];
                if (binding != null) {
                    var nameAttr = evt.target.attributes["name"];
                    if (!!nameAttr) {
                        binding.context.set(nameAttr.value, evt.target.value);
                        _this.update();
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
                _this.update();
            });
        };
        Application.prototype.update = function () {
            for (var i = 0; i < this.contexts.length; i++) {
                var ctx = this.contexts[i];
                ctx.update(null);
            }
        };
        Application.prototype.import = function (view) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (typeof view === "string") {
                if (!("import" in document.createElement("link"))) {
                    throw new Error("HTML import is not supported in this browser");
                }
                return {
                    then: function (resolve) {
                        var _this = this;
                        var link = document.createElement('link');
                        link.rel = 'import';
                        link.href = view;
                        link.setAttribute('async', "");
                        link.onload = function (e) {
                            var link = e.target;
                            var dom = link.import.querySelector("template");
                            resolve.apply(_this, [dom].concat(args));
                        };
                        document.head.appendChild(link);
                    }
                };
            }
            else if (view instanceof HTMLElement) {
                return view;
            }
            else {
                throw new Error("view type is not supported");
            }
        };
        Application.prototype.bind = function (view, viewModel, target) {
            var _this = this;
            var observable = new Xania.RootContainer(viewModel, this.libs.reduce(function (x, y) { return Object.assign(x, y); }, {}));
            console.debug("bind", { view: view, viewModel: viewModel, target: target });
            this.contexts.push(observable);
            Xania.Util.ready(this.import(view), function (dom) {
                var tpl = _this.parseDom(dom);
                Xania.Binder.executeTemplate(observable, tpl, target, 0);
            });
            return this;
        };
        Application.prototype.parseDom = function (rootDom) {
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
                    var content = node["content"];
                    var template = new Xania.ContentTemplate();
                    for (i = content.childNodes.length - 1; i >= 0; i--) {
                        stack.push({ node: content.childNodes[i], push: template.addChild.bind(template) });
                    }
                    push(template);
                }
                else if (node.nodeType === 1) {
                    var elt = node;
                    var template_1 = new Xania.TagTemplate(elt.tagName);
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
                        push(new Xania.TextTemplate(tpl || node.textContent));
                    }
                }
            }
            return rootTpl;
        };
        Application.prototype.parseAttr = function (tagElement, attr) {
            var name = attr.name;
            if (name === "click" || name.match(/keyup\./)) {
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
                if (!!tagElement.name.match(/^input$/i) &&
                    !!attr.name.match(/^name$/i) &&
                    !tagElement.getAttribute("value")) {
                    var valueAccessor = this.compile("{{ " + attr.value + " }}");
                    tagElement.attr("value", valueAccessor);
                }
            }
        };
        return Application;
    }());
    var ComponentContainer = (function () {
        function ComponentContainer() {
            this.components = new Map();
        }
        ComponentContainer.prototype.get = function (node) {
            var name = node.nodeName.replace(/\-/, "").toLowerCase();
            var comp;
            if (this.components.has(name)) {
                var decl = this.components.get(name);
                comp = !!decl.Args
                    ? Reflect.construct(decl.Type, decl.Args)
                    : new decl.Type;
            }
            else {
                comp = this.global(name);
            }
            if (!comp)
                return false;
            return comp;
        };
        ComponentContainer.prototype.global = function (name) {
            for (var k in window) {
                if (name === k.toLowerCase()) {
                    var v = window[k];
                    if (typeof v === "function")
                        return new v();
                }
            }
            return null;
        };
        ComponentContainer.prototype.component = function () {
            var _this = this;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            if (args.length === 1 && typeof args[0] === "function") {
                var component = args[0];
                if (this.register(component, null)) {
                    return function (component) {
                        _this.unregister(component);
                        _this.register(component, args);
                    };
                }
            }
            return function (component) {
                _this.register(component, args);
            };
        };
        ComponentContainer.prototype.unregister = function (componentType) {
            var key = componentType.name.toLowerCase();
            var decl = componentType.get(key);
            if (decl.Type === componentType)
                this.components.delete(key);
        };
        ComponentContainer.prototype.register = function (componentType, args) {
            var key = componentType.name.toLowerCase();
            if (this.components.has(key))
                return false;
            this.components.set(key, { Type: componentType, Args: args });
            return true;
        };
        return ComponentContainer;
    }());
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        }
        else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }
    ready(function () {
        var app = new Application([Xania.Fun.List]);
        var components = new ComponentContainer();
        var stack = [document.body];
        while (stack.length > 0) {
            var dom = stack.pop();
            var component = components.get(dom);
            if (component === false) {
                for (var i = 0; i < dom.childNodes.length; i++) {
                    var child = dom.childNodes[i];
                    if (child.nodeType === 1)
                        stack.push(child);
                }
            }
            else {
                var target = document.createElement("div");
                dom.appendChild(target);
                app.bind(dom.nodeName + ".html", component, target);
                app.listen(target);
                for (var i = 0; i < dom.attributes.length; i++) {
                    var attr = dom.attributes.item(i);
                    dom[attr.name] = eval(attr.value);
                }
                if (!!component.init) {
                    component.init(app);
                }
            }
        }
    });
})(Xania || (Xania = {}));
//# sourceMappingURL=boot.js.map