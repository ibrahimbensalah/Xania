module App {
    export class CaseManager {
        private cases: Case[] = [];

        constructor() {
            this.cases.push(new Case("Test 1"));
        }
    }

    class Case {
        private contact = new Contact;
        private files: File[] = [ new File ( "aanmaning.doc" ) ];
        constructor(public title: string = "") { }
    }

    class Contact {
        private name: string;
        private address: string;
    }

    class File {
        constructor(public name: string) { }
    }

}
