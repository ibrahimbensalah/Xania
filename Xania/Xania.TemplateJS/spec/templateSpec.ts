/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

import { Template } from "../src/template";
import { fsharp as fs } from "../src/fsharp";
import { Dom } from "../src/dom";
import { Reactive as Re } from '../src/reactive';
// import { Core } from "../src/core";

interface IPerson { firstName: string; lastName: string; adult: boolean, age: number, roles: string[] }

var ibrahim: IPerson = {
    age: 36,
    firstName: "Ibrahim",
    lastName: "ben Salah",
    adult: true,
    roles: ["developer"]
};
var ramy: IPerson = {
    age: 5,
    firstName: "Ramy",
    lastName: "ben Salah",
    adult: false,
    roles: []
};

describe("templating",
    () => {
        it("text binding",
            () => {
                var store = new Re.Store({ p: ibrahim });
                var binding = new Dom.TextBinding(fs("p.firstName")).update(store);

                store.get("p").get("firstName").set("bla");
                expect(binding.dom.textContent).toBe("Ibrahim");
                store.flush();
                expect(binding.dom.textContent).toBe("bla");

                expect(store.dirty.length).toBe(0);
                expect(binding.dependencies.length).toBe(2);
            });

        it("content binding",
            () => {
                var store = new Re.Store({ people: [ibrahim, ramy] });
                var fragment = document.createDocumentFragment();
                var insert = (dom, insertAt) => {
                    if (insertAt < fragment.childNodes.length) {
                        var beforeElement = fragment.childNodes[insertAt];
                        fragment.insertBefore(dom, beforeElement);
                    } else {
                        fragment.appendChild(dom);
                    }
                    console.log("insert", dom, insertAt);
                };
                var binding = new Dom.ContentBinding(fs("for p in people"), insert,
                    [
                        new Template.TextTemplate(fs("p.firstName + ' ' + p.lastName")),
                        new Template.ContentTemplate(fs("for r in p.roles"),
                            [new Template.TextTemplate(fs("':: ' + r"))])
                    ])
                    .update(store);

                console.log(fragment.childNodes);
                expect(fragment.childNodes.length).toBe(3);

                store.get("people").get(1).get("roles").set(["zoon"]);
                store.flush();

                console.log(fragment.childNodes);
                expect(fragment.childNodes.length).toBe(4);

                store.get("people").get(0).get("roles").set(["papa"]);
                store.flush();
                console.log(fragment.childNodes);
            });
    });