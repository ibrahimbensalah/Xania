import { Repeat, expr } from "../../src/xania"
import { Animate } from "../../src/anim"
import { Observables } from "../../src/observables"
import './css/index.css'

export default class TodoApp {

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

    onResetEditing = (event) => {
        if (event.keyCode === 13)
            this.editingTodo = null;
        else if (event.keyCode === 27) {
            this.editingTodo = null;
        }
    }

    view(xania) {
        return (
            <section className="todoapp" >
                <header>
                    <input className="new-todo" placeholder="What needs to be done?" autofocus=""
                        onKeyUp={this.onAddTodo} />
                </header>
                <section className={["main", expr("store.todos.length = 0 -> ' hidden'")]}>
                    <input className="toggle-all" type="checkbox" checked={expr("store.todos where not completed |> empty")}
                        onClick={this.onToggleAll} />
                    <ul className="todo-list">
                        <Repeat param="todo" source={expr("store.todos where (completed = (show = 'completed')) or (show = 'all')")}>
                            <li className={[expr("todo.completed -> 'completed'"), expr("todo = editingTodo -> ' editing'")]} >
                                <div className="view">
                                    <input className="toggle" type="checkbox" checked={expr("todo.completed")} />
                                    <label onDblClick={expr("editingTodo <- todo")}>{expr("todo.title")}</label>
                                    <button className="destroy" onClick={expr("store.remove todo")}></button>
                                </div>
                                <input className="edit" value={expr("todo.title")} autofocus=""
                                    onBlur={this.onResetEditing}
                                    onKeyUp={this.onResetEditing} />
                            </li>
                        </Repeat>
                    </ul>
                </section>
                <footer className={["footer", expr("store.todos.length = 0 -> ' hidden'")]}>
                    <span className="todo-count"><strong>{expr("store.todos where not completed |> count")}</strong> item(s) left</span>
                    <ul className="filters">
                        <li><a href="#" className={expr("show = 'all' -> 'selected'")}
                            onClick={expr("show <- 'all'")}>All</a></li>
                        <li><a href="#" className={expr("show = 'active' -> 'selected'")}
                            onClick={expr("show <- 'active'")}>Active</a></li>
                        <li><a href="#" className={expr("show = 'completed' -> 'selected'")}
                            onClick={expr("show <- 'completed'")}>Completed</a></li>
                    </ul >
                    <button className={["clear-completed", expr("all active todos -> ' hidden'")]}
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

        for (var i = 0; i < 2; i++)
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

