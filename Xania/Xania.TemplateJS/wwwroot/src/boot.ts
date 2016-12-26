/// <reference path="../../node_modules/@types/core-js/index.d.ts" />
/// <reference path="dom.ts" />

module Xania {
    function domReady(fn) {
        if (document.readyState !== "loading") {
            fn(document);
        } else {
            document.addEventListener("DOMContentLoaded", () => fn(document));
        }
    }

    export function init(document) {

        var container = new Data.ObjectContainer();
        // Find top level components and bind
        var stack: Node[] = [document.body];

        while (stack.length > 0) {
            var dom = stack.pop();

            if (!!dom["content"] && !!dom.attributes["model"]) {
                var nameAttr = dom.attributes["model"];
                let model = eval('(' + nameAttr.value + ')');
                var store = new Data.Store(model,
                    [Core.List, Core.Math, Core.Dates].reduce((x, y) => Object.assign(x, y), {}));

                var fragment = Dom.bind(dom, store);
                dom.parentNode.insertBefore(fragment, dom);

                if (!!model.init) {
                    model.init(store);
                }
            } else {
                var name = dom.nodeName.replace(/\-/, "").toLowerCase();
                let model = container.get(name);
                if (model !== false) {
                    for (let i = 0; i < dom.attributes.length; i++) {
                        var attr = dom.attributes.item(i);
                        model[attr.name] = eval(attr.value);
                    }
                    let template = dom;
                    Dom.importView(dom.nodeName + ".html")
                        .then(dom => {
                            var store = new Data.Store(model,
                                [Core.List, Core.Math, Core.Dates].reduce((x, y) => Object.assign(x, y), {}));

                            var fragment = Dom.bind(dom, store);
                            template.parentNode.insertBefore(fragment, template);
                        });
                } else {
                    for (let i = 0; i < dom.childNodes.length; i++) {
                        var child = dom.childNodes[i];
                        if (child.nodeType === 1)
                            stack.push(child);
                    }
                }
            }
        }
    }

    domReady(init);
}