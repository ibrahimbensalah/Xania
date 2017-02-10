import { Template } from "./template"
import { Dom } from "./dom"
import { fs } from "./fsharp"
import { Reactive } from "./reactive"

export class Xania {
    static templates(elements) {
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            var child = elements[i];

            if (child.bind)
                result.push(child);
            else {
                result.push(new Template.TextTemplate(child));
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
                            tag.attr("value", fs(attrs.name));
                        }
                    }
                }
            }

            return tag;
        } else if (typeof element === "function") {
            if (element.prototype.bind) {
                return Reflect.construct(element, [attrs, childTemplates]);
            } else if (element.prototype.view) {
                return new ComponentBinding(Reflect.construct(element, [attrs, childTemplates]), attrs);
            } else {
                var view = element(attrs, childTemplates);
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
    private store = new Reactive.Store(this.component);

    constructor(private component, private props) {
        super();
        this.binding = new Dom.FragmentBinding(null, [component.view(Xania)]);
    }

    bind(): this {
        return this;
    }

    update(context, driver): this {
        let props = this.props;
        for (let prop in props) {
            if (props.hasOwnProperty(prop)) {
                var expr = props[prop];
                var value = expr.execute(this, context).valueOf();
                this.component[prop] = value;
            }
        }
        this.binding.update(this.store, driver);
        super.update(context, driver);
        return this;
    }

    render() {
    }

    dispose() {
        super.dispose();
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
        var view = this.evaluate(this.view).valueOf();

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

export class Animate {
    constructor(_, private children: Template.INode[]) {
    }

    bind(visitor) {
        var bindings = this.children.map(x => x.bind(visitor));
        return new AnimateBinding(bindings);
    }


    static flipInY(elem, iterations) {
        var animationTimingFunction = elem.style['animation-timing-function'];
        var keyframes = [
            { transform: 'perspective(400px) rotate3d(0, 1, 0, 90deg)', opacity: '0', offset: 0 },
            { transform: 'perspective(400px) rotate3d(0, 1, 0, -20deg)', offset: 0.4 },
            { transform: 'perspective(400px) rotate3d(0, 1, 0, 10deg)', opacity: '1', offset: 0.6 },
            { transform: 'perspective(400px) rotate3d(0, 1, 0, -5deg)', opacity: '1', offset: 0.8 },
            { transform: 'perspective(400px)', opacity: '1', offset: 1 }];
        var timing = { duration: 900, iterations: iterations, easing: 'ease-in' };
        return elem.animate(keyframes, timing);
    }

    static flipOutY(elem, iterations) {
        var keyframes = [
            { height: '20px', transform: 'perspective(400px)', opacity: '1', offset: 0 },
            { height: '10px', transform: 'perspective(400px) rotate3d(0, 1, 0, -20deg)', opacity: '1', offset: 0.3 },
            { height: '0', transform: 'perspective(400px) rotate3d(0, 1, 0, 90deg)', opacity: '0', offset: 1 }];
        var timing = { duration: 900, iterations: iterations };
        return elem.animate(keyframes, timing);
    }

    static bounce(elem, iterations) {
        var keyframes = [
            { height: '0', transform: 'translate3d(0,0,0)', offset: 0 },
            { height: '10px', transform: 'translate3d(0,0,0)', offset: 0.2 },
            { height: '20px', transform: 'translate3d(0,-30px,0)', offset: 0.4 },
            { height: '30px', transform: 'translate3d(0,-30px,0)', offset: 0.43 },
            { height: '40px', transform: 'translate3d(0,0,0)', offset: 0.53 },
            { height: '50px', transform: 'translate3d(0,-15px,0)', offset: 0.7 },
            { height: '60px', transform: 'translate3d(0,0,0)', offset: 0.8 },
            { height: '90px', transform: 'translate3d(0,-15px,0)', offset: 0.9 },
            { height: '100px', transform: 'translate3d(0,0,0)', offset: 1 }];
        var timing = { duration: 900, iterations: iterations, easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)' };
        return elem.animate(keyframes, timing);
    }

    static bounceIn(elem, iterations) {
        var keyframes = [
            { transform: 'scale3d(.3, .3, .3)', opacity: '0', offset: 0 },
            { transform: 'scale3d(1.1, 1.1, 1.1)', offset: 0.2 },
            { transform: 'scale3d(.9, .9, .9)', offset: 0.4 },
            { transform: 'scale3d(1.03, 1.03, 1.03)', opacity: '1', offset: 0.6 },
            { transform: 'scale3d(.97, .97, .97)', offset: 0.8 },
            { transform: 'scale3d(1, 1, 1)', opacity: '1', offset: 1 }];
        var timing = { duration: 900, iterations: iterations, easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)' };
        return elem.animate(keyframes, timing);
    }
}
class AnimateBinding extends Reactive.Binding {

    domElements = [];

    constructor(private bindings: any[]) {
        super();
    }

    get length() {
        var length = 0;
        for (var i = 0; i < this.bindings.length; i++) {
            length += this.bindings[i].length;
        }
        return length;
    }

    update(context, driver) {
        super.update(context, driver);
        for (var i = 0; i < this.bindings.length; i++) {
            this.bindings[i].update(context, this);
        }
        return this;
    }

    insert(binding, dom, idx) {
        this.driver.insert(this, dom, idx);
        Animate.bounce(dom, 1);
        this.domElements.push(dom);
    }

    render() {
    }

    dispose() {
        var bindings = this.bindings;
        this.bindings = [];
        var counter = this.domElements.length;
        for (let i = 0; i < this.domElements.length; i++) {
            var dom = this.domElements[i];
            var animation = Animate.flipOutY(dom, 1);
            animation.onfinish = () => {
                counter--;
                if (counter === 0) {
                    for (let e = 0; e < bindings.length; e++) {
                        bindings[e].dispose();
                    }
                }
            }
        }
    }
}

export { fs, Reactive, Template }
