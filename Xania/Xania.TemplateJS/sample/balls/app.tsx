import { ForEach, fs, Template, Reactive } from "../../src/xania";
import { Animate } from "../../src/anim"

export class BallsApp {

    private balls = [];

    constructor() {
        for (var i = 0; i < 16; i++) {
            var rgb = [100, 100, 100]
                .map(x => x + Math.random() * 150)
                .map(Math.floor);
            this.balls.push(new Ball(i, `rgb(${rgb.join(", ")})`));
        }
    }

    static translate3d(idx, pressed) {
        var x = (idx % 4) * 70;
        var y = Math.floor(idx / 4) * 70;

        var s = pressed ? 1.2 : 1;

        return `translate3d(${x}px, ${y}px, 0px) scale(${s})`;
    }

    static initial(ball) {
        return this.translate3d(ball.idx, ball.pressed);
    }

    onShuffle = () => {
        for (var i = 0; i < this.balls.length; i++) {
            var e = Math.floor(Math.random() * this.balls.length);
            if (e !== i) {
                var t = this.balls[i].idx;
                this.balls[i].idx = this.balls[e].idx;
                this.balls[e].idx = t;
            }
        }
    }

    drag(event, ball, state) {
        var { offsetX, offsetY } = event;
        var node = event.target;
        
        var marginLeft, marginTop, dLeft, dTop, ballIdx;
        if (state && node.style.marginTop !== 0 && node.style.marginLeft !== 0) {
            marginLeft = state.marginLeft;
            marginTop = state.marginTop;
            dLeft = state.dLeft;
            dTop = state.dTop;
            ballIdx = state.ballIdx;
        } else {
            dLeft = offsetX - 25;
            dTop = offsetY - 25;
            marginLeft = 0;
            marginTop = 0;
            ballIdx = ball.idx;
        }

        marginLeft += offsetX - 25 - dLeft;
        marginTop += offsetY - 25 - dTop;

        node.style.marginLeft = marginLeft + "px";
        node.style.marginTop = marginTop + "px";
        node.style.zIndex = 100;


        var x = marginLeft + (ball.idx % 4) * 70;
        var y = marginTop + Math.floor(ball.idx / 4) * 70;

        var col = Math.max(0, Math.min(3, Math.round(x / 70)));
        var row = Math.max(0, Math.min(3, Math.round(y / 70)));
        var newBallIdx = col + row * 4;

        if (ballIdx !== newBallIdx) {
            for (var i = 0; i < this.balls.length; i++) {
                var b = this.balls[i];
                if (ball !== b && b.idx === newBallIdx)
                    b.idx = ballIdx;
            }
            ballIdx = newBallIdx;
        }

        return { marginTop, marginLeft, dLeft, dTop, ballIdx };
    }

    release(event, ball: Ball) {
        if (ball.pressed) {
            ball.pressed = false;
        }
        var node = event.target;
        var top = node.style.marginTop;
        var left = node.style.marginLeft;
        node.style.marginTop = 0;
        node.style.marginLeft = 0;
        node.style.zIndex = 10;

        for (var i = 0; i < this.balls.length; i++) {
            if (!this.balls.find(b => b.idx === i)) {
                var x = (ball.idx % 4) * 70;
                var y = Math.floor(ball.idx / 4) * 70;

                var transform = `translate3d(${left}, ${top}, 0) translate3d(${x}px, ${y}px, 0px) scale(1.2)`;
                node.style.transform = transform;

                ball.idx = i;
                break;
            }
        }
    }

    view(xania) {
        return (
            <div className="balls-outer">
                <div>
                    <button onClick={this.onShuffle}>shuffle</button>
                </div>
                <div className="demo2">
                    <ForEach expr={fs("for ball in balls")}>
                        <Animate transform={fs("translate3d ball.idx ball.pressed")}>
                            <div className="demo2-ball"
                                onMouseDown={fs("ball.press()")}
                                onMouseMove={fs("ball.pressed -> drag event ball state")}
                                onMouseUp={fs("release event ball")}
                                onMouseOut={fs("release event ball")}
                                style={[
                                    "background-color: ", fs("ball.backColor") ,
                                    "; transform: ",
                                    fs("initial ball"),
                                    "; z-index: 10; box-shadow: rgba(0, 0, 0, 0.498039) -0.666667px 5px 5px;"]} >
                            </div>
                        </Animate>
                    </ForEach>

                </div>
            </div>
        );
    }
}

class Ball {
    constructor(public idx: number, public backColor) {
    }

    pressed = false;

    press() {
        this.pressed = true;
    }
}