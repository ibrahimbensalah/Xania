class Todo {
    constructor(public title: string) {
    }

    public completed = false;

    toggleCompletion() {
        this.completed = !this.completed;
    }
}

class TodoStore {
    public todos: Todo[] = [];

    allCompleted() {
        for (var i = 0; i < this.todos.length; i++)
            if (!this.todos[i].completed)
                return false;
        return true;
    }

    toggleAll() {
        var allCompleted = this.allCompleted();
        for (var i = 0; i < this.todos.length; i++)
            this.todos[i].completed = !allCompleted;
    }

    getRemaining() {
        return this.todos.filter(t => !t.completed);
    }

    getCompleted() {
        return this.todos.filter(t => t.completed);
    }

    removeCompleted() {
        this.todos = this.getRemaining();
    }

    remove(todo) {
        var idx = this.todos.indexOf(todo.valueOf());
        console.debug("remove todo ", idx);
        if (idx >= 0)
            this.todos.splice(idx, 1);
    }
}

class TodoApp {
    public todoStore = new TodoStore();
    public newTodoText: string = "";

    start() {
    }

    addTodo() {
        if (!!this.newTodoText && this.newTodoText.length > 0) {
            this.todoStore.todos.push(new Todo(this.newTodoText));
            this.newTodoText = "";
        }
    }
}
