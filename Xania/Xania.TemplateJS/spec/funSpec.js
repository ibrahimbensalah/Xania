/// <reference path="../src/core.js" />
/// <reference path="../src/fun.js" />
/// <reference path="../src/zone.js" />
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

    it("should support property selector",
        function () {
            var fn = compiler.expr("map firstName persons");
            var context = {
                map: Xania.Fun.List.map,
                persons: [
                    { firstName: "Ibrahim", lastName: "ben Salah" },
                    { firstName: "Ramy", lastName: "ben Salah" }
                ]
            };
            var actual = fn.execute(context);
            expect(actual).toEqual(["Ibrahim", "Ramy"]);
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

describe("tranparant tracking", function () {

    var defaultRuntime = {
        get: function (object, name) {
            return object[name];
        },
        set: function (object, name, value) {
            object[name] = value;
        },
        apply: function (target, thisArg, args) {
            return target.apply(thisArg, args);
        }
    };

    it("supports equality",
        function () {
            function equals(x, y) {
                return x === y;
            };

            var input = {};

            var x = new Xania.Zone(defaultRuntime).run(equals, null, [input, input]);
            expect(x).toBe(true);
        });

    it("tracks property access",
        function () {
            var zone = new Xania.Zone(defaultRuntime);
            function getName() {
                return this.name;
            };

            var person = { name: "me" };
            var name = zone.run(getName, person);
            expect(name).toBe("me");
        });

    it("object setter set value outside the zone.",
        function () {
            var zone = new Xania.Zone(defaultRuntime);
            function addPerson(list, person) {
                list.push(person);
            };

            var list = [];
            var person = { name: "me" };
            zone.run(addPerson, null, [list, person]);
            expect(list[0]).toBe(person);
        });

    it("finds element in list.",
        function () {
            var zone = new Xania.Zone(defaultRuntime);

            function containsToko(todo) {
                var idx = this.todos.indexOf(todo);
                return idx >= 0;
            };

            var todo = { title: "todo 1" };
            var store = { todos: [todo] };
            var result = zone.run(containsToko, store, [todo]);
            expect(result).toBe(true);
        });

    it("iterates over list.",
        function () {
            var zone = new Xania.Zone(defaultRuntime);

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

            var result = zone.run(planTime, store);
            console.log(result);
            expect(result).toBe(3);
        });

    it("does not expose proxies outside the zone.",
        function () {
            var zone = new Xania.Zone(defaultRuntime);

            function createObject() {
                return {};
            }

            var result = zone.run(createObject, null);
            expect(result[zone.$target]).toBeUndefined();
        });

    it("extends behavior passed nested methods.",
        function () {
            var zone = new Xania.Zone(defaultRuntime);
            function designWorld(world) {
                world.addPerson("me");

                return world;
            }

            var world = new World();
            var result = zone.run(designWorld, null, [world]);

            expect(world).toBe(result);
            expect(world[zone.$target]).toBeUndefined();
            expect(world.persons[zone.$target]).toBeUndefined();
        });

    it("unwraps array elements.",
        function () {
            function copy(list) {
                var result = [];
                for (var i = 0; i < list.length; i++) {
                    result.push(list[i]);
                }
                return result;
            }
            var zone = new Xania.Zone(defaultRuntime);
            var list = [{ id: 1 }, { id: 2 }];
            var result = zone.run(copy, null, [list]);

            expect(result[0]).toBe(list[0]);
        });


    it("supports alternative object model.",
        function () {
            var binding = {
                result: [],
                context: null,
                get: function (object, name) {
                    var result = object.get(name);

                    if (!!result.subscribe) {
                        result.subscribe(this);

                        var type = typeof result.value;
                        if (result.value === null ||
                            type === "function" ||
                            type === "undefined" ||
                            type === "boolean" ||
                            type === "number" ||
                            type === "string")
                            return result.value;
                    }

                    return result;
                },
                set: function (object, name, value) {
                    object.set(name, value);
                    return true;
                },
                update(context) {
                    this.context = context;

                    function designWorld(world) {
                        return world.persons.map(function (x) { return x.name; });
                    }

                    var zone = new Xania.Zone(binding);
                    this.result = zone.run(designWorld, null, [this.context]);

                    return this.result;
                },
                notify: function () {
                    this.update(this.context);
                }
            };

            var world = new World();
            binding.update(new Xania.Property({ world }, "world"));
            //var result = zone.run(designWorld, null, world);


            expect([]).toEqual(binding.result);
            world.addPerson("ibrahim");
            expect([]).toEqual(binding.result);
            Xania.RootContainer.updateValue(binding.context);
            expect(["ibrahim"]).toEqual(binding.result);
            world.addPerson("abeer");
            expect(["ibrahim"]).toEqual(binding.result);
            Xania.RootContainer.updateValue(binding.context);
            expect(["ibrahim", "abeer"]).toEqual(binding.result);
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
        this.persons.push(new Person(name));
    };
    return World;
}());
