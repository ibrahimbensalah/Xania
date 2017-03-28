import { expr, List } from "../src/xania";
import Template, { IDriver } from '../src/template';
import Reactive from "../src/reactive";
import { TagBinding } from "../src/dom";
import Html from "../src/html";
import './stack.css';

export default class StackLayout {
    private templates;

    constructor() {
        this.templates = [];
    }

    private open(idx: number, tpl) {
        if (this.templates[idx + 1] === tpl)
            return;

        var len = this.templates.length;
        if (len > (idx + 1))
            this.templates = this.templates.slice(0, idx+1);

        this.templates.push(tpl);
    }

    private add(tpl, clear = false) {
        if (clear)
            this.templates = [tpl];
        else
            this.templates.push(tpl);
    }
    public view(xania) {
        var tpl1 = <div style="border: 1px solid red; color: red; padding: 2px 10px; margin: 2px;">template 1</div>;
        var tpl2 = <div style="border: 1px solid green; color: green; padding: 2px 10px; margin: 2px;">template 2</div>;
        return (
            <StackContainer className="stack-container">
                <section className="stack-item">
                    <button onClick={() => this.add(tpl1, true)}>add tpl1</button>
                    <button onClick={() => this.add(tpl2, true)}>add tpl2</button>
                    <button onClick={() => this.add(this.page1(xania, 0), true)}>add green</button>
                    <button onClick={() => this.templates.pop()}>Pop</button>
                </section>
                <List source={expr("for n in templates")} >
                    <section className="stack-item">
                        <Html.Partial template={expr("n")} />
                    </section>
                </List>
            </StackContainer>
        );
    }

    public page1(xania, idx) {
        var tpl1 = <div style="border: 1px solid green; color: green;">template green</div>;
        var bluepage = this.bluepage(xania, idx + 1);

        return (
            <div>
                <button onClick={() => this.open(idx, tpl1)}>open tpl1</button>
                <button onClick={() => this.open(idx, bluepage)}>open blue</button>
            </div>
        );
    }

    public bluepage(xania, idx) {
        var tpl1 = <div style="border: 1px solid blue; color: green;">template blue</div>;

        return (
            <div style="border: 1px solid blue;">
                <button onClick={() => this.open(idx, tpl1)}>tpl1</button>
            </div>
        );
    }
}


function StackContainer(attrs, children: Template.INode[]) {
    return {
        bind(driver: IDriver) {
            return new StackContainerBinding(driver)
                .attrs(attrs)
                .children(children);
        }
    }
}

class StackContainerBinding extends TagBinding {
    constructor(driver) {
        super(driver, "div", null);
    }

    insert(binding, dom, idx) {
        if (!super.insert(binding, dom, idx)) {
            return false;
        }

        console.log("insert dom", { dom, idx });

        var counter = 1000;
        var step = () => {
            counter--;
            if (!dom.parentNode || dom.parentNode.lastChild !== dom)
                return;

            var prevScrollLeft = dom.parentNode.scrollLeft;
            var minX = 4;

            var d = prevScrollLeft - dom.offsetLeft;
            if (d > minX) {
                dom.parentNode.scrollLeft -= minX;
            } else if (d < minX) {
                dom.parentNode.scrollLeft += minX;
            } else if (d !== 0) {
                dom.parentNode.scrollLeft -= d;
            } else {
                return;
            }

            if (d && counter && (dom.parentNode.scrollLeft != prevScrollLeft)) {
                setTimeout(step, 1);
            }
        }

        if (dom.parentNode)
            step();

        return true;
    }
}