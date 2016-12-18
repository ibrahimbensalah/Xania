class TimeApp {

    date;
    day = 1;
    month = 1;
    year = 1;

    store = { times: [] };

    constructor() {
        this.reset();
    }

    reset() {
        this.date = new Date();
    }

    addMonth(increment) {
        this.month = (this.month + increment) % 12;
    }

    static monthDisplay(month) {
        return TimeApp.MONTHS[month];
    }

    addYear(increment) {
        this.year += increment;
    }

    submitTime() {
        this.store.times.push({ date: this.date });
    }

    // ReSharper disable once InconsistentNaming
    static MONTHS = ["JAN", "FEB", "MRT", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];

}