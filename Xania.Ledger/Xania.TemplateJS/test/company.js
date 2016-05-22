/// <reference path="../src/core.ts" />
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
    return Company;
})();
//# sourceMappingURL=company.js.map