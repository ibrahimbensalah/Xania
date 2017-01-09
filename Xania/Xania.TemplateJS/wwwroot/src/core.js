System.register([], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var Xania;
    return {
        setters: [],
        execute: function () {
            (function (Xania) {
                var Core;
                (function (Core) {
                    function State(initialValue) {
                        var fn = function (x) {
                            if (x !== undefined)
                                fn['id'] = x;
                            return fn['id'];
                        };
                        fn['id'] = initialValue;
                        fn['valueOf'] = function () { return initialValue; };
                        return fn;
                    }
                    Core.State = State;
                    ;
                    var i = 0;
                    var Dates = (function () {
                        function Dates() {
                        }
                        Dates.addDays = function (days, date) {
                            var retval = new Date(date.getTime());
                            retval.setDate(date.getDate() + days);
                            console.debug("addDays result", retval);
                            return retval;
                        };
                        Dates.addYears = function (years, date) {
                            var retval = new Date(date.getTime());
                            retval.setFullYear(date.getFullYear() + years);
                            console.debug("addYears result", retval);
                            return retval;
                        };
                        Dates.addMonths = function (months, date) {
                            var retval = new Date(date.getTime());
                            retval.setMonth(date.getMonth() + months);
                            console.debug("addMonths result", retval);
                            return retval;
                        };
                        Dates.dayOf = function (date) {
                            return date.getDate();
                        };
                        Dates.yearOf = function (date) {
                            return date.getFullYear();
                        };
                        Dates.monthOf = function (date) {
                            return date.getMonth();
                        };
                        Dates.formatDate = function (format, date) {
                            return date.toString();
                        };
                        return Dates;
                    }());
                    Core.Dates = Dates;
                    var Math = (function () {
                        function Math() {
                        }
                        Math.le = function (rating, max) {
                            return rating <= max;
                        };
                        Math.assign = function (property, value) {
                            console.debug(property, value);
                        };
                        return Math;
                    }());
                    Core.Math = Math;
                    var List = (function () {
                        function List() {
                        }
                        List.count = function (fn, list) {
                            if (!list)
                                return 0;
                            var result = 0;
                            for (var i = 0; i < list.length; i++)
                                if (fn(list[i]))
                                    result++;
                            return result;
                        };
                        List.any = function (fn, list) {
                            return List.count(fn, list) > 0;
                        };
                        List.all = function (fn, list) {
                            return List.count(fn, list) === list.length;
                        };
                        List.filter = function (fn, list) {
                            var retval = [];
                            for (var i = 0; i < list.length; i++) {
                                var item = list[i];
                                if (!!fn(item)) {
                                    retval.push(item);
                                }
                            }
                            return retval;
                        };
                        List.map = function (fn, list) {
                            if (!list)
                                return [];
                            return list.map(fn);
                        };
                        List.empty = function (list) {
                            return !list || list.length === 0;
                        };
                        List.reduce = function (fn, initialValue, list) {
                            return !list && list.reduce(fn, initialValue);
                        };
                        return List;
                    }());
                    Core.List = List;
                })(Core = Xania.Core || (Xania.Core = {}));
            })(Xania || (Xania = {}));
            exports_1("Xania", Xania);
        }
    };
});
//# sourceMappingURL=core.js.map