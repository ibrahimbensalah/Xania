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
    return RatingApp;
}());
//# sourceMappingURL=app.js.map