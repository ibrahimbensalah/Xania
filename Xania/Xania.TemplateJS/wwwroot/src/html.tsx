import { Xania as xania, expr } from "./xania";

export function TextEditor(attrs) {
    var id = Math.random();
    return xania.tag("div",
        Object.assign({ className: "form-group" }, attrs),
        [
            <label for={id}>{attrs.display}</label>,
            <input className="form-control" id={id} type="text" placeholder={attrs.display} name={attrs.field} />
        ]
    );
}

export function BooleanEditor(attrs) {
    var id = Math.random();
    return xania.tag("div",
        Object.assign({ className: "form-check" }, attrs),
        [
            <label className="form-check-label" htmlFor={id}>
                <input className="form-check-input" id={id} type="checkbox" checked={expr(attrs.field)} /> {attrs.display}
            </label>
        ]
    );
}

export default { TextEditor, BooleanEditor }