/// <reference path="../src/store.ts" />
/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />

describe("stream", () => {
    it("scalar",
        () => {
            var arr = [];
            var stream = new Xania.Data.Observable<string>();
            var subscription = stream.subscribe({
                onNext(v) {
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
(done => {
    ///....
})(ReSharperReporter.prototype.jasmineDone);
ReSharperReporter.prototype.jasmineDone = () => void 0;