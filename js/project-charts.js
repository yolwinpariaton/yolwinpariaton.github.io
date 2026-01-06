/* js/project-charts.js
   Eight interactive Vega-Lite charts for the UK cost of living project.

   MAPS (Charts 6 & 8):
   - Embed from /data spec files:
       data/vis6_rent_map_spec.json
       data/vis8_rent_map_spec.json
*/

console.log("LOADED project-charts v3-fixed");

(function () {
  "use strict";

  // Use SVG for robust responsive sizing inside framed containers
  const opts = {
    actions: false,
    renderer: "svg",
    config: {
      legend: { disable: false }
    }
  };

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
    },
    legend: {
      titleFontSize: 12,
      labelFontSize: 11
    }
  };

  // Better responsive behaviour
  const FIT = { autosize: { type: "fit", contains: "padding", resize: true } };

  function safeEmbed(selector, specOrUrl) {
    const el = document.querySelector(selector);
    if (!el) return;

    if (typeof vegaEmbed !== "function") {
      console.error("vegaEmbed is not available. Check script tags for vega/vega-lite/vega-embed.");
      el.innerHTML = "<p>Chart failed to load: vegaEmbed not found.</p>";
      return;
    }

    vegaEmbed(selector, specOrUrl, opts).catch((err) => {
      console.error("Vega embed error for", selector, err);
      el.innerHTML = "<p>Chart failed to load. Check console and JSON paths.</p>";
    });
  }

// ------------------------------------------------------------------
  // 1) Prices vs Pay (Indexed) - FIXED LABELS & X-AXIS TITLE
  // ------------------------------------------------------------------
  const vis1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...FIT,

    title: {
      text: "The Real Wage Squeeze: Prices vs Pay",
      subtitle: [
        "Indices (January 2019 = 100). The gap represents the loss in consumer",
        "purchasing power as inflation outpaced real earnings growth."
      ],
      anchor: "start",
      offset: 25,
      fontSize: 20,
      subtitleFontSize: 13,
      subtitleColor: "#475569",
      font: "Inter, sans-serif"
    },

    data: { url: "data/vis1_prices_vs_pay.json" },
    width: "container",
    height: 400,

    // Increased padding to ensure legend labels and axis titles don't clip
    padding: { top: 70, right: 30, bottom: 40, left: 30 },

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" },
      { pivot: "series", value: "v", groupby: ["d"] },
      { calculate: "datum['CPIH (prices)']", as: "prices" },
      { calculate: "datum['Real earnings']", as: "earnings" },
      { calculate: "datum.prices - datum.earnings", as: "gap" }
    ],

    layer: [
      // 1. Custom Legend: Prices (Positioned far left)
      {
        data: { values: [{ label: "■ Prices (CPIH)" }] },
        mark: { type: "text", align: "left", fontWeight: "bold", fontSize: 13, color: "#e11d48" },
        encoding: {
          x: { datum: "2019-01-15", type: "temporal" }, 
          y: { value: -40 },
          text: { field: "label" }
        }
      },
      // 2. Custom Legend: Earnings (Moved significantly right to 2021 to prevent overlap)
      {
        data: { values: [{ label: "■ Real Earnings" }] },
        mark: { type: "text", align: "left", fontWeight: "bold", fontSize: 13, color: "#0f172a" },
        encoding: {
          x: { datum: "2021-06-01", type: "temporal" }, 
          y: { value: -40 },
          text: { field: "label" }
        }
      },

      // 3. Baseline Reference Line
      {
        mark: {
          type: "rule",
          strokeDash: [4, 4],
          color: "#94a3b8",
          opacity: 0.6,
          strokeWidth: 1
        },
        encoding: { y: { datum: 100 } }
      },
      
      // 4. Shaded Gap Area
      {
        mark: {
          type: "area",
          opacity: 0.12,
          color: "#475569",
          interpolate: "monotone"
        },
        encoding: {
          x: {
            field: "d",
            type: "temporal",
            title: "Year", // DISPLAYING THE X-AXIS NAME
            axis: { 
              format: "%Y", 
              tickCount: 6, 
              grid: false, 
              labelFlush: true,
              labelPadding: 10,
              titlePadding: 15
            }
          },
          y: {
            field: "earnings",
            type: "quantitative",
            title: "Index (Jan 2019 = 100)",
            scale: { zero: false, domain: [98, 116] },
            axis: { tickCount: 5, titlePadding: 15, gridOpacity: 0.1, domain: false }
          },
          y2: { field: "prices" }
        }
      },

      // 5. Price Line
      {
        mark: { type: "line", strokeWidth: 3.5, color: "#e11d48", interpolate: "monotone" },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "prices", type: "quantitative" }
        }
      },

      // 6. Earnings Line
      {
        mark: { type: "line", strokeWidth: 3.5, color: "#0f172a", interpolate: "monotone" },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "earnings", type: "quantitative" }
        }
      },

      // 7. SINGLE Annotation for Peak Pressure
      {
        transform: [
          { window: [{ op: "max", field: "gap", as: "max_gap" }] },
          { filter: "datum.gap === datum.max_gap" },
          { window: [{ op: "rank", as: "r" }], sort: [{ field: "d", order: "ascending" }] },
          { filter: "datum.r === 1" }
        ],
        mark: { 
          type: "text", 
          dy: -20, 
          dx: 50, // Shifted further right to avoid Y-axis labels
          fontSize: 11, 
          fontWeight: "600", 
          color: "#475569",
          text: "Maximum Pressure Point"
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "prices", type: "quantitative" }
        }
      },

      // 8. Tooltip
      {
        mark: { type: "point", size: 100, opacity: 0 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "prices", type: "quantitative" },
          tooltip: [
            { field: "d", type: "temporal", title: "Month", format: "%B %Y" },
            { field: "prices", type: "quantitative", title: "Price Index", format: ".1f" },
            { field: "earnings", type: "quantitative", title: "Earnings Index", format: ".1f" }
          ]
        }
      }
    ],

    config: { ...THEME, view: { stroke: null } }
  };
  // --------------------------------------
  // 2) Food inflation vs headline
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
      {
        mark: { type: "rule", strokeDash: [4, 6], color: "#94a3b8", opacity: 0.6 },
        encoding: { y: { datum: 0 } }
      },
      {
        mark: { type: "rule", strokeDash: [3, 3], color: "#10b981", opacity: 0.4 },
        encoding: { y: { datum: 2 } }
      },

      {
        mark: { type: "line", strokeWidth: 1.5, opacity: 0.2, interpolate: "monotone" },
        encoding: {
          x: { field: "d", type: "temporal", title: "Year", axis: { format: "%Y", tickCount: 8 } },
          y: { field: "v", type: "quantitative", title: "Annual inflation rate (%)" },
          color: {
            field: "series",
            type: "nominal",
            scale: { range: ["#dc2626", "#1e40af"] },
            legend: null
          },
          detail: { field: "series" }
        }
      },

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
        encoding: { x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT }, y: { datum: 2200 } }
      },
      {
        data: { values: [{ period_label: "2024 Q2" }, { period_label: "2024 Q3" }, { period_label: "2024 Q4" }] },
        mark: { type: "bar", color: "#fef3c7", opacity: 0.32 },
        encoding: { x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT }, y: { datum: 2200 } }
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
  // 4) Weekly fuel prices
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
    height: 500,
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
              dy: -15,
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

      {
        mark: { type: "rule", strokeDash: [4, 4], color: "#475569", opacity: 0.8, strokeWidth: 1.5 },
        encoding: { y: { datum: 120 } }
      },
      {
        mark: { type: "text", align: "left", dx: 10, dy: -25, fontSize: 12, color: "#1e293b", fontWeight: "bold" },
        encoding: { x: { value: 0 }, y: { datum: 120 }, text: { value: "Pre-pandemic baseline (120p)" } }
      },

      {
        transform: [
          { window: [{ op: "mean", field: "ppl", as: "ppl_ma" }], frame: [-2, 2], groupby: ["fuel"] }
        ],
        mark: { type: "line", strokeWidth: 4, interpolate: "monotone" },
        encoding: {
          x: { field: "d", type: "temporal", title: "Year", axis: { format: "%Y", tickCount: 7, grid: false, labelPadding: 10 } },
          y: { field: "ppl_ma", type: "quantitative", title: "Pence per litre", scale: { domain: [80, 210] }, axis: { titlePadding: 15 } },
          color: {
            field: "fuel",
            type: "nominal",
            scale: { range: ["#2563eb", "#d97706"] },
            legend: { orient: "top", direction: "horizontal", title: null, labelFontSize: 13, symbolType: "circle", symbolSize: 160, offset: 25 }
          }
        }
      },

      {
        transform: [
          { window: [{ op: "mean", field: "ppl", as: "ppl_ma" }], frame: [-2, 2], groupby: ["fuel"] }
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
  // 5) Rent vs house price
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
      { mark: { type: "rule", strokeDash: [4, 4], color: "#94a3b8", opacity: 0.6 }, encoding: { y: { datum: 0 } } },
      { mark: { type: "rule", strokeDash: [3, 3], color: "#10b981", opacity: 0.35 }, encoding: { y: { datum: 2 } } },

      {
        mark: { type: "line", strokeWidth: 1.5, opacity: 0.2, interpolate: "monotone" },
        encoding: {
          x: { field: "d", type: "temporal", title: "Year", axis: { format: "%Y", tickCount: 8 } },
          y: { field: "v", type: "quantitative", title: "Annual inflation rate (%)" },
          color: { field: "series", type: "nominal", scale: { range: ["#dc2626", "#1e40af"] }, legend: null },
          detail: { field: "series" }
        }
      },

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
            legend: { orient: "top", direction: "horizontal", title: null, labelFontSize: 12, symbolSize: 200, symbolStrokeWidth: 4 }
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
  // 7) Interactive regional trend
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
      {
        data: { values: [{ start: "2020-03-01", end: "2021-06-01" }] },
        mark: { type: "rect", color: "#fef3c7", opacity: 0.30 },
        encoding: { x: { field: "start", type: "temporal" }, x2: { field: "end", type: "temporal" } }
      },

      { mark: { type: "rule", strokeDash: [5, 5], color: "#94a3b8", strokeWidth: 1, opacity: 0.5 }, encoding: { y: { datum: 0 } } },

      {
        transform: [{ filter: "datum.group === 'Other Regions'" }],
        mark: { type: "line", strokeWidth: 1.3, opacity: 0.24, interpolate: "monotone" },
        encoding: {
          x: { field: "d", type: "temporal", title: "Year", axis: { format: "%Y", tickCount: 8 } },
          y: { field: "inflation", type: "quantitative", title: "Annual rent inflation (%)", scale: { domain: [0, 11], nice: true } },
          detail: { field: "areanm", type: "nominal" },
          color: { value: "#94a3b8" }
        }
      },

      {
        transform: [{ filter: "datum.group === 'England Average'" }],
        mark: { type: "line", strokeWidth: 3.2, interpolate: "monotone" },
        encoding: { x: { field: "d", type: "temporal" }, y: { field: "inflation", type: "quantitative" }, color: { value: "#1e40af" } }
      },

      {
        transform: [{ filter: "datum.group === 'Selected Region'" }],
        mark: { type: "line", strokeWidth: 4.2, interpolate: "monotone" },
        encoding: { x: { field: "d", type: "temporal" }, y: { field: "inflation", type: "quantitative" }, color: { value: "#dc2626" } }
      },

      {
        transform: [{ filter: "datum.group === 'Selected Region'" }],
        mark: { type: "point", filled: true, size: 56, opacity: 0 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%B %Y" },
            { field: "areanm", type: "nominal", title: "Region" },
            { field: "inflation", type: "quantitative", title: "Inflation (%)", format: ".2f" }
          ]
        }
      }
    ],

    config: THEME
  };

  // ------------------------------------------------------------------
  // EMBED ALL EIGHT CHARTS
  // ------------------------------------------------------------------
  safeEmbed("#vis1", vis1);
  safeEmbed("#vis2", vis2);
  safeEmbed("#vis3", vis3);
  safeEmbed("#vis4", vis4);
  safeEmbed("#vis5", vis5);

  // Maps embed from external spec files
  safeEmbed("#vis6", "data/vis6_rent_map_spec.json");
  
  safeEmbed("#vis7", vis7);

  safeEmbed("#vis8", "data/vis8_rent_map_spec.json");
})();