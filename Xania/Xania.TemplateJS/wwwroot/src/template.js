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
            var bindings = this._children.map(function (x) { return x.bind(visitor); }), tagBinding = visitor.tag(this.name, this.ns, this.attributes, bindings);
            return tagBinding;
        };
        return TagTemplate;
    }());
    Template.TagTemplate = TagTemplate;
})(Template = exports.Template || (exports.Template = {}));
exports.t = Template;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVtcGxhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLElBQWMsUUFBUSxDQTRGckI7QUE1RkQsV0FBYyxRQUFRO0lBWWxCO1FBQ0ksc0JBQW9CLEdBQTRDO1lBQTVDLFFBQUcsR0FBSCxHQUFHLENBQXlDO1FBQ2hFLENBQUM7UUFFRCwyQkFBSSxHQUFKLFVBQVEsT0FBb0I7WUFDeEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFDTCxtQkFBQztJQUFELENBQUMsQUFQRCxJQU9DO0lBUFkscUJBQVksZUFPeEIsQ0FBQTtJQUVEO1FBR0ksMEJBQW9CLElBQUk7WUFBSixTQUFJLEdBQUosSUFBSSxDQUFBO1lBRmhCLGFBQVEsR0FBWSxFQUFFLENBQUM7UUFFSCxDQUFDO1FBRTdCLGdDQUFLLEdBQUwsVUFBTSxLQUFZO1lBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsK0JBQUksR0FBSixVQUFRLE9BQW9CO1lBQ3hCLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFDTCx1QkFBQztJQUFELENBQUMsQUFiRCxJQWFDO0lBYlkseUJBQWdCLG1CQWE1QixDQUFBO0lBRUQ7UUFNSSxxQkFBbUIsSUFBWSxFQUFVLEVBQVUsRUFBVSxTQUF1QjtZQUF2QiwwQkFBQSxFQUFBLGNBQXVCO1lBQWpFLFNBQUksR0FBSixJQUFJLENBQVE7WUFBVSxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBQVUsY0FBUyxHQUFULFNBQVMsQ0FBYztZQUw1RSxlQUFVLEdBQTRCLEVBQUUsQ0FBQztZQUN6QyxXQUFNLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQztRQUt4QyxDQUFDO1FBRU0sOEJBQVEsR0FBZjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQzFCLENBQUM7UUFFTSwwQkFBSSxHQUFYLFVBQVksSUFBWSxFQUFFLElBQVM7WUFDL0IsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTSxrQ0FBWSxHQUFuQixVQUFvQixJQUFZLEVBQUUsSUFBUztZQUN2QyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25DLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNOLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFTSxrQ0FBWSxHQUFuQixVQUFvQixJQUFZO1lBQzVCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzlDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssR0FBRyxDQUFDO29CQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxNQUFNLENBQUMsU0FBUyxDQUFDO1FBQ3JCLENBQUM7UUFFTSw4QkFBUSxHQUFmLFVBQWdCLElBQUksRUFBRSxRQUFRO1lBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRU0sOEJBQVEsR0FBZixVQUFnQixLQUFZO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVNLDRCQUFNLEdBQWIsVUFBYyxhQUFhO1lBQ3ZCLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELDBCQUFJLEdBQUosVUFBUSxPQUFvQjtZQUN4QixJQUNJLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQWYsQ0FBZSxDQUFDLEVBQ25ELFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRTVFLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDdEIsQ0FBQztRQUNMLGtCQUFDO0lBQUQsQ0FBQyxBQXZERCxJQXVEQztJQXZEWSxvQkFBVyxjQXVEdkIsQ0FBQTtBQUNMLENBQUMsRUE1RmEsUUFBUSxHQUFSLGdCQUFRLEtBQVIsZ0JBQVEsUUE0RnJCO0FBR2UscUJBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb3JlIH0gZnJvbSBcIi4vY29yZVwiXHJcblxyXG5leHBvcnQgbW9kdWxlIFRlbXBsYXRlIHtcclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElWaXNpdG9yPFQ+IHtcclxuICAgICAgICB0ZXh0KGV4cHIpOiBUO1xyXG4gICAgICAgIGNvbnRlbnQoZXhwciwgY2hpbGRyZW46IElOb2RlW10pOiBUO1xyXG4gICAgICAgIHRhZyhuYW1lLCBucywgYXR0cnMsIGNoaWxkcmVuKTogVDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElOb2RlIHtcclxuICAgICAgICBiaW5kPFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+KTogVDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGV4dFRlbXBsYXRlIGltcGxlbWVudHMgSU5vZGUge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdHBsOiB7IGV4ZWN1dGUoYmluZGluZywgY29udGV4dCk7IH0gfCBzdHJpbmcpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJpbmQ8VD4odmlzaXRvcjogSVZpc2l0b3I8VD4pOiBUIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IudGV4dCh0aGlzLnRwbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBGcmFnbWVudFRlbXBsYXRlIGltcGxlbWVudHMgSU5vZGUge1xyXG4gICAgICAgIHByaXZhdGUgY2hpbGRyZW46IElOb2RlW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBleHByKSB7IH1cclxuXHJcbiAgICAgICAgY2hpbGQoY2hpbGQ6IElOb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYmluZDxUPih2aXNpdG9yOiBJVmlzaXRvcjxUPik6IFQge1xyXG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci5jb250ZW50KHRoaXMuZXhwciwgdGhpcy5jaGlsZHJlbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUYWdUZW1wbGF0ZSBpbXBsZW1lbnRzIElOb2RlIHtcclxuICAgICAgICBwcml2YXRlIGF0dHJpYnV0ZXM6IHsgbmFtZTogc3RyaW5nOyB0cGwgfVtdID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBldmVudHMgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xyXG4gICAgICAgIC8vIFJlU2hhcnBlciBkaXNhYmxlIG9uY2UgSW5jb25zaXN0ZW50TmFtaW5nXHJcbiAgICAgICAgcHVibGljIG1vZGVsQWNjZXNzb3I7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHByaXZhdGUgbnM6IHN0cmluZywgcHJpdmF0ZSBfY2hpbGRyZW46IElOb2RlW10gPSBbXSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGNoaWxkcmVuKCk6IElOb2RlW10ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYXR0cihuYW1lOiBzdHJpbmcsIGV4cHI6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgZXhwcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWRkQXR0cmlidXRlKG5hbWU6IHN0cmluZywgZXhwcjogYW55KSB7XHJcbiAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghYXR0cilcclxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5wdXNoKHsgbmFtZTogbmFtZS50b0xvd2VyQ2FzZSgpLCB0cGw6IGV4cHIgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0dHIubmFtZSA9PT0ga2V5KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhdHRyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWRkRXZlbnQobmFtZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KG5hbWUsIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBhZGRDaGlsZChjaGlsZDogSU5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHNlbGVjdChtb2RlbEFjY2Vzc29yKSB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxBY2Nlc3NvciA9IG1vZGVsQWNjZXNzb3I7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYmluZDxUPih2aXNpdG9yOiBJVmlzaXRvcjxUPikge1xyXG4gICAgICAgICAgICBjb25zdFxyXG4gICAgICAgICAgICAgICAgYmluZGluZ3MgPSB0aGlzLl9jaGlsZHJlbi5tYXAoeCA9PiB4LmJpbmQodmlzaXRvcikpLFxyXG4gICAgICAgICAgICAgICAgdGFnQmluZGluZyA9IHZpc2l0b3IudGFnKHRoaXMubmFtZSwgdGhpcy5ucywgdGhpcy5hdHRyaWJ1dGVzLCBiaW5kaW5ncyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFnQmluZGluZztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7XHJcbiAgICBUZW1wbGF0ZSBhcyB0XHJcbn0iXX0=