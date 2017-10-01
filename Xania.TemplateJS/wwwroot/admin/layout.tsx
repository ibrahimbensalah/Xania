import xania, { If, Repeat, expr } from "../src/xania"
import Html from '../src/html'
import { StackContainer } from "../layout/stack"

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

var layout = source => (
    <div class="stack-viewport">
        <StackContainer className="stack-container">
            <Repeat param="vw" source={source}>
                <section className="stack-item">
                    <div className="stack-item-content">
                        <header className="stack-item-header">Header 1</header>
                        <div className="stack-item-body">
                            <Html.Partial template={expr("await vw")} />
                        </div>
                    </div>
                </section>
            </Repeat>
        </StackContainer>
    </div>
) as { bind };

export default layout;
