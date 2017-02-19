import { Core } from "./core"

export module Template {

    export interface IVisitor<T> {
        text(expr): T;
        content(expr, children: INode[]): T;
        tag(name, ns, attrs, children): T;
    }

    export interface INode {
        bind?<T>(visitor: IVisitor<T>): T;
    }

    export class TextTemplate implements INode {
        constructor(private tpl: { execute(binding, context); } | string) {
        }

        bind<T>(visitor: IVisitor<T>): T {
            return visitor.text(this.tpl);
        }
    }

    export class FragmentTemplate implements INode {
        private children: INode[] = [];

        constructor(private expr) { }

        child(child: INode) {
            this.children.push(child);
            return this;
        }

        bind<T>(visitor: IVisitor<T>): T {
            return visitor.content(this.expr, this.children);
        }
    }

    export class TagTemplate implements INode {
        private attributes: { name: string; tpl }[] = [];
        private events = new Map<string, any>();
        // ReSharper disable once InconsistentNaming
        public modelAccessor;

        constructor(public name: string, private ns: string, private _children: INode[] = []) {
        }

        public children(): INode[] {
            return this._children;
        }

        public attr(name: string, expr: any) {
            return this.addAttribute(name, expr);
        }

        public addAttribute(name: string, expr: any) {
            var attr = this.getAttribute(name);
            if (!attr)
                this.attributes.push({ name: name.toLowerCase(), tpl: expr });
            return this;
        }

        public getAttribute(name: string) {
            var key = name.toLowerCase();
            for (var i = 0; i < this.attributes.length; i++) {
                var attr = this.attributes[i];
                if (attr.name === key)
                    return attr;
            }
            return undefined;
        }

        public addEvent(name, callback) {
            this.events.set(name, callback);
        }

        public addChild(child: INode) {
            this._children.push(child);
            return this;
        }

        public select(modelAccessor) {
            this.modelAccessor = modelAccessor;
            return this;
        }

        bind<T>(visitor: IVisitor<T>) {
            const bindings = this._children.map(x => x.bind(visitor));
            var tagBinding = visitor.tag(this.name, this.ns, this.attributes, bindings);

            return tagBinding;
        }
    }
}

export {
    Template as t
}