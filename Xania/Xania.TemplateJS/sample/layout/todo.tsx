import { Xania, ForEach, fs } from "../../src/xania"
import { Observables } from "../../src/observables"

export class TodoApp {

    store = new TodoStore();
    show = new Observables.Observable('all');
    newTodoText = "";

    render() {
        return (
            <section className="todoapp">
                <header className="header">
                    <h1>todos</h1>
                    <input className="new-todo" placeholder="What needs to be done?" autofocus="" name="newTodoText" onKeyUp={fs("keyCode = 13 -> store.addTodo(newTodoText)")} />
                </header>
                <section className={["main", fs("no store.todos -> ' hidden'")]}>
                    <input className="toggle-all" type="checkbox" checked={fs("empty store.todos where not completed")} click={fs("store.toggleAll")} />
                    <ul className="todo-list">
                        <ForEach expr={fs("for todo in store.todos where (completed = (await show = 'completed')) or (await show = 'all')")}>
                            <li className={fs("todo.completed -> 'completed'")} >
                                <div className="view">
                                    <input className="toggle" type="checkbox" checked={fs("todo.completed")} />
                                    <label dblclick="editTodo(todo)">{fs("todo.title")}</label>
                                    <button className="destroy" click={fs("store.remove todo")}></button>
                                </div>
                            </li>
                        </ForEach>
                    </ul>
                </section>
                <footer className={["footer", fs("no store.todos -> ' hidden'")]}>
                    <span className="todo-count"><strong>{fs("count store.todos where completed")}</strong> item(s) left</span>
                    <ul className="filters">
                        <li><a href="#" className={fs("(await show) = 'all' -> 'selected'")} onClick={fs("show.onNext 'all'")}>All</a></li>
                        <li><a href="#" className={fs("(await show) = 'active' -> 'selected'")} onClick={fs("show.onNext 'active'")}>Active</a></li>
                        <li><a href="#" className={fs("(await show) = 'completed' -> 'selected'")} onClick={fs("show.onNext 'completed'")}>Completed</a></li>
                    </ul >
                    <button className={["clear-completed", fs("all active todos -> ' hidden'")]}
                        click={fs("store.removeCompleted ()")}>Clear completed</button>
                </footer>
            </section>
        );
    }
}

class TodoStore {
    public todos: Todo[];

    constructor() {
        this.todos = [];

        for (var i = 0; i < 10; i++)
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

    orderByTitle() {
        this.todos = this.todos.sort((x, y) => x.title.localeCompare(y.title));
    }

    orderByTitleDesc() {
        this.todos = this.todos.sort((x, y) => y.title.localeCompare(x.title));
    }

    addTodo(title) {
        this.todos.push(new Todo(title));
    }
}

class Todo {
    constructor(public title: string, public completed = false) {
    }

    toggleCompletion() {
        this.completed = !this.completed;
    }
}

