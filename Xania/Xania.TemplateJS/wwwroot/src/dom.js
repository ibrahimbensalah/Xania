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
            this.events = [];
            this.sym = Symbol();
            if (typeof target === "string")
                this.target = document.querySelector(target);
            else
                this.target = target;
        }
        DomDriver.prototype.on = function (eventName, dom, eventBinding) {
            var _this = this;
            var events = this.events, i = events.length, eventBound = false;
            while (i--) {
                var ev = events[i];
                if (ev.eventName === eventName) {
                    if (ev.dom === dom)
                        return ev;
                    else {
                        eventBound = true;
                        break;
                    }
                }
            }
            if (!eventBound) {
                this.target.addEventListener(eventName, function (event) {
                    var events = _this.events;
                    var e = events.length;
                    while (e--) {
                        var ev = events[e];
                        if (ev.dom === event.target && ev.eventName === eventName) {
                            ev.eventBinding.fire(event);
                            break;
                        }
                    }
                });
            }
            var entry = {
                eventName: eventName,
                dom: dom,
                eventBinding: eventBinding,
                dispose: function () {
                    var idx = events.indexOf(this);
                    if (idx >= 0) {
                        events.splice(idx, 1);
                        return true;
                    }
                    return false;
                }
            };
            this.events.push(entry);
            return entry;
        };
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
        TagBinding.prototype.attrs = function (attrs) {
            for (var prop in attrs) {
                if (attrs.hasOwnProperty(prop)) {
                    var attrValue = attrs[prop];
                    this.attr(prop.toLowerCase(), attrValue);
                }
            }
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
        TagBinding.prototype.update = function (context, driver) {
            _super.prototype.update.call(this, context, driver);
            if (this.childBindings) {
                var childLength = this.childBindings.length;
                for (var i = 0; i < childLength; i++) {
                    this.childBindings[i].update(context, this);
                }
            }
            for (var n = 0; n < this.eventBindings.length; n++) {
                var event_1 = this.eventBindings[n];
                event_1.update(context, driver);
            }
            return this;
        };
        TagBinding.prototype.render = function (context, driver) {
            driver.insert(this, this.tagNode, 0);
        };
        TagBinding.prototype.trigger = function (name, event, context) {
            for (var n = 0; n < this.eventBindings.length; n++) {
                var eventBinding = this.eventBindings[n];
                if (eventBinding.name === "move") {
                    eventBinding.fire(event, context);
                }
            }
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
            this.tagNode = tagNode;
            this.name = name;
            this.expr = expr;
        }
        EventBinding.prototype.evaluate = function (context) {
            if (typeof this.expr === "function")
                return this.expr(event, this.context);
            return this.expr.execute(this, [
                context || {},
                { value: event },
                { event: event },
                { node: event.target },
                { state: this.state || null },
                this.context
            ]);
        };
        EventBinding.prototype.fire = function (event, context) {
            var newValue = this.evaluate(context);
            this.state = typeof newValue === "function" ? newValue() : newValue;
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
        EventBinding.prototype.update = function (context, driver) {
            this.context = context;
            this.driver = driver;
            this.render(context, driver);
        };
        EventBinding.prototype.render = function (context, driver) {
            driver.on(this.name, this.tagNode, this);
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
            if (value && value.valueOf)
                value = value.valueOf();
            var newValue;
            if (this.name === "checked") {
                newValue = value ? "checked" : null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUE2QjtBQUM3Qix1Q0FBMkM7QUFHM0MsSUFBYyxHQUFHLENBb2dCaEI7QUFwZ0JELFdBQWMsR0FBRztJQUViLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUF1Qi9CO1FBQUE7UUFZQSxDQUFDO1FBWFUsZUFBSSxHQUFYLFVBQVksSUFBSTtZQUNaLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ00sY0FBRyxHQUFWLFVBQVcsT0FBZSxFQUFFLEVBQVUsRUFBRSxLQUFLLEVBQUUsUUFBUTtZQUNuRCxJQUFJLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ3ZFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlCLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDZixDQUFDO1FBQ0wsaUJBQUM7SUFBRCxDQUFDLEFBWkQsSUFZQztJQVpZLGNBQVUsYUFZdEIsQ0FBQTtJQUVEO1FBS0ksbUJBQVksTUFBTTtZQUhWLGdCQUFXLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLFdBQU0sR0FBRyxFQUFFLENBQUM7WUE4RVosUUFBRyxHQUFHLE1BQU0sRUFBRSxDQUFDO1lBM0VuQixFQUFFLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUM7Z0JB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QUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ2xFLENBQUM7SUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFMRCxvQkFLQzs7QUFJRCxrQkFBZSxHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb3JlIH0gZnJvbSAnLi9jb3JlJ1xyXG5pbXBvcnQgeyBSZWFjdGl2ZSBhcyBSZSB9IGZyb20gJy4vcmVhY3RpdmUnXHJcbmltcG9ydCB7IFRlbXBsYXRlIH0gZnJvbSAnLi90ZW1wbGF0ZSdcclxuXHJcbmV4cG9ydCBtb2R1bGUgRG9tIHtcclxuXHJcbiAgICB2YXIgZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQ7XHJcblxyXG4gICAgaW50ZXJmYWNlIElEb21CaW5kaW5nIHtcclxuICAgICAgICBsZW5ndGg7XHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQsIHBhcmVudCk7XHJcbiAgICAgICAgZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRG9tVmlzaXRvciBleHRlbmRzIFRlbXBsYXRlLklWaXNpdG9yPElEb21CaW5kaW5nPiB7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJVmlldyB7XHJcbiAgICAgICAgYmluZChzdG9yZSwgZHJpdmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSUFjdGlvbiB7XHJcbiAgICAgICAgZXhlY3V0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRGlzcGF0Y2hlciB7XHJcbiAgICAgICAgZGlzcGF0Y2goYWN0aW9uOiBSZS5JQWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRG9tVmlzaXRvciB7XHJcbiAgICAgICAgc3RhdGljIHRleHQoZXhwcik6IFRleHRCaW5kaW5nIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBUZXh0QmluZGluZyhleHByKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhdGljIHRhZyh0YWdOYW1lOiBzdHJpbmcsIG5zOiBzdHJpbmcsIGF0dHJzLCBjaGlsZHJlbik6IFRhZ0JpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRhZ0JpbmRpbmcodGFnTmFtZSwgbnMsIGNoaWxkcmVuKSwgbGVuZ3RoID0gYXR0cnMubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRG9tRHJpdmVyIHtcclxuICAgICAgICBwcml2YXRlIHRhcmdldDtcclxuICAgICAgICBwcml2YXRlIGRvbUVsZW1lbnRzID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBldmVudHMgPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IodGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb24oZXZlbnROYW1lLCBkb20sIGV2ZW50QmluZGluZykge1xyXG4gICAgICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5ldmVudHMsXHJcbiAgICAgICAgICAgICAgICBpID0gZXZlbnRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGV2ZW50Qm91bmQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBldiA9IGV2ZW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChldi5ldmVudE5hbWUgPT09IGV2ZW50TmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChldi5kb20gPT09IGRvbSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2O1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudEJvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghZXZlbnRCb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5ldmVudHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlID0gZXZlbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGUtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV2ID0gZXZlbnRzW2VdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2LmRvbSA9PT0gZXZlbnQudGFyZ2V0ICYmIGV2LmV2ZW50TmFtZSA9PT0gZXZlbnROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXYuZXZlbnRCaW5kaW5nLmZpcmUoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IHtcclxuICAgICAgICAgICAgICAgIGV2ZW50TmFtZSxcclxuICAgICAgICAgICAgICAgIGRvbSxcclxuICAgICAgICAgICAgICAgIGV2ZW50QmluZGluZyxcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkeCA9IGV2ZW50cy5pbmRleE9mKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpZHggPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudHMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnB1c2goZW50cnkpO1xyXG4gICAgICAgICAgICByZXR1cm4gZW50cnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnNlcnQoXywgZG9tLCBpZHg6IG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgZG9tRWxlbWVudHMgPSB0aGlzLmRvbUVsZW1lbnRzO1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XHJcblxyXG4gICAgICAgICAgICB2YXIgY3VySWR4ID0gZG9tRWxlbWVudHMuaW5kZXhPZihkb20pO1xyXG4gICAgICAgICAgICBpZiAoaWR4ICE9PSBjdXJJZHgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpZHggPCB0YXJnZXQuY2hpbGROb2Rlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudCA9IHRhcmdldC5jaGlsZE5vZGVzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQgIT09IGRvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKGRvbSwgY3VycmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoZG9tKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRvbUVsZW1lbnRzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhcmdldC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9tRWxlbWVudHNbaV0gPSB0YXJnZXQuY2hpbGROb2Rlc1tpXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzeW0gPSBTeW1ib2woKTtcclxuXHJcbiAgICAgICAgaW5zZXJ0VGFnKGJpbmRpbmcsIG5hbWUsIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgc3ltID0gdGhpcy5zeW07XHJcbiAgICAgICAgICAgIHZhciBkb20gPSBiaW5kaW5nW3N5bV07XHJcbiAgICAgICAgICAgIGlmICghZG9tKSB7XHJcbiAgICAgICAgICAgICAgICBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgYmluZGluZ1tzeW1dID0gZG9tO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0KGJpbmRpbmcsIGRvbSwgaWR4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHZhciBkb21FbGVtZW50cyA9IHRoaXMuZG9tRWxlbWVudHMsXHJcbiAgICAgICAgICAgICAgICBpID0gZG9tRWxlbWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBkb21FbGVtZW50c1tpXS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSURPTURyaXZlciB7XHJcbiAgICAgICAgaW5zZXJ0KHNlbmRlcjogSURvbUJpbmRpbmcsIGRvbSwgaWR4KTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGV4dEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyB0ZXh0Tm9kZTtcclxuICAgICAgICBwdWJsaWMgbGVuZ3RoID0gMTtcclxuICAgICAgICBwdWJsaWMgb2xkVmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICB0aGlzLnRleHROb2RlID0gKDxhbnk+ZG9jdW1lbnQpLmNyZWF0ZVRleHROb2RlKFwiXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgdGhpcy50ZXh0Tm9kZS5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXI6IElET01Ecml2ZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgbmV3VmFsdWUgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLmV4cHIpO1xyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHRoaXMub2xkVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciB0ZXh0Tm9kZSA9IHRoaXMudGV4dE5vZGU7XHJcbiAgICAgICAgICAgICAgICB0ZXh0Tm9kZS5ub2RlVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJpdmVyLmluc2VydCh0aGlzLCB0ZXh0Tm9kZSwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRhZ0JpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyB0YWdOb2RlO1xyXG4gICAgICAgIHB1YmxpYyBsZW5ndGggPSAxO1xyXG4gICAgICAgIHB1YmxpYyBldmVudEJpbmRpbmdzOiBFdmVudEJpbmRpbmdbXSA9IFtdO1xyXG4gICAgICAgIHByaXZhdGUgZG9tRHJpdmVyOiBEb21Ecml2ZXI7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTmFtZTogc3RyaW5nLCBwcml2YXRlIG5zOiBzdHJpbmcgPSBudWxsLCBjaGlsZEJpbmRpbmdzPzogUmUuQmluZGluZ1tdKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MgPSBjaGlsZEJpbmRpbmdzO1xyXG4gICAgICAgICAgICBpZiAobnMgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFnTm9kZSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVFbGVtZW50TlMobnMsIHRhZ05hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kb21Ecml2ZXIgPSBuZXcgRG9tRHJpdmVyKHRoaXMudGFnTm9kZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLnRhZ05vZGUucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGlsZChjaGlsZDogUmUuQmluZGluZyk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuY2hpbGRCaW5kaW5ncylcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF0dHJzKGF0dHJzKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyVmFsdWUgPSBhdHRyc1twcm9wXTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dHIocHJvcC50b0xvd2VyQ2FzZSgpLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhdHRyKG5hbWUsIGFzdCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFzdCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YWdOb2RlLnNldEF0dHJpYnV0ZShuYW1lLCBhc3QpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiY2xhc3NcIikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzQmluZGluZyA9IG5ldyBDbGFzc0JpbmRpbmcodGhpcy50YWdOb2RlLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goY2xhc3NCaW5kaW5nKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcInZhbHVlXCIgJiYgdGhpcy50YWdOYW1lID09PSBcImlucHV0XCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlQmluZGluZyA9IG5ldyBWYWx1ZUJpbmRpbmcodGhpcy50YWdOb2RlLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2godmFsdWVCaW5kaW5nKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcImNoZWNrZWRcIiAmJiB0aGlzLnRhZ05hbWUgPT09IFwiaW5wdXRcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZEJpbmRpbmcgPSBuZXcgQ2hlY2tlZEJpbmRpbmcodGhpcy50YWdOb2RlLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goY2hlY2tlZEJpbmRpbmcpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gL15vbiguKykvLmV4ZWMobmFtZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV2ZW50QmluZGluZ3MucHVzaChuZXcgRXZlbnRCaW5kaW5nKHRoaXMudGFnTm9kZSwgbWF0Y2hbMV0sIGFzdCkpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ckJpbmRpbmcgPSBuZXcgQXR0cmlidXRlQmluZGluZyh0aGlzLnRhZ05vZGUsIG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goYXR0ckJpbmRpbmcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2ZW50KG5hbWUsIGFzdCk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50QmluZGluZ3MucHVzaChuZXcgRXZlbnRCaW5kaW5nKHRoaXMudGFnTm9kZSwgbmFtZSwgYXN0KSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5zZXJ0VGFnKGJpbmRpbmcsIHRhZ05hbWUsIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRCaW5kaW5nc1tpXSA9PT0gYmluZGluZylcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmNoaWxkQmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZG9tRHJpdmVyLmluc2VydFRhZyh0aGlzLCB0YWdOYW1lLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW5zZXJ0KGJpbmRpbmcsIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kb21Ecml2ZXIuaW5zZXJ0KG51bGwsIGRvbSwgb2Zmc2V0ICsgaWR4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZShjb250ZXh0LCBkcml2ZXIpOiB0aGlzIHtcclxuICAgICAgICAgICAgc3VwZXIudXBkYXRlKGNvbnRleHQsIGRyaXZlcik7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRMZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZExlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzW2ldLnVwZGF0ZShjb250ZXh0LCB0aGlzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCB0aGlzLmV2ZW50QmluZGluZ3MubGVuZ3RoOyBuKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5ldmVudEJpbmRpbmdzW25dO1xyXG4gICAgICAgICAgICAgICAgZXZlbnQudXBkYXRlKGNvbnRleHQsIGRyaXZlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgICAgIGRyaXZlci5pbnNlcnQodGhpcywgdGhpcy50YWdOb2RlLCAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyaWdnZXIobmFtZSwgZXZlbnQsIGNvbnRleHQ/KSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IG4gPSAwOyBuIDwgdGhpcy5ldmVudEJpbmRpbmdzLmxlbmd0aDsgbisrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudEJpbmRpbmcgPSB0aGlzLmV2ZW50QmluZGluZ3Nbbl07XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRCaW5kaW5nLm5hbWUgPT09IFwibW92ZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRCaW5kaW5nLmZpcmUoZXZlbnQsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBDbGFzc0JpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgZG9tO1xyXG4gICAgICAgIHByaXZhdGUgb2xkVmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTm9kZTogSFRNTEVsZW1lbnQsIHByaXZhdGUgYXN0KSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgQXR0cmlidXRlTmFtZSA9IFwiY2xhc3NcIjtcclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLmFzdCk7XHJcblxyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHRoaXMub2xkVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFnTm9kZS5jbGFzc05hbWUgPSBuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgPyBDb3JlLmVtcHR5XHJcbiAgICAgICAgICAgICAgICAgICAgOiBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRXZlbnRCaW5kaW5nIHtcclxuICAgICAgICBwcml2YXRlIGNvbnRleHQ7XHJcbiAgICAgICAgcHJpdmF0ZSBkcml2ZXI7XHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBhbnksIHB1YmxpYyBuYW1lLCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmV4cHIgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4cHIoZXZlbnQsIHRoaXMuY29udGV4dCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmV4cHIuZXhlY3V0ZSh0aGlzLFxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgfHwge30sXHJcbiAgICAgICAgICAgICAgICAgICAgeyB2YWx1ZTogZXZlbnQgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGV2ZW50OiBldmVudCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgbm9kZTogZXZlbnQudGFyZ2V0IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBzdGF0ZTogdGhpcy5zdGF0ZSB8fCBudWxsIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0XHJcbiAgICAgICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcmUoZXZlbnQsIGNvbnRleHQ/KSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuZXZhbHVhdGUoY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gdHlwZW9mIG5ld1ZhbHVlID09PSBcImZ1bmN0aW9uXCIgPyBuZXdWYWx1ZSgpIDogbmV3VmFsdWU7XHJcblxyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhZyA9IGV2ZW50LnRhcmdldDtcclxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5yZW1vdmVBdHRyaWJ1dGUoXCJ2YWx1ZVwiKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCwgZHJpdmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICAgICAgICAgIHRoaXMuZHJpdmVyID0gZHJpdmVyO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlcihjb250ZXh0LCBkcml2ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgICAgICBkcml2ZXIub24odGhpcy5uYW1lLCB0aGlzLnRhZ05vZGUsIHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXh0ZW5kKCkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB3aGVyZShzb3VyY2UsIHByZWRpY2F0ZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZWxlY3Qoc291cmNlLCBzZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBxdWVyeShwYXJhbSwgc291cmNlKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF3YWl0KG9ic2VydmFibGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QodmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXBwKGZ1biwgYXJnczogYW55W10pIHtcclxuICAgICAgICAgICAgaWYgKGZ1biA9PT0gXCJhc3NpZ25cIikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ3NbMF07XHJcbiAgICAgICAgICAgICAgICBpZiAoYXJnID09PSBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbMV0uc2V0KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJnID0gYXJnLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgICAgICBhcmdzWzFdLnNldChhcmcudmFsdWVPZigpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBhcmc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhcmdzKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bi5hcHBseShudWxsLCBhcmdzLm1hcChFdmVudEJpbmRpbmcudmFsdWVPZikpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHN0YXRpYyB2YWx1ZU9mKHgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHggJiYgeC52YWx1ZU9mKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtZW1iZXIodGFyZ2V0OiB7IGdldChuYW1lOiBzdHJpbmcpOyByZWZyZXNoPygpOyB9LCBuYW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXQuZ2V0ID8gdGFyZ2V0LmdldChuYW1lKSA6IHRhcmdldFtuYW1lXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgQ2hlY2tlZEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBwcml2YXRlIG9sZFZhbHVlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhZ05vZGU6IGFueSwgcHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgICAgICB0YWdOb2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgdGhpcy5maXJlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyZSgpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZU9iamVjdCh0aGlzLmV4cHIpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUuc2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS5zZXQodGhpcy50YWdOb2RlLmNoZWNrZWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZWZyZXNoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5ldmFsdWF0ZVRleHQodGhpcy5leHByKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHZhbHVlICYmIHZhbHVlLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5vbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdm9pZCAwICYmIG5ld1ZhbHVlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG9sZFZhbHVlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShcImNoZWNrZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSA9IFwiY2hlY2tlZFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWdbXCJjaGVja2VkXCJdID0gXCJjaGVja2VkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZShcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGFnW1wiY2hlY2tlZFwiXSA9IHZvaWQgMDtcclxuICAgICAgICAgICAgICAgIHRhZy5yZW1vdmVBdHRyaWJ1dGUoXCJjaGVja2VkXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgVmFsdWVCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBhbnksIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICAgICAgdGFnTm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuZmlyZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcmUoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGVPYmplY3QodGhpcy5leHByKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnNldCkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUuc2V0KHRoaXMudGFnTm9kZS52YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGVUZXh0KHRoaXMuZXhwcik7XHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHZhbHVlICYmIHZhbHVlLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKFwidmFsdWVcIik7XHJcbiAgICAgICAgICAgICAgICB0YWdbXCJ2YWx1ZVwiXSA9IENvcmUuZW1wdHk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShcInZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgYXR0ci52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZU5vZGUoYXR0cik7XHJcbiAgICAgICAgICAgICAgICB0YWdbXCJ2YWx1ZVwiXSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBBdHRyaWJ1dGVCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBhbnksIHByaXZhdGUgbmFtZSwgcHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCwgcGFyZW50KSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGVUZXh0KHRoaXMuZXhwcik7XHJcblxyXG4gICAgICAgICAgICBpZiAodmFsdWUgJiYgdmFsdWUudmFsdWVPZilcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudmFsdWVPZigpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5uYW1lID09PSBcImNoZWNrZWRcIikge1xyXG4gICAgICAgICAgICAgICAgbmV3VmFsdWUgPSB2YWx1ZSA/IFwiY2hlY2tlZFwiIDogbnVsbDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBhdHRyTmFtZSA9IHRoaXMubmFtZTtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMudGFnTm9kZTtcclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSB2b2lkIDAgfHwgbmV3VmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRhZ1thdHRyTmFtZV0gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0dHJOYW1lID09PSBcInZhbHVlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGFnW2F0dHJOYW1lXSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gam9pbihzZXBhcmF0b3I6IHN0cmluZywgdmFsdWUpIHtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGggPiAwID8gdmFsdWUuc29ydCgpLmpvaW4oc2VwYXJhdG9yKSA6IG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbi8vIFJlU2hhcnBlciByZXN0b3JlIEluY29uc2lzdGVudE5hbWluZ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgRG9tOyJdfQ==