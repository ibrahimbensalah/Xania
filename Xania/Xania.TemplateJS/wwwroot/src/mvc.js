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
        return this.view.bind()
            .update2(this.model, driver);
    };
    return ViewResult;
}());
exports.ViewResult = ViewResult;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXZjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXZjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw2Q0FBMkM7QUFFM0M7SUFLSSxtQkFBb0IsT0FBTyxFQUFFLFVBQVUsRUFBVSxXQUFXO1FBQTVELGlCQWtCQztRQWxCbUIsWUFBTyxHQUFQLE9BQU8sQ0FBQTtRQUFzQixnQkFBVyxHQUFYLFdBQVcsQ0FBQTtRQUpyRCxjQUFTLEdBQUcsRUFBRSxDQUFDO1FBS2xCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBUyxVQUFVLENBQUMsQ0FBQztRQUNqRSxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztRQUU5QixNQUFNLENBQUMsVUFBVSxHQUFHLFVBQUMsYUFBYTtZQUN4QixJQUFBLDJCQUFLLENBQW1CO1lBQ3hCLElBQUEsbUNBQVEsQ0FBcUI7WUFFbkMsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELElBQUksVUFBVSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBRTdELEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLEtBQUssVUFBVSxDQUFDO29CQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFckMsRUFBRSxDQUFDLENBQUMsVUFBVSxLQUFLLEtBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDO29CQUN2QyxLQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMzQyxDQUFDO1FBQ0wsQ0FBQyxDQUFBO0lBQ0wsQ0FBQztJQUVELDBCQUFNLEdBQU4sVUFBTyxJQUFZLEVBQUUsSUFBSztRQUEx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RSxNQUFNLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBQ0wsaUJBQUM7QUFBRCxDQUFDLEFBUEQsSUFPQztBQVBZLGdDQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi9vYnNlcnZhYmxlc1wiXHJcblxyXG5leHBvcnQgY2xhc3MgVXJsSGVscGVyIHtcclxuICAgIHB1YmxpYyBvYnNlcnZlcnMgPSBbXTtcclxuICAgIHB1YmxpYyBhY3Rpb25QYXRoOiBPYnNlcnZhYmxlcy5PYnNlcnZhYmxlPHN0cmluZz47XHJcbiAgICBwcml2YXRlIGluaXRpYWxQYXRoOiBzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHBQYXRoLCBhY3Rpb25QYXRoLCBwcml2YXRlIGFwcEluc3RhbmNlKSB7XHJcbiAgICAgICAgdGhpcy5hY3Rpb25QYXRoID0gbmV3IE9ic2VydmFibGVzLk9ic2VydmFibGU8c3RyaW5nPihhY3Rpb25QYXRoKTtcclxuICAgICAgICB0aGlzLmluaXRpYWxQYXRoID0gYWN0aW9uUGF0aDtcclxuXHJcbiAgICAgICAgd2luZG93Lm9ucG9wc3RhdGUgPSAocG9wU3RhdGVFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgeyBzdGF0ZSB9ID0gcG9wU3RhdGVFdmVudDtcclxuICAgICAgICAgICAgdmFyIHsgcGF0aG5hbWUgfSA9IHdpbmRvdy5sb2NhdGlvbjtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdGF0ZSAmJiBwYXRobmFtZS5zdGFydHNXaXRoKHRoaXMuYXBwUGF0aCArIFwiL1wiKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvblBhdGggPSBwYXRobmFtZS5zdWJzdHJpbmcodGhpcy5hcHBQYXRoLmxlbmd0aCArIDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5hY3Rpb25QYXRoICE9PSBhY3Rpb25QYXRoKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYWN0aW9uUGF0aCwgc3RhdGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChhY3Rpb25QYXRoICE9PSB0aGlzLmFjdGlvblBhdGguY3VycmVudClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGlvblBhdGgubm90aWZ5KGFjdGlvblBhdGgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFjdGlvbihwYXRoOiBzdHJpbmcsIHZpZXc/KSB7XHJcbiAgICAgICAgcmV0dXJuIGV2ZW50ID0+IHtcclxuICAgICAgICAgICAgdmFyIGFjdGlvblBhdGggPSBwYXRoO1xyXG4gICAgICAgICAgICB2YXIgYWN0aW9uVmlldyA9IHZpZXc7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvblBhdGguY3VycmVudCAhPT0gYWN0aW9uUGF0aCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHsgYWN0aW9uUGF0aCwgYWN0aW9uVmlldyB9O1xyXG4gICAgICAgICAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKGFjdGlvbiwgXCJcIiwgdGhpcy5hcHBQYXRoICsgXCIvXCIgKyBhY3Rpb25QYXRoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWN0aW9uUGF0aC5ub3RpZnkoYWN0aW9uUGF0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgSHRtbEhlbHBlciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBsb2FkZXI6IHsgaW1wb3J0KHBhdGg6IHN0cmluZyk7IH0pIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcGFydGlhbCh2aWV3UGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgdmFyIHZpZXcgPSB0aGlzLmxvYWRlci5pbXBvcnQodmlld1BhdGgpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGJpbmQodmlzaXRvcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBWaWV3QmluZGluZyh2aXNpdG9yLCB2aWV3LCB7fSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFZpZXdCaW5kaW5nIHtcclxuICAgIHByaXZhdGUgYmluZGluZztcclxuICAgIHByaXZhdGUgY2FuY2VsbGF0aW9uVG9rZW46IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZpc2l0b3IsIHByaXZhdGUgdmlldywgcHJpdmF0ZSBtb2RlbCkge1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZShjb250ZXh0LCBwYXJlbnQpIHtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnZpZXcpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInZpZXcgaXMgZW1wdHlcIik7XHJcblxyXG4gICAgICAgIHZhciBjYW5jZWxsYXRpb25Ub2tlbiA9IE1hdGgucmFuZG9tKCk7XHJcbiAgICAgICAgdGhpcy5jYW5jZWxsYXRpb25Ub2tlbiA9IGNhbmNlbGxhdGlvblRva2VuO1xyXG4gICAgICAgIHRoaXMudmlldy50aGVuKGFwcCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChjYW5jZWxsYXRpb25Ub2tlbiA9PT0gdGhpcy5jYW5jZWxsYXRpb25Ub2tlbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJpbmRpbmcgPSBhcHAuYmluZChjb250ZXh0LCBwYXJlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcG9zZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5iaW5kaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmluZGluZy5kaXNwb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElEcml2ZXIge1xyXG5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFZpZXdSZXN1bHQge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB2aWV3LCBwcml2YXRlIG1vZGVsPykgeyB9XHJcblxyXG4gICAgZXhlY3V0ZShkcml2ZXI6IElEcml2ZXIsIHZpc2l0b3IpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52aWV3LmJpbmQoKVxyXG4gICAgICAgICAgICAudXBkYXRlMih0aGlzLm1vZGVsLCBkcml2ZXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=