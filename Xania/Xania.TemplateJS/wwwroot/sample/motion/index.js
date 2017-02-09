"use strict";
var MotionApp = (function () {
    function MotionApp() {
    }
    MotionApp.run = function () {
        var document = window.document;
        var elements = document.querySelectorAll('.motion-wrapper .js li');
        var animations = [];
        for (var i = 0, len = elements.length; i < len; ++i) {
            var animation = elements[i]
                .animate([
                {
                    transform: 'rotate(0deg)',
                    offset: 0
                }, {
                    transform: 'rotate(-12deg)',
                    offset: .08
                }, {
                    transform: 'rotate(270deg)',
                    offset: .3
                }, {
                    transform: 'rotate(-40deg)',
                    offset: .55
                }, {
                    transform: 'rotate(70deg)',
                    offset: .8
                }, {
                    transform: 'rotate(-13deg)',
                    offset: .92
                }, {
                    transform: 'rotate(0deg)',
                    offset: 1
                }
            ], {
                duration: 3000,
                iterations: Infinity,
                easing: 'linear',
                delay: 0
            });
            animations.push(animation);
        }
    };
    MotionApp.prototype.view = function (xania) {
        return (xania.tag("div", { className: "motion-wrapper" },
            xania.tag("div", null,
                xania.tag("button", { onClick: MotionApp.run }, "run")),
            xania.tag("div", null,
                xania.tag("div", null, "js animation"),
                xania.tag("ul", { className: "js" },
                    xania.tag("li", null, "1"),
                    xania.tag("li", null, "2"))),
            xania.tag("div", null,
                xania.tag("div", null, "css animation"),
                xania.tag("ul", { className: "css activated" },
                    xania.tag("li", null, "6"),
                    xania.tag("li", null, "6")))));
    };
    return MotionApp;
}());
exports.MotionApp = MotionApp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zYW1wbGUvbW90aW9uL2luZGV4LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUE7SUFBQTtJQTZEQSxDQUFDO0lBNURVLGFBQUcsR0FBVjtRQUNJLElBQUksUUFBUSxHQUFRLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDcEMsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDbkUsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDbEQsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQztpQkFDdEIsT0FBTyxDQUFDO2dCQUNEO29CQUNJLFNBQVMsRUFBRSxjQUFjO29CQUN6QixNQUFNLEVBQUUsQ0FBQztpQkFDWixFQUFFO29CQUNDLFNBQVMsRUFBRSxnQkFBZ0I7b0JBQzNCLE1BQU0sRUFBRSxHQUFHO2lCQUNkLEVBQUU7b0JBQ0MsU0FBUyxFQUFFLGdCQUFnQjtvQkFDM0IsTUFBTSxFQUFFLEVBQUU7aUJBQ2IsRUFBRTtvQkFDQyxTQUFTLEVBQUUsZ0JBQWdCO29CQUMzQixNQUFNLEVBQUUsR0FBRztpQkFDZCxFQUFFO29CQUNDLFNBQVMsRUFBRSxlQUFlO29CQUMxQixNQUFNLEVBQUUsRUFBRTtpQkFDYixFQUFFO29CQUNDLFNBQVMsRUFBRSxnQkFBZ0I7b0JBQzNCLE1BQU0sRUFBRSxHQUFHO2lCQUNkLEVBQUU7b0JBQ0MsU0FBUyxFQUFFLGNBQWM7b0JBQ3pCLE1BQU0sRUFBRSxDQUFDO2lCQUNaO2FBQ0osRUFDRDtnQkFDSSxRQUFRLEVBQUUsSUFBSTtnQkFDZCxVQUFVLEVBQUUsUUFBUTtnQkFDcEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLEtBQUssRUFBRSxDQUFDO2FBQ1gsQ0FBQyxDQUFDO1lBQ1gsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvQixDQUFDO0lBQ0wsQ0FBQztJQUNELHdCQUFJLEdBQUosVUFBSyxLQUFLO1FBQ04sTUFBTSxDQUFDLENBQ0gsbUJBQUssU0FBUyxFQUFDLGdCQUFnQjtZQUMzQjtnQkFBSyxzQkFBUSxPQUFPLEVBQUUsU0FBUyxDQUFDLEdBQUcsVUFBYyxDQUFNO1lBQ3ZEO2dCQUNJLHNDQUF1QjtnQkFDdkIsa0JBQUksU0FBUyxFQUFDLElBQUk7b0JBQ2QsMEJBQVU7b0JBQ1YsMEJBQVUsQ0FDVCxDQUNIO1lBQ047Z0JBQ0ksdUNBQXdCO2dCQUN4QixrQkFBSSxTQUFTLEVBQUMsZUFBZTtvQkFDekIsMEJBQVU7b0JBQ1YsMEJBQVUsQ0FDVCxDQUNILENBQ0osQ0FDVCxDQUFDO0lBQ04sQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQTdERCxJQTZEQztBQTdEWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5cclxuZXhwb3J0IGNsYXNzIE1vdGlvbkFwcCB7XHJcbiAgICBzdGF0aWMgcnVuKCkge1xyXG4gICAgICAgIHZhciBkb2N1bWVudDogYW55ID0gd2luZG93LmRvY3VtZW50O1xyXG4gICAgICAgIHZhciBlbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tb3Rpb24td3JhcHBlciAuanMgbGknKTtcclxuICAgICAgICB2YXIgYW5pbWF0aW9ucyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBlbGVtZW50cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xyXG4gICAgICAgICAgICB2YXIgYW5pbWF0aW9uID0gZWxlbWVudHNbaV1cclxuICAgICAgICAgICAgICAgIC5hbmltYXRlKFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiAncm90YXRlKDBkZWcpJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICdyb3RhdGUoLTEyZGVnKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IC4wOFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICdyb3RhdGUoMjcwZGVnKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IC4zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogJ3JvdGF0ZSgtNDBkZWcpJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogLjU1XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogJ3JvdGF0ZSg3MGRlZyknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAuOFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICdyb3RhdGUoLTEzZGVnKScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IC45MlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICdyb3RhdGUoMGRlZyknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0OiAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDMwMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGlvbnM6IEluZmluaXR5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmc6ICdsaW5lYXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxheTogMFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhbmltYXRpb25zLnB1c2goYW5pbWF0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2aWV3KHhhbmlhKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb3Rpb24td3JhcHBlclwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdj48YnV0dG9uIG9uQ2xpY2s9e01vdGlvbkFwcC5ydW59PnJ1bjwvYnV0dG9uPjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2PmpzIGFuaW1hdGlvbjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJqc1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+MTwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT4yPC9saT5cclxuICAgICAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+Y3NzIGFuaW1hdGlvbjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJjc3MgYWN0aXZhdGVkXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT42PC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjY8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufSJdfQ==