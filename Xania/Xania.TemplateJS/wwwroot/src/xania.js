"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var template_1 = require("./template");
var dom_1 = require("./dom");
var fsharp_1 = require("./fsharp");
exports.fs = fsharp_1.fs;
var reactive_1 = require("./reactive");
var Xania = (function () {
    function Xania() {
    }
    Xania.templates = function (elements) {
        var result = [];
        for (var i = 0; i < elements.length; i++) {
            var child = elements[i];
            if (child.accept)
                result.push(child);
            else {
                result.push(new template_1.Template.TextTemplate(child));
            }
        }
        return result;
    };
    Xania.tag = function (element, attr) {
        var children = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            children[_i - 2] = arguments[_i];
        }
        var childTemplates = this.templates(children);
        if (typeof element === "string") {
            var tag = new template_1.Template.TagTemplate(element, null, childTemplates);
            for (var prop in attr) {
                if (prop === "className" || prop === "classname" || prop === "clazz")
                    tag.attr("class", attr[prop]);
                else
                    tag.attr(prop, attr[prop]);
            }
            return tag;
        }
        else if (typeof element === "function") {
            var component = element(attr, childTemplates);
            return component;
        }
    };
    Xania.view = function (tpl, dispatcher) {
        return dom_1.Dom.view(tpl, dispatcher);
    };
    return Xania;
}());
exports.Xania = Xania;
function ForEach(attr, children) {
    var tpl = new template_1.Template.FragmentTemplate(attr.expr || null);
    for (var i = 0; i < children.length; i++) {
        tpl.child(children[i]);
    }
    return tpl;
}
exports.ForEach = ForEach;
function Partial(attr, children) {
    return {
        accept: function () {
            return new PartialBinding(attr, children);
        }
    };
}
exports.Partial = Partial;
var PartialBinding = (function (_super) {
    __extends(PartialBinding, _super);
    function PartialBinding(attr, children) {
        var _this = _super.call(this) || this;
        _this.attr = attr;
        _this.children = children;
        return _this;
    }
    Object.defineProperty(PartialBinding.prototype, "template", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    PartialBinding.prototype.accept = function (visitor, options) {
        return this;
    };
    PartialBinding.prototype.map = function (parent) {
        this.parent = parent;
        if (this.binding)
            this.binding.map(this);
        return this;
    };
    PartialBinding.prototype.insert = function (_, dom, idx) {
        this.parent.insert(this, dom, idx);
    };
    PartialBinding.prototype.render = function (context) {
        var view = this.evaluate(this.attr.view);
        if (this.binding)
            this.binding.dispose();
        this.binding = new dom_1.Dom.FragmentBinding(this.attr.model, [view])
            .map(this);
        this.binding.update(context);
    };
    return PartialBinding;
}(reactive_1.Reactive.Binding));
exports.PartialBinding = PartialBinding;
exports.Store = reactive_1.Reactive.Store;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMveGFuaWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdUNBQXFDO0FBQ3JDLDZCQUEyQjtBQUMzQixtQ0FBNkI7QUFxR3BCLHlCQUFFO0FBcEdYLHVDQUEyQztBQUUzQztJQUFBO0lBb0NBLENBQUM7SUFuQ1UsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDYixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxDQUFDO2dCQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxtQkFBUSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2xELENBQUM7UUFDTCxDQUFDO1FBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBQ00sU0FBRyxHQUFWLFVBQVcsT0FBTyxFQUFFLElBQUk7UUFBRSxrQkFBVzthQUFYLFVBQVcsRUFBWCxxQkFBVyxFQUFYLElBQVc7WUFBWCxpQ0FBVzs7UUFDakMsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU5QyxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzlCLElBQUksR0FBRyxHQUFHLElBQUksbUJBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxjQUFj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QyxJQUFJLENBQUMsQ0FBQztRQUV6QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ2IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUUzQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksU0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzFELEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFDTCxxQkFBQztBQUFELENBQUMsQUFyQ0QsQ0FBb0MsbUJBQUUsQ0FBQyxPQUFPLEdBcUM3QztBQXJDWSx3Q0FBYztBQXVDaEIsUUFBQSxLQUFLLEdBQUcsbUJBQUUsQ0FBQyxLQUFLLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gXCIuL3RlbXBsYXRlXCJcclxuaW1wb3J0IHsgRG9tIH0gZnJvbSBcIi4vZG9tXCJcclxuaW1wb3J0IHsgZnMgfSBmcm9tIFwiLi9mc2hhcnBcIlxyXG5pbXBvcnQgeyBSZWFjdGl2ZSBhcyBSZSB9IGZyb20gXCIuL3JlYWN0aXZlXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBYYW5pYSB7XHJcbiAgICBzdGF0aWMgdGVtcGxhdGVzKGVsZW1lbnRzKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkID0gZWxlbWVudHNbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAoY2hpbGQuYWNjZXB0KVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBUZW1wbGF0ZS5UZXh0VGVtcGxhdGUoY2hpbGQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHRhZyhlbGVtZW50LCBhdHRyLCAuLi5jaGlsZHJlbik6IFRlbXBsYXRlLklOb2RlIHtcclxuICAgICAgICB2YXIgY2hpbGRUZW1wbGF0ZXMgPSB0aGlzLnRlbXBsYXRlcyhjaGlsZHJlbik7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRlbXBsYXRlLlRhZ1RlbXBsYXRlKGVsZW1lbnQsIG51bGwsIGNoaWxkVGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhdHRyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcCA9PT0gXCJjbGFzc05hbWVcIiB8fCBwcm9wID09PSBcImNsYXNzbmFtZVwiIHx8IHByb3AgPT09IFwiY2xhenpcIilcclxuICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcImNsYXNzXCIsIGF0dHJbcHJvcF0pO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKHByb3AsIGF0dHJbcHJvcF0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICB2YXIgY29tcG9uZW50ID0gZWxlbWVudChhdHRyLCBjaGlsZFRlbXBsYXRlcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY29tcG9uZW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHN0YXRpYyB2aWV3KHRwbDogVGVtcGxhdGUuSU5vZGUsIGRpc3BhdGNoZXI/KSB7XHJcbiAgICAgICAgcmV0dXJuIERvbS52aWV3KHRwbCwgZGlzcGF0Y2hlcik7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gRm9yRWFjaChhdHRyLCBjaGlsZHJlbikge1xyXG4gICAgdmFyIHRwbCA9IG5ldyBUZW1wbGF0ZS5GcmFnbWVudFRlbXBsYXRlKGF0dHIuZXhwciB8fCBudWxsKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdHBsLmNoaWxkKGNoaWxkcmVuW2ldKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHBsO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gUGFydGlhbChhdHRyLCBjaGlsZHJlbikge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBhY2NlcHQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUGFydGlhbEJpbmRpbmcoYXR0ciwgY2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFBhcnRpYWxCaW5kaW5nIGV4dGVuZHMgUmUuQmluZGluZyB7XHJcbiAgICBwcml2YXRlIHBhcmVudDtcclxuICAgIHByaXZhdGUgYmluZGluZztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGF0dHIsIHByaXZhdGUgY2hpbGRyZW4pIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBhY2NlcHQodmlzaXRvciwgb3B0aW9uczogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgbWFwKHBhcmVudCkge1xyXG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gICAgICAgIGlmICh0aGlzLmJpbmRpbmcpXHJcbiAgICAgICAgICAgIHRoaXMuYmluZGluZy5tYXAodGhpcyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgaW5zZXJ0KF8sIGRvbSwgaWR4KSB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQuaW5zZXJ0KHRoaXMsIGRvbSwgaWR4KTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgIHZhciB2aWV3ID0gdGhpcy5ldmFsdWF0ZSh0aGlzLmF0dHIudmlldyk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJpbmRpbmcpXHJcbiAgICAgICAgICAgIHRoaXMuYmluZGluZy5kaXNwb3NlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZGluZyA9IG5ldyBEb20uRnJhZ21lbnRCaW5kaW5nKHRoaXMuYXR0ci5tb2RlbCwgW3ZpZXddKVxyXG4gICAgICAgICAgICAubWFwKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuYmluZGluZy51cGRhdGUoY29udGV4dCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgU3RvcmUgPSBSZS5TdG9yZTtcclxuXHJcbmV4cG9ydCB7IGZzIH1cclxuIl19