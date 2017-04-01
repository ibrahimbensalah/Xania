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
            console.log("push state", action);
            window.history.pushState(action, "", action.path);
            event.preventDefault();
        };
    }

    child(path) {
        return new UrlHelper(this.router, this.basePath + path);
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
    action(viewName: string): IControllerContext;
}

interface IRoute {
    path: string;
    action: () => ViewResult;
}

export class ViewResult implements IControllerContext {
    private routes: IRoute[] = [];
    constructor(private view, private model?) { }

    execute(driver: IDriver) {
        var view = this.view.bind(driver)
            .update(this.model);

        mount(view);

        return view;
    }

    route(path, action: () => ViewResult): this {
        this.routes.push({ path, action });
        return this;
    }

    action(path: string) {
        var {routes} = this, i = routes.length;
        while (i--) {
            var route = routes[i];
            if (route.path === path)
                return route.action();
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

    var router = Router.start(appPath, actionPath);

    var url = new UrlHelper(router);

    var mainDriver = new Dom.DomDriver(".main-content");
    router.subscribe(route => {
        var rootCtrl = {
            controller: app,
            action: function (viewName) {
                var controller = this.controller;
                return typeof controller[viewName] === "function"
                    ? app[viewName]({ url: url.child(viewName) })
                    : System.import(basePath + "views/" + viewName).then(mod => mod.view());
            }
        }

        mainDriver.dispose();
        var parts: string[] = route.match(/\/([^\/]+)/g).map(x => x.slice(1));
        var viewResult = <ViewResult>parts.reduce<IControllerContext>((ctx: IControllerContext, name: string) => {
            return dataReady(ctx, x => {
                var result = x.action(name);
                if (typeof result === "undefined")
                    throw { error: "route not found: ", route: name, view: x };
                return result;
            });
        }, rootCtrl);

        dataReady(viewResult, x => {
            x.execute(mainDriver);
        });
    });

    function dataReady(data, resolve) {
        if (data !== null && data !== void 0 && !!data.then)
            return data.then(resolve);

        return resolve.call(resolve, data);
    }

    var html = new HtmlHelper(System);

    mount(app.menu({
        url: url,
        html: html,
        driver: new Dom.DomDriver('.main-menu')
    }));
}

interface IRouter {
    goto(path: string);
}

class Router implements IRouter {
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

/*

    child2(path): UrlHelper {
        return new UrlHelper(this.appPath + "/" + path, {
            router: this.router,
            goto(value: string) {
                this.router.goto(path + "/" + value);
            }
        } as any);
    }
*/