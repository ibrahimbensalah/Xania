import { ForEach, fs } from "../src/xania"
import './grid.css'

export default class DataGrid {
    private data = [];
    private columns = [];
    private activeRow = null;
    private onRowChanged = null;

    constructor() {
        this.columns.push({ field: "Name" });
        this.columns.push({ field: "Email" });
        this.columns.push({ field: "Roles" });

        // EmailConfirmed

        for (var e = 0; e < 100; e++) {
            this.data.push({
                idx: e,
                data: { Id: e, Name: `User ${e}`, Email: `user${e}@xania.nl`, Roles: ["Role 1", "Role 12"], EmailConfirmed: e % 3 === 0 },
                get(field) {
                    return this.data[field];
                },
                alternate: e % 2 === 0
            });
        }
    }

    onRowClick = (event, context) => {
        var activeRow = context.get('row').valueOf();
        this.activeRow = activeRow;
        event.preventDefault();

        if (typeof this.onRowChanged === "function") {
            this.onRowChanged(activeRow, this);
        }
    };

    view(xania) {
        return (
            <div id="users" data-modelid="Id" className="xn-grid" role="grid" data-itemheight="31">
                <div className="xn-border-box xn-grid-header" style="z-index: 100">
                    <div role="rowheader" className="xn-grid-row-header xn-grid-header-cell">&nbsp;</div>
                    <ForEach expr={fs("for column in columns")}>
                        <div data-idx="UserName" role="gridcell" className="xn-grid-header-cell">
                            <div className="xn-grid-cell-content"><a data-bind="click: sort.bind($data, 'UserName')">{fs("column.field")}</a></div>
                        </div>
                    </ForEach>
                    <div className="xn-grid-header-cell" style="width: 100%; min-width: 100px">&nbsp;</div>
                </div>

                <div className="xn-list-scrollable" style="overflow: auto; height: 100%;" role="listbox">
                    <div className="xn-content" style="padding-top: 0px; ">
                        <table style="width: 100%;">
                            <tbody data-bind="foreach: view">
                                <ForEach expr={fs("for row in data")}>
                                    <tr role="listitem"
                                        onClick={this.onRowClick}
                                        className={["xn-list-item", fs("row = activeRow -> ' xn-grid-row-activated'"),
                                                fs("row.alternate -> ' xn-grid-row-alternate'"), fs("row.updated -> ' xn-grid-row-updated'")]}>
                                        <td>
                                            <div className="xn-grid-row-header">
                                                <span className={["fa", fs("row = activeRow -> ' fa-edit'")]}></span>
                                            </div>
                                        </td>
                                        <ForEach expr={fs("for column in columns")}>
                                            <td role="gridcell" tabindex="-1" className="xn-grid-cell">
                                                <div className="xn-grid-cell-content"><a href="#">{fs("row.get column.field")}</a></div>
                                            </td>
                                        </ForEach>
                                        <td role="gridcell" tabindex="-1" className="xn-grid-cell" style="width: 100%;"></td>
                                    </tr>
                                </ForEach>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

export function bla() { }