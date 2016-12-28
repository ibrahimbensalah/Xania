/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../src/core.ts" />
/// <reference path="../src/store.ts" />
/// <reference path="../src/compile.ts" />
// ReSharper disable InconsistentNaming
describe("compiler 2", function () {
    var Member = Xania.Compile.Member;
    var Pipe = Xania.Compile.Pipe;
    var Const = Xania.Compile.Const;
    var App = Xania.Compile.App;
    var Not = Xania.Compile.Not;
    var Ident = Xania.Compile.Ident;
    var List = Xania.Core.List;
    var ibrahim;
    var ramy;
    beforeEach(function () {
        ibrahim = {
            firstName: "Ibrahim",
            lastName: "ben Salah",
            adult: true
        };
        ramy = {
            firstName: "Ramy",
            lastName: "ben Salah",
            adult: false
        };
    });
    it(':: (.firstName)', 
    // .firstName
    function () {
        var expr = new Member("firstName");
        console.log(expr.toString());
        var actual = expr.compile()(ibrahim);
        expect(actual).toBe('Ibrahim');
    });
    it(':: person |> (.firstName)', function () {
        var expr = new Pipe(new Const(ibrahim, "person"), new Member("firstName"));
        console.log(expr);
        var actual = expr.compile();
        expect(actual()).toBe('Ibrahim');
    });
    it(':: inrement 1', 
    // inrement 1
    function () {
        var increment = function (x) { return (x + 1); };
        var expr = new App(new Const(increment, "increment"), [new Const(1)]);
        var actual = expr.compile();
        expect(actual()).toBe(2);
    });
    it(':: not (.adult)', 
    // not (.adult)
    function () {
        var notAdult = new Not(new Member("adult"));
        console.log(":: " + notAdult);
        var actual = notAdult.compile();
        if (typeof actual === "function")
            expect(actual(ibrahim)).toBe(false);
        else
            fail("expected a function");
    });
    it(':: map (not (.adult)) persons', 
    // 
    function () {
        var notAdult = new Not(new Member("adult"));
        var mapExpr = new App(new Const(List.map, "map"), [notAdult, new Const([ibrahim], " [ person ] ")]);
        console.log(":: " + mapExpr);
        var actual = mapExpr.compile();
        expect(actual()).toEqual([false]);
    });
    var defaultRuntime = {
        prop: function (object, name) {
            return object[name];
        },
        global: function (name) {
            return List[name];
        },
        apply: function (fn, args) {
            return fn.apply(null, args);
        }
    };
    it(':: persons |> map (not .adult)', function () {
        var notAdult = new Not(new Member("adult"));
        var mapExpr = new Pipe(new Const([ibrahim], "everybody"), new App(new Ident("map"), [notAdult]));
        console.log(":: " + mapExpr);
        var actual = mapExpr.compile(defaultRuntime);
        expect(actual()).toEqual([false]);
    });
    it(':: persons |> filter (not .adult) |> map (.firstName)', function () {
        var notAdult = new Not(new Member("adult"));
        var filterExpr = new Pipe(new Const([ibrahim, ramy], "everybody"), new App(new Ident("filter"), [notAdult]));
        var mapExpr = new Pipe(filterExpr, new App(new Ident("map"), [new Member("firstName")]));
        console.log(":: " + mapExpr);
        var actual = mapExpr.compile(defaultRuntime);
        expect(actual()).toEqual(["Ramy"]);
    });
});
describe("Observable", function () {
    it("scalar", function () {
        var arr = [];
        var stream = new Xania.Data.Observable();
        var subscription = stream.subscribe({
            onNext: function (v) {
                console.log(v);
                arr.push(v);
            }
        });
        stream.onNext("a");
        subscription.dispose();
        stream.onNext("b");
        expect(arr).toEqual(["a"]);
    });
});
var ReSharperReporter = window["ReSharperReporter"];
(function (done) {
    ReSharperReporter.prototype.jasmineDone = function () {
        var closeButton = document.createElement("button");
        closeButton.innerHTML = "X CLOSE";
        closeButton.style.padding = "10px";
        closeButton.style.position = "absolute";
        closeButton.style.margin = "0px auto";
        closeButton.addEventListener("click", function () {
            done();
            window.close();
        });
        var div = document.createElement("div");
        div.style.textAlign = "center";
        div.appendChild(closeButton);
        document.body.appendChild(div);
    };
})(ReSharperReporter.prototype.jasmineDone);
// ReSharper restore InconsistentNaming
//# sourceMappingURL=compilerSpec.js.map