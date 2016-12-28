/// <reference path="../../node_modules/@types/jasmine/index.d.ts" />
/// <reference path="../src/core.ts" />
/// <reference path="../src/store.ts" />
/// <reference path="../src/compile.ts" />

// ReSharper disable InconsistentNaming
describe("compiler 2", () => {

    var Member = Xania.Compile.Member;
    var Pipe = Xania.Compile.Pipe;
    var Const = Xania.Compile.Const;
    var App = Xania.Compile.App;
    var Not = Xania.Compile.Not;
    var Ident = Xania.Compile.Ident;
    var List = Xania.Core.List;

    var ibrahim;
    var ramy;

    beforeEach(() => {
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
        () => {
            var expr = new Member("firstName");
            console.log(expr.toString());

            var actual = expr.compile()(ibrahim);
            expect(actual).toBe('Ibrahim');
        });

    it(':: person |> (.firstName)',
        () => {
            var expr = new Pipe(new Const(ibrahim, "person"), new Member("firstName"));
            console.log(expr);

            var actual = expr.compile();
            expect(actual()).toBe('Ibrahim');

        });

    it(':: inrement 1',
        // inrement 1
        () => {
            var increment = x => (x + 1);
            var expr = new App(new Const(increment, "increment"), [new Const(1)]);
            var actual = expr.compile();
            expect(actual()).toBe(2);
        });

    it(':: not (.adult)',
        // not (.adult)
        () => {
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
        () => {
            var notAdult = new Not(new Member("adult"));
            var mapExpr = new App(new Const(List.map, "map"), [notAdult, new Const([ibrahim], " [ person ] ")]);
            console.log(":: " + mapExpr);

            var actual = mapExpr.compile();
            expect(actual()).toEqual([false]);

        });


    var defaultRuntime: Xania.Compile.IRuntimeProvider = {
        prop(object: any, name: string): any {
            return object[name];
        },
        global(name: string) {
            return List[name];
        },
        apply(fn, args): any {
            return fn.apply(null, args);
        }
    };

    it(':: persons |> map (not .adult)',
        () => {
            var notAdult = new Not(new Member("adult"));
            var mapExpr = new Pipe(new Const([ibrahim], "everybody"), new App(new Ident("map"), [notAdult]));
            console.log(":: " + mapExpr);

            var actual = mapExpr.compile(defaultRuntime);
            expect(actual()).toEqual([false]);

        });

    it(':: persons |> filter (not .adult) |> map (.firstName)',
        () => {
            var notAdult = new Not(new Member("adult"));
            var filterExpr = new Pipe(new Const([ibrahim, ramy], "everybody"), new App(new Ident("filter"), [notAdult]));

            var mapExpr = new Pipe(filterExpr, new App(new Ident("map"), [new Member("firstName")]));
            console.log(":: " + mapExpr);

            var actual = mapExpr.compile(defaultRuntime);
            expect(actual()).toEqual(["Ramy"]);

        });
});

describe("Observable", () => {

    it("scalar",
        () => {
            var arr = [];
            var stream = new Xania.Data.Observable<string>();
            var subscription = stream.subscribe({
                onNext(v) {
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
(done => {
    ReSharperReporter.prototype.jasmineDone = () => {
        var closeButton = document.createElement("button");
        closeButton.innerHTML = "X CLOSE";
        closeButton.style.padding = "10px";
        closeButton.style.position = "absolute";
        closeButton.style.margin = "0px auto";
        closeButton.addEventListener("click", () => {
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
