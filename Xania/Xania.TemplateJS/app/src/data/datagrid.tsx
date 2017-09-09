import xania, { Repeat, expr } from "../xania"
import { UrlHelper } from "../mvc"
import './datagrid.min.css'

interface IDataColumn {
    name: string;
    template: any;
    display: string;
}

export function TextColumn(attrs): IDataColumn {
    if (!attrs.field && !attrs.template)
        throw Error("property field is required");

    var template = attrs.template;
    if (typeof attrs.field === "string" && !template)
        template = expr("row." + attrs.field);

    return {
        name: attrs.field ? attrs.field.toLowerCase() : "default",
        template,
        display: attrs.display || attrs.field
    };
}

export function RemoveColumn(attrs): IDataColumn {

    function removeLine(evt, context) {
        var data: any[] = context.get('data').valueOf();
        var row = context.get('row').valueOf();

        var idx = data.indexOf(row);
        console.debug('remove idx', idx);
        if (idx >= 0)
            data.splice(idx, 1);
    }

    return {
        name: "",
        template: <a onClick={removeLine}>&times;</a>,
        display: ""
    };
}

export default class DataGrid {
    private data = [];
    private activeRow = null;
    private activeRecord = null;
    private onSelectionChanged = null;

    constructor(private attrs, private columns: IDataColumn[] = []) {
        console.debug("datagrid columns", columns);
    }

    private activateRow = (row) => {
        if (this.activeRow !== row) {
            this.activeRow = row;

            if (this.onSelectionChanged) {
                this.onSelectionChanged(row, this);
            }
        }
    };

    private onRowClick = [expr("activateRow row")];

    view(xania) {
        return (
            <div className="data-grid" role="grid" style={this.attrs.style || ""}>
                <div className="data-grid-header" style="z-index: 100">
                    <div role="rowheader" className="data-grid-row-header">&nbsp;</div>

                    {this.columns.map(column =>
                        <div role="gridcell" className={"data-grid-cell data-grid-column-" + column.name}>
                            <div className="data-grid-cell-content"><a >{column.display}</a>
                            </div>
                        </div>
                    )}
                    <div className="data-grid-header-column" style="flex: 1">&nbsp;</div>
                </div>
                <div className="data-grid-content" style="padding-top: 0px; ">
                    <Repeat source={expr("for row in data")}>
                        <div className={["data-grid-row", expr("row = activeRow -> ' data-grid-row-selected'")]}
                            onTouchStart={this.onRowClick} onClick={this.onRowClick}>
                            <div role="rowheader" className="data-grid-row-header">
                                <span className={["fa", expr("row = activeRow -> ' fa-edit'")]}></span>
                            </div>
                            {this.columns.map(column =>
                                <div role="gridcell" className={"data-grid-cell data-grid-column-" + column.name}>
                                    <div className="data-grid-cell-content"><a>{column.template}</a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Repeat>
                </div>
            </div>
        );
    }
}