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
  // 3) Energy cap (COMPLETE LOLLIPOP - ALL DATA VISIBLE)
  // ======================================
  const vis3 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    
    "title": {
      "text": "UK Energy Price Cap: The Crisis in Context",
      "subtitle": [
        "Quarterly typical household bills (2021-2025) | Peak of £2,070 represents 118% increase from pre-crisis baseline",
        "Each point shows Ofgem's quarterly price cap for a typical household"
      ],
      "fontSize": 20,
      "subtitleFontSize": 12,
      "anchor": "start",
      "color": "#0f172a",
      "subtitleColor": "#64748b",
      "offset": 25
    },
    
    "data": { "url": "data/vis3_energy_cap.json" },
    "width": "container",
    "height": 500,
    
    "transform": [
      {
        "window": [{"op": "row_number", "as": "order"}],
        "sort": [{"field": "period_date", "order": "ascending"}]
      }
    ],
    
    "layer": [
      // Connecting line
      {
        "mark": {
          "type": "line",
          "strokeWidth": 2.5,
          "color": "#94a3b8",
          "opacity": 0.5
        },
        "encoding": {
          "x": {
            "field": "order",
            "type": "quantitative",
            "title": null,
            "axis": {
              "labelExpr": "datum.value === 1 ? '2021 Q4' : datum.value === 2 ? '2022 Q1' : datum.value === 3 ? '2022 Q2' : datum.value === 4 ? '2022 Q3' : datum.value === 5 ? '2022 Q4' : datum.value === 6 ? '2023 Q1' : datum.value === 7 ? '2023 Q2' : datum.value === 8 ? '2023 Q3' : datum.value === 9 ? '2023 Q4' : datum.value === 10 ? '2024 Q1' : datum.value === 11 ? '2024 Q2' : datum.value === 12 ? '2024 Q3' : datum.value === 13 ? '2024 Q4' : datum.value === 14 ? '2025 Q1' : datum.value === 15 ? '2025 Q2' : datum.value === 16 ? '2025 Q3' : datum.value === 17 ? '2025 Q4' : ''",
              "labelAngle": -45,
              "labelFontSize": 10,
              "labelColor": "#475569",
              "labelPadding": 10,
              "domainColor": "#cbd5e1",
              "tickColor": "#cbd5e1",
              "values": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
            }
          },
          "y": {
            "field": "typical_annual_bill_gbp",
            "type": "quantitative",
            "title": "Annual Bill (£)",
            "scale": { "domain": [850, 2150] },
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
        }
      },
      
      // Crisis shading
      {
        "mark": {
          "type": "rect",
          "color": "#fee2e2",
          "opacity": 0.25
        },
        "encoding": {
          "x": { "datum": 11 },
          "x2": { "datum": 17.5 },
          "y": { "datum": 850 },
          "y2": { "datum": 2150 }
        }
      },
      
      // Large colored circles
      {
        "mark": {
          "type": "circle",
          "size": 350,
          "stroke": "white",
          "strokeWidth": 3
        },
        "encoding": {
          "x": {
            "field": "order",
            "type": "quantitative"
          },
          "y": {
            "field": "typical_annual_bill_gbp",
            "type": "quantitative"
          },
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
              "symbolSize": 250,
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
      
      // Value labels for key points
      {
        "transform": [
          { "filter": "datum.typical_annual_bill_gbp === 950 || datum.typical_annual_bill_gbp === 2070 || datum.typical_annual_bill_gbp === 1850 || datum.typical_annual_bill_gbp === 1856" }
        ],
        "mark": {
          "type": "text",
          "dy": -22,
          "fontSize": 12,
          "fontWeight": "bold",
          "color": "#0f172a"
        },
        "encoding": {
          "x": {
            "field": "order",
            "type": "quantitative"
          },
          "y": {
            "field": "typical_annual_bill_gbp",
            "type": "quantitative"
          },
          "text": {
            "field": "typical_annual_bill_gbp",
            "type": "quantitative",
            "format": ",.0f"
          }
        }
      },
      
      // Crisis Period annotation
      {
        "mark": {
          "type": "text",
          "align": "center",
          "baseline": "top",
          "dy": 5,
          "fontSize": 12,
          "fontWeight": "600",
          "color": "#dc2626",
          "text": "← Crisis Period →"
        },
        "encoding": {
          "x": { "datum": 14 },
          "y": { "datum": 2110 }
        }
      },
      
      // Lowest point annotation
      {
        "transform": [
          { "filter": "datum.typical_annual_bill_gbp === 950" }
        ],
        "mark": {
          "type": "text",
          "dy": 25,
          "fontSize": 11,
          "fontStyle": "italic",
          "color": "#10b981",
          "text": "Pre-crisis low"
        },
        "encoding": {
          "x": {
            "field": "order",
            "type": "quantitative"
          },
          "y": {
            "field": "typical_annual_bill_gbp",
            "type": "quantitative"
          }
        }
      },
      
      // Peak annotation
      {
        "transform": [
          { "filter": "datum.typical_annual_bill_gbp === 2070" }
        ],
        "mark": {
          "type": "text",
          "dy": 35,
          "fontSize": 11,
          "fontStyle": "italic",
          "color": "#dc2626",
          "text": "+118% from baseline"
        },
        "encoding": {
          "x": {
            "field": "order",
            "type": "quantitative"
          },
          "y": {
            "field": "typical_annual_bill_gbp",
            "type": "quantitative"
          }
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
// 4) Weekly fuel prices (PUBLICATION QUALITY, NO-SELECTION TO AVOID hover_tuple)
// ======================================
const vis4 = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

  "title": {
    "text": "Weekly fuel prices (pence per litre)",
    "subtitle": "Weekly series (faint) with a 5-week moving average (bold). Hover points for exact values; peaks are labelled."
  },

  "data": { "url": "data/vis4_fuel_weekly.json" },
  "width": "container",
  "height": 360,

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
      "axis": { "format": "%Y", "tickCount": 7, "labelFontSize": 11, "titleFontSize": 12 }
    },
    "y": {
      "type": "quantitative",
      "title": "Pence per litre",
      "axis": { "labelFontSize": 11, "titleFontSize": 12, "grid": true, "gridOpacity": 0.15 }
    },
    "color": {
      "field": "fuel",
      "type": "nominal",
      "title": null,
      "scale": { "range": ["#4c72b0", "#e1812c"] },
      "legend": { "orient": "top", "direction": "horizontal", "title": null, "labelFontSize": 11 }
    }
  },

  "layer": [
    // Raw weekly line (context)
    {
      "mark": { "type": "line", "strokeWidth": 1.6, "opacity": 0.28 },
      "encoding": {
        "y": { "field": "ppl", "type": "quantitative" }
      }
    },

    // Smoothed line (5-week moving average)
    {
      "transform": [
        {
          "window": [{ "op": "mean", "field": "ppl", "as": "ppl_ma" }],
          "frame": [-2, 2],
          "sort": [{ "field": "d", "order": "ascending" }],
          "groupby": ["fuel"]
        }
      ],
      "mark": { "type": "line", "strokeWidth": 3.4 },
      "encoding": {
        "y": { "field": "ppl_ma", "type": "quantitative" }
      }
    },

    // Points on the moving average for reliable hover tooltips (no selection signals)
    {
      "transform": [
        {
          "window": [{ "op": "mean", "field": "ppl", "as": "ppl_ma" }],
          "frame": [-2, 2],
          "sort": [{ "field": "d", "order": "ascending" }],
          "groupby": ["fuel"]
        }
      ],
      "mark": { "type": "point", "filled": true, "size": 40, "opacity": 0.85 },
      "encoding": {
        "x": { "field": "d", "type": "temporal" },
        "y": { "field": "ppl_ma", "type": "quantitative" },
        "tooltip": [
          { "field": "d", "type": "temporal", "title": "Week" },
          { "field": "fuel", "type": "nominal", "title": "Fuel" },
          { "field": "ppl", "type": "quantitative", "title": "Weekly", "format": ".1f" },
          { "field": "ppl_ma", "type": "quantitative", "title": "5-wk avg", "format": ".1f" }
        ]
      }
    },

    // Label peak (max) for each series (based on weekly values)
    {
      "transform": [
        {
          "window": [{ "op": "rank", "as": "r" }],
          "sort": [{ "field": "ppl", "order": "descending" }],
          "groupby": ["fuel"]
        },
        { "filter": "datum.r === 1" }
      ],
      "mark": { "type": "text", "dy": -18, "fontSize": 11, "fontWeight": "bold" },
      "encoding": {
        "y": { "field": "ppl", "type": "quantitative" },
        "text": { "field": "ppl", "type": "quantitative", "format": ".1f" }
      }
    }
  ],

  "config": {
    "axis": { "labelFontSize": 11, "titleFontSize": 12 },
    "title": { "fontSize": 22, "subtitleFontSize": 13, "anchor": "start" },
    "view": { "stroke": null }
  }
};

  // ======================================
// 5) Rent vs house price inflation (PUBLICATION QUALITY)
// ======================================
const vis5 = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

  "title": {
    "text": "Rent vs house price inflation (annual rate)",
    "subtitle": "Faint lines show monthly values; bold lines show a 5-month moving average for readability."
  },

  "data": { "url": "data/vis5_rent_vs_house.json" },
  "width": "container",
  "height": 360,

  "transform": [
    { "calculate": "toDate(datum.date)", "as": "d" },
    { "calculate": "toNumber(datum.value)", "as": "v" }
  ],

  "layer": [
    // Zero reference line
    {
      "mark": { "type": "rule", "strokeDash": [4, 6], "opacity": 0.6 },
      "encoding": { "y": { "datum": 0 } }
    },

    // Raw monthly lines (context)
    {
      "mark": { "type": "line", "strokeWidth": 1.6, "opacity": 0.25 },
      "encoding": {
        "x": {
          "field": "d",
          "type": "temporal",
          "title": "Date",
          "axis": { "format": "%Y", "tickCount": 7, "labelFontSize": 11, "titleFontSize": 12 }
        },
        "y": {
          "field": "v",
          "type": "quantitative",
          "title": "Percent",
          "axis": { "labelFontSize": 11, "titleFontSize": 12, "grid": true, "gridOpacity": 0.15 }
        },
        "color": {
          "field": "series",
          "type": "nominal",
          "title": null,
          "scale": { "range": ["#4c72b0", "#e1812c"] },
          "legend": { "orient": "top", "direction": "horizontal", "title": null, "labelFontSize": 11 }
        }
      }
    },

    // Smoothed lines (5-month moving average) — main read
    {
      "transform": [
        {
          "window": [{ "op": "mean", "field": "v", "as": "v_ma" }],
          "frame": [-2, 2],
          "sort": [{ "field": "d", "order": "ascending" }],
          "groupby": ["series"]
        }
      ],
      "mark": { "type": "line", "strokeWidth": 3.4 },
      "encoding": {
        "x": { "field": "d", "type": "temporal", "title": "Date" },
        "y": { "field": "v_ma", "type": "quantitative", "title": "Percent" },
        "color": {
          "field": "series",
          "type": "nominal",
          "title": null,
          "scale": { "range": ["#4c72b0", "#e1812c"] },
          "legend": { "orient": "top", "direction": "horizontal", "title": null, "labelFontSize": 11 }
        }
      }
    },

    // Points on the smoothed lines for reliable hover tooltips (no selection signals)
    {
      "transform": [
        {
          "window": [{ "op": "mean", "field": "v", "as": "v_ma" }],
          "frame": [-2, 2],
          "sort": [{ "field": "d", "order": "ascending" }],
          "groupby": ["series"]
        }
      ],
      "mark": { "type": "point", "filled": true, "size": 40, "opacity": 0.9 },
      "encoding": {
        "x": { "field": "d", "type": "temporal" },
        "y": { "field": "v_ma", "type": "quantitative" },
        "color": {
          "field": "series",
          "type": "nominal",
          "scale": { "range": ["#4c72b0", "#e1812c"] },
          "legend": null
        },
        "tooltip": [
          { "field": "d", "type": "temporal", "title": "Date" },
          { "field": "series", "type": "nominal", "title": "Series" },
          { "field": "v", "type": "quantitative", "title": "Monthly", "format": ".1f" },
          { "field": "v_ma", "type": "quantitative", "title": "5-mo avg", "format": ".1f" }
        ]
      }
    },

    // Label peak (max) for each series (monthly values)
    {
      "transform": [
        {
          "window": [{ "op": "rank", "as": "r" }],
          "sort": [{ "field": "v", "order": "descending" }],
          "groupby": ["series"]
        },
        { "filter": "datum.r === 1" }
      ],
      "mark": { "type": "text", "dy": -18, "fontSize": 11, "fontWeight": "bold" },
      "encoding": {
        "x": { "field": "d", "type": "temporal" },
        "y": { "field": "v", "type": "quantitative" },
        "color": {
          "field": "series",
          "type": "nominal",
          "scale": { "range": ["#4c72b0", "#e1812c"] },
          "legend": null
        },
        "text": { "field": "v", "type": "quantitative", "format": ".1f" }
      }
    }
  ],

  "config": {
    "axis": { "labelFontSize": 11, "titleFontSize": 12 },
    "title": { "fontSize": 22, "subtitleFontSize": 13, "anchor": "start" },
    "view": { "stroke": null }
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
