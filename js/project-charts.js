/* js/project-charts.js
   Eight interactive Vega-Lite charts for the UK cost of living project.

   Expected JSON files in /data (records):
   - vis1_prices_vs_pay.json            fields: date, series, value
   - vis2_food_vs_headline.json         fields: date, series, value
   - vis3_energy_cap.json               fields: period_date, typical_annual_bill_gbp, period_label
   - vis4_fuel_weekly.json              fields: date, unleaded_ppl, diesel_ppl
   - vis5_rent_vs_house.json            fields: date, series, value
   - vis6_rent_map_regions.json         fields: areacd, areanm, rent_inflation_yoy_pct
   - vis7_rent_trend_regions.json       fields: date, areanm, rent_inflation_yoy_pct
   - vis8_rent_map_countries.json       fields: areacd, areanm, rent_inflation_yoy_pct
*/

(function () {
  const opts = { actions: false, renderer: "canvas" };

  // Stable TopoJSON from ONSdigital/uk-topojson (contains layers: uk, ctry, rgn, ...)
  const UK_TOPO_URL =
    "https://raw.githubusercontent.com/ONSdigital/uk-topojson/refs/heads/main/output/topo.json";

  function safeEmbed(selector, spec) {
    const el = document.querySelector(selector);
    if (!el) return;
    vegaEmbed(selector, spec, opts).catch((err) => {
      console.error("Vega embed error for", selector, err);
      el.innerHTML = "<p>Chart failed to load. Check console and JSON paths.</p>";
    });
  }

  // ======================================
  // 1) Prices vs pay (indexed) — size reduced
  // ======================================
  const vis1 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

    "title": {
      "text": "Prices vs pay (indexed to 2019 = 100)",
      "subtitle":
        "Shaded area shows the purchasing-power gap when consumer prices rise faster than real earnings."
    },

    "data": { "url": "data/vis1_prices_vs_pay.json" },
    "width": "container",
    "height": 300, // reduced (was taller)

    "transform": [
      { "calculate": "toDate(datum.date)", "as": "d" },
      { "calculate": "toNumber(datum.value)", "as": "v" },
      { "pivot": "series", "value": "v", "groupby": ["d"] },
      { "calculate": "datum['CPIH (prices)']", "as": "prices" },
      { "calculate": "datum['Real earnings']", "as": "earnings" },
      { "calculate": "datum.prices - datum.earnings", "as": "gap" }
    ],

    "layer": [
      // Baseline at 100 (dotted, subtle)
      {
        "mark": { "type": "rule", "strokeDash": [4, 6] },
        "encoding": {
          "y": { "datum": 100 },
          "color": { "value": "#6b778d" },
          "opacity": { "value": 0.7 }
        }
      },

      // Gap shading (between earnings and prices)
      {
        "mark": { "type": "area", "opacity": 0.18 },
        "encoding": {
          "x": {
            "field": "d",
            "type": "temporal",
            "title": "Date",
            "axis": { "format": "%Y", "tickCount": 7 }
          },
          "y": {
            "field": "earnings",
            "type": "quantitative",
            "title": "Index (2019 = 100)",
            "scale": { "zero": false, "domain": [98, 114] },
            "axis": { "tickCount": 6, "grid": true }
          },
          "y2": { "field": "prices" }
        }
      },

      // Prices line
      {
        "mark": { "type": "line", "strokeWidth": 3, "point": { "filled": true, "size": 40 } },
        "encoding": {
          "x": { "field": "d", "type": "temporal", "title": "Date" },
          "y": { "field": "prices", "type": "quantitative" },
          "color": { "value": "#4c72b0" },
          "tooltip": [
            { "field": "d", "type": "temporal", "title": "Date" },
            { "field": "prices", "type": "quantitative", "title": "CPIH (prices)", "format": ".1f" },
            { "field": "earnings", "type": "quantitative", "title": "Real earnings", "format": ".1f" },
            { "field": "gap", "type": "quantitative", "title": "Gap (prices − pay)", "format": ".1f" }
          ]
        }
      },

      // Earnings line
      {
        "mark": { "type": "line", "strokeWidth": 3, "point": { "filled": true, "size": 40 } },
        "encoding": {
          "x": { "field": "d", "type": "temporal", "title": "Date" },
          "y": { "field": "earnings", "type": "quantitative" },
          "color": { "value": "#e1812c" }
        }
      }
    ],

    "config": {
      "legend": { "disable": true },
      "axis": { "labelFontSize": 12, "titleFontSize": 12 },
      "title": { "fontSize": 22, "subtitleFontSize": 14 },
      "view": { "stroke": null }
    }
  };

  // ======================================
  // 2) Food inflation vs headline — size reduced
  // ======================================
  const vis2 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Food inflation vs headline (annual rate)" },
    "data": { "url": "data/vis2_food_vs_headline.json" },
    "width": "container",
    "height": 300, // reduced (was taller)

    "transform": [
      { "calculate": "toDate(datum.date)", "as": "d" },
      { "calculate": "toNumber(datum.value)", "as": "v" }
    ],

    "layer": [
      // Zero line (subtle reference)
      {
        "mark": { "type": "rule", "strokeDash": [4, 6] },
        "encoding": {
          "y": { "datum": 0 },
          "color": { "value": "#6b778d" },
          "opacity": { "value": 0.7 }
        }
      },

      // Raw monthly (lighter, with points)
      {
        "mark": {
          "type": "line",
          "strokeWidth": 2,
          "opacity": 0.35,
          "point": { "filled": true, "size": 30, "opacity": 0.35 }
        },
        "encoding": {
          "x": { "field": "d", "type": "temporal", "title": "Date" },
          "y": { "field": "v", "type": "quantitative", "title": "Percent" },
          "color": {
            "field": "series",
            "type": "nominal",
            "title": null,
            "scale": { "range": ["#4c72b0", "#e1812c"] },
            "legend": { "orient": "top", "direction": "horizontal", "title": null, "padding": 10 }
          },
          "tooltip": [
            { "field": "d", "type": "temporal", "title": "Date" },
            { "field": "series", "type": "nominal", "title": "Series" },
            { "field": "v", "type": "quantitative", "title": "Percent", "format": ".1f" }
          ]
        }
      },

      // Smoothed line (5-month moving average, bolder)
      {
        "transform": [
          {
            "window": [{ "op": "mean", "field": "v", "as": "v_ma" }],
            "frame": [-2, 2],
            "sort": [{ "field": "d", "order": "ascending" }],
            "groupby": ["series"]
          }
        ],
        "mark": { "type": "line", "strokeWidth": 4 },
        "encoding": {
          "x": { "field": "d", "type": "temporal", "title": "Date" },
          "y": { "field": "v_ma", "type": "quantitative", "title": "Percent" },
          "color": {
            "field": "series",
            "type": "nominal",
            "title": null,
            "scale": { "range": ["#4c72b0", "#e1812c"] },
            "legend": { "orient": "top", "direction": "horizontal", "title": null, "padding": 10 }
          }
        }
      }
    ],

    "config": {
      "axis": { "labelFontSize": 12, "titleFontSize": 12 },
      "title": { "fontSize": 22, "subtitleFontSize": 14 },
      "view": { "stroke": null }
    }
  };

// ======================================
  // 3) Energy cap (LOLLIPOP - PUBLICATION QUALITY)
  // ======================================
  const vis3 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    
    "title": {
      "text": "UK Energy Price Cap (2021-2025)",
      "subtitle": "Quarterly typical annual household bill - dramatic 87% increase during crisis",
      "fontSize": 16,
      "subtitleFontSize": 12,
      "anchor": "start"
    },
    
    "data": { "url": "data/vis3_energy_cap.json" },
    "width": "container",
    "height": 400,
    
    "transform": [
      {
        "calculate": "datum.typical_annual_bill_gbp",
        "as": "bill"
      }
    ],
    
    "encoding": {
      "x": {
        "field": "period_label",
        "type": "ordinal",
        "title": null,
        "sort": null,
        "axis": {
          "labelAngle": -45,
          "labelFontSize": 10
        }
      }
    },
    
    "layer": [
      // Reference line at £1000
      {
        "mark": {
          "type": "rule",
          "strokeDash": [4, 4],
          "color": "#94a3b8",
          "strokeWidth": 1.5
        },
        "encoding": {
          "y": { "datum": 1000 }
        }
      },
      
      // Sticks (narrower bars)
      {
        "mark": {
          "type": "bar",
          "width": 4,
          "opacity": 0.4
        },
        "encoding": {
          "y": {
            "field": "bill",
            "type": "quantitative",
            "title": "Annual Bill (£)",
            "scale": { "domain": [800, 2200] }
          },
          "y2": { "datum": 800 },
          "color": {
            "field": "bill",
            "type": "quantitative",
            "scale": {
              "domain": [1000, 1400, 1800, 2100],
              "range": ["#3b82f6", "#f59e0b", "#ef4444", "#991b1b"]
            },
            "legend": null
          }
        }
      },
      
      // Circle heads (large and prominent)
      {
        "mark": {
          "type": "circle",
          "size": 300,
          "stroke": "white",
          "strokeWidth": 3
        },
        "encoding": {
          "y": {
            "field": "bill",
            "type": "quantitative"
          },
          "color": {
            "field": "bill",
            "type": "quantitative",
            "scale": {
              "domain": [1000, 1400, 1800, 2100],
              "range": ["#3b82f6", "#f59e0b", "#ef4444", "#991b1b"]
            },
            "legend": {
              "title": "Bill Amount",
              "format": "£,.0f",
              "orient": "top",
              "direction": "horizontal",
              "labelFontSize": 10,
              "titleFontSize": 11
            }
          },
          "tooltip": [
            {"field": "period_label", "type": "nominal", "title": "Quarter"},
            {"field": "bill", "type": "quantitative", "title": "Annual Bill", "format": "£,.0f"}
          ]
        }
      },
      
      // Value labels on peaks
      {
        "transform": [
          { "filter": "datum.bill > 1800" }
        ],
        "mark": {
          "type": "text",
          "dy": -20,
          "fontSize": 11,
          "fontWeight": "bold",
          "color": "#991b1b"
        },
        "encoding": {
          "y": {
            "field": "bill",
            "type": "quantitative"
          },
          "text": {
            "field": "bill",
            "type": "quantitative",
            "format": "£,.0f"
          }
        }
      }
    ]
  };

  // 4) Fuel weekly (two-series)
  const vis4 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Weekly fuel prices (pence per litre)" },
    "data": { "url": "data/vis4_fuel_weekly.json" },
    "width": "container",
    "height": 320,
    "transform": [{ "fold": ["unleaded_ppl", "diesel_ppl"], "as": ["fuel", "ppl"] }],
    "mark": { "type": "line" },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date" },
      "y": { "field": "ppl", "type": "quantitative", "title": "Pence per litre" },
      "color": { "field": "fuel", "type": "nominal", "title": "" },
      "tooltip": [
        { "field": "date", "type": "temporal" },
        { "field": "fuel", "type": "nominal" },
        { "field": "ppl", "type": "quantitative", "format": ".1f" }
      ]
    }
  };

  // 5) Rent vs house inflation
  const vis5 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Rent vs house price inflation (annual rate)" },
    "data": { "url": "data/vis5_rent_vs_house.json" },
    "width": "container",
    "height": 320,
    "mark": { "type": "line" },
    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": "Date" },
      "y": { "field": "value", "type": "quantitative", "title": "Percent" },
      "color": { "field": "series", "type": "nominal", "title": "" },
      "tooltip": [
        { "field": "date", "type": "temporal" },
        { "field": "series", "type": "nominal" },
        { "field": "value", "type": "quantitative", "format": ".1f" }
      ]
    }
  };

  // 6) Map: rent inflation by region (choropleth)
  const vis6 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Rent inflation across regions (latest)" },
    "width": "container",
    "height": 420,
    "data": {
      "url": UK_TOPO_URL,
      "format": { "type": "topojson", "feature": "rgn" }
    },
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
      "color": {
        "field": "rent_inflation_yoy_pct",
        "type": "quantitative",
        "title": "% y/y",
        "legend": { "orient": "bottom" }
      },
      "tooltip": [
        { "field": "areanm", "type": "nominal", "title": "Area" },
        { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "% y/y", "format": ".1f" }
      ]
    }
  };

  // 7) Interactive trend: dropdown select region (compare to England)
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
            "North East",
            "North West",
            "Yorkshire and The Humber",
            "East Midlands",
            "West Midlands",
            "East of England",
            "London",
            "South East",
            "South West"
          ]
        }
      }
    ],
    "transform": [
      {
        "calculate":
          "datum.areanm === Region ? 'Selected region' : (datum.areanm === 'England' ? 'England' : 'Other')",
        "as": "group"
      }
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
    }
  };

  // 8) Map: UK countries rent inflation
  const vis8 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Rent inflation across UK countries (latest available)" },
    "width": "container",
    "height": 420,
    "data": {
      "url": UK_TOPO_URL,
      "format": { "type": "topojson", "feature": "ctry" }
    },
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
      "color": {
        "field": "rent_inflation_yoy_pct",
        "type": "quantitative",
        "title": "% y/y",
        "legend": { "orient": "bottom" }
      },
      "tooltip": [
        { "field": "areanm", "type": "nominal", "title": "Country" },
        { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "% y/y", "format": ".1f" }
      ]
    }
  };

  // Embed all eight charts
  safeEmbed("#vis1", vis1);
  safeEmbed("#vis2", vis2);
  safeEmbed("#vis3", vis3);
  safeEmbed("#vis4", vis4);
  safeEmbed("#vis5", vis5);
  safeEmbed("#vis6", vis6);
  safeEmbed("#vis7", vis7);
  safeEmbed("#vis8", vis8);
})();
