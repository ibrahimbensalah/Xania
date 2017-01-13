import { Core } from "./core"

export module Template {

    export interface IVisitor {
        text?(tpl);
        content?(children: any[]);
        tag?(name, ns, attr, events, content);
    }

    export interface INodeTemplate {
        modelAccessor?;
        accept(visitor: IVisitor);
    }

    export class TextTemplate implements INodeTemplate {
        constructor(private expr : string) {
        }

        toString() {
            return this.expr.toString();
        }

        accept(visitor: IVisitor): any {
            return visitor.text(this.expr);
        }

        //bind(result) {
        //    var newBinding = new Dom.TextBinding(this.tpl, result);
        //    newBinding.update(result);
        //    return newBinding;
        //}
    }

    export class ContentTemplate implements INodeTemplate {
        // ReSharper disable once InconsistentNaming
        private _children: TagTemplate[] = [];

        public children() {
            return this._children;
        }

        public addChild(child: TagTemplate) {
            this._children.push(child);
            return this;
        }

        accept(visitor: IVisitor) {
            var children: any[] = this._children.map(h => h.accept(visitor));
            return visitor.content(children);
        }

        //bind(context) {
        //    const newBinding = new Dom.ContentBinding();
        //    this.children()
        //        // ReSharper disable once TsResolvedFromInaccessibleModule
        //        .reduce(ContentTemplate.reduceChild,
        //        { context, offset: 0, parentBinding: newBinding });

        //    newBinding.update(context);

        //    return newBinding;
        //}

        //static reduceChild(prev, cur: INodeTemplate) {
        //    var { parentBinding, context, offset } = prev;

        //    prev.offset = Core.ready(offset,
        //        p => {
        //            var state = Dom.executeTemplate(context, cur, parentBinding.dom, p);
        //            return Core.ready(state, x => { return p + x.bindings.length });
        //        });

        //    return prev;
        //}
    }

    export class TagTemplate implements INodeTemplate {
        private attributes: { name: string; tpl }[] = [];
        private events = new Map<string, any>();
        // ReSharper disable once InconsistentNaming
        private _children: INodeTemplate[] = [];
        public modelAccessor;

        constructor(public name: string, private ns: string) {
        }

        public children(): INodeTemplate[] {
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

        accept(visitor: IVisitor) {
            var children = this._children.map(x => x.accept(visitor));
            var content = visitor.content(children);

            return visitor.tag(this.name, this.ns, this.attributes, this.events, content);
        }

        //bind(context) {
        //    const newBinding = new Dom.TagBinding(this.name, this.ns, this.attributes, this.events);
        //    this.children()
        //        .reduce(ContentTemplate.reduceChild,
        //        { context, offset: 0, parentBinding: newBinding, modelAccessor: this.modelAccessor });

        //    newBinding.update(context);

        //    return newBinding;
        //}
    }
}

export {
    Template as t
}