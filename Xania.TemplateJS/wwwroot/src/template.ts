export interface IDriver {
    insert?(binding, dom, idx);
    on?(eventName, dom, eventBinding);
    attr(name);
}

export module Template {

    export interface IVisitor<T> {
        text(expr, driver: IDriver): T;
        tag(name, ns, attrs, driver: IDriver): T;
    }

    export interface INode {
        bind?(driver: IDriver);
        child?(node: INode);
    }

    export class TextTemplate<T> implements INode {
        constructor(private expr, private visitor: IVisitor<T>) {
        }

        bind(driver: IDriver): T {
            return this.visitor.text(this.expr, driver);
        }
    }

    export class TagTemplate<T> implements INode {
        private attributes: { name: string; tpl }[] = [];
        private events = new Map<string, any>();
        // ReSharper disable once InconsistentNaming
        public modelAccessor;
        private _children: INode[] = [];

        constructor(public name: string, private ns: string, private visitor: IVisitor<T>) {
        }

        public children(): INode[] {
            return this._children;
        }

        public attrs(attrs) {
            for (let attrName in attrs) {
                if (attrs.hasOwnProperty(attrName)) {
                    var attrValue = attrs[attrName];
                    this.attr(attrName, attrValue);
                }
            }
            return this;
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

        bind(driver: IDriver) {
            var tag: any = this.visitor.tag(this.name, this.ns, this.attributes, driver);

            var i = 0, children = this._children, length = children.length;
            while (i < length) {
                tag.child(children[i++]);
            }

            return tag;
        }

        child(node: INode) {
            this._children.push(node);
        }
    }

    export class CustomTemplate implements INode {
        constructor(private func) { }

        bind(driver) {
            this.func().bind(driver);
        }
    }
}

export default Template;