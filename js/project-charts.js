// ========================================
// ENHANCED PROJECT CHARTS - UK COST OF LIVING CRISIS
// ========================================

const GITHUB_USER = "YOUR_USERNAME";
const GITHUB_REPO = "YOUR_REPO";
const DATA_PATH = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/data/`;

// Chart 1: Enhanced Inflation with Decomposition - Load from spec
vegaEmbed('#chart1', `${DATA_PATH}chart1_spec.json`)
  .catch(console.error);

// Chart 2: Interactive Wage Squeeze Dashboard
vegaEmbed('#chart2', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "Real Wage Squeeze by Sector",
    "subtitle": "Track how different sectors are affected by inflation"
  },
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
  "mark": {"type": "line", "point": true, "strokeWidth": 2},
  "encoding": {
    "x": {
      "field": "date", 
      "type": "temporal",
      "title": "Date",
      "axis": {"format": "%b %Y", "labelAngle": -45}
    },
    "y": {
      "field": "squeeze_index", 
      "type": "quantitative", 
      "title": "Real Wage Index (2020=100)",
      "scale": {"domain": [85, 110]}
    },
    "color": {
      "field": "sector", 
      "type": "nominal",
      "scale": {"scheme": "category10"},
      "legend": {"title": "Sector"}
    },
    "tooltip": [
      {"field": "date", "type": "temporal", "format": "%B %Y", "title": "Date"},
      {"field": "sector", "title": "Sector"},
      {"field": "squeeze_index", "title": "Real Wage Index", "format": ".1f"},
      {"field": "inflation", "title": "Inflation Rate", "format": ".1f%"}
    ]
  }
}).catch(console.error);

// Chart 3: Advanced Regional Map - Load from spec
vegaEmbed('#chart3', `${DATA_PATH}chart3_spec.json`)
  .catch(console.error);

// Chart 4: Energy Bill Impact Calculator
vegaEmbed('#chart4', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "Energy Bill Impact Calculator",
    "subtitle": "See how different household types are affected"
  },
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
    },
    {
      "name": "showSupport",
      "value": true,
      "bind": {"input": "checkbox", "name": "Show Government Support "}
    }
  ],
  "transform": [
    {"filter": "datum.household_type == householdType"}
  ],
  "layer": [
    {
      "mark": {"type": "area", "opacity": 0.6, "color": "#ff6b6b"},
      "encoding": {
        "x": {
          "field": "date", 
          "type": "temporal", 
          "title": "Date",
          "axis": {"format": "%b %y", "labelAngle": -45}
        },
        "y": {
          "field": "monthly_bill", 
          "type": "quantitative", 
          "title": "Monthly Cost (£)"
        },
        "tooltip": [
          {"field": "date", "type": "temporal", "format": "%B %Y"},
          {"field": "monthly_bill", "title": "Bill (£)", "format": ".0f"}
        ]
      }
    },
    {
      "transform": [{"filter": "showSupport"}],
      "mark": {"type": "area", "opacity": 0.8, "color": "#51cf66"},
      "encoding": {
        "x": {"field": "date", "type": "temporal"},
        "y": {"field": "government_support", "type": "quantitative"},
        "tooltip": [
          {"field": "government_support", "title": "Support (£)", "format": ".0f"}
        ]
      }
    },
    {
      "mark": {"type": "line", "strokeWidth": 3, "color": "darkblue"},
      "encoding": {
        "x": {"field": "date", "type": "temporal"},
        "y": {"field": "net_bill", "type": "quantitative"},
        "tooltip": [
          {"field": "net_bill", "title": "Net Bill (£)", "format": ".0f"}
        ]
      }
    }
  ]
}).catch(console.error);

// Chart 5: Food Price Heatmap
vegaEmbed('#chart5', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "Food Category Inflation Heatmap",
    "subtitle": "Monthly inflation rates by food category"
  },
  "width": 750,
  "height": 400,
  "data": {"url": `${DATA_PATH}chart5_food_heatmap.json`},
  "mark": "rect",
  "encoding": {
    "x": {
      "field": "date", 
      "type": "ordinal", 
      "title": "Month",
      "axis": {"labelAngle": -90, "labelLimit": 100}
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
      "legend": {"format": ".0f"}
    },
    "tooltip": [
      {"field": "category", "title": "Category"},
      {"field": "date", "title": "Month"},
      {"field": "inflation", "title": "Inflation", "format": ".1f%"},
      {"field": "affordability_impact", "title": "Impact Level"}
    ]
  },
  "config": {
    "view": {"stroke": "transparent"},
    "axis": {"domainWidth": 1}
  }
}).catch(console.error);

// Chart 6: Housing Affordability Crisis
vegaEmbed('#chart6', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "Housing Affordability Crisis by City",
    "subtitle": "Price-to-income and rent-to-income ratios"
  },
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
    },
    {
      "name": "metricType",
      "value": "both",
      "bind": {
        "input": "radio",
        "options": ["both", "price_to_income", "rent_to_income"],
        "labels": ["Both", "House Prices", "Rent"],
        "name": "Show: "
      }
    }
  ],
  "transform": [
    {"filter": "datum.city == citySelect"},
    {"fold": ["price_to_income", "rent_to_income", "mortgage_to_income"], "as": ["metric", "value"]},
    {"filter": "metricType == 'both' || datum.metric == metricType"}
  ],
  "mark": {"type": "line", "strokeWidth": 3, "point": {"size": 100}},
  "encoding": {
    "x": {
      "field": "year", 
      "type": "ordinal",
      "title": "Year"
    },
    "y": {
      "field": "value", 
      "type": "quantitative",
      "title": "Ratio / Percentage"
    },
    "color": {
      "field": "metric",
      "type": "nominal",
      "scale": {
        "domain": ["price_to_income", "rent_to_income", "mortgage_to_income"],
        "range": ["#e74c3c", "#3498db", "#f39c12"]
      },
      "legend": {
        "title": "Metric",
        "labelExpr": "datum.value == 'price_to_income' ? 'Price/Income Ratio' : datum.value == 'rent_to_income' ? 'Rent/Income %' : 'Mortgage/Income %'"
      }
    },
    "tooltip": [
      {"field": "city", "title": "City"},
      {"field": "year", "title": "Year"},
      {"field": "house_price", "title": "Avg House Price", "format": "£,.0f"},
      {"field": "annual_rent", "title": "Annual Rent", "format": "£,.0f"},
      {"field": "median_income", "title": "Median Income", "format": "£,.0f"},
      {"field": "affordability_score", "title": "Affordability Score", "format": ".0f"}
    ]
  }
}).catch(console.error);

// Chart 7: G20 International Comparison
vegaEmbed('#chart7', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "G20 Countries: Inflation Crisis Comparison",
    "subtitle": "Click on country names in legend to highlight"
  },
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
  "mark": {"type": "line", "strokeWidth": 2, "point": {"size": 20}},
  "encoding": {
    "x": {
      "field": "date", 
      "type": "temporal",
      "title": "Date",
      "axis": {"format": "%Q %Y"}
    },
    "y": {
      "field": "inflation", 
      "type": "quantitative", 
      "title": "Inflation Rate (%)",
      "scale": {"domain": [-1, 15]}
    },
    "color": {
      "field": "country", 
      "type": "nominal",
      "scale": {"scheme": "tableau10"}
    },
    "opacity": {
      "condition": {"param": "countryHighlight", "value": 1},
      "value": 0.2
    },
    "size": {
      "condition": {"param": "countryHighlight", "value": 3},
      "value": 1
    },
    "tooltip": [
      {"field": "country", "title": "Country"},
      {"field": "date", "type": "temporal", "format": "%Q %Y", "title": "Quarter"},
      {"field": "inflation", "title": "Inflation", "format": ".1f%"},
      {"field": "real_wage_growth", "title": "Real Wage Growth", "format": ".1f%"},
      {"field": "crisis_severity", "title": "Crisis Severity Index"}
    ]
  }
}).catch(console.error);

// Chart 8: Interactive Economic Scenario Explorer
vegaEmbed('#chart8', {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "title": {
    "text": "Economic Scenario Explorer 2025-2027",
    "subtitle": "Explore different economic futures"
  },
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
      "name": "showConfidence",
      "value": false,
      "bind": {"input": "checkbox", "name": "Show Confidence Bands "}
    }
  ],
  "transform": [
    {"filter": "datum.scenario == scenarioSelect"}
  ],
  "layer": [
    {
      "mark": {"type": "area", "opacity": 0.2, "color": "gray"},
      "transform": [{"filter": "showConfidence"}],
      "encoding": {
        "x": {"field": "date", "type": "temporal"},
        "y": {"field": "recession_probability", "type": "quantitative", "scale": {"domain": [0, 100]}},
        "y2": {"value": 0}
      }
    },
    {
      "mark": {"type": "line", "strokeWidth": 3, "color": "#ff7f0e"},
      "encoding": {
        "x": {
          "field": "date", 
          "type": "temporal", 
          "title": "Date",
          "axis": {"format": "%b %Y", "labelAngle": -45}
        },
        "y": {
          "field": "inflation", 
          "type": "quantitative",
          "title": "Rate (%)",
          "scale": {"domain": [-2, 10]}
        }
      }
    },
    {
      "mark": {"type": "line", "strokeWidth": 3, "color": "#2ca02c"},
      "encoding": {
        "x": {"field": "date", "type": "temporal"},
        "y": {"field": "wage_growth", "type": "quantitative"}
      }
    },
    {
      "mark": {"type": "line", "strokeWidth": 2, "strokeDash": [5, 5], "color": "#d62728"},
      "encoding": {
        "x": {"field": "date", "type": "temporal"},
        "y": {"field": "real_wage_growth", "type": "quantitative"}
      }
    },
    {
      "mark": {"type": "line", "strokeWidth": 2, "color": "#9467bd", "opacity": 0.7},
      "encoding": {
        "x": {"field": "date", "type": "temporal"},
        "y": {"field": "unemployment", "type": "quantitative"}
      }
    }
  ],
  "resolve": {"scale": {"y": "independent"}},
  "encoding": {
    "tooltip": [
      {"field": "date", "type": "temporal", "format": "%B %Y", "title": "Date"},
      {"field": "inflation", "title": "Inflation", "format": ".1f%"},
      {"field": "wage_growth", "title": "Wage Growth", "format": ".1f%"},
      {"field": "real_wage_growth", "title": "Real Wage Growth", "format": ".1f%"},
      {"field": "unemployment", "title": "Unemployment", "format": ".1f%"},
      {"field": "consumer_confidence", "title": "Consumer Confidence"},
      {"field": "recession_probability", "title": "Recession Risk", "format": ".0f%"}
    ]
  }
}).catch(console.error);

console.log("✅ All charts loaded successfully!");