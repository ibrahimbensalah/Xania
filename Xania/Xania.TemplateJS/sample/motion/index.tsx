

export class MotionApp {
    static run() {
        var document: any = window.document;
        var elements = document.querySelectorAll('.motion-wrapper .js li');
        var animations = [];
        for (var i = 0, len = elements.length; i < len; ++i) {
            var animation = elements[i]
                .animate([
                        {
                            transform: 'rotate(0deg)',
                            offset: 0
                        }, {
                            transform: 'rotate(-12deg)',
                            offset: .08
                        }, {
                            transform: 'rotate(270deg)',
                            offset: .3
                        }, {
                            transform: 'rotate(-40deg)',
                            offset: .55
                        }, {
                            transform: 'rotate(70deg)',
                            offset: .8
                        }, {
                            transform: 'rotate(-13deg)',
                            offset: .92
                        }, {
                            transform: 'rotate(0deg)',
                            offset: 1
                        }
                    ],
                    {
                        duration: 3000,
                        iterations: Infinity,
                        easing: 'linear',
                        delay: 0
                    });
            animations.push(animation);
        }
    }
    view(xania) {
        return (
            <div className="motion-wrapper">
                <div><button onClick={MotionApp.run}>run</button></div>
                <div>
                    <div>js animation</div>
                    <ul className="js">
                        <li>1</li>
                        <li>2</li>
                    </ul>
                </div>
                <div>
                    <div>css animation</div>
                    <ul className="css activated">
                        <li>6</li>
                        <li>6</li>
                    </ul>
                </div>
            </div>
        );
    }
}