module Xania.Dom {
    export interface IDomTemplate {
        modelAccessor?;
        bind(context);
    }

    export class TextTemplate implements IDomTemplate {
        constructor(private tpl) {
        }

        toString() {
            return this.tpl.toString();
        }

        bind(result) {
            var newBinding = new Bind.TextBinding(this.tpl, result);
            newBinding.update(result);
            return newBinding;
        }
    }

    export class ContentTemplate implements IDomTemplate {
        // ReSharper disable once InconsistentNaming
        private _children: TagTemplate[] = [];

        public children() {
            return this._children;
        }

        public addChild(child: TagTemplate) {
            this._children.push(child);
            return this;
        }

        bind(context) {
            const newBinding = new Bind.ContentBinding();
            this.children()
                .reduce(ContentTemplate.reduceChild,
                { context, offset: 0, parentBinding: newBinding });

            newBinding.update(context);

            return newBinding;
        }

        static reduceChild(prev, cur: IDomTemplate) {
            var { parentBinding, context, offset } = prev;

            prev.offset = ready(offset,
                p => {
                    var state = Bind.executeTemplate(context, cur, parentBinding.dom, p);
                    return ready(state, x => { return p + x.bindings.length });
                });

            return prev;
        }
    }

    export class TagTemplate implements IDomTemplate {
        private attributes: { name: string; tpl }[] = [];
        private events = new Map<string, any>();
        // ReSharper disable once InconsistentNaming
        private _children: IDomTemplate[] = [];
        public modelAccessor;

        constructor(public name: string) {
        }

        public children(): IDomTemplate[] {
            return this._children;
        }

        public attr(name: string, tpl: any) {
            return this.addAttribute(name, tpl);
        }

        public addAttribute(name: string, tpl: any) {
            var attr = this.getAttribute(name);
            if (!attr)
                this.attributes.push({ name: name.toLowerCase(), tpl });
            return this;
        }

        public getAttribute(name: string) {
            var key = name.toLowerCase();
            for (var i = 0; i < this.attributes.length; i++) {
                var attr = this.attributes[i];
                if (attr.name === key)
                    return attr;
            }
            return null;
        }

        public addEvent(name, callback) {
            this.events.set(name, callback);
        }

        public addChild(child: TagTemplate) {
            this._children.push(child);
            return this;
        }

        public select(modelAccessor) {
            this.modelAccessor = modelAccessor;
            return this;
        }

        bind(context) {
            const newBinding = new Bind.TagBinding(this.name, this.attributes, this.events);
            this.children()
                .reduce(ContentTemplate.reduceChild,
                { context, offset: 0, parentBinding: newBinding, modelAccessor: this.modelAccessor });

            newBinding.update(context);

            return newBinding;
        }
    }
}