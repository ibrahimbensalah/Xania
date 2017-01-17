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
                if (this.current !== undefined)
                    for (var i = 0; i < this.subscriptions.length; i++) {
                        this.subscriptions[i].notify(this.current);
                    }
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2YWJsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb2JzZXJ2YWJsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBYyxXQUFXLENBNEh4QjtBQTVIRCxXQUFjLFdBQVc7SUFpQnJCO1FBQUE7WUFFWSxrQkFBYSxHQUFvQixFQUFFLENBQUM7UUFzQmhELENBQUM7UUFuQkcsOEJBQVMsR0FBVCxVQUFVLFFBQWlDO1lBQ3ZDLE1BQU0sQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUVELHdCQUFHLEdBQUgsVUFBSSxNQUFnQjtZQUNoQixJQUFJLFVBQVUsR0FBRyxJQUFJLGdCQUFnQixDQUFJLE1BQU0sQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUN0QixDQUFDO1FBRUQsMkJBQU0sR0FBTixVQUFPLEtBQVE7WUFDWCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxLQUFLLFNBQVMsQ0FBQztvQkFDM0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUNqRCxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQy9DLENBQUM7WUFDVCxDQUFDO1FBQ0wsQ0FBQztR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QUFDLENBQUM7Z0JBQ2hCLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0IsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFFbkIsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsd0JBQVEsR0FBUjtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQzVCLENBQUM7UUFDTCxZQUFDO0lBQUQsQ0FBQyxBQS9DRCxDQUEyQixVQUFVLEdBK0NwQztJQS9DWSxpQkFBSyxRQStDakIsQ0FBQTtBQUNMLENBQUMsRUE1SGEsV0FBVyxHQUFYLG1CQUFXLEtBQVgsbUJBQVcsUUE0SHhCIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IG1vZHVsZSBPYnNlcnZhYmxlcyB7XHJcblxyXG4gICAgZXhwb3J0IGludGVyZmFjZSBJU3Vic2NyaXB0aW9uIHtcclxuICAgICAgICBub3RpZnkodmFsdWUpO1xyXG4gICAgICAgIGRpc3Bvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIElPYnNlcnZhYmxlPFQ+IHtcclxuICAgICAgICBzdWJzY3JpYmVyKG9ic2VydmVyOiBJT2JzZXJ2ZXI8VD4pO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU9ic2VydmVyPFQ+IHtcclxuICAgICAgICBvbk5leHQ/KHY6IFQpO1xyXG4gICAgICAgIG9uRG9uZT8oKTtcclxuICAgICAgICBvbkVycm9yPygpO1xyXG4gICAgfVxyXG5cclxuICAgIGV4cG9ydCBjbGFzcyBPYnNlcnZhYmxlPFQ+IGltcGxlbWVudHMgSU9ic2VydmVyPFQ+IHtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBzdWJzY3JpcHRpb25zOiBJU3Vic2NyaXB0aW9uW10gPSBbXTtcclxuICAgICAgICBwcml2YXRlIGN1cnJlbnQ6IFQ7XHJcblxyXG4gICAgICAgIHN1YnNjcmliZShvYnNlcnZlcjogSU9ic2VydmVyPFQ+IHwgRnVuY3Rpb24pOiBJU3Vic2NyaXB0aW9uIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBTdWJzY3JpcHRpb24odGhpcy5zdWJzY3JpcHRpb25zLCBvYnNlcnZlcikubm90aWZ5KHRoaXMuY3VycmVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtYXAobWFwcGVyOiBGdW5jdGlvbikge1xyXG4gICAgICAgICAgICB2YXIgb2JzZXJ2YWJsZSA9IG5ldyBNYXBwZWRPYnNlcnZhYmxlPFQ+KG1hcHBlcik7XHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlKG9ic2VydmFibGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gb2JzZXJ2YWJsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG9uTmV4dCh2YWx1ZTogVCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50ICE9PSB2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50ICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YnNjcmlwdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zW2ldLm5vdGlmeSh0aGlzLmN1cnJlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjbGFzcyBTdWJzY3JpcHRpb248VD4gaW1wbGVtZW50cyBJU3Vic2NyaXB0aW9uIHtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHN1YnNjcmlwdGlvbnMsIHByaXZhdGUgb2JzZXJ2ZXI6IElPYnNlcnZlcjxUPiB8IEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnMucHVzaCh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5vdGlmeSh2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMub2JzZXJ2ZXIgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICg8RnVuY3Rpb24+dGhpcy5vYnNlcnZlcikodmFsdWUpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAoPElPYnNlcnZlcjxUPj50aGlzLm9ic2VydmVyKS5vbk5leHQodmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaXNwb3NlKCkge1xyXG4gICAgICAgICAgICB2YXIgaWR4ID0gdGhpcy5zdWJzY3JpcHRpb25zLmluZGV4T2YodGhpcyk7XHJcbiAgICAgICAgICAgIGlmIChpZHggPj0gMClcclxuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwic3Vic2NyaXB0aW9uIGlzIG5vdCBmb3VuZFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xhc3MgTWFwcGVkT2JzZXJ2YWJsZTxUPiBleHRlbmRzIE9ic2VydmFibGU8VD4ge1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFwcGVyOiBGdW5jdGlvbikge1xyXG4gICAgICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgb25OZXh0KHZhbHVlOiBUKTogdm9pZCB7XHJcbiAgICAgICAgICAgIHN1cGVyLm9uTmV4dCh0aGlzLm1hcHBlcih2YWx1ZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgY2xhc3MgVGltZXIgZXh0ZW5kcyBPYnNlcnZhYmxlPG51bWJlcj4ge1xyXG4gICAgICAgIHByaXZhdGUgaGFuZGxlO1xyXG4gICAgICAgIHByaXZhdGUgY3VycmVudFRpbWUgPSAwO1xyXG5cclxuICAgICAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICAgICAgc3VwZXIub25OZXh0KHRoaXMuY3VycmVudFRpbWUpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc3VtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9nZ2xlKCkge1xyXG4gICAgICAgICAgICBpZiAoISF0aGlzLmhhbmRsZSlcclxuICAgICAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN1bWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlc3VtZSgpOiB0aGlzIHtcclxuICAgICAgICAgICAgaWYgKCEhdGhpcy5oYW5kbGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInRpbWVyIGlzIGFscmVhZHkgcnVubmluZ1wiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHRoaXMuY3VycmVudFRpbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZSA9IHNldEludGVydmFsKFxyXG4gICAgICAgICAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1cGVyLm9uTmV4dCh0aGlzLmN1cnJlbnRUaW1lID0gKGN1cnJlbnRUaW1lIC0gc3RhcnRUaW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICA2MCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGF1c2UoKTogdGhpcyB7XHJcbiAgICAgICAgICAgIGlmICghIXRoaXMuaGFuZGxlKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuaGFuZGxlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcInRpbWVyIGlzIG5vdCBydW5uaW5nXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRUaW1lO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSJdfQ==