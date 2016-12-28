/// <reference path="../src/store.ts" />
/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
describe("stream", function () {
    it("scalar", function () {
        var arr = [];
        var stream = new Xania.Data.Observable();
        var subscription = stream.subscribe({
            onNext: function (v) {
                console.log(v);
                arr.push(v);
            }
        });
        stream.onNext("a");
        subscription.dispose();
        stream.onNext("b");
        expect(arr).toEqual(["a"]);
    });
});
// ReSharper disable once InconsistentNaming
var ReSharperReporter = window["ReSharperReporter"];
(function (done) {
    ///....
})(ReSharperReporter.prototype.jasmineDone);
ReSharperReporter.prototype.jasmineDone = function () { return void 0; };
//# sourceMappingURL=tests.js.map