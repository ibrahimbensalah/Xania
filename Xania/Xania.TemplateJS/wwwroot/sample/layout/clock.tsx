import { Observables } from "../../src/observables"
import { ForEach, fs } from "../../src/xania"
import '../clock/app.css'

export class ClockApp {
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

    view(xania) {
        return (
            <div style="height: 200px;">
                <svg viewBox="0 0 200 200">
                    <g transform="scale(2) translate(50,50)">
                        <circle className="clock-face" r="35"></circle>
                        <ForEach expr={fs("for p in [ 0..59 ]")}>
                            <line className="minor" y1="42" y2="45" transform={["rotate(", fs("p * 6"), ")"]} />
                        </ForEach>
                        <ForEach expr={fs("for p in [ 0..11 ]")}>
                            <line className="major" y1="35" y2="45" transform={["rotate(", fs("p * 30"), ")"]} />
                        </ForEach>
                        <line className="hour" y1="2" y2="-20" transform={["rotate(", fs("hoursAngle (await time)"), ")"]} />
                        <line className="minute" y1="4" y2="-30" transform={["rotate(", fs("minutesAngle (await time)"), ")"]} />
                        <g transform={["rotate(", fs("secondsAngle (await time)"), ")"]}>
                            <line className="second" y1="10" y2="-38"></line>
                            <line className="second-counterweight" y1="10" y2="2"></line>
                        </g>
                    </g>
                </svg>
            </div>
        );
    }
}

