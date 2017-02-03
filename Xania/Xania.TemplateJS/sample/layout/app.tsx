import { Observables } from "../../src/observables"

import { Xania, ForEach, fs, parseTpl, View, Reactive as Re } from "../../src/xania"

export function bind(target: Node) {
    var view = new Observables.Observable("view1");
    var store = new Re.Store({
        view,
        time: new Observables.Time(),
        user: { firstName: "Ibrahim", lastName: "ben Salah" },
        route(viewName) {
            this.view.onNext(viewName);
        },
        size(ts) {
            return (ts % 1000) / 50;
        }
    }, [ClockApp, Math]);

    var mainView = view.map(viewName => {
        switch (viewName) {
            case 'view1':
                return <div>view 1: {fs("user.firstName")} {fs("await time")}</div>;
            case 'view2':
                return (
                    <div>
                        {fs("user.firstName")}
                        <ForEach expr={fs("for v in [0..(min (size (await time)) 10)]")}>
                            <p>{fs("user.firstName")}: {fs("v")}</p>
                        </ForEach>
                        <hr />
                        <ForEach expr={fs("for g in [0..(min (10 - size (await time)) 10)]")}>
                            <p>{fs("user.lastName")}: {fs("g")}</p>
                        </ForEach>
                    </div>
                );
            case 'clock':
                return clock;
        }
    });

    Xania.view(layout(mainView)).bind(target, store);
}

var layout: any = view =>
    <div>
        <h1>{fs("user.firstName")} {fs("user.lastName")}</h1>
        <div>
            view:
            <button click={fs("route 'view1'")}>view 1</button>
            <button click={fs("route 'view2'")}>view 2</button>
            <button click={fs("route 'clock'")}>clock</button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            model:
            <button click={fs("user.firstName <- 'Ramy'")}>Ramy</button>
            <button click={fs("user.firstName <- 'Ibrahim'")}>Ibrahim</button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            time:
            <button click={fs("time.toggle ()")}>toggle</button>
        </div>
        <div style="padding: 10px;">
            {View.partial(view, { user: fs("user"), time: new Observables.Time() })}
        </div>
    </div>;

var clock = (
    <svg viewBox="0 0 200 200">
        <g transform="scale(2) translate(50,50)">
            <circle className="clock-face" r="35"></circle>
            <ForEach expr={fs("for p in [ 0..59 ]")}>
                <line className="minor" y1="42" y2="45" transform={parseTpl("rotate( {{ p * 6 }} )")} />
            </ForEach>
            <ForEach expr={fs("for p in [ 0..11 ]")}>
                <line className="major" y1="35" y2="45" transform={parseTpl("rotate( {{ p * 30 }} )")} />
            </ForEach>
            <line className="hour" y1="2" y2="-20" transform={parseTpl("rotate( {{ hoursAngle (await time) }} )")} />
            <line className="minute" y1="4" y2="-30" transform={parseTpl("rotate( {{ minutesAngle (await time) }} )")} />
            <g transform={parseTpl("rotate( {{ secondsAngle (await time) }} )")}>
                <line className="second" y1="10" y2="-38"></line>
                <line className="second-counterweight" y1="10" y2="2"></line>
            </g>
        </g>
    </svg>
);

class ClockApp {
    time = new Observables.Time();

    static secondsAngle(time) {
        var f = 4;
        return 360 * (Math.floor(time / (1000 / f)) % (60 * f)) / (60 * f);
    }

    static minutesAngle(time) {
        var f = 60 * 60 * 1000;
        return 360 * (time % f) / f;
    }

    static hoursAngle(time) {
        var f = 12 * 60 * 60 * 1000;
        return 360 * (time % f) / f;
    }
}

