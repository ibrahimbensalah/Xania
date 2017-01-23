import { Reactive as Re } from '../../src/reactive'

class RatingApp {
    private rating = 6;
    private highlighted = 0;
}

export function store(deps) {
    return new Re.Store(new RatingApp(), deps);
}