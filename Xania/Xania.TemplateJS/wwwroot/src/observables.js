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
        Observable.prototype.notify = function (value) {
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
            var mappedValue = this.mapper(value);
            if (mappedValue === undefined)
                throw new Error("Failed to map observed value");
            else
                this.notify(mappedValue);
        };
        return MappedObservable;
    }(Observable));
    Observables.MappedObservable = MappedObservable;
    var Timer = (function (_super) {
        __extends(Timer, _super);
        function Timer() {
            var _this = _super.call(this) || this;
            _this.currentTime = 0;
            _this.notify(_this.currentTime);
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
                        _this.notify(_this.currentTime = (currentTime - startTime));
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
            if (this.handle)
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
            if (this.handle) {
                return this;
            }
            var f = function () {
                _this.handle = null;
                try {
                    _this.notify(Time.getTime());
                }
                finally {
                    _this.resume();
                }
            };
            this.handle = setTimeout(f, 10);
            return this;
        };
        Time.prototype.pause = function () {
            if (!!this.handle) {
                clearInterval(this.handle);
            }
            this.handle = null;
            return this;
        };
        Time.prototype.toString = function () {
            return this.current;
        };
        return Time;
    }(Observable));
    Observables.Time = Time;
})(Observables = exports.Observables || (exports.Observables = {}));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Observables;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvYnNlcnZhYmxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFjLFdBQVcsQ0FxTXhCO0FBck1ELFdBQWMsV0FBVztJQWlCckI7UUFLSSxvQkFBWSxPQUFXO1lBSGhCLGtCQUFhLEdBQW9CLEVBQUUsQ0FBQztZQUl2QyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUMzQixDQUFDO1FBRUQsOEJBQVMsR0FBVCxVQUFVLFFBQWlDO1lBQ3ZDLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELHdCQUFHLEdBQUgsVUFBUSxNQUFpQjtZQUNyQixJQUFJLFVBQVUsR0FBRyxJQUFJLGdCQUFnQixDQUFRLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3RCLENBQUM7UUFFRCwyQkFBTSxHQUFOLFVBQU8sS0FBUTtZQUNYLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9DLENBQUM7UUFDTCxDQUFDO1FBRUQsNEJBQU8sR0FBUDtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3hCLENBQUM7UUFDTCxpQkFBQztJQUFELENBQUMsQUE3QkQsSUE2QkM7SUE3Qlksc0JBQVUsYUE2QnRCLENB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QUFHLElBQUksQ0FBQztZQUVuQixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCx1QkFBUSxHQUFSO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDeEIsQ0FBQztRQUNMLFdBQUM7SUFBRCxDQUFDLEFBbERELENBQTBCLFVBQVUsR0FrRG5DO0lBbERZLGdCQUFJLE9Ba0RoQixDQUFBO0FBQ0wsQ0FBQyxFQXJNYSxXQUFXLEdBQVgsbUJBQVcsS0FBWCxtQkFBVyxRQXFNeEI7O0FBRUQsa0JBQWUsV0FBVyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IG1vZHVsZSBPYnNlcnZhYmxlcyB7XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJU3Vic2NyaXB0aW9uIHtcclxuICAgICAgICBub3RpZnkodmFsdWUpO1xyXG4gICAgICAgIGRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElPYnNlcnZhYmxlPFQ+IHtcclxuICAgICAgICBzdWJzY3JpYmVyKG9ic2VydmVyOiBJT2JzZXJ2ZXI8VD4pO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU9ic2VydmVyPFQ+IHtcclxuICAgICAgICBvbk5leHQ/KHY6IFQpO1xyXG4gICAgICAgIG9uRG9uZT8oKTtcclxuICAgICAgICBvbkVycm9yPygpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBPYnNlcnZhYmxlPFQ+IGltcGxlbWVudHMgSU9ic2VydmVyPFQ+IHtcclxuXHJcbiAgICAgICAgcHVibGljIHN1YnNjcmlwdGlvbnM6IElTdWJzY3JpcHRpb25bXSA9IFtdO1xyXG4gICAgICAgIHB1YmxpYyBjdXJyZW50OiBUO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihjdXJyZW50PzogVCkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBjdXJyZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3Vic2NyaWJlKG9ic2VydmVyOiBJT2JzZXJ2ZXI8VD4gfCBGdW5jdGlvbik6IElTdWJzY3JpcHRpb24ge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFN1YnNjcmlwdGlvbih0aGlzLCBvYnNlcnZlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXA8VE0+KG1hcHBlcjogKFQpID0+IFRNKTogTWFwcGVkT2JzZXJ2YWJsZTxULCBUTT4ge1xyXG4gICAgICAgICAgICB2YXIgb2JzZXJ2YWJsZSA9IG5ldyBNYXBwZWRPYnNlcnZhYmxlPFQsIFRNPihtYXBwZXIsIHRoaXMuY3VycmVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKG9ic2VydmFibGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5vdGlmeSh2YWx1ZTogVCkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSB2YWx1ZTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YnNjcmlwdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uc1tpXS5ub3RpZnkodGhpcy5jdXJyZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgU3Vic2NyaXB0aW9uPFQ+IGltcGxlbWVudHMgSVN1YnNjcmlwdGlvbiB7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgb2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUPiwgcHJpdmF0ZSBvYnNlcnZlcjogSU9ic2VydmVyPFQ+IHwgRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKG9ic2VydmFibGUuc3Vic2NyaXB0aW9ucy5pbmRleE9mKHRoaXMpID49IDApXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcihcIm1lbSBsZWFrXCIpO1xyXG5cclxuICAgICAgICAgICAgb2JzZXJ2YWJsZS5zdWJzY3JpcHRpb25zLnB1c2godGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBub3RpZnkodmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9ic2VydmVyID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICAoPEZ1bmN0aW9uPnRoaXMub2JzZXJ2ZXIpKHZhbHVlKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgKDxJT2JzZXJ2ZXI8VD4+dGhpcy5vYnNlcnZlcikub25OZXh0KHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGlzcG9zZSgpIHtcclxuICAgICAgICAgICAgdmFyIGlkeCA9IHRoaXMub2JzZXJ2YWJsZS5zdWJzY3JpcHRpb25zLmluZGV4T2YodGhpcyk7XHJcbiAgICAgICAgICAgIGlmIChpZHggPj0gMClcclxuICAgICAgICAgICAgICAgIHRoaXMub2JzZXJ2YWJsZS5zdWJzY3JpcHRpb25zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJzdWJzY3JpcHRpb24gaXMgbm90IGZvdW5kXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgTWFwcGVkT2JzZXJ2YWJsZTxULCBUTT4gZXh0ZW5kcyBPYnNlcnZhYmxlPFRNPiB7XHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYXBwZXI6IChUKSA9PiBUTSwgaW5pdDogVCkge1xyXG4gICAgICAgICAgICBzdXBlcihtYXBwZXIoaW5pdCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25OZXh0KHZhbHVlOiBUKTogdm9pZCB7XHJcbiAgICAgICAgICAgIHZhciBtYXBwZWRWYWx1ZSA9IHRoaXMubWFwcGVyKHZhbHVlKTtcclxuICAgICAgICAgICAgaWYgKG1hcHBlZFZhbHVlID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gbWFwIG9ic2VydmVkIHZhbHVlXCIpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLm5vdGlmeShtYXBwZWRWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUaW1lciBleHRlbmRzIE9ic2VydmFibGU8bnVtYmVyPiB7XHJcbiAgICAgICAgcHJpdmF0ZSBoYW5kbGU7XHJcbiAgICAgICAgcHJpdmF0ZSBjdXJyZW50VGltZSA9IDA7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgICAgICB0aGlzLm5vdGlmeSh0aGlzLmN1cnJlbnRUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvZ2dsZSgpIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdXNlKCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bWUoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJ0aW1lciBpcyBhbHJlYWR5IHJ1bm5pbmdcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSB0aGlzLmN1cnJlbnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gc2V0SW50ZXJ2YWwoXHJcbiAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5Qcm9ncmVzcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluUHJvZ3Jlc3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vdGlmeSh0aGlzLmN1cnJlbnRUaW1lID0gKGN1cnJlbnRUaW1lIC0gc3RhcnRUaW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblByb2dyZXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIDEwKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXVzZSgpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5oYW5kbGUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwidGltZXIgaXMgbm90IHJ1bm5pbmdcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFRpbWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBUaW1lIGV4dGVuZHMgT2JzZXJ2YWJsZTxudW1iZXI+IHtcclxuICAgICAgICBwcml2YXRlIGhhbmRsZTtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKFRpbWUuZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvZ2dsZSgpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaGFuZGxlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGdldFRpbWUoKSB7XHJcbiAgICAgICAgICAgIHZhciBkID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGQuZ2V0VGltZSgpIC0gKGQuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIDYwICogMTAwMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bWUoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmhhbmRsZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBmID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5vdGlmeShUaW1lLmdldFRpbWUoKSk7XHJcbiAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZSA9IHNldFRpbWVvdXQoZiwgMTApO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhdXNlKCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmhhbmRsZSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmhhbmRsZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1N0cmluZygpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IE9ic2VydmFibGVzOyJdfQ==