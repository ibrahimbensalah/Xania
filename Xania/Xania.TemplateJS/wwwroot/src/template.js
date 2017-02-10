"use strict";
var Template;
(function (Template) {
    var TextTemplate = (function () {
        function TextTemplate(tpl) {
            this.tpl = tpl;
        }
        TextTemplate.prototype.bind = function (visitor) {
            return visitor.text(this.tpl);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLElBQWMsUUFBUSxDQTJGckI7QUEzRkQsV0FBYyxRQUFRO0lBWWxCO1FBQ0ksc0JBQW9CLEdBQTRDO1lBQTVDLFFBQUcsR0FBSCxHQUFHLENBQXlDO1FBQ2hFLENBQUM7UUFFRCwyQkFBSSxHQUFKLFVBQVEsT0FBb0I7WUFDeEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFDTCxtQkFBQztJQUFELENBQUMsQUFQRCxJQU9DO0lBUFkscUJBQVksZUFPeEIsQ0FBQTtJQUVEO1FBR0ksMEJBQW9CLElBQUk7WUFBSixTQUFJLEdBQUosSUFBSSxDQUFBO1lBRmhCLGFBQVEsR0FBWSxFQUFFLENBQUM7UUFFSCxDQUFDO1FBRTdCLGdDQUFLLEdBQUwsVUFBTSxLQUFZO1lBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsK0JBQUksR0FBSixVQUFRLE9BQW9CO1lBQ3hCLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFDTCx1QkFBQztJQUFELENBQUMsQUFiRCxJQWFDO0lBYlkseUJBQWdCLG1CQWE1QixDQUFBO0lBRUQ7UUFNSSxxQkFBbUIsSUFBWSxFQUFVLEVBQVUsRUFBVSxTQUF1QjtZQUF2QiwwQkFBQSxFQUFBLGNBQXVCO1lBQWpFLFNBQUksR0FBSixJQUFJLENBQVE7WUFBVSxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQVUsY0FBUyxHQUFULFNBQVMsQ0FBYztZQUw1RSxlQUFVLEdBQTRCLEVBQUUsQ0FBQztZQUN6QyxXQUFNLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQztRQUt4QyxDQUFDO1FBRU0sOEJBQVEsR0FBZjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQzFCLENBQUM7UUFFTSwwQkFBSSxHQUFYLFVBQVksSUFBWSxFQUFFLElBQVM7WUFDL0IsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTSxrQ0FBWSxHQUFuQixVQUFvQixJQUFZLEVBQUUsSUFBUztZQUN2QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNOLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFTSxrQ0FBWSxHQUFuQixVQUFvQixJQUFZO1lBQzVCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO29CQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxNQUFNLENBQUMsU0FBUyxDQUFDO1FBQ3JCLENBQUM7UUFFTSw4QkFBUSxHQUFmLFVBQWdCLElBQUksRUFBRSxRQUFRO1lBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRU0sOEJBQVEsR0FBZixVQUFnQixLQUFZO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVNLDRCQUFNLEdBQWIsVUFBYyxhQUFhO1lBQ3ZCLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELDBCQUFJLEdBQUosVUFBUSxPQUFvQjtZQUN4QixJQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQWYsQ0FBZSxDQUFDLENBQUM7WUFDMUQsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUU1RSxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3RCLENBQUM7UUFDTCxrQkFBQztJQUFELENBQUMsQUF0REQsSUFzREM7SUF0RFksb0JBQVcsY0FzRHZCLENBQUE7QUFDTCxDQUFDLEVBM0ZhLFFBQVEsR0FBUixnQkFBUSxLQUFSLGdCQUFRLFFBMkZyQjtBQUdlLHFCQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29yZSB9IGZyb20gXCIuL2NvcmVcIlxyXG5cclxuZXhwb3J0IG1vZHVsZSBUZW1wbGF0ZSB7XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJVmlzaXRvcjxUPiB7XHJcbiAgICAgICAgdGV4dChleHByKTogVDtcclxuICAgICAgICBjb250ZW50KGV4cHIsIGNoaWxkcmVuOiBJTm9kZVtdKTogVDtcclxuICAgICAgICB0YWcobmFtZSwgbnMsIGF0dHJzLCBjaGlsZHJlbik6IFQ7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJTm9kZSB7XHJcbiAgICAgICAgYmluZDxUPih2aXNpdG9yOiBJVmlzaXRvcjxUPik6IFQ7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRleHRUZW1wbGF0ZSBpbXBsZW1lbnRzIElOb2RlIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHRwbDogeyBleGVjdXRlKGJpbmRpbmcsIGNvbnRleHQpOyB9IHwgc3RyaW5nKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBiaW5kPFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+KTogVCB7XHJcbiAgICAgICAgICAgIHJldHVybiB2aXNpdG9yLnRleHQodGhpcy50cGwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgRnJhZ21lbnRUZW1wbGF0ZSBpbXBsZW1lbnRzIElOb2RlIHtcclxuICAgICAgICBwcml2YXRlIGNoaWxkcmVuOiBJTm9kZVtdID0gW107XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZXhwcikgeyB9XHJcblxyXG4gICAgICAgIGNoaWxkKGNoaWxkOiBJTm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJpbmQ8VD4odmlzaXRvcjogSVZpc2l0b3I8VD4pOiBUIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IuY29udGVudCh0aGlzLmV4cHIsIHRoaXMuY2hpbGRyZW4pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGFnVGVtcGxhdGUgaW1wbGVtZW50cyBJTm9kZSB7XHJcbiAgICAgICAgcHJpdmF0ZSBhdHRyaWJ1dGVzOiB7IG5hbWU6IHN0cmluZzsgdHBsIH1bXSA9IFtdO1xyXG4gICAgICAgIHByaXZhdGUgZXZlbnRzID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcclxuICAgICAgICAvLyBSZVNoYXJwZXIgZGlzYWJsZSBvbmNlIEluY29uc2lzdGVudE5hbWluZ1xyXG4gICAgICAgIHB1YmxpYyBtb2RlbEFjY2Vzc29yO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCBwcml2YXRlIG5zOiBzdHJpbmcsIHByaXZhdGUgX2NoaWxkcmVuOiBJTm9kZVtdID0gW10pIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBjaGlsZHJlbigpOiBJTm9kZVtdIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NoaWxkcmVuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGF0dHIobmFtZTogc3RyaW5nLCBleHByOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQXR0cmlidXRlKG5hbWUsIGV4cHIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGFkZEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcsIGV4cHI6IGFueSkge1xyXG4gICAgICAgICAgICB2YXIgYXR0ciA9IHRoaXMuZ2V0QXR0cmlidXRlKG5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIWF0dHIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZXMucHVzaCh7IG5hbWU6IG5hbWUudG9Mb3dlckNhc2UoKSwgdHBsOiBleHByIH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBnZXRBdHRyaWJ1dGUobmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXkgPSBuYW1lLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IHRoaXMuYXR0cmlidXRlc1tpXTtcclxuICAgICAgICAgICAgICAgIGlmIChhdHRyLm5hbWUgPT09IGtleSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXR0cjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGFkZEV2ZW50KG5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzLnNldChuYW1lLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWRkQ2hpbGQoY2hpbGQ6IElOb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBzZWxlY3QobW9kZWxBY2Nlc3Nvcikge1xyXG4gICAgICAgICAgICB0aGlzLm1vZGVsQWNjZXNzb3IgPSBtb2RlbEFjY2Vzc29yO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJpbmQ8VD4odmlzaXRvcjogSVZpc2l0b3I8VD4pIHtcclxuICAgICAgICAgICAgY29uc3QgYmluZGluZ3MgPSB0aGlzLl9jaGlsZHJlbi5tYXAoeCA9PiB4LmJpbmQodmlzaXRvcikpO1xyXG4gICAgICAgICAgICB2YXIgdGFnQmluZGluZyA9IHZpc2l0b3IudGFnKHRoaXMubmFtZSwgdGhpcy5ucywgdGhpcy5hdHRyaWJ1dGVzLCBiaW5kaW5ncyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnQmluZGluZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7XHJcbiAgICBUZW1wbGF0ZSBhcyB0XHJcbn0iXX0=