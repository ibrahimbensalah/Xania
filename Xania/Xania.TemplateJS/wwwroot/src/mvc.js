"use strict";
var observables_1 = require("./observables");
var UrlHelper = (function () {
    function UrlHelper(appName, actionPath, appInstance) {
        var _this = this;
        this.appName = appName;
        this.appInstance = appInstance;
        this.observers = [];
        this.actionPath = new observables_1.Observables.Observable(actionPath);
        this.initialPath = actionPath;
        window.onpopstate = function (popStateEvent) {
            var state = popStateEvent.state;
            var actionPath = state ? state.actionPath : _this.initialPath;
            if (actionPath !== _this.actionPath.current)
                _this.actionPath.notify(actionPath);
        };
    }
    UrlHelper.prototype.route = function (mapper) {
        var _this = this;
        return this.actionPath.map(function (path) {
            if (_this.appInstance && path in _this.appInstance)
                return _this.appInstance[path](_this);
            else
                return mapper(path);
        });
    };
    UrlHelper.prototype.action = function (path, view) {
        var _this = this;
        return function (event) {
            var actionPath = path;
            var actionView = view;
            if (_this.actionPath.current !== actionPath) {
                var action = { actionPath: actionPath, actionView: actionView };
                window.history.pushState(action, "", _this.appName + "/" + actionPath);
                _this.actionPath.notify(actionPath);
            }
            event.preventDefault();
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
            bind: function (visitor) {
                return new ViewBinding(visitor, view, {});
            }
        };
    };
    return HtmlHelper;
}());
exports.HtmlHelper = HtmlHelper;
var ViewBinding = (function () {
    function ViewBinding(visitor, view, model) {
        this.visitor = visitor;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXZjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXZjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw2Q0FBMkM7QUFFM0M7SUFLSSxtQkFBb0IsT0FBTyxFQUFFLFVBQVUsRUFBVSxXQUFXO1FBQTVELGlCQVVDO1FBVm1CLFlBQU8sR0FBUCxPQUFPLENBQUE7UUFBc0IsZ0JBQVcsR0FBWCxXQUFXLENBQUE7UUFKckQsY0FBUyxHQUFHLEVBQUUsQ0FBQztRQUtsQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQVMsVUFBVSxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFFOUIsTUFBTSxDQUFDLFVBQVUsR0FBRyxVQUFDLGFBQWE7WUFDeEIsSUFBQSwyQkFBSyxDQUFtQjtZQUM5QixJQUFJLFVBQVUsR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFJLENBQUMsV0FBVyxDQUFDO1lBQzdELEVBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBSyxLQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQztnQkFDdkMsS0FBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFBO0lBQ0wsQ0FBQztJQUVELHlCQUFLLEdBQUwsVUFBUyxNQUFxQjtRQUE5QixpQkFPQztRQU5HLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFBLElBQUk7WUFDM0IsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLElBQUksS0FBSSxDQUFDLFdBQVcsQ0FBQztnQkFDN0MsTUFBTSxDQUFDLEtBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSSxDQUFDLENBQUM7WUFDeEMsSUFBSTtnQkFDQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELDBCQUFNLEdBQU4sVUFBTyxJQUFZLEVBQUUsSUFBSztRQUExQixpQkFXQztRQVZHLE1BQU0sQ0FBQyxVQUFDLEtBQUs7WUFDVCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUM7WUFDdEIsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLEVBQUUsQ0FBQyxDQUFDLEtBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLElBQUksTUFBTSxHQUFHLEVBQUUsVUFBVSxZQUFBLEVBQUUsVUFBVSxZQUFBLEVBQUUsQ0FBQztnQkFDeEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxLQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsR0FBRyxVQUFVLENBQUMsQ0FBQztnQkFDdEUsS0FBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUNELEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUM7SUFDTixDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBdENELElBc0NDO0FBdENZLDhCQUFTO0FBd0N0QjtJQUVJLG9CQUFvQixNQUFpQztRQUFqQyxXQUFNLEdBQU4sTUFBTSxDQUEyQjtJQUVyRCxDQUFDO0lBRUQsNEJBQU8sR0FBUCxVQUFRLFFBQWdCO1FBQ3BCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hDLE1BQU0sQ0FBQztZQUNILElBQUksWUFBQyxPQUFPO2dCQUNSLE1BQU0sQ0FBQyxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzlDLENBQUM7U0FDSixDQUFBO0lBQ0wsQ0FBQztJQUNMLGlCQUFDO0FBQUQsQ0FBQyxBQWRELElBY0M7QUFkWSxnQ0FBVTtBQWlCdkI7SUFJSSxxQkFBb0IsT0FBTyxFQUFVLElBQUksRUFBVSxLQUFLO1FBQXBDLFlBQU8sR0FBUCxPQUFPLENBQUE7UUFBVSxTQUFJLEdBQUosSUFBSSxDQUFBO1FBQVUsVUFBSyxHQUFMLEtBQUssQ0FBQTtJQUN4RCxDQUFDO0lBRUQsNEJBQU0sR0FBTixVQUFPLE9BQU8sRUFBRSxNQUFNO1FBQXRCLGlCQWFDO1FBWEcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ1gsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUVyQyxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7UUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBQSxHQUFHO1lBQ2QsRUFBRSxDQUFDLENBQUMsaUJBQWlCLEtBQUssS0FBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztnQkFDL0MsS0FBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNmLEtBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELDZCQUFPLEdBQVA7UUFDSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQztJQUNMLENBQUM7SUFDTCxrQkFBQztBQUFELENBQUMsQUEzQkQsSUEyQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuL29ic2VydmFibGVzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBVcmxIZWxwZXIge1xyXG4gICAgcHVibGljIG9ic2VydmVycyA9IFtdO1xyXG4gICAgcHJpdmF0ZSBhY3Rpb25QYXRoOiBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlPHN0cmluZz47XHJcbiAgICBwcml2YXRlIGluaXRpYWxQYXRoOiBzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHBOYW1lLCBhY3Rpb25QYXRoLCBwcml2YXRlIGFwcEluc3RhbmNlKSB7XHJcbiAgICAgICAgdGhpcy5hY3Rpb25QYXRoID0gbmV3IE9ic2VydmFibGVzLk9ic2VydmFibGU8c3RyaW5nPihhY3Rpb25QYXRoKTtcclxuICAgICAgICB0aGlzLmluaXRpYWxQYXRoID0gYWN0aW9uUGF0aDtcclxuXHJcbiAgICAgICAgd2luZG93Lm9ucG9wc3RhdGUgPSAocG9wU3RhdGVFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgeyBzdGF0ZSB9ID0gcG9wU3RhdGVFdmVudDtcclxuICAgICAgICAgICAgdmFyIGFjdGlvblBhdGggPSBzdGF0ZSA/IHN0YXRlLmFjdGlvblBhdGggOiB0aGlzLmluaXRpYWxQYXRoO1xyXG4gICAgICAgICAgICBpZiAoYWN0aW9uUGF0aCAhPT0gdGhpcy5hY3Rpb25QYXRoLmN1cnJlbnQpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvblBhdGgubm90aWZ5KGFjdGlvblBhdGgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByb3V0ZTxUPihtYXBwZXI6IChzdHJpbmcpID0+IFQpOiBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlPFQ+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hY3Rpb25QYXRoLm1hcChwYXRoID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYXBwSW5zdGFuY2UgJiYgcGF0aCBpbiB0aGlzLmFwcEluc3RhbmNlKSBcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFwcEluc3RhbmNlW3BhdGhdKHRoaXMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwcGVyKHBhdGgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFjdGlvbihwYXRoOiBzdHJpbmcsIHZpZXc/KSB7XHJcbiAgICAgICAgcmV0dXJuIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9uUGF0aCA9IHBhdGg7XHJcbiAgICAgICAgICAgIHZhciBhY3Rpb25WaWV3ID0gdmlldztcclxuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aW9uUGF0aC5jdXJyZW50ICE9PSBhY3Rpb25QYXRoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWN0aW9uID0geyBhY3Rpb25QYXRoLCBhY3Rpb25WaWV3IH07XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUoYWN0aW9uLCBcIlwiLCB0aGlzLmFwcE5hbWUgKyBcIi9cIiArIGFjdGlvblBhdGgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25QYXRoLm5vdGlmeShhY3Rpb25QYXRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBIdG1sSGVscGVyIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGxvYWRlcjogeyBpbXBvcnQocGF0aDogc3RyaW5nKTsgfSkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwYXJ0aWFsKHZpZXdQYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICB2YXIgdmlldyA9IHRoaXMubG9hZGVyLmltcG9ydCh2aWV3UGF0aCk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgYmluZCh2aXNpdG9yKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFZpZXdCaW5kaW5nKHZpc2l0b3IsIHZpZXcsIHt9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbmNsYXNzIFZpZXdCaW5kaW5nIHtcclxuICAgIHByaXZhdGUgYmluZGluZztcclxuICAgIHByaXZhdGUgY2FuY2VsbGF0aW9uVG9rZW46IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZpc2l0b3IsIHByaXZhdGUgdmlldywgcHJpdmF0ZSBtb2RlbCkge1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShjb250ZXh0LCBwYXJlbnQpIHtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnZpZXcpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInZpZXcgaXMgZW1wdHlcIik7XHJcblxyXG4gICAgICAgIHZhciBjYW5jZWxsYXRpb25Ub2tlbiA9IE1hdGgucmFuZG9tKCk7XHJcbiAgICAgICAgdGhpcy5jYW5jZWxsYXRpb25Ub2tlbiA9IGNhbmNlbGxhdGlvblRva2VuO1xyXG4gICAgICAgIHRoaXMudmlldy50aGVuKGFwcCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChjYW5jZWxsYXRpb25Ub2tlbiA9PT0gdGhpcy5jYW5jZWxsYXRpb25Ub2tlbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJpbmRpbmcgPSBhcHAuYmluZChjb250ZXh0LCBwYXJlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5iaW5kaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmluZGluZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=