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
var Partial = (function (_super) {
    __extends(Partial, _super);
    function Partial(attr, children) {
        var _this = _super.call(this, null) || this;
        _this.attr = attr;
        _this.children = children;
        return _this;
    }
    Object.defineProperty(Partial.prototype, "template", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    Partial.prototype.accept = function (visitor, options) {
        return this;
    };
    Partial.prototype.map = function (parent) {
        this.parent = parent;
        if (this.binding)
            this.binding.map(this);
        return this;
    };
    Partial.prototype.insert = function (_, dom, idx) {
        this.parent.insert(this, dom, idx);
    };
    Partial.prototype.render = function (context) {
        var view = this.evaluate(this.attr.view);
        if (this.binding)
            this.binding.dispose();
        this.binding = new dom_1.Dom.FragmentBinding(this.attr.model, [view.template])
            .map(this);
        this.binding.update(context);
    };
    return Partial;
}(reactive_1.Reactive.Binding));
exports.Partial = Partial;
exports.Store = reactive_1.Reactive.Store;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMveGFuaWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdUNBQXFDO0FBQ3JDLDZCQUEyQjtBQUMzQixtQ0FBNkI7QUE2RnBCLHlCQUFFO0FBNUZYLHVDQUEyQztBQUUzQztJQUFBO0lBb0NBLENBQUM7SUFuQ1UsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztnQkFDYixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxDQUFDO2dCQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxtQkFBUSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2xELENBQUM7UUFDTCxDQUFDO1FBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBQ00sU0FBRyxHQUFWLFVBQVcsT0FBTyxFQUFFLElBQUk7UUFBRSxrQkFBVzthQUFYLFVBQVcsRUFBWCxxQkFBVyxFQUFYLElBQVc7WUFBWCxpQ0FBVzs7UUFDakMsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU5QyxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzlCLElBQUksR0FBRyxHQUFHLElBQUksbUJBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxjQUFj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QUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDbkUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUNMLGNBQUM7QUFBRCxDQUFDLEFBckNELENBQTZCLG1CQUFFLENBQUMsT0FBTyxHQXFDdEM7QUFyQ1ksMEJBQU87QUF1Q1QsUUFBQSxLQUFLLEdBQUcsbUJBQUUsQ0FBQyxLQUFLLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gXCIuL3RlbXBsYXRlXCJcclxuaW1wb3J0IHsgRG9tIH0gZnJvbSBcIi4vZG9tXCJcclxuaW1wb3J0IHsgZnMgfSBmcm9tIFwiLi9mc2hhcnBcIlxyXG5pbXBvcnQgeyBSZWFjdGl2ZSBhcyBSZSB9IGZyb20gXCIuL3JlYWN0aXZlXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBYYW5pYSB7XHJcbiAgICBzdGF0aWMgdGVtcGxhdGVzKGVsZW1lbnRzKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkID0gZWxlbWVudHNbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAoY2hpbGQuYWNjZXB0KVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBUZW1wbGF0ZS5UZXh0VGVtcGxhdGUoY2hpbGQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHRhZyhlbGVtZW50LCBhdHRyLCAuLi5jaGlsZHJlbik6IFRlbXBsYXRlLklOb2RlIHtcclxuICAgICAgICB2YXIgY2hpbGRUZW1wbGF0ZXMgPSB0aGlzLnRlbXBsYXRlcyhjaGlsZHJlbik7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICB2YXIgdGFnID0gbmV3IFRlbXBsYXRlLlRhZ1RlbXBsYXRlKGVsZW1lbnQsIG51bGwsIGNoaWxkVGVtcGxhdGVzKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhdHRyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvcCA9PT0gXCJjbGFzc05hbWVcIiB8fCBwcm9wID09PSBcImNsYXNzbmFtZVwiIHx8IHByb3AgPT09IFwiY2xhenpcIilcclxuICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihcImNsYXNzXCIsIGF0dHJbcHJvcF0pO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKHByb3AsIGF0dHJbcHJvcF0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICB2YXIgY29tcG9uZW50ID0gZWxlbWVudChhdHRyLCBjaGlsZFRlbXBsYXRlcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY29tcG9uZW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHN0YXRpYyB2aWV3KHRwbDogVGVtcGxhdGUuSU5vZGUsIGRpc3BhdGNoZXI/KSB7XHJcbiAgICAgICAgcmV0dXJuIERvbS52aWV3KHRwbCwgZGlzcGF0Y2hlcik7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gRm9yRWFjaChhdHRyLCBjaGlsZHJlbikge1xyXG4gICAgdmFyIHRwbCA9IG5ldyBUZW1wbGF0ZS5GcmFnbWVudFRlbXBsYXRlKGF0dHIuZXhwciB8fCBudWxsKTtcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdHBsLmNoaWxkKGNoaWxkcmVuW2ldKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHBsO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUGFydGlhbCBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBwYXJlbnQ7XHJcbiAgICBwcml2YXRlIGJpbmRpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhdHRyLCBwcml2YXRlIGNoaWxkcmVuKSB7XHJcbiAgICAgICAgc3VwZXIobnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRlbXBsYXRlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFjY2VwdCh2aXNpdG9yLCBvcHRpb25zOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBtYXAocGFyZW50KSB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XHJcbiAgICAgICAgaWYgKHRoaXMuYmluZGluZylcclxuICAgICAgICAgICAgdGhpcy5iaW5kaW5nLm1hcCh0aGlzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoXywgZG9tLCBpZHgpIHtcclxuICAgICAgICB0aGlzLnBhcmVudC5pbnNlcnQodGhpcywgZG9tLCBpZHgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHZpZXcgPSB0aGlzLmV2YWx1YXRlKHRoaXMuYXR0ci52aWV3KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYmluZGluZylcclxuICAgICAgICAgICAgdGhpcy5iaW5kaW5nLmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kaW5nID0gbmV3IERvbS5GcmFnbWVudEJpbmRpbmcodGhpcy5hdHRyLm1vZGVsLCBbdmlldy50ZW1wbGF0ZV0pXHJcbiAgICAgICAgICAgIC5tYXAodGhpcyk7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nLnVwZGF0ZShjb250ZXh0KTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBTdG9yZSA9IFJlLlN0b3JlO1xyXG5cclxuZXhwb3J0IHsgZnMgfVxyXG4iXX0=