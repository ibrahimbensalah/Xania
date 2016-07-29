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
}

class TodoApp {
    public todoStore = new TodoStore();
    public newTodoText: string = "";

    start() {
    }

    addTodo() {
        this.todoStore.todos.push(new Todo(this.newTodoText));
        this.newTodoText = "";
    }
}
