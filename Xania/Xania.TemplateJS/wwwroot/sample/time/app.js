var TimeApp = (function () {
    function TimeApp() {
        this.day = 1;
        this.month = 1;
        this.year = 1;
        this.store = { times: [] };
        this.reset();
    }
    TimeApp.prototype.reset = function () {
        this.date = new Date();
    };
    TimeApp.prototype.addMonth = function (increment) {
        this.month = (this.month + increment) % 12;
    };
    TimeApp.monthDisplay = function (month) {
        return TimeApp.MONTHS[month];
    };
    TimeApp.prototype.addYear = function (increment) {
        this.year += increment;
    };
    TimeApp.prototype.submitTime = function () {
        this.store.times.push({ date: this.date });
    };
    // ReSharper disable once InconsistentNaming
    TimeApp.MONTHS = ["JAN", "FEB", "MRT", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];
    return TimeApp;
}());
