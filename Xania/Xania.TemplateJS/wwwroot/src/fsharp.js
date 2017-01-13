"use strict";
var peg = require("./fsharp.peg");
function accept(ast, visitor) {
    if (ast === null || ast === undefined)
        return null;
    if (ast.type === undefined)
        return ast;
    switch (ast.type) {
        case "where":
            return visitor.where(accept(ast.source, visitor), accept(ast.predicate, visitor));
        case "query":
            return visitor.query(ast.param, accept(ast.source, visitor));
        case "ident":
            return visitor.ident(ast.name);
        case "member":
            return visitor.member(accept(ast.target, visitor), accept(ast.member, visitor));
        case "app":
            var args = [];
            for (var i = 0; i < ast.args.length; i++) {
                args.push(accept(args[i], visitor));
            }
            return visitor.app(accept(ast.fun, visitor), args);
        case "select":
            return visitor.select(accept(ast.source, visitor), accept(ast.selector, visitor));
        case "const":
            return visitor.const(ast.value);
        default:
            throw new Error("not supported type " + ast.type);
    }
}
exports.accept = accept;
exports.fsharp = peg.parse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnNoYXJwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZzaGFycC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBWUEsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBSWxDLGdCQUF1QixHQUFRLEVBQUUsT0FBb0I7SUFDakQsRUFBRSxDQUFDLENBQUMsR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHLEtBQUssU0FBUyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFFaEIsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUM7UUFDdkIsTUFBTSxDQUFDLEdBQUcsQ0FBQztJQUVmLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ2YsS0FBSyxPQUFPO1lBQ1IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN0RixLQUFLLE9BQU87WUFDUixNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDakUsS0FBSyxPQUFPO1lBQ1IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25DLEtBQUssUUFBUTtZQUNULE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDcEYsS0FBSyxLQUFLO1lBQ04sSUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2hCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUNELE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZELEtBQUssUUFBUTtZQUNULE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdEYsS0FBSyxPQUFPO1lBQ1IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BDO1lBQ0ksTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBc0IsR0FBRyxDQUFDLElBQU0sQ0FBQyxDQUFDO0lBQzFELENBQUM7QUFDTCxDQUFDO0FBN0JELHdCQTZCQztBQUVVLFFBQUEsTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbnRlcmZhY2UgSUFzdFZpc2l0b3Ige1xyXG4gICAgd2hlcmUoc291cmNlLCBwcmVkaWNhdGUpO1xyXG4gICAgc2VsZWN0KHNvdXJjZSwgc2VsZWN0b3IpO1xyXG4gICAgcXVlcnkocGFyYW0sIHNvdXJjZSk7XHJcbiAgICBpZGVudChuYW1lKTtcclxuICAgIG1lbWJlcih0YXJnZXQsIG5hbWUpO1xyXG4gICAgYXBwKGZ1biwgYXJnczogYW55W10pO1xyXG4gICAgY29uc3QodmFsdWUpO1xyXG59XHJcblxyXG5kZWNsYXJlIGZ1bmN0aW9uIHJlcXVpcmUobW9kdWxlOiBzdHJpbmcpO1xyXG5cclxudmFyIHBlZyA9IHJlcXVpcmUoXCIuL2ZzaGFycC5wZWdcIik7XHJcblxyXG4vLyB2YXIgZnNoYXJwID0gcGVnLnBhcnNlO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFjY2VwdChhc3Q6IGFueSwgdmlzaXRvcjogSUFzdFZpc2l0b3IpIHtcclxuICAgIGlmIChhc3QgPT09IG51bGwgfHwgYXN0ID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgaWYgKGFzdC50eXBlID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgcmV0dXJuIGFzdDtcclxuXHJcbiAgICBzd2l0Y2ggKGFzdC50eXBlKSB7XHJcbiAgICAgICAgY2FzZSBcIndoZXJlXCI6XHJcbiAgICAgICAgICAgIHJldHVybiB2aXNpdG9yLndoZXJlKGFjY2VwdChhc3Quc291cmNlLCB2aXNpdG9yKSwgYWNjZXB0KGFzdC5wcmVkaWNhdGUsIHZpc2l0b3IpKTtcclxuICAgICAgICBjYXNlIFwicXVlcnlcIjpcclxuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IucXVlcnkoYXN0LnBhcmFtLCBhY2NlcHQoYXN0LnNvdXJjZSwgdmlzaXRvcikpO1xyXG4gICAgICAgIGNhc2UgXCJpZGVudFwiOlxyXG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci5pZGVudChhc3QubmFtZSk7XHJcbiAgICAgICAgY2FzZSBcIm1lbWJlclwiOlxyXG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci5tZW1iZXIoYWNjZXB0KGFzdC50YXJnZXQsIHZpc2l0b3IpLCBhY2NlcHQoYXN0Lm1lbWJlciwgdmlzaXRvcikpO1xyXG4gICAgICAgIGNhc2UgXCJhcHBcIjpcclxuICAgICAgICAgICAgY29uc3QgYXJncyA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFzdC5hcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goYWNjZXB0KGFyZ3NbaV0sIHZpc2l0b3IpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdmlzaXRvci5hcHAoYWNjZXB0KGFzdC5mdW4sIHZpc2l0b3IpLCBhcmdzKTtcclxuICAgICAgICBjYXNlIFwic2VsZWN0XCI6XHJcbiAgICAgICAgICAgIHJldHVybiB2aXNpdG9yLnNlbGVjdChhY2NlcHQoYXN0LnNvdXJjZSwgdmlzaXRvciksIGFjY2VwdChhc3Quc2VsZWN0b3IsIHZpc2l0b3IpKTtcclxuICAgICAgICBjYXNlIFwiY29uc3RcIjpcclxuICAgICAgICAgICAgcmV0dXJuIHZpc2l0b3IuY29uc3QoYXN0LnZhbHVlKTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYG5vdCBzdXBwb3J0ZWQgdHlwZSAke2FzdC50eXBlfWApO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIGZzaGFycCA9IHBlZy5wYXJzZTtcclxuXHJcbiJdfQ==