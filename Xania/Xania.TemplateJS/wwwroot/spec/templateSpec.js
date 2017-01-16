"use strict";
var template_1 = require("../src/template");
var fsharp_1 = require("../src/fsharp");
var dom_1 = require("../src/dom");
var reactive_1 = require("../src/reactive");
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
        var binding = new dom_1.Dom.TagBinding("div", null)
            .attr("class", fsharp_1.fsharp("p.firstName"))
            .attr("class.adult-person", fsharp_1.fsharp("p.adult"));
        binding.update(new reactive_1.Reactive.Store({ p: ibrahim }));
        expect(binding.dom.className).toBe("Ibrahim adult-person");
        binding.update(new reactive_1.Reactive.Store({ p: ramy }));
        expect(binding.dom.className).toBe("Ramy");
    });
    it("tag attribute binding", function () {
        var binding = new dom_1.Dom.TagBinding("div", null)
            .attr("id", fsharp_1.fsharp('p.age'));
        binding.update(new reactive_1.Reactive.Store({ p: ibrahim }));
        expect(binding.dom.id).toBe('36');
        binding.update(new reactive_1.Reactive.Store({ p: ramy }));
        expect(binding.dom.id).toBe('5');
    });
    it("tag children binding", function () {
        var store = new reactive_1.Reactive.Store({ p: ibrahim });
        var div = new dom_1.Dom.TagBinding("div")
            .add(new template_1.Template.TextTemplate(fsharp_1.fsharp("p.firstName")))
            .update(store);
        expect(div.dom.childNodes.length).toBe(1);
        expect(div.dom.textContent).toBe('Ibrahim');
        store.get('p').get('firstName').set('IBRAHIM');
        store.flush();
        expect(div.dom.textContent).toBe('IBRAHIM');
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVTcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3BlYy90ZW1wbGF0ZVNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLDRDQUEyQztBQUMzQyx3Q0FBNkM7QUFDN0Msa0NBQWlDO0FBQ2pDLDRDQUFpRDtBQUtqRCxJQUFJLE9BQWdCLEVBQUUsSUFBYSxDQUFDO0FBRXBDO0lBQUE7UUFDWSxRQUFHLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7SUFlcEQsQ0FBQztJQWJHLHdCQUFNLEdBQU4sVUFBTyxHQUFHLEVBQUUsUUFBUTtRQUNoQixFQUFFLENBQUMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN4QyxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUFDLElBQUksQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRUQsc0JBQUksK0JBQVU7YUFBZDtZQUNJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUMvQixDQUFDOzs7T0FBQTtJQUNMLGNBQUM7QUFBRCxDQUFDLEFBaEJELElBZ0JDO0FBRUQsUUFBUSxDQUFDLFlBQVksRUFDakI7SUFFSSxVQUFVLENBQUM7UUFDUCxPQUFPLEdBQUc7WUFDTixHQUFHLEVBQUUsRUFBRTtZQUNQLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLFFBQVEsRUFB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QUFDLENBQUM7UUFDL0MsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRWQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELENBQUMsQ0FBQyxDQUFDO0FBQ1gsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vbm9kZV9tb2R1bGVzL0B0eXBlcy9qYXNtaW5lL2luZGV4LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tIFwiLi4vc3JjL3RlbXBsYXRlXCI7XHJcbmltcG9ydCB7IGZzaGFycCBhcyBmcyB9IGZyb20gXCIuLi9zcmMvZnNoYXJwXCI7XHJcbmltcG9ydCB7IERvbSB9IGZyb20gXCIuLi9zcmMvZG9tXCI7XHJcbmltcG9ydCB7IFJlYWN0aXZlIGFzIFJlIH0gZnJvbSAnLi4vc3JjL3JlYWN0aXZlJztcclxuLy8gaW1wb3J0IHsgQ29yZSB9IGZyb20gXCIuLi9zcmMvY29yZVwiO1xyXG5cclxuaW50ZXJmYWNlIElQZXJzb24geyBmaXJzdE5hbWU6IHN0cmluZzsgbGFzdE5hbWU6IHN0cmluZzsgYWR1bHQ6IGJvb2xlYW4sIGFnZTogbnVtYmVyLCByb2xlczogc3RyaW5nW10gfVxyXG5cclxudmFyIGlicmFoaW06IElQZXJzb24sIHJhbXk6IElQZXJzb247XHJcblxyXG5jbGFzcyBSb290RG9tIHtcclxuICAgIHByaXZhdGUgZG9tID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG5cclxuICAgIGluc2VydChkb20sIGluc2VydEF0KSB7XHJcbiAgICAgICAgaWYgKGluc2VydEF0IDwgdGhpcy5kb20uY2hpbGROb2Rlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIGJlZm9yZUVsZW1lbnQgPSB0aGlzLmRvbS5jaGlsZE5vZGVzW2luc2VydEF0XTtcclxuICAgICAgICAgICAgdGhpcy5kb20uaW5zZXJ0QmVmb3JlKGRvbSwgYmVmb3JlRWxlbWVudCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kb20uYXBwZW5kQ2hpbGQoZG9tKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJpbnNlcnRcIiwgZG9tLCBpbnNlcnRBdCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IGNoaWxkTm9kZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZG9tLmNoaWxkTm9kZXM7XHJcbiAgICB9XHJcbn1cclxuXHJcbmRlc2NyaWJlKFwidGVtcGxhdGluZ1wiLFxyXG4gICAgKCkgPT4ge1xyXG5cclxuICAgICAgICBiZWZvcmVFYWNoKCgpID0+IHtcclxuICAgICAgICAgICAgaWJyYWhpbSA9IHtcclxuICAgICAgICAgICAgICAgIGFnZTogMzYsXHJcbiAgICAgICAgICAgICAgICBmaXJzdE5hbWU6IFwiSWJyYWhpbVwiLFxyXG4gICAgICAgICAgICAgICAgbGFzdE5hbWU6IFwiYmVuIFNhbGFoXCIsXHJcbiAgICAgICAgICAgICAgICBhZHVsdDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHJvbGVzOiBbXCJkZXZlbG9wZXJcIl1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmFteSA9IHtcclxuICAgICAgICAgICAgICAgIGFnZTogNSxcclxuICAgICAgICAgICAgICAgIGZpcnN0TmFtZTogXCJSYW15XCIsXHJcbiAgICAgICAgICAgICAgICBsYXN0TmFtZTogXCJiZW4gU2FsYWhcIixcclxuICAgICAgICAgICAgICAgIGFkdWx0OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJvbGVzOiBbXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgaXQoXCJ0ZXh0IGJpbmRpbmdcIixcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHsgcDogaWJyYWhpbSB9KTtcclxuICAgICAgICAgICAgICAgIHZhciBiaW5kaW5nID0gbmV3IERvbS5UZXh0QmluZGluZyhmcyhcInAuZmlyc3ROYW1lXCIpKS51cGRhdGUoc3RvcmUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHN0b3JlLmdldChcInBcIikuZ2V0KFwiZmlyc3ROYW1lXCIpLnNldChcImJsYVwiKTtcclxuICAgICAgICAgICAgICAgIGV4cGVjdChiaW5kaW5nLmRvbS50ZXh0Q29udGVudCkudG9CZShcIklicmFoaW1cIik7XHJcbiAgICAgICAgICAgICAgICBzdG9yZS5mbHVzaCgpO1xyXG4gICAgICAgICAgICAgICAgZXhwZWN0KGJpbmRpbmcuZG9tLnRleHRDb250ZW50KS50b0JlKFwiYmxhXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGV4cGVjdChzdG9yZS5kaXJ0eS5sZW5ndGgpLnRvQmUoMCk7XHJcbiAgICAgICAgICAgICAgICBleHBlY3QoYmluZGluZy5kZXBlbmRlbmNpZXMubGVuZ3RoKS50b0JlKDIpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaXQoXCJjb250ZW50IGJpbmRpbmdcIixcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlID0gbmV3IFJlLlN0b3JlKHsgcGVvcGxlOiBbaWJyYWhpbSwgcmFteV0gfSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZnJhZ21lbnQgPSBuZXcgUm9vdERvbSgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJpbmRpbmcgPSBuZXcgRG9tLkNvbnRlbnRCaW5kaW5nKGZzKFwiZm9yIHAgaW4gcGVvcGxlXCIpLCBmcmFnbWVudC5pbnNlcnQuYmluZChmcmFnbWVudCksXHJcbiAgICAgICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKGZzKFwicC5maXJzdE5hbWUgKyAnICcgKyBwLmxhc3ROYW1lXCIpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFRlbXBsYXRlLkNvbnRlbnRUZW1wbGF0ZShmcyhcImZvciByIGluIHAucm9sZXNcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbbmV3IFRlbXBsYXRlLlRleHRUZW1wbGF0ZShmcyhcIic6OiAnICsgclwiKSldKVxyXG4gICAgICAgICAgICAgICAgICAgIF0pXHJcbiAgICAgICAgICAgICAgICAgICAgLnVwZGF0ZShzdG9yZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZnJhZ21lbnQuY2hpbGROb2Rlcyk7XHJcbiAgICAgICAgICAgICAgICBleHBlY3QoZnJhZ21lbnQuY2hpbGROb2Rlcy5sZW5ndGgpLnRvQmUoMyk7XHJcblxyXG4gICAgICAgICAgICAgICAgc3RvcmUuZ2V0KFwicGVvcGxlXCIpLmdldCgxKS5nZXQoXCJyb2xlc1wiKS5zZXQoW1wiem9vblwiXSk7XHJcbiAgICAgICAgICAgICAgICBzdG9yZS5mbHVzaCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGZyYWdtZW50LmNoaWxkTm9kZXMpO1xyXG4gICAgICAgICAgICAgICAgZXhwZWN0KGZyYWdtZW50LmNoaWxkTm9kZXMubGVuZ3RoKS50b0JlKDQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHN0b3JlLmdldChcInBlb3BsZVwiKS5nZXQoMCkuZ2V0KFwicm9sZXNcIikuc2V0KFtcInBhcGFcIl0pO1xyXG4gICAgICAgICAgICAgICAgc3RvcmUuZmx1c2goKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGZyYWdtZW50LmNoaWxkTm9kZXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaXQoXCJ0YWcgY2xhc3MgYmluZGluZ1wiLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBEb20uVGFnQmluZGluZyhcImRpdlwiLCBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgZnMoXCJwLmZpcnN0TmFtZVwiKSlcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcImNsYXNzLmFkdWx0LXBlcnNvblwiLCBmcyhcInAuYWR1bHRcIikpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJpbmRpbmcudXBkYXRlKG5ldyBSZS5TdG9yZSh7IHA6IGlicmFoaW0gfSkpO1xyXG4gICAgICAgICAgICAgICAgZXhwZWN0KGJpbmRpbmcuZG9tLmNsYXNzTmFtZSkudG9CZShcIklicmFoaW0gYWR1bHQtcGVyc29uXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJpbmRpbmcudXBkYXRlKG5ldyBSZS5TdG9yZSh7IHA6IHJhbXkgfSkpO1xyXG4gICAgICAgICAgICAgICAgZXhwZWN0KGJpbmRpbmcuZG9tLmNsYXNzTmFtZSkudG9CZShcIlJhbXlcIik7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpdChcInRhZyBhdHRyaWJ1dGUgYmluZGluZ1wiLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmluZGluZyA9IG5ldyBEb20uVGFnQmluZGluZyhcImRpdlwiLCBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwiaWRcIiwgZnMoJ3AuYWdlJykpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJpbmRpbmcudXBkYXRlKG5ldyBSZS5TdG9yZSh7IHA6IGlicmFoaW0gfSkpO1xyXG4gICAgICAgICAgICAgICAgZXhwZWN0KGJpbmRpbmcuZG9tLmlkKS50b0JlKCczNicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJpbmRpbmcudXBkYXRlKG5ldyBSZS5TdG9yZSh7IHA6IHJhbXkgfSkpO1xyXG4gICAgICAgICAgICAgICAgZXhwZWN0KGJpbmRpbmcuZG9tLmlkKS50b0JlKCc1Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpdChcInRhZyBjaGlsZHJlbiBiaW5kaW5nXCIsXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBzdG9yZSA9IG5ldyBSZS5TdG9yZSh7IHA6IGlicmFoaW0gfSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGl2ID0gbmV3IERvbS5UYWdCaW5kaW5nKFwiZGl2XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZChuZXcgVGVtcGxhdGUuVGV4dFRlbXBsYXRlKGZzKFwicC5maXJzdE5hbWVcIikpKVxyXG4gICAgICAgICAgICAgICAgICAgIC51cGRhdGUoc3RvcmUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGV4cGVjdChkaXYuZG9tLmNoaWxkTm9kZXMubGVuZ3RoKS50b0JlKDEpO1xyXG4gICAgICAgICAgICAgICAgZXhwZWN0KGRpdi5kb20udGV4dENvbnRlbnQpLnRvQmUoJ0licmFoaW0nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzdG9yZS5nZXQoJ3AnKS5nZXQoJ2ZpcnN0TmFtZScpLnNldCgnSUJSQUhJTScpO1xyXG4gICAgICAgICAgICAgICAgc3RvcmUuZmx1c2goKTtcclxuXHJcbiAgICAgICAgICAgICAgICBleHBlY3QoZGl2LmRvbS50ZXh0Q29udGVudCkudG9CZSgnSUJSQUhJTScpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pOyJdfQ==