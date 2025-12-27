// ========================================
// PROJECT CHARTS - UK COST OF LIVING CRISIS
// ========================================

// ----------------------------
// Configuration (your repo)
// ----------------------------
const GITHUB_USER = "yolwinpariaton";
const GITHUB_REPO = "yolwinpariaton.github.io";
const DATA_PATH = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/data/`;

// Chart 1: Enhanced Inflation with Decomposition
vegaEmbed('#chart1', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "UK Inflation Crisis: Component Analysis",
    "subtitle": "Click legend to isolate components"
  },
  "width": 750,
  "height": 450,
  "data": {"url": `${DATA_PATH}chart1_inflation_advanced.json`},
  "mark": "area",
  "encoding": {
    "x": {
      "field": "date",
      "type": "temporal",
      "axis": {"format": "%b %Y", "labelAngle": -45}
    },
    "y": {
      "field": "value",
      "type": "quantitative",
      "stack": "zero",
      "title": "Contribution to Inflation (%)"
    },
    "color": {
      "field": "component",
      "type": "nominal",
      "scale": {
        "domain": ["Energy", "Food", "Core"],
        "range": ["#ff4444", "#ff9800", "#2196f3"]
      }
    },
    "opacity": {
      "condition": {"param": "hover", "value": 1},
      "value": 0.7
    }
  },
  "params": [{
    "name": "hover",
    "select": {"type": "point", "on": "mouseover", "clear": "mouseout"}
  }]
});

// Chart 2: Interactive Wage Squeeze Dashboard
vegaEmbed('#chart2', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Real Wage Squeeze by Sector",
  "width": 750,
  "height": 450,
  "data": {"url": `${DATA_PATH}chart2_wage_squeeze.json`},
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
    {"filter": "sectorSelect == 'All' || datum.sector == sectorSelect"}
  ],
  "mark": {"type": "line", "point": true},
  "encoding": {
    "x": {"field": "date", "type": "temporal"},
    "y": {"field": "squeeze_index", "type": "quantitative", "title": "Real Wage Index (2020=100)"},
    "color": {"field": "sector", "type": "nominal"},
    "strokeWidth": {"condition": {"param": "hover", "value": 4}, "value": 2},
    "opacity": {"condition": {"param": "hover", "value": 1}, "value": 0.7}
  }
});

// Chart 3: Advanced Regional Map
vegaEmbed('#chart3', `${DATA_PATH}chart3_spec.json`);

// Chart 4: Energy Calculator
vegaEmbed('#chart4', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Energy Bill Impact Calculator",
  "width": 750,
  "height": 450,
  "data": {"url": `${DATA_PATH}chart4_energy_detailed.json`},
  "params": [
    {
      "name": "householdType",
      "value": "Medium House",
      "bind": {
        "input": "radio",
        "options": ["Small Flat", "Medium House", "Large House", "Student Accommodation"],
        "name": "Household Type: "
      }
    }
  ],
  "transform": [
    {"filter": "datum.household_type == householdType"}
  ],
  "layer": [
    {
      "mark": {"type": "bar", "opacity": 0.7},
      "encoding": {
        "x": {"field": "date", "type": "temporal", "axis": {"format": "%b %y"}},
        "y": {"field": "monthly_bill", "type": "quantitative", "title": "Monthly Bill (£)"},
        "color": {"value": "#ff6b6b"}
      }
    },
    {
      "mark": {"type": "bar", "opacity": 0.9},
      "encoding": {
        "x": {"field": "date", "type": "temporal"},
        "y": {"field": "government_support", "type": "quantitative"},
        "color": {"value": "#51cf66"}
      }
    }
  ]
});

// Chart 5: Food Price Heatmap
vegaEmbed('#chart5', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Food Category Inflation Heatmap",
  "width": 750,
  "height": 400,
  "data": {"url": `${DATA_PATH}chart5_food_heatmap.json`},
  "mark": "rect",
  "encoding": {
    "x": {"field": "date", "type": "ordinal", "title": "Month"},
    "y": {"field": "category", "type": "nominal", "title": "Food Category"},
    "color": {
      "field": "inflation",
      "type": "quantitative",
      "scale": {"scheme": "redyellowgreen", "reverse": true, "domain": [-2, 25]},
      "title": "Inflation %"
    },
    "tooltip": [
      {"field": "category", "title": "Category"},
      {"field": "date", "title": "Month"},
      {"field": "inflation", "title": "Inflation", "format": ".1f%"}
    ]
  }
});

// Chart 6: Housing Crisis Dashboard
vegaEmbed('#chart6', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Housing Affordability Crisis",
  "width": 750,
  "height": 450,
  "data": {"url": `${DATA_PATH}chart6_housing_crisis.json`},
  "params": [
    {
      "name": "citySelect",
      "value": "London",
      "bind": {
        "input": "select",
        "options": ["London", "Manchester", "Birmingham", "Edinburgh", "Cardiff", "Leeds", "Bristol", "Newcastle"],
        "name": "Select City: "
      }
    }
  ],
  "transform": [
    {"filter": "datum.city == citySelect"}
  ],
  "layer": [
    {
      "mark": {"type": "line", "strokeWidth": 3},
      "encoding": {
        "x": {"field": "year", "type": "ordinal"},
        "y": {"field": "price_to_income", "type": "quantitative", "title": "Ratio"},
        "color": {"value": "#e74c3c"}
      }
    },
    {
      "mark": {"type": "line", "strokeWidth": 3, "strokeDash": [5, 5]},
      "encoding": {
        "x": {"field": "year", "type": "ordinal"},
        "y": {"field": "rent_to_income", "type": "quantitative"},
        "color": {"value": "#3498db"}
      }
    }
  ]
});

// Chart 7: G20 Comparison
vegaEmbed('#chart7', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "G20 Crisis Comparison",
  "width": 750,
  "height": 450,
  "data": {"url": `${DATA_PATH}chart7_g20_comparison.json`},
  "params": [
    {
      "name": "countryHighlight",
      "select": {"type": "point", "fields": ["country"]},
      "bind": "legend"
    }
  ],
  "mark": {"type": "line", "strokeWidth": 2},
  "encoding": {
    "x": {"field": "date", "type": "temporal"},
    "y": {"field": "inflation", "type": "quantitative", "title": "Inflation Rate (%)"},
    "color": {"field": "country", "type": "nominal"},
    "opacity": {
      "condition": {"param": "countryHighlight", "value": 1},
      "value": 0.2
    },
    "size": {
      "condition": {"param": "countryHighlight", "value": 3},
      "value": 1
    }
  }
});

// Chart 8: Scenario Explorer
vegaEmbed('#chart8', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Economic Scenario Explorer 2025-2027",
  "width": 750,
  "height": 450,
  "data": {"url": `${DATA_PATH}chart8_scenarios_enhanced.json`},
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
      "name": "metricSelect",
      "value": "inflation",
      "bind": {
        "input": "radio",
        "options": ["inflation", "real_wage_growth", "unemployment", "consumer_confidence"],
        "name": "Metric: "
      }
    }
  ],
  "transform": [
    {"filter": "datum.scenario == scenarioSelect"},
    {"fold": ["inflation", "real_wage_growth", "unemployment", "consumer_confidence"]},
    {"filter": "datum.key == metricSelect"}
  ],
  "mark": {"type": "area", "line": true, "point": true},
  "encoding": {
    "x": {"field": "date", "type": "temporal", "title": ""},
    "y": {"field": "value", "type": "quantitative", "title": {"expr": "metricSelect"}},
    "color": {"value": "#9b59b6"},
    "tooltip": [
      {"field": "date", "type": "temporal", "format": "%B %Y"},
      {"field": "value", "type": "quantitative", "format": ".1f"}
    ]
  }
});