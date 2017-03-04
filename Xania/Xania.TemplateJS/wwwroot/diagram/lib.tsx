import './diagram.css'
import { Template } from "../src/template";
import { Dom } from "../src/dom";
import compile from "../src/compile"

export class GraphApp {

    private P1: Point = { x: 10, y: 10 };
    private P2: Point = { x: 300, y: 200 };

    static horizontalArrow(x1: number, y1: number, x2: number, y2: number) {
        var d = (x2 - x1) / 2;
        return `m${x1},${y1} C${x1 + d},${y1} ${x2 - d},${y2} ${x2},${y2}`;
    }

    move(x, y) {
        this.P2.x = x;
        this.P2.y = y + 50;
    }

    view(xania) {
        return (
            <div>
                <div className={["xania-diagram", compile("pressed -> ' pressed'")]}>
                    <Draggable style="background-color: orange;" onMove={compile("move x y")} />
                    <svg>
                        <g>
                            <path d={compile("horizontalArrow P1.x P1.y P2.x P2.y")} stroke="black" />
                        </g>
                    </svg>
                </div>
            </div>
        );
    }
}

interface Point {
    x: number;
    y: number;
}

class Canvas {
    constructor(private attrs, private children) {
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

        return tag;
    }
}

class Draggable {
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
            top: Draggable.prixels(top),
            left: Draggable.prixels(left),
            clientX,
            clientY
        };
        this.pressed = target;
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
            return false;

        var { clientX, clientY } = event;
        var { pressed, state } = this;

        var left = state.left + clientX - state.clientX;
        var top = state.top + clientY - state.clientY;

        if (state.left !== left || state.top !== top) {
            pressed.style.left = state.left + "px";
            pressed.style.top = state.top + "px";

            state.clientX = clientX;
            state.clientY = clientY;
            state.left = left;
            state.top = top;

            return true;
        }
        return false;
    }

    bind() {
        var tag = new DraggableBinding(this.children.map(x => x.bind())),
            attrs = this.attrs;

        tag.event("mousedown", this.press);
        tag.event("mousemove", event => {
            if (this.drag(event)) {
                tag.trigger("move", event, { x: this.state.left, y: this.state.top });
            }
        });
        tag.event("mouseup", this.release);

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

    render(context, driver) {
        super.render(context, {
            insert(binding, dom, idx) {
                driver.insert(binding, dom, idx);
            }
        });
    }
}