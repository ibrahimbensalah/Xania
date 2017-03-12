import { Xania as xania, expr, Repeat } from "./xania";

export function TextEditor(attrs) {
    var id = Math.random();
    return xania.tag("div",
        Object.assign({ "class": "form-group" }, attrs),
        [
            <label htmlFor={id}>{attrs.display}</label>,
            <input className="form-control" id={id} type="text" placeholder={attrs.display} name={attrs.field} />
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

    private onChange = event => {
        var target = event.target;

        return this.attrs.onChange(target.value);
    };

    view() {
        var id = Math.floor(new Date().getTime() + Math.random() * 10000) % 10000000;
        return (
            <div className="form-group" style="select component">
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

export class DropDown {
    constructor(private attrs) { }

    private expanded: boolean = false;
    private selected: string = "Default Value";

    private onToggle = () => {
        this.expanded = !this.expanded;
    }

    private selectItem(event, item) {
        event.preventDefault();
        this.selected = item;
        this.expanded = false;
    }

    view() {
        return (
            <div>
                <label className="form-check-label">Company</label>
                <div className={["btn-group", expr("expanded -> ' show'")]}>
                    <button className="btn btn-secondary btn-sm dropdown-toggle"
                        onClick={this.onToggle}
                        type="button" aria-haspopup="true" aria-expanded={expr("expanded")}>{expr("selected")}</button>
                    <div className="dropdown-menu">
                        <a className="dropdown-item" href="" onClick={expr("selectItem event 'Xania'")}>Xania Software</a>
                        <a className="dropdown-item" href="" onClick={expr("selectItem event 'Rider International'")}>Rider Internation</a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item" href="" onClick={expr("selectItem event 'Darwin Recruitement'")}>Darwin Recruitement</a>
                    </div>
                </div>
            </div>
        );
    }
}

export default { TextEditor, BooleanEditor, DropDown, Select }