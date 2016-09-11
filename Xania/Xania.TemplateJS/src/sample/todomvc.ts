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

    toggleAll() {
        var allCompleted = this.todos.every(e => e.completed);
        for (var i = 0; i < this.todos.length; i++)
            this.todos[i].completed = !allCompleted;
    }

    removeCompleted() {
        this.todos = this.todos.filter(t => !t.completed);
    }

    remove(todo) {
        var idx = this.todos.indexOf(todo);
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
    public show = new State('all');

    start() {
    }

    addTodo = () => {
        debugger;
        if (!!this.newTodoText && this.newTodoText.length > 0) {
            this.store.todos.push(new Todo(this.newTodoText));
            this.newTodoText = "";
        }
    }

    public active(todo) {
        return todo.completed === false;
    }

    public completed(todo) {
        return todo.completed === true;
    }

    public todoPredicate(value) {
        return todo => {
            switch (value) {
                case 'all':
                    return true;
                default:
                    return todo.completed === (value === 'completed');
            }
        }
    }
}

class State {
    constructor(public value: any) {
    }

    apply(_, args) {
        this.value = args[0];
    }

    has(value) {
        return this.value === value;
    }

    valueOf() {
        return this.value;
    }
}

