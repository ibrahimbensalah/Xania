import xania, { mount, expr, Repeat, List, Template, Reactive } from "./xania";
import { IDriver } from "./template";

export function TextEditor(attrs: { display; field; placeholder?; }) {
    var id = Math.random();
    return xania.tag("div",
        Object.assign({ "class": "form-group" }, attrs),
        [
            <label for={id}>{attrs.display}</label>,
            <input class="form-control" id={id} type="text" placeholder={attrs.placeholder || attrs.display} name={attrs.field} />
        ]
    );
}

export function BooleanEditor(attrs) {
    var id = Math.random();
    return xania.tag("div",
        Object.assign({ "class": "form-check" }, attrs),
        [
            <label className="form-check-label" htmlFor={id}>
                <input className="form-check-input" id={id} type="checkbox" checked={expr(attrs.field)} /> {attrs.display}
            </label>
        ]
    );
}

export class Select {
    constructor(private attrs) { }

    private value: string = null;
    private options = [];

    view() {
        var id = Math.floor(new Date().getTime() + Math.random() * 10000) % 10000000;
        var onChange = event => {
            var target = event.target;

            return this.attrs.onChange(target.value);
        };
        return (
            <div className="form-group" >
                <label htmlFor={id}>{this.attrs.display}</label>
                <select className="form-control" id={id} onChange={onChange}>
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
        return [{ display: "Xania", value: 1 }, { display: "Rider International", value: 2 }, { display: "Darwin Recruitment", value: 3 }];
    }
}

export class DropDown {
    constructor(private attrs: { dataSource: DataSource }) { }

    private expanded: boolean = false;
    private value: string = "(none)";

    private onToggle = () => {
        this.expanded = !this.expanded;
    }

    private selectItem(event: Event, item) {
        event.preventDefault();
        this.value = item;
        this.expanded = false;
    }

    view() {
        return (
            <div style="position: relative">
                <div>{expr("value")}</div>
                <div className={[expr("expanded -> ' show'")]}>
                    <button className="btn btn-secondary btn-sm dropdown-toggle"
                        onClick={this.onToggle}
                        type="button" aria-haspopup="true" aria-expanded={expr("expanded")}>{expr("value")}</button>
                    <div className="dropdown-menu">
                        <List source={this.attrs.dataSource.read()}>
                            <a className="dropdown-item" href=""
                                onClick={expr("selectItem event value")}>
                                {expr("display")}
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
                if (childBindings[i] === fragment)
                    break;
                offset += childBindings[i].length;
            }
            this.driver.insert(this, dom, offset + idx);
        }
    }
}

export default { TextEditor, BooleanEditor, DropDown, Select, Partial }
