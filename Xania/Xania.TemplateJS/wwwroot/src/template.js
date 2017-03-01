"use strict";
var Template;
(function (Template) {
    var TextTemplate = (function () {
        function TextTemplate(expr, visitor) {
            this.expr = expr;
            this.visitor = visitor;
        }
        TextTemplate.prototype.bind = function () {
            return this.visitor.text(this.expr);
        };
        return TextTemplate;
    }());
    Template.TextTemplate = TextTemplate;
    var FragmentTemplate = (function () {
        function FragmentTemplate(expr, visitor) {
            this.expr = expr;
            this.visitor = visitor;
            this.children = [];
        }
        FragmentTemplate.prototype.child = function (child) {
            this.children.push(child);
            return this;
        };
        FragmentTemplate.prototype.bind = function () {
            return this.visitor.content(this.expr, this.children);
        };
        return FragmentTemplate;
    }());
    Template.FragmentTemplate = FragmentTemplate;
    var TagTemplate = (function () {
        function TagTemplate(name, ns, _children, visitor) {
            if (_children === void 0) { _children = []; }
            this.name = name;
            this.ns = ns;
            this._children = _children;
            this.visitor = visitor;
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
        TagTemplate.prototype.bind = function () {
            var bindings = this._children.map(function (x) { return x.bind(); });
            var tagBinding = this.visitor.tag(this.name, this.ns, this.attributes, bindings);
            return tagBinding;
        };
        return TagTemplate;
    }());
    Template.TagTemplate = TagTemplate;
})(Template = exports.Template || (exports.Template = {}));
exports.t = Template;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUEsSUFBYyxRQUFRLENBMkZyQjtBQTNGRCxXQUFjLFFBQVE7SUFZbEI7UUFDSSxzQkFBb0IsSUFBSSxFQUFVLE9BQW9CO1lBQWxDLFNBQUksR0FBSixJQUFJLENBQUE7WUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFhO1FBQ3RELENBQUM7UUFFRCwyQkFBSSxHQUFKO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQ0wsbUJBQUM7SUFBRCxDQUFDLEFBUEQsSUFPQztJQVBZLHFCQUFZLGVBT3hCLENBQUE7SUFFRDtRQUdJLDBCQUFvQixJQUFJLEVBQVUsT0FBb0I7WUFBbEMsU0FBSSxHQUFKLElBQUksQ0FBQTtZQUFVLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFGOUMsYUFBUSxHQUFZLEVBQUUsQ0FBQztRQUUyQixDQUFDO1FBRTNELGdDQUFLLEdBQUwsVUFBTSxLQUFZO1lBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsK0JBQUksR0FBSjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBQ0wsdUJBQUM7SUFBRCxDQUFDLEFBYkQsSUFhQztJQWJZLHlCQUFnQixtQkFhNUIsQ0FBQTtJQUVEO1FBTUkscUJBQW1CLElBQVksRUFBVSxFQUFVLEVBQVUsU0FBdUIsRUFBVSxPQUFvQjtZQUFyRCwwQkFBQSxFQUFBLGNBQXVCO1lBQWpFLFNBQUksR0FBSixJQUFJLENBQVE7WUFBVSxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQVUsY0FBUyxHQUFULFNBQVMsQ0FBYztZQUFVLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFMMUcsZUFBVSxHQUE0QixFQUFFLENBQUM7WUFDekMsV0FBTSxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7UUFLeEMsQ0FBQztRQUVNLDhCQUFRLEdBQWY7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUMxQixDQUFDO1FBRU0sMEJBQUksR0FBWCxVQUFZLElBQVksRUFBRSxJQUFTO1lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRU0sa0NBQVksR0FBbkIsVUFBb0IsSUFBWSxFQUFFLElBQVM7WUFDdkMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDTixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRU0sa0NBQVksR0FBbkIsVUFBb0IsSUFBWTtZQUM1QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDN0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQztvQkFDbEIsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNwQixDQUFDO1lBQ0QsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUNyQixDQUFDO1FBRU0sOEJBQVEsR0FBZixVQUFnQixJQUFJLEVBQUUsUUFBUTtZQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVNLDhCQUFRLEdBQWYsVUFBZ0IsS0FBWTtZQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFTSw0QkFBTSxHQUFiLFVBQWMsYUFBYTtZQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztZQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCwwQkFBSSxHQUFKO1lBQ0ksSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQVIsQ0FBUSxDQUFDLENBQUM7WUFDbkQsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFakYsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUN0QixDQUFDO1FBQ0wsa0JBQUM7SUFBRCxDQUFDLEFBdERELElBc0RDO0lBdERZLG9CQUFXLGNBc0R2QixDQUFBO0FBQ0wsQ0FBQyxFQTNGYSxRQUFRLEdBQVIsZ0JBQVEsS0FBUixnQkFBUSxRQTJGckI7QUFHZSxxQkFBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvcmUgfSBmcm9tIFwiLi9jb3JlXCJcclxuXHJcbmV4cG9ydCBtb2R1bGUgVGVtcGxhdGUge1xyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpc2l0b3I8VD4ge1xyXG4gICAgICAgIHRleHQoZXhwcik6IFQ7XHJcbiAgICAgICAgY29udGVudChleHByLCBjaGlsZHJlbjogSU5vZGVbXSk6IFQ7XHJcbiAgICAgICAgdGFnKG5hbWUsIG5zLCBhdHRycywgY2hpbGRyZW4pOiBUO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU5vZGUge1xyXG4gICAgICAgIGJpbmQ/KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRleHRUZW1wbGF0ZTxUPiBpbXBsZW1lbnRzIElOb2RlIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIsIHByaXZhdGUgdmlzaXRvcjogSVZpc2l0b3I8VD4pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJpbmQoKTogVCB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZpc2l0b3IudGV4dCh0aGlzLmV4cHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRnJhZ21lbnRUZW1wbGF0ZTxUPiBpbXBsZW1lbnRzIElOb2RlIHtcclxuICAgICAgICBwcml2YXRlIGNoaWxkcmVuOiBJTm9kZVtdID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwciwgcHJpdmF0ZSB2aXNpdG9yOiBJVmlzaXRvcjxUPikgeyB9XHJcblxyXG4gICAgICAgIGNoaWxkKGNoaWxkOiBJTm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJpbmQoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZpc2l0b3IuY29udGVudCh0aGlzLmV4cHIsIHRoaXMuY2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnVGVtcGxhdGU8VD4gaW1wbGVtZW50cyBJTm9kZSB7XHJcbiAgICAgICAgcHJpdmF0ZSBhdHRyaWJ1dGVzOiB7IG5hbWU6IHN0cmluZzsgdHBsIH1bXSA9IFtdO1xyXG4gICAgICAgIHByaXZhdGUgZXZlbnRzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcclxuICAgICAgICAvLyBSZVNoYXJwZXIgZGlzYWJsZSBvbmNlIEluY29uc2lzdGVudE5hbWluZ1xyXG4gICAgICAgIHB1YmxpYyBtb2RlbEFjY2Vzc29yO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwcml2YXRlIG5zOiBzdHJpbmcsIHByaXZhdGUgX2NoaWxkcmVuOiBJTm9kZVtdID0gW10sIHByaXZhdGUgdmlzaXRvcjogSVZpc2l0b3I8VD4pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBjaGlsZHJlbigpOiBJTm9kZVtdIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkcmVuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGF0dHIobmFtZTogc3RyaW5nLCBleHByOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGV4cHIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGFkZEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcsIGV4cHI6IGFueSkge1xyXG4gICAgICAgICAgICB2YXIgYXR0ciA9IHRoaXMuZ2V0QXR0cmlidXRlKG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIWF0dHIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMucHVzaCh7IG5hbWU6IG5hbWUudG9Mb3dlckNhc2UoKSwgdHBsOiBleHByIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXkgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IHRoaXMuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyLm5hbWUgPT09IGtleSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXR0cjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGFkZEV2ZW50KG5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnNldChuYW1lLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWRkQ2hpbGQoY2hpbGQ6IElOb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzZWxlY3QobW9kZWxBY2Nlc3Nvcikge1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsQWNjZXNzb3IgPSBtb2RlbEFjY2Vzc29yO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJpbmQoKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJpbmRpbmdzID0gdGhpcy5fY2hpbGRyZW4ubWFwKHggPT4geC5iaW5kKCkpO1xyXG4gICAgICAgICAgICB2YXIgdGFnQmluZGluZyA9IHRoaXMudmlzaXRvci50YWcodGhpcy5uYW1lLCB0aGlzLm5zLCB0aGlzLmF0dHJpYnV0ZXMsIGJpbmRpbmdzKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWdCaW5kaW5nO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHtcclxuICAgIFRlbXBsYXRlIGFzIHRcclxufSJdfQ==