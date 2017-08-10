import xania, { Repeat, expr, Reactive as Re, Template } from "../src/xania"
import { View } from "../src/mvc";
import defaultLayout from "../admin/layout"
import Html from "../src/html"

export function index() {
    return View(
        <div>
            <Html.TextEditor field="userName" display="User Name" />
            <Html.TextEditor field="password" display="Password" />
            <div class="btn-group">
                <button class="btn-primary">Login</button>
                &nbsp;
                <a href="#forgot">Wachtwoord vergeten</a>
            </div>
        </div>
    );
}

export var layout = defaultLayout;