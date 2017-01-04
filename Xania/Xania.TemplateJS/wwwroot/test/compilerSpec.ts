/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../src/core.ts" />
/// <reference path="interceptreporter.ts" />
/// <reference path="../src/store.ts" />
/// <reference path="../src/compile.ts" />
/// <chutzpah_reference path="../../grammar/fsharp.js" />

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

describe("fsharp parser", () => {

    it(':: 1 + 2',
        () => {
            var ast = fsharp.parse("1 + 2;");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast) + "\r\n ======== \r\n");

            var expr = ast[0];
            expect(expr.type).toBe('app');

            console.log(JSON.stringify(ast));
        });

    it(':: fun a',
        () => {
            var ast = fsharp.parse("fun a;");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast) + "\r\n ======== \r\n");

            var expr = ast[0];
            expect(expr.type).toBe('app');
            expect(expr.fun).toEqual({ type: 'ident', name: 'fun' });
            expect(expr.args).toEqual([{ type: "ident", name: "a" }]);
        });

    it(':: fun ()',
        () => {
            var ast = fsharp.parse("fun ();");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast) + "\r\n ======== \r\n");

            var expr = ast[0];
            expect(expr.type).toBe('app');
            expect(expr.fun).toEqual({ type: 'ident', name: 'fun' });
            expect(expr.args.length).toBe(0);
        });

    it(':: (+) a b',
        () => {
            var ast = fsharp.parse("(+) a b;");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast) + "\r\n ======== \r\n");

            var expr = ast[0];
            expect(expr).toEqual({ "type": "app", "fun": "+", "args": [{ "type": "ident", "name": "a" }, { "type": "ident", "name": "b" }] });
        });

    it(':: a |> b |> c',
        () => {
            var ast = fsharp.parse("a |> b |> c;");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast) + "\r\n ======== \r\n");

            var pipe1 = ast[0];
            expect(pipe1.type).toBe("pipe");
            expect(pipe1.fun).toBe("|>");
            expect(pipe1.args[0]).toEqual({ "type": "ident", "name": "c" });

            var pipe2 = pipe1.args[1];
            expect(pipe2.type).toBe("pipe");
            expect(pipe2.fun).toBe("|>");
            expect(pipe2.args[0]).toEqual({ "type": "ident", "name": "b" });
            expect(pipe2.args[1]).toEqual({ "type": "ident", "name": "a" });
        });

    it(':: a |> b + c',
        () => {
            var ast = fsharp.parse("a |> b + c;");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast) + "\r\n ======== \r\n");

            var pipe = ast[0];
            expect(pipe.type).toBe("pipe");
            expect(pipe.fun).toBe("|>");
            expect(pipe.args[0].fun).toBe("+");
            expect(pipe.args[1].name).toBe("a");

            var add = pipe.args[0];
            expect(add.args[0].name).toBe("c");
            expect(add.args[1].name).toBe("b");

            // [{"type":"pipe","fun":"|>","args":[{"type":"ident","name":"c"},{"type":"pipe","fun":"|>","args":[{"type":"ident","name":"b"},{"type":"ident","name":"a"}]}]}]
        });

    it(':: a >> b ',
        () => {
            var ast = fsharp.parse("a >> b;");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast) + "\r\n ======== \r\n", ast);

            var compose = ast[0];
            expect(compose.type).toBe("compose");
            expect(compose.fun).toBe(">>");
            expect(compose.args[0].name).toBe("b");
            expect(compose.args[1].name).toBe("a");
        });

    it(':: regression test',
        () => {

            var start = new Date().getTime();

            var ast = fsharp.parse("a |> b >> (+) 1 |> d;");
            for (var i = 0; i < 10000; i++) {
                fsharp.parse("a |> b >> (+) 1 |> d;");
            }
            var elapsed = new Date().getTime() - start;

            if (elapsed > 2000)
                fail("too slow");

            console.log("\r\n =========== \r\n" + JSON.stringify(ast) + "\r\n ======== \r\n", ast);

            expect(ast).toEqual(
                [
                    {
                        "type": "pipe",
                        "fun": "|>",
                        "args": [
                            { "type": "ident", "name": "d" }, {
                                "type": "pipe",
                                "fun": "|>",
                                "args": [
                                    {
                                        "type": "compose",
                                        "fun": ">>",
                                        "args": [
                                            {
                                                "type": "app", "fun": "+", "args": [
                                                    { "type": "const", "value": 1 }
                                                ]
                                            },
                                            { "type": "ident", "name": "b" }
                                        ]
                                    }, { "type": "ident", "name": "a" }
                                ]
                            }
                        ]
                    }
                ]
            );
        });
});

