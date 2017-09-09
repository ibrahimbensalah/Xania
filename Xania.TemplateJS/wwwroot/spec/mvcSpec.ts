import { dataReady, View, Router } from "../src/mvc";

describe("test",
    () => {
        it("router",
            () => {
                function asPromise(data) {
                    var promise = {
                        then(fn) {
                            return fn(data);
                        }
                    };
                    return promise;
                }

                var tom = () => asPromise(View({ name: "tom" }));
                var users = () => asPromise(View({ name: "users" }).route({ tom }));

                var router = new Router("");
                router.start({ users }, "").subscribe(views => {
                    expect(views[0].template.view.name).toBe("users");
                    expect(views[1].template.view.name).toBe("tom");
                });
                router.action("/users/tom");
            });
    });