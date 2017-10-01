import { Template, IDriver } from "./template"
import { Dom } from "./dom"
import { Scope } from "./expression"
import compile, { parse } from "./compile"
import { Reactive } from "./reactive"

export default class Xania {
    static templates(elements) {
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            var child = elements[i];

            if (child === null || child === void 0)
                continue;
            else if (typeof child === "function") {
                result.push(new Template.CustomTemplate(child));
            }
            else if (child.bind)
                result.push(child);
            else if (typeof child === "number" || typeof child === "string" || typeof child.execute === "function") {
                result.push(new Template.TextTemplate<Reactive.Binding>(child, Dom.DomVisitor));
            } else if (Array.isArray(child)) {
                var childTemplates = this.templates(child);
                for (var j = 0; j < childTemplates.length; j++) {
                    result.push(childTemplates[j]);
                }
            } else if (typeof child.view === "function") {
                result.push(Component(child, []));
            } else {
                result.push(child);
            }
        }
        return result;
    }

    static attributes(attrs): any {
        var result = {};
        if (attrs) {
            for (var prop in attrs) {
                if (attrs.hasOwnProperty(prop)) {
                    var attrValue = attrs[prop];
                    if (prop === "className" || prop === "classname" || prop === "clazz")
                        Object.assign(result, { "class": attrValue });
                    else if (prop === "htmlFor")
                        Object.assign(result, { "for": attrValue });
                    else
                        result[prop] = attrValue;
                }
            }
            if (typeof attrs.name === "string") {
                if (attrs.type === "text") {
                    if (!attrs.value) {
                        Object.assign(result, { "value": compile(attrs.name) });
                    }
                }
            }
        }
        return result;
    }

    static svgElements = ["svg", "circle", "line", "g", "path", "marker"];

    static tag(element, attrs, ...children): Template.INode {
        var childNodes: Template.INode[] = this.templates(children);
        var attributes = this.attributes(attrs);

        if (element instanceof Template.TagTemplate) {
            return element;
        } else if (typeof element === "string") {
            let tag = Xania.htmlTag(element).attrs(attributes);
            var length = childNodes.length, i = 0;
            while (i < length) {
                tag.child(childNodes[i++]);
            }
            return tag;
        } else if (typeof element === "function") {
            if (element.prototype.bind) {
                return <Template.INode>Reflect.construct(element, [attributes, childNodes]);
            } else if (element.prototype.view) {
                return Component(Reflect.construct(element, [attributes, childNodes]), attributes);
            } else {
                var view = element(attributes, childNodes);
                if (!view)
                    throw new Error("Failed to load view");
                return <Template.INode>view;
            }
        } else {
            throw Error("tag unresolved");
        }
    }

    static htmlTag(tagName: string) {
        var ns = Xania.svgElements.indexOf(tagName) >= 0 ? "http://www.w3.org/2000/svg" : null;
        return new Template.TagTemplate<Reactive.Binding>(tagName, ns, Dom.DomVisitor);
    }

    static render(element, driver: IDriver) {
        return Xania.tag(element, {})
            .bind(driver)
            .update(new Reactive.Store({}));
    }
}

interface IBinding {
    execute(): IBinding[];
}

export function mount(root: IBinding) {
    var stack = [root];
    while (stack.length) {
        const binding = stack.pop();
        const children = binding.execute();
        if (children) {
            var i = children.length;
            while (i--) {
                stack.push(children[i]);
            }
        }
    }

}

export function Component(component, props: any) {
    return {
        component,
        bind(driver: IDriver) {
            return new ComponentBinding(this.component, props, driver);
        }
    }
};

class ComponentBinding extends Reactive.Binding {
    private componentStore = new Reactive.Store(this.component);

    constructor(private component, private props: any, driver) {
        super(driver);
        var view = component.view(Xania).bind(driver);
        this.childBindings = Array.isArray(view) ? [] : [view];
    }

    get(name: string) {
        let { props } = this;
        if (props.hasOwnProperty(name)) {
            var expr = props[name];
            return expr.execute ? expr.execute(this, this.context) : expr;
        } else {
            return this.componentStore.get(name);
        }
    }

    updateChildren() {
        super.updateChildren(this);
    }

    render(context) {
        let { props } = this;
        for (let prop in props) {
            if (props.hasOwnProperty(prop)) {
                var expr = props[prop];
                var sourceValue = expr.execute ? expr.execute(this, context) : expr;
                if (sourceValue) {
                    this.component[prop] = sourceValue.valueOf();
                }
            }
        }
        this.refresh();
    }

    insert(binding, dom, idx) {
        var offset = 0,
            length = this.childBindings.length;
        for (var i = 0; i < length; i++) {
            if (this.childBindings[i] === binding)
                break;
            offset += this.childBindings[i].length;
        }
        this.driver.insert(this, dom, offset + idx);
    }

    refresh() {
        var { context } = this;
        this.componentStore.refresh();
        if (context) {
            if (Array.isArray(context)) {
                var i = context.length;
                while (i--) {
                    var x = context[i];
                    if (x && x.refresh)
                        x.refresh();
                }
            } else
                context.refresh();
        }
    }
}

export { Reactive, Template, Dom }

export function List(attrs, children) {
    return new ListTemplate(attrs, children);
}

export function Repeat(attrs, children) {
    return new RepeatTemplate<Reactive.Binding>(attrs.param, attrs.source, children);
}

export function Collection(attrs, children) {
    return new RepeatTemplate<Reactive.Binding>(attrs.param, attrs.source, children);
}

export function With(attrs, children: Template.INode[]) {
    return {
        bind(driver: IDriver) {
            return new WithBinding(driver, attrs.object, children);
        }
    }
}

export class WithBinding extends Reactive.Binding {
    private conditionalBindings = [];
    private object;

    constructor(driver: IDriver, private expr, private childTemplates: Template.INode[]) {
        super(driver);
    }

    execute() {
        this.render(this.context, this.driver);
        // while most (if not all other) bindings return the list of childBindings to be mounted, 
        // this returns undefined to be able to self manage mounting of childBindings.
        // Not sure if this needs refactoring, renaming or convince myself this is the pure approach.
        return void 0;
    }

    render(context, driver) {
        var result = this.evaluateObject(this.expr, context);
        this.object = result;

        var value = result && !!result.valueOf();
        var childBindings: any[] = this.conditionalBindings,
            i = childBindings.length;

        if (value) {
            if (!i) {
                this.childTemplates.map(x => x.bind(driver).update(this)).forEach(x => {
                    mount(x);
                    childBindings.push(x);
                });
            } else {
                while (i--) {
                    mount(childBindings[i]);
                }
            }
        } else {
            while (i--) {
                childBindings[i].dispose();
            }
            childBindings.length = 0;
        }
    }

    get(name: string) {
        var target = this.object;
        return target.get ? target.get(name) : target[name];
    }

    refresh() {
        this.context.refresh();
    }

    dispose() {
        throw Error("not implemented");
    }
}

export function If(attrs, children: Template.INode[]) {
    return {
        bind(driver: IDriver) {
            return new WithBinding(driver, attrs.expr, children);
        }
    }
}

export function expr(code: string) {
    return compile(code);
}

export class RepeatTemplate<T> implements Template.INode {
    constructor(private param, private expr, private children: Template.INode[] = []) { }

    bind(driver: IDriver) {
        return new RepeatBinding(driver, this.param, this.expr, this.children);
    }

    child(node: Template.INode) {
        this.children.push(node);
    }
}

export class ListTemplate implements Template.INode {
    constructor(private attrs, private children: Template.INode[]) { }

    bind(driver: IDriver) {
        return new ListBinding(driver, this.attrs, this.children);
    }
}

class ListBinding extends Reactive.Binding {
    constructor(driver: IDriver, private attrs, private children) {
        super(driver);
    }

    get length() {
        var total = 0, length = this.childBindings.length;
        for (var i = 0; i < length; i++) {
            total += this.childBindings[i].length;
        }
        return total;
    }

    execute() {
        this.render(this.context, this.driver);
        return void 0;
    }

    dispose() {
        let { childBindings } = this, i = childBindings.length;
        while (i--) {
            childBindings[i].dispose();
        }
    }

    render(context, driver) {
        var stream;
        var sourceExpr = this.attrs.source;

        if (Array.isArray(sourceExpr)) {
            stream = sourceExpr;
        } else if (sourceExpr && sourceExpr.execute) {
            stream = sourceExpr.execute(this, context);
            if (stream.length === void 0)
                if (stream.value === null) {
                    stream = [];
                } else {
                    stream = [stream];
                }
        } else {
            stream = [context];
        }

        let { childBindings } = this,
            childLength = childBindings.length,
            streamLength = stream.length,
            i = 0;

        while (streamLength < childLength) {
            childBindings[--childLength].dispose();
            childBindings.length = childLength;
        }

        while (i < streamLength) {
            var item = stream.get ? stream.get(i) : stream[i];
            var childBinding: Reactive.Binding;
            if (i < childLength)
                childBinding = childBindings[i];
            else {
                childBinding = new FragmentBinding(this, void 0, this.children);
                childBindings.push(childBinding);
            }
            childBinding.update(new Scope([item, context]));
            mount(childBinding);
            i++;
        }
    }

    insert(fragment, dom, idx) {
        if (this.driver) {
            var offset = 0, { childBindings } = this;
            for (var i = 0; i < childBindings.length; i++) {
                if (childBindings[i] === fragment)
                    break;
                offset += childBindings[i].length;
            }
            this.driver.insert(this, dom, offset + idx);
        }
    }

    refresh() {
        this.context.refresh();
    }
}

class RepeatBinding extends Reactive.Binding {
    get length() {
        var total = 0, length = this.childBindings.length;
        for (var i = 0; i < length; i++) {
            total += this.childBindings[i].length;
        }
        return total;
    }

    constructor(driver: IDriver, public param, private expr, public children: Template.INode[]) {
        super(driver);
        for (var child of children) {
            if (!child.bind)
                throw Error("child is not a node");
        }
    }

    execute() {
        this.render(this.context, this.driver);
        // while most (if not all other) bindings return the list of childBindings to be mounted, 
        // this returns undefined to be able to self manage mounting of childBindings.
        // Not sure if this needs refactoring, renaming or convince myself this is the pure approach.
        return void 0;
    }

    dispose() {
        let { childBindings } = this, i = childBindings.length;
        while (i--) {
            childBindings[i].dispose();
        }
    }

    static swap(arr: any[], srcIndex, tarIndex) {
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

    render(context, driver) {
        var stream;
        if (!!this.expr && !!this.expr.execute) {
            stream = this.expr.execute(this, context);
            if (stream.length === void 0)
                if (stream.value === null) {
                    stream = [];
                } else {
                    stream = [stream];
                }
        } else {
            stream = [context];
        }

        var i = 0, { childBindings } = this;
        while (i < childBindings.length) {
            var frag = childBindings[i];
            if (stream.indexOf(frag.context) < 0) {
                frag.dispose();
                childBindings.splice(i, 1);
            } else {
                i++;
            }
        }

        var fr: Reactive.Binding, streamlength = stream.length;
        for (var i = 0; i < streamlength; i++) {
            var item = stream.get ? stream.get(i) : stream[i];

            var fragment: Reactive.Binding = null, fraglength = childBindings.length;
            for (let e = i; e < fraglength; e++) {
                fr = childBindings[e];
                if (fr.context === item) {
                    fragment = fr;
                    fragment.execute();
                    RepeatBinding.swap(childBindings, e, i);
                    break;
                }
            }

            if (fragment === null /* not found */) {
                fragment = new FragmentBinding(this, this.param, this.children);
                childBindings.push(fragment);
                RepeatBinding.swap(childBindings, fraglength, i);
                mount(fragment.update(item));
            }
        }
    }

    insert(fragment, dom, idx) {
        if (this.driver) {
            var offset = 0, { childBindings } = this;
            for (var i = 0; i < childBindings.length; i++) {
                if (childBindings[i] === fragment)
                    break;
                offset += childBindings[i].length;
            }
            this.driver.insert(this, dom, offset + idx);
        }
    }

    refresh() {
        this.context.refresh();
    }
}

class FragmentBinding extends Reactive.Binding {
    get length() {
        var { childBindings } = this, i = childBindings.length, length = 0;
        while (i--) {
            length += childBindings[i].length;
        }
        return length;
    }

    constructor(driver: IDriver, private param: string, public children: Template.INode[]) {
        super(driver);
        this.childBindings = children.map(x => x.bind(this));
    }

    get(name: string) {
        if (name === this.param)
            return this.context;
        return void 0;
    }

    updateChildren(context) {
        if (this.param !== void 0)
            super.updateChildren(this);
        else
            super.updateChildren(context);
    }

    render() {
    }

    insert(binding: Reactive.Binding, dom, idx) {
        var offset = 0, length = this.childBindings.length;
        for (var i = 0; i < length; i++) {
            if (this.childBindings[i] === binding)
                break;
            offset += this.childBindings[i].length;
        }
        this.driver.insert(this, dom, offset + idx);
    }

    refresh() {
        var driver: any = this.driver;
        driver.context.refresh();
    }
}

export class Fragment {
    public childBindings: any[] = [];
    public context;
    public driver;

    constructor(private owner: { param?, children; context; insert }) {
        for (var e = 0; e < this.owner.children.length; e++) {
            this.childBindings[e] = owner.children[e].bind(this);
        }
    }

    get(name: string) {
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
    }

    refresh() {
        this.owner.context.refresh();
    }

    dispose() {
        for (var j = 0; j < this.childBindings.length; j++) {
            var b = this.childBindings[j];
            b.dispose();
        }
    }

    get length() {
        var total = 0;
        for (var j = 0; j < this.childBindings.length; j++) {
            total += this.childBindings[j].length;
        }
        return total;
    }

    update(context) {
        this.context = context;
        var length = this.owner.children.length;
        for (var e = 0; e < length; e++) {
            this.childBindings[e].update(this);
        }
        return this;
    }

    execute() {
        return this.childBindings;
    }

    insert(binding, dom, index) {
        var offset = 0, length = this.childBindings.length;
        for (var i = 0; i < length; i++) {
            if (this.childBindings[i] === binding)
                break;
            offset += this.childBindings[i].length;
        }
        this.owner.insert(this, dom, offset + index);
    }

    on(eventName, dom, eventBinding) {
        this.driver.on(eventName, dom, eventBinding);
    }
}

declare function fetch<T>(url: string, config?): Promise<T>;

export class RemoteDataSource {
    private observers = [];
    private object = [];

    constructor(private url: string, private body) {
        this.reload();
    }

    reload() {
        var config = {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(parse(this.body)),
            credentials: 'same-origin'
        };
        return fetch(this.url, config)
            .then((response: any) => {
                return response.json();
            })
            .then(data => {
                this.object = data;
                for (var i = 0; i < this.observers.length; i++) {
                    this.observers[i].onNext(this.object);
                }
            });
    }

    subscribe(observer) {
        if (this.object !== null)
            observer.onNext(this.object);

        this.observers.push(observer);
    }

    valueOf() {
        return this.object;
    }

    save(record) {
        Resource.create(this.url, record).then((response: any) => {
            this.reload();
        });
    }
}

export abstract class ModelRepository {
    private dataSource;
    protected currentRow = null;

    constructor(url: string, expr: string) {
        this.dataSource = new RemoteDataSource(url, expr);
    }

    save() {
        this.dataSource.save(this.currentRow);
        this.cancel();
    }

    cancel() {
        this.currentRow = null;
    }

    abstract createNew();
}

export class Resource {
    static create(url, body) {
        var config = {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(body)
        };

        return fetch(url, config);
    }
}