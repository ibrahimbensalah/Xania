/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

import { Template } from "../src/template";
import { fsharp as fs } from "../src/fsharp";
// import { Core } from "../src/core";

describe("templating", () => {

    it(':: text template',
        () => {
            var ast = fs("p.firstName");
            expect(ast).toBeDefined();
            console.log(ast);
        });
});

