/// <reference path="../src/core.js" />
/// <reference path="company.js" />
"use strict";

// ReSharper disable UndeclaredGlobalVariableUsing

var xania = new Company("Xania", [new Employee("Ibrahim", "ben Salah")]);
var compile = TemplateEngine.compile;

describe("Dom Template", function () {
    it("should be able to render attributes", function () {
        // arrange
        var elt = new DomTemplate("div");
        elt.addAttribute("title", compile("@name"));
        // act
        var dom = elt.render(xania)[0];
        // assert
        expect(dom.attributes.title).toEqual("Xania");
        expect(dom.name).toEqual("div");
    });
    it("should be able to render hierarchical dom", function () {
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
    it("should be able to render parent context", function () {
        var elt = new DomTemplate("div");
        elt.data.add("from", "b in ctx : org");
        var childEl = new DomTemplate("span");
        elt.addChild(childEl);
        childEl.addAttribute("title", compile("C:@emp.firstName-B:@b.name-A:@org.name"));
        childEl.data.add("from", "emp in b.employees");
        // act
        var view = elt.render({ "org": xania });
        var dom = view[0];
        // assert
        expect(view.length).toEqual(1);
        expect(dom.children.length).toEqual(1);
        expect(dom.children[0].attributes.title).toEqual("C:Ibrahim-B:Xania-A:Xania");
    });
});

describe("Template Engine", function () {
    it("should compile when zero params", function () {
        var tpl = compile("hallo template");
        var result = tpl(null);
        expect(result).toEqual("hallo template");
    });
    it("should compile member expression", function () {
        var tpl = compile("hallo @a.b-hi @a.c");

        var result = tpl({ a: { b: 1, c: 2 } });
        expect(result).toEqual("hallo 1-hi 2");
    });
});

describe("Select Many Expression", function() {
    it('should collect result objects', function () {
        var expr = SelectManyExpression.create("emp in org.employees");
        var result = expr.execute({ org: xania });
        expect(result.length).toEqual(1);
        expect(result[0].emp.firstName).toEqual("Ibrahim");
        expect(result[0].emp.lastName).toEqual("ben Salah");
    });
    it('should support any source expression', function () {
        var expr = SelectManyExpression.create("emp in {n: org.name}");
        var result = expr.execute({ org: xania });
        expect(result.length).toEqual(1);
        expect(result[0].emp.n).toEqual("Xania");
        expect(result[0].org).toEqual(xania);
    });
});

describe("Context Object", function () {
    it("should expose properties", function () {

        var ctor = function() { console.log("fn ctor"); };
        function fn() { this.constructor = ctor; }
        fn.prototype = A.prototype;
        var Proxy = (function (context) {
            proxy.prototype = new fn();
            function proxy() {
            }
            return proxy;
        })({});

        var a = new A();

        var obj = new Proxy();
        console.log(obj);

        //var model = {x: 1, y: 2};
        //var ctx = (function (context) {
        //    function ctor () {

        //    }
        //    return ctor;
        //})(model);
        //ctx.defineProperty("z", { get: function () { return 3; } });

    });
});

// ReSharper restore UndeclaredGlobalVariableUsing
