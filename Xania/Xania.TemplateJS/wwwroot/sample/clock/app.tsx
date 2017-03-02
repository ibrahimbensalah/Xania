import { Xania, Repeat, Template, Dom, Reactive as Re, expr } from "../../src/xania"
import './app.css'

export class ClockApp {
    time = new Date().getTime();

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
                        <Repeat source={expr("for p in [ 0..59 ]")}>
                            <line className="minor" y1="42" y2="45" transform={["rotate(", expr("p * 6"), ")"]} />
                        </Repeat>
                        <Repeat source={expr("for p in [ 0..11 ]")}>
                            <line className="major" y1="35" y2="45" transform={["rotate(", expr("p * 30"), ")"]} />
                        </Repeat>
                        <line className="hour" y1="2" y2="-20" transform={["rotate(", expr("hoursAngle (time)"), ")"]} />
                        <line className="minute" y1="4" y2="-30" transform={["rotate(", expr("minutesAngle (time)"), ")"]} />
                        <g transform={["rotate(", expr("secondsAngle (time)"), ")"]}>
                            <line className="second" y1="10" y2="-38"></line>
                            <line className="second-counterweight" y1="10" y2="2"></line>
                        </g>
                    </g>
                </svg>
            </div>
        );
    }
}

export function execute({ driver }) {
    return Xania.render(ClockApp, driver);
}
