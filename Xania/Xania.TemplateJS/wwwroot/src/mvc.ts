import { Observables } from "./observables"
import xania, { expr, mount, Repeat, Reactive } from './xania'
import Dom from './dom'

export class UrlHelper {
    public observers = [];

    constructor(public router: Router, private basePath = "/") {
    }

    action(path: string, view?) {
        return event => {
            var action = { path: this.router.goto(this.basePath + path) };
            window.history.pushState(action, "", action.path);
            event.preventDefault();
        };
    }

    child(path) {
        return new UrlHelper(this.router, this.basePath + path + "/");
    }
}

class ViewBinding {
    constructor(private binding) {
    }

    execute() {
        return this.binding.execute();
    }

    update(context): this {
        // this.binding.update(context);
        return this;
    }

    dispose() {
        this.binding.dispose();
    }
}

export interface IDriver {
    dispose();
}

export interface IViewContext {
    url: UrlHelper;
    model?: any;
}

interface IControllerContext {
    url: UrlHelper,
    get(path: string): IControllerContext;
    bind(driver: IDriver);
}

class ControllerContext {
    constructor(private controller: any, private basePath: string, private url: UrlHelper, private template) { }

    bind(driver: IDriver) {
        return this.template.bind(driver);
    }

    get(path: string): IControllerContext {
        var childContext = { url: this.url.child(path) };
        var viewResult;

        if (typeof this.controller[path] === "function") {
            viewResult = this.controller[path](childContext);
        }
        else if (typeof this.controller.get === "function") {
            viewResult = this.controller.get(path, childContext);
        } else {
            viewResult = System.import(this.basePath + "views/" + path).then(mod => mod.view(childContext));
        }

        return dataReady(viewResult,
            x => new ControllerContext(x, this.basePath + "/" + path, childContext.url, x));
    }
}

interface IRoute {
    execute(context): ViewResult;
}

class ActionRoute implements IRoute {
    constructor(public path, private action: (context) => ViewResult) { }

    execute(context) {
        return this.action(context);
    }
}

export class ViewResult {
    private routes: ActionRoute[] = [];

    constructor(private view, private model?) { }

    route(map: any): this {
        for (var key in map) {
            if (map.hasOwnProperty(key)) {
                var handler = map[key];
                this.routes.push(new ActionRoute(key, handler));
            }
        }
        return this;
    }

    get(path: string, viewContext: IViewContext): ViewResult {
        var { routes } = this, i = routes.length;

        while (i--) {
            var route = routes[i];
            if (route.path === path) {
                return route.execute(viewContext);
            }
        }
        return void 0;
    }

    bind(driver) {
        return new ViewBinding(this.view.bind(driver).update(this.model));
    }
}

// ReSharper disable once InconsistentNaming
export function View(view, model?) {
    return new ViewResult(view, model);
}

declare class System {
    static import(path: string);
}

export function dataReady<T>(data: T | PromiseLike<T>, resolve: (x: T) => any) {
    var promise = data as PromiseLike<T>;
    if (promise && promise.then)
        return promise.then(resolve);

    return resolve(data as T);
}

function cache<T, TR>(reducer: (acc: TR, next: T, idx: number) => TR, views: { key: T, value }[] = []) {
    return (ctx: TR, next: T, idx: number) => {
        if (idx in views) {
            var entry = views[idx];
            if (entry.key === next)
                return entry.value;
            views.length = idx;
        }

        var value = reducer(ctx, next, idx);

        views[idx] = { key: next, value };
        return value;
    }
}

function scan<T, R>(list: T[], fn: (t: R, x: T, idx?: number) => R, acc: R) {
    var idx = 0;
    var len = list.length;
    var result: R[] = [];
    while (idx < len) {
        acc = fn(acc, list[idx], idx);
        result.push(acc);
        idx++;
    }
    return result;
}

export function boot(basePath: string, appPath: string, app: any) {

    const router = Router.fromPopState(appPath);

    const store = new Reactive.Store({
        views: router.start(app, basePath)
    });

    mount(
        app.layout(expr("await views"))
            .bind(new Dom.DomDriver(".main-content"))
            .update(store)
    );

    mount(app.menu({
        url: new UrlHelper(router),
        // html: new HtmlHelper(System),
        driver: new Dom.DomDriver('.main-menu')
    }));

    return router;
}

export class Router {
    private actions: Observables.Observable<string>;

    constructor(private appPath: string) {
        this.actions = new Observables.Observable<string>();
    }

    static getView(controllerContext: IControllerContext, path: string) {
        var name = path.slice(1);
        return dataReady(controllerContext, x => {
            if (typeof x['then'] === "function")
                throw Error(`nested Promises are not allowed, path: '${path}'`);
            return x.get(name);
        });
    }


    start(app, basePath: string) {
        var controllerContext = new ControllerContext(app, basePath, new UrlHelper(this), null);

        var scanner = cache(Router.getView);

        return this.actions.map((route: string) =>
            scan(route.match(/\/([^\/]+)/g), scanner, controllerContext));
    }

    action(actionPath) {
        if (!actionPath.startsWith('/'))
            throw Error("path should start with /");
        this.actions.notify(actionPath);
    }

    static fromPopState(appPath: string) {
        var router = new Router(appPath);
        window.onpopstate = () => {
            var { pathname } = window.location;

            if (pathname.startsWith(appPath)) {
                var actionPath = pathname.substring(appPath.length);
                router.goto(actionPath);
            }
        }
        return router;
    }

    subscribe(observer: Observables.IObserver<string>) {
        return this.actions.subscribe(observer);
    }

    goto(path: string) {
        if (path !== this.actions.valueOf()) {
            this.actions.notify(path);
        }
        return this.appPath + path;
    }
}
