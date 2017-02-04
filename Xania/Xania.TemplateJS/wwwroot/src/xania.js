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
        if (element instanceof template_1.Template.TagTemplate) {
            return element;
        }
        else if (typeof element === "string") {
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
            if (element.accept) {
                return element(attr, childTemplates);
            }
            else if (element.prototype.render) {
                return new ComponentBinding(Reflect.construct(element, []), attr);
            }
            else {
                return element(attr, childTemplates);
            }
        }
        else if (typeof element.render === "function") {
            var tpl = element.render();
            return View.partial(tpl, new reactive_1.Reactive.Store(element));
        }
        else {
            throw Error("tag unresolved");
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
var ComponentBinding = (function (_super) {
    __extends(ComponentBinding, _super);
    function ComponentBinding(component, props) {
        var _this = _super.call(this) || this;
        _this.component = component;
        _this.props = props;
        _this.store = new reactive_1.Reactive.Store(_this.component);
        _this.binding = new dom_1.Dom.FragmentBinding(null, [component.render()]);
        return _this;
    }
    ComponentBinding.prototype.accept = function () {
        return this;
    };
    ComponentBinding.prototype.map = function (parent) {
        this.binding.map(parent);
        return this;
    };
    ComponentBinding.prototype.update = function (context) {
        var props = this.props;
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                var expr = props[prop];
                var value = expr.execute(this, context).valueOf();
                this.component[prop] = value;
            }
        }
        this.binding.update(this.store);
        _super.prototype.update.call(this, context);
        return this;
    };
    ComponentBinding.prototype.render = function () {
    };
    ComponentBinding.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this.binding.dispose();
    };
    return ComponentBinding;
}(reactive_1.Reactive.Binding));
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
        var newBinding = new dom_1.Dom.FragmentBinding(this.model, [view])
            .map(this.parent);
        this.binding = newBinding;
        this.binding.update(context);
    };
    PartialBinding.prototype.onNext = function (_) {
        this.execute();
    };
    return PartialBinding;
}(reactive_1.Reactive.Binding));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMveGFuaWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsdUNBQXFDO0FBQ3JDLDZCQUEyQjtBQUMzQixtQ0FBNkI7QUEwSnBCLHlCQUFFO0FBekpYLHVDQUFxQztBQXlKeEIsdUNBQVE7QUF2SnJCO0lBQUE7SUFrREEsQ0FBQztJQWpEVSxlQUFTLEdBQWhCLFVBQWlCLFFBQVE7UUFDckIsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3ZDLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4QixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLENBQUM7Z0JBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLG1CQUFRLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDbEQsQ0FBQztRQUNMLENBQUM7UUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFHTSxTQUFHLEdBQVYsVUFBVyxPQUFPLEVBQUUsSUFBSTtRQUFFLGtCQUFXO2FBQVgsVUFBVyxFQUFYLHFCQUFXLEVBQVgsSUFBVztZQUFYLGlDQUFXOztRQUNqQyxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTlDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sWUFBWSxtQkFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUNuQixDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLDRCQUE0QixHQUFHLElBQUksQ0FBQztZQUN2RixJQUFJLEdBQUcsR0FBRyxJQUFJLG1CQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDaEUsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDcEIsRUFBRSxDQUFDLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxJQUFJLEtBQUssV0FBVyxJQUFJLElBQUksS0FBSyxPQUFPLENBQUM7b0JBQ2pFLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxJQUFJO29CQUNBLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7WUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDO1FBQ2YsQ0FBQztRQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNqQixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDbEMsTUFBTSxDQUFDLElBQUksZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEUsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3pDLENBQUM7UUFDTCxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sT0FBTyxDQUFDLE1BQU0sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzlDLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxtQkFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLE1BQU0sS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDbEMsQ0FBQztJQUNMLENBQUM7SUFDTSxVQUFJLEdBQVgsVUFBWSxHQUFtQixFQUFFLFVBQVc7UUFDeEMsTUFBTSxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFDTCxZQUFDO0FBQUQsQ0FBQyxBQWxERDtBQWNXLGlCQUFXLEdBQUcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztBQWQzQyxzQkFBSztBQW9EbEIsaUJBQXdCLElBQUksRUFBRSxRQUFRO0lBQ2xDLElBQUksR0FBRyxHQUFHLElBQUksbUJBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDO0lBRTNELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3ZDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLENBQUM7QUFDZixDQUFDO0FBUkQsMEJBUUM7QUFFRCxJQUFjLElBQUksQ0FXakI7QUFYRCxXQUFjLElBQUk7SUFDZCxpQkFBd0IsSUFBSSxFQUFFLEtBQUs7UUFDL0IsTUFBTSxDQUFDO1lBQ0gsTUFBTTtnQkFDRixJQUFJLE9BQU8sR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzlDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDNUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztvQkFBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ25CLENBQUM7U0FDSixDQUFBO0lBQ0wsQ0FBQztJQVRlLFlBQU8sVUFTdEIsQ0FBQTtBQUNMLENBQUMsRUFYYSxJQUFJLEdBQUosWUFBSSxLQUFKLFlBQUksUUFXakI7QUFFRDtJQUErQixvQ0FBZ0I7SUFJM0MsMEJBQW9CLFNBQVMsRUFBVSxLQUFLO1FBQTVDLFlBQ0ksaUJBQU8sU0FFVjtRQUhtQixlQUFTLEdBQVQsU0FBUyxDQUFBO1FBQVUsV0FBSyxHQUFMLEtBQUssQ0FBQTtRQUZwQyxXQUFLLEdBQUcsSUFBSSxtQkFBUSxDQUFDLEtBQUssQ0FBQyxLQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFJL0MsS0FBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLFNBQUcsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQzs7SUFDdkUsQ0FBQztJQUVELGlDQUFNLEdBQU47UUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFRCw4QkFBRyxHQUFILFVBQUksTUFBTTtRQUNOLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVELGlDQUFNLEdBQU4sVUFBTyxPQUFPO1FBQ1YsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUN2QixHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUNqQyxDQUFDO1FBQ0wsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxpQkFBTSxNQUFNLFlBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsaUNBQU0sR0FBTjtJQUNBLENBQUM7SUFFRCxrQ0FBTyxHQUFQO1FBQ0ksaUJBQU0sT0FBTyxXQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUwsdUJBQUM7QUFBRCxDQUFDLEFBeENELENBQStCLG1CQUFRLENBQUMsT0FBTyxHQXdDOUM7QUFFRDtJQUE2QixrQ0FBZ0I7SUFJekMsd0JBQW9CLElBQUksRUFBVSxLQUFLO1FBQXZDLFlBQ0ksaUJBQU8sU0FDVjtRQUZtQixVQUFJLEdBQUosSUFBSSxDQUFBO1FBQVUsV0FBSyxHQUFMLEtBQUssQ0FBQTtRQUQvQixXQUFLLEdBQUcsRUFBRSxDQUFDOztJQUduQixDQUFDO0lBRUQsNEJBQUcsR0FBSCxVQUFJLE1BQU07UUFDTixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ2IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsK0JBQU0sR0FBTixVQUFPLE9BQU87UUFDVixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU5QyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQUksVUFBVSxHQUFHLElBQUksU0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdkQsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV0QixJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQztRQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQsK0JBQU0sR0FBTixVQUFPLENBQUM7UUFDSixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUNMLHFCQUFDO0FBQUQsQ0FBQyxBQWhDRCxDQUE2QixtQkFBUSxDQUFDLE9BQU8sR0FnQzVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tIFwiLi90ZW1wbGF0ZVwiXHJcbmltcG9ydCB7IERvbSB9IGZyb20gXCIuL2RvbVwiXHJcbmltcG9ydCB7IGZzIH0gZnJvbSBcIi4vZnNoYXJwXCJcclxuaW1wb3J0IHsgUmVhY3RpdmUgfSBmcm9tIFwiLi9yZWFjdGl2ZVwiXHJcblxyXG5leHBvcnQgY2xhc3MgWGFuaWEge1xyXG4gICAgc3RhdGljIHRlbXBsYXRlcyhlbGVtZW50cykge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGVsZW1lbnRzW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNoaWxkLmFjY2VwdClcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKGNoaWxkKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuICAgIHN0YXRpYyBzdmdFbGVtZW50cyA9IFtcInN2Z1wiLCBcImNpcmNsZVwiLCBcImxpbmVcIiwgXCJnXCJdO1xyXG5cclxuICAgIHN0YXRpYyB0YWcoZWxlbWVudCwgYXR0ciwgLi4uY2hpbGRyZW4pOiBUZW1wbGF0ZS5JTm9kZSB7XHJcbiAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFRlbXBsYXRlLlRhZ1RlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdmFyIG5zID0gWGFuaWEuc3ZnRWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSA+PSAwID8gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIDogbnVsbDtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUZW1wbGF0ZS5UYWdUZW1wbGF0ZShlbGVtZW50LCBucywgY2hpbGRUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGF0dHIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChwcm9wID09PSBcImNsYXNzTmFtZVwiIHx8IHByb3AgPT09IFwiY2xhc3NuYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGF6elwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHRhZy5hdHRyKFwiY2xhc3NcIiwgYXR0cltwcm9wXSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIocHJvcCwgYXR0cltwcm9wXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWc7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LmFjY2VwdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQoYXR0ciwgY2hpbGRUZW1wbGF0ZXMpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQucHJvdG90eXBlLnJlbmRlcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRCaW5kaW5nKFJlZmxlY3QuY29uc3RydWN0KGVsZW1lbnQsIFtdKSwgYXR0cik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudChhdHRyLCBjaGlsZFRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50LnJlbmRlciA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIHZhciB0cGwgPSBlbGVtZW50LnJlbmRlcigpO1xyXG4gICAgICAgICAgICByZXR1cm4gVmlldy5wYXJ0aWFsKHRwbCwgbmV3IFJlYWN0aXZlLlN0b3JlKGVsZW1lbnQpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcInRhZyB1bnJlc29sdmVkXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHN0YXRpYyB2aWV3KHRwbDogVGVtcGxhdGUuSU5vZGUsIGRpc3BhdGNoZXI/KSB7XHJcbiAgICAgICAgcmV0dXJuIERvbS52aWV3KHRwbCwgZGlzcGF0Y2hlcik7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBGb3JFYWNoKGF0dHIsIGNoaWxkcmVuKSB7XHJcbiAgICB2YXIgdHBsID0gbmV3IFRlbXBsYXRlLkZyYWdtZW50VGVtcGxhdGUoYXR0ci5leHByIHx8IG51bGwpO1xyXG5cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB0cGwuY2hpbGQoY2hpbGRyZW5baV0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cGw7XHJcbn1cclxuXHJcbmV4cG9ydCBtb2R1bGUgVmlldyB7XHJcbiAgICBleHBvcnQgZnVuY3Rpb24gcGFydGlhbCh2aWV3LCBtb2RlbCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGFjY2VwdCgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBiaW5kaW5nID0gbmV3IFBhcnRpYWxCaW5kaW5nKHZpZXcsIG1vZGVsKTtcclxuICAgICAgICAgICAgICAgIGlmICh2aWV3LnN1YnNjcmliZSkgdmlldy5zdWJzY3JpYmUoYmluZGluZyk7XHJcbiAgICAgICAgICAgICAgICBpZiAobW9kZWwuc3Vic2NyaWJlKSBtb2RlbC5zdWJzY3JpYmUoYmluZGluZyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYmluZGluZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgQ29tcG9uZW50QmluZGluZyBleHRlbmRzIFJlYWN0aXZlLkJpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBiaW5kaW5nOiBEb20uRnJhZ21lbnRCaW5kaW5nO1xyXG4gICAgcHJpdmF0ZSBzdG9yZSA9IG5ldyBSZWFjdGl2ZS5TdG9yZSh0aGlzLmNvbXBvbmVudCk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBjb21wb25lbnQsIHByaXZhdGUgcHJvcHMpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYmluZGluZyA9IG5ldyBEb20uRnJhZ21lbnRCaW5kaW5nKG51bGwsIFtjb21wb25lbnQucmVuZGVyKCldKTtcclxuICAgIH1cclxuXHJcbiAgICBhY2NlcHQoKTogdGhpcyB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgbWFwKHBhcmVudCk6IHRoaXMge1xyXG4gICAgICAgIHRoaXMuYmluZGluZy5tYXAocGFyZW50KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoY29udGV4dCk6IHRoaXMge1xyXG4gICAgICAgIGxldCBwcm9wcyA9IHRoaXMucHJvcHM7XHJcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBwcm9wcykge1xyXG4gICAgICAgICAgICBpZiAocHJvcHMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBleHByID0gcHJvcHNbcHJvcF07XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBleHByLmV4ZWN1dGUodGhpcywgY29udGV4dCkudmFsdWVPZigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRbcHJvcF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlKHRoaXMuc3RvcmUpO1xyXG4gICAgICAgIHN1cGVyLnVwZGF0ZShjb250ZXh0KTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgICAgICAgdGhpcy5iaW5kaW5nLmRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmNsYXNzIFBhcnRpYWxCaW5kaW5nIGV4dGVuZHMgUmVhY3RpdmUuQmluZGluZyB7XHJcbiAgICBwcml2YXRlIHBhcmVudDtcclxuICAgIHByaXZhdGUgYmluZGluZztcclxuICAgIHByaXZhdGUgY2FjaGUgPSBbXTtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdmlldywgcHJpdmF0ZSBtb2RlbCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgbWFwKHBhcmVudCkge1xyXG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xyXG4gICAgICAgIGlmICh0aGlzLmJpbmRpbmcpXHJcbiAgICAgICAgICAgIHRoaXMuYmluZGluZy5tYXAodGhpcyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgdmlldyA9IHRoaXMuZXZhbHVhdGUodGhpcy52aWV3KS52YWx1ZU9mKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJpbmRpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5iaW5kaW5nLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBuZXdCaW5kaW5nID0gbmV3IERvbS5GcmFnbWVudEJpbmRpbmcodGhpcy5tb2RlbCwgW3ZpZXddKVxyXG4gICAgICAgICAgICAubWFwKHRoaXMucGFyZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kaW5nID0gbmV3QmluZGluZztcclxuICAgICAgICB0aGlzLmJpbmRpbmcudXBkYXRlKGNvbnRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uTmV4dChfKSB7XHJcbiAgICAgICAgdGhpcy5leGVjdXRlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7IGZzLCBSZWFjdGl2ZSB9XHJcbiJdfQ==