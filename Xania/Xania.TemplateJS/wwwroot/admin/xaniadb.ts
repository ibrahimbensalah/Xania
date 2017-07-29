import { parse } from "../src/compile"

function executeQuery(ast) {
    var config = {
        method: "POST",
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify(ast)
    };

    return fetch("/api/xaniadb", config);
}

function ql(query) {
    return executeQuery(parse(query));
}

export default ql;
export { ql };
