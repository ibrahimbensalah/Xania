/// <reference path="dom.ts" />
/// <reference path="fsharp.ts" />
import { Dom } from "./dom"
import { Reactive as Re } from './reactive'
import { Core } from './core'
import { Template } from "./template"

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

                var module = require(parts[0]);
                var component = module[parts[1]];

                console.log(component);

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

    export function bind(dom: Node, store: Re.Store) {

    }

    function parseDom(rootDom: Node): Template.INode {
        const stack = [];
        let i: number;
        var rootTpl;
        stack.push({
            node: rootDom,
            push(e) {
                rootTpl = e;
            }
        });

        while (stack.length > 0) {
            const cur = stack.pop();
            const node: Node = cur.node;
            const push = cur.push;

            if (!!node["content"]) {
                const elt = <HTMLElement>node["content"];
                var template = new Template.ContentTemplate(node.attributes["model"]);
                for (i = elt.childNodes.length - 1; i >= 0; i--) {
                    stack.push({ node: elt.childNodes[i], push: template.child.bind(template) });
                }
                push(template);
            } else if (node.nodeType === 1) {
                const elt = <HTMLElement>node;
                const template = new Template.TagTemplate(elt.tagName, elt.namespaceURI);

                for (i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                    var attribute = elt.attributes[i];
                    this.parseAttr(template, attribute);
                }

                for (i = elt.childNodes.length - 1; i >= 0; i--) {
                    stack.push({ node: elt.childNodes[i], push: template.addChild.bind(template) });
                }
                push(template);
            } else if (node.nodeType === 3) {
                var textContent = node.textContent;
                if (textContent.trim().length > 0) {
                    const tpl = this.compile(textContent);
                    push(new Template.TextTemplate(tpl || node.textContent));
                }
            }
        }

        return rootTpl;
    }

    domReady(init, document.body);
}