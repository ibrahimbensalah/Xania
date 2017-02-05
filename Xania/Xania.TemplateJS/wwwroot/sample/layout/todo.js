"use strict";
var xania_1 = require("../../src/xania");
var observables_1 = require("../../src/observables");
var TodoApp = (function () {
    function TodoApp() {
        this.store = new TodoStore();
        this.show = new observables_1.Observables.Observable('all');
    }
    TodoApp.prototype.render = function () {
        return (xania_1.Xania.tag("section", { className: "todoapp" },
            xania_1.Xania.tag("header", { className: "header" },
                xania_1.Xania.tag("h1", null, "todos"),
                xania_1.Xania.tag("input", { className: "new-todo", placeholder: "What needs to be done?", autofocus: "", name: "newTodoText" })),
            xania_1.Xania.tag("section", { className: ["main", xania_1.fs("empty store.todos -> 'hidden'")] },
                xania_1.Xania.tag("input", { className: "toggle-all", type: "checkbox", checked: xania_1.fs("empty store.todos where not completed"), click: xania_1.fs("store.toggleAll") }),
                xania_1.Xania.tag("ul", { className: "todo-list" },
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for todo in store.todos where completed = (await show = 'completed') or (await show = 'all')") },
                        xania_1.Xania.tag("li", { className: xania_1.fs("todo.completed -> 'completed'") },
                            xania_1.Xania.tag("div", { className: "view" },
                                xania_1.Xania.tag("input", { className: "toggle", type: "checkbox", checked: xania_1.fs("todo.completed") }),
                                xania_1.Xania.tag("label", { dblclick: "editTodo(todo)" }, xania_1.fs("todo.title")),
                                xania_1.Xania.tag("button", { className: "destroy", click: xania_1.fs("store.remove todo") })))))),
            xania_1.Xania.tag("footer", { className: ["footer", xania_1.fs("empty store.todos -> ' hidden'")] },
                xania_1.Xania.tag("span", { className: "todo-count" },
                    xania_1.Xania.tag("strong", null, xania_1.fs("count store.todos where completed")),
                    " item(s) left"),
                xania_1.Xania.tag("ul", { className: "filters" },
                    xania_1.Xania.tag("li", null,
                        xania_1.Xania.tag("a", { href: "#", className: xania_1.fs("(await show) = 'all' -> 'selected'"), click: xania_1.fs("show.onNext 'all'") }, "All")),
                    xania_1.Xania.tag("li", null,
                        xania_1.Xania.tag("a", { href: "#", className: xania_1.fs("(await show) = 'active' -> 'selected'"), click: xania_1.fs("show.onNext 'active'") }, "Active")),
                    xania_1.Xania.tag("li", null,
                        xania_1.Xania.tag("a", { href: "#", className: xania_1.fs("(await show) = 'completed' -> 'selected'"), click: xania_1.fs("show.onNext 'completed'") }, "Completed"))),
                xania_1.Xania.tag("button", { className: ["clear-completed", xania_1.fs("all active todos -> 'hidden'")], click: xania_1.fs("store.removeCompleted ()") }, "Clear completed"))));
    };
    return TodoApp;
}());
exports.TodoApp = TodoApp;
var TodoStore = (function () {
    function TodoStore() {
        this.todos = [];
        for (var i = 0; i < 10; i++)
            this.todos.push(new Todo("todo " + i, i % 2 === 0));
    }
    TodoStore.prototype.toggleAll = function () {
        var allCompleted = this.todos.every(function (e) { return e.completed; });
        for (var i = 0; i < this.todos.length; i++)
            this.todos[i].completed = !allCompleted;
    };
    TodoStore.prototype.removeCompleted = function () {
        this.todos = this.todos.filter(function (t) { return !t.completed; });
    };
    TodoStore.prototype.remove = function (todo) {
        var idx = this.todos.indexOf(todo);
        console.debug("remove todo ", idx);
        if (idx >= 0)
            this.todos.splice(idx, 1);
        else
            console.error("todo not found", todo);
    };
    TodoStore.prototype.orderByTitle = function () {
        this.todos = this.todos.sort(function (x, y) { return x.title.localeCompare(y.title); });
    };
    TodoStore.prototype.orderByTitleDesc = function () {
        this.todos = this.todos.sort(function (x, y) { return y.title.localeCompare(x.title); });
    };
    return TodoStore;
}());
var Todo = (function () {
    function Todo(title, completed) {
        if (completed === void 0) { completed = false; }
        this.title = title;
        this.completed = completed;
    }
    Todo.prototype.toggleCompletion = function () {
        this.completed = !this.completed;
    };
    return Todo;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9kby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NhbXBsZS9sYXlvdXQvdG9kby50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHlDQUFvRDtBQUNwRCxxREFBbUQ7QUFFbkQ7SUFBQTtRQUVJLFVBQUssR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ3hCLFNBQUksR0FBRyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBb0M3QyxDQUFDO0lBbENHLHdCQUFNLEdBQU47UUFDSSxNQUFNLENBQUMsQ0FDSCwrQkFBUyxTQUFTLEVBQUMsU0FBUztZQUN4Qiw4QkFBUSxTQUFTLEVBQUMsUUFBUTtnQkFDdEIsc0NBQWM7Z0JBQ2QsNkJBQU8sU0FBUyxFQUFDLFVBQVUsRUFBQyxXQUFXLEVBQUMsd0JBQXdCLEVBQUMsU0FBUyxFQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUMsYUFBYSxHQUFHLENBQzlGO1lBQ1QsK0JBQVMsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQUUsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO2dCQUM3RCw2QkFBTyxTQUFTLEVBQUMsWUFBWSxFQUFDLElBQUksRUFBQyxVQUFVLEVBQUMsT0FBTyxFQUFFLFVBQUUsQ0FBQyx1Q0FBdUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxVQUFFLENBQUMsaUJBQWlCLENBQUMsR0FBSTtnQkFDcEksMEJBQUksU0FBUyxFQUFDLFdBQVc7b0JBQ3JCLGtCQUFDLGVBQU8sSUFBQyxJQUFJLEVBQUUsVUFBRSxDQUFDLDhGQUE4RixDQUFDO3dCQUM3RywwQkFBSSxTQUFTLEVBQUUsVUFBRSxDQUFDLCtCQUErQixDQUFDOzRCQUM5QywyQkFBSyxTQUFTLEVBQUMsTUFBTTtnQ0FDakIsNkJBQU8sU0FBUyxFQUFDLFFBQVEsRUFBQyxJQUFJLEVBQUMsVUFBVSxFQUFDLE9BQU8sRUFBRSxVQUFFLENBQUMsZ0JBQWdCLENBQUMsR0FBSTtnQ0FDM0UsNkJB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QUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRCxnQ0FBWSxHQUFaO1FBQ0ksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQTlCLENBQThCLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRUQsb0NBQWdCLEdBQWhCO1FBQ0ksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQTlCLENBQThCLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBcENELElBb0NDO0FBRUQ7SUFDSSxjQUFtQixLQUFhLEVBQVMsU0FBaUI7UUFBakIsMEJBQUEsRUFBQSxpQkFBaUI7UUFBdkMsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUFTLGNBQVMsR0FBVCxTQUFTLENBQVE7SUFDMUQsQ0FBQztJQUVELCtCQUFnQixHQUFoQjtRQUNJLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3JDLENBQUM7SUFDTCxXQUFDO0FBQUQsQ0FBQyxBQVBELElBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYYW5pYSwgRm9yRWFjaCwgZnMgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBUb2RvQXBwIHtcclxuXHJcbiAgICBzdG9yZSA9IG5ldyBUb2RvU3RvcmUoKTtcclxuICAgIHNob3cgPSBuZXcgT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZSgnYWxsJyk7XHJcblxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInRvZG9hcHBcIj5cclxuICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwiaGVhZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGgxPnRvZG9zPC9oMT5cclxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwibmV3LXRvZG9cIiBwbGFjZWhvbGRlcj1cIldoYXQgbmVlZHMgdG8gYmUgZG9uZT9cIiBhdXRvZm9jdXM9XCJcIiBuYW1lPVwibmV3VG9kb1RleHRcIiAvPlxyXG4gICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e1tcIm1haW5cIiwgZnMoXCJlbXB0eSBzdG9yZS50b2RvcyAtPiAnaGlkZGVuJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGUtYWxsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD17ZnMoXCJlbXB0eSBzdG9yZS50b2RvcyB3aGVyZSBub3QgY29tcGxldGVkXCIpfSBjbGljaz17ZnMoXCJzdG9yZS50b2dnbGVBbGxcIil9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cInRvZG8tbGlzdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciB0b2RvIGluIHN0b3JlLnRvZG9zIHdoZXJlIGNvbXBsZXRlZCA9IChhd2FpdCBzaG93ID0gJ2NvbXBsZXRlZCcpIG9yIChhd2FpdCBzaG93ID0gJ2FsbCcpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9e2ZzKFwidG9kby5jb21wbGV0ZWQgLT4gJ2NvbXBsZXRlZCdcIil9ID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInZpZXdcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cInRvZ2dsZVwiIHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ9e2ZzKFwidG9kby5jb21wbGV0ZWRcIil9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBkYmxjbGljaz1cImVkaXRUb2RvKHRvZG8pXCI+e2ZzKFwidG9kby50aXRsZVwiKX08L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImRlc3Ryb3lcIiBjbGljaz17IGZzKFwic3RvcmUucmVtb3ZlIHRvZG9cIikgfT48L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPGZvb3RlciBjbGFzc05hbWU9e1tcImZvb3RlclwiLCBmcyhcImVtcHR5IHN0b3JlLnRvZG9zIC0+ICcgaGlkZGVuJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRvZG8tY291bnRcIj48c3Ryb25nPntmcyhcImNvdW50IHN0b3JlLnRvZG9zIHdoZXJlIGNvbXBsZXRlZFwiKX08L3N0cm9uZz4gaXRlbShzKSBsZWZ0PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJmaWx0ZXJzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT17ZnMoXCIoYXdhaXQgc2hvdykgPSAnYWxsJyAtPiAnc2VsZWN0ZWQnXCIpfSBjbGljaz17ZnMoXCJzaG93Lm9uTmV4dCAnYWxsJ1wiKX0+QWxsPC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT17ZnMoXCIoYXdhaXQgc2hvdykgPSAnYWN0aXZlJyAtPiAnc2VsZWN0ZWQnXCIpfSBjbGljaz17ZnMoXCJzaG93Lm9uTmV4dCAnYWN0aXZlJ1wiKX0+QWN0aXZlPC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT17ZnMoXCIoYXdhaXQgc2hvdykgPSAnY29tcGxldGVkJyAtPiAnc2VsZWN0ZWQnXCIpfSBjbGljaz17ZnMoXCJzaG93Lm9uTmV4dCAnY29tcGxldGVkJ1wiKX0+Q29tcGxldGVkPC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPC91bCA+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9e1tcImNsZWFyLWNvbXBsZXRlZFwiLCBmcyhcImFsbCBhY3RpdmUgdG9kb3MgLT4gJ2hpZGRlbidcIildfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGljaz17ZnMoXCJzdG9yZS5yZW1vdmVDb21wbGV0ZWQgKClcIil9PkNsZWFyIGNvbXBsZXRlZDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgPC9mb290ZXI+XHJcbiAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBUb2RvU3RvcmUge1xyXG4gICAgcHVibGljIHRvZG9zOiBUb2RvW107XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy50b2RvcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspXHJcbiAgICAgICAgICAgIHRoaXMudG9kb3MucHVzaChuZXcgVG9kbyhgdG9kbyAke2l9YCwgaSAlIDIgPT09IDApKTtcclxuICAgIH1cclxuXHJcbiAgICB0b2dnbGVBbGwoKSB7XHJcbiAgICAgICAgdmFyIGFsbENvbXBsZXRlZCA9IHRoaXMudG9kb3MuZXZlcnkoZSA9PiBlLmNvbXBsZXRlZCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnRvZG9zLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICB0aGlzLnRvZG9zW2ldLmNvbXBsZXRlZCA9ICFhbGxDb21wbGV0ZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlQ29tcGxldGVkKCkge1xyXG4gICAgICAgIHRoaXMudG9kb3MgPSB0aGlzLnRvZG9zLmZpbHRlcih0ID0+ICF0LmNvbXBsZXRlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlKHRvZG8pIHtcclxuICAgICAgICB2YXIgaWR4ID0gdGhpcy50b2Rvcy5pbmRleE9mKHRvZG8pO1xyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJyZW1vdmUgdG9kbyBcIiwgaWR4KTtcclxuICAgICAgICBpZiAoaWR4ID49IDApXHJcbiAgICAgICAgICAgIHRoaXMudG9kb3Muc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwidG9kbyBub3QgZm91bmRcIiwgdG9kbyk7XHJcbiAgICB9XHJcblxyXG4gICAgb3JkZXJCeVRpdGxlKCkge1xyXG4gICAgICAgIHRoaXMudG9kb3MgPSB0aGlzLnRvZG9zLnNvcnQoKHgsIHkpID0+IHgudGl0bGUubG9jYWxlQ29tcGFyZSh5LnRpdGxlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgb3JkZXJCeVRpdGxlRGVzYygpIHtcclxuICAgICAgICB0aGlzLnRvZG9zID0gdGhpcy50b2Rvcy5zb3J0KCh4LCB5KSA9PiB5LnRpdGxlLmxvY2FsZUNvbXBhcmUoeC50aXRsZSkpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBUb2RvIHtcclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyB0aXRsZTogc3RyaW5nLCBwdWJsaWMgY29tcGxldGVkID0gZmFsc2UpIHtcclxuICAgIH1cclxuXHJcbiAgICB0b2dnbGVDb21wbGV0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuY29tcGxldGVkID0gIXRoaXMuY29tcGxldGVkO1xyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=