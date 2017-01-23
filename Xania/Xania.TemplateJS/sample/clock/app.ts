import { Observables } from "../../src/observables"
import { Dom } from "../../src/dom"
import { Reactive as Re } from '../../src/reactive'

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

export function init(clockTpl) {
    var target = {
        appendChild(child) {
            clockTpl.parentElement.insertBefore(child, clockTpl);
        }
    };
    var store = new Re.Store(new ClockApp());

    Dom.parse(clockTpl).bind(target, store);
}
