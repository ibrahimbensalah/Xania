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
var TodoApp = (function () {
    function TodoApp() {
        var _this = this;
        this.store = new TodoStore();
        this.newTodoText = "";
        this.show = State('all');
        this.addTodo = function () {
            if (!!_this.newTodoText && _this.newTodoText.length > 0) {
                console.debug("add todo", _this.newTodoText);
                _this.store.todos.push(new Todo(_this.newTodoText));
                _this.newTodoText = "";
            }
        };
    }
    TodoApp.prototype.active = function (todo) {
        return todo.completed === false;
    };
    TodoApp.prototype.completed = function (todo) {
        return todo.completed === true;
    };
    TodoApp.todoPredicate = function (value) {
        return function (todo) {
            var status = value();
            switch (status) {
                case 'all':
                    return true;
                default:
                    return todo.completed === (status === 'completed');
            }
        };
    };
    return TodoApp;
}());
function State(initialValue) {
    var fn = function (x) {
        if (x !== undefined)
            fn['id'] = x;
        return fn['id'];
    };
    fn['id'] = initialValue;
    fn['valueOf'] = function () { return initialValue; };
    return fn;
}
;
//# sourceMappingURL=todomvc.js.map