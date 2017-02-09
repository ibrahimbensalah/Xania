"use strict";
var xania_1 = require("../../src/xania");
var TodoApp = (function () {
    function TodoApp() {
        this.store = new TodoStore();
        this.show = "all";
        this.editingTodo = null;
    }
    TodoApp.prototype.onAddTodo = function (event) {
        if (event.keyCode === 13) {
            var title = event.target.value;
            this.store.todos.push(new Todo(title));
            return "";
        }
        return void 0;
    };
    TodoApp.prototype.onToggleAll = function () {
        this.store.toggleAll();
    };
    TodoApp.prototype.onShow = function (value) {
        this.show = value;
    };
    TodoApp.prototype.onResetEditing = function () {
    };
    TodoApp.prototype.render = function (xania) {
        var _this = this;
        return (xania.tag("section", { className: "todoapp" },
            xania.tag("header", null,
                xania.tag("h1", null, "todos"),
                xania.tag("input", { className: "new-todo", placeholder: "What needs to be done?", autofocus: "", onKeyUp: this.onAddTodo.bind(this) })),
            xania.tag("section", { className: ["main", xania_1.fs("store.todos.length = 0 -> ' hidden'")] },
                xania.tag("input", { className: "toggle-all", type: "checkbox", checked: xania_1.fs("empty store.todos where not completed"), onClick: this.onToggleAll.bind(this) }),
                xania.tag("ul", { className: "todo-list" },
                    xania.tag(xania_1.ForEach, { expr: xania_1.fs("for todo in store.todos where (completed = (show = 'completed')) or (show = 'all')") },
                        xania.tag("li", { className: [xania_1.fs("todo.completed -> 'completed'"), xania_1.fs("todo = editingTodo -> ' editing'")] },
                            xania.tag("div", { className: "view" },
                                xania.tag("input", { className: "toggle", type: "checkbox", checked: xania_1.fs("todo.completed") }),
                                xania.tag("label", { onDblClick: xania_1.fs("editingTodo <- todo") }, xania_1.fs("todo.title")),
                                xania.tag("button", { className: "destroy", onClick: xania_1.fs("store.remove todo") })),
                            xania.tag("input", { className: "edit", value: xania_1.fs("todo.title"), autofocus: "", onBlur: function () { return _this.onResetEditing(); }, onKeyUp: function () { return _this.onResetEditing(); } }))))),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9kby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NhbXBsZS9sYXlvdXQvdG9kby50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHlDQUE2QztBQUc3QztJQUFBO1FBRUksVUFBSyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7UUFDeEIsU0FBSSxHQUFHLEtBQUssQ0FBQztRQUNiLGdCQUFXLEdBQUcsSUFBSSxDQUFDO0lBNER2QixDQUFDO0lBMURHLDJCQUFTLEdBQVQsVUFBVSxLQUFLO1FBQ1gsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxFQUFFLENBQUM7UUFDZCxDQUFDO1FBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xCLENBQUM7SUFFRCw2QkFBVyxHQUFYO1FBQ0ksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsd0JBQU0sR0FBTixVQUFPLEtBQUs7UUFDUixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztJQUN0QixDQUFDO0lBRUQsZ0NBQWMsR0FBZDtJQUVBLENBQUM7SUFFRCx3QkFBTSxHQUFOLFVBQU8sS0FBSztRQUFaLGlCQW9DQztRQW5DRyxNQUFNLENBQUMsQ0FDSCx1QkFBUyxTQUFTLEVBQUMsU0FBUztZQUN4QjtnQkFDSSw4QkFBYztnQkFDZCxxQkFBTyxTQUFTLEVBQUMsVUFBVSxFQUFDLFdBQVcsRUFBQyx3QkFBd0IsRUFBQyxTQUFTLEVBQUMsRUFBRSxFQUN6RSxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FB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Q0FBQztJQUM5QyxDQUFDO0lBRUQsZ0NBQVksR0FBWjtRQUNJLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUE5QixDQUE4QixDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVELG9DQUFnQixHQUFoQjtRQUNJLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUE5QixDQUE4QixDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQXBDRCxJQW9DQztBQUVEO0lBQ0ksY0FBbUIsS0FBYSxFQUFTLFNBQWlCO1FBQWpCLDBCQUFBLEVBQUEsaUJBQWlCO1FBQXZDLFVBQUssR0FBTCxLQUFLLENBQVE7UUFBUyxjQUFTLEdBQVQsU0FBUyxDQUFRO0lBQzFELENBQUM7SUFFRCwrQkFBZ0IsR0FBaEI7UUFDSSxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUNyQyxDQUFDO0lBQ0wsV0FBQztBQUFELENBQUMsQUFQRCxJQU9DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRm9yRWFjaCwgZnMgfSBmcm9tIFwiLi4vLi4vc3JjL3hhbmlhXCJcclxuaW1wb3J0IHsgT2JzZXJ2YWJsZXMgfSBmcm9tIFwiLi4vLi4vc3JjL29ic2VydmFibGVzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBUb2RvQXBwIHtcclxuXHJcbiAgICBzdG9yZSA9IG5ldyBUb2RvU3RvcmUoKTtcclxuICAgIHNob3cgPSBcImFsbFwiO1xyXG4gICAgZWRpdGluZ1RvZG8gPSBudWxsO1xyXG5cclxuICAgIG9uQWRkVG9kbyhldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMykge1xyXG4gICAgICAgICAgICBjb25zdCB0aXRsZSA9IGV2ZW50LnRhcmdldC52YWx1ZTtcclxuICAgICAgICAgICAgdGhpcy5zdG9yZS50b2Rvcy5wdXNoKG5ldyBUb2RvKHRpdGxlKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdm9pZCAwO1xyXG4gICAgfVxyXG5cclxuICAgIG9uVG9nZ2xlQWxsKCkge1xyXG4gICAgICAgIHRoaXMuc3RvcmUudG9nZ2xlQWxsKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25TaG93KHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5zaG93ID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgb25SZXNldEVkaXRpbmcoKSB7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcih4YW5pYSkge1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInRvZG9hcHBcIj5cclxuICAgICAgICAgICAgICAgIDxoZWFkZXI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGgxPnRvZG9zPC9oMT5cclxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwibmV3LXRvZG9cIiBwbGFjZWhvbGRlcj1cIldoYXQgbmVlZHMgdG8gYmUgZG9uZT9cIiBhdXRvZm9jdXM9XCJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbktleVVwPXt0aGlzLm9uQWRkVG9kby5iaW5kKHRoaXMpfSAvPlxyXG4gICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e1tcIm1haW5cIiwgZnMoXCJzdG9yZS50b2Rvcy5sZW5ndGggPSAwIC0+ICcgaGlkZGVuJ1wiKV19PlxyXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGUtYWxsXCIgdHlwZT1cImNoZWNrYm94XCIgY2hlY2tlZD17ZnMoXCJlbXB0eSBzdG9yZS50b2RvcyB3aGVyZSBub3QgY29tcGxldGVkXCIpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uVG9nZ2xlQWxsLmJpbmQodGhpcyl9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cInRvZG8tbGlzdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Rm9yRWFjaCBleHByPXtmcyhcImZvciB0b2RvIGluIHN0b3JlLnRvZG9zIHdoZXJlIChjb21wbGV0ZWQgPSAoc2hvdyA9ICdjb21wbGV0ZWQnKSkgb3IgKHNob3cgPSAnYWxsJylcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT17W2ZzKFwidG9kby5jb21wbGV0ZWQgLT4gJ2NvbXBsZXRlZCdcIiksIGZzKFwidG9kbyA9IGVkaXRpbmdUb2RvIC0+ICcgZWRpdGluZydcIildfSA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ2aWV3XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGVcIiB0eXBlPVwiY2hlY2tib3hcIiBjaGVja2VkPXtmcyhcInRvZG8uY29tcGxldGVkXCIpfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgb25EYmxDbGljaz17ZnMoXCJlZGl0aW5nVG9kbyA8LSB0b2RvXCIpfT57ZnMoXCJ0b2RvLnRpdGxlXCIpfTwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiZGVzdHJveVwiIG9uQ2xpY2s9e2ZzKFwic3RvcmUucmVtb3ZlIHRvZG9cIil9PjwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJlZGl0XCIgdmFsdWU9e2ZzKFwidG9kby50aXRsZVwiKX0gYXV0b2ZvY3VzPVwiXCIgb25CbHVyPXsoKSA9PiB0aGlzLm9uUmVzZXRFZGl0aW5nKCl9IG9uS2V5VXA9eygpID0+IHRoaXMub25SZXNldEVkaXRpbmcoKX0gLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvRm9yRWFjaD5cclxuICAgICAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgPGZvb3RlciBjbGFzc05hbWU9e1tcImZvb3RlclwiLCBmcyhcInN0b3JlLnRvZG9zLmxlbmd0aCA9IDAgLT4gJyBoaWRkZW4nXCIpXX0+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidG9kby1jb3VudFwiPjxzdHJvbmc+e2ZzKFwiY291bnQgc3RvcmUudG9kb3Mgd2hlcmUgbm90IGNvbXBsZXRlZFwiKX08L3N0cm9uZz4gaXRlbShzKSBsZWZ0PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJmaWx0ZXJzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiIGNsYXNzTmFtZT17ZnMoXCJzaG93ID0gJ2FsbCcgLT4gJ3NlbGVjdGVkJ1wiKX0gb25DbGljaz17dGhpcy5vblNob3cuYmluZCh0aGlzLCAnYWxsJyl9PkFsbDwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIiBjbGFzc05hbWU9e2ZzKFwic2hvdyA9ICdhY3RpdmUnIC0+ICdzZWxlY3RlZCdcIil9IG9uQ2xpY2s9e3RoaXMub25TaG93LmJpbmQodGhpcywgJ2FjdGl2ZScpfT5BY3RpdmU8L2E+PC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCIgY2xhc3NOYW1lPXtmcyhcInNob3cgPSAnY29tcGxldGVkJyAtPiAnc2VsZWN0ZWQnXCIpfSBvbkNsaWNrPXt0aGlzLm9uU2hvdy5iaW5kKHRoaXMsICdjb21wbGV0ZWQnKX0+Q29tcGxldGVkPC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPC91bCA+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9e1tcImNsZWFyLWNvbXBsZXRlZFwiLCBmcyhcImFsbCBhY3RpdmUgdG9kb3MgLT4gJyBoaWRkZW4nXCIpXX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zdG9yZS5yZW1vdmVDb21wbGV0ZWQoKX0+Q2xlYXIgY29tcGxldGVkPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cclxuICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFRvZG9TdG9yZSB7XHJcbiAgICBwdWJsaWMgdG9kb3M6IFRvZG9bXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLnRvZG9zID0gW107XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKylcclxuICAgICAgICAgICAgdGhpcy50b2Rvcy5wdXNoKG5ldyBUb2RvKGB0b2RvICR7aX1gLCBpICUgMiA9PT0gMCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZUFsbCgpIHtcclxuICAgICAgICB2YXIgYWxsQ29tcGxldGVkID0gdGhpcy50b2Rvcy5ldmVyeShlID0+IGUuY29tcGxldGVkKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudG9kb3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgIHRoaXMudG9kb3NbaV0uY29tcGxldGVkID0gIWFsbENvbXBsZXRlZDtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVDb21wbGV0ZWQoKSB7XHJcbiAgICAgICAgdGhpcy50b2RvcyA9IHRoaXMudG9kb3MuZmlsdGVyKHQgPT4gIXQuY29tcGxldGVkKTtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmUodG9kbykge1xyXG4gICAgICAgIHZhciBpZHggPSB0aGlzLnRvZG9zLmluZGV4T2YodG9kbyk7XHJcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcInJlbW92ZSB0b2RvIFwiLCBpZHgpO1xyXG4gICAgICAgIGlmIChpZHggPj0gMClcclxuICAgICAgICAgICAgdGhpcy50b2Rvcy5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJ0b2RvIG5vdCBmb3VuZFwiLCB0b2RvKTtcclxuICAgIH1cclxuXHJcbiAgICBvcmRlckJ5VGl0bGUoKSB7XHJcbiAgICAgICAgdGhpcy50b2RvcyA9IHRoaXMudG9kb3Muc29ydCgoeCwgeSkgPT4geC50aXRsZS5sb2NhbGVDb21wYXJlKHkudGl0bGUpKTtcclxuICAgIH1cclxuXHJcbiAgICBvcmRlckJ5VGl0bGVEZXNjKCkge1xyXG4gICAgICAgIHRoaXMudG9kb3MgPSB0aGlzLnRvZG9zLnNvcnQoKHgsIHkpID0+IHkudGl0bGUubG9jYWxlQ29tcGFyZSh4LnRpdGxlKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIFRvZG8ge1xyXG4gICAgY29uc3RydWN0b3IocHVibGljIHRpdGxlOiBzdHJpbmcsIHB1YmxpYyBjb21wbGV0ZWQgPSBmYWxzZSkge1xyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZUNvbXBsZXRpb24oKSB7XHJcbiAgICAgICAgdGhpcy5jb21wbGV0ZWQgPSAhdGhpcy5jb21wbGV0ZWQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==