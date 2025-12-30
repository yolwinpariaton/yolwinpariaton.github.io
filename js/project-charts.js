/* js/project-charts.js
   Eight interactive Vega-Lite charts for the UK cost of living project.
*/

(function () {
  const opts = { actions: false, renderer: "canvas" };

  const UK_TOPO_URL =
    "https://raw.githubusercontent.com/ONSdigital/uk-topojson/refs/heads/main/output/topo.json";

  function setBox(selector, html) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.innerHTML = html;
  }

  function setError(selector, title, detail) {
    setBox(
      selector,
      `<div style="padding:12px;border:1px solid #e2e2e2;border-radius:10px;background:#fff;">
         <p style="margin:0 0 6px;"><strong>${title}</strong></p>
         <p style="margin:0;color:#555;">${detail}</p>
       </div>`
    );
  }

  async function verifyFetch(url, selector) {
    if (window.location.protocol === "file:") {
      setError(
        selector,
        "Charts cannot load via file://",
        "Open via GitHub Pages (https://...) or a local server (VS Code Live Server). Browsers block loading data/*.json from file://."
      );
      return false;
    }

    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) {
        setError(
          selector,
          "Missing data file",
          `${url} returned HTTP ${r.status}. Confirm it exists in /data on GitHub Pages.`
        );
        return false;
      }
      return true;
    } catch (e) {
      console.error("Fetch failed:", url, e);
      setError(selector, "Cannot fetch data", `Fetch failed for ${url}. Check DevTools Console.`);
      return false;
    }
  }

  function safeEmbed(selector, spec) {
    const el = document.querySelector(selector);
    if (!el) return;

    if (typeof vegaEmbed !== "function") {
      setError(
        selector,
        "Vega libraries not loaded",
        "vegaEmbed is not available. Confirm the three CDN scripts load successfully."
      );
      return;
    }

    el.innerHTML = "";
    vegaEmbed(selector, spec, opts).catch((err) => {
      console.error("Vega embed error for", selector, err);
      setError(selector, "Chart failed to render", "Check DevTools Console for details.");
    });
  }

  // A reliable centered legend row (2 items) to place under subtitle.
  function centeredLegendRow(items) {
    // items: [{label, color}, {label, color}]
    // x positions chosen to visually center the pair under the subtitle
    const values = [
      { x: 0.36, label: items[0].label, color: items[0].color },
      { x: 0.56, label: items[1].label, color: items[1].color }
    ];

    return {
      "width": "container",
      "height": 28,
      "data": { "values": values },
      "transform": [{ "calculate": "datum.x + 0.05", "as": "x2" }],
      "layer": [
        {
          "mark": { "type": "rule", "strokeWidth": 4, "strokeCap": "round" },
          "encoding": {
            "x": { "field": "x", "type": "quantitative", "scale": { "domain": [0, 1] }, "axis": null },
            "x2": { "field": "x2" },
            "y": { "value": 14 },
            "y2": { "value": 14 },
            "color": { "field": "color", "type": "nominal", "scale": null }
          }
        },
        {
          "mark": { "type": "text", "align": "left", "baseline": "middle", "dx": 10, "fontSize": 12 },
          "encoding": {
            "x": { "field": "x2", "type": "quantitative", "scale": { "domain": [0, 1] }, "axis": null },
            "y": { "value": 14 },
            "text": { "field": "label" },
            "color": { "field": "color", "type": "nominal", "scale": null }
          }
        }
      ],
      "config": { "view": { "stroke": null } }
    };
  }

  async function run() {
    const checks = await Promise.all([
      verifyFetch("data/vis1_prices_vs_pay.json", "#vis1"),
      verifyFetch("data/vis2_food_vs_headline.json", "#vis2"),
      verifyFetch("data/vis3_energy_cap.json", "#vis3"),
      verifyFetch("data/vis4_fuel_weekly.json", "#vis4"),
      verifyFetch("data/vis5_rent_vs_house.json", "#vis5"),
      verifyFetch("data/vis6_rent_map_regions.json", "#vis6"),
      verifyFetch("data/vis7_rent_trend_regions.json", "#vis7"),
      verifyFetch("data/vis8_rent_map_countries.json", "#vis8")
    ]);
    if (checks.some((ok) => !ok)) return;

    // =========================
    // 1) Prices vs pay
    // =========================
    const vis1Main = {
      "width": "container",
      "height": 360,
      "data": { "url": "data/vis1_prices_vs_pay.json" },
      "padding": { "left": 6, "right": 6, "top": 6, "bottom": 48 },
      "autosize": { "type": "fit", "contains": "padding" },
      "transform": [
        { "calculate": "toDate(datum.date)", "as": "d" },
        { "calculate": "toNumber(datum.value)", "as": "v" },
        { "pivot": "series", "value": "v", "groupby": ["d"] },
        { "calculate": "datum['CPIH (prices)']", "as": "prices" },
        { "calculate": "datum['Real earnings']", "as": "earnings" },
        { "calculate": "datum.prices - datum.earnings", "as": "gap" }
      ],
      "layer": [
        {
          "mark": { "type": "rule", "strokeDash": [4, 4], "strokeWidth": 1.6, "opacity": 0.75 },
          "encoding": {
            "y": { "datum": 100 },
            "color": { "value": "#7f8fa6" }
          }
        },
        {
          "mark": { "type": "area", "opacity": 0.14 },
          "encoding": {
            "x": {
              "field": "d",
              "type": "temporal",
              "title": "Date",
              "axis": { "format": "%Y", "tickCount": 7, "titlePadding": 18 }
            },
            "y": {
              "field": "earnings",
              "type": "quantitative",
              "title": "Index (2019 = 100)",
              "scale": { "zero": false, "domain": [98, 114] },
              "axis": { "tickCount": 7, "grid": true }
            },
            "y2": { "field": "prices" }
          }
        },
        {
          "mark": { "type": "line", "strokeWidth": 2.8, "opacity": 0.95 },
          "encoding": {
            "x": { "field": "d", "type": "temporal", "title": "Date" },
            "y": { "field": "prices", "type": "quantitative" },
            "color": { "value": "#1f77b4" },
            "tooltip": [
              { "field": "d", "type": "temporal", "title": "Date" },
              { "field": "prices", "type": "quantitative", "title": "CPIH (prices)", "format": ".1f" },
              { "field": "earnings", "type": "quantitative", "title": "Real earnings", "format": ".1f" },
              { "field": "gap", "type": "quantitative", "title": "Gap (prices − pay)", "format": ".1f" }
            ]
          }
        },
        {
          "mark": { "type": "line", "strokeWidth": 2.8, "opacity": 0.95 },
          "encoding": {
            "x": { "field": "d", "type": "temporal", "title": "Date" },
            "y": { "field": "earnings", "type": "quantitative" },
            "color": { "value": "#ff7f0e" }
          }
        },
        {
          "mark": { "type": "point", "filled": true, "size": 30, "opacity": 0.95 },
          "encoding": { "x": { "field": "d", "type": "temporal" }, "y": { "field": "prices", "type": "quantitative" }, "color": { "value": "#1f77b4" } }
        },
        {
          "mark": { "type": "point", "filled": true, "size": 30, "opacity": 0.95 },
          "encoding": { "x": { "field": "d", "type": "temporal" }, "y": { "field": "earnings", "type": "quantitative" }, "color": { "value": "#ff7f0e" } }
        }
      ],
      "config": {
        "axis": { "labelFontSize": 12, "titleFontSize": 12 },
        "view": { "stroke": null }
      }
    };

    const vis1 = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "title": {
        "text": "Prices vs pay (indexed to 2019 = 100)",
        "subtitle": "Shaded area shows the purchasing-power gap when consumer prices rise faster than real earnings."
      },
      "vconcat": [
        centeredLegendRow([
          { label: "CPIH (prices)", color: "#1f77b4" },
          { label: "Real earnings", color: "#ff7f0e" }
        ]),
        vis1Main
      ],
      "spacing": 0,
      "config": {
        "title": { "fontSize": 18, "subtitleFontSize": 12 },
        "view": { "stroke": null }
      }
    };

    // =========================
    // 2) Food vs headline (centered legend row)
    // =========================
    const vis2Main = {
      "width": "container",
      "height": 320,
      "data": { "url": "data/vis2_food_vs_headline.json" },
      "mark": { "type": "line", "point": true },
      "encoding": {
        "x": { "field": "date", "type": "temporal", "title": "Date" },
        "y": { "field": "value", "type": "quantitative", "title": "Percent" },
        "color": { "field": "series", "type": "nominal", "legend": null },
        "tooltip": [
          { "field": "date", "type": "temporal" },
          { "field": "series", "type": "nominal" },
          { "field": "value", "type": "quantitative", "format": ".1f" }
        ]
      },
      "config": { "view": { "stroke": null } }
    };

    const vis2 = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "title": { "text": "Food inflation vs headline (annual rate)" },
      "vconcat": [
        centeredLegendRow([
          { label: "Food (CPI)", color: "#1f77b4" },
          { label: "Headline (CPIH)", color: "#ff7f0e" }
        ]),
        vis2Main
      ],
      "spacing": 0,
      "config": { "title": { "fontSize": 18, "subtitleFontSize": 12 }, "view": { "stroke": null } }
    };

    // =========================
    // 3) Energy cap
    // =========================
    const vis3 = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "title": { "text": "Energy price cap (typical annual bill)" },
      "data": { "url": "data/vis3_energy_cap.json" },
      "width": "container",
      "height": 280,
      "mark": { "type": "line", "interpolate": "step-after", "point": true },
      "encoding": {
        "x": { "field": "period_date", "type": "temporal", "title": "Cap period" },
        "y": { "field": "typical_annual_bill_gbp", "type": "quantitative", "title": "GBP" },
        "tooltip": [
          { "field": "period_label", "type": "nominal", "title": "Period" },
          { "field": "typical_annual_bill_gbp", "type": "quantitative", "title": "GBP", "format": ",.0f" }
        ]
      },
      "config": { "view": { "stroke": null } }
    };

    // =========================
    // 4) Fuel weekly (centered legend row)
    // =========================
    const vis4Main = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": { "url": "data/vis4_fuel_weekly.json" },
      "width": "container",
      "height": 320,
      "transform": [
        { "fold": ["unleaded_ppl", "diesel_ppl"], "as": ["fuel", "ppl"] },
        { "calculate": "datum.fuel === 'unleaded_ppl' ? 'Unleaded' : 'Diesel'", "as": "fuel_label" }
      ],
      "mark": { "type": "line" },
      "encoding": {
        "x": { "field": "date", "type": "temporal", "title": "Date" },
        "y": { "field": "ppl", "type": "quantitative", "title": "Pence per litre" },
        "color": { "field": "fuel_label", "type": "nominal", "legend": null },
        "tooltip": [
          { "field": "date", "type": "temporal" },
          { "field": "fuel_label", "type": "nominal", "title": "Fuel" },
          { "field": "ppl", "type": "quantitative", "format": ".1f" }
        ]
      },
      "config": { "view": { "stroke": null } }
    };

    const vis4 = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "title": { "text": "Weekly fuel prices (pence per litre)" },
      "vconcat": [
        centeredLegendRow([
          { label: "Unleaded", color: "#1f77b4" },
          { label: "Diesel", color: "#ff7f0e" }
        ]),
        vis4Main
      ],
      "spacing": 0,
      "config": { "title": { "fontSize": 18, "subtitleFontSize": 12 }, "view": { "stroke": null } }
    };

    // =========================
    // 5) Rent vs house (centered legend row)
    // =========================
    const vis5Main = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": { "url": "data/vis5_rent_vs_house.json" },
      "width": "container",
      "height": 320,
      "mark": { "type": "line", "point": true },
      "encoding": {
        "x": { "field": "date", "type": "temporal", "title": "Date" },
        "y": { "field": "value", "type": "quantitative", "title": "Percent" },
        "color": { "field": "series", "type": "nominal", "legend": null },
        "tooltip": [
          { "field": "date", "type": "temporal" },
          { "field": "series", "type": "nominal" },
          { "field": "value", "type": "quantitative", "format": ".1f" }
        ]
      },
      "config": { "view": { "stroke": null } }
    };

    const vis5 = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "title": { "text": "Rent vs house price inflation (annual rate)" },
      "vconcat": [
        centeredLegendRow([
          { label: "Rent", color: "#1f77b4" },
          { label: "House prices", color: "#ff7f0e" }
        ]),
        vis5Main
      ],
      "spacing": 0,
      "config": { "title": { "fontSize": 18, "subtitleFontSize": 12 }, "view": { "stroke": null } }
    };

    // =========================
    // 6) Map: regions
    // =========================
    const vis6 = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "title": { "text": "Rent inflation across regions (latest)" },
      "width": "container",
      "height": 420,
      "data": { "url": UK_TOPO_URL, "format": { "type": "topojson", "feature": "rgn" } },
      "transform": [
        {
          "lookup": "properties.areacd",
          "from": {
            "data": { "url": "data/vis6_rent_map_regions.json" },
            "key": "areacd",
            "fields": ["areanm", "rent_inflation_yoy_pct"]
          }
        }
      ],
      "projection": { "type": "mercator" },
      "mark": { "type": "geoshape", "stroke": "white", "strokeWidth": 0.6 },
      "encoding": {
        "color": { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "% y/y", "legend": { "orient": "bottom" } },
        "tooltip": [
          { "field": "areanm", "type": "nominal", "title": "Area" },
          { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "% y/y", "format": ".1f" }
        ]
      },
      "config": { "view": { "stroke": null } }
    };

    // =========================
    // 7) Trend regions (no colored legend requested)
    // =========================
    const vis7 = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "title": { "text": "Rent inflation over time (select a region)" },
      "data": { "url": "data/vis7_rent_trend_regions.json" },
      "width": "container",
      "height": 320,
      "params": [
        {
          "name": "Region",
          "value": "London",
          "bind": {
            "input": "select",
            "name": "Region: ",
            "options": [
              "North East","North West","Yorkshire and The Humber","East Midlands",
              "West Midlands","East of England","London","South East","South West"
            ]
          }
        }
      ],
      "transform": [
        { "calculate": "datum.areanm === Region ? 'Selected region' : (datum.areanm === 'England' ? 'England' : 'Other')", "as": "group" }
      ],
      "mark": { "type": "line" },
      "encoding": {
        "x": { "field": "date", "type": "temporal", "title": "Date" },
        "y": { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "% y/y" },
        "detail": { "field": "areanm", "type": "nominal" },
        "opacity": {
          "condition": [{ "test": "datum.group === 'Selected region' || datum.group === 'England'", "value": 1 }],
          "value": 0.15
        },
        "size": {
          "condition": [
            { "test": "datum.group === 'Selected region'", "value": 3 },
            { "test": "datum.group === 'England'", "value": 2 }
          ],
          "value": 1
        },
        "tooltip": [
          { "field": "date", "type": "temporal" },
          { "field": "areanm", "type": "nominal", "title": "Area" },
          { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "% y/y", "format": ".1f" }
        ]
      },
      "config": { "view": { "stroke": null } }
    };

    // =========================
    // 8) Map: countries
    // =========================
    const vis8 = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "title": { "text": "Rent inflation across UK countries (latest available)" },
      "width": "container",
      "height": 420,
      "data": { "url": UK_TOPO_URL, "format": { "type": "topojson", "feature": "ctry" } },
      "transform": [
        {
          "lookup": "properties.areacd",
          "from": {
            "data": { "url": "data/vis8_rent_map_countries.json" },
            "key": "areacd",
            "fields": ["areanm", "rent_inflation_yoy_pct"]
          }
        }
      ],
      "projection": { "type": "mercator" },
      "mark": { "type": "geoshape", "stroke": "white", "strokeWidth": 0.8 },
      "encoding": {
        "color": { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "% y/y", "legend": { "orient": "bottom" } },
        "tooltip": [
          { "field": "areanm", "type": "nominal", "title": "Country" },
          { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "% y/y", "format": ".1f" }
        ]
      },
      "config": { "view": { "stroke": null } }
    };

    safeEmbed("#vis1", vis1);
    safeEmbed("#vis2", vis2);
    safeEmbed("#vis3", vis3);
    safeEmbed("#vis4", vis4);
    safeEmbed("#vis5", vis5);
    safeEmbed("#vis6", vis6);
    safeEmbed("#vis7", vis7);
    safeEmbed("#vis8", vis8);
  }

  window.addEventListener("load", run);
})();
