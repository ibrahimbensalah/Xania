/// <reference path="../src/core.js" />
/// <reference path="../src/fun.js" />
/// <reference path="../Scripts/jasmine/jasmine.js" />

"use strict";

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
            var actual = fn.execute(context).map(function (ctx) { return ctx.x + ctx.y });
            expect(actual).toEqual([2, 3]);
        });

    //it("should support query expression with selector",
    //    function () {
    //        var fn = compiler.expr("for x in todos |> math.lt 3 -> math.add y x");
    //        var context = {
    //            y: 10,
    //            todos: [1, 2, 3],
    //            math: {
    //                lt: function (max, list) {
    //                    return list.filter(function (x) { return x < max; });
    //                },
    //                add: function (x, y) { return x + y; }
    //            }
    //        };
    //        var actual = fn.execute(context);
    //        expect(actual.length).toEqual(2);
    //        expect(actual.itemAt(0)).toEqual(11);
    //        expect(actual.itemAt(1)).toEqual(12);
    //    });

    //it("should support query expression with simple selector",
    //    function () {
    //        var fn = compiler.expr("(for x in numbers) -> x");
    //        var context = {
    //            numbers: [1, 2]
    //        };
    //        var actual = fn.execute(context);
    //        expect(actual.length).toEqual(2);
    //        expect(actual.itemAt(0)).toEqual(1);
    //        expect(actual.itemAt(1)).toEqual(2);
    //    });

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
            var ast = compiler.expr("x = 123");
            expect(ast.execute({ x: 123 })).toBe(true);
        });
});

describe("tranparant proxy", function () {

    it("keeps track of used properties",
        function () {
            var raw = { store: { numbers: [1] } };
            var subscriber = {};

            var property = new Xania.Property(raw, "store");

            var proxy = property.transparentProxy(subscriber);

            expect(proxy.numbers.isProxy).toBe(true);
            expect(0 < proxy.numbers.length).toBe(true);
            expect(1 < proxy.numbers.length).toBe(false);

            for (var i = 0; i < proxy.numbers.length; i++) {
                expect(proxy.numbers[i]).toBe(raw.store.numbers[i]);
                expect(property.properties.length).toBe(1);
            }
        });

    it("should be invocable when underlying value is a function",
        function () {
            var raw = { add1: function (x) { return x + 1; } };
            var proxyAdd1 = new Xania.Property(raw, "add1").transparentProxy();

            var result = proxyAdd1(1);
            expect(result).toBe(2);
        });


    it("support array operators",
        function () {
            var raw = { numbers: [1, 2, 3, 4, 5] };
            var numbers = new Xania.Property(raw, "numbers").transparentProxy();

            var result = numbers.filter(function (x) { return x % 2 === 0; });
            expect(result).toEqual([2, 4]);
        });

});

describe("tranparant tracking", function () {

    function createZone() {
        return {
            $reads: [],
            $cache: new Map(),
            $target: Symbol("target"),
            $track: function (object) {
                var type = typeof object;
                if (object === null || object === undefined || type === "boolean" || type === "number" || type === "string")
                    return object;

                var proxy = this.$cache.get(object);
                if (!proxy) {
                    proxy = this.$proxy(object);
                    this.$cache.set(object, proxy);
                }

                return proxy;
            },
            $unwrap: function (value) {
                return (!!value && value[this.$target]) || value;
            },
            $proxy: function (object) {
                var proxy = new Proxy(object, {
                    zone: this,
                    get: function (target, name) {
                        if (name === this.zone.$target)
                            return target;
                        var value = target[name];
                        if (typeof value === "function")
                            return value;
                        this.zone.$reads.push({ object: target, property: name });
                        return this.zone.$track(value);
                    },
                    set: function (target, name, value) {
                        target[name] = this.zone.$unwrap(value);
                        return true;
                    }
                });

                return proxy;
            },
            fork: function (func, context) {
                var args = [];
                for (var i = 2; i < arguments.length; i++) {
                    args.push(this.$track(arguments[i]));
                }

                var ctx = this.$track(context);
                var result = func.apply(ctx, args);

                return this.$unwrap(result);
            }
        }
    };

    it("supports equality",
        function () {
            function equals(x, y) {
                return x === y;
            };

            var input = {};

            var x = createZone().fork(equals, null, input, input);
            expect(x).toBe(true);
        });

    it("tracks property access",
        function () {
            var zone = createZone();
            function getName() {
                return this.name;
            };

            var person = { name: "me" };
            var name = zone.fork(getName, person);
            expect(name).toBe("me");

            var read = zone.$reads[0];
            expect(read.object).toBe(person);
            expect(read.property).toBe("name");
        });

    it("object setter set value outside the zone.",
        function () {
            var zone = createZone();
            function addPerson(list, person) {
                list.push(person);
            };

            var list = [];
            var person = { name: "me" };
            zone.fork(addPerson, null, list, person);
            expect(list[0]).toBe(person);
        });

    it("finds element in list.",
        function () {
            var zone = createZone();

            function containsToko(todo) {
                var idx = this.todos.indexOf(todo);
                return idx >= 0;
            };

            var todo = { title: "todo 1" };
            var store = { todos: [todo] };
            var result = zone.fork(containsToko, store, todo);
            expect(result).toBe(true);
        });

    it("iterates over list.",
        function () {
            var zone = createZone();

            function planTime() {
                var totalTime = 0;
                this.todos.forEach(function (todo) {
                    totalTime += todo.time;
                });
                return totalTime;
            };

            var todo1 = { title: "todo 1", time: 1 };
            var todo2 = { title: "todo 2", time: 2 };
            var store = { todos: [todo1, todo2] };

            var result = zone.fork(planTime, store);
            console.log(result);
            expect(result).toBe(3);
        });

    it("does not expose proxies outside the zone.",
        function () {
            var zone = createZone();

            function createObject() {
                return {};
            }

            var result = zone.fork(createObject, null);
            expect(result[zone.$target]).toBeUndefined();
        });

    it("extends behavior passed nested methods.",
        function () {
            var zone = createZone();
            function designWorld(world) {
                world.addPerson("me");

                return world;
            }

            var world = new World();
            var result = zone.fork(designWorld, null, world);

            expect(world).toBe(result);
            expect(world[zone.$target]).toBeUndefined();
            expect(world.persons[zone.$target]).toBeUndefined();
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

var Person = (function () {
    function Person(name) {
        this.name = name;
    }
    return Person;
}());
var World = (function () {
    function World() {
        this.persons = [];
    }
    World.prototype.addPerson = function (name) {
        this.persons.push(new Person("me"));
    };
    return World;
}());
