"use strict";
var xania_1 = require("../../src/xania");
var observables_1 = require("../../src/observables");
var TodoApp = (function () {
    function TodoApp() {
        this.store = new TodoStore();
        this.show = new observables_1.Observables.Observable('all');
        this.newTodoText = "";
    }
    TodoApp.prototype.render = function () {
        return (xania_1.Xania.tag("section", { className: "todoapp" },
            xania_1.Xania.tag("header", { className: "header" },
                xania_1.Xania.tag("h1", null, "todos"),
                xania_1.Xania.tag("input", { className: "new-todo", placeholder: "What needs to be done?", autofocus: "", name: "newTodoText", onKeyUp: xania_1.fs("keyCode = 13 -> store.addTodo(newTodoText)") })),
            xania_1.Xania.tag("section", { className: ["main", xania_1.fs("no store.todos -> ' hidden'")] },
                xania_1.Xania.tag("input", { className: "toggle-all", type: "checkbox", checked: xania_1.fs("empty store.todos where not completed"), click: xania_1.fs("store.toggleAll") }),
                xania_1.Xania.tag("ul", { className: "todo-list" },
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for todo in store.todos where (completed = (await show = 'completed')) or (await show = 'all')") },
                        xania_1.Xania.tag("li", { className: xania_1.fs("todo.completed -> 'completed'") },
                            xania_1.Xania.tag("div", { className: "view" },
                                xania_1.Xania.tag("input", { className: "toggle", type: "checkbox", checked: xania_1.fs("todo.completed") }),
                                xania_1.Xania.tag("label", { dblclick: "editTodo(todo)" }, xania_1.fs("todo.title")),
                                xania_1.Xania.tag("button", { className: "destroy", click: xania_1.fs("store.remove todo") })))))),
            xania_1.Xania.tag("footer", { className: ["footer", xania_1.fs("no store.todos -> ' hidden'")] },
                xania_1.Xania.tag("span", { className: "todo-count" },
                    xania_1.Xania.tag("strong", null, xania_1.fs("count store.todos where completed")),
                    " item(s) left"),
                xania_1.Xania.tag("ul", { className: "filters" },
                    xania_1.Xania.tag("li", null,
                        xania_1.Xania.tag("a", { href: "#", className: xania_1.fs("(await show) = 'all' -> 'selected'"), onClick: xania_1.fs("show.onNext 'all'") }, "All")),
                    xania_1.Xania.tag("li", null,
                        xania_1.Xania.tag("a", { href: "#", className: xania_1.fs("(await show) = 'active' -> 'selected'"), onClick: xania_1.fs("show.onNext 'active'") }, "Active")),
                    xania_1.Xania.tag("li", null,
                        xania_1.Xania.tag("a", { href: "#", className: xania_1.fs("(await show) = 'completed' -> 'selected'"), onClick: xania_1.fs("show.onNext 'completed'") }, "Completed"))),
                xania_1.Xania.tag("button", { className: ["clear-completed", xania_1.fs("all active todos -> ' hidden'")], click: xania_1.fs("store.removeCompleted ()") }, "Clear completed"))));
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
    TodoStore.prototype.addTodo = function (title) {
        this.todos.push(new Todo(title));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9kby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NhbXBsZS9sYXlvdXQvdG9kby50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHlDQUFvRDtBQUNwRCxxREFBbUQ7QUFFbkQ7SUFBQTtRQUVJLFVBQUssR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ3hCLFNBQUksR0FBRyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLGdCQUFXLEdBQUcsRUFBRSxDQUFDO0lBb0NyQixDQUFDO0lBbENHLHdCQUFNLEdBQU47UUFDSSxNQUFNLENBQUMsQ0FDSCwrQkFBUyxTQUFTLEVBQUMsU0FBUztZQUN4Qiw4QkFBUSxTQUFTLEVBQUMsUUFBUTtnQkFDdEIsc0NBQWM7Z0JBQ2QsNkJBQU8sU0FBUyxFQUFDLFVBQVUsRUFBQyxXQUFXLEVBQUMsd0JBQXdCLEVBQUMsU0FBUyxFQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUMsYUFBYSxFQUFDLE9BQU8sRUFBRSxVQUFFLENBQUMsNENBQTRDLENBQUMsR0FBSSxDQUN6SjtZQUNULCtCQUFTLFNBQVMsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFFLENBQUMsNkJBQTZCLENBQUMsQ0FBQztnQkFDM0QsNkJBQU8sU0FBUyxFQUFDLFlBQVksRUFBQyxJQUFJLEVBQUMsVUFBVSxFQUFDLE9BQU8sRUFBRSxVQUFFLENBQUMsdUNBQXVDLENBQUMsRUFBRSxLQUFLLEVBQUUsVUFBRSxDQUFDLGlCQUFpQixDQUFDLEdBQUk7Z0JBQ3BJLDBCQUFJLFNBQVMsRUFBQyxXQUFXO29CQUNyQixrQkFBQyxlQUFPLElBQUMsSUFBSSxFQUFFLFVBQUUsQ0FBQyxnR0FBZ0csQ0FBQzt3QkFDL0csMEJBQUksU0FBUyxFQUFFLFVBQUUsQ0FBQywrQkFBK0IsQ0FBQzs0QkFDOUMsMkJBQUssU0FBUyxFQUFDLE1BQU07Z0NBQ2pCLDZCQUFPLFNBQVMsRUFBQyxRQUFRLEVBQUMsSUFB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fSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBUb2RvQXBwIHtcclxuXHJcbiAgICBzdG9yZSA9IG5ldyBUb2RvU3RvcmUoKTtcclxuICAgIHNob3cgPSBuZXcgT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZSgnYWxsJyk7XHJcbiAgICBuZXdUb2RvVGV4dCA9IFwiXCI7XHJcblxyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInRvZG9hcHBcIj5cclxuICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwiaGVhZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGgxPnRvZG9zPC9oMT5cclxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwibmV3LXRvZG9cIiBwbGFjZWhvbGRlcj1cIldoYXQgbmVlZHMgdG8gYmUgZG9uZT9cIiBhdXRvZm9jdXM9XCJcIiBuYW1lPVwibmV3VG9kb1RleHRcIiBvbktleVVwPXtmcyhcImtleUNvZGUgPSAxMyAtPiBzdG9yZS5hZGRUb2RvKG5ld1RvZG9UZXh0KVwiKX0gLz5cclxuICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPXtbXCJtYWluXCIsIGZzKFwibm8gc3RvcmUudG9kb3MgLT4gJyBoaWRkZW4nXCIpXX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cInRvZ2dsZS1hbGxcIiB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtmcyhcImVtcHR5IHN0b3JlLnRvZG9zIHdoZXJlIG5vdCBjb21wbGV0ZWRcIil9IGNsaWNrPXtmcyhcInN0b3JlLnRvZ2dsZUFsbFwiKX0gLz5cclxuICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwidG9kby1saXN0XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHRvZG8gaW4gc3RvcmUudG9kb3Mgd2hlcmUgKGNvbXBsZXRlZCA9IChhd2FpdCBzaG93ID0gJ2NvbXBsZXRlZCcpKSBvciAoYXdhaXQgc2hvdyA9ICdhbGwnKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3NOYW1lPXtmcyhcInRvZG8uY29tcGxldGVkIC0+ICdjb21wbGV0ZWQnXCIpfSA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ2aWV3XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGVcIiB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtmcyhcInRvZG8uY29tcGxldGVkXCIpfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgZGJsY2xpY2s9XCJlZGl0VG9kbyh0b2RvKVwiPntmcyhcInRvZG8udGl0bGVcIil9PC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJkZXN0cm95XCIgY2xpY2s9e2ZzKFwic3RvcmUucmVtb3ZlIHRvZG9cIil9PjwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgICAgICA8Zm9vdGVyIGNsYXNzTmFtZT17W1wiZm9vdGVyXCIsIGZzKFwibm8gc3RvcmUudG9kb3MgLT4gJyBoaWRkZW4nXCIpXX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidG9kby1jb3VudFwiPjxzdHJvbmc+e2ZzKFwiY291bnQgc3RvcmUudG9kb3Mgd2hlcmUgY29tcGxldGVkXCIpfTwvc3Ryb25nPiBpdGVtKHMpIGxlZnQ8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cImZpbHRlcnNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPXtmcyhcIihhd2FpdCBzaG93KSA9ICdhbGwnIC0+ICdzZWxlY3RlZCdcIil9IG9uQ2xpY2s9e2ZzKFwic2hvdy5vbk5leHQgJ2FsbCdcIil9PkFsbDwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9e2ZzKFwiKGF3YWl0IHNob3cpID0gJ2FjdGl2ZScgLT4gJ3NlbGVjdGVkJ1wiKX0gb25DbGljaz17ZnMoXCJzaG93Lm9uTmV4dCAnYWN0aXZlJ1wiKX0+QWN0aXZlPC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT17ZnMoXCIoYXdhaXQgc2hvdykgPSAnY29tcGxldGVkJyAtPiAnc2VsZWN0ZWQnXCIpfSBvbkNsaWNrPXtmcyhcInNob3cub25OZXh0ICdjb21wbGV0ZWQnXCIpfT5Db21wbGV0ZWQ8L2E+PC9saT5cclxuICAgICAgICAgICAgICAgICAgICA8L3VsID5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT17W1wiY2xlYXItY29tcGxldGVkXCIsIGZzKFwiYWxsIGFjdGl2ZSB0b2RvcyAtPiAnIGhpZGRlbidcIildfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGljaz17ZnMoXCJzdG9yZS5yZW1vdmVDb21wbGV0ZWQgKClcIil9PkNsZWFyIGNvbXBsZXRlZDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgPC9mb290ZXI+XHJcbiAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5jbGFzcyBUb2RvU3RvcmUge1xyXG4gICAgcHVibGljIHRvZG9zOiBUb2RvW107XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy50b2RvcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspXHJcbiAgICAgICAgICAgIHRoaXMudG9kb3MucHVzaChuZXcgVG9kbyhgdG9kbyAke2l9YCwgaSAlIDIgPT09IDApKTtcclxuICAgIH1cclxuXHJcbiAgICB0b2dnbGVBbGwoKSB7XHJcbiAgICAgICAgdmFyIGFsbENvbXBsZXRlZCA9IHRoaXMudG9kb3MuZXZlcnkoZSA9PiBlLmNvbXBsZXRlZCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnRvZG9zLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICB0aGlzLnRvZG9zW2ldLmNvbXBsZXRlZCA9ICFhbGxDb21wbGV0ZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlQ29tcGxldGVkKCkge1xyXG4gICAgICAgIHRoaXMudG9kb3MgPSB0aGlzLnRvZG9zLmZpbHRlcih0ID0+ICF0LmNvbXBsZXRlZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlKHRvZG8pIHtcclxuICAgICAgICB2YXIgaWR4ID0gdGhpcy50b2Rvcy5pbmRleE9mKHRvZG8pO1xyXG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJyZW1vdmUgdG9kbyBcIiwgaWR4KTtcclxuICAgICAgICBpZiAoaWR4ID49IDApXHJcbiAgICAgICAgICAgIHRoaXMudG9kb3Muc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwidG9kbyBub3QgZm91bmRcIiwgdG9kbyk7XHJcbiAgICB9XHJcblxyXG4gICAgb3JkZXJCeVRpdGxlKCkge1xyXG4gICAgICAgIHRoaXMudG9kb3MgPSB0aGlzLnRvZG9zLnNvcnQoKHgsIHkpID0+IHgudGl0bGUubG9jYWxlQ29tcGFyZSh5LnRpdGxlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgb3JkZXJCeVRpdGxlRGVzYygpIHtcclxuICAgICAgICB0aGlzLnRvZG9zID0gdGhpcy50b2Rvcy5zb3J0KCh4LCB5KSA9PiB5LnRpdGxlLmxvY2FsZUNvbXBhcmUoeC50aXRsZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRvZG8odGl0bGUpIHtcclxuICAgICAgICB0aGlzLnRvZG9zLnB1c2gobmV3IFRvZG8odGl0bGUpKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgVG9kbyB7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdGl0bGU6IHN0cmluZywgcHVibGljIGNvbXBsZXRlZCA9IGZhbHNlKSB7XHJcbiAgICB9XHJcblxyXG4gICAgdG9nZ2xlQ29tcGxldGlvbigpIHtcclxuICAgICAgICB0aGlzLmNvbXBsZXRlZCA9ICF0aGlzLmNvbXBsZXRlZDtcclxuICAgIH1cclxufVxyXG5cclxuIl19