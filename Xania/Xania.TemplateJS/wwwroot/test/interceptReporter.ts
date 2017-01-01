function interceptReporter() {
    var ReSharperReporter = window["ReSharperReporter"];
    (jasmineDone => {
        ReSharperReporter.prototype.jasmineDone = () => {
            var closeButton = document.createElement("button");
            closeButton.innerHTML = "X CLOSE";
            closeButton.style.padding = "10px";
            closeButton.style.position = "absolute";
            closeButton.style.margin = "0px auto";
            closeButton.addEventListener("click",
                () => {
                    try {
                        jasmineDone();
                    } catch (ex) {
                    }
                    window.close();
                });

            var div = document.createElement("div");
            div.style.textAlign = "center";
            div.style.position = "absolute";
            div.style.top = "0";
            div.style.width = "100%";
            div.appendChild(closeButton);
            document.body.appendChild(div);

            document.addEventListener("keypress",
                evt => {
                    if (evt.keyCode === 13) {
                        closeButton.click();
                    }
                });
        };
    })(ReSharperReporter.prototype.jasmineDone);
}

if (document.readyState !== "loading") {
    interceptReporter();
} else {
    document.addEventListener("DOMContentLoaded", interceptReporter);
}
