/// <reference path="../src/core.ts" />
/// <reference path="../Scripts/typings/es6-shim/es6-shim.d.ts" />

class A {
    getZero() {
        return 0;
    }
}

class Role {
    constructor(public prefix, public emp: Employee) { }

    get name() {
        return this.emp.firstName;
    }
}

class Employee {
    roles: Role[];

    constructor(public firstName: string, public lastName: string) {
        this.roles = [new Role("admin", this), new Role("user", this)];
    }

    get fullName() {
        return this.firstName + " " + this.lastName;
    }

    sayHello(prefix) {
        console.log("hallo ", this.fullName);
    }

    getName() {
        return this.fullName;
    }
}
class Company extends A {
    public constructor(public name: string, public employees: Employee[]) {
        super();
    }

    static xania() {
        return new Company("Xania", [
            new Employee("Ibrahim", "ben Salah"),
            new Employee("Ramy", "ben Salah"),
            new Employee("Rania", "ben Salah")
        ]);
    }

    static globalgis() {
        return new Company("Global GIS", [
            new Employee("Abeer", "Mahdi")
        ]);
    }

    getName() {
        return this.name;
    }

    count() {
        return this.employees.length;
    }
}
class Url {
    static dummy(x) {
        return x;
    }
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

class OrganisationViewModel {

    private name: string;
    private employees: Employee[];

    getName() {
        return this.name;
    }

    addEmployee() {
        this.employees.push(new Employee('bla', 'di bla'));
        console.log(this.employees.length);
    }
}

