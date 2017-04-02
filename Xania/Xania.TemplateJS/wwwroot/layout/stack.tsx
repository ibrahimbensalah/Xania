import { expr, List, Repeat } from "../src/xania";
import Template, { IDriver } from '../src/template';
import Reactive from "../src/reactive";
import { TagBinding } from "../src/dom";
import Html from "../src/html";
import './stack.css';
import TodoApp from "../sample/todos/app";
import BallsApp from "../sample/balls/app";
import { UrlHelper } from "../src/mvc";

export default class StackLayout {
    private templates;
    private url: UrlHelper = null;

    constructor() {
        this.templates = [];
    }

    private open(idx: number, tpl) {
        if (this.templates[idx + 1] === tpl)
            return;

        var len = this.templates.length;
        if (len > idx + 1)
            this.templates.length = idx + 1;

        this.templates.push(tpl);
    }

    private close(tpl) {
        var idx = this.templates.indexOf(tpl);
        if (idx >= 0) {
            this.templates.length = idx;
        }
    }

    private add(tpl, clear = false) {
        if (clear)
            this.templates = [tpl];
        else
            this.templates.push(tpl);
    }

    public view(xania) {
        var tpl1 = <div style="border: 1px solid red; color: red; padding: 2px 10px; margin: 2px;">template 1</div>;
        var tpl2 = <BallsApp />;
        return (
            <StackContainer className="stack-container">
                <section className="stack-item">
                    <header>
                        Main
                    </header>
                    <div className="stack-item-content">
                        <button onClick={() => this.add(tpl1, true)}>add tpl1</button>
                        <button onClick={() => this.add(tpl2, true)}>add tpl2</button>
                        <button onClick={() => this.add(this.page1(xania, 0), true)}>add green</button>
                        <button onClick={() => this.templates.pop()}>Pop</button>
                        <a onClick={() => this.url.action("foo")}>Link</a>
                    </div>
                </section>
                <Repeat source={expr("for tpl in templates")} >
                    <section className="stack-item">
                        <header>
                            <button onClick={expr("close tpl")} type="button" className="close" style="pull-right"><span aria-hidden="true">&times;</span></button>
                            Header 1
                        </header>
                        <div className="stack-item-content">
                            <Html.Partial template={expr("tpl")} />
                        </div>
                    </section>
                </Repeat>
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
        var tpl1 = <TodoApp />;

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

        var counter = 1000;
        var step = () => {
            counter--;
            if (!dom.parentNode || dom.parentNode.lastChild !== dom)
                return;

            var prevScrollLeft = dom.parentNode.scrollLeft;
            var diff = prevScrollLeft - dom.offsetLeft;
            var minX = 10;

            if (diff > minX) {
                dom.parentNode.scrollLeft -= minX;
            } else if (diff < minX) {
                dom.parentNode.scrollLeft += minX;
            } else if (diff !== 0) {
                dom.parentNode.scrollLeft -= diff;
            } else {
                return;
            }

            if (diff && counter && (dom.parentNode.scrollLeft !== prevScrollLeft)) {
                setTimeout(step, 1);
            }
        }

        if (dom.parentNode)
            step();

        return true;
    }
}