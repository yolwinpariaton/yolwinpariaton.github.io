// ========================================
// PROJECT CHARTS - UK COST OF LIVING CRISIS
// Fix: rewrite relative data URLs inside spec JSON
// so charts always load from /data/...
// ========================================

// Cache-busting (optional; helps while iterating)
const CACHE_BUST = `?v=${new Date().toISOString().slice(0, 10)}`; // daily

// Always prefer serving data/specs from the same GitHub Pages domain.
// This avoids CORS complexity and fixes relative paths cleanly.
const SITE_DATA_PATH = `${window.location.origin}/data/`;

function siteDataUrl(file) {
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
// Fix relative URLs inside a Vega/Vega-Lite spec
// - If spec has data.url like "chart1_inflation_advanced.json"
//   rewrite to "https://<your-site>/data/chart1_inflation_advanced.json"
// - Leaves absolute URLs unchanged (http(s), /..., data:..., etc.)
// -----------------------------
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

  // If we find a { data: { url: "..." } } rewrite it
  if (node.data && typeof node.data === "object" && isRelativeUrl(node.data.url)) {
    node.data.url = `${SITE_DATA_PATH}${node.data.url}${CACHE_BUST}`;
  }

  // Some specs may use lookup/data sources elsewhere; rewrite any plain "url" keys cautiously
  // but only when they look like file names (relative) and the parent key suggests data.
  if (isRelativeUrl(node.url)) {
    // Rewrite only if this object looks like a data source or a URL-bearing config
    // (This is conservative but still fixes most common spec layouts.)
    node.url = `${SITE_DATA_PATH}${node.url}${CACHE_BUST}`;
  }

  // Recurse through children
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) {
      v.forEach(rewriteUrlsDeep);
    } else if (v && typeof v === "object") {
      rewriteUrlsDeep(v);
    }
  }
}

async function loadAndFixSpec(file) {
  const res = await fetch(siteDataUrl(file), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${file}: HTTP ${res.status}`);
  const spec = await res.json();
  rewriteUrlsDeep(spec);
  return spec;
}

function initCharts() {
  // Shared responsive sizing for inline specs
  const RESPONSIVE = {
    width: "container",
    autosize: { type: "fit", contains: "padding" }
  };

  // Charts 1–3: load spec JSON from /data and rewrite any relative data URLs
  loadAndFixSpec("chart1_spec.json")
    .then(spec => safeEmbed("#chart1", spec))
    .catch(err => safeEmbed("#chart1", { "error": String(err) }));

  loadAndFixSpec("chart2_spec.json")
    .then(spec => safeEmbed("#chart2", spec))
    .catch(err => safeEmbed("#chart2", { "error": String(err) }));

  loadAndFixSpec("chart3_spec.json")
    .then(spec => safeEmbed("#chart3", spec))
    .catch(err => safeEmbed("#chart3", { "error": String(err) }));

  // Chart 4: Energy Bill Impact Calculator
  safeEmbed("#chart4", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "Energy Bill Impact Calculator",
      "subtitle": "See how different household types are affected"
    },
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
      {
        "name": "showSupport",
        "value": true,
        "bind": { "input": "checkbox", "name": "Show Government Support " }
      }
    ],
    "transform": [
      { "filter": "datum.household_type == householdType" }
    ],
    "layer": [
      {
        "mark": { "type": "area", "opacity": 0.6, "color": "#ff6b6b" },
        "encoding": {
          "x": {
            "field": "date",
            "type": "temporal",
            "title": "Date",
            "axis": { "format": "%b %y", "labelAngle": -45 }
          },
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
          "tooltip": [
            { "field": "government_support", "title": "Support (£)", "format": ".0f" }
          ]
        }
      },
      {
        "mark": { "type": "line", "strokeWidth": 3, "color": "darkblue" },
        "encoding": {
          "x": { "field": "date", "type": "temporal" },
          "y": { "field": "net_bill", "type": "quantitative", "title": "Net Bill (£)" },
          "tooltip": [
            { "field": "net_bill", "title": "Net Bill (£)", "format": ".0f" }
          ]
        }
      }
    ],
    "config": BASE_VL_CONFIG
  });

  // Chart 5: Food Price Heatmap
  safeEmbed("#chart5", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "Food Category Inflation Heatmap",
      "subtitle": "Monthly inflation rates by food category"
    },
    ...RESPONSIVE,
    "height": 400,
    "data": { "url": siteDataUrl("chart5_food_heatmap.json") },
    "mark": "rect",
    "encoding": {
      "x": {
        "field": "date",
        "type": "ordinal",
        "title": "Month",
        "axis": { "labelAngle": -90, "labelLimit": 110 }
      },
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

  // Chart 6: Housing Affordability
  safeEmbed("#chart6", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "Housing Affordability Crisis by City",
      "subtitle": "Price-to-income and rent-to-income ratios"
    },
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
      "color": { "field": "metric", "type": "nominal", "legend": { "title": "Metric" } },
      "tooltip": [
        { "field": "city", "title": "City" },
        { "field": "year", "title": "Year" },
        { "field": "metric", "title": "Metric" },
        { "field": "value", "title": "Value", "format": ".2f" },
        { "field": "house_price", "title": "Avg House Price", "format": "£,.0f" },
        { "field": "annual_rent", "title": "Annual Rent", "format": "£,.0f" },
        { "field": "median_income", "title": "Median Income", "format": "£,.0f" }
      ]
    },
    "config": BASE_VL_CONFIG
  });

  // Chart 7: International Comparison
  safeEmbed("#chart7", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "G20 Countries: Inflation Crisis Comparison",
      "subtitle": "Click on country names in legend to highlight"
    },
    ...RESPONSIVE,
    "height": 450,
    "data": { "url": siteDataUrl("chart7_g20_comparison.json") },
    "params": [
      {
        "name": "countryHighlight",
        "select": { "type": "point", "fields": ["country"] },
        "bind": "legend"
      }
    ],
    "mark": { "type": "line", "strokeWidth": 2, "point": { "size": 20 } },
    "encoding": {
      "x": {
        "field": "date",
        "type": "temporal",
        "title": "Date",
        "axis": { "format": "%b %Y", "labelAngle": -45 }
      },
      "y": { "field": "inflation", "type": "quantitative", "title": "Inflation Rate (%)" },
      "color": { "field": "country", "type": "nominal", "scale": { "scheme": "tableau10" } },
      "opacity": { "condition": { "param": "countryHighlight", "value": 1 }, "value": 0.2 },
      "size": { "condition": { "param": "countryHighlight", "value": 3 }, "value": 1 },
      "tooltip": [
        { "field": "country", "title": "Country" },
        { "field": "date", "type": "temporal", "format": "%b %Y", "title": "Date" },
        { "field": "inflation", "title": "Inflation", "format": ".1f" }
      ]
    },
    "config": BASE_VL_CONFIG
  });

  // Chart 8: Scenario Explorer
  safeEmbed("#chart8", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "Economic Scenario Explorer 2025–2027",
      "subtitle": "Explore different economic futures"
    },
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
      },
      {
        "name": "showConfidence",
        "value": false,
        "bind": { "input": "checkbox", "name": "Show Confidence Bands " }
      }
    ],
    "transform": [
      { "filter": "datum.scenario == scenarioSelect" }
    ],
    "layer": [
      {
        "transform": [{ "filter": "showConfidence" }],
        "mark": { "type": "area", "opacity": 0.2, "color": "gray" },
        "encoding": {
          "x": { "field": "date", "type": "temporal", "title": "Date" },
          "y": { "field": "recession_probability", "type": "quantitative", "title": "Recession Risk (%)" },
          "y2": { "value": 0 }
        }
      },
      {
        "mark": { "type": "line", "strokeWidth": 3, "color": "#ff7f0e" },
        "encoding": {
          "x": { "field": "date", "type": "temporal", "axis": { "format": "%b %Y", "labelAngle": -45 } },
          "y": { "field": "inflation", "type": "quantitative", "title": "Inflation (%)" }
        }
      },
      {
        "mark": { "type": "line", "strokeWidth": 3, "color": "#2ca02c" },
        "encoding": {
          "x": { "field": "date", "type": "temporal" },
          "y": { "field": "wage_growth", "type": "quantitative", "title": "Wage Growth (%)" }
        }
      },
      {
        "mark": { "type": "line", "strokeWidth": 2, "strokeDash": [5, 5], "color": "#d62728" },
        "encoding": {
          "x": { "field": "date", "type": "temporal" },
          "y": { "field": "real_wage_growth", "type": "quantitative", "title": "Real Wage Growth (%)" }
        }
      }
    ],
    "resolve": { "scale": { "y": "independent" } },
    "config": BASE_VL_CONFIG
  });

  console.log("✅ project-charts.js loaded and embed calls executed.");
}

// Run when everything (including deferred CDN scripts) is ready
window.addEventListener("load", initCharts);
