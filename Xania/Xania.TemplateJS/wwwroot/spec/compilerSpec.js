System.register(["../src/expression", "../src/rebind"], function (exports_1, context_1) {
    "use strict";
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var __moduleName = context_1 && context_1.id;
    var expression_1, rebind_1, ibrahim, ramy, rania, LogBinding;
    return {
        setters: [
            function (expression_1_1) {
                expression_1 = expression_1_1;
            },
            function (rebind_1_1) {
                rebind_1 = rebind_1_1;
            }
        ],
        execute: function () {
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
            {
            }
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
                    var compose = ast;
                    expect(compose.type).toBe("compose", JSON.stringify(ast, null, 2));
                    expect(compose.fun).toBe(">>", JSON.stringify(ast, null, 2));
                    expect(compose.args[0].name).toBe("b", JSON.stringify(compose.args[0], null, 2));
                    expect(compose.args[1].name).toBe("a", JSON.stringify(compose.args[1], null, 2));
                });
                it(':: a.b ', function () {
                    var ast = fsharp.parse("a.b");
                    expect(ast).toBeDefined();
                    var compose = ast;
                    expect(compose.type).toBe("member", JSON.stringify(ast, null, 2));
                    expect(compose.target.name).toBe("a", JSON.stringify(ast, null, 2));
                    expect(compose.member).toBe("b", JSON.stringify(ast, null, 2));
                });
                it(':: [1..n] ', function () {
                    var ast = fsharp.parse("[1..n]");
                    expect(ast).toBeDefined();
                    var range = ast;
                    expect(range.type).toBe("range", JSON.stringify(ast, null, 2));
                    expect(range.from.value).toBe(1, JSON.stringify(ast, null, 2));
                    expect(range.to.name).toBe("n", JSON.stringify(ast, null, 2));
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
                    for (var i = 0; i < 1000; i++) {
                        fsharp.parse("a |> b >> (+) 1 |> d");
                    }
                    var elapsed = new Date().getTime() - start;
                    if (elapsed > 2000)
                        fail("too slow");
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
            LogBinding = (function (_super) {
                __extends(LogBinding, _super);
                function LogBinding(ast) {
                    var _this = _super.call(this) || this;
                    _this.ast = ast;
                    return _this;
                }
                LogBinding.prototype.render = function (context) {
                    return expression_1.Expression.accept(this.ast, this).valueOf();
                };
                return LogBinding;
            }(rebind_1.Reactive.Binding));
            describe("runtime", function () {
                var fs = fsharp.parse;
                it("expression dependencies", function () {
                    var store = new rebind_1.Reactive.Store({ p: ibrahim });
                    var binding = new LogBinding(fs("p.firstName"));
                    binding.update(store);
                    expect(binding.state).toBe("Ibrahim");
                    expect(binding.dependencies.length).toBe(2);
                    expect(store.dirty.length).toBe(0);
                    store.get("p").get("firstName").set("Mr Ibraihm");
                    expect(store.dirty).toEqual([binding]);
                    expect(binding.dependencies.length).toBe(2);
                    store.flush();
                });
            });
        }
    };
});
//# sourceMappingURL=compilerSpec.js.map