//import { Reactive as Re } from "../../src/reactive"
//import { fsharp as query } from "../../src/fsharp"
//import { Observables } from "../../src/observables"

//import { Xania, Fragment } from "../../src/xania"

//var view: any =
//    <table className="table table-striped latest-data">
//        <tbody>
//            <Fragment expr={query("for db in databases")}>
//                <tr>
//                    <td className="dbname">
//                        {query("db.dbname")}
//                    </td>
//                    <td className="query-count">
//                        <span className={query("db.lastSample.countClassName")}>
//                            {query("db.lastSample.nbQueries")}
//                        </span>
//                    </td>
//                    <Fragment expr={query("for q in db.lastSample.topFiveQueries")}>
//                        <td className={query("q.elapsedClassName")}>
//                            {query("q.formatElapsed")}
//                            <div className="popover left">
//                                <div className="popover-content">
//                                    {query("q.query")}
//                                </div>
//                                <div className="arrow"></div>
//                            </div>
//                        </td>
//                    </Fragment>
//                </tr>
//            </Fragment>
//        </tbody>
//    </table>;

//export function bind(target: Node) {

//    var store = new Re.Store({
//        time: new Observables.Time()
//    });

//    view.bind(target, store);
//}

