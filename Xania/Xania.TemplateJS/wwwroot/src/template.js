"use strict";
var Template;
(function (Template) {
    var TextTemplate = (function () {
        function TextTemplate(expr) {
            this.expr = expr;
        }
        TextTemplate.prototype.bind = function (visitor) {
            return visitor.text(this.expr);
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
        FragmentTemplate.prototype.bind = function (visitor) {
            return visitor.content(this.expr, this.children);
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
        TagTemplate.prototype.bind = function (visitor) {
            var bindings = this._children.map(function (x) { return x.bind(visitor); });
            var tagBinding = visitor.tag(this.name, this.ns, this.attributes, bindings);
            return tagBinding;
        };
        return TagTemplate;
    }());
    Template.TagTemplate = TagTemplate;
})(Template = exports.Template || (exports.Template = {}));
exports.t = Template;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUEsSUFBYyxRQUFRLENBMkZyQjtBQTNGRCxXQUFjLFFBQVE7SUFZbEI7UUFDSSxzQkFBb0IsSUFBSTtZQUFKLFNBQUksR0FBSixJQUFJLENBQUE7UUFDeEIsQ0FBQztRQUVELDJCQUFJLEdBQUosVUFBUSxPQUFvQjtZQUN4QixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUNMLG1CQUFDO0lBQUQsQ0FBQyxBQVBELElBT0M7SUFQWSxxQkFBWSxlQU94QixDQUFBO0lBRUQ7UUFHSSwwQkFBb0IsSUFBSTtZQUFKLFNBQUksR0FBSixJQUFJLENBQUE7WUFGaEIsYUFBUSxHQUFZLEVBQUUsQ0FBQztRQUVILENBQUM7UUFFN0IsZ0NBQUssR0FBTCxVQUFNLEtBQVk7WUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCwrQkFBSSxHQUFKLFVBQVEsT0FBb0I7WUFDeEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUNMLHVCQUFDO0lBQUQsQ0FBQyxBQWJELElBYUM7SUFiWSx5QkFBZ0IsbUJBYTVCLENBQUE7SUFFRDtRQU1JLHFCQUFtQixJQUFZLEVBQVUsRUFBVSxFQUFVLFNBQXVCO1lBQXZCLDBCQUFBLEVBQUEsY0FBdUI7WUFBakUsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUFVLE9BQUUsR0FBRixFQUFFLENBQVE7WUFBVSxjQUFTLEdBQVQsU0FBUyxDQUFjO1lBTDVFLGVBQVUsR0FBNEIsRUFBRSxDQUFDO1lBQ3pDLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBZSxDQUFDO1FBS3hDLENBQUM7UUFFTSw4QkFBUSxHQUFmO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDMUIsQ0FBQztRQUVNLDBCQUFJLEdBQVgsVUFBWSxJQUFZLEVBQUUsSUFBUztZQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVNLGtDQUFZLEdBQW5CLFVBQW9CLElBQVksRUFBRSxJQUFTO1lBQ3ZDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ04sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVNLGtDQUFZLEdBQW5CLFVBQW9CLElBQVk7WUFDNUIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzdCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7b0JBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDcEIsQ0FBQztZQUNELE1BQU0sQ0FBQyxTQUFTLENBQUM7UUFDckIsQ0FBQztRQUVNLDhCQUFRLEdBQWYsVUFBZ0IsSUFBSSxFQUFFLFFBQVE7WUFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFTSw4QkFBUSxHQUFmLFVBQWdCLEtBQVk7WUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRU0sNEJBQU0sR0FBYixVQUFjLGFBQWE7WUFDdkIsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7WUFDbkMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsMEJBQUksR0FBSixVQUFRLE9BQW9CO1lBQ3hCLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBZixDQUFlLENBQUMsQ0FBQztZQUMxRCxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRTVFLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDdEIsQ0FBQztRQUNMLGtCQUFDO0lBQUQsQ0FBQyxBQXRERCxJQXNEQztJQXREWSxvQkFBVyxjQXNEdkIsQ0FBQTtBQUNMLENBQUMsRUEzRmEsUUFBUSxHQUFSLGdCQUFRLEtBQVIsZ0JBQVEsUUEyRnJCO0FBR2UscUJBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb3JlIH0gZnJvbSBcIi4vY29yZVwiXHJcblxyXG5leHBvcnQgbW9kdWxlIFRlbXBsYXRlIHtcclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElWaXNpdG9yPFQ+IHtcclxuICAgICAgICB0ZXh0KGV4cHIpOiBUO1xyXG4gICAgICAgIGNvbnRlbnQoZXhwciwgY2hpbGRyZW46IElOb2RlW10pOiBUO1xyXG4gICAgICAgIHRhZyhuYW1lLCBucywgYXR0cnMsIGNoaWxkcmVuKTogVDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElOb2RlIHtcclxuICAgICAgICBiaW5kPzxUPih2aXNpdG9yOiBJVmlzaXRvcjxUPik6IFQ7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRleHRUZW1wbGF0ZSBpbXBsZW1lbnRzIElOb2RlIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGV4cHIpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJpbmQ8VD4odmlzaXRvcjogSVZpc2l0b3I8VD4pOiBUIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IudGV4dCh0aGlzLmV4cHIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRnJhZ21lbnRUZW1wbGF0ZSBpbXBsZW1lbnRzIElOb2RlIHtcclxuICAgICAgICBwcml2YXRlIGNoaWxkcmVuOiBJTm9kZVtdID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwcikgeyB9XHJcblxyXG4gICAgICAgIGNoaWxkKGNoaWxkOiBJTm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJpbmQ8VD4odmlzaXRvcjogSVZpc2l0b3I8VD4pOiBUIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IuY29udGVudCh0aGlzLmV4cHIsIHRoaXMuY2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnVGVtcGxhdGUgaW1wbGVtZW50cyBJTm9kZSB7XHJcbiAgICAgICAgcHJpdmF0ZSBhdHRyaWJ1dGVzOiB7IG5hbWU6IHN0cmluZzsgdHBsIH1bXSA9IFtdO1xyXG4gICAgICAgIHByaXZhdGUgZXZlbnRzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcclxuICAgICAgICAvLyBSZVNoYXJwZXIgZGlzYWJsZSBvbmNlIEluY29uc2lzdGVudE5hbWluZ1xyXG4gICAgICAgIHB1YmxpYyBtb2RlbEFjY2Vzc29yO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwcml2YXRlIG5zOiBzdHJpbmcsIHByaXZhdGUgX2NoaWxkcmVuOiBJTm9kZVtdID0gW10pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBjaGlsZHJlbigpOiBJTm9kZVtdIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkcmVuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGF0dHIobmFtZTogc3RyaW5nLCBleHByOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGV4cHIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGFkZEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcsIGV4cHI6IGFueSkge1xyXG4gICAgICAgICAgICB2YXIgYXR0ciA9IHRoaXMuZ2V0QXR0cmlidXRlKG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIWF0dHIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMucHVzaCh7IG5hbWU6IG5hbWUudG9Mb3dlckNhc2UoKSwgdHBsOiBleHByIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXkgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IHRoaXMuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyLm5hbWUgPT09IGtleSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXR0cjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGFkZEV2ZW50KG5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnNldChuYW1lLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWRkQ2hpbGQoY2hpbGQ6IElOb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzZWxlY3QobW9kZWxBY2Nlc3Nvcikge1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsQWNjZXNzb3IgPSBtb2RlbEFjY2Vzc29yO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJpbmQ8VD4odmlzaXRvcjogSVZpc2l0b3I8VD4pIHtcclxuICAgICAgICAgICAgY29uc3QgYmluZGluZ3MgPSB0aGlzLl9jaGlsZHJlbi5tYXAoeCA9PiB4LmJpbmQodmlzaXRvcikpO1xyXG4gICAgICAgICAgICB2YXIgdGFnQmluZGluZyA9IHZpc2l0b3IudGFnKHRoaXMubmFtZSwgdGhpcy5ucywgdGhpcy5hdHRyaWJ1dGVzLCBiaW5kaW5ncyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnQmluZGluZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7XHJcbiAgICBUZW1wbGF0ZSBhcyB0XHJcbn0iXX0=