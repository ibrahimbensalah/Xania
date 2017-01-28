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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLElBQWMsUUFBUSxDQXlGckI7QUF6RkQsV0FBYyxRQUFRO0lBWWxCO1FBQ0ksc0JBQW9CLEtBQXNCO1lBQXRCLFVBQUssR0FBTCxLQUFLLENBQWlCO1FBQzFDLENBQUM7UUFFRCw2QkFBTSxHQUFOLFVBQVUsT0FBb0IsRUFBRSxPQUFZO1lBQ3hDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUNMLG1CQUFDO0lBQUQsQ0FBQyxBQVBELElBT0M7SUFQWSxxQkFBWSxlQU94QixDQUFBO0lBRUQ7UUFHSSwwQkFBb0IsSUFBSTtZQUFKLFNBQUksR0FBSixJQUFJLENBQUE7WUFGaEIsYUFBUSxHQUFZLEVBQUUsQ0FBQztRQUVILENBQUM7UUFFN0IsZ0NBQUssR0FBTCxVQUFNLEtBQVk7WUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxpQ0FBTSxHQUFOLFVBQVUsT0FBb0IsRUFBRSxPQUFZO1lBQ3hDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ0wsdUJBQUM7SUFBRCxDQUFDLEFBYkQsSUFhQztJQWJZLHlCQUFnQixtQkFhNUIsQ0FBQTtJQUVEO1FBTUkscUJBQW1CLElBQVksRUFBVSxFQUFVLEVBQVUsU0FBdUI7WUFBdkIsMEJBQUEsRUFBQSxjQUF1QjtZQUFqRSxTQUFJLEdBQUosSUFBSSxDQUFRO1lBQVUsT0FBRSxHQUFGLEVBQUUsQ0FBUTtZQUFVLGNBQVMsR0FBVCxTQUFTLENBQWM7WUFMNUUsZUFBVSxHQUE0QixFQUFFLENBQUM7WUFDekMsV0FBTSxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7UUFLeEMsQ0FBQztRQUVNLDhCQUFRLEdBQWY7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUMxQixDQUFDO1FBRU0sMEJBQUksR0FBWCxVQUFZLElBQVksRUFBRSxJQUFTO1lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRU0sa0NBQVksR0FBbkIsVUFBb0IsSUFBWSxFQUFFLElBQVM7WUFDdkMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDTixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRU0sa0NBQVksR0FBbkIsVUFBb0IsSUFBWTtZQUM1QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDN0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQztvQkFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNwQixDQUFDO1lBQ0QsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUNyQixDQUFDO1FBRU0sOEJBQVEsR0FBZixVQUFnQixJQUFJLEVBQUUsUUFBUTtZQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVNLDhCQUFRLEdBQWYsVUFBZ0IsS0FBWTtZQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFTSw0QkFBTSxHQUFiLFVBQWMsYUFBYTtZQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztZQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCw0QkFBTSxHQUFOLFVBQVUsT0FBb0IsRUFBRSxPQUFZO1lBQ3hDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBakIsQ0FBaUIsQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBQ0wsa0JBQUM7SUFBRCxDQUFDLEFBcERELElBb0RDO0lBcERZLG9CQUFXLGNBb0R2QixDQUFBO0FBQ0wsQ0FBQyxFQXpGYSxRQUFRLEdBQVIsZ0JBQVEsS0FBUixnQkFBUSxRQXlGckI7QUFHZSxxQkFBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tIFwiLi9jb3JlXCJcclxuXHJcbmV4cG9ydCBtb2R1bGUgVGVtcGxhdGUge1xyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpc2l0b3I8VD4ge1xyXG4gICAgICAgIHRleHQoZXhwciwgb3B0aW9uczogYW55KTogVDtcclxuICAgICAgICBjb250ZW50KGV4cHIsIGNoaWxkcmVuOiBJTm9kZVtdLCBvcHRpb25zPzogYW55KTogVDtcclxuICAgICAgICB0YWcobmFtZSwgbnMsIGF0dHJzLCBjaGlsZHJlbiwgb3B0aW9ucz86IGFueSk6IFQ7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTm9kZSB7XHJcbiAgICAgICAgYWNjZXB0PFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+LCBvcHRpb25zPzogYW55KTogVDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGV4dFRlbXBsYXRlIGltcGxlbWVudHMgSU5vZGUge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGFydHMgOiBhbnlbXSB8IHN0cmluZykge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWNjZXB0PFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+LCBvcHRpb25zOiBhbnkpOiBUIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IudGV4dCh0aGlzLnBhcnRzLCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIEZyYWdtZW50VGVtcGxhdGUgaW1wbGVtZW50cyBJTm9kZSB7XHJcbiAgICAgICAgcHJpdmF0ZSBjaGlsZHJlbjogSU5vZGVbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIpIHsgfVxyXG5cclxuICAgICAgICBjaGlsZChjaGlsZDogSU5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhY2NlcHQ8VD4odmlzaXRvcjogSVZpc2l0b3I8VD4sIG9wdGlvbnM6IGFueSk6IFQge1xyXG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci5jb250ZW50KHRoaXMuZXhwciwgdGhpcy5jaGlsZHJlbiwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUYWdUZW1wbGF0ZSBpbXBsZW1lbnRzIElOb2RlIHtcclxuICAgICAgICBwcml2YXRlIGF0dHJpYnV0ZXM6IHsgbmFtZTogc3RyaW5nOyB0cGwgfVtdID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBldmVudHMgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xyXG4gICAgICAgIC8vIFJlU2hhcnBlciBkaXNhYmxlIG9uY2UgSW5jb25zaXN0ZW50TmFtaW5nXHJcbiAgICAgICAgcHVibGljIG1vZGVsQWNjZXNzb3I7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHByaXZhdGUgbnM6IHN0cmluZywgcHJpdmF0ZSBfY2hpbGRyZW46IElOb2RlW10gPSBbXSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGNoaWxkcmVuKCk6IElOb2RlW10ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYXR0cihuYW1lOiBzdHJpbmcsIGV4cHI6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgZXhwcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHB1YmxpYyBhZGRBdHRyaWJ1dGUobmFtZTogc3RyaW5nLCBleHByOiBhbnkpIHtcclxuICAgICAgICAgICAgdmFyIGF0dHIgPSB0aGlzLmdldEF0dHJpYnV0ZShuYW1lKTtcclxuICAgICAgICAgICAgaWYgKCFhdHRyKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLnB1c2goeyBuYW1lOiBuYW1lLnRvTG93ZXJDYXNlKCksIHRwbDogZXhwciB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgZ2V0QXR0cmlidXRlKG5hbWU6IHN0cmluZykge1xyXG4gICAgICAgICAgICB2YXIga2V5ID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGF0dHIgPSB0aGlzLmF0dHJpYnV0ZXNbaV07XHJcbiAgICAgICAgICAgICAgICBpZiAoYXR0ci5uYW1lID09PSBrZXkpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF0dHI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBhZGRFdmVudChuYW1lLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5zZXQobmFtZSwgY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGFkZENoaWxkKGNoaWxkOiBJTm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9jaGlsZHJlbi5wdXNoKGNoaWxkKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgc2VsZWN0KG1vZGVsQWNjZXNzb3IpIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RlbEFjY2Vzc29yID0gbW9kZWxBY2Nlc3NvcjtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhY2NlcHQ8VD4odmlzaXRvcjogSVZpc2l0b3I8VD4sIG9wdGlvbnM6IGFueSkge1xyXG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLl9jaGlsZHJlbi5tYXAoeCA9PiB4LmFjY2VwdCh2aXNpdG9yKSk7XHJcbiAgICAgICAgICAgIHJldHVybiB2aXNpdG9yLnRhZyh0aGlzLm5hbWUsIHRoaXMubnMsIHRoaXMuYXR0cmlidXRlcywgY2hpbGRyZW4sIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHtcclxuICAgIFRlbXBsYXRlIGFzIHRcclxufSJdfQ==