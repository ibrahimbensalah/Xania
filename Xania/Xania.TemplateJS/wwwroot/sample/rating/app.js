"use strict";
var reactive_1 = require("../../src/reactive");
var RatingApp = (function () {
    function RatingApp() {
        this.rating = 6;
        this.highlighted = 0;
    }
    return RatingApp;
}());
function store(deps) {
    return new reactive_1.Reactive.Store(new RatingApp(), deps);
}
exports.store = store;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc2FtcGxlL3JhdGluZy9hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLCtDQUFtRDtBQUVuRDtJQUFBO1FBQ1ksV0FBTSxHQUFHLENBQUMsQ0FBQztRQUNYLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFBRCxnQkFBQztBQUFELENBQUMsQUFIRCxJQUdDO0FBRUQsZUFBc0IsSUFBSTtJQUN0QixNQUFNLENBQUMsSUFBSSxtQkFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLFNBQVMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQy9DLENBQUM7QUFGRCxzQkFFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlYWN0aXZlIGFzIFJlIH0gZnJvbSAnLi4vLi4vc3JjL3JlYWN0aXZlJ1xyXG5cclxuY2xhc3MgUmF0aW5nQXBwIHtcclxuICAgIHByaXZhdGUgcmF0aW5nID0gNjtcclxuICAgIHByaXZhdGUgaGlnaGxpZ2h0ZWQgPSAwO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RvcmUoZGVwcykge1xyXG4gICAgcmV0dXJuIG5ldyBSZS5TdG9yZShuZXcgUmF0aW5nQXBwKCksIGRlcHMpO1xyXG59Il19