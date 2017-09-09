import { Repeat, expr } from "../src/xania"
import './grid.css'


export function TextColumn(attrs) {
    if (!attrs.field && !attrs.template)
        throw Error("property field is required");

    var template = attrs.template;
    if (typeof attrs.field === "string")
        template = expr("row."+attrs.field);

    return {
        field: attrs.field,
        template,
        display: attrs.display || attrs.field
    };
}


export class DataList {
    private data = [];
    private activeRow = null;
    private activeRecord = null;
    private onSelectionChanged = null;

    constructor(private attrs, private columns = []) {
    }

    onRowClick = (row) => {
        if (this.activeRow !== row) {
            this.activeRow = row;

            if (this.onSelectionChanged) {
                this.onSelectionChanged(row, this);
            }
        }
    };

    view(xania) {
        return (
            <div id="users" data-modelid="Id" className="xn-grid" role="grid" data-itemheight="31">
                <div className="xn-border-box xn-grid-header" style="z-index: 100">
                    <div role="rowheader" className="xn-grid-row-header xn-grid-header-cell">&nbsp;</div>
                    <Repeat source={expr("for column in columns")}>
                        <div data-idx="UserName" role="gridcell" className="xn-grid-header-cell">
                            <div className="xn-grid-cell-content"><a href>{expr("column.display")}</a></div>
                        </div>
                    </Repeat>
                    <div className="xn-grid-header-cell" style="width: 100%; min-width: 100px">&nbsp;</div>
                </div>

                <div className="xn-list-scrollable" style="overflow: auto; height: 100%;" role="listbox">
                    <div className="xn-content" style="padding-top: 0px; ">
                        <table style="width: 100%;">
                            <tbody data-bind="foreach: view">
                            <Repeat source={expr("for row in data")}>
                                <tr role="listitem"
                                    className={["xn-list-item", expr("row = activeRow -> ' xn-grid-row-activated'"),
                                            expr("row.alternate -> ' xn-grid-row-alternate'"), expr("row.updated -> ' xn-grid-row-updated'")]}>
                                    <td>
                                        <div className="xn-grid-row-header" onClick={expr("onRowClick row")}>
                                            <span className={["fa", expr("row = activeRow -> ' fa-edit'")]}></span>
                                            <input type="radio" style={expr("row = activeRow -> '; display: none'")} />
                                        </div>
                                    </td>
                                    {this.columns.map((column: any) => (
                                            <td role="gridcell" tabindex="-1" className="xn-grid-cell">
                                                <div className="xn-grid-cell-content"><a>{column.template}</a></div>
                                            </td>)
                                    )}
                                    <td role="gridcell" tabindex="-1" className="xn-grid-cell" style="width: 100%;"></td>
                                </tr>
                            </Repeat>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

export default class DataGrid {
    private data = [];
    private activeRow = null;
    private activeRecord = null;
    private onSelectionChanged = null;

    constructor(private attrs, private columns = []) {
    }

    onRowClick = (row) => {
        if (this.activeRow !== row) {
            this.activeRow = row;

            if (this.onSelectionChanged) {
                this.onSelectionChanged(row, this);
            }
        }
    };

    view(xania) {
        return (
            <div id="users" data-modelid="Id" className="xn-grid" role="grid" data-itemheight="31">
                <div className="xn-border-box xn-grid-header" style="z-index: 100">
                    <div role="rowheader" className="xn-grid-row-header xn-grid-header-cell">&nbsp;</div>
                    <Repeat source={expr("for column in columns")}>
                        <div data-idx="UserName" role="gridcell" className="xn-grid-header-cell">
                            <div className="xn-grid-cell-content"><a href>{expr("column.display")}</a></div>
                        </div>
                    </Repeat>
                    <div className="xn-grid-header-cell" style="width: 100%; min-width: 100px">&nbsp;</div>
                </div>

                <div className="xn-list-scrollable" style="overflow: auto; height: 100%;" role="listbox">
                    <div className="xn-content" style="padding-top: 0px; ">
                        <table style="width: 100%;">
                            <tbody data-bind="foreach: view">
                                <Repeat source={expr("for row in data")}>
                                    <tr role="listitem"
                                        className={["xn-list-item", expr("row = activeRow -> ' xn-grid-row-activated'"),
                                            expr("row.alternate -> ' xn-grid-row-alternate'"), expr("row.updated -> ' xn-grid-row-updated'")]}>
                                        <td>
                                            <div className="xn-grid-row-header" onClick={expr("onRowClick row")}>
                                                <span className={["fa", expr("row = activeRow -> ' fa-edit'")]}></span>
                                                <input type="radio" style={expr("row = activeRow -> '; display: none'")} />
                                            </div>
                                        </td>
                                        {this.columns.map((column: any) => (
                                            <td role="gridcell" tabindex="-1" className="xn-grid-cell">
                                                <div className="xn-grid-cell-content"><a>{column.template}</a></div>
                                            </td>)
                                        )}
                                        <td role="gridcell" tabindex="-1" className="xn-grid-cell" style="width: 100%;"></td>
                                    </tr>
                                </Repeat>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}
