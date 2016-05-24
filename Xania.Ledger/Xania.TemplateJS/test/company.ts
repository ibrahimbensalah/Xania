/// <reference path="../src/core.ts" />
/// <reference path="../scripts/typings/es6-promise/es6-promise.d.ts" />

class A {
    getZero() {
        return 0;
    }
}
class Employee {
    constructor(public firstName: string, public lastName: string) {
    }
}
class Company extends A {
    public constructor(public name: string, public employees: Employee[]) {
        super();
    }

    static xania() {
        return new Company("Xania", [new Employee("Ibrahim", "ben Salah")]);
    }

    getName() {
        return this.name;
    }
}
class Url {
    static get(href) {
        return new Promise((resolve: any, reject) => {
            var request = new XMLHttpRequest();
            request.open("GET", href, true);
            request.onload =  () => {
                if (request.status >= 200 && request.status < 400) {
                    // Success!
                    var data = JSON.parse(request.responseText);
                    resolve(data);
                } else {
                    // We reached our target server, but it returned an error
                    reject({ status: request.status, statusText: request.statusText });
                }
            };
            request.onerror = () => {
                // There was a connection error of some sort
                reject({ status: request.status, statusText: request.statusText });
            };

            request.send();
        });
    }
}