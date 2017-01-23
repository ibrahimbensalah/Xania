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
        ContentBinding.prototype.tag = function (tagName, ns, attrs, events, options) {
            var tag = new TagBinding(tagName, ns);
            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
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
            var binding = new ContentBinding(ast, this.appendChild, children);
            if (!!this.context)
                binding.update(this.context);
            this.childBindings.push(binding);
            return binding;
        };
        TagBinding.prototype.tag = function (tagName, ns, attrs, events, options) {
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
            if (fun === "=") {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx1Q0FBMkM7QUFDM0MsbUNBQWlDO0FBR2pDLElBQWMsR0FBRyxDQWdXaEI7QUFoV0QsV0FBYyxHQUFHO0lBRWIsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUsvQjtRQUFvQyxrQ0FBVTtRQUcxQyx3QkFBb0IsR0FBRyxFQUFTLFlBQTRDLEVBQVMsUUFBMEI7WUFBL0csWUFDSSxpQkFBTyxTQUNWO1lBRm1CLFNBQUcsR0FBSCxHQUFHLENBQUE7WUFBUyxrQkFBWSxHQUFaLFlBQVksQ0FBZ0M7WUFBUyxjQUFRLEdBQVIsUUFBUSxDQUFrQjtZQUZ2RyxlQUFTLEdBQXNCLEVBQUUsQ0FBQzs7UUFJMUMsQ0FBQztRQUVELCtCQUFNLEdBQU47WUFDSSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxLQUFLLElBQUksR0FBRyxDQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsR0FBRyxlQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXpGLElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXhCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQztnQkFDcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUM3QyxJQUFJLENBQUMsR0FB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bEMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLEVBQUUsQ0FBQyxDQUFDLE9BQU8sUUFBUSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQzlDLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO29CQUN0QixHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9CLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBRUosR0FBRyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3pDLENBQUM7WUFDTCxDQUFDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDN0IsQ0FBQztRQUNMLHVCQUFDO0lBQUQsQ0FBQyxBQXhDRCxDQUFzQyxtQkFBRSxDQUFDLE9BQU8sR0F3Qy9DO0lBeENZLG9CQUFnQixtQkF3QzVCLENBQUE7QUFxQkwsQ0FBQyxFQWhXYSxHQUFHLEdBQUgsV0FBRyxLQUFILFdBQUcsUUFnV2hCO0FBRUQsY0FBcUIsU0FBaUIsRUFBRSxLQUFLO0lBQ3pDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQztJQUNsRSxDQUFDO0lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNqQixDQUFDO0FBTEQsb0JBS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb3JlIH0gZnJvbSAnLi9jb3JlJ1xyXG5pbXBvcnQgeyBSZWFjdGl2ZSBhcyBSZSB9IGZyb20gJy4vcmVhY3RpdmUnXHJcbmltcG9ydCB7IGFjY2VwdCB9IGZyb20gJy4vZnNoYXJwJ1xyXG5pbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gJy4vdGVtcGxhdGUnXHJcblxyXG5leHBvcnQgbW9kdWxlIERvbSB7XHJcblxyXG4gICAgdmFyIGRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50O1xyXG5cclxuICAgIGludGVyZmFjZSBJVmlzaXRvciBleHRlbmRzIFRlbXBsYXRlLklWaXNpdG9yPFJlLkJpbmRpbmc+IHtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQ29udGVudEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIGltcGxlbWVudHMgSVZpc2l0b3Ige1xyXG4gICAgICAgIHByaXZhdGUgZnJhZ21lbnRzOiBDb250ZW50RnJhZ21lbnRbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFzdCwgcHVibGljIHBhcmVudEluc2VydDogKG46IE5vZGUsIGlkeDogbnVtYmVyKSA9PiB2b2lkLCBwdWJsaWMgY2hpbGRyZW46IFRlbXBsYXRlLklOb2RlW10pIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgdmFyIHN0cmVhbSA9IHRoaXMuYXN0ID09PSBudWxsID8gWyB0aGlzLmNvbnRleHQgXSA6IGFjY2VwdCh0aGlzLmFzdCwgdGhpcywgdGhpcy5jb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmVhbS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBzdHJlYW1baV07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGZyYWdtZW50ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGUgPSBpOyBlIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZiA9IHRoaXMuZnJhZ21lbnRzW2VdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmLmNvbnRleHQgPT09IGNvbnRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBmO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZSAhPT0gaSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZm91bmQgZnJhZ21lbnQgYXQgZSBieSBzaG91bGQgYmUgbG9jYXRlZCBhdCBpICovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZyYWdtZW50cy5zcGxpY2UoZSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGZyYWdtZW50ID09PSBudWxsIC8qIG5vdCBmb3VuZCAqLykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gbmV3IENvbnRlbnRGcmFnbWVudCh0aGlzLCBjb250ZXh0LCBvZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHMuc3BsaWNlKGksIDAsIGZyYWdtZW50KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHMucHVzaChmcmFnbWVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RyZWFtO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRleHQoYXN0LCBvcHRpb25zOiB7IGZyYWdtZW50OiBDb250ZW50RnJhZ21lbnQsIGNoaWxkOiBudW1iZXIgfSk6IFRleHRCaW5kaW5nIHtcclxuICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgVGV4dEJpbmRpbmcoYXN0KTtcclxuICAgICAgICAgICAgb3B0aW9ucy5mcmFnbWVudC5pbnNlcnQoYmluZGluZy5kb20sIG9wdGlvbnMuY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBjb250ZW50KGFzdCwgY2hpbGRyZW4sIG9wdGlvbnM6IHsgZnJhZ21lbnQ6IENvbnRlbnRGcmFnbWVudCwgY2hpbGQ6IG51bWJlciB9KTogQ29udGVudEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBDb250ZW50QmluZGluZyhhc3QsIGRvbSA9PiBvcHRpb25zLmZyYWdtZW50Lmluc2VydChkb20sIG9wdGlvbnMuY2hpbGQpLCBjaGlsZHJlbik7XHJcbiAgICAgICAgICAgIHJldHVybiBiaW5kaW5nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRhZyh0YWdOYW1lOiBzdHJpbmcsIG5zOiBzdHJpbmcsIGF0dHJzLCBldmVudHMsIG9wdGlvbnM6IGFueSkgOiBUYWdCaW5kaW5nIHtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUYWdCaW5kaW5nKHRhZ05hbWUsIG5zKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRhZy5hdHRyKGF0dHJzW2ldLm5hbWUsIGF0dHJzW2ldLnRwbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG9wdGlvbnMuZnJhZ21lbnQuaW5zZXJ0KHRhZy5kb20sIG9wdGlvbnMuY2hpbGQpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgQ29udGVudEZyYWdtZW50IHtcclxuICAgICAgICBwdWJsaWMgYmluZGluZ3M6IFJlLkJpbmRpbmdbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG93bmVyOiBDb250ZW50QmluZGluZywgcHVibGljIGNvbnRleHQsIHByaXZhdGUgb2Zmc2V0OiBudW1iZXIpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBvd25lci5jaGlsZHJlbi5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tlXSA9XHJcbiAgICAgICAgICAgICAgICAgICAgb3duZXIuY2hpbGRyZW5bZV0uYWNjZXB0KG93bmVyIGFzIElWaXNpdG9yLCB7IGZyYWdtZW50OiB0aGlzLCBjaGlsZDogZSB9KS51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChkb20sIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHRoaXMub3duZXIucGFyZW50SW5zZXJ0KGRvbSwgdGhpcy5vZmZzZXQgKyBpbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUZXh0QmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICB0aGlzLmRvbSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5ldmFsdWF0ZShhY2NlcHQsIHRoaXMuZXhwcik7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZG9tLmRldGFjaCgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb20udGV4dENvbnRlbnQgPSByZXN1bHQgJiYgcmVzdWx0LnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJVmlzaXRvciB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIGF0dHJpYnV0ZUJpbmRpbmdzID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBjaGlsZEJpbmRpbmdzOiBSZS5CaW5kaW5nW10gPSBbXTtcclxuICAgICAgICBwcml2YXRlIGV2ZW50cyA9IHt9O1xyXG4gICAgICAgIHByaXZhdGUgYXBwZW5kQ2hpbGQgPSBkb20gPT4gdGhpcy5kb20uYXBwZW5kQ2hpbGQoZG9tKTtcclxuICAgICAgICBwcml2YXRlIGNsYXNzQmluZGluZyA9IG5ldyBDbGFzc0JpbmRpbmcodGhpcyk7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHRhZ05hbWU6IHN0cmluZywgcHJpdmF0ZSBuczogc3RyaW5nID0gbnVsbCkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICBpZiAobnMgPT09IG51bGwpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRvbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb20gPSAoPGFueT5kb2N1bWVudCkuY3JlYXRlRWxlbWVudE5TKG5zLCB0YWdOYW1lLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgZXZlbnROYW1lcyA9IFsgXCJjbGlja1wiLCBcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIsIFwiYmx1clwiLCBcImNoYW5nZVwiIF07XHJcblxyXG4gICAgICAgIGF0dHIobmFtZSwgYXN0KTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSBcImNsYXNzXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NCaW5kaW5nLnNldEJhc2VDbGFzcyhhc3QpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWUuc3RhcnRzV2l0aChcImNsYXNzLlwiKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0JpbmRpbmcuYWRkQ2xhc3MobmFtZS5zdWJzdHIoNiksIGFzdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVGFnQmluZGluZy5ldmVudE5hbWVzLmluZGV4T2YobmFtZSkgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50QmluZGluZyA9IG5ldyBFdmVudEJpbmRpbmcodGhpcywgbmFtZSwgYXN0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlQmluZGluZ3MucHVzaChldmVudEJpbmRpbmcpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIGF0dHJCaW5kaW5nID0gbmV3IEF0dHJpYnV0ZUJpbmRpbmcodGhpcywgbmFtZSwgYXN0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlQmluZGluZ3MucHVzaChhdHRyQmluZGluZyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb24obmFtZSwgYXN0KSA6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tuYW1lXSA9IGFzdDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRleHQoYXN0KTogVGV4dEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBUZXh0QmluZGluZyhhc3QpO1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChiaW5kaW5nKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuY29udGV4dClcclxuICAgICAgICAgICAgICAgIGJpbmRpbmcudXBkYXRlKHRoaXMuY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGJpbmRpbmcuZG9tKTtcclxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgY29udGVudChhc3QsIGNoaWxkcmVuOiBUZW1wbGF0ZS5JTm9kZVtdKTogQ29udGVudEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBDb250ZW50QmluZGluZyhhc3QsIHRoaXMuYXBwZW5kQ2hpbGQsIGNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuY29udGV4dClcclxuICAgICAgICAgICAgICAgIGJpbmRpbmcudXBkYXRlKHRoaXMuY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChiaW5kaW5nKTtcclxuICAgICAgICAgICAgcmV0dXJuIGJpbmRpbmc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdGFnKHRhZ05hbWU6IHN0cmluZywgbnM6IHN0cmluZywgYXR0cnMsIGV2ZW50cywgb3B0aW9uczogYW55KTogVGFnQmluZGluZyB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGFnQmluZGluZyh0YWdOYW1lLCBucyk7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRCaW5kaW5ncy5wdXNoKHRhZyk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcuYXR0cihhdHRyc1tpXS5uYW1lLCBhdHRyc1tpXS50cGwpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRhZy5kb20pO1xyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlKGNvbnRleHQpOiB0aGlzIHtcclxuICAgICAgICAgICAgc3VwZXIudXBkYXRlKGNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jbGFzc0JpbmRpbmcudXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IHRoaXMuYXR0cmlidXRlQmluZGluZ3MubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlQmluZGluZ3NbZV0udXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRCaW5kaW5ncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzW2ldLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kb207XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyKG5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSB0aGlzLmV2ZW50c1tuYW1lXTtcclxuICAgICAgICAgICAgaWYgKCEhaGFuZGxlcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGFjY2VwdChoYW5kbGVyLCB0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIENsYXNzQmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcbiAgICAgICAgcHJpdmF0ZSBjb25kaXRpb25zID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBvbGRWYWx1ZTtcclxuICAgICAgICBwcml2YXRlIGJhc2VDbGFzc1RwbDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBwYXJlbnQ6IFRhZ0JpbmRpbmcpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNldEJhc2VDbGFzcyh0cGwpIHtcclxuICAgICAgICAgICAgdGhpcy5iYXNlQ2xhc3NUcGwgPSB0cGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhZGRDbGFzcyhjbGFzc05hbWUsIGNvbmRpdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLmNvbmRpdGlvbnMucHVzaCh7IGNsYXNzTmFtZSwgY29uZGl0aW9uIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuICAgICAgICAgICAgY29uc3QgY2xhc3NlcyA9IFtdO1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmJhc2VDbGFzc1RwbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYWNjZXB0KHRoaXMuYmFzZUNsYXNzVHBsLCB0aGlzLCBjb250ZXh0KS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICBjbGFzc2VzLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY29uZGl0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHsgY2xhc3NOYW1lLCBjb25kaXRpb24gfSA9IHRoaXMuY29uZGl0aW9uc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmICghIWFjY2VwdChjb25kaXRpb24sIHRoaXMsIGNvbnRleHQpLnZhbHVlT2YoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaChjbGFzc05hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIGNsYXNzZXMubGVuZ3RoID4gMCA/IGpvaW4oXCIgXCIsIGNsYXNzZXMpIDogbnVsbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc2V0QXR0cmlidXRlKGF0dHJOYW1lOiBzdHJpbmcsIG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IHRoaXMub2xkVmFsdWU7XHJcblxyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy5wYXJlbnQuZG9tO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5ld1ZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9sZFZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmNsYXNzTmFtZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMub2xkVmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBFdmVudEJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVGFnQmluZGluZywgcHJpdmF0ZSBuYW1lLCBwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcigpIHtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMucGFyZW50LmRvbTtcclxuICAgICAgICAgICAgdGFnLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5uYW1lLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlKGFjY2VwdCwgdGhpcy5leHByKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhcHAoZnVuLCBhcmdzOiBhbnlbXSkge1xyXG4gICAgICAgICAgICBpZiAoZnVuID09PSBcIj1cIikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gYXJnc1swXS52YWx1ZU9mKCk7XHJcbiAgICAgICAgICAgICAgICBhcmdzWzFdLnNldCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdXBlci5hcHAoZnVuLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZUJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgZG9tO1xyXG4gICAgICAgIHByaXZhdGUgb2xkVmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBUYWdCaW5kaW5nLCBwcml2YXRlIG5hbWUsIHByaXZhdGUgZXhwcikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmV2YWx1YXRlKGFjY2VwdCwgdGhpcy5leHByKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdm9pZCAwICYmICEhdmFsdWUudmFsdWVPZilcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudmFsdWVPZigpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5uYW1lID09PSBcImNoZWNrZWRcIikge1xyXG4gICAgICAgICAgICAgICAgbmV3VmFsdWUgPSAhIXZhbHVlID8gXCJjaGVja2VkXCIgOiBudWxsO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbmV3VmFsdWUgPSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5vbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBhdHRyTmFtZSA9IHRoaXMubmFtZTtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IHRoaXMucGFyZW50LmRvbTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXdWYWx1ZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCBuZXdWYWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGFnW2F0dHJOYW1lXSA9IHZvaWQgMDtcclxuICAgICAgICAgICAgICAgIHRhZy5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvbGRWYWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZG9jdW1lbnQuY3JlYXRlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHJpYnV0ZU5vZGUoYXR0cik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHRhZ1thdHRyTmFtZV0gPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBuZXdWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL2V4cG9ydCBmdW5jdGlvbiBpbXBvcnRWaWV3KHZpZXc6IHN0cmluZywgLi4uYXJncyk6IGFueSB7XHJcbiAgICAvLyAgICBpZiAoIShcImltcG9ydFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpKSkge1xyXG4gICAgLy8gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkhUTUwgaW1wb3J0IGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyXCIpO1xyXG4gICAgLy8gICAgfVxyXG5cclxuICAgIC8vICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XHJcbiAgICAvLyAgICB2YXIgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcclxuICAgIC8vICAgIGxpbmsucmVsID0gJ2ltcG9ydCc7XHJcbiAgICAvLyAgICBsaW5rLmhyZWYgPSB2aWV3O1xyXG4gICAgLy8gICAgbGluay5zZXRBdHRyaWJ1dGUoJ2FzeW5jJywgXCJcIik7IC8vIG1ha2UgaXQgYXN5bmMhXHJcbiAgICAvLyAgICBsaW5rLm9ubG9hZCA9IGUgPT4ge1xyXG4gICAgLy8gICAgICAgIHZhciBsaW5rID0gKDxhbnk+ZS50YXJnZXQpO1xyXG4gICAgLy8gICAgICAgIGRlZmVycmVkLm5vdGlmeShsaW5rLmltcG9ydC5xdWVyeVNlbGVjdG9yKFwidGVtcGxhdGVcIikpO1xyXG4gICAgLy8gICAgICAgIGxpbmsub25sb2FkID0gbnVsbDtcclxuICAgIC8vICAgIH1cclxuICAgIC8vICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobGluayk7XHJcblxyXG4gICAgLy8gICAgcmV0dXJuIGRlZmVycmVkO1xyXG4gICAgLy99XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBqb2luKHNlcGFyYXRvcjogc3RyaW5nLCB2YWx1ZSkge1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlLmxlbmd0aCA+IDAgPyB2YWx1ZS5zb3J0KCkuam9pbihzZXBhcmF0b3IpIDogbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxufVxyXG5cclxuICAgIC8vIFJlU2hhcnBlciByZXN0b3JlIEluY29uc2lzdGVudE5hbWluZ1xyXG4iXX0=