import { Reactive } from "./reactive"
import { Template } from "./template"

export class Animate implements Template.INode {
    constructor(private attrs: { transform?, dispose?}, private children: Template.INode[]) {
    }

    bind(visitor) {
        const bindings = this.children.map(x => x.bind(visitor));
        return new AnimateBinding(this.attrs, bindings);
    }
}

export class AnimateBinding extends Reactive.Binding {

    domElements = [];

    constructor(private attrs: { transform?, dispose? }, childBindings: any[]) {
        super();
        this.childBindings = childBindings;
    }

    get length() {
        var length = 0;
        for (var i = 0; i < this.childBindings.length; i++) {
            length += this.childBindings[i].length;
        }
        return length;
    }

    update(context, driver) {
        super.update(context, driver);
        for (var i = 0; i < this.childBindings.length; i++) {
            this.childBindings[i].update(context, this);
        }
        return this;
    }

    insert(binding, dom, idx) {
        this.driver.insert(this, dom, idx);
        this.domElements.push(dom);

        this.transform(dom, this.defaults);
    }

    defaults = {
        transform: "translate3d(0, 0, 0) scale(0)",
        width: "0",
        height: "0"
    }

    transform(dom, defaults) {
        let values = this.values;
        if (Object.keys(values).length === 0)
            return;

        for (var k in values) {
            if (values.hasOwnProperty(k)) {
                var value = values[k];
                if (!value)
                    continue;

                var start = defaults[k] || this.defaults[k];

                var frames = (Array.isArray(value) ? value : [start, value]);

                var keyframes = frames.map(x => {
                    var frame = {};
                    frame[k] = x;
                    return frame;
                });

                if (this.players[k]) {
                    this.players[k].cancel();
                    delete this.players[k];
                }

                var timing = { duration: 200, iterations: 1, easing: 'ease-out' };
                var player = dom.animate(keyframes, timing);
                player.onfinish = ((k, value) => e => {
                    dom.style[k] = Array.isArray(value) ? value[value.length - 1] : value;
                })(k, value);
                this.players[k] = player;
            }
        }
    }

    private players = {};
    private values: { transform?; height? } = {};
    render(context) {
        this.values = {};
        let attrs = this.attrs;
        for (var k in attrs) {
            if (attrs.hasOwnProperty(k) && k !== "dispose") {
                var v = this.evaluateObject(attrs[k]);
                this.values[k] = v;
            }
        }

        for (var i = 0; i < this.domElements.length && i < 1; i++) {
            var dom = this.domElements[i];
            this.transform(dom, window.getComputedStyle(dom));
        }
    }

    dispose() {
        var bindings = this.childBindings;
        this.childBindings = [];
        var dispose = this.attrs.dispose;
        if (!dispose) {
            for (let e = 0; e < bindings.length; e++) {
                var b: any = bindings[e];
                b.dispose();
            }
        } else {
            var counter = this.domElements.length;
            var onfinish = () => {
                counter--;
                if (counter === 0) {
                    for (let e = 0; e < bindings.length; e++) {
                        var b: any = bindings[e];
                        b.dispose();
                    }
                }
            };

            for (let i = 0; i < this.domElements.length; i++) {
                var dom = this.domElements[i];

                var timing = { duration: 200, iterations: 1 };
                var animation = dom.animate(dispose, timing);
                animation.onfinish = onfinish;
            }
        }
    }
}
