import { Reactive as Re } from "../src/reactive"

export function Observe(attrs, children) {
    return {
        bind(driver) {
            return new TagObserverBinding(driver, attrs, children);
        }
    }
}
class TagObserverBinding extends Re.Binding {
    constructor(driver, private attrs, children) {
        super(driver);
        this.childBindings = children.map(x => x.bind(this));
    }
    render(context, driver) {
        for (var name in this.attrs) {
            var expr = this.attrs[name].execute(context, this);
            var value = driver.attr(name);
            if (expr.update(value))
                context.refresh();
        }
        window.requestAnimationFrame(() => {
            this.execute();
        });
    }
}

