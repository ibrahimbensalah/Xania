import xania, { RemoteDataSource, List, expr, Reactive as Re } from "../src/xania"
import { UrlHelper, View } from "../src/mvc"
import './admin.css'
import { Observables } from "../src/observables";
import { ClockApp } from '../sample/clock/app'
import TodoApp from "../sample/todos/app";
import { GraphApp } from "../diagram/lib";
import BallsApp from "../sample/balls/app";
import defaultLayout from "./layout";
import { parse } from "../src/compile";

export function menu({ driver, html, url }) {
    return mainMenu(url)
        .bind(driver)
        .update(new Re.Store({}));
}

interface IAppAction {
    path: string,
    display?: string;
    icon?: string;
}

declare function fetch<T>(url: string, config?): Promise<T>;

var actions: IAppAction[] = [
    // { path: "companies", display: "Companies" },
    // { path: "users", display: "Users" }
];

function menuItems() {
    var config = {
        method: "POST",
        headers: { 'Content-Type': "application/json" },
        body: JSON.stringify(parse("menuItems")),
        credentials: 'same-origin'
    };

    return fetch('/api/xaniadb', config)
        .then((response: any) => {
            return response.json();
        });
}

function goto(url, path) {
    document.body.classList.remove('sidebar-mobile-show');
    return url.goto(path);
}

var mainMenu: (url: UrlHelper) => any = (url: UrlHelper) =>
    <ul className="nav">
        <li className="nav-title">
            Demos
        </li>
        {menuItems().then(items => (
            <List source={items}>
                <li className="nav-item">
                    <a className="nav-link" href="" onClick={expr("goto path", { goto: ((path) => goto(url, path)) })}><i className={"icon-star"}></i> {expr("display")}</a>
                </li>
            </List>
        ))}
        {actions.map(x => (
            <li className="nav-item">
                <a className="nav-link" href="" onClick={url.action(x.path)}><i className={x.icon || "icon-star"}></i> {x.display || x.path}</a>
            </li>))}
        <li className="nav-item">
            <a className="nav-link" href="/sample/dbmon/index.html"><i className="icon-star"></i> dbmon</a>
        </li>
    </ul>;

export function index() {
    var model = new Re.Store({ x: "46.34375", title: "Dashboard" });
    return View(
        <div id="area-chart" style="position: relative;">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" style="overflow: hidden; position: relative; top: -0.333333px; width: 1239px; height: 231px">
                <desc style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">Created with Raphaël 2.1.2</desc>
                <defs style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></defs>
                <text x="33.84375" y="217.671875" text-anchor="end" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: end; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">0</tspan></text>
                <path fill="none" stroke="#aaaaaa" d="M0,217.671875H1214" stroke-width="0.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></path>
                <text x="33.84375" y="169.50390625" text-anchor="end" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: end; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal"><tspan dy="3.99609375" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">50</tspan></text>
                <path fill="none" stroke="#aaaaaa" d="M0,169.50390625H1214" stroke-width="0.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></path>
                <text x="33.84375" y="121.3359375" text-anchor="end" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: end; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal"><tspan dy="4" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">100</tspan></text>
                <path fill="none" stroke="#aaaaaa" d="M0,121.3359375H1214" stroke-width="0.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></path><text x="33.84375" y="73.16796875" text-anchor="end" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: end; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal"><tspan dy="4.00390625" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">150</tspan></text>
                <path fill="none" stroke="#aaaaaa" d="M0,73.16796875H1214" stroke-width="0.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></path><text x="33.84375" y="25" text-anchor="end" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: end; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">200</tspan></text>
                <path fill="none" stroke="#aaaaaa" d="M0,25H1214" stroke-width="0.5" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></path>
                <text x="1214" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2024</tspan></text>
                <text x="1097.2983211254107" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2023</tspan></text>
                <text x="980.5966422508214" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2022</tspan></text>
                <text x="863.8949633762321" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2021</tspan></text>
                <text x="746.8735538745892" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2020</tspan></text>
                <text x="630.171875" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2019</tspan></text>
                <text x="513.4701961254107" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2018</tspan></text>
                <text x="396.76851725082145" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2017</tspan></text>
                <text x="279.74710774917855" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2016</tspan></text>
                <text x="163.04542887458928" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2015</tspan></text>
                <text x="{{x}}" y="230.171875" text-anchor="middle" font="10px &quot;Arial&quot;" stroke="none" fill="#888888" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); text-anchor: middle; font-style: normal; font-variant: normal; font-weight: normal; font-stretch: normal; font-size: 12px; line-height: normal; font-family: sans-serif;" font-size="12px" font-family="sans-serif" font-weight="normal" transform="matrix(1,0,0,1,0,6.6641)"><tspan dy="3.9921875" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);">2014</tspan></text>
                <path fill="#999999" stroke="none" d="M0,169.50390625C75.51916971864732,165.89130859375,133.87000915594194,155.053515625,163.04542887458928,155.053515625C192.2208485932366,155.053515625,250.57168803053122,170.7064581373974,279.74710774917855,169.50390625C309.0024601245893,168.2980596998974,367.5131648754107,149.0374615253078,396.76851725082145,145.419921875C425.9439369694687,141.8122662128078,484.2947764067634,142.409423828125,513.4701961254107,140.603125C542.645615844058,138.796826171875,600.9964552813526,133.3779296875,630.171875,130.96953125C659.3472947186473,128.56113281249998,717.698134155942,124.3423172184935,746.8735538745892,121.3359375C776.12890625,118.3213211247435,834.6396110008213,109.2972399752052,863.8949633762321,106.885546875C893.0703830948794,104.48044310020519,951.4212225321742,105.68134765625,980.5966422508214,102.06875C1009.7720619694687,98.45615234374999,1068.1229014067633,82.80156249999999,1097.2983211254107,77.984765625C1126.473740844058,73.16796875,1184.8245802813526,67.14697265625,1214,63.53437500000001L1214,217.671875L{{x}},217.671875Z" fill-opacity="0.6" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); fill-opacity: 0.6;"></path>
                <path fill="none" stroke="#808080" d="M0,169.50390625C75.51916971864732,165.89130859375,133.87000915594194,155.053515625,163.04542887458928,155.053515625C192.2208485932366,155.053515625,250.57168803053122,170.7064581373974,279.74710774917855,169.50390625C309.0024601245893,168.2980596998974,367.5131648754107,149.0374615253078,396.76851725082145,145.419921875C425.9439369694687,141.8122662128078,484.2947764067634,142.409423828125,513.4701961254107,140.603125C542.645615844058,138.796826171875,600.9964552813526,133.3779296875,630.171875,130.96953125C659.3472947186473,128.56113281249998,717.698134155942,124.3423172184935,746.8735538745892,121.3359375C776.12890625,118.3213211247435,834.6396110008213,109.2972399752052,863.8949633762321,106.885546875C893.0703830948794,104.48044310020519,951.4212225321742,105.68134765625,980.5966422508214,102.06875C1009.7720619694687,98.45615234374999,1068.1229014067633,82.80156249999999,1097.2983211254107,77.984765625C1126.473740844058,73.16796875,1184.8245802813526,67.14697265625,1214,63.53437500000001" stroke-width="3" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></path><circle cx="{{x}}" cy="169.50390625" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="163.04542887458928" cy="155.053515625" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="279.74710774917855" cy="169.50390625" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="396.76851725082145" cy="145.419921875" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="513.4701961254107" cy="140.603125" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="630.171875" cy="130.96953125" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="746.8735538745892" cy="121.3359375" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="863.8949633762321" cy="106.885546875" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="980.5966422508214" cy="102.06875" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="1097.2983211254107" cy="77.984765625" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="1214" cy="63.53437500000001" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle><path fill="#f43d3d" stroke="none" d="M{{x}},130.96953125C75.51916971864732,134.58212890624998,133.87000915594194,140.603125,163.04542887458928,145.419921875C192.2208485932366,150.23671875,250.57168803053122,167.7000784189039,279.74710774917855,169.50390625C309.0024601245893,171.3126760751539,367.5131648754107,161.6790823251539,396.76851725082145,159.8703125C425.9439369694687,158.0664846689039,484.2947764067634,156.25771484375,513.4701961254107,155.053515625C542.645615844058,153.84931640624998,600.9964552813526,151.44091796875,630.171875,150.23671875C659.3472947186473,149.03251953125,717.698134155942,146.0211978186987,746.8735538745892,145.419921875C776.12890625,144.8169985999487,834.6396110008213,146.6257684251026,863.8949633762321,145.419921875C893.0703830948794,144.2173699876026,951.4212225321742,136.99052734375002,980.5966422508214,135.786328125C1009.7720619694687,134.58212890625,1068.1229014067633,136.99052734375002,1097.2983211254107,135.786328125C1126.473740844058,134.58212890625,1184.8245802813526,128.5611328125,1214,126.152734375L1214,217.671875L{{x}},217.671875Z" fill-opacity="0.6" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0); fill-opacity: 0.6;"></path>
                <path fill="none" stroke="#ff0000" d="M{{x}},130.96953125C75.51916971864732,134.58212890624998,133.87000915594194,140.603125,163.04542887458928,145.419921875C192.2208485932366,150.23671875,250.57168803053122,167.7000784189039,279.74710774917855,169.50390625C309.0024601245893,171.3126760751539,367.5131648754107,161.6790823251539,396.76851725082145,159.8703125C425.9439369694687,158.0664846689039,484.2947764067634,156.25771484375,513.4701961254107,155.053515625C542.645615844058,153.84931640624998,600.9964552813526,151.44091796875,630.171875,150.23671875C659.3472947186473,149.03251953125,717.698134155942,146.0211978186987,746.8735538745892,145.419921875C776.12890625,144.8169985999487,834.6396110008213,146.6257684251026,863.8949633762321,145.419921875C893.0703830948794,144.2173699876026,951.4212225321742,136.99052734375002,980.5966422508214,135.786328125C1009.7720619694687,134.58212890625,1068.1229014067633,136.99052734375002,1097.2983211254107,135.786328125C1126.473740844058,134.58212890625,1184.8245802813526,128.5611328125,1214,126.152734375" stroke-width="3" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></path><circle cx="{{x}}" cy="130.96953125" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="163.04542887458928" cy="145.419921875" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="279.74710774917855" cy="169.50390625" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="396.76851725082145" cy="159.8703125" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="513.4701961254107" cy="155.053515625" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="630.171875" cy="150.23671875" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="746.8735538745892" cy="145.419921875" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="863.8949633762321" cy="145.419921875" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="980.5966422508214" cy="135.786328125" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="1097.2983211254107" cy="135.786328125" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
                <circle cx="1214" cy="126.152734375" r="4" fill="#ffffff" stroke="#000000" stroke-width="1" style="-webkit-tap-highlight-color: rgba(0, 0, 0, 0);"></circle>
            </svg>
            <div class="morris-hover morris-default-style" style="left: 0px; top: 89px; display: none;">
            <div class="morris-hover-row-label">2017</div>
            <div class="morris-hover-point" style="color: gray">Total Income: 75 </div><div class="morris-hover-point" style="color: red">Total Outcome: 60</div>
            </div>
        </div>, model
    );
}

export function clock() {
    var time = new Observables.Time();
    var toggleTime = () => {
        time.toggle();
    };
    return View(<div>Clock {expr("await time")}
        <button onClick={toggleTime}>toggle time</button>
        <ClockApp time={expr("await time")} />
    </div>, new Re.Store({ time }));
}

export function graph() {
    return View(<GraphApp />, new Re.Store({}));
}

export function balls() {
    return View(<BallsApp />);
}

export function hierachical({ url }) {
    var rootView =
        <div>
            <h3>root</h3>
            <input />
            <div>
                goto <a href="" onClick={url.action("level1a")}>level 1a</a>
            </div>
            <div>
                goto <a href="" onClick={url.action("level1b")}>level 1b</a>
            </div>
        </div>;
    return View(rootView).route({ level1a, level1b });
}

function level1a({ url }) {
    return View(
        <div>
            <h3>level 1a</h3>
            goto <a href="" onClick={url.action("todos")}>Todos</a>
        </div>
    ).route({ todos });
}

function level1b({ url }) {
    return View(
        <div>
            <h3>level 1b</h3>
            goto <a href="" onClick={url.action("todos")}>Todos</a>
        </div>
    ).route({ todos });
}

function todos() {
    return View(
        <div>
            <h3>level 2 [{expr("firstName")}] {expr("show")}</h3>
            <TodoApp show={expr("show")} />
            <div>
                show <input type="text" name="show" />
            </div>
        </div>,
        new Re.Store({ firstName: "ibrahim", show: "active" })
    );
}

export var layout = defaultLayout;