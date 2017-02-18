"use strict";
var observables_1 = require("./observables");
var UrlHelper = (function () {
    function UrlHelper(appName, actionPath) {
        this.appName = appName;
        this.observers = [];
        this.actionPath = new observables_1.Observables.Observable(actionPath);
    }
    UrlHelper.prototype.map = function (mapper) {
        return this.actionPath.map(mapper);
    };
    UrlHelper.prototype.action = function (path) {
        var _this = this;
        return function (event) {
            if (_this.actionPath.current !== path) {
                var options = {};
                window.history.pushState(options, "", _this.appName + "/" + path);
                _this.actionPath.notify(path);
            }
            event.preventDefault();
            event.stopPropagation();
        };
    };
    return UrlHelper;
}());
exports.UrlHelper = UrlHelper;
var HtmlHelper = (function () {
    function HtmlHelper(loader) {
        this.loader = loader;
    }
    HtmlHelper.prototype.partial = function (viewPath) {
        var view = this.loader.import(viewPath);
        return {
            bind: function (parent) {
                return new ViewBinding(view, {});
            }
        };
    };
    return HtmlHelper;
}());
exports.HtmlHelper = HtmlHelper;
var ViewBinding = (function () {
    function ViewBinding(view, model) {
        this.view = view;
        this.model = model;
    }
    ViewBinding.prototype.update = function (context, parent) {
        var _this = this;
        if (!this.view)
            throw new Error("view is empty");
        var cancellationToken = Math.random();
        this.cancellationToken = cancellationToken;
        this.view.then(function (app) {
            if (cancellationToken === _this.cancellationToken) {
                _this.dispose();
                _this.binding = app.bind(context, parent);
            }
        });
    };
    ViewBinding.prototype.dispose = function () {
        if (this.binding) {
            this.binding.dispose();
        }
    };
    return ViewBinding;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXZjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXZjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw2Q0FBMkM7QUFFM0M7SUFJSSxtQkFBb0IsT0FBTyxFQUFFLFVBQVU7UUFBbkIsWUFBTyxHQUFQLE9BQU8sQ0FBQTtRQUhwQixjQUFTLEdBQUcsRUFBRSxDQUFDO1FBSWxCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBUyxVQUFVLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsdUJBQUcsR0FBSCxVQUFPLE1BQXFCO1FBQ3hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQsMEJBQU0sR0FBTixVQUFPLElBQVk7UUFBbkIsaUJBVUM7UUFURyxNQUFNLENBQUMsVUFBQyxLQUFLO1lBQ1QsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNqQixNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLEtBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDO2dCQUNqRSxLQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQyxDQUFDO1lBQ0QsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUM1QixDQUFDLENBQUM7SUFDTixDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBdkJELElBdUJDO0FBdkJZLDhCQUFTO0FBeUJ0QjtJQUVJLG9CQUFvQixNQUFpQztRQUFqQyxXQUFNLEdBQU4sTUFBTSxDQUEyQjtJQUVyRCxDQUFDO0lBRUQsNEJBQU8sR0FBUCxVQUFRLFFBQWdCO1FBQ3BCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sQ0FBQztZQUNILElBQUksWUFBQyxNQUFNO2dCQUNQLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDckMsQ0FBQztTQUNKLENBQUE7SUFDTCxDQUFDO0lBQ0wsaUJBQUM7QUFBRCxDQUFDLEFBZEQsSUFjQztBQWRZLGdDQUFVO0FBaUJ2QjtJQUlJLHFCQUFvQixJQUFJLEVBQVUsS0FBSztRQUFuQixTQUFJLEdBQUosSUFBSSxDQUFBO1FBQVUsVUFBSyxHQUFMLEtBQUssQ0FBQTtJQUN2QyxDQUFDO0lBRUQsNEJBQU0sR0FBTixVQUFPLE9BQU8sRUFBRSxNQUFNO1FBQXRCLGlCQWFDO1FBWEcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ1gsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUVyQyxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7UUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBQSxHQUFHO1lBQ2QsRUFBRSxDQUFDLENBQUMsaUJBQWlCLEtBQUssS0FBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDL0MsS0FBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLEtBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELDZCQUFPLEdBQVA7UUFDSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQztJQUNMLENBQUM7SUFDTCxrQkFBQztBQUFELENBQUMsQUEzQkQsSUEyQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuL29ic2VydmFibGVzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBVcmxIZWxwZXIge1xyXG4gICAgcHVibGljIG9ic2VydmVycyA9IFtdO1xyXG4gICAgcHJpdmF0ZSBhY3Rpb25QYXRoOiBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlPHN0cmluZz47XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHBOYW1lLCBhY3Rpb25QYXRoKSB7XHJcbiAgICAgICAgdGhpcy5hY3Rpb25QYXRoID0gbmV3IE9ic2VydmFibGVzLk9ic2VydmFibGU8c3RyaW5nPihhY3Rpb25QYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBtYXA8VD4obWFwcGVyOiAoc3RyaW5nKSA9PiBUKTogT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZTxUPiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWN0aW9uUGF0aC5tYXAobWFwcGVyKTtcclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24ocGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgcmV0dXJuIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25QYXRoLmN1cnJlbnQgIT09IHBhdGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0ge307XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUob3B0aW9ucywgXCJcIiwgdGhpcy5hcHBOYW1lICsgXCIvXCIgKyBwYXRoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uUGF0aC5ub3RpZnkocGF0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEh0bWxIZWxwZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbG9hZGVyOiB7IGltcG9ydChwYXRoOiBzdHJpbmcpOyB9KSB7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgcGFydGlhbCh2aWV3UGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgdmFyIHZpZXcgPSB0aGlzLmxvYWRlci5pbXBvcnQodmlld1BhdGgpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGJpbmQocGFyZW50KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFZpZXdCaW5kaW5nKHZpZXcsIHt9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbmNsYXNzIFZpZXdCaW5kaW5nIHtcclxuICAgIHByaXZhdGUgYmluZGluZztcclxuICAgIHByaXZhdGUgY2FuY2VsbGF0aW9uVG9rZW46IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZpZXcsIHByaXZhdGUgbW9kZWwpIHtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoY29udGV4dCwgcGFyZW50KSB7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy52aWV3KVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ2aWV3IGlzIGVtcHR5XCIpO1xyXG5cclxuICAgICAgICB2YXIgY2FuY2VsbGF0aW9uVG9rZW4gPSBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICAgIHRoaXMuY2FuY2VsbGF0aW9uVG9rZW4gPSBjYW5jZWxsYXRpb25Ub2tlbjtcclxuICAgICAgICB0aGlzLnZpZXcudGhlbihhcHAgPT4ge1xyXG4gICAgICAgICAgICBpZiAoY2FuY2VsbGF0aW9uVG9rZW4gPT09IHRoaXMuY2FuY2VsbGF0aW9uVG9rZW4pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kaW5nID0gYXBwLmJpbmQoY29udGV4dCwgcGFyZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYmluZGluZykge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmRpbmcuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuIl19