exports.use = function (config, options) {
    config.passes.generate.push(
        function () {
            // arguments[0]['code'] += " // bla bla";
        }
    );
}