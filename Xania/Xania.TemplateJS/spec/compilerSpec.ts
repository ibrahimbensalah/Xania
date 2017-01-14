/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

import { Expression as XC } from "../src/expression";
import { Reactive as Re } from "../src/rebind";
import { fsharp as fs, accept } from "../src/fsharp";
// import { Core } from "../src/core";

interface IPerson { firstName: string; lastName: string; adult: boolean, age: number }

var ibrahim: IPerson = {
    age: 36,
    firstName: "Ibrahim",
    lastName: "ben Salah",
    adult: true
};
var ramy: IPerson = {
    age: 5,
    firstName: "Ramy",
    lastName: "ben Salah",
    adult: false
};
var rania: IPerson = {
    age: 3,
    firstName: "Rania",
    lastName: "ben Salah",
    adult: false
};

{
/*
var defaultRuntime = {
    map(fn, list) {
        return list.map(fn);
    },
    filter(fn, list) {
        return list.filter(fn);
    },
    get(name: string) {
        return this[name];
    }
};

// ReSharper disable InconsistentNaming
describe("functional expressions", () => {

    // var List = Core.Core.List;

    it(":: (.firstName)",
        // .firstName
        () => {
            var expr = XC.Lambda.member("firstName");
            console.log(":: " + expr.toString());

            var actual = expr.execute()(ibrahim).valueOf();

            expect(actual).toBe("Ibrahim");
        });

    it(":: person |> (.firstName)",
        () => {
            var expr = new XC.Pipe(new XC.Const(ibrahim, "person"), XC.Lambda.member("firstName"));
            console.log(":: " + expr);

            var actual = expr.execute().valueOf();

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
            var mapExpr = new XC.App(new XC.Const(defaultRuntime.map, "map"), [notAdult, new XC.Const([ibrahim], " [ibrahim] ")]);
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

            var actual = select.execute().valueOf();
            console.log(actual);
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

*/
}

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
    constructor(private ast) {
        super();
    }

    render(context) {
        this.context = context;
        return accept(this.ast, this, context).valueOf();
    }
}

describe("runtime", () => {

    it("expression dependencies",
        () => {
            var store = new Re.Store({ p: ibrahim });
            var binding = new TestBinding(fs("p.firstName"));
            binding.update(store);

            expect(binding.state).toBe("Ibrahim");
            expect(binding.dependencies.length).toBe(2);

            expect(store.dirty.length).toBe(0);

            store.get("p").get("firstName").set("Mr Ibraihm");
            expect(store.dirty).toEqual([binding]);
            expect(binding.dependencies.length).toBe(2);

            store.flush();
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

    //it("execute query",
    //    () => {
    //        var root = new Core.Scope({ people: [ibrahim, ramy, rania], b: 1 });
    //        var result = fs("for p in people where p.adult select p").execute(root);

    //        expect(result.length).toBe(1);
    //        // scope contains root values.
    //        expect(result[0].parent.parent).toEqual(root);
    //        // scope extends root scope.
    //        expect(result[0].get('p').valueOf()).toBe(ibrahim);
    //    });

    //it("reactive store",
    //    () => {
    //        var person = { firstName: "I", lastName: "am Reactive" };
    //        var store = new Re.Store({ people: [person] });
    //        store.bind(fs("for p in people select p.age"), ages => {
    //            expect(ages).toEqual([36, 5, 3]);
    //        });
    //    });
});

