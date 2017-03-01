import { Core } from "./core"

export module Template {

    export interface IVisitor<T> {
        text(expr): T;
        content(expr, children: INode[]): T;
        tag(name, ns, attrs, children): T;
    }

    export interface INode {
        bind?();
    }

    export class TextTemplate<T> implements INode {
        constructor(private expr, private visitor: IVisitor<T>) {
        }

        bind(): T {
            return this.visitor.text(this.expr);
        }
    }

    export class FragmentTemplate<T> implements INode {
        private children: INode[] = [];

        constructor(private expr, private visitor: IVisitor<T>) { }

        child(child: INode) {
            this.children.push(child);
            return this;
        }

        bind() {
            return this.visitor.content(this.expr, this.children);
        }
    }

    export class TagTemplate<T> implements INode {
        private attributes: { name: string; tpl }[] = [];
        private events = new Map<string, any>();
        // ReSharper disable once InconsistentNaming
        public modelAccessor;

        constructor(public name: string, private ns: string, private _children: INode[] = [], private visitor: IVisitor<T>) {
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

        bind() {
            const bindings = this._children.map(x => x.bind());
            var tagBinding = this.visitor.tag(this.name, this.ns, this.attributes, bindings);

            return tagBinding;
        }
    }
}

export {
    Template as t
}