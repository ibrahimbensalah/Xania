import xania, { Repeat, expr, Reactive as Re, Template } from "../src/xania"
import { View } from "../src/mvc";
import defaultLayout from "../admin/layout"
import Html from "../src/html"

export function index() {
    return View(
        <form method="post">
            <Html.TextEditor field="userName" display="User Name" />
            <div class="btn-group">
                <button class="btn-primary" type="submit">Login</button>
                &nbsp;
                <a href="#forgot">Wachtwoord vergeten</a>
            </div>
        </form>
    );
}

export var layout = defaultLayout;