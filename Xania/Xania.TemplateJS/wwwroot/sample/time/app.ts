class TimeApp {

    date;

    store = { times: [] };

    constructor() {
        this.reset();
    }

    reset() {
        this.date = new Date();
    }

    static monthDisplay(date) {
        return TimeApp.MONTHS[date.getMonth()];
    }

    submitTime() {
        this.store.times.push({ date: this.date, hours: 8, notes: "" });
    }

    // ReSharper disable once InconsistentNaming
    static MONTHS = ["JAN", "FEB", "MRT", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];

}