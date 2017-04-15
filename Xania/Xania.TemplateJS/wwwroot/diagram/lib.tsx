import './diagram.css'
import { Template, IDriver } from "../src/template";
import { Dom } from "../src/dom";
import expr from "../src/compile";

export class GraphApp {

    private P1: Point = { x: 0, y: 0 };
    private P2: Point = { x: 250, y: 0 };

    static horizontalArrow({ x: x1, y: y1 }, { x: x2, y: y2 }) {
        var d = (x2 - x1) / 2;
        return `m${x1},${y1} C${x1 + d},${y1} ${x2 - d},${y2} ${x2},${y2}`;
    }

    static input(x, y) {
        return { x, y: y + 25 };
    }

    static output(x, y) {
        return { x: x + 100, y: y + 25 };
    }

    view(xania) {
        return (
            <div className={["xania-diagram", expr("pressed -> ' pressed'")]}>
                <div style="float: right;" >{expr("P1.x")} {expr("P1.y")}</div>
                <Draggable x={expr("P1.x")} y={expr("P1.y")} style="background-color: blue;" />
                <Draggable x={expr("P1.x + 250")} y={expr("P2.y")} style="background-color: red;" />
                <Draggable x={expr("P1.x + 250")} y={expr("P2.y + 200")} style="background-color: orange;" />
                <svg>
                    <g>
                        <path d={expr("horizontalArrow (output P1.x P1.y) (input (P1.x + 250) P2.y)")} stroke="red" />
                        <path d={expr("horizontalArrow (output P1.x P1.y) (input (P1.x + 250) (P2.y + 200))")} stroke="orange" />
                    </g>
                </svg>
            </div>
        );
    }
}

interface Point {
    x: number;
    y: number;
}

class Draggable {
    constructor(private attrs, private children: Template.INode[]) {
    }

    bind(driver: IDriver) {
        var tag = new DraggableBinding(driver, this.attrs),
            attrs = this.attrs;

        tag.attr("class", "xania-draggable");
        for (var prop in attrs) {
            if (attrs.hasOwnProperty(prop) && prop !== "x" && prop !== "y") {
                var attrValue = attrs[prop];
                if (prop === "className" || prop === "classname" || prop === "clazz")
                    tag.attr("class", "xania-draggable " + attrValue);
                else
                    tag.attr(prop.toLowerCase(), attrValue);
            }
        }
        const { children } = this, length = this.children.length;
        for (var i = 0; i < length; i++) {
            tag.child(children[i]);
        }

        return tag;
    }
}

class DraggableBinding extends Dom.TagBinding {
    constructor(driver: IDriver, private props) {
        super(driver, "div", null);
        this.event("mousedown", this.press);
        this.event("mousemove", this.drag);
        this.event("mouseup", this.release);
    }

    private pressed: any = null;
    private state = { left: 0, top: 0, clientX: 0, clientY: 0 };

    private press = event => {
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
            top: DraggableBinding.prixels(top),
            left: DraggableBinding.prixels(left),
            clientX,
            clientY
        };
        this.pressed = target;
    }

    static prixels(px: string) {
        return parseFloat(px.replace("px", "")) || 0;
    }

    private release = () => {
        this.pressed = null;
        this.state = null;
    }

    private drag = event => {
        if (event.buttons !== 1)
            return;

        var { clientX, clientY } = event;
        var { state } = this;

        if (!state)
            return;

        var left = state.left + clientX - state.clientX;
        var top = state.top + clientY - state.clientY;

        if (state.left !== left || state.top !== top) {
            state.clientX = clientX;
            state.clientY = clientY;
            state.left = left;
            state.top = top;

            var x = this.evaluateObject(this.props.x);
            var y = this.evaluateObject(this.props.y);
            if (typeof x.set === "function")
                x.set(left);
            if (typeof y.set === "function")
                y.set(top);
        }
    }

    render(context, driver) {
        super.render(context, driver);

        var x = this.evaluateText(this.props.x);
        var y = this.evaluateText(this.props.y);

        var style = this.tagNode.style;
        style.left = x + "px";
        style.top = y + "px";
    }
}