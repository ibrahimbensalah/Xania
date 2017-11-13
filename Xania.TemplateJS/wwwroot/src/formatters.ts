import { expr } from "./xania";

var formatters = {
    timeSpan: {
        parse(str) {
            return str;
        },
        format(obj) {
            var str = obj.toString();
            var matches = /(\d{2}:\d{2}):\d{2}/.exec(str);
            return matches ? matches[1] : str;
        }
    },
    dateTime: {
        parse(str) {
            return new Date(str);
        },
        format(date) {
            return date.toDateString();
        }
    }
}

export function format(expr, formatter) {
    return {
        execute(context, binding) {
            return {
                inner: expr.execute(context, binding),
                toString() {
                    return formatter.format(this.inner && this.inner.valueOf());
                },
                update(value) {
                    this.inner.update(formatter.parse(value));
                }
            }
        }
    }
}
export function timeSpan(code: string) {
    return format(expr(code), formatters.timeSpan);
}
export function dateTime(code: string) {
    return format(expr(code), formatters.dateTime);
}
