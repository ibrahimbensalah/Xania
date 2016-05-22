/// <reference path="../src/core.ts" />

class Employee {
    constructor(public firstName: string, public lastName: string) { }
}
class Company {
    public constructor(public name: string, public employees: Employee[]) {

    }
}
