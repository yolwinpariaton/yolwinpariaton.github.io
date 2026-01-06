/* js/project-charts.js
   Eight interactive Vega-Lite charts for the UK cost of living project.
   Chart 7 ENHANCED with professional publication-ready styling
*/
console.log("LOADED project-charts v3-enhanced");

(function () {
  "use strict";

  // Use SVG for robust responsive sizing inside framed containers
  const opts = { actions: false, renderer: "svg" };

  // Stable TopoJSON from ONSdigital/uk-topojson (contains layers: uk, ctry, rgn, ...)
  const UK_TOPO_URL =
    "https://raw.githubusercontent.com/ONSdigital/uk-topojson/refs/heads/main/output/topo.json";

  // Consistent visual theme
  const THEME = {
    background: "#ffffff",
    view: { stroke: null },
    axis: {
      labelFontSize: 11,
      titleFontSize: 12,
      labelColor: "#475569",
      titleColor: "#0f172a",
      grid: true,
      gridOpacity: 0.10,
      gridColor: "#cbd5e1",
      domainColor: "#cbd5e1",
      tickColor: "#cbd5e1"
    },
    title: {
      fontSize: 20,
      subtitleFontSize: 12,
      color: "#0f172a",
      subtitleColor: "#64748b"
    }
  };

  // Better responsive behaviour
  const FIT = { autosize: { type: "fit", contains: "padding", resize: true } };

  function safeEmbed(selector, spec) {
    const el = document.querySelector(selector);
    if (!el) return;

    if (typeof vegaEmbed !== "function") {
      console.error("vegaEmbed is not available. Check script tags for vega/vega-lite/vega-embed.");
      el.innerHTML = "<p>Chart failed to load: vegaEmbed not found.</p>";
      return;
    }

    vegaEmbed(selector, spec, opts).catch((err) => {
      console.error("Vega embed error for", selector, err);
      el.innerHTML = "<p>Chart failed to load. Check console and JSON paths.</p>";
    });
  }

// ------------------------------------------------------------------
// 1) Prices vs Pay (Indexed) — PUBLICATION QUALITY ENHANCEMENT
// ------------------------------------------------------------------
const vis1 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  ...FIT,

  title: {
    text: "Prices vs Pay (Indexed to 2019 = 100)",
    subtitle: [
      "The purchasing-power gap widened significantly from 2022 onwards",
      "as consumer prices (CPIH) outpaced real earnings growth."
    ],
    anchor: "start",
    offset: 25,
    fontSize: 20,
    subtitleFontSize: 13,
    subtitleColor: "#64748b",
    font: "Inter, sans-serif"
  },

  data: { url: "data/vis1_prices_vs_pay.json" },
  width: "container",
  height: 380,

  padding: { top: 20, right: 90, bottom: 20, left: 10 }, // Extra right padding for direct labels

  transform: [
    { calculate: "toDate(datum.date)", as: "d" },
    { calculate: "toNumber(datum.value)", as: "v" },
    { pivot: "series", value: "v", groupby: ["d"] },
    { calculate: "datum['CPIH (prices)']", as: "prices" },
    { calculate: "datum['Real earnings']", as: "earnings" },
    { calculate: "datum.prices - datum.earnings", as: "gap" }
  ],

  layer: [
    // 1. Reference Baseline at 100
    {
      mark: { 
        type: "rule", 
        strokeDash: [4, 4], 
        color: "#475569", 
        opacity: 0.4, 
        strokeWidth: 1.5 
      },
      encoding: { y: { datum: 100 } }
    },
    
    // 2. The Purchasing Power Gap (Shaded Area)
    {
      mark: { 
        type: "area", 
        opacity: 0.15, 
        color: "#94a3b8",
        interpolate: "monotone" 
      },
      encoding: {
        x: { 
          field: "d", 
          type: "temporal", 
          title: null, 
          axis: { 
            format: "%Y", 
            tickCount: 6, 
            grid: false,
            labelFlush: true,
            labelPadding: 10
          } 
        },
        y: {
          field: "earnings",
          type: "quantitative",
          title: "Index (2019 = 100)",
          scale: { zero: false, domain: [98, 114] },
          axis: { 
            tickCount: 5, 
            titlePadding: 15,
            gridOpacity: 0.1,
            domain: false
          }
        },
        y2: { field: "prices" }
      }
    },

    // 3. Prices Line (Professional Navy)
    {
      mark: { 
        type: "line", 
        strokeWidth: 3.5, 
        color: "#1e3a8a", 
        interpolate: "monotone",
        point: { filled: true, size: 35, color: "#1e3a8a" } 
      },
      encoding: {
        x: { field: "d", type: "temporal" },
        y: { field: "prices", type: "quantitative" },
        tooltip: [
          { field: "d", type: "temporal", title: "Date", format: "%B %Y" },
          { field: "prices", type: "quantitative", title: "CPIH (prices)", format: ".1f" },
          { field: "earnings", type: "quantitative", title: "Real earnings", format: ".1f" },
          { field: "gap", type: "quantitative", title: "Gap", format: ".1f" }
        ]
      }
    },

    // 4. Earnings Line (Harvest Amber)
    {
      mark: { 
        type: "line", 
        strokeWidth: 3.5, 
        color: "#b45309", 
        interpolate: "monotone",
        point: { filled: true, size: 35, color: "#b45309" } 
      },
      encoding: {
        x: { field: "d", type: "temporal" },
        y: { field: "earnings", type: "quantitative" }
      }
    },

    // 5. Direct End-of-Line Labels
    {
      transform: [
        {
          window: [{ op: "last_value", field: "prices", as: "last_prices" }, { op: "last_value", field: "earnings", as: "last_earnings" }],
          sort: [{ field: "d", order: "ascending" }]
        },
        { filter: "datum.d == toDate('2025-07-01')" } // Adjust to your data's last date
      ],
      layer: [
        {
          mark: { type: "text", align: "left", dx: 12, dy: -5, fontWeight: "bold", fontSize: 12 },
          encoding: {
            x: { field: "d", type: "temporal" },
            y: { field: "prices", type: "quantitative" },
            text: { value: "CPIH Prices" },
            color: { value: "#1e3a8a" }
          }
        },
        {
          mark: { type: "text", align: "left", dx: 12, dy: 5, fontWeight: "bold", fontSize: 12 },
          encoding: {
            x: { field: "d", type: "temporal" },
            y: { field: "earnings", type: "quantitative" },
            text: { value: "Real Earnings" },
            color: { value: "#b45309" }
          }
        }
      ]
    }
  ],

  config: {
    ...THEME,
    view: { stroke: null }
  }
};
  
// --------------------------------------
  // 2) Food inflation vs headline — SIMPLIFIED & WORKING
  // --------------------------------------
  const vis2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...FIT,

    title: { 
      text: "Food Inflation vs Overall Inflation", 
      subtitle: "Annual percentage rates (2016–2024) | Bold lines show 5-period moving average",
      anchor: "start", 
      offset: 14 
    },
    data: { url: "data/vis2_food_vs_headline.json" },
    width: "container",
    height: 340,

    padding: { top: 12, right: 12, bottom: 22, left: 8 },

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" }
    ],

    layer: [
      // Zero baseline
      {
        mark: { type: "rule", strokeDash: [4, 6], color: "#94a3b8", opacity: 0.6 },
        encoding: { y: { datum: 0 } }
      },

      // 2% target
      {
        mark: { type: "rule", strokeDash: [3, 3], color: "#10b981", opacity: 0.4 },
        encoding: { y: { datum: 2 } }
      },

      // Raw lines (subtle)
      {
        mark: { 
          type: "line", 
          strokeWidth: 1.5, 
          opacity: 0.2,
          interpolate: "monotone"
        },
        encoding: {
          x: { 
            field: "d", 
            type: "temporal", 
            title: "Year",
            axis: { format: "%Y", tickCount: 8 }
          },
          y: { 
            field: "v", 
            type: "quantitative", 
            title: "Annual inflation rate (%)"
          },
          color: { 
            field: "series", 
            type: "nominal",
            legend: null
          },
          detail: { field: "series" }
        }
      },

      // Moving average (bold)
      {
        transform: [
          {
            window: [{ op: "mean", field: "v", as: "v_ma" }],
            frame: [-2, 2],
            sort: [{ field: "d", order: "ascending" }],
            groupby: ["series"]
          }
        ],
        mark: { type: "line", strokeWidth: 4, interpolate: "monotone" },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "v_ma", type: "quantitative" },
          color: {
            field: "series",
            type: "nominal",
            scale: { range: ["#1e40af", "#dc2626"] },
            legend: { 
              orient: "top", 
              direction: "horizontal", 
              title: null,
              labelFontSize: 12,
              symbolSize: 200,
              symbolStrokeWidth: 4
            }
          },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%B %Y" },
            { field: "series", type: "nominal", title: "Series" },
            { field: "v_ma", type: "quantitative", title: "Rate (%)", format: ".1f" }
          ]
        }
      }
    ],

    config: THEME
  };
  // --------------------------------------
  // 3) Energy cap
  // --------------------------------------
  const QUARTER_SORT = [
    "2021 Q4",
    "2022 Q1", "2022 Q2", "2022 Q3", "2022 Q4",
    "2023 Q1", "2023 Q2", "2023 Q3", "2023 Q4",
    "2024 Q1", "2024 Q2", "2024 Q3", "2024 Q4",
    "2025 Q1", "2025 Q2", "2025 Q3", "2025 Q4"
  ];

  const vis3 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...FIT,

    title: {
      text: "UK Energy Price Cap: The Crisis in Context",
      subtitle:
        "Quarterly typical household bills (2021–2025) | Peak of £2,070 represents a 118% increase from £950 baseline",
      anchor: "start",
      offset: 14
    },

    data: { url: "data/vis3_energy_cap.json" },
    width: "container",
    height: 360,

    padding: { top: 6, right: 18, bottom: 28, left: 6 },

    layer: [
      {
        data: { values: [{ period_label: "2021 Q4" }, { period_label: "2022 Q1" }, { period_label: "2022 Q2" }] },
        mark: { type: "bar", color: "#dbeafe", opacity: 0.28 },
        encoding: {
          x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT },
          y: { datum: 2200 }
        }
      },
      {
        data: { values: [{ period_label: "2024 Q2" }, { period_label: "2024 Q3" }, { period_label: "2024 Q4" }] },
        mark: { type: "bar", color: "#fef3c7", opacity: 0.32 },
        encoding: {
          x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT },
          y: { datum: 2200 }
        }
      },
      {
        mark: { type: "rule", strokeDash: [4, 4], color: "#0891b2", strokeWidth: 1.5, opacity: 0.5 },
        encoding: { y: { datum: 1070 } }
      },
      {
        layer: [
          { mark: { type: "line", strokeWidth: 2.5, color: "#64748b" } },
          {
            mark: { type: "point", filled: true, size: 190, stroke: "white", strokeWidth: 2.2 },
            encoding: {
              color: {
                field: "typical_annual_bill_gbp",
                type: "quantitative",
                scale: {
                  domain: [950, 1300, 1700, 2070],
                  range: ["#06b6d4", "#3b82f6", "#f59e0b", "#dc2626"]
                },
                legend: {
                  title: "Bill amount (£)",
                  orient: "right",
                  format: ",.0f",
                  titleFontSize: 11,
                  labelFontSize: 10
                }
              },
              tooltip: [
                { field: "period_label", title: "Quarter", type: "nominal" },
                { field: "typical_annual_bill_gbp", title: "Bill (£)", type: "quantitative", format: ",.0f" }
              ]
            }
          }
        ],
        encoding: {
          x: {
            field: "period_label",
            type: "ordinal",
            sort: QUARTER_SORT,
            axis: {
              title: "Quarter",
              labelAngle: -45,
              labelAlign: "right",
              labelFontSize: 10,
              titleFontSize: 12
            }
          },
          y: {
            field: "typical_annual_bill_gbp",
            type: "quantitative",
            scale: { domain: [0, 2200] },
            axis: { title: "Annual bill (£)", format: ",.0f" }
          }
        }
      },
      {
        transform: [{ filter: "datum.typical_annual_bill_gbp === 950 || datum.typical_annual_bill_gbp === 2070" }],
        mark: { type: "text", dy: -16, fontSize: 12, fontWeight: "bold", color: "#0f172a" },
        encoding: {
          x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT },
          y: { field: "typical_annual_bill_gbp", type: "quantitative" },
          text: { field: "typical_annual_bill_gbp", type: "quantitative", format: ",.0f" }
        }
      },
      {
        transform: [{ filter: "datum.typical_annual_bill_gbp === 2070" }],
        mark: { type: "text", dy: 26, fontSize: 11, fontWeight: "bold", color: "#dc2626" },
        encoding: {
          x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT },
          y: { field: "typical_annual_bill_gbp", type: "quantitative" },
          text: { value: "+118%" }
        }
      }
    ],

    config: THEME
  };

// --------------------------------------
// 4) Weekly fuel prices (LAYOUT OPTIMIZED)
// --------------------------------------
const vis4 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  ...FIT,
  title: {
    text: "UK Fuel Prices: From Pandemic Crash to Energy Crisis",
    subtitle: [
      "Weekly pump prices (2019–2025) | Data: Department for Energy Security and Net Zero",
      "Shaded areas indicate major global events impacting supply and demand."
    ]
  },
  data: { url: "data/vis4_fuel_weekly.json" },
  width: "container",
  height: 500, // Increased height for more breathing room
  padding: { top: 50, right: 30, bottom: 50, left: 60 },
  
  transform: [
    { calculate: "toDate(datum.date)", as: "d" },
    { fold: ["unleaded_ppl", "diesel_ppl"], as: ["fuel_raw", "ppl_raw"] },
    { calculate: "toNumber(datum.ppl_raw)", as: "ppl" },
    { 
      calculate: "datum.fuel_raw === 'unleaded_ppl' ? 'Unleaded (petrol)' : 'Diesel'", 
      as: "fuel" 
    }
  ],

  layer: [
    // 1. BACKGROUND SHADES
    {
      data: {
        values: [
          { start: "2020-03-23", end: "2021-07-19", event: "COVID Lockdown Period", color: "#cbd5e1" },
          { start: "2022-02-24", end: "2023-01-01", event: "Initial Ukraine Energy Shock", color: "#fca5a5" }
        ]
      },
      layer: [
        {
          mark: { type: "rect", opacity: 0.4 },
          encoding: {
            x: { field: "start", type: "temporal" },
            x2: { field: "end" },
            color: { field: "color", type: "nominal", scale: null }
          }
        },
        {
          mark: { 
            type: "text", 
            align: "left", 
            baseline: "top", 
            dy: -15, // Pushed down below the legend
            fontSize: 11, 
            fontWeight: 700, 
            color: "#475569" 
          },
          encoding: {
            x: { field: "start", type: "temporal" },
            y: { value: 0 },
            text: { field: "event" }
          }
        }
      ]
    },

    // 2. BASELINE REFERENCE
    {
      mark: { type: "rule", strokeDash: [4, 4], color: "#475569", opacity: 0.8, strokeWidth: 1.5 },
      encoding: { y: { datum: 120 } }
    },
    {
      mark: { 
        type: "text", 
        align: "left", 
        dx: 10, 
        dy: -25, // Moved further UP to clear the line
        fontSize: 12, 
        color: "#1e293b", 
        fontWeight: "bold"
      },
      encoding: {
        x: { value: 0 }, 
        y: { datum: 120 },
        text: { value: "Pre-pandemic baseline (120p)" }
      }
    },

    // 3. MAIN DATA LINES
    {
      transform: [
        {
          window: [{ op: "mean", field: "ppl", as: "ppl_ma" }],
          frame: [-2, 2],
          groupby: ["fuel"]
        }
      ],
      mark: { type: "line", strokeWidth: 4, interpolate: "monotone" },
      encoding: {
        x: { 
          field: "d", 
          type: "temporal", 
          title: "Year",
          axis: { format: "%Y", tickCount: 7, grid: false, labelPadding: 10 }
        },
        y: { 
          field: "ppl_ma", 
          type: "quantitative", 
          title: "Pence per litre", 
          scale: { domain: [80, 210] },
          axis: { titlePadding: 15 }
        },
        color: {
          field: "fuel",
          type: "nominal",
          scale: { range: ["#2563eb", "#d97706"] },
          legend: {
            orient: "top",
            direction: "horizontal",
            title: null,
            labelFontSize: 13,
            symbolType: "circle",
            symbolSize: 160,
            offset: 25 // Adds space between legend and chart area
          }
        }
      }
    },

    // 4. INTERACTIVE TOOLTIP LAYER
    {
      transform: [
        {
          window: [{ op: "mean", field: "ppl", as: "ppl_ma" }],
          frame: [-2, 2],
          groupby: ["fuel"]
        }
      ],
      mark: { type: "point", size: 100, opacity: 0 },
      encoding: {
        x: { field: "d", type: "temporal" },
        y: { field: "ppl_ma", type: "quantitative" },
        tooltip: [
          { field: "d", type: "temporal", title: "Date", format: "%d %b %Y" },
          { field: "fuel", type: "nominal", title: "Fuel" },
          { field: "ppl_ma", type: "quantitative", title: "Price (p)", format: ".1f" }
        ]
      }
    }
  ],
  config: THEME
};

// --------------------------------------
  // 5) Rent vs house price — SIMPLIFIED & WORKING
  // --------------------------------------
  const vis5 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...FIT,

    title: {
      text: "Housing Cost Dynamics: Rents vs House Prices",
      subtitle: "Annual inflation rates (2016–2024) | Bold lines show 5-month moving average",
      anchor: "start",
      offset: 14
    },

    data: { url: "data/vis5_rent_vs_house.json" },
    width: "container",
    height: 380,

    padding: { top: 12, right: 12, bottom: 22, left: 8 },

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" }
    ],

    layer: [
      // Zero baseline
      { 
        mark: { type: "rule", strokeDash: [4, 4], color: "#94a3b8", opacity: 0.6 }, 
        encoding: { y: { datum: 0 } } 
      },

      // 2% reference
      {
        mark: { type: "rule", strokeDash: [3, 3], color: "#10b981", opacity: 0.35 },
        encoding: { y: { datum: 2 } }
      },

      // Raw lines (subtle)
      {
        mark: { type: "line", strokeWidth: 1.5, opacity: 0.2, interpolate: "monotone" },
        encoding: {
          x: { 
            field: "d", 
            type: "temporal", 
            title: "Year", 
            axis: { format: "%Y", tickCount: 8 } 
          },
          y: { 
            field: "v", 
            type: "quantitative", 
            title: "Annual inflation rate (%)"
          },
          color: { 
            field: "series", 
            type: "nominal",
            legend: null
          },
          detail: { field: "series" }
        }
      },

      // Moving average (bold)
      {
        transform: [
          {
            window: [{ op: "mean", field: "v", as: "v_ma" }],
            frame: [-2, 2],
            sort: [{ field: "d", order: "ascending" }],
            groupby: ["series"]
          }
        ],
        mark: { type: "line", strokeWidth: 4, interpolate: "monotone" },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "v_ma", type: "quantitative" },
          color: { 
            field: "series", 
            type: "nominal", 
            scale: { range: ["#dc2626", "#1e40af"] },
            legend: {
              orient: "top",
              direction: "horizontal",
              title: null,
              labelFontSize: 12,
              symbolSize: 200,
              symbolStrokeWidth: 4
            }
          },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%B %Y" },
            { field: "series", type: "nominal", title: "Series" },
            { field: "v_ma", type: "quantitative", title: "Rate (%)", format: ".1f" }
          ]
        }
      }
    ],

    config: THEME
  };
// --------------------------------------
// 6) England regional map — FIXED (wide + legend ON + centered)
// --------------------------------------
const vis6 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  ...FIT,

  title: {
    text: "Regional rent inflation across England",
    subtitle:
      "Latest year-on-year percentage change by English region | Darker colours indicate higher inflation",
    anchor: "start",
    offset: 14
  },

  width: "container",
  height: 380,

  /* IMPORTANT:
     Give the legend room INSIDE the chart area (prevents overlap/cropping) */
  padding: { top: 10, bottom: 72, left: 8, right: 8 },

  data: { url: UK_TOPO_URL, format: { type: "topojson", feature: "rgn" } },

  transform: [
    {
      lookup: "properties.areacd",
      from: {
        data: { url: "data/vis6_rent_map_regions.json" },
        key: "areacd",
        fields: ["areanm", "rent_inflation_yoy_pct"]
      }
    },
    { calculate: "toNumber(datum.rent_inflation_yoy_pct)", as: "rent_yoy" }
  ],

  /* Bigger scale so it fills the card width */
  projection: { type: "mercator", center: [-2.6, 53.4], scale: 3300 },

  mark: { type: "geoshape", stroke: "#ffffff", strokeWidth: 2.2, strokeJoin: "round" },

  encoding: {
    color: {
      field: "rent_yoy",
      type: "quantitative",
      title: "Rent inflation (% y/y)",
      scale: {
        domain: [3, 10],
        scheme: { name: "oranges", extent: [0.25, 0.98] },
        unknown: "#e5e7eb"
      },
      legend: {
        orient: "bottom",
        direction: "horizontal",
        gradientLength: 520,
        gradientThickness: 14,
        titleFontSize: 12,
        labelFontSize: 11,
        format: ".1f",
        offset: 8
      }
    },
    tooltip: [
      { field: "areanm", type: "nominal", title: "Region" },
      { field: "rent_yoy", type: "quantitative", title: "Inflation (% y/y)", format: ".1f" }
    ]
  },

  /* Force legends ON to eliminate the “disable true/false” conflict */
  config: {
    ...THEME,
    axis: { ...THEME.axis, grid: false },
    legend: {
      disable: false,
      titleFontSize: 12,
      labelFontSize: 11
    }
  }
};


// --------------------------------------
  // 7) Interactive regional trend — PROFESSIONAL PUBLICATION VERSION
  // --------------------------------------
  const vis7 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...FIT,

    title: {
      text: "Regional Rent Inflation Dynamics",
      subtitle: "Compare any English region against the national benchmark (2016–2024) | Interactive selector below",
      anchor: "start",
      offset: 14
    },

    data: { url: "data/vis7_rent_trend_regions.json" },
    width: "container",
    height: 380,

    padding: { top: 12, right: 12, bottom: 28, left: 8 },

    params: [
      {
        name: "Region",
        value: "London",
        bind: {
          input: "select",
          name: "Select region to highlight: ",
          options: [
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

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.rent_inflation_yoy_pct)", as: "inflation" },
      {
        calculate:
          "datum.areanm === Region ? 'Selected Region' : (datum.areanm === 'England' ? 'England Average' : 'Other Regions')",
        as: "group"
      }
    ],

    layer: [
      // COVID-19 period (more visible shading)
      {
        data: { 
          values: [
            { start: "2020-03-01", end: "2021-06-01" }
          ] 
        },
        mark: { 
          type: "rect", 
          color: "#fef3c7", 
          opacity: 0.30
        },
        encoding: {
          x: { 
            field: "start", 
            type: "temporal"
          },
          x2: { field: "end", type: "temporal" }
        }
      },

      // COVID label
      {
        data: { 
          values: [{ date: "2020-09-15", y: 10.6, label: "COVID-19" }] 
        },
        mark: { 
          type: "text", 
          fontSize: 9.5, 
          fontStyle: "italic",
          color: "#92400e",
          opacity: 0.65
        },
        encoding: {
          x: { field: "date", type: "temporal" },
          y: { field: "y", type: "quantitative" },
          text: { field: "label" }
        }
      },

      // Zero baseline
      {
        mark: { type: "rule", strokeDash: [5, 5], color: "#94a3b8", strokeWidth: 1, opacity: 0.5 },
        encoding: { y: { datum: 0 } }
      },

      // Background regions (other regions - more visible)
      {
        transform: [{ filter: "datum.group === 'Other Regions'" }],
        mark: { 
          type: "line", 
          strokeWidth: 1.3, 
          opacity: 0.24,
          interpolate: "monotone"
        },
        encoding: {
          x: { 
            field: "d", 
            type: "temporal", 
            title: "Year",
            axis: { 
              format: "%Y", 
              tickCount: 8,
              labelFontSize: 11,
              titleFontSize: 12,
              labelPadding: 8,
              titlePadding: 12
            }
          },
          y: { 
            field: "inflation", 
            type: "quantitative", 
            title: "Annual rent inflation (%)",
            scale: { domain: [0, 11], nice: true },
            axis: { 
              labelFontSize: 11, 
              titleFontSize: 12,
              gridOpacity: 0.08
            }
          },
          detail: { field: "areanm", type: "nominal" },
          color: { value: "#94a3b8" }
        }
      },

      // England average (prominent reference line)
      {
        transform: [{ filter: "datum.group === 'England Average'" }],
        mark: { 
          type: "line", 
          strokeWidth: 3.2,
          interpolate: "monotone"
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          color: { value: "#1e40af" }
        }
      },

      // Selected region (bold highlight)
      {
        transform: [{ filter: "datum.group === 'Selected Region'" }],
        mark: { 
          type: "line", 
          strokeWidth: 4.2,
          interpolate: "monotone"
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          color: { value: "#dc2626" }
        }
      },

      // Points for England average (for tooltips)
      {
        transform: [{ filter: "datum.group === 'England Average'" }],
        mark: { 
          type: "point", 
          filled: true, 
          size: 48,
          opacity: 0
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%B %Y" },
            { field: "areanm", type: "nominal", title: "Area" },
            { field: "inflation", type: "quantitative", title: "Inflation (%)", format: ".2f" }
          ]
        }
      },

      // Points for selected region (for tooltips)
      {
        transform: [{ filter: "datum.group === 'Selected Region'" }],
        mark: { 
          type: "point", 
          filled: true, 
          size: 56,
          opacity: 0
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%B %Y" },
            { field: "areanm", type: "nominal", title: "Region" },
            { field: "inflation", type: "quantitative", title: "Inflation (%)", format: ".2f" }
          ]
        }
      },

      // Peak marker for selected region
      {
        transform: [
          { filter: "datum.group === 'Selected Region'" },
          {
            joinaggregate: [
              { op: "max", field: "inflation", as: "max_inflation" }
            ],
            groupby: ["areanm"]
          },
          { filter: "datum.inflation === datum.max_inflation" }
        ],
        mark: { 
          type: "point", 
          filled: true, 
          size: 140,
          stroke: "#ffffff",
          strokeWidth: 2,
          opacity: 0.9
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          color: { value: "#dc2626" }
        }
      },

      // Peak value label
      {
        transform: [
          { filter: "datum.group === 'Selected Region'" },
          {
            joinaggregate: [
              { op: "max", field: "inflation", as: "max_inflation" }
            ],
            groupby: ["areanm"]
          },
          { filter: "datum.inflation === datum.max_inflation" }
        ],
        mark: { 
          type: "text", 
          dy: -12, 
          fontSize: 10.5, 
          fontWeight: "bold", 
          color: "#991b1b"
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          text: { field: "inflation", type: "quantitative", format: ".1f" }
        }
      },

      // Custom legend using text marks
      {
        data: { values: [{ label: "England Average", y: 10.3, color: "#1e40af" }] },
        mark: { type: "text", fontSize: 12, fontWeight: 600, align: "left", dx: 28 },
        encoding: {
          x: { value: 10 },
          y: { field: "y", type: "quantitative" },
          text: { field: "label" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },
      {
        data: { values: [{ x: 10, y: 10.3, color: "#1e40af" }] },
        mark: { type: "rule", strokeWidth: 3.2, size: 20 },
        encoding: {
          x: { value: 10 },
          x2: { value: 30 },
          y: { field: "y", type: "quantitative" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },

      {
        data: { values: [{ label: "Selected Region", y: 9.5, color: "#dc2626" }] },
        mark: { type: "text", fontSize: 12, fontWeight: 600, align: "left", dx: 28 },
        encoding: {
          x: { value: 10 },
          y: { field: "y", type: "quantitative" },
          text: { field: "label" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },
      {
        data: { values: [{ x: 10, y: 9.5, color: "#dc2626" }] },
        mark: { type: "rule", strokeWidth: 4.2, size: 20 },
        encoding: {
          x: { value: 10 },
          x2: { value: 30 },
          y: { field: "y", type: "quantitative" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },

      {
        data: { values: [{ label: "Other Regions", y: 8.7, color: "#94a3b8" }] },
        mark: { type: "text", fontSize: 11, fontWeight: 400, align: "left", dx: 28, opacity: 0.7 },
        encoding: {
          x: { value: 10 },
          y: { field: "y", type: "quantitative" },
          text: { field: "label" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },
      {
        data: { values: [{ x: 10, y: 8.7, color: "#94a3b8" }] },
        mark: { type: "rule", strokeWidth: 1.3, size: 20, opacity: 0.4 },
        encoding: {
          x: { value: 10 },
          x2: { value: 30 },
          y: { field: "y", type: "quantitative" },
          color: { field: "color", type: "nominal", scale: null }
        }
      }
    ],

    config: THEME
  };

// --------------------------------------
// 8) UK nations map — FIXED (wide + legend ON + centered)
// --------------------------------------
const vis8 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  ...FIT,

  title: {
    text: "Rent inflation across UK nations",
    subtitle: "Latest year-on-year percentage change | Darker blues indicate higher inflation",
    anchor: "start",
    offset: 14
  },

  width: "container",
  height: 400,

  padding: { top: 10, bottom: 72, left: 8, right: 8 },

  data: { url: UK_TOPO_URL, format: { type: "topojson", feature: "ctry" } },

  transform: [
    {
      lookup: "properties.areacd",
      from: {
        data: { url: "data/vis8_rent_map_countries.json" },
        key: "areacd",
        fields: ["areanm", "rent_inflation_yoy_pct"]
      }
    },
    { calculate: "toNumber(datum.rent_inflation_yoy_pct)", as: "rent_yoy" }
  ],

  /* Bigger scale so UK fills width */
  projection: { type: "mercator", center: [-3.2, 55.2], scale: 1950 },

  mark: { type: "geoshape", stroke: "#ffffff", strokeWidth: 2.4, strokeJoin: "round" },

  encoding: {
    color: {
      field: "rent_yoy",
      type: "quantitative",
      title: "Rent inflation (% y/y)",
      scale: {
        domain: [3, 9],
        scheme: { name: "blues", extent: [0.25, 0.98] },
        unknown: "#e5e7eb"
      },
      legend: {
        orient: "bottom",
        direction: "horizontal",
        gradientLength: 520,
        gradientThickness: 14,
        titleFontSize: 12,
        labelFontSize: 11,
        format: ".1f",
        offset: 8
      }
    },
    tooltip: [
      { field: "areanm", type: "nominal", title: "Nation" },
      { field: "rent_yoy", type: "quantitative", title: "Inflation (% y/y)", format: ".1f" }
    ]
  },

  config: {
    ...THEME,
    axis: { ...THEME.axis, grid: false },
    legend: {
      disable: false,
      titleFontSize: 12,
      labelFontSize: 11
    }
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