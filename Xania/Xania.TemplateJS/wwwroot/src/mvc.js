"use strict";
var observables_1 = require("./observables");
var UrlHelper = (function () {
    function UrlHelper(appPath, actionPath, appInstance) {
        var _this = this;
        this.appPath = appPath;
        this.appInstance = appInstance;
        this.observers = [];
        this.actionPath = new observables_1.Observables.Observable(actionPath);
        this.initialPath = actionPath;
        window.onpopstate = function (popStateEvent) {
            var state = popStateEvent.state;
            var pathname = window.location.pathname;
            if (state && pathname.startsWith(_this.appPath + "/")) {
                var actionPath = pathname.substring(_this.appPath.length + 1);
                if (state.actionPath !== actionPath)
                    console.error(actionPath, state);
                if (actionPath !== _this.actionPath.current)
                    _this.actionPath.notify(actionPath);
            }
        };
    }
    UrlHelper.prototype.action = function (path, view) {
        var _this = this;
        return function (event) {
            var actionPath = path;
            var actionView = view;
            if (_this.actionPath.current !== actionPath) {
                var action = { actionPath: actionPath, actionView: actionView };
                window.history.pushState(action, "", _this.appPath + "/" + actionPath);
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
var ViewResult = (function () {
    function ViewResult(view, model) {
        this.view = view;
        this.model = model;
    }
    ViewResult.prototype.execute = function (driver, visitor) {
        var binding = this.view.bind(visitor);
        return binding.update2(this.model, driver).execute();
    };
    return ViewResult;
}());
exports.ViewResult = ViewResult;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXZjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXZjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw2Q0FBMkM7QUFFM0M7SUFLSSxtQkFBb0IsT0FBTyxFQUFFLFVBQVUsRUFBVSxXQUFXO1FBQTVELGlCQWtCQztRQWxCbUIsWUFBTyxHQUFQLE9BQU8sQ0FBQTtRQUFzQixnQkFBVyxHQUFYLFdBQVcsQ0FBQTtRQUpyRCxjQUFTLEdBQUcsRUFBRSxDQUFDO1FBS2xCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBUyxVQUFVLENBQUMsQ0FBQztRQUNqRSxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUU5QixNQUFNLENBQUMsVUFBVSxHQUFHLFVBQUMsYUFBYTtZQUN4QixJQUFBLDJCQUFLLENBQW1CO1lBQ3hCLElBQUEsbUNBQVEsQ0FBcUI7WUFFbkMsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELElBQUksVUFBVSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBRTdELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLEtBQUssVUFBVSxDQUFDO29CQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFckMsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLEtBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO29CQUN2QyxLQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMzQyxDQUFDO1FBQ0wsQ0FBQyxDQUFBO0lBQ0wsQ0FBQztJQUVELDBCQUFNLEdBQU4sVUFBTyxJQUFZLEVBQUUsSUFBSztRQUEx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QyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDekQsQ0FBQztJQUNMLGlCQUFDO0FBQUQsQ0FBQyxBQVBELElBT0M7QUFQWSxnQ0FBVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4vb2JzZXJ2YWJsZXNcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFVybEhlbHBlciB7XHJcbiAgICBwdWJsaWMgb2JzZXJ2ZXJzID0gW107XHJcbiAgICBwdWJsaWMgYWN0aW9uUGF0aDogT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZTxzdHJpbmc+O1xyXG4gICAgcHJpdmF0ZSBpbml0aWFsUGF0aDogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYXBwUGF0aCwgYWN0aW9uUGF0aCwgcHJpdmF0ZSBhcHBJbnN0YW5jZSkge1xyXG4gICAgICAgIHRoaXMuYWN0aW9uUGF0aCA9IG5ldyBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlPHN0cmluZz4oYWN0aW9uUGF0aCk7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsUGF0aCA9IGFjdGlvblBhdGg7XHJcblxyXG4gICAgICAgIHdpbmRvdy5vbnBvcHN0YXRlID0gKHBvcFN0YXRlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgdmFyIHsgc3RhdGUgfSA9IHBvcFN0YXRlRXZlbnQ7XHJcbiAgICAgICAgICAgIHZhciB7IHBhdGhuYW1lIH0gPSB3aW5kb3cubG9jYXRpb247XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RhdGUgJiYgcGF0aG5hbWUuc3RhcnRzV2l0aCh0aGlzLmFwcFBhdGggKyBcIi9cIikpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhY3Rpb25QYXRoID0gcGF0aG5hbWUuc3Vic3RyaW5nKHRoaXMuYXBwUGF0aC5sZW5ndGggKyAxKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUuYWN0aW9uUGF0aCAhPT0gYWN0aW9uUGF0aClcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGFjdGlvblBhdGgsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoYWN0aW9uUGF0aCAhPT0gdGhpcy5hY3Rpb25QYXRoLmN1cnJlbnQpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25QYXRoLm5vdGlmeShhY3Rpb25QYXRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhY3Rpb24ocGF0aDogc3RyaW5nLCB2aWV3Pykge1xyXG4gICAgICAgIHJldHVybiBldmVudCA9PiB7XHJcbiAgICAgICAgICAgIHZhciBhY3Rpb25QYXRoID0gcGF0aDtcclxuICAgICAgICAgICAgdmFyIGFjdGlvblZpZXcgPSB2aWV3O1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hY3Rpb25QYXRoLmN1cnJlbnQgIT09IGFjdGlvblBhdGgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSB7IGFjdGlvblBhdGgsIGFjdGlvblZpZXcgfTtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShhY3Rpb24sIFwiXCIsIHRoaXMuYXBwUGF0aCArIFwiL1wiICsgYWN0aW9uUGF0aCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGlvblBhdGgubm90aWZ5KGFjdGlvblBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEh0bWxIZWxwZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbG9hZGVyOiB7IGltcG9ydChwYXRoOiBzdHJpbmcpOyB9KSB7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHBhcnRpYWwodmlld1BhdGg6IHN0cmluZykge1xyXG4gICAgICAgIHZhciB2aWV3ID0gdGhpcy5sb2FkZXIuaW1wb3J0KHZpZXdQYXRoKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBiaW5kKHZpc2l0b3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVmlld0JpbmRpbmcodmlzaXRvciwgdmlldywge30pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBWaWV3QmluZGluZyB7XHJcbiAgICBwcml2YXRlIGJpbmRpbmc7XHJcbiAgICBwcml2YXRlIGNhbmNlbGxhdGlvblRva2VuOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB2aXNpdG9yLCBwcml2YXRlIHZpZXcsIHByaXZhdGUgbW9kZWwpIHtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGUoY29udGV4dCwgcGFyZW50KSB7XHJcblxyXG4gICAgICAgIGlmICghdGhpcy52aWV3KVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ2aWV3IGlzIGVtcHR5XCIpO1xyXG5cclxuICAgICAgICB2YXIgY2FuY2VsbGF0aW9uVG9rZW4gPSBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICAgIHRoaXMuY2FuY2VsbGF0aW9uVG9rZW4gPSBjYW5jZWxsYXRpb25Ub2tlbjtcclxuICAgICAgICB0aGlzLnZpZXcudGhlbihhcHAgPT4ge1xyXG4gICAgICAgICAgICBpZiAoY2FuY2VsbGF0aW9uVG9rZW4gPT09IHRoaXMuY2FuY2VsbGF0aW9uVG9rZW4pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5iaW5kaW5nID0gYXBwLmJpbmQoY29udGV4dCwgcGFyZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYmluZGluZykge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmRpbmcuZGlzcG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJRHJpdmVyIHtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBWaWV3UmVzdWx0IHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdmlldywgcHJpdmF0ZSBtb2RlbD8pIHsgfVxyXG5cclxuICAgIGV4ZWN1dGUoZHJpdmVyOiBJRHJpdmVyLCB2aXNpdG9yKSB7XHJcbiAgICAgICAgdmFyIGJpbmRpbmcgPSB0aGlzLnZpZXcuYmluZCh2aXNpdG9yKTtcclxuICAgICAgICByZXR1cm4gYmluZGluZy51cGRhdGUyKHRoaXMubW9kZWwsIGRyaXZlcikuZXhlY3V0ZSgpO1xyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=