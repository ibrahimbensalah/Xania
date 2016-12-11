var Xania;
(function (Xania) {
    var Dom;
    (function (Dom) {
        var TextTemplate = (function () {
            function TextTemplate(tpl) {
                this.tpl = tpl;
            }
            TextTemplate.prototype.toString = function () {
                return this.tpl.toString();
            };
            TextTemplate.prototype.bind = function (result) {
                var newBinding = new Xania.Bind.TextBinding(this.tpl, result);
                newBinding.update(result);
                return newBinding;
            };
            return TextTemplate;
        }());
        Dom.TextTemplate = TextTemplate;
        var ContentTemplate = (function () {
            function ContentTemplate() {
                this._children = [];
            }
            ContentTemplate.prototype.children = function () {
                return this._children;
            };
            ContentTemplate.prototype.addChild = function (child) {
                this._children.push(child);
                return this;
            };
            ContentTemplate.prototype.bind = function (context) {
                var newBinding = new Xania.Bind.ContentBinding();
                this.children()
                    .reduce(ContentTemplate.reduceChild, { context: context, offset: 0, parentBinding: newBinding });
                newBinding.update(context);
                return newBinding;
            };
            ContentTemplate.reduceChild = function (prev, cur) {
                var parentBinding = prev.parentBinding, context = prev.context, offset = prev.offset;
                prev.offset = Xania.ready(offset, function (p) {
                    var state = Xania.Bind.executeTemplate(context, cur, parentBinding.dom, p);
                    return Xania.ready(state, function (x) { return p + x.bindings.length; });
                });
                return prev;
            };
            return ContentTemplate;
        }());
        Dom.ContentTemplate = ContentTemplate;
        var TagTemplate = (function () {
            function TagTemplate(name) {
                this.name = name;
                this.attributes = [];
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
                var attr = this.getAttribute(name);
                if (!attr)
                    this.attributes.push({ name: name.toLowerCase(), tpl: tpl });
                return this;
            };
            TagTemplate.prototype.getAttribute = function (name) {
                var key = name.toLowerCase();
                for (var i = 0; i < this.attributes.length; i++) {
                    var attr = this.attributes[i];
                    if (attr.name === key)
                        return attr;
                }
                return null;
            };
            TagTemplate.prototype.addEvent = function (name, callback) {
                this.events.set(name, callback);
            };
            TagTemplate.prototype.addChild = function (child) {
                this._children.push(child);
                return this;
            };
            TagTemplate.prototype.select = function (modelAccessor) {
                this.modelAccessor = modelAccessor;
                return this;
            };
            TagTemplate.prototype.bind = function (context) {
                var newBinding = new Xania.Bind.TagBinding(this.name, this.attributes, this.events);
                this.children()
                    .reduce(ContentTemplate.reduceChild, { context: context, offset: 0, parentBinding: newBinding, modelAccessor: this.modelAccessor });
                newBinding.update(context);
                return newBinding;
            };
            return TagTemplate;
        }());
        Dom.TagTemplate = TagTemplate;
    })(Dom = Xania.Dom || (Xania.Dom = {}));
})(Xania || (Xania = {}));
//# sourceMappingURL=dom.js.map