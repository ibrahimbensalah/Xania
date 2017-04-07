import { Observables } from "./observables"
import xania, { mount } from './xania'
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
}

export interface IDriver {
    dispose();
}

export interface IViewContext {
    url: UrlHelper;
    model?: any;
}

interface IControllerContext {
    get(path: string, context: IViewContext): ViewResult;
    execute(driver: IDriver);
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

export class ViewResult implements IControllerContext {
    private routes: ActionRoute[] = [];

    constructor(private view, private model?) { }

    execute(driver: IDriver) {
        driver.dispose();
        var view = this.view.bind(driver)
            .update(this.model);

        mount(view);

        return view;
    }

    route(path, action: (context) => ViewResult): this {
        this.routes.push(new ActionRoute(path, action));
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

export function View(view, model?) {
    return new ViewResult(view, model);
}

declare class System {
    static import(path: string);
}

function dataReady<T>(data: T | PromiseLike<T>, resolve: (x: T) => any) {
    var promise = data as PromiseLike<T>;
    if (promise && promise.then)
        return promise.then(resolve);

    return resolve(data as T);
}

function getView(ctx: IControllerContext, name: string) {
    return dataReady(ctx,
        (controllerContext: any) => {
            var childContext = { url: controllerContext.url.child(name) };
            var result = controllerContext.get(name, childContext);

            if (typeof result === "undefined")
                throw { error: "route not found: ", route: name, controllerContext };

            return dataReady(result,
                viewResult => ({
                    url: childContext.url,
                    map: new Map(),
                    execute(driver: IDriver) {
                        return viewResult.execute(driver);
                    },
                    get(path: string, viewContext: IViewContext): ViewResult {
                        return viewResult.get(path, viewContext);
                    }
                }));
        });
}

function cache(reducer) {
    var views = [];
    return (ctx: IControllerContext, name: string, idx: number) => {
        if (idx in views) {
            var cache = views[idx];
            if (cache.name === name)
                return cache.retval;

            views.length = idx;
        }

        var retval = reducer(ctx, name, idx);

        views[idx] = { name, retval };
        return retval;
    }
}

export function boot(basePath: string, appPath: string, actionPath: string, app: any) {

    const router = Router.start(appPath, actionPath);

    var mainDriver = new Dom.DomDriver(".main-content");
    var controllerContext = {
        controller: app,
        url: new UrlHelper(router),
        map: new Map(),
        execute(driver: IDriver) {
            throw Error("Not supported.");
        },
        get(path: string, viewContext: IViewContext): ViewResult {
            return typeof this.controller[path] === "function"
                ? this.controller[path](viewContext)
                : System.import(basePath + "views/" + path).then(mod => mod.view(viewContext));
        }
    }

    var reducer = cache(getView);
    router.subscribe((route: string) => {
        var reduced =
            route
                .match(/\/([^\/]+)/g)
                .map(x => x.slice(1))
                .reduce<IControllerContext>(reducer, controllerContext);
        dataReady(reduced, x => x.execute(mainDriver));
    });

    mount(app.menu({
        url: new UrlHelper(router),
        // html: new HtmlHelper(System),
        driver: new Dom.DomDriver('.main-menu')
    }));
}

class Router {
    private observable: Observables.Observable<string>;

    constructor(private appPath: string, private init: string) {
        this.observable = new Observables.Observable<string>(init);
    }

    static start(appPath: string, init: string) {
        var router = new Router(appPath, init);
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
        return this.observable.subscribe(observer);
    }

    goto(path: string) {
        if (path !== this.observable.valueOf()) {
            this.observable.notify(path);
        }
        return this.appPath + path;
    }
}
