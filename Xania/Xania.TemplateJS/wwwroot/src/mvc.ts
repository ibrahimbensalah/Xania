import { Observables } from "./observables"
import xania, { mount } from './xania'
import Dom from './dom'

export class UrlHelper {
    public observers = [];
    public actionPath: Observables.Observable<string>;
    private initialPath: string;

    constructor(private appPath, actionPath, private appInstance) {
        this.actionPath = new Observables.Observable<string>(actionPath);
        this.initialPath = actionPath;

        window.onpopstate = (popStateEvent) => {
            var { state } = popStateEvent;
            var { pathname } = window.location;

            if (state && pathname.startsWith(this.appPath + "/")) {
                var actionPath = pathname.substring(this.appPath.length + 1);

                if (state.actionPath !== actionPath)
                    console.error(actionPath, state);

                if (actionPath !== this.actionPath.current)
                    this.actionPath.notify(actionPath);
            }
        }
    }

    action(path: string, view?) {
        return event => {
            var actionPath = path;
            var actionView = view;
            if (this.actionPath.current !== actionPath) {
                var action = { actionPath, actionView };
                window.history.pushState(action, "", this.appPath + "/" + actionPath);
                this.actionPath.notify(actionPath);
            }
            event.preventDefault();
        };
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
        var view =  this.view.bind(driver)
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
        return null;
    }
}

export function View(view, model?) {
    return new ViewResult(view, model);
}

declare class System {
    static import(path: string);
}

export function boot(basePath: string, appPath: string, actionPath: string, app: any) {
    var url = new UrlHelper(appPath, actionPath, app);

    var mainDriver = new Dom.DomDriver(".main-content");
    url.actionPath.subscribe(path => {
        var rootCtrl = {
            controller: app,
            action: function (viewName) {
                var controller = this.controller;
                return typeof controller[viewName] === "function"
                    ? app[viewName]()
                    : System.import(basePath + "views/" + viewName).then(mod => mod.view());
            }
        }

        mainDriver.dispose();
        var parts: string[] = path.split("/");
        var viewResult  = <ViewResult>parts.reduce<IControllerContext>((ctx: IControllerContext, name: string) => ctx.action(name), rootCtrl);
        viewResult.execute(mainDriver);
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