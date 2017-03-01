import { Xania, Template } from "../../src/xania"
import { Reactive as Re } from "../../src/reactive";
import { Dom } from "../../src/dom";

export function view(xania): Template.INode {
    return (<div>index</div>) as Template.INode;
}

export function bind(context, parent) {
    var vw: Template.INode = view(Xania);
    return vw.bind().update(context, parent);
}
