// ========================================
// PROJECT CHARTS - UK COST OF LIVING CRISIS
// Robust embedding + safe rewriting of relative data URLs in specs
// ========================================

// Cache-busting (optional; helps while iterating)
const CACHE_BUST = `?v=${new Date().toISOString().slice(0, 10)}`; // daily

// All data/specs are served from the same GitHub Pages site:
const SITE_DATA_PATH = `${window.location.origin}/data/`;

function siteDataUrl(file) {
  // IMPORTANT: pass only filenames like "chart2_spec.json"
  return `${SITE_DATA_PATH}${file}${CACHE_BUST}`;
}

// Consistent Vega-Lite configuration (applies across charts)
const BASE_VL_CONFIG = {
  view: { stroke: "transparent" },
  background: "transparent",
  title: { fontSize: 14, subtitleFontSize: 12, anchor: "start" },
  axis: {
    labelFontSize: 11,
    titleFontSize: 12,
    gridColor: "#e5e7eb",
    domainColor: "#111827",
    tickColor: "#111827"
  },
  legend: { labelFontSize: 11, titleFontSize: 12 }
};

// Vega-Embed options
const EMBED_OPTS = {
  actions: false,
  renderer: "svg",
  mode: "vega-lite",
  config: BASE_VL_CONFIG
};

// -----------------------------
// Safe embed: one failure will not break the rest
// -----------------------------
function safeEmbed(selector, specOrUrl, opts = EMBED_OPTS) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element in HTML: ${selector}`);
    return Promise.resolve();
  }

  if (typeof vegaEmbed !== "function") {
    console.error("vegaEmbed is not available yet. Check script loading order/CDN.");
    el.innerHTML = `
      <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
        Vega libraries not loaded. Check console and script tags.
      </div>
    `;
    return Promise.resolve();
  }

  return vegaEmbed(selector, specOrUrl, opts).catch(err => {
    console.error(`Embed failed: ${selector}`, err);
    el.innerHTML = `
      <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
        Chart failed to load.<br/>
        <span style="color:#7f1d1d; font-size:12px;">${String(err?.message || err)}</span>
      </div>
    `;
  });
}

// -----------------------------
// Rewrite only RELATIVE data URLs inside specs
// e.g., "chart2_wage_squeeze.json" -> "https://<site>/data/chart2_wage_squeeze.json?v=..."
// -----------------------------
function isRelativeDataUrl(u) {
  return (
    typeof u === "string" &&
    u.length > 0 &&
    !u.startsWith("http://") &&
    !u.startsWith("https://") &&
    !u.startsWith("/") &&
    !u.startsWith("data:") &&
    // also treat "./file.json" and "../file.json" as relative
    true
  );
}

function rewriteDataUrlsDeep(node) {
  if (!node || typeof node !== "object") return;

  // rewrite { data: { url: "..." } }
  if (node.data && typeof node.data === "object" && isRelativeDataUrl(node.data.url)) {
    // normalize leading "./"
    const raw = String(node.data.url);
    const normalized = raw.startsWith("./") ? raw.slice(2) : raw;
    node.data.url = siteDataUrl(normalized);
  }

  // recurse
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach(rewriteDataUrlsDeep);
    else if (v && typeof v === "object") rewriteDataUrlsDeep(v);
  }
}

async function loadSpecAndFix(file) {
  const res = await fetch(siteDataUrl(file), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${file}: HTTP ${res.status}`);
  const spec = await res.json();
  rewriteDataUrlsDeep(spec);
  return spec;
}

function initCharts() {
  // Charts 1–3 are spec files in /data
  loadSpecAndFix("chart1_spec.json").then(spec => safeEmbed("#chart1", spec));
  loadSpecAndFix("chart2_spec.json").then(spec => safeEmbed("#chart2", spec));
  loadSpecAndFix("chart3_spec.json").then(spec => safeEmbed("#chart3", spec));

  // Shared responsive sizing for inline specs
  const RESPONSIVE = {
    width: "container",
    autosize: { type: "fit", contains: "padding" }
  };

  // Chart 4: Energy Bill Impact Calculator
  safeEmbed("#chart4", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Energy Bill Impact Calculator", "subtitle": "See how different household types are affected" },
    ...RESPONSIVE,
    "height": 450,
    "data": { "url": siteDataUrl("chart4_energy_detailed.json") },
    "params": [
      {
        "name": "householdType",
        "value": "Medium House",
        "bind": {
          "input": "radio",
          "options": ["Small Flat", "Medium House", "Large House", "Student Accommodation"],
          "name": "Household Type: "
        }
      },
      { "name": "showSupport", "value": true, "bind": { "input": "checkbox", "name": "Show Government Support " } }
    ],
    "transform": [{ "filter": "datum.household_type == householdType" }],
    "layer": [
      {
        "mark": { "type": "area", "opacity": 0.6, "color": "#ff6b6b" },
        "encoding": {
          "x": { "field": "date", "type": "temporal", "title": "Date", "axis": { "format": "%b %y", "labelAngle": -45 } },
          "y": { "field": "monthly_bill", "type": "quantitative", "title": "Monthly Cost (£)" },
          "tooltip": [
            { "field": "date", "type": "temporal", "format": "%B %Y", "title": "Date" },
            { "field": "monthly_bill", "title": "Bill (£)", "format": ".0f" }
          ]
        }
      },
      {
        "transform": [{ "filter": "showSupport" }],
        "mark": { "type": "area", "opacity": 0.35, "color": "#51cf66" },
        "encoding": {
          "x": { "field": "date", "type": "temporal" },
          "y": { "field": "government_support", "type": "quantitative", "title": "Support (£)" },
          "tooltip": [{ "field": "government_support", "title": "Support (£)", "format": ".0f" }]
        }
      },
      {
        "mark": { "type": "line", "strokeWidth": 3, "color": "darkblue" },
        "encoding": {
          "x": { "field": "date", "type": "temporal" },
          "y": { "field": "net_bill", "type": "quantitative", "title": "Net Bill (£)" },
          "tooltip": [{ "field": "net_bill", "title": "Net Bill (£)", "format": ".0f" }]
        }
      }
    ],
    "config": BASE_VL_CONFIG
  });

  // Chart 5
  safeEmbed("#chart5", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Food Category Inflation Heatmap", "subtitle": "Monthly inflation rates by food category" },
    ...RESPONSIVE,
    "height": 400,
    "data": { "url": siteDataUrl("chart5_food_heatmap.json") },
    "mark": "rect",
    "encoding": {
      "x": { "field": "date", "type": "ordinal", "title": "Month", "axis": { "labelAngle": -90, "labelLimit": 110 } },
      "y": { "field": "category", "type": "nominal", "title": "Food Category" },
      "color": {
        "field": "inflation",
        "type": "quantitative",
        "scale": { "scheme": "redyellowgreen", "reverse": true, "domain": [-2, 25], "clamp": true },
        "title": "Inflation %"
      },
      "tooltip": [
        { "field": "category", "title": "Category" },
        { "field": "date", "title": "Month" },
        { "field": "inflation", "title": "Inflation", "format": ".1f" },
        { "field": "affordability_impact", "title": "Impact Level" }
      ]
    },
    "config": BASE_VL_CONFIG
  });

  // Chart 6
  safeEmbed("#chart6", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Housing Affordability Crisis by City", "subtitle": "Price-to-income and rent-to-income ratios" },
    ...RESPONSIVE,
    "height": 450,
    "data": { "url": siteDataUrl("chart6_housing_crisis.json") },
    "params": [
      {
        "name": "citySelect",
        "value": "London",
        "bind": {
          "input": "select",
          "options": ["London", "Manchester", "Birmingham", "Edinburgh", "Cardiff", "Leeds", "Bristol", "Newcastle"],
          "name": "Select City: "
        }
      },
      {
        "name": "metricType",
        "value": "both",
        "bind": {
          "input": "radio",
          "options": ["both", "price_to_income", "rent_to_income", "mortgage_to_income"],
          "labels": ["All", "House Prices", "Rent", "Mortgage"],
          "name": "Show: "
        }
      }
    ],
    "transform": [
      { "filter": "datum.city == citySelect" },
      { "fold": ["price_to_income", "rent_to_income", "mortgage_to_income"], "as": ["metric", "value"] },
      { "filter": "metricType == 'both' || datum.metric == metricType" }
    ],
    "mark": { "type": "line", "strokeWidth": 3, "point": { "size": 80 } },
    "encoding": {
      "x": { "field": "year", "type": "ordinal", "title": "Year" },
      "y": { "field": "value", "type": "quantitative", "title": "Ratio / Percentage" },
      "color": { "field": "metric", "type": "nominal", "legend": { "title": "Metric" } }
    },
    "config": BASE_VL_CONFIG
  });

  // Chart 7
  safeEmbed("#chart7", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "G20 Countries: Inflation Crisis Comparison", "subtitle": "Click on country names in legend to highlight" },
    ...RESPONSIVE,
    "height": 450,
    "data": { "url": siteDataUrl("chart7_g20_comparison.json") },
    "params": [{ "name": "countryHighlight", "select": { "type": "point", "fields": ["country"] }, "bind": "legend" }],
    "mark": { "type": "line", "strokeWidth": 2, "point": { "size": 20 } },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date", "axis": { "format": "%b %Y", "labelAngle": -45 } },
      "y": { "field": "inflation", "type": "quantitative", "title": "Inflation Rate (%)" },
      "color": { "field": "country", "type": "nominal" },
      "opacity": { "condition": { "param": "countryHighlight", "value": 1 }, "value": 0.2 }
    },
    "config": BASE_VL_CONFIG
  });

  // Chart 8
  safeEmbed("#chart8", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Economic Scenario Explorer 2025–2027", "subtitle": "Explore different economic futures" },
    ...RESPONSIVE,
    "height": 450,
    "data": { "url": siteDataUrl("chart8_scenarios_enhanced.json") },
    "params": [
      {
        "name": "scenarioSelect",
        "value": "Soft Landing",
        "bind": {
          "input": "select",
          "options": ["Soft Landing", "Stagflation", "Recession", "Second Wave Crisis"],
          "name": "Select Scenario: "
        }
      }
    ],
    "transform": [{ "filter": "datum.scenario == scenarioSelect" }],
    "mark": { "type": "line", "strokeWidth": 3 },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "axis": { "format": "%b %Y", "labelAngle": -45 } },
      "y": { "field": "inflation", "type": "quantitative", "title": "Inflation (%)" }
    },
    "config": BASE_VL_CONFIG
  });

  console.log("✅ project-charts.js loaded and embed calls executed.");
}

window.addEventListener("load", initCharts);
