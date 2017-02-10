"use strict";
var xania_1 = require("../../src/xania");
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
                xania.tag("h1", null, "todos"),
                xania.tag("input", { className: "new-todo", placeholder: "What needs to be done?", autofocus: "", onKeyUp: this.onAddTodo })),
            xania.tag("section", { className: ["main", xania_1.fs("store.todos.length = 0 -> ' hidden'")] },
                xania.tag("input", { className: "toggle-all", type: "checkbox", checked: xania_1.fs("empty store.todos where not completed"), onClick: this.onToggleAll }),
                xania.tag("ul", { className: "todo-list" },
                    xania.tag(xania_1.ForEach, { expr: xania_1.fs("for todo in store.todos where (completed = (show = 'completed')) or (show = 'all')") },
                        xania.tag(xania_1.Animate, null,
                            xania.tag("li", { className: [xania_1.fs("todo.completed -> 'completed'"), xania_1.fs("todo = editingTodo -> ' editing'")] },
                                xania.tag("div", { className: "view" },
                                    xania.tag("input", { className: "toggle", type: "checkbox", checked: xania_1.fs("todo.completed") }),
                                    xania.tag("label", { onDblClick: xania_1.fs("editingTodo <- todo") }, xania_1.fs("todo.title")),
                                    xania.tag("button", { className: "destroy", onClick: xania_1.fs("store.remove todo") })),
                                xania.tag("input", { className: "edit", value: xania_1.fs("todo.title"), autofocus: "", onBlur: this.onResetEditing, onKeyUp: this.onResetEditing })))))),
            xania.tag("footer", { className: ["footer", xania_1.fs("store.todos.length = 0 -> ' hidden'")] },
                xania.tag("span", { className: "todo-count" },
                    xania.tag("strong", null, xania_1.fs("count store.todos where not completed")),
                    " item(s) left"),
                xania.tag("ul", { className: "filters" },
                    xania.tag("li", null,
                        xania.tag("a", { href: "#", className: xania_1.fs("show = 'all' -> 'selected'"), onClick: this.onShow.bind(this, 'all') }, "All")),
                    xania.tag("li", null,
                        xania.tag("a", { href: "#", className: xania_1.fs("show = 'active' -> 'selected'"), onClick: this.onShow.bind(this, 'active') }, "Active")),
                    xania.tag("li", null,
                        xania.tag("a", { href: "#", className: xania_1.fs("show = 'completed' -> 'selected'"), onClick: this.onShow.bind(this, 'completed') }, "Completed"))),
                xania.tag("button", { className: ["clear-completed", xania_1.fs("all active todos -> ' hidden'")], onClick: function () { return _this.store.removeCompleted(); } }, "Clear completed"))));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9kby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NhbXBsZS9sYXlvdXQvdG9kby50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHlDQUFzRDtBQUd0RDtJQUFBO1FBQUEsaUJBMkVDO1FBekVHLFVBQUssR0FBRyxJQUFJLFNBQVMsRUFBRSxDQUFDO1FBQ3hCLFNBQUksR0FBRyxLQUFLLENBQUM7UUFDYixnQkFBVyxHQUFHLElBQUksQ0FBQztRQUVuQixjQUFTLEdBQUcsVUFBQyxLQUFLO1lBQ2QsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN2QixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDakMsS0FBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDZCxDQUFDO1lBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xCLENBQUMsQ0FBQTtRQUVELGdCQUFXLEdBQUc7WUFDVixLQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQTtRQUVELFdBQU0sR0FBRyxVQUFDLEtBQUs7WUFDWCxLQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztRQUN0QixDQUFDLENBQUE7UUFFRCxtQkFBYyxHQUFHLFVBQUMsS0FBSztZQUNuQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDckIsS0FBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUIsS0FBSSxDQUFDLFdBQVcsR0FB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QUFHLENBQUMsQ0FBQztRQUNuQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ1QsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlCLElBQUk7WUFDQSxPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFRCxnQ0FBWSxHQUFaO1FBQ0ksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQTlCLENBQThCLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRUQsb0NBQWdCLEdBQWhCO1FBQ0ksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQTlCLENBQThCLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBQ0wsZ0JBQUM7QUFBRCxDQUFDLEFBcENELElBb0NDO0FBRUQ7SUFDSSxjQUFtQixLQUFhLEVBQVMsU0FBaUI7UUFBakIsMEJBQUEsRUFBQSxpQkFBaUI7UUFBdkMsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUFTLGNBQVMsR0FBVCxTQUFTLENBQVE7SUFDMUQsQ0FBQztJQUVELCtCQUFnQixHQUFoQjtRQUNJLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3JDLENBQUM7SUFDTCxXQUFDO0FBQUQsQ0FBQyxBQVBELElBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBGb3JFYWNoLCBBbmltYXRlLCBmcyB9IGZyb20gXCIuLi8uLi9zcmMveGFuaWFcIlxyXG5pbXBvcnQgeyBPYnNlcnZhYmxlcyB9IGZyb20gXCIuLi8uLi9zcmMvb2JzZXJ2YWJsZXNcIlxyXG5cclxuZXhwb3J0IGNsYXNzIFRvZG9BcHAge1xyXG5cclxuICAgIHN0b3JlID0gbmV3IFRvZG9TdG9yZSgpO1xyXG4gICAgc2hvdyA9IFwiYWxsXCI7XHJcbiAgICBlZGl0aW5nVG9kbyA9IG51bGw7XHJcblxyXG4gICAgb25BZGRUb2RvID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gZXZlbnQudGFyZ2V0LnZhbHVlO1xyXG4gICAgICAgICAgICB0aGlzLnN0b3JlLnRvZG9zLnB1c2gobmV3IFRvZG8odGl0bGUpKTtcclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2b2lkIDA7XHJcbiAgICB9XHJcblxyXG4gICAgb25Ub2dnbGVBbGwgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5zdG9yZS50b2dnbGVBbGwoKTtcclxuICAgIH1cclxuXHJcbiAgICBvblNob3cgPSAodmFsdWUpID0+IHtcclxuICAgICAgICB0aGlzLnNob3cgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBvblJlc2V0RWRpdGluZyA9IChldmVudCkgPT4ge1xyXG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMylcclxuICAgICAgICAgICAgdGhpcy5lZGl0aW5nVG9kbyA9IG51bGw7XHJcbiAgICAgICAgZWxzZSBpZiAoZXZlbnQua2V5Q29kZSA9PT0gMjcpIHtcclxuICAgICAgICAgICAgdGhpcy5lZGl0aW5nVG9kbyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZpZXcoeGFuaWEpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJ0b2RvYXBwXCIgPlxyXG4gICAgICAgICAgICAgICAgPGhlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICA8aDE+dG9kb3M8L2gxPlxyXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJuZXctdG9kb1wiIHBsYWNlaG9sZGVyPVwiV2hhdCBuZWVkcyB0byBiZSBkb25lP1wiIGF1dG9mb2N1cz1cIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5VXA9e3RoaXMub25BZGRUb2RvfSAvPlxyXG4gICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e1tcIm1haW5cIiwgZnMoXCJzdG9yZS50b2Rvcy5sZW5ndGggPSAwIC0+ICcgaGlkZGVuJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGUtYWxsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD17ZnMoXCJlbXB0eSBzdG9yZS50b2RvcyB3aGVyZSBub3QgY29tcGxldGVkXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uVG9nZ2xlQWxsfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJ0b2RvLWxpc3RcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPEZvckVhY2ggZXhwcj17ZnMoXCJmb3IgdG9kbyBpbiBzdG9yZS50b2RvcyB3aGVyZSAoY29tcGxldGVkID0gKHNob3cgPSAnY29tcGxldGVkJykpIG9yIChzaG93ID0gJ2FsbCcpXCIpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxBbmltYXRlPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9e1tmcyhcInRvZG8uY29tcGxldGVkIC0+ICdjb21wbGV0ZWQnXCIpLCBmcyhcInRvZG8gPSBlZGl0aW5nVG9kbyAtPiAnIGVkaXRpbmcnXCIpXX0gPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInZpZXdcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGVcIiB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtmcyhcInRvZG8uY29tcGxldGVkXCIpfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIG9uRGJsQ2xpY2s9e2ZzKFwiZWRpdGluZ1RvZG8gPC0gdG9kb1wiKX0+e2ZzKFwidG9kby50aXRsZVwiKX08L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJkZXN0cm95XCIgb25DbGljaz17ZnMoXCJzdG9yZS5yZW1vdmUgdG9kb1wiKX0+PC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZWRpdFwiIHZhbHVlPXtmcyhcInRvZG8udGl0bGVcIil9IGF1dG9mb2N1cz1cIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25SZXNldEVkaXRpbmd9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbktleVVwPXt0aGlzLm9uUmVzZXRFZGl0aW5nfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0FuaW1hdGU+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPGZvb3RlciBjbGFzc05hbWU9e1tcImZvb3RlclwiLCBmcyhcInN0b3JlLnRvZG9zLmxlbmd0aCA9IDAgLT4gJyBoaWRkZW4nXCIpXX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidG9kby1jb3VudFwiPjxzdHJvbmc+e2ZzKFwiY291bnQgc3RvcmUudG9kb3Mgd2hlcmUgbm90IGNvbXBsZXRlZFwiKX08L3N0cm9uZz4gaXRlbShzKSBsZWZ0PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJmaWx0ZXJzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT17ZnMoXCJzaG93ID0gJ2FsbCcgLT4gJ3NlbGVjdGVkJ1wiKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25TaG93LmJpbmQodGhpcywgJ2FsbCcpfT5BbGw8L2E+PC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPXtmcyhcInNob3cgPSAnYWN0aXZlJyAtPiAnc2VsZWN0ZWQnXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vblNob3cuYmluZCh0aGlzLCAnYWN0aXZlJyl9PkFjdGl2ZTwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9e2ZzKFwic2hvdyA9ICdjb21wbGV0ZWQnIC0+ICdzZWxlY3RlZCdcIil9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uU2hvdy5iaW5kKHRoaXMsICdjb21wbGV0ZWQnKX0+Q29tcGxldGVkPC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPC91bCA+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9e1tcImNsZWFyLWNvbXBsZXRlZFwiLCBmcyhcImFsbCBhY3RpdmUgdG9kb3MgLT4gJyBoaWRkZW4nXCIpXX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zdG9yZS5yZW1vdmVDb21wbGV0ZWQoKX0+Q2xlYXIgY29tcGxldGVkPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFRvZG9TdG9yZSB7XHJcbiAgICBwdWJsaWMgdG9kb3M6IFRvZG9bXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnRvZG9zID0gW107XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKylcclxuICAgICAgICAgICAgdGhpcy50b2Rvcy5wdXNoKG5ldyBUb2RvKGB0b2RvICR7aX1gLCBpICUgMiA9PT0gMCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZUFsbCgpIHtcclxuICAgICAgICB2YXIgYWxsQ29tcGxldGVkID0gdGhpcy50b2Rvcy5ldmVyeShlID0+IGUuY29tcGxldGVkKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudG9kb3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgIHRoaXMudG9kb3NbaV0uY29tcGxldGVkID0gIWFsbENvbXBsZXRlZDtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVDb21wbGV0ZWQoKSB7XHJcbiAgICAgICAgdGhpcy50b2RvcyA9IHRoaXMudG9kb3MuZmlsdGVyKHQgPT4gIXQuY29tcGxldGVkKTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmUodG9kbykge1xyXG4gICAgICAgIHZhciBpZHggPSB0aGlzLnRvZG9zLmluZGV4T2YodG9kbyk7XHJcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcInJlbW92ZSB0b2RvIFwiLCBpZHgpO1xyXG4gICAgICAgIGlmIChpZHggPj0gMClcclxuICAgICAgICAgICAgdGhpcy50b2Rvcy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJ0b2RvIG5vdCBmb3VuZFwiLCB0b2RvKTtcclxuICAgIH1cclxuXHJcbiAgICBvcmRlckJ5VGl0bGUoKSB7XHJcbiAgICAgICAgdGhpcy50b2RvcyA9IHRoaXMudG9kb3Muc29ydCgoeCwgeSkgPT4geC50aXRsZS5sb2NhbGVDb21wYXJlKHkudGl0bGUpKTtcclxuICAgIH1cclxuXHJcbiAgICBvcmRlckJ5VGl0bGVEZXNjKCkge1xyXG4gICAgICAgIHRoaXMudG9kb3MgPSB0aGlzLnRvZG9zLnNvcnQoKHgsIHkpID0+IHkudGl0bGUubG9jYWxlQ29tcGFyZSh4LnRpdGxlKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFRvZG8ge1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHRpdGxlOiBzdHJpbmcsIHB1YmxpYyBjb21wbGV0ZWQgPSBmYWxzZSkge1xyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZUNvbXBsZXRpb24oKSB7XHJcbiAgICAgICAgdGhpcy5jb21wbGV0ZWQgPSAhdGhpcy5jb21wbGV0ZWQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==