"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Observables;
(function (Observables) {
    var Observable = (function () {
        function Observable() {
            this.subscriptions = [];
            this.actions = [];
        }
        Observable.prototype.subscribe = function (observer) {
            return new Subscription(this.subscriptions, observer).notify(this.current);
        };
        Observable.prototype.map = function (mapper) {
            var observable = new MappedObservable(mapper);
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
                    for (var i = 0; i < actions.length; i++) {
                        actions[i].execute();
                    }
                }
            }
        };
        Observable.prototype.valueOf = function () {
            return this.current;
        };
        Observable.prototype.change = function (action) {
            if (this.actions.indexOf(action) < 0) {
                this.actions.push(action);
                return this;
            }
            return false;
        };
        Observable.prototype.unbind = function (action) {
            var idx = this.actions.indexOf(action);
            if (idx < 0)
                return false;
            this.actions.splice(idx, 1);
            return true;
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
        function MappedObservable(mapper) {
            var _this = _super.call(this) || this;
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
                this.handle = setInterval(function () {
                    var currentTime = new Date().getTime();
                    _super.prototype.onNext.call(_this, _this.currentTime = (currentTime - startTime));
                }, 60);
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
})(Observables = exports.Observables || (exports.Observables = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb2JzZXJ2YWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBYyxXQUFXLENBeUp4QjtBQXpKRCxXQUFjLFdBQVc7SUFpQnJCO1FBQUE7WUFFWSxrQkFBYSxHQUFvQixFQUFFLENBQUM7WUFFckMsWUFBTyxHQUFVLEVBQUUsQ0FBQztRQWlEL0IsQ0FBQztRQS9DRyw4QkFBUyxHQUFULFVBQVUsUUFBaUM7WUFDdkMsTUFBTSxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRUQsd0JBQUcsR0FBSCxVQUFJLE1BQWdCO1lBQ2hCLElBQUksVUFBVSxHQUFHLElBQUksZ0JBQWdCLENBQUksTUFBTSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3RCLENBQUM7UUFFRCwyQkFBTSxHQUFOLFVBQU8sS0FBUTtZQUNYLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ3JCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDN0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUNqRCxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENB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LENBQUM7Z0JBQ0osT0FBTyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUVuQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCx3QkFBUSxHQUFSO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDNUIsQ0FBQztRQUNMLFlBQUM7SUFBRCxDQUFDLEFBL0NELENBQTJCLFVBQVUsR0ErQ3BDO0lBL0NZLGlCQUFLLFFBK0NqQixDQUFBO0FBQ0wsQ0FBQyxFQXpKYSxXQUFXLEdBQVgsbUJBQVcsS0FBWCxtQkFBVyxRQXlKeEIiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgbW9kdWxlIE9ic2VydmFibGVzIHtcclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElTdWJzY3JpcHRpb24ge1xyXG4gICAgICAgIG5vdGlmeSh2YWx1ZSk7XHJcbiAgICAgICAgZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU9ic2VydmFibGU8VD4ge1xyXG4gICAgICAgIHN1YnNjcmliZXIob2JzZXJ2ZXI6IElPYnNlcnZlcjxUPik7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJT2JzZXJ2ZXI8VD4ge1xyXG4gICAgICAgIG9uTmV4dD8odjogVCk7XHJcbiAgICAgICAgb25Eb25lPygpO1xyXG4gICAgICAgIG9uRXJyb3I/KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIE9ic2VydmFibGU8VD4gaW1wbGVtZW50cyBJT2JzZXJ2ZXI8VD4ge1xyXG5cclxuICAgICAgICBwcml2YXRlIHN1YnNjcmlwdGlvbnM6IElTdWJzY3JpcHRpb25bXSA9IFtdO1xyXG4gICAgICAgIHByaXZhdGUgY3VycmVudDogVDtcclxuICAgICAgICBwdWJsaWMgYWN0aW9uczogYW55W10gPSBbXTtcclxuXHJcbiAgICAgICAgc3Vic2NyaWJlKG9ic2VydmVyOiBJT2JzZXJ2ZXI8VD4gfCBGdW5jdGlvbik6IElTdWJzY3JpcHRpb24ge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFN1YnNjcmlwdGlvbih0aGlzLnN1YnNjcmlwdGlvbnMsIG9ic2VydmVyKS5ub3RpZnkodGhpcy5jdXJyZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcChtYXBwZXI6IEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBvYnNlcnZhYmxlID0gbmV3IE1hcHBlZE9ic2VydmFibGU8VD4obWFwcGVyKTtcclxuICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUob2JzZXJ2YWJsZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25OZXh0KHZhbHVlOiBUKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnQgIT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnQgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJzY3JpcHRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uc1tpXS5ub3RpZnkodGhpcy5jdXJyZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdGlmeSBuZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY3Rpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnNbaV0uZXhlY3V0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNoYW5nZShhY3Rpb24pOiB0aGlzIHwgYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmFjdGlvbnMuaW5kZXhPZihhY3Rpb24pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3Rpb25zLnB1c2goYWN0aW9uKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVuYmluZChhY3Rpb24pIDogYm9vbGVhbiB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLmFjdGlvbnMuaW5kZXhPZihhY3Rpb24pO1xyXG4gICAgICAgICAgICBpZiAoaWR4IDwgMClcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuYWN0aW9ucy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIFN1YnNjcmlwdGlvbjxUPiBpbXBsZW1lbnRzIElTdWJzY3JpcHRpb24ge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgc3Vic2NyaXB0aW9ucywgcHJpdmF0ZSBvYnNlcnZlcjogSU9ic2VydmVyPFQ+IHwgRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgc3Vic2NyaXB0aW9ucy5wdXNoKHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbm90aWZ5KHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5vYnNlcnZlciA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgKDxGdW5jdGlvbj50aGlzLm9ic2VydmVyKSh2YWx1ZSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICg8SU9ic2VydmVyPFQ+PnRoaXMub2JzZXJ2ZXIpLm9uTmV4dCh2YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRpc3Bvc2UoKSB7XHJcbiAgICAgICAgICAgIHZhciBpZHggPSB0aGlzLnN1YnNjcmlwdGlvbnMuaW5kZXhPZih0aGlzKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJzdWJzY3JpcHRpb24gaXMgbm90IGZvdW5kXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBNYXBwZWRPYnNlcnZhYmxlPFQ+IGV4dGVuZHMgT2JzZXJ2YWJsZTxUPiB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYXBwZXI6IEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbk5leHQodmFsdWU6IFQpOiB2b2lkIHtcclxuICAgICAgICAgICAgc3VwZXIub25OZXh0KHRoaXMubWFwcGVyKHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUaW1lciBleHRlbmRzIE9ic2VydmFibGU8bnVtYmVyPiB7XHJcbiAgICAgICAgcHJpdmF0ZSBoYW5kbGU7XHJcbiAgICAgICAgcHJpdmF0ZSBjdXJyZW50VGltZSA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICBzdXBlci5vbk5leHQodGhpcy5jdXJyZW50VGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b2dnbGUoKSB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVzdW1lKCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmhhbmRsZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwidGltZXIgaXMgYWxyZWFkeSBydW5uaW5nXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gdGhpcy5jdXJyZW50VGltZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gc2V0SW50ZXJ2YWwoXHJcbiAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VwZXIub25OZXh0KHRoaXMuY3VycmVudFRpbWUgPSAoY3VycmVudFRpbWUgLSBzdGFydFRpbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIDYwKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXVzZSgpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5oYW5kbGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwidGltZXIgaXMgbm90IHJ1bm5pbmdcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRpbWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59Il19