import { Core } from './core'
import { Reactive as Re } from './reactive'
import { Template } from './template'
import { fs, Scope } from "./fsharp"
import Fsharp = require("./fsharp");

export module Dom {

    var document = window.document;

    interface IDomBinding {
        length;
        update(context, parent);
        dispose();
    }

    interface IDomVisitor extends Template.IVisitor<IDomBinding> {
    }

    export interface IView {
        bind(target: Node, store);
    }

    interface IAction {
        execute();
    }

    interface IDispatcher {
        dispatch(action: Re.IAction);
    }

    export class DomBinding {
        private childBindings: Re.Binding[] = [];

        constructor(private target, private dispatcher: IDispatcher) {
        }

        static insertDom(target, dom, idx) {
            if (idx < target.childNodes.length) {
                var current = target.childNodes[idx];
                if (current !== dom) {
                    target.insertBefore(dom, current);
                }
            } else {
                target.appendChild(dom);
            }
        }

        insert(binding: Re.Binding, dom, idx: number) {
            var offset = 0, length = this.childBindings.length;
            for (var i = 0; i < length; i++) {
                var child = this.childBindings[i];
                if (child === binding)
                    break;
                offset += child.length;
            }
            DomBinding.insertDom(this.target, dom, offset + idx);
        }

        text(expr): TextBinding {
            var text = new TextBinding(expr, this.dispatcher);
            this.childBindings.push(text);
            return text;
        }
        content(ast, children: Template.INode[]): FragmentBinding {
            var content = new FragmentBinding(ast, children, this.dispatcher);
            this.childBindings.push(content);
            return content;
        }
        tag(name, ns, attrs, children): TagBinding {
            var tag = new TagBinding(name, ns, children, this.dispatcher), length = attrs.length;
            for (var i = 0; i < length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }

            this.childBindings.push(tag);
            return tag;
        }
    }

    export function parse(node, dispatcher?: IDispatcher): IView {
        return {
            template: parseNode(node),
            bind(target, store) {
                return this.template.accept(new DomBinding(target, dispatcher)).update(store);
            }
        } as IView;
    }

    export function view(template: Template.INode, dispatcher?: IDispatcher) {
        return {
            bind(target, store) {
                var parent = new DomBinding(target, dispatcher);
                return template.bind<Re.Binding>(parent).update(store, parent);
            }
        } as IView;
    }

    function parseAttr(tagElement: Template.TagTemplate, attr: Attr) {
        const name = attr.name;
        const tpl = parseTpl(attr.value);
        tagElement.attr(name, tpl || attr.value);

        // conventions
        if (!!tagElement.name.match(/^input$/i) && !!attr.name.match(/^name$/i) && tagElement.getAttribute("value") != undefined) {
            const valueAccessor = parseTpl(attr.value);
            tagElement.attr("value", valueAccessor);
        }
    }

    function parseNode(node: Node): Template.INode {
        var i: number;
        if (node.nodeType === 1 && node.nodeName === "TEMPLATE") {
            const content = <HTMLElement>node["content"];
            var template = new Template.FragmentTemplate(null);
            for (i = 0; i < content.childNodes.length; i++) {
                var tpl = parseNode(content.childNodes[i]);
                if (tpl)
                    template.child(tpl);
            }
            return template;
        } else if (node.nodeType === 1) {
            const elt = <HTMLElement>node;

            const template = new Template.TagTemplate(elt.tagName, elt.namespaceURI);
            var fragmentTemplate = null;

            for (i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                var attribute = elt.attributes[i];
                if (attribute.name === "data-repeat") {
                    fragmentTemplate = new Template.FragmentTemplate(parseTpl(attribute.value)).child(template);
                } else {
                    parseAttr(template, attribute);
                }
            }

            for (var e = 0; e < elt.childNodes.length; e++) {
                var child = parseNode(elt.childNodes[e]);
                if (child)
                    template.addChild(child);
            }

            return fragmentTemplate || template;
        } else if (node.nodeType === 3) {
            var textContent = node.textContent;
            if (textContent.trim().length > 0) {
                const tpl = parseTpl(textContent);
                return new Template.TextTemplate(tpl || node.textContent);
            }
        }

        return undefined;
    }

    export class FragmentBinding extends Re.Binding implements IDomBinding {
        public fragments: Fragment[] = [];

        get length() {
            var total = 0, length = this.fragments.length;
            for (var i = 0; i < length; i++) {
                total += this.fragments[i].length;
            }
            return total;
        }

        constructor(private ast, public children: Template.INode[], dispatcher?: IDispatcher) {
            super(dispatcher);
        }

        dispose() {
            super.dispose();
            for (var i = 0; i < this.fragments.length; i++) {
                this.fragments[i].dispose();
            }
        }

        private static swap(arr: Fragment[], srcIndex, tarIndex) {
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
        }

        render(context, driver: IDOMDriver) {
            var stream;
            if (!!this.ast && !!this.ast.execute) {
                stream = this.ast.execute(this, context);
                if (stream.length === void 0)
                    stream = [stream];
            } else {
                stream = [context];
            }

            var fr: Fragment, streamlength = stream.length;
            for (var i = 0; i < streamlength; i++) {
                var item = stream[i];

                var fragment: Fragment = null, fraglength = this.fragments.length;
                for (let e = i; e < fraglength; e++) {
                    fr = this.fragments[e];
                    if (fr.context === item) {
                        fragment = fr;
                        FragmentBinding.swap(this.fragments, e, i);
                        break;
                    }
                }

                if (fragment === null /* not found */) {
                    fragment = new Fragment(this);
                    this.fragments.push(fragment);
                    FragmentBinding.swap(this.fragments, fraglength, i);
                }

                fragment.update(item);
            }

            while (this.fragments.length > stream.length) {
                var frag = this.fragments.pop();
                frag.dispose();
            }

            return stream;
        }

        insert(fragment: Fragment, dom, idx) {
            if (this.driver) {
                var offset = 0;
                for (var i = 0; i < this.fragments.length; i++) {
                    if (this.fragments[i] === fragment)
                        break;
                    offset += this.fragments[i].length;
                }
                this.driver.insert(this, dom, offset + idx);
            }
        }
    }

    class Fragment {
        public bindings: IDomBinding[] = [];
        public context;

        constructor(private owner: FragmentBinding) {
            for (var e = 0; e < this.owner.children.length; e++) {
                this.bindings[e] =
                    owner.children[e].bind(this as IDomVisitor);
            }
        }

        dispose() {
            Re.Binding.prototype.dispose.call(this);
            for (var i = 0; i < this.bindings.length; i++) {
                this.bindings[i].dispose();
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
            var length = this.owner.children.length;
            for (var e = 0; e < length; e++) {
                this.bindings[e].update(context, this);
            }
            return this;
        }

        insert(binding: IDomBinding, dom, index) {
            var offset = 0, length = this.bindings.length;
            for (var i = 0; i < length; i++) {
                if (this.bindings[i] === binding)
                    break;
                offset += this.bindings[i].length;
            }
            this.owner.insert(this, dom, offset + index);
        }

        public text(ast): TextBinding {
            return new TextBinding(ast, this.owner.dispatcher);
        }

        public content(ast, children): FragmentBinding {
            return new FragmentBinding(ast, children, this.owner.dispatcher);
        }

        public tag(tagName: string, ns: string, attrs, children): TagBinding {
            var tag = new TagBinding(tagName, ns, children, this.owner.dispatcher), length = attrs.length;
            for (var i = 0; i < length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }

            return tag;
        }
    }

    interface IDOMDriver {
        insert(sender: IDomBinding, dom, idx);
    }

    export class TextBinding extends Re.Binding implements IDomBinding {
        public textNode;
        public length = 1;

        constructor(private expr, dispatcher?: IDispatcher) {
            super(dispatcher);
            this.textNode = (<any>document).createTextNode("");
        }

        dispose() {
            super.dispose();
            this.textNode.remove();
        }

        render(context, driver: IDOMDriver) {
            const result = this.evaluate(this.expr);
            // if (result !== void 0)
            this.textNode.nodeValue = result && result.valueOf();
            this.driver.insert(this, this.textNode, 0);
        }
    }

    export class TagBinding extends Re.Binding implements IDomBinding {
        public tagNode;
        private attributeBindings = [];
        private events = {};
        private classBinding: ClassBinding;
        public length = 1;

        constructor(private tagName: string, private ns: string = null, private childBindings?: IDomBinding[], dispatcher?: IDispatcher) {
            super(dispatcher);
            if (ns === null)
                this.tagNode = document.createElement(tagName);
            else {
                this.tagNode = (<any>document).createElementNS(ns, tagName.toLowerCase());
            }

            this.classBinding = new ClassBinding(this.tagNode, this.dispatcher);
        }

        dispose() {
            this.tagNode.remove();
        }

        child(child: IDomBinding): this {
            if (!this.childBindings)
                this.childBindings = [];

            this.childBindings.push(child);
            return this;
        }

        attr(name, ast): this {
            if (typeof ast === "string") {
                this.tagNode.setAttribute(name, ast);
            } else if (name === "class") {
                this.classBinding.setBaseClass(ast);
            } else if (name === "value" && this.tagName === "input") {
                const valueBinding = new ValueBinding(this.tagNode, ast, this.dispatcher);
                this.attributeBindings.push(valueBinding);
            } else if (name === "checked" && this.tagName === "input") {
                const checkedBinding = new CheckedBinding(this.tagNode, ast, this.dispatcher);
                this.attributeBindings.push(checkedBinding);
            } else {
                var match = /^on(.+)/.exec(name);
                if (match) {
                    this.attributeBindings.push(new EventBinding(this.tagNode, match[1], ast));
                } else {
                    var attrBinding = new AttributeBinding(this.tagNode, name, ast, this.dispatcher);
                    this.attributeBindings.push(attrBinding);
                }
            }

            return this;
        }

        insert(binding, dom, idx) {
            var offset = 0, length = this.childBindings.length;
            for (var i = 0; i < length; i++) {
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

        update(context, parent): this {
            super.update(context, parent);

            this.classBinding.update(context, this);
            var attrLength = this.attributeBindings.length;
            for (var e = 0; e < attrLength; e++) {
                this.attributeBindings[e].update(context);
            }

            if (this.childBindings) {
                var childLength = this.childBindings.length;
                for (var i = 0; i < childLength; i++) {
                    this.childBindings[i].update(context, this);
                }
            }

            return this;
        }

        render(context, driver) {
            driver.insert(this, this.tagNode, 0);
        }

        trigger(name) {
            var handler = this.events[name];
            if (!!handler) {
                var result = handler.execute(this, this.context);

                if (typeof result === "function")
                    result();
            }
        }
    }

    export class ClassBinding extends Re.Binding {
        public dom;
        private conditions;
        private oldValue;
        private baseClassTpl;

        constructor(private tagNode: HTMLElement, dispatcher: IDispatcher) {
            super(dispatcher);
        }

        setBaseClass(tpl) {
            this.baseClassTpl = tpl;
        }

        addClass(className, condition) {
            if (!this.conditions)
                this.conditions = [];

            this.conditions.push({ className, condition });
        }

        render(context, driver: IDOMDriver) {
            this.context = context;
            var tag = this.tagNode;

            if (this.baseClassTpl) {
                var newValue = this.evaluate(this.baseClassTpl);

                if (newValue === void 0 || newValue === null) {
                    tag.className = Core.empty;
                } else {
                    tag.className = newValue.valueOf();
                }
            }

            if (this.conditions) {
                var conditionLength = this.conditions.length;
                for (var i = 0; i < conditionLength; i++) {
                    var { className, condition } = this.conditions[i];
                    var b = condition.execute(this, context).valueOf();
                    if (b) {
                        tag.classList.add(className);
                    } else {
                        tag.classList.remove(className);
                    }
                }
            }
        }

        public setAttribute(attrName: string, newValue) {
            var oldValue = this.oldValue;

            var tag: any = this.tagNode;
            if (newValue === void 0 || newValue === null) {
                tag[attrName] = void 0;
                tag.removeAttribute(attrName);
            } else {
                if (oldValue === void 0) {
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

    export class EventBinding {
        private context;

        constructor(tagNode: any, private name, private expr) {
            tagNode.addEventListener(this.name, this.fire.bind(this));
        }

        evaluate() {
            if (typeof this.expr === "function")
                return this.expr(event, this.context);
            return this.expr.execute(this,
                [
                    event,
                    event.target,
                    this.context
                ]);
        }

        fire(event) {

            var newValue = this.evaluate();
            if (newValue !== void 0) {
                var tag = event.target;
                if (newValue === null) {
                    tag.removeAttribute("value");
                } else {
                    tag.value = newValue;
                }
            }

            this.context.refresh();
        }

        update(context) {
            this.context = context;
        }

        extend() {
            throw Error("Not implemented yet.");
        }
        where(source, predicate) {
            throw Error("Not implemented yet.");
        }
        select(source, selector) {
            throw Error("Not implemented yet.");
        }
        query(param, source) {
            throw Error("Not implemented yet.");
        }
        await(observable) {
            throw Error("Not implemented yet.");
        }
        const(value) {
            return value;
        }

        app(fun, args: any[]) {
            if (fun === "assign") {
                var arg = args[0];
                if (arg === null)
                    args[1].set(null);
                else {
                    arg = arg.valueOf();
                    args[1].set(arg.valueOf());
                }
                return arg;
            }

            if (args)
                return fun.apply(null, args.map(EventBinding.valueOf));
            else
                return fun();
        }

        private static valueOf(x) {
            return x.valueOf();
        }

        member(target: { get(name: string); refresh?(); }, name) {
            return target.get ? target.get(name) : target[name];
        }
    }

    class CheckedBinding extends Re.Binding {
        private oldValue;

        constructor(private tagNode: any, private expr, dispatcher: IDispatcher) {
            super(dispatcher);

            tagNode.addEventListener("change", this.fire.bind(this));
        }

        fire() {
            let value = this.evaluate(this.expr);
            if (value && value.set) {
                value.set(this.tagNode.checked);

                this.context.refresh();
            }
        }

        render() {
            let value = this.evaluate(this.expr);

            var newValue = value && value.valueOf();
            var oldValue = this.oldValue;

            var tag = this.tagNode;
            if (newValue !== void 0 && newValue !== false) {
                if (oldValue === void 0) {
                    var attr = document.createAttribute("checked");
                    attr.value = "checked";
                    tag.setAttributeNode(attr);
                } else {
                    tag["checked"] = "checked";
                    tag.setAttribute("checked", "checked");
                }
            } else {
                tag["checked"] = void 0;
                tag.removeAttribute("checked");
            }
            this.oldValue = newValue;
        }
    }

    class ValueBinding extends Re.Binding {
        private oldValue;

        constructor(private tagNode: any, private expr, dispatcher: IDispatcher) {
            super(dispatcher);

            tagNode.addEventListener("change", this.fire.bind(this));
        }

        fire() {
            let value = this.evaluate(this.expr);
            if (value && value.set) {
                value.set(this.tagNode.value);
            }
        }

        render() {
            let value = this.evaluate(this.expr);
            var newValue = value && value.valueOf();

            var tag = this.tagNode;
            if (newValue === void 0) {
                tag.removeAttribute("value");
            } else {
                var attr = document.createAttribute("value");
                attr.value = newValue;
                tag.setAttributeNode(attr);
            }
        }
    }

    export class AttributeBinding extends Re.Binding {
        constructor(private tagNode: any, private name, private expr, dispatcher: IDispatcher) {
            super(dispatcher);
        }

        render(context, parent) {
            let value = this.evaluate(this.expr);

            if (value === void 0) {
                return;
            }

            if (value !== null && !!value.valueOf)
                value = value.valueOf();

            var newValue;
            if (this.name === "checked") {
                newValue = !!value ? "checked" : null;
            } else {
                newValue = value;
            }

            var attrName = this.name;
            var tag = this.tagNode;
            if (newValue === void 0 || newValue === null) {
                tag[attrName] = void 0;
                tag.removeAttribute(attrName);
            } else {
                var attr = document.createAttribute(attrName);
                attr.value = newValue;
                tag.setAttributeNode(attr);
                if (attrName === "value")
                    tag[attrName] = newValue;
            }
        }
    }

    export function parseTpl(text) {
        var parts: any[] = [];

        var appendText = (x) => {
            var s = x.trim();
            if (s.length > 0) {
                parts.push(x);
            }
        };

        var offset = 0, textlength = text.length;
        while (offset < textlength) {
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

        if (parts.length === 0)
            return null;

        if (parts.length === 1) {
            return parts[0];
        }

        return parts;
    }
}

export function join(separator: string, value) {
    if (Array.isArray(value)) {
        return value.length > 0 ? value.sort().join(separator) : null;
    }
    return value;
}

// ReSharper restore InconsistentNaming

export default Dom;