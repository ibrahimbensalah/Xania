import xania, { mount, expr, With, Repeat, List, Template, Reactive } from "./xania";
import { IDriver } from "./template";

export function TextEditor(attrs: { display; field; placeholder?; }) {
    var id = Math.random();
    return (
        <div className="form-group" {...attrs}>
            <label for={id}>{attrs.display}</label>
            <input class="form-control" id={id} type="text" placeholder={attrs.placeholder || attrs.display} name={attrs.field} />
        </div>
    );
}

export function BooleanEditor(attrs) {
    var id = Math.random();
    return (
        <div className="form-check" {...attrs}>
            <label className="form-check-label" htmlFor={id}>
                <input className="form-check-input" id={id} type="checkbox" checked={expr(attrs.field)} /> {attrs.display}
            </label>
        </div>
    );
}

export class Select {
    constructor(private attrs) { }

    private value: string = null;
    private options = [];

    private onChange = event => {
        var target = event.target;
        return this.attrs.onChange(target.value);
    };

    view() {
        const id = Math.floor(new Date().getTime() + Math.random() * 10000) % 10000000;
        return (
            <div className="form-group" >
                <label htmlFor={id}>{this.attrs.display}</label>
                <select className="form-control" id={id} onChange={this.onChange}>
                    <option></option>
                    <Repeat source={expr("for option in options")}>
                        <option selected={expr("option.value = value -> 'selected'")} value={expr("option.value")}>{expr("option.text")}</option>
                    </Repeat>
                </select>
            </div>
        );
    }
}



export class DataSource {
    read() {
        return [{ display: "Xania", id: 1 }, { display: "Rider International", id: 2 }, { display: "Darwin Recruitment", id: 3 }];
    }

}

export class DropDown {
    private data;

    constructor(private attrs: { data }, private children) {
    }

    private expanded: boolean = false;
    private value: any = null;

    private onToggle = () => {
        this.expanded = !this.expanded;
    }

    private selectItem(data, value) {
        this.expanded = false;
        var i = data.length;
        while (i--) {
            if (data[i].id === value) {
                return value;
            }
        }
        return undefined;
    }

    view() {
        return (
            <div style="position: relative">
                <div className={[expr("expanded -> ' show'")]}>
                    <button className="btn btn-secondary btn-sm dropdown-toggle" onClick={this.onToggle}
                        type="button" aria-haspopup="true" aria-expanded={expr("expanded")}>
                        <With object={expr("data where id = value |> single")}>{this.children}</With>
                    </button>
                    <div className="dropdown-menu">
                        <List source={expr('data')}>
                            <a className="dropdown-item" href="" onClick={expr("value <- selectItem data id")}>
                                { this.children }
                            </a>
                        </List>
                    </div>
                </div>
            </div>
        );
    }
}

export function Partial(attrs, children): Template.INode {
    if (children && children.length)
        throw Error("View does not allow child elements");

    return {
        bind(driver: IDriver) {
            return new PartialBinding(driver, attrs);
        }
    }
}

class PartialBinding extends Reactive.Binding {
    constructor(driver: IDriver, private attrs) {
        super(driver);
    }

    execute() {
        this.render(this.context, this.driver);
        return void 0;
    }

    dispose() {
        let { childBindings } = this, i = childBindings.length;
        while (i--) {
            childBindings[i].dispose();
        }
        childBindings.length = 0;
    }

    render(context, driver) {
        this.dispose();

        var result = this.evaluateObject(this.attrs.template, context);
        var template = result && result.valueOf();
        if (template) {
            var binding = template.bind(this).update(context);
            this.childBindings.push(binding);
            mount(binding);
        }
    }

    insert(fragment, dom, idx) {
        if (this.driver) {
            var offset = 0, { childBindings } = this;
            for (var i = 0; i < childBindings.length; i++) {
                var b = childBindings[i];
                if (b === fragment)
                    break;
                offset += typeof b.length == 'number' ? b.length : 1;
            }
            this.driver.insert(this, dom, offset + idx);
        }
    }
}

export default { TextEditor, BooleanEditor, DropDown, Select, Partial }
