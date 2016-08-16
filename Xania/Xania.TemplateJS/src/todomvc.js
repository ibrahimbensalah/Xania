var Todo = (function () {
    function Todo(title) {
        this.title = title;
        this.completed = false;
    }
    Todo.prototype.toggleCompletion = function () {
        this.completed = !this.completed;
    };
    return Todo;
})();
var TodoStore = (function () {
    function TodoStore() {
        this.showOnlyCompleted = null;
        this.todos = [];
        for (var i = 0; i < 10; i++)
            this.todos.push(new Todo("todo " + i));
    }
    TodoStore.prototype.all = function () {
        var _this = this;
        if (this.showAll)
            return this.todos;
        else
            return this.todos.filter(function (x) { return x.completed === _this.showOnlyCompleted; });
    };
    TodoStore.prototype.filter = function (b) {
        this.showOnlyCompleted = b;
    };
    Object.defineProperty(TodoStore.prototype, "showAll", {
        get: function () {
            return typeof this.showOnlyCompleted !== "boolean";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoStore.prototype, "showActive", {
        get: function () {
            return this.showOnlyCompleted === false;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TodoStore.prototype, "showCompleted", {
        get: function () {
            return this.showOnlyCompleted === true;
        },
        enumerable: true,
        configurable: true
    });
    TodoStore.prototype.allCompleted = function () {
        for (var i = 0; i < this.todos.length; i++)
            if (!this.todos[i].completed)
                return false;
        return true;
    };
    TodoStore.prototype.toggleAll = function () {
        var allCompleted = this.allCompleted();
        for (var i = 0; i < this.todos.length; i++)
            this.todos[i].completed = !allCompleted;
    };
    TodoStore.prototype.getRemaining = function () {
        return this.todos.filter(function (t) { return !t.completed; });
    };
    TodoStore.prototype.getCompleted = function () {
        return this.todos.filter(function (t) { return t.completed; });
    };
    TodoStore.prototype.removeCompleted = function () {
        this.todos = this.getRemaining();
    };
    TodoStore.prototype.remove = function (todo) {
        var idx = this.todos.indexOf(todo.valueOf());
        console.debug("remove todo ", idx);
        if (idx >= 0)
            this.todos.splice(idx, 1);
        else
            console.error("todo not found", todo);
    };
    return TodoStore;
})();
var TodoApp = (function () {
    function TodoApp() {
        this.todoStore = new TodoStore();
        this.newTodoText = "";
    }
    TodoApp.prototype.start = function () {
    };
    TodoApp.prototype.addTodo = function () {
        if (!!this.newTodoText && this.newTodoText.length > 0) {
            this.todoStore.todos.push(new Todo(this.newTodoText));
            this.newTodoText = "";
        }
    };
    return TodoApp;
})();
