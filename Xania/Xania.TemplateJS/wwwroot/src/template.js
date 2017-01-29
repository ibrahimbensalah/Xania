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
    var FragmentTemplate = (function () {
        function FragmentTemplate(expr) {
            this.expr = expr;
            this.children = [];
        }
        FragmentTemplate.prototype.child = function (child) {
            this.children.push(child);
            return this;
        };
        FragmentTemplate.prototype.accept = function (visitor, options) {
            return visitor.content(this.expr, this.children, options);
        };
        return FragmentTemplate;
    }());
    Template.FragmentTemplate = FragmentTemplate;
    var TagTemplate = (function () {
        function TagTemplate(name, ns, _children) {
            if (_children === void 0) { _children = []; }
            this.name = name;
            this.ns = ns;
            this._children = _children;
            this.attributes = [];
            this.events = new Map();
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
            var children = this._children.map(function (x) { return x.accept(visitor); });
            return visitor.tag(this.name, this.ns, this.attributes, children, options);
        };
        return TagTemplate;
    }());
    Template.TagTemplate = TagTemplate;
})(Template = exports.Template || (exports.Template = {}));
exports.t = Template;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLElBQWMsUUFBUSxDQXlGckI7QUF6RkQsV0FBYyxRQUFRO0lBWWxCO1FBQ0ksc0JBQW9CLEtBQStDO1lBQS9DLFVBQUssR0FBTCxLQUFLLENBQTBDO1FBQ25FLENBQUM7UUFFRCw2QkFBTSxHQUFOLFVBQVUsT0FBb0IsRUFBRSxPQUFZO1lBQ3hDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUNMLG1CQUFDO0lBQUQsQ0FBQyxBQVBELElBT0M7SUFQWSxxQkFBWSxlQU94QixDQUFBO0lBRUQ7UUFHSSwwQkFBb0IsSUFBSTtZQUFKLFNBQUksR0FBSixJQUFJLENBQUE7WUFGaEIsYUFBUSxHQUFZLEVBQUUsQ0FBQztRQUVILENBQUM7UUFFN0IsZ0NBQUssR0FBTCxVQUFNLEtBQVk7WUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxpQ0FBTSxHQUFOLFVBQVUsT0FBb0IsRUFBRSxPQUFZO1lBQ3hDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ0wsdUJBQUM7SUFBRCxDQUFDLEFBYkQsSUFhQztJQWJZLHlCQUFnQixtQkFhNUIsQ0FBQTtJQUVEO1FBTUkscUJBQW1CLElBQVksRUFBVSxFQUFVLEVBQVUsU0FBdUI7WUFBdkIsMEJBQUEsRUFBQSxjQUF1QjtZQUFqRSxTQUFJLEdBQUosSUFBSSxDQUFRO1lBQVUsT0FBRSxHQUFGLEVBQUUsQ0FBUTtZQUFVLGNBQVMsR0FBVCxTQUFTLENBQWM7WUFMNUUsZUFBVSxHQUE0QixFQUFFLENBQUM7WUFDekMsV0FBTSxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7UUFLeEMsQ0FBQztRQUVNLDhCQUFRLEdBQWY7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUMxQixDQUFDO1FBRU0sMEJBQUksR0FBWCxVQUFZLElBQVksRUFBRSxJQUFTO1lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRU0sa0NBQVksR0FBbkIsVUFBb0IsSUFBWSxFQUFFLElBQVM7WUFDdkMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDTixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRU0sa0NBQVksR0FBbkIsVUFBb0IsSUFBWTtZQUM1QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDN0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQztvQkFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNwQixDQUFDO1lBQ0QsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUNyQixDQUFDO1FBRU0sOEJBQVEsR0FBZixVQUFnQixJQUFJLEVBQUUsUUFBUTtZQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVNLDhCQUFRLEdBQWYsVUFBZ0IsS0FBWTtZQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFTSw0QkFBTSxHQUFiLFVBQWMsYUFBYTtZQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztZQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCw0QkFBTSxHQUFOLFVBQVUsT0FBb0IsRUFBRSxPQUFZO1lBQ3hDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBakIsQ0FBaUIsQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBQ0wsa0JBQUM7SUFBRCxDQUFDLEFBcERELElBb0RDO0lBcERZLG9CQUFXLGNBb0R2QixDQUFBO0FBQ0wsQ0FBQyxFQXpGYSxRQUFRLEdBQVIsZ0JBQVEsS0FBUixnQkFBUSxRQXlGckI7QUFHZSxxQkFBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tIFwiLi9jb3JlXCJcclxuXHJcbmV4cG9ydCBtb2R1bGUgVGVtcGxhdGUge1xyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpc2l0b3I8VD4ge1xyXG4gICAgICAgIHRleHQoZXhwciwgb3B0aW9uczogYW55KTogVDtcclxuICAgICAgICBjb250ZW50KGV4cHIsIGNoaWxkcmVuOiBJTm9kZVtdLCBvcHRpb25zPzogYW55KTogVDtcclxuICAgICAgICB0YWcobmFtZSwgbnMsIGF0dHJzLCBjaGlsZHJlbiwgb3B0aW9ucz86IGFueSk6IFQ7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTm9kZSB7XHJcbiAgICAgICAgYWNjZXB0PFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+LCBvcHRpb25zPzogYW55KTogVDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGV4dFRlbXBsYXRlIGltcGxlbWVudHMgSU5vZGUge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFydHMgOiB7IGV4ZWN1dGUoYmluZGluZywgY29udGV4dCk7IH0gfCBzdHJpbmcpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFjY2VwdDxUPih2aXNpdG9yOiBJVmlzaXRvcjxUPiwgb3B0aW9uczogYW55KTogVCB7XHJcbiAgICAgICAgICAgIHJldHVybiB2aXNpdG9yLnRleHQodGhpcy5wYXJ0cywgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBGcmFnbWVudFRlbXBsYXRlIGltcGxlbWVudHMgSU5vZGUge1xyXG4gICAgICAgIHByaXZhdGUgY2hpbGRyZW46IElOb2RlW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBleHByKSB7IH1cclxuXHJcbiAgICAgICAgY2hpbGQoY2hpbGQ6IElOb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWNjZXB0PFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+LCBvcHRpb25zOiBhbnkpOiBUIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IuY29udGVudCh0aGlzLmV4cHIsIHRoaXMuY2hpbGRyZW4sIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnVGVtcGxhdGUgaW1wbGVtZW50cyBJTm9kZSB7XHJcbiAgICAgICAgcHJpdmF0ZSBhdHRyaWJ1dGVzOiB7IG5hbWU6IHN0cmluZzsgdHBsIH1bXSA9IFtdO1xyXG4gICAgICAgIHByaXZhdGUgZXZlbnRzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcclxuICAgICAgICAvLyBSZVNoYXJwZXIgZGlzYWJsZSBvbmNlIEluY29uc2lzdGVudE5hbWluZ1xyXG4gICAgICAgIHB1YmxpYyBtb2RlbEFjY2Vzc29yO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwcml2YXRlIG5zOiBzdHJpbmcsIHByaXZhdGUgX2NoaWxkcmVuOiBJTm9kZVtdID0gW10pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBjaGlsZHJlbigpOiBJTm9kZVtdIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkcmVuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGF0dHIobmFtZTogc3RyaW5nLCBleHByOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGV4cHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBwdWJsaWMgYWRkQXR0cmlidXRlKG5hbWU6IHN0cmluZywgZXhwcjogYW55KSB7XHJcbiAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghYXR0cilcclxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5wdXNoKHsgbmFtZTogbmFtZS50b0xvd2VyQ2FzZSgpLCB0cGw6IGV4cHIgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0dHIubmFtZSA9PT0ga2V5KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhdHRyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWRkRXZlbnQobmFtZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KG5hbWUsIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBhZGRDaGlsZChjaGlsZDogSU5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHNlbGVjdChtb2RlbEFjY2Vzc29yKSB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxBY2Nlc3NvciA9IG1vZGVsQWNjZXNzb3I7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWNjZXB0PFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+LCBvcHRpb25zOiBhbnkpIHtcclxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5fY2hpbGRyZW4ubWFwKHggPT4geC5hY2NlcHQodmlzaXRvcikpO1xyXG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci50YWcodGhpcy5uYW1lLCB0aGlzLm5zLCB0aGlzLmF0dHJpYnV0ZXMsIGNoaWxkcmVuLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7XHJcbiAgICBUZW1wbGF0ZSBhcyB0XHJcbn0iXX0=