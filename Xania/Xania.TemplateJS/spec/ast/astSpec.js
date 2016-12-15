/// <reference path="ast.js" />
/// <reference path="../../src/core.js" />

var Const = Xania.Compile.Const;
var Member = Xania.Compile.Member;
var Pipe = Xania.Compile.Pipe;
var App = Xania.Compile.App;
var Not = Xania.Compile.Not;
var List = Xania.Core.List;

describe('compile', function() {

    var person = {
        firstName: "Ibrahim",
        lastName: "ben Salah",
        adult: true
};

    it('basic member access',
        // .firstName
        function () {
            var actual = new Member("firstName").execute(person);
            expect(actual).toBe('Ibrahim');
        });

    it('pipe expression',
        // person |> .firstName
        function () {

            var actual = new Pipe(new Const(person), new Member("firstName")).execute(null);
            expect(actual).toBe('Ibrahim');

        });

    it('app expression',
        // inrement 1
        function () {
            var increment = function (x) { return x + 1; };

            var actual = new App(new Const(increment), [new Const(1)]).execute(1);

            expect(actual).toBe(2);
        });

    it('not property expression',
        // not .adult
        function () {

            var actual = Not.app( new Member("adult") ).execute(person);
            expect(actual).toBe(false);

        });

    it('map property expression',
        // persons |> map (not .adult)
        function () {

            var notAdultExpr = Not.app(new Member("adult"));
            var mapExpr = new App(List.map, [notAdultExpr]);
            var pipeExpr = new Pipe(new Const([person]), mapExpr);

            var actual = pipeExpr.execute(null);
            expect(actual).toBe([ false ]);

        });
})