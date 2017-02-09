import { ForEach, fs } from "../../src/xania"
import { Observables } from "../../src/observables"

export class TodoApp {

    store = new TodoStore();
    show = "all";
    editingTodo = null;

    onAddTodo = (event) => {
        if (event.keyCode === 13) {
            const title = event.target.value;
            this.store.todos.push(new Todo(title));
            return "";
        }
        return void 0;
    }

    onToggleAll = () => {
        this.store.toggleAll();
    }

    onShow = (value) => {
        this.show = value;
    }

    onResetEditing = (event) => {
        if (event.keyCode === 13)
            this.editingTodo = null;
        else if (event.keyCode === 27) {
            this.editingTodo = null;
        }
    }

    view(xania) {
        return (
            <section className="todoapp">
                <header>
                    <h1>todos</h1>
                    <input className="new-todo" placeholder="What needs to be done?" autofocus=""
                        onKeyUp={this.onAddTodo} />
                </header>
                <section className={["main", fs("store.todos.length = 0 -> ' hidden'")]}>
                    <input className="toggle-all" type="checkbox" checked={fs("empty store.todos where not completed")}
                        onClick={this.onToggleAll} />
                    <ul className="todo-list">
                        <ForEach expr={fs("for todo in store.todos where (completed = (show = 'completed')) or (show = 'all')")}>
                            <li className={[fs("todo.completed -> 'completed'"), fs("todo = editingTodo -> ' editing'")]} >
                                <div className="view">
                                    <input className="toggle" type="checkbox" checked={fs("todo.completed")} />
                                    <label onDblClick={fs("editingTodo <- todo")}>{fs("todo.title")}</label>
                                    <button className="destroy" onClick={fs("store.remove todo")}></button>
                                </div>
                                <input className="edit" value={fs("todo.title")} autofocus=""
                                    onBlur={this.onResetEditing}
                                    onKeyUp={this.onResetEditing} />
                            </li>
                        </ForEach>
                    </ul>
                </section>
                <footer className={["footer", fs("store.todos.length = 0 -> ' hidden'")]}>
                    <span className="todo-count"><strong>{fs("count store.todos where not completed")}</strong> item(s) left</span>
                    <ul className="filters">
                        <li><a href="#" className={fs("show = 'all' -> 'selected'")}
                            onClick={this.onShow.bind(this, 'all')}>All</a></li>
                        <li><a href="#" className={fs("show = 'active' -> 'selected'")}
                            onClick={this.onShow.bind(this, 'active')}>Active</a></li>
                        <li><a href="#" className={fs("show = 'completed' -> 'selected'")}
                            onClick={this.onShow.bind(this, 'completed')}>Completed</a></li>
                    </ul >
                    <button className={["clear-completed", fs("all active todos -> ' hidden'")]}
                        onClick={() => this.store.removeCompleted()}>Clear completed</button>
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
}

class Todo {
    constructor(public title: string, public completed = false) {
    }

    toggleCompletion() {
        this.completed = !this.completed;
    }
}

