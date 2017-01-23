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
        }

        static eventNames = [ "click", "mouseover", "mouseout", "blur", "change" ];

        attr(name, ast): this {
            if (name === "class") {
                this.classBinding.setBaseClass(ast);
            } else if (name.startsWith("class.")) {
                this.classBinding.addClass(name.substr(6), ast);
            } else if (TagBinding.eventNames.indexOf(name) >= 0) {
                var eventBinding = new EventBinding(this, name, ast);
                this.attributeBindings.push(eventBinding);
            } else {
                var attrBinding = new AttributeBinding(this, name, ast);
                this.attributeBindings.push(attrBinding);
            }

            return this;
        }

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

    export class EventBinding extends Re.Binding {
        constructor(private parent: TagBinding, private name, private expr) {
            super();
        }

        render() {
            var tag = this.parent.dom;
            tag.addEventListener(this.name, () => {
                let value = this.evaluate(accept, this.expr);
            });
        }

        app(fun, args: any[]) {
            if (fun === "=") {
                var value = args[0].valueOf();
                args[1].set(value);
                return value;
            }

            return super.app(fun, args);
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
}

export function join(separator: string, value) {
    if (Array.isArray(value)) {
        return value.length > 0 ? value.sort().join(separator) : null;
    }
    return value;
}

    // ReSharper restore InconsistentNaming
