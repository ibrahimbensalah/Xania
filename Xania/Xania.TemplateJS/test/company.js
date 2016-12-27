/// <reference path="../wwwroot/src/dom.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var A = (function () {
    function A() {
    }
    A.prototype.getZero = function () {
        return 0;
    };
    return A;
}());
var Role = (function (_super) {
    __extends(Role, _super);
    function Role(prefix, emp) {
        _super.call(this);
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
}(A));
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
    Object.defineProperty(Employee.prototype, "random", {
        get: function () {
            return Math.random();
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
}());
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
    Company.prototype.addEmployee = function () {
        this.employees.push(new Employee('bla ' + this.employees.length, 'di bla'));
    };
    Company.prototype.clearFirstNames = function () {
        var employees = this.employees;
        for (var idx in employees) {
            if (employees.hasOwnProperty(idx)) {
                var emp = employees[idx];
                emp.firstName = "";
            }
        }
    };
    return Company;
}(A));
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
}());
var OrganisationViewModel = (function () {
    function OrganisationViewModel() {
    }
    OrganisationViewModel.prototype.addEmployee = function () {
        this.employees.push(new Employee('bla', 'di bla'));
    };
    OrganisationViewModel.prototype.clearFirstNames = function () {
        var employees = this.employees;
        for (var idx in employees) {
            if (employees.hasOwnProperty(idx)) {
                var emp = employees[idx];
                emp.firstName = "";
            }
        }
    };
    return OrganisationViewModel;
}());
var ObserverHelper = (function () {
    function ObserverHelper() {
        this.reads = new Map();
        this.changes = new Map();
    }
    ObserverHelper.prototype.setRead = function (obj, prop) {
        if (!this.reads.has(obj)) {
            this.reads.set(obj, [prop]);
        }
        else if (this.reads.get(obj).indexOf(prop) < 0) {
            this.reads.get(obj).push(prop);
        }
    };
    ObserverHelper.prototype.setChange = function (obj, prop) {
        if (!this.changes.has(obj)) {
            this.changes.set(obj, [prop]);
        }
        else if (this.changes.get(obj).indexOf(prop) < 0) {
            this.changes.get(obj).push(prop);
        }
    };
    ObserverHelper.prototype.hasRead = function (context, prop) {
        if (this.reads.has(context)) {
            if (prop === null)
                return true;
            return this.reads.get(context).indexOf(prop) >= 0;
        }
        return false;
    };
    ObserverHelper.prototype.hasChange = function (context, prop) {
        if (this.changes.has(context)) {
            if (prop === null)
                return true;
            return this.changes.get(context).indexOf(prop) >= 0;
        }
        return false;
    };
    return ObserverHelper;
}());
