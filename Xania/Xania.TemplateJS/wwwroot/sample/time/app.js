var TimeApp = (function () {
    function TimeApp() {
        this.store = { times: [] };
        this.reset();
    }
    TimeApp.prototype.reset = function () {
        this.date = new Date();
    };
    TimeApp.monthDisplay = function (date) {
        return TimeApp.MONTHS[date.getMonth()];
    };
    TimeApp.prototype.submitTime = function () {
        this.store.times.push({ date: this.date, hours: 8, notes: "" });
    };
    return TimeApp;
}());
// ReSharper disable once InconsistentNaming
TimeApp.MONTHS = ["JAN", "FEB", "MRT", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];
//# sourceMappingURL=app.js.map