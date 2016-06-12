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
            var binding = new Binding(elt, xania);
            // act
            var dom = binding.init()[0];
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
            var binding = new Binding(elt, xania);
            // act
            var dom = binding.init()[0];
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
            var binding = new Binding(elt, { "org": xania });
            // act
            var view = binding.init();
            // assert
            expect(view.length).toEqual(1);
            expect(view[0].childNodes.length).toEqual(3);
            expect(view[0].childNodes[0].attributes['title'].value).toEqual("C:Ibrahim-B:Xania-A:Xania");
        });
    it("should support promises",
        function () {
            // arrange
            var elt = new TagElement("div");
            elt.for("x in url('Xania')");
            elt.attr("title", compile("@x"));
            var url = function (href) { return { then: function (res) { res(href); } } };
            var binding = new Binding(elt, { url: url });
            // act
            var dom = binding.init()[0];
            // assert
            expect(dom.attributes['title'].value).toEqual("Xania");
        });
    it('should support typed from expression',
        function () {
            // arrange
            var elt = new TagElement("div");
            var loader = {
                "import": function (type) { return Company; }
            };
            var binder = new Binder(loader, null);
            elt.for(binder.createExpr("x:Company in [{name: 'Xania'}]"));
            elt.attr("title", compile("@x.getName()"));
            var binding = new Binding(elt, { loader: loader });
            // act
            var dom = binding.init()[0];
            // assert
            expect(dom.attributes['title'].value).toEqual("Xania");
        });
    it("should support map",
        function () {
            // arrange
            var elt = new TagElement("div")
                .for("x in arr.map(bracket)")
                .attr("title", compile("@x"));
            var binding = new Binding(elt, { arr: ["Xania"], bracket: function (x) { return "[" + x + "]" } });
            // act
            var view = binding.init();
            // assert
            expect(view[0].attributes['title'].value).toEqual("[Xania]");
        });
    it("should count of elements of simple template",
        function () {
            // arrange
            var binding =
                new TagElement("div")
                    .addChild(new TextContext(compile("@comp.title")))
                    .addChild(new TagElement("span")
                        .for("emp in comp.employees"))
                    .bind([{ comp: xania }, { comp: Company.globalgis() }]);
            var elements = binding.init();
            // act
            binding.find(elements[0].childNodes[0]);
            // assert
            expect(binding.countElements()).toBe(2);
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
            expect(result[0].emp.n).toEqual("Xania");
            expect(result[0].org).toEqual(xania);
        });
});

describe("Proxy", function () {
    it("should be able to proxy complex object",
        function () {
            var xania = Company.xania();
            var proxy = Util.proxy(xania).create();

            expect(proxy.getName()).toEqual("Xania");
        });
    it("should be able to proxy instance object",
        function () {
            var b = { test: 1, test2: function () { return 2 }, bla: "bla" };
            var proxy = Util.proxy(b);
            proxy.prop("xprop", function () { return 'x'; });
            var t = proxy.create();

            expect(t.test).toEqual(1);
            expect(t.test2()).toEqual(2);
            expect(t.bla).toEqual("bla");
            expect(t.xprop).toEqual("x");

            b.bla = "bla2";
            expect(t.bla).toEqual("bla2");
        });
    it("should be able to map on primitive as it was an array",
        function () {
            var obj = Util.proxy(1).create();
            expect(typeof (obj.map)).toEqual("function");
            var result = obj.map(function (x) { return x + 1 });
            expect(result).toEqual([2]);
        });
    it("should be able to map on array",
        function () {
            var obj = Util.proxy([1, 2]).create();
            expect(typeof (obj.map)).toEqual("function");
            var result = obj.map(function (x) { return x + 1 });
            expect(result).toEqual([2, 3]);
        });
    it("should be able to proxy a proxy",
        function () {
            var parent = Util.proxy({ a: 1 }).create();
            var obj = Util.proxy(parent).create();
            expect(obj.a).toEqual(1);
        });
    it("should be able to extend given type",
        function () {
            var company = Util.proxy(Company)
                .init({ "name": 123 })
                .create();
            expect(company.getName()).toEqual(123);
        });
});

describe("Array skip", function () {
    var arr = new SkipArray([1, 2, 3, 4], 1);

    it("should adjust length of the arr",
        function () {
            expect(arr.length).toBe(3);
        });

    it("should adjust index of the arr",
        function () {
            expect(arr.indexOf(2)).toBe(0);
        });

    it("should adjust element at the arr",
        function () {
            expect(arr.elementAt(0)).toBe(2);
        });
});

describe("Reverse skip", function () {
    var arr = new ReverseArray([1, 2, 3, 4]);

    it("should not adjust length of the arr",
        function () {
            expect(arr.length).toBe(4);
        });

    it("should adjust index of the arr",
        function () {
            expect(arr.indexOf(2)).toBe(2);
        });

    it("should adjust element at the arr",
        function () {
            expect(arr.elementAt(0)).toBe(4);
        });
});

// ReSharper restore UndeclaredGlobalVariableUsing
