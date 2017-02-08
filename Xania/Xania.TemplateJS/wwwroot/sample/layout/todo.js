"use strict";
var xania_1 = require("../../src/xania");
var observables_1 = require("../../src/observables");
var TodoApp = (function () {
    function TodoApp() {
        this.store = new TodoStore();
        this.show = new observables_1.Observables.Observable('all');
        this.newTodoText = "";
    }
    TodoApp.prototype.addTodo = function (title) {
        if (title) {
            this.store.todos.push(new Todo(title));
            this.newTodoText = "";
        }
    };
    TodoApp.prototype.render = function () {
        return (xania_1.Xania.tag("section", { className: "todoapp" },
            xania_1.Xania.tag("header", { className: "header" },
                xania_1.Xania.tag("h1", null, "todos"),
                xania_1.Xania.tag("input", { className: "new-todo", placeholder: "What needs to be done?", autofocus: "", name: "newTodoText", onKeyUp: xania_1.fs("keyCode = 13 -> addTodo (value)") })),
            xania_1.Xania.tag("section", { className: ["main", xania_1.fs("no store.todos -> ' hidden'")] },
                xania_1.Xania.tag("input", { className: "toggle-all", type: "checkbox", checked: xania_1.fs("empty store.todos where not completed"), onClick: xania_1.fs("store.toggleAll ()") }),
                xania_1.Xania.tag("ul", { className: "todo-list" },
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for todo in store.todos where (completed = (await show = 'completed')) or (await show = 'all')") },
                        xania_1.Xania.tag("li", { className: xania_1.fs("todo.completed -> 'completed'") },
                            xania_1.Xania.tag("div", { className: "view" },
                                xania_1.Xania.tag("input", { className: "toggle", type: "checkbox", checked: xania_1.fs("todo.completed") }),
                                xania_1.Xania.tag("label", { dblclick: "editTodo(todo)" }, xania_1.fs("todo.title")),
                                xania_1.Xania.tag("button", { className: "destroy", onClick: xania_1.fs("store.remove todo") })))))),
            xania_1.Xania.tag("footer", { className: ["footer", xania_1.fs("no store.todos -> ' hidden'")] },
                xania_1.Xania.tag("span", { className: "todo-count" },
                    xania_1.Xania.tag("strong", null, xania_1.fs("count store.todos where not completed")),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9kby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NhbXBsZS9sYXlvdXQvdG9kby50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHlDQUFvRDtBQUNwRCxxREFBbUQ7QUFFbkQ7SUFBQTtRQUVJLFVBQUssR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ3hCLFNBQUksR0FBRyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLGdCQUFXLEdBQUcsRUFBRSxDQUFDO0lBMkNyQixDQUFDO0lBekNHLHlCQUFPLEdBQVAsVUFBUSxLQUFLO1FBQ1QsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNSLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1FBQzFCLENBQUM7SUFDTCxDQUFDO0lBRUQsd0JBQU0sR0FBTjtRQUNJLE1BQU0sQ0FBQyxDQUNILCtCQUFTLFNBQVMsRUFBQyxTQUFTO1lBQ3hCLDhCQUFRLFNBQVMsRUFBQyxRQUFRO2dCQUN0QixzQ0FBYztnQkFDZCw2QkFBTyxTQUFTLEVBQUMsVUFBVSxFQUFDLFdBQVcsRUFBQyx3QkFBd0IsRUFBQyxTQUFTLEVBQUMsRUFBRSxFQUFDLElBQUksRUFBQyxhQUFhLEVBQUMsT0FBTyxFQUFFLFVBQUUsQ0FBQyxpQ0FBaUMsQ0FBQyxHQUFJLENBQzlJO1lBQ1QsK0JBQVMsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQUUsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO2dCQUMzRCw2QkFBTyxTQUFTLEVBQUMsWUFBWSxFQUFDLElBQUksRUFBQyxVQUFVLEVBQUMsT0FBTyxFQUFFLFVBQUUsQ0FBQyx1Q0FBdUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxVQUFFLENBQUMsb0JBQW9C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UyxDQUFDO0lBQ3JDLENBQUM7SUFDTCxXQUFDO0FBQUQsQ0FBQyxBQVBELElBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYYW5pYSwgRm9yRWFjaCwgZnMgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBUb2RvQXBwIHtcclxuXHJcbiAgICBzdG9yZSA9IG5ldyBUb2RvU3RvcmUoKTtcclxuICAgIHNob3cgPSBuZXcgT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZSgnYWxsJyk7XHJcbiAgICBuZXdUb2RvVGV4dCA9IFwiXCI7XHJcblxyXG4gICAgYWRkVG9kbyh0aXRsZSkge1xyXG4gICAgICAgIGlmICh0aXRsZSkge1xyXG4gICAgICAgICAgICB0aGlzLnN0b3JlLnRvZG9zLnB1c2gobmV3IFRvZG8odGl0bGUpKTtcclxuICAgICAgICAgICAgdGhpcy5uZXdUb2RvVGV4dCA9IFwiXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJ0b2RvYXBwXCI+XHJcbiAgICAgICAgICAgICAgICA8aGVhZGVyIGNsYXNzTmFtZT1cImhlYWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMT50b2RvczwvaDE+XHJcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cIm5ldy10b2RvXCIgcGxhY2Vob2xkZXI9XCJXaGF0IG5lZWRzIHRvIGJlIGRvbmU/XCIgYXV0b2ZvY3VzPVwiXCIgbmFtZT1cIm5ld1RvZG9UZXh0XCIgb25LZXlVcD17ZnMoXCJrZXlDb2RlID0gMTMgLT4gYWRkVG9kbyAodmFsdWUpXCIpfSAvPlxyXG4gICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e1tcIm1haW5cIiwgZnMoXCJubyBzdG9yZS50b2RvcyAtPiAnIGhpZGRlbidcIildfT5cclxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwidG9nZ2xlLWFsbFwiIHR5cGU9XCJjaGVja2JveFwiIGNoZWNrZWQ9e2ZzKFwiZW1wdHkgc3RvcmUudG9kb3Mgd2hlcmUgbm90IGNvbXBsZXRlZFwiKX0gb25DbGljaz17ZnMoXCJzdG9yZS50b2dnbGVBbGwgKClcIil9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cInRvZG8tbGlzdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciB0b2RvIGluIHN0b3JlLnRvZG9zIHdoZXJlIChjb21wbGV0ZWQgPSAoYXdhaXQgc2hvdyA9ICdjb21wbGV0ZWQnKSkgb3IgKGF3YWl0IHNob3cgPSAnYWxsJylcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT17ZnMoXCJ0b2RvLmNvbXBsZXRlZCAtPiAnY29tcGxldGVkJ1wiKX0gPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidmlld1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwidG9nZ2xlXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD17ZnMoXCJ0b2RvLmNvbXBsZXRlZFwiKX0gLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGRibGNsaWNrPVwiZWRpdFRvZG8odG9kbylcIj57ZnMoXCJ0b2RvLnRpdGxlXCIpfTwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiZGVzdHJveVwiIG9uQ2xpY2s9e2ZzKFwic3RvcmUucmVtb3ZlIHRvZG9cIil9PjwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Gb3JFYWNoPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgICAgICA8Zm9vdGVyIGNsYXNzTmFtZT17W1wiZm9vdGVyXCIsIGZzKFwibm8gc3RvcmUudG9kb3MgLT4gJyBoaWRkZW4nXCIpXX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidG9kby1jb3VudFwiPjxzdHJvbmc+e2ZzKFwiY291bnQgc3RvcmUudG9kb3Mgd2hlcmUgbm90IGNvbXBsZXRlZFwiKX08L3N0cm9uZz4gaXRlbShzKSBsZWZ0PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJmaWx0ZXJzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT17ZnMoXCIoYXdhaXQgc2hvdykgPSAnYWxsJyAtPiAnc2VsZWN0ZWQnXCIpfSBvbkNsaWNrPXtmcyhcInNob3cub25OZXh0ICdhbGwnXCIpfT5BbGw8L2E+PC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPXtmcyhcIihhd2FpdCBzaG93KSA9ICdhY3RpdmUnIC0+ICdzZWxlY3RlZCdcIil9IG9uQ2xpY2s9e2ZzKFwic2hvdy5vbk5leHQgJ2FjdGl2ZSdcIil9PkFjdGl2ZTwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9e2ZzKFwiKGF3YWl0IHNob3cpID0gJ2NvbXBsZXRlZCcgLT4gJ3NlbGVjdGVkJ1wiKX0gb25DbGljaz17ZnMoXCJzaG93Lm9uTmV4dCAnY29tcGxldGVkJ1wiKX0+Q29tcGxldGVkPC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPC91bCA+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9e1tcImNsZWFyLWNvbXBsZXRlZFwiLCBmcyhcImFsbCBhY3RpdmUgdG9kb3MgLT4gJyBoaWRkZW4nXCIpXX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s9e2ZzKFwic3RvcmUucmVtb3ZlQ29tcGxldGVkICgpXCIpfT5DbGVhciBjb21wbGV0ZWQ8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgIDwvZm9vdGVyPlxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgVG9kb1N0b3JlIHtcclxuICAgIHB1YmxpYyB0b2RvczogVG9kb1tdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMudG9kb3MgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKVxyXG4gICAgICAgICAgICB0aGlzLnRvZG9zLnB1c2gobmV3IFRvZG8oYHRvZG8gJHtpfWAsIGkgJSAyID09PSAwKSk7XHJcbiAgICB9XHJcblxyXG4gICAgdG9nZ2xlQWxsKCkge1xyXG4gICAgICAgIHZhciBhbGxDb21wbGV0ZWQgPSB0aGlzLnRvZG9zLmV2ZXJ5KGUgPT4gZS5jb21wbGV0ZWQpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50b2Rvcy5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgdGhpcy50b2Rvc1tpXS5jb21wbGV0ZWQgPSAhYWxsQ29tcGxldGVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZUNvbXBsZXRlZCgpIHtcclxuICAgICAgICB0aGlzLnRvZG9zID0gdGhpcy50b2Rvcy5maWx0ZXIodCA9PiAhdC5jb21wbGV0ZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZSh0b2RvKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IHRoaXMudG9kb3MuaW5kZXhPZih0b2RvKTtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKFwicmVtb3ZlIHRvZG8gXCIsIGlkeCk7XHJcbiAgICAgICAgaWYgKGlkeCA+PSAwKVxyXG4gICAgICAgICAgICB0aGlzLnRvZG9zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInRvZG8gbm90IGZvdW5kXCIsIHRvZG8pO1xyXG4gICAgfVxyXG5cclxuICAgIG9yZGVyQnlUaXRsZSgpIHtcclxuICAgICAgICB0aGlzLnRvZG9zID0gdGhpcy50b2Rvcy5zb3J0KCh4LCB5KSA9PiB4LnRpdGxlLmxvY2FsZUNvbXBhcmUoeS50aXRsZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIG9yZGVyQnlUaXRsZURlc2MoKSB7XHJcbiAgICAgICAgdGhpcy50b2RvcyA9IHRoaXMudG9kb3Muc29ydCgoeCwgeSkgPT4geS50aXRsZS5sb2NhbGVDb21wYXJlKHgudGl0bGUpKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgVG9kbyB7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdGl0bGU6IHN0cmluZywgcHVibGljIGNvbXBsZXRlZCA9IGZhbHNlKSB7XHJcbiAgICB9XHJcblxyXG4gICAgdG9nZ2xlQ29tcGxldGlvbigpIHtcclxuICAgICAgICB0aGlzLmNvbXBsZXRlZCA9ICF0aGlzLmNvbXBsZXRlZDtcclxuICAgIH1cclxufVxyXG5cclxuIl19