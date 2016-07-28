class Todo {
    constructor(public title: string = "asdf") {
    }
}

class TodoStore {
    public todos: Todo[] = [];

    allCompleted() {
        return "checked";
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
