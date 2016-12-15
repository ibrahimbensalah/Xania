var Time;
(function (Time) {
    var TimeItem = (function () {
        function TimeItem(title, completed) {
            if (completed === void 0) { completed = false; }
            this.title = title;
            this.completed = completed;
        }
        TimeItem.prototype.toggleCompletion = function () {
            this.completed = !this.completed;
        };
        return TimeItem;
    }());
    var TimeStore = (function () {
        function TimeStore() {
            this.todos = [];
            for (var i = 0; i < 10; i++)
                this.todos.push(new TimeItem("todo " + i, i % 2 === 0));
        }
        TimeStore.prototype.toggleAll = function () {
            var allCompleted = this.todos.every(function (e) { return e.completed; });
            for (var i = 0; i < this.todos.length; i++)
                this.todos[i].completed = !allCompleted;
        };
        TimeStore.prototype.removeCompleted = function () {
            this.todos = this.todos.filter(function (t) { return !t.completed; });
        };
        TimeStore.prototype.remove = function (todo) {
            var idx = this.todos.indexOf(todo);
            console.debug("remove todo ", idx);
            if (idx >= 0)
                this.todos.splice(idx, 1);
            else
                console.error("todo not found", todo);
        };
        TimeStore.prototype.orderByTitle = function () {
            this.todos = this.todos.sort(function (x, y) { return x.title.localeCompare(y.title); });
        };
        TimeStore.prototype.orderByTitleDesc = function () {
            this.todos = this.todos.sort(function (x, y) { return y.title.localeCompare(x.title); });
        };
        return TimeStore;
    }());
    Time.TimeStore = TimeStore;
})(Time || (Time = {}));
var TimeApp = (function () {
    function TimeApp() {
        var _this = this;
        this.store = new Time.TimeStore();
        this.newTodoText = "";
        this.show = Xania.Core.State('all');
        this.addTodo = function () {
            if (!!_this.newTodoText && _this.newTodoText.length > 0) {
                console.debug("add todo", _this.newTodoText);
                _this.store.todos.push(new Todo(_this.newTodoText));
                _this.newTodoText = "";
            }
        };
    }
    TimeApp.prototype.active = function (todo) {
        return todo.completed === false;
    };
    TimeApp.todoPredicate = function (value) {
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
    return TimeApp;
}());
//# sourceMappingURL=app.js.map