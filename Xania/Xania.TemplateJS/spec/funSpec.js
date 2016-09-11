/// <reference path="../src/fun.js" />
"use strict";

require("../src/fun");

var compiler = new Xania.Ast.Compiler();

describe("compiler", function () {

    it("should support primitives",
        function () {
            var fn = compiler.expr("1.55");
            expect(fn.execute({})).toBe(1.55);
        });

    it("should support identifier expression",
        function () {
            var fn = compiler.expr("a.b.c");
            var context = {
                a: { b: { c: 123 } }
            };
            expect(fn.execute(context)).toBe(123);
        });

    it("should support nested method call expression",
        function () {
            var ast = compiler.expr("add ()");
            var context = {
                add: function () { return 123; }
            };
            expect(ast.execute(context)).toBe(123);
        });

    it("should support property expression",
        function () {
            var fn = compiler.expr("test.seed");
            var context = {
                test: new Test(1.23)
            };
            expect(fn.execute(context)).toBe(1.23);
        });

    it("should support filter expression",
        function () {
            var fn = compiler.expr("todos |> empty");
            var context = {
                todos: [1, 2],
                empty: function (list) { return list.length === 0; }
            };
            expect(fn.execute(context)).toEqual(false);
        });

    it("should support filter expression with arguments",
        function () {
            var fn = compiler.expr("1 |> add 2");
            var context = {
                add: function (x, y) {
                    return x + y;
                }
            };
            expect(fn.execute(context)).toBe(3);
        });

    it("should support query expression",
        function () {
            var fn = compiler.expr("for x in todos |> lt 3");
            var context = {
                y: 1,
                todos: [1, 2, 3],
                lt: function (max, list) {
                    return list.filter(function (x) { return x < max; });
                }
            };
            var actual = fn.execute(context).map(function(ctx) { return ctx.x + ctx.y });
            expect(actual).toEqual([2, 3]);
        });

    it("should support query expression with selector",
        function () {
            var fn = compiler.expr("for x in todos |> math.lt 3 -> math.add 10 x");
            var context = {
                todos: [1, 2, 3],
                math: {
                    lt: function (max, list) {
                        return list.filter(function (x) { return x < max; });
                    },
                    add: function (x, y) { return x + y; }
                }
            };
            var actual = fn.execute(context);
            expect(actual.length).toEqual(2);
            expect(actual.itemAt(0)).toEqual(11);
            expect(actual.itemAt(1)).toEqual(12);
        });

    it("should support text template",
        function () {
            var tpl = compiler.template("hello {{ list |> empty }}!");
            expect(tpl.execute({ list: ["world"], empty: function (l) { return l.length === 0; } })).toBe("hello false!");
        });

    it("should support not expression",
        function () {
            var ast = compiler.expr("not true");
            expect(ast.execute({})).toBe(false);
        });

    it("should support eq expression",
        function () {
            // var ast = compiler.expr("x = 123");
            // expect(ast.execute({x: 123})).toBe(true);
        });
});

var Test = (function () {
    function Test(value) {
        this.value = value;
    }
    Object.defineProperty(Test.prototype, "seed", {
        get: function () {
            return this.value;
        },
        enumerable: true,
        configurable: true
    });
    return Test;
})();

