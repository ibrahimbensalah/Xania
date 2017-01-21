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
            observable.subscriptions.push(this);
            this.current = observable.current;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb2JzZXJ2YWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBYyxXQUFXLENBMkx4QjtBQTNMRCxXQUFjLFdBQVc7SUFpQnJCO1FBS0ksb0JBQVksT0FBVztZQUhoQixrQkFBYSxHQUFvQixFQUFFLENBQUM7WUFJdkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDM0IsQ0FBQztRQUVELDhCQUFTLEdBQVQsVUFBVSxRQUFpQztZQUN2QyxNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCx3QkFBRyxHQUFILFVBQUksTUFBZ0I7WUFDaEIsSUFBSSxVQUFVLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBSSxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUN0QixDQUFDO1FBRUQsMkJBQU0sR0FBTixVQUFPLEtBQVE7WUFDWCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNyQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0wsQ0FBQztRQUVELDRCQUFPLEdBQVA7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN4QixDQUFDO1FBQ0wsaUJBQUM7SUFBRCxDQUFDLEFBN0JELElBNkJDO0lBN0JZLHNCQUFV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QUFFLENBQUM7WUFDbkIsTUFBTSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQscUJBQU0sR0FBTjtZQUFBLGlCQVlDO1lBWEcsSUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQ3BCO2dCQUNJLElBQUksQ0FBQztvQkFDRCxpQkFBTSxNQUFNLGFBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ2pDLENBQUM7d0JBQVMsQ0FBQztvQkFDUCxLQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2xCLENBQUM7WUFDTCxDQUFDLEVBQ0QsRUFBRSxDQUFDLENBQUM7WUFFUixNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxvQkFBSyxHQUFMO1lBQ0ksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDekMsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBRW5CLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNMLFdBQUM7SUFBRCxDQUFDLEFBNUNELENBQTBCLFVBQVUsR0E0Q25DO0lBNUNZLGdCQUFJLE9BNENoQixDQUFBO0FBQ0wsQ0FBQyxFQTNMYSxXQUFXLEdBQVgsbUJBQVcsS0FBWCxtQkFBVyxRQTJMeEIiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgbW9kdWxlIE9ic2VydmFibGVzIHtcclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElTdWJzY3JpcHRpb24ge1xyXG4gICAgICAgIG5vdGlmeSh2YWx1ZSk7XHJcbiAgICAgICAgZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU9ic2VydmFibGU8VD4ge1xyXG4gICAgICAgIHN1YnNjcmliZXIob2JzZXJ2ZXI6IElPYnNlcnZlcjxUPik7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJT2JzZXJ2ZXI8VD4ge1xyXG4gICAgICAgIG9uTmV4dD8odjogVCk7XHJcbiAgICAgICAgb25Eb25lPygpO1xyXG4gICAgICAgIG9uRXJyb3I/KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIE9ic2VydmFibGU8VD4gaW1wbGVtZW50cyBJT2JzZXJ2ZXI8VD4ge1xyXG5cclxuICAgICAgICBwdWJsaWMgc3Vic2NyaXB0aW9uczogSVN1YnNjcmlwdGlvbltdID0gW107XHJcbiAgICAgICAgcHVibGljIGN1cnJlbnQ6IFQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKGN1cnJlbnQ/OiBUKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IGN1cnJlbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdWJzY3JpYmUob2JzZXJ2ZXI6IElPYnNlcnZlcjxUPiB8IEZ1bmN0aW9uKTogSVN1YnNjcmlwdGlvbiB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgU3Vic2NyaXB0aW9uKHRoaXMsIG9ic2VydmVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcChtYXBwZXI6IEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHZhciBvYnNlcnZhYmxlID0gbmV3IE1hcHBlZE9ic2VydmFibGU8VD4obWFwcGVyLCB0aGlzLmN1cnJlbnQpO1xyXG4gICAgICAgICAgICB0aGlzLnN1YnNjcmliZShvYnNlcnZhYmxlKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9ic2VydmFibGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbk5leHQodmFsdWU6IFQpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gdmFsdWU7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJzY3JpcHRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnNbaV0ubm90aWZ5KHRoaXMuY3VycmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIFN1YnNjcmlwdGlvbjxUPiBpbXBsZW1lbnRzIElTdWJzY3JpcHRpb24ge1xyXG5cclxuICAgICAgICBwcml2YXRlIGN1cnJlbnQ6IFQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgb2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUPiwgcHJpdmF0ZSBvYnNlcnZlcjogSU9ic2VydmVyPFQ+IHwgRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgb2JzZXJ2YWJsZS5zdWJzY3JpcHRpb25zLnB1c2godGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IG9ic2VydmFibGUuY3VycmVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5vdGlmeSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMub2JzZXJ2ZXIgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICg8RnVuY3Rpb24+dGhpcy5vYnNlcnZlcikodmFsdWUpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAoPElPYnNlcnZlcjxUPj50aGlzLm9ic2VydmVyKS5vbk5leHQodmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5vYnNlcnZhYmxlLnN1YnNjcmlwdGlvbnMuaW5kZXhPZih0aGlzKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vYnNlcnZhYmxlLnN1YnNjcmlwdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInN1YnNjcmlwdGlvbiBpcyBub3QgZm91bmRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIE1hcHBlZE9ic2VydmFibGU8VD4gZXh0ZW5kcyBPYnNlcnZhYmxlPFQ+IHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1hcHBlcjogRnVuY3Rpb24sIGluaXQpIHtcclxuICAgICAgICAgICAgc3VwZXIobWFwcGVyKGluaXQpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uTmV4dCh2YWx1ZTogVCk6IHZvaWQge1xyXG4gICAgICAgICAgICBzdXBlci5vbk5leHQodGhpcy5tYXBwZXIodmFsdWUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRpbWVyIGV4dGVuZHMgT2JzZXJ2YWJsZTxudW1iZXI+IHtcclxuICAgICAgICBwcml2YXRlIGhhbmRsZTtcclxuICAgICAgICBwcml2YXRlIGN1cnJlbnRUaW1lID0gMDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgICAgIHN1cGVyLm9uTmV4dCh0aGlzLmN1cnJlbnRUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvZ2dsZSgpIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdXNlKCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bWUoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJ0aW1lciBpcyBhbHJlYWR5IHJ1bm5pbmdcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSB0aGlzLmN1cnJlbnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gc2V0SW50ZXJ2YWwoXHJcbiAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5Qcm9ncmVzcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluUHJvZ3Jlc3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdXBlci5vbk5leHQodGhpcy5jdXJyZW50VGltZSA9IChjdXJyZW50VGltZSAtIHN0YXJ0VGltZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAxMCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGF1c2UoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaGFuZGxlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInRpbWVyIGlzIG5vdCBydW5uaW5nXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUaW1lO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGltZSBleHRlbmRzIE9ic2VydmFibGU8bnVtYmVyPiB7XHJcbiAgICAgICAgcHJpdmF0ZSBoYW5kbGU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICBzdXBlcihUaW1lLmdldFRpbWUoKSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b2dnbGUoKSB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGdldFRpbWUoKSB7XHJcbiAgICAgICAgICAgIHZhciBkID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGQuZ2V0VGltZSgpIC0gKGQuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIDYwICogMTAwMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bWUoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdXBlci5vbk5leHQoVGltZS5nZXRUaW1lKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIDEwKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGF1c2UoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaGFuZGxlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInRpbWVyIGlzIG5vdCBydW5uaW5nXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSJdfQ==