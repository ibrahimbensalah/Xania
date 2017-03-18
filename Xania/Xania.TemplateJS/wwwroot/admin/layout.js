"use strict";
var xania_1 = require("../src/xania");
function Section(attrs, children) {
    return (xania_1.default.tag("section", { className: "section", style: "height: 100%" },
        xania_1.default.tag(xania_1.If, { expr: attrs.onCancel },
            xania_1.default.tag("button", { type: "button", className: "close", "aria-hidden": "true", style: "margin: 16px 16px 0 0;", onClick: attrs.onCancel }, "\u00D7")),
        xania_1.default.tag("header", { style: "height: 50px" },
            xania_1.default.tag("span", { className: "fa fa-adjust" }),
            " ",
            xania_1.default.tag("span", null, attrs.title || 'Untitled')),
        xania_1.default.tag("div", { style: "padding: 0px 16px 100px 16px; height: 100%;" }, children)));
}
exports.Section = Section;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGF5b3V0LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsc0NBQXdDO0FBRXhDLGlCQUF3QixLQUFLLEVBQUUsUUFBUTtJQUNuQyxNQUFNLENBQUMsQ0FDSCxpQ0FBUyxTQUFTLEVBQUMsU0FBUyxFQUFDLEtBQUssRUFBQyxjQUFjO1FBQzdDLG9CQUFDLFVBQUUsSUFBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFFBQVE7WUFDcEIsZ0NBQVEsSUFBSSxFQUFDLFFBQVEsRUFBQyxTQUFTLEVBQUMsT0FBTyxpQkFBYSxNQUFNLEVBQUMsS0FBSyxFQUFDLHdCQUF3QixFQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsUUFBUSxhQUFZLENBQzVIO1FBQ0wsZ0NBQVEsS0FBSyxFQUFDLGNBQWM7WUFBQyw4QkFBTSxTQUFTLEVBQUMsY0FBYyxHQUFROztZQUFDLGtDQUFPLEtBQUssQ0FBQyxLQUFLLElBQUksVUFBVSxDQUFRLENBQVM7UUFDckgsNkJBQUssS0FBSyxFQUFDLDZDQUE2QyxJQUNuRCxRQUFRLENBQ1AsQ0FDQSxDQUNiLENBQUM7QUFDTixDQUFDO0FBWkQsMEJBWUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeGFuaWEsIHsgSWYgfSBmcm9tIFwiLi4vc3JjL3hhbmlhXCJcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBTZWN0aW9uKGF0dHJzLCBjaGlsZHJlbikge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzZWN0aW9uXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5cclxuICAgICAgICAgICAgPElmIGV4cHI9e2F0dHJzLm9uQ2FuY2VsfT5cclxuICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImNsb3NlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCIgc3R5bGU9XCJtYXJnaW46IDE2cHggMTZweCAwIDA7XCIgb25DbGljaz17YXR0cnMub25DYW5jZWx9PsOXPC9idXR0b24+XHJcbiAgICAgICAgICAgIDwvSWY+XHJcbiAgICAgICAgICAgIDxoZWFkZXIgc3R5bGU9XCJoZWlnaHQ6IDUwcHhcIj48c3BhbiBjbGFzc05hbWU9XCJmYSBmYS1hZGp1c3RcIj48L3NwYW4+IDxzcGFuPnthdHRycy50aXRsZSB8fCAnVW50aXRsZWQnfTwvc3Bhbj48L2hlYWRlcj5cclxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDBweCAxNnB4IDEwMHB4IDE2cHg7IGhlaWdodDogMTAwJTtcIj5cclxuICAgICAgICAgICAgICAgIHtjaGlsZHJlbn1cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgKTtcclxufVxyXG5cclxuIl19