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
            if (context === void 0) { context = this.context; }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUE2QjtBQUM3Qix1Q0FBMkM7QUFHM0MsSUFBYyxHQUFHLENBb2dCaEI7QUFwZ0JELFdBQWMsR0FBRztJQUViLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUF1Qi9CO1FBQUE7UUFZQSxDQUFDO1FBWFUsZUFBSSxHQUFYLFVBQVksSUFBSTtZQUNaLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ00sY0FBRyxHQUFWLFVBQVcsT0FBZSxFQUFFLEVBQVUsRUFBRSxLQUFLLEVBQUUsUUFBUTtZQUNuRCxJQUFJLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ3ZFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlCLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDZixDQUFDO1FBQ0wsaUJBQUM7SUFBRCxDQUFDLEFBWkQsSUFZQztJQVpZLGNBQVUsYUFZdEIsQ0FBQTtJQUVEO1FBS0ksbUJBQVksTUFBTTtZQUhWLGdCQUFXLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLFdBQU0sR0FBRyxFQUFFLENBQUM7WUE4RVosUUFBRyxHQUFHLE1BQU0sRUFBRSxDQUFDO1lBM0VuQixFQUFFLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUM7Z0JB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RyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbEUsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUxELG9CQUtDOztBQUlELGtCQUFlLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tICcuL2NvcmUnXHJcbmltcG9ydCB7IFJlYWN0aXZlIGFzIFJlIH0gZnJvbSAnLi9yZWFjdGl2ZSdcclxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tICcuL3RlbXBsYXRlJ1xyXG5cclxuZXhwb3J0IG1vZHVsZSBEb20ge1xyXG5cclxuICAgIHZhciBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudDtcclxuXHJcbiAgICBpbnRlcmZhY2UgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIGxlbmd0aDtcclxuICAgICAgICB1cGRhdGUoY29udGV4dCwgcGFyZW50KTtcclxuICAgICAgICBkaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEb21WaXNpdG9yIGV4dGVuZHMgVGVtcGxhdGUuSVZpc2l0b3I8SURvbUJpbmRpbmc+IHtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3IHtcclxuICAgICAgICBiaW5kKHN0b3JlLCBkcml2ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJQWN0aW9uIHtcclxuICAgICAgICBleGVjdXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIElEaXNwYXRjaGVyIHtcclxuICAgICAgICBkaXNwYXRjaChhY3Rpb246IFJlLklBY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBEb21WaXNpdG9yIHtcclxuICAgICAgICBzdGF0aWMgdGV4dChleHByKTogVGV4dEJpbmRpbmcge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFRleHRCaW5kaW5nKGV4cHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGF0aWMgdGFnKHRhZ05hbWU6IHN0cmluZywgbnM6IHN0cmluZywgYXR0cnMsIGNoaWxkcmVuKTogVGFnQmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyh0YWdOYW1lLCBucywgY2hpbGRyZW4pLCBsZW5ndGggPSBhdHRycy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRhZy5hdHRyKGF0dHJzW2ldLm5hbWUsIGF0dHJzW2ldLnRwbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBEb21Ecml2ZXIge1xyXG4gICAgICAgIHByaXZhdGUgdGFyZ2V0O1xyXG4gICAgICAgIHByaXZhdGUgZG9tRWxlbWVudHMgPSBbXTtcclxuICAgICAgICBwcml2YXRlIGV2ZW50cyA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcih0YXJnZXQpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgPT09IFwic3RyaW5nXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGFyZ2V0KTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbihldmVudE5hbWUsIGRvbSwgZXZlbnRCaW5kaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciBldmVudHMgPSB0aGlzLmV2ZW50cyxcclxuICAgICAgICAgICAgICAgIGkgPSBldmVudHMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgZXZlbnRCb3VuZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV2ID0gZXZlbnRzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGV2LmV2ZW50TmFtZSA9PT0gZXZlbnROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV2LmRvbSA9PT0gZG9tKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXY7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50Qm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCFldmVudEJvdW5kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBldmVudCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBldmVudHMgPSB0aGlzLmV2ZW50cztcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGUgPSBldmVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZS0tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXYgPSBldmVudHNbZV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXYuZG9tID09PSBldmVudC50YXJnZXQgJiYgZXYuZXZlbnROYW1lID09PSBldmVudE5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldi5ldmVudEJpbmRpbmcuZmlyZShldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGVudHJ5ID0ge1xyXG4gICAgICAgICAgICAgICAgZXZlbnROYW1lLFxyXG4gICAgICAgICAgICAgICAgZG9tLFxyXG4gICAgICAgICAgICAgICAgZXZlbnRCaW5kaW5nLFxyXG4gICAgICAgICAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWR4ID0gZXZlbnRzLmluZGV4T2YodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50cy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMucHVzaChlbnRyeSk7XHJcbiAgICAgICAgICAgIHJldHVybiBlbnRyeTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChfLCBkb20sIGlkeDogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBkb21FbGVtZW50cyA9IHRoaXMuZG9tRWxlbWVudHM7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldDtcclxuXHJcbiAgICAgICAgICAgIHZhciBjdXJJZHggPSBkb21FbGVtZW50cy5pbmRleE9mKGRvbSk7XHJcbiAgICAgICAgICAgIGlmIChpZHggIT09IGN1cklkeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkeCA8IHRhcmdldC5jaGlsZE5vZGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50ID0gdGFyZ2V0LmNoaWxkTm9kZXNbaWR4XTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudCAhPT0gZG9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUoZG9tLCBjdXJyZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5hcHBlbmRDaGlsZChkb20pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZG9tRWxlbWVudHMubGVuZ3RoID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGFyZ2V0LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBkb21FbGVtZW50c1tpXSA9IHRhcmdldC5jaGlsZE5vZGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcml2YXRlIHN5bSA9IFN5bWJvbCgpO1xyXG5cclxuICAgICAgICBpbnNlcnRUYWcoYmluZGluZywgbmFtZSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBzeW0gPSB0aGlzLnN5bTtcclxuICAgICAgICAgICAgdmFyIGRvbSA9IGJpbmRpbmdbc3ltXTtcclxuICAgICAgICAgICAgaWYgKCFkb20pIHtcclxuICAgICAgICAgICAgICAgIGRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XHJcbiAgICAgICAgICAgICAgICBiaW5kaW5nW3N5bV0gPSBkb207XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5pbnNlcnQoYmluZGluZywgZG9tLCBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgdmFyIGRvbUVsZW1lbnRzID0gdGhpcy5kb21FbGVtZW50cyxcclxuICAgICAgICAgICAgICAgIGkgPSBkb21FbGVtZW50cy5sZW5ndGg7XHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIGRvbUVsZW1lbnRzW2ldLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRE9NRHJpdmVyIHtcclxuICAgICAgICBpbnNlcnQoc2VuZGVyOiBJRG9tQmluZGluZywgZG9tLCBpZHgpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUZXh0QmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJRG9tQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIHRleHROb2RlO1xyXG4gICAgICAgIHB1YmxpYyBsZW5ndGggPSAxO1xyXG4gICAgICAgIHB1YmxpYyBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBleHByKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMudGV4dE5vZGUgPSAoPGFueT5kb2N1bWVudCkuY3JlYXRlVGV4dE5vZGUoXCJcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLnRleHROb2RlLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcjogSURPTURyaXZlcikge1xyXG4gICAgICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IHRoaXMuZXZhbHVhdGVUZXh0KHRoaXMuZXhwcik7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy5vbGRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRleHROb2RlID0gdGhpcy50ZXh0Tm9kZTtcclxuICAgICAgICAgICAgICAgIHRleHROb2RlLm5vZGVWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcml2ZXIuaW5zZXJ0KHRoaXMsIHRleHROb2RlLCAwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJRG9tQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIHRhZ05vZGU7XHJcbiAgICAgICAgcHVibGljIGxlbmd0aCA9IDE7XHJcbiAgICAgICAgcHVibGljIGV2ZW50QmluZGluZ3M6IEV2ZW50QmluZGluZ1tdID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBkb21Ecml2ZXI6IERvbURyaXZlcjtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOYW1lOiBzdHJpbmcsIHByaXZhdGUgbnM6IHN0cmluZyA9IG51bGwsIGNoaWxkQmluZGluZ3M/OiBSZS5CaW5kaW5nW10pIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncyA9IGNoaWxkQmluZGluZ3M7XHJcbiAgICAgICAgICAgIGlmIChucyA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHRoaXMudGFnTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YWdOb2RlID0gKDxhbnk+ZG9jdW1lbnQpLmNyZWF0ZUVsZW1lbnROUyhucywgdGFnTmFtZS50b0xvd2VyQ2FzZSgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRvbURyaXZlciA9IG5ldyBEb21Ecml2ZXIodGhpcy50YWdOb2RlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGFnTm9kZS5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoaWxkKGNoaWxkOiBSZS5CaW5kaW5nKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5jaGlsZEJpbmRpbmdzKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXR0cnMoYXR0cnMpOiB0aGlzIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhdHRycykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IGF0dHJzW3Byb3BdO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXR0cihwcm9wLnRvTG93ZXJDYXNlKCksIGF0dHJWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGF0dHIobmFtZSwgYXN0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXN0ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ05vZGUuc2V0QXR0cmlidXRlKG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJjbGFzc1wiKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NCaW5kaW5nID0gbmV3IENsYXNzQmluZGluZyh0aGlzLnRhZ05vZGUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjbGFzc0JpbmRpbmcpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwidmFsdWVcIiAmJiB0aGlzLnRhZ05hbWUgPT09IFwiaW5wdXRcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVCaW5kaW5nID0gbmV3IFZhbHVlQmluZGluZyh0aGlzLnRhZ05vZGUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaCh2YWx1ZUJpbmRpbmcpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiY2hlY2tlZFwiICYmIHRoaXMudGFnTmFtZSA9PT0gXCJpbnB1dFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkQmluZGluZyA9IG5ldyBDaGVja2VkQmluZGluZyh0aGlzLnRhZ05vZGUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjaGVja2VkQmluZGluZyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSAvXm9uKC4rKS8uZXhlYyhuYW1lKTtcclxuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRCaW5kaW5ncy5wdXNoKG5ldyBFdmVudEJpbmRpbmcodGhpcy50YWdOb2RlLCBtYXRjaFsxXSwgYXN0KSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyQmluZGluZyA9IG5ldyBBdHRyaWJ1dGVCaW5kaW5nKHRoaXMudGFnTm9kZSwgbmFtZSwgYXN0KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChhdHRyQmluZGluZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZlbnQobmFtZSwgYXN0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRCaW5kaW5ncy5wdXNoKG5ldyBFdmVudEJpbmRpbmcodGhpcy50YWdOb2RlLCBuYW1lLCBhc3QpKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnNlcnRUYWcoYmluZGluZywgdGFnTmFtZSwgaWR4KSB7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzW2ldID09PSBiaW5kaW5nKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRCaW5kaW5nc1tpXS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kb21Ecml2ZXIuaW5zZXJ0VGFnKHRoaXMsIHRhZ05hbWUsIG9mZnNldCArIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnNlcnQoYmluZGluZywgZG9tLCBpZHgpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDAsIGxlbmd0aCA9IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkQmluZGluZ3NbaV0gPT09IGJpbmRpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5jaGlsZEJpbmRpbmdzW2ldLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRvbURyaXZlci5pbnNlcnQobnVsbCwgZG9tLCBvZmZzZXQgKyBpZHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQsIGRyaXZlcik6IHRoaXMge1xyXG4gICAgICAgICAgICBzdXBlci51cGRhdGUoY29udGV4dCwgZHJpdmVyKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkQmluZGluZ3MpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjaGlsZExlbmd0aCA9IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkTGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbaV0udXBkYXRlKGNvbnRleHQsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBuID0gMDsgbiA8IHRoaXMuZXZlbnRCaW5kaW5ncy5sZW5ndGg7IG4rKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLmV2ZW50QmluZGluZ3Nbbl07XHJcbiAgICAgICAgICAgICAgICBldmVudC51cGRhdGUoY29udGV4dCwgZHJpdmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICAgICAgZHJpdmVyLmluc2VydCh0aGlzLCB0aGlzLnRhZ05vZGUsIDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJpZ2dlcihuYW1lLCBldmVudCwgY29udGV4dD8pIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgbiA9IDA7IG4gPCB0aGlzLmV2ZW50QmluZGluZ3MubGVuZ3RoOyBuKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50QmluZGluZyA9IHRoaXMuZXZlbnRCaW5kaW5nc1tuXTtcclxuICAgICAgICAgICAgICAgIGlmIChldmVudEJpbmRpbmcubmFtZSA9PT0gXCJtb3ZlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudEJpbmRpbmcuZmlyZShldmVudCwgY29udGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIENsYXNzQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBIVE1MRWxlbWVudCwgcHJpdmF0ZSBhc3QpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBBdHRyaWJ1dGVOYW1lID0gXCJjbGFzc1wiO1xyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IHRoaXMuZXZhbHVhdGVUZXh0KHRoaXMuYXN0KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy5vbGRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YWdOb2RlLmNsYXNzTmFtZSA9IG5ld1ZhbHVlID09PSB2b2lkIDAgfHwgbmV3VmFsdWUgPT09IG51bGxcclxuICAgICAgICAgICAgICAgICAgICA/IENvcmUuZW1wdHlcclxuICAgICAgICAgICAgICAgICAgICA6IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBFdmVudEJpbmRpbmcge1xyXG4gICAgICAgIHByaXZhdGUgY29udGV4dDtcclxuICAgICAgICBwcml2YXRlIGRyaXZlcjtcclxuICAgICAgICBwcml2YXRlIHN0YXRlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRhZ05vZGU6IGFueSwgcHVibGljIG5hbWUsIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZXZhbHVhdGUoY29udGV4dCkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuZXhwciA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhwcihldmVudCwgdGhpcy5jb250ZXh0KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhwci5leGVjdXRlKHRoaXMsXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCB8fCB7fSxcclxuICAgICAgICAgICAgICAgICAgICB7IHZhbHVlOiBldmVudCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZXZlbnQ6IGV2ZW50IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBub2RlOiBldmVudC50YXJnZXQgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IHN0YXRlOiB0aGlzLnN0YXRlIHx8IG51bGwgfSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHRcclxuICAgICAgICAgICAgICAgIF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZmlyZShldmVudCwgY29udGV4dCA9IHRoaXMuY29udGV4dCkge1xyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLmV2YWx1YXRlKGNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IHR5cGVvZiBuZXdWYWx1ZSA9PT0gXCJmdW5jdGlvblwiID8gbmV3VmFsdWUoKSA6IG5ld1ZhbHVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWcgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKFwidmFsdWVcIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICB0aGlzLmRyaXZlciA9IGRyaXZlcjtcclxuICAgICAgICAgICAgdGhpcy5yZW5kZXIoY29udGV4dCwgZHJpdmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICAgICAgZHJpdmVyLm9uKHRoaXMubmFtZSwgdGhpcy50YWdOb2RlLCB0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dGVuZCgpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hlcmUoc291cmNlLCBwcmVkaWNhdGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2VsZWN0KHNvdXJjZSwgc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcXVlcnkocGFyYW0sIHNvdXJjZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhd2FpdChvYnNlcnZhYmxlKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0KHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChmdW4sIGFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIGlmIChmdW4gPT09IFwiYXNzaWduXCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmdzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFyZyA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICBhcmdzWzFdLnNldChudWxsKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJnc1sxXS5zZXQoYXJnLnZhbHVlT2YoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJncylcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgYXJncy5tYXAoRXZlbnRCaW5kaW5nLnZhbHVlT2YpKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdmFsdWVPZih4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB4ICYmIHgudmFsdWVPZigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWVtYmVyKHRhcmdldDogeyBnZXQobmFtZTogc3RyaW5nKTsgcmVmcmVzaD8oKTsgfSwgbmFtZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0LmdldCA/IHRhcmdldC5nZXQobmFtZSkgOiB0YXJnZXRbbmFtZV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIENoZWNrZWRCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBhbnksIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICAgICAgdGFnTm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuZmlyZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcmUoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGVPYmplY3QodGhpcy5leHByKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnNldCkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUuc2V0KHRoaXMudGFnTm9kZS5jaGVja2VkKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGVUZXh0KHRoaXMuZXhwcik7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB2YWx1ZSAmJiB2YWx1ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMub2xkVmFsdWU7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy50YWdOb2RlO1xyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHZvaWQgMCAmJiBuZXdWYWx1ZSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIGlmIChvbGRWYWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoXCJjaGVja2VkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBcImNoZWNrZWRcIjtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnW1wiY2hlY2tlZFwiXSA9IFwiY2hlY2tlZFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGUoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRhZ1tcImNoZWNrZWRcIl0gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKFwiY2hlY2tlZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm9sZFZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIFZhbHVlQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHByaXZhdGUgb2xkVmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTm9kZTogYW55LCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgICAgIHRhZ05vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmZpcmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaXJlKCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlT2JqZWN0KHRoaXMuZXhwcik7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5zZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlLnNldCh0aGlzLnRhZ05vZGUudmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLmV4cHIpO1xyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB2YWx1ZSAmJiB2YWx1ZS52YWx1ZU9mKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy50YWdOb2RlO1xyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShcInZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgdGFnW1widmFsdWVcIl0gPSBDb3JlLmVtcHR5O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoXCJ2YWx1ZVwiKTtcclxuICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgdGFnW1widmFsdWVcIl0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQXR0cmlidXRlQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTm9kZTogYW55LCBwcml2YXRlIG5hbWUsIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIHBhcmVudCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLmV4cHIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnZhbHVlT2YpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubmFtZSA9PT0gXCJjaGVja2VkXCIpIHtcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gdmFsdWUgPyBcImNoZWNrZWRcIiA6IG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgYXR0ck5hbWUgPSB0aGlzLm5hbWU7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyTmFtZSA9PT0gXCJ2YWx1ZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZ1thdHRyTmFtZV0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oc2VwYXJhdG9yOiBzdHJpbmcsIHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMCA/IHZhbHVlLnNvcnQoKS5qb2luKHNlcGFyYXRvcikgOiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59XHJcblxyXG4vLyBSZVNoYXJwZXIgcmVzdG9yZSBJbmNvbnNpc3RlbnROYW1pbmdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IERvbTsiXX0=