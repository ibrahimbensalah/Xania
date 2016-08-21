/// <reference path="../src/fun.js" />
/// <reference path="../src/core.js" />
/// <reference path="../src/todomvc.js" />
/// <reference path="company.js" />

"use strict";

// ReSharper disable UndeclaredGlobalVariableUsing

var compile = TemplateEngine.compile;
var xania = Company.xania();

function debug() {
    var model = {};
    var observable = new Observer().track(model);
    observable.prop("a", 1);
    console.debug("value of a", model["a"]);
}

describe("Binding", function () {
    it("should be able to init attributes",
        function () {
            // arrange
            var elt = new TagTemplate("div").attr("title", compile("@name"));
            var binding = new TagBinding(elt, xania);
            // act
            var dom = binding.render(xania);
            // assert
            expect(dom.attributes['title'].value).toEqual("Xania");
            expect(dom.tagName).toEqual("DIV");
        });
    it("should be able to render hierarchical dom",
        function () {
            // arrange
            var elt = new TagTemplate("div");
            var childEl = new TagTemplate("span");
            elt.addChild(childEl);
            childEl.attr("title", compile("t:@name"));
            // act
            var target = document.createElement("div");
            new Binder().execute(xania, elt, target);
            // assert
            expect(target.childNodes.length).toEqual(1);
            expect(target.childNodes[0].childNodes.length).toEqual(1);
            expect(target.childNodes[0].childNodes[0].attributes['title'].value).toEqual("t:Xania");
        });
    it("should be able to render parent context",
        function () {
            var elt = new TagTemplate("div");
            elt.for("b of ctx : org");
            var childEl = new TagTemplate("span");
            elt.addChild(childEl);
            childEl.attr("title", compile("C:@emp.firstName-B:@b.name-A:@org.name"));
            childEl.for("emp of b.employees");
            var target = document.createElement("div");
            // act
            new Binder().execute({ "org": Company.xania() }, elt, target);
            // assert
            expect(target.childNodes.length).toEqual(1);
            expect(target.childNodes[0].childNodes.length).toEqual(3);
            expect(target.childNodes[0].childNodes[0].attributes['title'].value).toEqual("C:Ibrahim-B:Xania-A:Xania");
        });
    it("should support promises",
        function () {
            // arrange
            var elt = new TagTemplate("div");
            elt.for("x of url('Xania')");
            elt.attr("title", compile("@x"));
            var url = function (href) { return Xania.promise(href); }
            // act
            var target = document.createElement("div");
            new Binder().execute({ url: url }, elt, target);
            // assert
            expect(target.childNodes[0].attributes['title'].value).toEqual("Xania");
        });
    it('should support typed from expression',
        function () {
            // arrange
            var elt = new TagTemplate("div");
            var loader = function (type) { return Company; };
            elt.for("x of [ new Company('Xania') ]", loader);
            elt.attr("title", compile("@x.getName()"));
            // act
            var target = document.createElement("div");
            new Binder().execute({ loader: loader }, elt, target);
            var dom = target.childNodes[0];
            // assert
            expect(dom.attributes['title'].value).toEqual("Xania");
        });
    it("should support map",
        function () {
            // arrange
            var elt = new TagTemplate("div")
                .for("x of arr.map(bracket)")
                .attr("title", compile("@x"));
            var model = { arr: ["Xania"], bracket: function (x) { return "[" + x + "]" } };
            // act
            var target = document.createElement("div");
            new Binder().execute(model, elt, target);
            // assert
            expect(target.childNodes[0].attributes["title"].value).toEqual("[Xania]");
        });
});

describe("Template Engine", function () {
    it("should compile when zero params",
        function () {
            var tpl = compile("hallo template");
            var result = tpl();
            expect(result).toEqual("hallo template");
        });
    it("should compile member expression",
        function () {
            var tpl = compile("hallo @a.b-hi @a.c");

            var result = tpl({
                a: { b: 1, c: 2 }
            });
            expect(result).toEqual("hallo 1-hi 2");
        });
    it("should compile method call with string arguments",
        function () {
            var tpl = compile("@x.fn('string')");

            var result = tpl({
                x: { fn: function (s) { return s; } }
            });
            expect(result).toEqual("string");
        });
    //it("should compile supports filter expression",
    //    function () {
    //        var tpl = compile("@items |> contains x");

    //        var result = tpl({
    //            items: [1, 2, 3, 4, 5],
    //            contains: function (a, arr) {

    //            }
    //        });
    //        expect(result).toEqual("string");
    //    });
});

describe("Select Many Expression", function () {
    it("should collect result objects",
        function () {
            var expr = SelectManyExpression.parse("emp of org.employees");
            expr.execute({ org: xania }).then(function (result) {
                expect(result.length).toEqual(3);
                expect(result[0].emp.firstName).toEqual("Ibrahim");
                expect(result[0].emp.lastName).toEqual("ben Salah");
                expect(result[1].emp.firstName).toEqual("Ramy");
                expect(result[1].emp.lastName).toEqual("ben Salah");
            });
        });
    it("should support any source expression",
        function () {
            var expr = SelectManyExpression.parse("emp of {n: org.name}");
            expr.execute({ org: xania }).then(function (result) {
                expect(result.length).toEqual(1);
                expect(result[0].emp.n).toEqual(xania.name);
            });
        });
});

describe("shallow copy",
    function () {
        var xania = Company.xania();
        it("should create new object",
            function () {
                var copy = Xania.shallow(xania);
                expect(copy).not.toEqual(xania);
            });
        it("should reuse referenced objects",
            function () {
                var copy = Xania.shallow(xania);
                expect(copy.employees).toEqual(xania.employees);
            });
    });

describe("Xania.observe", function () {
    it("should return transparant proxy",
        function () {
            // arrange
            var employee = new Employee("Ibrahim", "ben Salah");
            var observer = new ObserverHelper();
            // act
            var fullName = Xania.observe(employee, observer).fullName;
            // assert
            expect(fullName).toEqual("Ibrahim ben Salah");
        });
    it("should track field dependencies",
        function () {
            // arrange
            var employee = new Employee("Ibrahim", "ben Salah");
            var observer = new ObserverHelper();
            // act
            var dummy = Xania.observe(employee, observer).fullName;
            // assert
            expect(observer.hasRead(employee, "firstName")).toEqual(true);
            expect(observer.hasRead(employee, "lastName")).toEqual(true);
        });
    it("should track changes",
        function () {
            // arrange
            var employee = new Employee("Ibrahim", "ben Salah");
            var observer = new ObserverHelper();
            // act
            var proxy = Xania.observe(employee, observer);
            proxy.firstName = "dummy";
            // assert
            expect(employee.firstName).toEqual("dummy");
            expect(observer.hasChange(employee, "firstName")).toEqual(true);
            expect(observer.hasChange(employee, "lastName")).toEqual(false);
        });
    it("should track changes of nested objects",
        function () {
            // arrange
            var xania = Company.xania();
            var employee = xania.employees[0];
            var observer = new ObserverHelper();
            // act
            var proxy = Xania.observe(xania, observer);
            proxy.employees[0].firstName = "dummy";
            // assert
            expect(employee.firstName).toEqual("dummy");
            expect(observer.hasChange(employee, "firstName")).toEqual(true);
            expect(observer.hasChange(employee, "lastName")).toEqual(false);
            console.log(observer);
        });
    it("should track array addition",
        function () {
            var arr = [];
            var observer = new ObserverHelper();
            var proxy = Xania.observe(arr, observer);
            proxy.push(1);

            expect(arr).toEqual([1]);
            expect(observer.hasChange(arr, "length")).toEqual(true);
            expect(observer.hasChange(arr, "0")).toEqual(true);
        });

    it("should track array removal",
        function () {
            var arr = [1, 2, 3];
            var observer = new ObserverHelper();
            var proxy = Xania.observe(arr, observer);
            proxy.pop();

            expect(arr).toEqual([1, 2]);
            expect(observer.hasChange(arr, "length")).toEqual(true);
        });

    it("should track array filter",
        function () {
            var model = { app: new TodoApp() };
            var observer = new ObserverHelper();
            var proxy = Xania.observe(model, observer);
            var result = proxy.app.todoStore.getCompleted().empty;

            expect(true).toEqual(result);
            expect(observer.hasRead(model.app.todoStore.todos, "length")).toEqual(true);
        });

    it("should be able to unwrap",
        function () {
            var context = {
                a: Company.xania()
            };
            var observer = new Observer();
            var observable = observer.track(context);

            var result = {
                emp: observable.a.employees[0],
                x: { y: observable.a.employees[0] }
            };
            var unwrapped = Xania.unwrap(result);
            expect(unwrapped.emp.isSpy).toEqual(undefined);
            expect(unwrapped.x.isSpy).toEqual(undefined);
            expect(unwrapped.x.y.isSpy).toEqual(undefined);
        });

    it("should be able to subscribe",
        function () {
            var context = {
                numbers: [1, 2, 3]
            }
            var observer = new Observer();
            observer.subscribe(context,
                function (c) {
                    console.log(c.numbers);
                });

            var observable = observer.track(context);
            observable.numbers = [4, 5, 6];
        });
});

describe("partial application", function () {

    function func(x, y, z) {
        console.log(arguments);
        return x + (y * z);
    }

    it("should accept partial args",
        function () {
            var partial = Xania.partialApp(func, 1, 2);
            expect(partial(2)).toEqual(5);
        });
});

describe("dependency graph", function () {
    it("should register binding", function () {
        var graph = new Observer();
        var xania = Company.xania();

        var b1 = new Binding();
        var b2 = new Binding();

        graph.add(xania, "employees", b1);
        graph.add(xania, "employees", b2);

        console.log(graph);

        expect(graph.get(xania, "employees").has(b1)).toBe(true);
        expect(graph.get(xania, "employees").has(b2)).toBe(true);
    });
});

describe("ready", function () {
    it("should chain result", function () {
        var a, b;
        Xania.promise(Math.random())
            .then(function (x) {
                a = { d: x };
            })
            .then(function (x) {
                b = { d: x };
            });
        expect(b.d === a.d).toBe(true);
    });

    it("should resolve",
        function () {
            var data = Xania.promise(123);

            Xania.promise(data)
                .then(function (d) {
                    return d + 1;
                })
                .then(function (d) {
                    expect(d).toBe(124);
                });
        });
});

describe("state", function () {
    it("should track state",
        function () {
            var model = {
                state: function (k, v) {
                    console.debug(this);
                    if (v === undefined)
                        return this[k];
                    return this[k] = v;
                }
            }

            var observer = new Observer();
            observer.track(model,
                function (observable) {
                    var unwrapped = Xania.unwrap(observable);
                    observable.state("a", 1);
                    expect(observable.state("a")).toBe(1);
                });
        });
})
// ReSharper restore UndeclaredGlobalVariableUsing
