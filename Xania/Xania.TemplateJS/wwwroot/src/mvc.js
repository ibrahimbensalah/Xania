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
            var prevpath = _this.appPath + "/" + _this.actionPath.current;
            if (prevpath !== pathname) {
                var actionPath = state ? state.actionPath : _this.initialPath;
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
        return binding.update(this.model, driver);
    };
    return ViewResult;
}());
exports.ViewResult = ViewResult;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXZjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXZjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw2Q0FBMkM7QUFFM0M7SUFLSSxtQkFBb0IsT0FBTyxFQUFFLFVBQVUsRUFBVSxXQUFXO1FBQTVELGlCQWNDO1FBZG1CLFlBQU8sR0FBUCxPQUFPLENBQUE7UUFBc0IsZ0JBQVcsR0FBWCxXQUFXLENBQUE7UUFKckQsY0FBUyxHQUFHLEVBQUUsQ0FBQztRQUtsQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUkseUJBQVcsQ0FBQyxVQUFVLENBQVMsVUFBVSxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7UUFFOUIsTUFBTSxDQUFDLFVBQVUsR0FBRyxVQUFDLGFBQWE7WUFDeEIsSUFBQSwyQkFBSyxDQUFtQjtZQUN4QixJQUFBLG1DQUFRLENBQXFCO1lBQ25DLElBQUksUUFBUSxHQUFHLEtBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxHQUFHLEtBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO1lBQzVELEVBQUUsQ0FBQyxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixJQUFJLFVBQVUsR0FBRyxLQUFLLEdBQUcsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFJLENBQUMsV0FBVyxDQUFDO2dCQUM3RCxFQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUssS0FBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUM7b0JBQ3ZDLEtBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNDLENBQUM7UUFDTCxDQUFDLENBQUE7SUFDTCxDQUFDO0lBRUQsMEJBQU0sR0FBTixVQUFPLElBQVksRUFBRSxJQUFLO1FBQTFCLGlCQVdDO1FBVkcsTUFBTSxDQUFDLFVBQUEsS0FBSztZQUNSLElBQUksVUFBVSxHQUFHLElBQUksQ0FBQztZQUN0QixJQUFJLFVBQVUsR0FBRyxJ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QUFDLEFBUEQsSUFPQztBQVBZLGdDQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi9vYnNlcnZhYmxlc1wiXHJcblxyXG5leHBvcnQgY2xhc3MgVXJsSGVscGVyIHtcclxuICAgIHB1YmxpYyBvYnNlcnZlcnMgPSBbXTtcclxuICAgIHB1YmxpYyBhY3Rpb25QYXRoOiBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlPHN0cmluZz47XHJcbiAgICBwcml2YXRlIGluaXRpYWxQYXRoOiBzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHBQYXRoLCBhY3Rpb25QYXRoLCBwcml2YXRlIGFwcEluc3RhbmNlKSB7XHJcbiAgICAgICAgdGhpcy5hY3Rpb25QYXRoID0gbmV3IE9ic2VydmFibGVzLk9ic2VydmFibGU8c3RyaW5nPihhY3Rpb25QYXRoKTtcclxuICAgICAgICB0aGlzLmluaXRpYWxQYXRoID0gYWN0aW9uUGF0aDtcclxuXHJcbiAgICAgICAgd2luZG93Lm9ucG9wc3RhdGUgPSAocG9wU3RhdGVFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgeyBzdGF0ZSB9ID0gcG9wU3RhdGVFdmVudDtcclxuICAgICAgICAgICAgdmFyIHsgcGF0aG5hbWUgfSA9IHdpbmRvdy5sb2NhdGlvbjtcclxuICAgICAgICAgICAgdmFyIHByZXZwYXRoID0gdGhpcy5hcHBQYXRoICsgXCIvXCIgKyB0aGlzLmFjdGlvblBhdGguY3VycmVudDtcclxuICAgICAgICAgICAgaWYgKHByZXZwYXRoICE9PSBwYXRobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvblBhdGggPSBzdGF0ZSA/IHN0YXRlLmFjdGlvblBhdGggOiB0aGlzLmluaXRpYWxQYXRoO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvblBhdGggIT09IHRoaXMuYWN0aW9uUGF0aC5jdXJyZW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uUGF0aC5ub3RpZnkoYWN0aW9uUGF0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWN0aW9uKHBhdGg6IHN0cmluZywgdmlldz8pIHtcclxuICAgICAgICByZXR1cm4gZXZlbnQgPT4ge1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9uUGF0aCA9IHBhdGg7XHJcbiAgICAgICAgICAgIHZhciBhY3Rpb25WaWV3ID0gdmlldztcclxuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aW9uUGF0aC5jdXJyZW50ICE9PSBhY3Rpb25QYXRoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWN0aW9uID0geyBhY3Rpb25QYXRoLCBhY3Rpb25WaWV3IH07XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUoYWN0aW9uLCBcIlwiLCB0aGlzLmFwcFBhdGggKyBcIi9cIiArIGFjdGlvblBhdGgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25QYXRoLm5vdGlmeShhY3Rpb25QYXRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBIdG1sSGVscGVyIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGxvYWRlcjogeyBpbXBvcnQocGF0aDogc3RyaW5nKTsgfSkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwYXJ0aWFsKHZpZXdQYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICB2YXIgdmlldyA9IHRoaXMubG9hZGVyLmltcG9ydCh2aWV3UGF0aCk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgYmluZCh2aXNpdG9yKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFZpZXdCaW5kaW5nKHZpc2l0b3IsIHZpZXcsIHt9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgVmlld0JpbmRpbmcge1xyXG4gICAgcHJpdmF0ZSBiaW5kaW5nO1xyXG4gICAgcHJpdmF0ZSBjYW5jZWxsYXRpb25Ub2tlbjogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgdmlzaXRvciwgcHJpdmF0ZSB2aWV3LCBwcml2YXRlIG1vZGVsKSB7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlKGNvbnRleHQsIHBhcmVudCkge1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMudmlldylcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidmlldyBpcyBlbXB0eVwiKTtcclxuXHJcbiAgICAgICAgdmFyIGNhbmNlbGxhdGlvblRva2VuID0gTWF0aC5yYW5kb20oKTtcclxuICAgICAgICB0aGlzLmNhbmNlbGxhdGlvblRva2VuID0gY2FuY2VsbGF0aW9uVG9rZW47XHJcbiAgICAgICAgdGhpcy52aWV3LnRoZW4oYXBwID0+IHtcclxuICAgICAgICAgICAgaWYgKGNhbmNlbGxhdGlvblRva2VuID09PSB0aGlzLmNhbmNlbGxhdGlvblRva2VuKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYmluZGluZyA9IGFwcC5iaW5kKGNvbnRleHQsIHBhcmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmJpbmRpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy5iaW5kaW5nLmRpc3Bvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSURyaXZlciB7XHJcbiAgICBcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFZpZXdSZXN1bHQge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB2aWV3LCBwcml2YXRlIG1vZGVsPykgeyB9XHJcblxyXG4gICAgZXhlY3V0ZShkcml2ZXI6IElEcml2ZXIsIHZpc2l0b3IpIHtcclxuICAgICAgICB2YXIgYmluZGluZyA9IHRoaXMudmlldy5iaW5kKHZpc2l0b3IpO1xyXG4gICAgICAgIHJldHVybiBiaW5kaW5nLnVwZGF0ZSh0aGlzLm1vZGVsLCBkcml2ZXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=