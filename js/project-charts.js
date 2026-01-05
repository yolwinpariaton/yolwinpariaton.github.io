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
  // 3) Energy cap (PUBLICATION-READY - POLISHED)
  // ======================================
  const vis3 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    
    "title": {
      "text": "UK Energy Price Cap: The Crisis in Context",
      "subtitle": "Quarterly typical household bills (2021-2025) | Peak of £2,070 represents 118% increase from pre-crisis baseline",
      "fontSize": 20,
      "subtitleFontSize": 12,
      "anchor": "start",
      "color": "#0f172a",
      "subtitleColor": "#64748b",
      "offset": 20
    },
    
    "data": { 
      "url": "data/vis3_energy_cap.json"
    },
    "width": "container",
    "height": 550,
    "padding": {"bottom": 60, "top": 10},
    
    "encoding": {
      "x": {
        "field": "period_label",
        "type": "ordinal",
        "title": "Quarter",
        "sort": ["2021 Q4", "2022 Q1", "2022 Q2", "2022 Q3", "2022 Q4", "2023 Q1", "2023 Q2", "2023 Q3", "2023 Q4", "2024 Q1", "2024 Q2", "2024 Q3", "2024 Q4", "2025 Q1", "2025 Q2", "2025 Q3", "2025 Q4"],
        "axis": {
          "labelAngle": -45,
          "labelFontSize": 11,
          "labelColor": "#475569",
          "labelPadding": 10,
          "domainColor": "#cbd5e1",
          "tickColor": "#cbd5e1",
          "titleFontSize": 13,
          "titleColor": "#0f172a",
          "titlePadding": 15,
          "labelAlign": "right",
          "labelBaseline": "middle"
        }
      },
      "y": {
        "field": "typical_annual_bill_gbp",
        "type": "quantitative",
        "title": "Annual Bill (£)",
        "scale": { 
          "domain": [0, 2250],
          "nice": false
        },
        "axis": {
          "format": ",.0f",
          "labelFontSize": 12,
          "titleFontSize": 14,
          "titleFontWeight": "normal",
          "titleColor": "#0f172a",
          "labelColor": "#475569",
          "grid": true,
          "gridOpacity": 0.12,
          "gridColor": "#cbd5e1",
          "domainColor": "#cbd5e1",
          "tickColor": "#cbd5e1"
        }
      }
    },
    
    "layer": [
      // Pre-crisis baseline shading (green - showing "normal" range)
      {
        "mark": {
          "type": "rect",
          "color": "#d1fae5",
          "opacity": 0.3
        },
        "encoding": {
          "x": {"datum": "2021 Q4"},
          "x2": {"datum": "2022 Q3"},
          "y": {"datum": 0},
          "y2": {"datum": 2250}
        }
      },
      
      // Crisis period shading (red - peaks)
      {
        "data": {
          "values": [
            {"x1": "2024 Q2", "x2": "2025 Q4"}
          ]
        },
        "mark": {
          "type": "rect",
          "color": "#fee2e2",
          "opacity": 0.3
        },
        "encoding": {
          "x": {"field": "x1", "type": "ordinal"},
          "x2": {"field": "x2"},
          "y": {"datum": 0},
          "y2": {"datum": 2250}
        }
      },
      
      // Reference line at pre-crisis average (~£1,070)
      {
        "mark": {
          "type": "rule",
          "strokeDash": [6, 4],
          "color": "#10b981",
          "strokeWidth": 2,
          "opacity": 0.5
        },
        "encoding": {
          "y": {"datum": 1070}
        }
      },
      
      // Connecting line
      {
        "mark": {
          "type": "line",
          "strokeWidth": 3,
          "color": "#94a3b8",
          "opacity": 0.6
        }
      },
      
      // Colored circles
      {
        "mark": {
          "type": "circle",
          "size": 450,
          "stroke": "white",
          "strokeWidth": 3
        },
        "encoding": {
          "color": {
            "field": "typical_annual_bill_gbp",
            "type": "quantitative",
            "scale": {
              "domain": [950, 1300, 1700, 2070],
              "range": ["#10b981", "#3b82f6", "#f97316", "#dc2626"]
            },
            "legend": {
              "title": "Bill Amount (£)",
              "format": ",.0f",
              "orient": "top-left",
              "direction": "horizontal",
              "labelFontSize": 11,
              "titleFontSize": 12,
              "titleColor": "#0f172a",
              "labelColor": "#475569",
              "symbolSize": 300,
              "symbolType": "circle",
              "symbolStrokeWidth": 2,
              "offset": 10
            }
          },
          "tooltip": [
            {
              "field": "period_label",
              "type": "nominal",
              "title": "Quarter"
            },
            {
              "field": "typical_annual_bill_gbp",
              "type": "quantitative",
              "title": "Annual Bill",
              "format": ",.0f"
            }
          ]
        }
      },
      
      // Value labels for extremes
      {
        "transform": [
          { "filter": "datum.typical_annual_bill_gbp === 950 || datum.typical_annual_bill_gbp === 2070 || datum.typical_annual_bill_gbp === 1850 || datum.typical_annual_bill_gbp === 1856" }
        ],
        "mark": {
          "type": "text",
          "dy": -26,
          "fontSize": 13,
          "fontWeight": "bold",
          "color": "#0f172a"
        },
        "encoding": {
          "text": {
            "field": "typical_annual_bill_gbp",
            "type": "quantitative",
            "format": ",.0f"
          }
        }
      },
      
      // "Pre-crisis Period" label (top)
      {
        "data": {
          "values": [{"x": "2022 Q1", "y": 2200, "text": "Pre-crisis Period"}]
        },
        "mark": {
          "type": "text",
          "fontSize": 12,
          "fontWeight": "600",
          "color": "#10b981",
          "align": "center"
        },
        "encoding": {
          "x": {"field": "x", "type": "ordinal"},
          "y": {"field": "y", "type": "quantitative"},
          "text": {"field": "text"}
        }
      },
      
      // "Crisis Peak Period" label (top)
      {
        "data": {
          "values": [{"x": "2025 Q1", "y": 2200, "text": "Crisis Peak Period"}]
        },
        "mark": {
          "type": "text",
          "fontSize": 12,
          "fontWeight": "600",
          "color": "#dc2626",
          "align": "center"
        },
        "encoding": {
          "x": {"field": "x", "type": "ordinal"},
          "y": {"field": "y", "type": "quantitative"},
          "text": {"field": "text"}
        }
      },
      
      // "Pre-crisis low" annotation (bottom)
      {
        "transform": [
          { "filter": "datum.typical_annual_bill_gbp === 950" }
        ],
        "mark": {
          "type": "text",
          "dy": 32,
          "fontSize": 11,
          "fontStyle": "italic",
          "color": "#10b981",
          "text": "Pre-crisis low"
        }
      },
      
      // Peak annotation
      {
        "transform": [
          { "filter": "datum.typical_annual_bill_gbp === 2070" }
        ],
        "mark": {
          "type": "text",
          "dy": 42,
          "fontSize": 11,
          "fontStyle": "italic",
          "color": "#dc2626",
          "text": "+118%"
        }
      }
    ],
    
    "config": {
      "view": { 
        "stroke": null
      },
      "background": "#ffffff"
    }
  };

// ======================================
// 4) Weekly fuel prices (PUBLICATION QUALITY - ENHANCED)
// ======================================
const vis4 = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

  "title": {
    "text": "UK Fuel Prices: Weekly Volatility (2019-2024)",
    "subtitle": "Raw weekly data (faint) with 5-week moving average (bold) | Peak prices during 2022 energy crisis",
    "fontSize": 20,
    "subtitleFontSize": 12,
    "anchor": "start",
    "color": "#0f172a",
    "subtitleColor": "#64748b"
  },

  "data": { "url": "data/vis4_fuel_weekly.json" },
  "width": "container",
  "height": 420,
  "padding": {"top": 10},

  "transform": [
    { "calculate": "toDate(datum.date)", "as": "d" },
    { "fold": ["unleaded_ppl", "diesel_ppl"], "as": ["fuel_raw", "ppl_raw"] },
    { "calculate": "toNumber(datum.ppl_raw)", "as": "ppl" },
    {
      "calculate":
        "datum.fuel_raw === 'unleaded_ppl' ? 'Unleaded (petrol)' : 'Diesel'",
      "as": "fuel"
    }
  ],

  "encoding": {
    "x": {
      "field": "d",
      "type": "temporal",
      "title": "Date",
      "axis": { 
        "format": "%Y", 
        "tickCount": 7, 
        "labelFontSize": 11, 
        "titleFontSize": 13,
        "labelColor": "#475569",
        "titleColor": "#0f172a",
        "domainColor": "#cbd5e1",
        "tickColor": "#cbd5e1"
      }
    },
    "y": {
      "type": "quantitative",
      "title": "Pence per litre",
      "axis": { 
        "labelFontSize": 12, 
        "titleFontSize": 14,
        "labelColor": "#475569",
        "titleColor": "#0f172a",
        "grid": true, 
        "gridOpacity": 0.12,
        "gridColor": "#cbd5e1",
        "domainColor": "#cbd5e1",
        "tickColor": "#cbd5e1"
      }
    },
    "color": {
      "field": "fuel",
      "type": "nominal",
      "title": "Fuel Type",
      "scale": { "range": ["#3b82f6", "#f59e0b"] },
      "legend": { 
        "orient": "top-left", 
        "direction": "horizontal", 
        "titleFontSize": 12,
        "labelFontSize": 11,
        "titleColor": "#0f172a",
        "labelColor": "#475569",
        "symbolSize": 200,
        "symbolStrokeWidth": 2,
        "offset": 10
      }
    }
  },

  "layer": [
    // Crisis period shading (2022 peaks)
    {
      "data": {
        "values": [{"start": "2022-03-01", "end": "2022-08-01"}]
      },
      "mark": {
        "type": "rect",
        "color": "#fee2e2",
        "opacity": 0.25
      },
      "encoding": {
        "x": {"field": "start", "type": "temporal"},
        "x2": {"field": "end", "type": "temporal"}
      }
    },

    // Raw weekly line (context, subtle)
    {
      "mark": { "type": "line", "strokeWidth": 1.5, "opacity": 0.25 },
      "encoding": {
        "y": { "field": "ppl", "type": "quantitative" }
      }
    },

    // Smoothed line (5-week moving average, prominent)
    {
      "transform": [
        {
          "window": [{ "op": "mean", "field": "ppl", "as": "ppl_ma" }],
          "frame": [-2, 2],
          "sort": [{ "field": "d", "order": "ascending" }],
          "groupby": ["fuel"]
        }
      ],
      "mark": { "type": "line", "strokeWidth": 3.5 },
      "encoding": {
        "y": { "field": "ppl_ma", "type": "quantitative" }
      }
    },

    // Hover points for tooltips
    {
      "transform": [
        {
          "window": [{ "op": "mean", "field": "ppl", "as": "ppl_ma" }],
          "frame": [-2, 2],
          "sort": [{ "field": "d", "order": "ascending" }],
          "groupby": ["fuel"]
        }
      ],
      "mark": { "type": "point", "filled": true, "size": 50, "opacity": 0 },
      "encoding": {
        "x": { "field": "d", "type": "temporal" },
        "y": { "field": "ppl_ma", "type": "quantitative" },
        "opacity": {
          "condition": {"param": "hover", "value": 0.9},
          "value": 0
        },
        "tooltip": [
          { "field": "d", "type": "temporal", "title": "Week", "format": "%b %Y" },
          { "field": "fuel", "type": "nominal", "title": "Fuel Type" },
          { "field": "ppl", "type": "quantitative", "title": "Weekly", "format": ".1f" },
          { "field": "ppl_ma", "type": "quantitative", "title": "5-week avg", "format": ".1f" }
        ]
      },
      "params": [{
        "name": "hover",
        "select": {"type": "point", "on": "mouseover", "nearest": true}
      }]
    },

    // Peak labels
    {
      "transform": [
        {
          "window": [{ "op": "rank", "as": "r" }],
          "sort": [{ "field": "ppl", "order": "descending" }],
          "groupby": ["fuel"]
        },
        { "filter": "datum.r === 1" }
      ],
      "mark": { 
        "type": "text", 
        "dy": -20, 
        "fontSize": 12, 
        "fontWeight": "bold",
        "color": "#0f172a"
      },
      "encoding": {
        "y": { "field": "ppl", "type": "quantitative" },
        "text": { "field": "ppl", "type": "quantitative", "format": ".1f" }
      }
    },

    // Crisis label
    {
      "data": {
        "values": [{"x": "2022-05-15", "y": 200, "text": "2022 Crisis Peak"}]
      },
      "mark": {
        "type": "text",
        "fontSize": 11,
        "fontWeight": "600",
        "fontStyle": "italic",
        "color": "#dc2626"
      },
      "encoding": {
        "x": {"field": "x", "type": "temporal"},
        "y": {"field": "y", "type": "quantitative"},
        "text": {"field": "text"}
      }
    }
  ],

  "config": {
    "view": { "stroke": null },
    "background": "#ffffff"
  }
};

// ======================================
// 5) Rent vs house price inflation (PUBLICATION QUALITY - ENHANCED)
// ======================================
const vis5 = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

  "title": {
    "text": "Housing Costs: Rent vs House Price Inflation",
    "subtitle": "Annual rates with 5-month moving average (bold lines) | Private rents show persistent inflation",
    "fontSize": 20,
    "subtitleFontSize": 12,
    "anchor": "start",
    "color": "#0f172a",
    "subtitleColor": "#64748b"
  },

  "data": { "url": "data/vis5_rent_vs_house.json" },
  "width": "container",
  "height": 420,
  "padding": {"top": 10, "right": 10},

  "transform": [
    { "calculate": "toDate(datum.date)", "as": "d" },
    { "calculate": "toNumber(datum.value)", "as": "v" }
  ],

  "layer": [
    // Zero reference line
    {
      "mark": { 
        "type": "rule", 
        "strokeDash": [4, 4],
        "color": "#94a3b8",
        "strokeWidth": 1.5,
        "opacity": 0.5
      },
      "encoding": { "y": { "datum": 0 } }
    },

    // Raw monthly lines (subtle background)
    {
      "mark": { "type": "line", "strokeWidth": 1.2, "opacity": 0.2 },
      "encoding": {
        "x": {
          "field": "d",
          "type": "temporal",
          "title": "Date",
          "axis": {
            "format": "%Y",
            "tickCount": 7,
            "labelFontSize": 11,
            "labelColor": "#475569",
            "titleFontSize": 13,
            "titleColor": "#0f172a",
            "domainColor": "#cbd5e1",
            "tickColor": "#cbd5e1"
          }
        },
        "y": {
          "field": "v",
          "type": "quantitative",
          "title": "Annual Inflation Rate (%)",
          "scale": { "domain": [-2, 11] },
          "axis": {
            "labelFontSize": 12,
            "titleFontSize": 14,
            "labelColor": "#475569",
            "titleColor": "#0f172a",
            "grid": true,
            "gridOpacity": 0.12,
            "gridColor": "#cbd5e1",
            "domainColor": "#cbd5e1",
            "tickColor": "#cbd5e1"
          }
        },
        "color": {
          "field": "series",
          "type": "nominal",
          "scale": { "range": ["#3b82f6", "#f59e0b"] },
          "legend": null
        }
      }
    },

    // Smoothed lines (5-month MA, prominent)
    {
      "transform": [
        {
          "window": [{ "op": "mean", "field": "v", "as": "v_ma" }],
          "frame": [-2, 2],
          "sort": [{ "field": "d", "order": "ascending" }],
          "groupby": ["series"]
        }
      ],
      "mark": { "type": "line", "strokeWidth": 3.8 },
      "encoding": {
        "x": { "field": "d", "type": "temporal" },
        "y": { "field": "v_ma", "type": "quantitative" },
        "color": {
          "field": "series",
          "type": "nominal",
          "scale": { "range": ["#3b82f6", "#f59e0b"] },
          "legend": null
        }
      }
    },

    // Hover points for tooltips
    {
      "transform": [
        {
          "window": [{ "op": "mean", "field": "v", "as": "v_ma" }],
          "frame": [-2, 2],
          "sort": [{ "field": "d", "order": "ascending" }],
          "groupby": ["series"]
        }
      ],
      "mark": { "type": "point", "filled": true, "size": 60, "opacity": 0 },
      "encoding": {
        "x": { "field": "d", "type": "temporal" },
        "y": { "field": "v_ma", "type": "quantitative" },
        "color": {
          "field": "series",
          "type": "nominal",
          "scale": { "range": ["#3b82f6", "#f59e0b"] }
        },
        "opacity": {
          "condition": {"param": "hover", "value": 0.9},
          "value": 0
        },
        "tooltip": [
          { "field": "d", "type": "temporal", "title": "Date", "format": "%b %Y" },
          { "field": "series", "type": "nominal", "title": "Series" },
          { "field": "v", "type": "quantitative", "title": "Monthly", "format": ".1f" },
          { "field": "v_ma", "type": "quantitative", "title": "5-month avg", "format": ".1f" }
        ]
      },
      "params": [{
        "name": "hover",
        "select": {"type": "point", "on": "mouseover", "nearest": true}
      }]
    },

    // Series labels (inside plot area)
    {
      "transform": [
        {
          "window": [{ "op": "rank", "as": "r" }],
          "sort": [{ "field": "d", "order": "descending" }],
          "groupby": ["series"]
        },
        { "filter": "datum.r === 1" },
        {
          "window": [{ "op": "mean", "field": "v", "as": "v_ma" }],
          "frame": [-2, 2],
          "sort": [{ "field": "d", "order": "ascending" }],
          "groupby": ["series"]
        },
        {
          "calculate":
            "datum.series === 'Private rents (UK)' ? 'Private rents' : 'House prices'",
          "as": "label"
        }
      ],
      "mark": {
        "type": "text",
        "align": "right",
        "dx": -18,
        "fontSize": 12,
        "fontWeight": "bold"
      },
      "encoding": {
        "x": { "field": "d", "type": "temporal" },
        "y": { "field": "v_ma", "type": "quantitative" },
        "color": {
          "field": "series",
          "type": "nominal",
          "scale": { "range": ["#3b82f6", "#f59e0b"] }
        },
        "text": { "field": "label", "type": "nominal" }
      }
    }
  ],

  "config": {
    "view": { "stroke": null },
    "background": "#ffffff"
  }
};

// ======================================
// 6) Map: Rent inflation by region (PUBLICATION QUALITY - ENHANCED)
// ======================================
const vis6 = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  
  "title": {
    "text": "Regional Rent Inflation Across England",
    "subtitle": "Latest year-on-year percentage change by English region | London shows highest rates",
    "fontSize": 20,
    "subtitleFontSize": 12,
    "anchor": "start",
    "color": "#0f172a",
    "subtitleColor": "#64748b",
    "offset": 20
  },
  
  "width": "container",
  "height": 480,
  "padding": {"top": 10},
  
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
  
  "projection": { 
    "type": "mercator",
    "scale": 2200,
    "center": [-2, 53.5]
  },
  
  "mark": { 
    "type": "geoshape", 
    "stroke": "white", 
    "strokeWidth": 1.5
  },
  
  "encoding": {
    "color": {
      "field": "rent_inflation_yoy_pct",
      "type": "quantitative",
      "title": "Rent Inflation (% y/y)",
      "scale": {
        "scheme": "oranges",
        "domain": [2, 10]
      },
      "legend": { 
        "orient": "bottom-right",
        "direction": "horizontal",
        "titleFontSize": 12,
        "labelFontSize": 11,
        "titleColor": "#0f172a",
        "labelColor": "#475569",
        "gradientLength": 200,
        "gradientThickness": 12,
        "format": ".1f"
      }
    },
    "tooltip": [
      { "field": "areanm", "type": "nominal", "title": "Region" },
      { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "Inflation (% y/y)", "format": ".1f" }
    ]
  },
  
  "config": {
    "view": { "stroke": null },
    "background": "#ffffff"
  }
};

// ======================================
// 7) Interactive trend (PUBLICATION QUALITY - ENHANCED)
// ======================================
const vis7 = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  
  "title": {
    "text": "Regional Rent Inflation Trends Over Time",
    "subtitle": "Select a region to compare with England average | Interactive dropdown selector",
    "fontSize": 20,
    "subtitleFontSize": 12,
    "anchor": "start",
    "color": "#0f172a",
    "subtitleColor": "#64748b"
  },
  
  "data": { "url": "data/vis7_rent_trend_regions.json" },
  "width": "container",
  "height": 400,
  "padding": {"top": 10},
  
  "params": [
    {
      "name": "Region",
      "value": "London",
      "bind": {
        "input": "select",
        "name": "Select Region: ",
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
  
  "layer": [
    // All other regions (faint background)
    {
      "mark": { 
        "type": "line",
        "strokeWidth": 1.5,
        "opacity": 0.15
      },
      "encoding": {
        "x": { 
          "field": "date", 
          "type": "temporal", 
          "title": "Date",
          "axis": {
            "format": "%Y",
            "labelFontSize": 11,
            "titleFontSize": 13,
            "labelColor": "#475569",
            "titleColor": "#0f172a",
            "domainColor": "#cbd5e1",
            "tickColor": "#cbd5e1"
          }
        },
        "y": { 
          "field": "rent_inflation_yoy_pct", 
          "type": "quantitative", 
          "title": "Rent Inflation (% y/y)",
          "axis": {
            "labelFontSize": 12,
            "titleFontSize": 14,
            "labelColor": "#475569",
            "titleColor": "#0f172a",
            "grid": true,
            "gridOpacity": 0.12,
            "gridColor": "#cbd5e1",
            "domainColor": "#cbd5e1",
            "tickColor": "#cbd5e1"
          }
        },
        "detail": { "field": "areanm", "type": "nominal" },
        "color": { "value": "#94a3b8" }
      },
      "transform": [
        { "filter": "datum.group === 'Other'" }
      ]
    },

    // England average (medium prominence)
    {
      "mark": { 
        "type": "line",
        "strokeWidth": 2.5,
        "strokeDash": [6, 4]
      },
      "encoding": {
        "x": { "field": "date", "type": "temporal" },
        "y": { "field": "rent_inflation_yoy_pct", "type": "quantitative" },
        "color": { "value": "#3b82f6" }
      },
      "transform": [
        { "filter": "datum.group === 'England'" }
      ]
    },

    // Selected region (most prominent)
    {
      "mark": { 
        "type": "line",
        "strokeWidth": 4
      },
      "encoding": {
        "x": { "field": "date", "type": "temporal" },
        "y": { "field": "rent_inflation_yoy_pct", "type": "quantitative" },
        "color": { "value": "#f59e0b" }
      },
      "transform": [
        { "filter": "datum.group === 'Selected region'" }
      ]
    },

    // Hover points for tooltips
    {
      "mark": { "type": "point", "filled": true, "size": 60, "opacity": 0 },
      "encoding": {
        "x": { "field": "date", "type": "temporal" },
        "y": { "field": "rent_inflation_yoy_pct", "type": "quantitative" },
        "opacity": {
          "condition": [
            {"param": "hover", "value": 0.9, "test": "datum.group === 'Selected region' || datum.group === 'England'"}
          ],
          "value": 0
        },
        "color": {
          "condition": [
            {"test": "datum.group === 'Selected region'", "value": "#f59e0b"},
            {"test": "datum.group === 'England'", "value": "#3b82f6"}
          ],
          "value": "#94a3b8"
        },
        "tooltip": [
          { "field": "date", "type": "temporal", "title": "Date", "format": "%b %Y" },
          { "field": "areanm", "type": "nominal", "title": "Area" },
          { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "Inflation (% y/y)", "format": ".1f" }
        ]
      },
      "params": [{
        "name": "hover",
        "select": {"type": "point", "on": "mouseover", "nearest": true}
      }]
    },

    // Legend labels
    {
      "data": {
        "values": [
          {"label": "Selected Region", "y": 10, "color": "#f59e0b"},
          {"label": "England Average", "y": 9, "color": "#3b82f6"}
        ]
      },
      "mark": {
        "type": "text",
        "align": "left",
        "dx": 20,
        "fontSize": 11,
        "fontWeight": "600"
      },
      "encoding": {
        "x": {"datum": "2019-01-01", "type": "temporal"},
        "y": {"field": "y", "type": "quantitative"},
        "text": {"field": "label"},
        "color": {"field": "color", "type": "nominal", "scale": null}
      }
    }
  ],
  
  "config": {
    "view": { "stroke": null },
    "background": "#ffffff"
  }
};

// ======================================
// 8) Map: UK countries (PUBLICATION QUALITY - ENHANCED)
// ======================================
const vis8 = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  
  "title": {
    "text": "Rent Inflation Across UK Nations",
    "subtitle": "Latest year-on-year percentage change | Comparing England, Wales, Scotland, and Northern Ireland",
    "fontSize": 20,
    "subtitleFontSize": 12,
    "anchor": "start",
    "color": "#0f172a",
    "subtitleColor": "#64748b",
    "offset": 20
  },
  
  "width": "container",
  "height": 520,
  "padding": {"top": 10},
  
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
  
  "projection": { 
    "type": "mercator",
    "scale": 1100,
    "center": [-3, 54.5]
  },
  
  "mark": { 
    "type": "geoshape", 
    "stroke": "white", 
    "strokeWidth": 2
  },
  
  "encoding": {
    "color": {
      "field": "rent_inflation_yoy_pct",
      "type": "quantitative",
      "title": "Rent Inflation (% y/y)",
      "scale": {
        "scheme": "blues",
        "domain": [2, 10]
      },
      "legend": { 
        "orient": "bottom-right",
        "direction": "horizontal",
        "titleFontSize": 12,
        "labelFontSize": 11,
        "titleColor": "#0f172a",
        "labelColor": "#475569",
        "gradientLength": 220,
        "gradientThickness": 14,
        "format": ".1f"
      }
    },
    "tooltip": [
      { "field": "areanm", "type": "nominal", "title": "Country" },
      { "field": "rent_inflation_yoy_pct", "type": "quantitative", "title": "Inflation (% y/y)", "format": ".1f" }
    ]
  },
  
  "config": {
    "view": { "stroke": null },
    "background": "#ffffff"
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
