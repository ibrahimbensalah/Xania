var Xania;
(function (Xania) {
    var Core;
    (function (Core) {
        var Math = (function () {
            function Math() {
            }
            Math.le = function (rating, max) {
                return rating <= max;
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
//# sourceMappingURL=core.js.map