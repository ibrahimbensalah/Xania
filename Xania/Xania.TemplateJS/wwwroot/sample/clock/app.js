var ClockApp = (function () {
    function ClockApp() {
        this.timer = new Xania.Data.Timer();
        this.seconds = this.timer.map(ClockApp.getSeconds);
    }
    ClockApp.getSeconds = function (time) {
        var totalSec = Math.floor(time / 1000);
        return totalSec % 60;
    };
    ClockApp.getAngle = function (time) {
        return 360 * ClockApp.getSeconds(time) / 60;
    };
    ClockApp.displayTime = function (time) {
        var totalSec = Math.floor(time / 1000);
        var frac = time % 1000;
        var sec = totalSec % 60;
        var totalMin = Math.floor(totalSec / 60);
        return totalMin + ":" + sec + "," + frac;
    };
    return ClockApp;
}());
//# sourceMappingURL=app.js.map