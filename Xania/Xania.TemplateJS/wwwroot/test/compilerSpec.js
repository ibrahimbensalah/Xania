/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../src/core.ts" />
/// <reference path="../src/store.ts" />
/// <reference path="../src/compile.ts" />
// ReSharper disable InconsistentNaming
describe("compiler 2", function () {
    var XC = Xania.Compile;
    var List = Xania.Core.List;
    var ibrahim, ramy, rania;
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
        rania = {
            firstName: "Rania",
            lastName: "ben Salah",
            adult: false
        };
    });
    it(':: (.firstName)', 
    // .firstName
    function () {
        var expr = XC.Lambda.member("firstName");
        console.log(":: " + expr.toString());
        var actual = expr.execute()(ibrahim);
        expect(actual).toBe('Ibrahim');
    });
    it(':: person |> (.firstName)', function () {
        var expr = new XC.Pipe(new XC.Const(ibrahim, "person"), XC.Lambda.member("firstName"));
        console.log(":: " + expr);
        var actual = expr.execute();
        expect(actual).toBe('Ibrahim');
    });
    it(':: inrement 1', 
    // inrement 1
    function () {
        var increment = function (x) { return (x + 1); };
        var expr = new XC.App(new XC.Const(increment, "increment"), [new XC.Const(1)]);
        console.log(":: " + expr);
        var actual = expr.execute();
        expect(actual).toBe(2);
    });
    it(':: not (.adult)', 
    // not (.adult)
    function () {
        var notAdult = new XC.Not(XC.Lambda.member("adult"));
        console.log(":: " + notAdult);
        var actual = notAdult.execute();
        if (typeof actual === "function")
            expect(actual(ibrahim)).toBe(false);
        else
            fail("expected a function");
    });
    it(':: map (not (.adult)) persons', 
    // 
    function () {
        var notAdult = new XC.Not(XC.Lambda.member("adult"));
        var mapExpr = new XC.App(new XC.Const(List.map, "map"), [notAdult, new XC.Const([ibrahim], " [ibrahim] ")]);
        console.log(":: " + mapExpr);
        var actual = mapExpr.execute();
        expect(actual).toEqual([false]);
    });
    it(':: for p in people do where p.adult select p.firstName', function () {
        var p = new XC.Ident("p");
        var query = new XC.Query("p", new XC.Const([ibrahim, ramy], "[ibrahim, ramy]"));
        var where = new XC.Where(query, new XC.Member(p, "adult"));
        var select = new XC.Select(where, new XC.Member(p, "firstName"));
        console.log(":: " + select);
        var actual = select.execute();
        expect(actual).toEqual(["Ibrahim"]);
    });
    it(':: for p in people do orderBy p.firstName select p.firstName', function () {
        var p = new XC.Ident("p");
        var query = new XC.Query("p", new XC.Const([ramy, ibrahim], "[ramy, ibrahim]"));
        var orderBy = new XC.OrderBy(query, new XC.Member(p, "firstName"));
        var select = new XC.Select(orderBy, new XC.Member(p, "firstName"));
        console.log(":: " + select);
        var actual = select.execute();
        expect(actual).toEqual(["Ibrahim", "Ramy"]);
    });
    it(':: for p in people do groupBy p.adult into g select count ()', function () {
        var p = new XC.Ident("p");
        var query = new XC.Query("p", new XC.Const([ramy, ibrahim, rania], "[ramy, ibrahim, rania]"));
        var groupBy = new XC.GroupBy(query, new XC.Member(p, "adult"), "g");
        var select = new XC.Select(groupBy, new XC.Member(new XC.Ident("g"), "count").app([]));
        console.log(":: " + select);
        var actual = select.execute();
        expect(actual).toEqual([2, 1]);
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
        var notAdult = new XC.Not(XC.Lambda.member("adult"));
        var mapExpr = new XC.Pipe(new XC.Const([ibrahim], "everybody"), new XC.App(new XC.Ident("map"), [notAdult]));
        console.log(":: " + mapExpr);
        var actual = mapExpr.execute(defaultRuntime);
        expect(actual).toEqual([false]);
    });
    it(':: persons |> filter (not .adult) |> map (.firstName)', function () {
        var notAdult = new XC.Not(XC.Lambda.member("adult"));
        var filterExpr = new XC.Pipe(new XC.Const([ibrahim, ramy], "everybody"), new XC.App(new XC.Ident("filter"), [notAdult]));
        var mapExpr = new XC.Pipe(filterExpr, new XC.App(new XC.Ident("map"), [XC.Lambda.member("firstName")]));
        console.log(":: " + mapExpr);
        var actual = mapExpr.execute(defaultRuntime);
        expect(actual).toEqual(["Ramy"]);
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
            try {
                done();
            }
            catch (ex) { }
            window.close();
        });
        var div = document.createElement("div");
        div.style.textAlign = "center";
        div.style.position = "absolute";
        div.style.top = "0";
        div.style.width = "100%";
        div.appendChild(closeButton);
        document.body.appendChild(div);
    };
})(ReSharperReporter.prototype.jasmineDone);
// ReSharper restore InconsistentNaming
//# sourceMappingURL=compilerSpec.js.map