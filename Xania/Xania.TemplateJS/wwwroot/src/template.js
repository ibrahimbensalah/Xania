System.register([], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var Template;
    return {
        setters: [],
        execute: function () {
            (function (Template) {
                var TextTemplate = (function () {
                    function TextTemplate(tpl) {
                        this.tpl = tpl;
                    }
                    TextTemplate.prototype.toString = function () {
                        return this.tpl.toString();
                    };
                    TextTemplate.prototype.accept = function (visitor) {
                        return visitor.text(this.tpl);
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
                    ContentTemplate.prototype.accept = function (visitor) {
                        var children = this._children.map(function (x) { return x.accept(visitor); });
                        return visitor.content(children);
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
                    TagTemplate.prototype.accept = function (visitor) {
                        var children = this._children.map(function (x) { return x.accept(visitor); });
                        var content = visitor.content(children);
                        return visitor.tag(this.name, this.ns, this.attributes, this.events, content);
                    };
                    return TagTemplate;
                }());
                Template.TagTemplate = TagTemplate;
            })(Template || (Template = {}));
        }
    };
});
//# sourceMappingURL=template.js.map