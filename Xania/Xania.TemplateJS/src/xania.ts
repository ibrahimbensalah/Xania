import { Template } from "./template"
import { Dom } from "./dom"
import { fs } from "./fsharp"
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
    static tag(element, attr, ...children): Template.INode {
        var childTemplates = this.templates(children);

        if (typeof element === "string") {
            var tag = new Template.TagTemplate(element, null, childTemplates);
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
                return new PartialBinding(view, model);
            }
        }
    }
}

export class PartialBinding extends Reactive.Binding {
    private parent;
    private binding;

    constructor(private view, private model) {
        super();
    }

    get template() {
        return this;
    }

    accept(visitor, options: any) {
        return this;
    }

    map(parent) {
        this.parent = parent;
        if (this.binding)
            this.binding.map(this);
        return this;
    }

    insert(_, dom, idx) {
        this.parent.insert(this, dom, idx);
    }

    render(context) {
        var view = this.evaluate(this.view).valueOf();

        if (this.binding)
            this.binding.dispose();

        this.binding = new Dom.FragmentBinding(this.model, [view])
            .map(this);
        this.binding.update(context);
    }
}

export { fs, Reactive }
