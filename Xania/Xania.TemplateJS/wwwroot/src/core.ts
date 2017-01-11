export module Core {
    export function State(initialValue) {
        var fn = function (x) {
            if (x !== undefined)
                fn['id'] = x;

            return fn['id'];
        };
        fn['id'] = initialValue;
        fn['valueOf'] = () => initialValue;

        return fn;
    }

    export class Dates {
        static addDays(days: number, date: Date) {
            var retval = new Date(date.getTime());
            retval.setDate(date.getDate() + days);

            console.debug("addDays result", retval);
            return retval;
        }

        static addYears(years: number, date: Date) {
            var retval = new Date(date.getTime());
            retval.setFullYear(date.getFullYear() + years);

            console.debug("addYears result", retval);
            return retval;
        }

        static addMonths(months: number, date: Date) {
            var retval = new Date(date.getTime());
            retval.setMonth(date.getMonth() + months);

            console.debug("addMonths result", retval);
            return retval;
        }

        static dayOf(date: Date) {
            return date.getDate();
        }

        static yearOf(date: Date) {
            return date.getFullYear();
        }

        static monthOf(date: Date) {
            return date.getMonth();
        }

        static formatDate(format, date: Date) {
            return date.toString();
        }
    }

    export class Math {
        static le(rating, max) {
            return rating <= max;
        }

        static assign(property, value) {
            console.debug(property, value);
        }
    }

    export class List {
        static count(fn, list) {
            if (!list)
                return 0;
            var result = 0;
            for (var i = 0; i < list.length; i++)
                if (fn(list[i]))
                    result++;

            return result;
        }

        static any(fn, list) {
            return List.count(fn, list) > 0;
        }

        static all(fn, list) {
            return List.count(fn, list) === list.length;
        }

        static filter(fn, list) {
            var retval = [];

            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                if (!!fn(item)) {
                    retval.push(item);
                }
            }

            return retval;
        }

        static map(fn, list) {
            if (!list)
                return [];

            return list.map(fn);
        }

        static empty(list) {
            return !list || list.length === 0;
        }

        static reduce(fn, initialValue, list) {
            return !list && list.reduce(fn, initialValue);
        }
    }


    export interface IScope {
        get(name: string): any;
        extend?(value): IScope;
    }

    export class Scope implements IScope {

        constructor(private value: any = {}, private parent?: IScope) {
        }

        valueOf() {
            return this.value;
        }

        map(fn) {
            return this.value.map(fn);
        }

        extend(value: any) {
            return new Scope(value, this);
        }

        set(name: string, value: any) {
            if (value === undefined) {
                throw new Error("value is undefined");
            }

            if (this.get(name) !== undefined) {
                throw new Error("modifying value is not permitted.");
            }

            this.value[name] = value;
            return this;
        }

        get(name: string) {
            var value = this.value[name];

            if (typeof value === "undefined") {
                if (this.parent)
                    return this.parent.get(name);

                return value;
            }

            if (value === null || value instanceof Date)
                return value;

            if (typeof value === "function")
                return value.bind(this.value);

            if (typeof value === "object")
                return new Scope(value, this);

            return value;
        }

        toJSON() {
            var parent: any = this.parent;
            return (<any>Object).assign({}, this.value, parent.toJSON ? parent.toJSON() : {});
        }

        toString() {
            return JSON.stringify(this.toJSON(), null, 4);
        }
    }
}