import { Observables } from "../../src/observables"
import { Dom } from "../../src/dom"
import { Reactive as Re } from '../../src/reactive'

class ClockApp {
    time = new Observables.Time();

    values = [1, 2, 3, 4, 5, 6, 7, 8];

    static shuffle(array) {
        var result = array.slice(0);
        var currentIndex = result.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = result[currentIndex];
            result[currentIndex] = result[randomIndex];
            result[randomIndex] = temporaryValue;
        }
        return result;
    }

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

export function init(tpl, target) {
    var store = new Re.Store(new ClockApp());
    Dom.parse(tpl).bind(target, store);
}
