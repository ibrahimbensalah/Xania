/// <reference path="../src/binding.ts" />

class A {
    getZero() {
        return 0;
    }
}

class Role extends A {
    constructor(public prefix, public emp: Employee) {
        super();
    }

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

    get random() {
        return Math.random();
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

    addEmployee() {
        this.employees.push(new Employee('bla ' + this.employees.length, 'di bla'));
    }

    clearFirstNames() {
        let employees = this.employees;
        for (var idx in employees) {
            if (employees.hasOwnProperty(idx)) {
                var emp = employees[idx];
                emp.firstName = "";
            }
        }
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

    addEmployee() {
        this.employees.push(new Employee('bla', 'di bla'));
    }

    clearFirstNames() {
        let employees = this.employees;
        for (var idx in employees) {
            if (employees.hasOwnProperty(idx)) {
                var emp = employees[idx];
                emp.firstName = "";
            }
        }
    }
}

class ObserverHelper {
    public reads = new Map<any, string[]>();
    public changes = new Map<any, string[]>();

    setRead(obj: any, prop: string) {
        if (!this.reads.has(obj)) {
            this.reads.set(obj, [prop]);
        } else if (this.reads.get(obj).indexOf(prop) < 0) {
            this.reads.get(obj).push(prop);
        }
    }

    setChange(obj: any, prop: any) {
        if (!this.changes.has(obj)) {
            this.changes.set(obj, [prop]);
        } else if (this.changes.get(obj).indexOf(prop) < 0) {
            this.changes.get(obj).push(prop);
        }
    }

    hasRead(context, prop: string) {
        if (this.reads.has(context)) {
            if (prop === null)
                return true;

            return this.reads.get(context).indexOf(prop) >= 0;
        }
        return false;
    }

    hasChange(context, prop: string) {
        if (this.changes.has(context)) {
            if (prop === null)
                return true;

            return this.changes.get(context).indexOf(prop) >= 0;
        }
        return false;
    }
}
