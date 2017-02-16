import { Observables } from "../../src/observables"

import { Xania as xania, ForEach, fs, View, Reactive as Re, Template } from "../../src/xania"
import { ClockApp } from "./clock"
import { TodoApp } from "./todo"
import { BallsApp } from "./../balls/app"

var menu = new Observables.Observable("balls");

export function view() {
    var mainView = menu.map(viewName => {
        switch (viewName) {
            case 'view1':
                return <div>view 1: {fs("user.firstName")} {fs("await time")}</div>;
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
            case 'balls':
                return <BallsApp />;
        }
    });

    return xania.view(layout(mainView));
}

export function store() {
    return new Re.Store({
        menu,
        time: new Observables.Time(),
        user: { firstName: "Ibrahim", lastName: "ben Salah" },
        route(viewName) {
            this.menu.onNext(viewName);
        },
        size(ts) {
            return Math.floor((ts % 1000) / 50);
        }
    }, [Math]);
}

var layout: any = view =>
    <div>
        <h1>{fs("user.firstName")} {fs("user.lastName")} ({fs("await menu")})</h1>
        <div>
            view:
            <button onClick={fs("route 'view1'")}>view 1</button>
            <button onClick={fs("route 'view2'")}>view 2</button>
            <button onClick={fs("route 'clock'")}>clock</button>
            <button onClick={fs("route 'todos'")}>todos</button>
            <button onClick={fs("route 'balls'")}>balls</button>
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

