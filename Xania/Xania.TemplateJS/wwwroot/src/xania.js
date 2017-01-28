"use strict";
var template_1 = require("./template");
var dom_1 = require("./dom");
var fsharp_1 = require("./fsharp");
exports.fs = fsharp_1.fsharp;
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
var Store = reactive_1.Reactive.Store;
exports.Store = Store;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGFuaWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMveGFuaWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHVDQUFxQztBQUNyQyw2QkFBMkI7QUFDM0IsbUNBQXVDO0FBcURkLDZCQUFFO0FBcEQzQix1Q0FBcUM7QUFFckM7SUFBQTtJQStCQSxDQUFDO0lBOUJVLGVBQVMsR0FBaEIsVUFBaUIsUUFBUTtRQUNyQixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdkMsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7Z0JBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsSUFBSTtnQkFDQSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQVEsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBQ00sU0FBRyxHQUFWLFVBQVcsT0FBTyxFQUFFLElBQUk7UUFBRSxrQkFBVzthQUFYLFVBQVcsRUFBWCxxQkFBVyxFQUFYLElBQVc7WUFBWCxpQ0FBVzs7UUFDakMsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU5QyxFQUFFLENBQUMsQ0FBQyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzlCLElBQUksR0FBRyxHQUFHLElBQUksbUJBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNsRSxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixFQUFFLENBQUMsQ0FBQyxJQUFJLEtBQUssV0FBVyxJQUFJLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxLQUFLLE9BQU8sQ0FBQztvQkFDakUsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLElBQUk7b0JBQ0EsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUVELE1BQU0sQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxPQUFPLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztZQUN2QyxJQUFJLFNBQVMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFbEQsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUNyQixDQUFDO0lBQ0wsQ0FBQztJQUNMLFlBQUM7QUFBRCxDQUFDLEFBL0JELElBK0JDO0FBbUJRLHNCQUFLO0FBaEJkO0lBQ0ksaUJBQW9CLElBQUksRUFBVSxRQUFRO1FBQXRCLFNBQUksR0FBSixJQUFJLENBQUE7UUFBVSxhQUFRLEdBQVIsUUFBUSxDQUFBO0lBQUksQ0FBQztJQUUvQyxzQkFBSSw2QkFBUTthQUFaO1lBQ0ksSUFBSSxHQUFHLEdBQUcsSUFBSSxtQkFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDO1lBRWhFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDNUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsQ0FBQztZQUVELE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDZixDQUFDOzs7T0FBQTtJQUNMLGNBQUM7QUFBRCxDQUFDLEFBWkQsSUFZQztBQUllLDBCQUFPO0FBRnZCLElBQUksS0FBSyxHQUFHLG1CQUFRLENBQUMsS0FBSyxDQUFDO0FBRUUsc0JBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZW1wbGF0ZSB9IGZyb20gXCIuL3RlbXBsYXRlXCJcclxuaW1wb3J0IHsgRG9tIH0gZnJvbSBcIi4vZG9tXCJcclxuaW1wb3J0IHsgZnNoYXJwIGFzIGZzIH0gZnJvbSBcIi4vZnNoYXJwXCJcclxuaW1wb3J0IHsgUmVhY3RpdmUgfSBmcm9tIFwiLi9yZWFjdGl2ZVwiXHJcblxyXG5jbGFzcyBYYW5pYSB7XHJcbiAgICBzdGF0aWMgdGVtcGxhdGVzKGVsZW1lbnRzKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkID0gZWxlbWVudHNbaV07XHJcbiAgICAgICAgICAgIGlmIChjaGlsZC50ZW1wbGF0ZSlcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNoaWxkLnRlbXBsYXRlKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IFRlbXBsYXRlLlRleHRUZW1wbGF0ZShjaGlsZCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgc3RhdGljIHRhZyhlbGVtZW50LCBhdHRyLCAuLi5jaGlsZHJlbik6IERvbS5JVmlldyB7XHJcbiAgICAgICAgdmFyIGNoaWxkVGVtcGxhdGVzID0gdGhpcy50ZW1wbGF0ZXMoY2hpbGRyZW4pO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGVsZW1lbnQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBUZW1wbGF0ZS5UYWdUZW1wbGF0ZShlbGVtZW50LCBudWxsLCBjaGlsZFRlbXBsYXRlcyk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gYXR0cikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHByb3AgPT09IFwiY2xhc3NOYW1lXCIgfHwgcHJvcCA9PT0gXCJjbGFzc25hbWVcIiB8fCBwcm9wID09PSBcImNsYXp6XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgdGFnLmF0dHIoXCJjbGFzc1wiLCBhdHRyW3Byb3BdKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB0YWcuYXR0cihwcm9wLCBhdHRyW3Byb3BdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIERvbS52aWV3KHRhZyk7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgIHZhciBjb21wb25lbnQgPSBuZXcgZWxlbWVudChhdHRyLCBjaGlsZFRlbXBsYXRlcyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gY29tcG9uZW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbmNsYXNzIEZvckVhY2gge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhdHRyLCBwcml2YXRlIGNoaWxkcmVuKSB7IH1cclxuXHJcbiAgICBnZXQgdGVtcGxhdGUoKSB7XHJcbiAgICAgICAgdmFyIHRwbCA9IG5ldyBUZW1wbGF0ZS5GcmFnbWVudFRlbXBsYXRlKHRoaXMuYXR0ci5leHByIHx8IG51bGwpO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdHBsLmNoaWxkKHRoaXMuY2hpbGRyZW5baV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRwbDtcclxuICAgIH1cclxufVxyXG5cclxudmFyIFN0b3JlID0gUmVhY3RpdmUuU3RvcmU7XHJcblxyXG5leHBvcnQgeyBYYW5pYSwgRm9yRWFjaCwgZnMsIFN0b3JlIH1cclxuIl19