export module Core {
    export function State(initialValue) {
        var fn = x => {
            if (x !== void 0)
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
            debugger;
            if (!list)
                return 0;
            var result = 0, length = list.length;
            for (var i = 0; i < length; i++)
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
            var retval = [], length = list.length;

            for (var i = 0; i < length; i++) {
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

    export function ready(data, resolve) {

        if (data !== null && data !== void 0 && !!data.then)
            return data.then(resolve);

        if (!!resolve.execute)
            return resolve.execute.call(resolve, data);

        return resolve.call(resolve, data);
    }

    export function compose(...fns: any[]): Function {
        return function (result) {
            for (var i = fns.length - 1; i > -1; i--) {
                // ReSharper disable once SuspiciousThisUsage
                result = fns[i].call(this, result);
            }
            return result;
        };
    }

    export function defer() {
        return {
            value: void 0,
            resolvers: [],
            notify(value) {
                if (value === void 0)
                    throw new Error("undefined result");

                this.value = value;
                var length = this.resolvers.length;
                for (var i = 0; i < length; i++) {
                    this.resolvers[i].call(null, value);
                }
            },
            then(resolve) {
                if (this.value === void 0) {
                    this.resolvers.push(resolve);
                } else {
                    resolve.call(null, this.value);
                }
            }
        };
    }

    export var empty = "";
}