var TextTemplate = (function () {
    function TextTemplate(tpl) {
        this.tpl = tpl;
    }
    TextTemplate.prototype.execute = function (context) {
        return this.tpl.execute(context);
    };
    TextTemplate.prototype.bind = function (context) {
        return new TextBinding(this, context);
    };
    TextTemplate.prototype.toString = function () {
        return this.tpl.toString();
    };
    TextTemplate.prototype.children = function () {
        return [];
    };
    return TextTemplate;
})();
var ContentTemplate = (function () {
    function ContentTemplate() {
        this._children = [];
    }
    ContentTemplate.prototype.bind = function (context) {
        return new ContentBinding(this, context);
    };
    ContentTemplate.prototype.children = function () {
        return this._children;
    };
    ContentTemplate.prototype.addChild = function (child) {
        this._children.push(child);
        return this;
    };
    return ContentTemplate;
})();
var TagTemplate = (function () {
    function TagTemplate(name) {
        this.name = name;
        this.attributes = new Map();
        this.events = new Map();
        this._children = [];
    }
    TagTemplate.prototype.children = function () {
        return this._children;
    };
    TagTemplate.prototype.attr = function (name, tpl) {
        return this.addAttribute(name, tpl);
    };
    TagTemplate.prototype.addAttribute = function (name, tpl) {
        this.attributes.set(name.toLowerCase(), tpl);
        return this;
    };
    TagTemplate.prototype.hasAttribute = function (name) {
        var key = name.toLowerCase();
        return this.attributes.has(key);
    };
    TagTemplate.prototype.addEvent = function (name, callback) {
        this.events.set(name, callback);
    };
    TagTemplate.prototype.addChild = function (child) {
        this._children.push(child);
        return this;
    };
    TagTemplate.prototype.bind = function (context) {
        return new TagBinding(this, context);
    };
    TagTemplate.prototype.select = function (modelAccessor) {
        this.modelAccessor = modelAccessor;
        return this;
    };
    TagTemplate.prototype.executeAttributes = function (context, dom, resolve) {
        var classes = [];
        this.attributes.forEach(function attributesForEachBoundFn(tpl, name) {
            var value = tpl.execute(context).valueOf();
            if (name === "class") {
                classes.push(value);
            }
            else if (name.startsWith("class.")) {
                if (!!value) {
                    var className = name.substr(6);
                    classes.push(className);
                }
            }
            else {
                resolve(name, value, dom);
            }
        });
        resolve("class", Xania.join(" ", classes), dom);
    };
    TagTemplate.prototype.executeEvents = function (context) {
        var result = {}, self = this;
        if (this.name.toUpperCase() === "INPUT") {
            var name = this.attributes.get("name")(context);
            result.update = new Function("value", "with (this) { " + name + " = value; }").bind(context);
        }
        this.events.forEach(function (callback, eventName) {
            result[eventName] = function () { callback.apply(self, [context].concat(arguments)); };
        });
        return result;
    };
    return TagTemplate;
})();
