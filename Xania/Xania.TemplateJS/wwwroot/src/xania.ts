import { Template } from "./template"
import { Dom } from "./dom"
import compile, { Scope, parse } from "./compile"
import { Reactive } from "./reactive"

export class Xania {
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
                result.push({
                    component: child,
                    bind() {
                        return new ComponentBinding(this.component, {});
                    }
                });
            } else {
                throw Error("");
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
                return new ComponentBinding(Reflect.construct(element, [attrs || {}, childTemplates]), attrs);
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

class ComponentBinding extends Reactive.Binding {
    private binding: FragmentBinding;
    private componentStore = new Reactive.Store(this.component);

    constructor(private component, private props) {
        super();
        this.binding = new FragmentBinding([component.view(Xania)]);
    }

    bind(): this {
        return this;
    }

    update(context, driver): this {
        this.binding.update(this.componentStore, driver);
        super.update(context, driver);
        return this;
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
    }

    dispose() {
        this.binding.dispose();
    }

}

//class PartialBinding extends Reactive.Binding {
//    private binding;
//    private cache = [];
//    constructor(private view, private model) {
//        super();
//    }

//    render(context, parent) {
//        var view = this.evaluateObject(this.view).valueOf();

//        if (!view)
//            throw new Error("view is empty");

//        if (this.binding) {
//            this.binding.dispose();
//        }

//        var newBinding = new Dom.FragmentBinding(this.model, [view]);

//        this.binding = newBinding;
//        this.binding.update(context, parent);
//    }

//    onNext(_) {
//        this.execute();
//    }
//}

export { Reactive, Template, Dom }


export class Repeat {
    private template: MapTemplate<Reactive.Binding>;

    constructor(attrs, children) {
        this.template =
            new MapTemplate<Reactive.Binding>(attrs.source, children, Dom.DomVisitor);
    }

    bind() {
        return this.template.bind();
    }
}

export function expr(code: string) {
    return compile(code);
}

export class MapTemplate<T> implements Template.INode {
    constructor(private expr, private children: Template.INode[], private visitor: Template.IVisitor<T>) { }

    child(child: Template.INode) {
        this.children.push(child);
        return this;
    }

    bind() {
        return new MapBinding(this.expr, this.children);
    }
}

class MapBinding extends Reactive.Binding {
    public fragments: Fragment[] = [];
    private stream;

    get length() {
        var total = 0, length = this.fragments.length;
        for (var i = 0; i < length; i++) {
            total += this.fragments[i].length;
        }
        return total;
    }

    constructor(private expr, public children: Template.INode[]) {
        super();
        for (var child of children) {
            if (!child.bind)
                throw Error("child is not a node");
        }
    }

    notify() {
        var stream, context = this.context;
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
        this.stream = stream;

        var i = 0;
        while (i < this.fragments.length) {
            var frag = this.fragments[i];
            if (stream.indexOf(frag.context) < 0) {
                frag.dispose();
                this.fragments.splice(i, 1);
            } else {
                i++;
            }
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
        this.notify();
        var stream = this.stream;

        var fr: Fragment, streamlength = stream.length;
        for (var i = 0; i < streamlength; i++) {
            var item = stream.get ? stream.get(i) : stream[i];

            var fragment: Fragment = null, fraglength = this.fragments.length;
            for (let e = i; e < fraglength; e++) {
                fr = this.fragments[e];
                if (fr.context === item) {
                    fragment = fr;
                    MapBinding.swap(this.fragments, e, i);
                    break;
                }
            }

            if (fragment === null /* not found */) {
                fragment = new Fragment(this);
                this.fragments.push(fragment);
                MapBinding.swap(this.fragments, fraglength, i);
            }

            fragment.update(item, driver);
        }

        while (this.fragments.length > stream.length) {
            var frag = this.fragments.pop();
            frag.dispose();
        }
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

class FragmentBinding extends Reactive.Binding {
    public fragment: Fragment;
    private stream;

    get length() {
        return this.fragment.length;
    }

    constructor(public children: Template.INode[]) {
        super();
        for (var child of children) {
            if (!child.bind)
                throw Error("child is not a node");
        }
        this.fragment = new Fragment(this);
    }

    dispose() {
        this.fragment.dispose();
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
        this.fragment.update(context, driver);
    }

    insert(fragment: Fragment, dom, idx) {
        if (this.driver) {
            this.driver.insert(this, dom, idx);
        }
    }
}

export class Fragment {
    public childBindings: any[] = [];
    public context;
    public driver;

    constructor(private owner: { children; context; insert }) {
        for (var e = 0; e < this.owner.children.length; e++) {
            this.childBindings[e] =
                owner.children[e].bind();
        }
    }

    get(name: string) {
        var context = this.context;
        var value = context.get ? context.get(name) : context[name];
        if (value !== void 0)
            return value;

        return this.owner.context.get(name);
    }

    refresh() {
        this.context.refresh();
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

    update(context, driver) {
        this.context = context;
        this.driver = driver;
        var length = this.owner.children.length;
        for (var e = 0; e < length; e++) {
            this.childBindings[e].update(this, this);
        }
        return this;
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

export class RemoteObject {
    promise: Promise<Object>;

    constructor(private url: string, private expr) {
        var config = {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(parse(expr))
        };

        this.promise = fetch(url, config).then((response: any) => {
            return response.json();
        });
    }

    subscribe(observer) {
        this.promise.then((data: any) => {
            observer.onNext(data);
        });
    }
}

