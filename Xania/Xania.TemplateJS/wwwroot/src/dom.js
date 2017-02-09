"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var core_1 = require("./core");
var reactive_1 = require("./reactive");
var template_1 = require("./template");
var fsharp_1 = require("./fsharp");
var Dom;
(function (Dom) {
    var document = window.document;
    var DomBinding = (function () {
        function DomBinding(target, dispatcher) {
            this.target = target;
            this.dispatcher = dispatcher;
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
            var offset = 0, length = this.childBindings.length;
            for (var i = 0; i < length; i++) {
                var child = this.childBindings[i];
                if (child === binding)
                    break;
                offset += child.length;
            }
            DomBinding.insertDom(this.target, dom, offset + idx);
        };
        DomBinding.prototype.text = function (expr) {
            var text = new TextBinding(expr, this.dispatcher);
            this.childBindings.push(text.map(this));
            return text;
        };
        DomBinding.prototype.content = function (ast, children) {
            var content = new FragmentBinding(ast, children, this.dispatcher);
            this.childBindings.push(content.map(this));
            return content;
        };
        DomBinding.prototype.tag = function (name, ns, attrs, children) {
            var tag = new TagBinding(name, ns, children, this.dispatcher), length = attrs.length;
            for (var i = 0; i < length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            this.childBindings.push(tag.map(this));
            return tag;
        };
        return DomBinding;
    }());
    Dom.DomBinding = DomBinding;
    function parse(node, dispatcher) {
        return {
            template: parseNode(node),
            bind: function (target, store) {
                return this.template.accept(new DomBinding(target, dispatcher)).update(store);
            }
        };
    }
    Dom.parse = parse;
    function view(template, dispatcher) {
        return {
            template: template,
            bind: function (target, store) {
                return this.template.accept(new DomBinding(target, dispatcher)).update(store);
            }
        };
    }
    Dom.view = view;
    function parseAttr(tagElement, attr) {
        var name = attr.name;
        var tpl = parseTpl(attr.value);
        tagElement.attr(name, tpl || attr.value);
        if (!!tagElement.name.match(/^input$/i) && !!attr.name.match(/^name$/i) && tagElement.getAttribute("value") != undefined) {
            var valueAccessor = parseTpl(attr.value);
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
                    fragmentTemplate = new template_1.Template.FragmentTemplate(parseTpl(attribute.value)).child(template_2);
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
                var tpl_1 = parseTpl(textContent);
                return new template_1.Template.TextTemplate(tpl_1 || node.textContent);
            }
        }
        return undefined;
    }
    var FragmentBinding = (function (_super) {
        __extends(FragmentBinding, _super);
        function FragmentBinding(ast, children, dispatcher) {
            var _this = _super.call(this, dispatcher) || this;
            _this.ast = ast;
            _this.children = children;
            _this.fragments = [];
            return _this;
        }
        Object.defineProperty(FragmentBinding.prototype, "length", {
            get: function () {
                var total = 0, length = this.fragments.length;
                for (var i = 0; i < length; i++) {
                    total += this.fragments[i].length;
                }
                return total;
            },
            enumerable: true,
            configurable: true
        });
        FragmentBinding.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            for (var i = 0; i < this.fragments.length; i++) {
                this.fragments[i].dispose();
            }
        };
        FragmentBinding.prototype.map = function (parent) {
            this.parent = parent;
            return this;
        };
        FragmentBinding.swap = function (arr, srcIndex, tarIndex) {
            if (srcIndex > tarIndex) {
                var i = srcIndex;
                srcIndex = tarIndex;
                tarIndex = i;
            }
            if (srcIndex < tarIndex) {
                var src = arr[srcIndex];
                arr[srcIndex] = arr[tarIndex];
                arr[tarIndex] = src;
            }
        };
        FragmentBinding.prototype.render = function (context) {
            var stream;
            if (!!this.ast && !!this.ast.execute) {
                stream = this.ast.execute(this, context);
                if (stream.length === void 0)
                    stream = [stream];
            }
            else {
                stream = [context];
            }
            var fr, streamlength = stream.length;
            for (var i = 0; i < streamlength; i++) {
                var item = stream[i];
                var fragment = null, fraglength = this.fragments.length;
                for (var e = i; e < fraglength; e++) {
                    fr = this.fragments[e];
                    if (fr.context === item) {
                        fragment = fr;
                        FragmentBinding.swap(this.fragments, e, i);
                        break;
                    }
                }
                if (fragment === null) {
                    fragment = new Fragment(this);
                    this.fragments.push(fragment);
                    FragmentBinding.swap(this.fragments, fraglength, i);
                }
                fragment.update(item);
            }
            while (this.fragments.length > stream.length) {
                var frag = this.fragments.pop();
                frag.dispose();
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
        Fragment.prototype.dispose = function () {
            reactive_1.Reactive.Binding.prototype.dispose.call(this);
            for (var i = 0; i < this.bindings.length; i++) {
                this.bindings[i].dispose();
            }
        };
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
            var length = this.owner.children.length;
            for (var e = 0; e < length; e++) {
                this.bindings[e].update(context);
            }
            return this;
        };
        Fragment.prototype.insert = function (binding, dom, index) {
            var offset = 0, length = this.bindings.length;
            for (var i = 0; i < length; i++) {
                if (this.bindings[i] === binding)
                    break;
                offset += this.bindings[i].length;
            }
            this.owner.insert(this, dom, offset + index);
        };
        Fragment.prototype.text = function (ast, childIndex) {
            return new TextBinding(ast, this.owner.dispatcher).map(this);
        };
        Fragment.prototype.content = function (ast, children, childIndex) {
            return new FragmentBinding(ast, children, this.owner.dispatcher).map(this);
        };
        Fragment.prototype.tag = function (tagName, ns, attrs, children, childIndex) {
            var tag = new TagBinding(tagName, ns, children, this.owner.dispatcher).map(this), length = attrs.length;
            for (var i = 0; i < length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            return tag;
        };
        return Fragment;
    }());
    var TextBinding = (function (_super) {
        __extends(TextBinding, _super);
        function TextBinding(expr, dispatcher) {
            var _this = _super.call(this, dispatcher) || this;
            _this.expr = expr;
            _this.length = 1;
            _this.textNode = document.createTextNode("");
            return _this;
        }
        TextBinding.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.textNode.remove();
        };
        TextBinding.prototype.map = function (target) {
            this.target = target;
            this.target.insert(this, this.textNode, 0);
            return this;
        };
        TextBinding.prototype.render = function () {
            var result = this.evaluate(this.expr);
            this.textNode.nodeValue = result && result.valueOf();
        };
        return TextBinding;
    }(reactive_1.Reactive.Binding));
    Dom.TextBinding = TextBinding;
    var TagBinding = (function (_super) {
        __extends(TagBinding, _super);
        function TagBinding(tagName, ns, childBindings, dispatcher) {
            if (ns === void 0) { ns = null; }
            var _this = _super.call(this, dispatcher) || this;
            _this.tagName = tagName;
            _this.ns = ns;
            _this.childBindings = childBindings;
            _this.attributeBindings = [];
            _this.events = {};
            _this.classBinding = new ClassBinding(_this, _this.dispatcher);
            _this.length = 1;
            if (ns === null)
                _this.tagNode = document.createElement(tagName);
            else {
                _this.tagNode = document.createElementNS(ns, tagName.toLowerCase());
            }
            if (childBindings) {
                for (var i = 0; i < childBindings.length; i++) {
                    childBindings[i].map(_this);
                }
            }
            return _this;
        }
        TagBinding.prototype.dispose = function () {
            this.tagNode.remove();
        };
        TagBinding.prototype.map = function (target) {
            this.target = target;
            return this;
        };
        TagBinding.prototype.child = function (child) {
            if (!this.childBindings)
                this.childBindings = [];
            this.childBindings.push(child.map(this));
            return this;
        };
        TagBinding.prototype.attr = function (name, ast) {
            if (typeof ast === "string") {
                this.tagNode.setAttribute(name, ast);
            }
            else if (name === "class") {
                this.classBinding.setBaseClass(ast);
            }
            else if (name === "value" && this.tagName === "input") {
                var valueBinding = new ValueBinding(this.tagNode, ast, this.dispatcher);
                this.attributeBindings.push(valueBinding);
            }
            else if (name === "checked" && this.tagName === "input") {
                var checkedBinding = new CheckedBinding(this.tagNode, ast, this.dispatcher);
                this.attributeBindings.push(checkedBinding);
            }
            else {
                var match = /^on(.+)/.exec(name);
                if (match) {
                    this.attributeBindings.push(new EventBinding(this.tagNode, match[1], ast));
                }
                else {
                    var attrBinding = new AttributeBinding(this, name, ast, this.dispatcher);
                    this.attributeBindings.push(attrBinding);
                }
            }
            return this;
        };
        TagBinding.prototype.insert = function (binding, dom, idx) {
            var offset = 0, length = this.childBindings.length;
            for (var i = 0; i < length; i++) {
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
            var attrLength = this.attributeBindings.length;
            for (var e = 0; e < attrLength; e++) {
                this.attributeBindings[e].update(context);
            }
            if (this.childBindings) {
                var childLength = this.childBindings.length;
                for (var i = 0; i < childLength; i++) {
                    this.childBindings[i].update(context);
                }
            }
            return this;
        };
        TagBinding.prototype.render = function (context) {
            this.target.insert(this, this.tagNode, 0);
        };
        TagBinding.prototype.trigger = function (name) {
            var handler = this.events[name];
            if (!!handler) {
                var result = handler.execute(this, this.context);
                if (typeof result === "function")
                    result();
            }
        };
        return TagBinding;
    }(reactive_1.Reactive.Binding));
    Dom.TagBinding = TagBinding;
    var ClassBinding = (function (_super) {
        __extends(ClassBinding, _super);
        function ClassBinding(parent, dispatcher) {
            var _this = _super.call(this, dispatcher) || this;
            _this.parent = parent;
            return _this;
        }
        ClassBinding.prototype.setBaseClass = function (tpl) {
            this.baseClassTpl = tpl;
        };
        ClassBinding.prototype.addClass = function (className, condition) {
            if (!this.conditions)
                this.conditions = [];
            this.conditions.push({ className: className, condition: condition });
        };
        ClassBinding.prototype.render = function (context) {
            this.context = context;
            var tag = this.parent.tagNode;
            if (this.baseClassTpl) {
                var newValue = this.evaluate(this.baseClassTpl);
                if (newValue === void 0 || newValue === null) {
                    tag.className = core_1.Core.empty;
                }
                else {
                    tag.className = newValue.valueOf();
                }
            }
            if (this.conditions) {
                var conditionLength = this.conditions.length;
                for (var i = 0; i < conditionLength; i++) {
                    var _a = this.conditions[i], className = _a.className, condition = _a.condition;
                    var b = condition.execute(this, context).valueOf();
                    if (b) {
                        tag.classList.add(className);
                    }
                    else {
                        tag.classList.remove(className);
                    }
                }
            }
        };
        ClassBinding.prototype.setAttribute = function (attrName, newValue) {
            var oldValue = this.oldValue;
            var tag = this.parent.tagNode;
            if (newValue === void 0 || newValue === null) {
                tag[attrName] = void 0;
                tag.removeAttribute(attrName);
            }
            else {
                if (oldValue === void 0) {
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
    var EventBinding = (function () {
        function EventBinding(tagNode, name, expr) {
            this.name = name;
            this.expr = expr;
            tagNode.addEventListener(this.name, this.fire.bind(this));
        }
        EventBinding.prototype.evaluate = function () {
            if (typeof this.expr === "function")
                return this.expr(event, this.context);
            return this.expr.execute(this, [
                event,
                event.target,
                this.context
            ]);
        };
        EventBinding.prototype.fire = function (event) {
            var newValue = this.evaluate();
            if (newValue !== void 0) {
                var tag = event.target;
                if (newValue === null) {
                    tag.removeAttribute("value");
                }
                else {
                    tag.value = newValue;
                }
            }
            this.context.refresh();
        };
        EventBinding.prototype.update = function (context) {
            this.context = context;
        };
        EventBinding.prototype.extend = function () {
            throw Error("Not implemented yet.");
        };
        EventBinding.prototype.where = function (source, predicate) {
            throw Error("Not implemented yet.");
        };
        EventBinding.prototype.select = function (source, selector) {
            throw Error("Not implemented yet.");
        };
        EventBinding.prototype.query = function (param, source) {
            throw Error("Not implemented yet.");
        };
        EventBinding.prototype.await = function (observable) {
            throw Error("Not implemented yet.");
        };
        EventBinding.prototype.const = function (value) {
            return value;
        };
        EventBinding.prototype.app = function (fun, args) {
            if (fun === "assign") {
                var arg = args[0];
                if (arg === null)
                    args[1].set(arg);
                else {
                    arg = arg.valueOf();
                    args[1].set(arg.valueOf());
                }
                return arg;
            }
            if (args)
                return fun.apply(null, args.map(EventBinding.valueOf));
            else
                return fun();
        };
        EventBinding.valueOf = function (x) {
            return x.valueOf();
        };
        EventBinding.prototype.member = function (target, name) {
            return target.get ? target.get(name) : target[name];
        };
        return EventBinding;
    }());
    Dom.EventBinding = EventBinding;
    var CheckedBinding = (function (_super) {
        __extends(CheckedBinding, _super);
        function CheckedBinding(tagNode, expr, dispatcher) {
            var _this = _super.call(this, dispatcher) || this;
            _this.tagNode = tagNode;
            _this.expr = expr;
            tagNode.addEventListener("change", _this.fire.bind(_this));
            return _this;
        }
        CheckedBinding.prototype.fire = function () {
            var value = this.evaluate(this.expr);
            if (value && value.set) {
                value.set(this.tagNode.checked);
                this.context.refresh();
            }
        };
        CheckedBinding.prototype.render = function () {
            var value = this.evaluate(this.expr);
            var newValue = value && value.valueOf();
            var oldValue = this.oldValue;
            var tag = this.tagNode;
            if (newValue !== void 0 && newValue !== false) {
                if (oldValue === void 0) {
                    var attr = document.createAttribute("checked");
                    attr.value = "checked";
                    tag.setAttributeNode(attr);
                }
                else {
                    tag["checked"] = "checked";
                    tag.setAttribute("checked", "checked");
                }
            }
            else {
                tag["checked"] = void 0;
                tag.removeAttribute("checked");
            }
            this.oldValue = newValue;
        };
        return CheckedBinding;
    }(reactive_1.Reactive.Binding));
    var ValueBinding = (function (_super) {
        __extends(ValueBinding, _super);
        function ValueBinding(tagNode, expr, dispatcher) {
            var _this = _super.call(this, dispatcher) || this;
            _this.tagNode = tagNode;
            _this.expr = expr;
            tagNode.addEventListener("change", _this.fire.bind(_this));
            return _this;
        }
        ValueBinding.prototype.fire = function () {
            var value = this.evaluate(this.expr);
            if (value && value.set) {
                value.set(this.tagNode.value);
            }
        };
        ValueBinding.prototype.render = function () {
            var value = this.evaluate(this.expr);
            var newValue = value && value.valueOf();
            var tag = this.tagNode;
            if (newValue === void 0) {
                tag.removeAttribute("value");
            }
            else {
                var attr = document.createAttribute("value");
                attr.value = newValue;
                tag.setAttributeNode(attr);
            }
        };
        return ValueBinding;
    }(reactive_1.Reactive.Binding));
    var AttributeBinding = (function (_super) {
        __extends(AttributeBinding, _super);
        function AttributeBinding(parent, name, expr, dispatcher) {
            var _this = _super.call(this, dispatcher) || this;
            _this.parent = parent;
            _this.name = name;
            _this.expr = expr;
            return _this;
        }
        AttributeBinding.prototype.render = function () {
            var value = this.evaluate(this.expr);
            if (value === void 0) {
                return;
            }
            if (value !== null && !!value.valueOf)
                value = value.valueOf();
            var newValue;
            if (this.name === "checked") {
                newValue = !!value ? "checked" : null;
            }
            else {
                newValue = value;
            }
            var attrName = this.name;
            var tag = this.parent.tagNode;
            if (newValue === void 0 || newValue === null) {
                tag[attrName] = void 0;
                tag.removeAttribute(attrName);
            }
            else {
                var attr = document.createAttribute(attrName);
                attr.value = newValue;
                tag.setAttributeNode(attr);
                if (attrName === "value")
                    tag[attrName] = newValue;
            }
        };
        return AttributeBinding;
    }(reactive_1.Reactive.Binding));
    Dom.AttributeBinding = AttributeBinding;
    function parseTpl(text) {
        var parts = [];
        var appendText = function (x) {
            var s = x.trim();
            if (s.length > 0) {
                parts.push(x);
            }
        };
        var offset = 0, textlength = text.length;
        while (offset < textlength) {
            var begin = text.indexOf("{{", offset);
            if (begin >= 0) {
                if (begin > offset)
                    appendText(text.substring(offset, begin));
                offset = begin + 2;
                var end = text.indexOf("}}", offset);
                if (end >= 0) {
                    parts.push(fsharp_1.fs(text.substring(offset, end)));
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
        if (parts.length === 0)
            return null;
        if (parts.length === 1) {
            return parts[0];
        }
        return parts;
    }
    Dom.parseTpl = parseTpl;
})(Dom = exports.Dom || (exports.Dom = {}));
function join(separator, value) {
    if (Array.isArray(value)) {
        return value.length > 0 ? value.sort().join(separator) : null;
    }
    return value;
}
exports.join = join;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dom;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBNkI7QUFDN0IsdUNBQTJDO0FBQzNDLHVDQUFxQztBQUNyQyxtQ0FBb0M7QUFHcEMsSUFBYyxHQUFHLENBNHZCaEI7QUE1dkJELFdBQWMsR0FBRztJQUViLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUF3Qi9CO1FBR0ksb0JBQW9CLE1BQU0sRUFBVSxVQUF1QjtZQUF2QyxXQUFNLEdBQU4sTUFBTSxDQUFBO1lBQVUsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUZuRCxrQkFBYSxHQUFrQixFQUFFLENBQUM7UUFHMUMsQ0FBQztRQUVNLG9CQUFTLEdBQWhCLFVBQWlCLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRztZQUM3QixFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDbEIsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7WUFDTCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QixDQUFDO1FBQ0wsQ0FBQztRQUVELDJCQUFNLEdBQU4sVUFBTyxPQUFvQixFQUFFLEdBQUcsRUFBRSxHQUFXO1lBQ3pDLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7WUFDbkQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcs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O0lBQ3pDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUNsRSxDQUFDO0lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBTEQsb0JBS0M7O0FBSUQsa0JBQWUsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29yZSB9IGZyb20gJy4vY29yZSdcclxuaW1wb3J0IHsgUmVhY3RpdmUgYXMgUmUgfSBmcm9tICcuL3JlYWN0aXZlJ1xyXG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJy4vdGVtcGxhdGUnXHJcbmltcG9ydCB7IGZzLCBTY29wZSB9IGZyb20gXCIuL2ZzaGFycFwiXHJcbmltcG9ydCBGc2hhcnAgPSByZXF1aXJlKFwiLi9mc2hhcnBcIik7XHJcblxyXG5leHBvcnQgbW9kdWxlIERvbSB7XHJcblxyXG4gICAgdmFyIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xyXG5cclxuICAgIGludGVyZmFjZSBJRG9tQmluZGluZyB7XHJcbiAgICAgICAgbGVuZ3RoO1xyXG4gICAgICAgIG1hcChwYXJlbnQpOiB0aGlzO1xyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICBkaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEb21WaXNpdG9yIGV4dGVuZHMgVGVtcGxhdGUuSVZpc2l0b3I8SURvbUJpbmRpbmc+IHtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3IHtcclxuICAgICAgICBiaW5kKHRhcmdldDogTm9kZSwgc3RvcmUpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJQWN0aW9uIHtcclxuICAgICAgICBleGVjdXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEaXNwYXRjaGVyIHtcclxuICAgICAgICBkaXNwYXRjaChhY3Rpb246IFJlLklBY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBEb21CaW5kaW5nIHtcclxuICAgICAgICBwcml2YXRlIGNoaWxkQmluZGluZ3M6IElEb21CaW5kaW5nW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YXJnZXQsIHByaXZhdGUgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBpbnNlcnREb20odGFyZ2V0LCBkb20sIGlkeCkge1xyXG4gICAgICAgICAgICBpZiAoaWR4IDwgdGFyZ2V0LmNoaWxkTm9kZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudCA9IHRhcmdldC5jaGlsZE5vZGVzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAhPT0gZG9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZShkb20sIGN1cnJlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGRvbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChiaW5kaW5nOiBJRG9tQmluZGluZywgZG9tLCBpZHg6IG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZEJpbmRpbmdzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IGNoaWxkLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBEb21CaW5kaW5nLmluc2VydERvbSh0aGlzLnRhcmdldCwgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dChleHByKTogVGV4dEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGV4dCA9IG5ldyBUZXh0QmluZGluZyhleHByLCB0aGlzLmRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaCh0ZXh0Lm1hcCh0aGlzKSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb250ZW50KGFzdCwgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pOiBGcmFnbWVudEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgY29udGVudCA9IG5ldyBGcmFnbWVudEJpbmRpbmcoYXN0LCBjaGlsZHJlbiwgdGhpcy5kaXNwYXRjaGVyKTtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goY29udGVudC5tYXAodGhpcykpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udGVudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGFnKG5hbWUsIG5zLCBhdHRycywgY2hpbGRyZW4pOiBUYWdCaW5kaW5nIHtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUYWdCaW5kaW5nKG5hbWUsIG5zLCBjaGlsZHJlbiwgdGhpcy5kaXNwYXRjaGVyKSwgbGVuZ3RoID0gYXR0cnMubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaCh0YWcubWFwKHRoaXMpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKG5vZGUsIGRpc3BhdGNoZXI/OiBJRGlzcGF0Y2hlcik6IElWaWV3IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcGFyc2VOb2RlKG5vZGUpLFxyXG4gICAgICAgICAgICBiaW5kKHRhcmdldCwgc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlLmFjY2VwdChuZXcgRG9tQmluZGluZyh0YXJnZXQsIGRpc3BhdGNoZXIpKS51cGRhdGUoc3RvcmUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBhcyBJVmlldztcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgZnVuY3Rpb24gdmlldyh0ZW1wbGF0ZSwgZGlzcGF0Y2hlcj86IElEaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdGVtcGxhdGUsXHJcbiAgICAgICAgICAgIGJpbmQodGFyZ2V0LCBzdG9yZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGUuYWNjZXB0KG5ldyBEb21CaW5kaW5nKHRhcmdldCwgZGlzcGF0Y2hlcikpLnVwZGF0ZShzdG9yZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGFzIElWaWV3O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlQXR0cih0YWdFbGVtZW50OiBUZW1wbGF0ZS5UYWdUZW1wbGF0ZSwgYXR0cjogQXR0cikge1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBhdHRyLm5hbWU7XHJcbiAgICAgICAgY29uc3QgdHBsID0gcGFyc2VUcGwoYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgdGFnRWxlbWVudC5hdHRyKG5hbWUsIHRwbCB8fCBhdHRyLnZhbHVlKTtcclxuXHJcbiAgICAgICAgLy8gY29udmVudGlvbnNcclxuICAgICAgICBpZiAoISF0YWdFbGVtZW50Lm5hbWUubWF0Y2goL15pbnB1dCQvaSkgJiYgISFhdHRyLm5hbWUubWF0Y2goL15uYW1lJC9pKSAmJiB0YWdFbGVtZW50LmdldEF0dHJpYnV0ZShcInZhbHVlXCIpICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZUFjY2Vzc29yID0gcGFyc2VUcGwoYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgICAgIHRhZ0VsZW1lbnQuYXR0cihcInZhbHVlXCIsIHZhbHVlQWNjZXNzb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZU5vZGUobm9kZTogTm9kZSk6IFRlbXBsYXRlLklOb2RlIHtcclxuICAgICAgICB2YXIgaTogbnVtYmVyO1xyXG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxICYmIG5vZGUubm9kZU5hbWUgPT09IFwiVEVNUExBVEVcIikge1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gPEhUTUxFbGVtZW50Pm5vZGVbXCJjb250ZW50XCJdO1xyXG4gICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUuRnJhZ21lbnRUZW1wbGF0ZShudWxsKTtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbnRlbnQuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRwbCA9IHBhcnNlTm9kZShjb250ZW50LmNoaWxkTm9kZXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRwbClcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5jaGlsZCh0cGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcclxuICAgICAgICAgICAgY29uc3QgZWx0ID0gPEhUTUxFbGVtZW50Pm5vZGU7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZS5UYWdUZW1wbGF0ZShlbHQudGFnTmFtZSwgZWx0Lm5hbWVzcGFjZVVSSSk7XHJcbiAgICAgICAgICAgIHZhciBmcmFnbWVudFRlbXBsYXRlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7ICEhZWx0LmF0dHJpYnV0ZXMgJiYgaSA8IGVsdC5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0cmlidXRlID0gZWx0LmF0dHJpYnV0ZXNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoYXR0cmlidXRlLm5hbWUgPT09IFwiZGF0YS1yZXBlYXRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50VGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUuRnJhZ21lbnRUZW1wbGF0ZShwYXJzZVRwbChhdHRyaWJ1dGUudmFsdWUpKS5jaGlsZCh0ZW1wbGF0ZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlQXR0cih0ZW1wbGF0ZSwgYXR0cmlidXRlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBlbHQuY2hpbGROb2Rlcy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gcGFyc2VOb2RlKGVsdC5jaGlsZE5vZGVzW2VdKTtcclxuICAgICAgICAgICAgICAgIGlmIChjaGlsZClcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5hZGRDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmcmFnbWVudFRlbXBsYXRlIHx8IHRlbXBsYXRlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xyXG4gICAgICAgICAgICB2YXIgdGV4dENvbnRlbnQgPSBub2RlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICBpZiAodGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRwbCA9IHBhcnNlVHBsKHRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKHRwbCB8fCBub2RlLnRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRnJhZ21lbnRCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyBpbXBsZW1lbnRzIElEb21CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgZnJhZ21lbnRzOiBGcmFnbWVudFtdID0gW107XHJcbiAgICAgICAgcHVibGljIHBhcmVudDogSUJpbmRpbmdUYXJnZXQ7XHJcblxyXG4gICAgICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAsIGxlbmd0aCA9IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXN0LCBwdWJsaWMgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10sIGRpc3BhdGNoZXI/OiBJRGlzcGF0Y2hlcikge1xyXG4gICAgICAgICAgICBzdXBlcihkaXNwYXRjaGVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHNbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXAocGFyZW50OiBJQmluZGluZ1RhcmdldCk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBzd2FwKGFycjogRnJhZ21lbnRbXSwgc3JjSW5kZXgsIHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChzcmNJbmRleCA+IHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaSA9IHNyY0luZGV4O1xyXG4gICAgICAgICAgICAgICAgc3JjSW5kZXggPSB0YXJJbmRleDtcclxuICAgICAgICAgICAgICAgIHRhckluZGV4ID0gaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNyYyA9IGFycltzcmNJbmRleF07XHJcbiAgICAgICAgICAgICAgICBhcnJbc3JjSW5kZXhdID0gYXJyW3RhckluZGV4XTtcclxuICAgICAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHZhciBzdHJlYW07XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuYXN0ICYmICEhdGhpcy5hc3QuZXhlY3V0ZSkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtID0gdGhpcy5hc3QuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ubGVuZ3RoID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gW3N0cmVhbV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSBbY29udGV4dF07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBmcjogRnJhZ21lbnQsIHN0cmVhbWxlbmd0aCA9IHN0cmVhbS5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyZWFtbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gc3RyZWFtW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmcmFnbWVudDogRnJhZ21lbnQgPSBudWxsLCBmcmFnbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZSA9IGk7IGUgPCBmcmFnbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmciA9IHRoaXMuZnJhZ21lbnRzW2VdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmci5jb250ZXh0ID09PSBpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gZnI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZyYWdtZW50QmluZGluZy5zd2FwKHRoaXMuZnJhZ21lbnRzLCBlLCBpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmcmFnbWVudCA9PT0gbnVsbCAvKiBub3QgZm91bmQgKi8pIHtcclxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBGcmFnbWVudCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5wdXNoKGZyYWdtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICBGcmFnbWVudEJpbmRpbmcuc3dhcCh0aGlzLmZyYWdtZW50cywgZnJhZ2xlbmd0aCwgaSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQudXBkYXRlKGl0ZW0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5mcmFnbWVudHMubGVuZ3RoID4gc3RyZWFtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZyYWcgPSB0aGlzLmZyYWdtZW50cy5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGZyYWcuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RyZWFtO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5zZXJ0KGZyYWdtZW50OiBGcmFnbWVudCwgZG9tLCBpZHgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5mcmFnbWVudHNbaV0gPT09IGZyYWdtZW50KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBGcmFnbWVudCB7XHJcbiAgICAgICAgcHVibGljIGJpbmRpbmdzOiBJRG9tQmluZGluZ1tdID0gW107XHJcbiAgICAgICAgcHVibGljIGNvbnRleHQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgb3duZXI6IEZyYWdtZW50QmluZGluZykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IHRoaXMub3duZXIuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZV0gPVxyXG4gICAgICAgICAgICAgICAgICAgIG93bmVyLmNoaWxkcmVuW2VdLmFjY2VwdCh0aGlzIGFzIElEb21WaXNpdG9yLCBlKS5tYXAodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIFJlLkJpbmRpbmcucHJvdG90eXBlLmRpc3Bvc2UuY2FsbCh0aGlzKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2ldLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICAgICAgdmFyIHRvdGFsID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmJpbmRpbmdzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICB0b3RhbCArPSB0aGlzLmJpbmRpbmdzW2pdLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5vd25lci5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZV0udXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5zZXJ0KGJpbmRpbmc6IElEb21CaW5kaW5nLCBkb20sIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3NbaV0gPT09IGJpbmRpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5iaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vd25lci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpbmRleCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdGV4dChhc3QsIGNoaWxkSW5kZXg6IG51bWJlcik6IFRleHRCaW5kaW5nIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBUZXh0QmluZGluZyhhc3QsIHRoaXMub3duZXIuZGlzcGF0Y2hlcikubWFwKHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGNvbnRlbnQoYXN0LCBjaGlsZHJlbiwgY2hpbGRJbmRleDogbnVtYmVyKTogRnJhZ21lbnRCaW5kaW5nIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBGcmFnbWVudEJpbmRpbmcoYXN0LCBjaGlsZHJlbiwgdGhpcy5vd25lci5kaXNwYXRjaGVyKS5tYXAodGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdGFnKHRhZ05hbWU6IHN0cmluZywgbnM6IHN0cmluZywgYXR0cnMsIGNoaWxkcmVuLCBjaGlsZEluZGV4OiBudW1iZXIpOiBUYWdCaW5kaW5nIHtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUYWdCaW5kaW5nKHRhZ05hbWUsIG5zLCBjaGlsZHJlbiwgdGhpcy5vd25lci5kaXNwYXRjaGVyKS5tYXAodGhpcyksIGxlbmd0aCA9IGF0dHJzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGFnLmF0dHIoYXR0cnNbaV0ubmFtZSwgYXR0cnNbaV0udHBsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElCaW5kaW5nVGFyZ2V0IHtcclxuICAgICAgICBpbnNlcnQoc2VuZGVyOiBJRG9tQmluZGluZywgZG9tLCBpZHgpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUZXh0QmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJRG9tQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIHRleHROb2RlO1xyXG4gICAgICAgIHByb3RlY3RlZCB0YXJnZXQ6IElCaW5kaW5nVGFyZ2V0O1xyXG4gICAgICAgIHB1YmxpYyBsZW5ndGggPSAxO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIsIGRpc3BhdGNoZXI/OiBJRGlzcGF0Y2hlcikge1xyXG4gICAgICAgICAgICBzdXBlcihkaXNwYXRjaGVyKTtcclxuICAgICAgICAgICAgdGhpcy50ZXh0Tm9kZSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgdGhpcy50ZXh0Tm9kZS5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcCh0YXJnZXQ6IElCaW5kaW5nVGFyZ2V0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xyXG4gICAgICAgICAgICB0aGlzLnRhcmdldC5pbnNlcnQodGhpcywgdGhpcy50ZXh0Tm9kZSwgMCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmV2YWx1YXRlKHRoaXMuZXhwcik7XHJcbiAgICAgICAgICAgIC8vIGlmIChyZXN1bHQgIT09IHZvaWQgMClcclxuICAgICAgICAgICAgdGhpcy50ZXh0Tm9kZS5ub2RlVmFsdWUgPSByZXN1bHQgJiYgcmVzdWx0LnZhbHVlT2YoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRhZ0JpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyB0YWdOb2RlO1xyXG4gICAgICAgIHByaXZhdGUgYXR0cmlidXRlQmluZGluZ3MgPSBbXTtcclxuICAgICAgICBwcml2YXRlIGV2ZW50cyA9IHt9O1xyXG4gICAgICAgIHByaXZhdGUgY2xhc3NCaW5kaW5nID0gbmV3IENsYXNzQmluZGluZyh0aGlzLCB0aGlzLmRpc3BhdGNoZXIpO1xyXG4gICAgICAgIHByb3RlY3RlZCB0YXJnZXQ6IElCaW5kaW5nVGFyZ2V0O1xyXG4gICAgICAgIHB1YmxpYyBsZW5ndGggPSAxO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhZ05hbWU6IHN0cmluZywgcHJpdmF0ZSBuczogc3RyaW5nID0gbnVsbCwgcHJpdmF0ZSBjaGlsZEJpbmRpbmdzPzogSURvbUJpbmRpbmdbXSwgZGlzcGF0Y2hlcj86IElEaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKGRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICBpZiAobnMgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFnTm9kZSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVFbGVtZW50TlMobnMsIHRhZ05hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjaGlsZEJpbmRpbmdzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkQmluZGluZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjaGlsZEJpbmRpbmdzW2ldLm1hcCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgdGhpcy50YWdOb2RlLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFwKHRhcmdldDogSUJpbmRpbmdUYXJnZXQpOiB0aGlzIHtcclxuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hpbGQoY2hpbGQ6IElEb21CaW5kaW5nKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5jaGlsZEJpbmRpbmdzKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjaGlsZC5tYXAodGhpcykpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF0dHIobmFtZSwgYXN0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXN0ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ05vZGUuc2V0QXR0cmlidXRlKG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJjbGFzc1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzQmluZGluZy5zZXRCYXNlQ2xhc3MoYXN0KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcInZhbHVlXCIgJiYgdGhpcy50YWdOYW1lID09PSBcImlucHV0XCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlQmluZGluZyA9IG5ldyBWYWx1ZUJpbmRpbmcodGhpcy50YWdOb2RlLCBhc3QsIHRoaXMuZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLnB1c2godmFsdWVCaW5kaW5nKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcImNoZWNrZWRcIiAmJiB0aGlzLnRhZ05hbWUgPT09IFwiaW5wdXRcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZEJpbmRpbmcgPSBuZXcgQ2hlY2tlZEJpbmRpbmcodGhpcy50YWdOb2RlLCBhc3QsIHRoaXMuZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLnB1c2goY2hlY2tlZEJpbmRpbmcpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gL15vbiguKykvLmV4ZWMobmFtZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLnB1c2gobmV3IEV2ZW50QmluZGluZyh0aGlzLnRhZ05vZGUsIG1hdGNoWzFdLCBhc3QpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJCaW5kaW5nID0gbmV3IEF0dHJpYnV0ZUJpbmRpbmcodGhpcywgbmFtZSwgYXN0LCB0aGlzLmRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlQmluZGluZ3MucHVzaChhdHRyQmluZGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5zZXJ0KGJpbmRpbmcsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgRG9tQmluZGluZy5pbnNlcnREb20odGhpcy50YWdOb2RlLCBkb20sIG9mZnNldCArIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbihuYW1lLCBhc3QpOiB0aGlzIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHNbbmFtZV0gPSBhc3Q7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIHN1cGVyLnVwZGF0ZShjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3NCaW5kaW5nLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICAgICAgdmFyIGF0dHJMZW5ndGggPSB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBhdHRyTGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlQmluZGluZ3NbZV0udXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRMZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZExlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzW2ldLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLnRhcmdldC5pbnNlcnQodGhpcywgdGhpcy50YWdOb2RlLCAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyaWdnZXIobmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAoISFoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gaGFuZGxlci5leGVjdXRlKHRoaXMsIHRoaXMuY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQ2xhc3NCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIGNvbmRpdGlvbnM7XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuICAgICAgICBwcml2YXRlIGJhc2VDbGFzc1RwbDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFRhZ0JpbmRpbmcsIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKGRpc3BhdGNoZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0QmFzZUNsYXNzKHRwbCkge1xyXG4gICAgICAgICAgICB0aGlzLmJhc2VDbGFzc1RwbCA9IHRwbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFkZENsYXNzKGNsYXNzTmFtZSwgY29uZGl0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5jb25kaXRpb25zKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb25kaXRpb25zID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbmRpdGlvbnMucHVzaCh7IGNsYXNzTmFtZSwgY29uZGl0aW9uIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMucGFyZW50LnRhZ05vZGU7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5iYXNlQ2xhc3NUcGwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuZXZhbHVhdGUodGhpcy5iYXNlQ2xhc3NUcGwpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmNsYXNzTmFtZSA9IENvcmUuZW1wdHk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5jbGFzc05hbWUgPSBuZXdWYWx1ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9pZiAob2xkVmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwiY2xhc3NcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgYXR0ci52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICB0YWcuY2xhc3NOYW1lID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgLy99XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzLm9sZFZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmRpdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25kaXRpb25MZW5ndGggPSB0aGlzLmNvbmRpdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb25kaXRpb25MZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB7IGNsYXNzTmFtZSwgY29uZGl0aW9uIH0gPSB0aGlzLmNvbmRpdGlvbnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGIgPSBjb25kaXRpb24uZXhlY3V0ZSh0aGlzLCBjb250ZXh0KS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWcuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHNldEF0dHJpYnV0ZShhdHRyTmFtZTogc3RyaW5nLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm9sZFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMucGFyZW50LnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2xkVmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZU5vZGUoYXR0cik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5jbGFzc05hbWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm9sZFZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRXZlbnRCaW5kaW5nIHtcclxuICAgICAgICBwcml2YXRlIGNvbnRleHQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHRhZ05vZGU6IGFueSwgcHJpdmF0ZSBuYW1lLCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgdGFnTm9kZS5hZGRFdmVudExpc3RlbmVyKHRoaXMubmFtZSwgdGhpcy5maXJlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZhbHVhdGUoKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5leHByID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leHByKGV2ZW50LCB0aGlzLmNvbnRleHQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5leHByLmV4ZWN1dGUodGhpcyxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICBldmVudCxcclxuICAgICAgICAgICAgICAgICAgICBldmVudC50YXJnZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0XHJcbiAgICAgICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcmUoZXZlbnQpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuZXZhbHVhdGUoKTtcclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWcgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKFwidmFsdWVcIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dGVuZCgpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hlcmUoc291cmNlLCBwcmVkaWNhdGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2VsZWN0KHNvdXJjZSwgc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcXVlcnkocGFyYW0sIHNvdXJjZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhd2FpdChvYnNlcnZhYmxlKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0KHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChmdW4sIGFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIGlmIChmdW4gPT09IFwiYXNzaWduXCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmdzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFyZyA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICBhcmdzWzFdLnNldChhcmcpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgICAgICBhcmdzWzFdLnNldChhcmcudmFsdWVPZigpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBhcmc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmdzKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bi5hcHBseShudWxsLCBhcmdzLm1hcChFdmVudEJpbmRpbmcudmFsdWVPZikpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyB2YWx1ZU9mKHgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHgudmFsdWVPZigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWVtYmVyKHRhcmdldDogeyBnZXQobmFtZTogc3RyaW5nKTsgcmVmcmVzaD8oKTsgfSwgbmFtZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0LmdldCA/IHRhcmdldC5nZXQobmFtZSkgOiB0YXJnZXRbbmFtZV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIENoZWNrZWRCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBhbnksIHByaXZhdGUgZXhwciwgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIpIHtcclxuICAgICAgICAgICAgc3VwZXIoZGlzcGF0Y2hlcik7XHJcblxyXG4gICAgICAgICAgICB0YWdOb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5maXJlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyZSgpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZSh0aGlzLmV4cHIpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuc2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS5zZXQodGhpcy50YWdOb2RlLmNoZWNrZWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZWZyZXNoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZSh0aGlzLmV4cHIpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gdmFsdWUgJiYgdmFsdWUudmFsdWVPZigpO1xyXG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm9sZFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMudGFnTm9kZTtcclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSB2b2lkIDAgJiYgbmV3VmFsdWUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2xkVmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwiY2hlY2tlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gXCJjaGVja2VkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZU5vZGUoYXR0cik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZ1tcImNoZWNrZWRcIl0gPSBcImNoZWNrZWRcIjtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbXCJjaGVja2VkXCJdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShcImNoZWNrZWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBWYWx1ZUJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBwcml2YXRlIG9sZFZhbHVlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhZ05vZGU6IGFueSwgcHJpdmF0ZSBleHByLCBkaXNwYXRjaGVyOiBJRGlzcGF0Y2hlcikge1xyXG4gICAgICAgICAgICBzdXBlcihkaXNwYXRjaGVyKTtcclxuXHJcbiAgICAgICAgICAgIHRhZ05vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmZpcmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaXJlKCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlKHRoaXMuZXhwcik7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5zZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlLnNldCh0aGlzLnRhZ05vZGUudmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGUodGhpcy5leHByKTtcclxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gdmFsdWUgJiYgdmFsdWUudmFsdWVPZigpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMudGFnTm9kZTtcclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHRhZy5yZW1vdmVBdHRyaWJ1dGUoXCJ2YWx1ZVwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwidmFsdWVcIik7XHJcbiAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQXR0cmlidXRlQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBUYWdCaW5kaW5nLCBwcml2YXRlIG5hbWUsIHByaXZhdGUgZXhwciwgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIpIHtcclxuICAgICAgICAgICAgc3VwZXIoZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGUodGhpcy5leHByKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiAhIXZhbHVlLnZhbHVlT2YpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubmFtZSA9PT0gXCJjaGVja2VkXCIpIHtcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gISF2YWx1ZSA/IFwiY2hlY2tlZFwiIDogbnVsbDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBhdHRyTmFtZSA9IHRoaXMubmFtZTtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMucGFyZW50LnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyTmFtZSA9PT0gXCJ2YWx1ZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZ1thdHRyTmFtZV0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgZnVuY3Rpb24gcGFyc2VUcGwodGV4dCkge1xyXG4gICAgICAgIHZhciBwYXJ0czogYW55W10gPSBbXTtcclxuXHJcbiAgICAgICAgdmFyIGFwcGVuZFRleHQgPSAoeCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgcyA9IHgudHJpbSgpO1xyXG4gICAgICAgICAgICBpZiAocy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDAsIHRleHRsZW5ndGggPSB0ZXh0Lmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAob2Zmc2V0IDwgdGV4dGxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgYmVnaW4gPSB0ZXh0LmluZGV4T2YoXCJ7e1wiLCBvZmZzZXQpO1xyXG4gICAgICAgICAgICBpZiAoYmVnaW4gPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGJlZ2luID4gb2Zmc2V0KVxyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFRleHQodGV4dC5zdWJzdHJpbmcob2Zmc2V0LCBiZWdpbikpO1xyXG5cclxuICAgICAgICAgICAgICAgIG9mZnNldCA9IGJlZ2luICsgMjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVuZCA9IHRleHQuaW5kZXhPZihcIn19XCIsIG9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZW5kID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKGZzKHRleHQuc3Vic3RyaW5nKG9mZnNldCwgZW5kKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IGVuZCArIDI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIkV4cGVjdGVkICd9fScgYnV0IG5vdCBmb3VuZCBzdGFydGluZyBmcm9tIGluZGV4OiBcIiArIG9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRUZXh0KHRleHQuc3Vic3RyaW5nKG9mZnNldCkpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJ0c1swXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJ0cztcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oc2VwYXJhdG9yOiBzdHJpbmcsIHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMCA/IHZhbHVlLnNvcnQoKS5qb2luKHNlcGFyYXRvcikgOiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59XHJcblxyXG4vLyBSZVNoYXJwZXIgcmVzdG9yZSBJbmNvbnNpc3RlbnROYW1pbmdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IERvbTsiXX0=