// ========================================
// PROJECT CHARTS - UK COST OF LIVING CRISIS
// GitHub Pages-safe loader: always read from /data/
// ========================================

// Cache-busting while iterating (safe on GitHub Pages)
const CACHE_BUST = `?v=${new Date().toISOString().slice(0, 10)}`;

// IMPORTANT: root-relative path (do NOT use window.location.origin here)
const SITE_DATA_PATH = "/data/";

function siteDataUrl(file) {
  // file must be ONLY the filename, e.g. "chart1_spec.json"
  return `${SITE_DATA_PATH}${file}${CACHE_BUST}`;
}

// Consistent Vega-Lite configuration
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

const EMBED_OPTS = {
  actions: false,
  renderer: "svg",
  mode: "vega-lite",
  config: BASE_VL_CONFIG
};

function safeEmbed(selector, specOrUrl, opts = EMBED_OPTS) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element in HTML: ${selector}`);
    return Promise.resolve();
  }

  if (typeof vegaEmbed !== "function") {
    console.error("vegaEmbed is not available yet. Check CDN script loading.");
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

// ---- Rewrite relative URLs inside specs (e.g. data.url: "chart2_wage_squeeze.json") ----
function isRelativeUrl(u) {
  return (
    typeof u === "string" &&
    u.length > 0 &&
    !u.startsWith("http://") &&
    !u.startsWith("https://") &&
    !u.startsWith("/") &&
    !u.startsWith("data:")
  );
}

function rewriteUrlsDeep(node) {
  if (!node || typeof node !== "object") return;

  // Rewrite data.url
  if (node.data && typeof node.data === "object" && isRelativeUrl(node.data.url)) {
    node.data.url = `${SITE_DATA_PATH}${node.data.url}${CACHE_BUST}`;
  }

  // Rewrite any other url fields (conservative)
  if (isRelativeUrl(node.url)) {
    node.url = `${SITE_DATA_PATH}${node.url}${CACHE_BUST}`;
  }

  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach(rewriteUrlsDeep);
    else if (v && typeof v === "object") rewriteUrlsDeep(v);
  }
}

async function loadAndFixSpec(filename) {
  // filename must be ONLY the filename (NO "data/" prefix)
  const res = await fetch(siteDataUrl(filename), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${siteDataUrl(filename)}: HTTP ${res.status}`);
  const spec = await res.json();
  rewriteUrlsDeep(spec);
  return spec;
}

function initCharts() {
  // Charts 1–3 (spec files)
  loadAndFixSpec("chart1_spec.json")
    .then(spec => safeEmbed("#chart1", spec))
    .catch(err => safeEmbed("#chart1", { error: String(err) }));

  loadAndFixSpec("chart2_spec.json")
    .then(spec => safeEmbed("#chart2", spec))
    .catch(err => safeEmbed("#chart2", { error: String(err) }));

  loadAndFixSpec("chart3_spec.json")
    .then(spec => safeEmbed("#chart3", spec))
    .catch(err => safeEmbed("#chart3", { error: String(err) }));

  // Shared responsive sizing for inline specs
  const RESPONSIVE = { width: "container", autosize: { type: "fit", contains: "padding" } };

  // Charts 4–8 (inline specs pointing directly to data files)
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
        "bind": { "input": "radio", "options": ["Small Flat", "Medium House", "Large House", "Student Accommodation"], "name": "Household Type: " }
      },
      { "name": "showSupport", "value": true, "bind": { "input": "checkbox", "name": "Show Government Support " } }
    ],
    "transform": [{ "filter": "datum.household_type == householdType" }],
    "layer": [
      {
        "mark": { "type": "area", "opacity": 0.6, "color": "#ff6b6b" },
        "encoding": {
          "x": { "field": "date", "type": "temporal", "title": "Date", "axis": { "format": "%b %y", "labelAngle": -45 } },
          "y": { "field": "monthly_bill", "type": "quantitative", "title": "Monthly Cost (£)" }
        }
      }
    ],
    "config": BASE_VL_CONFIG
  });

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
      "color": { "field": "inflation", "type": "quantitative", "title": "Inflation %" }
    },
    "config": BASE_VL_CONFIG
  });

  safeEmbed("#chart6", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Housing Affordability Crisis by City", "subtitle": "Price-to-income and rent-to-income ratios" },
    ...RESPONSIVE,
    "height": 450,
    "data": { "url": siteDataUrl("chart6_housing_crisis.json") },
    "mark": "line",
    "encoding": {
      "x": { "field": "year", "type": "ordinal", "title": "Year" },
      "y": { "field": "price_to_income", "type": "quantitative", "title": "Ratio" }
    },
    "config": BASE_VL_CONFIG
  });

  safeEmbed("#chart7", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "G20 Countries: Inflation Crisis Comparison", "subtitle": "Click on country names in legend to highlight" },
    ...RESPONSIVE,
    "height": 450,
    "data": { "url": siteDataUrl("chart7_g20_comparison.json") },
    "mark": "line",
    "encoding": {
      "x": { "field": "date", "type": "temporal", "axis": { "format": "%b %Y", "labelAngle": -45 } },
      "y": { "field": "inflation", "type": "quantitative" },
      "color": { "field": "country", "type": "nominal" }
    },
    "config": BASE_VL_CONFIG
  });

  safeEmbed("#chart8", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Economic Scenario Explorer 2025–2027", "subtitle": "Explore different economic futures" },
    ...RESPONSIVE,
    "height": 450,
    "data": { "url": siteDataUrl("chart8_scenarios_enhanced.json") },
    "mark": "line",
    "encoding": {
      "x": { "field": "date", "type": "temporal", "axis": { "format": "%b %Y", "labelAngle": -45 } },
      "y": { "field": "inflation", "type": "quantitative" }
    },
    "config": BASE_VL_CONFIG
  });

  console.log("✅ project-charts.js loaded and embed calls executed.");
}

window.addEventListener("load", initCharts);
