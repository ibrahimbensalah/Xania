import { expr, Repeat } from "../src/xania";
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
                    <button onClick={() => this.add(this.page1(xania), true)}>add green</button>
                    <button onClick={() => this.templates.pop()}>Pop</button>
                </section>
                <Repeat source={expr("for n in templates")} >
                    <section className="stack-item">
                        <Html.Partial template={expr("n")} />
                    </section>
                </Repeat>
            </StackContainer>
        );
    }

    public page1(xania) {
        var tpl1 = <div style="border: 1px solid green; color: green;">template green</div>;

        return (
            <div>
                <button onClick={() => this.add(tpl1, false)}>tpl1</button>
                <button onClick={() => this.add(this.subpage(xania), false)}>blue</button>
            </div>
        );
    }

    public subpage(xania) {
        var tpl1 = <div style="border: 1px solid blue; color: green;">template blue</div>;

        return (
            <div>
                <button onClick={() => this.add(tpl1, false)}>tpl1</button>
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
        super.insert(binding, dom, idx);

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
    }
}