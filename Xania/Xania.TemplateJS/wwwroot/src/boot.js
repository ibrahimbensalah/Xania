/// <reference path="../../node_modules/@types/core-js/index.d.ts" />
/// <reference path="binding.ts" />
var Xania;
(function (Xania) {
    function domReady(fn) {
        if (document.readyState !== "loading") {
            fn(document);
        }
        else {
            document.addEventListener("DOMContentLoaded", function () { return fn(document); });
        }
    }
    function init(document) {
        var container = new Xania.Data.ObjectContainer();
        // Find top level components and bind
        var stack = [document.body];
        var _loop_1 = function() {
            dom = stack.pop();
            if (!!dom["content"] && !!dom.attributes["model"]) {
                nameAttr = dom.attributes["model"];
                var model = eval('(' + nameAttr.value + ')');
                store = new Xania.Data.Store(model, [Xania.Core.List, Xania.Core.Math, Xania.Core.Dates].reduce(function (x, y) { return Object.assign(x, y); }, {}));
                fragment = Xania.Bind.bind(dom, store);
                dom.parentNode.insertBefore(fragment, dom);
                if (!!model.init) {
                    model.init(store);
                }
            }
            else {
                name = dom.nodeName.replace(/\-/, "").toLowerCase();
                var model_1 = container.get(name);
                if (model_1 !== false) {
                    for (var i = 0; i < dom.attributes.length; i++) {
                        attr = dom.attributes.item(i);
                        model_1[attr.name] = eval(attr.value);
                    }
                    var template_1 = dom;
                    Xania.Bind.importView(dom.nodeName + ".html")
                        .then(function (dom) {
                        var store = new Xania.Data.Store(model_1, [Xania.Core.List, Xania.Core.Math, Xania.Core.Dates].reduce(function (x, y) { return Object.assign(x, y); }, {}));
                        var fragment = Xania.Bind.bind(dom, store);
                        template_1.parentNode.insertBefore(fragment, template_1);
                    });
                }
                else {
                    for (var i = 0; i < dom.childNodes.length; i++) {
                        child = dom.childNodes[i];
                        if (child.nodeType === 1)
                            stack.push(child);
                    }
                }
            }
        };
        var dom, nameAttr, store, fragment, name, attr, child;
        while (stack.length > 0) {
            _loop_1();
        }
    }
    Xania.init = init;
    domReady(init);
})(Xania || (Xania = {}));
