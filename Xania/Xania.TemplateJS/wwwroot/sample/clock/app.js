var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ClockApp = (function () {
    function ClockApp() {
        this.seconds = new Timer().start();
    }
    return ClockApp;
}());
var Subscription = (function () {
    function Subscription(observers, observer) {
        this.observers = observers;
        this.observer = observer;
    }
    Subscription.prototype.dispose = function () {
        var idx = this.observers.indexOf(this.observer);
        if (idx >= 0)
            this.observers.splice(idx, 1);
        else
            console.warn("subscription is not found");
    };
    return Subscription;
}());
var Observable = (function () {
    function Observable() {
        this.observers = [];
    }
    Observable.prototype.subscribe = function (observer) {
        debugger;
        this.observers.push(observer);
        if (this.current !== undefined) {
            observer.onNext(this.current);
        }
        return new Subscription(this.observers, observer);
    };
    Observable.prototype.write = function (value) {
        if (this.current !== value) {
            this.current = value;
            if (this.current !== undefined)
                for (var i = 0; i < this.observers.length; i++) {
                    var obs = this.observers[i];
                    obs.onNext(value);
                }
        }
    };
    return Observable;
}());
var Timer = (function (_super) {
    __extends(Timer, _super);
    function Timer() {
        _super.apply(this, arguments);
    }
    Timer.prototype.start = function () {
        var _this = this;
        var startTime = new Date().getTime();
        _super.prototype.write.call(this, 0);
        this.handle = setInterval(function () {
            var currentTime = new Date().getTime();
            var seconds = Math.floor((currentTime - startTime) / 1000);
            console.debug("seconds", seconds);
            _super.prototype.write.call(_this, seconds);
        }, 1000);
        return this;
    };
    return Timer;
}(Observable));
