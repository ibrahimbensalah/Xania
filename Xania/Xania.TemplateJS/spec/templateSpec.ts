/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

import { Template } from "../src/template";
import { fs } from "../src/fsharp";
import { Dom } from "../src/dom";
import { Reactive as Re } from '../src/reactive';
import { Observables } from '../src/observables';

interface IPerson { firstName: string; lastName: string; adult: boolean, age: number, roles: string[] }

var ibrahim: IPerson, ramy: IPerson;

class RootDom {
    private dom = document.createDocumentFragment();

    insert(binding, dom, insertAt) {
        if (insertAt < this.dom.childNodes.length) {
            var beforeElement = this.dom.childNodes[insertAt];
            this.dom.insertBefore(dom, beforeElement);
        } else {
            this.dom.appendChild(dom);
        }
    }

    get childNodes() {
        return this.dom.childNodes;
    }
}

describe("templating",
    () => {

        beforeEach(() => {
            ibrahim = {
                age: 36,
                firstName: "Ibrahim",
                lastName: "ben Salah",
                adult: true,
                roles: ["developer"]
            };
            ramy = {
                age: 5,
                firstName: "Ramy",
                lastName: "ben Salah",
                adult: false,
                roles: []
            };
        });


        it("text binding",
            () => {
                var store = new Re.Store({ p: ibrahim });
                var binding = new Dom.TextBinding(fs("p.firstName")).update(store, null);

                store.get("p").get("firstName").set("bla");

                expect(binding.textNode.textContent).toBe("bla");
                // expect(binding.dependencies.length).toBe(2);
            });

        it("content binding",
            () => {
                var store = new Re.Store({ people: [ibrahim, ramy] });
                var fragment = new RootDom();
                var binding = new Dom.FragmentBinding(fs("for p in people"),
                    [
                        new Template.TextTemplate(fs("p.firstName + ' ' + p.lastName")),
                        new Template.FragmentTemplate(fs("for r in p.roles"))
                            .child(new Template.TextTemplate(fs("':: ' + r")))
                    ])
                    .update(store, fragment);

                expect(fragment.childNodes.length).toBe(3);

                store.get("people").get(1).get("roles").set(["zoon"]);

                expect(fragment.childNodes.length).toBe(4);

                store.get("people").get(0).get("roles").set(["papa"]);
            });

        it("tag class binding",
            () => {
                var binding = new Dom.TagBinding("div")
                    .attr("class", fs("p.firstName"))
                    .attr("class.adult-person", fs("p.adult"));

                binding.update(new Re.Store({ p: ibrahim }), null);
                expect(binding.tagNode.className).toBe("Ibrahim adult-person");

                binding.update(new Re.Store({ p: ramy }), null);
                expect(binding.tagNode.className).toBe("Ramy");
            });

        it("tag attribute binding",
            () => {
                var binding = new Dom.TagBinding("div")
                    .attr("id", fs('p.age'));

                binding.update(new Re.Store({ p: ibrahim }), null);
                expect(binding.tagNode.id).toBe('36');

                binding.update(new Re.Store({ p: ramy }), null);
                expect(binding.tagNode.id).toBe('5');
            });

        it("tag children binding",
            () => {
                var store = new Re.Store({ p: ibrahim });
                var div = new Dom.TagBinding("div")
                    .child(new Dom.TextBinding(fs("p.firstName")))
                    .attr("data-age", fs("p.age"));
                div.update(store, null);

                expect(div.tagNode.childNodes.length).toBe(1);
                expect(div.tagNode.textContent).toBe('Ibrahim');

                store.get('p').get('firstName').set('IBRAHIM');

                expect(div.tagNode.textContent).toBe('IBRAHIM');
            });


        it("tag event binding",
            () => {
                var store = new Re.Store({
                    p: {
                        message: null,
                        sayHello(user = 'Jasmine') {
                            this.message = "Hello, " + user + "!";
                        }
                    }
                });
                var button = new Dom.TagBinding("button")
                    .attr("onclick", fs("p.sayHello"))
                    .update(store, null);

                button.trigger('click');

                expect(store.get('p').get('message').valueOf()).toBe("Hello, Jasmine!");
            });

        it("supports streams",
            () => {
                var stream = new Observables.Observable<number>();

                var binding = new Dom.TextBinding(fs("await stream"))
                    .update(new Re.Store({ stream }), null);
                expect(binding.textNode.textContent).toBe("");

                stream.onNext(123);
                expect(binding.textNode.textContent).toBe("123");

                stream.onNext(456);
                expect(binding.textNode.textContent).toBe("456");
            });
    });