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

export class HtmlHelper {

    constructor(private loader: { import(path: string); }) {
    }

    partial(viewPath: string) {
        var view = this.loader.import(viewPath);
        return {
            bind(visitor) {
                return new ViewBinding(visitor, view, {});
            }
        }
    }
}

class ViewBinding {
    private binding;
    private cancellationToken: number;

    constructor(private visitor, private view, private model) {
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

export interface IDriver {
}

interface IControllerContext {
    get(path: string): IRoute;
    execute(driver: IDriver);
}

interface IRoute {
    execute(context) : ViewResult;
}

class ActionRoute implements IRoute {
    constructor(public path, private action: (context) => ViewResult) { }

    execute(context) {
        return this.action(context);
    }
}

export class ViewResult implements IControllerContext {
    private routes: ActionRoute[] = [];

    constructor(private view, private model?) {}

    execute(driver: IDriver) {
        var view = this.view.bind(driver)
            .update(this.model);

        mount(view);

        return view;
    }

    route(path, action: (context) => ViewResult): this {
        this.routes.push(new ActionRoute( path, action ));
        return this;
    }

    get(path: string): IRoute {
        var { routes } = this, i = routes.length;
        while (i--) {
            var route = routes[i];
            if (route.path === path)
                return route;
        }
        return void 0;
    }
}

export function View(view, model?) {
    return new ViewResult(view, model);
}

declare class System {
    static import(path: string);
}

export function boot(basePath: string, appPath: string, actionPath: string, app: any) {

    const router = Router.start(appPath, actionPath);

    var mainDriver = new Dom.DomDriver(".main-content");
    var viewContext = {
        controller: app,
        url: new UrlHelper(router),
        map: new Map(),
        execute(driver: IDriver) {
            throw Error("Not supported.");
        },
        get(path: string): IRoute {
            return typeof this.controller[path] === "function"
                ? new ActionRoute(path, this.controller[path])
                : new ActionRoute(path, context => System.import(basePath + "views/" + path).then(mod => mod.view(context)));
        }
    }
    router.subscribe(route => {
        mainDriver.dispose();
        var parts: string[] = route.match(/\/([^\/]+)/g).map(x => x.slice(1));
        var reduced = parts.reduce<IControllerContext>((ctx: IControllerContext, name: string) => {
                return dataReady(ctx,
                    (x: any) => {
                        var context = { url: x.url.child(name) };
                        var result = x.get(name).execute(context);

                        if (typeof result === "undefined")
                            throw { error: "route not found: ", route: name, view: x };

                        return dataReady(result,
                            y => ({
                                viewResult: y,
                                url: context.url,
                                map: new Map(),
                                execute(driver: IDriver) {
                                    return this.viewResult.execute(driver);
                                },
                                get(path: string): IRoute {
                                    return this.viewResult.get(path);
                                }
                            }));
                    });
            },
            viewContext);

        dataReady(reduced,
            x => {
                x.execute(mainDriver);
            });
    });

    function dataReady<T>(data: T | PromiseLike<T>, resolve: (x:T) => any) {
        var promise = data as PromiseLike<T>;
        if (promise && promise.then)
            return promise.then(resolve);

        return resolve(data as T);
    }

    var html = new HtmlHelper(System);

    mount(app.menu({
        url: new UrlHelper(router),
        html: html,
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
