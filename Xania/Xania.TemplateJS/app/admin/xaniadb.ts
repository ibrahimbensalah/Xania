import { parse } from "../src/compile"

function executeQuery(ast) {
    var init: RequestInit = {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify(ast),
        credentials: "same-origin"
    };

    return fetch("/api/xaniadb", init);
}

function ql(query) {
    return executeQuery(parse(query));
}

export default ql;
export { ql };
