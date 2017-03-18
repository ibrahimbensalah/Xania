import { Template } from "./template"
import { Dom } from "./dom"
import compile, { Scope, parse } from "./compile"
import { Reactive } from "./reactive"

export default class Xania {
    static templates(elements) {
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            var child = elements[i];

            if (child === null || child === void 0)
                continue;
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
                result.push(Component(child, {}));
            } else {
                result.push(child);
            }
        }
        return result;
    }
    static svgElements = ["svg", "circle", "line", "g", "path", "marker"];

    static tag(element, attrs, ...children): Template.INode {
        var childTemplates = this.templates(children);

        if (element instanceof Template.TagTemplate) {
            return element;
        } else if (typeof element === "string") {
            var ns = Xania.svgElements.indexOf(element) >= 0 ? "http://www.w3.org/2000/svg" : null;
            var tag = new Template.TagTemplate<Reactive.Binding>(element, ns, childTemplates, Dom.DomVisitor);
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
                            tag.attr("value", compile(attrs.name));
                        }
                    }
                }
            }

            return tag;
        } else if (typeof element === "function") {
            if (element.prototype.bind) {
                return Reflect.construct(element, [attrs || {}, childTemplates]);
            } else if (element.prototype.view) {
                return Component(Reflect.construct(element, [attrs || {}, childTemplates]), attrs);
            } else {
                var view = element(attrs || {}, childTemplates);
                if (!view)
                    throw new Error("Failed to load view");
                return view;
            }
        } else {
            throw Error("tag unresolved");
        }
    }

    static render(element, driver) {
        return Xania.tag(element, {})
            .bind()
            .update(new Reactive.Store({}), driver);
    }
}


export function mount(root: Reactive.Binding) {
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

function Component(component, props) {
    return {
        component,
        bind() {
            return new ComponentBinding(this.component, props);
        }
    }
};

class ComponentBinding extends Reactive.Binding {
    private componentStore = new Reactive.Store(this.component);

    constructor(private component, private props) {
        super();
        this.childBindings = [component.view(Xania).bind()];
    }

    updateChildren(context) {
        super.updateChildren(this.componentStore);
    }

    render(context) {
        let props = this.props;
        for (let prop in props) {
            if (props.hasOwnProperty(prop)) {
                var expr = props[prop];
                var sourceValue = expr.execute ? expr.execute(this, context) : expr;
                if (sourceValue) {
                    this.component[prop] = sourceValue.valueOf();
                }
            }
        }
        this.componentStore.refresh();
        // this.binding.execute();
    }

    dispose() {
        var { childBindings } = this;
        if (childBindings) {
            var i = childBindings.length || 0;
            while (i--) {
                var child: any = childBindings[i];
                child.dispose();
            }
        }
        // this.binding.dispose();
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
}

export { Reactive, Template, Dom }

export function Repeat(attrs, children) {
    return new RepeatTemplate<Reactive.Binding>(attrs.param, attrs.source, children, Dom.DomVisitor);
}

export function ForEach(attrs, children) {
    return new ForEachTemplate<Reactive.Binding>(attrs.param, attrs.source, children, Dom.DomVisitor);
}

export function With(attrs, children: Template.INode[]) {
    return {
        bind() {
            return new WithBinding(attrs.object, children);
        }
    }
}

export class WithBinding extends Reactive.Binding {
    private conditionalBindings = [];
    private object;

    constructor(private expr, private childTemplates: Template.INode[]) {
        super();
    }

    render(context, driver) {
        var result = this.evaluateObject(this.expr, context);
        this.object = result;

        var value = result && !!result.valueOf();
        var childBindings: any[] = this.conditionalBindings,
            i = childBindings.length;

        if (value) {
            if (!i) {
                this.childTemplates.map(x => x.bind().update2(this, driver)).forEach(x => {
                    // mount(x);
                    childBindings.push(x);
                });
            } else {
                while (i--) {
                    childBindings[i].update(this, driver);
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
        return this.object.get(name);
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
        bind() {
            return new IfBinding(attrs.expr, children);
        }
    }
}

export class IfBinding extends Reactive.Binding {
    private conditionalBindings = [];
    constructor(private expr, private children: Template.INode[]) {
        super();
    }

    render(context, driver) {
        var result = this.evaluateObject(this.expr, context);
        var value = result && !!result.valueOf();
        var childBindings: any[] = this.conditionalBindings,
            i = childBindings.length;

        if (value) {
            if (!i) {
                this.children.forEach(x => childBindings.push(x.bind().update(context, driver)));
            } else {
                while (i--) {
                    childBindings[i].update(context, driver);
                }
            }
        } else {
            while (i--) {
                childBindings[i].dispose();
            }
            childBindings.length = 0;
        }
    }

    dispose() {
        throw Error("not implemented");
    }
}

export function expr(code: string) {
    return compile(code);
}

export class RepeatTemplate<T> implements Template.INode {
    constructor(private param, private expr, private children: Template.INode[], private visitor: Template.IVisitor<T>) { }

    bind() {
        return new RepeatBinding(this.param, this.expr, this.children);
    }
}

export class ForEachTemplate<T> implements Template.INode {
    constructor(private param, private expr, private children: Template.INode[], private visitor: Template.IVisitor<T>) { }

    bind() {
        return new ForEachBinding(this.param, this.expr, this.children);
    }
}

class ForEachBinding extends Reactive.Binding {
    public fragments: Fragment[] = [];

    get length() {
        var total = 0, length = this.fragments.length;
        for (var i = 0; i < length; i++) {
            total += this.fragments[i].length;
        }
        return total;
    }

    constructor(public param, private expr, public children: Template.INode[]) {
        super();
        for (var child of children) {
            if (!child.bind)
                throw Error("child is not a node");
        }
    }

    dispose() {
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

    render(context, driver) {
        var stream = this.expr.execute(this, context).iterator();

        var i = stream.length,
            fragments = this.fragments,
            fragmentLength = fragments.length;

        while (i--) {
            var item = stream.get ? stream.get(i) : stream[i], fragment;

            if (i < fragmentLength) {
                fragment = fragments[i];
            } else {
                fragment = new Fragment(this);
                fragments.push(fragment);
            }
            fragment.update(item, driver);
        }

        while (fragments.length > stream.length) {
            fragments.pop().dispose();
        }
    }

    insert(fragment: Fragment, dom, idx) {
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

    constructor(public param, private expr, public children: Template.INode[]) {
        super();
        for (var child of children) {
            if (!child.bind)
                throw Error("child is not a node");
        }
    }

    execute() {
        this.render(this.context, this.driver);
        // return undefined to self handle mounting of child elements
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
                    RepeatBinding.swap(childBindings, e, i);
                    break;
                }
            }

            if (fragment === null /* not found */) {
                fragment = new FragmentBinding(this.param, this.children);
                childBindings.push(fragment);
                RepeatBinding.swap(childBindings, fraglength, i);
            }

            mount(fragment.update2(item, this));
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
}

class FragmentBinding extends Reactive.Binding {
    get length() {
        var { childBindings } = this, i = childBindings.length, length = 0;
        while (i--) {
            length += childBindings[i].length;
        }
        return length;
    }

    constructor(private param: string, public children: Template.INode[]) {
        super();
        this.childBindings = children.map(x => x.bind());
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
        this.driver.insert(this, dom, idx);
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
            this.childBindings[e] =
                owner.children[e].bind();
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

    update2(context, driver) {
        this.context = context;
        this.driver = driver;
        var length = this.owner.children.length;
        for (var e = 0; e < length; e++) {
            this.childBindings[e].update2(this, this);
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
            body: JSON.stringify(parse(this.body))
        };
        return fetch(this.url + "query", config)
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