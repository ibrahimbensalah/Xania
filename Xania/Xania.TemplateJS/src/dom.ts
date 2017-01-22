import { Core } from './core'
import { Reactive as Re } from './reactive'
import { accept } from './fsharp'
import { Template } from './template'

export module Dom {

    var document = window.document;

    interface IVisitor extends Template.IVisitor<Re.Binding> {
    }

    export class ContentBinding extends Re.Binding implements IVisitor {
        private fragments: ContentFragment[] = [];

        constructor(private ast, public parentInsert: (n: Node, idx: number) => void, public children: Template.INode[]) {
            super();
        }

        render() {
            var stream = this.ast === null ? [ this.context ] : accept(this.ast, this, this.context);

            var offset = 0;
            for (var i = 0; i < stream.length; i++) {
                var context = stream[i];

                var fragment = null;
                for (var e = i; e < this.fragments.length; e++) {
                    var f = this.fragments[e];
                    if (f.context === context) {
                        fragment = f;
                        if (e !== i) {
                            /* found fragment at e by should be located at i */
                            this.fragments.splice(e, 1);
                        }
                    }
                }

                if (fragment === null /* not found */) {
                    fragment = new ContentFragment(this, context, offset);
                }

                if (i < this.fragments.length) {
                    this.fragments.splice(i, 0, fragment);
                } else {
                    this.fragments.push(fragment);
                }

                offset += this.children.length;
            }

            return stream;
        }

        public text(ast, options: { fragment: ContentFragment, child: number }): TextBinding {
            var binding = new TextBinding(ast);
            options.fragment.insert(binding.dom, options.child);
            return binding;
        }

        public content(ast, children, options: { fragment: ContentFragment, child: number }): ContentBinding {
            var binding = new ContentBinding(ast, dom => options.fragment.insert(dom, options.child), children);
            return binding;
        }

        public tag(tagName: string, ns: string, attrs, events, options: any) : TagBinding {
            var tag = new TagBinding(tagName, ns);

            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }

            options.fragment.insert(tag.dom, options.child);

            return tag;
        }
    }

    class ContentFragment {
        public bindings: Re.Binding[] = [];

        constructor(private owner: ContentBinding, public context, private offset: number) {
            for (var e = 0; e < owner.children.length; e++) {
                this.bindings[e] =
                    owner.children[e].accept(owner as IVisitor, { fragment: this, child: e }).update(context);
            }
        }

        insert(dom, index) {
            this.owner.parentInsert(dom, this.offset + index);
        }
    }

    export class TextBinding extends Re.Binding {
        public dom;

        constructor(private expr) {
            super();
            this.dom = (<any>document).createTextNode("");
        }

        render() {
            const result = this.evaluate(accept, this.expr);

            if (result === undefined) {
                // this.dom.detach();
            } else {
                this.dom.textContent = result && result.valueOf();
            }
        }
    }

    export class TagBinding extends Re.Binding implements IVisitor {
        public dom;
        private attributeBindings = [];
        private childBindings: Re.Binding[] = [];
        private events = {};
        private appendChild = dom => this.dom.appendChild(dom);
        private classBinding = new ClassBinding(this);

        constructor(tagName: string, private ns: string = null) {
            super();
            if (ns === null)
                this.dom = document.createElement(tagName);
            else {
                this.dom = (<any>document).createElementNS(ns, tagName.toLowerCase());
            }

            this.dom.attributes["__binding"] = this;
        }

        attr(name, ast): this {
            if (name === "class") {
                this.classBinding.setBaseClass(ast);
            } else if (name.startsWith("class.")) {
                this.classBinding.addClass(name.substr(6), ast);
            } else {
                var attrBinding = new AttributeBinding(this, name, ast);
                this.attributeBindings.push(attrBinding);
            }

            return this;
        }

        //child(child: Re.Binding): this {
        //    if (!!this.context)
        //        child.update(this.context);

        //    this.childBindings.push(child);
        //    this.appendChild(child.dom);
        //    return this;
        //}

        on(name, ast) : this {
            this.events[name] = ast;

            return this;
        }

        public text(ast): TextBinding {
            var binding = new TextBinding(ast);
            this.childBindings.push(binding);

            if (!!this.context)
                binding.update(this.context);

            this.appendChild(binding.dom);
            return binding;
        }

        public content(ast, children: Template.INode[]): ContentBinding {
            var binding = new ContentBinding(ast, this.appendChild, children);

            if (!!this.context)
                binding.update(this.context);

            this.childBindings.push(binding);
            return binding;
        }

        public tag(tagName: string, ns: string, attrs, events, options: any): TagBinding {
            var tag = new TagBinding(tagName, ns);
            this.childBindings.push(tag);

            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }

            this.appendChild(tag.dom);
            return tag;
        }

        update(context): this {
            super.update(context);

            this.classBinding.update(context);
            for (var e = 0; e < this.attributeBindings.length; e++) {
                this.attributeBindings[e].update(context);
            }

            for (var i = 0; i < this.childBindings.length; i++) {
                this.childBindings[i].update(context);
            }

            return this;
        }

        render(context) {
            return this.dom;
        }

        trigger(name) {
            var handler = this.events[name];
            if (!!handler) {
                var result = accept(handler, this, this.context);

                if (typeof result === "function")
                    result();
            }
        }
    }

    export class ClassBinding extends Re.Binding {
        public dom;
        private conditions = [];
        private oldValue;
        private baseClassTpl;

        constructor(private parent: TagBinding) {
            super();
        }

        setBaseClass(tpl) {
            this.baseClassTpl = tpl;
        }

        addClass(className, condition) {
            this.conditions.push({ className, condition });
        }

        render(context) {
            this.context = context;
            const classes = [];
            if (!!this.baseClassTpl) {
                var value = accept(this.baseClassTpl, this, context).valueOf();
                classes.push(value);
            }

            for (var i = 0; i < this.conditions.length; i++) {
                var { className, condition } = this.conditions[i];
                if (!!accept(condition, this, context).valueOf()) {
                    classes.push(className);
                }
            }

            this.setAttribute("class", classes.length > 0 ? join(" ", classes) : null);
        }

        public setAttribute(attrName: string, newValue) {
            var oldValue = this.oldValue;

            var tag = this.parent.dom;
            if (typeof newValue === "undefined" || newValue === null) {
                tag[attrName] = void 0;
                tag.removeAttribute(attrName);
            } else {
                if (typeof oldValue === "undefined") {
                    var attr = document.createAttribute(attrName);
                    attr.value = newValue;
                    tag.setAttributeNode(attr);
                } else {
                    tag.className = newValue;
                }
            }
            this.oldValue = newValue;
        }

    }

    export class AttributeBinding extends Re.Binding {
        public dom;
        private oldValue;

        constructor(private parent: TagBinding, private name, private expr) {
            super();
        }

        render() {
            let value = this.evaluate(accept, this.expr);

            if (value !== null && value !== void 0 && !!value.valueOf)
                value = value.valueOf();

            var newValue;
            if (this.name === "checked") {
                newValue = !!value ? "checked" : null;
            } else {
                newValue = value;
            }

            var oldValue = this.oldValue;

            var attrName = this.name;
            var tag = this.parent.dom;
            if (typeof newValue === "undefined" || newValue === null) {
                tag[attrName] = void 0;
                tag.removeAttribute(attrName);
            } else {
                if (typeof oldValue === "undefined") {
                    var attr = document.createAttribute(attrName);
                    attr.value = newValue;
                    tag.setAttributeNode(attr);
                } else {
                    // tag[attrName] = newValue;
                    tag.setAttribute(attrName, newValue);
                }
            }
            this.oldValue = newValue;
        }
    }

    //class ReactiveBinding extends DomBinding {
    //    private bindings = [];
    //    private stream;
    //    private length;

    //    constructor(private tpl: Template.INode, private target, private offset) {
    //        super();
    //    }

    //    render(context) {
    //        var { bindings, target, tpl } = this;
    //        if (!!tpl.modelAccessor) {
    //            var stream = tpl.modelAccessor.execute(context, this);
    //            this.length = 0;

    //            stream.forEach((ctx, idx) => {
    //                this.length = idx + 1;
    //                for (var i = 0; i < bindings.length; i++) {
    //                    var binding = bindings[i];
    //                    if (binding.context.value === ctx.value) {
    //                        if (i !== idx) {
    //                            bindings[i] = bindings[idx];
    //                            bindings[idx] = binding;
    //                        }
    //                        return;
    //                    }
    //                }
    //                this.execute(ctx, idx);
    //            });
    //        } else {
    //            this.execute(context, 0);
    //            this.length = 1;
    //        }

    //        while (bindings.length > this.length) {
    //            const oldBinding = bindings.pop();
    //            target.removeChild(oldBinding.dom);
    //        }

    //        return this;
    //    }

    //    execute(result, idx) {
    //        this.addBinding(this.tpl.bind(result), idx);
    //    }

    //    addBinding(newBinding, idx) {
    //        var { offset, target, bindings } = this;
    //        var insertAt = offset + idx;

    //        if (insertAt < target.childNodes.length) {
    //            var beforeElement = target.childNodes[insertAt];
    //            target.insertBefore(newBinding.dom, beforeElement);
    //        } else {
    //            target.appendChild(newBinding.dom);
    //        }

    //        bindings.splice(idx, 0, newBinding);
    //    }
    //}

    //export function executeTemplate(observable, tpl: Template.INode, target, offset) {
    //    return new ReactiveBinding(tpl, target, offset).update(observable);
    //}

    //class Binder {
    //    private compile: Function;
    //    private compiler: Ast.Compiler;
    //    public contexts: Data4.IValue[] = [];

    //    constructor(private libs: any[]) {
    //        this.compiler = new Ast.Compiler();
    //        this.compile = this.compiler.template.bind(this.compiler);
    //    }

    //    static listen(target, store: Data5.Store) {
    //        var eventHandler = (target, name) => {
    //            var binding = target.attributes["__binding"];
    //            if (!!binding) {
    //                binding.trigger(name);
    //                store.update();
    //            }
    //        };

    //        target.addEventListener("click", evt => eventHandler(evt.target, evt.type));

    //        const onchange = evt => {
    //            var binding = evt.target.attributes["__binding"];
    //            if (binding != null) {
    //                const nameAttr = evt.target.attributes["name"];
    //                if (!!nameAttr) {
    //                    var arr = nameAttr.value.split('.');
    //                    var context = binding.context;
    //                    for (var i = 0; i < arr.length; i++) {
    //                        var p = arr[i];
    //                        context = context.get(p);
    //                    }
    //                    context.set(evt.target.value);

    //                    store.update();
    //                }
    //            }
    //        };
    //        target.addEventListener("keyup",
    //            evt => {
    //                if (evt.keyCode === 13) {
    //                    eventHandler(evt.target, "keyup.enter");
    //                } else {
    //                    onchange(evt);
    //                }
    //            });
    //        target.addEventListener("mouseover",
    //            evt => {
    //                eventHandler(evt.target, "mouseover");
    //            }
    //        );
    //        target.addEventListener("mouseout",
    //            evt => {
    //                eventHandler(evt.target, "mouseout");
    //            }
    //        );
    //    }

    //    public update2() {
    //        for (let i = 0; i < this.contexts.length; i++) {
    //            var ctx = this.contexts[i];
    //            ctx.update(null);
    //        }
    //    }

    //    parseDom(rootDom: Node): Template.INode {
    //        const stack = [];
    //        let i: number;
    //        var rootTpl;
    //        stack.push({
    //            node: rootDom,
    //            push(e) {
    //                rootTpl = e;
    //            }
    //        });

    //        while (stack.length > 0) {
    //            const cur = stack.pop();
    //            const node: Node = cur.node;
    //            const push = cur.push;

    //            if (!!node["content"]) {
    //                const elt = <HTMLElement>node["content"];
    //                var template = new Template.ContentTemplate();
    //                for (i = elt.childNodes.length - 1; i >= 0; i--) {
    //                    stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
    //                }
    //                push(template);
    //            } else if (node.nodeType === 1) {
    //                const elt = <HTMLElement>node;
    //                const template = new Template.TagTemplate(elt.tagName, elt.namespaceURI);

    //                for (i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
    //                    var attribute = elt.attributes[i];
    //                    this.parseAttr(template, attribute);
    //                }

    //                for (i = elt.childNodes.length - 1; i >= 0; i--) {
    //                    stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
    //                }
    //                push(template);
    //            } else if (node.nodeType === 3) {
    //                var textContent = node.textContent;
    //                if (textContent.trim().length > 0) {
    //                    const tpl = this.compile(textContent);
    //                    push(new Template.TextTemplate(tpl || node.textContent));
    //                }
    //            }
    //        }

    //        return rootTpl;
    //    }

    //    parseAttr(tagElement: Template.TagTemplate, attr: Attr) {
    //        const name = attr.name;
    //        if (name === "click" || name.match(/keyup\./) || name === "mouseover" || name === "mouseout") {
    //            const fn = this.compile(attr.value);
    //            tagElement.addEvent(name, fn);
    //        } else if (name === "data-select" || name === "data-from") {
    //            const fn = this.compile(attr.value);
    //            tagElement.select(fn);
    //        } else {
    //            const tpl = this.compile(attr.value);
    //            tagElement.attr(name, tpl || attr.value);

    //            // conventions
    //            if (!!tagElement.name.match(/^input$/i) &&
    //                !!attr.name.match(/^name$/i) &&
    //                !tagElement.getAttribute("value")) {
    //                const valueAccessor = this.compile(`{{ ${attr.value} }}`);
    //                tagElement.attr("value", valueAccessor);
    //            }
    //        }
    //    }

    //}

    //export function importView(view: string, ...args): any {
    //    if (!("import" in document.createElement("link"))) {
    //        throw new Error("HTML import is not supported in this browser");
    //    }

    //    var deferred = defer();
    //    var link = document.createElement('link');
    //    link.rel = 'import';
    //    link.href = view;
    //    link.setAttribute('async', ""); // make it async!
    //    link.onload = e => {
    //        var link = (<any>e.target);
    //        deferred.notify(link.import.querySelector("template"));
    //        link.onload = null;
    //    }
    //    document.head.appendChild(link);

    //    return deferred;
    //}

    //function defer() {
    //    return {
    //        value: void 0,
    //        resolvers: [],
    //        notify(value) {
    //            if (value === void 0)
    //                throw new Error("undefined result");

    //            this.value = value;

    //            for (var i = 0; i < this.resolvers.length; i++) {
    //                this.resolvers[i].call(null, value);
    //            }
    //        },
    //        then(resolve) {
    //            if (this.value === void 0) {
    //                this.resolvers.push(resolve);
    //            } else {
    //                resolve.call(null, this.value);
    //            }
    //        }
    //    };
    //}

    //export function bind(dom: Node, store) {

    //    var binder = new Binder([Core.List, Core.Math, Core.Dates]);

    //    let fragment = document.createDocumentFragment();
    //    Dom.executeTemplate(store, binder.parseDom(dom), fragment, 0);
    //    for (var i = 0; i < fragment.childNodes.length; i++) {
    //        var child = fragment.childNodes[i];
    //        Binder.listen(child, store);
    //    }

    //    return fragment;
    //}
}

export function join(separator: string, value) {
    if (Array.isArray(value)) {
        return value.length > 0 ? value.sort().join(separator) : null;
    }
    return value;
}

    // ReSharper restore InconsistentNaming
