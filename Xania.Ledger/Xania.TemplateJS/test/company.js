/// <reference path="../src/core.ts" />
/// <reference path="../scripts/typings/es6-promise/es6-promise.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var A = (function () {
    function A() {
    }
    A.prototype.getZero = function () {
        return 0;
    };
    return A;
})();
var Employee = (function () {
    function Employee(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
    Object.defineProperty(Employee.prototype, "roles", {
        get: function () {
            return [this.firstName, this.lastName];
        },
        enumerable: true,
        configurable: true
    });
    Employee.prototype.sayHello = function (prefix) {
        alert(prefix + " : " + this.firstName);
    };
    return Employee;
})();
var Company = (function (_super) {
    __extends(Company, _super);
    function Company(name, employees) {
        _super.call(this);
        this.name = name;
        this.employees = employees;
    }
    Company.xania = function () {
        return new Company("Xania", [
            new Employee("Ibrahim", "ben Salah"),
            new Employee("Abeer", "Mahdi")
        ]);
    };
    Company.prototype.getName = function () {
        return this.name;
    };
    return Company;
})(A);
var Url = (function () {
    function Url() {
    }
    Url.dummy = function (x) {
        return x;
    };
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