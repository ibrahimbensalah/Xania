import { Observables } from "../../src/observables"

export default class ClockApp {
    public timer = new Observables.Timer();
    public seconds = this.timer.map(ClockApp.getSeconds);

    static getSeconds(time) {
        var totalSec = Math.floor(time / 1000);
        return totalSec % 60;
    }

    static getAngle(time) {
        return 360 * ClockApp.getSeconds(time) / 60;
    }

    static displayTime(time) {
        var totalSec = Math.floor(time / 1000);
        var frac = time % 1000;
        var sec = totalSec % 60;
        var totalMin = Math.floor(totalSec / 60);

        return totalMin + ":" + sec + "," + frac;
    }

    // static map(format: (time: any) => string) { throw new Error("Not implemented"); }
}

