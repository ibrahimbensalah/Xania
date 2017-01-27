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
            this.childBindings = [];
        }
        DomBinding.insertDom = function (target, dom, idx) {
            if (idx < target.childNodes.length) {
                var current = target.childNodes[idx];
                if (current !== dom) {
                    target.insertBefore(dom, current);
                }
            }
            else {
                target.appendChild(dom);
            }
        };
        DomBinding.prototype.insert = function (binding, dom, idx) {
            var offset = 0;
            for (var i = 0; i < this.childBindings.length; i++) {
                if (this.childBindings[i] === binding)
                    break;
                offset += this.childBindings[i].length;
            }
            DomBinding.insertDom(this.target, dom, offset + idx);
        };
        DomBinding.prototype.text = function (expr) {
            var text = new TextBinding(expr);
            this.childBindings.push(text.map(this));
            return text;
        };
        DomBinding.prototype.content = function (ast, children) {
            var content = new FragmentBinding(ast, children);
            this.childBindings.push(content.map(this));
            return content;
        };
        DomBinding.prototype.tag = function (name, ns, attrs, children) {
            var tag = new TagBinding(name, ns, children);
            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            this.childBindings.push(tag.map(this));
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
        var i;
        if (node.nodeType === 1 && node.nodeName === "TEMPLATE") {
            var content = node["content"];
            var template = new template_1.Template.FragmentTemplate(null);
            for (i = 0; i < content.childNodes.length; i++) {
                var tpl = parseNode(content.childNodes[i]);
                if (tpl)
                    template.child(tpl);
            }
            return template;
        }
        else if (node.nodeType === 1) {
            var elt = node;
            var template_2 = new template_1.Template.TagTemplate(elt.tagName, elt.namespaceURI);
            var fragmentTemplate = null;
            for (i = 0; !!elt.attributes && i < elt.attributes.length; i++) {
                var attribute = elt.attributes[i];
                if (attribute.name === "data-repeat") {
                    fragmentTemplate = new template_1.Template.FragmentTemplate(parseText(attribute.value)).child(template_2);
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
            return fragmentTemplate || template_2;
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
    var FragmentBinding = (function (_super) {
        __extends(FragmentBinding, _super);
        function FragmentBinding(ast, children) {
            var _this = _super.call(this) || this;
            _this.ast = ast;
            _this.children = children;
            _this.fragments = [];
            return _this;
        }
        Object.defineProperty(FragmentBinding.prototype, "length", {
            get: function () {
                var total = 0;
                for (var i = 0; i < this.fragments.length; i++) {
                    total += this.fragments[i].length;
                }
                return total;
            },
            enumerable: true,
            configurable: true
        });
        FragmentBinding.prototype.map = function (parent) {
            this.parent = parent;
            return this;
        };
        FragmentBinding.swap = function (arr, srcIndex, tarIndex) {
            if (srcIndex > tarIndex) {
                this.swap(arr, tarIndex, srcIndex);
            }
            else if (srcIndex < tarIndex) {
                var src = arr[srcIndex];
                arr[srcIndex] = arr[tarIndex];
                arr[tarIndex] = src;
            }
        };
        FragmentBinding.prototype.render = function () {
            var stream = this.ast === null ? [this.context] : fsharp_1.accept(this.ast, this, this.context);
            var fr;
            for (var i = 0; i < stream.length; i++) {
                var context = stream[i];
                var fragment = null;
                for (var e = i; e < this.fragments.length; e++) {
                    fr = this.fragments[e];
                    if (fr.context === context) {
                        fragment = fr;
                        FragmentBinding.swap(this.fragments, e, i);
                        break;
                    }
                }
                if (fragment === null) {
                    fragment = new Fragment(this);
                    this.fragments.push(fragment);
                    FragmentBinding.swap(this.fragments, this.fragments.length - 1, i);
                }
                fragment.update(context);
            }
            return stream;
        };
        FragmentBinding.prototype.insert = function (fragment, dom, idx) {
            if (this.parent) {
                var offset = 0;
                for (var i = 0; i < this.fragments.length; i++) {
                    if (this.fragments[i] === fragment)
                        break;
                    offset += this.fragments[i].length;
                }
                this.parent.insert(this, dom, offset + idx);
            }
        };
        return FragmentBinding;
    }(reactive_1.Reactive.Binding));
    Dom.FragmentBinding = FragmentBinding;
    var Fragment = (function () {
        function Fragment(owner) {
            this.owner = owner;
            this.bindings = [];
            for (var e = 0; e < this.owner.children.length; e++) {
                this.bindings[e] =
                    owner.children[e].accept(this, e).map(this);
            }
        }
        Object.defineProperty(Fragment.prototype, "length", {
            get: function () {
                var total = 0;
                for (var j = 0; j < this.bindings.length; j++) {
                    total += this.bindings[j].length;
                }
                return total;
            },
            enumerable: true,
            configurable: true
        });
        Fragment.prototype.update = function (context) {
            this.context = context;
            for (var e = 0; e < this.owner.children.length; e++) {
                this.bindings[e].update(context);
            }
            return this;
        };
        Fragment.prototype.insert = function (binding, dom, index) {
            var offset = 0;
            for (var i = 0; i < this.bindings.length; i++) {
                if (this.bindings[i] === binding)
                    break;
                offset += this.bindings[i].length;
            }
            this.owner.insert(this, dom, offset + index);
        };
        Fragment.prototype.text = function (ast, childIndex) {
            return new TextBinding(ast);
        };
        Fragment.prototype.content = function (ast, children, childIndex) {
            return new FragmentBinding(ast, children);
        };
        Fragment.prototype.tag = function (tagName, ns, attrs, children, childIndex) {
            var tag = new TagBinding(tagName, ns, children);
            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            return tag;
        };
        return Fragment;
    }());
    var TextBinding = (function (_super) {
        __extends(TextBinding, _super);
        function TextBinding(expr) {
            var _this = _super.call(this) || this;
            _this.expr = expr;
            _this.length = 1;
            _this.textNode = document.createTextNode("");
            return _this;
        }
        TextBinding.prototype.map = function (target) {
            this.target = target;
            this.target.insert(this, this.textNode, 0);
            return this;
        };
        TextBinding.prototype.render = function () {
            var result = this.evaluate(fsharp_1.accept, this.expr);
            this.textNode.textContent = result && result.valueOf();
        };
        return TextBinding;
    }(reactive_1.Reactive.Binding));
    Dom.TextBinding = TextBinding;
    var TagBinding = (function (_super) {
        __extends(TagBinding, _super);
        function TagBinding(tagName, ns, childBindings) {
            if (ns === void 0) { ns = null; }
            if (childBindings === void 0) { childBindings = []; }
            var _this = _super.call(this) || this;
            _this.ns = ns;
            _this.childBindings = childBindings;
            _this.attributeBindings = [];
            _this.events = {};
            _this.classBinding = new ClassBinding(_this);
            _this.length = 1;
            if (ns === null)
                _this.tagNode = document.createElement(tagName);
            else {
                _this.tagNode = document.createElementNS(ns, tagName.toLowerCase());
            }
            for (var i = 0; i < childBindings.length; i++) {
                childBindings[i].map(_this);
            }
            return _this;
        }
        TagBinding.prototype.map = function (target) {
            this.target = target;
            this.target.insert(this, this.tagNode, 0);
            return this;
        };
        TagBinding.prototype.child = function (child) {
            this.childBindings.push(child.map(this));
            return this;
        };
        TagBinding.prototype.attr = function (name, ast) {
            if (name === "class") {
                this.classBinding.setBaseClass(ast);
            }
            else if (name.startsWith("class.")) {
                this.classBinding.addClass(name.substr(6), ast);
            }
            else if (TagBinding.eventNames.indexOf(name) >= 0) {
                var eventBinding = new EventBinding(this.tagNode, name, ast);
                this.attributeBindings.push(eventBinding);
            }
            else {
                var attrBinding = new AttributeBinding(this, name, ast);
                this.attributeBindings.push(attrBinding);
            }
            return this;
        };
        TagBinding.prototype.insert = function (binding, dom, idx) {
            var offset = 0;
            for (var i = 0; i < this.childBindings.length; i++) {
                if (this.childBindings[i] === binding)
                    break;
                offset += this.childBindings[i].length;
            }
            DomBinding.insertDom(this.tagNode, dom, offset + idx);
        };
        TagBinding.prototype.on = function (name, ast) {
            this.events[name] = ast;
            return this;
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
            var tag = this.parent.tagNode;
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
        function EventBinding(tagNode, name, expr) {
            var _this = _super.call(this) || this;
            _this.name = name;
            _this.expr = expr;
            tagNode.addEventListener(_this.name, function () {
                _this.evaluate(fsharp_1.accept, _this.expr);
            });
            return _this;
        }
        EventBinding.prototype.render = function () {
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
            var tag = this.parent.tagNode;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx1Q0FBMkM7QUFDM0MsbUNBQWlDO0FBQ2pDLHVDQUFxQztBQUNyQyxtQ0FBdUM7QUFFdkMsSUFBYyxHQUFHLENBa2pCaEI7QUFsakJELFdBQWMsR0FBRztJQUViLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFlL0I7UUFHSSxvQkFBb0IsTUFBTTtZQUFOLFdBQU0sR0FBTixNQUFNLENBQUE7WUFGbEIsa0JBQWEsR0FBa0IsRUFBRSxDQUFDO1FBRzFDLENBQUM7UUFFTSxvQkFBUyxHQUFoQixVQUFpQixNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUc7WUFDN0IsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDakMsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckMsRUFBRSxDQUFDLENBQUMsT0FBTyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ2xCLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0wsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNMLENBQUM7UUFFRCwyQkFBTSxHQUFOLFVBQU8sT0FBb0IsRUFBRSxHQUFHLEVBQUUsR0FBVztZQUN6QyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDZixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxDQUFDO29CQUNsQyxLQUFLLENBQUM7Z0JBQ1YsTUFBTSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQzNDLENBQUM7WUFDRCxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQztRQUN6RCxDQUFDO1FBRUQseUJBQUksR0FBSixVQUFLLElBQUk7WUFDTCxJQUFJLElBQUksR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQ0QsNEJBQU8sR0FBUCxVQUFRLEdBQUcsRUFBRSxRQUEwQjtZQUNuQyxJQUFJLE9BQU8sR0FBRyxJQUFJLGVBQWUsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDbkIsQ0FBQztRQUNELHdCQUFHLEdBQUgsVUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxRQUFRO1lBQ3pCLElBQUksR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFN0MsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsR0FBRyxDQUFDO1FBQ2YsQ0FBQztRQUNMLGlCQUFDO0lBQUQsQ0FBQyxBQS9DRCxJQStDQztJQUVELGVBQXNCLElBQUk7UUFDdEIsTUFBTSxDQUFDO1lBQ0gsUUFBUSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUM7WUFDekIsSUFBSSxZQUFDLE1BQU0sRUFBRSxLQUFLO2dCQUNkLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0RSxDQUFDO1NBQ0ssQ0FBQztJQUNmLENBQUM7SUFQZSxTQUFLLFFBT3BCLENBQUE7SUFFRCxtQkFBbUIsSUFBSTtRQUNuQixJQUFJLEtBQUssR0FBVSxFQUFFLENBQUM7UUFFdEIsSUFBSSxVQUFVLEdBQUcsVUFBQyxDQUFDO1lBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2pCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUNiLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsQ0FBQyxDQUFDO1FBRUYsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsT0FBTyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzFCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNiLEVBQUUsQ0FBQyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7b0JBQ2YsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBRTlDLE1BQU0sR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDdkMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ1gsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDckIsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDSixNQUFNLElBQUksV0FBVyxDQUFDLG1EQUFtRCxHQUFHLE1BQU0sQ0FBQyxDQUFDO2dCQUN4RixDQUFDO1lBQ0wsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLEtBQUssQ0FBQztZQUNWLENBQUM7UUFDTCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7WUFDbkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVwQixNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxtQkFBbUIsVUFBZ0MsRUFBRSxJQUFVO1FBQzNELElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdkIsSUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBR3pDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksVUFBVSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3ZILElBQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDNUMsQ0FBQztJQUNMLENBQUM7SUFFRCxtQkFBbUIsSUFBVTtRQUN6QixJQUFJLENBQVMsQ0FBQztRQUNkLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFNLE9BQU8sR0FBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdDLElBQUksUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuRCxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM3QyxJQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUM7b0JBQ0osUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUNwQixDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFNLEdBQUcsR0FBZ0IsSUFBSSxDQUFDO1lBRTlCLElBQU0sVUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDekUsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7WUFFNUIsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDN0QsSUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDO29CQUNuQyxnQkFBZ0IsR0FBRyxJQUFJLG1CQUFRLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFRLENBQUMsQ0FBQztnQkFDakcsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDSixTQUFTLENBQUMsVUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0wsQ0FBQztZQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDN0MsSUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDO29CQUNOLFVBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUVELE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxVQUFRLENBQUM7UUFDeEMsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUNuQyxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLElBQU0sS0FBRyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQUMsS0FBRyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM5RCxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sQ0FBQyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVEO1FBQXFDLG1DQUFVO1FBWTNDLHlCQUFvQixHQUFHLEVBQVMsUUFBMEI7WUFBMUQsWUFDSSxpQkFBTyxTQUNWO1lBRm1CLFNBQUcsR0FBSCxHQUFHLENBQUE7WUFBUyxjQUFRLEdBQVIsUUFBUSxDQUFrQjtZQVhuRCxlQUFTLEdBQWUsRUFBRSxDQUFDOztRQWFsQyxDQUFDO1FBVkQsc0JBQUksbUNBQU07aUJBQVY7Z0JBQ0ksSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNkLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDN0MsS0FBSyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUN0QyxDQUFDO2dCQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDakIsQ0FBQzs7O1dBQUE7UUFNRCw2QkFBRyxHQUFILFVBQUksTUFBc0I7WUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFFckIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRWMsb0JBQUksR0FBbkIsVUFBb0IsR0FBZSxFQUFFLFFBQVEsRUFBRSxRQUFRO1lBQ25ELEVBQUUsQ0FBQyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUNELElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN4QixHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM5QixHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBQ3hCLENBQUM7UUFDTCxDQUFDO1FBRUQsZ0NBQU0sR0FBTjtZQUNJLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLGVBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkYsSUFBSSxFQUFZLENBQUM7WUFDakIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFeEIsSUFBSSxRQUFRLEdBQWEsSUFBSSxDQUFDO2dCQUM5QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzdDLEVBQUUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN2QixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUM7d0JBQ3pCLFFBQVEsR0FBRyxFQUFFLENBQUM7d0JBQ2QsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzt3QkFDM0MsS0FBSyxDQUFDO29CQUNWLENBQUM7Z0JBQ0wsQ0FBQztnQkFFRCxFQUFFLENBQUMsQ0FBQyxRQUFRLEtBQUssSUFBb0IsQ0FBQyxDQUFDLENBQUM7b0JBQ3BDLFFBQVEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzlCLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLENBQUM7Z0JBRUQsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QixDQUFDO1lBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNsQixDQUFDO1FBRUQsZ0NBQU0sR0FBTixVQUFPLFFBQWtCLEVBQUUsR0FBRyxFQUFFLEdBQUc7WUFDL0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ2QsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUNmLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDN0MsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUM7d0JBQy9CLEtBQUssQ0FBQztvQkFDVixNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7Z0JBQ3ZDLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDaEQsQ0FBQztRQUNMLENBQUM7UUFDTCxzQkFBQztJQUFELENBQUMsQUF4RUQsQ0FBcUMsbUJBQUUsQ0FBQyxPQUFPLEdBd0U5QztJQXhFWSxtQkFBZSxrQkF3RTNCLENBQUE7SUFFRDtRQUlJLGtCQUFvQixLQUFzQjtZQUF0QixVQUFLLEdBQUwsS0FBSyxDQUFpQjtZQUhuQyxhQUFRLEdBQWtCLEVBQUUsQ0FBQztZQUloQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDWixLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRSxDQUFDO1FBQ0wsQ0FBQztRQUVELHNCQUFJLDRCQUFNO2lCQUFWO2dCQUNJLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztnQkFDZCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzVDLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFDckMsQ0FBQztnQkFDRCxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ2pCLENBQUM7OztXQUFBO1FBRUQseUJBQU0sR0FBTixVQUFPLE9BQU87WUFDVixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUN2QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQyxDQUFDO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQseUJBQU0sR0FBTixVQUFPLE9BQW9CLEVBQUUsR0FBRyxFQUFFLEtBQUs7WUFDbkMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM1QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sQ0FBQztvQkFDN0IsS0FBSyxDQUFDO2dCQUNWLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUN0QyxDQUFDO1lBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVNLHVCQUFJLEdBQVgsVUFBWSxHQUFHLEVBQUUsVUFBa0I7WUFDL0IsTUFBTSxDQUFDLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFTSwwQkFBTyxHQUFkLFVBQWUsR0FBRyxFQUFFLFFBQVEsRUFBRSxVQUFrQjtZQUM1QyxNQUFNLENBQUMsSUFBSSxlQUFlLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFTSxzQkFBRyxHQUFWLFVBQVcsT0FBZSxFQUFFLEVBQVUsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFVBQWtCO1lBQ3ZFLElBQUksR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFaEQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDZixDQUFDO1FBQ0wsZUFBQztJQUFELENBQUMsQUF0REQsSUFzREM7SUFNRDtRQUFpQywrQkFBVTtRQUt2QyxxQkFBb0IsSUFBSTtZQUF4QixZQUNJLGlCQUFPLFNBRVY7WUFIbUIsVUFBSSxHQUFKLElBQUksQ0FBQTtZQUZqQixZQUFNLEdBQUcsQ0FBQyxDQUFDO1lBSWQsS0FBSSxDQUFDLFFBQVEsR0FBUyxRQUFTLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDOztRQUN2RCxDQUFDO1FBRUQseUJBQUcsR0FBSCxVQUFJLE1BQXNCO1lBQ3RCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELDRCQUFNLEdBQU47WUFDSSxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzRCxDQUFDO1FBQ0wsa0JBQUM7SUFBRCxDQUFDLEFBcEJELENBQWlDLG1CQUFFLENBQUMsT0FBTyxHQW9CMUM7SUFwQlksZUFBVyxjQW9CdkIsQ0FBQTtJQUVEO1FBQWdDLDhCQUFVO1FBUXRDLG9CQUFZLE9BQWUsRUFBVSxFQUFpQixFQUFVLGFBQWlDO1lBQTVELG1CQUFBLEVBQUEsU0FBaUI7WUFBVSw4QkFBQSxFQUFBLGtCQUFpQztZQUFqRyxZQUNJLGlCQUFPLFNBVVY7WUFYb0MsUUFBRSxHQUFGLEVBQUUsQ0FBZTtZQUFVLG1CQUFhLEdBQWIsYUFBYSxDQUFvQjtZQU56Rix1QkFBaUIsR0FBRyxFQUFFLENBQUM7WUFDdkIsWUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNaLGtCQUFZLEdBQUcsSUFBSSxZQUFZLENBQUMsS0FBSSxDQUFDLENBQUM7WUFFdkMsWUFBTSxHQUFHLENBQUMsQ0FBQztZQUlkLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxJQUFJLENBQUM7Z0JBQ1osS0FBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxDQUFDO2dCQUNGLEtBQUksQ0FBQyxPQUFPLEdBQVMsUUFBUyxDQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDOUUsQ0FBQztZQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM1QyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUksQ0FBQyxDQUFDO1lBQy9CLENBQUM7O1FBQ0wsQ0FBQztRQUVELHdCQUFHLEdBQUgsVUFBSSxNQUFzQjtZQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUVyQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUxQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCwwQkFBSyxHQUFMLFVBQU0sS0FBa0I7WUFDcEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRXpDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUlELHlCQUFJLEdBQUosVUFBSyxJQUFJLEVBQUUsR0FBRztZQUNWLEVBQUUsQ0FBQyxDQUFDLElBQUksS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNuQixJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN4QyxDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3BELENBQUM7WUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxZQUFZLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzdELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDOUMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksV0FBVyxHQUFHLElBQUksZ0JBQWdCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDeEQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBRUQsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsMkJBQU0sR0FBTixVQUFPLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRztZQUNwQixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDZixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxDQUFDO29CQUNsQyxLQUFLLENBQUM7Z0JBQ1YsTUFBTSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQzNDLENBQUM7WUFDRCxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsdUJBQUUsR0FBRixVQUFHLElBQUksRUFBRSxHQUFHO1lBQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7WUFFeEIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsMkJBQU0sR0FBTixVQUFPLE9BQU87WUFDVixpQkFBTSxNQUFNLFlBQUMsT0FBTyxDQUFDLENBQUM7WUFFdEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUMsQ0FBQztZQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELDJCQUFNLEdBQU4sVUFBTyxPQUFPO1FBQ2QsQ0FBQztRQUVELDRCQUFPLEdBQVAsVUFBUSxJQUFJO1lBQ1IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDWixJQUFJLE1BQU0sR0FBRyxlQUFNLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRWpELEVBQUUsQ0FBQyxDQUFDLE9BQU8sTUFBTSxLQUFLLFVBQVUsQ0FBQztvQkFDN0IsTUFBTSxFQUFFLENBQUM7WUFDakIsQ0FBQztRQUNMLENBQUM7UUFDTCxpQkFBQztJQUFELENBQUMsQUFoR0QsQ0FBZ0MsbUJBQUUsQ0FBQyxPQUFPO0lBbUMvQixxQkFBVSxHQUFHLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBbkNoRSxjQUFVLGFBZ0d0QixDQUFBO0lBRUQ7UUFBa0MsZ0NBQVU7UUFNeEMsc0JBQW9CLE1BQWtCO1lBQXRDLFlBQ0ksaUJBQU8sU0FDVjtZQUZtQixZQUFNLEdBQU4sTUFBTSxDQUFZO1lBSjlCLGdCQUFVLEdBQUcsRUFBRSxDQUFDOztRQU14QixDQUFDO1FBRUQsbUNBQVksR0FBWixVQUFhLEdBQUc7WUFDWixJQUFJLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQztRQUM1QixDQUFDO1FBRUQsK0JBQVEsR0FBUixVQUFTLFNBQVMsRUFBRSxTQUFTO1lBQ3pCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxXQUFBLEVBQUUsU0FBUyxXQUFBLEVBQUUsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCw2QkFBTSxHQUFOLFVBQU8sT0FBTztZQUNWLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNuQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLElBQUksS0FBSyxHQUFHLGVBQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDL0QsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QixDQUFDO1lBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUMxQyxJQUFBLHVCQUE2QyxFQUEzQyx3QkFBUyxFQUFFLHdCQUFTLENBQXdCO2dCQUNsRCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMvQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM1QixDQUFDO1lBQ0wsQ0FBQztZQUVELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUVNLG1DQUFZLEdBQW5CLFVBQW9CLFFBQWdCLEVBQUUsUUFBUTtZQUMxQyxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBRTdCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQzlCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sUUFBUSxLQUFLLFdBQVcsSUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdkQsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO2dCQUN2QixHQUFHLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xDLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixFQUFFLENBQUMsQ0FBQyxPQUFPLFFBQVEsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUM5QyxJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztvQkFDdEIsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvQixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNKLEdBQUcsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO2dCQUM3QixDQUFDO1lBQ0wsQ0FBQztZQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQzdCLENBQUM7UUFFTCxtQkFBQztJQUFELENBQUMsQUF2REQsQ0FBa0MsbUJBQUUsQ0FBQyxPQUFPLEdBdUQzQztJQXZEWSxnQkFBWSxlQXVEeEIsQ0FBQTtJQUVEO1FBQWtDLGdDQUFVO1FBQ3hDLHNCQUFZLE9BQVksRUFBVSxJQUFJLEVBQVUsSUFBSTtZQUFwRCxZQUNJLGlCQUFPLFNBS1Y7WUFOaUMsVUFBSSxHQUFKLElBQUksQ0FBQTtZQUFVLFVBQUksR0FBSixJQUFJLENBQUE7WUFHaEQsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEtBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQ2hDLEtBQUksQ0FBQyxRQUFRLENBQUMsZUFBTSxFQUFFLEtBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQyxDQUFDLENBQUMsQ0FBQzs7UUFDUCxDQUFDO1FBRUQsNkJBQU0sR0FBTjtRQUNBLENBQUM7UUFFRCwwQkFBRyxHQUFILFVBQUksR0FBRyxFQUFFLElBQVc7WUFDaEIsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUNqQixDQUFDO1lBRUQsTUFBTSxDQUFDLGlCQUFNLEdBQUcsWUFBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUNMLG1CQUFDO0lBQUQsQ0FBQyxBQXJCRCxDQUFrQyxtQkFBRSxDQUFDLE9BQU8sR0FxQjNDO0lBckJZLGdCQUFZLGVBcUJ4QixDQUFBO0lBRUQ7UUFBc0Msb0NBQVU7UUFJNUMsMEJBQW9CLE1BQWtCLEVBQVUsSUFBSSxFQUFVLElBQUk7WUFBbEUsWUFDSSxpQkFBTyxTQUNWO1lBRm1CLFlBQU0sR0FBTixNQUFNLENBQVk7WUFBVSxVQUFJLEdBQUosSUFBSSxDQUFBO1lBQVUsVUFBSSxHQUFKLElBQUksQ0FBQTs7UUFFbEUsQ0FBQztRQUVELGlDQUFNLEdBQU47WUFDSSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFN0MsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7Z0JBQ3RELEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFNUIsSUFBSSxRQUFRLENBQUM7WUFDYixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLFFBQVEsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDMUMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDckIsQ0FBQztZQUVELElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFFN0IsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUN6QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUM5QixFQUFFLENBQUMsQ0FBQyxPQUFPLFFBQVEsS0FBSyxXQUFXLElBQUksUUFBUSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztnQkFDdkIsR0FBRyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsQyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osRUFBRSxDQUFDLENBQUMsT0FBTyxRQUFRLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQztvQkFDbEMsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDOUMsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7b0JBQ3RCLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDL0IsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFFSixHQUFHLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDekMsQ0FBQztZQUNMLENBQUM7WUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUM3QixDQUFDO1FBQ0wsdUJBQUM7SUFBRCxDQUFDLEFBeENELENBQXNDLG1CQUFFLENBQUMsT0FBTyxHQXdDL0M7SUF4Q1ksb0JBQWdCLG1CQXdDNUIsQ0FBQTtBQXFCTCxDQUFDLEVBbGpCYSxHQUFHLEdBQUgsV0FBRyxLQUFILFdBQUcsUUFrakJoQjtBQUVELGNBQXFCLFNBQWlCLEVBQUUsS0FBSztJQUN6QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbEUsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUxELG9CQUtDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29yZSB9IGZyb20gJy4vY29yZSdcclxuaW1wb3J0IHsgUmVhY3RpdmUgYXMgUmUgfSBmcm9tICcuL3JlYWN0aXZlJ1xyXG5pbXBvcnQgeyBhY2NlcHQgfSBmcm9tICcuL2ZzaGFycCdcclxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tICcuL3RlbXBsYXRlJ1xyXG5pbXBvcnQgeyBmc2hhcnAgYXMgZnMgfSBmcm9tIFwiLi9mc2hhcnBcIlxyXG5cclxuZXhwb3J0IG1vZHVsZSBEb20ge1xyXG5cclxuICAgIHZhciBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudDtcclxuXHJcbiAgICBpbnRlcmZhY2UgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIGxlbmd0aDtcclxuICAgICAgICBtYXAocGFyZW50KSA6IHRoaXM7XHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJVmlzaXRvciBleHRlbmRzIFRlbXBsYXRlLklWaXNpdG9yPElEb21CaW5kaW5nPiB7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElWaWV3IHtcclxuICAgICAgICBiaW5kKHRhcmdldDogeyBpbnNlcnQoZG9tLCBpZHgpIH0sIHN0b3JlKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBEb21CaW5kaW5nIHtcclxuICAgICAgICBwcml2YXRlIGNoaWxkQmluZGluZ3M6IElEb21CaW5kaW5nW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YXJnZXQpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBpbnNlcnREb20odGFyZ2V0LCBkb20sIGlkeCkge1xyXG4gICAgICAgICAgICBpZiAoaWR4IDwgdGFyZ2V0LmNoaWxkTm9kZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudCA9IHRhcmdldC5jaGlsZE5vZGVzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAhPT0gZG9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZShkb20sIGN1cnJlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGRvbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChiaW5kaW5nOiBJRG9tQmluZGluZywgZG9tLCBpZHg6IG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkQmluZGluZ3NbaV0gPT09IGJpbmRpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5jaGlsZEJpbmRpbmdzW2ldLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBEb21CaW5kaW5nLmluc2VydERvbSh0aGlzLnRhcmdldCwgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dChleHByKTogVGV4dEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGV4dCA9IG5ldyBUZXh0QmluZGluZyhleHByKTtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2godGV4dC5tYXAodGhpcykpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29udGVudChhc3QsIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKTogRnJhZ21lbnRCaW5kaW5nIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBuZXcgRnJhZ21lbnRCaW5kaW5nKGFzdCwgY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjb250ZW50Lm1hcCh0aGlzKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YWcobmFtZSwgbnMsIGF0dHJzLCBjaGlsZHJlbik6IFRhZ0JpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRhZ0JpbmRpbmcobmFtZSwgbnMsIGNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRhZy5hdHRyKGF0dHJzW2ldLm5hbWUsIGF0dHJzW2ldLnRwbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncy5wdXNoKHRhZy5tYXAodGhpcykpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgZnVuY3Rpb24gcGFyc2Uobm9kZSk6IElWaWV3IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcGFyc2VOb2RlKG5vZGUpLFxyXG4gICAgICAgICAgICBiaW5kKHRhcmdldCwgc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlLmFjY2VwdChuZXcgRG9tQmluZGluZyh0YXJnZXQpKS51cGRhdGUoc3RvcmUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBhcyBJVmlldztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZVRleHQodGV4dCk6IGFueVtdIHtcclxuICAgICAgICB2YXIgcGFydHM6IGFueVtdID0gW107XHJcblxyXG4gICAgICAgIHZhciBhcHBlbmRUZXh0ID0gKHgpID0+IHtcclxuICAgICAgICAgICAgdmFyIHMgPSB4LnRyaW0oKTtcclxuICAgICAgICAgICAgaWYgKHMubGVuZ3RoID4gMClcclxuICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goeCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgd2hpbGUgKG9mZnNldCA8IHRleHQubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciBiZWdpbiA9IHRleHQuaW5kZXhPZihcInt7XCIsIG9mZnNldCk7XHJcbiAgICAgICAgICAgIGlmIChiZWdpbiA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYmVnaW4gPiBvZmZzZXQpXHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kVGV4dCh0ZXh0LnN1YnN0cmluZyhvZmZzZXQsIGJlZ2luKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gYmVnaW4gKyAyO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gdGV4dC5pbmRleE9mKFwifX1cIiwgb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgIGlmIChlbmQgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goZnModGV4dC5zdWJzdHJpbmcob2Zmc2V0LCBlbmQpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gZW5kICsgMjtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFwiRXhwZWN0ZWQgJ319JyBidXQgbm90IGZvdW5kIHN0YXJ0aW5nIGZyb20gaW5kZXg6IFwiICsgb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGFwcGVuZFRleHQodGV4dC5zdWJzdHJpbmcob2Zmc2V0KSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMSlcclxuICAgICAgICAgICAgcmV0dXJuIHBhcnRzWzBdO1xyXG5cclxuICAgICAgICByZXR1cm4gcGFydHM7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VBdHRyKHRhZ0VsZW1lbnQ6IFRlbXBsYXRlLlRhZ1RlbXBsYXRlLCBhdHRyOiBBdHRyKSB7XHJcbiAgICAgICAgY29uc3QgbmFtZSA9IGF0dHIubmFtZTtcclxuICAgICAgICBjb25zdCB0cGwgPSBwYXJzZVRleHQoYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgdGFnRWxlbWVudC5hdHRyKG5hbWUsIHRwbCB8fCBhdHRyLnZhbHVlKTtcclxuXHJcbiAgICAgICAgLy8gY29udmVudGlvbnNcclxuICAgICAgICBpZiAoISF0YWdFbGVtZW50Lm5hbWUubWF0Y2goL15pbnB1dCQvaSkgJiYgISFhdHRyLm5hbWUubWF0Y2goL15uYW1lJC9pKSAmJiB0YWdFbGVtZW50LmdldEF0dHJpYnV0ZShcInZhbHVlXCIpICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZUFjY2Vzc29yID0gcGFyc2VUZXh0KGF0dHIudmFsdWUpO1xyXG4gICAgICAgICAgICB0YWdFbGVtZW50LmF0dHIoXCJ2YWx1ZVwiLCB2YWx1ZUFjY2Vzc29yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VOb2RlKG5vZGU6IE5vZGUpOiBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICAgICAgdmFyIGk6IG51bWJlcjtcclxuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBub2RlLm5vZGVOYW1lID09PSBcIlRFTVBMQVRFXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IDxIVE1MRWxlbWVudD5ub2RlW1wiY29udGVudFwiXTtcclxuICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlLkZyYWdtZW50VGVtcGxhdGUobnVsbCk7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjb250ZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciB0cGwgPSBwYXJzZU5vZGUoY29udGVudC5jaGlsZE5vZGVzW2ldKTtcclxuICAgICAgICAgICAgICAgIGlmICh0cGwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUuY2hpbGQodHBsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsdCA9IDxIVE1MRWxlbWVudD5ub2RlO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUuVGFnVGVtcGxhdGUoZWx0LnRhZ05hbWUsIGVsdC5uYW1lc3BhY2VVUkkpO1xyXG4gICAgICAgICAgICB2YXIgZnJhZ21lbnRUZW1wbGF0ZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyAhIWVsdC5hdHRyaWJ1dGVzICYmIGkgPCBlbHQuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGF0dHJpYnV0ZSA9IGVsdC5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0dHJpYnV0ZS5uYW1lID09PSBcImRhdGEtcmVwZWF0XCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudFRlbXBsYXRlID0gbmV3IFRlbXBsYXRlLkZyYWdtZW50VGVtcGxhdGUocGFyc2VUZXh0KGF0dHJpYnV0ZS52YWx1ZSkpLmNoaWxkKHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VBdHRyKHRlbXBsYXRlLCBhdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IGVsdC5jaGlsZE5vZGVzLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBwYXJzZU5vZGUoZWx0LmNoaWxkTm9kZXNbZV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkKVxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLmFkZENoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZyYWdtZW50VGVtcGxhdGUgfHwgdGVtcGxhdGU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZXh0Q29udGVudCA9IG5vZGUudGV4dENvbnRlbnQ7XHJcbiAgICAgICAgICAgIGlmICh0ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdHBsID0gcGFyc2VUZXh0KHRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKHRwbCB8fCBub2RlLnRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRnJhZ21lbnRCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyBpbXBsZW1lbnRzIElEb21CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgZnJhZ21lbnRzOiBGcmFnbWVudFtdID0gW107XHJcbiAgICAgICAgcHVibGljIHBhcmVudDogSUJpbmRpbmdUYXJnZXQ7XHJcblxyXG4gICAgICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRvdGFsICs9IHRoaXMuZnJhZ21lbnRzW2ldLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFzdCwgcHVibGljIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXAocGFyZW50OiBJQmluZGluZ1RhcmdldCk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgc3dhcChhcnI6IEZyYWdtZW50W10sIHNyY0luZGV4LCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICBpZiAoc3JjSW5kZXggPiB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zd2FwKGFyciwgdGFySW5kZXgsIHNyY0luZGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChzcmNJbmRleCA8IHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3JjID0gYXJyW3NyY0luZGV4XTtcclxuICAgICAgICAgICAgICAgIGFycltzcmNJbmRleF0gPSBhcnJbdGFySW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgYXJyW3RhckluZGV4XSA9IHNyYztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICB2YXIgc3RyZWFtID0gdGhpcy5hc3QgPT09IG51bGwgPyBbdGhpcy5jb250ZXh0XSA6IGFjY2VwdCh0aGlzLmFzdCwgdGhpcywgdGhpcy5jb250ZXh0KTtcclxuICAgICAgICAgICAgdmFyIGZyOiBGcmFnbWVudDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJlYW0ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gc3RyZWFtW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmcmFnbWVudDogRnJhZ21lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZSA9IGk7IGUgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyID0gdGhpcy5mcmFnbWVudHNbZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZyLmNvbnRleHQgPT09IGNvbnRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBmcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgRnJhZ21lbnRCaW5kaW5nLnN3YXAodGhpcy5mcmFnbWVudHMsIGUsIGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGZyYWdtZW50ID09PSBudWxsIC8qIG5vdCBmb3VuZCAqLykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gbmV3IEZyYWdtZW50KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzLnB1c2goZnJhZ21lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIEZyYWdtZW50QmluZGluZy5zd2FwKHRoaXMuZnJhZ21lbnRzLCB0aGlzLmZyYWdtZW50cy5sZW5ndGggLSAxLCBpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmcmFnbWVudC51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdHJlYW07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnNlcnQoZnJhZ21lbnQ6IEZyYWdtZW50LCBkb20sIGlkeCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5wYXJlbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmZyYWdtZW50c1tpXSA9PT0gZnJhZ21lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmZyYWdtZW50c1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIEZyYWdtZW50IHtcclxuICAgICAgICBwdWJsaWMgYmluZGluZ3M6IElEb21CaW5kaW5nW10gPSBbXTtcclxuICAgICAgICBwdWJsaWMgY29udGV4dDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBvd25lcjogRnJhZ21lbnRCaW5kaW5nKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgdGhpcy5vd25lci5jaGlsZHJlbi5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tlXSA9XHJcbiAgICAgICAgICAgICAgICAgICAgb3duZXIuY2hpbGRyZW5bZV0uYWNjZXB0KHRoaXMgYXMgSVZpc2l0b3IsIGUpLm1hcCh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICAgICAgdmFyIHRvdGFsID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmJpbmRpbmdzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICB0b3RhbCArPSB0aGlzLmJpbmRpbmdzW2pdLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IHRoaXMub3duZXIuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZV0udXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5zZXJ0KGJpbmRpbmc6IElEb21CaW5kaW5nLCBkb20sIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYmluZGluZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuYmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMub3duZXIuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaW5kZXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRleHQoYXN0LCBjaGlsZEluZGV4OiBudW1iZXIpOiBUZXh0QmluZGluZyB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVGV4dEJpbmRpbmcoYXN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBjb250ZW50KGFzdCwgY2hpbGRyZW4sIGNoaWxkSW5kZXg6IG51bWJlcik6IEZyYWdtZW50QmluZGluZyB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgRnJhZ21lbnRCaW5kaW5nKGFzdCwgY2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRhZyh0YWdOYW1lOiBzdHJpbmcsIG5zOiBzdHJpbmcsIGF0dHJzLCBjaGlsZHJlbiwgY2hpbGRJbmRleDogbnVtYmVyKTogVGFnQmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyh0YWdOYW1lLCBucywgY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGFnLmF0dHIoYXR0cnNbaV0ubmFtZSwgYXR0cnNbaV0udHBsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElCaW5kaW5nVGFyZ2V0IHtcclxuICAgICAgICBpbnNlcnQoc2VuZGVyOiBJRG9tQmluZGluZywgZG9tLCBpZHgpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUZXh0QmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJRG9tQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIHRleHROb2RlO1xyXG4gICAgICAgIHByb3RlY3RlZCB0YXJnZXQ6IElCaW5kaW5nVGFyZ2V0O1xyXG4gICAgICAgIHB1YmxpYyBsZW5ndGggPSAxO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICAgICAgdGhpcy50ZXh0Tm9kZSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcCh0YXJnZXQ6IElCaW5kaW5nVGFyZ2V0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xyXG4gICAgICAgICAgICB0aGlzLnRhcmdldC5pbnNlcnQodGhpcywgdGhpcy50ZXh0Tm9kZSwgMCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmV2YWx1YXRlKGFjY2VwdCwgdGhpcy5leHByKTtcclxuICAgICAgICAgICAgdGhpcy50ZXh0Tm9kZS50ZXh0Q29udGVudCA9IHJlc3VsdCAmJiByZXN1bHQudmFsdWVPZigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJRG9tQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIHRhZ05vZGU7XHJcbiAgICAgICAgcHJpdmF0ZSBhdHRyaWJ1dGVCaW5kaW5ncyA9IFtdO1xyXG4gICAgICAgIHByaXZhdGUgZXZlbnRzID0ge307XHJcbiAgICAgICAgcHJpdmF0ZSBjbGFzc0JpbmRpbmcgPSBuZXcgQ2xhc3NCaW5kaW5nKHRoaXMpO1xyXG4gICAgICAgIHByb3RlY3RlZCB0YXJnZXQ6IElCaW5kaW5nVGFyZ2V0O1xyXG4gICAgICAgIHB1YmxpYyBsZW5ndGggPSAxO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcih0YWdOYW1lOiBzdHJpbmcsIHByaXZhdGUgbnM6IHN0cmluZyA9IG51bGwsIHByaXZhdGUgY2hpbGRCaW5kaW5nczogSURvbUJpbmRpbmdbXSA9IFtdKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgICAgIGlmIChucyA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHRoaXMudGFnTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YWdOb2RlID0gKDxhbnk+ZG9jdW1lbnQpLmNyZWF0ZUVsZW1lbnROUyhucywgdGFnTmFtZS50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZEJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjaGlsZEJpbmRpbmdzW2ldLm1hcCh0aGlzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFwKHRhcmdldDogSUJpbmRpbmdUYXJnZXQpOiB0aGlzIHtcclxuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRhcmdldC5pbnNlcnQodGhpcywgdGhpcy50YWdOb2RlLCAwKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hpbGQoY2hpbGQ6IElEb21CaW5kaW5nKTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncy5wdXNoKGNoaWxkLm1hcCh0aGlzKSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBldmVudE5hbWVzID0gW1wiY2xpY2tcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcImJsdXJcIiwgXCJjaGFuZ2VcIl07XHJcblxyXG4gICAgICAgIGF0dHIobmFtZSwgYXN0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBcImNsYXNzXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NCaW5kaW5nLnNldEJhc2VDbGFzcyhhc3QpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUuc3RhcnRzV2l0aChcImNsYXNzLlwiKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0JpbmRpbmcuYWRkQ2xhc3MobmFtZS5zdWJzdHIoNiksIGFzdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVGFnQmluZGluZy5ldmVudE5hbWVzLmluZGV4T2YobmFtZSkgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50QmluZGluZyA9IG5ldyBFdmVudEJpbmRpbmcodGhpcy50YWdOb2RlLCBuYW1lLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5wdXNoKGV2ZW50QmluZGluZyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ckJpbmRpbmcgPSBuZXcgQXR0cmlidXRlQmluZGluZyh0aGlzLCBuYW1lLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5wdXNoKGF0dHJCaW5kaW5nKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnNlcnQoYmluZGluZywgZG9tLCBpZHgpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgRG9tQmluZGluZy5pbnNlcnREb20odGhpcy50YWdOb2RlLCBkb20sIG9mZnNldCArIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbihuYW1lLCBhc3QpOiB0aGlzIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHNbbmFtZV0gPSBhc3Q7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIHN1cGVyLnVwZGF0ZShjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3NCaW5kaW5nLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzW2VdLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5nc1tpXS51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyaWdnZXIobmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAoISFoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gYWNjZXB0KGhhbmRsZXIsIHRoaXMsIHRoaXMuY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQ2xhc3NCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIGNvbmRpdGlvbnMgPSBbXTtcclxuICAgICAgICBwcml2YXRlIG9sZFZhbHVlO1xyXG4gICAgICAgIHByaXZhdGUgYmFzZUNsYXNzVHBsO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVGFnQmluZGluZykge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0QmFzZUNsYXNzKHRwbCkge1xyXG4gICAgICAgICAgICB0aGlzLmJhc2VDbGFzc1RwbCA9IHRwbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFkZENsYXNzKGNsYXNzTmFtZSwgY29uZGl0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29uZGl0aW9ucy5wdXNoKHsgY2xhc3NOYW1lLCBjb25kaXRpb24gfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICBjb25zdCBjbGFzc2VzID0gW107XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuYmFzZUNsYXNzVHBsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBhY2NlcHQodGhpcy5iYXNlQ2xhc3NUcGwsIHRoaXMsIGNvbnRleHQpLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb25kaXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeyBjbGFzc05hbWUsIGNvbmRpdGlvbiB9ID0gdGhpcy5jb25kaXRpb25zW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEhYWNjZXB0KGNvbmRpdGlvbiwgdGhpcywgY29udGV4dCkudmFsdWVPZigpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3Nlcy5sZW5ndGggPiAwID8gam9pbihcIiBcIiwgY2xhc3NlcykgOiBudWxsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzZXRBdHRyaWJ1dGUoYXR0ck5hbWU6IHN0cmluZywgbmV3VmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5vbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnBhcmVudC50YWdOb2RlO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5ld1ZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9sZFZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmNsYXNzTmFtZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBFdmVudEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcih0YWdOb2RlOiBhbnksIHByaXZhdGUgbmFtZSwgcHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgICAgICB0YWdOb2RlLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5uYW1lLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV2YWx1YXRlKGFjY2VwdCwgdGhpcy5leHByKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoZnVuLCBhcmdzOiBhbnlbXSkge1xyXG4gICAgICAgICAgICBpZiAoZnVuID09PSBcImFzc2lnblwiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBhcmdzWzBdLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIGFyZ3NbMV0uc2V0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN1cGVyLmFwcChmdW4sIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQXR0cmlidXRlQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFRhZ0JpbmRpbmcsIHByaXZhdGUgbmFtZSwgcHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGUoYWNjZXB0LCB0aGlzLmV4cHIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB2b2lkIDAgJiYgISF2YWx1ZS52YWx1ZU9mKVxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS52YWx1ZU9mKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5hbWUgPT09IFwiY2hlY2tlZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9ICEhdmFsdWUgPyBcImNoZWNrZWRcIiA6IG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm9sZFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGF0dHJOYW1lID0gdGhpcy5uYW1lO1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy5wYXJlbnQudGFnTm9kZTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXdWYWx1ZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCBuZXdWYWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGFnW2F0dHJOYW1lXSA9IHZvaWQgMDtcclxuICAgICAgICAgICAgICAgIHRhZy5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvbGRWYWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZU5vZGUoYXR0cik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRhZ1thdHRyTmFtZV0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBuZXdWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL2V4cG9ydCBmdW5jdGlvbiBpbXBvcnRWaWV3KHZpZXc6IHN0cmluZywgLi4uYXJncyk6IGFueSB7XHJcbiAgICAvLyAgICBpZiAoIShcImltcG9ydFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpKSkge1xyXG4gICAgLy8gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkhUTUwgaW1wb3J0IGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyXCIpO1xyXG4gICAgLy8gICAgfVxyXG5cclxuICAgIC8vICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XHJcbiAgICAvLyAgICB2YXIgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcclxuICAgIC8vICAgIGxpbmsucmVsID0gJ2ltcG9ydCc7XHJcbiAgICAvLyAgICBsaW5rLmhyZWYgPSB2aWV3O1xyXG4gICAgLy8gICAgbGluay5zZXRBdHRyaWJ1dGUoJ2FzeW5jJywgXCJcIik7IC8vIG1ha2UgaXQgYXN5bmMhXHJcbiAgICAvLyAgICBsaW5rLm9ubG9hZCA9IGUgPT4ge1xyXG4gICAgLy8gICAgICAgIHZhciBsaW5rID0gKDxhbnk+ZS50YXJnZXQpO1xyXG4gICAgLy8gICAgICAgIGRlZmVycmVkLm5vdGlmeShsaW5rLmltcG9ydC5xdWVyeVNlbGVjdG9yKFwidGVtcGxhdGVcIikpO1xyXG4gICAgLy8gICAgICAgIGxpbmsub25sb2FkID0gbnVsbDtcclxuICAgIC8vICAgIH1cclxuICAgIC8vICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluayk7XHJcblxyXG4gICAgLy8gICAgcmV0dXJuIGRlZmVycmVkO1xyXG4gICAgLy99XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBqb2luKHNlcGFyYXRvcjogc3RyaW5nLCB2YWx1ZSkge1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aCA+IDAgPyB2YWx1ZS5zb3J0KCkuam9pbihzZXBhcmF0b3IpIDogbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxufVxyXG5cclxuICAgIC8vIFJlU2hhcnBlciByZXN0b3JlIEluY29uc2lzdGVudE5hbWluZ1xyXG4iXX0=