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
        for (var i = 0; i < 10; i++)
            this.todos.push(new Todo("todo " + i));
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
    return TodoStore;
})();
var TodoApp = (function () {
    function TodoApp() {
        var _this = this;
        this.store = new TodoStore();
        this.newTodoText = "";
        this.show = new State('all');
        this.addTodo = function () {
            debugger;
            if (!!_this.newTodoText && _this.newTodoText.length > 0) {
                _this.store.todos.push(new Todo(_this.newTodoText));
                _this.newTodoText = "";
            }
        };
    }
    TodoApp.prototype.start = function () {
    };
    TodoApp.prototype.active = function (todo) {
        return todo.completed === false;
    };
    TodoApp.prototype.completed = function (todo) {
        return todo.completed === true;
    };
    TodoApp.prototype.todoPredicate = function (value) {
        return function (todo) {
            switch (value) {
                case 'all':
                    return true;
                default:
                    return todo.completed === (value === 'completed');
            }
        };
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
    State.prototype.valueOf = function () {
        return this.value;
    };
    return State;
})();
