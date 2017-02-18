import { Observables } from "./observables"

export class UrlHelper {
    public observers = [];
    private actionPath: Observables.Observable<string>;

    constructor(private appName, actionPath) {
        this.actionPath = new Observables.Observable<string>(actionPath);
    }

    map<T>(mapper: (string) => T): Observables.Observable<T> {
        return this.actionPath.map(mapper);
    }

    action(path: string) {
        return (event) => {
            if (this.actionPath.current !== path) {
                var options = {};
                window.history.pushState(options, "", this.appName + "/" + path);
                this.actionPath.notify(path);
            }
            event.preventDefault();
            event.stopPropagation();
        };
    }
}

export class HtmlHelper {

    constructor(private loader: { import(path: string); }) {
        
    }

    partial(viewPath: string) {
        var view = this.loader.import(viewPath);
        return {
            bind(parent) {
                return new ViewBinding(view, {});
            }
        }
    }
}


class ViewBinding {
    private binding;
    private cancellationToken: number;

    constructor(private view, private model) {
    }

    update(context, parent) {

        if (!this.view)
            throw new Error("view is empty");

        var cancellationToken = Math.random();
        this.cancellationToken = cancellationToken;
        this.view.then(app => {
            if (cancellationToken === this.cancellationToken) {
                this.dispose();
                this.binding = app.bind(context, parent);
            }
        });
    }

    dispose() {
        if (this.binding) {
            this.binding.dispose();
        }
    }
}

