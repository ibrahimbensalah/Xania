"use strict";
var xania_1 = require("../../src/xania");
var anim_1 = require("../../src/anim");
require("./todos/index.css");
var TodoApp = (function () {
    function TodoApp() {
        var _this = this;
        this.store = new TodoStore();
        this.show = "all";
        this.editingTodo = null;
        this.onAddTodo = function (event) {
            if (event.keyCode === 13) {
                var title = event.target.value;
                _this.store.todos.push(new Todo(title));
                return "";
            }
            return void 0;
        };
        this.onToggleAll = function () {
            _this.store.toggleAll();
        };
        this.onShow = function (value) {
            _this.show = value;
        };
        this.onResetEditing = function (event) {
            if (event.keyCode === 13)
                _this.editingTodo = null;
            else if (event.keyCode === 27) {
                _this.editingTodo = null;
            }
        };
    }
    TodoApp.prototype.view = function (xania) {
        var _this = this;
        return (xania.tag("section", { className: "todoapp" },
            xania.tag("header", null,
                xania.tag("input", { className: "new-todo", placeholder: "What needs to be done?", autofocus: "", onKeyUp: this.onAddTodo })),
            xania.tag("section", { className: ["main", xania_1.expr("store.todos.length = 0 -> ' hidden'")] },
                xania.tag("input", { className: "toggle-all", type: "checkbox", checked: xania_1.expr("empty store.todos where not completed"), onClick: this.onToggleAll }),
                xania.tag("ul", { className: "todo-list" },
                    xania.tag(xania_1.Repeat, { param: "todo", source: xania_1.expr("store.todos where (completed = (show = 'completed')) or (show = 'all')") },
                        xania.tag(anim_1.Animate, { height: "58px", transform: "scale(1)", dispose: [{ height: "58px", opacity: 1 }, { height: 0, opacity: 0 }] },
                            xania.tag("li", { className: [xania_1.expr("todo.completed -> 'completed'"), xania_1.expr("todo = editingTodo -> ' editing'")] },
                                xania.tag("div", { className: "view" },
                                    xania.tag("input", { className: "toggle", type: "checkbox", checked: xania_1.expr("todo.completed") }),
                                    xania.tag("label", { onDblClick: xania_1.expr("editingTodo <- todo") }, xania_1.expr("todo.title")),
                                    xania.tag("button", { className: "destroy", onClick: xania_1.expr("store.remove todo") })),
                                xania.tag("input", { className: "edit", value: xania_1.expr("todo.title"), autofocus: "", onBlur: this.onResetEditing, onKeyUp: this.onResetEditing })))))),
            xania.tag("footer", { className: ["footer", xania_1.expr("store.todos.length = 0 -> ' hidden'")] },
                xania.tag("span", { className: "todo-count" },
                    xania.tag("strong", null, xania_1.expr("count store.todos where not completed")),
                    " item(s) left"),
                xania.tag("ul", { className: "filters" },
                    xania.tag("li", null,
                        xania.tag("a", { href: "#", className: xania_1.expr("show = 'all' -> 'selected'"), onClick: this.onShow.bind(this, 'all') }, "All")),
                    xania.tag("li", null,
                        xania.tag("a", { href: "#", className: xania_1.expr("show = 'active' -> 'selected'"), onClick: this.onShow.bind(this, 'active') }, "Active")),
                    xania.tag("li", null,
                        xania.tag("a", { href: "#", className: xania_1.expr("show = 'completed' -> 'selected'"), onClick: this.onShow.bind(this, 'completed') }, "Completed"))),
                xania.tag("button", { className: ["clear-completed", xania_1.expr("all active todos -> ' hidden'")], onClick: function () { return _this.store.removeCompleted(); } }, "Clear completed"))));
    };
    return TodoApp;
}());
exports.TodoApp = TodoApp;
var TodoStore = (function () {
    function TodoStore() {
        this.todos = [];
        for (var i = 0; i < 2; i++)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9kby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRvZG8udHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx5Q0FBOEM7QUFDOUMsdUNBQXdDO0FBRXhDLDZCQUEwQjtBQUUxQjtJQUFBO1FBQUEsaUJBMEVDO1FBeEVHLFVBQUssR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ3hCLFNBQUksR0FBRyxLQUFLLENBQUM7UUFDYixnQkFBVyxHQUFHLElBQUksQ0FBQztRQUVuQixjQUFTLEdBQUcsVUFBQyxLQUFLO1lBQ2QsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN2QixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDakMsS0FBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDZCxDQUFDO1lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xCLENBQUMsQ0FBQTtRQUVELGdCQUFXLEdBQUc7WUFDVixLQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQTtRQUVELFdBQU0sR0FBRyxVQUFDLEtBQUs7WUFDWCxLQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztRQUN0QixDQUFDLENBQUE7UUFFRCxtQkFBYyxHQUFHLFVBQUMsS0FBSztZQUNuQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDckIsS0FBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUIsS0FBSSxDQUFDLFdBQVcs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UUFDSSxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUNyQyxDQUFDO0lBQ0wsV0FBQztBQUFELENBQUMsQUFQRCxJQU9DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVwZWF0LCBleHByIH0gZnJvbSBcIi4uLy4uL3NyYy94YW5pYVwiXHJcbmltcG9ydCB7IEFuaW1hdGUgfSBmcm9tIFwiLi4vLi4vc3JjL2FuaW1cIlxyXG5pbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5pbXBvcnQgJy4vdG9kb3MvaW5kZXguY3NzJ1xyXG5cclxuZXhwb3J0IGNsYXNzIFRvZG9BcHAge1xyXG5cclxuICAgIHN0b3JlID0gbmV3IFRvZG9TdG9yZSgpO1xyXG4gICAgc2hvdyA9IFwiYWxsXCI7XHJcbiAgICBlZGl0aW5nVG9kbyA9IG51bGw7XHJcblxyXG4gICAgb25BZGRUb2RvID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xyXG4gICAgICAgICAgICB0aGlzLnN0b3JlLnRvZG9zLnB1c2gobmV3IFRvZG8odGl0bGUpKTtcclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICB9XHJcblxyXG4gICAgb25Ub2dnbGVBbGwgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5zdG9yZS50b2dnbGVBbGwoKTtcclxuICAgIH1cclxuXHJcbiAgICBvblNob3cgPSAodmFsdWUpID0+IHtcclxuICAgICAgICB0aGlzLnNob3cgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBvblJlc2V0RWRpdGluZyA9IChldmVudCkgPT4ge1xyXG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMylcclxuICAgICAgICAgICAgdGhpcy5lZGl0aW5nVG9kbyA9IG51bGw7XHJcbiAgICAgICAgZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMjcpIHtcclxuICAgICAgICAgICAgdGhpcy5lZGl0aW5nVG9kbyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZpZXcoeGFuaWEpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJ0b2RvYXBwXCIgPlxyXG4gICAgICAgICAgICAgICAgPGhlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwibmV3LXRvZG9cIiBwbGFjZWhvbGRlcj1cIldoYXQgbmVlZHMgdG8gYmUgZG9uZT9cIiBhdXRvZm9jdXM9XCJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbktleVVwPXt0aGlzLm9uQWRkVG9kb30gLz5cclxuICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPXtbXCJtYWluXCIsIGV4cHIoXCJzdG9yZS50b2Rvcy5sZW5ndGggPSAwIC0+ICcgaGlkZGVuJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGUtYWxsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD17ZXhwcihcImVtcHR5IHN0b3JlLnRvZG9zIHdoZXJlIG5vdCBjb21wbGV0ZWRcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25Ub2dnbGVBbGx9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cInRvZG8tbGlzdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8UmVwZWF0IHBhcmFtPVwidG9kb1wiIHNvdXJjZT17ZXhwcihcInN0b3JlLnRvZG9zIHdoZXJlIChjb21wbGV0ZWQgPSAoc2hvdyA9ICdjb21wbGV0ZWQnKSkgb3IgKHNob3cgPSAnYWxsJylcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEFuaW1hdGUgaGVpZ2h0PVwiNThweFwiIHRyYW5zZm9ybT1cInNjYWxlKDEpXCIgZGlzcG9zZT17W3sgaGVpZ2h0OiBcIjU4cHhcIiwgb3BhY2l0eTogMSB9LCB7IGhlaWdodDogMCwgb3BhY2l0eTogMCB9XX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT17W2V4cHIoXCJ0b2RvLmNvbXBsZXRlZCAtPiAnY29tcGxldGVkJ1wiKSwgZXhwcihcInRvZG8gPSBlZGl0aW5nVG9kbyAtPiAnIGVkaXRpbmcnXCIpXX0gPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInZpZXdcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGVcIiB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtleHByKFwidG9kby5jb21wbGV0ZWRcIil9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgb25EYmxDbGljaz17ZXhwcihcImVkaXRpbmdUb2RvIDwtIHRvZG9cIil9PntleHByKFwidG9kby50aXRsZVwiKX08L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJkZXN0cm95XCIgb25DbGljaz17ZXhwcihcInN0b3JlLnJlbW92ZSB0b2RvXCIpfT48L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJlZGl0XCIgdmFsdWU9e2V4cHIoXCJ0b2RvLnRpdGxlXCIpfSBhdXRvZm9jdXM9XCJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uUmVzZXRFZGl0aW5nfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25LZXlVcD17dGhpcy5vblJlc2V0RWRpdGluZ30gLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9BbmltYXRlPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L1JlcGVhdD5cclxuICAgICAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPGZvb3RlciBjbGFzc05hbWU9e1tcImZvb3RlclwiLCBleHByKFwic3RvcmUudG9kb3MubGVuZ3RoID0gMCAtPiAnIGhpZGRlbidcIildfT5cclxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0b2RvLWNvdW50XCI+PHN0cm9uZz57ZXhwcihcImNvdW50IHN0b3JlLnRvZG9zIHdoZXJlIG5vdCBjb21wbGV0ZWRcIil9PC9zdHJvbmc+IGl0ZW0ocykgbGVmdDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwiZmlsdGVyc1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9e2V4cHIoXCJzaG93ID0gJ2FsbCcgLT4gJ3NlbGVjdGVkJ1wiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25TaG93LmJpbmQodGhpcywgJ2FsbCcpfT5BbGw8L2E+PC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPXtleHByKFwic2hvdyA9ICdhY3RpdmUnIC0+ICdzZWxlY3RlZCdcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uU2hvdy5iaW5kKHRoaXMsICdhY3RpdmUnKX0+QWN0aXZlPC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT17ZXhwcihcInNob3cgPSAnY29tcGxldGVkJyAtPiAnc2VsZWN0ZWQnXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblNob3cuYmluZCh0aGlzLCAnY29tcGxldGVkJyl9PkNvbXBsZXRlZDwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdWwgPlxyXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPXtbXCJjbGVhci1jb21wbGV0ZWRcIiwgZXhwcihcImFsbCBhY3RpdmUgdG9kb3MgLT4gJyBoaWRkZW4nXCIpXX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zdG9yZS5yZW1vdmVDb21wbGV0ZWQoKX0+Q2xlYXIgY29tcGxldGVkPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFRvZG9TdG9yZSB7XHJcbiAgICBwdWJsaWMgdG9kb3M6IFRvZG9bXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnRvZG9zID0gW107XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgaSsrKVxyXG4gICAgICAgICAgICB0aGlzLnRvZG9zLnB1c2gobmV3IFRvZG8oYHRvZG8gJHtpfWAsIGkgJSAyID09PSAwKSk7XHJcbiAgICB9XHJcblxyXG4gICAgdG9nZ2xlQWxsKCkge1xyXG4gICAgICAgIHZhciBhbGxDb21wbGV0ZWQgPSB0aGlzLnRvZG9zLmV2ZXJ5KGUgPT4gZS5jb21wbGV0ZWQpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50b2Rvcy5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgdGhpcy50b2Rvc1tpXS5jb21wbGV0ZWQgPSAhYWxsQ29tcGxldGVkO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZUNvbXBsZXRlZCgpIHtcclxuICAgICAgICB0aGlzLnRvZG9zID0gdGhpcy50b2Rvcy5maWx0ZXIodCA9PiAhdC5jb21wbGV0ZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZSh0b2RvKSB7XHJcbiAgICAgICAgdmFyIGlkeCA9IHRoaXMudG9kb3MuaW5kZXhPZih0b2RvKTtcclxuICAgICAgICBjb25zb2xlLmRlYnVnKFwicmVtb3ZlIHRvZG8gXCIsIGlkeCk7XHJcbiAgICAgICAgaWYgKGlkeCA+PSAwKVxyXG4gICAgICAgICAgICB0aGlzLnRvZG9zLnNwbGljZShpZHgsIDEpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInRvZG8gbm90IGZvdW5kXCIsIHRvZG8pO1xyXG4gICAgfVxyXG5cclxuICAgIG9yZGVyQnlUaXRsZSgpIHtcclxuICAgICAgICB0aGlzLnRvZG9zID0gdGhpcy50b2Rvcy5zb3J0KCh4LCB5KSA9PiB4LnRpdGxlLmxvY2FsZUNvbXBhcmUoeS50aXRsZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIG9yZGVyQnlUaXRsZURlc2MoKSB7XHJcbiAgICAgICAgdGhpcy50b2RvcyA9IHRoaXMudG9kb3Muc29ydCgoeCwgeSkgPT4geS50aXRsZS5sb2NhbGVDb21wYXJlKHgudGl0bGUpKTtcclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgVG9kbyB7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgdGl0bGU6IHN0cmluZywgcHVibGljIGNvbXBsZXRlZCA9IGZhbHNlKSB7XHJcbiAgICB9XHJcblxyXG4gICAgdG9nZ2xlQ29tcGxldGlvbigpIHtcclxuICAgICAgICB0aGlzLmNvbXBsZXRlZCA9ICF0aGlzLmNvbXBsZXRlZDtcclxuICAgIH1cclxufVxyXG5cclxuIl19