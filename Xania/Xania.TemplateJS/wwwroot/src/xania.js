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
exports.parseTpl = fsharp_1.parseTpl;
var reactive_1 = require("./reactive");
exports.Reactive = reactive_1.Reactive;
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
            var ns = Xania.svgElements.indexOf(element) >= 0 ? "http://www.w3.org/2000/svg" : null;
            var tag = new template_1.Template.TagTemplate(element, ns, childTemplates);
            for (var prop in attr) {
                if (prop === "className" || prop === "classname" || prop === "clazz")
                    tag.attr("class", attr[prop]);
                else
                    tag.attr(prop, attr[prop]);
            }
            return tag;
        }
        else if (typeof element === "function") {
            return element(attr, childTemplates);
        }
    };
    Xania.view = function (tpl, dispatcher) {
        return dom_1.Dom.view(tpl, dispatcher);
    };
    return Xania;
}());
Xania.svgElements = ["svg", "circle", "line", "g"];
exports.Xania = Xania;
function ForEach(attr, children) {
    var tpl = new template_1.Template.FragmentTemplate(attr.expr || null);
    for (var i = 0; i < children.length; i++) {
        tpl.child(children[i]);
    }
    return tpl;
}
exports.ForEach = ForEach;
var View;
(function (View) {
    function partial(view, model) {
        return {
            accept: function () {
                var binding = new PartialBinding(view, model);
                if (view.subscribe)
                    view.subscribe(binding);
                if (model.subscribe)
                    model.subscribe(binding);
                return binding;
            }
        };
    }
    View.partial = partial;
})(View = exports.View || (exports.View = {}));
var PartialBinding = (function (_super) {
    __extends(PartialBinding, _super);
    function PartialBinding(view, model) {
        var _this = _super.call(this) || this;
        _this.view = view;
        _this.model = model;
        _this.cache = [];
        return _this;
    }
    PartialBinding.prototype.map = function (parent) {
        this.parent = parent;
        if (this.binding)
            this.binding.map(this);
        return this;
    };
    PartialBinding.prototype.render = function (context) {
        var view = this.evaluate(this.view).valueOf();
        if (this.binding) {
            this.binding.dispose();
        }
        this.binding = new dom_1.Dom.FragmentBinding(this.model, [view])
            .map(this.parent);
        this.binding.update(context);
    };
    PartialBinding.prototype.onNext = function (_) {
        this.execute();
    };
    return PartialBinding;
}(reactive_1.Reactive.Binding));
exports.PartialBinding = PartialBinding;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMveGFuaWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdUNBQXFDO0FBQ3JDLDZCQUEyQjtBQUMzQixtQ0FBdUM7QUFrRzlCLHlCQUFFO0FBQUUscUNBQVE7QUFqR3JCLHVDQUFxQztBQWlHZCx1Q0FBUTtBQS9GL0I7SUFBQTtJQXFDQSxDQUFDO0lBcENVLGVBQVMsR0FBaEIsVUFBaUIsUUFBUTtRQUNyQixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdkMsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXhCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7Z0JBQ2IsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsQ0FBQztnQkFDRixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNsRCxDQUFDO1FBQ0wsQ0FBQztRQUNELE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUdNLFNBQUcsR0FBVixVQUFXLE9BQU8sRUFBRSxJQUFJO1FBQUUsa0JBQVc7YUFBWCxVQUFXLEVBQVgscUJBQVcsRUFBWCxJQUFXO1lBQVgsaUNBQVc7O1FBQ2pDLElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFOUMsRUFBRSxDQUFDLENBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM5QixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQU8s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QUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ2IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsK0JBQU0sR0FBTixVQUFPLE9BQU87UUFDVixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU5QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxTQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNyRCxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRCwrQkFBTSxHQUFOLFVBQU8sQ0FBQztRQUNKLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBQ0wscUJBQUM7QUFBRCxDQUFDLEFBOUJELENBQW9DLG1CQUFRLENBQUMsT0FBTyxHQThCbkQ7QUE5Qlksd0NBQWMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gXCIuL3RlbXBsYXRlXCJcclxuaW1wb3J0IHsgRG9tIH0gZnJvbSBcIi4vZG9tXCJcclxuaW1wb3J0IHsgZnMsIHBhcnNlVHBsIH0gZnJvbSBcIi4vZnNoYXJwXCJcclxuaW1wb3J0IHsgUmVhY3RpdmUgfSBmcm9tIFwiLi9yZWFjdGl2ZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgWGFuaWEge1xyXG4gICAgc3RhdGljIHRlbXBsYXRlcyhlbGVtZW50cykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGVsZW1lbnRzW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoaWxkLmFjY2VwdClcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKGNoaWxkKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBzdmdFbGVtZW50cyA9IFtcInN2Z1wiLCBcImNpcmNsZVwiLCBcImxpbmVcIiwgXCJnXCJdO1xyXG5cclxuICAgIHN0YXRpYyB0YWcoZWxlbWVudCwgYXR0ciwgLi4uY2hpbGRyZW4pOiBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdmFyIG5zID0gWGFuaWEuc3ZnRWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA+PSAwID8gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIDogbnVsbDtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUZW1wbGF0ZS5UYWdUZW1wbGF0ZShlbGVtZW50LCBucywgY2hpbGRUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGF0dHIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wID09PSBcImNsYXNzTmFtZVwiIHx8IHByb3AgPT09IFwiY2xhc3NuYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGF6elwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgYXR0cltwcm9wXSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIocHJvcCwgYXR0cltwcm9wXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50KGF0dHIsIGNoaWxkVGVtcGxhdGVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBzdGF0aWMgdmlldyh0cGw6IFRlbXBsYXRlLklOb2RlLCBkaXNwYXRjaGVyPykge1xyXG4gICAgICAgIHJldHVybiBEb20udmlldyh0cGwsIGRpc3BhdGNoZXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEZvckVhY2goYXR0ciwgY2hpbGRyZW4pIHtcclxuICAgIHZhciB0cGwgPSBuZXcgVGVtcGxhdGUuRnJhZ21lbnRUZW1wbGF0ZShhdHRyLmV4cHIgfHwgbnVsbCk7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRwbC5jaGlsZChjaGlsZHJlbltpXSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRwbDtcclxufVxyXG5cclxuZXhwb3J0IG1vZHVsZSBWaWV3IHtcclxuICAgIGV4cG9ydCBmdW5jdGlvbiBwYXJ0aWFsKHZpZXcsIG1vZGVsKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgYWNjZXB0KCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgUGFydGlhbEJpbmRpbmcodmlldywgbW9kZWwpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZpZXcuc3Vic2NyaWJlKSB2aWV3LnN1YnNjcmliZShiaW5kaW5nKTtcclxuICAgICAgICAgICAgICAgIGlmIChtb2RlbC5zdWJzY3JpYmUpIG1vZGVsLnN1YnNjcmliZShiaW5kaW5nKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBiaW5kaW5nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUGFydGlhbEJpbmRpbmcgZXh0ZW5kcyBSZWFjdGl2ZS5CaW5kaW5nIHtcclxuICAgIHByaXZhdGUgcGFyZW50O1xyXG4gICAgcHJpdmF0ZSBiaW5kaW5nO1xyXG4gICAgcHJpdmF0ZSBjYWNoZSA9IFtdO1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB2aWV3LCBwcml2YXRlIG1vZGVsKSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBtYXAocGFyZW50KSB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XHJcbiAgICAgICAgaWYgKHRoaXMuYmluZGluZylcclxuICAgICAgICAgICAgdGhpcy5iaW5kaW5nLm1hcCh0aGlzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoY29udGV4dCkge1xyXG4gICAgICAgIHZhciB2aWV3ID0gdGhpcy5ldmFsdWF0ZSh0aGlzLnZpZXcpLnZhbHVlT2YoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYmluZGluZykge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmRpbmcuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5iaW5kaW5nID0gbmV3IERvbS5GcmFnbWVudEJpbmRpbmcodGhpcy5tb2RlbCwgW3ZpZXddKVxyXG4gICAgICAgICAgICAubWFwKHRoaXMucGFyZW50KTtcclxuICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlKGNvbnRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uTmV4dChfKSB7XHJcbiAgICAgICAgdGhpcy5leGVjdXRlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IGZzLCBwYXJzZVRwbCwgUmVhY3RpdmUgfVxyXG4iXX0=