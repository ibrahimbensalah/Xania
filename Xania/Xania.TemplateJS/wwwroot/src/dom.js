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
            var tag = new TagBinding(name, ns, children), length = attrs.length;
            for (var i = 0; i < length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            this.childBindings.push(tag.map(this));
            return tag;
        };
        return DomBinding;
    }());
    Dom.DomBinding = DomBinding;
    function parse(node) {
        return {
            template: parseNode(node),
            bind: function (target, store) {
                return this.template.accept(new DomBinding(target)).update(store);
            }
        };
    }
    Dom.parse = parse;
    function view(template) {
        return {
            template: template,
            bind: function (target, store) {
                return this.template.accept(new DomBinding(target)).update(store);
            }
        };
    }
    Dom.view = view;
    function parseAttr(tagElement, attr) {
        var name = attr.name;
        var tpl = fsharp_1.parseTpl(attr.value);
        tagElement.attr(name, tpl || attr.value);
        if (!!tagElement.name.match(/^input$/i) && !!attr.name.match(/^name$/i) && tagElement.getAttribute("value") != undefined) {
            var valueAccessor = fsharp_1.parseTpl(attr.value);
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
                    fragmentTemplate = new template_1.Template.FragmentTemplate(fsharp_1.parseTpl(attribute.value)).child(template_2);
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
                var tpl_1 = fsharp_1.parseTpl(textContent);
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
            _super.prototype.update.call(this, context);
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
            return new TextBinding(ast);
        };
        Fragment.prototype.content = function (ast, children, childIndex) {
            return new FragmentBinding(ast, children);
        };
        Fragment.prototype.tag = function (tagName, ns, attrs, children, childIndex) {
            var tag = new TagBinding(tagName, ns, children), length = attrs.length;
            for (var i = 0; i < length; i++) {
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
        TextBinding.prototype.dispose = function () {
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
        TagBinding.prototype.dispose = function () {
            this.tagNode.remove();
        };
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
            if (typeof ast === "string") {
                this.tagNode.setAttribute(name, ast);
            }
            else if (name === "class") {
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
            var childLength = this.childBindings.length;
            for (var i = 0; i < childLength; i++) {
                this.childBindings[i].update(context);
            }
            return this;
        };
        TagBinding.prototype.render = function (context) {
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
    TagBinding.eventNames = ["click", "mouseover", "mouseout", "blur", "change"];
    Dom.TagBinding = TagBinding;
    var ClassBinding = (function (_super) {
        __extends(ClassBinding, _super);
        function ClassBinding(parent) {
            var _this = _super.call(this) || this;
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
                var oldValue = this.oldValue, newValue = this.evaluate(this.baseClassTpl).valueOf();
                if (newValue === void 0 || newValue === null) {
                    tag.className = core_1.Core.empty;
                }
                else {
                    tag.className = newValue;
                }
                this.oldValue = newValue;
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
            this.values = [];
            tagNode.addEventListener(this.name, this.fire.bind(this));
        }
        EventBinding.prototype.fire = function () {
            this.expr.execute(this, this.context);
            var values = this.values, length = values.length;
            this.values = [];
            for (var i = 0; i < length; i++) {
                values[i].refresh();
            }
        };
        EventBinding.prototype.update = function (context) {
            this.context = context;
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
                var value = args[0].valueOf();
                args[1].set(value);
                return value;
            }
            return fun.apply(null, args.map(EventBinding.valueOf));
        };
        EventBinding.valueOf = function (x) {
            return x.valueOf();
        };
        EventBinding.prototype.member = function (target, name) {
            var value = target.get ? target.get(name) : target[name];
            if (value && typeof value.refresh === "function")
                this.values.push(value);
            else if (typeof value === "function" && typeof target.refresh === "function")
                this.values.push(target);
            return value;
        };
        return EventBinding;
    }());
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
            var oldValue = this.oldValue;
            var attrName = this.name;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dom;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSwrQkFBNkI7QUFDN0IsdUNBQTJDO0FBQzNDLHVDQUFxQztBQUNyQyxtQ0FBbUM7QUFFbkMsSUFBYyxHQUFHLENBK21CaEI7QUEvbUJELFdBQWMsR0FBRztJQUViLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFnQi9CO1FBR0ksb0JBQW9CLE1BQU07WUFBTixXQUFNLEdBQU4sTUFBTSxDQUFBO1lBRmxCLGtCQUFhLEdBQWtCLEVBQUUsQ0FBQztRQUcxQyxDQUFDO1FBRU0sb0JBQVMsR0FBaEIsVUFBaUIsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHO1lBQzdCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3JDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNsQixNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztZQUNMLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLENBQUM7UUFDTCxDQUFDO1FBRUQsMkJBQU0sR0FBTixVQUFPLE9BQW9CLEVBQUUsR0FBRyxFQUFFLEdBQVc7WUFDekMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztZQUNuRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVB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cmUnXHJcbmltcG9ydCB7IFJlYWN0aXZlIGFzIFJlIH0gZnJvbSAnLi9yZWFjdGl2ZSdcclxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tICcuL3RlbXBsYXRlJ1xyXG5pbXBvcnQgeyBwYXJzZVRwbCB9IGZyb20gXCIuL2ZzaGFycFwiXHJcblxyXG5leHBvcnQgbW9kdWxlIERvbSB7XHJcblxyXG4gICAgdmFyIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xyXG5cclxuICAgIGludGVyZmFjZSBJRG9tQmluZGluZyB7XHJcbiAgICAgICAgbGVuZ3RoO1xyXG4gICAgICAgIG1hcChwYXJlbnQpOiB0aGlzO1xyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICBkaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEb21WaXNpdG9yIGV4dGVuZHMgVGVtcGxhdGUuSVZpc2l0b3I8SURvbUJpbmRpbmc+IHtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3IHtcclxuICAgICAgICBiaW5kKHRhcmdldDogTm9kZSwgc3RvcmUpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBEb21CaW5kaW5nIHtcclxuICAgICAgICBwcml2YXRlIGNoaWxkQmluZGluZ3M6IElEb21CaW5kaW5nW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YXJnZXQpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBpbnNlcnREb20odGFyZ2V0LCBkb20sIGlkeCkge1xyXG4gICAgICAgICAgICBpZiAoaWR4IDwgdGFyZ2V0LmNoaWxkTm9kZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudCA9IHRhcmdldC5jaGlsZE5vZGVzW2lkeF07XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAhPT0gZG9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZShkb20sIGN1cnJlbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGRvbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChiaW5kaW5nOiBJRG9tQmluZGluZywgZG9tLCBpZHg6IG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gdGhpcy5jaGlsZEJpbmRpbmdzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IGNoaWxkLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBEb21CaW5kaW5nLmluc2VydERvbSh0aGlzLnRhcmdldCwgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dChleHByKTogVGV4dEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGV4dCA9IG5ldyBUZXh0QmluZGluZyhleHByKTtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2godGV4dC5tYXAodGhpcykpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29udGVudChhc3QsIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKTogRnJhZ21lbnRCaW5kaW5nIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSBuZXcgRnJhZ21lbnRCaW5kaW5nKGFzdCwgY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjb250ZW50Lm1hcCh0aGlzKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YWcobmFtZSwgbnMsIGF0dHJzLCBjaGlsZHJlbik6IFRhZ0JpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRhZ0JpbmRpbmcobmFtZSwgbnMsIGNoaWxkcmVuKSwgbGVuZ3RoID0gYXR0cnMubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaCh0YWcubWFwKHRoaXMpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKG5vZGUpOiBJVmlldyB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdGVtcGxhdGU6IHBhcnNlTm9kZShub2RlKSxcclxuICAgICAgICAgICAgYmluZCh0YXJnZXQsIHN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZS5hY2NlcHQobmV3IERvbUJpbmRpbmcodGFyZ2V0KSkudXBkYXRlKHN0b3JlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gYXMgSVZpZXc7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHZpZXcodGVtcGxhdGUpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZSxcclxuICAgICAgICAgICAgYmluZCh0YXJnZXQsIHN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZS5hY2NlcHQobmV3IERvbUJpbmRpbmcodGFyZ2V0KSkudXBkYXRlKHN0b3JlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gYXMgSVZpZXc7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcGFyc2VBdHRyKHRhZ0VsZW1lbnQ6IFRlbXBsYXRlLlRhZ1RlbXBsYXRlLCBhdHRyOiBBdHRyKSB7XHJcbiAgICAgICAgY29uc3QgbmFtZSA9IGF0dHIubmFtZTtcclxuICAgICAgICBjb25zdCB0cGwgPSBwYXJzZVRwbChhdHRyLnZhbHVlKTtcclxuICAgICAgICB0YWdFbGVtZW50LmF0dHIobmFtZSwgdHBsIHx8IGF0dHIudmFsdWUpO1xyXG5cclxuICAgICAgICAvLyBjb252ZW50aW9uc1xyXG4gICAgICAgIGlmICghIXRhZ0VsZW1lbnQubmFtZS5tYXRjaCgvXmlucHV0JC9pKSAmJiAhIWF0dHIubmFtZS5tYXRjaCgvXm5hbWUkL2kpICYmIHRhZ0VsZW1lbnQuZ2V0QXR0cmlidXRlKFwidmFsdWVcIikgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlQWNjZXNzb3IgPSBwYXJzZVRwbChhdHRyLnZhbHVlKTtcclxuICAgICAgICAgICAgdGFnRWxlbWVudC5hdHRyKFwidmFsdWVcIiwgdmFsdWVBY2Nlc3Nvcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlTm9kZShub2RlOiBOb2RlKTogVGVtcGxhdGUuSU5vZGUge1xyXG4gICAgICAgIHZhciBpOiBudW1iZXI7XHJcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEgJiYgbm9kZS5ub2RlTmFtZSA9PT0gXCJURU1QTEFURVwiKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSA8SFRNTEVsZW1lbnQ+bm9kZVtcImNvbnRlbnRcIl07XHJcbiAgICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZS5GcmFnbWVudFRlbXBsYXRlKG51bGwpO1xyXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY29udGVudC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHBsID0gcGFyc2VOb2RlKGNvbnRlbnQuY2hpbGROb2Rlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodHBsKVxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLmNoaWxkKHRwbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xyXG4gICAgICAgICAgICBjb25zdCBlbHQgPSA8SFRNTEVsZW1lbnQ+bm9kZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlLlRhZ1RlbXBsYXRlKGVsdC50YWdOYW1lLCBlbHQubmFtZXNwYWNlVVJJKTtcclxuICAgICAgICAgICAgdmFyIGZyYWdtZW50VGVtcGxhdGUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgZm9yIChpID0gMDsgISFlbHQuYXR0cmlidXRlcyAmJiBpIDwgZWx0LmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyaWJ1dGUgPSBlbHQuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyaWJ1dGUubmFtZSA9PT0gXCJkYXRhLXJlcGVhdFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnRUZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZS5GcmFnbWVudFRlbXBsYXRlKHBhcnNlVHBsKGF0dHJpYnV0ZS52YWx1ZSkpLmNoaWxkKHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VBdHRyKHRlbXBsYXRlLCBhdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IGVsdC5jaGlsZE5vZGVzLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBwYXJzZU5vZGUoZWx0LmNoaWxkTm9kZXNbZV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkKVxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLmFkZENoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZyYWdtZW50VGVtcGxhdGUgfHwgdGVtcGxhdGU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZXh0Q29udGVudCA9IG5vZGUudGV4dENvbnRlbnQ7XHJcbiAgICAgICAgICAgIGlmICh0ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdHBsID0gcGFyc2VUcGwodGV4dENvbnRlbnQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBUZW1wbGF0ZS5UZXh0VGVtcGxhdGUodHBsIHx8IG5vZGUudGV4dENvbnRlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBGcmFnbWVudEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBmcmFnbWVudHM6IEZyYWdtZW50W10gPSBbXTtcclxuICAgICAgICBwdWJsaWMgcGFyZW50OiBJQmluZGluZ1RhcmdldDtcclxuXHJcbiAgICAgICAgZ2V0IGxlbmd0aCgpIHtcclxuICAgICAgICAgICAgdmFyIHRvdGFsID0gMCwgbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0b3RhbCArPSB0aGlzLmZyYWdtZW50c1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRvdGFsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBhc3QsIHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHNbaV0uZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXAocGFyZW50OiBJQmluZGluZ1RhcmdldCk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyBzd2FwKGFycjogRnJhZ21lbnRbXSwgc3JjSW5kZXgsIHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgIGlmIChzcmNJbmRleCA+IHRhckluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaSA9IHNyY0luZGV4O1xyXG4gICAgICAgICAgICAgICAgc3JjSW5kZXggPSB0YXJJbmRleDtcclxuICAgICAgICAgICAgICAgIHRhckluZGV4ID0gaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNyYyA9IGFycltzcmNJbmRleF07XHJcbiAgICAgICAgICAgICAgICBhcnJbc3JjSW5kZXhdID0gYXJyW3RhckluZGV4XTtcclxuICAgICAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHN1cGVyLnVwZGF0ZShjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdHJlYW07XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuYXN0ICYmICEhdGhpcy5hc3QuZXhlY3V0ZSkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtID0gdGhpcy5hc3QuZXhlY3V0ZSh0aGlzLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ubGVuZ3RoID09PSB2b2lkIDApXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gW3N0cmVhbV07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSBbY29udGV4dF07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBmcjogRnJhZ21lbnQsIHN0cmVhbWxlbmd0aCA9IHN0cmVhbS5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyZWFtbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gc3RyZWFtW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBmcmFnbWVudDogRnJhZ21lbnQgPSBudWxsLCBmcmFnbGVuZ3RoID0gdGhpcy5mcmFnbWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZSA9IGk7IGUgPCBmcmFnbGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmciA9IHRoaXMuZnJhZ21lbnRzW2VdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmci5jb250ZXh0ID09PSBpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gZnI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZyYWdtZW50QmluZGluZy5zd2FwKHRoaXMuZnJhZ21lbnRzLCBlLCBpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmcmFnbWVudCA9PT0gbnVsbCAvKiBub3QgZm91bmQgKi8pIHtcclxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBGcmFnbWVudCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5wdXNoKGZyYWdtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICBGcmFnbWVudEJpbmRpbmcuc3dhcCh0aGlzLmZyYWdtZW50cywgZnJhZ2xlbmd0aCwgaSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQudXBkYXRlKGl0ZW0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5mcmFnbWVudHMubGVuZ3RoID4gc3RyZWFtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZyYWcgPSB0aGlzLmZyYWdtZW50cy5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGZyYWcuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RyZWFtO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5zZXJ0KGZyYWdtZW50OiBGcmFnbWVudCwgZG9tLCBpZHgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5mcmFnbWVudHNbaV0gPT09IGZyYWdtZW50KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5mcmFnbWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaWR4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBGcmFnbWVudCB7XHJcbiAgICAgICAgcHVibGljIGJpbmRpbmdzOiBJRG9tQmluZGluZ1tdID0gW107XHJcbiAgICAgICAgcHVibGljIGNvbnRleHQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgb3duZXI6IEZyYWdtZW50QmluZGluZykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IHRoaXMub3duZXIuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZV0gPVxyXG4gICAgICAgICAgICAgICAgICAgIG93bmVyLmNoaWxkcmVuW2VdLmFjY2VwdCh0aGlzIGFzIElEb21WaXNpdG9yLCBlKS5tYXAodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5iaW5kaW5ncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tpXS5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdldCBsZW5ndGgoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5iaW5kaW5ncy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICAgICAgdG90YWwgKz0gdGhpcy5iaW5kaW5nc1tqXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRvdGFsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMub3duZXIuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IGxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2VdLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChiaW5kaW5nOiBJRG9tQmluZGluZywgZG9tLCBpbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gdGhpcy5iaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuYmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMub3duZXIuaW5zZXJ0KHRoaXMsIGRvbSwgb2Zmc2V0ICsgaW5kZXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRleHQoYXN0LCBjaGlsZEluZGV4OiBudW1iZXIpOiBUZXh0QmluZGluZyB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVGV4dEJpbmRpbmcoYXN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBjb250ZW50KGFzdCwgY2hpbGRyZW4sIGNoaWxkSW5kZXg6IG51bWJlcik6IEZyYWdtZW50QmluZGluZyB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgRnJhZ21lbnRCaW5kaW5nKGFzdCwgY2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRhZyh0YWdOYW1lOiBzdHJpbmcsIG5zOiBzdHJpbmcsIGF0dHJzLCBjaGlsZHJlbiwgY2hpbGRJbmRleDogbnVtYmVyKTogVGFnQmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyh0YWdOYW1lLCBucywgY2hpbGRyZW4pLCBsZW5ndGggPSBhdHRycy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRhZy5hdHRyKGF0dHJzW2ldLm5hbWUsIGF0dHJzW2ldLnRwbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJQmluZGluZ1RhcmdldCB7XHJcbiAgICAgICAgaW5zZXJ0KHNlbmRlcjogSURvbUJpbmRpbmcsIGRvbSwgaWR4KTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGV4dEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyB0ZXh0Tm9kZTtcclxuICAgICAgICBwcm90ZWN0ZWQgdGFyZ2V0OiBJQmluZGluZ1RhcmdldDtcclxuICAgICAgICBwdWJsaWMgbGVuZ3RoID0gMTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMudGV4dE5vZGUgPSAoPGFueT5kb2N1bWVudCkuY3JlYXRlVGV4dE5vZGUoXCJcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLnRleHROb2RlLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFwKHRhcmdldDogSUJpbmRpbmdUYXJnZXQpOiB0aGlzIHtcclxuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XHJcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0Lmluc2VydCh0aGlzLCB0aGlzLnRleHROb2RlLCAwKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuZXZhbHVhdGUodGhpcy5leHByKTtcclxuICAgICAgICAgICAgLy8gaWYgKHJlc3VsdCAhPT0gdm9pZCAwKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0Tm9kZS5ub2RlVmFsdWUgPSByZXN1bHQgJiYgcmVzdWx0LnZhbHVlT2YoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRhZ0JpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyB0YWdOb2RlO1xyXG4gICAgICAgIHByaXZhdGUgYXR0cmlidXRlQmluZGluZ3MgPSBbXTtcclxuICAgICAgICBwcml2YXRlIGV2ZW50cyA9IHt9O1xyXG4gICAgICAgIHByaXZhdGUgY2xhc3NCaW5kaW5nID0gbmV3IENsYXNzQmluZGluZyh0aGlzKTtcclxuICAgICAgICBwcm90ZWN0ZWQgdGFyZ2V0OiBJQmluZGluZ1RhcmdldDtcclxuICAgICAgICBwdWJsaWMgbGVuZ3RoID0gMTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IodGFnTmFtZTogc3RyaW5nLCBwcml2YXRlIG5zOiBzdHJpbmcgPSBudWxsLCBwcml2YXRlIGNoaWxkQmluZGluZ3M6IElEb21CaW5kaW5nW10gPSBbXSkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICBpZiAobnMgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFnTm9kZSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVFbGVtZW50TlMobnMsIHRhZ05hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRCaW5kaW5ncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY2hpbGRCaW5kaW5nc1tpXS5tYXAodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGFnTm9kZS5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcCh0YXJnZXQ6IElCaW5kaW5nVGFyZ2V0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xyXG5cclxuICAgICAgICAgICAgdGhpcy50YXJnZXQuaW5zZXJ0KHRoaXMsIHRoaXMudGFnTm9kZSwgMCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoaWxkKGNoaWxkOiBJRG9tQmluZGluZyk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjaGlsZC5tYXAodGhpcykpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgZXZlbnROYW1lcyA9IFtcImNsaWNrXCIsIFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJibHVyXCIsIFwiY2hhbmdlXCJdO1xyXG5cclxuICAgICAgICBhdHRyKG5hbWUsIGFzdCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFzdCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YWdOb2RlLnNldEF0dHJpYnV0ZShuYW1lLCBhc3QpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiY2xhc3NcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0JpbmRpbmcuc2V0QmFzZUNsYXNzKGFzdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZS5zdGFydHNXaXRoKFwiY2xhc3MuXCIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzQmluZGluZy5hZGRDbGFzcyhuYW1lLnN1YnN0cig2KSwgYXN0KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChUYWdCaW5kaW5nLmV2ZW50TmFtZXMuaW5kZXhPZihuYW1lKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRCaW5kaW5nID0gbmV3IEV2ZW50QmluZGluZyh0aGlzLnRhZ05vZGUsIG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLnB1c2goZXZlbnRCaW5kaW5nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyQmluZGluZyA9IG5ldyBBdHRyaWJ1dGVCaW5kaW5nKHRoaXMsIG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLnB1c2goYXR0ckJpbmRpbmcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChiaW5kaW5nLCBkb20sIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRCaW5kaW5nc1tpXSA9PT0gYmluZGluZylcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmNoaWxkQmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIERvbUJpbmRpbmcuaW5zZXJ0RG9tKHRoaXMudGFnTm9kZSwgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb24obmFtZSwgYXN0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW25hbWVdID0gYXN0O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCk6IHRoaXMge1xyXG4gICAgICAgICAgICBzdXBlci51cGRhdGUoY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNsYXNzQmluZGluZy51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIHZhciBhdHRyTGVuZ3RoID0gdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgYXR0ckxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzW2VdLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGNoaWxkTGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZExlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbaV0udXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0KSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyKG5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLmV2ZW50c1tuYW1lXTtcclxuICAgICAgICAgICAgaWYgKCEhaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGhhbmRsZXIuZXhlY3V0ZSh0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIENsYXNzQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcbiAgICAgICAgcHJpdmF0ZSBjb25kaXRpb25zO1xyXG4gICAgICAgIHByaXZhdGUgb2xkVmFsdWU7XHJcbiAgICAgICAgcHJpdmF0ZSBiYXNlQ2xhc3NUcGw7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBUYWdCaW5kaW5nKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXRCYXNlQ2xhc3ModHBsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmFzZUNsYXNzVHBsID0gdHBsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWRkQ2xhc3MoY2xhc3NOYW1lLCBjb25kaXRpb24pIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmNvbmRpdGlvbnMpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmRpdGlvbnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29uZGl0aW9ucy5wdXNoKHsgY2xhc3NOYW1lLCBjb25kaXRpb24gfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy5wYXJlbnQudGFnTm9kZTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmJhc2VDbGFzc1RwbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5vbGRWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHRoaXMuZXZhbHVhdGUodGhpcy5iYXNlQ2xhc3NUcGwpLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IHZvaWQgMCB8fCBuZXdWYWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5jbGFzc05hbWUgPSBDb3JlLmVtcHR5O1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuY2xhc3NOYW1lID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9pZiAob2xkVmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwiY2xhc3NcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgYXR0ci52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICB0YWcuY2xhc3NOYW1lID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgLy99XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9sZFZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmRpdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25kaXRpb25MZW5ndGggPSB0aGlzLmNvbmRpdGlvbnMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb25kaXRpb25MZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB7IGNsYXNzTmFtZSwgY29uZGl0aW9uIH0gPSB0aGlzLmNvbmRpdGlvbnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGIgPSBjb25kaXRpb24uZXhlY3V0ZSh0aGlzLCBjb250ZXh0KS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWcuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHNldEF0dHJpYnV0ZShhdHRyTmFtZTogc3RyaW5nLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm9sZFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMucGFyZW50LnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2xkVmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZU5vZGUoYXR0cik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5jbGFzc05hbWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm9sZFZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRXZlbnRCaW5kaW5nIHtcclxuICAgICAgICBwcml2YXRlIGNvbnRleHQ7XHJcbiAgICAgICAgcHJpdmF0ZSB2YWx1ZXMgPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IodGFnTm9kZTogYW55LCBwcml2YXRlIG5hbWUsIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICB0YWdOb2RlLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5uYW1lLCB0aGlzLmZpcmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaXJlKCkge1xyXG4gICAgICAgICAgICB0aGlzLmV4cHIuZXhlY3V0ZSh0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gdGhpcy52YWx1ZXMsIGxlbmd0aCA9IHZhbHVlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVzID0gW107XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlc1tpXS5yZWZyZXNoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aGVyZShzb3VyY2UsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZWxlY3Qoc291cmNlLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBxdWVyeShwYXJhbSwgc291cmNlKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF3YWl0KG9ic2VydmFibGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QodmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwKGZ1biwgYXJnczogYW55W10pIHtcclxuICAgICAgICAgICAgaWYgKGZ1biA9PT0gXCJhc3NpZ25cIikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYXJnc1swXS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICBhcmdzWzFdLnNldCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgYXJncy5tYXAoRXZlbnRCaW5kaW5nLnZhbHVlT2YpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIHZhbHVlT2YoeCkge1xyXG4gICAgICAgICAgICByZXR1cm4geC52YWx1ZU9mKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtZW1iZXIodGFyZ2V0OiB7IGdldChuYW1lOiBzdHJpbmcpOyByZWZyZXNoPygpOyB9LCBuYW1lKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRhcmdldC5nZXQgPyB0YXJnZXQuZ2V0KG5hbWUpIDogdGFyZ2V0W25hbWVdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZS5yZWZyZXNoID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlcy5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIHRhcmdldC5yZWZyZXNoID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZhbHVlcy5wdXNoKHRhcmdldCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBBdHRyaWJ1dGVCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIG9sZFZhbHVlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVGFnQmluZGluZywgcHJpdmF0ZSBuYW1lLCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZSh0aGlzLmV4cHIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmICEhdmFsdWUudmFsdWVPZilcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudmFsdWVPZigpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5uYW1lID09PSBcImNoZWNrZWRcIikge1xyXG4gICAgICAgICAgICAgICAgbmV3VmFsdWUgPSAhIXZhbHVlID8gXCJjaGVja2VkXCIgOiBudWxsO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbmV3VmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5vbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBhdHRyTmFtZSA9IHRoaXMubmFtZTtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMucGFyZW50LnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2xkVmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZU5vZGUoYXR0cik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRhZ1thdHRyTmFtZV0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBuZXdWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oc2VwYXJhdG9yOiBzdHJpbmcsIHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMCA/IHZhbHVlLnNvcnQoKS5qb2luKHNlcGFyYXRvcikgOiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59XHJcblxyXG4vLyBSZVNoYXJwZXIgcmVzdG9yZSBJbmNvbnNpc3RlbnROYW1pbmdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IERvbTsiXX0=