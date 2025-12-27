// ========================================
// PROJECT CHARTS - UK COST OF LIVING CRISIS
// ========================================

// Configuration
const GITHUB_USER = "yolwinpariaton";
const GITHUB_REPO = "yolwinpariaton.github.io";
const DATA_PATH = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/data/`;

// Chart 1: Inflation Timeline
vegaEmbed('#chart1', `${DATA_PATH}chart1_spec.json`);

// Chart 2: Wages vs Inflation
vegaEmbed('#chart2', `${DATA_PATH}chart2_spec.json`);

// Chart 3: Regional Map
const chart3Spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Cost of Living Index by UK Region",
  "width": 700,
  "height": 500,
  "data": {
    "url": `${DATA_PATH}chart3_regional_costs.json`
  },
  "projection": {"type": "mercator"},
  "mark": {
    "type": "circle",
    "opacity": 0.8
  },
  "encoding": {
    "longitude": {"field": "lon", "type": "quantitative"},
    "latitude": {"field": "lat", "type": "quantitative"},
    "size": {
      "field": "cost_index",
      "type": "quantitative",
      "scale": {"range": [100, 1000]},
      "title": "Cost Index"
    },
    "color": {
      "field": "cost_index",
      "type": "quantitative",
      "scale": {"scheme": "orangered"},
      "title": "Cost Index"
    },
    "tooltip": [
      {"field": "region", "title": "Region"},
      {"field": "cost_index", "title": "Cost Index", "format": ".0f"}
    ]
  }
};
vegaEmbed('#chart3', chart3Spec);

// Chart 4: Energy Prices (Interactive)
const chart4Spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Energy Price Cap and Typical Bills",
  "width": 700,
  "height": 400,
  "data": {
    "url": `${DATA_PATH}chart4_energy_prices.json`
  },
  "params": [
    {
      "name": "showSupport",
      "value": true,
      "bind": {"input": "checkbox", "name": "Show Government Support "}
    }
  ],
  "layer": [
    {
      "mark": {"type": "line", "strokeWidth": 3},
      "encoding": {
        "x": {"field": "date", "type": "temporal", "title": "Date"},
        "y": {"field": "cap", "type": "quantitative", "title": "Annual Cap (£)"},
        "color": {"value": "#1f77b4"}
      }
    },
    {
      "transform": [{"filter": "showSupport"}],
      "mark": {"type": "line", "strokeWidth": 2, "strokeDash": [4, 4]},
      "encoding": {
        "x": {"field": "date", "type": "temporal"},
        "y": {"field": "effective_bill", "type": "quantitative", "scale": {"domain": [0, 400]}},
        "color": {"value": "green"}
      }
    }
  ]
};
vegaEmbed('#chart4', chart4Spec);

// Chart 5: Food Basket
const chart5Spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Essential Food Price Index (2020 = 100)",
  "width": 700,
  "height": 400,
  "data": {
    "url": `${DATA_PATH}chart5_food_basket.json`
  },
  "mark": "line",
  "encoding": {
    "x": {"field": "date", "type": "temporal", "title": "Date"},
    "y": {"field": "price_index", "type": "quantitative", "title": "Price Index"},
    "color": {"field": "item", "type": "nominal", "title": "Food Item"},
    "strokeWidth": {"value": 2}
  }
};
vegaEmbed('#chart5', chart5Spec);

// Chart 6: Housing Costs
const chart6Spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Housing Costs by Region",
  "width": 700,
  "height": 400,
  "data": {
    "url": `${DATA_PATH}chart6_housing_costs.json`
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "region", "type": "nominal", "title": "Region"},
    "y": {"field": "rent", "type": "quantitative", "title": "Monthly Cost (£)"},
    "color": {"field": "region", "type": "nominal", "legend": null},
    "column": {"field": "year", "type": "ordinal"},
    "tooltip": [
      {"field": "region"},
      {"field": "rent", "title": "Rent (£)"},
      {"field": "mortgage", "title": "Mortgage (£)"}
    ]
  }
};
vegaEmbed('#chart6', chart6Spec);

// Chart 7: International Comparison
const chart7Spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "G7 Inflation Comparison",
  "width": 700,
  "height": 400,
  "data": {
    "url": `${DATA_PATH}chart7_g7_comparison.json`
  },
  "mark": {"type": "line", "strokeWidth": 2},
  "encoding": {
    "x": {"field": "date", "type": "temporal", "title": "Date"},
    "y": {"field": "inflation", "type": "quantitative", "title": "Inflation Rate (%)"},
    "color": {
      "field": "country",
      "type": "nominal",
      "title": "Country",
      "scale": {"scheme": "category10"}
    }
  }
};
vegaEmbed('#chart7', chart7Spec);

// Chart 8: Future Scenarios (Interactive)
const chart8Spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": "Future Economic Scenarios",
  "width": 700,
  "height": 400,
  "data": {
    "url": `${DATA_PATH}chart8_future_scenarios.json`
  },
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
  "transform": [
    {"filter": "datum.scenario == scenarioSelect"}
  ],
  "layer": [
    {
      "mark": {"type": "area", "opacity": 0.3},
      "encoding": {
        "x": {"field": "date", "type": "temporal", "title": "Date"},
        "y": {"field": "inflation", "type": "quantitative", "title": "Rate (%)"},
        "color": {"value": "#ff7f0e"}
      }
    },
    {
      "mark": {"type": "line", "strokeWidth": 2},
      "encoding": {
        "x": {"field": "date", "type": "temporal"},
        "y": {"field": "wage_growth", "type": "quantitative"},
        "color": {"value": "#2ca02c"}
      }
    },
    {
      "mark": {"type": "line", "strokeWidth": 2, "strokeDash": [4, 4]},
      "encoding": {
        "x": {"field": "date", "type": "temporal"},
        "y": {"field": "real_wage_growth", "type": "quantitative"},
        "color": {"value": "#d62728"}
      }
    }
  ]
};
vegaEmbed('#chart8', chart8Spec);