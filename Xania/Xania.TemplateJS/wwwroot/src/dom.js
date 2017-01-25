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
                insert: function (child, idx) {
                    if (idx < this.parent.childNodes.length) {
                        var current = this.parent.childNodes[idx];
                        if (current !== child) {
                            this.parent.insertBefore(child, current);
                        }
                    }
                    else {
                        this.parent.appendChild(child);
                    }
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
        ContentBinding.swap = function (arr, srcIndex, tarIndex) {
            if (srcIndex > tarIndex) {
                this.swap(arr, tarIndex, srcIndex);
            }
            else if (srcIndex < tarIndex) {
                var src = arr[srcIndex];
                arr[srcIndex] = arr[tarIndex];
                arr[tarIndex] = src;
            }
        };
        ContentBinding.prototype.render = function () {
            var stream = this.ast === null ? [this.context] : fsharp_1.accept(this.ast, this, this.context);
            var fr;
            for (var i = 0; i < stream.length; i++) {
                var context = stream[i];
                var fragment = null;
                for (var e = i; e < this.fragments.length; e++) {
                    fr = this.fragments[e];
                    if (fr.context === context) {
                        fragment = fr;
                        ContentBinding.swap(this.fragments, e, i);
                        break;
                    }
                }
                if (fragment === null) {
                    fragment = new ContentFragment(this);
                    this.fragments.push(fragment);
                    ContentBinding.swap(this.fragments, this.fragments.length - 1, i);
                }
                fragment.setOrder(i);
                fragment.update(context);
            }
            for (var j = stream.length; j < this.fragments.length; j++) {
                fr = this.fragments[j];
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
        Object.defineProperty(ContentFragment.prototype, "offset", {
            get: function () {
                var offset = 0;
                for (var i = 0; i < this.owner.fragments.length; i++) {
                    var frag = this.owner.fragments[i];
                    if (frag.order < this.order) {
                        offset += frag.bindings.length;
                    }
                }
                return offset;
            },
            enumerable: true,
            configurable: true
        });
        ContentFragment.prototype.insert = function (dom, index) {
            this.owner.parent.insert(dom, this.offset + index);
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
                    console.log(dom, idx);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx1Q0FBMkM7QUFDM0MsbUNBQWlDO0FBQ2pDLHVDQUFxQztBQUNyQyxtQ0FBdUM7QUFFdkMsSUFBYyxHQUFHLENBc2hCaEI7QUF0aEJELFdBQWMsR0FBRztJQUViLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFTL0I7UUFDSSxvQkFBb0IsTUFBTTtZQUFOLFdBQU0sR0FBTixNQUFNLENBQUE7UUFDMUIsQ0FBQztRQUVELHlCQUFJLEdBQUosVUFBSyxJQUFJO1lBQ0wsTUFBTSxDQUFDLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFDRCw0QkFBTyxHQUFQLFVBQVEsR0FBRyxFQUFFLFFBQTBCO1lBQ25DLE1BQU0sQ0FBQyxJQUFJLGNBQWMsQ0FBQyxHQUFHLEVBQ3pCO2dCQUNJLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtnQkFDbkIsTUFBTSxZQUFDLEtBQUssRUFBRSxHQUFHO29CQUNiLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUN0QyxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDMUMsRUFBRSxDQUFDLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7NEJBQ3BCLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDN0MsQ0FBQztvQkFDTCxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNKLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuQyxDQUFDO2dCQUNMLENBQUM7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QztnQkFDL0IsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFFSixHQUFHLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDekMsQ0FBQztZQUNMLENBQUM7WUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUM3QixDQUFDO1FBQ0wsdUJBQUM7SUFBRCxDQUFDLEFBeENELENBQXNDLG1CQUFFLENBQUMsT0FBTyxHQXdDL0M7SUF4Q1ksb0JBQWdCLG1CQXdDNUIsQ0FBQTtBQXFCTCxDQUFDLEVBdGhCYSxHQUFHLEdBQUgsV0FBRyxLQUFILFdBQUcsUUFzaEJoQjtBQUVELGNBQXFCLFNBQWlCLEVBQUUsS0FBSztJQUN6QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbEUsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUxELG9CQUtDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29yZSB9IGZyb20gJy4vY29yZSdcclxuaW1wb3J0IHsgUmVhY3RpdmUgYXMgUmUgfSBmcm9tICcuL3JlYWN0aXZlJ1xyXG5pbXBvcnQgeyBhY2NlcHQgfSBmcm9tICcuL2ZzaGFycCdcclxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tICcuL3RlbXBsYXRlJ1xyXG5pbXBvcnQgeyBmc2hhcnAgYXMgZnMgfSBmcm9tIFwiLi9mc2hhcnBcIlxyXG5cclxuZXhwb3J0IG1vZHVsZSBEb20ge1xyXG5cclxuICAgIHZhciBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudDtcclxuXHJcbiAgICBpbnRlcmZhY2UgSVZpc2l0b3IgZXh0ZW5kcyBUZW1wbGF0ZS5JVmlzaXRvcjxSZS5CaW5kaW5nPiB7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElWaWV3IHtcclxuICAgICAgICBiaW5kKHRhcmdldDogeyBpbnNlcnQoZG9tLCBpZHgpIH0sIHN0b3JlKTtcclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBEb21CaW5kaW5nIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhcmdldCkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGV4dChleHByKTogUmUuQmluZGluZyB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgVGV4dEJpbmRpbmcoZXhwcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRlbnQoYXN0LCBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSk6IFJlLkJpbmRpbmcge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IENvbnRlbnRCaW5kaW5nKGFzdCxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHRoaXMudGFyZ2V0LFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydChjaGlsZCwgaWR4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZHggPCB0aGlzLnBhcmVudC5jaGlsZE5vZGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSB0aGlzLnBhcmVudC5jaGlsZE5vZGVzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAhPT0gY2hpbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudC5pbnNlcnRCZWZvcmUoY2hpbGQsIGN1cnJlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBhcyBhbnksIGNoaWxkcmVuKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGFnKG5hbWUsIG5zLCBhdHRycyk6IElWaXNpdG9yIHtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUYWdCaW5kaW5nKG5hbWUsIG5zKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRhZy5hdHRyKGF0dHJzW2ldLm5hbWUsIGF0dHJzW2ldLnRwbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBmdW5jdGlvbiBwYXJzZShub2RlKTogSVZpZXcge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlOiBwYXJzZU5vZGUobm9kZSksXHJcbiAgICAgICAgICAgIGJpbmQodGFyZ2V0LCBzdG9yZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGUuYWNjZXB0KG5ldyBEb21CaW5kaW5nKHRhcmdldCkpLnVwZGF0ZShzdG9yZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGFzIElWaWV3O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHBhcnNlVGV4dCh0ZXh0KTogYW55W10ge1xyXG4gICAgICAgIHZhciBwYXJ0czogYW55W10gPSBbXTtcclxuXHJcbiAgICAgICAgdmFyIGFwcGVuZFRleHQgPSAoeCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgcyA9IHgudHJpbSgpO1xyXG4gICAgICAgICAgICBpZiAocy5sZW5ndGggPiAwKVxyXG4gICAgICAgICAgICAgICAgcGFydHMucHVzaCh4KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcclxuICAgICAgICB3aGlsZSAob2Zmc2V0IDwgdGV4dC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGJlZ2luID0gdGV4dC5pbmRleE9mKFwie3tcIiwgb2Zmc2V0KTtcclxuICAgICAgICAgICAgaWYgKGJlZ2luID49IDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChiZWdpbiA+IG9mZnNldClcclxuICAgICAgICAgICAgICAgICAgICBhcHBlbmRUZXh0KHRleHQuc3Vic3RyaW5nKG9mZnNldCwgYmVnaW4pKTtcclxuXHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBiZWdpbiArIDI7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSB0ZXh0LmluZGV4T2YoXCJ9fVwiLCBvZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVuZCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFydHMucHVzaChmcyh0ZXh0LnN1YnN0cmluZyhvZmZzZXQsIGVuZCkpKTtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSBlbmQgKyAyO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3ludGF4RXJyb3IoXCJFeHBlY3RlZCAnfX0nIGJ1dCBub3QgZm91bmQgc3RhcnRpbmcgZnJvbSBpbmRleDogXCIgKyBvZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXBwZW5kVGV4dCh0ZXh0LnN1YnN0cmluZyhvZmZzZXQpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAxKVxyXG4gICAgICAgICAgICByZXR1cm4gcGFydHNbMF07XHJcblxyXG4gICAgICAgIHJldHVybiBwYXJ0cztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZUF0dHIodGFnRWxlbWVudDogVGVtcGxhdGUuVGFnVGVtcGxhdGUsIGF0dHI6IEF0dHIpIHtcclxuICAgICAgICBjb25zdCBuYW1lID0gYXR0ci5uYW1lO1xyXG4gICAgICAgIGNvbnN0IHRwbCA9IHBhcnNlVGV4dChhdHRyLnZhbHVlKTtcclxuICAgICAgICB0YWdFbGVtZW50LmF0dHIobmFtZSwgdHBsIHx8IGF0dHIudmFsdWUpO1xyXG5cclxuICAgICAgICAvLyBjb252ZW50aW9uc1xyXG4gICAgICAgIGlmICghIXRhZ0VsZW1lbnQubmFtZS5tYXRjaCgvXmlucHV0JC9pKSAmJiAhIWF0dHIubmFtZS5tYXRjaCgvXm5hbWUkL2kpICYmIHRhZ0VsZW1lbnQuZ2V0QXR0cmlidXRlKFwidmFsdWVcIikgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlQWNjZXNzb3IgPSBwYXJzZVRleHQoYXR0ci52YWx1ZSk7XHJcbiAgICAgICAgICAgIHRhZ0VsZW1lbnQuYXR0cihcInZhbHVlXCIsIHZhbHVlQWNjZXNzb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwYXJzZU5vZGUobm9kZTogTm9kZSk6IFRlbXBsYXRlLklOb2RlIHtcclxuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBub2RlLm5vZGVOYW1lID09PSBcIlRFTVBMQVRFXCIpIHtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IDxIVE1MRWxlbWVudD5ub2RlW1wiY29udGVudFwiXTtcclxuICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlLkNvbnRlbnRUZW1wbGF0ZShudWxsKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250ZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciB0cGwgPSBwYXJzZU5vZGUoY29udGVudC5jaGlsZE5vZGVzW2ldKTtcclxuICAgICAgICAgICAgICAgIGlmICh0cGwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUuY2hpbGQodHBsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm5vZGVUeXBlID09PSAxKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVsdCA9IDxIVE1MRWxlbWVudD5ub2RlO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUuVGFnVGVtcGxhdGUoZWx0LnRhZ05hbWUsIGVsdC5uYW1lc3BhY2VVUkkpO1xyXG4gICAgICAgICAgICB2YXIgY29udGVudCA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgISFlbHQuYXR0cmlidXRlcyAmJiBpIDwgZWx0LmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyaWJ1dGUgPSBlbHQuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyaWJ1dGUubmFtZSA9PT0gXCJkYXRhLXJlcGVhdFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IG5ldyBUZW1wbGF0ZS5Db250ZW50VGVtcGxhdGUocGFyc2VUZXh0KGF0dHJpYnV0ZS52YWx1ZSkpLmNoaWxkKHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VBdHRyKHRlbXBsYXRlLCBhdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IGVsdC5jaGlsZE5vZGVzLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBwYXJzZU5vZGUoZWx0LmNoaWxkTm9kZXNbZV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkKVxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLmFkZENoaWxkKGNoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQgfHwgdGVtcGxhdGU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZXh0Q29udGVudCA9IG5vZGUudGV4dENvbnRlbnQ7XHJcbiAgICAgICAgICAgIGlmICh0ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdHBsID0gcGFyc2VUZXh0KHRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKHRwbCB8fCBub2RlLnRleHRDb250ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQ29udGVudEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgZnJhZ21lbnRzOiBDb250ZW50RnJhZ21lbnRbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFzdCwgcHVibGljIHBhcmVudDogeyBpbnNlcnQobjogTm9kZSwgaWR4OiBudW1iZXIpIH0sIHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgc3dhcChhcnI6IENvbnRlbnRGcmFnbWVudFtdLCBzcmNJbmRleCwgdGFySW5kZXgpIHtcclxuICAgICAgICAgICAgaWYgKHNyY0luZGV4ID4gdGFySW5kZXgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3dhcChhcnIsIHRhckluZGV4LCBzcmNJbmRleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoc3JjSW5kZXggPCB0YXJJbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNyYyA9IGFycltzcmNJbmRleF07XHJcbiAgICAgICAgICAgICAgICBhcnJbc3JjSW5kZXhdID0gYXJyW3RhckluZGV4XTtcclxuICAgICAgICAgICAgICAgIGFyclt0YXJJbmRleF0gPSBzcmM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgdmFyIHN0cmVhbSA9IHRoaXMuYXN0ID09PSBudWxsID8gW3RoaXMuY29udGV4dF0gOiBhY2NlcHQodGhpcy5hc3QsIHRoaXMsIHRoaXMuY29udGV4dCk7XHJcbiAgICAgICAgICAgIHZhciBmcjogQ29udGVudEZyYWdtZW50O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmVhbS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzdHJlYW1baV07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGZyYWdtZW50OiBDb250ZW50RnJhZ21lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZSA9IGk7IGUgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyID0gdGhpcy5mcmFnbWVudHNbZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZyLmNvbnRleHQgPT09IGNvbnRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBmcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgQ29udGVudEJpbmRpbmcuc3dhcCh0aGlzLmZyYWdtZW50cywgZSwgaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZnJhZ21lbnQgPT09IG51bGwgLyogbm90IGZvdW5kICovKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBuZXcgQ29udGVudEZyYWdtZW50KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzLnB1c2goZnJhZ21lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIENvbnRlbnRCaW5kaW5nLnN3YXAodGhpcy5mcmFnbWVudHMsIHRoaXMuZnJhZ21lbnRzLmxlbmd0aCAtIDEsIGkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZyYWdtZW50LnNldE9yZGVyKGkpO1xyXG4gICAgICAgICAgICAgICAgZnJhZ21lbnQudXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gc3RyZWFtLmxlbmd0aDsgaiA8IHRoaXMuZnJhZ21lbnRzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICBmciA9IHRoaXMuZnJhZ21lbnRzW2pdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RyZWFtO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBDb250ZW50RnJhZ21lbnQge1xyXG4gICAgICAgIHB1YmxpYyBiaW5kaW5nczogUmUuQmluZGluZ1tdID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBvcmRlcjogbnVtYmVyO1xyXG4gICAgICAgIHB1YmxpYyBjb250ZXh0O1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG93bmVyOiBDb250ZW50QmluZGluZykge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCB0aGlzLm93bmVyLmNoaWxkcmVuLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2VdID1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyLmNoaWxkcmVuW2VdLmFjY2VwdCh0aGlzIGFzIElWaXNpdG9yLCBlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAudXBkYXRlKHRoaXMuY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXRPcmRlcihpKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3JkZXIgPSBpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ2V0IG9mZnNldCgpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vd25lci5mcmFnbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBmcmFnID0gdGhpcy5vd25lci5mcmFnbWVudHNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoZnJhZy5vcmRlciA8IHRoaXMub3JkZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gZnJhZy5iaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIG9mZnNldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChkb20sIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHRoaXMub3duZXIucGFyZW50Lmluc2VydChkb20sIHRoaXMub2Zmc2V0ICsgaW5kZXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRleHQoYXN0LCBjaGlsZEluZGV4OiBudW1iZXIpOiBUZXh0QmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciBiaW5kaW5nID0gbmV3IFRleHRCaW5kaW5nKGFzdCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0KGJpbmRpbmcuZG9tLCBjaGlsZEluZGV4KTtcclxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgY29udGVudChhc3QsIGNoaWxkcmVuLCBjaGlsZEluZGV4OiBudW1iZXIpOiBDb250ZW50QmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciBmcmFnID0gdGhpcztcclxuICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgQ29udGVudEJpbmRpbmcoYXN0LCB7XHJcbiAgICAgICAgICAgICAgICBpbnNlcnQoZG9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnJhZy5pbnNlcnQoZG9tLCBjaGlsZEluZGV4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB0YWcodGFnTmFtZTogc3RyaW5nLCBuczogc3RyaW5nLCBhdHRycywgY2hpbGRJbmRleDogbnVtYmVyKTogVGFnQmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyh0YWdOYW1lLCBucyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluc2VydCh0YWcuZG9tLCBjaGlsZEluZGV4KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUZXh0QmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICB0aGlzLmRvbSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZShhY2NlcHQsIHRoaXMuZXhwcik7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZG9tLmRldGFjaCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb20udGV4dENvbnRlbnQgPSByZXN1bHQgJiYgcmVzdWx0LnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJVmlzaXRvciB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIGF0dHJpYnV0ZUJpbmRpbmdzID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBjaGlsZEJpbmRpbmdzOiBSZS5CaW5kaW5nW10gPSBbXTtcclxuICAgICAgICBwcml2YXRlIGV2ZW50cyA9IHt9O1xyXG4gICAgICAgIHByaXZhdGUgYXBwZW5kQ2hpbGQgPSBkb20gPT4gdGhpcy5kb20uYXBwZW5kQ2hpbGQoZG9tKTtcclxuICAgICAgICBwcml2YXRlIGNsYXNzQmluZGluZyA9IG5ldyBDbGFzc0JpbmRpbmcodGhpcyk7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHRhZ05hbWU6IHN0cmluZywgcHJpdmF0ZSBuczogc3RyaW5nID0gbnVsbCkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICBpZiAobnMgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb20gPSAoPGFueT5kb2N1bWVudCkuY3JlYXRlRWxlbWVudE5TKG5zLCB0YWdOYW1lLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgZXZlbnROYW1lcyA9IFtcImNsaWNrXCIsIFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJibHVyXCIsIFwiY2hhbmdlXCJdO1xyXG5cclxuICAgICAgICBhdHRyKG5hbWUsIGFzdCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gXCJjbGFzc1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzQmluZGluZy5zZXRCYXNlQ2xhc3MoYXN0KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lLnN0YXJ0c1dpdGgoXCJjbGFzcy5cIikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NCaW5kaW5nLmFkZENsYXNzKG5hbWUuc3Vic3RyKDYpLCBhc3QpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRhZ0JpbmRpbmcuZXZlbnROYW1lcy5pbmRleE9mKG5hbWUpID49IDApIHtcclxuICAgICAgICAgICAgICAgIHZhciBldmVudEJpbmRpbmcgPSBuZXcgRXZlbnRCaW5kaW5nKHRoaXMsIG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLnB1c2goZXZlbnRCaW5kaW5nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyQmluZGluZyA9IG5ldyBBdHRyaWJ1dGVCaW5kaW5nKHRoaXMsIG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLnB1c2goYXR0ckJpbmRpbmcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uKG5hbWUsIGFzdCk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tuYW1lXSA9IGFzdDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRleHQoYXN0KTogVGV4dEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBUZXh0QmluZGluZyhhc3QpO1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChiaW5kaW5nKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuY29udGV4dClcclxuICAgICAgICAgICAgICAgIGJpbmRpbmcudXBkYXRlKHRoaXMuY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGJpbmRpbmcuZG9tKTtcclxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgY29udGVudChhc3QsIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKTogQ29udGVudEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0ge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50OiB0aGlzLmRvbSxcclxuICAgICAgICAgICAgICAgIGluc2VydChkb20sIGlkeCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRvbSwgaWR4KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQuYXBwZW5kQ2hpbGQoZG9tKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBDb250ZW50QmluZGluZyhhc3QsIHRhcmdldCwgY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5jb250ZXh0KVxyXG4gICAgICAgICAgICAgICAgYmluZGluZy51cGRhdGUodGhpcy5jb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncy5wdXNoKGJpbmRpbmcpO1xyXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB0YWcodGFnTmFtZTogc3RyaW5nLCBuczogc3RyaW5nLCBhdHRycywgb3B0aW9uczogYW55KTogVGFnQmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyh0YWdOYW1lLCBucyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncy5wdXNoKHRhZyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRhZy5kb20pO1xyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQpOiB0aGlzIHtcclxuICAgICAgICAgICAgc3VwZXIudXBkYXRlKGNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jbGFzc0JpbmRpbmcudXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IHRoaXMuYXR0cmlidXRlQmluZGluZ3MubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlQmluZGluZ3NbZV0udXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzW2ldLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kb207XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyKG5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLmV2ZW50c1tuYW1lXTtcclxuICAgICAgICAgICAgaWYgKCEhaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGFjY2VwdChoYW5kbGVyLCB0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIENsYXNzQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcbiAgICAgICAgcHJpdmF0ZSBjb25kaXRpb25zID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuICAgICAgICBwcml2YXRlIGJhc2VDbGFzc1RwbDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFRhZ0JpbmRpbmcpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldEJhc2VDbGFzcyh0cGwpIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlQ2xhc3NUcGwgPSB0cGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhZGRDbGFzcyhjbGFzc05hbWUsIGNvbmRpdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLmNvbmRpdGlvbnMucHVzaCh7IGNsYXNzTmFtZSwgY29uZGl0aW9uIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IFtdO1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmJhc2VDbGFzc1RwbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYWNjZXB0KHRoaXMuYmFzZUNsYXNzVHBsLCB0aGlzLCBjb250ZXh0KS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY29uZGl0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHsgY2xhc3NOYW1lLCBjb25kaXRpb24gfSA9IHRoaXMuY29uZGl0aW9uc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmICghIWFjY2VwdChjb25kaXRpb24sIHRoaXMsIGNvbnRleHQpLnZhbHVlT2YoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaChjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGNsYXNzZXMubGVuZ3RoID4gMCA/IGpvaW4oXCIgXCIsIGNsYXNzZXMpIDogbnVsbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc2V0QXR0cmlidXRlKGF0dHJOYW1lOiBzdHJpbmcsIG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMub2xkVmFsdWU7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy5wYXJlbnQuZG9tO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5ld1ZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9sZFZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmNsYXNzTmFtZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBFdmVudEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVGFnQmluZGluZywgcHJpdmF0ZSBuYW1lLCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMucGFyZW50LmRvbTtcclxuICAgICAgICAgICAgdGFnLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5uYW1lLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlKGFjY2VwdCwgdGhpcy5leHByKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoZnVuLCBhcmdzOiBhbnlbXSkge1xyXG4gICAgICAgICAgICBpZiAoZnVuID09PSBcImFzc2lnblwiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBhcmdzWzBdLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIGFyZ3NbMV0uc2V0KHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN1cGVyLmFwcChmdW4sIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQXR0cmlidXRlQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFRhZ0JpbmRpbmcsIHByaXZhdGUgbmFtZSwgcHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGUoYWNjZXB0LCB0aGlzLmV4cHIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB2b2lkIDAgJiYgISF2YWx1ZS52YWx1ZU9mKVxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS52YWx1ZU9mKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5hbWUgPT09IFwiY2hlY2tlZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9ICEhdmFsdWUgPyBcImNoZWNrZWRcIiA6IG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm9sZFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGF0dHJOYW1lID0gdGhpcy5uYW1lO1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy5wYXJlbnQuZG9tO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5ld1ZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9sZFZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdGFnW2F0dHJOYW1lXSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIG5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm9sZFZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vZXhwb3J0IGZ1bmN0aW9uIGltcG9ydFZpZXcodmlldzogc3RyaW5nLCAuLi5hcmdzKTogYW55IHtcclxuICAgIC8vICAgIGlmICghKFwiaW1wb3J0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpbmtcIikpKSB7XHJcbiAgICAvLyAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSFRNTCBpbXBvcnQgaXMgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXJcIik7XHJcbiAgICAvLyAgICB9XHJcblxyXG4gICAgLy8gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcclxuICAgIC8vICAgIHZhciBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xyXG4gICAgLy8gICAgbGluay5yZWwgPSAnaW1wb3J0JztcclxuICAgIC8vICAgIGxpbmsuaHJlZiA9IHZpZXc7XHJcbiAgICAvLyAgICBsaW5rLnNldEF0dHJpYnV0ZSgnYXN5bmMnLCBcIlwiKTsgLy8gbWFrZSBpdCBhc3luYyFcclxuICAgIC8vICAgIGxpbmsub25sb2FkID0gZSA9PiB7XHJcbiAgICAvLyAgICAgICAgdmFyIGxpbmsgPSAoPGFueT5lLnRhcmdldCk7XHJcbiAgICAvLyAgICAgICAgZGVmZXJyZWQubm90aWZ5KGxpbmsuaW1wb3J0LnF1ZXJ5U2VsZWN0b3IoXCJ0ZW1wbGF0ZVwiKSk7XHJcbiAgICAvLyAgICAgICAgbGluay5vbmxvYWQgPSBudWxsO1xyXG4gICAgLy8gICAgfVxyXG4gICAgLy8gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChsaW5rKTtcclxuXHJcbiAgICAvLyAgICByZXR1cm4gZGVmZXJyZWQ7XHJcbiAgICAvL31cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oc2VwYXJhdG9yOiBzdHJpbmcsIHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMCA/IHZhbHVlLnNvcnQoKS5qb2luKHNlcGFyYXRvcikgOiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59XHJcblxyXG4gICAgLy8gUmVTaGFycGVyIHJlc3RvcmUgSW5jb25zaXN0ZW50TmFtaW5nXHJcbiJdfQ==