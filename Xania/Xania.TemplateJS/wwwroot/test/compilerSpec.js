System.register(["../src/core", "../src/expression"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var core_1, expression_1;
    var ibrahim, ramy, rania;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (expression_1_1) {
                expression_1 = expression_1_1;
            }],
        execute: function() {
            ibrahim = {
                age: 36,
                firstName: "Ibrahim",
                lastName: "ben Salah",
                adult: true
            };
            ramy = {
                age: 5,
                firstName: "Ramy",
                lastName: "ben Salah",
                adult: false
            };
            rania = {
                age: 3,
                firstName: "Rania",
                lastName: "ben Salah",
                adult: false
            };
            describe("functional expressions", function () {
                var List = core_1.Xania.Core.List;
                it(":: (.firstName)", function () {
                    var expr = expression_1.Expression.Lambda.member("firstName");
                    console.log(":: " + expr.toString());
                    var actual = expr.execute()(ibrahim).valueOf();
                    expect(actual).toBe("Ibrahim");
                });
                it(":: person |> (.firstName)", function () {
                    var expr = new expression_1.Expression.Pipe(new expression_1.Expression.Const(ibrahim, "person"), expression_1.Expression.Lambda.member("firstName"));
                    console.log(":: " + expr);
                    var actual = expr.execute().valueOf();
                    expect(actual).toBe("Ibrahim");
                });
                it(":: inrement 1", function () {
                    var increment = function (x) { return (x + 1); };
                    var expr = new expression_1.Expression.App(new expression_1.Expression.Const(increment, "increment"), [new expression_1.Expression.Const(1)]);
                    console.log(":: " + expr);
                    var actual = expr.execute();
                    expect(actual).toBe(2);
                });
                it(":: not (.adult)", function () {
                    var notAdult = new expression_1.Expression.Not(expression_1.Expression.Lambda.member("adult"));
                    console.log(":: " + notAdult);
                    var actual = notAdult.execute();
                    if (typeof actual === "function")
                        expect(actual(ibrahim)).toBe(false);
                    else
                        fail("expected a function");
                });
                it(":: map (not (.adult)) persons", function () {
                    var notAdult = new expression_1.Expression.Not(expression_1.Expression.Lambda.member("adult"));
                    var mapExpr = new expression_1.Expression.App(new expression_1.Expression.Const(List.map, "map"), [notAdult, new expression_1.Expression.Const([ibrahim], " [ibrahim] ")]);
                    console.log(":: " + mapExpr);
                    var actual = mapExpr.execute();
                    expect(actual).toEqual([false]);
                });
                it(":: for p in people do where p.adult select p.firstName", function () {
                    var p = new expression_1.Expression.Ident("p");
                    var query = new expression_1.Expression.Query("p", new expression_1.Expression.Const([ibrahim, ramy], "[ibrahim, ramy]"));
                    var where = new expression_1.Expression.Where(query, new expression_1.Expression.Member(p, "adult"));
                    var select = new expression_1.Expression.Select(where, new expression_1.Expression.Member(p, "firstName"));
                    console.log(":: " + select);
                    var actual = select.execute().valueOf();
                    console.log(actual);
                    expect(actual).toEqual(["Ibrahim"]);
                });
                it(":: for p in people do orderBy p.firstName select p.firstName", function () {
                    var p = new expression_1.Expression.Ident("p");
                    var query = new expression_1.Expression.Query("p", new expression_1.Expression.Const([ramy, ibrahim], "[ramy, ibrahim]"));
                    var orderBy = new expression_1.Expression.OrderBy(query, new expression_1.Expression.Member(p, "firstName"));
                    var select = new expression_1.Expression.Select(orderBy, new expression_1.Expression.Member(p, "firstName"));
                    console.log(":: " + select);
                    var actual = select.execute();
                    expect(actual).toEqual(["Ibrahim", "Ramy"]);
                });
                it(":: for p in people do groupBy p.adult into g select g.count ()", function () {
                    var p = new expression_1.Expression.Ident("p");
                    var query = new expression_1.Expression.Query("p", new expression_1.Expression.Const([ramy, ibrahim, rania], "[ramy, ibrahim, rania]"));
                    var groupBy = new expression_1.Expression.GroupBy(query, new expression_1.Expression.Member(p, "adult"), "g");
                    var select = new expression_1.Expression.Select(groupBy, new expression_1.Expression.Member(new expression_1.Expression.Ident("g"), "count").app([]));
                    console.log(":: " + select);
                    var actual = select.execute();
                    expect(actual).toEqual([2, 1]);
                });
                var defaultRuntime = {
                    get: function (name) {
                        return List[name];
                    }
                };
                it(":: persons |> map (not .adult)", function () {
                    var notAdult = new expression_1.Expression.Not(expression_1.Expression.Lambda.member("adult"));
                    var mapExpr = new expression_1.Expression.Pipe(new expression_1.Expression.Const([ibrahim], "everybody"), new expression_1.Expression.App(new expression_1.Expression.Ident("map"), [notAdult]));
                    console.log(":: " + mapExpr);
                    var actual = mapExpr.execute(defaultRuntime);
                    expect(actual).toEqual([false]);
                });
                it(":: persons |> filter (not .adult) |> map (.firstName)", function () {
                    var notAdult = new expression_1.Expression.Not(expression_1.Expression.Lambda.member("adult"));
                    var filterExpr = new expression_1.Expression.Pipe(new expression_1.Expression.Const([ibrahim, ramy], "everybody"), new expression_1.Expression.App(new expression_1.Expression.Ident("filter"), [notAdult]));
                    var mapExpr = new expression_1.Expression.Pipe(filterExpr, new expression_1.Expression.App(new expression_1.Expression.Ident("map"), [expression_1.Expression.Lambda.member("firstName")]));
                    console.log(":: " + mapExpr);
                    var actual = mapExpr.execute(defaultRuntime);
                    expect(actual).toEqual(["Ramy"]);
                });
                it(":: unary expression", function () {
                    var add = function (x, y) { return x + y; };
                    var lambda = new expression_1.Expression.Unary(new expression_1.Expression.Const(add, "add"), [new expression_1.Expression.Const(2)]);
                    console.log(":: " + lambda);
                    var actual = lambda.execute();
                    expect(actual(1)).toBe(3);
                });
                it(":: binary expression", function () {
                    var add = function (x, y) { return x + y; };
                    var lambda = new expression_1.Expression.Binary(new expression_1.Expression.Const(add, "add"), [new expression_1.Expression.Const(2)]);
                    console.log(":: " + lambda);
                    var actual = lambda.execute();
                    expect(actual(1, 2)).toBe(3);
                });
            });
            describe("fsharp parser", function () {
                it(':: fun x -> x ', function () {
                    var ast = fsharp.parse("fun x -> x");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var compose = ast;
                    expect(compose.type).toBe("lambda");
                    expect(compose.param).toBe("x");
                    expect(compose.body.name).toBe("x");
                });
                it(':: .firstName ', function () {
                    var ast = fsharp.parse(".firstName");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var compose = ast;
                    expect(compose.type).toBe("lambda");
                    expect(compose.param).toBe("x");
                    expect(compose.body.target.name).toBe("x");
                    expect(compose.body.member.name).toBe("firstName");
                });
                it(':: 1 + 2', function () {
                    var ast = fsharp.parse("1 + 2");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var expr = ast;
                    expect(expr.type).toBe('app');
                    console.log(JSON.stringify(ast, null, 2));
                });
                it(':: fn a', function () {
                    var ast = fsharp.parse("fun a");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var expr = ast;
                    expect(expr.type).toBe('app');
                    expect(expr.fun).toEqual({ type: 'ident', name: 'fun' });
                    expect(expr.args).toEqual([{ type: "ident", name: "a" }]);
                });
                it(':: fn ()', function () {
                    var ast = fsharp.parse("fun ()");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var expr = ast;
                    expect(expr.type).toBe('app');
                    expect(expr.fun).toEqual({ type: 'ident', name: 'fun' });
                    expect(expr.args.length).toBe(0);
                });
                it(':: (+) a b', function () {
                    var ast = fsharp.parse("(+) a b");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var expr = ast;
                    expect(expr).toEqual({ "type": "app", "fun": "+", "args": [{ "type": "ident", "name": "a" }, { "type": "ident", "name": "b" }] });
                });
                it(':: a |> b |> c', function () {
                    var ast = fsharp.parse("a |> b |> c");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var pipe1 = ast;
                    expect(pipe1.type).toBe("pipe");
                    expect(pipe1.fun).toBe("|>");
                    expect(pipe1.args[0]).toEqual({ "type": "ident", "name": "c" });
                    var pipe2 = pipe1.args[1];
                    expect(pipe2.type).toBe("pipe");
                    expect(pipe2.fun).toBe("|>");
                    expect(pipe2.args[0]).toEqual({ "type": "ident", "name": "b" });
                    expect(pipe2.args[1]).toEqual({ "type": "ident", "name": "a" });
                });
                it(':: a + b |> c', function () {
                    var ast = fsharp.parse("a + b |> c");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var pipe = ast;
                    expect(pipe.type).toBe("pipe");
                    expect(pipe.fun).toBe("|>");
                    expect(pipe.args[0]).toEqual({ type: "ident", name: "c" });
                    var add = pipe.args[1];
                    expect(add.args[0].name).toBe("b");
                    expect(add.args[1].name).toBe("a");
                });
                it(':: a >> b ', function () {
                    var ast = fsharp.parse("a >> b");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var compose = ast;
                    expect(compose.type).toBe("compose");
                    expect(compose.fun).toBe(">>");
                    expect(compose.args[0].name).toBe("b");
                    expect(compose.args[1].name).toBe("a");
                });
                it(':: a.b ', function () {
                    var ast = fsharp.parse("a.b");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var compose = ast;
                    expect(compose.type).toBe("member");
                    expect(compose.target.name).toBe("a");
                    expect(compose.member).toBe("b");
                });
                it(':: [1..n] ', function () {
                    var ast = fsharp.parse("[1..n]");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var range = ast;
                    expect(range.type).toBe("range");
                    expect(range.from.value).toBe(1);
                    expect(range.to.name).toBe("n");
                });
                it(':: for p in people where p.adult ', function () {
                    var ast = fsharp.parse("for p in people where p.adult");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var where = ast;
                    expect(where.type).toBe("where");
                    expect(where.predicate.type).toBe("member");
                    expect(where.source.type).toBe("query");
                });
                it(':: regression test', function () {
                    var start = new Date().getTime();
                    var ast = fsharp.parse("a |> b.c >> (+) 1 |> d");
                    for (var i = 0; i < 100; i++) {
                        fsharp.parse("a |> b >> (+) 1 |> d");
                    }
                    var elapsed = new Date().getTime() - start;
                    if (elapsed > 2000)
                        fail("too slow");
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    expect(ast).toEqual({
                        "type": "pipe",
                        "fun": "|>",
                        "args": [
                            {
                                "type": "ident",
                                "name": "d"
                            },
                            {
                                "type": "pipe",
                                "fun": "|>",
                                "args": [
                                    {
                                        "type": "compose",
                                        "fun": ">>",
                                        "args": [
                                            {
                                                "type": "app",
                                                "fun": "+",
                                                "args": [
                                                    {
                                                        "type": "const",
                                                        "value": 1
                                                    }
                                                ]
                                            }, {
                                                "type": "member",
                                                "target": {
                                                    "type": "ident",
                                                    "name": "b"
                                                },
                                                "member": "c"
                                            }
                                        ]
                                    }, {
                                        "type": "ident",
                                        "name": "a"
                                    }
                                ]
                            }
                        ]
                    });
                });
            });
            describe("runtime", function () {
                var fs = function (expr) { return expression_1.Expression.build(fsharp.parse(expr)); };
                it("execute query", function () {
                    var store = new expression_1.Expression.Scope({ people: [ibrahim, ramy, rania], b: 1 });
                    var result = fs("for p in people where p.adult select p").execute(store);
                    expect(result).toEqual([ibrahim.age + 1]);
                });
            });
        }
    }
});
//# sourceMappingURL=compilerSpec.js.map