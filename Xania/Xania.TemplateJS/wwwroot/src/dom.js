"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var reactive_1 = require("./reactive");
var fsharp_1 = require("./fsharp");
var Dom;
(function (Dom) {
    var document = window.document;
    var ContentBinding = (function (_super) {
        __extends(ContentBinding, _super);
        function ContentBinding(ast, parentInsert, children) {
            var _this = _super.call(this) || this;
            _this.ast = ast;
            _this.parentInsert = parentInsert;
            _this.children = children;
            _this.fragments = [];
            return _this;
        }
        ContentBinding.prototype.render = function () {
            var stream = this.ast === null ? [this.context] : fsharp_1.accept(this.ast, this, this.context);
            var offset = 0;
            for (var i = 0; i < stream.length; i++) {
                var context = stream[i];
                var fragment = null;
                for (var e = i; e < this.fragments.length; e++) {
                    var f = this.fragments[e];
                    if (f.context === context) {
                        fragment = f;
                        if (e !== i) {
                            this.fragments.splice(e, 1);
                        }
                    }
                }
                if (fragment === null) {
                    fragment = new ContentFragment(this, context, offset);
                }
                if (i < this.fragments.length) {
                    this.fragments.splice(i, 0, fragment);
                }
                else {
                    this.fragments.push(fragment);
                }
                offset += this.children.length;
            }
            return stream;
        };
        ContentBinding.prototype.text = function (ast, options) {
            var binding = new TextBinding(ast);
            options.fragment.insert(binding.dom, options.child);
            return binding;
        };
        ContentBinding.prototype.content = function (ast, children, options) {
            var binding = new ContentBinding(ast, function (dom) { return options.fragment.insert(dom, options.child); }, children);
            return binding;
        };
        ContentBinding.prototype.tag = function (tagName, ns, attrs, events, children, options) {
            var tag = new TagBinding(tagName, ns);
            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            for (var e = 0; e < children.length; e++) {
                tag.child(children[e]);
            }
            options.fragment.insert(tag.dom, options.child);
            return tag;
        };
        return ContentBinding;
    }(reactive_1.Reactive.Binding));
    Dom.ContentBinding = ContentBinding;
    var ContentFragment = (function () {
        function ContentFragment(owner, context, offset) {
            this.owner = owner;
            this.context = context;
            this.offset = offset;
            this.bindings = [];
            for (var e = 0; e < owner.children.length; e++) {
                this.bindings[e] =
                    owner.children[e].accept(owner, { fragment: this, child: e }).update(context);
            }
        }
        ContentFragment.prototype.insert = function (dom, index) {
            this.owner.parentInsert(dom, this.offset + index);
        };
        return ContentFragment;
    }());
    var TextBinding = (function (_super) {
        __extends(TextBinding, _super);
        function TextBinding(parts) {
            var _this = _super.call(this) || this;
            _this.parts = parts;
            _this.dom = document.createTextNode("");
            return _this;
        }
        TextBinding.prototype.render = function (context) {
            var result = this.evaluate(this.parts, context);
            if (result === undefined) {
                this.dom.detach();
            }
            else {
                var newValue = result && result.valueOf();
                if (!!newValue && !!newValue.onNext) {
                    newValue.subscribe(this);
                }
                else {
                    this.onNext(newValue);
                }
            }
        };
        TextBinding.prototype.onNext = function (newValue) {
            this.dom.textContent = newValue;
        };
        TextBinding.prototype.evaluate = function (parts, context) {
            var _this = this;
            if (typeof this.parts.length === "number") {
                if (this.parts.length === 0)
                    return "";
                if (this.parts.length === 1)
                    return this.evaluatePart(this.parts[0], context);
                return this.parts.map(function (p) { return _this.evaluatePart(p, context); }).join("");
            }
            else {
                return this.evaluatePart(this.parts, context);
            }
        };
        TextBinding.prototype.evaluatePart = function (part, context) {
            if (typeof part === "string")
                return part;
            else {
                return fsharp_1.accept(part, this, context);
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
            _this.dom.attributes["__binding"] = _this;
            return _this;
        }
        TagBinding.prototype.attr = function (name, ast) {
            if (name === "class") {
                this.classBinding.setBaseClass(ast);
            }
            else if (name.startsWith("class.")) {
                this.classBinding.addClass(name.substr(6), ast);
            }
            else {
                var attrBinding = new AttributeBinding(this, name, ast);
                this.attributeBindings.push(attrBinding);
            }
            return this;
        };
        TagBinding.prototype.child = function (child) {
            if (!!this.context)
                child.update(this.context);
            this.childBindings.push(child);
            return this;
        };
        TagBinding.prototype.on = function (name, ast) {
            this.events[name] = ast;
            return this;
        };
        TagBinding.prototype.text = function (ast) {
            var binding = new TextBinding(ast);
            this.appendChild(binding.dom);
            return binding;
        };
        TagBinding.prototype.content = function (ast, children) {
            var binding = new ContentBinding(ast, this.appendChild, children);
            return binding;
        };
        TagBinding.prototype.update = function (context) {
            _super.prototype.update.call(this, context);
            this.classBinding.update(context);
            for (var i = 0; i < this.childBindings.length; i++) {
                this.childBindings[i].update(context);
            }
            for (var e = 0; e < this.attributeBindings.length; e++) {
                this.attributeBindings[e].update(context);
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
    var AttributeBinding = (function (_super) {
        __extends(AttributeBinding, _super);
        function AttributeBinding(parent, name, tpl) {
            var _this = _super.call(this) || this;
            _this.parent = parent;
            _this.name = name;
            _this.tpl = tpl;
            return _this;
        }
        AttributeBinding.prototype.render = function (context) {
            this.context = context;
            var value = fsharp_1.accept(this.tpl, this, context);
            if (!!value && !!value.onNext) {
                value.subscribe(this);
            }
            else {
                this.onNext(value);
            }
        };
        AttributeBinding.prototype.onNext = function (value) {
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
                    tag[attrName] = newValue;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx1Q0FBMkM7QUFDM0MsbUNBQWlDO0FBR2pDLElBQWMsR0FBRyxDQXFsQmhCO0FBcmxCRCxXQUFjLEdBQUc7SUFFYixJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO0lBSy9CO1FBQW9DLGtDQUFVO1FBRzFDLHdCQUFvQixHQUFHLEVBQVMsWUFBNEMsRUFBUyxRQUEwQjtZQUEvRyxZQUNJLGlCQUFPLFNBQ1Y7WUFGbUIsU0FBRyxHQUFILEdBQUcsQ0FBQTtZQUFTLGtCQUFZLEdBQVosWUFBWSxDQUFnQztZQUFTLGNBQVEsR0FBUixRQUFRLENBQWtCO1lBRnZHLGVBQVMsR0FBc0IsRUFBRSxDQUFDOztRQUkxQyxDQUFDO1FBRUQsK0JBQU0sR0FBTjtZQUNJLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxHQUFHLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxHQUFHLGVBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFekYsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFeEIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUNwQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxH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J1xyXG5pbXBvcnQgeyBSZWFjdGl2ZSBhcyBSZSB9IGZyb20gJy4vcmVhY3RpdmUnXHJcbmltcG9ydCB7IGFjY2VwdCB9IGZyb20gJy4vZnNoYXJwJ1xyXG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJy4vdGVtcGxhdGUnXHJcblxyXG5leHBvcnQgbW9kdWxlIERvbSB7XHJcblxyXG4gICAgdmFyIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xyXG5cclxuICAgIGludGVyZmFjZSBJVmlzaXRvciBleHRlbmRzIFRlbXBsYXRlLklWaXNpdG9yPFJlLkJpbmRpbmc+IHtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQ29udGVudEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSVZpc2l0b3Ige1xyXG4gICAgICAgIHByaXZhdGUgZnJhZ21lbnRzOiBDb250ZW50RnJhZ21lbnRbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFzdCwgcHVibGljIHBhcmVudEluc2VydDogKG46IE5vZGUsIGlkeDogbnVtYmVyKSA9PiB2b2lkLCBwdWJsaWMgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgdmFyIHN0cmVhbSA9IHRoaXMuYXN0ID09PSBudWxsID8gWyB0aGlzLmNvbnRleHQgXSA6IGFjY2VwdCh0aGlzLmFzdCwgdGhpcywgdGhpcy5jb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmVhbS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzdHJlYW1baV07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGZyYWdtZW50ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGUgPSBpOyBlIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZiA9IHRoaXMuZnJhZ21lbnRzW2VdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmLmNvbnRleHQgPT09IGNvbnRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBmO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZSAhPT0gaSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZm91bmQgZnJhZ21lbnQgYXQgZSBieSBzaG91bGQgYmUgbG9jYXRlZCBhdCBpICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5zcGxpY2UoZSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGZyYWdtZW50ID09PSBudWxsIC8qIG5vdCBmb3VuZCAqLykge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IG5ldyBDb250ZW50RnJhZ21lbnQodGhpcywgY29udGV4dCwgb2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaSA8IHRoaXMuZnJhZ21lbnRzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzLnNwbGljZShpLCAwLCBmcmFnbWVudCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzLnB1c2goZnJhZ21lbnQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmNoaWxkcmVuLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHN0cmVhbTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB0ZXh0KGFzdCwgb3B0aW9uczogeyBmcmFnbWVudDogQ29udGVudEZyYWdtZW50LCBjaGlsZDogbnVtYmVyIH0pOiBUZXh0QmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciBiaW5kaW5nID0gbmV3IFRleHRCaW5kaW5nKGFzdCk7XHJcbiAgICAgICAgICAgIG9wdGlvbnMuZnJhZ21lbnQuaW5zZXJ0KGJpbmRpbmcuZG9tLCBvcHRpb25zLmNoaWxkKTtcclxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgY29udGVudChhc3QsIGNoaWxkcmVuLCBvcHRpb25zOiB7IGZyYWdtZW50OiBDb250ZW50RnJhZ21lbnQsIGNoaWxkOiBudW1iZXIgfSk6IENvbnRlbnRCaW5kaW5nIHtcclxuICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgQ29udGVudEJpbmRpbmcoYXN0LCBkb20gPT4gb3B0aW9ucy5mcmFnbWVudC5pbnNlcnQoZG9tLCBvcHRpb25zLmNoaWxkKSwgY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyB0YWcodGFnTmFtZTogc3RyaW5nLCBuczogc3RyaW5nLCBhdHRycywgZXZlbnRzLCBjaGlsZHJlbjogUmUuQmluZGluZ1tdLCBvcHRpb25zOiBhbnkpIDogVGFnQmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyh0YWdOYW1lLCBucyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IGNoaWxkcmVuLmxlbmd0aDsgZSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuY2hpbGQoY2hpbGRyZW5bZV0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBvcHRpb25zLmZyYWdtZW50Lmluc2VydCh0YWcuZG9tLCBvcHRpb25zLmNoaWxkKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIENvbnRlbnRGcmFnbWVudCB7XHJcbiAgICAgICAgcHVibGljIGJpbmRpbmdzOiBSZS5CaW5kaW5nW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBvd25lcjogQ29udGVudEJpbmRpbmcsIHB1YmxpYyBjb250ZXh0LCBwcml2YXRlIG9mZnNldDogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgb3duZXIuY2hpbGRyZW4ubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZV0gPVxyXG4gICAgICAgICAgICAgICAgICAgIG93bmVyLmNoaWxkcmVuW2VdLmFjY2VwdChvd25lciBhcyBJVmlzaXRvciwgeyBmcmFnbWVudDogdGhpcywgY2hpbGQ6IGUgfSkudXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnNlcnQoZG9tLCBpbmRleCkge1xyXG4gICAgICAgICAgICB0aGlzLm93bmVyLnBhcmVudEluc2VydChkb20sIHRoaXMub2Zmc2V0ICsgaW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGV4dEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgZG9tO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcnRzKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZG9tID0gKDxhbnk+ZG9jdW1lbnQpLmNyZWF0ZVRleHROb2RlKFwiXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZSh0aGlzLnBhcnRzLCBjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb20uZGV0YWNoKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSByZXN1bHQgJiYgcmVzdWx0LnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoISFuZXdWYWx1ZSAmJiAhIW5ld1ZhbHVlLm9uTmV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlLnN1YnNjcmliZSh0aGlzKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk5leHQobmV3VmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbk5leHQobmV3VmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5kb20udGV4dENvbnRlbnQgPSBuZXdWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlKHBhcnRzLCBjb250ZXh0KTogYW55IHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnRzLmxlbmd0aCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFydHMubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBhcnRzLmxlbmd0aCA9PT0gMSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ldmFsdWF0ZVBhcnQodGhpcy5wYXJ0c1swXSwgY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFydHMubWFwKHAgPT4gdGhpcy5ldmFsdWF0ZVBhcnQocCwgY29udGV4dCkpLmpvaW4oXCJcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5ldmFsdWF0ZVBhcnQodGhpcy5wYXJ0cywgY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlUGFydChwYXJ0OiBhbnksIGNvbnRleHQpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJ0ID09PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnQ7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY2VwdChwYXJ0LCB0aGlzLCBjb250ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJVmlzaXRvciB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIGF0dHJpYnV0ZUJpbmRpbmdzID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBjaGlsZEJpbmRpbmdzOiBSZS5CaW5kaW5nW10gPSBbXTtcclxuICAgICAgICBwcml2YXRlIGV2ZW50cyA9IHt9O1xyXG4gICAgICAgIHByaXZhdGUgYXBwZW5kQ2hpbGQgPSBkb20gPT4gdGhpcy5kb20uYXBwZW5kQ2hpbGQoZG9tKTtcclxuICAgICAgICBwcml2YXRlIGNsYXNzQmluZGluZyA9IG5ldyBDbGFzc0JpbmRpbmcodGhpcyk7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHRhZ05hbWU6IHN0cmluZywgcHJpdmF0ZSBuczogc3RyaW5nID0gbnVsbCkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICBpZiAobnMgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb20gPSAoPGFueT5kb2N1bWVudCkuY3JlYXRlRWxlbWVudE5TKG5zLCB0YWdOYW1lLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmRvbS5hdHRyaWJ1dGVzW1wiX19iaW5kaW5nXCJdID0gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF0dHIobmFtZSwgYXN0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBcImNsYXNzXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NCaW5kaW5nLnNldEJhc2VDbGFzcyhhc3QpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUuc3RhcnRzV2l0aChcImNsYXNzLlwiKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0JpbmRpbmcuYWRkQ2xhc3MobmFtZS5zdWJzdHIoNiksIGFzdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ckJpbmRpbmcgPSBuZXcgQXR0cmlidXRlQmluZGluZyh0aGlzLCBuYW1lLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5wdXNoKGF0dHJCaW5kaW5nKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGlsZChjaGlsZDogUmUuQmluZGluZyk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmNvbnRleHQpXHJcbiAgICAgICAgICAgICAgICBjaGlsZC51cGRhdGUodGhpcy5jb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncy5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbihuYW1lLCBhc3QpIDogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW25hbWVdID0gYXN0O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdGV4dChhc3QpOiBUZXh0QmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciBiaW5kaW5nID0gbmV3IFRleHRCaW5kaW5nKGFzdCk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoYmluZGluZy5kb20pO1xyXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBjb250ZW50KGFzdCwgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pOiBDb250ZW50QmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciBiaW5kaW5nID0gbmV3IENvbnRlbnRCaW5kaW5nKGFzdCwgdGhpcy5hcHBlbmRDaGlsZCwgY2hpbGRyZW4pO1xyXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIHN1cGVyLnVwZGF0ZShjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3NCaW5kaW5nLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5nc1tpXS51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVCaW5kaW5nc1tlXS51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kb207XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyKG5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLmV2ZW50c1tuYW1lXTtcclxuICAgICAgICAgICAgaWYgKCEhaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGFjY2VwdChoYW5kbGVyLCB0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIENsYXNzQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcbiAgICAgICAgcHJpdmF0ZSBjb25kaXRpb25zID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuICAgICAgICBwcml2YXRlIGJhc2VDbGFzc1RwbDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFRhZ0JpbmRpbmcpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldEJhc2VDbGFzcyh0cGwpIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlQ2xhc3NUcGwgPSB0cGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhZGRDbGFzcyhjbGFzc05hbWUsIGNvbmRpdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLmNvbmRpdGlvbnMucHVzaCh7IGNsYXNzTmFtZSwgY29uZGl0aW9uIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IFtdO1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmJhc2VDbGFzc1RwbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYWNjZXB0KHRoaXMuYmFzZUNsYXNzVHBsLCB0aGlzLCBjb250ZXh0KS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY29uZGl0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHsgY2xhc3NOYW1lLCBjb25kaXRpb24gfSA9IHRoaXMuY29uZGl0aW9uc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmICghIWFjY2VwdChjb25kaXRpb24sIHRoaXMsIGNvbnRleHQpLnZhbHVlT2YoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaChjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGNsYXNzZXMubGVuZ3RoID4gMCA/IGpvaW4oXCIgXCIsIGNsYXNzZXMpIDogbnVsbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc2V0QXR0cmlidXRlKGF0dHJOYW1lOiBzdHJpbmcsIG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMub2xkVmFsdWU7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy5wYXJlbnQuZG9tO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5ld1ZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9sZFZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmNsYXNzTmFtZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBBdHRyaWJ1dGVCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIG9sZFZhbHVlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVGFnQmluZGluZywgcHJpdmF0ZSBuYW1lLCBwcml2YXRlIHRwbCkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gYWNjZXB0KHRoaXMudHBsLCB0aGlzLCBjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIGlmICghIXZhbHVlICYmICEhdmFsdWUub25OZXh0KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS5zdWJzY3JpYmUodGhpcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uTmV4dCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBvbk5leHQodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB2b2lkIDAgJiYgISF2YWx1ZS52YWx1ZU9mKVxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS52YWx1ZU9mKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5hbWUgPT09IFwiY2hlY2tlZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9ICEhdmFsdWUgPyBcImNoZWNrZWRcIiA6IG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm9sZFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGF0dHJOYW1lID0gdGhpcy5uYW1lO1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy5wYXJlbnQuZG9tO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5ld1ZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9sZFZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnW2F0dHJOYW1lXSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIG5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm9sZFZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vY2xhc3MgUmVhY3RpdmVCaW5kaW5nIGV4dGVuZHMgRG9tQmluZGluZyB7XHJcbiAgICAvLyAgICBwcml2YXRlIGJpbmRpbmdzID0gW107XHJcbiAgICAvLyAgICBwcml2YXRlIHN0cmVhbTtcclxuICAgIC8vICAgIHByaXZhdGUgbGVuZ3RoO1xyXG5cclxuICAgIC8vICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdHBsOiBUZW1wbGF0ZS5JTm9kZSwgcHJpdmF0ZSB0YXJnZXQsIHByaXZhdGUgb2Zmc2V0KSB7XHJcbiAgICAvLyAgICAgICAgc3VwZXIoKTtcclxuICAgIC8vICAgIH1cclxuXHJcbiAgICAvLyAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgLy8gICAgICAgIHZhciB7IGJpbmRpbmdzLCB0YXJnZXQsIHRwbCB9ID0gdGhpcztcclxuICAgIC8vICAgICAgICBpZiAoISF0cGwubW9kZWxBY2Nlc3Nvcikge1xyXG4gICAgLy8gICAgICAgICAgICB2YXIgc3RyZWFtID0gdHBsLm1vZGVsQWNjZXNzb3IuZXhlY3V0ZShjb250ZXh0LCB0aGlzKTtcclxuICAgIC8vICAgICAgICAgICAgdGhpcy5sZW5ndGggPSAwO1xyXG5cclxuICAgIC8vICAgICAgICAgICAgc3RyZWFtLmZvckVhY2goKGN0eCwgaWR4KSA9PiB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICB0aGlzLmxlbmd0aCA9IGlkeCArIDE7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tpXTtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICBpZiAoYmluZGluZy5jb250ZXh0LnZhbHVlID09PSBjdHgudmFsdWUpIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGlkeCkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmluZGluZ3NbaV0gPSBiaW5kaW5nc1tpZHhdO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmluZGluZ3NbaWR4XSA9IGJpbmRpbmc7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICAgICAgICAgIHRoaXMuZXhlY3V0ZShjdHgsIGlkeCk7XHJcbiAgICAvLyAgICAgICAgICAgIH0pO1xyXG4gICAgLy8gICAgICAgIH0gZWxzZSB7XHJcbiAgICAvLyAgICAgICAgICAgIHRoaXMuZXhlY3V0ZShjb250ZXh0LCAwKTtcclxuICAgIC8vICAgICAgICAgICAgdGhpcy5sZW5ndGggPSAxO1xyXG4gICAgLy8gICAgICAgIH1cclxuXHJcbiAgICAvLyAgICAgICAgd2hpbGUgKGJpbmRpbmdzLmxlbmd0aCA+IHRoaXMubGVuZ3RoKSB7XHJcbiAgICAvLyAgICAgICAgICAgIGNvbnN0IG9sZEJpbmRpbmcgPSBiaW5kaW5ncy5wb3AoKTtcclxuICAgIC8vICAgICAgICAgICAgdGFyZ2V0LnJlbW92ZUNoaWxkKG9sZEJpbmRpbmcuZG9tKTtcclxuICAgIC8vICAgICAgICB9XHJcblxyXG4gICAgLy8gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgLy8gICAgfVxyXG5cclxuICAgIC8vICAgIGV4ZWN1dGUocmVzdWx0LCBpZHgpIHtcclxuICAgIC8vICAgICAgICB0aGlzLmFkZEJpbmRpbmcodGhpcy50cGwuYmluZChyZXN1bHQpLCBpZHgpO1xyXG4gICAgLy8gICAgfVxyXG5cclxuICAgIC8vICAgIGFkZEJpbmRpbmcobmV3QmluZGluZywgaWR4KSB7XHJcbiAgICAvLyAgICAgICAgdmFyIHsgb2Zmc2V0LCB0YXJnZXQsIGJpbmRpbmdzIH0gPSB0aGlzO1xyXG4gICAgLy8gICAgICAgIHZhciBpbnNlcnRBdCA9IG9mZnNldCArIGlkeDtcclxuXHJcbiAgICAvLyAgICAgICAgaWYgKGluc2VydEF0IDwgdGFyZ2V0LmNoaWxkTm9kZXMubGVuZ3RoKSB7XHJcbiAgICAvLyAgICAgICAgICAgIHZhciBiZWZvcmVFbGVtZW50ID0gdGFyZ2V0LmNoaWxkTm9kZXNbaW5zZXJ0QXRdO1xyXG4gICAgLy8gICAgICAgICAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKG5ld0JpbmRpbmcuZG9tLCBiZWZvcmVFbGVtZW50KTtcclxuICAgIC8vICAgICAgICB9IGVsc2Uge1xyXG4gICAgLy8gICAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobmV3QmluZGluZy5kb20pO1xyXG4gICAgLy8gICAgICAgIH1cclxuXHJcbiAgICAvLyAgICAgICAgYmluZGluZ3Muc3BsaWNlKGlkeCwgMCwgbmV3QmluZGluZyk7XHJcbiAgICAvLyAgICB9XHJcbiAgICAvL31cclxuXHJcbiAgICAvL2V4cG9ydCBmdW5jdGlvbiBleGVjdXRlVGVtcGxhdGUob2JzZXJ2YWJsZSwgdHBsOiBUZW1wbGF0ZS5JTm9kZSwgdGFyZ2V0LCBvZmZzZXQpIHtcclxuICAgIC8vICAgIHJldHVybiBuZXcgUmVhY3RpdmVCaW5kaW5nKHRwbCwgdGFyZ2V0LCBvZmZzZXQpLnVwZGF0ZShvYnNlcnZhYmxlKTtcclxuICAgIC8vfVxyXG5cclxuICAgIC8vY2xhc3MgQmluZGVyIHtcclxuICAgIC8vICAgIHByaXZhdGUgY29tcGlsZTogRnVuY3Rpb247XHJcbiAgICAvLyAgICBwcml2YXRlIGNvbXBpbGVyOiBBc3QuQ29tcGlsZXI7XHJcbiAgICAvLyAgICBwdWJsaWMgY29udGV4dHM6IERhdGE0LklWYWx1ZVtdID0gW107XHJcblxyXG4gICAgLy8gICAgY29uc3RydWN0b3IocHJpdmF0ZSBsaWJzOiBhbnlbXSkge1xyXG4gICAgLy8gICAgICAgIHRoaXMuY29tcGlsZXIgPSBuZXcgQXN0LkNvbXBpbGVyKCk7XHJcbiAgICAvLyAgICAgICAgdGhpcy5jb21waWxlID0gdGhpcy5jb21waWxlci50ZW1wbGF0ZS5iaW5kKHRoaXMuY29tcGlsZXIpO1xyXG4gICAgLy8gICAgfVxyXG5cclxuICAgIC8vICAgIHN0YXRpYyBsaXN0ZW4odGFyZ2V0LCBzdG9yZTogRGF0YTUuU3RvcmUpIHtcclxuICAgIC8vICAgICAgICB2YXIgZXZlbnRIYW5kbGVyID0gKHRhcmdldCwgbmFtZSkgPT4ge1xyXG4gICAgLy8gICAgICAgICAgICB2YXIgYmluZGluZyA9IHRhcmdldC5hdHRyaWJ1dGVzW1wiX19iaW5kaW5nXCJdO1xyXG4gICAgLy8gICAgICAgICAgICBpZiAoISFiaW5kaW5nKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBiaW5kaW5nLnRyaWdnZXIobmFtZSk7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBzdG9yZS51cGRhdGUoKTtcclxuICAgIC8vICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgIH07XHJcblxyXG4gICAgLy8gICAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZXZ0ID0+IGV2ZW50SGFuZGxlcihldnQudGFyZ2V0LCBldnQudHlwZSkpO1xyXG5cclxuICAgIC8vICAgICAgICBjb25zdCBvbmNoYW5nZSA9IGV2dCA9PiB7XHJcbiAgICAvLyAgICAgICAgICAgIHZhciBiaW5kaW5nID0gZXZ0LnRhcmdldC5hdHRyaWJ1dGVzW1wiX19iaW5kaW5nXCJdO1xyXG4gICAgLy8gICAgICAgICAgICBpZiAoYmluZGluZyAhPSBudWxsKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBjb25zdCBuYW1lQXR0ciA9IGV2dC50YXJnZXQuYXR0cmlidXRlc1tcIm5hbWVcIl07XHJcbiAgICAvLyAgICAgICAgICAgICAgICBpZiAoISFuYW1lQXR0cikge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIHZhciBhcnIgPSBuYW1lQXR0ci52YWx1ZS5zcGxpdCgnLicpO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gYmluZGluZy5jb250ZXh0O1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwID0gYXJyW2ldO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gY29udGV4dC5nZXQocCk7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc2V0KGV2dC50YXJnZXQudmFsdWUpO1xyXG5cclxuICAgIC8vICAgICAgICAgICAgICAgICAgICBzdG9yZS51cGRhdGUoKTtcclxuICAgIC8vICAgICAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgIH07XHJcbiAgICAvLyAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLFxyXG4gICAgLy8gICAgICAgICAgICBldnQgPT4ge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgaWYgKGV2dC5rZXlDb2RlID09PSAxMykge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIGV2ZW50SGFuZGxlcihldnQudGFyZ2V0LCBcImtleXVwLmVudGVyXCIpO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICBvbmNoYW5nZShldnQpO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICAgICB9KTtcclxuICAgIC8vICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3ZlclwiLFxyXG4gICAgLy8gICAgICAgICAgICBldnQgPT4ge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgZXZlbnRIYW5kbGVyKGV2dC50YXJnZXQsIFwibW91c2VvdmVyXCIpO1xyXG4gICAgLy8gICAgICAgICAgICB9XHJcbiAgICAvLyAgICAgICAgKTtcclxuICAgIC8vICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsXHJcbiAgICAvLyAgICAgICAgICAgIGV2dCA9PiB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBldmVudEhhbmRsZXIoZXZ0LnRhcmdldCwgXCJtb3VzZW91dFwiKTtcclxuICAgIC8vICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICk7XHJcbiAgICAvLyAgICB9XHJcblxyXG4gICAgLy8gICAgcHVibGljIHVwZGF0ZTIoKSB7XHJcbiAgICAvLyAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbnRleHRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAvLyAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLmNvbnRleHRzW2ldO1xyXG4gICAgLy8gICAgICAgICAgICBjdHgudXBkYXRlKG51bGwpO1xyXG4gICAgLy8gICAgICAgIH1cclxuICAgIC8vICAgIH1cclxuXHJcbiAgICAvLyAgICBwYXJzZURvbShyb290RG9tOiBOb2RlKTogVGVtcGxhdGUuSU5vZGUge1xyXG4gICAgLy8gICAgICAgIGNvbnN0IHN0YWNrID0gW107XHJcbiAgICAvLyAgICAgICAgbGV0IGk6IG51bWJlcjtcclxuICAgIC8vICAgICAgICB2YXIgcm9vdFRwbDtcclxuICAgIC8vICAgICAgICBzdGFjay5wdXNoKHtcclxuICAgIC8vICAgICAgICAgICAgbm9kZTogcm9vdERvbSxcclxuICAgIC8vICAgICAgICAgICAgcHVzaChlKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICByb290VHBsID0gZTtcclxuICAgIC8vICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgIH0pO1xyXG5cclxuICAgIC8vICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xyXG4gICAgLy8gICAgICAgICAgICBjb25zdCBjdXIgPSBzdGFjay5wb3AoKTtcclxuICAgIC8vICAgICAgICAgICAgY29uc3Qgbm9kZTogTm9kZSA9IGN1ci5ub2RlO1xyXG4gICAgLy8gICAgICAgICAgICBjb25zdCBwdXNoID0gY3VyLnB1c2g7XHJcblxyXG4gICAgLy8gICAgICAgICAgICBpZiAoISFub2RlW1wiY29udGVudFwiXSkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgY29uc3QgZWx0ID0gPEhUTUxFbGVtZW50Pm5vZGVbXCJjb250ZW50XCJdO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlLkNvbnRlbnRUZW1wbGF0ZSgpO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgZm9yIChpID0gZWx0LmNoaWxkTm9kZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHsgbm9kZTogZWx0LmNoaWxkTm9kZXNbaV0sIHB1c2g6IHRlbXBsYXRlLmFkZENoaWxkLmJpbmQodGVtcGxhdGUpIH0pO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICAgICAgICAgcHVzaCh0ZW1wbGF0ZSk7XHJcbiAgICAvLyAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgY29uc3QgZWx0ID0gPEhUTUxFbGVtZW50Pm5vZGU7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZS5UYWdUZW1wbGF0ZShlbHQudGFnTmFtZSwgZWx0Lm5hbWVzcGFjZVVSSSk7XHJcblxyXG4gICAgLy8gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgISFlbHQuYXR0cmlidXRlcyAmJiBpIDwgZWx0LmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICB2YXIgYXR0cmlidXRlID0gZWx0LmF0dHJpYnV0ZXNbaV07XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJzZUF0dHIodGVtcGxhdGUsIGF0dHJpYnV0ZSk7XHJcbiAgICAvLyAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgLy8gICAgICAgICAgICAgICAgZm9yIChpID0gZWx0LmNoaWxkTm9kZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHsgbm9kZTogZWx0LmNoaWxkTm9kZXNbaV0sIHB1c2g6IHRlbXBsYXRlLmFkZENoaWxkLmJpbmQodGVtcGxhdGUpIH0pO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICAgICAgICAgcHVzaCh0ZW1wbGF0ZSk7XHJcbiAgICAvLyAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgdmFyIHRleHRDb250ZW50ID0gbm9kZS50ZXh0Q29udGVudDtcclxuICAgIC8vICAgICAgICAgICAgICAgIGlmICh0ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRwbCA9IHRoaXMuY29tcGlsZSh0ZXh0Q29udGVudCk7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgcHVzaChuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKHRwbCB8fCBub2RlLnRleHRDb250ZW50KSk7XHJcbiAgICAvLyAgICAgICAgICAgICAgICB9XHJcbiAgICAvLyAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICB9XHJcblxyXG4gICAgLy8gICAgICAgIHJldHVybiByb290VHBsO1xyXG4gICAgLy8gICAgfVxyXG5cclxuICAgIC8vICAgIHBhcnNlQXR0cih0YWdFbGVtZW50OiBUZW1wbGF0ZS5UYWdUZW1wbGF0ZSwgYXR0cjogQXR0cikge1xyXG4gICAgLy8gICAgICAgIGNvbnN0IG5hbWUgPSBhdHRyLm5hbWU7XHJcbiAgICAvLyAgICAgICAgaWYgKG5hbWUgPT09IFwiY2xpY2tcIiB8fCBuYW1lLm1hdGNoKC9rZXl1cFxcLi8pIHx8IG5hbWUgPT09IFwibW91c2VvdmVyXCIgfHwgbmFtZSA9PT0gXCJtb3VzZW91dFwiKSB7XHJcbiAgICAvLyAgICAgICAgICAgIGNvbnN0IGZuID0gdGhpcy5jb21waWxlKGF0dHIudmFsdWUpO1xyXG4gICAgLy8gICAgICAgICAgICB0YWdFbGVtZW50LmFkZEV2ZW50KG5hbWUsIGZuKTtcclxuICAgIC8vICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiZGF0YS1zZWxlY3RcIiB8fCBuYW1lID09PSBcImRhdGEtZnJvbVwiKSB7XHJcbiAgICAvLyAgICAgICAgICAgIGNvbnN0IGZuID0gdGhpcy5jb21waWxlKGF0dHIudmFsdWUpO1xyXG4gICAgLy8gICAgICAgICAgICB0YWdFbGVtZW50LnNlbGVjdChmbik7XHJcbiAgICAvLyAgICAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgICAgY29uc3QgdHBsID0gdGhpcy5jb21waWxlKGF0dHIudmFsdWUpO1xyXG4gICAgLy8gICAgICAgICAgICB0YWdFbGVtZW50LmF0dHIobmFtZSwgdHBsIHx8IGF0dHIudmFsdWUpO1xyXG5cclxuICAgIC8vICAgICAgICAgICAgLy8gY29udmVudGlvbnNcclxuICAgIC8vICAgICAgICAgICAgaWYgKCEhdGFnRWxlbWVudC5uYW1lLm1hdGNoKC9eaW5wdXQkL2kpICYmXHJcbiAgICAvLyAgICAgICAgICAgICAgICAhIWF0dHIubmFtZS5tYXRjaCgvXm5hbWUkL2kpICYmXHJcbiAgICAvLyAgICAgICAgICAgICAgICAhdGFnRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiKSkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVBY2Nlc3NvciA9IHRoaXMuY29tcGlsZShge3sgJHthdHRyLnZhbHVlfSB9fWApO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgdGFnRWxlbWVudC5hdHRyKFwidmFsdWVcIiwgdmFsdWVBY2Nlc3Nvcik7XHJcbiAgICAvLyAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICB9XHJcbiAgICAvLyAgICB9XHJcblxyXG4gICAgLy99XHJcblxyXG4gICAgLy9leHBvcnQgZnVuY3Rpb24gaW1wb3J0Vmlldyh2aWV3OiBzdHJpbmcsIC4uLmFyZ3MpOiBhbnkge1xyXG4gICAgLy8gICAgaWYgKCEoXCJpbXBvcnRcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlua1wiKSkpIHtcclxuICAgIC8vICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJIVE1MIGltcG9ydCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcclxuICAgIC8vICAgIH1cclxuXHJcbiAgICAvLyAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xyXG4gICAgLy8gICAgdmFyIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XHJcbiAgICAvLyAgICBsaW5rLnJlbCA9ICdpbXBvcnQnO1xyXG4gICAgLy8gICAgbGluay5ocmVmID0gdmlldztcclxuICAgIC8vICAgIGxpbmsuc2V0QXR0cmlidXRlKCdhc3luYycsIFwiXCIpOyAvLyBtYWtlIGl0IGFzeW5jIVxyXG4gICAgLy8gICAgbGluay5vbmxvYWQgPSBlID0+IHtcclxuICAgIC8vICAgICAgICB2YXIgbGluayA9ICg8YW55PmUudGFyZ2V0KTtcclxuICAgIC8vICAgICAgICBkZWZlcnJlZC5ub3RpZnkobGluay5pbXBvcnQucXVlcnlTZWxlY3RvcihcInRlbXBsYXRlXCIpKTtcclxuICAgIC8vICAgICAgICBsaW5rLm9ubG9hZCA9IG51bGw7XHJcbiAgICAvLyAgICB9XHJcbiAgICAvLyAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspO1xyXG5cclxuICAgIC8vICAgIHJldHVybiBkZWZlcnJlZDtcclxuICAgIC8vfVxyXG5cclxuICAgIC8vZnVuY3Rpb24gZGVmZXIoKSB7XHJcbiAgICAvLyAgICByZXR1cm4ge1xyXG4gICAgLy8gICAgICAgIHZhbHVlOiB2b2lkIDAsXHJcbiAgICAvLyAgICAgICAgcmVzb2x2ZXJzOiBbXSxcclxuICAgIC8vICAgICAgICBub3RpZnkodmFsdWUpIHtcclxuICAgIC8vICAgICAgICAgICAgaWYgKHZhbHVlID09PSB2b2lkIDApXHJcbiAgICAvLyAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmRlZmluZWQgcmVzdWx0XCIpO1xyXG5cclxuICAgIC8vICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG5cclxuICAgIC8vICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnJlc29sdmVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgdGhpcy5yZXNvbHZlcnNbaV0uY2FsbChudWxsLCB2YWx1ZSk7XHJcbiAgICAvLyAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICB9LFxyXG4gICAgLy8gICAgICAgIHRoZW4ocmVzb2x2ZSkge1xyXG4gICAgLy8gICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICB0aGlzLnJlc29sdmVycy5wdXNoKHJlc29sdmUpO1xyXG4gICAgLy8gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgcmVzb2x2ZS5jYWxsKG51bGwsIHRoaXMudmFsdWUpO1xyXG4gICAgLy8gICAgICAgICAgICB9XHJcbiAgICAvLyAgICAgICAgfVxyXG4gICAgLy8gICAgfTtcclxuICAgIC8vfVxyXG5cclxuICAgIC8vZXhwb3J0IGZ1bmN0aW9uIGJpbmQoZG9tOiBOb2RlLCBzdG9yZSkge1xyXG5cclxuICAgIC8vICAgIHZhciBiaW5kZXIgPSBuZXcgQmluZGVyKFtDb3JlLkxpc3QsIENvcmUuTWF0aCwgQ29yZS5EYXRlc10pO1xyXG5cclxuICAgIC8vICAgIGxldCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgIC8vICAgIERvbS5leGVjdXRlVGVtcGxhdGUoc3RvcmUsIGJpbmRlci5wYXJzZURvbShkb20pLCBmcmFnbWVudCwgMCk7XHJcbiAgICAvLyAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZyYWdtZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgIC8vICAgICAgICB2YXIgY2hpbGQgPSBmcmFnbWVudC5jaGlsZE5vZGVzW2ldO1xyXG4gICAgLy8gICAgICAgIEJpbmRlci5saXN0ZW4oY2hpbGQsIHN0b3JlKTtcclxuICAgIC8vICAgIH1cclxuXHJcbiAgICAvLyAgICByZXR1cm4gZnJhZ21lbnQ7XHJcbiAgICAvL31cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oc2VwYXJhdG9yOiBzdHJpbmcsIHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMCA/IHZhbHVlLnNvcnQoKS5qb2luKHNlcGFyYXRvcikgOiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59XHJcblxyXG4gICAgLy8gUmVTaGFycGVyIHJlc3RvcmUgSW5jb25zaXN0ZW50TmFtaW5nXHJcbiJdfQ==