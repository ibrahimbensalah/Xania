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
            xania_1.Xania.tag("section", { className: ["main", xania_1.fs("store.todos.length = 0 -> ' hidden'")] },
                xania_1.Xania.tag("input", { className: "toggle-all", type: "checkbox", checked: xania_1.fs("empty store.todos where not completed"), onClick: xania_1.fs("store.toggleAll ()") }),
                xania_1.Xania.tag("ul", { className: "todo-list" },
                    xania_1.Xania.tag(xania_1.ForEach, { expr: xania_1.fs("for todo in store.todos where (completed = (await show = 'completed')) or (await show = 'all')") },
                        xania_1.Xania.tag("li", { className: xania_1.fs("todo.completed -> 'completed'") },
                            xania_1.Xania.tag("div", { className: "view" },
                                xania_1.Xania.tag("input", { className: "toggle", type: "checkbox", checked: xania_1.fs("todo.completed") }),
                                xania_1.Xania.tag("label", { dblclick: "editTodo(todo)" }, xania_1.fs("todo.title")),
                                xania_1.Xania.tag("button", { className: "destroy", onClick: xania_1.fs("store.remove todo") })))))),
            xania_1.Xania.tag("footer", { className: ["footer", xania_1.fs("store.todos.length = 0 -> ' hidden'")] },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9kby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NhbXBsZS9sYXlvdXQvdG9kby50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHlDQUFvRDtBQUNwRCxxREFBbUQ7QUFFbkQ7SUFBQTtRQUVJLFVBQUssR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ3hCLFNBQUksR0FBRyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLGdCQUFXLEdBQUcsRUFBRSxDQUFDO0lBMkNyQixDQUFDO0lBekNHLHlCQUFPLEdBQVAsVUFBUSxLQUFLO1FBQ1QsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNSLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1FBQzFCLENBQUM7SUFDTCxDQUFDO0lBRUQsd0JBQU0sR0FBTjtRQUNJLE1BQU0sQ0FBQyxDQUNILCtCQUFTLFNBQVMsRUFBQyxTQUFTO1lBQ3hCLDhCQUFRLFNBQVMsRUFBQyxRQUFRO2dCQUN0QixzQ0FBYztnQkFDZCw2QkFBTyxTQUFTLEVBQUMsVUFBVSxFQUFDLFdBQVcsRUFBQyx3QkFBd0IsRUFBQyxTQUFTLEVBQUMsRUFBRSxFQUFDLElBQUksRUFBQyxhQUFhLEVBQUMsT0FBTyxFQUFFLFVBQUUsQ0FBQyxpQ0FBaUMsQ0FBQyxHQUFJLENBQzlJO1lBQ1QsK0JBQVMsU0FBUyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQUUsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO2dCQUNuRSw2QkFBTyxTQUFTLEVBQUMsWUFBWSxFQUFDLElBQUksRUFBQyxVQUFVLEVBQUMsT0FBTyxFQUFFLFVBQUUsQ0FBQyx1Q0FBdUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxVQUFFLENBQUMsb0JBQW9C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UyxDQUFDO0lBQ3JDLENBQUM7SUFDTCxXQUFDO0FBQUQsQ0FBQyxBQVBELElBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBYYW5pYSwgRm9yRWFjaCwgZnMgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBUb2RvQXBwIHtcclxuXHJcbiAgICBzdG9yZSA9IG5ldyBUb2RvU3RvcmUoKTtcclxuICAgIHNob3cgPSBuZXcgT2JzZXJ2YWJsZXMuT2JzZXJ2YWJsZSgnYWxsJyk7XHJcbiAgICBuZXdUb2RvVGV4dCA9IFwiXCI7XHJcblxyXG4gICAgYWRkVG9kbyh0aXRsZSkge1xyXG4gICAgICAgIGlmICh0aXRsZSkge1xyXG4gICAgICAgICAgICB0aGlzLnN0b3JlLnRvZG9zLnB1c2gobmV3IFRvZG8odGl0bGUpKTtcclxuICAgICAgICAgICAgdGhpcy5uZXdUb2RvVGV4dCA9IFwiXCI7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJ0b2RvYXBwXCI+XHJcbiAgICAgICAgICAgICAgICA8aGVhZGVyIGNsYXNzTmFtZT1cImhlYWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMT50b2RvczwvaDE+XHJcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cIm5ldy10b2RvXCIgcGxhY2Vob2xkZXI9XCJXaGF0IG5lZWRzIHRvIGJlIGRvbmU/XCIgYXV0b2ZvY3VzPVwiXCIgbmFtZT1cIm5ld1RvZG9UZXh0XCIgb25LZXlVcD17ZnMoXCJrZXlDb2RlID0gMTMgLT4gYWRkVG9kbyAodmFsdWUpXCIpfSAvPlxyXG4gICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e1tcIm1haW5cIiwgZnMoXCJzdG9yZS50b2Rvcy5sZW5ndGggPSAwIC0+ICcgaGlkZGVuJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGUtYWxsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD17ZnMoXCJlbXB0eSBzdG9yZS50b2RvcyB3aGVyZSBub3QgY29tcGxldGVkXCIpfSBvbkNsaWNrPXtmcyhcInN0b3JlLnRvZ2dsZUFsbCAoKVwiKX0gLz5cclxuICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwidG9kby1saXN0XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxGb3JFYWNoIGV4cHI9e2ZzKFwiZm9yIHRvZG8gaW4gc3RvcmUudG9kb3Mgd2hlcmUgKGNvbXBsZXRlZCA9IChhd2FpdCBzaG93ID0gJ2NvbXBsZXRlZCcpKSBvciAoYXdhaXQgc2hvdyA9ICdhbGwnKVwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3NOYW1lPXtmcyhcInRvZG8uY29tcGxldGVkIC0+ICdjb21wbGV0ZWQnXCIpfSA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ2aWV3XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGVcIiB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtmcyhcInRvZG8uY29tcGxldGVkXCIpfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgZGJsY2xpY2s9XCJlZGl0VG9kbyh0b2RvKVwiPntmcyhcInRvZG8udGl0bGVcIil9PC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJkZXN0cm95XCIgb25DbGljaz17ZnMoXCJzdG9yZS5yZW1vdmUgdG9kb1wiKX0+PC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0ZvckVhY2g+XHJcbiAgICAgICAgICAgICAgICAgICAgPC91bD5cclxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgICAgIDxmb290ZXIgY2xhc3NOYW1lPXtbXCJmb290ZXJcIiwgZnMoXCJzdG9yZS50b2Rvcy5sZW5ndGggPSAwIC0+ICcgaGlkZGVuJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRvZG8tY291bnRcIj48c3Ryb25nPntmcyhcImNvdW50IHN0b3JlLnRvZG9zIHdoZXJlIG5vdCBjb21wbGV0ZWRcIil9PC9zdHJvbmc+IGl0ZW0ocykgbGVmdDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwiZmlsdGVyc1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9e2ZzKFwiKGF3YWl0IHNob3cpID0gJ2FsbCcgLT4gJ3NlbGVjdGVkJ1wiKX0gb25DbGljaz17ZnMoXCJzaG93Lm9uTmV4dCAnYWxsJ1wiKX0+QWxsPC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT17ZnMoXCIoYXdhaXQgc2hvdykgPSAnYWN0aXZlJyAtPiAnc2VsZWN0ZWQnXCIpfSBvbkNsaWNrPXtmcyhcInNob3cub25OZXh0ICdhY3RpdmUnXCIpfT5BY3RpdmU8L2E+PC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPXtmcyhcIihhd2FpdCBzaG93KSA9ICdjb21wbGV0ZWQnIC0+ICdzZWxlY3RlZCdcIil9IG9uQ2xpY2s9e2ZzKFwic2hvdy5vbk5leHQgJ2NvbXBsZXRlZCdcIil9PkNvbXBsZXRlZDwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdWwgPlxyXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPXtbXCJjbGVhci1jb21wbGV0ZWRcIiwgZnMoXCJhbGwgYWN0aXZlIHRvZG9zIC0+ICcgaGlkZGVuJ1wiKV19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrPXtmcyhcInN0b3JlLnJlbW92ZUNvbXBsZXRlZCAoKVwiKX0+Q2xlYXIgY29tcGxldGVkPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFRvZG9TdG9yZSB7XHJcbiAgICBwdWJsaWMgdG9kb3M6IFRvZG9bXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnRvZG9zID0gW107XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKylcclxuICAgICAgICAgICAgdGhpcy50b2Rvcy5wdXNoKG5ldyBUb2RvKGB0b2RvICR7aX1gLCBpICUgMiA9PT0gMCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZUFsbCgpIHtcclxuICAgICAgICB2YXIgYWxsQ29tcGxldGVkID0gdGhpcy50b2Rvcy5ldmVyeShlID0+IGUuY29tcGxldGVkKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudG9kb3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgIHRoaXMudG9kb3NbaV0uY29tcGxldGVkID0gIWFsbENvbXBsZXRlZDtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVDb21wbGV0ZWQoKSB7XHJcbiAgICAgICAgdGhpcy50b2RvcyA9IHRoaXMudG9kb3MuZmlsdGVyKHQgPT4gIXQuY29tcGxldGVkKTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmUodG9kbykge1xyXG4gICAgICAgIHZhciBpZHggPSB0aGlzLnRvZG9zLmluZGV4T2YodG9kbyk7XHJcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcInJlbW92ZSB0b2RvIFwiLCBpZHgpO1xyXG4gICAgICAgIGlmIChpZHggPj0gMClcclxuICAgICAgICAgICAgdGhpcy50b2Rvcy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJ0b2RvIG5vdCBmb3VuZFwiLCB0b2RvKTtcclxuICAgIH1cclxuXHJcbiAgICBvcmRlckJ5VGl0bGUoKSB7XHJcbiAgICAgICAgdGhpcy50b2RvcyA9IHRoaXMudG9kb3Muc29ydCgoeCwgeSkgPT4geC50aXRsZS5sb2NhbGVDb21wYXJlKHkudGl0bGUpKTtcclxuICAgIH1cclxuXHJcbiAgICBvcmRlckJ5VGl0bGVEZXNjKCkge1xyXG4gICAgICAgIHRoaXMudG9kb3MgPSB0aGlzLnRvZG9zLnNvcnQoKHgsIHkpID0+IHkudGl0bGUubG9jYWxlQ29tcGFyZSh4LnRpdGxlKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFRvZG8ge1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHRpdGxlOiBzdHJpbmcsIHB1YmxpYyBjb21wbGV0ZWQgPSBmYWxzZSkge1xyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZUNvbXBsZXRpb24oKSB7XHJcbiAgICAgICAgdGhpcy5jb21wbGV0ZWQgPSAhdGhpcy5jb21wbGV0ZWQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==