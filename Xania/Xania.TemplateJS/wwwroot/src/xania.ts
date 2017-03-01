import { Template } from "./template"
import { Dom } from "./dom"
import compile, { Scope } from "./compile"
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
    static svgElements = ["svg", "circle", "line", "g"];

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
        } else if (typeof element.render === "function") {
            var tpl = element.render();
            return View.partial(tpl, new Reactive.Store(element));
        } else {
            throw Error("tag unresolved");
        }
    }

    static render(element, driver) {
        return Xania.tag(element, {})
            .bind()
            .update(new Reactive.Store({}), driver);
    }
    static partial(view, model) {
        return {
            bind() {
                var binding = new PartialBinding(view, model);
                if (view.subscribe) view.subscribe(binding);
                if (model.subscribe) model.subscribe(binding);
                return binding;
            }
        }
    }
}

export function ForEach(attr, children) {
    var tpl = new Template.FragmentTemplate<Reactive.Binding>(attr.expr || null, Dom.DomVisitor);

    for (var i = 0; i < children.length; i++) {
        tpl.child(children[i]);
    }

    return tpl;
}

export module View {
    export function partial(view, model) {
        return {
            bind() {
                var binding = new PartialBinding(view, model);
                if (view.subscribe) view.subscribe(binding);
                if (model.subscribe) model.subscribe(binding);
                return binding;
            }
        }
    }
}

class ComponentBinding extends Reactive.Binding {
    private binding: Dom.FragmentBinding;
    private componentStore = new Reactive.Store(this.component);

    constructor(private component, private props) {
        super();
        this.binding = new Dom.FragmentBinding(null, [component.view(Xania)]);
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

class PartialBinding extends Reactive.Binding {
    private binding;
    private cache = [];
    constructor(private view, private model) {
        super();
    }

    render(context, parent) {
        var view = this.evaluateObject(this.view).valueOf();

        if (!view)
            throw new Error("view is empty");

        if (this.binding) {
            this.binding.dispose();
        }

        var newBinding = new Dom.FragmentBinding(this.model, [view]);

        this.binding = newBinding;
        this.binding.update(context, parent);
    }

    onNext(_) {
        this.execute();
    }
}

export { Reactive, Template, Dom }


class Query {
    constructor(private expr) { }

    map(tpl) {
        return new MapTemplate<Reactive.Binding>(this.expr, Dom.DomVisitor)
            .child(tpl);
    }

    bind() {
        return this.expr;
    }
}

export function query(expr: string) {
    return new Query(compile(expr));
}

export function text(expr: string) {
    return compile(expr);
}


export class MapTemplate<T> implements Template.INode {
    private children: Template.INode[] = [];

    constructor(private expr, private visitor: Template.IVisitor<T>) { }

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

            fragment.update(item);
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


export class Fragment {
    public childBindings: any[] = [];
    public context;

    constructor(private owner: MapBinding) {
        for (var e = 0; e < this.owner.children.length; e++) {
            this.childBindings[e] =
                owner.children[e].bind();
        }
    }

    get(name: string) {
        var value = this.context.get(name);
            if (value !== void 0)
                return value;

            return this.owner.context.get(name);
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
}

