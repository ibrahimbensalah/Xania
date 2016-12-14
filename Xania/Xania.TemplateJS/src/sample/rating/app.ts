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
