"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Observables;
(function (Observables) {
    var Observable = (function () {
        function Observable(current) {
            this.subscriptions = [];
            this.actions = [];
            this.current = current;
        }
        Observable.prototype.subscribe = function (observer) {
            return new Subscription(this.subscriptions, observer);
        };
        Observable.prototype.map = function (mapper) {
            var observable = new MappedObservable(mapper, this.current);
            this.subscribe(observable);
            return observable;
        };
        Observable.prototype.onNext = function (value) {
            if (this.current !== value) {
                this.current = value;
                if (this.current !== undefined) {
                    for (var i = 0; i < this.subscriptions.length; i++) {
                        this.subscriptions[i].notify(this.current);
                    }
                    var actions = this.actions.slice(0);
                    for (var e = 0; e < actions.length; e++) {
                        actions[e].execute();
                    }
                }
            }
        };
        Observable.prototype.valueOf = function () {
            return this.current;
        };
        return Observable;
    }());
    Observables.Observable = Observable;
    var Subscription = (function () {
        function Subscription(subscriptions, observer) {
            this.subscriptions = subscriptions;
            this.observer = observer;
            subscriptions.push(this);
        }
        Subscription.prototype.notify = function (value) {
            if (typeof this.observer === "function")
                this.observer(value);
            else
                this.observer.onNext(value);
            return this;
        };
        Subscription.prototype.dispose = function () {
            var idx = this.subscriptions.indexOf(this);
            if (idx >= 0)
                this.subscriptions.splice(idx, 1);
            else
                console.warn("subscription is not found");
        };
        return Subscription;
    }());
    var MappedObservable = (function (_super) {
        __extends(MappedObservable, _super);
        function MappedObservable(mapper, init) {
            var _this = _super.call(this, mapper(init)) || this;
            _this.mapper = mapper;
            return _this;
        }
        MappedObservable.prototype.onNext = function (value) {
            _super.prototype.onNext.call(this, this.mapper(value));
        };
        return MappedObservable;
    }(Observable));
    var Timer = (function (_super) {
        __extends(Timer, _super);
        function Timer() {
            var _this = _super.call(this) || this;
            _this.currentTime = 0;
            _super.prototype.onNext.call(_this, _this.currentTime);
            _this.resume();
            return _this;
        }
        Timer.prototype.toggle = function () {
            if (!!this.handle)
                this.pause();
            else
                this.resume();
        };
        Timer.prototype.resume = function () {
            var _this = this;
            if (!!this.handle) {
                console.warn("timer is already running");
            }
            else {
                var startTime = new Date().getTime() - this.currentTime;
                var inProgress = false;
                this.handle = setInterval(function () {
                    if (inProgress)
                        return;
                    try {
                        inProgress = true;
                        var currentTime = new Date().getTime();
                        _super.prototype.onNext.call(_this, _this.currentTime = (currentTime - startTime));
                    }
                    finally {
                        inProgress = false;
                    }
                }, 10);
            }
            return this;
        };
        Timer.prototype.pause = function () {
            if (!!this.handle) {
                clearInterval(this.handle);
            }
            else {
                console.warn("timer is not running");
            }
            this.handle = null;
            return this;
        };
        Timer.prototype.toString = function () {
            return this.currentTime;
        };
        return Timer;
    }(Observable));
    Observables.Timer = Timer;
    var Time = (function (_super) {
        __extends(Time, _super);
        function Time() {
            var _this = _super.call(this, Time.getTime()) || this;
            _this.resume();
            return _this;
        }
        Time.prototype.toggle = function () {
            if (!!this.handle)
                this.pause();
            else
                this.resume();
        };
        Time.getTime = function () {
            var d = new Date();
            return d.getTime() - (d.getTimezoneOffset() * 60 * 1000);
        };
        Time.prototype.resume = function () {
            var _this = this;
            if (!!this.handle) {
                console.warn("timer is already running");
            }
            else {
                var inProgress = false;
                this.handle = setInterval(function () {
                    if (inProgress)
                        return;
                    try {
                        inProgress = true;
                        _super.prototype.onNext.call(_this, Time.getTime());
                    }
                    finally {
                        inProgress = false;
                    }
                }, 10);
            }
            return this;
        };
        Time.prototype.pause = function () {
            if (!!this.handle) {
                clearInterval(this.handle);
            }
            else {
                console.warn("timer is not running");
            }
            this.handle = null;
            return this;
        };
        return Time;
    }(Observable));
    Observables.Time = Time;
})(Observables = exports.Observables || (exports.Observables = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb2JzZXJ2YWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBYyxXQUFXLENBME14QjtBQTFNRCxXQUFjLFdBQVc7SUFpQnJCO1FBTUksb0JBQVksT0FBVztZQUpmLGtCQUFhLEdBQW9CLEVBQUUsQ0FBQztZQUVyQyxZQUFPLEdBQVUsRUFBRSxDQUFDO1lBR3ZCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQzNCLENBQUM7UUFFRCw4QkFBUyxHQUFULFVBQVUsUUFBaUM7WUFDdkMsTUFBTSxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVELHdCQUFHLEdBQUgsVUFBSSxNQUFnQjtZQUNoQixJQUFJLFVBQVUsR0FBRyxJQUFJLGdCQUFnQixDQUFJLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3RCLENBQUM7UUFFRCwyQkFBTSxHQUFOLFVBQU8sS0FBUTtZQUNYLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDN0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUNqRCxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQy9DLENBQUM7b0JBR0QsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3BDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUN0QyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3pCLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBRUQsNEJBQU8sR0FBUDtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3hCLENBQUM7UUFDTCxpQkFBQztJQUFELENBQUMsQUF4Q0QsSUF3Q0M7SUF4Q1ksc0JBQVUsYUF3Q3RCLENBQUE7SUFFRDtRQUNJLHNCQUFvQixhQUFhLEVBQVUsUUFBaUM7WUFBeEQsa0JBQWEsR0FBYixhQUFhLENBQUE7WUFBVSxhQUFRLEdBQVIsUUFBUSxDQUF5QjtZQUN4RSxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFRCw2QkFBTSxHQUFOLFVBQU8sS0FBSztZQUNSLEVBQUUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFFBQVEsS0FBSyxVQUFVLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxRQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckMsSUFBSTtnQkFDZSxJQUFJLENBQUMsUUFBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVoRCxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCw4QkFBTyxHQUFQO1lBQ0ksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDM0MsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsSUFBSTtnQkFDQSxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUNMLG1CQUFDO0lBQUQsQ0FBQyxBQXJCRCxJQXFCQztJQUVEO1FBQWtDLG9DQUFhO1FBQzNDLDBCQUFvQixNQUFnQixFQUFFLElBQUk7WUFBMUMsWUFDSSxrQkFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsU0FDdEI7WUFGbUIsWUFBTSxHQUFOLE1BQU0sQ0FBVTs7UUFFcEMsQ0FBQztRQUVELGlDQUFNLEdBQU4sVUFBTyxLQUFRO1lBQ1gsaUJBQU0sTUFBTSxZQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBQ0wsdUJBQUM7SUFBRCxDQUFDLEFBUkQsQ0FBa0MsVUFBVSxHQVEzQztJQUVEO1FBQTJCLHlCQUFrQjtRQUl6QztZQUFBLFlBQ0ksaUJBQU8sU0FHVjtZQU5PLGlCQUFXLEdBQUcsQ0FBQyxDQUFDO1lBSXBCLGlCQUFNLE1BQU0sYUFBQyxLQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDL0IsS0FBSSxDQUFDLE1BQU0sRUFBRSxDQUFDOztRQUNsQixDQUFDO1FBRUQsc0JBQU0sR0FBTjtZQUNJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO2dCQUNkLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNqQixJQUFJO2dCQUNBLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN0QixDQUFDO1FBRUQsc0JBQU0sR0FBTjtZQUFBLGlCQXNCQztZQXJCRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUM3QyxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUN4RCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUNyQjtvQkFDSSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUM7d0JBQ1gsTUFBTSxDQUFDO29CQUNYLElBQUksQ0FBQzt3QkFDRCxVQUFVLEdBQUcsSUFBSSxDQUFDO3dCQUNsQixJQUFJLFdBQVcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUN2QyxpQkFBTSxNQUFNLGFBQUMsS0FBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUMvRCxDQUFDOzRCQUFTLENBQUM7d0JBQ1AsVUFBVSxHQUFHLEtBQUssQ0FBQztvQkFDdkIsQ0FBQztnQkFDTCxDQUFDLEVBQ0QsRUFBRSxDQUFDLENBQUM7WUFDWixDQUFDO1lBRUQsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQscUJBQUssR0FBTDtZQUNJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDaEIsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osT0FBTyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUVuQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCx3QkFBUSxHQUFSO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDNUIsQ0FBQztRQUNMLFlBQUM7SUFBRCxDQUFDLEFBdkRELENBQTJCLFVBQVUsR0F1RHBDO0lBdkRZLGlCQUFLLFFBdURqQixDQUFBO0lBRUQ7UUFBMEIsd0JBQWtCO1FBR3hDO1lBQUEsWUFDSSxrQkFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsU0FFeEI7WUFERyxLQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7O1FBQ2xCLENBQUM7UUFFRCxxQkFBTSxHQUFOO1lBQ0ksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2pCLElBQUk7Z0JBQ0EsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFTSxZQUFPLEdBQWQ7WUFDSSxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVELHFCQUFNLEdBQU47WUFBQSxpQkFvQkM7WUFuQkcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixPQUFPLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztnQkFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQ3JCO29CQUNJLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQzt3QkFDWCxNQUFNLENBQUM7b0JBQ1gsSUFBSSxDQUFDO3dCQUNELFVBQVUsR0FBRyxJQUFJLENBQUM7d0JBQ2xCLGlCQUFNLE1BQU0sYUFBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztvQkFDakMsQ0FBQzs0QkFBUyxDQUFDO3dCQUNQLFVBQVUsR0FBRyxLQUFLLENBQUM7b0JBQ3ZCLENBQUM7Z0JBQ0wsQ0FBQyxFQUNELEVBQUUsQ0FBQyxDQUFDO1lBQ1osQ0FBQztZQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELG9CQUFLLEdBQUw7WUFDSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0IsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFFbkIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBQ0wsV0FBQztJQUFELENBQUMsQUFwREQsQ0FBMEIsVUFBVSxHQW9EbkM7SUFwRFksZ0JBQUksT0FvRGhCLENBQUE7QUFDTCxDQUFDLEVBMU1hLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBME14QiIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBtb2R1bGUgT2JzZXJ2YWJsZXMge1xyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVN1YnNjcmlwdGlvbiB7XHJcbiAgICAgICAgbm90aWZ5KHZhbHVlKTtcclxuICAgICAgICBkaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJT2JzZXJ2YWJsZTxUPiB7XHJcbiAgICAgICAgc3Vic2NyaWJlcihvYnNlcnZlcjogSU9ic2VydmVyPFQ+KTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElPYnNlcnZlcjxUPiB7XHJcbiAgICAgICAgb25OZXh0Pyh2OiBUKTtcclxuICAgICAgICBvbkRvbmU/KCk7XHJcbiAgICAgICAgb25FcnJvcj8oKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgT2JzZXJ2YWJsZTxUPiBpbXBsZW1lbnRzIElPYnNlcnZlcjxUPiB7XHJcblxyXG4gICAgICAgIHByaXZhdGUgc3Vic2NyaXB0aW9uczogSVN1YnNjcmlwdGlvbltdID0gW107XHJcbiAgICAgICAgcHJpdmF0ZSBjdXJyZW50OiBUO1xyXG4gICAgICAgIHB1YmxpYyBhY3Rpb25zOiBhbnlbXSA9IFtdO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihjdXJyZW50PzogVCkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBjdXJyZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3Vic2NyaWJlKG9ic2VydmVyOiBJT2JzZXJ2ZXI8VD4gfCBGdW5jdGlvbik6IElTdWJzY3JpcHRpb24ge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFN1YnNjcmlwdGlvbih0aGlzLnN1YnNjcmlwdGlvbnMsIG9ic2VydmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcChtYXBwZXI6IEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBvYnNlcnZhYmxlID0gbmV3IE1hcHBlZE9ic2VydmFibGU8VD4obWFwcGVyLCB0aGlzLmN1cnJlbnQpO1xyXG4gICAgICAgICAgICB0aGlzLnN1YnNjcmliZShvYnNlcnZhYmxlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9ic2VydmFibGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbk5leHQodmFsdWU6IFQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudCAhPT0gdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YnNjcmlwdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zW2ldLm5vdGlmeSh0aGlzLmN1cnJlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbm90aWZ5IG5leHRcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucy5zbGljZSgwKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBlID0gMDsgZSA8IGFjdGlvbnMubGVuZ3RoOyBlKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uc1tlXS5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YWx1ZU9mKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBTdWJzY3JpcHRpb248VD4gaW1wbGVtZW50cyBJU3Vic2NyaXB0aW9uIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHN1YnNjcmlwdGlvbnMsIHByaXZhdGUgb2JzZXJ2ZXI6IElPYnNlcnZlcjxUPiB8IEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaCh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5vdGlmeSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMub2JzZXJ2ZXIgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICg8RnVuY3Rpb24+dGhpcy5vYnNlcnZlcikodmFsdWUpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAoPElPYnNlcnZlcjxUPj50aGlzLm9ic2VydmVyKS5vbk5leHQodmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5zdWJzY3JpcHRpb25zLmluZGV4T2YodGhpcyk7XHJcbiAgICAgICAgICAgIGlmIChpZHggPj0gMClcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwic3Vic2NyaXB0aW9uIGlzIG5vdCBmb3VuZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgTWFwcGVkT2JzZXJ2YWJsZTxUPiBleHRlbmRzIE9ic2VydmFibGU8VD4ge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFwcGVyOiBGdW5jdGlvbiwgaW5pdCkge1xyXG4gICAgICAgICAgICBzdXBlcihtYXBwZXIoaW5pdCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25OZXh0KHZhbHVlOiBUKTogdm9pZCB7XHJcbiAgICAgICAgICAgIHN1cGVyLm9uTmV4dCh0aGlzLm1hcHBlcih2YWx1ZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGltZXIgZXh0ZW5kcyBPYnNlcnZhYmxlPG51bWJlcj4ge1xyXG4gICAgICAgIHByaXZhdGUgaGFuZGxlO1xyXG4gICAgICAgIHByaXZhdGUgY3VycmVudFRpbWUgPSAwO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICAgICAgc3VwZXIub25OZXh0KHRoaXMuY3VycmVudFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9nZ2xlKCkge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmhhbmRsZSlcclxuICAgICAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc3VtZSgpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInRpbWVyIGlzIGFscmVhZHkgcnVubmluZ1wiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRoaXMuY3VycmVudFRpbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGUgPSBzZXRJbnRlcnZhbChcclxuICAgICAgICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpblByb2dyZXNzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5Qcm9ncmVzcyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1cGVyLm9uTmV4dCh0aGlzLmN1cnJlbnRUaW1lID0gKGN1cnJlbnRUaW1lIC0gc3RhcnRUaW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblByb2dyZXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIDEwKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXVzZSgpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5oYW5kbGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwidGltZXIgaXMgbm90IHJ1bm5pbmdcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRpbWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUaW1lIGV4dGVuZHMgT2JzZXJ2YWJsZTxudW1iZXI+IHtcclxuICAgICAgICBwcml2YXRlIGhhbmRsZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKFRpbWUuZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvZ2dsZSgpIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdXNlKCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgZ2V0VGltZSgpIHtcclxuICAgICAgICAgICAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gZC5nZXRUaW1lKCkgLSAoZC5nZXRUaW1lem9uZU9mZnNldCgpICogNjAgKiAxMDAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc3VtZSgpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInRpbWVyIGlzIGFscmVhZHkgcnVubmluZ1wiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBpblByb2dyZXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZSA9IHNldEludGVydmFsKFxyXG4gICAgICAgICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluUHJvZ3Jlc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblByb2dyZXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1cGVyLm9uTmV4dChUaW1lLmdldFRpbWUoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblByb2dyZXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIDEwKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXVzZSgpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5oYW5kbGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwidGltZXIgaXMgbm90IHJ1bm5pbmdcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59Il19