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
            return new Subscription(this, observer).notify(this.current);
        };
        Observable.prototype.map = function (mapper) {
            var observable = new MappedObservable(mapper, this.current);
            this.subscribe(observable);
            return observable;
        };
        Observable.prototype.notify = function (value) {
            this.current = value;
            var next = this.valueOf();
            for (var i = 0; i < this.subscriptions.length; i++) {
                this.subscriptions[i].notify(next);
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
            var _this = _super.call(this, init) || this;
            _this.mapper = mapper;
            return _this;
        }
        MappedObservable.prototype.onNext = function (value) {
            _super.prototype.notify.call(this, value);
        };
        MappedObservable.prototype.valueOf = function () {
            return this.mapper(_super.prototype.valueOf.call(this));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvYnNlcnZhYmxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFjLFdBQVcsQ0FzTXhCO0FBdE1ELFdBQWMsV0FBVztJQWlCckI7UUFLSSxvQkFBWSxPQUFXO1lBSGhCLGtCQUFhLEdBQW9CLEVBQUUsQ0FBQztZQUl2QyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUMzQixDQUFDO1FBRUQsOEJBQVMsR0FBVCxVQUFVLFFBQWlDO1lBQ3ZDLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqRSxDQUFDO1FBRUQsd0JBQUcsR0FBSCxVQUFRLE1BQWlCO1lBQ3JCLElBQUksVUFBVSxHQUFHLElBQUksZ0JBQWdCLENBQVEsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDdEIsQ0FBQztRQUVELDJCQUFNLEdBQU4sVUFBTyxLQUFRO1lBQ1gsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7WUFDckIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDakQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsQ0FBQztRQUNMLENBQUM7UUFFRCw0QkFBTyxHQUFQO1lBQ0ksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFP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O1lBRW5CLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUVELHVCQUFRLEdBQVI7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN4QixDQUFDO1FBQ0wsV0FBQztJQUFELENBQUMsQUFsREQsQ0FBMEIsVUFBVSxHQWtEbkM7SUFsRFksZ0JBQUksT0FrRGhCLENBQUE7QUFDTCxDQUFDLEVBdE1hLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBc014Qjs7QUFFRCxrQkFBZSxXQUFXLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgbW9kdWxlIE9ic2VydmFibGVzIHtcclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElTdWJzY3JpcHRpb24ge1xyXG4gICAgICAgIG5vdGlmeSh2YWx1ZSk7XHJcbiAgICAgICAgZGlzcG9zZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU9ic2VydmFibGU8VD4ge1xyXG4gICAgICAgIHN1YnNjcmliZXIob2JzZXJ2ZXI6IElPYnNlcnZlcjxUPik7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJT2JzZXJ2ZXI8VD4ge1xyXG4gICAgICAgIG9uTmV4dD8odjogVCk7XHJcbiAgICAgICAgb25Eb25lPygpO1xyXG4gICAgICAgIG9uRXJyb3I/KCk7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIE9ic2VydmFibGU8VD4gaW1wbGVtZW50cyBJT2JzZXJ2ZXI8VD4ge1xyXG5cclxuICAgICAgICBwdWJsaWMgc3Vic2NyaXB0aW9uczogSVN1YnNjcmlwdGlvbltdID0gW107XHJcbiAgICAgICAgcHVibGljIGN1cnJlbnQ6IFQ7XHJcblxyXG4gICAgICAgIGNvbnN0cnVjdG9yKGN1cnJlbnQ/OiBUKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IGN1cnJlbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdWJzY3JpYmUob2JzZXJ2ZXI6IElPYnNlcnZlcjxUPiB8IEZ1bmN0aW9uKTogSVN1YnNjcmlwdGlvbiB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgU3Vic2NyaXB0aW9uKHRoaXMsIG9ic2VydmVyKS5ub3RpZnkodGhpcy5jdXJyZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcDxUTT4obWFwcGVyOiAoVCkgPT4gVE0pOiBNYXBwZWRPYnNlcnZhYmxlPFQsIFRNPiB7XHJcbiAgICAgICAgICAgIHZhciBvYnNlcnZhYmxlID0gbmV3IE1hcHBlZE9ic2VydmFibGU8VCwgVE0+KG1hcHBlciwgdGhpcy5jdXJyZW50KTtcclxuICAgICAgICAgICAgdGhpcy5zdWJzY3JpYmUob2JzZXJ2YWJsZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvYnNlcnZhYmxlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbm90aWZ5KHZhbHVlOiBUKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IHZhbHVlO1xyXG4gICAgICAgICAgICB2YXIgbmV4dCA9IHRoaXMudmFsdWVPZigpO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3Vic2NyaXB0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zW2ldLm5vdGlmeShuZXh0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFsdWVPZigpOiBhbnkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBTdWJzY3JpcHRpb248VD4gaW1wbGVtZW50cyBJU3Vic2NyaXB0aW9uIHtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IocHJpdmF0ZSBvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFQ+LCBwcml2YXRlIG9ic2VydmVyOiBJT2JzZXJ2ZXI8VD4gfCBGdW5jdGlvbikge1xyXG4gICAgICAgICAgICBpZiAob2JzZXJ2YWJsZS5zdWJzY3JpcHRpb25zLmluZGV4T2YodGhpcykgPj0gMClcclxuICAgICAgICAgICAgICAgIHRocm93IEVycm9yKFwibWVtIGxlYWtcIik7XHJcblxyXG4gICAgICAgICAgICBvYnNlcnZhYmxlLnN1YnNjcmlwdGlvbnMucHVzaCh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5vdGlmeSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMub2JzZXJ2ZXIgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICg8RnVuY3Rpb24+dGhpcy5vYnNlcnZlcikodmFsdWUpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAoPElPYnNlcnZlcjxUPj50aGlzLm9ic2VydmVyKS5vbk5leHQodmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5vYnNlcnZhYmxlLnN1YnNjcmlwdGlvbnMuaW5kZXhPZih0aGlzKTtcclxuICAgICAgICAgICAgaWYgKGlkeCA+PSAwKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vYnNlcnZhYmxlLnN1YnNjcmlwdGlvbnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInN1YnNjcmlwdGlvbiBpcyBub3QgZm91bmRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBNYXBwZWRPYnNlcnZhYmxlPFQsIFRNPiBleHRlbmRzIE9ic2VydmFibGU8VD4ge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFwcGVyOiAoVCkgPT4gVE0sIGluaXQ6IFQpIHtcclxuICAgICAgICAgICAgc3VwZXIoaW5pdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBvbk5leHQodmFsdWU6IFQpIHtcclxuICAgICAgICAgICAgc3VwZXIubm90aWZ5KHZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhbHVlT2YoKTogVE0ge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXBwZXIoc3VwZXIudmFsdWVPZigpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRpbWVyIGV4dGVuZHMgT2JzZXJ2YWJsZTxudW1iZXI+IHtcclxuICAgICAgICBwcml2YXRlIGhhbmRsZTtcclxuICAgICAgICBwcml2YXRlIGN1cnJlbnRUaW1lID0gMDtcclxuXHJcbiAgICAgICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgICAgIHRoaXMubm90aWZ5KHRoaXMuY3VycmVudFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9nZ2xlKCkge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmhhbmRsZSlcclxuICAgICAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc3VtZSgpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInRpbWVyIGlzIGFscmVhZHkgcnVubmluZ1wiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRoaXMuY3VycmVudFRpbWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5Qcm9ncmVzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGUgPSBzZXRJbnRlcnZhbChcclxuICAgICAgICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpblByb2dyZXNzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5Qcm9ncmVzcyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5KHRoaXMuY3VycmVudFRpbWUgPSAoY3VycmVudFRpbWUgLSBzdGFydFRpbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluUHJvZ3Jlc3MgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgMTApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhdXNlKCk6IHRoaXMge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmhhbmRsZSkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLmhhbmRsZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJ0aW1lciBpcyBub3QgcnVubmluZ1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50VGltZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IGNsYXNzIFRpbWUgZXh0ZW5kcyBPYnNlcnZhYmxlPG51bWJlcj4ge1xyXG4gICAgICAgIHByaXZhdGUgaGFuZGxlO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICAgICAgc3VwZXIoVGltZS5nZXRUaW1lKCkpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9nZ2xlKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5oYW5kbGUpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhdXNlKCk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0aWMgZ2V0VGltZSgpIHtcclxuICAgICAgICAgICAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gZC5nZXRUaW1lKCkgLSAoZC5nZXRUaW1lem9uZU9mZnNldCgpICogNjAgKiAxMDAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc3VtZSgpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGYgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5KFRpbWUuZ2V0VGltZSgpKTtcclxuICAgICAgICAgICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gc2V0VGltZW91dChmLCAxMCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGF1c2UoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaGFuZGxlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU3RyaW5nKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgT2JzZXJ2YWJsZXM7Il19