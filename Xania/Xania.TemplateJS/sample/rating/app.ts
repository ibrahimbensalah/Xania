import { Reactive as Re } from '../../src/reactive'
import { Core } from '../../src/core'

class RatingApp {
    private rating = 6;
    private highlighted = 0;
}

export function store() {
    return new Re.Store(new RatingApp(), [ Core.Math ]);
}