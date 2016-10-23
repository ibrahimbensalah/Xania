class Todo {
    constructor(public title: string, public completed = false) {
    }

    toggleCompletion() {
        this.completed = !this.completed;
    }
}

class TodoStore {
    public todos: Todo[];

    constructor() {
        this.todos = [];

        for (var i = 0; i < 6; i++)
            this.todos.push(new Todo(`todo ${i}`, i % 2 === 0));
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
        if (!!this.newTodoText && this.newTodoText.length > 0) {
            console.debug("add todo", this.newTodoText);
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

    static todoPredicate(value) {
        return todo => {
            var status = value.valueOf();
            switch (status) {
                case 'all':
                    return true;
                default:
                    return todo.completed === (status === 'completed');
            }
        }
    }
}

class State {
    constructor(public id: any) {
    }

    execute(newValue) {
        this.id = newValue;
    }

    has(value) {
        return this.id === value;
    }

    valueOf() {
        return this.id;
    }
}
