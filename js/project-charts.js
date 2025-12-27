// ========================================
// ENHANCED PROJECT CHARTS - UK COST OF LIVING CRISIS
// (Fixed: correct GitHub path + safe embedding so one failure doesn't stop the rest)
// ========================================

// ✅ Your repo info (as you provided)
const GITHUB_USER = "yolwinpariaton";
const GITHUB_REPO = "yolwinpariaton.github.io";
const DATA_PATH = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/data/`;

// Vega-Embed options (consistent rendering)
const EMBED_OPTS = { actions: false, renderer: "svg" };

// -----------------------------
// Safe embed: one failure will not break the rest
// -----------------------------
function safeEmbed(selector, specOrUrl, opts = EMBED_OPTS) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element in HTML: ${selector}`);
    return Promise.resolve();
  }

  return vegaEmbed(selector, specOrUrl, opts).catch(err => {
    console.error(`Embed failed: ${selector}`, err);
    el.innerHTML = `
      <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
        Chart failed to load. Check console for details.
      </div>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {

  // ----------------------------------------
  // Chart 1: Inflation (load from spec file)
  // ----------------------------------------
  safeEmbed("#chart1", `${DATA_PATH}chart1_spec.json`);

  // ----------------------------------------
  // Chart 2: Interactive Wage Squeeze
  // ----------------------------------------
  safeEmbed("#chart2", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "Real Wage Squeeze by Sector",
      "subtitle": "Track how different sectors are affected by inflation"
    },
    "width": 750,
    "height": 450,
    "data": { "url": `${DATA_PATH}chart2_wage_squeeze.json` },
    "params": [
      {
        "name": "sectorSelect",
        "value": "All",
        "bind": {
          "input": "select",
          "options": ["All", "Public Sector", "Private Sector", "Finance", "Retail", "Healthcare"],
          "name": "Select Sector: "
        }
      }
    ],
    "transform": [
      { "filter": "sectorSelect == 'All' || datum.sector == sectorSelect" }
    ],
    "mark": { "type": "line", "point": true, "strokeWidth": 2 },
    "encoding": {
      "x": {
        "field": "date",
        "type": "temporal",
        "title": "Date",
        "axis": { "format": "%b %Y", "labelAngle": -45 }
      },
      "y": {
        "field": "squeeze_index",
        "type": "quantitative",
        "title": "Real Wage Index (2020=100)",
        "scale": { "domain": [85, 110] }
      },
      "color": {
        "field": "sector",
        "type": "nominal",
        "scale": { "scheme": "category10" },
        "legend": { "title": "Sector" }
      },
      "tooltip": [
        { "field": "date", "type": "temporal", "format": "%B %Y", "title": "Date" },
        { "field": "sector", "title": "Sector" },
        { "field": "squeeze_index", "title": "Real Wage Index", "format": ".1f" },
        { "field": "inflation", "title": "Inflation Rate", "format": ".1f" }
      ]
    },
    "config": { "view": { "stroke": "transparent" } }
  });

  // ----------------------------------------
  // Chart 3: Regional Map (load from spec file)
  // ----------------------------------------
  safeEmbed("#chart3", `${DATA_PATH}chart3_spec.json`);

  // ----------------------------------------
  // Chart 4: Energy Bill Impact Calculator
  // ----------------------------------------
  safeEmbed("#chart4", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "Energy Bill Impact Calculator",
      "subtitle": "See how different household types are affected"
    },
    "width": 750,
    "height": 450,
    "data": { "url": `${DATA_PATH}chart4_energy_detailed.json` },
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
          "y": {
            "field": "monthly_bill",
            "type": "quantitative",
            "title": "Monthly Cost (£)"
          },
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
    "config": { "view": { "stroke": "transparent" } }
  });

  // ----------------------------------------
  // Chart 5: Food Price Heatmap
  // ----------------------------------------
  safeEmbed("#chart5", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "Food Category Inflation Heatmap",
      "subtitle": "Monthly inflation rates by food category"
    },
    "width": 750,
    "height": 400,
    "data": { "url": `${DATA_PATH}chart5_food_heatmap.json` },
    "mark": "rect",
    "encoding": {
      "x": {
        "field": "date",
        "type": "ordinal",
        "title": "Month",
        "axis": { "labelAngle": -90, "labelLimit": 100 }
      },
      "y": {
        "field": "category",
        "type": "nominal",
        "title": "Food Category"
      },
      "color": {
        "field": "inflation",
        "type": "quantitative",
        "scale": {
          "scheme": "redyellowgreen",
          "reverse": true,
          "domain": [-2, 25],
          "clamp": true
        },
        "title": "Inflation %",
        "legend": { "format": ".0f" }
      },
      "tooltip": [
        { "field": "category", "title": "Category" },
        { "field": "date", "title": "Month" },
        { "field": "inflation", "title": "Inflation", "format": ".1f" },
        { "field": "affordability_impact", "title": "Impact Level" }
      ]
    },
    "config": {
      "view": { "stroke": "transparent" },
      "axis": { "domainWidth": 1 }
    }
  });

  // ----------------------------------------
  // Chart 6: Housing Affordability
  // FIX: fold+filter bug (metricType should compare against 'metric', not datum.metric)
  // ----------------------------------------
  safeEmbed("#chart6", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "Housing Affordability Crisis by City",
      "subtitle": "Price-to-income and rent-to-income ratios"
    },
    "width": 750,
    "height": 450,
    "data": { "url": `${DATA_PATH}chart6_housing_crisis.json` },
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
      "color": {
        "field": "metric",
        "type": "nominal",
        "legend": { "title": "Metric" }
      },
      "tooltip": [
        { "field": "city", "title": "City" },
        { "field": "year", "title": "Year" },
        { "field": "metric", "title": "Metric" },
        { "field": "value", "title": "Value", "format": ".2f" },
        { "field": "house_price", "title": "Avg House Price", "format": "£,.0f" },
        { "field": "annual_rent", "title": "Annual Rent", "format": "£,.0f" },
        { "field": "median_income", "title": "Median Income", "format": "£,.0f" },
        { "field": "affordability_score", "title": "Affordability Score", "format": ".0f" }
      ]
    },
    "config": { "view": { "stroke": "transparent" } }
  });

  // ----------------------------------------
  // Chart 7: International Comparison
  // FIX: invalid time format "%Q %Y" -> use "%b %Y" (works reliably)
  // ----------------------------------------
  safeEmbed("#chart7", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "G20 Countries: Inflation Crisis Comparison",
      "subtitle": "Click on country names in legend to highlight"
    },
    "width": 750,
    "height": 450,
    "data": { "url": `${DATA_PATH}chart7_g20_comparison.json` },
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
      "y": {
        "field": "inflation",
        "type": "quantitative",
        "title": "Inflation Rate (%)"
      },
      "color": {
        "field": "country",
        "type": "nominal",
        "scale": { "scheme": "tableau10" }
      },
      "opacity": {
        "condition": { "param": "countryHighlight", "value": 1 },
        "value": 0.2
      },
      "size": {
        "condition": { "param": "countryHighlight", "value": 3 },
        "value": 1
      },
      "tooltip": [
        { "field": "country", "title": "Country" },
        { "field": "date", "type": "temporal", "format": "%b %Y", "title": "Date" },
        { "field": "inflation", "title": "Inflation", "format": ".1f" },
        { "field": "real_wage_growth", "title": "Real Wage Growth", "format": ".1f" },
        { "field": "crisis_severity", "title": "Crisis Severity Index" }
      ]
    },
    "config": { "view": { "stroke": "transparent" } }
  });

  // ----------------------------------------
  // Chart 8: Scenario Explorer
  // ----------------------------------------
  safeEmbed("#chart8", {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "Economic Scenario Explorer 2025-2027",
      "subtitle": "Explore different economic futures"
    },
    "width": 750,
    "height": 450,
    "data": { "url": `${DATA_PATH}chart8_scenarios_enhanced.json` },
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
      },
      {
        "mark": { "type": "line", "strokeWidth": 2, "color": "#9467bd", "opacity": 0.7 },
        "encoding": {
          "x": { "field": "date", "type": "temporal" },
          "y": { "field": "unemployment", "type": "quantitative", "title": "Unemployment (%)" }
        }
      }
    ],
    "resolve": { "scale": { "y": "independent" } },
    "encoding": {
      "tooltip": [
        { "field": "date", "type": "temporal", "format": "%B %Y", "title": "Date" },
        { "field": "inflation", "title": "Inflation", "format": ".1f" },
        { "field": "wage_growth", "title": "Wage Growth", "format": ".1f" },
        { "field": "real_wage_growth", "title": "Real Wage Growth", "format": ".1f" },
        { "field": "unemployment", "title": "Unemployment", "format": ".1f" },
        { "field": "consumer_confidence", "title": "Consumer Confidence" },
        { "field": "recession_probability", "title": "Recession Risk", "format": ".0f" }
      ]
    },
    "config": { "view": { "stroke": "transparent" } }
  });

  console.log("✅ project-charts.js loaded and embed calls executed.");
});
