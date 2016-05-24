/// <reference path="../src/core.js" />
/// <reference path="../src/binder.js" />
/// <reference path="company.js" />
"use strict";

// ReSharper disable UndeclaredGlobalVariableUsing

var compile = TemplateEngine.compile;
var xania = Company.xania();

var debugtest = function () {
    debugger;
            var parent = Util.proxy({a: 1}).create();
            var obj = Util.proxy(parent).create();
    var a = obj.a;
    debugger;
}

describe("Dom Template", function () {
    it("should be able to render attributes",
        function() {
            // arrange
            var elt = new DomTemplate("div");
            elt.addAttribute("title", compile("@name"));
            // act
            var dom = elt.render(xania)[0];
            // assert
            expect(dom.attributes.title).toEqual("Xania");
            expect(dom.name).toEqual("div");
        });
    it("should be able to render hierarchical dom",
        function() {
            // arrange
            var elt = new DomTemplate("div");
            var childEl = new DomTemplate("span");
            elt.addChild(childEl);
            childEl.addAttribute("title", compile("t:@name"));
            // act
            var dom = elt.render(xania)[0];
            // assert
            expect(dom.children.length).toEqual(1);
            expect(dom.children[0].attributes.title).toEqual("t:Xania");
        });
    it("should be able to render parent context",
        function() {
            var elt = new DomTemplate("div");
            elt.data.add("from", "b in ctx : org");
            var childEl = new DomTemplate("span");
            elt.addChild(childEl);
            childEl.addAttribute("title", compile("C:@emp.firstName-B:@b.name-A:@org.name"));
            childEl.data.add("from", "emp in b.employees");
            // act
            var view = elt.render({ "org": xania });
            // assert
            expect(view.length).toEqual(1);
            expect(view[0].children.length).toEqual(1);
            expect(view[0].children[0].attributes.title).toEqual("C:Ibrahim-B:Xania-A:Xania");
        });
    it("should support promises",
        function() {
            // arrange
            var elt = new DomTemplate("div");
            elt.data.add("from", "x in url('Xania')");
            elt.addAttribute("title", compile("@x"));
            var url = function(href) { return { then: function(res) { res(href); } } };
            // act
            var dom = elt.render({ url: url })[0];
            // assert
            expect(dom.attributes.title).toEqual("Xania");
        });
    it("should support map",
        function() {
            // arrange
            var elt = new DomTemplate("div");
            elt.data.add("from", "x in arr.map(brak)");
            elt.addAttribute("title", compile("@x"));
            // act
            var dom = elt.render({ arr: ['Xania'], brak: function(x) { return "[" + x + "]" } })[0];
            // assert
            expect(dom.attributes.title).toEqual("[Xania]");
        });
});

describe("Template Engine", function () {
    it("should compile when zero params", function () {
        var tpl = compile("hallo template");
        var result = tpl();
        expect(result).toEqual("hallo template");
        });
    it("should compile member expression",
        function() {
            var tpl = compile("hallo @a.b-hi @a.c");

            var result = tpl({
                a: { b: 1, c: 2 }
            });
            expect(result).toEqual("hallo 1-hi 2");
        });
});

describe("Select Many Expression", function () {
    it("should collect result objects",
        function() {
            var expr = SelectManyExpression.create("emp in org.employees");
            var result = expr.execute({ org: xania });
            expect(result.length).toEqual(1);
            expect(result[0].emp.firstName).toEqual("Ibrahim");
            expect(result[0].emp.lastName).toEqual("ben Salah");
        });
    it("should support any source expression",
        function() {
            var expr = SelectManyExpression.create("emp in {n: org.name}");
            var result = expr.execute({ org: xania });
            expect(result.length).toEqual(1);
            expect(result[0].emp.n).toEqual("Xania");
            expect(result[0].org).toEqual(xania);
        });
});

describe("Proxy", function() {
    it("should be able to proxy complex object",
        function() {
            var xania = Company.xania();
            var proxy = Util.proxy(xania).create();

            expect(proxy.getName()).toEqual("Xania");
        });
    it("should be able to proxy instance object",
        function() {
            var b = { test: 1, test2: function() { return 2 }, bla: "bla" };
            var proxy = Util.proxy(b);
            proxy.defineProperty("xprop", function() { return 'x'; });
            var t = proxy.create();

            expect(t.test).toEqual(1);
            expect(t.test2()).toEqual(2);
            expect(t.bla).toEqual("bla");
            expect(t.xprop).toEqual("x");

            b.bla = "bla2";
            expect(t.bla).toEqual("bla2");
        });
    it("should be able to map on primitive as it was an array",
        function() {
            var obj = Util.proxy(1).create();
            expect(typeof (obj.map)).toEqual("function");
            var result = obj.map(function(x) { return x + 1 });
            expect(result).toEqual([2]);
        });
    it("should be able to map on array",
        function() {
            var obj = Util.proxy([1, 2]).create();
            expect(typeof (obj.map)).toEqual("function");
            var result = obj.map(function(x) { return x + 1 });
            expect(result).toEqual([2, 3]);
        });
    it("should be able to proxy a proxy",
        function () {
            var parent = Util.proxy({a: 1}).create();
            var obj = Util.proxy(parent).create();
            expect(obj.a).toEqual(1);
        });
});

// ReSharper restore UndeclaredGlobalVariableUsing
