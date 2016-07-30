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
        return this.todos;
    }

    getCompleted() {
        return this.todos.filter(t => t.completed);
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
