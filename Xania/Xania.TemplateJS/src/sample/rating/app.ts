class RatingApp {
    private rating = 6;
    private highlighted = 6;

    select(rating) {
        this.rating = rating;
    }

    highlight(rating) {
        this.highlighted = rating;
    }
}


class TimeApp {

    static MONTHS = ["JAN", "FEB", "MRT", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];

    day = 15;
    month = 11;
    year = 2016;
    monthDisplay: string = "DEC";

    store = { times: [{ day: 1, month: 1, year: 1 }] };

    addMonth(increment) {
        this.month = (this.month + increment) % 12;
        this.monthDisplay = TimeApp.MONTHS[this.month];
    }

    addDay(increment) {
        this.day = (this.day - 1 + increment) % 31 + 1;
    }

    addYear(increment) {
        this.year += increment;
    }

    submitTime() {
        var { day, month, year } = this;
        this.store.times.push({ day, month, year });

        console.debug("times", this.store.times);
    }
}