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
        this.todos = [];
    }
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
//# sourceMappingURL=todomvc.js.map