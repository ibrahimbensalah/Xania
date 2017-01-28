import { Template } from "./template"
import { Dom } from "./dom"
import { fsharp as fs } from "./fsharp"
import { Reactive } from "./reactive"

class Xania {
    static templates(elements) {
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            var child = elements[i];
            if (child.template)
                result.push(child.template);
            else
                result.push(new Template.TextTemplate(child));
        }
        return result;
    }
    static tag(element, attr, ...children): Dom.IView {
        var childTemplates = this.templates(children);

        if (typeof element === "string") {
            var tag = new Template.TagTemplate(element, null, childTemplates);
            for (var prop in attr) {
                if (prop === "className" || prop === "classname" || prop === "clazz")
                    tag.attr("class", attr[prop]);
                else
                    tag.attr(prop, attr[prop]);
            }

            return Dom.view(tag);
        } else if (typeof element === "function") {
            var component = new element(attr, childTemplates);

            return component;
        }
    }
}


class ForEach {
    constructor(private attr, private children) { }

    get template() {
        var tpl = new Template.FragmentTemplate(this.attr.expr || null);

        for (var i = 0; i < this.children.length; i++) {
            tpl.child(this.children[i]);
        }

        return tpl;
    }
}

var Store = Reactive.Store;

export { Xania, ForEach, fs, Store }
