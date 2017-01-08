(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
System.register(["../src/core", "../src/expression"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var core_1, expression_1, ibrahim, ramy, rania;
    return {
        setters: [
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (expression_1_1) {
                expression_1 = expression_1_1;
            }
        ],
        execute: function () {
            console.log("executing spec");
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
            describe("functional expressions", function () {
                var List = core_1.Xania.Core.List;
                it(":: (.firstName)", function () {
                    var expr = expression_1.Expression.Lambda.member("firstName");
                    console.log(":: " + expr.toString());
                    var actual = expr.execute()(ibrahim);
                    expect(actual).toBe("Ibrahim");
                });
                it(":: person |> (.firstName)", function () {
                    var expr = new expression_1.Expression.Pipe(new expression_1.Expression.Const(ibrahim, "person"), expression_1.Expression.Lambda.member("firstName"));
                    console.log(":: " + expr);
                    var actual = expr.execute();
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
                    var actual = select.execute();
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
                    get: function (object, name) {
                        return object[name];
                    },
                    variable: function (name) {
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
                    var ast = fsharp.parse("fun x -> x;");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var compose = ast[0];
                    expect(compose.type).toBe("lambda");
                    expect(compose.param).toBe("x");
                    expect(compose.body.name).toBe("x");
                });
                it(':: .firstName ', function () {
                    var ast = fsharp.parse(".firstName;");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var compose = ast[0];
                    expect(compose.type).toBe("lambda");
                    expect(compose.param).toBe("x");
                    expect(compose.body.target.name).toBe("x");
                    expect(compose.body.member.name).toBe("firstName");
                });
                it(':: 1 + 2', function () {
                    var ast = fsharp.parse("1 + 2;");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var expr = ast[0];
                    expect(expr.type).toBe('app');
                    console.log(JSON.stringify(ast, null, 2));
                });
                it(':: fn a', function () {
                    var ast = fsharp.parse("fun a;");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var expr = ast[0];
                    expect(expr.type).toBe('app');
                    expect(expr.fun).toEqual({ type: 'ident', name: 'fun' });
                    expect(expr.args).toEqual([{ type: "ident", name: "a" }]);
                });
                it(':: fn ()', function () {
                    var ast = fsharp.parse("fun ();");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var expr = ast[0];
                    expect(expr.type).toBe('app');
                    expect(expr.fun).toEqual({ type: 'ident', name: 'fun' });
                    expect(expr.args.length).toBe(0);
                });
                it(':: (+) a b', function () {
                    var ast = fsharp.parse("(+) a b;");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var expr = ast[0];
                    expect(expr).toEqual({ "type": "app", "fun": "+", "args": [{ "type": "ident", "name": "a" }, { "type": "ident", "name": "b" }] });
                });
                it(':: a |> b |> c', function () {
                    var ast = fsharp.parse("a |> b |> c;");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
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
                it(':: a + b |> c', function () {
                    var ast = fsharp.parse("a + b |> c;");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");
                    var pipe = ast[0];
                    expect(pipe.type).toBe("pipe");
                    expect(pipe.fun).toBe("|>");
                    expect(pipe.args[0]).toEqual({ type: "ident", name: "c" });
                    var add = pipe.args[1];
                    expect(add.args[0].name).toBe("b");
                    expect(add.args[1].name).toBe("a");
                });
                it(':: a >> b ', function () {
                    var ast = fsharp.parse("a >> b;");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var compose = ast[0];
                    expect(compose.type).toBe("compose");
                    expect(compose.fun).toBe(">>");
                    expect(compose.args[0].name).toBe("b");
                    expect(compose.args[1].name).toBe("a");
                });
                it(':: a.b ', function () {
                    var ast = fsharp.parse("a.b;");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var compose = ast[0];
                    expect(compose.type).toBe("member");
                    expect(compose.target.name).toBe("a");
                    expect(compose.member).toBe("b");
                });
                it(':: [1..n] ', function () {
                    var ast = fsharp.parse("[1..n];");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var range = ast[0];
                    expect(range.type).toBe("range");
                    expect(range.from.value).toBe(1);
                    expect(range.to.name).toBe("n");
                });
                it(':: for p in people where p.adult ', function () {
                    var ast = fsharp.parse("for p in people where p.adult;");
                    expect(ast).toBeDefined();
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    var where = ast[0];
                    expect(where.type).toBe("where");
                    expect(where.predicate.type).toBe("member");
                    expect(where.source.type).toBe("query");
                });
                it(':: regression test', function () {
                    var start = new Date().getTime();
                    var ast = fsharp.parse("a |> b.c >> (+) 1 |> d;");
                    for (var i = 0; i < 100; i++) {
                        fsharp.parse("a |> b >> (+) 1 |> d;");
                    }
                    var elapsed = new Date().getTime() - start;
                    if (elapsed > 2000)
                        fail("too slow");
                    console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);
                    expect(ast).toEqual([
                        {
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
                        }
                    ]);
                });
            });
            describe("runtime", function () {
                var fs = function (expr) { return expression_1.Expression.build(fsharp.parse(expr)[0]); };
                it("execute query", function () {
                    var store = new expression_1.Expression.Scope(undefined, { people: [ibrahim, ramy, rania] });
                    var result = fs("for p in people where p.adult;").execute(store);
                    var p = result[0].variable("p");
                    expect(p.variable("firstName")).toBe("Ibrahim");
                });
            });
        }
    };
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3d3dyb290L3Rlc3QvY29tcGlsZXJTcGVjLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJTeXN0ZW0ucmVnaXN0ZXIoW1wiLi4vc3JjL2NvcmVcIiwgXCIuLi9zcmMvZXhwcmVzc2lvblwiXSwgZnVuY3Rpb24gKGV4cG9ydHNfMSwgY29udGV4dF8xKSB7XHJcbiAgICBcInVzZSBzdHJpY3RcIjtcclxuICAgIHZhciBfX21vZHVsZU5hbWUgPSBjb250ZXh0XzEgJiYgY29udGV4dF8xLmlkO1xyXG4gICAgdmFyIGNvcmVfMSwgZXhwcmVzc2lvbl8xLCBpYnJhaGltLCByYW15LCByYW5pYTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc2V0dGVyczogW1xyXG4gICAgICAgICAgICBmdW5jdGlvbiAoY29yZV8xXzEpIHtcclxuICAgICAgICAgICAgICAgIGNvcmVfMSA9IGNvcmVfMV8xO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoZXhwcmVzc2lvbl8xXzEpIHtcclxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb25fMSA9IGV4cHJlc3Npb25fMV8xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBleGVjdXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXhlY3V0aW5nIHNwZWNcIik7XHJcbiAgICAgICAgICAgIGlicmFoaW0gPSB7XHJcbiAgICAgICAgICAgICAgICBmaXJzdE5hbWU6IFwiSWJyYWhpbVwiLFxyXG4gICAgICAgICAgICAgICAgbGFzdE5hbWU6IFwiYmVuIFNhbGFoXCIsXHJcbiAgICAgICAgICAgICAgICBhZHVsdDogdHJ1ZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByYW15ID0ge1xyXG4gICAgICAgICAgICAgICAgZmlyc3ROYW1lOiBcIlJhbXlcIixcclxuICAgICAgICAgICAgICAgIGxhc3ROYW1lOiBcImJlbiBTYWxhaFwiLFxyXG4gICAgICAgICAgICAgICAgYWR1bHQ6IGZhbHNlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJhbmlhID0ge1xyXG4gICAgICAgICAgICAgICAgZmlyc3ROYW1lOiBcIlJhbmlhXCIsXHJcbiAgICAgICAgICAgICAgICBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIixcclxuICAgICAgICAgICAgICAgIGFkdWx0OiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBkZXNjcmliZShcImZ1bmN0aW9uYWwgZXhwcmVzc2lvbnNcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIExpc3QgPSBjb3JlXzEuWGFuaWEuQ29yZS5MaXN0O1xyXG4gICAgICAgICAgICAgICAgaXQoXCI6OiAoLmZpcnN0TmFtZSlcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBleHByID0gZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uTGFtYmRhLm1lbWJlcihcImZpcnN0TmFtZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIjo6IFwiICsgZXhwci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0dWFsID0gZXhwci5leGVjdXRlKCkoaWJyYWhpbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGFjdHVhbCkudG9CZShcIklicmFoaW1cIik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGl0KFwiOjogcGVyc29uIHw+ICguZmlyc3ROYW1lKVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV4cHIgPSBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uUGlwZShuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uQ29uc3QoaWJyYWhpbSwgXCJwZXJzb25cIiksIGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLkxhbWJkYS5tZW1iZXIoXCJmaXJzdE5hbWVcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiOjogXCIgKyBleHByKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0dWFsID0gZXhwci5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGFjdHVhbCkudG9CZShcIklicmFoaW1cIik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGl0KFwiOjogaW5yZW1lbnQgMVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluY3JlbWVudCA9IGZ1bmN0aW9uICh4KSB7IHJldHVybiAoeCArIDEpOyB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBleHByID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLkFwcChuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uQ29uc3QoaW5jcmVtZW50LCBcImluY3JlbWVudFwiKSwgW25ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5Db25zdCgxKV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiOjogXCIgKyBleHByKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0dWFsID0gZXhwci5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGFjdHVhbCkudG9CZSgyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaXQoXCI6OiBub3QgKC5hZHVsdClcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBub3RBZHVsdCA9IG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5Ob3QoZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uTGFtYmRhLm1lbWJlcihcImFkdWx0XCIpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIjo6IFwiICsgbm90QWR1bHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWwgPSBub3RBZHVsdC5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhY3R1YWwgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGFjdHVhbChpYnJhaGltKSkudG9CZShmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWlsKFwiZXhwZWN0ZWQgYSBmdW5jdGlvblwiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaXQoXCI6OiBtYXAgKG5vdCAoLmFkdWx0KSkgcGVyc29uc1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdEFkdWx0ID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLk5vdChleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5MYW1iZGEubWVtYmVyKFwiYWR1bHRcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtYXBFeHByID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLkFwcChuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uQ29uc3QoTGlzdC5tYXAsIFwibWFwXCIpLCBbbm90QWR1bHQsIG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5Db25zdChbaWJyYWhpbV0sIFwiIFtpYnJhaGltXSBcIildKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIjo6IFwiICsgbWFwRXhwcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbCA9IG1hcEV4cHIuZXhlY3V0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwoW2ZhbHNlXSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGl0KFwiOjogZm9yIHAgaW4gcGVvcGxlIGRvIHdoZXJlIHAuYWR1bHQgc2VsZWN0IHAuZmlyc3ROYW1lXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5JZGVudChcInBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLlF1ZXJ5KFwicFwiLCBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uQ29uc3QoW2licmFoaW0sIHJhbXldLCBcIltpYnJhaGltLCByYW15XVwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdoZXJlID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLldoZXJlKHF1ZXJ5LCBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uTWVtYmVyKHAsIFwiYWR1bHRcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3QgPSBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uU2VsZWN0KHdoZXJlLCBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uTWVtYmVyKHAsIFwiZmlyc3ROYW1lXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIjo6IFwiICsgc2VsZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWN0dWFsID0gc2VsZWN0LmV4ZWN1dGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoYWN0dWFsKS50b0VxdWFsKFtcIklicmFoaW1cIl0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpdChcIjo6IGZvciBwIGluIHBlb3BsZSBkbyBvcmRlckJ5IHAuZmlyc3ROYW1lIHNlbGVjdCBwLmZpcnN0TmFtZVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uSWRlbnQoXCJwXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBxdWVyeSA9IG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5RdWVyeShcInBcIiwgbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLkNvbnN0KFtyYW15LCBpYnJhaGltXSwgXCJbcmFteSwgaWJyYWhpbV1cIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvcmRlckJ5ID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLk9yZGVyQnkocXVlcnksIG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5NZW1iZXIocCwgXCJmaXJzdE5hbWVcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3QgPSBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uU2VsZWN0KG9yZGVyQnksIG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5NZW1iZXIocCwgXCJmaXJzdE5hbWVcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiOjogXCIgKyBzZWxlY3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWwgPSBzZWxlY3QuZXhlY3V0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwoW1wiSWJyYWhpbVwiLCBcIlJhbXlcIl0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpdChcIjo6IGZvciBwIGluIHBlb3BsZSBkbyBncm91cEJ5IHAuYWR1bHQgaW50byBnIHNlbGVjdCBnLmNvdW50ICgpXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5JZGVudChcInBcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5ID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLlF1ZXJ5KFwicFwiLCBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uQ29uc3QoW3JhbXksIGlicmFoaW0sIHJhbmlhXSwgXCJbcmFteSwgaWJyYWhpbSwgcmFuaWFdXCIpKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZ3JvdXBCeSA9IG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5Hcm91cEJ5KHF1ZXJ5LCBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uTWVtYmVyKHAsIFwiYWR1bHRcIiksIFwiZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLlNlbGVjdChncm91cEJ5LCBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uTWVtYmVyKG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5JZGVudChcImdcIiksIFwiY291bnRcIikuYXBwKFtdKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI6OiBcIiArIHNlbGVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbCA9IHNlbGVjdC5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGFjdHVhbCkudG9FcXVhbChbMiwgMV0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdFJ1bnRpbWUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAob2JqZWN0LCBuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3RbbmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZTogZnVuY3Rpb24gKG5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIExpc3RbbmFtZV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGl0KFwiOjogcGVyc29ucyB8PiBtYXAgKG5vdCAuYWR1bHQpXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbm90QWR1bHQgPSBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uTm90KGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLkxhbWJkYS5tZW1iZXIoXCJhZHVsdFwiKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcEV4cHIgPSBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uUGlwZShuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uQ29uc3QoW2licmFoaW1dLCBcImV2ZXJ5Ym9keVwiKSwgbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLkFwcChuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uSWRlbnQoXCJtYXBcIiksIFtub3RBZHVsdF0pKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIjo6IFwiICsgbWFwRXhwcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbCA9IG1hcEV4cHIuZXhlY3V0ZShkZWZhdWx0UnVudGltZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGFjdHVhbCkudG9FcXVhbChbZmFsc2VdKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaXQoXCI6OiBwZXJzb25zIHw+IGZpbHRlciAobm90IC5hZHVsdCkgfD4gbWFwICguZmlyc3ROYW1lKVwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdEFkdWx0ID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLk5vdChleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5MYW1iZGEubWVtYmVyKFwiYWR1bHRcIikpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJFeHByID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLlBpcGUobmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLkNvbnN0KFtpYnJhaGltLCByYW15XSwgXCJldmVyeWJvZHlcIiksIG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5BcHAobmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLklkZW50KFwiZmlsdGVyXCIpLCBbbm90QWR1bHRdKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hcEV4cHIgPSBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uUGlwZShmaWx0ZXJFeHByLCBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uQXBwKG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5JZGVudChcIm1hcFwiKSwgW2V4cHJlc3Npb25fMS5FeHByZXNzaW9uLkxhbWJkYS5tZW1iZXIoXCJmaXJzdE5hbWVcIildKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI6OiBcIiArIG1hcEV4cHIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWwgPSBtYXBFeHByLmV4ZWN1dGUoZGVmYXVsdFJ1bnRpbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwoW1wiUmFteVwiXSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGl0KFwiOjogdW5hcnkgZXhwcmVzc2lvblwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFkZCA9IGZ1bmN0aW9uICh4LCB5KSB7IHJldHVybiB4ICsgeTsgfTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGFtYmRhID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLlVuYXJ5KG5ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5Db25zdChhZGQsIFwiYWRkXCIpLCBbbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLkNvbnN0KDIpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI6OiBcIiArIGxhbWJkYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbCA9IGxhbWJkYS5leGVjdXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGFjdHVhbCgxKSkudG9CZSgzKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaXQoXCI6OiBiaW5hcnkgZXhwcmVzc2lvblwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFkZCA9IGZ1bmN0aW9uICh4LCB5KSB7IHJldHVybiB4ICsgeTsgfTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGFtYmRhID0gbmV3IGV4cHJlc3Npb25fMS5FeHByZXNzaW9uLkJpbmFyeShuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uQ29uc3QoYWRkLCBcImFkZFwiKSwgW25ldyBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5Db25zdCgyKV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiOjogXCIgKyBsYW1iZGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWwgPSBsYW1iZGEuZXhlY3V0ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhY3R1YWwoMSwgMikpLnRvQmUoMyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGRlc2NyaWJlKFwiZnNoYXJwIHBhcnNlclwiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpdCgnOjogZnVuIHggLT4geCAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFzdCA9IGZzaGFycC5wYXJzZShcImZ1biB4IC0+IHg7XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhc3QpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJcXHJcXG4gPT09PT09PT09PT0gXFxyXFxuXCIgKyBKU09OLnN0cmluZ2lmeShhc3QsIG51bGwsIDIpICsgXCJcXHJcXG4gPT09PT09PT0gXFxyXFxuXCIsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvc2UgPSBhc3RbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGNvbXBvc2UudHlwZSkudG9CZShcImxhbWJkYVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoY29tcG9zZS5wYXJhbSkudG9CZShcInhcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGNvbXBvc2UuYm9keS5uYW1lKS50b0JlKFwieFwiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaXQoJzo6IC5maXJzdE5hbWUgJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhc3QgPSBmc2hhcnAucGFyc2UoXCIuZmlyc3ROYW1lO1wiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoYXN0KS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXFxyXFxuID09PT09PT09PT09IFxcclxcblwiICsgSlNPTi5zdHJpbmdpZnkoYXN0LCBudWxsLCAyKSArIFwiXFxyXFxuID09PT09PT09IFxcclxcblwiLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb3NlID0gYXN0WzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChjb21wb3NlLnR5cGUpLnRvQmUoXCJsYW1iZGFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGNvbXBvc2UucGFyYW0pLnRvQmUoXCJ4XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChjb21wb3NlLmJvZHkudGFyZ2V0Lm5hbWUpLnRvQmUoXCJ4XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChjb21wb3NlLmJvZHkubWVtYmVyLm5hbWUpLnRvQmUoXCJmaXJzdE5hbWVcIik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGl0KCc6OiAxICsgMicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXN0ID0gZnNoYXJwLnBhcnNlKFwiMSArIDI7XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhc3QpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJcXHJcXG4gPT09PT09PT09PT0gXFxyXFxuXCIgKyBKU09OLnN0cmluZ2lmeShhc3QsIG51bGwsIDIpICsgXCJcXHJcXG4gPT09PT09PT0gXFxyXFxuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBleHByID0gYXN0WzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChleHByLnR5cGUpLnRvQmUoJ2FwcCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGFzdCwgbnVsbCwgMikpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpdCgnOjogZm4gYScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXN0ID0gZnNoYXJwLnBhcnNlKFwiZnVuIGE7XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhc3QpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJcXHJcXG4gPT09PT09PT09PT0gXFxyXFxuXCIgKyBKU09OLnN0cmluZ2lmeShhc3QsIG51bGwsIDIpICsgXCJcXHJcXG4gPT09PT09PT0gXFxyXFxuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBleHByID0gYXN0WzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChleHByLnR5cGUpLnRvQmUoJ2FwcCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChleHByLmZ1bikudG9FcXVhbCh7IHR5cGU6ICdpZGVudCcsIG5hbWU6ICdmdW4nIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChleHByLmFyZ3MpLnRvRXF1YWwoW3sgdHlwZTogXCJpZGVudFwiLCBuYW1lOiBcImFcIiB9XSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGl0KCc6OiBmbiAoKScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXN0ID0gZnNoYXJwLnBhcnNlKFwiZnVuICgpO1wiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoYXN0KS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXFxyXFxuID09PT09PT09PT09IFxcclxcblwiICsgSlNPTi5zdHJpbmdpZnkoYXN0LCBudWxsLCAyKSArIFwiXFxyXFxuID09PT09PT09IFxcclxcblwiKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZXhwciA9IGFzdFswXTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoZXhwci50eXBlKS50b0JlKCdhcHAnKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoZXhwci5mdW4pLnRvRXF1YWwoeyB0eXBlOiAnaWRlbnQnLCBuYW1lOiAnZnVuJyB9KTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoZXhwci5hcmdzLmxlbmd0aCkudG9CZSgwKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaXQoJzo6ICgrKSBhIGInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFzdCA9IGZzaGFycC5wYXJzZShcIigrKSBhIGI7XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhc3QpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJcXHJcXG4gPT09PT09PT09PT0gXFxyXFxuXCIgKyBKU09OLnN0cmluZ2lmeShhc3QsIG51bGwsIDIpICsgXCJcXHJcXG4gPT09PT09PT0gXFxyXFxuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBleHByID0gYXN0WzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChleHByKS50b0VxdWFsKHsgXCJ0eXBlXCI6IFwiYXBwXCIsIFwiZnVuXCI6IFwiK1wiLCBcImFyZ3NcIjogW3sgXCJ0eXBlXCI6IFwiaWRlbnRcIiwgXCJuYW1lXCI6IFwiYVwiIH0sIHsgXCJ0eXBlXCI6IFwiaWRlbnRcIiwgXCJuYW1lXCI6IFwiYlwiIH1dIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpdCgnOjogYSB8PiBiIHw+IGMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFzdCA9IGZzaGFycC5wYXJzZShcImEgfD4gYiB8PiBjO1wiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoYXN0KS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXFxyXFxuID09PT09PT09PT09IFxcclxcblwiICsgSlNPTi5zdHJpbmdpZnkoYXN0LCBudWxsLCAyKSArIFwiXFxyXFxuID09PT09PT09IFxcclxcblwiKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGlwZTEgPSBhc3RbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHBpcGUxLnR5cGUpLnRvQmUoXCJwaXBlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChwaXBlMS5mdW4pLnRvQmUoXCJ8PlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QocGlwZTEuYXJnc1swXSkudG9FcXVhbCh7IFwidHlwZVwiOiBcImlkZW50XCIsIFwibmFtZVwiOiBcImNcIiB9KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGlwZTIgPSBwaXBlMS5hcmdzWzFdO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChwaXBlMi50eXBlKS50b0JlKFwicGlwZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QocGlwZTIuZnVuKS50b0JlKFwifD5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHBpcGUyLmFyZ3NbMF0pLnRvRXF1YWwoeyBcInR5cGVcIjogXCJpZGVudFwiLCBcIm5hbWVcIjogXCJiXCIgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHBpcGUyLmFyZ3NbMV0pLnRvRXF1YWwoeyBcInR5cGVcIjogXCJpZGVudFwiLCBcIm5hbWVcIjogXCJhXCIgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGl0KCc6OiBhICsgYiB8PiBjJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhc3QgPSBmc2hhcnAucGFyc2UoXCJhICsgYiB8PiBjO1wiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoYXN0KS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXFxyXFxuID09PT09PT09PT09IFxcclxcblwiICsgSlNPTi5zdHJpbmdpZnkoYXN0LCBudWxsLCAyKSArIFwiXFxyXFxuID09PT09PT09IFxcclxcblwiKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGlwZSA9IGFzdFswXTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QocGlwZS50eXBlKS50b0JlKFwicGlwZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QocGlwZS5mdW4pLnRvQmUoXCJ8PlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QocGlwZS5hcmdzWzBdKS50b0VxdWFsKHsgdHlwZTogXCJpZGVudFwiLCBuYW1lOiBcImNcIiB9KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYWRkID0gcGlwZS5hcmdzWzFdO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhZGQuYXJnc1swXS5uYW1lKS50b0JlKFwiYlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoYWRkLmFyZ3NbMV0ubmFtZSkudG9CZShcImFcIik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGl0KCc6OiBhID4+IGIgJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhc3QgPSBmc2hhcnAucGFyc2UoXCJhID4+IGI7XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhc3QpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJcXHJcXG4gPT09PT09PT09PT0gXFxyXFxuXCIgKyBKU09OLnN0cmluZ2lmeShhc3QsIG51bGwsIDIpICsgXCJcXHJcXG4gPT09PT09PT0gXFxyXFxuXCIsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvc2UgPSBhc3RbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGNvbXBvc2UudHlwZSkudG9CZShcImNvbXBvc2VcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGNvbXBvc2UuZnVuKS50b0JlKFwiPj5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGNvbXBvc2UuYXJnc1swXS5uYW1lKS50b0JlKFwiYlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoY29tcG9zZS5hcmdzWzFdLm5hbWUpLnRvQmUoXCJhXCIpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpdCgnOjogYS5iICcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXN0ID0gZnNoYXJwLnBhcnNlKFwiYS5iO1wiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoYXN0KS50b0JlRGVmaW5lZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXFxyXFxuID09PT09PT09PT09IFxcclxcblwiICsgSlNPTi5zdHJpbmdpZnkoYXN0LCBudWxsLCAyKSArIFwiXFxyXFxuID09PT09PT09IFxcclxcblwiLCBhc3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb3NlID0gYXN0WzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChjb21wb3NlLnR5cGUpLnRvQmUoXCJtZW1iZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGNvbXBvc2UudGFyZ2V0Lm5hbWUpLnRvQmUoXCJhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChjb21wb3NlLm1lbWJlcikudG9CZShcImJcIik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGl0KCc6OiBbMS4ubl0gJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhc3QgPSBmc2hhcnAucGFyc2UoXCJbMS4ubl07XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChhc3QpLnRvQmVEZWZpbmVkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJcXHJcXG4gPT09PT09PT09PT0gXFxyXFxuXCIgKyBKU09OLnN0cmluZ2lmeShhc3QsIG51bGwsIDIpICsgXCJcXHJcXG4gPT09PT09PT0gXFxyXFxuXCIsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJhbmdlID0gYXN0WzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChyYW5nZS50eXBlKS50b0JlKFwicmFuZ2VcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHJhbmdlLmZyb20udmFsdWUpLnRvQmUoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHJhbmdlLnRvLm5hbWUpLnRvQmUoXCJuXCIpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBpdCgnOjogZm9yIHAgaW4gcGVvcGxlIHdoZXJlIHAuYWR1bHQgJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhc3QgPSBmc2hhcnAucGFyc2UoXCJmb3IgcCBpbiBwZW9wbGUgd2hlcmUgcC5hZHVsdDtcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGFzdCkudG9CZURlZmluZWQoKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlxcclxcbiA9PT09PT09PT09PSBcXHJcXG5cIiArIEpTT04uc3RyaW5naWZ5KGFzdCwgbnVsbCwgMikgKyBcIlxcclxcbiA9PT09PT09PSBcXHJcXG5cIiwgYXN0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgd2hlcmUgPSBhc3RbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHdoZXJlLnR5cGUpLnRvQmUoXCJ3aGVyZVwiKTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3Qod2hlcmUucHJlZGljYXRlLnR5cGUpLnRvQmUoXCJtZW1iZXJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHdoZXJlLnNvdXJjZS50eXBlKS50b0JlKFwicXVlcnlcIik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGl0KCc6OiByZWdyZXNzaW9uIHRlc3QnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFzdCA9IGZzaGFycC5wYXJzZShcImEgfD4gYi5jID4+ICgrKSAxIHw+IGQ7XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnNoYXJwLnBhcnNlKFwiYSB8PiBiID4+ICgrKSAxIHw+IGQ7XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgZWxhcHNlZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsYXBzZWQgPiAyMDAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWlsKFwidG9vIHNsb3dcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJcXHJcXG4gPT09PT09PT09PT0gXFxyXFxuXCIgKyBKU09OLnN0cmluZ2lmeShhc3QsIG51bGwsIDIpICsgXCJcXHJcXG4gPT09PT09PT0gXFxyXFxuXCIsIGFzdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KGFzdCkudG9FcXVhbChbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcInBpcGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZnVuXCI6IFwifD5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYXJnc1wiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJpZGVudFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwicGlwZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImZ1blwiOiBcInw+XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYXJnc1wiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiY29tcG9zZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZnVuXCI6IFwiPj5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFyZ3NcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJhcHBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZnVuXCI6IFwiK1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJhcmdzXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImNvbnN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwibWVtYmVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRhcmdldFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiaWRlbnRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJiXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm1lbWJlclwiOiBcImNcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImlkZW50XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiYVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBdKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZGVzY3JpYmUoXCJydW50aW1lXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmcyA9IGZ1bmN0aW9uIChleHByKSB7IHJldHVybiBleHByZXNzaW9uXzEuRXhwcmVzc2lvbi5idWlsZChmc2hhcnAucGFyc2UoZXhwcilbMF0pOyB9O1xyXG4gICAgICAgICAgICAgICAgaXQoXCJleGVjdXRlIHF1ZXJ5XCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSBuZXcgZXhwcmVzc2lvbl8xLkV4cHJlc3Npb24uU2NvcGUodW5kZWZpbmVkLCB7IHBlb3BsZTogW2licmFoaW0sIHJhbXksIHJhbmlhXSB9KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gZnMoXCJmb3IgcCBpbiBwZW9wbGUgd2hlcmUgcC5hZHVsdDtcIikuZXhlY3V0ZShzdG9yZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSByZXN1bHRbMF0udmFyaWFibGUoXCJwXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChwLnZhcmlhYmxlKFwiZmlyc3ROYW1lXCIpKS50b0JlKFwiSWJyYWhpbVwiKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59KTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y29tcGlsZXJTcGVjLmpzLm1hcCJdfQ==
