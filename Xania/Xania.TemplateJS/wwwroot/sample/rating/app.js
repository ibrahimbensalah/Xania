"use strict";
var reactive_1 = require("../../src/reactive");
var core_1 = require("../../src/core");
var RatingApp = (function () {
    function RatingApp() {
        this.rating = 6;
        this.highlighted = 0;
    }
    return RatingApp;
}());
function store() {
    return new reactive_1.Reactive.Store(new RatingApp(), [core_1.Core.Math]);
}
exports.store = store;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL3JhdGluZy9hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLCtDQUFtRDtBQUNuRCx1Q0FBcUM7QUFFckM7SUFBQTtRQUNZLFdBQU0sR0FBRyxDQUFDLENBQUM7UUFDWCxnQkFBVyxHQUFHLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBQUQsZ0JBQUM7QUFBRCxDQUFDLEFBSEQsSUFHQztBQUVEO0lBQ0ksTUFBTSxDQUFDLElBQUksbUJBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxTQUFTLEVBQUUsRUFBRSxDQUFFLFdBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUFGRCxzQkFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlYWN0aXZlIGFzIFJlIH0gZnJvbSAnLi4vLi4vc3JjL3JlYWN0aXZlJ1xyXG5pbXBvcnQgeyBDb3JlIH0gZnJvbSAnLi4vLi4vc3JjL2NvcmUnXHJcblxyXG5jbGFzcyBSYXRpbmdBcHAge1xyXG4gICAgcHJpdmF0ZSByYXRpbmcgPSA2O1xyXG4gICAgcHJpdmF0ZSBoaWdobGlnaHRlZCA9IDA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdG9yZSgpIHtcclxuICAgIHJldHVybiBuZXcgUmUuU3RvcmUobmV3IFJhdGluZ0FwcCgpLCBbIENvcmUuTWF0aCBdKTtcclxufSJdfQ==