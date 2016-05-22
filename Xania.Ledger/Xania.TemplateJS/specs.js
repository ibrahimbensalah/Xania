/// <reference path="~/Scripts/jasmine/jasmine.js"/>

// ReSharper disable InconsistentNaming

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var A = (function () {
    function A() {
        this.bla = "bla";
    }
    Object.defineProperty(A.prototype, "test", {
        get: function () { return 1; },
        enumerable: true,
        configurable: true
    });
    return A;
})();
var B = (function (_super) {
    __extends(B, _super);
    function B() {
        _super.apply(this, arguments);
    }
    B.prototype.test2 = function () {
        return 2;
    };
    return B;
})(A);

var xn = {
    proxy: function (B) {
        function P() { }
        for (var k in B.constructor) {
            if (B.constructor.hasOwnProperty(k)) {
                P[k] = B.constructor[k];
            }
        }
        function __() { this.constructor = P; }
        __.prototype = B.constructor.prototype;
        P.prototype = new __();

        for (var prop in B) {
            if (B.hasOwnProperty(prop)) {
                Object.defineProperty(P.prototype, prop, {
                    get: function (obj, p) { return obj[p]; }.bind(this, B, prop),
                    enumerable: true,
                    configurable: true
                });
            }
        }
        return {
            create: function() { return new P; },
            defineProperty: function(prop, getter) {
                Object.defineProperty(P.prototype, prop, {
                    get: getter,
                    enumerable: true,
                    configurable: true
                });
            }
        }
    }
};

describe('Proxy', function () {
    it("should be equal", function () {
        var b = new B();
        var proxy = xn.proxy(b);
        proxy.defineProperty("xprop", function() { return 'x'; });
        var t = proxy.create();

        expect(t.test).toEqual(1);
        expect(t.test2()).toEqual(2);
        expect(t.bla).toEqual("bla");
        expect(t.xprop).toEqual("x");

        b.bla = "bla2";
        expect(t.bla).toEqual("bla2");
    });
});
// ReSharper restore InconsistentNaming
