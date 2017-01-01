/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../src/core.ts" />
/// <reference path="../src/store.ts" />
/// <reference path="../src/compile.ts" />

var ibrahim: { firstName: string; lastName: string; adult: boolean },
    ramy: { firstName: string; lastName: string; adult: boolean },
    rania: { firstName: string; lastName: string; adult: boolean };

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

// ReSharper disable InconsistentNaming
describe("functional expressions", () => {

    var XC = Xania.Compile;
    var List = Xania.Core.List;

    it(":: (.firstName)",
        // .firstName
        () => {
            var expr = XC.Lambda.member("firstName");
            console.log(":: " + expr.toString());

            var actual = expr.execute()(ibrahim);
            expect(actual).toBe("Ibrahim");
        });

    it(":: person |> (.firstName)",
        () => {
            var expr = new XC.Pipe(new XC.Const(ibrahim, "person"), XC.Lambda.member("firstName"));
            console.log(":: " + expr);

            var actual = expr.execute();
            expect(actual).toBe("Ibrahim");

        });

    it(":: inrement 1",
        // inrement 1
        () => {
            var increment = x => (x + 1);
            var expr = new XC.App(new XC.Const(increment, "increment"), [new XC.Const(1)]);
            console.log(`:: ${expr}`);

            var actual = expr.execute();
            expect(actual).toBe(2);
        });

    it(":: not (.adult)",
        // not (.adult)
        () => {
            var notAdult = new XC.Not(XC.Lambda.member("adult"));
            console.log(`:: ${notAdult}`);
            var actual = notAdult.execute();
            if (typeof actual === "function")
                expect(actual(ibrahim)).toBe(false);
            else
                fail("expected a function");
        });

    it(":: map (not (.adult)) persons",
        // 
        () => {
            var notAdult = new XC.Not(XC.Lambda.member("adult"));
            var mapExpr = new XC.App(new XC.Const(List.map, "map"), [notAdult, new XC.Const([ibrahim], " [ibrahim] ")]);
            console.log(`:: ${mapExpr}`);

            var actual = mapExpr.execute();
            expect(actual).toEqual([false]);

        });

    it(":: for p in people do where p.adult select p.firstName",
        () => {
            var p = new XC.Ident("p");
            var query = new XC.Query("p", new XC.Const([ibrahim, ramy], "[ibrahim, ramy]"));
            var where = new XC.Where(query, new XC.Member(p, "adult"));
            var select = new XC.Select(where, new XC.Member(p, "firstName"));
            console.log(`:: ${select}`);

            var actual = select.execute();
            expect(actual).toEqual(["Ibrahim"]);
        });

    it(":: for p in people do orderBy p.firstName select p.firstName",
        () => {
            var p = new XC.Ident("p");
            var query = new XC.Query("p", new XC.Const([ramy, ibrahim], "[ramy, ibrahim]"));
            var orderBy = new XC.OrderBy(query, new XC.Member(p, "firstName"));
            var select = new XC.Select(orderBy, new XC.Member(p, "firstName"));
            console.log(`:: ${select}`);

            var actual = select.execute();
            expect(actual).toEqual(["Ibrahim", "Ramy"]);
        });

    it(":: for p in people do groupBy p.adult into g select g.count ()",
        () => {
            var p = new XC.Ident("p");
            var query = new XC.Query("p", new XC.Const([ramy, ibrahim, rania], "[ramy, ibrahim, rania]"));
            var groupBy = new XC.GroupBy(query, new XC.Member(p, "adult"), "g");
            var select = new XC.Select(groupBy, new XC.Member(new XC.Ident("g"), "count").app([]));
            console.log(`:: ${select}`);

            var actual = select.execute();
            expect(actual).toEqual([2, 1]);
        });

    var defaultRuntime: Xania.Compile.IScope = {
        get(object: any, name: string): any {
            return object[name];
        },
        variable(name: string) {
            return List[name];
        }
    };

    it(":: persons |> map (not .adult)",
        () => {
            var notAdult = new XC.Not(XC.Lambda.member("adult"));
            var mapExpr = new XC.Pipe(new XC.Const([ibrahim], "everybody"), new XC.App(new XC.Ident("map"), [notAdult]));
            console.log(":: " + mapExpr);

            var actual = mapExpr.execute(defaultRuntime);
            expect(actual).toEqual([false]);

        });

    it(":: persons |> filter (not .adult) |> map (.firstName)",
        () => {
            var notAdult = new XC.Not(XC.Lambda.member("adult"));
            var filterExpr = new XC.Pipe(new XC.Const([ibrahim, ramy], "everybody"), new XC.App(new XC.Ident("filter"), [notAdult]));

            var mapExpr = new XC.Pipe(filterExpr, new XC.App(new XC.Ident("map"), [XC.Lambda.member("firstName")]));
            console.log(`:: ${mapExpr}`);

            var actual = mapExpr.execute(defaultRuntime);
            expect(actual).toEqual(["Ramy"]);
        });

    it(":: unary expression",
        () => {
            var add = (x, y) => x + y;
            var lambda = new XC.Unary(new XC.Const(add, "add"), [new XC.Const(2)]);
            console.log(`:: ${lambda}`);

            var actual = lambda.execute();

            expect(actual(1)).toBe(3);
        });

    it(":: binary expression",
        () => {
            var add = (x, y) => x + y;
            var lambda = new XC.Binary(new XC.Const(add, "add"), [new XC.Const(2)]);
            console.log(`:: ${lambda}`);

            var actual = lambda.execute();

            expect(actual(1, 2)).toBe(3);
        });
});

var ReSharperReporter = window["ReSharperReporter"];
(done => {
    ReSharperReporter.prototype.jasmineDone = () => {
        var closeButton = document.createElement("button");
        closeButton.innerHTML = "X CLOSE";
        closeButton.style.padding = "10px";
        closeButton.style.position = "absolute";
        closeButton.style.margin = "0px auto";
        closeButton.addEventListener("click", () => {
            try { done(); } catch (ex) { }
            window.close();
        });

        var div = document.createElement("div");
        div.style.textAlign = "center";
        div.style.position = "absolute";
        div.style.top = "0";
        div.style.width = "100%";
        div.appendChild(closeButton);
        document.body.appendChild(div);

        document.addEventListener("keypress", evt => {
            if (evt.keyCode === 13) {
                closeButton.click();
            }
        });
    };
})(ReSharperReporter.prototype.jasmineDone);

// ReSharper restore InconsistentNaming















