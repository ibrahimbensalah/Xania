"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var reactive_1 = require("./reactive");
var fsharp_1 = require("./fsharp");
var template_1 = require("./template");
var fsharp_2 = require("./fsharp");
var Dom;
(function (Dom) {
    var document = window.document;
    var DomBinding = (function () {
        function DomBinding(target) {
            this.target = target;
        }
        DomBinding.prototype.text = function (expr) {
            return new TextBinding(expr);
        };
        DomBinding.prototype.content = function (ast, children) {
            return new ContentBinding(ast, {
                parent: this.target,
                insert: function (child) {
                    return this.parent.appendChild(child);
                }
            }, children);
        };
        DomBinding.prototype.tag = function (name, ns, attrs) {
            var tag = new TagBinding(name, ns);
            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            return tag;
        };
        return DomBinding;
    }());
    function parse(node) {
        return {
            template: parseNode(node),
            bind: function (target, store) {
                return this.template.accept(new DomBinding(target)).update(store);
            }
        };
    }
    Dom.parse = parse;
    function parseText(text) {
        var parts = [];
        var appendText = function (x) {
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
                var end = text.indexOf("}}", offset);
                if (end >= 0) {
                    parts.push(fsharp_2.fsharp(text.substring(offset, end)));
                    offset = end + 2;
                }
                else {
                    throw new SyntaxError("Expected '}}' but not found starting from index: " + offset);
                }
            }
            else {
                appendText(text.substring(offset));
                break;
            }
        }
        if (parts.length === 1)
            return parts[0];
        return parts;
    }
    function parseAttr(tagElement, attr) {
        var name = attr.name;
        var tpl = parseText(attr.value);
        tagElement.attr(name, tpl || attr.value);
        if (!!tagElement.name.match(/^input$/i) && !!attr.name.match(/^name$/i) && tagElement.getAttribute("value") != undefined) {
            var valueAccessor = parseText(attr.value);
            tagElement.attr("value", valueAccessor);
        }
    }
    function parseNode(node) {
        if (node.nodeType === 1 && node.nodeName === "TEMPLATE") {
            var content_1 = node["content"];
            var template = new template_1.Template.ContentTemplate(null);
            for (var i = 0; i < content_1.childNodes.length; i++) {
                var tpl = parseNode(content_1.childNodes[i]);
                if (tpl)
                    template.child(tpl);
            }
            return template;
        }
        else if (node.nodeType === 1) {
            var elt = node;
            var template_2 = new template_1.Template.TagTemplate(elt.tagName, elt.namespaceURI);
            var content = null;
            for (var i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                var attribute = elt.attributes[i];
                if (attribute.name === "data-repeat") {
                    content = new template_1.Template.ContentTemplate(parseText(attribute.value)).child(template_2);
                }
                else {
                    parseAttr(template_2, attribute);
                }
            }
            for (var e = 0; e < elt.childNodes.length; e++) {
                var child = parseNode(elt.childNodes[e]);
                if (child)
                    template_2.addChild(child);
            }
            return content || template_2;
        }
        else if (node.nodeType === 3) {
            var textContent = node.textContent;
            if (textContent.trim().length > 0) {
                var tpl_1 = parseText(textContent);
                return new template_1.Template.TextTemplate(tpl_1 || node.textContent);
            }
        }
        return undefined;
    }
    var ContentBinding = (function (_super) {
        __extends(ContentBinding, _super);
        function ContentBinding(ast, parent, children) {
            var _this = _super.call(this) || this;
            _this.ast = ast;
            _this.parent = parent;
            _this.children = children;
            _this.fragments = [];
            return _this;
        }
        ContentBinding.prototype.render = function () {
            var stream = this.ast === null ? [this.context] : fsharp_1.accept(this.ast, this, this.context);
            for (var i = 0; i < stream.length; i++) {
                var context = stream[i];
                var fragment = null;
                for (var e = i; e < this.fragments.length; e++) {
                    var f = this.fragments[e];
                    if (f.context === context) {
                        fragment = f;
                    }
                }
                if (fragment === null) {
                    fragment = new ContentFragment(this);
                    this.fragments.push(fragment);
                }
                fragment.setOrder(i);
                fragment.update(context);
            }
            return stream;
        };
        return ContentBinding;
    }(reactive_1.Reactive.Binding));
    Dom.ContentBinding = ContentBinding;
    var ContentFragment = (function () {
        function ContentFragment(owner) {
            this.owner = owner;
            this.bindings = [];
        }
        ContentFragment.prototype.update = function (context) {
            this.context = context;
            for (var e = 0; e < this.owner.children.length; e++) {
                this.bindings[e] =
                    this.owner.children[e].accept(this, e)
                        .update(this.context);
            }
            return this;
        };
        ContentFragment.prototype.setOrder = function (i) {
            this.order = i;
        };
        ContentFragment.prototype.insert = function (dom, index) {
            var offset = 0;
            for (var i = 0; i < this.owner.fragments.length; i++) {
                var frag = this.owner.fragments[i];
                if (frag.order < this.order) {
                    offset += frag.bindings.length;
                }
            }
            this.owner.parent.insert(dom, offset + index);
        };
        ContentFragment.prototype.text = function (ast, childIndex) {
            var binding = new TextBinding(ast);
            this.insert(binding.dom, childIndex);
            return binding;
        };
        ContentFragment.prototype.content = function (ast, children, childIndex) {
            var frag = this;
            var binding = new ContentBinding(ast, {
                insert: function (dom) {
                    frag.insert(dom, childIndex);
                }
            }, children);
            return binding;
        };
        ContentFragment.prototype.tag = function (tagName, ns, attrs, childIndex) {
            var tag = new TagBinding(tagName, ns);
            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            this.insert(tag.dom, childIndex);
            return tag;
        };
        return ContentFragment;
    }());
    var TextBinding = (function (_super) {
        __extends(TextBinding, _super);
        function TextBinding(expr) {
            var _this = _super.call(this) || this;
            _this.expr = expr;
            _this.dom = document.createTextNode("");
            return _this;
        }
        TextBinding.prototype.render = function () {
            var result = this.evaluate(fsharp_1.accept, this.expr);
            if (result === undefined) {
            }
            else {
                this.dom.textContent = result && result.valueOf();
            }
        };
        return TextBinding;
    }(reactive_1.Reactive.Binding));
    Dom.TextBinding = TextBinding;
    var TagBinding = (function (_super) {
        __extends(TagBinding, _super);
        function TagBinding(tagName, ns) {
            if (ns === void 0) { ns = null; }
            var _this = _super.call(this) || this;
            _this.ns = ns;
            _this.attributeBindings = [];
            _this.childBindings = [];
            _this.events = {};
            _this.appendChild = function (dom) { return _this.dom.appendChild(dom); };
            _this.classBinding = new ClassBinding(_this);
            if (ns === null)
                _this.dom = document.createElement(tagName);
            else {
                _this.dom = document.createElementNS(ns, tagName.toLowerCase());
            }
            return _this;
        }
        TagBinding.prototype.attr = function (name, ast) {
            if (name === "class") {
                this.classBinding.setBaseClass(ast);
            }
            else if (name.startsWith("class.")) {
                this.classBinding.addClass(name.substr(6), ast);
            }
            else if (TagBinding.eventNames.indexOf(name) >= 0) {
                var eventBinding = new EventBinding(this, name, ast);
                this.attributeBindings.push(eventBinding);
            }
            else {
                var attrBinding = new AttributeBinding(this, name, ast);
                this.attributeBindings.push(attrBinding);
            }
            return this;
        };
        TagBinding.prototype.on = function (name, ast) {
            this.events[name] = ast;
            return this;
        };
        TagBinding.prototype.text = function (ast) {
            var binding = new TextBinding(ast);
            this.childBindings.push(binding);
            if (!!this.context)
                binding.update(this.context);
            this.appendChild(binding.dom);
            return binding;
        };
        TagBinding.prototype.content = function (ast, children) {
            var target = {
                parent: this.dom,
                insert: function (dom, idx) {
                    return this.parent.appendChild(dom);
                }
            };
            var binding = new ContentBinding(ast, target, children);
            if (!!this.context)
                binding.update(this.context);
            this.childBindings.push(binding);
            return binding;
        };
        TagBinding.prototype.tag = function (tagName, ns, attrs, options) {
            var tag = new TagBinding(tagName, ns);
            this.childBindings.push(tag);
            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            this.appendChild(tag.dom);
            return tag;
        };
        TagBinding.prototype.update = function (context) {
            _super.prototype.update.call(this, context);
            this.classBinding.update(context);
            for (var e = 0; e < this.attributeBindings.length; e++) {
                this.attributeBindings[e].update(context);
            }
            for (var i = 0; i < this.childBindings.length; i++) {
                this.childBindings[i].update(context);
            }
            return this;
        };
        TagBinding.prototype.render = function (context) {
            return this.dom;
        };
        TagBinding.prototype.trigger = function (name) {
            var handler = this.events[name];
            if (!!handler) {
                var result = fsharp_1.accept(handler, this, this.context);
                if (typeof result === "function")
                    result();
            }
        };
        return TagBinding;
    }(reactive_1.Reactive.Binding));
    TagBinding.eventNames = ["click", "mouseover", "mouseout", "blur", "change"];
    Dom.TagBinding = TagBinding;
    var ClassBinding = (function (_super) {
        __extends(ClassBinding, _super);
        function ClassBinding(parent) {
            var _this = _super.call(this) || this;
            _this.parent = parent;
            _this.conditions = [];
            return _this;
        }
        ClassBinding.prototype.setBaseClass = function (tpl) {
            this.baseClassTpl = tpl;
        };
        ClassBinding.prototype.addClass = function (className, condition) {
            this.conditions.push({ className: className, condition: condition });
        };
        ClassBinding.prototype.render = function (context) {
            this.context = context;
            var classes = [];
            if (!!this.baseClassTpl) {
                var value = fsharp_1.accept(this.baseClassTpl, this, context).valueOf();
                classes.push(value);
            }
            for (var i = 0; i < this.conditions.length; i++) {
                var _a = this.conditions[i], className = _a.className, condition = _a.condition;
                if (!!fsharp_1.accept(condition, this, context).valueOf()) {
                    classes.push(className);
                }
            }
            this.setAttribute("class", classes.length > 0 ? join(" ", classes) : null);
        };
        ClassBinding.prototype.setAttribute = function (attrName, newValue) {
            var oldValue = this.oldValue;
            var tag = this.parent.dom;
            if (typeof newValue === "undefined" || newValue === null) {
                tag[attrName] = void 0;
                tag.removeAttribute(attrName);
            }
            else {
                if (typeof oldValue === "undefined") {
                    var attr = document.createAttribute(attrName);
                    attr.value = newValue;
                    tag.setAttributeNode(attr);
                }
                else {
                    tag.className = newValue;
                }
            }
            this.oldValue = newValue;
        };
        return ClassBinding;
    }(reactive_1.Reactive.Binding));
    Dom.ClassBinding = ClassBinding;
    var EventBinding = (function (_super) {
        __extends(EventBinding, _super);
        function EventBinding(parent, name, expr) {
            var _this = _super.call(this) || this;
            _this.parent = parent;
            _this.name = name;
            _this.expr = expr;
            return _this;
        }
        EventBinding.prototype.render = function () {
            var _this = this;
            var tag = this.parent.dom;
            tag.addEventListener(this.name, function () {
                var value = _this.evaluate(fsharp_1.accept, _this.expr);
            });
        };
        EventBinding.prototype.app = function (fun, args) {
            if (fun === "assign") {
                var value = args[0].valueOf();
                args[1].set(value);
                return value;
            }
            return _super.prototype.app.call(this, fun, args);
        };
        return EventBinding;
    }(reactive_1.Reactive.Binding));
    Dom.EventBinding = EventBinding;
    var AttributeBinding = (function (_super) {
        __extends(AttributeBinding, _super);
        function AttributeBinding(parent, name, expr) {
            var _this = _super.call(this) || this;
            _this.parent = parent;
            _this.name = name;
            _this.expr = expr;
            return _this;
        }
        AttributeBinding.prototype.render = function () {
            var value = this.evaluate(fsharp_1.accept, this.expr);
            if (value !== null && value !== void 0 && !!value.valueOf)
                value = value.valueOf();
            var newValue;
            if (this.name === "checked") {
                newValue = !!value ? "checked" : null;
            }
            else {
                newValue = value;
            }
            var oldValue = this.oldValue;
            var attrName = this.name;
            var tag = this.parent.dom;
            if (typeof newValue === "undefined" || newValue === null) {
                tag[attrName] = void 0;
                tag.removeAttribute(attrName);
            }
            else {
                if (typeof oldValue === "undefined") {
                    var attr = document.createAttribute(attrName);
                    attr.value = newValue;
                    tag.setAttributeNode(attr);
                }
                else {
                    tag.setAttribute(attrName, newValue);
                }
            }
            this.oldValue = newValue;
        };
        return AttributeBinding;
    }(reactive_1.Reactive.Binding));
    Dom.AttributeBinding = AttributeBinding;
})(Dom = exports.Dom || (exports.Dom = {}));
function join(separator, value) {
    if (Array.isArray(value)) {
        return value.length > 0 ? value.sort().join(separator) : null;
    }
    return value;
}
exports.join = join;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx1Q0FBMkM7QUFDM0MsbUNBQWlDO0FBQ2pDLHVDQUFxQztBQUNyQyxtQ0FBdUM7QUFFdkMsSUFBYyxHQUFHLENBd2ZoQjtBQXhmRCxXQUFjLEdBQUc7SUFFYixJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO0lBUy9CO1FBQ0ksb0JBQW9CLE1BQU07WUFBTixXQUFNLEdBQU4sTUFBTSxDQUFBO1FBQUksQ0FBQztRQUUvQix5QkFBSSxHQUFKLFVBQUssSUFBSTtZQUNMLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsNEJBQU8sR0FBUCxVQUFRLEdBQUcsRUFBRSxRQUEwQjtZQUNuQyxNQUFNLENBQUMsSUFBSSxjQUFjLENBQUMsR0FBRyxFQUN6QjtnQkFDSSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07Z0JBQ25CLE1BQU0sWUFBQyxLQUFLO29CQUNSLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDMUMsQ0FBQzthQUNHLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUNELHdCQUFHLEdBQUgsVUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUs7WUFDZixJQUFJLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFbkMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDZixDQUFDO1FBQ0wsaUJBQUM7SUFBRCxDQUFDLEFBeEJELElBd0JDO0lBRUQsZUFBc0IsSUFBSTtRQUN0QixNQUFNLENBQUM7WUFDSCxRQUFRLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQztZQUN6QixJQUFJLFlBQUMsTUFBTSxFQUFFLEtBQUs7Z0JBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RFLENBQUM7U0FDSyxDQUFDO0lBQ2YsQ0FBQztJQVBlLFNBQUssUUFPcEIsQ0FBQTtJQUVELG1CQUFtQixJQUFJO1FBQ25CLElBQUksS0FBSyxHQUFVLEVBQUUsQ0FBQztRQUV0QixJQUFJLFVBQVUsR0FBRyxVQUFDLENBQUM7WUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ2IsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUM7UUFFRixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDZixPQUFPLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDMUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDdkMsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2IsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQztvQkFDZixVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFFOUMsTUFBTSxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBQ25CLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN2QyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDWCxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVDLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNKLE1BQU0sSUFBSSxXQUFXLENBQUMsbURBQW1ELEdBQUcsTUFBTSxDQUFDLENBQUM7Z0JBQ3hGLENBQUM7WUFDTCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDbkMsS0FBSyxDQUFDO1lBQ1YsQ0FBQztRQUNMLENBQUM7UUFFRCxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztZQUNuQixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXBCLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELG1CQUFtQixVQUFnQyxFQUFFLElBQVU7UUFDM0QsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN2QixJQUFNLEdBQUcsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFHekMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdkgsSUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUM1QyxDQUFDO0lBQ0wsQ0FBQztJQUVELG1CQUFtQixJQUFVO1FBQ3pCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFNLFNBQU8sR0FBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdDLElBQUksUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsU0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUM7b0JBQ0osUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNwQixDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFNLEdBQUcsR0FBZ0IsSUFBSSxDQUFDO1lBRTlCLElBQU0sVUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDekUsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBRW5CLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakUsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDO29CQUNuQyxPQUFPLEdBQUcsSUFBSSxtQkFBUSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVEsQ0FBQyxDQUFDO2dCQUN2RixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNKLFNBQVMsQ0FBQyxVQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ25DLENBQUM7WUFDTCxDQUFDO1lBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM3QyxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUM7b0JBQ04sVUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNqQyxDQUFDO1lBRUQsTUFBTSxDQUFDLE9BQU8sSUFBSSxVQUFRLENBQUM7UUFDL0IsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUNuQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLElBQU0sS0FBRyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQUMsS0FBRyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM5RCxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sQ0FBQyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVEO1FBQW9DLGtDQUFVO1FBRzFDLHdCQUFvQixHQUFHLEVBQVMsTUFBd0MsRUFBUyxRQUEwQjtZQUEzRyxZQUNJLGlCQUFPLFNBQ1Y7WUFGbUIsU0FBRyxHQUFILEdBQUcsQ0FBQTtZQUFTLFlBQU0sR0FBTixNQUFNLENBQWtDO1lBQVMsY0FBUSxHQUFSLFFBQVEsQ0FBa0I7WUFGcEcsZUFBUyxHQUFzQixFQUFFLENBQUM7O1FBSXpDLENBQUM7UUFFRCwrQkFBTSxHQUFOO1lBQ0ksSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsZUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV2RixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDckMsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUV4QixJQUFJLFFBQVEsR0FBb0IsSUFBSSxDQUFDO2dCQUNyQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQzt3QkFDeEIsUUFBUSxHQUFHLENBQUMsQ0FBQztvQkFDakIsQ0FBQztnQkFDTCxDQUFDO2dCQUVELEVBQUUsQ0FBQyxDQUFDLFFBQVEsS0FBSyxJQUFvQixDQUFDLENBQUMsQ0FBQztvQkFDcEMsUUFBUSxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNyQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztnQkFFRCxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQixRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdCLENBQUM7WUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ2xCLENBQUM7UUFDTCxxQkFBQztJQUFELENBQUMsQUFoQ0QsQ0FBb0MsbUJBQUUsQ0FBQyxPQUFPLEdBZ0M3QztJQWhDWSxrQkFBYyxpQkFnQzFCLENBQUE7SUFFRDtRQUtJLHlCQUFvQixLQUFxQjtZQUFyQixVQUFLLEdBQUwsS0FBSyxDQUFnQjtZQUpsQyxhQUFRLEdBQWlCLEVBQUUsQ0FBQztRQUtuQyxDQUFDO1FBRUQsZ0NBQU0sR0FBTixVQUFPLE9BQU87WUFDVixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDWixJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBZ0IsRUFBRSxDQUFDLENBQUM7eUJBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEMsQ0FBQztZQUNELE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELGtDQUFRLEdBQVIsVUFBUyxDQUFDO1lBQ04sSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQUVELGdDQUFNLEdBQU4sVUFBTyxHQUFHLEVBQUUsS0FBSztZQUNiLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUMxQixNQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ25DLENBQUM7WUFDTCxDQUFDO1lBRUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVNLDhCQUFJLEdBQVgsVUFBWSxHQUFHLEVBQUUsVUFBa0I7WUFDL0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDbkIsQ0FBQztRQUVNLGlDQUFPLEdBQWQsVUFBZSxHQUFHLEVBQUUsUUFBUSxFQUFFLFVBQWtCO1lBQzVDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztZQUNoQixJQUFJLE9BQU8sR0FBRyxJQUFJLGNBQWMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2xDLE1BQU0sWUFBQyxHQUFHO29CQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxDQUFDO2FBQ0osRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNiLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDbkIsQ0FBQztRQUVNLDZCQUFHLEdBQVYsVUFBVyxPQUFlLEVBQUUsRUFBVSxFQUFFLEtBQUssRUFBRSxVQUFrQjtZQUM3RCxJQUFJLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFdEMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVqQyxNQUFNLENBQUMsR0FBRyxDQUFDO1FBQ2YsQ0FBQztRQUNMLHNCQUFDO0lBQUQsQ0FBQyxBQTdERCxJQTZEQztJQUVEO1FBQWlDLCtCQUFVO1FBR3ZDLHFCQUFvQixJQUFJO1lBQXhCLFlBQ0ksaUJBQU8sU0FFVjtZQUhtQixVQUFJLEdBQUosSUFBSSxDQUFBO1lBRXBCLEtBQUksQ0FBQyxHQUFHLEdBQVMsUUFBUyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQzs7UUFDbEQsQ0FBQztRQUVELDRCQUFNLEdBQU47WUFDSSxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFaEQsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFM0IsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdEQsQ0FBQztRQUNMLENBQUM7UUFDTCxrQkFBQztJQUFELENBQUMsQUFqQkQsQ0FBaUMsbUJBQUUsQ0FBQyxPQUFPLEdBaUIxQztJQWpCWSxlQUFXLGNBaUJ2QixDQUFBO0lBRUQ7UUFBZ0MsOEJBQVU7UUFRdEMsb0JBQVksT0FBZSxFQUFVLEVBQWlCO1lBQWpCLG1CQUFBLEVBQUEsU0FBaUI7WUFBdEQsWUFDSSxpQkFBTyxTQU1WO1lBUG9DLFFBQUUsR0FBRixFQUFFLENBQWU7WUFOOUMsdUJBQWlCLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLG1CQUFhLEdBQWlCLEVBQUUsQ0FBQztZQUNqQyxZQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ1osaUJBQVcsR0FBRyxVQUFBLEdBQUcsSUFBSSxPQUFBLEtBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUF6QixDQUF5QixDQUFDO1lBQy9DLGtCQUFZLEdBQUcsSUFBSSxZQUFZLENBQUMsS0FBSSxDQUFDLENBQUM7WUFJMUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQztnQkFDWixLQUFJLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLENBQUM7Z0JBQ0YsS0FBSSxDQUFDLEdBQUcsR0FBUyxRQUFTLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUMxRSxDQUFDOztRQUNMLENBQUM7UUFJRCx5QkFBSSxHQUFKLFVBQUssSUFBSSxFQUFFLEdBQUc7WUFDVixFQUFFLENBQUMsQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELElBQUksWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDOUMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksV0FBVyxHQUFHLElBQUksZ0JBQWdCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDeEQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBRUQsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsdUJBQUUsR0FBRixVQUFHLElBQUksRUFBRSxHQUFHO1lBQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7WUFFeEIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRU0seUJBQUksR0FBWCxVQUFZLEdBQUc7WUFDWCxJQUFJLE9BQU8sR0FBRyxJQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVqQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDZixPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVqQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5QixNQUFNLENBQUMsT0FBTyxDQUFDO1FBQ25CLENBQUM7UUFFTSw0QkFBTyxHQUFkLFVBQWUsR0FBRyxFQUFFLFFBQTBCO1lBQzFDLElBQUksTUFBTSxHQUFHO2dCQUNULE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRztnQkFDaEIsTUFBTSxZQUFDLEdBQUcsRUFBRSxHQUFHO29CQUNYLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDeEMsQ0FBQzthQUNKLENBQUE7WUFDRCxJQUFJLE9BQU8sR0FBRyxJQUFJLGNBQWMsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRXhELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUNmLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWpDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDbkIsQ0FBQztRQUVNLHdCQUFHLEdBQVYsVUFBVyxPQUFlLEVBQUUsRUFBVSxFQUFFLEtBQUssRUFBRSxPQUFZO1lBQ3ZELElBQUksR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUU3QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDcEMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBRUQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUNmLENBQUM7UUFFRCwyQkFBTSxHQUFOLFVBQU8sT0FBTztZQUNWLGlCQUFNLE1BQU0sWUFBQyxPQUFPLENBQUMsQ0FBQztZQUV0QixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNsQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDckQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxQyxDQUFDO1lBRUQsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsMkJBQU0sR0FBTixVQUFPLE9BQU87WUFDVixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNwQixDQUFDO1FBRUQsNEJBQU8sR0FBUCxVQUFRLElBQUk7WUFDUixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNaLElBQUksTUFBTSxHQUFHLGVBQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFakQsRUFBRSxDQUFDLENBQUMsT0FBTyxNQUFNLEtBQUssVUFBVSxDQUFDO29CQUM3QixNQUFNLEVBQUUsQ0FBQztZQUNqQixDQUFDO1FBQ0wsQ0FBQztRQUNMLGlCQUFDO0lBQUQsQ0FBQyxBQTVHRCxDQUFnQyxtQkFBRSxDQUFDLE9BQU87SUFpQi9CLHFCQUFVLEdBQUcsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFqQmhFLGNBQVUsYUE0R3RCLENBQUE7SUFFRDtRQUFrQyxnQ0FBVTtRQU14QyxzQkFBb0IsTUFBa0I7WUFBdEMsWUFDSSxpQkFBTyxTQUNWO1lBRm1CLFlBQU0sR0FBTixNQUFNLENBQVk7WUFKOUIsZ0JBQVUsR0FBRyxFQUFFLENBQUM7O1FBTXhCLENBQUM7UUFFRCxtQ0FBWSxHQUFaLFVBQWEsR0FBRztZQUNaLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDO1FBQzVCLENBQUM7UUFFRCwrQkFBUSxHQUFSLFVBQVMsU0FBUyxFQUFFLFNBQVM7WUFDekIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLFdBQUEsRUFBRSxTQUFTLFdBQUEsRUFBRSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELDZCQUFNLEdBQU4sVUFBTyxPQUFPO1lBQ1YsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDdkIsSUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ25CLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxLQUFLLEdBQUcsZUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMvRCxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hCLENBQUM7WUFFRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzFDLElBQUEsdUJBQTZDLEVBQTNDLHdCQUFTLEVBQUUsd0JBQVMsQ0FBd0I7Z0JBQ2xELEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFNLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLENBQUM7WUFDTCxDQUFDO1lBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRU0sbUNBQVksR0FBbkIsVUFBb0IsUUFBZ0IsRUFBRSxRQUFRO1lBQzFDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFFN0IsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFDMUIsRUFBRSxDQUFDLENBQUMsT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN2RCxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZCLEdBQUcsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbEMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLEVBQUUsQ0FBQyxDQUFDLE9BQU8sUUFBUSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzlDLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO29CQUN0QixHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9CLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ0osR0FBRyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7Z0JBQzdCLENBQUM7WUFDTCxDQUFDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDN0IsQ0FBQztRQUVMLG1CQUFDO0lBQUQsQ0FBQyxBQXZERCxDQUFrQyxtQkFBRSxDQUFDLE9BQU8sR0F1RDNDO0lBdkRZLGdCQUFZLGVBdUR4QixDQUFBO0lBRUQ7UUFBa0MsZ0NBQVU7UUFDeEMsc0JBQW9CLE1BQWtCLEVBQVUsSUFBSSxFQUFVLElBQUk7WUFBbEUsWUFDSSxpQkFBTyxTQUNWO1lBRm1CLFlBQU0sR0FBTixNQUFNLENBQVk7WUFBVSxVQUFJLEdBQUosSUFBSSxDQUFBO1lBQVUsVUFBSSxHQUFKLElBQUksQ0FBQTs7UUFFbEUsQ0FBQztRQUVELDZCQUFNLEdBQU47WUFBQSxpQkFLQztZQUpHLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDO1lBQzFCLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUM1QixJQUFJLEtBQUssR0FBRyxLQUFJLENBQUMsUUFBUSxDQUFDLGVBQU0sRUFBRSxLQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsMEJBQUcsR0FBSCxVQUFJLEdBQUcsRUFBRSxJQUFXO1lBQ2hCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNuQixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ25CLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDakIsQ0FBQztZQUVELE1BQU0sQ0FBQyxpQkFBTSxHQUFHLFlBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFDTCxtQkFBQztJQUFELENBQUMsQUFyQkQsQ0FBa0MsbUJBQUUsQ0FBQyxPQUFPLEdBcUIzQztJQXJCWSxnQkFBWSxlQXFCeEIsQ0FBQTtJQUVEO1FBQXNDLG9DQUFVO1FBSTVDLDBCQUFvQixNQUFrQixFQUFVLElBQUksRUFBVSxJQUFJO1lBQWxFLFlBQ0ksaUJBQU8sU0FDVjtZQUZtQixZQUFNLEdBQU4sTUFBTSxDQUFZO1lBQVUsVUFBSSxHQUFKLElBQUksQ0FBQTtZQUFVLFVBQUksR0FBSixJQUFJLENBQUE7O1FBRWxFLENBQUM7UUFFRCxpQ0FBTSxHQUFOO1lBQ0ksSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTdDLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO2dCQUN0RCxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRTVCLElBQUksUUFBUSxDQUFDO1lBQ2IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixRQUFRLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQzFDLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLENBQUM7WUFFRCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBRTdCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDekIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFDMUIsRUFBRSxDQUFDLENBQUMsT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN2RCxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7Z0JBQ3ZCLEdBQUcsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbEMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLEVBQUUsQ0FBQyxDQUFDLE9BQU8sUUFBUSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzlDLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO29CQUN0QixHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9CLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBRUosR0FBRyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3pDLENBQUM7WUFDTCxDQUFDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDN0IsQ0FBQztRQUNMLHVCQUFDO0lBQUQsQ0FBQyxBQXhDRCxDQUFzQyxtQkFBRSxDQUFDLE9BQU8sR0F3Qy9DO0lBeENZLG9CQUFnQixtQkF3QzVCLENBQUE7QUFxQkwsQ0FBQyxFQXhmYSxHQUFHLEdBQUgsV0FBRyxLQUFILFdBQUcsUUF3ZmhCO0FBRUQsY0FBcUIsU0FBaUIsRUFBRSxLQUFLO0lBQ3pDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUNsRSxDQUFDO0lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBTEQsb0JBS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb3JlIH0gZnJvbSAnLi9jb3JlJ1xyXG5pbXBvcnQgeyBSZWFjdGl2ZSBhcyBSZSB9IGZyb20gJy4vcmVhY3RpdmUnXHJcbmltcG9ydCB7IGFjY2VwdCB9IGZyb20gJy4vZnNoYXJwJ1xyXG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJy4vdGVtcGxhdGUnXHJcbmltcG9ydCB7IGZzaGFycCBhcyBmcyB9IGZyb20gXCIuL2ZzaGFycFwiXHJcblxyXG5leHBvcnQgbW9kdWxlIERvbSB7XHJcblxyXG4gICAgdmFyIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xyXG5cclxuICAgIGludGVyZmFjZSBJVmlzaXRvciBleHRlbmRzIFRlbXBsYXRlLklWaXNpdG9yPFJlLkJpbmRpbmc+IHtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSVZpZXcge1xyXG4gICAgICAgIGJpbmQodGFyZ2V0OiB7IGFwcGVuZENoaWxkKGRvbSkgfSwgc3RvcmUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIERvbUJpbmRpbmcge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFyZ2V0KSB7IH1cclxuXHJcbiAgICAgICAgdGV4dChleHByKTogUmUuQmluZGluZyB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVGV4dEJpbmRpbmcoZXhwcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRlbnQoYXN0LCBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSk6IFJlLkJpbmRpbmcge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbnRlbnRCaW5kaW5nKGFzdCxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHRoaXMudGFyZ2V0LFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydChjaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gYXMgYW55LCBjaGlsZHJlbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRhZyhuYW1lLCBucywgYXR0cnMpOiBJVmlzaXRvciB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyhuYW1lLCBucyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgZnVuY3Rpb24gcGFyc2Uobm9kZSk6IElWaWV3IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcGFyc2VOb2RlKG5vZGUpLFxyXG4gICAgICAgICAgICBiaW5kKHRhcmdldCwgc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlLmFjY2VwdChuZXcgRG9tQmluZGluZyh0YXJnZXQpKS51cGRhdGUoc3RvcmUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBhcyBJVmlldztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZVRleHQodGV4dCk6IGFueVtdIHtcclxuICAgICAgICB2YXIgcGFydHM6IGFueVtdID0gW107XHJcblxyXG4gICAgICAgIHZhciBhcHBlbmRUZXh0ID0gKHgpID0+IHtcclxuICAgICAgICAgICAgdmFyIHMgPSB4LnRyaW0oKTtcclxuICAgICAgICAgICAgaWYgKHMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goeCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgd2hpbGUgKG9mZnNldCA8IHRleHQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBiZWdpbiA9IHRleHQuaW5kZXhPZihcInt7XCIsIG9mZnNldCk7XHJcbiAgICAgICAgICAgIGlmIChiZWdpbiA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYmVnaW4gPiBvZmZzZXQpXHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kVGV4dCh0ZXh0LnN1YnN0cmluZyhvZmZzZXQsIGJlZ2luKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gYmVnaW4gKyAyO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gdGV4dC5pbmRleE9mKFwifX1cIiwgb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgIGlmIChlbmQgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goZnModGV4dC5zdWJzdHJpbmcob2Zmc2V0LCBlbmQpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gZW5kICsgMjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiRXhwZWN0ZWQgJ319JyBidXQgbm90IGZvdW5kIHN0YXJ0aW5nIGZyb20gaW5kZXg6IFwiICsgb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFRleHQodGV4dC5zdWJzdHJpbmcob2Zmc2V0KSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMSlcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnRzWzBdO1xyXG5cclxuICAgICAgICByZXR1cm4gcGFydHM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VBdHRyKHRhZ0VsZW1lbnQ6IFRlbXBsYXRlLlRhZ1RlbXBsYXRlLCBhdHRyOiBBdHRyKSB7XHJcbiAgICAgICAgY29uc3QgbmFtZSA9IGF0dHIubmFtZTtcclxuICAgICAgICBjb25zdCB0cGwgPSBwYXJzZVRleHQoYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgdGFnRWxlbWVudC5hdHRyKG5hbWUsIHRwbCB8fCBhdHRyLnZhbHVlKTtcclxuXHJcbiAgICAgICAgLy8gY29udmVudGlvbnNcclxuICAgICAgICBpZiAoISF0YWdFbGVtZW50Lm5hbWUubWF0Y2goL15pbnB1dCQvaSkgJiYgISFhdHRyLm5hbWUubWF0Y2goL15uYW1lJC9pKSAmJiB0YWdFbGVtZW50LmdldEF0dHJpYnV0ZShcInZhbHVlXCIpICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZUFjY2Vzc29yID0gcGFyc2VUZXh0KGF0dHIudmFsdWUpO1xyXG4gICAgICAgICAgICB0YWdFbGVtZW50LmF0dHIoXCJ2YWx1ZVwiLCB2YWx1ZUFjY2Vzc29yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VOb2RlKG5vZGU6IE5vZGUpOiBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEgJiYgbm9kZS5ub2RlTmFtZSA9PT0gXCJURU1QTEFURVwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSA8SFRNTEVsZW1lbnQ+bm9kZVtcImNvbnRlbnRcIl07XHJcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZS5Db250ZW50VGVtcGxhdGUobnVsbCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHBsID0gcGFyc2VOb2RlKGNvbnRlbnQuY2hpbGROb2Rlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHBsKVxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLmNoaWxkKHRwbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xyXG4gICAgICAgICAgICBjb25zdCBlbHQgPSA8SFRNTEVsZW1lbnQ+bm9kZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlLlRhZ1RlbXBsYXRlKGVsdC50YWdOYW1lLCBlbHQubmFtZXNwYWNlVVJJKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7ICEhZWx0LmF0dHJpYnV0ZXMgJiYgaSA8IGVsdC5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0cmlidXRlID0gZWx0LmF0dHJpYnV0ZXNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoYXR0cmlidXRlLm5hbWUgPT09IFwiZGF0YS1yZXBlYXRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBuZXcgVGVtcGxhdGUuQ29udGVudFRlbXBsYXRlKHBhcnNlVGV4dChhdHRyaWJ1dGUudmFsdWUpKS5jaGlsZCh0ZW1wbGF0ZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlQXR0cih0ZW1wbGF0ZSwgYXR0cmlidXRlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBlbHQuY2hpbGROb2Rlcy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gcGFyc2VOb2RlKGVsdC5jaGlsZE5vZGVzW2VdKTtcclxuICAgICAgICAgICAgICAgIGlmIChjaGlsZClcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5hZGRDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBjb250ZW50IHx8IHRlbXBsYXRlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xyXG4gICAgICAgICAgICB2YXIgdGV4dENvbnRlbnQgPSBub2RlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICBpZiAodGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRwbCA9IHBhcnNlVGV4dCh0ZXh0Q29udGVudCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFRlbXBsYXRlLlRleHRUZW1wbGF0ZSh0cGwgfHwgbm9kZS50ZXh0Q29udGVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIENvbnRlbnRCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIGZyYWdtZW50czogQ29udGVudEZyYWdtZW50W10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBhc3QsIHB1YmxpYyBwYXJlbnQ6IHsgaW5zZXJ0KG46IE5vZGUsIGlkeDogbnVtYmVyKSB9LCBwdWJsaWMgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgdmFyIHN0cmVhbSA9IHRoaXMuYXN0ID09PSBudWxsID8gW3RoaXMuY29udGV4dF0gOiBhY2NlcHQodGhpcy5hc3QsIHRoaXMsIHRoaXMuY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmVhbS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzdHJlYW1baV07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGZyYWdtZW50OiBDb250ZW50RnJhZ21lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgZSA9IGk7IGUgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmID0gdGhpcy5mcmFnbWVudHNbZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGYuY29udGV4dCA9PT0gY29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IGY7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmcmFnbWVudCA9PT0gbnVsbCAvKiBub3QgZm91bmQgKi8pIHtcclxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBDb250ZW50RnJhZ21lbnQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHMucHVzaChmcmFnbWVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQuc2V0T3JkZXIoaSk7XHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudC51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdHJlYW07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIENvbnRlbnRGcmFnbWVudCB7XHJcbiAgICAgICAgcHVibGljIGJpbmRpbmdzOiBSZS5CaW5kaW5nW10gPSBbXTtcclxuICAgICAgICBwcml2YXRlIG9yZGVyOiBudW1iZXI7XHJcbiAgICAgICAgcHVibGljIGNvbnRleHQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgb3duZXI6IENvbnRlbnRCaW5kaW5nKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IHRoaXMub3duZXIuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZV0gPVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXIuY2hpbGRyZW5bZV0uYWNjZXB0KHRoaXMgYXMgSVZpc2l0b3IsIGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC51cGRhdGUodGhpcy5jb250ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldE9yZGVyKGkpIHtcclxuICAgICAgICAgICAgdGhpcy5vcmRlciA9IGk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnNlcnQoZG9tLCBpbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm93bmVyLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZyYWcgPSB0aGlzLm93bmVyLmZyYWdtZW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChmcmFnLm9yZGVyIDwgdGhpcy5vcmRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSBmcmFnLmJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5vd25lci5wYXJlbnQuaW5zZXJ0KGRvbSwgb2Zmc2V0ICsgaW5kZXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRleHQoYXN0LCBjaGlsZEluZGV4OiBudW1iZXIpOiBUZXh0QmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciBiaW5kaW5nID0gbmV3IFRleHRCaW5kaW5nKGFzdCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0KGJpbmRpbmcuZG9tLCBjaGlsZEluZGV4KTtcclxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgY29udGVudChhc3QsIGNoaWxkcmVuLCBjaGlsZEluZGV4OiBudW1iZXIpOiBDb250ZW50QmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciBmcmFnID0gdGhpcztcclxuICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgQ29udGVudEJpbmRpbmcoYXN0LCB7XHJcbiAgICAgICAgICAgICAgICBpbnNlcnQoZG9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJhZy5pbnNlcnQoZG9tLCBjaGlsZEluZGV4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB0YWcodGFnTmFtZTogc3RyaW5nLCBuczogc3RyaW5nLCBhdHRycywgY2hpbGRJbmRleDogbnVtYmVyKTogVGFnQmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyh0YWdOYW1lLCBucyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluc2VydCh0YWcuZG9tLCBjaGlsZEluZGV4KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUZXh0QmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICB0aGlzLmRvbSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZShhY2NlcHQsIHRoaXMuZXhwcik7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZG9tLmRldGFjaCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb20udGV4dENvbnRlbnQgPSByZXN1bHQgJiYgcmVzdWx0LnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJVmlzaXRvciB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIGF0dHJpYnV0ZUJpbmRpbmdzID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBjaGlsZEJpbmRpbmdzOiBSZS5CaW5kaW5nW10gPSBbXTtcclxuICAgICAgICBwcml2YXRlIGV2ZW50cyA9IHt9O1xyXG4gICAgICAgIHByaXZhdGUgYXBwZW5kQ2hpbGQgPSBkb20gPT4gdGhpcy5kb20uYXBwZW5kQ2hpbGQoZG9tKTtcclxuICAgICAgICBwcml2YXRlIGNsYXNzQmluZGluZyA9IG5ldyBDbGFzc0JpbmRpbmcodGhpcyk7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHRhZ05hbWU6IHN0cmluZywgcHJpdmF0ZSBuczogc3RyaW5nID0gbnVsbCkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICBpZiAobnMgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb20gPSAoPGFueT5kb2N1bWVudCkuY3JlYXRlRWxlbWVudE5TKG5zLCB0YWdOYW1lLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgZXZlbnROYW1lcyA9IFtcImNsaWNrXCIsIFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJibHVyXCIsIFwiY2hhbmdlXCJdO1xyXG5cclxuICAgICAgICBhdHRyKG5hbWUsIGFzdCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJjbGFzc1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzQmluZGluZy5zZXRCYXNlQ2xhc3MoYXN0KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lLnN0YXJ0c1dpdGgoXCJjbGFzcy5cIikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NCaW5kaW5nLmFkZENsYXNzKG5hbWUuc3Vic3RyKDYpLCBhc3QpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRhZ0JpbmRpbmcuZXZlbnROYW1lcy5pbmRleE9mKG5hbWUpID49IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBldmVudEJpbmRpbmcgPSBuZXcgRXZlbnRCaW5kaW5nKHRoaXMsIG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLnB1c2goZXZlbnRCaW5kaW5nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyQmluZGluZyA9IG5ldyBBdHRyaWJ1dGVCaW5kaW5nKHRoaXMsIG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLnB1c2goYXR0ckJpbmRpbmcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uKG5hbWUsIGFzdCk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tuYW1lXSA9IGFzdDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRleHQoYXN0KTogVGV4dEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBUZXh0QmluZGluZyhhc3QpO1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChiaW5kaW5nKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuY29udGV4dClcclxuICAgICAgICAgICAgICAgIGJpbmRpbmcudXBkYXRlKHRoaXMuY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGJpbmRpbmcuZG9tKTtcclxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgY29udGVudChhc3QsIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKTogQ29udGVudEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0ge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50OiB0aGlzLmRvbSxcclxuICAgICAgICAgICAgICAgIGluc2VydChkb20sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcmVudC5hcHBlbmRDaGlsZChkb20pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBiaW5kaW5nID0gbmV3IENvbnRlbnRCaW5kaW5nKGFzdCwgdGFyZ2V0LCBjaGlsZHJlbik7XHJcblxyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmNvbnRleHQpXHJcbiAgICAgICAgICAgICAgICBiaW5kaW5nLnVwZGF0ZSh0aGlzLmNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goYmluZGluZyk7XHJcbiAgICAgICAgICAgIHJldHVybiBiaW5kaW5nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRhZyh0YWdOYW1lOiBzdHJpbmcsIG5zOiBzdHJpbmcsIGF0dHJzLCBvcHRpb25zOiBhbnkpOiBUYWdCaW5kaW5nIHtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUYWdCaW5kaW5nKHRhZ05hbWUsIG5zKTtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2godGFnKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRhZy5hdHRyKGF0dHJzW2ldLm5hbWUsIGF0dHJzW2ldLnRwbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGFnLmRvbSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCk6IHRoaXMge1xyXG4gICAgICAgICAgICBzdXBlci51cGRhdGUoY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNsYXNzQmluZGluZy51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVCaW5kaW5nc1tlXS51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbaV0udXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRvbTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyaWdnZXIobmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAoISFoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gYWNjZXB0KGhhbmRsZXIsIHRoaXMsIHRoaXMuY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQ2xhc3NCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIGNvbmRpdGlvbnMgPSBbXTtcclxuICAgICAgICBwcml2YXRlIG9sZFZhbHVlO1xyXG4gICAgICAgIHByaXZhdGUgYmFzZUNsYXNzVHBsO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVGFnQmluZGluZykge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0QmFzZUNsYXNzKHRwbCkge1xyXG4gICAgICAgICAgICB0aGlzLmJhc2VDbGFzc1RwbCA9IHRwbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFkZENsYXNzKGNsYXNzTmFtZSwgY29uZGl0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29uZGl0aW9ucy5wdXNoKHsgY2xhc3NOYW1lLCBjb25kaXRpb24gfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICBjb25zdCBjbGFzc2VzID0gW107XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuYmFzZUNsYXNzVHBsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBhY2NlcHQodGhpcy5iYXNlQ2xhc3NUcGwsIHRoaXMsIGNvbnRleHQpLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb25kaXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeyBjbGFzc05hbWUsIGNvbmRpdGlvbiB9ID0gdGhpcy5jb25kaXRpb25zW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEhYWNjZXB0KGNvbmRpdGlvbiwgdGhpcywgY29udGV4dCkudmFsdWVPZigpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3Nlcy5sZW5ndGggPiAwID8gam9pbihcIiBcIiwgY2xhc3NlcykgOiBudWxsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzZXRBdHRyaWJ1dGUoYXR0ck5hbWU6IHN0cmluZywgbmV3VmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5vbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnBhcmVudC5kb207XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmV3VmFsdWUgPT09IFwidW5kZWZpbmVkXCIgfHwgbmV3VmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRhZ1thdHRyTmFtZV0gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2xkVmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuY2xhc3NOYW1lID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEV2ZW50QmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBUYWdCaW5kaW5nLCBwcml2YXRlIG5hbWUsIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy5wYXJlbnQuZG9tO1xyXG4gICAgICAgICAgICB0YWcuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLm5hbWUsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGUoYWNjZXB0LCB0aGlzLmV4cHIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChmdW4sIGFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIGlmIChmdW4gPT09IFwiYXNzaWduXCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGFyZ3NbMF0udmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgYXJnc1sxXS5zZXQodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3VwZXIuYXBwKGZ1biwgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBBdHRyaWJ1dGVCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIG9sZFZhbHVlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVGFnQmluZGluZywgcHJpdmF0ZSBuYW1lLCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZShhY2NlcHQsIHRoaXMuZXhwcik7XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHZvaWQgMCAmJiAhIXZhbHVlLnZhbHVlT2YpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubmFtZSA9PT0gXCJjaGVja2VkXCIpIHtcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gISF2YWx1ZSA/IFwiY2hlY2tlZFwiIDogbnVsbDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMub2xkVmFsdWU7XHJcblxyXG4gICAgICAgICAgICB2YXIgYXR0ck5hbWUgPSB0aGlzLm5hbWU7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnBhcmVudC5kb207XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmV3VmFsdWUgPT09IFwidW5kZWZpbmVkXCIgfHwgbmV3VmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRhZ1thdHRyTmFtZV0gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2xkVmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB0YWdbYXR0ck5hbWVdID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgbmV3VmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy9leHBvcnQgZnVuY3Rpb24gaW1wb3J0Vmlldyh2aWV3OiBzdHJpbmcsIC4uLmFyZ3MpOiBhbnkge1xyXG4gICAgLy8gICAgaWYgKCEoXCJpbXBvcnRcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlua1wiKSkpIHtcclxuICAgIC8vICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJIVE1MIGltcG9ydCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcclxuICAgIC8vICAgIH1cclxuXHJcbiAgICAvLyAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xyXG4gICAgLy8gICAgdmFyIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XHJcbiAgICAvLyAgICBsaW5rLnJlbCA9ICdpbXBvcnQnO1xyXG4gICAgLy8gICAgbGluay5ocmVmID0gdmlldztcclxuICAgIC8vICAgIGxpbmsuc2V0QXR0cmlidXRlKCdhc3luYycsIFwiXCIpOyAvLyBtYWtlIGl0IGFzeW5jIVxyXG4gICAgLy8gICAgbGluay5vbmxvYWQgPSBlID0+IHtcclxuICAgIC8vICAgICAgICB2YXIgbGluayA9ICg8YW55PmUudGFyZ2V0KTtcclxuICAgIC8vICAgICAgICBkZWZlcnJlZC5ub3RpZnkobGluay5pbXBvcnQucXVlcnlTZWxlY3RvcihcInRlbXBsYXRlXCIpKTtcclxuICAgIC8vICAgICAgICBsaW5rLm9ubG9hZCA9IG51bGw7XHJcbiAgICAvLyAgICB9XHJcbiAgICAvLyAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspO1xyXG5cclxuICAgIC8vICAgIHJldHVybiBkZWZlcnJlZDtcclxuICAgIC8vfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gam9pbihzZXBhcmF0b3I6IHN0cmluZywgdmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGggPiAwID8gdmFsdWUuc29ydCgpLmpvaW4oc2VwYXJhdG9yKSA6IG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbiAgICAvLyBSZVNoYXJwZXIgcmVzdG9yZSBJbmNvbnNpc3RlbnROYW1pbmdcclxuIl19