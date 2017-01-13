System.register(["./dom"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var dom_1, Template;
    return {
        setters: [
            function (dom_1_1) {
                dom_1 = dom_1_1;
            }
        ],
        execute: function () {
            (function (Template) {
                var TextTemplate = (function () {
                    function TextTemplate(tpl) {
                        this.tpl = tpl;
                    }
                    TextTemplate.prototype.toString = function () {
                        return this.tpl.toString();
                    };
                    TextTemplate.prototype.bind = function (result) {
                        var newBinding = new dom_1.Dom.TextBinding(this.tpl, result);
                        newBinding.update(result);
                        return newBinding;
                    };
                    return TextTemplate;
                }());
                Template.TextTemplate = TextTemplate;
                var ContentTemplate = (function () {
                    function ContentTemplate() {
                        this._children = [];
                    }
                    ContentTemplate.prototype.children = function () {
                        return this._children;
                    };
                    ContentTemplate.prototype.addChild = function (child) {
                        this._children.push(child);
                        return this;
                    };
                    ContentTemplate.prototype.bind = function (context) {
                        var newBinding = new dom_1.Dom.ContentBinding();
                        this.children()
                            .reduce(ContentTemplate.reduceChild, { context: context, offset: 0, parentBinding: newBinding });
                        newBinding.update(context);
                        return newBinding;
                    };
                    ContentTemplate.reduceChild = function (prev, cur) {
                        var parentBinding = prev.parentBinding, context = prev.context, offset = prev.offset;
                        prev.offset = dom_1.ready(offset, function (p) {
                            var state = dom_1.Dom.executeTemplate(context, cur, parentBinding.dom, p);
                            return dom_1.ready(state, function (x) { return p + x.bindings.length; });
                        });
                        return prev;
                    };
                    return ContentTemplate;
                }());
                Template.ContentTemplate = ContentTemplate;
                var TagTemplate = (function () {
                    function TagTemplate(name, ns) {
                        this.name = name;
                        this.ns = ns;
                        this.attributes = [];
                        this.events = new Map();
                        this._children = [];
                    }
                    TagTemplate.prototype.children = function () {
                        return this._children;
                    };
                    TagTemplate.prototype.attr = function (name, tpl) {
                        return this.addAttribute(name, tpl);
                    };
                    TagTemplate.prototype.addAttribute = function (name, tpl) {
                        var attr = this.getAttribute(name);
                        if (!attr)
                            this.attributes.push({ name: name.toLowerCase(), tpl: tpl });
                        return this;
                    };
                    TagTemplate.prototype.getAttribute = function (name) {
                        var key = name.toLowerCase();
                        for (var i = 0; i < this.attributes.length; i++) {
                            var attr = this.attributes[i];
                            if (attr.name === key)
                                return attr;
                        }
                        return null;
                    };
                    TagTemplate.prototype.addEvent = function (name, callback) {
                        this.events.set(name, callback);
                    };
                    TagTemplate.prototype.addChild = function (child) {
                        this._children.push(child);
                        return this;
                    };
                    TagTemplate.prototype.select = function (modelAccessor) {
                        this.modelAccessor = modelAccessor;
                        return this;
                    };
                    TagTemplate.prototype.bind = function (context) {
                        var newBinding = new dom_1.Dom.TagBinding(this.name, this.ns, this.attributes, this.events);
                        this.children()
                            .reduce(ContentTemplate.reduceChild, { context: context, offset: 0, parentBinding: newBinding, modelAccessor: this.modelAccessor });
                        newBinding.update(context);
                        return newBinding;
                    };
                    return TagTemplate;
                }());
                Template.TagTemplate = TagTemplate;
            })(Template || (Template = {}));
        }
    };
});
//# sourceMappingURL=template.js.map