/// <reference path="../../core.ts" />

@Xania.Component(window['ENV'].generateData(true).toArray())
class DbmonApp {
    databases;
    constructor(data) {
        this.databases = data;
    }
}
