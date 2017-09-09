var module = { exports: <any>{} };

function interceptReporter() {
    var ReSharperReporter = window["ReSharperReporter"];
    (jasmineDone => {
        ReSharperReporter.prototype.jasmineDone = doneArgs => {
            if (ReSharperReporter.autoClose) {
                jasmineDone.apply(this, doneArgs);
                window.close();
                return;
            }
            var jasmineThis = this;
            var closeButton = document.createElement("button");
            closeButton.innerHTML = "X CLOSE";
            closeButton.style.padding = "10px";
            closeButton.style.position = "absolute";
            closeButton.style.margin = "0px auto";
            closeButton.addEventListener("click",
                () => {
                    try {
                        jasmineDone.apply(jasmineThis, doneArgs);
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

            (<any>document).addEventListener("keypress",
                (evt:any) => {
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
    (<any>document).addEventListener("DOMContentLoaded", interceptReporter);
}
