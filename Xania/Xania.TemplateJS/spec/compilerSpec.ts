/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

import { Reactive as Re } from "../src/reactive";
import { fsharp as fs, accept } from "../src/fsharp";

interface IPerson { firstName: string; lastName: string; adult: boolean, age: number }

var ibrahim: IPerson = {
    age: 36,
    firstName: "Ibrahim",
    lastName: "ben Salah",
    adult: true
};
//var ramy: IPerson = {
//    age: 5,
//    firstName: "Ramy",
//    lastName: "ben Salah",
//    adult: false
//};
//var rania: IPerson = {
//    age: 3,
//    firstName: "Rania",
//    lastName: "ben Salah",
//    adult: false
//};

describe("fsharp parser", () => {

    it(':: fun x -> x ',
        () => {
            var ast = fs("fun x -> x");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);

            var compose = ast;
            expect(compose.type).toBe("lambda");
            expect(compose.param).toBe("x");
            expect(compose.body.name).toBe("x");
        });

    it(':: .firstName ',
        () => {
            var ast = fs(".firstName");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);

            var compose = ast;
            expect(compose.type).toBe("lambda");
            expect(compose.param).toBe("x");
            expect(compose.body.target.name).toBe("x");
            expect(compose.body.member.name).toBe("firstName");
        });

    it(':: 1 + 2',
        () => {
            var ast = fs("1 + 2");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");

            var expr = ast;
            expect(expr.type).toBe('app');

            console.log(JSON.stringify(ast, null, 2));
        });

    it(':: fn a',
        () => {
            var ast = fs("fun a");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");

            var expr = ast;
            expect(expr.type).toBe('app');
            expect(expr.fun).toEqual({ type: 'ident', name: 'fun' });
            expect(expr.args).toEqual([{ type: "ident", name: "a" }]);
        });

    it(':: fn ()',
        () => {
            var ast = fs("fun ()");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");

            var expr = ast;
            expect(expr.type).toBe('app');
            expect(expr.fun).toEqual({ type: 'ident', name: 'fun' });
            expect(expr.args.length).toBe(0);
        });

    it(':: (+) a b',
        () => {
            var ast = fs("(+) a b");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");

            var expr = ast;
            expect(expr).toEqual({ "type": "app", "fun": "+", "args": [{ "type": "ident", "name": "a" }, { "type": "ident", "name": "b" }] });
        });

    it(':: a |> b |> c',
        () => {
            var ast = fs("a |> b |> c");
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

    it(':: a + b |> c',
        () => {
            var ast = fs("a + b |> c");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n");

            var pipe = ast;
            expect(pipe.type).toBe("pipe");
            expect(pipe.fun).toBe("|>");
            expect(pipe.args[0]).toEqual({ type: "ident", name: "c" });

            var add = pipe.args[1];
            expect(add.args[0].name).toBe("b");
            expect(add.args[1].name).toBe("a");

            // [{"type":"pipe","fun":"|>","args":[{"type":"ident","name":"c"},{"type":"pipe","fun":"|>","args":[{"type":"ident","name":"b"},{"type":"ident","name":"a"}]}]}]
        });

    it(':: a >> b ',
        () => {
            var ast = fs("a >> b");
            expect(ast).toBeDefined();

            var compose = ast;
            expect(compose.type).toBe("compose", JSON.stringify(ast, null, 2));
            expect(compose.fun).toBe(">>", JSON.stringify(ast, null, 2));
            expect(compose.args[0].name).toBe("b", JSON.stringify(compose.args[0], null, 2));
            expect(compose.args[1].name).toBe("a", JSON.stringify(compose.args[1], null, 2));
        });

    it(':: a.b ',
        () => {
            var ast = fs("a.b");
            expect(ast).toBeDefined();

            var compose = ast;
            expect(compose.type).toBe("member", JSON.stringify(ast, null, 2));
            expect(compose.target.name).toBe("a", JSON.stringify(ast, null, 2));
            expect(compose.member).toBe("b", JSON.stringify(ast, null, 2));
        });

    it(':: [1..n] ',
        () => {
            var ast = fs("[1..n]");
            expect(ast).toBeDefined();

            var range = ast;
            expect(range.type).toBe("range", JSON.stringify(ast, null, 2));
            expect(range.from.value).toBe(1, JSON.stringify(ast, null, 2));
            expect(range.to.name).toBe("n", JSON.stringify(ast, null, 2));
        });

    it(':: for p in people where p.adult ',
        () => {
            var ast = fs("for p in people where p.adult");
            expect(ast).toBeDefined();
            console.log("\r\n =========== \r\n" + JSON.stringify(ast, null, 2) + "\r\n ======== \r\n", ast);

            var where = ast;

            expect(where.type).toBe("where");
            expect(where.predicate.type).toBe("member");
            expect(where.source.type).toBe("query");
        });

    it(':: regression test',
        () => {

            var start = new Date().getTime();

            var ast = fs("a |> b.c >> (+) 1 |> d");
            for (var i = 0; i < 1000; i++) {
                fs("a |> b >> (+) 1 |> d");
            }
            var elapsed = new Date().getTime() - start;

            if (elapsed > 2000) fail("too slow");

            expect(ast).toEqual({
                "type": "pipe",
                "fun": "|>",
                "args":
                [
                    {
                        "type": "ident",
                        "name": "d"
                    },
                    {
                        "type": "pipe",
                        "fun": "|>",
                        "args":
                        [
                            {
                                "type": "compose",
                                "fun": ">>",
                                "args": [
                                    {
                                        "type": "app",
                                        "fun": "+",
                                        "args":
                                        [
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


class TestBinding extends Re.Binding {
    public value;

    constructor(private ast) {
        super();
    }

    render(context) {
        this.context = context;
        return this.value = accept(this.ast, this, context).valueOf();
    }

    app(fun, args: any[]) {
        if (fun === "assign") {
            var value = args[0].valueOf();
            args[1].set(value);
            return value;
        }

        return super.app(fun, args);
    }
}

describe("runtime", () => {

    it("expression dependencies",
        () => {
            var store = new Re.Store({ p: ibrahim });
            var binding = new TestBinding(fs("p.firstName"));
            binding.update(store);

            expect(binding.value).toBe("Ibrahim");
            expect(binding.dependencies.length).toBe(2);

            // expect(store.dirty.length).toBe(0);

            store.get("p").get("firstName").set("Mr Ibraihm");
            expect(binding.value).toBe("Mr Ibraihm");

            expect(binding.dependencies.length).toBe(2);
        });

    it("consistent variable identity",
        () => {
            var store = new Re.Store({ p: ibrahim });

            var binding = new TestBinding(fs("p"));

            expect(binding.render(store)).toBe(binding.render(store));
        });

    it("consistent member identity", () => {
        var store = new Re.Store({ xania: { owner: ibrahim } });
        var binding = new TestBinding(fs("xania.owner"));
        expect(binding.render(store)).toBe(binding.render(store));
    });

    it("consistent query identity", () => {
        var store = new Re.Store({ xania: { employees: [ ibrahim ] } });
        var binding = new TestBinding(fs("for e in xania.employees"));
        expect(binding.render(store)[0]).toBe(binding.render(store)[0], "not identical");
    });

    it("assign expression",
        () => {
            var store = new Re.Store({ x: 1, y: 2, sum: 0 });
            var binding = new TestBinding(fs("sum <- x + y"));
            binding.render(store);
            expect(store.get("sum").valueOf()).toBe(3);
        });
});

