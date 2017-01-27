import { Core } from './core'
import { Reactive as Re } from './reactive'
import { accept } from './fsharp'
import { Template } from './template'
import { fsharp as fs } from "./fsharp"

export module Dom {

    var document = window.document;

    interface IDomBinding {
        length;
        map(parent) : this;
        update(context);
    }

    interface IVisitor extends Template.IVisitor<IDomBinding> {
    }

    interface IView {
        bind(target: { insert(dom, idx) }, store);
    }

    class DomBinding {
        private childBindings: IDomBinding[] = [];

        constructor(private target) {
        }

        static insertDom(target, dom, idx) {
            console.log("insert dom", { target, dom, idx });
            if (idx < target.childNodes.length) {
                var current = target.childNodes[idx];
                if (current !== dom) {
                    target.insertBefore(dom, current);
                }
            } else {
                target.appendChild(dom);
            }
        }

        insert(binding: IDomBinding, dom, idx: number) {
            var offset = 0;
            for (var i = 0; i < this.childBindings.length; i++) {
                if (this.childBindings[i] === binding)
                    break;
                offset += this.childBindings[i].length;
            }
            DomBinding.insertDom(this.target, dom, offset + idx);
        }

        text(expr): TextBinding {
            var text = new TextBinding(expr);
            this.childBindings.push(text.map(this));
            return text;
        }
        content(ast, children: Template.INode[]): ContentBinding {
            var content = new ContentBinding(ast, children);
            this.childBindings.push(content.map(this));
            return content;
        }
        tag(name, ns, attrs, children): TagBinding {
            var tag = new TagBinding(name, ns, children);

            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }

            this.childBindings.push(tag.map(this));
            return tag;
        }
    }

    export function parse(node): IView {
        return {
            template: parseNode(node),
            bind(target, store) {
                return this.template.accept(new DomBinding(target)).update(store);
            }
        } as IView;
    }

    function parseText(text): any[] {
        var parts: any[] = [];

        var appendText = (x) => {
            var s = x.trim();
            if (s.length > 0)
                parts.push(x);
        };

        var offset = 0;
        while (offset < text.length) {
            var begin = text.indexOf("{{", offset);
            if (begin >= 0) {
                if (begin > offset)
                    appendText(text.substring(offset, begin));

                offset = begin + 2;
                const end = text.indexOf("}}", offset);
                if (end >= 0) {
                    parts.push(fs(text.substring(offset, end)));
                    offset = end + 2;
                } else {
                    throw new SyntaxError("Expected '}}' but not found starting from index: " + offset);
                }
            } else {
                appendText(text.substring(offset));
                break;
            }
        }

        if (parts.length === 1)
            return parts[0];

        return parts;
    }

    function parseAttr(tagElement: Template.TagTemplate, attr: Attr) {
        const name = attr.name;
        const tpl = parseText(attr.value);
        tagElement.attr(name, tpl || attr.value);

        // conventions
        if (!!tagElement.name.match(/^input$/i) && !!attr.name.match(/^name$/i) && tagElement.getAttribute("value") != undefined) {
            const valueAccessor = parseText(attr.value);
            tagElement.attr("value", valueAccessor);
        }
    }

    function parseNode(node: Node): Template.INode {
        if (node.nodeType === 1 && node.nodeName === "TEMPLATE") {
            const content = <HTMLElement>node["content"];
            var template = new Template.ContentTemplate(null);
            for (var i = 0; i < content.childNodes.length; i++) {
                var tpl = parseNode(content.childNodes[i]);
                if (tpl)
                    template.child(tpl);
            }
            return template;
        } else if (node.nodeType === 1) {
            const elt = <HTMLElement>node;

            const template = new Template.TagTemplate(elt.tagName, elt.namespaceURI);
            var content = null;

            for (var i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                var attribute = elt.attributes[i];
                if (attribute.name === "data-repeat") {
                    content = new Template.ContentTemplate(parseText(attribute.value)).child(template);
                } else {
                    parseAttr(template, attribute);
                }
            }

            for (var e = 0; e < elt.childNodes.length; e++) {
                var child = parseNode(elt.childNodes[e]);
                if (child)
                    template.addChild(child);
            }

            return content || template;
        } else if (node.nodeType === 3) {
            var textContent = node.textContent;
            if (textContent.trim().length > 0) {
                const tpl = parseText(textContent);
                return new Template.TextTemplate(tpl || node.textContent);
            }
        }

        return undefined;
    }

    export class ContentBinding extends Re.Binding implements IDomBinding {
        public fragments: ContentFragment[] = [];
        public parent: IBindingTarget;

        get length() {
            var total = 0;
            for (var i = 0; i < this.fragments.length; i++) {
                total += this.fragments[i].length;
            }
            return total;
        }

        constructor(private ast, public children: Template.INode[]) {
            super();
        }

        map(parent: IBindingTarget): this {
            this.parent = parent;

            return this;
        }

        private static swap(arr: ContentFragment[], srcIndex, tarIndex) {
            if (srcIndex > tarIndex) {
                this.swap(arr, tarIndex, srcIndex);
            }
            else if (srcIndex < tarIndex) {
                var src = arr[srcIndex];
                arr[srcIndex] = arr[tarIndex];
                arr[tarIndex] = src;
            }
        }

        render() {
            var stream = this.ast === null ? [this.context] : accept(this.ast, this, this.context);
            var fr: ContentFragment;
            for (var i = 0; i < stream.length; i++) {
                var context = stream[i];

                var fragment: ContentFragment = null;
                for (let e = i; e < this.fragments.length; e++) {
                    fr = this.fragments[e];
                    if (fr.context === context) {
                        fragment = fr;
                        ContentBinding.swap(this.fragments, e, i);
                        break;
                    }
                }

                if (fragment === null /* not found */) {
                    fragment = new ContentFragment(this);
                    this.fragments.push(fragment);
                    ContentBinding.swap(this.fragments, this.fragments.length - 1, i);
                }

                fragment.update(context);
            }

            for (var j = stream.length; j < this.fragments.length; j++) {
                fr = this.fragments[j];
            }

            return stream;
        }

        insert(fragment: ContentFragment, dom, idx) {
            if (this.parent) {
                var offset = 0;
                for (var i = 0; i < this.fragments.length; i++) {
                    if (this.fragments[i] === fragment)
                        break;
                    offset += this.fragments[i].length;
                }
                this.parent.insert(this, dom, offset + idx);
            }
        }
    }

    class ContentFragment {
        public bindings: IDomBinding[] = [];
        public context;

        constructor(private owner: ContentBinding) {
            for (var e = 0; e < this.owner.children.length; e++) {
                this.bindings[e] =
                    owner.children[e].accept(this as IVisitor, e).map(this);
            }
        }

        get length() {
            var total = 0;
            for (var j = 0; j < this.bindings.length; j++) {
                total += this.bindings[j].length;
            }
            return total;
        }

        update(context) {
            this.context = context;
            for (var e = 0; e < this.owner.children.length; e++) {
                this.bindings[e].update(context);
            }
            return this;
        }

        insert(binding: IDomBinding, dom, index) {
            var offset = 0;
            for (var i = 0; i < this.bindings.length; i++) {
                if (this.bindings[i] === binding)
                    break;
                offset += this.bindings[i].length;
            }
            this.owner.insert(this, dom, offset + index);
        }

        public text(ast, childIndex: number): TextBinding {
            return new TextBinding(ast);
        }

        public content(ast, children, childIndex: number): ContentBinding {
            return new ContentBinding(ast, children);
        }

        public tag(tagName: string, ns: string, attrs, children, childIndex: number): TagBinding {
            var tag = new TagBinding(tagName, ns, children);

            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }

            return tag;
        }
    }

    interface IBindingTarget {
        insert(sender: IDomBinding, dom, idx);
    }

    export class TextBinding extends Re.Binding implements IDomBinding {
        public textNode;
        protected target: IBindingTarget;
        public length = 1;

        constructor(private expr) {
            super();
        }

        map(target: IBindingTarget): this {
            this.target = target;

            return this;
        }

        render() {
            const result = this.evaluate(accept, this.expr);

            var str = result && result.valueOf();
            if (this.textNode === undefined) {
                this.textNode = (<any>document).createTextNode(str);
            } else {
                this.textNode.textContent = str;
            }
            if (this.target)
                this.target.insert(this, this.textNode, 0);
        }
    }

    export class TagBinding extends Re.Binding implements IDomBinding {
        public tagNode;
        private attributeBindings = [];
        private events = {};
        private classBinding = new ClassBinding(this);
        protected target: IBindingTarget;
        public length = 1;

        constructor(tagName: string, private ns: string = null, private childBindings: IDomBinding[]) {
            super();
            if (ns === null)
                this.tagNode = document.createElement(tagName);
            else {
                this.tagNode = (<any>document).createElementNS(ns, tagName.toLowerCase());
            }

            for (var i = 0; i < childBindings.length; i++) {
                childBindings[i].map(this);
            }
        }

        map(target: IBindingTarget): this {
            this.target = target;

            return this;
        }

        static eventNames = ["click", "mouseover", "mouseout", "blur", "change"];

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

        insert(binding, dom, idx) {
            var offset = 0;
            for (var i = 0; i < this.childBindings.length; i++) {
                if (this.childBindings[i] === binding)
                    break;
                offset += this.childBindings[i].length;
            }
            DomBinding.insertDom(this.tagNode, dom, offset + idx);
        }

        on(name, ast): this {
            this.events[name] = ast;

            return this;
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
            if (this.target)
                this.target.insert(this, this.tagNode, 0);
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

            var tag = this.parent.tagNode;
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
            var tag = this.parent.tagNode;
            tag.addEventListener(this.name, () => {
                let value = this.evaluate(accept, this.expr);
            });
        }

        app(fun, args: any[]) {
            if (fun === "assign") {
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
            var tag = this.parent.tagNode;
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
