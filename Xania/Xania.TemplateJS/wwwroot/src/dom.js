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
        function TextBinding(parts) {
            var _this = _super.call(this) || this;
            _this.parts = parts;
            _this.dom = document.createTextNode("");
            return _this;
        }
        TextBinding.prototype.render = function (context) {
            var result = TextBinding.evaluate(this.parts, this, context);
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
        TextBinding.evaluate = function (parts, binding, context) {
            var _this = this;
            if (typeof parts === "object" && typeof parts.length === "number") {
                if (parts.length === 0)
                    return "";
                if (parts.length === 1)
                    return this.evaluatePart(parts[0], binding, context);
                return parts.map(function (p) { return _this.evaluatePart(p, binding, context).valueOf(); }).join("");
            }
            else {
                return this.evaluatePart(parts, binding, context);
            }
        };
        TextBinding.evaluatePart = function (part, binding, context) {
            if (typeof part === "string")
                return part;
            else {
                var result = fsharp_1.accept(part, binding, context);
                reactive_1.Reactive.Binding.observe(result, binding);
                return result;
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
            return this;
        };
        TagBinding.prototype.content = function (ast, children) {
            var binding = new ContentBinding(ast, this.appendChild, children).update(this.context);
            this.childBindings.push(binding);
            return this;
        };
        TagBinding.prototype.tag = function (tagName, ns, attrs, events, options) {
            var tag = new TagBinding(tagName, ns);
            this.childBindings.push(tag);
            for (var i = 0; i < attrs.length; i++) {
                tag.attr(attrs[i].name, attrs[i].tpl);
            }
            return this;
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
            var value = TextBinding.evaluate(this.tpl, this, context);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSx1Q0FBMkM7QUFDM0MsbUNBQWlDO0FBR2pDLElBQWMsR0FBRyxDQXVtQmhCO0FBdm1CRCxXQUFjLEdBQUc7SUFFYixJQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO0lBSy9CO1FBQW9DLGtDQUFVO1FBRzFDLHdCQUFvQixHQUFHLEVBQVMsWUFBNEMsRUFBUyxRQUEwQjtZQUEvRyxZQUNJLGlCQUFPLFNBQ1Y7WUFGbUIsU0FBRyxHQUFILEdBQUcsQ0FBQTtZQUFTLGtCQUFZLEdBQVosWUFBWSxDQUFnQztZQUFTLGNBQVEsR0FBUixRQUFRLENBQWtCO1lBRnZHLGVBQVMsR0FBc0IsRUFBRSxDQUFDOztRQUkxQyxDQUFDO1FBRUQsK0JBQU0sR0FBTjtZQUNJLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxHQUFHLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxHQUFHLGVBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFekYsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFeEIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUNwQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxH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QyxBQWpERCxDQUFzQyxtQkFBRSxDQUFDLE9BQU8sR0FpRC9DO0lBakRZLG9CQUFnQixtQkFpRDVCLENBQUE7QUFxUUwsQ0FBQyxFQXZtQmEsR0FBRyxHQUFILFdBQUcsS0FBSCxXQUFHLFFBdW1CaEI7QUFFRCxjQUFxQixTQUFpQixFQUFFLEtBQUs7SUFDekMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ2xFLENBQUM7SUFDRCxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ2pCLENBQUM7QUFMRCxvQkFLQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tICcuL2NvcmUnXHJcbmltcG9ydCB7IFJlYWN0aXZlIGFzIFJlIH0gZnJvbSAnLi9yZWFjdGl2ZSdcclxuaW1wb3J0IHsgYWNjZXB0IH0gZnJvbSAnLi9mc2hhcnAnXHJcbmltcG9ydCB7IFRlbXBsYXRlIH0gZnJvbSAnLi90ZW1wbGF0ZSdcclxuXHJcbmV4cG9ydCBtb2R1bGUgRG9tIHtcclxuXHJcbiAgICB2YXIgZG9jdW1lbnQgPSB3aW5kb3cuZG9jdW1lbnQ7XHJcblxyXG4gICAgaW50ZXJmYWNlIElWaXNpdG9yIGV4dGVuZHMgVGVtcGxhdGUuSVZpc2l0b3I8UmUuQmluZGluZz4ge1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBDb250ZW50QmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcgaW1wbGVtZW50cyBJVmlzaXRvciB7XHJcbiAgICAgICAgcHJpdmF0ZSBmcmFnbWVudHM6IENvbnRlbnRGcmFnbWVudFtdID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXN0LCBwdWJsaWMgcGFyZW50SW5zZXJ0OiAobjogTm9kZSwgaWR4OiBudW1iZXIpID0+IHZvaWQsIHB1YmxpYyBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVuZGVyKCkge1xyXG4gICAgICAgICAgICB2YXIgc3RyZWFtID0gdGhpcy5hc3QgPT09IG51bGwgPyBbIHRoaXMuY29udGV4dCBdIDogYWNjZXB0KHRoaXMuYXN0LCB0aGlzLCB0aGlzLmNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyZWFtLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IHN0cmVhbVtpXTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZnJhZ21lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgZSA9IGk7IGUgPCB0aGlzLmZyYWdtZW50cy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmID0gdGhpcy5mcmFnbWVudHNbZV07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGYuY29udGV4dCA9PT0gY29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFnbWVudCA9IGY7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlICE9PSBpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBmb3VuZCBmcmFnbWVudCBhdCBlIGJ5IHNob3VsZCBiZSBsb2NhdGVkIGF0IGkgKi9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRzLnNwbGljZShlLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZnJhZ21lbnQgPT09IG51bGwgLyogbm90IGZvdW5kICovKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZyYWdtZW50ID0gbmV3IENvbnRlbnRGcmFnbWVudCh0aGlzLCBjb250ZXh0LCBvZmZzZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpIDwgdGhpcy5mcmFnbWVudHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHMuc3BsaWNlKGksIDAsIGZyYWdtZW50KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudHMucHVzaChmcmFnbWVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc3RyZWFtO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRleHQoYXN0LCBvcHRpb25zOiB7IGZyYWdtZW50OiBDb250ZW50RnJhZ21lbnQsIGNoaWxkOiBudW1iZXIgfSk6IFRleHRCaW5kaW5nIHtcclxuICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgVGV4dEJpbmRpbmcoYXN0KTtcclxuICAgICAgICAgICAgb3B0aW9ucy5mcmFnbWVudC5pbnNlcnQoYmluZGluZy5kb20sIG9wdGlvbnMuY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gYmluZGluZztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBjb250ZW50KGFzdCwgY2hpbGRyZW4sIG9wdGlvbnM6IHsgZnJhZ21lbnQ6IENvbnRlbnRGcmFnbWVudCwgY2hpbGQ6IG51bWJlciB9KTogQ29udGVudEJpbmRpbmcge1xyXG4gICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBDb250ZW50QmluZGluZyhhc3QsIGRvbSA9PiBvcHRpb25zLmZyYWdtZW50Lmluc2VydChkb20sIG9wdGlvbnMuY2hpbGQpLCBjaGlsZHJlbik7XHJcbiAgICAgICAgICAgIHJldHVybiBiaW5kaW5nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRhZyh0YWdOYW1lOiBzdHJpbmcsIG5zOiBzdHJpbmcsIGF0dHJzLCBldmVudHMsIG9wdGlvbnM6IGFueSkgOiBUYWdCaW5kaW5nIHtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUYWdCaW5kaW5nKHRhZ05hbWUsIG5zKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRhZy5hdHRyKGF0dHJzW2ldLm5hbWUsIGF0dHJzW2ldLnRwbCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG9wdGlvbnMuZnJhZ21lbnQuaW5zZXJ0KHRhZy5kb20sIG9wdGlvbnMuY2hpbGQpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgQ29udGVudEZyYWdtZW50IHtcclxuICAgICAgICBwdWJsaWMgYmluZGluZ3M6IFJlLkJpbmRpbmdbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG93bmVyOiBDb250ZW50QmluZGluZywgcHVibGljIGNvbnRleHQsIHByaXZhdGUgb2Zmc2V0OiBudW1iZXIpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgZSA9IDA7IGUgPCBvd25lci5jaGlsZHJlbi5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tlXSA9XHJcbiAgICAgICAgICAgICAgICAgICAgb3duZXIuY2hpbGRyZW5bZV0uYWNjZXB0KG93bmVyIGFzIElWaXNpdG9yLCB7IGZyYWdtZW50OiB0aGlzLCBjaGlsZDogZSB9KS51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGluc2VydChkb20sIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHRoaXMub3duZXIucGFyZW50SW5zZXJ0KGRvbSwgdGhpcy5vZmZzZXQgKyBpbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUZXh0QmluZGluZyBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgICAgIHB1YmxpYyBkb207XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFydHMpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICAgICAgdGhpcy5kb20gPSAoPGFueT5kb2N1bWVudCkuY3JlYXRlVGV4dE5vZGUoXCJcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBUZXh0QmluZGluZy5ldmFsdWF0ZSh0aGlzLnBhcnRzLCB0aGlzLCBjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kb20uZGV0YWNoKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSByZXN1bHQgJiYgcmVzdWx0LnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoISFuZXdWYWx1ZSAmJiAhIW5ld1ZhbHVlLm9uTmV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlLnN1YnNjcmliZSh0aGlzKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbk5leHQobmV3VmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbk5leHQobmV3VmFsdWUpIHtcclxuICAgICAgICAgICAgdGhpcy5kb20udGV4dENvbnRlbnQgPSBuZXdWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBldmFsdWF0ZShwYXJ0cywgYmluZGluZywgY29udGV4dCk6IGFueSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHBhcnRzLmxlbmd0aCA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAxKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV2YWx1YXRlUGFydChwYXJ0c1swXSwgYmluZGluZywgY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnRzLm1hcChwID0+IHRoaXMuZXZhbHVhdGVQYXJ0KHAsIGJpbmRpbmcsIGNvbnRleHQpLnZhbHVlT2YoKSkuam9pbihcIlwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV2YWx1YXRlUGFydChwYXJ0cywgYmluZGluZywgY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBldmFsdWF0ZVBhcnQocGFydDogYW55LCBiaW5kaW5nLCBjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFydCA9PT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0O1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBhY2NlcHQocGFydCwgYmluZGluZywgY29udGV4dCk7XHJcbiAgICAgICAgICAgICAgICBSZS5CaW5kaW5nLm9ic2VydmUocmVzdWx0LCBiaW5kaW5nKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUYWdCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyBpbXBsZW1lbnRzIElWaXNpdG9yIHtcclxuICAgICAgICBwdWJsaWMgZG9tO1xyXG4gICAgICAgIHByaXZhdGUgYXR0cmlidXRlQmluZGluZ3MgPSBbXTtcclxuICAgICAgICBwcml2YXRlIGNoaWxkQmluZGluZ3M6IFJlLkJpbmRpbmdbXSA9IFtdO1xyXG4gICAgICAgIHByaXZhdGUgZXZlbnRzID0ge307XHJcbiAgICAgICAgcHJpdmF0ZSBhcHBlbmRDaGlsZCA9IGRvbSA9PiB0aGlzLmRvbS5hcHBlbmRDaGlsZChkb20pO1xyXG4gICAgICAgIHByaXZhdGUgY2xhc3NCaW5kaW5nID0gbmV3IENsYXNzQmluZGluZyh0aGlzKTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IodGFnTmFtZTogc3RyaW5nLCBwcml2YXRlIG5zOiBzdHJpbmcgPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgICAgIGlmIChucyA9PT0gbnVsbClcclxuICAgICAgICAgICAgICAgIHRoaXMuZG9tID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRvbSA9ICg8YW55PmRvY3VtZW50KS5jcmVhdGVFbGVtZW50TlMobnMsIHRhZ05hbWUudG9Mb3dlckNhc2UoKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZG9tLmF0dHJpYnV0ZXNbXCJfX2JpbmRpbmdcIl0gPSB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXR0cihuYW1lLCBhc3QpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IFwiY2xhc3NcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc0JpbmRpbmcuc2V0QmFzZUNsYXNzKGFzdCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZS5zdGFydHNXaXRoKFwiY2xhc3MuXCIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzQmluZGluZy5hZGRDbGFzcyhuYW1lLnN1YnN0cig2KSwgYXN0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyQmluZGluZyA9IG5ldyBBdHRyaWJ1dGVCaW5kaW5nKHRoaXMsIG5hbWUsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZUJpbmRpbmdzLnB1c2goYXR0ckJpbmRpbmcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vY2hpbGQoY2hpbGQ6IFJlLkJpbmRpbmcpOiB0aGlzIHtcclxuICAgICAgICAvLyAgICBpZiAoISF0aGlzLmNvbnRleHQpXHJcbiAgICAgICAgLy8gICAgICAgIGNoaWxkLnVwZGF0ZSh0aGlzLmNvbnRleHQpO1xyXG5cclxuICAgICAgICAvLyAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaChjaGlsZCk7XHJcbiAgICAgICAgLy8gICAgdGhpcy5hcHBlbmRDaGlsZChjaGlsZC5kb20pO1xyXG4gICAgICAgIC8vICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIC8vfVxyXG5cclxuICAgICAgICBvbihuYW1lLCBhc3QpIDogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW25hbWVdID0gYXN0O1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgdGV4dChhc3QpOiB0aGlzIHtcclxuICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgVGV4dEJpbmRpbmcoYXN0KTtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goYmluZGluZyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmNvbnRleHQpXHJcbiAgICAgICAgICAgICAgICBiaW5kaW5nLnVwZGF0ZSh0aGlzLmNvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChiaW5kaW5nLmRvbSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGNvbnRlbnQoYXN0LCBjaGlsZHJlbjogVGVtcGxhdGUuSU5vZGVbXSk6IHRoaXMge1xyXG4gICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBDb250ZW50QmluZGluZyhhc3QsIHRoaXMuYXBwZW5kQ2hpbGQsIGNoaWxkcmVuKS51cGRhdGUodGhpcy5jb250ZXh0KTtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZEJpbmRpbmdzLnB1c2goYmluZGluZyk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHRhZyh0YWdOYW1lOiBzdHJpbmcsIG5zOiBzdHJpbmcsIGF0dHJzLCBldmVudHMsIG9wdGlvbnM6IGFueSk6IHRoaXMge1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRhZ0JpbmRpbmcodGFnTmFtZSwgbnMpO1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3MucHVzaCh0YWcpO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGFnLmF0dHIoYXR0cnNbaV0ubmFtZSwgYXR0cnNbaV0udHBsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGUoY29udGV4dCk6IHRoaXMge1xyXG4gICAgICAgICAgICBzdXBlci51cGRhdGUoY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNsYXNzQmluZGluZy51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGUgPSAwOyBlIDwgdGhpcy5hdHRyaWJ1dGVCaW5kaW5ncy5sZW5ndGg7IGUrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVCaW5kaW5nc1tlXS51cGRhdGUoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZEJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkQmluZGluZ3NbaV0udXBkYXRlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbmRlcihjb250ZXh0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRvbTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyaWdnZXIobmFtZSkge1xyXG4gICAgICAgICAgICB2YXIgaGFuZGxlciA9IHRoaXMuZXZlbnRzW25hbWVdO1xyXG4gICAgICAgICAgICBpZiAoISFoYW5kbGVyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gYWNjZXB0KGhhbmRsZXIsIHRoaXMsIHRoaXMuY29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgQ2xhc3NCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICAgICAgcHVibGljIGRvbTtcclxuICAgICAgICBwcml2YXRlIGNvbmRpdGlvbnMgPSBbXTtcclxuICAgICAgICBwcml2YXRlIG9sZFZhbHVlO1xyXG4gICAgICAgIHByaXZhdGUgYmFzZUNsYXNzVHBsO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcmVudDogVGFnQmluZGluZykge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0QmFzZUNsYXNzKHRwbCkge1xyXG4gICAgICAgICAgICB0aGlzLmJhc2VDbGFzc1RwbCA9IHRwbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFkZENsYXNzKGNsYXNzTmFtZSwgY29uZGl0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29uZGl0aW9ucy5wdXNoKHsgY2xhc3NOYW1lLCBjb25kaXRpb24gfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICBjb25zdCBjbGFzc2VzID0gW107XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuYmFzZUNsYXNzVHBsKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBhY2NlcHQodGhpcy5iYXNlQ2xhc3NUcGwsIHRoaXMsIGNvbnRleHQpLnZhbHVlT2YoKTtcclxuICAgICAgICAgICAgICAgIGNsYXNzZXMucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb25kaXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeyBjbGFzc05hbWUsIGNvbmRpdGlvbiB9ID0gdGhpcy5jb25kaXRpb25zW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEhYWNjZXB0KGNvbmRpdGlvbiwgdGhpcywgY29udGV4dCkudmFsdWVPZigpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3Nlcy5sZW5ndGggPiAwID8gam9pbihcIiBcIiwgY2xhc3NlcykgOiBudWxsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzZXRBdHRyaWJ1dGUoYXR0ck5hbWU6IHN0cmluZywgbmV3VmFsdWUpIHtcclxuICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5vbGRWYWx1ZTtcclxuXHJcbiAgICAgICAgICAgIHZhciB0YWcgPSB0aGlzLnBhcmVudC5kb207XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmV3VmFsdWUgPT09IFwidW5kZWZpbmVkXCIgfHwgbmV3VmFsdWUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRhZ1thdHRyTmFtZV0gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgICAgICB0YWcucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2xkVmFsdWUgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0ci52YWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGVOb2RlKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuY2xhc3NOYW1lID0gbmV3VmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5vbGRWYWx1ZSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZUJpbmRpbmcgZXh0ZW5kcyBSZS5CaW5kaW5nIHtcclxuICAgICAgICBwdWJsaWMgZG9tO1xyXG4gICAgICAgIHByaXZhdGUgb2xkVmFsdWU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFyZW50OiBUYWdCaW5kaW5nLCBwcml2YXRlIG5hbWUsIHByaXZhdGUgdHBsKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IFRleHRCaW5kaW5nLmV2YWx1YXRlKHRoaXMudHBsLCB0aGlzLCBjb250ZXh0KTtcclxuXHJcbiAgICAgICAgICAgIGlmICghIXZhbHVlICYmICEhdmFsdWUub25OZXh0KSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS5zdWJzY3JpYmUodGhpcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uTmV4dCh2YWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBvbk5leHQodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB2b2lkIDAgJiYgISF2YWx1ZS52YWx1ZU9mKVxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS52YWx1ZU9mKCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgbmV3VmFsdWU7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm5hbWUgPT09IFwiY2hlY2tlZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9ICEhdmFsdWUgPyBcImNoZWNrZWRcIiA6IG51bGw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm9sZFZhbHVlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGF0dHJOYW1lID0gdGhpcy5uYW1lO1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gdGhpcy5wYXJlbnQuZG9tO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5ld1ZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8IG5ld1ZhbHVlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0YWdbYXR0ck5hbWVdID0gdm9pZCAwO1xyXG4gICAgICAgICAgICAgICAgdGFnLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9sZFZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUgPSBuZXdWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0cmlidXRlTm9kZShhdHRyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFnW2F0dHJOYW1lXSA9IG5ld1ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIG5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm9sZFZhbHVlID0gbmV3VmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vY2xhc3MgUmVhY3RpdmVCaW5kaW5nIGV4dGVuZHMgRG9tQmluZGluZyB7XHJcbiAgICAvLyAgICBwcml2YXRlIGJpbmRpbmdzID0gW107XHJcbiAgICAvLyAgICBwcml2YXRlIHN0cmVhbTtcclxuICAgIC8vICAgIHByaXZhdGUgbGVuZ3RoO1xyXG5cclxuICAgIC8vICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdHBsOiBUZW1wbGF0ZS5JTm9kZSwgcHJpdmF0ZSB0YXJnZXQsIHByaXZhdGUgb2Zmc2V0KSB7XHJcbiAgICAvLyAgICAgICAgc3VwZXIoKTtcclxuICAgIC8vICAgIH1cclxuXHJcbiAgICAvLyAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgLy8gICAgICAgIHZhciB7IGJpbmRpbmdzLCB0YXJnZXQsIHRwbCB9ID0gdGhpcztcclxuICAgIC8vICAgICAgICBpZiAoISF0cGwubW9kZWxBY2Nlc3Nvcikge1xyXG4gICAgLy8gICAgICAgICAgICB2YXIgc3RyZWFtID0gdHBsLm1vZGVsQWNjZXNzb3IuZXhlY3V0ZShjb250ZXh0LCB0aGlzKTtcclxuICAgIC8vICAgICAgICAgICAgdGhpcy5sZW5ndGggPSAwO1xyXG5cclxuICAgIC8vICAgICAgICAgICAgc3RyZWFtLmZvckVhY2goKGN0eCwgaWR4KSA9PiB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICB0aGlzLmxlbmd0aCA9IGlkeCArIDE7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tpXTtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICBpZiAoYmluZGluZy5jb250ZXh0LnZhbHVlID09PSBjdHgudmFsdWUpIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT09IGlkeCkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmluZGluZ3NbaV0gPSBiaW5kaW5nc1tpZHhdO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmluZGluZ3NbaWR4XSA9IGJpbmRpbmc7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICAgICAgICAgIHRoaXMuZXhlY3V0ZShjdHgsIGlkeCk7XHJcbiAgICAvLyAgICAgICAgICAgIH0pO1xyXG4gICAgLy8gICAgICAgIH0gZWxzZSB7XHJcbiAgICAvLyAgICAgICAgICAgIHRoaXMuZXhlY3V0ZShjb250ZXh0LCAwKTtcclxuICAgIC8vICAgICAgICAgICAgdGhpcy5sZW5ndGggPSAxO1xyXG4gICAgLy8gICAgICAgIH1cclxuXHJcbiAgICAvLyAgICAgICAgd2hpbGUgKGJpbmRpbmdzLmxlbmd0aCA+IHRoaXMubGVuZ3RoKSB7XHJcbiAgICAvLyAgICAgICAgICAgIGNvbnN0IG9sZEJpbmRpbmcgPSBiaW5kaW5ncy5wb3AoKTtcclxuICAgIC8vICAgICAgICAgICAgdGFyZ2V0LnJlbW92ZUNoaWxkKG9sZEJpbmRpbmcuZG9tKTtcclxuICAgIC8vICAgICAgICB9XHJcblxyXG4gICAgLy8gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgLy8gICAgfVxyXG5cclxuICAgIC8vICAgIGV4ZWN1dGUocmVzdWx0LCBpZHgpIHtcclxuICAgIC8vICAgICAgICB0aGlzLmFkZEJpbmRpbmcodGhpcy50cGwuYmluZChyZXN1bHQpLCBpZHgpO1xyXG4gICAgLy8gICAgfVxyXG5cclxuICAgIC8vICAgIGFkZEJpbmRpbmcobmV3QmluZGluZywgaWR4KSB7XHJcbiAgICAvLyAgICAgICAgdmFyIHsgb2Zmc2V0LCB0YXJnZXQsIGJpbmRpbmdzIH0gPSB0aGlzO1xyXG4gICAgLy8gICAgICAgIHZhciBpbnNlcnRBdCA9IG9mZnNldCArIGlkeDtcclxuXHJcbiAgICAvLyAgICAgICAgaWYgKGluc2VydEF0IDwgdGFyZ2V0LmNoaWxkTm9kZXMubGVuZ3RoKSB7XHJcbiAgICAvLyAgICAgICAgICAgIHZhciBiZWZvcmVFbGVtZW50ID0gdGFyZ2V0LmNoaWxkTm9kZXNbaW5zZXJ0QXRdO1xyXG4gICAgLy8gICAgICAgICAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKG5ld0JpbmRpbmcuZG9tLCBiZWZvcmVFbGVtZW50KTtcclxuICAgIC8vICAgICAgICB9IGVsc2Uge1xyXG4gICAgLy8gICAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQobmV3QmluZGluZy5kb20pO1xyXG4gICAgLy8gICAgICAgIH1cclxuXHJcbiAgICAvLyAgICAgICAgYmluZGluZ3Muc3BsaWNlKGlkeCwgMCwgbmV3QmluZGluZyk7XHJcbiAgICAvLyAgICB9XHJcbiAgICAvL31cclxuXHJcbiAgICAvL2V4cG9ydCBmdW5jdGlvbiBleGVjdXRlVGVtcGxhdGUob2JzZXJ2YWJsZSwgdHBsOiBUZW1wbGF0ZS5JTm9kZSwgdGFyZ2V0LCBvZmZzZXQpIHtcclxuICAgIC8vICAgIHJldHVybiBuZXcgUmVhY3RpdmVCaW5kaW5nKHRwbCwgdGFyZ2V0LCBvZmZzZXQpLnVwZGF0ZShvYnNlcnZhYmxlKTtcclxuICAgIC8vfVxyXG5cclxuICAgIC8vY2xhc3MgQmluZGVyIHtcclxuICAgIC8vICAgIHByaXZhdGUgY29tcGlsZTogRnVuY3Rpb247XHJcbiAgICAvLyAgICBwcml2YXRlIGNvbXBpbGVyOiBBc3QuQ29tcGlsZXI7XHJcbiAgICAvLyAgICBwdWJsaWMgY29udGV4dHM6IERhdGE0LklWYWx1ZVtdID0gW107XHJcblxyXG4gICAgLy8gICAgY29uc3RydWN0b3IocHJpdmF0ZSBsaWJzOiBhbnlbXSkge1xyXG4gICAgLy8gICAgICAgIHRoaXMuY29tcGlsZXIgPSBuZXcgQXN0LkNvbXBpbGVyKCk7XHJcbiAgICAvLyAgICAgICAgdGhpcy5jb21waWxlID0gdGhpcy5jb21waWxlci50ZW1wbGF0ZS5iaW5kKHRoaXMuY29tcGlsZXIpO1xyXG4gICAgLy8gICAgfVxyXG5cclxuICAgIC8vICAgIHN0YXRpYyBsaXN0ZW4odGFyZ2V0LCBzdG9yZTogRGF0YTUuU3RvcmUpIHtcclxuICAgIC8vICAgICAgICB2YXIgZXZlbnRIYW5kbGVyID0gKHRhcmdldCwgbmFtZSkgPT4ge1xyXG4gICAgLy8gICAgICAgICAgICB2YXIgYmluZGluZyA9IHRhcmdldC5hdHRyaWJ1dGVzW1wiX19iaW5kaW5nXCJdO1xyXG4gICAgLy8gICAgICAgICAgICBpZiAoISFiaW5kaW5nKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBiaW5kaW5nLnRyaWdnZXIobmFtZSk7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBzdG9yZS51cGRhdGUoKTtcclxuICAgIC8vICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgIH07XHJcblxyXG4gICAgLy8gICAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgZXZ0ID0+IGV2ZW50SGFuZGxlcihldnQudGFyZ2V0LCBldnQudHlwZSkpO1xyXG5cclxuICAgIC8vICAgICAgICBjb25zdCBvbmNoYW5nZSA9IGV2dCA9PiB7XHJcbiAgICAvLyAgICAgICAgICAgIHZhciBiaW5kaW5nID0gZXZ0LnRhcmdldC5hdHRyaWJ1dGVzW1wiX19iaW5kaW5nXCJdO1xyXG4gICAgLy8gICAgICAgICAgICBpZiAoYmluZGluZyAhPSBudWxsKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBjb25zdCBuYW1lQXR0ciA9IGV2dC50YXJnZXQuYXR0cmlidXRlc1tcIm5hbWVcIl07XHJcbiAgICAvLyAgICAgICAgICAgICAgICBpZiAoISFuYW1lQXR0cikge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIHZhciBhcnIgPSBuYW1lQXR0ci52YWx1ZS5zcGxpdCgnLicpO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0gYmluZGluZy5jb250ZXh0O1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwID0gYXJyW2ldO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gY29udGV4dC5nZXQocCk7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc2V0KGV2dC50YXJnZXQudmFsdWUpO1xyXG5cclxuICAgIC8vICAgICAgICAgICAgICAgICAgICBzdG9yZS51cGRhdGUoKTtcclxuICAgIC8vICAgICAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgIH07XHJcbiAgICAvLyAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLFxyXG4gICAgLy8gICAgICAgICAgICBldnQgPT4ge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgaWYgKGV2dC5rZXlDb2RlID09PSAxMykge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIGV2ZW50SGFuZGxlcihldnQudGFyZ2V0LCBcImtleXVwLmVudGVyXCIpO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICBvbmNoYW5nZShldnQpO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICAgICB9KTtcclxuICAgIC8vICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3ZlclwiLFxyXG4gICAgLy8gICAgICAgICAgICBldnQgPT4ge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgZXZlbnRIYW5kbGVyKGV2dC50YXJnZXQsIFwibW91c2VvdmVyXCIpO1xyXG4gICAgLy8gICAgICAgICAgICB9XHJcbiAgICAvLyAgICAgICAgKTtcclxuICAgIC8vICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3V0XCIsXHJcbiAgICAvLyAgICAgICAgICAgIGV2dCA9PiB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBldmVudEhhbmRsZXIoZXZ0LnRhcmdldCwgXCJtb3VzZW91dFwiKTtcclxuICAgIC8vICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICk7XHJcbiAgICAvLyAgICB9XHJcblxyXG4gICAgLy8gICAgcHVibGljIHVwZGF0ZTIoKSB7XHJcbiAgICAvLyAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbnRleHRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAvLyAgICAgICAgICAgIHZhciBjdHggPSB0aGlzLmNvbnRleHRzW2ldO1xyXG4gICAgLy8gICAgICAgICAgICBjdHgudXBkYXRlKG51bGwpO1xyXG4gICAgLy8gICAgICAgIH1cclxuICAgIC8vICAgIH1cclxuXHJcbiAgICAvLyAgICBwYXJzZURvbShyb290RG9tOiBOb2RlKTogVGVtcGxhdGUuSU5vZGUge1xyXG4gICAgLy8gICAgICAgIGNvbnN0IHN0YWNrID0gW107XHJcbiAgICAvLyAgICAgICAgbGV0IGk6IG51bWJlcjtcclxuICAgIC8vICAgICAgICB2YXIgcm9vdFRwbDtcclxuICAgIC8vICAgICAgICBzdGFjay5wdXNoKHtcclxuICAgIC8vICAgICAgICAgICAgbm9kZTogcm9vdERvbSxcclxuICAgIC8vICAgICAgICAgICAgcHVzaChlKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICByb290VHBsID0gZTtcclxuICAgIC8vICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgIH0pO1xyXG5cclxuICAgIC8vICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoID4gMCkge1xyXG4gICAgLy8gICAgICAgICAgICBjb25zdCBjdXIgPSBzdGFjay5wb3AoKTtcclxuICAgIC8vICAgICAgICAgICAgY29uc3Qgbm9kZTogTm9kZSA9IGN1ci5ub2RlO1xyXG4gICAgLy8gICAgICAgICAgICBjb25zdCBwdXNoID0gY3VyLnB1c2g7XHJcblxyXG4gICAgLy8gICAgICAgICAgICBpZiAoISFub2RlW1wiY29udGVudFwiXSkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgY29uc3QgZWx0ID0gPEhUTUxFbGVtZW50Pm5vZGVbXCJjb250ZW50XCJdO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgdmFyIHRlbXBsYXRlID0gbmV3IFRlbXBsYXRlLkNvbnRlbnRUZW1wbGF0ZSgpO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgZm9yIChpID0gZWx0LmNoaWxkTm9kZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHsgbm9kZTogZWx0LmNoaWxkTm9kZXNbaV0sIHB1c2g6IHRlbXBsYXRlLmFkZENoaWxkLmJpbmQodGVtcGxhdGUpIH0pO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICAgICAgICAgcHVzaCh0ZW1wbGF0ZSk7XHJcbiAgICAvLyAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMSkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgY29uc3QgZWx0ID0gPEhUTUxFbGVtZW50Pm5vZGU7XHJcbiAgICAvLyAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IG5ldyBUZW1wbGF0ZS5UYWdUZW1wbGF0ZShlbHQudGFnTmFtZSwgZWx0Lm5hbWVzcGFjZVVSSSk7XHJcblxyXG4gICAgLy8gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgISFlbHQuYXR0cmlidXRlcyAmJiBpIDwgZWx0LmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICB2YXIgYXR0cmlidXRlID0gZWx0LmF0dHJpYnV0ZXNbaV07XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJzZUF0dHIodGVtcGxhdGUsIGF0dHJpYnV0ZSk7XHJcbiAgICAvLyAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgLy8gICAgICAgICAgICAgICAgZm9yIChpID0gZWx0LmNoaWxkTm9kZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHsgbm9kZTogZWx0LmNoaWxkTm9kZXNbaV0sIHB1c2g6IHRlbXBsYXRlLmFkZENoaWxkLmJpbmQodGVtcGxhdGUpIH0pO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgfVxyXG4gICAgLy8gICAgICAgICAgICAgICAgcHVzaCh0ZW1wbGF0ZSk7XHJcbiAgICAvLyAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgdmFyIHRleHRDb250ZW50ID0gbm9kZS50ZXh0Q29udGVudDtcclxuICAgIC8vICAgICAgICAgICAgICAgIGlmICh0ZXh0Q29udGVudC50cmltKCkubGVuZ3RoID4gMCkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRwbCA9IHRoaXMuY29tcGlsZSh0ZXh0Q29udGVudCk7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgcHVzaChuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKHRwbCB8fCBub2RlLnRleHRDb250ZW50KSk7XHJcbiAgICAvLyAgICAgICAgICAgICAgICB9XHJcbiAgICAvLyAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICB9XHJcblxyXG4gICAgLy8gICAgICAgIHJldHVybiByb290VHBsO1xyXG4gICAgLy8gICAgfVxyXG5cclxuICAgIC8vICAgIHBhcnNlQXR0cih0YWdFbGVtZW50OiBUZW1wbGF0ZS5UYWdUZW1wbGF0ZSwgYXR0cjogQXR0cikge1xyXG4gICAgLy8gICAgICAgIGNvbnN0IG5hbWUgPSBhdHRyLm5hbWU7XHJcbiAgICAvLyAgICAgICAgaWYgKG5hbWUgPT09IFwiY2xpY2tcIiB8fCBuYW1lLm1hdGNoKC9rZXl1cFxcLi8pIHx8IG5hbWUgPT09IFwibW91c2VvdmVyXCIgfHwgbmFtZSA9PT0gXCJtb3VzZW91dFwiKSB7XHJcbiAgICAvLyAgICAgICAgICAgIGNvbnN0IGZuID0gdGhpcy5jb21waWxlKGF0dHIudmFsdWUpO1xyXG4gICAgLy8gICAgICAgICAgICB0YWdFbGVtZW50LmFkZEV2ZW50KG5hbWUsIGZuKTtcclxuICAgIC8vICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwiZGF0YS1zZWxlY3RcIiB8fCBuYW1lID09PSBcImRhdGEtZnJvbVwiKSB7XHJcbiAgICAvLyAgICAgICAgICAgIGNvbnN0IGZuID0gdGhpcy5jb21waWxlKGF0dHIudmFsdWUpO1xyXG4gICAgLy8gICAgICAgICAgICB0YWdFbGVtZW50LnNlbGVjdChmbik7XHJcbiAgICAvLyAgICAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgICAgY29uc3QgdHBsID0gdGhpcy5jb21waWxlKGF0dHIudmFsdWUpO1xyXG4gICAgLy8gICAgICAgICAgICB0YWdFbGVtZW50LmF0dHIobmFtZSwgdHBsIHx8IGF0dHIudmFsdWUpO1xyXG5cclxuICAgIC8vICAgICAgICAgICAgLy8gY29udmVudGlvbnNcclxuICAgIC8vICAgICAgICAgICAgaWYgKCEhdGFnRWxlbWVudC5uYW1lLm1hdGNoKC9eaW5wdXQkL2kpICYmXHJcbiAgICAvLyAgICAgICAgICAgICAgICAhIWF0dHIubmFtZS5tYXRjaCgvXm5hbWUkL2kpICYmXHJcbiAgICAvLyAgICAgICAgICAgICAgICAhdGFnRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiKSkge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVBY2Nlc3NvciA9IHRoaXMuY29tcGlsZShge3sgJHthdHRyLnZhbHVlfSB9fWApO1xyXG4gICAgLy8gICAgICAgICAgICAgICAgdGFnRWxlbWVudC5hdHRyKFwidmFsdWVcIiwgdmFsdWVBY2Nlc3Nvcik7XHJcbiAgICAvLyAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICB9XHJcbiAgICAvLyAgICB9XHJcblxyXG4gICAgLy99XHJcblxyXG4gICAgLy9leHBvcnQgZnVuY3Rpb24gaW1wb3J0Vmlldyh2aWV3OiBzdHJpbmcsIC4uLmFyZ3MpOiBhbnkge1xyXG4gICAgLy8gICAgaWYgKCEoXCJpbXBvcnRcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlua1wiKSkpIHtcclxuICAgIC8vICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJIVE1MIGltcG9ydCBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlclwiKTtcclxuICAgIC8vICAgIH1cclxuXHJcbiAgICAvLyAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xyXG4gICAgLy8gICAgdmFyIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XHJcbiAgICAvLyAgICBsaW5rLnJlbCA9ICdpbXBvcnQnO1xyXG4gICAgLy8gICAgbGluay5ocmVmID0gdmlldztcclxuICAgIC8vICAgIGxpbmsuc2V0QXR0cmlidXRlKCdhc3luYycsIFwiXCIpOyAvLyBtYWtlIGl0IGFzeW5jIVxyXG4gICAgLy8gICAgbGluay5vbmxvYWQgPSBlID0+IHtcclxuICAgIC8vICAgICAgICB2YXIgbGluayA9ICg8YW55PmUudGFyZ2V0KTtcclxuICAgIC8vICAgICAgICBkZWZlcnJlZC5ub3RpZnkobGluay5pbXBvcnQucXVlcnlTZWxlY3RvcihcInRlbXBsYXRlXCIpKTtcclxuICAgIC8vICAgICAgICBsaW5rLm9ubG9hZCA9IG51bGw7XHJcbiAgICAvLyAgICB9XHJcbiAgICAvLyAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGxpbmspO1xyXG5cclxuICAgIC8vICAgIHJldHVybiBkZWZlcnJlZDtcclxuICAgIC8vfVxyXG5cclxuICAgIC8vZnVuY3Rpb24gZGVmZXIoKSB7XHJcbiAgICAvLyAgICByZXR1cm4ge1xyXG4gICAgLy8gICAgICAgIHZhbHVlOiB2b2lkIDAsXHJcbiAgICAvLyAgICAgICAgcmVzb2x2ZXJzOiBbXSxcclxuICAgIC8vICAgICAgICBub3RpZnkodmFsdWUpIHtcclxuICAgIC8vICAgICAgICAgICAgaWYgKHZhbHVlID09PSB2b2lkIDApXHJcbiAgICAvLyAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmRlZmluZWQgcmVzdWx0XCIpO1xyXG5cclxuICAgIC8vICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xyXG5cclxuICAgIC8vICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnJlc29sdmVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgdGhpcy5yZXNvbHZlcnNbaV0uY2FsbChudWxsLCB2YWx1ZSk7XHJcbiAgICAvLyAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICB9LFxyXG4gICAgLy8gICAgICAgIHRoZW4ocmVzb2x2ZSkge1xyXG4gICAgLy8gICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PT0gdm9pZCAwKSB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICB0aGlzLnJlc29sdmVycy5wdXNoKHJlc29sdmUpO1xyXG4gICAgLy8gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgcmVzb2x2ZS5jYWxsKG51bGwsIHRoaXMudmFsdWUpO1xyXG4gICAgLy8gICAgICAgICAgICB9XHJcbiAgICAvLyAgICAgICAgfVxyXG4gICAgLy8gICAgfTtcclxuICAgIC8vfVxyXG5cclxuICAgIC8vZXhwb3J0IGZ1bmN0aW9uIGJpbmQoZG9tOiBOb2RlLCBzdG9yZSkge1xyXG5cclxuICAgIC8vICAgIHZhciBiaW5kZXIgPSBuZXcgQmluZGVyKFtDb3JlLkxpc3QsIENvcmUuTWF0aCwgQ29yZS5EYXRlc10pO1xyXG5cclxuICAgIC8vICAgIGxldCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgIC8vICAgIERvbS5leGVjdXRlVGVtcGxhdGUoc3RvcmUsIGJpbmRlci5wYXJzZURvbShkb20pLCBmcmFnbWVudCwgMCk7XHJcbiAgICAvLyAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZyYWdtZW50LmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcclxuICAgIC8vICAgICAgICB2YXIgY2hpbGQgPSBmcmFnbWVudC5jaGlsZE5vZGVzW2ldO1xyXG4gICAgLy8gICAgICAgIEJpbmRlci5saXN0ZW4oY2hpbGQsIHN0b3JlKTtcclxuICAgIC8vICAgIH1cclxuXHJcbiAgICAvLyAgICByZXR1cm4gZnJhZ21lbnQ7XHJcbiAgICAvL31cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oc2VwYXJhdG9yOiBzdHJpbmcsIHZhbHVlKSB7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoID4gMCA/IHZhbHVlLnNvcnQoKS5qb2luKHNlcGFyYXRvcikgOiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG59XHJcblxyXG4gICAgLy8gUmVTaGFycGVyIHJlc3RvcmUgSW5jb25zaXN0ZW50TmFtaW5nXHJcbiJdfQ==