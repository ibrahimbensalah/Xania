var RatingApp = (function () {
    function RatingApp() {
        this.rating = 6;
        this.highlighted = 6;
    }
    RatingApp.prototype.select = function (rating) {
        this.rating = rating;
    };
    RatingApp.prototype.highlight = function (rating) {
        this.highlighted = rating;
    };
    RatingApp.lessThanOrEqual = function (rating, max) {
        return rating <= max;
    };
    RatingApp.RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return RatingApp;
}());
//# sourceMappingURL=app.js.map