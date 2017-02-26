import { Template } from "./template"
import { Dom } from "./dom"
import query from "./query"
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
                result.push(new Template.TextTemplate(child));
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
            var tag = new Template.TagTemplate(element, ns, childTemplates);
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
                            tag.attr("value", query(attrs.name));
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
    /**
     * TODO obsolete
     * @param tpl
     */
    static view(tpl: Template.INode) {
        return Dom.view(tpl);
    }

    static render(element, driver) {
        return Xania.tag(element, {})
            .bind<Reactive.Binding>(Dom.DomVisitor)
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
    var tpl = new Template.FragmentTemplate(attr.expr || null);

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


export { query, Reactive, Template, Dom }

