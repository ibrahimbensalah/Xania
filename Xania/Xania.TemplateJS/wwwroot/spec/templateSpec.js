"use strict";
var template_1 = require("../src/template");
var fsharp_1 = require("../src/fsharp");
var dom_1 = require("../src/dom");
var reactive_1 = require("../src/reactive");
var observables_1 = require("../src/observables");
var ibrahim, ramy;
var RootDom = (function () {
    function RootDom() {
        this.dom = document.createDocumentFragment();
    }
    RootDom.prototype.insert = function (dom, insertAt) {
        if (insertAt < this.dom.childNodes.length) {
            var beforeElement = this.dom.childNodes[insertAt];
            this.dom.insertBefore(dom, beforeElement);
        }
        else {
            this.dom.appendChild(dom);
        }
        console.log("insert", dom, insertAt);
    };
    Object.defineProperty(RootDom.prototype, "childNodes", {
        get: function () {
            return this.dom.childNodes;
        },
        enumerable: true,
        configurable: true
    });
    return RootDom;
}());
describe("templating", function () {
    beforeEach(function () {
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
    it("text binding", function () {
        var store = new reactive_1.Reactive.Store({ p: ibrahim });
        var binding = new dom_1.Dom.TextBinding(fsharp_1.fsharp("p.firstName")).update(store);
        store.get("p").get("firstName").set("bla");
        expect(binding.dom.textContent).toBe("Ibrahim");
        store.flush();
        expect(binding.dom.textContent).toBe("bla");
        expect(store.dirty.length).toBe(0);
        expect(binding.dependencies.length).toBe(2);
    });
    it("content binding", function () {
        var store = new reactive_1.Reactive.Store({ people: [ibrahim, ramy] });
        var fragment = new RootDom();
        var binding = new dom_1.Dom.ContentBinding(fsharp_1.fsharp("for p in people"), fragment.insert.bind(fragment), [
            new template_1.Template.TextTemplate(fsharp_1.fsharp("p.firstName + ' ' + p.lastName")),
            new template_1.Template.ContentTemplate(fsharp_1.fsharp("for r in p.roles"), [new template_1.Template.TextTemplate(fsharp_1.fsharp("':: ' + r"))])
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
    it("tag class binding", function () {
        var binding = new dom_1.Dom.TagBinding("div")
            .attr("class", fsharp_1.fsharp("p.firstName"))
            .attr("class.adult-person", fsharp_1.fsharp("p.adult"));
        binding.update(new reactive_1.Reactive.Store({ p: ibrahim }));
        expect(binding.dom.className).toBe("Ibrahim adult-person");
        binding.update(new reactive_1.Reactive.Store({ p: ramy }));
        expect(binding.dom.className).toBe("Ramy");
    });
    it("tag attribute binding", function () {
        var binding = new dom_1.Dom.TagBinding("div")
            .attr("id", fsharp_1.fsharp('p.age'));
        binding.update(new reactive_1.Reactive.Store({ p: ibrahim }));
        expect(binding.dom.id).toBe('36');
        binding.update(new reactive_1.Reactive.Store({ p: ramy }));
        expect(binding.dom.id).toBe('5');
    });
    it("tag children binding", function () {
        var store = new reactive_1.Reactive.Store({ p: ibrahim });
        var div = new dom_1.Dom.TagBinding("div")
            .attr("data-age", fsharp_1.fsharp("p.age"))
            .child(new template_1.Template.TextTemplate(fsharp_1.fsharp("p.firstName")))
            .update(store);
        expect(div.dom.childNodes.length).toBe(1);
        expect(div.dom.textContent).toBe('Ibrahim');
        store.get('p').get('firstName').set('IBRAHIM');
        store.flush();
        expect(div.dom.textContent).toBe('IBRAHIM');
        console.log(div.dom);
    });
    it("tag event binding", function () {
        var store = new reactive_1.Reactive.Store({
            p: {
                message: null,
                sayHello: function (user) {
                    if (user === void 0) { user = 'Jasmine'; }
                    this.message = "Hello, " + user + "!";
                }
            }
        });
        var button = new dom_1.Dom.TagBinding("button")
            .on("click", fsharp_1.fsharp("p.sayHello"))
            .update(store);
        button.trigger('click');
        expect(store.get('p').get('message').valueOf()).toBe("Hello, Jasmine!");
    });
    it("supports streams", function () {
        var stream = new observables_1.Observables.Observable();
        var binding = new dom_1.Dom.TextBinding(fsharp_1.fsharp("stream")).update(new reactive_1.Reactive.Store({ stream: stream }));
        expect(binding.dom.textContent).toBe("");
        stream.onNext(123);
        expect(binding.dom.textContent).toBe("123");
        stream.onNext(456);
        expect(binding.dom.textContent).toBe("456");
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVTcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3BlYy90ZW1wbGF0ZVNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLDRDQUEyQztBQUMzQyx3Q0FBNkM7QUFDN0Msa0NBQWlDO0FBQ2pDLDRDQUFpRDtBQUNqRCxrREFBaUQ7QUFLakQsSUFBSSxPQUFnQixFQUFFLElBQWEsQ0FBQztBQUVwQztJQUFBO1FBQ1ksUUFBRyxHQUFHLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0lBZXBELENBQUM7SUFiRyx3QkFBTSxHQUFOLFVBQU8sR0FBRyxFQUFFLFFBQVE7UUFDaEIsRUFBRSxDQUFDLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDeEMsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVELHNCQUFJLCtCQUFVO2FBQWQ7WUFDSSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDL0IsQ0FBQzs7O09BQUE7SUFDTCxjQUFDO0FBQUQsQ0FBQyxBQWhCRCxJQWdCQztBQUVELFFBQVEsQ0FBQyxZQUFZLEVBQ2pCO0lBRUksVUFBVSxDQUFDO1FBQ1AsT0FBTyxHQUFHO1lBQ04sR0FBRyxFQUFFLEVBQUU7WUFDUCxTQUFTLEVBQUUsU0FBUztZ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SUFBSSxTQUFHLENBQUMsV0FBVyxDQUFDLGVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLG1CQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxRQUFBLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXpDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTVDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hELENBQUMsQ0FBQyxDQUFDO0FBQ1gsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vbm9kZV9tb2R1bGVzL0B0eXBlcy9qYXNtaW5lL2luZGV4LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tIFwiLi4vc3JjL3RlbXBsYXRlXCI7XHJcbmltcG9ydCB7IGZzaGFycCBhcyBmcyB9IGZyb20gXCIuLi9zcmMvZnNoYXJwXCI7XHJcbmltcG9ydCB7IERvbSB9IGZyb20gXCIuLi9zcmMvZG9tXCI7XHJcbmltcG9ydCB7IFJlYWN0aXZlIGFzIFJlIH0gZnJvbSAnLi4vc3JjL3JlYWN0aXZlJztcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tICcuLi9zcmMvb2JzZXJ2YWJsZXMnO1xyXG4vLyBpbXBvcnQgeyBDb3JlIH0gZnJvbSBcIi4uL3NyYy9jb3JlXCI7XHJcblxyXG5pbnRlcmZhY2UgSVBlcnNvbiB7IGZpcnN0TmFtZTogc3RyaW5nOyBsYXN0TmFtZTogc3RyaW5nOyBhZHVsdDogYm9vbGVhbiwgYWdlOiBudW1iZXIsIHJvbGVzOiBzdHJpbmdbXSB9XHJcblxyXG52YXIgaWJyYWhpbTogSVBlcnNvbiwgcmFteTogSVBlcnNvbjtcclxuXHJcbmNsYXNzIFJvb3REb20ge1xyXG4gICAgcHJpdmF0ZSBkb20gPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcblxyXG4gICAgaW5zZXJ0KGRvbSwgaW5zZXJ0QXQpIHtcclxuICAgICAgICBpZiAoaW5zZXJ0QXQgPCB0aGlzLmRvbS5jaGlsZE5vZGVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgYmVmb3JlRWxlbWVudCA9IHRoaXMuZG9tLmNoaWxkTm9kZXNbaW5zZXJ0QXRdO1xyXG4gICAgICAgICAgICB0aGlzLmRvbS5pbnNlcnRCZWZvcmUoZG9tLCBiZWZvcmVFbGVtZW50KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmRvbS5hcHBlbmRDaGlsZChkb20pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZyhcImluc2VydFwiLCBkb20sIGluc2VydEF0KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgY2hpbGROb2RlcygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kb20uY2hpbGROb2RlcztcclxuICAgIH1cclxufVxyXG5cclxuZGVzY3JpYmUoXCJ0ZW1wbGF0aW5nXCIsXHJcbiAgICAoKSA9PiB7XHJcblxyXG4gICAgICAgIGJlZm9yZUVhY2goKCkgPT4ge1xyXG4gICAgICAgICAgICBpYnJhaGltID0ge1xyXG4gICAgICAgICAgICAgICAgYWdlOiAzNixcclxuICAgICAgICAgICAgICAgIGZpcnN0TmFtZTogXCJJYnJhaGltXCIsXHJcbiAgICAgICAgICAgICAgICBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIixcclxuICAgICAgICAgICAgICAgIGFkdWx0OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcm9sZXM6IFtcImRldmVsb3BlclwiXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByYW15ID0ge1xyXG4gICAgICAgICAgICAgICAgYWdlOiA1LFxyXG4gICAgICAgICAgICAgICAgZmlyc3ROYW1lOiBcIlJhbXlcIixcclxuICAgICAgICAgICAgICAgIGxhc3ROYW1lOiBcImJlbiBTYWxhaFwiLFxyXG4gICAgICAgICAgICAgICAgYWR1bHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcm9sZXM6IFtdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICBpdChcInRleHQgYmluZGluZ1wiLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUoeyBwOiBpYnJhaGltIH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgRG9tLlRleHRCaW5kaW5nKGZzKFwicC5maXJzdE5hbWVcIikpLnVwZGF0ZShzdG9yZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgc3RvcmUuZ2V0KFwicFwiKS5nZXQoXCJmaXJzdE5hbWVcIikuc2V0KFwiYmxhXCIpO1xyXG4gICAgICAgICAgICAgICAgZXhwZWN0KGJpbmRpbmcuZG9tLnRleHRDb250ZW50KS50b0JlKFwiSWJyYWhpbVwiKTtcclxuICAgICAgICAgICAgICAgIHN0b3JlLmZsdXNoKCk7XHJcbiAgICAgICAgICAgICAgICBleHBlY3QoYmluZGluZy5kb20udGV4dENvbnRlbnQpLnRvQmUoXCJibGFcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgZXhwZWN0KHN0b3JlLmRpcnR5Lmxlbmd0aCkudG9CZSgwKTtcclxuICAgICAgICAgICAgICAgIGV4cGVjdChiaW5kaW5nLmRlcGVuZGVuY2llcy5sZW5ndGgpLnRvQmUoMik7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpdChcImNvbnRlbnQgYmluZGluZ1wiLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RvcmUgPSBuZXcgUmUuU3RvcmUoeyBwZW9wbGU6IFtpYnJhaGltLCByYW15XSB9KTtcclxuICAgICAgICAgICAgICAgIHZhciBmcmFnbWVudCA9IG5ldyBSb290RG9tKCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBEb20uQ29udGVudEJpbmRpbmcoZnMoXCJmb3IgcCBpbiBwZW9wbGVcIiksIGZyYWdtZW50Lmluc2VydC5iaW5kKGZyYWdtZW50KSxcclxuICAgICAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZS5UZXh0VGVtcGxhdGUoZnMoXCJwLmZpcnN0TmFtZSArICcgJyArIHAubGFzdE5hbWVcIikpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGUuQ29udGVudFRlbXBsYXRlKGZzKFwiZm9yIHIgaW4gcC5yb2xlc1wiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFtuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKGZzKFwiJzo6ICcgKyByXCIpKV0pXHJcbiAgICAgICAgICAgICAgICAgICAgXSlcclxuICAgICAgICAgICAgICAgICAgICAudXBkYXRlKHN0b3JlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhmcmFnbWVudC5jaGlsZE5vZGVzKTtcclxuICAgICAgICAgICAgICAgIGV4cGVjdChmcmFnbWVudC5jaGlsZE5vZGVzLmxlbmd0aCkudG9CZSgzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzdG9yZS5nZXQoXCJwZW9wbGVcIikuZ2V0KDEpLmdldChcInJvbGVzXCIpLnNldChbXCJ6b29uXCJdKTtcclxuICAgICAgICAgICAgICAgIHN0b3JlLmZsdXNoKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZnJhZ21lbnQuY2hpbGROb2Rlcyk7XHJcbiAgICAgICAgICAgICAgICBleHBlY3QoZnJhZ21lbnQuY2hpbGROb2Rlcy5sZW5ndGgpLnRvQmUoNCk7XHJcblxyXG4gICAgICAgICAgICAgICAgc3RvcmUuZ2V0KFwicGVvcGxlXCIpLmdldCgwKS5nZXQoXCJyb2xlc1wiKS5zZXQoW1wicGFwYVwiXSk7XHJcbiAgICAgICAgICAgICAgICBzdG9yZS5mbHVzaCgpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZnJhZ21lbnQuY2hpbGROb2Rlcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpdChcInRhZyBjbGFzcyBiaW5kaW5nXCIsXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBiaW5kaW5nID0gbmV3IERvbS5UYWdCaW5kaW5nKFwiZGl2XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmcyhcInAuZmlyc3ROYW1lXCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3MuYWR1bHQtcGVyc29uXCIsIGZzKFwicC5hZHVsdFwiKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYmluZGluZy51cGRhdGUobmV3IFJlLlN0b3JlKHsgcDogaWJyYWhpbSB9KSk7XHJcbiAgICAgICAgICAgICAgICBleHBlY3QoYmluZGluZy5kb20uY2xhc3NOYW1lKS50b0JlKFwiSWJyYWhpbSBhZHVsdC1wZXJzb25cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgYmluZGluZy51cGRhdGUobmV3IFJlLlN0b3JlKHsgcDogcmFteSB9KSk7XHJcbiAgICAgICAgICAgICAgICBleHBlY3QoYmluZGluZy5kb20uY2xhc3NOYW1lKS50b0JlKFwiUmFteVwiKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGl0KFwidGFnIGF0dHJpYnV0ZSBiaW5kaW5nXCIsXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBiaW5kaW5nID0gbmV3IERvbS5UYWdCaW5kaW5nKFwiZGl2XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoXCJpZFwiLCBmcygncC5hZ2UnKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYmluZGluZy51cGRhdGUobmV3IFJlLlN0b3JlKHsgcDogaWJyYWhpbSB9KSk7XHJcbiAgICAgICAgICAgICAgICBleHBlY3QoYmluZGluZy5kb20uaWQpLnRvQmUoJzM2Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgYmluZGluZy51cGRhdGUobmV3IFJlLlN0b3JlKHsgcDogcmFteSB9KSk7XHJcbiAgICAgICAgICAgICAgICBleHBlY3QoYmluZGluZy5kb20uaWQpLnRvQmUoJzUnKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGl0KFwidGFnIGNoaWxkcmVuIGJpbmRpbmdcIixcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHsgcDogaWJyYWhpbSB9KTtcclxuICAgICAgICAgICAgICAgIHZhciBkaXYgPSBuZXcgRG9tLlRhZ0JpbmRpbmcoXCJkaXZcIilcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcImRhdGEtYWdlXCIsIGZzKFwicC5hZ2VcIikpXHJcbiAgICAgICAgICAgICAgICAgICAgLmNoaWxkKG5ldyBUZW1wbGF0ZS5UZXh0VGVtcGxhdGUoZnMoXCJwLmZpcnN0TmFtZVwiKSkpXHJcbiAgICAgICAgICAgICAgICAgICAgLnVwZGF0ZShzdG9yZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZXhwZWN0KGRpdi5kb20uY2hpbGROb2Rlcy5sZW5ndGgpLnRvQmUoMSk7XHJcbiAgICAgICAgICAgICAgICBleHBlY3QoZGl2LmRvbS50ZXh0Q29udGVudCkudG9CZSgnSWJyYWhpbScpO1xyXG5cclxuICAgICAgICAgICAgICAgIHN0b3JlLmdldCgncCcpLmdldCgnZmlyc3ROYW1lJykuc2V0KCdJQlJBSElNJyk7XHJcbiAgICAgICAgICAgICAgICBzdG9yZS5mbHVzaCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGV4cGVjdChkaXYuZG9tLnRleHRDb250ZW50KS50b0JlKCdJQlJBSElNJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkaXYuZG9tKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICBpdChcInRhZyBldmVudCBiaW5kaW5nXCIsXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgcDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXlIZWxsbyh1c2VyID0gJ0phc21pbmUnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPSBcIkhlbGxvLCBcIiArIHVzZXIgKyBcIiFcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IG5ldyBEb20uVGFnQmluZGluZyhcImJ1dHRvblwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbihcImNsaWNrXCIsIGZzKFwicC5zYXlIZWxsb1wiKSlcclxuICAgICAgICAgICAgICAgICAgICAudXBkYXRlKHN0b3JlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBidXR0b24udHJpZ2dlcignY2xpY2snKTtcclxuXHJcbiAgICAgICAgICAgICAgICBleHBlY3Qoc3RvcmUuZ2V0KCdwJykuZ2V0KCdtZXNzYWdlJykudmFsdWVPZigpKS50b0JlKFwiSGVsbG8sIEphc21pbmUhXCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaXQoXCJzdXBwb3J0cyBzdHJlYW1zXCIsXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBzdHJlYW0gPSBuZXcgT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZTxudW1iZXI+KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgRG9tLlRleHRCaW5kaW5nKGZzKFwic3RyZWFtXCIpKS51cGRhdGUobmV3IFJlLlN0b3JlKHsgc3RyZWFtIH0pKTtcclxuICAgICAgICAgICAgICAgIGV4cGVjdChiaW5kaW5nLmRvbS50ZXh0Q29udGVudCkudG9CZShcIlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzdHJlYW0ub25OZXh0KDEyMyk7XHJcbiAgICAgICAgICAgICAgICBleHBlY3QoYmluZGluZy5kb20udGV4dENvbnRlbnQpLnRvQmUoXCIxMjNcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgc3RyZWFtLm9uTmV4dCg0NTYpO1xyXG4gICAgICAgICAgICAgICAgZXhwZWN0KGJpbmRpbmcuZG9tLnRleHRDb250ZW50KS50b0JlKFwiNDU2XCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pOyJdfQ==