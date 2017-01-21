import { Observables } from "../../src/observables"
import { bind } from "../../src/loader"
import { Reactive as Re } from '../../src/reactive'

class ClockApp {
    time = new Observables.Time();

    static secondsAngle(time) {
        var f = 4;
        return 360 * (Math.floor(time / (1000 / f)) % (60 * f)) / (60 * f);
    }

    static minutesAngle(time) {
        var f = 10;
        return 360 * (Math.floor(time / (60000 / f)) % (60 * f)) / (60 * f);
    }

    static hoursAngle(time) {
        var f = 12 * 60 * 60 * 1000;
        return 360 * (time % f) / f;
    }
}

export function init(dom) {
    return bind(dom).update(new Re.Store(new ClockApp(), {}));
}