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
            this.current = current;
        }
        Observable.prototype.subscribe = function (observer) {
            return new Subscription(this, observer);
        };
        Observable.prototype.map = function (mapper) {
            var observable = new MappedObservable(mapper, this.current);
            this.subscribe(observable);
            return observable;
        };
        Observable.prototype.onNext = function (value) {
            this.current = value;
            for (var i = 0; i < this.subscriptions.length; i++) {
                this.subscriptions[i].notify(this.current);
            }
        };
        Observable.prototype.valueOf = function () {
            return this.current;
        };
        return Observable;
    }());
    Observables.Observable = Observable;
    var Subscription = (function () {
        function Subscription(observable, observer) {
            this.observable = observable;
            this.observer = observer;
            if (observable.subscriptions.indexOf(this) >= 0)
                throw Error("mem leak");
            observable.subscriptions.push(this);
        }
        Subscription.prototype.notify = function (value) {
            if (typeof this.observer === "function")
                this.observer(value);
            else
                this.observer.onNext(value);
            return this;
        };
        Subscription.prototype.dispose = function () {
            var idx = this.observable.subscriptions.indexOf(this);
            if (idx >= 0)
                this.observable.subscriptions.splice(idx, 1);
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
            this.handle = setTimeout(function () {
                try {
                    _super.prototype.onNext.call(_this, Time.getTime());
                }
                finally {
                    _this.resume();
                }
            }, 10);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Observables;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb2JzZXJ2YWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBYyxXQUFXLENBMkx4QjtBQTNMRCxXQUFjLFdBQVc7SUFpQnJCO1FBS0ksb0JBQVksT0FBVztZQUhoQixrQkFBYSxHQUFvQixFQUFFLENBQUM7WUFJdkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDM0IsQ0FBQztRQUVELDhCQUFTLEdBQVQsVUFBVSxRQUFpQztZQUN2QyxNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCx3QkFBRyxHQUFILFVBQUksTUFBZ0I7WUFDaEIsSUFBSSxVQUFVLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBSSxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUN0QixDQUFDO1FBRUQsMkJBQU0sR0FBTixVQUFPLEtBQVE7WUFDWCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNyQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0wsQ0FBQztRQUVELDRCQUFPLEdBQVA7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN4QixDQUFDO1FBQ0wsaUJBQUM7SUFBRCxDQUFDLEFBN0JELElBNkJDO0lBN0JZLHNCQUFV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ZXJ2YWJsZXMge1xyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVN1YnNjcmlwdGlvbiB7XHJcbiAgICAgICAgbm90aWZ5KHZhbHVlKTtcclxuICAgICAgICBkaXNwb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJT2JzZXJ2YWJsZTxUPiB7XHJcbiAgICAgICAgc3Vic2NyaWJlcihvYnNlcnZlcjogSU9ic2VydmVyPFQ+KTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElPYnNlcnZlcjxUPiB7XHJcbiAgICAgICAgb25OZXh0Pyh2OiBUKTtcclxuICAgICAgICBvbkRvbmU/KCk7XHJcbiAgICAgICAgb25FcnJvcj8oKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgT2JzZXJ2YWJsZTxUPiBpbXBsZW1lbnRzIElPYnNlcnZlcjxUPiB7XHJcblxyXG4gICAgICAgIHB1YmxpYyBzdWJzY3JpcHRpb25zOiBJU3Vic2NyaXB0aW9uW10gPSBbXTtcclxuICAgICAgICBwdWJsaWMgY3VycmVudDogVDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IoY3VycmVudD86IFQpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gY3VycmVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN1YnNjcmliZShvYnNlcnZlcjogSU9ic2VydmVyPFQ+IHwgRnVuY3Rpb24pOiBJU3Vic2NyaXB0aW9uIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdWJzY3JpcHRpb24odGhpcywgb2JzZXJ2ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFwKG1hcHBlcjogRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgdmFyIG9ic2VydmFibGUgPSBuZXcgTWFwcGVkT2JzZXJ2YWJsZTxUPihtYXBwZXIsIHRoaXMuY3VycmVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKG9ic2VydmFibGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uTmV4dCh2YWx1ZTogVCkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YnNjcmlwdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uc1tpXS5ub3RpZnkodGhpcy5jdXJyZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgU3Vic2NyaXB0aW9uPFQ+IGltcGxlbWVudHMgSVN1YnNjcmlwdGlvbiB7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgb2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUPiwgcHJpdmF0ZSBvYnNlcnZlcjogSU9ic2VydmVyPFQ+IHwgRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKG9ic2VydmFibGUuc3Vic2NyaXB0aW9ucy5pbmRleE9mKHRoaXMpID49IDApXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIm1lbSBsZWFrXCIpO1xyXG5cclxuICAgICAgICAgICAgb2JzZXJ2YWJsZS5zdWJzY3JpcHRpb25zLnB1c2godGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBub3RpZnkodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9ic2VydmVyID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICAoPEZ1bmN0aW9uPnRoaXMub2JzZXJ2ZXIpKHZhbHVlKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgKDxJT2JzZXJ2ZXI8VD4+dGhpcy5vYnNlcnZlcikub25OZXh0KHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMub2JzZXJ2YWJsZS5zdWJzY3JpcHRpb25zLmluZGV4T2YodGhpcyk7XHJcbiAgICAgICAgICAgIGlmIChpZHggPj0gMClcclxuICAgICAgICAgICAgICAgIHRoaXMub2JzZXJ2YWJsZS5zdWJzY3JpcHRpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJzdWJzY3JpcHRpb24gaXMgbm90IGZvdW5kXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBNYXBwZWRPYnNlcnZhYmxlPFQ+IGV4dGVuZHMgT2JzZXJ2YWJsZTxUPiB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYXBwZXI6IEZ1bmN0aW9uLCBpbml0KSB7XHJcbiAgICAgICAgICAgIHN1cGVyKG1hcHBlcihpbml0KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbk5leHQodmFsdWU6IFQpOiB2b2lkIHtcclxuICAgICAgICAgICAgc3VwZXIub25OZXh0KHRoaXMubWFwcGVyKHZhbHVlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUaW1lciBleHRlbmRzIE9ic2VydmFibGU8bnVtYmVyPiB7XHJcbiAgICAgICAgcHJpdmF0ZSBoYW5kbGU7XHJcbiAgICAgICAgcHJpdmF0ZSBjdXJyZW50VGltZSA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICBzdXBlci5vbk5leHQodGhpcy5jdXJyZW50VGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b2dnbGUoKSB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVzdW1lKCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmhhbmRsZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwidGltZXIgaXMgYWxyZWFkeSBydW5uaW5nXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gdGhpcy5jdXJyZW50VGltZTtcclxuICAgICAgICAgICAgICAgIHZhciBpblByb2dyZXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZSA9IHNldEludGVydmFsKFxyXG4gICAgICAgICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluUHJvZ3Jlc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblByb2dyZXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VwZXIub25OZXh0KHRoaXMuY3VycmVudFRpbWUgPSAoY3VycmVudFRpbWUgLSBzdGFydFRpbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgMTApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhdXNlKCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmhhbmRsZSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmhhbmRsZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJ0aW1lciBpcyBub3QgcnVubmluZ1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGltZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRpbWUgZXh0ZW5kcyBPYnNlcnZhYmxlPG51bWJlcj4ge1xyXG4gICAgICAgIHByaXZhdGUgaGFuZGxlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICAgICAgc3VwZXIoVGltZS5nZXRUaW1lKCkpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9nZ2xlKCkge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmhhbmRsZSlcclxuICAgICAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBnZXRUaW1lKCkge1xyXG4gICAgICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBkLmdldFRpbWUoKSAtIChkLmdldFRpbWV6b25lT2Zmc2V0KCkgKiA2MCAqIDEwMDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVzdW1lKCk6IHRoaXMge1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZSA9IHNldFRpbWVvdXQoXHJcbiAgICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VwZXIub25OZXh0KFRpbWUuZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAxMCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhdXNlKCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmhhbmRsZSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmhhbmRsZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJ0aW1lciBpcyBub3QgcnVubmluZ1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IE9ic2VydmFibGVzOyJdfQ==