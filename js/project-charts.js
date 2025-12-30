/* js/project-charts.js
   Renders 8 Vega-Lite charts into project.html placeholders.
   Data files must exist in /data as JSON (records).
*/

(function () {
  const opts = { actions: false, renderer: "canvas" };

  const vis1 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "CPIH annual inflation rate (UK)" },
    "data": { "url": "data/chart1_cpih_annual_rate.json" },
    "width": "container",
    "height": 300,
    "mark": { "type": "line", "point": true },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date" },
      "y": { "field": "value", "type": "quantitative", "title": "Percent" },
      "tooltip": [
        { "field": "date", "type": "temporal" },
        { "field": "value", "type": "quantitative" }
      ]
    }
  };

  const vis2 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Food inflation (CPI) annual rate (UK)" },
    "data": { "url": "data/chart2_food_inflation.json" },
    "width": "container",
    "height": 300,
    "mark": { "type": "line", "point": true },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date" },
      "y": { "field": "value", "type": "quantitative", "title": "Percent" },
      "tooltip": [
        { "field": "date", "type": "temporal" },
        { "field": "value", "type": "quantitative" }
      ]
    }
  };

  const vis3 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Owner occupiers’ housing costs (OOH) inflation (CPIH component)" },
    "data": { "url": "data/chart3_ooh_inflation.json" },
    "width": "container",
    "height": 300,
    "mark": { "type": "line", "point": true },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date" },
      "y": { "field": "value", "type": "quantitative", "title": "Percent" },
      "tooltip": [
        { "field": "date", "type": "temporal" },
        { "field": "value", "type": "quantitative" }
      ]
    }
  };

  const vis4 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Real wages (AWE total pay, real terms) indexed to 2019=100" },
    "data": { "url": "data/chart4_real_wages_index.json" },
    "width": "container",
    "height": 300,
    "mark": { "type": "line" },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date" },
      "y": { "field": "value", "type": "quantitative", "title": "Index (2019=100)" },
      "tooltip": [
        { "field": "date", "type": "temporal" },
        { "field": "value", "type": "quantitative" }
      ]
    }
  };

  const vis5 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Energy price cap (typical annual dual-fuel bill, Great Britain)" },
    "data": { "url": "data/chart5_energy_price_cap.json" },
    "width": "container",
    "height": 280,
    "mark": { "type": "line", "point": true },
    "encoding": {
      "x": { "field": "period", "type": "ordinal", "title": "Cap period" },
      "y": { "field": "typical_annual_bill_gbp", "type": "quantitative", "title": "GBP per year" },
      "tooltip": [
        { "field": "period" },
        { "field": "typical_annual_bill_gbp", "type": "quantitative" }
      ]
    }
  };

  const vis6 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Weekly road fuel pump prices (UK)" },
    "data": { "url": "data/chart6_road_fuel_prices.json" },
    "width": "container",
    "height": 300,
    "transform": [
      { "fold": ["unleaded_ppl", "diesel_ppl"], "as": ["fuel", "pence_per_litre"] }
    ],
    "mark": { "type": "line" },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date" },
      "y": { "field": "pence_per_litre", "type": "quantitative", "title": "Pence per litre" },
      "color": { "field": "fuel", "type": "nominal", "title": "Fuel type" },
      "tooltip": [
        { "field": "date", "type": "temporal" },
        { "field": "fuel" },
        { "field": "pence_per_litre", "type": "quantitative" }
      ]
    }
  };

  const vis7 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Rent inflation by English region (latest month)" },
    "data": { "url": "data/chart7_rent_inflation_regions.json" },
    "width": "container",
    "height": 340,
    "mark": { "type": "bar" },
    "encoding": {
      "y": { "field": "region", "type": "nominal", "sort": "-x", "title": "" },
      "x": { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "Annual rent inflation (%)" },
      "tooltip": [
        { "field": "region" },
        { "field": "rent_inflation_yoy_pct", "type": "quantitative" }
      ]
    }
  };

  const vis8 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Rent vs house price inflation (UK)" },
    "data": { "url": "data/chart8_rent_vs_house_inflation.json" },
    "width": "container",
    "height": 300,
    "transform": [
      { "fold": ["rent_inflation_yoy_pct", "house_price_inflation_yoy_pct"], "as": ["series", "percent"] }
    ],
    "mark": { "type": "line" },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date" },
      "y": { "field": "percent", "type": "quantitative", "title": "Annual inflation (%)" },
      "color": { "field": "series", "type": "nominal", "title": "" },
      "tooltip": [
        { "field": "date", "type": "temporal" },
        { "field": "series" },
        { "field": "percent", "type": "quantitative" }
      ]
    }
  };

  // Render all charts
  const embeds = [
    ["#vis1", vis1],
    ["#vis2", vis2],
    ["#vis3", vis3],
    ["#vis4", vis4],
    ["#vis5", vis5],
    ["#vis6", vis6],
    ["#vis7", vis7],
    ["#vis8", vis8]
  ];

  // Defensive: if a container is missing, skip rather than break the page
  embeds.forEach(([selector, spec]) => {
    const el = document.querySelector(selector);
    if (!el) return;
    vegaEmbed(selector, spec, opts).catch((err) => {
      console.error("Vega embed error for", selector, err);
      el.innerHTML = "<p>Chart failed to load. Check console and JSON path.</p>";
    });
  });
})();
