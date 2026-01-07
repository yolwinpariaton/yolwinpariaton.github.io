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
  // 1) Prices vs Pay (Indexed) - OPTIMIZED FOR NEW CSS FRAME
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
      offset: 30, // Increased offset to breathe with .chart-frame padding
      fontSize: 22,
      subtitleFontSize: 14,
      subtitleColor: "#475569",
      font: "Inter, sans-serif"
    },

    data: { url: "data/vis1_prices_vs_pay.json" },
    width: "container",
    height: 520, // Increased height to match your .vega-map min-height spec

    // Padding calibrated for the new .chart-frame {padding: 45px 35px}
    padding: { top: 80, right: 40, bottom: 40, left: 20 },

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" },
      { pivot: "series", value: "v", groupby: ["d"] },
      { calculate: "datum['CPIH (prices)']", as: "prices" },
      { calculate: "datum['Real earnings']", as: "earnings" },
      { calculate: "datum.prices - datum.earnings", as: "gap" }
    ],

    layer: [
      // 1. Custom Legend: Prices (Fixed Pixel Positions for stability)
      {
        data: { values: [{ label: "■ Prices (CPIH)" }] },
        mark: { type: "text", align: "left", fontWeight: "bold", fontSize: 14, color: "#e11d48" },
        encoding: {
          x: { value: 0 }, 
          y: { value: -50 },
          text: { field: "label" }
        }
      },
      // 2. Custom Legend: Earnings
      {
        data: { values: [{ label: "■ Real Earnings" }] },
        mark: { type: "text", align: "left", fontWeight: "bold", fontSize: 14, color: "#0f172a" },
        encoding: {
          x: { value: 160 }, // Fixed spacing regardless of screen width
          y: { value: -50 },
          text: { field: "label" }
        }
      },

      // 3. Reference Line at 100
      {
        mark: {
          type: "rule",
          strokeDash: [4, 4],
          color: "#94a3b8",
          opacity: 0.5,
          strokeWidth: 1.5
        },
        encoding: { y: { datum: 100 } }
      },
      
      // 4. Shaded Gap Area
      {
        mark: {
          type: "area",
          opacity: 0.15,
          color: "#64748b",
          interpolate: "monotone"
        },
        encoding: {
          x: {
            field: "d",
            type: "temporal",
            title: "Year", 
            axis: { 
              format: "%Y", 
              tickCount: 6, 
              grid: false, 
              labelFlush: true,
              titlePadding: 20,
              titleFontSize: 13,
              titleColor: "#1e293b"
            }
          },
          y: {
            field: "earnings",
            type: "quantitative",
            title: "Index (Jan 2019 = 100)",
            scale: { zero: false, domain: [98, 116] },
            axis: { tickCount: 5, titlePadding: 20, gridOpacity: 0.1, domain: false }
          },
          y2: { field: "prices" }
        }
      },

      // 5. Price Line (Red)
      {
        mark: { type: "line", strokeWidth: 4, color: "#e11d48", interpolate: "monotone" },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "prices", type: "quantitative" }
        }
      },

      // 6. Earnings Line (Black)
      {
        mark: { type: "line", strokeWidth: 4, color: "#0f172a", interpolate: "monotone" },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "earnings", type: "quantitative" }
        }
      },

      // 7. FIXED: Maximum Pressure Point (Only 1 instance, moved right)
      {
        transform: [
          { window: [{ op: "max", field: "gap", as: "max_gap" }] },
          { filter: "datum.gap === datum.max_gap" },
          { window: [{ op: "rank", as: "r" }], sort: [{ field: "d", order: "ascending" }] },
          { filter: "datum.r === 1" }
        ],
        mark: { 
          type: "text", 
          dy: -25, 
          dx: 90, // Significant shift to ensure it clears the Y-axis labels
          fontSize: 12, 
          fontWeight: "700", 
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
            { field: "d", type: "temporal", title: "Date", format: "%B %Y" },
            { field: "prices", type: "quantitative", title: "Price Index", format: ".1f" },
            { field: "earnings", type: "quantitative", title: "Earnings Index", format: ".1f" }
          ]
        }
      }
    ],

    config: { ...THEME, view: { stroke: null } }
  };

  
  // ------------------------------------------------------------------
  // 2) Food Inflation vs Headline - FIXED INTERACTION
  // ------------------------------------------------------------------
  const vis2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...FIT,

    title: {
      text: "Food Inflation vs Overall Inflation",
      subtitle: [
        "Annual percentage rates (2016–2024). Bold lines show 5-period moving average.",
        "Food price volatility significantly outpaced headline CPIH during the energy crisis."
      ],
      anchor: "start",
      offset: 30,
      fontSize: 22,
      subtitleFontSize: 14,
      subtitleColor: "#475569",
      font: "Inter, sans-serif"
    },

    data: { url: "data/vis2_food_vs_headline.json" },
    width: "container",
    height: 520,

    // Consistent padding with Chart 1
    padding: { top: 80, right: 40, bottom: 40, left: 40 },

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" }
    ],

    layer: [
      // 1. Custom Legend: Food (Fixed Position)
      {
        data: { values: [{ label: "■ Food & Non-Alcoholic" }] },
        mark: { type: "text", align: "left", fontWeight: "bold", fontSize: 14, color: "#dc2626" },
        encoding: {
          x: { value: 0 }, 
          y: { value: -50 },
          text: { field: "label" }
        }
      },
      // 2. Custom Legend: Headline CPIH (Fixed Position)
      {
        data: { values: [{ label: "■ Headline CPIH" }] },
        mark: { type: "text", align: "left", fontWeight: "bold", fontSize: 14, color: "#1e40af" },
        encoding: {
          x: { value: 200 }, 
          y: { value: -50 },
          text: { field: "label" }
        }
      },

      // 3. Zero Baseline
      {
        mark: { type: "rule", strokeDash: [4, 4], color: "#94a3b8", opacity: 0.5 },
        encoding: { y: { datum: 0 } }
      },

      // 4. BoE 2% Inflation Target Line
      {
        mark: { type: "rule", strokeDash: [2, 2], color: "#10b981", opacity: 0.5, strokeWidth: 1.5 },
        encoding: { y: { datum: 2 } }
      },

      // 5. Raw Data Lines (Thin Background)
      {
        mark: { type: "line", strokeWidth: 1.5, opacity: 0.15, interpolate: "monotone" },
        encoding: {
          x: { 
            field: "d", 
            type: "temporal", 
            title: "Year", 
            axis: { format: "%Y", tickCount: 8, grid: false, titlePadding: 20 } 
          },
          y: { 
            field: "v", 
            type: "quantitative", 
            title: "Annual inflation rate (%)",
            axis: { titlePadding: 20, gridOpacity: 0.1 } 
          },
          color: {
            field: "series",
            type: "nominal",
            scale: { range: ["#dc2626", "#1e40af"] },
            legend: null
          }
        }
      },

      // 6. Moving Average Lines (Bold)
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
            legend: null
          }
        }
      },

      // 7. FIXED: Transparent Tooltip Layer
      // This uses a rule to create a vertical hover line that displays values for all series
      {
        transform: [
          {
            window: [{ op: "mean", field: "v", as: "v_ma" }],
            frame: [-2, 2],
            sort: [{ field: "d", order: "ascending" }],
            groupby: ["series"]
          }
        ],
        mark: { type: "rule", strokeWidth: 40, opacity: 0, color: "white" },
        encoding: {
          x: { field: "d", type: "temporal" },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%B %Y" },
            { field: "series", type: "nominal", title: "Category" },
            { field: "v_ma", type: "quantitative", title: "Avg Rate (%)", format: ".1f" }
          ]
        }
      }
    ],

    config: { ...THEME, view: { stroke: null } }
  };
  
  // ------------------------------------------------------------------
  // 3) Energy Price Cap - EXPANDED PROFESSIONAL VERSION
  // ------------------------------------------------------------------
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
      subtitle: [
        "Quarterly typical household bills (2021–2025). Peak of £2,070 is a 118% increase from baseline.",
        "Shaded areas highlight the periods of most acute volatility in the wholesale market."
      ],
      anchor: "start",
      offset: 40,
      fontSize: 24, // Slightly larger title for the larger chart
      subtitleFontSize: 15,
      subtitleColor: "#475569",
      font: "Inter, sans-serif"
    },

    data: { url: "data/vis3_energy_cap.json" },
    width: "container",
    height: 600, // Increased from 520 to 600 to fill the frame better

    // Balanced padding for the larger frame
    padding: { top: 100, right: 50, bottom: 80, left: 70 },

    layer: [
      // 1. Custom Legend (Fixed Position)
      {
        data: { values: [{ label: "■ Annual Bill Amount (£)" }] },
        mark: { type: "text", align: "left", fontWeight: "bold", fontSize: 15, color: "#3b82f6" },
        encoding: {
          x: { value: 0 }, 
          y: { value: -65 },
          text: { field: "label" }
        }
      },

      // 2. Background Shading (Crisis Periods)
      {
        data: { values: [{ period_label: "2021 Q4" }, { period_label: "2022 Q1" }, { period_label: "2022 Q2" }] },
        mark: { type: "bar", color: "#dbeafe", opacity: 0.2 },
        encoding: { x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT }, y: { datum: 2400 } }
      },
      {
        data: { values: [{ period_label: "2024 Q2" }, { period_label: "2024 Q3" }, { period_label: "2024 Q4" }] },
        mark: { type: "bar", color: "#fef3c7", opacity: 0.2 },
        encoding: { x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT }, y: { datum: 2400 } }
      },

      // 3. Baseline Reference Line
      {
        mark: { type: "rule", strokeDash: [4, 4], color: "#0891b2", strokeWidth: 1.5, opacity: 0.4 },
        encoding: { y: { datum: 1070 } }
      },

      // 4. Main Line and Points
      {
        layer: [
          { mark: { type: "line", strokeWidth: 4, color: "#64748b", interpolate: "monotone" } },
          {
            mark: { type: "point", filled: true, size: 250, stroke: "white", strokeWidth: 2.5 },
            encoding: {
              color: {
                field: "typical_annual_bill_gbp",
                type: "quantitative",
                scale: {
                  domain: [950, 1300, 1700, 2070],
                  range: ["#06b6d4", "#3b82f6", "#f59e0b", "#dc2626"]
                },
                legend: null
              }
            }
          }
        ],
        encoding: {
          x: {
            field: "period_label",
            type: "ordinal",
            sort: QUARTER_SORT,
            axis: {
              title: "Quarterly Period",
              labelAngle: -45,
              labelAlign: "right",
              titlePadding: 30,
              labelFontSize: 12
            }
          },
          y: {
            field: "typical_annual_bill_gbp",
            type: "quantitative",
            scale: { domain: [0, 2500] },
            axis: { 
              title: "Typical Annual Bill", 
              format: ",.0f", 
              labelExpr: "'£' + datum.label", 
              titlePadding: 25, 
              gridOpacity: 0.1,
              labelFontSize: 12
            }
          }
        }
      },

      // 5. Value Annotations (Key Points)
      {
        transform: [{ filter: "datum.typical_annual_bill_gbp === 950 || datum.typical_annual_bill_gbp === 2070" }],
        mark: { type: "text", dy: -25, fontSize: 14, fontWeight: "bold", color: "#0f172a" },
        encoding: {
          x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT },
          y: { field: "typical_annual_bill_gbp", type: "quantitative" },
          text: { field: "typical_annual_bill_gbp", type: "quantitative", format: ",.0f" }
        }
      },

      // 6. Percentage Increase Annotation
      {
        transform: [{ filter: "datum.typical_annual_bill_gbp === 2070" }],
        mark: { type: "text", dy: 30, fontSize: 13, fontWeight: "800", color: "#dc2626" },
        encoding: {
          x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT },
          y: { field: "typical_annual_bill_gbp", type: "quantitative" },
          text: { value: "↑ 118% CRISIS PEAK" }
        }
      },

      // 7. Stable Tooltip Layer
      {
        mark: { type: "rect", opacity: 0 },
        encoding: {
          x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT },
          tooltip: [
            { field: "period_label", title: "Quarter", type: "nominal" },
            { field: "typical_annual_bill_gbp", title: "Annual Bill (£)", type: "quantitative", format: ",.0f" }
          ]
        }
      }
    ],

    config: { ...THEME, view: { stroke: null } }
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

// ------------------------------------------------------------------
// 5) Rent vs House Price - FIXED LABEL POSITIONING & FORMATTING
// ------------------------------------------------------------------
const vis5 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  ...FIT,

  title: {
    text: "Housing Cost Dynamics: Rents vs House Prices",
    subtitle: "Annual inflation rates (2019–2025). Shaded area indicates the pandemic period.",
    anchor: "start",
    offset: 20,
    fontSize: 18,
    subtitleColor: "#475569"
  },

  data: { url: "data/vis5_rent_vs_house.json" },
  width: "container",
  height: 400, // Reduced height to tighten frame

  padding: { top: 70, right: 30, bottom: 40, left: 60 },

  transform: [
    { calculate: "toDate(datum.date)", as: "d" },
    { calculate: "toNumber(datum.value)", as: "v" },
    { filter: "year(datum.d) >= 2019" }
  ],

  layer: [
    // 1. Shaded Area
    {
      data: { values: [{ start: "2020-03-01", end: "2021-06-01" }] },
      mark: { type: "rect", color: "#fef3c7", opacity: 0.4 },
      encoding: {
        x: { field: "start", type: "temporal" },
        x2: { field: "end", type: "temporal" }
      }
    },

    // 2. Pandemic Label - ABSOLUTE POSITIONING FIX
    {
      data: { values: [{ label: "PANDEMIC PERIOD" }] },
      mark: { 
        type: "text", 
        align: "center", 
        baseline: "middle", 
        fontSize: 10, 
        fontWeight: "bold", 
        color: "#92400e", 
        opacity: 0.8
      },
      encoding: {
        // Using datetime for precise X-axis placement
        x: { datum: {"year": 2020, "month": 10, "date": 15}, type: "temporal" }, 
        y: { datum: 10 }, // Placed high in the shaded area
        text: { field: "label" }
      }
    },

    // 3. Custom Legends
    {
      data: { values: [{ label: "■ Private Rents" }] },
      mark: { type: "text", align: "left", fontWeight: "bold", fontSize: 12, color: "#dc2626" },
      encoding: { x: { value: 0 }, y: { value: -40 }, text: { field: "label" } }
    },
    {
      data: { values: [{ label: "■ House Prices" }] },
      mark: { type: "text", align: "left", fontWeight: "bold", fontSize: 12, color: "#1e40af" },
      encoding: { x: { value: 130 }, y: { value: -40 }, text: { field: "label" } }
    },

    // 4. Main Lines
    {
      mark: { type: "line", strokeWidth: 1, opacity: 0.15, interpolate: "monotone" },
      encoding: {
        x: { field: "d", type: "temporal", title: "Year", axis: { format: "%Y", grid: false } },
        y: { field: "v", type: "quantitative", title: "Annual rate (%)", scale: { domain: [-4, 12] }, axis: { gridOpacity: 0.1 } },
        color: { field: "series", type: "nominal", scale: { range: ["#dc2626", "#1e40af"] }, legend: null }
      }
    },
    {
      transform: [{ window: [{ op: "mean", field: "v", as: "v_ma" }], frame: [-2, 2], sort: [{ field: "d", order: "ascending" }], groupby: ["series"] }],
      mark: { type: "line", strokeWidth: 3, interpolate: "monotone" },
      encoding: {
        x: { field: "d", type: "temporal" },
        y: { field: "v_ma", type: "quantitative" },
        color: { field: "series", type: "nominal", scale: { range: ["#dc2626", "#1e40af"] }, legend: null }
      }
    },

    // 5. Peak Annotation (Positioned Right of center)
    {
      transform: [
        { filter: "datum.series === 'Private rents (UK)'" },
        { window: [{ op: "mean", field: "v", as: "v_ma" }], frame: [-2, 2], sort: [{ field: "d", order: "ascending" }] },
        { window: [{ op: "max", field: "v_ma", as: "max_v" }] },
        { filter: "datum.v_ma === datum.max_v" },
        { filter: "year(datum.d) > 2023" } // Ensures we pick the latest peak
      ],
      mark: { type: "text", dy: -20, dx: 0, fontSize: 10, fontWeight: "bold", color: "#dc2626", text: "PEAK RENT GROWTH" },
      encoding: { x: { field: "d", type: "temporal" }, y: { field: "v_ma", type: "quantitative" } }
    },

    // 6. Tooltip Layer (Format Fix)
    {
      mark: { type: "point", size: 60, opacity: 0 },
      encoding: {
        x: { field: "d", type: "temporal" },
        y: { field: "v", type: "quantitative" },
        tooltip: [
          { field: "d", type: "temporal", title: "Date", format: "%b %Y" },
          { field: "v", title: "Rate (%)", format: ".1f" } 
        ]
      }
    }
  ],
  config: THEME
};

// ------------------------------------------------------------------
// 7) Regional Rent Trend - FIXED LABEL POSITIONING & FORMATTING
// ------------------------------------------------------------------
const vis7 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  ...FIT,

  title: {
    text: "Regional Rent Inflation Dynamics",
    subtitle: "Select a region to highlight trends. Shaded area marks the pandemic.",
    anchor: "start",
    offset: 15,
    fontSize: 18,
    subtitleColor: "#475569"
  },

  data: { url: "data/vis7_rent_trend_regions.json" },
  width: "container",
  height: 400,

  padding: { top: 50, right: 30, bottom: 20, left: 60 },

  params: [
    {
      name: "Region",
      value: "London",
      bind: {
        input: "select",
        name: "Highlight: ",
        options: ["North East", "North West", "Yorkshire and The Humber", "East Midlands", "West Midlands", "East of England", "London", "South East", "South West"]
      }
    }
  ],

  transform: [
    { calculate: "toDate(datum.date)", as: "d" },
    { calculate: "toNumber(datum.rent_inflation_yoy_pct)", as: "inflation" },
    { calculate: "datum.areanm === Region ? 'Selected' : (datum.areanm === 'England' ? 'Average' : 'Others')", as: "group" }
  ],

  layer: [
    // 1. Shaded Area
    {
      data: { values: [{ start: "2020-03-01", end: "2021-06-01" }] },
      mark: { type: "rect", color: "#fef3c7", opacity: 0.3 },
      encoding: { x: { field: "start", type: "temporal" }, x2: { field: "end", type: "temporal" } }
    },
    
    // 2. Pandemic Label - FIXED POSITION
    {
      data: { values: [{ label: "PANDEMIC PERIOD" }] },
      mark: { 
        type: "text", 
        align: "center", 
        baseline: "middle", 
        fontSize: 10, 
        fontWeight: "bold", 
        color: "#92400e", 
        opacity: 0.8 
      },
      encoding: { 
        x: { datum: {"year": 2020, "month": 10, "date": 15}, type: "temporal" }, 
        y: { datum: 9 }, // Placed inside the yellow box at the top
        text: { field: "label" } 
      }
    },

    // 3. Background Lines
    {
      transform: [{ filter: "datum.group === 'Others'" }],
      mark: { type: "line", strokeWidth: 1.2, opacity: 0.1, color: "#94a3b8", interpolate: "monotone" },
      encoding: {
        x: { field: "d", type: "temporal", title: "Year", axis: { format: "%Y", grid: false } },
        y: { field: "inflation", type: "quantitative", title: "Annual inflation (%)", scale: { domain: [0, 11] }, axis: { gridOpacity: 0.1 } },
        detail: { field: "areanm" }
      }
    },

    // 4. England Average (Blue)
    {
      transform: [{ filter: "datum.group === 'Average'" }],
      mark: { type: "line", strokeWidth: 2.5, color: "#1e40af", opacity: 0.7, interpolate: "monotone" },
      encoding: { x: { field: "d", type: "temporal" }, y: { field: "inflation", type: "quantitative" } }
    },

    // 5. Selected Region (Red)
    {
      transform: [{ filter: "datum.group === 'Selected'" }],
      mark: { type: "line", strokeWidth: 4, color: "#dc2626", interpolate: "monotone" },
      encoding: { x: { field: "d", type: "temporal" }, y: { field: "inflation", type: "quantitative" } }
    },

    // 6. Tooltip (Stable Points & Format Fix)
    {
      mark: { type: "point", size: 60, opacity: 0 },
      encoding: {
        x: { field: "d", type: "temporal" },
        y: { field: "inflation", type: "quantitative" },
        tooltip: [
          { field: "d", type: "temporal", title: "Date", format: "%B %Y" },
          { field: "areanm", title: "Region" },
          { field: "inflation", title: "Rate (%)", format: ".1f" }
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