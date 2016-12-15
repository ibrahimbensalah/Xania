module Xania.Core {
    export class Math {
        static le(rating, max) {
            return rating <= max;
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
}
