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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb2JzZXJ2YWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBYyxXQUFXLENBMkx4QjtBQTNMRCxXQUFjLFdBQVc7SUFpQnJCO1FBS0ksb0JBQVksT0FBVztZQUhoQixrQkFBYSxHQUFvQixFQUFFLENBQUM7WUFJdkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDM0IsQ0FBQztRQUVELDhCQUFTLEdBQVQsVUFBVSxRQUFpQztZQUN2QyxNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCx3QkFBRyxHQUFILFVBQUksTUFBZ0I7WUFDaEIsSUFBSSxVQUFVLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBSSxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUN0QixDQUFDO1FBRUQsMkJBQU0sR0FBTixVQUFPLEtBQVE7WUFDWCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUNyQixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0wsQ0FBQztRQUVELDRCQUFPLEdBQVA7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN4QixDQUFDO1FBQ0wsaUJBQUM7SUFBRCxDQUFDLEFBN0JELElBNkJDO0lBN0JZLHNCQUFV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ZXhwb3J0IGludGVyZmFjZSBJU3Vic2NyaXB0aW9uIHtcclxuICAgICAgICBub3RpZnkodmFsdWUpO1xyXG4gICAgICAgIGRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElPYnNlcnZhYmxlPFQ+IHtcclxuICAgICAgICBzdWJzY3JpYmVyKG9ic2VydmVyOiBJT2JzZXJ2ZXI8VD4pO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU9ic2VydmVyPFQ+IHtcclxuICAgICAgICBvbk5leHQ/KHY6IFQpO1xyXG4gICAgICAgIG9uRG9uZT8oKTtcclxuICAgICAgICBvbkVycm9yPygpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBPYnNlcnZhYmxlPFQ+IGltcGxlbWVudHMgSU9ic2VydmVyPFQ+IHtcclxuXHJcbiAgICAgICAgcHVibGljIHN1YnNjcmlwdGlvbnM6IElTdWJzY3JpcHRpb25bXSA9IFtdO1xyXG4gICAgICAgIHB1YmxpYyBjdXJyZW50OiBUO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcihjdXJyZW50PzogVCkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBjdXJyZW50O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3Vic2NyaWJlKG9ic2VydmVyOiBJT2JzZXJ2ZXI8VD4gfCBGdW5jdGlvbik6IElTdWJzY3JpcHRpb24ge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFN1YnNjcmlwdGlvbih0aGlzLCBvYnNlcnZlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXAobWFwcGVyOiBGdW5jdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgb2JzZXJ2YWJsZSA9IG5ldyBNYXBwZWRPYnNlcnZhYmxlPFQ+KG1hcHBlciwgdGhpcy5jdXJyZW50KTtcclxuICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUob2JzZXJ2YWJsZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25OZXh0KHZhbHVlOiBUKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IHZhbHVlO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3Vic2NyaXB0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zW2ldLm5vdGlmeSh0aGlzLmN1cnJlbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YWx1ZU9mKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBTdWJzY3JpcHRpb248VD4gaW1wbGVtZW50cyBJU3Vic2NyaXB0aW9uIHtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFQ+LCBwcml2YXRlIG9ic2VydmVyOiBJT2JzZXJ2ZXI8VD4gfCBGdW5jdGlvbikge1xyXG4gICAgICAgICAgICBpZiAob2JzZXJ2YWJsZS5zdWJzY3JpcHRpb25zLmluZGV4T2YodGhpcykgPj0gMClcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwibWVtIGxlYWtcIik7XHJcblxyXG4gICAgICAgICAgICBvYnNlcnZhYmxlLnN1YnNjcmlwdGlvbnMucHVzaCh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5vdGlmeSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMub2JzZXJ2ZXIgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICg8RnVuY3Rpb24+dGhpcy5vYnNlcnZlcikodmFsdWUpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAoPElPYnNlcnZlcjxUPj50aGlzLm9ic2VydmVyKS5vbk5leHQodmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5vYnNlcnZhYmxlLnN1YnNjcmlwdGlvbnMuaW5kZXhPZih0aGlzKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vYnNlcnZhYmxlLnN1YnNjcmlwdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInN1YnNjcmlwdGlvbiBpcyBub3QgZm91bmRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsYXNzIE1hcHBlZE9ic2VydmFibGU8VD4gZXh0ZW5kcyBPYnNlcnZhYmxlPFQ+IHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1hcHBlcjogRnVuY3Rpb24sIGluaXQpIHtcclxuICAgICAgICAgICAgc3VwZXIobWFwcGVyKGluaXQpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uTmV4dCh2YWx1ZTogVCk6IHZvaWQge1xyXG4gICAgICAgICAgICBzdXBlci5vbk5leHQodGhpcy5tYXBwZXIodmFsdWUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRpbWVyIGV4dGVuZHMgT2JzZXJ2YWJsZTxudW1iZXI+IHtcclxuICAgICAgICBwcml2YXRlIGhhbmRsZTtcclxuICAgICAgICBwcml2YXRlIGN1cnJlbnRUaW1lID0gMDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgICAgIHN1cGVyLm9uTmV4dCh0aGlzLmN1cnJlbnRUaW1lKTtcclxuICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvZ2dsZSgpIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdXNlKCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bWUoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJ0aW1lciBpcyBhbHJlYWR5IHJ1bm5pbmdcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSB0aGlzLmN1cnJlbnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgdmFyIGluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gc2V0SW50ZXJ2YWwoXHJcbiAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5Qcm9ncmVzcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluUHJvZ3Jlc3MgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdXBlci5vbk5leHQodGhpcy5jdXJyZW50VGltZSA9IChjdXJyZW50VGltZSAtIHN0YXJ0VGltZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAxMCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGF1c2UoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaGFuZGxlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInRpbWVyIGlzIG5vdCBydW5uaW5nXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUaW1lO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGltZSBleHRlbmRzIE9ic2VydmFibGU8bnVtYmVyPiB7XHJcbiAgICAgICAgcHJpdmF0ZSBoYW5kbGU7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgICAgICBzdXBlcihUaW1lLmdldFRpbWUoKSk7XHJcbiAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b2dnbGUoKSB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wYXVzZSgpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGljIGdldFRpbWUoKSB7XHJcbiAgICAgICAgICAgIHZhciBkID0gbmV3IERhdGUoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGQuZ2V0VGltZSgpIC0gKGQuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIDYwICogMTAwMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXN1bWUoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdXBlci5vbk5leHQoVGltZS5nZXRUaW1lKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIDEwKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGF1c2UoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaGFuZGxlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInRpbWVyIGlzIG5vdCBydW5uaW5nXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSJdfQ==