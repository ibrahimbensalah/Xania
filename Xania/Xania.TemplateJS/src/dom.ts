interface IDomTemplate {
    bind(context): Binding;
    modelAccessor;
    children();
}

class TextTemplate implements IDomTemplate {
    modelAccessor;
    constructor(private tpl) {
    }
    execute(context) {
        return this.tpl.execute(context);
    }
    bind(context) {
        return new TextBinding(this, context);
    }
    toString() {
        return this.tpl.toString();
    }
    children() {
        return [];
    }
}

class ContentTemplate implements IDomTemplate {
    // ReSharper disable once InconsistentNaming
    private _children: IDomTemplate[] = [];
    public modelAccessor: Function;// = Xania.identity;

    bind(context): Binding {
        return new ContentBinding(this, context);
    }

    public children() {
        return this._children;
    }

    public addChild(child: TagTemplate) {
        this._children.push(child);
        return this;
    }
}

class TagTemplate implements IDomTemplate {
    private attributes = new Map<string, any>();
    private events = new Map<string, any>();
    // ReSharper disable once InconsistentNaming
    private _children: IDomTemplate[] = [];
    public modelAccessor: Function;// = Xania.identity;

    constructor(public name: string) {
    }

    public children() {
        return this._children;
    }

    public attr(name: string, tpl: any) {
        return this.addAttribute(name, tpl);
    }

    public addAttribute(name: string, tpl: any) {
        this.attributes.set(name.toLowerCase(), tpl);
        return this;
    }

    public hasAttribute(name: string) {
        var key = name.toLowerCase();
        return this.attributes.has(key);
    }

    public addEvent(name, callback) {
        this.events.set(name, callback);
    }

    public addChild(child: TagTemplate) {
        this._children.push(child);
        return this;
    }

    public bind(context) {
        return new TagBinding(this, context);
    }

    public select(modelAccessor) {
        this.modelAccessor = modelAccessor;
        return this;
    }

    public executeAttributes(context, dom, resolve) {
        var classes = [];

        this.attributes.forEach(function attributesForEachBoundFn (tpl, name) {
            var value = tpl.execute(context).valueOf();
            if (name === "class") {
                classes.push(value);
            } else if (name.startsWith("class.")) {
                if (!!value) {
                    var className = name.substr(6);
                    classes.push(className);
                }
            } else {
                resolve(name, value, dom);
            }
        });

        // if (classes.length > 0)
        resolve("class", Xania.join(" ", classes), dom);
    }

    public executeEvents(context) {
        var result: any = {}, self = this;

        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            result.update = new Function("value", `with (this) { ${name} = value; }`).bind(context);
        }

        this.events.forEach((callback, eventName) => {
            result[eventName] = function () { callback.apply(self, [context].concat(arguments)); }
        });

        return result;
    }

}
 