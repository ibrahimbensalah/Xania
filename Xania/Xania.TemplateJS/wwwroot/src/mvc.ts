import { Observables } from "./observables"

export class UrlHelper extends Observables.Observable<string> {
    public observers = [];

    constructor(private appName, actionPath) {
        super(actionPath);
    }

    action(actionPath) {
        return () => {
            if (this.current !== actionPath) {
                var options = {};
                window.history.pushState(options, "", this.appName + "/" + actionPath);
                this.onNext(actionPath);
            }
        };
    }
}