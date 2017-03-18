import xania, { If } from "../src/xania"

export function Section(attrs, children) {
    return (
        <section className="section" style="height: 100%">
            <If expr={attrs.onCancel}>
                <button type="button" className="close" aria-hidden="true" style="margin: 16px 16px 0 0;" onClick={attrs.onCancel}>×</button>
            </If>
            <header style="height: 50px"><span className="fa fa-adjust"></span> <span>{attrs.title || 'Untitled'}</span></header>
            <div style="padding: 0px 16px 100px 16px; height: 100%;">
                {children}
            </div>
        </section>
    );
}

