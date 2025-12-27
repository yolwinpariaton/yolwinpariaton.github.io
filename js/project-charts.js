// ========================================
// PROJECT CHARTS - UK COST OF LIVING CRISIS
// ========================================

// ----------------------------
// Configuration (your repo)
// ----------------------------
const GITHUB_USER = "yolwinpariaton";
const GITHUB_REPO = "yolwinpariaton.github.io";
const DATA_PATH = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/data/`;

// ----------------------------
// Embed options (CONSISTENT)
// ----------------------------
const embedProject = {
  actions: false,
  renderer: "svg"
};

// Safe embed so one broken chart never kills the rest
function safeEmbed(selector, specOrUrl, options = embedProject) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element: ${selector}`);
    return;
  }

  vegaEmbed(selector, specOrUrl, options).catch(err => {
    console.error(`Embed failed: ${selector}`, err);
    el.innerHTML = `
      <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
        Chart failed to load.
      </div>
    `;
  });
}

// Run after DOM is parsed
document.addEventListener("DOMContentLoaded", () => {

  // ------------------------------------
  // Chart 1: Inflation Timeline (from spec file)
  // ------------------------------------
  safeEmbed("#chart1", `${DATA_PATH}chart1_spec.json`, {
    ...embedProject,
    // keep responsive if your spec uses fixed widths; Vega-Lite respects spec width, but this helps in small screens
    defaultStyle: true
  });

  // ------------------------------------
  // Chart 2: Wages vs Inflation (from spec file)
  // ------------------------------------
  safeEmbed("#chart2", `${DATA_PATH}chart2_spec.json`, {
    ...embedProject,
    defaultStyle: true
  });

  // ------------------------------------
  // Chart 3: Regional "Map"/Bubble plot (CONSISTENT config)
  // NOTE: This is NOT a choropleth; it’s a coordinate/bubble map.
  // ------------------------------------
  const chart3Spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Cost of Living Index by UK Region", "fontSize": 14 },
    "width": 700,
    "height": 500,
    "data": { "url": `${DATA_PATH}chart3_regional_costs.json`, "format": { "type": "json" } },
    "projection": { "type": "mercator" },
    "mark": { "type": "circle", "opacity": 0.8, "stroke": "white", "strokeWidth": 1 },
    "encoding": {
      "longitude": { "field": "lon", "type": "quantitative" },
      "latitude": { "field": "lat", "type": "quantitative" },
      "size": {
        "field": "cost_index",
        "type": "quantitative",
        "scale": { "range": [100, 1000] },
        "title": "Cost Index"
      },
      "color": {
        "field": "cost_index",
        "type": "quantitative",
        "scale": { "scheme": "orangered" },
        "title": "Cost Index"
      },
      "tooltip": [
        { "field": "region", "type": "nominal", "title": "Region" },
        { "field": "cost_index", "type": "quantitative", "title": "Cost Index", "format": ".0f" }
      ]
    },
    "config": { "view": { "stroke": "transparent" } }
  };
  safeEmbed("#chart3", chart3Spec);

  // ------------------------------------
  // Chart 4: Energy Prices (Interactive)
  // FIXES:
  // - Use one y-scale for BOTH lines (cap and effective_bill) so they’re comparable
  // - Remove incorrect y-domain [0,400] (cap is in £ thousands)
  // ------------------------------------
  const chart4Spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Energy Price Cap and Typical Bills", "fontSize": 14 },
    "width": 700,
    "height": 400,
    "data": { "url": `${DATA_PATH}chart4_energy_prices.json`, "format": { "type": "json" } },
    "params": [
      {
        "name": "showSupport",
        "value": true,
        "bind": { "input": "checkbox", "name": "Show Government Support " }
      }
    ],
    "layer": [
      {
        "mark": { "type": "line", "strokeWidth": 3 },
        "encoding": {
          "x": { "field": "date", "type": "temporal", "title": "Date" },
          "y": { "field": "cap", "type": "quantitative", "title": "Annual Amount (£)" },
          "color": { "value": "#1f77b4" },
          "tooltip": [
            { "field": "date", "type": "temporal", "title": "Date" },
            { "field": "cap", "type": "quantitative", "title": "Cap (£)", "format": ",.0f" }
          ]
        }
      },
      {
        "transform": [{ "filter": "showSupport" }],
        "mark": { "type": "line", "strokeWidth": 2, "strokeDash": [4, 4] },
        "encoding": {
          "x": { "field": "date", "type": "temporal" },
          "y": { "field": "effective_bill", "type": "quantitative" },
          "color": { "value": "#2ca02c" },
          "tooltip": [
            { "field": "date", "type": "temporal", "title": "Date" },
            { "field": "effective_bill", "type": "quantitative", "title": "Effective bill (£)", "format": ",.0f" }
          ]
        }
      }
    ],
    "config": { "view": { "stroke": "transparent" } }
  };
  safeEmbed("#chart4", chart4Spec);

  // ------------------------------------
  // Chart 5: Food Basket
  // FIX: strokeWidth must be in mark, not encoding
  // ------------------------------------
  const chart5Spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Essential Food Price Index (2020 = 100)", "fontSize": 14 },
    "width": 700,
    "height": 400,
    "data": { "url": `${DATA_PATH}chart5_food_basket.json`, "format": { "type": "json" } },
    "mark": { "type": "line", "strokeWidth": 2 },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date" },
      "y": { "field": "price_index", "type": "quantitative", "title": "Price Index" },
      "color": { "field": "item", "type": "nominal", "title": "Food Item" },
      "tooltip": [
        { "field": "date", "type": "temporal", "title": "Date" },
        { "field": "item", "type": "nominal", "title": "Item" },
        { "field": "price_index", "type": "quantitative", "title": "Index", "format": ".1f" }
      ]
    },
    "config": { "view": { "stroke": "transparent" } }
  };
  safeEmbed("#chart5", chart5Spec);

  // ------------------------------------
  // Chart 6: Housing Costs
  // FIX:
  // - Your tooltip referenced mortgage but mortgage is not shown in marks.
  // - If your dataset has both rent and mortgage, a cleaner approach is to reshape to long-form.
  // - Here we keep your structure, but we only tooltip fields that exist reliably.
  // ------------------------------------
  const chart6Spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Housing Costs by Region", "fontSize": 14 },
    "width": 700,
    "height": 400,
    "data": { "url": `${DATA_PATH}chart6_housing_costs.json`, "format": { "type": "json" } },
    "mark": { "type": "bar" },
    "encoding": {
      "x": { "field": "region", "type": "nominal", "title": "Region" },
      "y": { "field": "rent", "type": "quantitative", "title": "Monthly Rent (£)" },
      "color": { "field": "region", "type": "nominal", "legend": null },
      "column": { "field": "year", "type": "ordinal", "title": "Year" },
      "tooltip": [
        { "field": "region", "type": "nominal", "title": "Region" },
        { "field": "year", "type": "ordinal", "title": "Year" },
        { "field": "rent", "type": "quantitative", "title": "Rent (£)", "format": ",.0f" }
      ]
    },
    "config": { "view": { "stroke": "transparent" } }
  };
  safeEmbed("#chart6", chart6Spec);

  // ------------------------------------
  // Chart 7: International Comparison
  // ------------------------------------
  const chart7Spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "G7 Inflation Comparison", "fontSize": 14 },
    "width": 700,
    "height": 400,
    "data": { "url": `${DATA_PATH}chart7_g7_comparison.json`, "format": { "type": "json" } },
    "mark": { "type": "line", "strokeWidth": 2 },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date" },
      "y": { "field": "inflation", "type": "quantitative", "title": "Inflation Rate (%)" },
      "color": {
        "field": "country",
        "type": "nominal",
        "title": "Country",
        "scale": { "scheme": "category10" }
      },
      "tooltip": [
        { "field": "date", "type": "temporal", "title": "Date" },
        { "field": "country", "type": "nominal", "title": "Country" },
        { "field": "inflation", "type": "quantitative", "title": "Inflation (%)", "format": ".1f" }
      ]
    },
    "config": { "view": { "stroke": "transparent" } }
  };
  safeEmbed("#chart7", chart7Spec);

  // ------------------------------------
  // Chart 8: Future Scenarios (Interactive)
  // NOTE:
  // - Your layer uses different measures; without separate axes this can be misleading.
  // - Here we keep your structure but ensure tooltips and view config are consistent.
  // ------------------------------------
  const chart8Spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Future Economic Scenarios", "fontSize": 14 },
    "width": 700,
    "height": 400,
    "data": { "url": `${DATA_PATH}chart8_future_scenarios.json`, "format": { "type": "json" } },
    "params": [
      {
        "name": "scenarioSelect",
        "value": "Base Case",
        "bind": {
          "input": "select",
          "options": ["Optimistic", "Base Case", "Pessimistic"],
          "name": "Select Scenario: "
        }
      }
    ],
    "transform": [{ "filter": "datum.scenario == scenarioSelect" }],
    "layer": [
      {
        "mark": { "type": "area", "opacity": 0.3 },
        "encoding": {
          "x": { "field": "date", "type": "temporal", "title": "Date" },
          "y": { "field": "inflation", "type": "quantitative", "title": "Rate (%)" },
          "color": { "value": "#ff7f0e" },
          "tooltip": [
            { "field": "date", "type": "temporal", "title": "Date" },
            { "field": "inflation", "type": "quantitative", "title": "Inflation", "format": ".1f" }
          ]
        }
      },
      {
        "mark": { "type": "line", "strokeWidth": 2 },
        "encoding": {
          "x": { "field": "date", "type": "temporal" },
          "y": { "field": "wage_growth", "type": "quantitative" },
          "color": { "value": "#2ca02c" },
          "tooltip": [
            { "field": "date", "type": "temporal", "title": "Date" },
            { "field": "wage_growth", "type": "quantitative", "title": "Wage growth", "format": ".1f" }
          ]
        }
      },
      {
        "mark": { "type": "line", "strokeWidth": 2, "strokeDash": [4, 4] },
        "encoding": {
          "x": { "field": "date", "type": "temporal" },
          "y": { "field": "real_wage_growth", "type": "quantitative" },
          "color": { "value": "#d62728" },
          "tooltip": [
            { "field": "date", "type": "temporal", "title": "Date" },
            { "field": "real_wage_growth", "type": "quantitative", "title": "Real wage growth", "format": ".1f" }
          ]
        }
      }
    ],
    "config": { "view": { "stroke": "transparent" } }
  };
  safeEmbed("#chart8", chart8Spec);

});
