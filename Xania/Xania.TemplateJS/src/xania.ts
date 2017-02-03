import { Template } from "./template"
import { Dom } from "./dom"
import { fs, parseTpl } from "./fsharp"
import { Reactive } from "./reactive"

export class Xania {
    static templates(elements) {
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            var child = elements[i];

            if (child.accept)
                result.push(child);
            else {
                result.push(new Template.TextTemplate(child));
            }
        }
        return result;
    }
    static svgElements = ["svg", "circle", "line", "g"];

    static tag(element, attr, ...children): Template.INode {
        var childTemplates = this.templates(children);

        if (typeof element === "string") {
            var ns = Xania.svgElements.indexOf(element) >= 0 ? "http://www.w3.org/2000/svg" : null;
            var tag = new Template.TagTemplate(element, ns, childTemplates);
            for (var prop in attr) {
                if (prop === "className" || prop === "classname" || prop === "clazz")
                    tag.attr("class", attr[prop]);
                else
                    tag.attr(prop, attr[prop]);
            }

            return tag;
        } else if (typeof element === "function") {
            return element(attr, childTemplates);
        }
    }
    static view(tpl: Template.INode, dispatcher?) {
        return Dom.view(tpl, dispatcher);
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
            accept() {
                var binding = new PartialBinding(view, model);
                if (view.subscribe) view.subscribe(binding);
                if (model.subscribe) model.subscribe(binding);
                return binding;
            }
        }
    }
}

export class PartialBinding extends Reactive.Binding {
    private parent;
    private binding;
    private cache = [];
    constructor(private view, private model) {
        super();
    }

    map(parent) {
        this.parent = parent;
        if (this.binding)
            this.binding.map(this);
        return this;
    }

    render(context) {
        var view = this.evaluate(this.view).valueOf();

        if (this.binding) {
            this.binding.dispose();
        }

        this.binding = new Dom.FragmentBinding(this.model, [view])
            .map(this.parent);
        this.binding.update(context);
    }

    onNext(_) {
        this.execute();
    }
}

export { fs, parseTpl, Reactive }
