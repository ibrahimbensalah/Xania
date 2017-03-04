"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var core_1 = require("./core");
var reactive_1 = require("./reactive");
var Dom;
(function (Dom) {
    var document = window.document;
    var DomVisitor = (function () {
        function DomVisitor() {
        }
        DomVisitor.text = function (expr) {
            return new TextBinding(expr);
        };
        DomVisitor.tag = function (tagName, ns, attrs, children) {
            var tag = new TagBinding(tagName, ns, children), length = attrs.length;
            for (var i = 0; i < length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            return tag;
        };
        return DomVisitor;
    }());
    Dom.DomVisitor = DomVisitor;
    var DomDriver = (function () {
        function DomDriver(target) {
            this.domElements = [];
            this.sym = Symbol();
            if (typeof target === "string")
                this.target = document.querySelector(target);
            else
                this.target = target;
        }
        DomDriver.prototype.insert = function (_, dom, idx) {
            var domElements = this.domElements;
            var target = this.target;
            var curIdx = domElements.indexOf(dom);
            if (idx !== curIdx) {
                if (idx < target.childNodes.length) {
                    var current = target.childNodes[idx];
                    if (current !== dom) {
                        target.insertBefore(dom, current);
                    }
                }
                else {
                    target.appendChild(dom);
                }
                domElements.length = 0;
                for (var i = 0; i < target.childNodes.length; i++) {
                    domElements[i] = target.childNodes[i];
                }
            }
        };
        DomDriver.prototype.insertTag = function (binding, name, idx) {
            var sym = this.sym;
            var dom = binding[sym];
            if (!dom) {
                dom = document.createElement(name);
                binding[sym] = dom;
            }
            this.insert(binding, dom, idx);
        };
        DomDriver.prototype.dispose = function () {
            var domElements = this.domElements, i = domElements.length;
            while (i--) {
                domElements[i].remove();
            }
        };
        return DomDriver;
    }());
    Dom.DomDriver = DomDriver;
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
        TextBinding.prototype.render = function (context, driver) {
            var newValue = this.evaluateText(this.expr);
            if (newValue !== this.oldValue) {
                this.oldValue = newValue;
                var textNode = this.textNode;
                textNode.nodeValue = newValue;
                this.driver.insert(this, textNode, 0);
            }
        };
        return TextBinding;
    }(reactive_1.Reactive.Binding));
    Dom.TextBinding = TextBinding;
    var TagBinding = (function (_super) {
        __extends(TagBinding, _super);
        function TagBinding(tagName, ns, childBindings) {
            if (ns === void 0) { ns = null; }
            var _this = _super.call(this) || this;
            _this.tagName = tagName;
            _this.ns = ns;
            _this.length = 1;
            _this.eventBindings = [];
            _this.childBindings = childBindings;
            if (ns === null)
                _this.tagNode = document.createElement(tagName);
            else {
                _this.tagNode = document.createElementNS(ns, tagName.toLowerCase());
            }
            _this.domDriver = new DomDriver(_this.tagNode);
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
                var classBinding = new ClassBinding(this.tagNode, ast);
                this.childBindings.push(classBinding);
            }
            else if (name === "value" && this.tagName === "input") {
                var valueBinding = new ValueBinding(this.tagNode, ast);
                this.childBindings.push(valueBinding);
            }
            else if (name === "checked" && this.tagName === "input") {
                var checkedBinding = new CheckedBinding(this.tagNode, ast);
                this.childBindings.push(checkedBinding);
            }
            else {
                var match = /^on(.+)/.exec(name);
                if (match) {
                    this.eventBindings.push(new EventBinding(this.tagNode, match[1], ast));
                }
                else {
                    var attrBinding = new AttributeBinding(this.tagNode, name, ast);
                    this.childBindings.push(attrBinding);
                }
            }
            return this;
        };
        TagBinding.prototype.event = function (name, ast) {
            this.eventBindings.push(new EventBinding(this.tagNode, name, ast));
            return this;
        };
        TagBinding.prototype.insertTag = function (binding, tagName, idx) {
            var offset = 0, length = this.childBindings.length;
            for (var i = 0; i < length; i++) {
                if (this.childBindings[i] === binding)
                    break;
                offset += this.childBindings[i].length;
            }
            this.domDriver.insertTag(this, tagName, offset + idx);
        };
        TagBinding.prototype.insert = function (binding, dom, idx) {
            var offset = 0, length = this.childBindings.length;
            for (var i = 0; i < length; i++) {
                if (this.childBindings[i] === binding)
                    break;
                offset += this.childBindings[i].length;
            }
            this.domDriver.insert(null, dom, offset + idx);
        };
        TagBinding.prototype.update = function (context, parent) {
            for (var n = 0; n < this.eventBindings.length; n++) {
                var event_1 = this.eventBindings[n];
                event_1.update(context);
            }
            if (this.childBindings) {
                var childLength = this.childBindings.length;
                for (var i = 0; i < childLength; i++) {
                    this.childBindings[i].update(context, this);
                }
            }
            _super.prototype.update.call(this, context, parent);
            return this;
        };
        TagBinding.prototype.render = function (context, driver) {
            driver.insert(this, this.tagNode, 0);
        };
        TagBinding.prototype.trigger = function (name) {
        };
        return TagBinding;
    }(reactive_1.Reactive.Binding));
    Dom.TagBinding = TagBinding;
    var ClassBinding = (function (_super) {
        __extends(ClassBinding, _super);
        function ClassBinding(tagNode, ast) {
            var _this = _super.call(this) || this;
            _this.tagNode = tagNode;
            _this.ast = ast;
            return _this;
        }
        ClassBinding.prototype.render = function () {
            var newValue = this.evaluateText(this.ast);
            if (newValue !== this.oldValue) {
                this.oldValue = newValue;
                this.tagNode.className = newValue === void 0 || newValue === null
                    ? core_1.Core.empty
                    : newValue;
            }
        };
        return ClassBinding;
    }(reactive_1.Reactive.Binding));
    ClassBinding.AttributeName = "class";
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
                { value: event },
                { event: event },
                { node: event.target },
                { state: this.state || null },
                this.context
            ]);
        };
        EventBinding.prototype.fire = function (event) {
            var newValue = this.evaluate();
            this.state = newValue;
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
                    args[1].set(null);
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
            return x && x.valueOf();
        };
        EventBinding.prototype.member = function (target, name) {
            return target.get ? target.get(name) : target[name];
        };
        return EventBinding;
    }());
    Dom.EventBinding = EventBinding;
    var CheckedBinding = (function (_super) {
        __extends(CheckedBinding, _super);
        function CheckedBinding(tagNode, expr) {
            var _this = _super.call(this) || this;
            _this.tagNode = tagNode;
            _this.expr = expr;
            tagNode.addEventListener("change", _this.fire.bind(_this));
            return _this;
        }
        CheckedBinding.prototype.fire = function () {
            var value = this.evaluateObject(this.expr);
            if (value && value.set) {
                value.set(this.tagNode.checked);
                this.context.refresh();
            }
        };
        CheckedBinding.prototype.render = function () {
            var value = this.evaluateText(this.expr);
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
        function ValueBinding(tagNode, expr) {
            var _this = _super.call(this) || this;
            _this.tagNode = tagNode;
            _this.expr = expr;
            tagNode.addEventListener("change", _this.fire.bind(_this));
            return _this;
        }
        ValueBinding.prototype.fire = function () {
            var value = this.evaluateObject(this.expr);
            if (value && value.set) {
                value.set(this.tagNode.value);
            }
            this.context.refresh();
        };
        ValueBinding.prototype.render = function () {
            var value = this.evaluateText(this.expr);
            var newValue = value && value.valueOf();
            var tag = this.tagNode;
            if (newValue === void 0) {
                tag.removeAttribute("value");
                tag["value"] = core_1.Core.empty;
            }
            else {
                var attr = document.createAttribute("value");
                attr.value = newValue;
                tag.setAttributeNode(attr);
                tag["value"] = newValue;
            }
        };
        return ValueBinding;
    }(reactive_1.Reactive.Binding));
    var AttributeBinding = (function (_super) {
        __extends(AttributeBinding, _super);
        function AttributeBinding(tagNode, name, expr) {
            var _this = _super.call(this) || this;
            _this.tagNode = tagNode;
            _this.name = name;
            _this.expr = expr;
            return _this;
        }
        AttributeBinding.prototype.render = function (context, parent) {
            var value = this.evaluateText(this.expr);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUE2QjtBQUM3Qix1Q0FBMkM7QUFHM0MsSUFBYyxHQUFHLENBdWNoQjtBQXZjRCxXQUFjLEdBQUc7SUFFYixJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO0lBdUIvQjtRQUFBO1FBWUEsQ0FBQztRQVhVLGVBQUksR0FBWCxVQUFZLElBQUk7WUFDWixNQUFNLENBQUMsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUNNLGNBQUcsR0FBVixVQUFXLE9BQWUsRUFBRSxFQUFVLEVBQUUsS0FBSyxFQUFFLFFBQVE7WUFDbkQsSUFBSSxHQUFHLEdBQUcsSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsRUFBRSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUN2RSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM5QixHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDO1FBQ2YsQ0FBQztRQUNMLGlCQUFDO0lBQUQsQ0FBQyxBQVpELElBWUM7SUFaWSxjQUFVLGFBWXRCLENBQUE7SUFFRDtRQUlJLG1CQUFZLE1BQU07WUFGVixnQkFBVyxHQUFHLEVBQUUsQ0FBQztZQThCakIsUUFBRyxHQUFHLE1BQU0sRUFBRSxDQUFDO1lBM0JuQixFQUFFLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFB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LEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQ3RCLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0IsRUFBRSxDQUFDLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQztvQkFDckIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsQ0FBQztZQUNqQyxDQUFDO1FBQ0wsQ0FBQztRQUNMLHVCQUFDO0lBQUQsQ0FBQyxBQW5DRCxDQUFzQyxtQkFBRSxDQUFDLE9BQU8sR0FtQy9DO0lBbkNZLG9CQUFnQixtQkFtQzVCLENBQUE7QUFDTCxDQUFDLEVBdmNhLEdBQUcsR0FBSCxXQUFHLEtBQUgsV0FBRyxRQXVjaEI7QUFFRCxjQUFxQixTQUFpQixFQUFFLEtBQUs7SUFDekMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ2xFLENBQUM7SUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFMRCxvQkFLQzs7QUFJRCxrQkFBZSxHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb3JlIH0gZnJvbSAnLi9jb3JlJ1xyXG5pbXBvcnQgeyBSZWFjdGl2ZSBhcyBSZSB9IGZyb20gJy4vcmVhY3RpdmUnXHJcbmltcG9ydCB7IFRlbXBsYXRlIH0gZnJvbSAnLi90ZW1wbGF0ZSdcclxuXHJcbmV4cG9ydCBtb2R1bGUgRG9tIHtcclxuXHJcbiAgICB2YXIgZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQ7XHJcblxyXG4gICAgaW50ZXJmYWNlIElEb21CaW5kaW5nIHtcclxuICAgICAgICBsZW5ndGg7XHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQsIHBhcmVudCk7XHJcbiAgICAgICAgZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRG9tVmlzaXRvciBleHRlbmRzIFRlbXBsYXRlLklWaXNpdG9yPElEb21CaW5kaW5nPiB7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJVmlldyB7XHJcbiAgICAgICAgYmluZChzdG9yZSwgZHJpdmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSUFjdGlvbiB7XHJcbiAgICAgICAgZXhlY3V0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRGlzcGF0Y2hlciB7XHJcbiAgICAgICAgZGlzcGF0Y2goYWN0aW9uOiBSZS5JQWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRG9tVmlzaXRvciB7XHJcbiAgICAgICAgc3RhdGljIHRleHQoZXhwcik6IFRleHRCaW5kaW5nIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBUZXh0QmluZGluZyhleHByKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhdGljIHRhZyh0YWdOYW1lOiBzdHJpbmcsIG5zOiBzdHJpbmcsIGF0dHJzLCBjaGlsZHJlbik6IFRhZ0JpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRhZ0JpbmRpbmcodGFnTmFtZSwgbnMsIGNoaWxkcmVuKSwgbGVuZ3RoID0gYXR0cnMubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRG9tRHJpdmVyIHtcclxuICAgICAgICBwcml2YXRlIHRhcmdldDtcclxuICAgICAgICBwcml2YXRlIGRvbUVsZW1lbnRzID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHRhcmdldCkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRhcmdldCA9PT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXQpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChfLCBkb20sIGlkeDogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBkb21FbGVtZW50cyA9IHRoaXMuZG9tRWxlbWVudHM7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldDtcclxuXHJcbiAgICAgICAgICAgIHZhciBjdXJJZHggPSBkb21FbGVtZW50cy5pbmRleE9mKGRvbSk7XHJcbiAgICAgICAgICAgIGlmIChpZHggIT09IGN1cklkeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkeCA8IHRhcmdldC5jaGlsZE5vZGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50ID0gdGFyZ2V0LmNoaWxkTm9kZXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAhPT0gZG9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUoZG9tLCBjdXJyZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5hcHBlbmRDaGlsZChkb20pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZG9tRWxlbWVudHMubGVuZ3RoID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFyZ2V0LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBkb21FbGVtZW50c1tpXSA9IHRhcmdldC5jaGlsZE5vZGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHN5bSA9IFN5bWJvbCgpO1xyXG5cclxuICAgICAgICBpbnNlcnRUYWcoYmluZGluZywgbmFtZSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBzeW0gPSB0aGlzLnN5bTtcclxuICAgICAgICAgICAgdmFyIGRvbSA9IGJpbmRpbmdbc3ltXTtcclxuICAgICAgICAgICAgaWYgKCFkb20pIHtcclxuICAgICAgICAgICAgICAgIGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XHJcbiAgICAgICAgICAgICAgICBiaW5kaW5nW3N5bV0gPSBkb207XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5pbnNlcnQoYmluZGluZywgZG9tLCBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgdmFyIGRvbUVsZW1lbnRzID0gdGhpcy5kb21FbGVtZW50cyxcclxuICAgICAgICAgICAgICAgIGkgPSBkb21FbGVtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGRvbUVsZW1lbnRzW2ldLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRE9NRHJpdmVyIHtcclxuICAgICAgICBpbnNlcnQoc2VuZGVyOiBJRG9tQmluZGluZywgZG9tLCBpZHgpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUZXh0QmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJRG9tQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIHRleHROb2RlO1xyXG4gICAgICAgIHB1YmxpYyBsZW5ndGggPSAxO1xyXG4gICAgICAgIHB1YmxpYyBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMudGV4dE5vZGUgPSAoPGFueT5kb2N1bWVudCkuY3JlYXRlVGV4dE5vZGUoXCJcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLnRleHROb2RlLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcjogSURPTURyaXZlcikge1xyXG4gICAgICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IHRoaXMuZXZhbHVhdGVUZXh0KHRoaXMuZXhwcik7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy5vbGRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRleHROb2RlID0gdGhpcy50ZXh0Tm9kZTtcclxuICAgICAgICAgICAgICAgIHRleHROb2RlLm5vZGVWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcml2ZXIuaW5zZXJ0KHRoaXMsIHRleHROb2RlLCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJRG9tQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIHRhZ05vZGU7XHJcbiAgICAgICAgcHVibGljIGxlbmd0aCA9IDE7XHJcbiAgICAgICAgcHJpdmF0ZSBldmVudEJpbmRpbmdzOiBFdmVudEJpbmRpbmdbXSA9IFtdO1xyXG4gICAgICAgIHByaXZhdGUgZG9tRHJpdmVyOiBEb21Ecml2ZXI7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTmFtZTogc3RyaW5nLCBwcml2YXRlIG5zOiBzdHJpbmcgPSBudWxsLCBjaGlsZEJpbmRpbmdzPzogUmUuQmluZGluZ1tdKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MgPSBjaGlsZEJpbmRpbmdzO1xyXG4gICAgICAgICAgICBpZiAobnMgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFnTm9kZSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVFbGVtZW50TlMobnMsIHRhZ05hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kb21Ecml2ZXIgPSBuZXcgRG9tRHJpdmVyKHRoaXMudGFnTm9kZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLnRhZ05vZGUucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGlsZChjaGlsZDogUmUuQmluZGluZyk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuY2hpbGRCaW5kaW5ncylcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF0dHIobmFtZSwgYXN0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXN0ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ05vZGUuc2V0QXR0cmlidXRlKG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJjbGFzc1wiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NCaW5kaW5nID0gbmV3IENsYXNzQmluZGluZyh0aGlzLnRhZ05vZGUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjbGFzc0JpbmRpbmcpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwidmFsdWVcIiAmJiB0aGlzLnRhZ05hbWUgPT09IFwiaW5wdXRcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVCaW5kaW5nID0gbmV3IFZhbHVlQmluZGluZyh0aGlzLnRhZ05vZGUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaCh2YWx1ZUJpbmRpbmcpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiY2hlY2tlZFwiICYmIHRoaXMudGFnTmFtZSA9PT0gXCJpbnB1dFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkQmluZGluZyA9IG5ldyBDaGVja2VkQmluZGluZyh0aGlzLnRhZ05vZGUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjaGVja2VkQmluZGluZyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSAvXm9uKC4rKS8uZXhlYyhuYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRCaW5kaW5ncy5wdXNoKG5ldyBFdmVudEJpbmRpbmcodGhpcy50YWdOb2RlLCBtYXRjaFsxXSwgYXN0KSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyQmluZGluZyA9IG5ldyBBdHRyaWJ1dGVCaW5kaW5nKHRoaXMudGFnTm9kZSwgbmFtZSwgYXN0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChhdHRyQmluZGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZlbnQobmFtZSwgYXN0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRCaW5kaW5ncy5wdXNoKG5ldyBFdmVudEJpbmRpbmcodGhpcy50YWdOb2RlLCBuYW1lLCBhc3QpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnNlcnRUYWcoYmluZGluZywgdGFnTmFtZSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kb21Ecml2ZXIuaW5zZXJ0VGFnKHRoaXMsIHRhZ05hbWUsIG9mZnNldCArIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnNlcnQoYmluZGluZywgZG9tLCBpZHgpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDAsIGxlbmd0aCA9IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkQmluZGluZ3NbaV0gPT09IGJpbmRpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5jaGlsZEJpbmRpbmdzW2ldLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRvbURyaXZlci5pbnNlcnQobnVsbCwgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQsIHBhcmVudCk6IHRoaXMge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBuID0gMDsgbiA8IHRoaXMuZXZlbnRCaW5kaW5ncy5sZW5ndGg7IG4rKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLmV2ZW50QmluZGluZ3Nbbl07XHJcbiAgICAgICAgICAgICAgICBldmVudC51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkQmluZGluZ3MpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjaGlsZExlbmd0aCA9IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkTGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbaV0udXBkYXRlKGNvbnRleHQsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdXBlci51cGRhdGUoY29udGV4dCwgcGFyZW50KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgICAgICBkcml2ZXIuaW5zZXJ0KHRoaXMsIHRoaXMudGFnTm9kZSwgMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyKG5hbWUpIHtcclxuICAgICAgICAgICAgLy92YXIgaGFuZGxlciA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG4gICAgICAgICAgICAvL2lmICghIWhhbmRsZXIpIHtcclxuICAgICAgICAgICAgLy8gICAgdmFyIHJlc3VsdCA9IGhhbmRsZXIuZXhlY3V0ZSh0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgLy8gICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgLy8gICAgICAgIHJlc3VsdCgpO1xyXG4gICAgICAgICAgICAvL31cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIENsYXNzQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBIVE1MRWxlbWVudCwgcHJpdmF0ZSBhc3QpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBBdHRyaWJ1dGVOYW1lID0gXCJjbGFzc1wiO1xyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuZXZhbHVhdGVUZXh0KHRoaXMuYXN0KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy5vbGRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YWdOb2RlLmNsYXNzTmFtZSA9IG5ld1ZhbHVlID09PSB2b2lkIDAgfHwgbmV3VmFsdWUgPT09IG51bGxcclxuICAgICAgICAgICAgICAgICAgICA/IENvcmUuZW1wdHlcclxuICAgICAgICAgICAgICAgICAgICA6IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBFdmVudEJpbmRpbmcge1xyXG4gICAgICAgIHByaXZhdGUgY29udGV4dDtcclxuICAgICAgICBwcml2YXRlIHN0YXRlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcih0YWdOb2RlOiBhbnksIHByaXZhdGUgbmFtZSwgcHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHRhZ05vZGUuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLm5hbWUsIHRoaXMuZmlyZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlKCkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuZXhwciA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhwcihldmVudCwgdGhpcy5jb250ZXh0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhwci5leGVjdXRlKHRoaXMsXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgeyB2YWx1ZTogZXZlbnQgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGV2ZW50OiBldmVudCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgbm9kZTogZXZlbnQudGFyZ2V0IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBzdGF0ZTogdGhpcy5zdGF0ZSB8fCBudWxsIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0XHJcbiAgICAgICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcmUoZXZlbnQpIHtcclxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gdGhpcy5ldmFsdWF0ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFnID0gZXZlbnQudGFyZ2V0O1xyXG4gICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShcInZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWcudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnJlZnJlc2goKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBleHRlbmQoKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoZXJlKHNvdXJjZSwgcHJlZGljYXRlKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNlbGVjdChzb3VyY2UsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHF1ZXJ5KHBhcmFtLCBzb3VyY2UpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXdhaXQob2JzZXJ2YWJsZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCh2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoZnVuLCBhcmdzOiBhbnlbXSkge1xyXG4gICAgICAgICAgICBpZiAoZnVuID09PSBcImFzc2lnblwiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJnc1swXTtcclxuICAgICAgICAgICAgICAgIGlmIChhcmcgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgYXJnc1sxXS5zZXQobnVsbCk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhcmcgPSBhcmcudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbMV0uc2V0KGFyZy52YWx1ZU9mKCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyZztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGFyZ3MpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuLmFwcGx5KG51bGwsIGFyZ3MubWFwKEV2ZW50QmluZGluZy52YWx1ZU9mKSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIHZhbHVlT2YoeCkge1xyXG4gICAgICAgICAgICByZXR1cm4geCAmJiB4LnZhbHVlT2YoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lbWJlcih0YXJnZXQ6IHsgZ2V0KG5hbWU6IHN0cmluZyk7IHJlZnJlc2g/KCk7IH0sIG5hbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5nZXQgPyB0YXJnZXQuZ2V0KG5hbWUpIDogdGFyZ2V0W25hbWVdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBDaGVja2VkQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHByaXZhdGUgb2xkVmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTm9kZTogYW55LCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgICAgIHRhZ05vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmZpcmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaXJlKCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlT2JqZWN0KHRoaXMuZXhwcik7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5zZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlLnNldCh0aGlzLnRhZ05vZGUuY2hlY2tlZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnJlZnJlc2goKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLmV4cHIpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gdmFsdWUgJiYgdmFsdWUudmFsdWVPZigpO1xyXG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm9sZFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMudGFnTm9kZTtcclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSB2b2lkIDAgJiYgbmV3VmFsdWUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2xkVmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwiY2hlY2tlZFwiKTtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gXCJjaGVja2VkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZU5vZGUoYXR0cik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZ1tcImNoZWNrZWRcIl0gPSBcImNoZWNrZWRcIjtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbXCJjaGVja2VkXCJdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShcImNoZWNrZWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBWYWx1ZUJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBwcml2YXRlIG9sZFZhbHVlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhZ05vZGU6IGFueSwgcHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgICAgICB0YWdOb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5maXJlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyZSgpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZU9iamVjdCh0aGlzLmV4cHIpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuc2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS5zZXQodGhpcy50YWdOb2RlLnZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnJlZnJlc2goKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZVRleHQodGhpcy5leHByKTtcclxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gdmFsdWUgJiYgdmFsdWUudmFsdWVPZigpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMudGFnTm9kZTtcclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHRhZy5yZW1vdmVBdHRyaWJ1dGUoXCJ2YWx1ZVwiKTtcclxuICAgICAgICAgICAgICAgIHRhZ1tcInZhbHVlXCJdID0gQ29yZS5lbXB0eTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKFwidmFsdWVcIik7XHJcbiAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIHRhZ1tcInZhbHVlXCJdID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZUJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhZ05vZGU6IGFueSwgcHJpdmF0ZSBuYW1lLCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0LCBwYXJlbnQpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZVRleHQodGhpcy5leHByKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiAhIXZhbHVlLnZhbHVlT2YpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubmFtZSA9PT0gXCJjaGVja2VkXCIpIHtcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gISF2YWx1ZSA/IFwiY2hlY2tlZFwiIDogbnVsbDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBhdHRyTmFtZSA9IHRoaXMubmFtZTtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMudGFnTm9kZTtcclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSB2b2lkIDAgfHwgbmV3VmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRhZ1thdHRyTmFtZV0gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0dHJOYW1lID09PSBcInZhbHVlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGFnW2F0dHJOYW1lXSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gam9pbihzZXBhcmF0b3I6IHN0cmluZywgdmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGggPiAwID8gdmFsdWUuc29ydCgpLmpvaW4oc2VwYXJhdG9yKSA6IG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbi8vIFJlU2hhcnBlciByZXN0b3JlIEluY29uc2lzdGVudE5hbWluZ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgRG9tOyJdfQ==