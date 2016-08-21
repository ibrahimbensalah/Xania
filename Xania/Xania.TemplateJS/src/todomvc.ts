class Todo {
    constructor(public title: string) {
    }

    public completed = false;

    toggleCompletion() {
        this.completed = !this.completed;
    }
}

class TodoStore {
    public todos: Todo[];

    constructor() {
        this.todos = [];

        for (var i = 0; i < 10; i++)
            this.todos.push(new Todo(`todo ${i}`));
    }

    all(cat): Array<Todo> {
        if (!!cat)
            return this.todos.filter(x => x.completed === (cat === "completed"));
        else
            return this.todos;
    }

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
        else
            console.error("todo not found", todo);
    }
}

class TodoApp {
    public store = new TodoStore();
    public newTodoText: string = "";
    public show = new State(null);

    start() {
    }

    addTodo() {
        if (!!this.newTodoText && this.newTodoText.length > 0) {
            this.store.todos.push(new Todo(this.newTodoText));
            this.newTodoText = "";
        }
    }

    filterTodos (list) {
        var value = this.show.get();
        if (value === null)
            return list;
        else if (typeof value === "boolean")
            return list.filter(x => x.completed === value);
        else
            throw new Error("show state value is expected a null or a boolean, but found " + value);
    }
}

class State {
    constructor(public value: any) {
    }

    set(value) {
        this.value = value;
    }

    has(value) {
        return this.value === value;
    }
    
    get() {
        return this.value;
    }
}