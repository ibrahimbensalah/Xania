﻿/// <reference path="../src/core.js" />
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

describe("Binder", function () {
    it("should determine dependencies", function () {
        var dependencies = [];
        var px = Util.extend({ emp: new Employee() }, dependencies).create();
        console.log(px.firstName);

        console.log(dependencies);
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
            expect(result[0].org.name).toEqual(xania.name);
        });
});

describe("Proxy", function () {
    it("should be able to proxy complex object",
        function () {
            var xania = Company.xania();
            var proxy = Util.extend(xania).create();

            expect(proxy.getName()).toEqual("Xania");
        });
    it("should be able to proxy instance object",
        function () {
            var b = { test: 1, test2: function () { return 2 }, bla: "bla" };
            var proxy = Util.extend(b);
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
            var obj = Util.extend(1).create();
            expect(typeof (obj.map)).toEqual("function");
            var result = obj.map(function (x) { return x + 1 });
            expect(result).toEqual(2);
        });
    it("should be able to map on array",
        function () {
            var obj = Util.extend([1, 2]).create();
            expect(typeof (obj.map)).toEqual("function");
            var result = obj.map(function (x) { return x + 1 });
            expect(result).toEqual([2, 3]);
        });
    it("should be able to proxy a proxy",
        function () {
            var parent = Util.extend({ a: 1 }).create();
            var obj = Util.extend(parent).create();
            expect(obj.a).toEqual(1);
        });
    it("should be able to extend given type",
        function () {
            var company = Util.extend(Company)
                .init({ "name": 123 })
                .create();
            expect(company.getName()).toEqual(123);
        });
});

describe("spy", function () {
    it("should return getter value",
        function () {
            // arrange
            var employee = new Employee("Ibrahim", "ben Salah");
            var spy = Util.spy(employee);
            // act
            var instance = spy.create();
            // assert
            expect(instance.firstName).toEqual("Ibrahim");
        });
});

describe("dependencies", function () {
    var arr = [];
    for (var i = 0; i < 1000; i++) {
        arr.push(new Employee("Ibrahim " + i, "ben Salah " + i));
    }
    var bigCompany = new Company("Xania", arr);

    it("should return getter value",
        function () {
            // arrange
            var employee = new Employee("Ibrahim", "ben Salah");
            var deps = [];
            // act
            var fullName = Util.observeProperties(employee, deps).fullName;
            // assert
            expect(fullName).toEqual("Ibrahim ben Salah");
            expect(deps).toEqual(["firstName", "lastName"]);
        });
});

describe("partial application", function () {

    function func(x, y, z) {
        console.log(arguments);
        return x + (y * z);
    }

    it("should accept partial args",
        function () {
            var partial = Util.partialApp(func, 1, 2);
            expect(partial(2)).toEqual(5);
        });
});

// ReSharper restore UndeclaredGlobalVariableUsing
