/// <reference path="../src/core.ts" />
/// <reference path="../scripts/typings/es6-promise/es6-promise.d.ts" />
var Employee = (function () {
    function Employee(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
    return Employee;
})();
var Company = (function () {
    function Company(name, employees) {
        this.name = name;
        this.employees = employees;
    }
    Company.xania = function () {
        return new Company("Xania", [new Employee("Ibrahim", "ben Salah")]);
    };
    return Company;
})();
var Url = (function () {
    function Url() {
    }
    Url.get = function (href) {
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open("GET", href, true);
            request.onload = function () {
                if (request.status >= 200 && request.status < 400) {
                    // Success!
                    var data = JSON.parse(request.responseText);
                    resolve(data);
                }
                else {
                    // We reached our target server, but it returned an error
                    reject({ status: request.status, statusText: request.statusText });
                }
            };
            request.onerror = function () {
                // There was a connection error of some sort
                reject({ status: request.status, statusText: request.statusText });
            };
            request.send();
        });
    };
    return Url;
})();
//# sourceMappingURL=company.js.map