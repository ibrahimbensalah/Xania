var App;
(function (App) {
    var CaseManager = (function () {
        function CaseManager() {
            this.cases = [];
            this.cases.push(new Case("Test 1"));
        }
        return CaseManager;
    })();
    App.CaseManager = CaseManager;
    var Case = (function () {
        function Case(title) {
            if (title === void 0) { title = ""; }
            this.title = title;
            this.contact = new Contact;
            this.files = [new File("aanmaning.doc")];
        }
        return Case;
    })();
    var Contact = (function () {
        function Contact() {
        }
        return Contact;
    })();
    var File = (function () {
        function File(name) {
            this.name = name;
        }
        return File;
    })();
})(App || (App = {}));
