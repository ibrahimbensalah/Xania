"use strict";
var Template;
(function (Template) {
    var TextTemplate = (function () {
        function TextTemplate(parts) {
            this.parts = parts;
        }
        TextTemplate.prototype.accept = function (visitor, options) {
            return visitor.text(this.parts, options);
        };
        return TextTemplate;
    }());
    Template.TextTemplate = TextTemplate;
    var ContentTemplate = (function () {
        function ContentTemplate(expr) {
            this.expr = expr;
            this.children = [];
        }
        ContentTemplate.prototype.child = function (child) {
            this.children.push(child);
            return this;
        };
        ContentTemplate.prototype.accept = function (visitor, options) {
            return visitor.content(this.expr, this.children, options);
        };
        return ContentTemplate;
    }());
    Template.ContentTemplate = ContentTemplate;
    var TagTemplate = (function () {
        function TagTemplate(name, ns) {
            this.name = name;
            this.ns = ns;
            this.attributes = [];
            this.events = new Map();
            this._children = [];
        }
        TagTemplate.prototype.children = function () {
            return this._children;
        };
        TagTemplate.prototype.attr = function (name, expr) {
            return this.addAttribute(name, expr);
        };
        TagTemplate.prototype.addAttribute = function (name, expr) {
            var attr = this.getAttribute(name);
            if (!attr)
                this.attributes.push({ name: name.toLowerCase(), tpl: expr });
            return this;
        };
        TagTemplate.prototype.getAttribute = function (name) {
            var key = name.toLowerCase();
            for (var i = 0; i < this.attributes.length; i++) {
                var attr = this.attributes[i];
                if (attr.name === key)
                    return attr;
            }
            return undefined;
        };
        TagTemplate.prototype.addEvent = function (name, callback) {
            this.events.set(name, callback);
        };
        TagTemplate.prototype.addChild = function (child) {
            this._children.push(child);
            return this;
        };
        TagTemplate.prototype.select = function (modelAccessor) {
            this.modelAccessor = modelAccessor;
            return this;
        };
        TagTemplate.prototype.accept = function (visitor, options) {
            var tag = visitor.tag(this.name, this.ns, this.attributes, options);
            this._children.forEach(function (x) { return x.accept(tag); });
            return tag;
        };
        return TagTemplate;
    }());
    Template.TagTemplate = TagTemplate;
})(Template = exports.Template || (exports.Template = {}));
exports.t = Template;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLElBQWMsUUFBUSxDQTRGckI7QUE1RkQsV0FBYyxRQUFRO0lBWWxCO1FBQ0ksc0JBQW9CLEtBQXNCO1lBQXRCLFVBQUssR0FBTCxLQUFLLENBQWlCO1FBQzFDLENBQUM7UUFFRCw2QkFBTSxHQUFOLFVBQVUsT0FBb0IsRUFBRSxPQUFZO1lBQ3hDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUNMLG1CQUFDO0lBQUQsQ0FBQyxBQVBELElBT0M7SUFQWSxxQkFBWSxlQU94QixDQUFBO0lBRUQ7UUFHSSx5QkFBb0IsSUFBSTtZQUFKLFNBQUksR0FBSixJQUFJLENBQUE7WUFGaEIsYUFBUSxHQUFZLEVBQUUsQ0FBQztRQUVILENBQUM7UUFFN0IsK0JBQUssR0FBTCxVQUFNLEtBQVk7WUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxnQ0FBTSxHQUFOLFVBQVUsT0FBb0IsRUFBRSxPQUFZO1lBQ3hDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ0wsc0JBQUM7SUFBRCxDQUFDLEFBYkQsSUFhQztJQWJZLHdCQUFlLGtCQWEzQixDQUFBO0lBRUQ7UUFPSSxxQkFBbUIsSUFBWSxFQUFVLEVBQVU7WUFBaEMsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUFVLE9BQUUsR0FBRixFQUFFLENBQVE7WUFOM0MsZUFBVSxHQUE0QixFQUFFLENBQUM7WUFDekMsV0FBTSxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7WUFFaEMsY0FBUyxHQUFZLEVBQUUsQ0FBQztRQUloQyxDQUFDO1FBRU0sOEJBQVEsR0FBZjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQzFCLENBQUM7UUFFTSwwQkFBSSxHQUFYLFVBQVksSUFBWSxFQUFFLElBQVM7WUFDL0IsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTSxrQ0FBWSxHQUFuQixVQUFvQixJQUFZLEVBQUUsSUFBUztZQUN2QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNOLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFTSxrQ0FBWSxHQUFuQixVQUFvQixJQUFZO1lBQzVCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO29CQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxNQUFNLENBQUMsU0FBUyxDQUFDO1FBQ3JCLENBQUM7UUFFTSw4QkFBUSxHQUFmLFVBQWdCLElBQUksRUFBRSxRQUFRO1lBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRU0sOEJBQVEsR0FBZixVQUFnQixLQUFZO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVNLDRCQUFNLEdBQWIsVUFBYyxhQUFhO1lBQ3ZCLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELDRCQUFNLEdBQU4sVUFBVSxPQUFvQixFQUFFLE9BQVk7WUFDeEMsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQWdCLENBQUM7WUFDbkYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFiLENBQWEsQ0FBQyxDQUFDO1lBRTNDLE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDZixDQUFDO1FBQ0wsa0JBQUM7SUFBRCxDQUFDLEFBdkRELElBdURDO0lBdkRZLG9CQUFXLGNBdUR2QixDQUFBO0FBQ0wsQ0FBQyxFQTVGYSxRQUFRLEdBQVIsZ0JBQVEsS0FBUixnQkFBUSxRQTRGckI7QUFHZSxxQkFBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tIFwiLi9jb3JlXCJcclxuXHJcbmV4cG9ydCBtb2R1bGUgVGVtcGxhdGUge1xyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpc2l0b3I8VD4ge1xyXG4gICAgICAgIHRleHQoZXhwciwgb3B0aW9uczogYW55KTogVDtcclxuICAgICAgICBjb250ZW50KGV4cHIsIGNoaWxkcmVuOiBJTm9kZVtdLCBvcHRpb25zPzogYW55KTogVDtcclxuICAgICAgICB0YWcobmFtZSwgbnMsIGF0dHJzLCBvcHRpb25zPzogYW55KTogSVZpc2l0b3I8VD47XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTm9kZSB7XHJcbiAgICAgICAgYWNjZXB0PFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+LCBvcHRpb25zPzogYW55KTogVDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGV4dFRlbXBsYXRlIGltcGxlbWVudHMgSU5vZGUge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFydHMgOiBhbnlbXSB8IHN0cmluZykge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWNjZXB0PFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+LCBvcHRpb25zOiBhbnkpOiBUIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IudGV4dCh0aGlzLnBhcnRzLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIENvbnRlbnRUZW1wbGF0ZSBpbXBsZW1lbnRzIElOb2RlIHtcclxuICAgICAgICBwcml2YXRlIGNoaWxkcmVuOiBJTm9kZVtdID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwcikgeyB9XHJcblxyXG4gICAgICAgIGNoaWxkKGNoaWxkOiBJTm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFjY2VwdDxUPih2aXNpdG9yOiBJVmlzaXRvcjxUPiwgb3B0aW9uczogYW55KTogVCB7XHJcbiAgICAgICAgICAgIHJldHVybiB2aXNpdG9yLmNvbnRlbnQodGhpcy5leHByLCB0aGlzLmNoaWxkcmVuLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRhZ1RlbXBsYXRlIGltcGxlbWVudHMgSU5vZGUge1xyXG4gICAgICAgIHByaXZhdGUgYXR0cmlidXRlczogeyBuYW1lOiBzdHJpbmc7IHRwbCB9W10gPSBbXTtcclxuICAgICAgICBwcml2YXRlIGV2ZW50cyA9IG5ldyBNYXA8c3RyaW5nLCBhbnk+KCk7XHJcbiAgICAgICAgLy8gUmVTaGFycGVyIGRpc2FibGUgb25jZSBJbmNvbnNpc3RlbnROYW1pbmdcclxuICAgICAgICBwcml2YXRlIF9jaGlsZHJlbjogSU5vZGVbXSA9IFtdO1xyXG4gICAgICAgIHB1YmxpYyBtb2RlbEFjY2Vzc29yO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwcml2YXRlIG5zOiBzdHJpbmcpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBjaGlsZHJlbigpOiBJTm9kZVtdIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkcmVuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGF0dHIobmFtZTogc3RyaW5nLCBleHByOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGV4cHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBwdWJsaWMgYWRkQXR0cmlidXRlKG5hbWU6IHN0cmluZywgZXhwcjogYW55KSB7XHJcbiAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghYXR0cilcclxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5wdXNoKHsgbmFtZTogbmFtZS50b0xvd2VyQ2FzZSgpLCB0cGw6IGV4cHIgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0dHIubmFtZSA9PT0ga2V5KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhdHRyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWRkRXZlbnQobmFtZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KG5hbWUsIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBhZGRDaGlsZChjaGlsZDogSU5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHNlbGVjdChtb2RlbEFjY2Vzc29yKSB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxBY2Nlc3NvciA9IG1vZGVsQWNjZXNzb3I7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWNjZXB0PFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+LCBvcHRpb25zOiBhbnkpIHtcclxuICAgICAgICAgICAgdmFyIHRhZyA9IHZpc2l0b3IudGFnKHRoaXMubmFtZSwgdGhpcy5ucywgdGhpcy5hdHRyaWJ1dGVzLCBvcHRpb25zKSBhcyBJVmlzaXRvcjxUPjtcclxuICAgICAgICAgICAgdGhpcy5fY2hpbGRyZW4uZm9yRWFjaCh4ID0+IHguYWNjZXB0KHRhZykpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7XHJcbiAgICBUZW1wbGF0ZSBhcyB0XHJcbn0iXX0=