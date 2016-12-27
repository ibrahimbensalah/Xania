var DonutApp = (function () {
    function DonutApp() {
        this.opacity = 0.5;
    }
    DonutApp.plot = function (start, end) {
        var startAngle = start * 2 * Math.PI;
        var endAngle = end * 2 * Math.PI;
        var innerRadius = 20, outerRadius = 45;
        function getPoint(angle, radius) {
            return ((radius * Math.sin(angle)).toFixed(2) + ',' + (radius * -Math.cos(angle)).toFixed(2));
        }
        var points = [];
        var angle;
        // get points along the outer edge of the segment
        for (angle = startAngle; angle < endAngle; angle += 0.05) {
            points.push(getPoint(angle, outerRadius));
        }
        points.push(getPoint(endAngle, outerRadius));
        // get points along the inner edge of the segment
        for (angle = endAngle; angle > startAngle; angle -= 0.05) {
            points.push(getPoint(angle, innerRadius));
        }
        points.push(getPoint(startAngle, innerRadius));
        // join them up as an SVG points list
        return points.join(' ');
    };
    return DonutApp;
}());
