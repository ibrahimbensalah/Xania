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
            this.childBindings.push(text);
            return text;
        };
        DomBinding.prototype.content = function (ast, children) {
            var content = new FragmentBinding(ast, children, this.dispatcher);
            this.childBindings.push(content);
            return content;
        };
        DomBinding.prototype.tag = function (name, ns, attrs, children) {
            var tag = new TagBinding(name, ns, children, this.dispatcher), length = attrs.length;
            for (var i = 0; i < length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            this.childBindings.push(tag);
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
                var parent = new DomBinding(target, dispatcher);
                return this.template.accept(parent).update(store, parent);
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
        FragmentBinding.prototype.render = function (context, sinks) {
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
            if (this.sinks) {
                var offset = 0;
                for (var i = 0; i < this.fragments.length; i++) {
                    if (this.fragments[i] === fragment)
                        break;
                    offset += this.fragments[i].length;
                }
                this.sinks.insert(this, dom, offset + idx);
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
                    owner.children[e].accept(this, e);
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
                this.bindings[e].update(context, this);
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
            return new TextBinding(ast, this.owner.dispatcher);
        };
        Fragment.prototype.content = function (ast, children, childIndex) {
            return new FragmentBinding(ast, children, this.owner.dispatcher);
        };
        Fragment.prototype.tag = function (tagName, ns, attrs, children, childIndex) {
            var tag = new TagBinding(tagName, ns, children, this.owner.dispatcher), length = attrs.length;
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
        TextBinding.prototype.render = function (context, sinks) {
            var result = this.evaluate(this.expr);
            this.textNode.nodeValue = result && result.valueOf();
            this.sinks.insert(this, this.textNode, 0);
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
            _this.length = 1;
            if (ns === null)
                _this.tagNode = document.createElement(tagName);
            else {
                _this.tagNode = document.createElementNS(ns, tagName.toLowerCase());
            }
            _this.classBinding = new ClassBinding(_this.tagNode, _this.dispatcher);
            return _this;
        }
        TagBinding.prototype.dispose = function () {
            this.tagNode.remove();
        };
        TagBinding.prototype.child = function (child) {
            if (!this.childBindings)
                this.childBindings = [];
            this.childBindings.push(child);
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
                    var attrBinding = new AttributeBinding(this.tagNode, name, ast, this.dispatcher);
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
        TagBinding.prototype.update = function (context, parent) {
            _super.prototype.update.call(this, context, parent);
            this.classBinding.update(context, this);
            var attrLength = this.attributeBindings.length;
            for (var e = 0; e < attrLength; e++) {
                this.attributeBindings[e].update(context);
            }
            if (this.childBindings) {
                var childLength = this.childBindings.length;
                for (var i = 0; i < childLength; i++) {
                    this.childBindings[i].update(context, this);
                }
            }
            return this;
        };
        TagBinding.prototype.render = function (context, sinks) {
            sinks.insert(this, this.tagNode, 0);
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
        function ClassBinding(tagNode, dispatcher) {
            var _this = _super.call(this, dispatcher) || this;
            _this.tagNode = tagNode;
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
        ClassBinding.prototype.render = function (context, sinks) {
            this.context = context;
            var tag = this.tagNode;
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
            var tag = this.tagNode;
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
        function AttributeBinding(tagNode, name, expr, dispatcher) {
            var _this = _super.call(this, dispatcher) || this;
            _this.tagNode = tagNode;
            _this.name = name;
            _this.expr = expr;
            return _this;
        }
        AttributeBinding.prototype.render = function (context, parent) {
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
            var tag = this.tagNode;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBNkI7QUFDN0IsdUNBQTJDO0FBQzNDLHVDQUFxQztBQUNyQyxtQ0FBb0M7QUFHcEMsSUFBYyxHQUFHLENBOHRCaEI7QUE5dEJELFdBQWMsR0FBRztJQUViLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUF1Qi9CO1FBR0ksb0JBQW9CLE1BQU0sRUFBVSxVQUF1QjtZQUF2QyxXQUFNLEdBQU4sTUFBTSxDQUFBO1lBQVUsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUZuRCxrQkFBYSxHQUFrQixFQUFFLENBQUM7UUFHMUMsQ0FBQztRQUVNLG9CQUFTLEdBQWhCLFVBQWlCLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRztZQUM3QixFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQyxFQUFFLENBQUMsQ0FBQyxPQUFPLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDbEIsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7WUFDTCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QixDQUFDO1FBQ0wsQ0FBQztRQUVELDJCQUFNLEdBQU4sVUFBTyxPQUFvQixFQUFFLEdBQUcsRUFBRSxHQUFXO1lBQ3pDLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7WUFDbkQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcs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QUNWLENBQUM7UUFDTCxDQUFDO1FBRUQsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7WUFDbkIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUVoQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBdkNlLFlBQVEsV0F1Q3ZCLENBQUE7QUFDTCxDQUFDLEVBOXRCYSxHQUFHLEdBQUgsV0FBRyxLQUFILFdBQUcsUUE4dEJoQjtBQUVELGNBQXFCLFNBQWlCLEVBQUUsS0FBSztJQUN6QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbEUsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUxELG9CQUtDOztBQUlELGtCQUFlLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tICcuL2NvcmUnXHJcbmltcG9ydCB7IFJlYWN0aXZlIGFzIFJlIH0gZnJvbSAnLi9yZWFjdGl2ZSdcclxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tICcuL3RlbXBsYXRlJ1xyXG5pbXBvcnQgeyBmcywgU2NvcGUgfSBmcm9tIFwiLi9mc2hhcnBcIlxyXG5pbXBvcnQgRnNoYXJwID0gcmVxdWlyZShcIi4vZnNoYXJwXCIpO1xyXG5cclxuZXhwb3J0IG1vZHVsZSBEb20ge1xyXG5cclxuICAgIHZhciBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudDtcclxuXHJcbiAgICBpbnRlcmZhY2UgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIGxlbmd0aDtcclxuICAgICAgICB1cGRhdGUoY29udGV4dCwgcGFyZW50KTtcclxuICAgICAgICBkaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEb21WaXNpdG9yIGV4dGVuZHMgVGVtcGxhdGUuSVZpc2l0b3I8SURvbUJpbmRpbmc+IHtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3IHtcclxuICAgICAgICBiaW5kKHRhcmdldDogTm9kZSwgc3RvcmUpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJQWN0aW9uIHtcclxuICAgICAgICBleGVjdXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEaXNwYXRjaGVyIHtcclxuICAgICAgICBkaXNwYXRjaChhY3Rpb246IFJlLklBY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBEb21CaW5kaW5nIHtcclxuICAgICAgICBwcml2YXRlIGNoaWxkQmluZGluZ3M6IElEb21CaW5kaW5nW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YXJnZXQsIHByaXZhdGUgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBpbnNlcnREb20odGFyZ2V0LCBkb20sIGlkeCkge1xyXG4gICAgICAgICAgICBpZiAoaWR4IDwgdGFyZ2V0LmNoaWxkTm9kZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudCA9IHRhcmdldC5jaGlsZE5vZGVzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAhPT0gZG9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZShkb20sIGN1cnJlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGRvbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChiaW5kaW5nOiBJRG9tQmluZGluZywgZG9tLCBpZHg6IG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZEJpbmRpbmdzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IGNoaWxkLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBEb21CaW5kaW5nLmluc2VydERvbSh0aGlzLnRhcmdldCwgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dChleHByKTogVGV4dEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGV4dCA9IG5ldyBUZXh0QmluZGluZyhleHByLCB0aGlzLmRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaCh0ZXh0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRlbnQoYXN0LCBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSk6IEZyYWdtZW50QmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0gbmV3IEZyYWdtZW50QmluZGluZyhhc3QsIGNoaWxkcmVuLCB0aGlzLmRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjb250ZW50KTtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRhZyhuYW1lLCBucywgYXR0cnMsIGNoaWxkcmVuKTogVGFnQmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyhuYW1lLCBucywgY2hpbGRyZW4sIHRoaXMuZGlzcGF0Y2hlciksIGxlbmd0aCA9IGF0dHJzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGFnLmF0dHIoYXR0cnNbaV0ubmFtZSwgYXR0cnNbaV0udHBsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2godGFnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKG5vZGUsIGRpc3BhdGNoZXI/OiBJRGlzcGF0Y2hlcik6IElWaWV3IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogcGFyc2VOb2RlKG5vZGUpLFxyXG4gICAgICAgICAgICBiaW5kKHRhcmdldCwgc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlLmFjY2VwdChuZXcgRG9tQmluZGluZyh0YXJnZXQsIGRpc3BhdGNoZXIpKS51cGRhdGUoc3RvcmUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBhcyBJVmlldztcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgZnVuY3Rpb24gdmlldyh0ZW1wbGF0ZSwgZGlzcGF0Y2hlcj86IElEaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdGVtcGxhdGUsXHJcbiAgICAgICAgICAgIGJpbmQodGFyZ2V0LCBzdG9yZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IG5ldyBEb21CaW5kaW5nKHRhcmdldCwgZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZS5hY2NlcHQocGFyZW50KS51cGRhdGUoc3RvcmUsIHBhcmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGFzIElWaWV3O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlQXR0cih0YWdFbGVtZW50OiBUZW1wbGF0ZS5UYWdUZW1wbGF0ZSwgYXR0cjogQXR0cikge1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBhdHRyLm5hbWU7XHJcbiAgICAgICAgY29uc3QgdHBsID0gcGFyc2VUcGwoYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgdGFnRWxlbWVudC5hdHRyKG5hbWUsIHRwbCB8fCBhdHRyLnZhbHVlKTtcclxuXHJcbiAgICAgICAgLy8gY29udmVudGlvbnNcclxuICAgICAgICBpZiAoISF0YWdFbGVtZW50Lm5hbWUubWF0Y2goL15pbnB1dCQvaSkgJiYgISFhdHRyLm5hbWUubWF0Y2goL15uYW1lJC9pKSAmJiB0YWdFbGVtZW50LmdldEF0dHJpYnV0ZShcInZhbHVlXCIpICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZUFjY2Vzc29yID0gcGFyc2VUcGwoYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgICAgIHRhZ0VsZW1lbnQuYXR0cihcInZhbHVlXCIsIHZhbHVlQWNjZXNzb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZU5vZGUobm9kZTogTm9kZSk6IFRlbXBsYXRlLklOb2RlIHtcclxuICAgICAgICB2YXIgaTogbnVtYmVyO1xyXG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxICYmIG5vZGUubm9kZU5hbWUgPT09IFwiVEVNUExBVEVcIikge1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gPEhUTUxFbGVtZW50Pm5vZGVbXCJjb250ZW50XCJdO1xyXG4gICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUuRnJhZ21lbnRUZW1wbGF0ZShudWxsKTtcclxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbnRlbnQuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRwbCA9IHBhcnNlTm9kZShjb250ZW50LmNoaWxkTm9kZXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRwbClcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5jaGlsZCh0cGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcclxuICAgICAgICAgICAgY29uc3QgZWx0ID0gPEhUTUxFbGVtZW50Pm5vZGU7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZS5UYWdUZW1wbGF0ZShlbHQudGFnTmFtZSwgZWx0Lm5hbWVzcGFjZVVSSSk7XHJcbiAgICAgICAgICAgIHZhciBmcmFnbWVudFRlbXBsYXRlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7ICEhZWx0LmF0dHJpYnV0ZXMgJiYgaSA8IGVsdC5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0cmlidXRlID0gZWx0LmF0dHJpYnV0ZXNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoYXR0cmlidXRlLm5hbWUgPT09IFwiZGF0YS1yZXBlYXRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50VGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUuRnJhZ21lbnRUZW1wbGF0ZShwYXJzZVRwbChhdHRyaWJ1dGUudmFsdWUpKS5jaGlsZCh0ZW1wbGF0ZSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlQXR0cih0ZW1wbGF0ZSwgYXR0cmlidXRlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBlbHQuY2hpbGROb2Rlcy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gcGFyc2VOb2RlKGVsdC5jaGlsZE5vZGVzW2VdKTtcclxuICAgICAgICAgICAgICAgIGlmIChjaGlsZClcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZS5hZGRDaGlsZChjaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmcmFnbWVudFRlbXBsYXRlIHx8IHRlbXBsYXRlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xyXG4gICAgICAgICAgICB2YXIgdGV4dENvbnRlbnQgPSBub2RlLnRleHRDb250ZW50O1xyXG4gICAgICAgICAgICBpZiAodGV4dENvbnRlbnQudHJpbSgpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRwbCA9IHBhcnNlVHBsKHRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKHRwbCB8fCBub2RlLnRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRnJhZ21lbnRCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyBpbXBsZW1lbnRzIElEb21CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgZnJhZ21lbnRzOiBGcmFnbWVudFtdID0gW107XHJcblxyXG4gICAgICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAsIGxlbmd0aCA9IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0b3RhbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXN0LCBwdWJsaWMgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10sIGRpc3BhdGNoZXI/OiBJRGlzcGF0Y2hlcikge1xyXG4gICAgICAgICAgICBzdXBlcihkaXNwYXRjaGVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHN1cGVyLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHNbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBzd2FwKGFycjogRnJhZ21lbnRbXSwgc3JjSW5kZXgsIHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChzcmNJbmRleCA+IHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaSA9IHNyY0luZGV4O1xyXG4gICAgICAgICAgICAgICAgc3JjSW5kZXggPSB0YXJJbmRleDtcclxuICAgICAgICAgICAgICAgIHRhckluZGV4ID0gaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNyYyA9IGFycltzcmNJbmRleF07XHJcbiAgICAgICAgICAgICAgICBhcnJbc3JjSW5kZXhdID0gYXJyW3RhckluZGV4XTtcclxuICAgICAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0LCBzaW5rczogSURPTVNpbmtzKSB7XHJcbiAgICAgICAgICAgIHZhciBzdHJlYW07XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuYXN0ICYmICEhdGhpcy5hc3QuZXhlY3V0ZSkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtID0gdGhpcy5hc3QuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ubGVuZ3RoID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gW3N0cmVhbV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSBbY29udGV4dF07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBmcjogRnJhZ21lbnQsIHN0cmVhbWxlbmd0aCA9IHN0cmVhbS5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyZWFtbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gc3RyZWFtW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmcmFnbWVudDogRnJhZ21lbnQgPSBudWxsLCBmcmFnbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZSA9IGk7IGUgPCBmcmFnbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmciA9IHRoaXMuZnJhZ21lbnRzW2VdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmci5jb250ZXh0ID09PSBpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gZnI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZyYWdtZW50QmluZGluZy5zd2FwKHRoaXMuZnJhZ21lbnRzLCBlLCBpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmcmFnbWVudCA9PT0gbnVsbCAvKiBub3QgZm91bmQgKi8pIHtcclxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBGcmFnbWVudCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5wdXNoKGZyYWdtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICBGcmFnbWVudEJpbmRpbmcuc3dhcCh0aGlzLmZyYWdtZW50cywgZnJhZ2xlbmd0aCwgaSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQudXBkYXRlKGl0ZW0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5mcmFnbWVudHMubGVuZ3RoID4gc3RyZWFtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZyYWcgPSB0aGlzLmZyYWdtZW50cy5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGZyYWcuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RyZWFtO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5zZXJ0KGZyYWdtZW50OiBGcmFnbWVudCwgZG9tLCBpZHgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc2lua3MpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmZyYWdtZW50c1tpXSA9PT0gZnJhZ21lbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmZyYWdtZW50c1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNpbmtzLmluc2VydCh0aGlzLCBkb20sIG9mZnNldCArIGlkeCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgRnJhZ21lbnQge1xyXG4gICAgICAgIHB1YmxpYyBiaW5kaW5nczogSURvbUJpbmRpbmdbXSA9IFtdO1xyXG4gICAgICAgIHB1YmxpYyBjb250ZXh0O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG93bmVyOiBGcmFnbWVudEJpbmRpbmcpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCB0aGlzLm93bmVyLmNoaWxkcmVuLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2VdID1cclxuICAgICAgICAgICAgICAgICAgICBvd25lci5jaGlsZHJlbltlXS5hY2NlcHQodGhpcyBhcyBJRG9tVmlzaXRvciwgZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIFJlLkJpbmRpbmcucHJvdG90eXBlLmRpc3Bvc2UuY2FsbCh0aGlzKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2ldLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICAgICAgdmFyIHRvdGFsID0gMDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmJpbmRpbmdzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICB0b3RhbCArPSB0aGlzLmJpbmRpbmdzW2pdLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5vd25lci5jaGlsZHJlbi5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZV0udXBkYXRlKGNvbnRleHQsIHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5zZXJ0KGJpbmRpbmc6IElEb21CaW5kaW5nLCBkb20sIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3NbaV0gPT09IGJpbmRpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5iaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vd25lci5pbnNlcnQodGhpcywgZG9tLCBvZmZzZXQgKyBpbmRleCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdGV4dChhc3QsIGNoaWxkSW5kZXg6IG51bWJlcik6IFRleHRCaW5kaW5nIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBUZXh0QmluZGluZyhhc3QsIHRoaXMub3duZXIuZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgY29udGVudChhc3QsIGNoaWxkcmVuLCBjaGlsZEluZGV4OiBudW1iZXIpOiBGcmFnbWVudEJpbmRpbmcge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEZyYWdtZW50QmluZGluZyhhc3QsIGNoaWxkcmVuLCB0aGlzLm93bmVyLmRpc3BhdGNoZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRhZyh0YWdOYW1lOiBzdHJpbmcsIG5zOiBzdHJpbmcsIGF0dHJzLCBjaGlsZHJlbiwgY2hpbGRJbmRleDogbnVtYmVyKTogVGFnQmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyh0YWdOYW1lLCBucywgY2hpbGRyZW4sIHRoaXMub3duZXIuZGlzcGF0Y2hlciksIGxlbmd0aCA9IGF0dHJzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGFnLmF0dHIoYXR0cnNbaV0ubmFtZSwgYXR0cnNbaV0udHBsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElET01TaW5rcyB7XHJcbiAgICAgICAgaW5zZXJ0KHNlbmRlcjogSURvbUJpbmRpbmcsIGRvbSwgaWR4KTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGV4dEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyB0ZXh0Tm9kZTtcclxuICAgICAgICBwdWJsaWMgbGVuZ3RoID0gMTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBleHByLCBkaXNwYXRjaGVyPzogSURpc3BhdGNoZXIpIHtcclxuICAgICAgICAgICAgc3VwZXIoZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgICAgIHRoaXMudGV4dE5vZGUgPSAoPGFueT5kb2N1bWVudCkuY3JlYXRlVGV4dE5vZGUoXCJcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIHRoaXMudGV4dE5vZGUucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCwgc2lua3M6IElET01TaW5rcykge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLmV2YWx1YXRlKHRoaXMuZXhwcik7XHJcbiAgICAgICAgICAgIC8vIGlmIChyZXN1bHQgIT09IHZvaWQgMClcclxuICAgICAgICAgICAgdGhpcy50ZXh0Tm9kZS5ub2RlVmFsdWUgPSByZXN1bHQgJiYgcmVzdWx0LnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgdGhpcy5zaW5rcy5pbnNlcnQodGhpcywgdGhpcy50ZXh0Tm9kZSwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUYWdCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyBpbXBsZW1lbnRzIElEb21CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgdGFnTm9kZTtcclxuICAgICAgICBwcml2YXRlIGF0dHJpYnV0ZUJpbmRpbmdzID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBldmVudHMgPSB7fTtcclxuICAgICAgICBwcml2YXRlIGNsYXNzQmluZGluZzogQ2xhc3NCaW5kaW5nO1xyXG4gICAgICAgIHB1YmxpYyBsZW5ndGggPSAxO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhZ05hbWU6IHN0cmluZywgcHJpdmF0ZSBuczogc3RyaW5nID0gbnVsbCwgcHJpdmF0ZSBjaGlsZEJpbmRpbmdzPzogSURvbUJpbmRpbmdbXSwgZGlzcGF0Y2hlcj86IElEaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKGRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICBpZiAobnMgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFnTm9kZSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVFbGVtZW50TlMobnMsIHRhZ05hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3NCaW5kaW5nID0gbmV3IENsYXNzQmluZGluZyh0aGlzLnRhZ05vZGUsIHRoaXMuZGlzcGF0Y2hlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLnRhZ05vZGUucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGlsZChjaGlsZDogSURvbUJpbmRpbmcpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmNoaWxkQmluZGluZ3MpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncy5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhdHRyKG5hbWUsIGFzdCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFzdCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YWdOb2RlLnNldEF0dHJpYnV0ZShuYW1lLCBhc3QpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiY2xhc3NcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0JpbmRpbmcuc2V0QmFzZUNsYXNzKGFzdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJ2YWx1ZVwiICYmIHRoaXMudGFnTmFtZSA9PT0gXCJpbnB1dFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZUJpbmRpbmcgPSBuZXcgVmFsdWVCaW5kaW5nKHRoaXMudGFnTm9kZSwgYXN0LCB0aGlzLmRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5wdXNoKHZhbHVlQmluZGluZyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJjaGVja2VkXCIgJiYgdGhpcy50YWdOYW1lID09PSBcImlucHV0XCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrZWRCaW5kaW5nID0gbmV3IENoZWNrZWRCaW5kaW5nKHRoaXMudGFnTm9kZSwgYXN0LCB0aGlzLmRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5wdXNoKGNoZWNrZWRCaW5kaW5nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IC9eb24oLispLy5leGVjKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5wdXNoKG5ldyBFdmVudEJpbmRpbmcodGhpcy50YWdOb2RlLCBtYXRjaFsxXSwgYXN0KSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyQmluZGluZyA9IG5ldyBBdHRyaWJ1dGVCaW5kaW5nKHRoaXMudGFnTm9kZSwgbmFtZSwgYXN0LCB0aGlzLmRpc3BhdGNoZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlQmluZGluZ3MucHVzaChhdHRyQmluZGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5zZXJ0KGJpbmRpbmcsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgRG9tQmluZGluZy5pbnNlcnREb20odGhpcy50YWdOb2RlLCBkb20sIG9mZnNldCArIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbihuYW1lLCBhc3QpOiB0aGlzIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHNbbmFtZV0gPSBhc3Q7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0LCBwYXJlbnQpOiB0aGlzIHtcclxuICAgICAgICAgICAgc3VwZXIudXBkYXRlKGNvbnRleHQsIHBhcmVudCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNsYXNzQmluZGluZy51cGRhdGUoY29udGV4dCwgdGhpcyk7XHJcbiAgICAgICAgICAgIHZhciBhdHRyTGVuZ3RoID0gdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgYXR0ckxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzW2VdLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRCaW5kaW5ncykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkTGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRMZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5nc1tpXS51cGRhdGUoY29udGV4dCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIHNpbmtzKSB7XHJcbiAgICAgICAgICAgIHNpbmtzLmluc2VydCh0aGlzLCB0aGlzLnRhZ05vZGUsIDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJpZ2dlcihuYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciBoYW5kbGVyID0gdGhpcy5ldmVudHNbbmFtZV07XHJcbiAgICAgICAgICAgIGlmICghIWhhbmRsZXIpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBoYW5kbGVyLmV4ZWN1dGUodGhpcywgdGhpcy5jb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBDbGFzc0JpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgZG9tO1xyXG4gICAgICAgIHByaXZhdGUgY29uZGl0aW9ucztcclxuICAgICAgICBwcml2YXRlIG9sZFZhbHVlO1xyXG4gICAgICAgIHByaXZhdGUgYmFzZUNsYXNzVHBsO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhZ05vZGU6IEhUTUxFbGVtZW50LCBkaXNwYXRjaGVyOiBJRGlzcGF0Y2hlcikge1xyXG4gICAgICAgICAgICBzdXBlcihkaXNwYXRjaGVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldEJhc2VDbGFzcyh0cGwpIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlQ2xhc3NUcGwgPSB0cGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhZGRDbGFzcyhjbGFzc05hbWUsIGNvbmRpdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuY29uZGl0aW9ucylcclxuICAgICAgICAgICAgICAgIHRoaXMuY29uZGl0aW9ucyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb25kaXRpb25zLnB1c2goeyBjbGFzc05hbWUsIGNvbmRpdGlvbiB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0LCBzaW5rczogSURPTVNpbmtzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnRhZ05vZGU7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5iYXNlQ2xhc3NUcGwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuZXZhbHVhdGUodGhpcy5iYXNlQ2xhc3NUcGwpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmNsYXNzTmFtZSA9IENvcmUuZW1wdHk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5jbGFzc05hbWUgPSBuZXdWYWx1ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmRpdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25kaXRpb25MZW5ndGggPSB0aGlzLmNvbmRpdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb25kaXRpb25MZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB7IGNsYXNzTmFtZSwgY29uZGl0aW9uIH0gPSB0aGlzLmNvbmRpdGlvbnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGIgPSBjb25kaXRpb24uZXhlY3V0ZSh0aGlzLCBjb250ZXh0KS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWcuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHNldEF0dHJpYnV0ZShhdHRyTmFtZTogc3RyaW5nLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm9sZFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZzogYW55ID0gdGhpcy50YWdOb2RlO1xyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IHZvaWQgMCB8fCBuZXdWYWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGFnW2F0dHJOYW1lXSA9IHZvaWQgMDtcclxuICAgICAgICAgICAgICAgIHRhZy5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKG9sZFZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuY2xhc3NOYW1lID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEV2ZW50QmluZGluZyB7XHJcbiAgICAgICAgcHJpdmF0ZSBjb250ZXh0O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcih0YWdOb2RlOiBhbnksIHByaXZhdGUgbmFtZSwgcHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHRhZ05vZGUuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLm5hbWUsIHRoaXMuZmlyZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlKCkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuZXhwciA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhwcihldmVudCwgdGhpcy5jb250ZXh0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhwci5leGVjdXRlKHRoaXMsXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0LFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dFxyXG4gICAgICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaXJlKGV2ZW50KSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLmV2YWx1YXRlKCk7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFnID0gZXZlbnQudGFyZ2V0O1xyXG4gICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShcInZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWcudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnJlZnJlc2goKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQoKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoZXJlKHNvdXJjZSwgcHJlZGljYXRlKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNlbGVjdChzb3VyY2UsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHF1ZXJ5KHBhcmFtLCBzb3VyY2UpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXdhaXQob2JzZXJ2YWJsZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCh2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoZnVuLCBhcmdzOiBhbnlbXSkge1xyXG4gICAgICAgICAgICBpZiAoZnVuID09PSBcImFzc2lnblwiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJnc1swXTtcclxuICAgICAgICAgICAgICAgIGlmIChhcmcgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgYXJnc1sxXS5zZXQoYXJnKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJnc1sxXS5zZXQoYXJnLnZhbHVlT2YoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJncylcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgYXJncy5tYXAoRXZlbnRCaW5kaW5nLnZhbHVlT2YpKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdmFsdWVPZih4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB4LnZhbHVlT2YoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lbWJlcih0YXJnZXQ6IHsgZ2V0KG5hbWU6IHN0cmluZyk7IHJlZnJlc2g/KCk7IH0sIG5hbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5nZXQgPyB0YXJnZXQuZ2V0KG5hbWUpIDogdGFyZ2V0W25hbWVdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBDaGVja2VkQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHByaXZhdGUgb2xkVmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTm9kZTogYW55LCBwcml2YXRlIGV4cHIsIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKGRpc3BhdGNoZXIpO1xyXG5cclxuICAgICAgICAgICAgdGFnTm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuZmlyZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcmUoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGUodGhpcy5leHByKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnNldCkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUuc2V0KHRoaXMudGFnTm9kZS5jaGVja2VkKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGUodGhpcy5leHByKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHZhbHVlICYmIHZhbHVlLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5vbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdm9pZCAwICYmIG5ld1ZhbHVlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG9sZFZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShcImNoZWNrZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSA9IFwiY2hlY2tlZFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWdbXCJjaGVja2VkXCJdID0gXCJjaGVja2VkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZShcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGFnW1wiY2hlY2tlZFwiXSA9IHZvaWQgMDtcclxuICAgICAgICAgICAgICAgIHRhZy5yZW1vdmVBdHRyaWJ1dGUoXCJjaGVja2VkXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgVmFsdWVCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBhbnksIHByaXZhdGUgZXhwciwgZGlzcGF0Y2hlcjogSURpc3BhdGNoZXIpIHtcclxuICAgICAgICAgICAgc3VwZXIoZGlzcGF0Y2hlcik7XHJcblxyXG4gICAgICAgICAgICB0YWdOb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5maXJlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyZSgpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZSh0aGlzLmV4cHIpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuc2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS5zZXQodGhpcy50YWdOb2RlLnZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlKHRoaXMuZXhwcik7XHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHZhbHVlICYmIHZhbHVlLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKFwidmFsdWVcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShcInZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgYXR0ci52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZU5vZGUoYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZUJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhZ05vZGU6IGFueSwgcHJpdmF0ZSBuYW1lLCBwcml2YXRlIGV4cHIsIGRpc3BhdGNoZXI6IElEaXNwYXRjaGVyKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKGRpc3BhdGNoZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIHBhcmVudCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlKHRoaXMuZXhwcik7XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgISF2YWx1ZS52YWx1ZU9mKVxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS52YWx1ZU9mKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5hbWUgPT09IFwiY2hlY2tlZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9ICEhdmFsdWUgPyBcImNoZWNrZWRcIiA6IG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgYXR0ck5hbWUgPSB0aGlzLm5hbWU7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyTmFtZSA9PT0gXCJ2YWx1ZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZ1thdHRyTmFtZV0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgZnVuY3Rpb24gcGFyc2VUcGwodGV4dCkge1xyXG4gICAgICAgIHZhciBwYXJ0czogYW55W10gPSBbXTtcclxuXHJcbiAgICAgICAgdmFyIGFwcGVuZFRleHQgPSAoeCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgcyA9IHgudHJpbSgpO1xyXG4gICAgICAgICAgICBpZiAocy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDAsIHRleHRsZW5ndGggPSB0ZXh0Lmxlbmd0aDtcclxuICAgICAgICB3aGlsZSAob2Zmc2V0IDwgdGV4dGxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgYmVnaW4gPSB0ZXh0LmluZGV4T2YoXCJ7e1wiLCBvZmZzZXQpO1xyXG4gICAgICAgICAgICBpZiAoYmVnaW4gPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGJlZ2luID4gb2Zmc2V0KVxyXG4gICAgICAgICAgICAgICAgICAgIGFwcGVuZFRleHQodGV4dC5zdWJzdHJpbmcob2Zmc2V0LCBiZWdpbikpO1xyXG5cclxuICAgICAgICAgICAgICAgIG9mZnNldCA9IGJlZ2luICsgMjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVuZCA9IHRleHQuaW5kZXhPZihcIn19XCIsIG9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZW5kID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKGZzKHRleHQuc3Vic3RyaW5nKG9mZnNldCwgZW5kKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCA9IGVuZCArIDI7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBTeW50YXhFcnJvcihcIkV4cGVjdGVkICd9fScgYnV0IG5vdCBmb3VuZCBzdGFydGluZyBmcm9tIGluZGV4OiBcIiArIG9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRUZXh0KHRleHQuc3Vic3RyaW5nKG9mZnNldCkpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJ0c1swXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJ0cztcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oc2VwYXJhdG9yOiBzdHJpbmcsIHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMCA/IHZhbHVlLnNvcnQoKS5qb2luKHNlcGFyYXRvcikgOiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59XHJcblxyXG4vLyBSZVNoYXJwZXIgcmVzdG9yZSBJbmNvbnNpc3RlbnROYW1pbmdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IERvbTsiXX0=