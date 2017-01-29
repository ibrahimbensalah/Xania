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
            if (child.template)
                result.push(child.template);
            else
                result.push(new template_1.Template.TextTemplate(child));
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
            return dom_1.Dom.view(tag);
        }
        else if (typeof element === "function") {
            var component = new element(attr, childTemplates);
            return component;
        }
    };
    return Xania;
}());
exports.Xania = Xania;
var ForEach = (function () {
    function ForEach(attr, children) {
        this.attr = attr;
        this.children = children;
    }
    Object.defineProperty(ForEach.prototype, "template", {
        get: function () {
            var tpl = new template_1.Template.FragmentTemplate(this.attr.expr || null);
            for (var i = 0; i < this.children.length; i++) {
                tpl.child(this.children[i]);
            }
            return tpl;
        },
        enumerable: true,
        configurable: true
    });
    return ForEach;
}());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMveGFuaWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdUNBQXFDO0FBQ3JDLDZCQUEyQjtBQUMzQixtQ0FBNkI7QUE0RnBCLHlCQUFFO0FBM0ZYLHVDQUEyQztBQUUzQztJQUFBO0lBK0JBLENBQUM7SUE5QlUsZUFBUyxHQUFoQixVQUFpQixRQUFRO1FBQ3JCLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztnQkFDZixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoQyxJQUFJO2dCQUNBLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxtQkFBUSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFDTSxTQUFHLEdBQVYsVUFBVyxPQUFPLEVBQUUsSUFBSTtRQUFFLGtCQUFXO2FBQVgsVUFBVyxFQUFYLHFCQUFXLEVBQVgsSUFBVztZQUFYLGlDQUFXOztRQUNqQyxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTlDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDOUIsSUFBSSxHQUFHLEdBQUcsSUFBSSxtQkFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFD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QUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRTNCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxTQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ25FLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFDTCxjQUFDO0FBQUQsQ0FBQyxBQXJDRCxDQUE2QixtQkFBRSxDQUFDLE9BQU8sR0FxQ3RDO0FBckNZLDBCQUFPO0FBdUNULFFBQUEsS0FBSyxHQUFHLG1CQUFFLENBQUMsS0FBSyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tIFwiLi90ZW1wbGF0ZVwiXHJcbmltcG9ydCB7IERvbSB9IGZyb20gXCIuL2RvbVwiXHJcbmltcG9ydCB7IGZzIH0gZnJvbSBcIi4vZnNoYXJwXCJcclxuaW1wb3J0IHsgUmVhY3RpdmUgYXMgUmUgfSBmcm9tIFwiLi9yZWFjdGl2ZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgWGFuaWEge1xyXG4gICAgc3RhdGljIHRlbXBsYXRlcyhlbGVtZW50cykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGVsZW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBpZiAoY2hpbGQudGVtcGxhdGUpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChjaGlsZC50ZW1wbGF0ZSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBUZW1wbGF0ZS5UZXh0VGVtcGxhdGUoY2hpbGQpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyB0YWcoZWxlbWVudCwgYXR0ciwgLi4uY2hpbGRyZW4pOiBEb20uSVZpZXcge1xyXG4gICAgICAgIHZhciBjaGlsZFRlbXBsYXRlcyA9IHRoaXMudGVtcGxhdGVzKGNoaWxkcmVuKTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgVGVtcGxhdGUuVGFnVGVtcGxhdGUoZWxlbWVudCwgbnVsbCwgY2hpbGRUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGF0dHIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wID09PSBcImNsYXNzTmFtZVwiIHx8IHByb3AgPT09IFwiY2xhc3NuYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGF6elwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgYXR0cltwcm9wXSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIocHJvcCwgYXR0cltwcm9wXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBEb20udmlldyh0YWcpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICB2YXIgY29tcG9uZW50ID0gbmV3IGVsZW1lbnQoYXR0ciwgY2hpbGRUZW1wbGF0ZXMpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRm9yRWFjaCB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGF0dHIsIHByaXZhdGUgY2hpbGRyZW4pIHsgfVxyXG5cclxuICAgIGdldCB0ZW1wbGF0ZSgpIHtcclxuICAgICAgICB2YXIgdHBsID0gbmV3IFRlbXBsYXRlLkZyYWdtZW50VGVtcGxhdGUodGhpcy5hdHRyLmV4cHIgfHwgbnVsbCk7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0cGwuY2hpbGQodGhpcy5jaGlsZHJlbltpXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdHBsO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUGFydGlhbCBleHRlbmRzIFJlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBwYXJlbnQ7XHJcbiAgICBwcml2YXRlIGJpbmRpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhdHRyLCBwcml2YXRlIGNoaWxkcmVuKSB7XHJcbiAgICAgICAgc3VwZXIobnVsbCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHRlbXBsYXRlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGFjY2VwdCh2aXNpdG9yLCBvcHRpb25zOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBtYXAocGFyZW50KSB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XHJcbiAgICAgICAgaWYgKHRoaXMuYmluZGluZylcclxuICAgICAgICAgICAgdGhpcy5iaW5kaW5nLm1hcCh0aGlzKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnQoXywgZG9tLCBpZHgpIHtcclxuICAgICAgICB0aGlzLnBhcmVudC5pbnNlcnQodGhpcywgZG9tLCBpZHgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcihjb250ZXh0KSB7XHJcbiAgICAgICAgdmFyIHZpZXcgPSB0aGlzLmV2YWx1YXRlKHRoaXMuYXR0ci52aWV3KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYmluZGluZylcclxuICAgICAgICAgICAgdGhpcy5iaW5kaW5nLmRpc3Bvc2UoKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kaW5nID0gbmV3IERvbS5GcmFnbWVudEJpbmRpbmcodGhpcy5hdHRyLm1vZGVsLCBbdmlldy50ZW1wbGF0ZV0pXHJcbiAgICAgICAgICAgIC5tYXAodGhpcyk7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nLnVwZGF0ZShjb250ZXh0KTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBTdG9yZSA9IFJlLlN0b3JlO1xyXG5cclxuZXhwb3J0IHsgZnMgfVxyXG4iXX0=