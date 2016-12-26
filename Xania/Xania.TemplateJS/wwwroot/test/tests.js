/// <reference path="../src/store.ts" />
/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
describe("stream", function () {
    it("scalar", function () {
        var arr = [];
        var stream = new Bus();
        var subscription = stream.subscribe({
            onNext: function (v) {
                console.log(v);
                arr.push(v);
            }
        });
        stream.write("a");
        subscription.dispose();
        stream.write("b");
        expect(arr).toEqual(["a"]);
    });
});
var Bus = (function () {
    function Bus() {
        this.observers = [];
    }
    Bus.prototype.subscribe = function (observer) {
        this.observers.push(observer);
        return new BusSubscription(this, observer);
    };
    Bus.prototype.detach = function (observer) {
        var idx = this.observers.indexOf(observer);
        if (idx >= 0)
            this.observers.splice(idx, 1);
        else
            console.warn("subscription is not found");
    };
    Bus.prototype.write = function (value) {
        for (var i = 0; i < this.observers.length; i++) {
            var obs = this.observers[i];
            obs.onNext(value);
        }
    };
    return Bus;
}());
var BusSubscription = (function () {
    function BusSubscription(bus, observer) {
        this.bus = bus;
        this.observer = observer;
    }
    BusSubscription.prototype.dispose = function () {
        this.bus.detach(this.observer);
    };
    return BusSubscription;
}());
// ReSharper disable once InconsistentNaming
var ReSharperReporter = window['ReSharperReporter'];
(function (done) {
    window.onbeforeunload = function () { return done(); };
})(ReSharperReporter.prototype.jasmineDone);
ReSharperReporter.prototype.jasmineDone = function () { return void 0; };
