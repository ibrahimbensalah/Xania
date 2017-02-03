import { Observables } from "../../src/observables"

import { Xania, ForEach, fs, View, Reactive as Re } from "../../src/xania"

export function bind(target: Node) {
    var view = new Observables.Observable("view1");
    var store = new Re.Store({
        view,
        time: new Observables.Time(),
        user: { firstName: "Ibrahim", lastName: "ben Salah" },
        route(viewName) {
            this.view.onNext(viewName);
        },
        resolve(viewName) {
            switch (viewName) {
                case 'view1':
                    return <div>view 1: {fs("firstName")}</div>;
                case 'view2':
                    return <ForEach expr={fs("for v in [1..3]")}><h1>{fs("firstName")}</h1>View 2: {fs("v")}</ForEach>;
            }
        }
    });

    var mainView = view.map(viewName => {
        switch (viewName) {
        case 'view1':
            return <div>view 1: {fs("firstName")}</div>;
        case 'view2':
            return <ForEach expr={fs("for v in [1..3]")}>
                       <h1>{fs("firstName")}</h1>View 2: {fs("v")}</ForEach>;
        }
    });

    Xania.view(layout(new Re.Awaited(mainView))).bind(target, store);
}

var layout: any = (view) =>
    <div>
        <h1>{fs("user.firstName")} {fs("user.lastName")}</h1>
        <div>
            view:
            <button click={fs("route 'view1'")}>view 1</button>
            <button click={fs("route 'view2'")}>view 2</button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            model:
            <button click={fs("user.firstName <- 'Ramy'")}>Ramy</button>
            <button click={fs("user.firstName <- 'Ibrahim'")}>Ibrahim</button>
        </div>
        <div style="border: solid 1px red; padding: 10px;">
            {View.partial(view, fs("user"))}
        </div>
    </div>;
