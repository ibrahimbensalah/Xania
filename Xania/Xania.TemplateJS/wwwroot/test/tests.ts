/// <reference path="../src/store.ts" />
/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="interceptreporter.ts" />

"use strict";

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
