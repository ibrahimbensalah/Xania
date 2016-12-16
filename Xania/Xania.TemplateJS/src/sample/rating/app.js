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
var TimeApp = (function () {
    function TimeApp() {
        this.day = 15;
        this.month = 11;
        this.year = 2016;
        this.monthDisplay = "DEC";
        this.store = { times: [{ day: 1, month: 1, year: 1 }] };
    }
    TimeApp.prototype.addMonth = function (increment) {
        this.month = (this.month + increment) % 12;
        this.monthDisplay = TimeApp.MONTHS[this.month];
    };
    TimeApp.prototype.addDay = function (increment) {
        this.day = (this.day - 1 + increment) % 31 + 1;
    };
    TimeApp.prototype.addYear = function (increment) {
        this.year += increment;
    };
    TimeApp.prototype.submitTime = function () {
        var _a = this, day = _a.day, month = _a.month, year = _a.year;
        this.store.times.push({ day: day, month: month, year: year });
        console.debug("times", this.store.times);
    };
    return TimeApp;
}());
TimeApp.MONTHS = ["JAN", "FEB", "MRT", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];
//# sourceMappingURL=app.js.map