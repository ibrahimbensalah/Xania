/// <reference path="../src/core.ts" />
/// <reference path="../Scripts/typings/es6-shim/es6-shim.d.ts" />
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
var Role = (function () {
    function Role(prefix, emp) {
        this.prefix = prefix;
        this.emp = emp;
    }
    Object.defineProperty(Role.prototype, "name", {
        get: function () {
            return this.emp.firstName;
        },
        enumerable: true,
        configurable: true
    });
    return Role;
})();
var Employee = (function () {
    function Employee(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.roles = [new Role("admin", this), new Role("user", this)];
    }
    Object.defineProperty(Employee.prototype, "fullName", {
        get: function () {
            return this.firstName + " " + this.lastName;
        },
        enumerable: true,
        configurable: true
    });
    Employee.prototype.sayHello = function (prefix) {
        console.log("hallo ", this.fullName);
    };
    Employee.prototype.getName = function () {
        return this.fullName;
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
            new Employee("Ramy", "ben Salah"),
            new Employee("Rania", "ben Salah")
        ]);
    };
    Company.globalgis = function () {
        return new Company("Global GIS", [
            new Employee("Abeer", "Mahdi")
        ]);
    };
    Company.prototype.getName = function () {
        return this.name;
    };
    Company.prototype.count = function () {
        return this.employees.length;
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
                    var data = JSON.parse(request.responseText);
                    resolve(data);
                }
                else {
                    reject({ status: request.status, statusText: request.statusText });
                }
            };
            request.onerror = function () {
                reject({ status: request.status, statusText: request.statusText });
            };
            request.send();
        });
    };
    return Url;
})();
var OrganisationViewModel = (function () {
    function OrganisationViewModel() {
    }
    OrganisationViewModel.prototype.getName = function () {
        return this.name;
    };
    OrganisationViewModel.prototype.addEmployee = function () {
        this.employees.push(new Employee('bla', 'di bla'));
        console.log(this.employees.length);
    };
    return OrganisationViewModel;
})();
//# sourceMappingURL=company.js.map