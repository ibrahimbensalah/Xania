import { Dom } from "./dom"
import { Core } from './core'
import { Template } from "./template"
import { fsharp as fs } from "./fsharp"

declare function require(module: string);

module Loader {
    declare var document: any;

    function domReady(fn, ...args: any[]) {
        if (document.readyState !== "loading") {
            fn.apply(null, args);
        } else {
            document.addEventListener("DOMContentLoaded", () => fn.apply(null, args));
        }
    }

    export function init(root) {

        //    var container = new Data.ObjectContainer();
        //    // Find top level components and bind
        var stack: Node[] = [root];

        while (stack.length > 0) {
            var dom = stack.pop();

            if (!!dom["content"] && !!dom.attributes["name"]) {
                var name = dom.attributes["name"].value;
                // let model = eval('(' + nameAttr.value + ')');
                // var store = new Re.Store(model, [Core.List, Core.Math, Core.Dates].reduce((x, y) => Object.assign(x, y), {}));

                var parts = name.split('.');

                // var module = require(parts[0]);
                // var component = module[parts[1]];

                // console.log(component);

                // parseDom(dom);
                // Dom.bind(dom, store);

                //if (!!model.init) {
                //    model.init(store);
                //}
                //} else {
                //    var name = dom.nodeName.replace(/\-/, "").toLowerCase();
                //    let model = container.get(name);
                //    if (model !== false) {
                //        for (let i = 0; i < dom.attributes.length; i++) {
                //            var attr = dom.attributes.item(i);
                //            model[attr.name] = eval(attr.value);
                //        }
                //        let template = dom;
                //        Dom.importView(dom.nodeName + ".html")
                //            .then(dom => {
                //                var store = new Data.Store(model,
                //                    [Core.List, Core.Math, Core.Dates].reduce((x, y) => Object.assign(x, y), {}));

                //                var fragment = Dom.bind(dom, store);
                //                template.parentNode.insertBefore(fragment, template);
                //            });
            } else {
                for (let i = 0; i < dom.childNodes.length; i++) {
                    var child = dom.childNodes[i];
                    if (child.nodeType === 1)
                        stack.push(child);
                }
            }
        }
    }

    //     domReady(init, document.body);
}

class Parser {

    static parseText(text): any[] {
        var parts: any[] = [];

        var appendText = (x) => {
            var s = x.trim();
            if (s.length > 0)
                parts.push(x);
        };

        var offset = 0;
        while (offset < text.length) {
            var begin = text.indexOf("{{", offset);
            if (begin >= 0) {
                if (begin > offset)
                    appendText(text.substring(offset, begin));

                offset = begin + 2;
                const end = text.indexOf("}}", offset);
                if (end >= 0) {
                    parts.push(fs(text.substring(offset, end)));
                    offset = end + 2;
                } else {
                    throw new SyntaxError("Expected '}}' but not found starting from index: " + offset);
                }
            } else {
                appendText(text.substring(offset));
                break;
            }
        }

        if (parts.length === 1)
            return parts[0];

        return parts;
    }

    static parseAttr(tagElement: Template.TagTemplate, attr: Attr) {
        const name = attr.name;
        if (name === "click" || name.startsWith("keyup.")) {
            const fn = this.parseText(attr.value);
            tagElement.addEvent(name, fn);
        } else if (name === "data-select" || name === "data-from") {
            const fn = this.parseText(attr.value);
            tagElement.select(fn);
        } else if (name === "checked") {
            const fn = this.parseText(attr.value);
            tagElement.attr(name, Core.compose(ctx => !!ctx ? "checked" : null, fn));
        } else {
            const tpl = this.parseText(attr.value);
            tagElement.attr(name, tpl || attr.value);

            // conventions
            if (!!tagElement.name.match(/^input$/i) && !!attr.name.match(/^name$/i) && tagElement.getAttribute("value") != undefined) {
                const valueAccessor = this.parseText(attr.value);
                tagElement.attr("value", valueAccessor);
            }
        }
    }

    static parseNode(node: Node): Template.INode {
        if (node.nodeType === 1) {
            const elt = <HTMLElement>node;

            const template = new Template.TagTemplate(elt.tagName, elt.namespaceURI);
            var content = null;

            for (var i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                var attribute = elt.attributes[i];
                if (attribute.name === "data-repeat") {
                    content = new Template.ContentTemplate(this.parseText(attribute.value)).child(template);
                } else {
                    this.parseAttr(template, attribute);
                }
            }

            for (var e = 0; e < elt.childNodes.length; e++) {
                var child = this.parseNode(elt.childNodes[e]);
                if (child)
                    template.addChild(child);
            }

            return content || template;
        } else if (node.nodeType === 3) {
            var textContent = node.textContent;
            if (textContent.trim().length > 0) {
                const tpl = this.parseText(textContent);
                return new Template.TextTemplate(tpl || node.textContent);
            }
        }

        return undefined;
    }
}

export function parseFragment(node) {
    var children = [];
    if (!!node["content"]) {
        const content = <HTMLElement>node["content"];
        for (var i = 0; i < content.childNodes.length; i++) {
            var tpl = Parser.parseNode(content.childNodes[i]);
            if (tpl)
                children.push(tpl);
        }
    }

    return target => 
            new Dom.ContentBinding(null, dom => target.appendChild(dom), children);
}

export function bind(node) {
    var children = [];
    if (!!node["content"]) {
        const content = <HTMLElement>node["content"];
        for (var i = 0; i < content.childNodes.length; i++) {
            var tpl = Parser.parseNode(content.childNodes[i]);
            if (tpl)
                children.push(tpl);
        }
    }

    return new Dom.ContentBinding(null, dom => node.parentElement.insertBefore(dom, node), children);
}
