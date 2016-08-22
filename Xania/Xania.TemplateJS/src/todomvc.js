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
        for (var i = 0; i < 50; i++)
            this.todos.push(new Todo("todo " + i));
    }
    TodoStore.prototype.all = function (cat) {
        if (!!cat)
            return this.todos.filter(function (x) { return x.completed === (cat === "completed"); });
        else
            return this.todos;
    };
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
    TodoStore.prototype.getCompleted = function () {
        return this.todos.filter(function (t) { return t.completed; });
    };
    TodoStore.prototype.removeCompleted = function () {
        this.todos = this.todos.filter(function (t) { return !t.completed; });
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
        this.store = new TodoStore();
        this.newTodoText = "";
        this.show = new State(null);
    }
    TodoApp.prototype.start = function () {
    };
    TodoApp.prototype.addTodo = function () {
        if (!!this.newTodoText && this.newTodoText.length > 0) {
            this.store.todos.push(new Todo(this.newTodoText));
            this.newTodoText = "";
        }
    };
    return TodoApp;
})();
var State = (function () {
    function State(value) {
        this.value = value;
    }
    State.prototype.apply = function (_, args) {
        this.value = args[0];
    };
    State.prototype.has = function (value) {
        return this.value === value;
    };
    State.prototype.get = function () {
        return this.value;
    };
    return State;
})();
