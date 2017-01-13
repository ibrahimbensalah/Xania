/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

import { Template } from "../src/template";
import { fsharp as fs } from "../src/fsharp";
import { Dom } from "../src/dom";
import { Reactive as Re } from '../src/rebind';
// import { Core } from "../src/core";

interface IPerson { firstName: string; lastName: string; adult: boolean, age: number }

var ibrahim: IPerson = {
    age: 36,
    firstName: "Ibrahim",
    lastName: "ben Salah",
    adult: true
};

describe("templating",
    () => {
        it("text template",
            () => {
                var tpl = new Template.TextTemplate(fs("p.firstName"));
                var store = new Re.Store({ p: ibrahim });

                var binding = tpl.accept({
                    text(ast) {
                        var binding = new Dom.TextBinding(ast);
                        binding.update(store);
                        return binding;
                    }
                });

                store.get("p").get("firstName").set("bla");
                expect(binding.state).toBe("Ibrahim");
                store.flush();
                expect(binding.state).toBe("bla");

                expect(store.dirty.length).toBe(0);
                expect(binding.dependencies.length).toBe(2);
            });
    });