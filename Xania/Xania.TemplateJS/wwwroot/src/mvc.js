"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var observables_1 = require("./observables");
var UrlHelper = (function (_super) {
    __extends(UrlHelper, _super);
    function UrlHelper(appName, actionPath) {
        var _this = _super.call(this, actionPath) || this;
        _this.appName = appName;
        _this.observers = [];
        return _this;
    }
    UrlHelper.prototype.action = function (actionPath) {
        var _this = this;
        return function () {
            if (_this.current !== actionPath) {
                var options = {};
                window.history.pushState(options, "", _this.appName + "/" + actionPath);
                _this.onNext(actionPath);
            }
        };
    };
    return UrlHelper;
}(observables_1.Observables.Observable));
exports.UrlHelper = UrlHelper;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXZjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXZjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDZDQUEyQztBQUUzQztJQUErQiw2QkFBOEI7SUFHekQsbUJBQW9CLE9BQU8sRUFBRSxVQUFVO1FBQXZDLFlBQ0ksa0JBQU0sVUFBVSxDQUFDLFNBQ3BCO1FBRm1CLGFBQU8sR0FBUCxPQUFPLENBQUE7UUFGcEIsZUFBUyxHQUFHLEVBQUUsQ0FBQzs7SUFJdEIsQ0FBQztJQUVELDBCQUFNLEdBQU4sVUFBTyxVQUFVO1FBQWpCLGlCQVFDO1FBUEcsTUFBTSxDQUFDO1lBQ0gsRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsS0FBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUM7Z0JBQ3ZFLEtBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNMLENBQUMsQ0FBQztJQUNOLENBQUM7SUFDTCxnQkFBQztBQUFELENBQUMsQUFoQkQsQ0FBK0IseUJBQVcsQ0FBQyxVQUFVLEdBZ0JwRDtBQWhCWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGVzIH0gZnJvbSBcIi4vb2JzZXJ2YWJsZXNcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFVybEhlbHBlciBleHRlbmRzIE9ic2VydmFibGVzLk9ic2VydmFibGU8c3RyaW5nPiB7XHJcbiAgICBwdWJsaWMgb2JzZXJ2ZXJzID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHBOYW1lLCBhY3Rpb25QYXRoKSB7XHJcbiAgICAgICAgc3VwZXIoYWN0aW9uUGF0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgYWN0aW9uKGFjdGlvblBhdGgpIHtcclxuICAgICAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50ICE9PSBhY3Rpb25QYXRoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG9wdGlvbnMsIFwiXCIsIHRoaXMuYXBwTmFtZSArIFwiL1wiICsgYWN0aW9uUGF0aCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uTmV4dChhY3Rpb25QYXRoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn0iXX0=