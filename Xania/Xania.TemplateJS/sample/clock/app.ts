import { Observables } from "../../src/observables"
import { bind } from "../../src/loader"
import { Reactive as Re } from '../../src/reactive'

class ClockApp {
    time = new Observables.Time();

    static getTime() {
        return new Date().getTime();
    }

    static getSeconds(time) {
        var totalSec = Math.floor(time / 1000);
        return totalSec % 60;
    }

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

    static displayTime(time) {
        var totalSec = Math.floor(time / 1000);
        var frac: any = time % 1000;
        var sec: any = totalSec % 60;
        var totalMin = Math.floor(totalSec / 60) % 60;

        if (sec < 10)
            sec = "0" + sec;

        if (frac < 10)
            frac = frac + "00";
        if (frac < 100)
            frac = frac + "0";

        return totalMin + ":" + sec + "," + frac;
    }

    // static map(format: (time: any) => string) { throw new Error("Not implemented"); }
}

export function init(dom, count: number) {
    return bind(dom).update(new Re.Store(new ClockApp(), {}));
}