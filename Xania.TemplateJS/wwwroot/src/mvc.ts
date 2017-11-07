import { Observables } from "./observables"
import { expr, mount, Reactive } from './xania'
import Dom from './dom'

export class UrlHelper {
    public observers = [];
    // private childPath = new Observables.Observable();

    constructor(public router: Router, public basePath = "/") {
    }

    action(path: string);
    action(path): (row: any) => void;
    action(path: any) {
        return event => {
            event.preventDefault();
            this.goto(path);
        };
    }

    child(path) {
        return new UrlHelper(this.router, this.basePath + path + "/");
    }

    goto(path: string) {
        var action = { path: this.router.action(this.basePath + path) };
        if (typeof action.path === "string") {
            window.history.pushState(action, "", action.path);
            // this.childPath.notify(path);
        }
    }

    pop() {
        var action = { path: this.router.action(this.basePath) };
        if (typeof action.path === "string") {
            window.history.pushState(action, "", action.path);
        }
    }

    toString() {
        return this.basePath;
    }
}

class ViewBinding {
    constructor(private binding) {
    }

    get length() {
        return this.binding.length;
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

export interface IViewContext {
    url: UrlHelper;
    model?: any;
}

interface IControllerContext {
    url: UrlHelper,
    get(path: string): IControllerContext;
    bind(driver: Reactive.IDriver);
}

class ControllerContext {
    constructor(private controller: any, private basePath: string, private url: UrlHelper, private template) {
        if (template !== null && typeof template.bind !== "function")
            throw Error("Invalid template.");
    }

    bind(driver: Reactive.IDriver) {
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
            viewResult = System["import"](this.basePath + "views/" + path).then(mod => mod.view(childContext));
        }

        return dataReady(viewResult,
            x => new ControllerContext(x, this.basePath + "/" + path, childContext.url, x));
    }
}

interface IRoute {
    execute(context, args: any[]): ViewResult | Promise<ViewResult>;
}

declare type Matcher = string | ((str: string) => any) | RegExp;

class ActionRoute implements IRoute {
    constructor(public matcher: Matcher, private action: (context, args: any[]) => ViewResult | Promise<ViewResult>) { }

    execute(context, args: any[]) {
        return this.action(context, args);
    }

    matches(path: string) {
        var { matcher } = this;
        if (typeof matcher === "string")
            return this.matcher === path ? path : null;
        else if (typeof matcher === "function")
            return matcher(path);
        else if (matcher instanceof RegExp)
            return matcher.test(path) ? path : null;
        return null;
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

    mapRoute(matcher: Matcher, handler: (context: IViewContext, args: any[]) => ViewResult | Promise<ViewResult>) {
        this.routes.push(new ActionRoute(matcher, handler));
        return this;
    }

    get(path: string, viewContext: IViewContext): ViewResult | Promise<ViewResult> {
        var { routes } = this;

        for(var i=0 ; i<routes.length ; i++) {
            var route = routes[i];
            var match = route.matches(path);
            if (match !== null && match !== undefined) {
                // console.debug("route matched", match);
                return route.execute(viewContext, match);
            }
        }
        return void 0;
    }

    bind(driver): ViewBinding {
        var binding;
        if (Array.isArray(this.view))
            binding = new CompositeBinding(driver, this.view.map(x => x.bind(driver).update(this.model)));
        else
            binding = this.view.bind(driver).update(this.model);

        return new ViewBinding(binding);
    }
}

class CompositeBinding extends Reactive.Binding {
    constructor(driver: Reactive.IDriver, private bindings: any[]) {
        super(driver);
        this.childBindings = bindings;
    }

    render(context, driver) {
    }

    get length() {
        var { childBindings } = this, result = 0;
        if (childBindings) {
            let i = childBindings.length || 0;
            while (i--) {
                result += childBindings[i].length;
            }
        }
        return result;
    }
}

// ReSharper disable once InconsistentNaming
export function View(view, model?) {
    return new ViewResult(view, model);
}

declare class System {
}

export function dataReady<T>(data: T | PromiseLike<T>, resolve: (x: T) => any) {
    if (typeof data === "undefined" || data === null)
        return data;

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

    if (app.menu)
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

    action(actionPath): string | false {
        if (!actionPath.startsWith('/'))
            throw Error("path should start with /");

        if (this.actions.valueOf() !== actionPath) {
            this.actions.notify(actionPath);

            return this.appPath + "" + actionPath;
        }

        return false;
    }

    static fromPopState(appPath: string) {
        var router = new Router(appPath);
        window.onpopstate = () => {
            var { pathname } = window.location;

            if (pathname.startsWith(appPath)) {
                var actionPath = pathname.substring(appPath.length);
                router.action(actionPath);
            }
        }
        return router;
    }

    subscribe(observer: Observables.IObserver<string>) {
        return this.actions.subscribe(observer);
    }
}
