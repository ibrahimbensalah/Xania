import { Observables } from "../../src/observables"

import { Xania as xania, ForEach, Animate, fs, View, Reactive as Re, Template } from "../../src/xania"
import { ClockApp } from "./clock"
import { TodoApp } from "./todo"
import { MotionApp } from "./../motion/index"

export function bind(target: Node) {
    var view = new Observables.Observable("motion");
    var store = new Re.Store({
        view,
        time: new Observables.Time(),
        user: { firstName: "Ibrahim", lastName: "ben Salah" },
        route(viewName) {
            this.view.onNext(viewName);
        },
        size(ts) {
            return Math.floor((ts % 1000) / 50);
        }
    }, [Math]);

    var mainView = view.map(viewName => {
        switch (viewName) {
            case 'view1':
                return <Animate><div>view 1: {fs("user.firstName")} {fs("await time")}</div></Animate>;
            case 'view2':
                return (
                    <div>
                        {fs("user.firstName")}
                        <ForEach expr={fs("for v in [1..(min (size (await time)) 10)]")}>
                            <p style="margin: 0">{fs("user.firstName")}: {fs("v")}</p>
                        </ForEach>
                        <hr style="padding: 0; margin: 0;" />
                        <ForEach expr={fs("for g in [(1 + min (size (await time)) 10)..10]")}>
                            <p style="margin: 0">{fs("user.lastName")}: {fs("g")}</p>
                        </ForEach>
                    </div>
                );
            case 'clock':
                return <ClockApp time={fs("time")} />;
            case 'todos':
                return <TodoApp />;
            case 'motion':
                return <MotionApp />;
        }
    });

    xania.view(layout(mainView)).bind(target, store);
}

var layout: any = view =>
    <div>
        <h1>{fs("user.firstName")} {fs("user.lastName")} ({fs("await view")})</h1>
        <div>
            view:
            <button onClick={fs("route 'view1'")}>view 1</button>
            <button onClick={fs("route 'view2'")}>view 2</button>
            <button onClick={fs("route 'clock'")}>clock</button>
            <button onClick={fs("route 'todos'")}>todos</button>
            <button onClick={fs("route 'motion'")}>motion</button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            model:
            <button onClick={fs("user.firstName <- 'Ramy'")}>Ramy</button>
            <button onClick={fs("user.firstName <- 'Ibrahim'")}>Ibrahim</button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            time:
            <button onClick={fs("time.toggle ()")}>toggle</button>
        </div>
        <div style="padding: 10px;">
            {View.partial(view, { user: fs("user"), time: new Observables.Time() })}
        </div>
    </div>;

