/// <reference path="binding.ts" />

module Xania {
    import Value = Bind.IValue;
    import RootContainer = Bind.RootContainer;

    class Binder {
        private compile: Function;
        private compiler: Ast.Compiler;
        private contexts: Value[] = [];

        constructor(private libs: any[]) {
            this.compiler = new Ast.Compiler();
            this.compile = this.compiler.template.bind(this.compiler);
        }

        public listen(target) {
            var eventHandler = (target, name) => {
                var binding = target.attributes["__binding"];
                if (!!binding) {
                    binding.trigger(name);
                    // binding.context.update();
                    this.update();
                }
            };

            target.addEventListener("click", evt => eventHandler(evt.target, evt.type));

            const onchange = evt => {
                var binding = evt.target.attributes["__binding"];
                if (binding != null) {
                    const nameAttr = evt.target.attributes["name"];
                    if (!!nameAttr) {
                        binding.context.set(nameAttr.value, evt.target.value);
                        // binding.context.update();
                        this.update();
                    }
                }
            };
            target.addEventListener("keyup",
                evt => {
                    if (evt.keyCode === 13) {
                        eventHandler(evt.target, "keyup.enter");
                    } else {
                        onchange(evt);
                    }
                });
            target.addEventListener("mouseover",
                evt => {
                    eventHandler(evt.target, "mouseover");
                }
            );
            target.addEventListener("mouseout",
                evt => {
                    eventHandler(evt.target, "mouseout");
                }
            );
        }

        public update() {
            for (let i = 0; i < this.contexts.length; i++) {
                var ctx = this.contexts[i];
                ctx.update(null);
            }
        }

        import(view, ...args): any {
            if (typeof view === "string") {
                if (!("import" in document.createElement("link"))) {
                    throw new Error("HTML import is not supported in this browser");
                }

                return {
                    then(resolve) {
                        var link = document.createElement('link');
                        link.rel = 'import';
                        link.href = view;
                        link.setAttribute('async', ""); // make it async!
                        link.onload = e => {
                            var link = (<any>e.target);
                            var dom = link.import.querySelector("template");
                            resolve.apply(this, [dom].concat(args));
                        }
                        document.head.appendChild(link);
                    }
                };
            } else if (view instanceof HTMLElement) {
                return view;
            } else {
                throw new Error("view type is not supported");
            }
        }

        // ReSharper disable once InconsistentNaming
        bind(view, viewModel, target: Node) {
            var observable = new RootContainer(viewModel, this.libs.reduce((x, y) => Object.assign(x, y), {}));

            this.contexts.push(observable);

            Xania.ready(this.import(view),
                dom => {
                    var tpl = this.parseDom(dom);
                    Bind.executeTemplate(observable, tpl, target, 0);
                });

            return this;
        }

        parseDom(rootDom: HTMLElement): Dom.TagTemplate {
            const stack = [];
            let i: number;
            var rootTpl;
            stack.push({
                node: rootDom,
                push(e) {
                    rootTpl = e;
                }
            });

            while (stack.length > 0) {
                const cur = stack.pop();
                const node: Node = cur.node;
                const push = cur.push;

                if (!!node["content"]) {
                    const elt = <HTMLElement>node["content"];
                    var template = new Dom.ContentTemplate();
                    for (i = elt.childNodes.length - 1; i >= 0; i--) {
                        stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
                    }
                    push(template);
                } else if (node.nodeType === 1) {
                    const elt = <HTMLElement>node;
                    const template = new Dom.TagTemplate(elt.tagName);

                    for (i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                        var attribute = elt.attributes[i];
                        this.parseAttr(template, attribute);
                    }

                    for (i = elt.childNodes.length - 1; i >= 0; i--) {
                        stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
                    }
                    push(template);
                } else if (node.nodeType === 3) {
                    var textContent = node.textContent;
                    if (textContent.trim().length > 0) {
                        const tpl = this.compile(textContent);
                        push(new Dom.TextTemplate(tpl || node.textContent));
                    }
                }
            }

            return rootTpl;
        }

        parseAttr(tagElement: Dom.TagTemplate, attr: Attr) {
            const name = attr.name;
            if (name === "click" || name.match(/keyup\./) || name === "mouseover" || name === "mouseout") {
                const fn = this.compile(attr.value);
                tagElement.addEvent(name, fn);
            } else if (name === "data-select" || name === "data-from") {
                const fn = this.compile(attr.value);
                tagElement.select(fn);
            } else {
                const tpl = this.compile(attr.value);
                tagElement.attr(name, tpl || attr.value);

                // conventions
                if (!!tagElement.name.match(/^input$/i) &&
                    !!attr.name.match(/^name$/i) &&
                    !tagElement.getAttribute("value")) {
                    const valueAccessor = this.compile(`{{ ${attr.value} }}`);
                    tagElement.attr("value", valueAccessor);
                }
            }
        }

    }

    interface IComponentProvider {
        get(node: Node): any;
    }

    class ComponentContainer implements IComponentProvider {
        private components = new Map<string, any>();

        get(node): any {
            var name = node.nodeName.replace(/\-/, "").toLowerCase();

            var comp;
            if (this.components.has(name)) {
                var decl = this.components.get(name);
                comp = !!decl.Args
                    ? Reflect.construct(decl.Type, decl.Args)
                    : new decl.Type;
            } else {
                comp = this.global(name);
            }

            if (!comp)
                return false;

            return comp;
        }

        private global(name: string) {
            // ReSharper disable once MissingHasOwnPropertyInForeach
            for (let k in window) {
                if (name === k.toLowerCase()) {
                    var v: any = window[k];
                    if (typeof v === "function")
                        // ReSharper disable once InconsistentNaming
                        return new v();
                }
            }

            return null;
        }

        component(...args: any[]) {
            if (args.length === 1 && typeof args[0] === "function") {
                const component = args[0];
                if (this.register(component, null)) {
                    return (component: Function) => {
                        this.unregister(component);
                        this.register(component, args);
                    };
                }
            }

            return (component: Function) => {
                this.register(component, args);
            };
        }

        unregister(componentType) {
            var key = componentType.name.toLowerCase();
            var decl = componentType.get(key);
            if (decl.Type === componentType)
                this.components.delete(key);
        }

        register(componentType, args) {
            var key = componentType.name.toLowerCase();
            if (this.components.has(key))
                return false;

            this.components.set(key, { Type: componentType, Args: args });
            return true;
        }
    }

    function domReady(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    domReady(() => {
        var app = new Binder([Fun.List]);
        var components = new ComponentContainer();

        // Find top level components and bind
        var stack: Node[] = [document.body];

        while (stack.length > 0) {
            var dom = stack.pop();

            var component = components.get(dom);
            if (component === false) {
                for (let i = 0; i < dom.childNodes.length; i++) {
                    var child = dom.childNodes[i];
                    if (child.nodeType === 1)
                        stack.push(child);
                }
            } else {
                var target = document.createElement("div");
                dom.parentNode.insertBefore(target, dom);
                app.bind(dom.nodeName + ".html", component, target);

                app.listen(target);

                for (let i = 0; i < dom.attributes.length; i++) {
                    var attr = dom.attributes.item(i);
                    dom[attr.name] = eval(attr.value);
                }

                if (!!component.init) {
                    component.init(app);
                }
            }
        }
    });
}