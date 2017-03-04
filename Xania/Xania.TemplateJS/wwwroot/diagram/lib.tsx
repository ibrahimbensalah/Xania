import './diagram.css'
import { Template } from "../src/template";
import { Dom } from "../src/dom";
import compile from "../src/compile"

export class GraphApp {
    view(xania) {
        return (
            <Canvas>
                <div className={["xania-diagram", compile("pressed -> ' pressed'")]}>
                    <Draggable style="background-color: yellow;" />
                    <svg >
                        <path d="M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80" stroke="black" fill="transparent" />
                    </svg>
                </div>
            </Canvas>
        );
    }
}

class Canvas {
    constructor(private attrs, private children) {
    }

    private pressed: any = null;
    private state = { left: 0, top: 0, clientX: 0, clientY: 0 };

    private press = event => {
        event.stopPropagation();

        var { clientX, clientY, target } = event;

        do {
            if (target.classList.contains("xania-draggable"))
                break;
            target = target.parentElement;
        } while (target);

        if (!target)
            return;

        var { top, left } = window.getComputedStyle(target);

        this.state = {
            top: Canvas.prixels(top),
            left: Canvas.prixels(left),
            clientX,
            clientY
        };
        this.pressed = target;
        console.log("init", this.state, target);

    }

    static prixels(px: string) {
        return parseFloat(px.replace("px", "")) || 0;
    }

    private release = event => {
        this.pressed = null;
        this.state = null;
    }

    private drag = event => {
        if (!this.pressed || event.buttons !== 1)
            return;

        var { clientX, clientY } = event;
        var { pressed, state } = this;

        if (clientX === state.clientX && clientY === state.clientY)
            return;

        state.left += clientX - state.clientX;
        state.top += clientY - state.clientY;

        pressed.style.left = state.left + "px";
        pressed.style.top = state.top + "px";

        state.clientX = clientX;
        state.clientY = clientY;
    }

    bind() {
        var tag = new Dom.TagBinding("div", null, this.children.map(x => x.bind())),
            attrs = this.attrs;

        for (var prop in attrs) {
            if (attrs.hasOwnProperty(prop)) {
                var attrValue = attrs[prop];
                tag.attr(prop.toLowerCase(), attrValue);
            }
        }

        tag.event("mousedown", this.press);
        tag.event("mousemove", this.drag);
        //onMouseMove = { compile("pressed -> drag event state")}
        tag.event("mouseup", this.release);

        return tag;
    }
}

class Draggable {
    constructor(private attrs, private children) {
    }

    bind() {
        var tag = new DraggableBinding(this.children.map(x => x.bind())),
            attrs = this.attrs;

        tag.attr("class", "xania-draggable");
        for (var prop in attrs) {
            if (attrs.hasOwnProperty(prop)) {
                var attrValue = attrs[prop];
                if (prop === "className" || prop === "classname" || prop === "clazz")
                    tag.attr("class", "xania-draggable " + attrValue);
                else
                    tag.attr(prop.toLowerCase(), attrValue);
            }
        }

        return tag;
    }
}

class DraggableBinding extends Dom.TagBinding {
    constructor(childBindings) {
        super("div", null, childBindings);
    }
}