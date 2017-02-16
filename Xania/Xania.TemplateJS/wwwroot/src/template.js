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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUEsSUFBYyxRQUFRLENBMkZyQjtBQTNGRCxXQUFjLFFBQVE7SUFZbEI7UUFDSSxzQkFBb0IsR0FBNEM7WUFBNUMsUUFBRyxHQUFILEdBQUcsQ0FBeUM7UUFDaEUsQ0FBQztRQUVELDJCQUFJLEdBQUosVUFBUSxPQUFvQjtZQUN4QixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUNMLG1CQUFDO0lBQUQsQ0FBQyxBQVBELElBT0M7SUFQWSxxQkFBWSxlQU94QixDQUFBO0lBRUQ7UUFHSSwwQkFBb0IsSUFBSTtZQUFKLFNBQUksR0FBSixJQUFJLENBQUE7WUFGaEIsYUFBUSxHQUFZLEVBQUUsQ0FBQztRQUVILENBQUM7UUFFN0IsZ0NBQUssR0FBTCxVQUFNLEtBQVk7WUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCwrQkFBSSxHQUFKLFVBQVEsT0FBb0I7WUFDeEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUNMLHVCQUFDO0lBQUQsQ0FBQyxBQWJELElBYUM7SUFiWSx5QkFBZ0IsbUJBYTVCLENBQUE7SUFFRDtRQU1JLHFCQUFtQixJQUFZLEVBQVUsRUFBVSxFQUFVLFNBQXVCO1lBQXZCLDBCQUFBLEVBQUEsY0FBdUI7WUFBakUsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUFVLE9BQUUsR0FBRixFQUFFLENBQVE7WUFBVSxjQUFTLEdBQVQsU0FBUyxDQUFjO1lBTDVFLGVBQVUsR0FBNEIsRUFBRSxDQUFDO1lBQ3pDLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBZSxDQUFDO1FBS3hDLENBQUM7UUFFTSw4QkFBUSxHQUFmO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDMUIsQ0FBQztRQUVNLDBCQUFJLEdBQVgsVUFBWSxJQUFZLEVBQUUsSUFBUztZQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVNLGtDQUFZLEdBQW5CLFVBQW9CLElBQVksRUFBRSxJQUFTO1lBQ3ZDLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ04sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVNLGtDQUFZLEdBQW5CLFVBQW9CLElBQVk7WUFDNUIsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzdCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7b0JBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDcEIsQ0FBQztZQUNELE1BQU0sQ0FBQyxTQUFTLENBQUM7UUFDckIsQ0FBQztRQUVNLDhCQUFRLEdBQWYsVUFBZ0IsSUFBSSxFQUFFLFFBQVE7WUFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFTSw4QkFBUSxHQUFmLFVBQWdCLEtBQVk7WUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRU0sNEJBQU0sR0FBYixVQUFjLGFBQWE7WUFDdkIsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7WUFDbkMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsMEJBQUksR0FBSixVQUFRLE9BQW9CO1lBQ3hCLElBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBZixDQUFlLENBQUMsQ0FBQztZQUMxRCxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRTVFLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDdEIsQ0FBQztRQUNMLGtCQUFDO0lBQUQsQ0FBQyxBQXRERCxJQXNEQztJQXREWSxvQkFBVyxjQXNEdkIsQ0FBQTtBQUNMLENBQUMsRUEzRmEsUUFBUSxHQUFSLGdCQUFRLEtBQVIsZ0JBQVEsUUEyRnJCO0FBR2UscUJBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb3JlIH0gZnJvbSBcIi4vY29yZVwiXHJcblxyXG5leHBvcnQgbW9kdWxlIFRlbXBsYXRlIHtcclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElWaXNpdG9yPFQ+IHtcclxuICAgICAgICB0ZXh0KGV4cHIpOiBUO1xyXG4gICAgICAgIGNvbnRlbnQoZXhwciwgY2hpbGRyZW46IElOb2RlW10pOiBUO1xyXG4gICAgICAgIHRhZyhuYW1lLCBucywgYXR0cnMsIGNoaWxkcmVuKTogVDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElOb2RlIHtcclxuICAgICAgICBiaW5kPFQ+KHZpc2l0b3I6IElWaXNpdG9yPFQ+KTogVDtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGV4dFRlbXBsYXRlIGltcGxlbWVudHMgSU5vZGUge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdHBsOiB7IGV4ZWN1dGUoYmluZGluZywgY29udGV4dCk7IH0gfCBzdHJpbmcpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJpbmQ8VD4odmlzaXRvcjogSVZpc2l0b3I8VD4pOiBUIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IudGV4dCh0aGlzLnRwbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBGcmFnbWVudFRlbXBsYXRlIGltcGxlbWVudHMgSU5vZGUge1xyXG4gICAgICAgIHByaXZhdGUgY2hpbGRyZW46IElOb2RlW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBleHByKSB7IH1cclxuXHJcbiAgICAgICAgY2hpbGQoY2hpbGQ6IElOb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYmluZDxUPih2aXNpdG9yOiBJVmlzaXRvcjxUPik6IFQge1xyXG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci5jb250ZW50KHRoaXMuZXhwciwgdGhpcy5jaGlsZHJlbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUYWdUZW1wbGF0ZSBpbXBsZW1lbnRzIElOb2RlIHtcclxuICAgICAgICBwcml2YXRlIGF0dHJpYnV0ZXM6IHsgbmFtZTogc3RyaW5nOyB0cGwgfVtdID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBldmVudHMgPSBuZXcgTWFwPHN0cmluZywgYW55PigpO1xyXG4gICAgICAgIC8vIFJlU2hhcnBlciBkaXNhYmxlIG9uY2UgSW5jb25zaXN0ZW50TmFtaW5nXHJcbiAgICAgICAgcHVibGljIG1vZGVsQWNjZXNzb3I7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHByaXZhdGUgbnM6IHN0cmluZywgcHJpdmF0ZSBfY2hpbGRyZW46IElOb2RlW10gPSBbXSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGNoaWxkcmVuKCk6IElOb2RlW10ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYXR0cihuYW1lOiBzdHJpbmcsIGV4cHI6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGRBdHRyaWJ1dGUobmFtZSwgZXhwcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWRkQXR0cmlidXRlKG5hbWU6IHN0cmluZywgZXhwcjogYW55KSB7XHJcbiAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5nZXRBdHRyaWJ1dGUobmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghYXR0cilcclxuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlcy5wdXNoKHsgbmFtZTogbmFtZS50b0xvd2VyQ2FzZSgpLCB0cGw6IGV4cHIgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIGdldEF0dHJpYnV0ZShuYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gdGhpcy5hdHRyaWJ1dGVzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGF0dHIubmFtZSA9PT0ga2V5KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhdHRyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgYWRkRXZlbnQobmFtZSwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHMuc2V0KG5hbWUsIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHB1YmxpYyBhZGRDaGlsZChjaGlsZDogSU5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5fY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHVibGljIHNlbGVjdChtb2RlbEFjY2Vzc29yKSB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxBY2Nlc3NvciA9IG1vZGVsQWNjZXNzb3I7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYmluZDxUPih2aXNpdG9yOiBJVmlzaXRvcjxUPikge1xyXG4gICAgICAgICAgICBjb25zdCBiaW5kaW5ncyA9IHRoaXMuX2NoaWxkcmVuLm1hcCh4ID0+IHguYmluZCh2aXNpdG9yKSk7XHJcbiAgICAgICAgICAgIHZhciB0YWdCaW5kaW5nID0gdmlzaXRvci50YWcodGhpcy5uYW1lLCB0aGlzLm5zLCB0aGlzLmF0dHJpYnV0ZXMsIGJpbmRpbmdzKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWdCaW5kaW5nO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHtcclxuICAgIFRlbXBsYXRlIGFzIHRcclxufSJdfQ==