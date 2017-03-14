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
            else if (name === "selected" && this.tagName === "option") {
                var selectedBinding = new SelectedBinding(this.tagNode, ast);
                this.childBindings.push(selectedBinding);
            }
            else {
                var match = /^on(.+)/.exec(name);
                if (match) {
                    this.childBindings.push(new EventBinding(this.tagNode, match[1], ast));
                }
                else {
                    var attrBinding = new AttributeBinding(this.tagNode, name, ast);
                    this.childBindings.push(attrBinding);
                }
            }
            return this;
        };
        TagBinding.prototype.event = function (name, ast) {
            this.childBindings.push(new EventBinding(this.tagNode, name, ast));
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
        TagBinding.prototype.update2 = function (context, driver) {
            _super.prototype.update2.call(this, context, driver);
            if (this.childBindings) {
                var childLength = this.childBindings.length;
                for (var i = 0; i < childLength; i++) {
                    this.childBindings[i].update2(context, this);
                }
            }
            return this;
        };
        TagBinding.prototype.render = function (context, driver) {
            driver.insert(this, this.tagNode, 0);
        };
        TagBinding.prototype.trigger = function (name, event, context) {
            for (var n = 0; n < this.childBindings.length; n++) {
                var eventBinding = this.childBindings[n];
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
    var EventBinding = (function (_super) {
        __extends(EventBinding, _super);
        function EventBinding(tagNode, name, expr) {
            var _this = _super.call(this) || this;
            _this.tagNode = tagNode;
            _this.name = name;
            _this.expr = expr;
            return _this;
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
    }(reactive_1.Reactive.Binding));
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
    var SelectedBinding = (function (_super) {
        __extends(SelectedBinding, _super);
        function SelectedBinding(tagNode, expr) {
            var _this = _super.call(this) || this;
            _this.tagNode = tagNode;
            _this.expr = expr;
            return _this;
        }
        SelectedBinding.prototype.render = function (context, parent) {
            var value = this.evaluateText(this.expr);
            if (value && value.valueOf)
                value = value.valueOf();
            this.tagNode.selected = value;
        };
        return SelectedBinding;
    }(reactive_1.Reactive.Binding));
    Dom.SelectedBinding = SelectedBinding;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLCtCQUE2QjtBQUM3Qix1Q0FBMkM7QUFHM0MsSUFBYyxHQUFHLENBMGdCaEI7QUExZ0JELFdBQWMsR0FBRztJQUViLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUF1Qi9CO1FBQUE7UUFZQSxDQUFDO1FBWFUsZUFBSSxHQUFYLFVBQVksSUFBSTtZQUNaLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ00sY0FBRyxHQUFWLFVBQVcsT0FBZSxFQUFFLEVBQVUsRUFBRSxLQUFLLEVBQUUsUUFBUTtZQUNuRCxJQUFJLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ3ZFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlCLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDZixDQUFDO1FBQ0wsaUJBQUM7SUFBRCxDQUFDLEFBWkQsSUFZQztJQVpZLGNBQVUsYUFZdEIsQ0FBQTtJQUVEO1FBS0ksbUJBQVksTUFBTTtZQUhWLGdCQUFXLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLFdBQU0sR0FBRyxFQUFFLENBQUM7WUE4RVosUUFBRyxHQUFHLE1BQU0sRUFBRSxDQUFDO1lBM0VuQixFQUFFLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUM7Z0JB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RUFBRSxDQUFDO1lBRTVCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUNsQyxDQUFDO1FBQ0wsc0JBQUM7SUFBRCxDQUFDLEFBYkQsQ0FBcUMsbUJBQUUsQ0FBQyxPQUFPLEdBYTlDO0lBYlksbUJBQWUsa0JBYTNCLENBQUE7QUFDTCxDQUFDLEVBMWdCYSxHQUFHLEdBQUgsV0FBRyxLQUFILFdBQUcsUUEwZ0JoQjtBQUVELGNBQXFCLFNBQWlCLEVBQUUsS0FBSztJQUN6QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbEUsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQUxELG9CQUtDOztBQUlELGtCQUFlLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tICcuL2NvcmUnXHJcbmltcG9ydCB7IFJlYWN0aXZlIGFzIFJlIH0gZnJvbSAnLi9yZWFjdGl2ZSdcclxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tICcuL3RlbXBsYXRlJ1xyXG5cclxuZXhwb3J0IG1vZHVsZSBEb20ge1xyXG5cclxuICAgIHZhciBkb2N1bWVudCA9IHdpbmRvdy5kb2N1bWVudDtcclxuXHJcbiAgICBpbnRlcmZhY2UgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIGxlbmd0aDtcclxuICAgICAgICB1cGRhdGUyKGNvbnRleHQsIHBhcmVudCk7XHJcbiAgICAgICAgZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRG9tVmlzaXRvciBleHRlbmRzIFRlbXBsYXRlLklWaXNpdG9yPElEb21CaW5kaW5nPiB7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJVmlldyB7XHJcbiAgICAgICAgYmluZChzdG9yZSwgZHJpdmVyKTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSUFjdGlvbiB7XHJcbiAgICAgICAgZXhlY3V0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBJRGlzcGF0Y2hlciB7XHJcbiAgICAgICAgZGlzcGF0Y2goYWN0aW9uOiBSZS5JQWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRG9tVmlzaXRvciB7XHJcbiAgICAgICAgc3RhdGljIHRleHQoZXhwcik6IFRleHRCaW5kaW5nIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBUZXh0QmluZGluZyhleHByKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhdGljIHRhZyh0YWdOYW1lOiBzdHJpbmcsIG5zOiBzdHJpbmcsIGF0dHJzLCBjaGlsZHJlbik6IFRhZ0JpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRhZ0JpbmRpbmcodGFnTmFtZSwgbnMsIGNoaWxkcmVuKSwgbGVuZ3RoID0gYXR0cnMubGVuZ3RoO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRG9tRHJpdmVyIHtcclxuICAgICAgICBwcml2YXRlIHRhcmdldDtcclxuICAgICAgICBwcml2YXRlIGRvbUVsZW1lbnRzID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBldmVudHMgPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IodGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09PSBcInN0cmluZ1wiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb24oZXZlbnROYW1lLCBkb20sIGV2ZW50QmluZGluZykge1xyXG4gICAgICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5ldmVudHMsXHJcbiAgICAgICAgICAgICAgICBpID0gZXZlbnRzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIGV2ZW50Qm91bmQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBldiA9IGV2ZW50c1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChldi5ldmVudE5hbWUgPT09IGV2ZW50TmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChldi5kb20gPT09IGRvbSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV2O1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudEJvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghZXZlbnRCb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnRzID0gdGhpcy5ldmVudHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlID0gZXZlbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGUtLSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV2ID0gZXZlbnRzW2VdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2LmRvbSA9PT0gZXZlbnQudGFyZ2V0ICYmIGV2LmV2ZW50TmFtZSA9PT0gZXZlbnROYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXYuZXZlbnRCaW5kaW5nLmZpcmUoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IHtcclxuICAgICAgICAgICAgICAgIGV2ZW50TmFtZSxcclxuICAgICAgICAgICAgICAgIGRvbSxcclxuICAgICAgICAgICAgICAgIGV2ZW50QmluZGluZyxcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkeCA9IGV2ZW50cy5pbmRleE9mKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpZHggPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudHMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnB1c2goZW50cnkpO1xyXG4gICAgICAgICAgICByZXR1cm4gZW50cnk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpbnNlcnQoXywgZG9tLCBpZHg6IG51bWJlcikge1xyXG4gICAgICAgICAgICB2YXIgZG9tRWxlbWVudHMgPSB0aGlzLmRvbUVsZW1lbnRzO1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XHJcblxyXG4gICAgICAgICAgICB2YXIgY3VySWR4ID0gZG9tRWxlbWVudHMuaW5kZXhPZihkb20pO1xyXG4gICAgICAgICAgICBpZiAoaWR4ICE9PSBjdXJJZHgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpZHggPCB0YXJnZXQuY2hpbGROb2Rlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudCA9IHRhcmdldC5jaGlsZE5vZGVzW2lkeF07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQgIT09IGRvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKGRvbSwgY3VycmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoZG9tKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGRvbUVsZW1lbnRzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRhcmdldC5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9tRWxlbWVudHNbaV0gPSB0YXJnZXQuY2hpbGROb2Rlc1tpXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzeW0gPSBTeW1ib2woKTtcclxuXHJcbiAgICAgICAgaW5zZXJ0VGFnKGJpbmRpbmcsIG5hbWUsIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgc3ltID0gdGhpcy5zeW07XHJcbiAgICAgICAgICAgIHZhciBkb20gPSBiaW5kaW5nW3N5bV07XHJcbiAgICAgICAgICAgIGlmICghZG9tKSB7XHJcbiAgICAgICAgICAgICAgICBkb20gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgYmluZGluZ1tzeW1dID0gZG9tO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0KGJpbmRpbmcsIGRvbSwgaWR4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHZhciBkb21FbGVtZW50cyA9IHRoaXMuZG9tRWxlbWVudHMsXHJcbiAgICAgICAgICAgICAgICBpID0gZG9tRWxlbWVudHMubGVuZ3RoO1xyXG4gICAgICAgICAgICB3aGlsZSAoaS0tKSB7XHJcbiAgICAgICAgICAgICAgICBkb21FbGVtZW50c1tpXS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgSURPTURyaXZlciB7XHJcbiAgICAgICAgaW5zZXJ0KHNlbmRlcjogSURvbUJpbmRpbmcsIGRvbSwgaWR4KTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGV4dEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyB0ZXh0Tm9kZTtcclxuICAgICAgICBwdWJsaWMgbGVuZ3RoID0gMTtcclxuICAgICAgICBwdWJsaWMgb2xkVmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICB0aGlzLnRleHROb2RlID0gKDxhbnk+ZG9jdW1lbnQpLmNyZWF0ZVRleHROb2RlKFwiXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgdGhpcy50ZXh0Tm9kZS5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXI6IElET01Ecml2ZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgbmV3VmFsdWUgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLmV4cHIpO1xyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHRoaXMub2xkVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciB0ZXh0Tm9kZSA9IHRoaXMudGV4dE5vZGU7XHJcbiAgICAgICAgICAgICAgICB0ZXh0Tm9kZS5ub2RlVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJpdmVyLmluc2VydCh0aGlzLCB0ZXh0Tm9kZSwgMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRhZ0JpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSURvbUJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyB0YWdOb2RlO1xyXG4gICAgICAgIHB1YmxpYyBsZW5ndGggPSAxO1xyXG4gICAgICAgIHByaXZhdGUgZG9tRHJpdmVyOiBEb21Ecml2ZXI7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTmFtZTogc3RyaW5nLCBwcml2YXRlIG5zOiBzdHJpbmcgPSBudWxsLCBjaGlsZEJpbmRpbmdzPzogUmUuQmluZGluZ1tdKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MgPSBjaGlsZEJpbmRpbmdzO1xyXG4gICAgICAgICAgICBpZiAobnMgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFnTm9kZSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVFbGVtZW50TlMobnMsIHRhZ05hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kb21Ecml2ZXIgPSBuZXcgRG9tRHJpdmVyKHRoaXMudGFnTm9kZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB0aGlzLnRhZ05vZGUucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGlsZChjaGlsZDogUmUuQmluZGluZyk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuY2hpbGRCaW5kaW5ncylcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF0dHJzKGF0dHJzKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gYXR0cnMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyVmFsdWUgPSBhdHRyc1twcm9wXTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dHIocHJvcC50b0xvd2VyQ2FzZSgpLCBhdHRyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhdHRyKG5hbWUsIGFzdCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFzdCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50YWdOb2RlLnNldEF0dHJpYnV0ZShuYW1lLCBhc3QpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiY2xhc3NcIikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzQmluZGluZyA9IG5ldyBDbGFzc0JpbmRpbmcodGhpcy50YWdOb2RlLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goY2xhc3NCaW5kaW5nKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcInZhbHVlXCIgJiYgdGhpcy50YWdOYW1lID09PSBcImlucHV0XCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlQmluZGluZyA9IG5ldyBWYWx1ZUJpbmRpbmcodGhpcy50YWdOb2RlLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2godmFsdWVCaW5kaW5nKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcImNoZWNrZWRcIiAmJiB0aGlzLnRhZ05hbWUgPT09IFwiaW5wdXRcIikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZEJpbmRpbmcgPSBuZXcgQ2hlY2tlZEJpbmRpbmcodGhpcy50YWdOb2RlLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goY2hlY2tlZEJpbmRpbmcpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwic2VsZWN0ZWRcIiAmJiB0aGlzLnRhZ05hbWUgPT09IFwib3B0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkQmluZGluZyA9IG5ldyBTZWxlY3RlZEJpbmRpbmcodGhpcy50YWdOb2RlLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goc2VsZWN0ZWRCaW5kaW5nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IC9eb24oLispLy5leGVjKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2gobmV3IEV2ZW50QmluZGluZyh0aGlzLnRhZ05vZGUsIG1hdGNoWzFdLCBhc3QpKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJCaW5kaW5nID0gbmV3IEF0dHJpYnV0ZUJpbmRpbmcodGhpcy50YWdOb2RlLCBuYW1lLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncy5wdXNoKGF0dHJCaW5kaW5nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBldmVudChuYW1lLCBhc3QpOiB0aGlzIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2gobmV3IEV2ZW50QmluZGluZyh0aGlzLnRhZ05vZGUsIG5hbWUsIGFzdCkpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydFRhZyhiaW5kaW5nLCB0YWdOYW1lLCBpZHgpIHtcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDAsIGxlbmd0aCA9IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkQmluZGluZ3NbaV0gPT09IGJpbmRpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gdGhpcy5jaGlsZEJpbmRpbmdzW2ldLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRvbURyaXZlci5pbnNlcnRUYWcodGhpcywgdGFnTmFtZSwgb2Zmc2V0ICsgaWR4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChiaW5kaW5nLCBkb20sIGlkeCkge1xyXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRCaW5kaW5nc1tpXSA9PT0gYmluZGluZylcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIG9mZnNldCArPSB0aGlzLmNoaWxkQmluZGluZ3NbaV0ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZG9tRHJpdmVyLmluc2VydChudWxsLCBkb20sIG9mZnNldCArIGlkeCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUyKGNvbnRleHQsIGRyaXZlcik6IHRoaXMge1xyXG4gICAgICAgICAgICBzdXBlci51cGRhdGUyKGNvbnRleHQsIGRyaXZlcik7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jaGlsZEJpbmRpbmdzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRMZW5ndGggPSB0aGlzLmNoaWxkQmluZGluZ3MubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZExlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzW2ldLnVwZGF0ZTIoY29udGV4dCwgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIGRyaXZlcikge1xyXG4gICAgICAgICAgICBkcml2ZXIuaW5zZXJ0KHRoaXMsIHRoaXMudGFnTm9kZSwgMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyKG5hbWUsIGV2ZW50LCBjb250ZXh0Pykge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBuID0gMDsgbiA8IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7IG4rKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRCaW5kaW5nID0gPEV2ZW50QmluZGluZz50aGlzLmNoaWxkQmluZGluZ3Nbbl07XHJcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRCaW5kaW5nLm5hbWUgPT09IFwibW92ZVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRCaW5kaW5nLmZpcmUoZXZlbnQsIGNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBDbGFzc0JpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgZG9tO1xyXG4gICAgICAgIHByaXZhdGUgb2xkVmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTm9kZTogSFRNTEVsZW1lbnQsIHByaXZhdGUgYXN0KSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgQXR0cmlidXRlTmFtZSA9IFwiY2xhc3NcIjtcclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLmFzdCk7XHJcblxyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHRoaXMub2xkVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMudGFnTm9kZS5jbGFzc05hbWUgPSBuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgPyBDb3JlLmVtcHR5XHJcbiAgICAgICAgICAgICAgICAgICAgOiBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRXZlbnRCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBhbnksIHB1YmxpYyBuYW1lLCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV2YWx1YXRlKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmV4cHIgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4cHIoZXZlbnQsIHRoaXMuY29udGV4dCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmV4cHIuZXhlY3V0ZSh0aGlzLFxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgfHwge30sXHJcbiAgICAgICAgICAgICAgICAgICAgeyB2YWx1ZTogZXZlbnQgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGV2ZW50OiBldmVudCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgbm9kZTogZXZlbnQudGFyZ2V0IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBzdGF0ZTogdGhpcy5zdGF0ZSB8fCBudWxsIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0XHJcbiAgICAgICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcmUoZXZlbnQsIGNvbnRleHQgPSB0aGlzLmNvbnRleHQpIHtcclxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gdGhpcy5ldmFsdWF0ZShjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSB0eXBlb2YgbmV3VmFsdWUgPT09IFwiZnVuY3Rpb25cIiA/IG5ld1ZhbHVlKCkgOiBuZXdWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFnID0gZXZlbnQudGFyZ2V0O1xyXG4gICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShcInZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWcudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnJlZnJlc2goKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0LCBkcml2ZXIpIHtcclxuICAgICAgICAgICAgZHJpdmVyLm9uKHRoaXMubmFtZSwgdGhpcy50YWdOb2RlLCB0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGV4dGVuZCgpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hlcmUoc291cmNlLCBwcmVkaWNhdGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2VsZWN0KHNvdXJjZSwgc2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgeWV0LlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcXVlcnkocGFyYW0sIHNvdXJjZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZCB5ZXQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhd2FpdChvYnNlcnZhYmxlKSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkIHlldC5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0KHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFwcChmdW4sIGFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIGlmIChmdW4gPT09IFwiYXNzaWduXCIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmdzWzBdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFyZyA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgICAgICBhcmdzWzFdLnNldChudWxsKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZyA9IGFyZy52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJnc1sxXS5zZXQoYXJnLnZhbHVlT2YoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYXJncylcclxuICAgICAgICAgICAgICAgIHJldHVybiBmdW4uYXBwbHkobnVsbCwgYXJncy5tYXAoRXZlbnRCaW5kaW5nLnZhbHVlT2YpKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgdmFsdWVPZih4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB4ICYmIHgudmFsdWVPZigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWVtYmVyKHRhcmdldDogeyBnZXQobmFtZTogc3RyaW5nKTsgcmVmcmVzaD8oKTsgfSwgbmFtZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0LmdldCA/IHRhcmdldC5nZXQobmFtZSkgOiB0YXJnZXRbbmFtZV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIENoZWNrZWRCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBhbnksIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICAgICAgdGFnTm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHRoaXMuZmlyZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpcmUoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGVPYmplY3QodGhpcy5leHByKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnNldCkge1xyXG4gICAgICAgICAgICAgICAgdmFsdWUuc2V0KHRoaXMudGFnTm9kZS5jaGVja2VkKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMuZXZhbHVhdGVUZXh0KHRoaXMuZXhwcik7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB2YWx1ZSAmJiB2YWx1ZS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMub2xkVmFsdWU7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy50YWdOb2RlO1xyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHZvaWQgMCAmJiBuZXdWYWx1ZSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIGlmIChvbGRWYWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoXCJjaGVja2VkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBcImNoZWNrZWRcIjtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnW1wiY2hlY2tlZFwiXSA9IFwiY2hlY2tlZFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGUoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRhZ1tcImNoZWNrZWRcIl0gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKFwiY2hlY2tlZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm9sZFZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIFZhbHVlQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHByaXZhdGUgb2xkVmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTm9kZTogYW55LCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgICAgIHRhZ05vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCB0aGlzLmZpcmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmaXJlKCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlT2JqZWN0KHRoaXMuZXhwcik7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5zZXQpIHtcclxuICAgICAgICAgICAgICAgIHZhbHVlLnNldCh0aGlzLnRhZ05vZGUudmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQucmVmcmVzaCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLmV4cHIpO1xyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSB2YWx1ZSAmJiB2YWx1ZS52YWx1ZU9mKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy50YWdOb2RlO1xyXG4gICAgICAgICAgICBpZiAobmV3VmFsdWUgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShcInZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgdGFnW1widmFsdWVcIl0gPSBDb3JlLmVtcHR5O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoXCJ2YWx1ZVwiKTtcclxuICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgdGFnW1widmFsdWVcIl0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQXR0cmlidXRlQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFnTm9kZTogYW55LCBwcml2YXRlIG5hbWUsIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIHBhcmVudCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLmV4cHIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnZhbHVlT2YpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubmFtZSA9PT0gXCJjaGVja2VkXCIpIHtcclxuICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gdmFsdWUgPyBcImNoZWNrZWRcIiA6IG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgYXR0ck5hbWUgPSB0aGlzLm5hbWU7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnRhZ05vZGU7XHJcbiAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdm9pZCAwIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyTmFtZSA9PT0gXCJ2YWx1ZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZ1thdHRyTmFtZV0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgU2VsZWN0ZWRCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSB0YWdOb2RlOiBhbnksIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQsIHBhcmVudCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlVGV4dCh0aGlzLmV4cHIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlLnZhbHVlT2YpXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGFnTm9kZS5zZWxlY3RlZCA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oc2VwYXJhdG9yOiBzdHJpbmcsIHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMCA/IHZhbHVlLnNvcnQoKS5qb2luKHNlcGFyYXRvcikgOiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59XHJcblxyXG4vLyBSZVNoYXJwZXIgcmVzdG9yZSBJbmNvbnNpc3RlbnROYW1pbmdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IERvbTsiXX0=