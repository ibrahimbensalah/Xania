/// <reference path="../src/core.js" />
/// <reference path="../src/binder.js" />
/// <reference path="company.js" />

"use strict";

// ReSharper disable UndeclaredGlobalVariableUsing

var compile = TemplateEngine.compile;
var xania = Company.xania();

describe("Binding", function () {
    it("should be able to init attributes",
        function () {
            // arrange
            var elt = new TagElement("div").attr("title", compile("@name"));
            var binding = new TagBinding(elt, xania);
            // act
            var dom = binding.renderTag();
            // assert
            expect(dom.attributes['title'].value).toEqual("Xania");
            expect(dom.tagName).toEqual("DIV");
        });
    it("should be able to render hierarchical dom",
        function () {
            // arrange
            var elt = new TagElement("div");
            var childEl = new TagElement("span");
            elt.addChild(childEl);
            childEl.attr("title", compile("t:@name"));
            var binding = new TagBinding(elt, xania);
            // act
            var dom = binding.init().dom;
            // assert
            expect(dom.childNodes.length).toEqual(1);
            expect(dom.childNodes[0].attributes['title'].value).toEqual("t:Xania");
        });
    it("should be able to render parent context",
        function () {
            var elt = new TagElement("div");
            elt.for("b in ctx : org");
            var childEl = new TagElement("span");
            elt.addChild(childEl);
            childEl.attr("title", compile("C:@emp.firstName-B:@b.name-A:@org.name"));
            childEl.for("emp in b.employees");
            // act
            var bindings = Binding.create(elt, { "org": Company.xania() });
            // assert
            expect(bindings.length).toEqual(1);
            expect(bindings[0].dom.childNodes.length).toEqual(3);
            expect(bindings[0].dom.childNodes[0].attributes['title'].value).toEqual("C:Ibrahim-B:Xania-A:Xania");
        });
    it("should support promises",
        function () {
            // arrange
            var elt = new TagElement("div");
            elt.for("x in url('Xania')");
            elt.attr("title", compile("@x"));
            var url = function (href) { return { then: function (res) { res(href); } } };
            // act
            var bindings = Binding.create(elt, { url: url });
            var dom = bindings[0].dom;
            // assert
            expect(dom.attributes['title'].value).toEqual("Xania");
        });
    it('should support typed from expression',
        function () {
            // arrange
            var elt = new TagElement("div");
            var loader = function (type) { return Company; };
            elt.for("x:Company in [{name: 'Xania'}]", loader);
            elt.attr("title", compile("@x.getName()"));
            // act
            var bindings = Binding.create(elt, { loader: loader });
            var dom = bindings[0].dom;
            // assert
            expect(dom.attributes['title'].value).toEqual("Xania");
        });
    it("should support map",
        function () {
            // arrange
            var elt = new TagElement("div")
                .for("x in arr.map(bracket)")
                .attr("title", compile("@x"));
            var model = { arr: ["Xania"], bracket: function (x) { return "[" + x + "]" } };
            // act
            var bindings = Binding.create(elt, model);
            // assert
            expect(bindings[0].dom.attributes["title"].value).toEqual("[Xania]");
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
});

describe("Select Many Expression", function () {
    it("should collect result objects",
        function () {
            var expr = SelectManyExpression.parse("emp in org.employees");
            var result = expr.execute({ org: xania });
            expect(result.length).toEqual(3);
            expect(result[0].emp.firstName).toEqual("Ibrahim");
            expect(result[0].emp.lastName).toEqual("ben Salah");
            expect(result[1].emp.firstName).toEqual("Ramy");
            expect(result[1].emp.lastName).toEqual("ben Salah");
        });
    it("should support any source expression",
        function () {
            var expr = SelectManyExpression.parse("emp in {n: org.name}");
            var result = expr.execute({ org: xania });
            expect(result.length).toEqual(1);
            expect(result[0].emp.n).toEqual(xania.name);
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

    it("should be able to unwrap",
        function() {
            var context = {
                a: Company.xania()
            };
            var observer = new Observer();
            var observable = observer.observe(context);

            var result = {
                emp: observable.a.employees[0],
                x: { y: observable.a.employees[0] }
            };
            var unwrapped = Xania.unwrap(result);
            expect(unwrapped.emp.isSpy).toEqual(undefined);
            expect(unwrapped.x.isSpy).toEqual(undefined);
            expect(unwrapped.x.y.isSpy).toEqual(undefined);
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

        graph.subscribe(xania, "employees", b1);
        graph.subscribe(xania, "employees", b2);

        console.log(graph);

        expect(graph.get(xania, "employees")).toEqual([b1, b2]);
    });
});
// ReSharper restore UndeclaredGlobalVariableUsing
