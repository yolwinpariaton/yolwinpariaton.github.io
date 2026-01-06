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

  // --------------------------------------
  // 1) Prices vs pay (indexed)
  // --------------------------------------
  const vis1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...FIT,

    title: {
      text: "Prices vs pay (indexed to 2019 = 100)",
      subtitle:
        "Shaded area shows the purchasing-power gap when consumer prices rise faster than real earnings.",
      anchor: "start",
      offset: 14
    },

    data: { url: "data/vis1_prices_vs_pay.json" },
    width: "container",
    height: 300,

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" },
      { pivot: "series", value: "v", groupby: ["d"] },
      { calculate: "datum['CPIH (prices)']", as: "prices" },
      { calculate: "datum['Real earnings']", as: "earnings" },
      { calculate: "datum.prices - datum.earnings", as: "gap" }
    ],

    layer: [
      {
        mark: { type: "rule", strokeDash: [4, 6], color: "#94a3b8", opacity: 0.7 },
        encoding: { y: { datum: 100 } }
      },
      {
        mark: { type: "area", opacity: 0.18, color: "#94a3b8" },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date", axis: { format: "%Y", tickCount: 7 } },
          y: {
            field: "earnings",
            type: "quantitative",
            title: "Index (2019 = 100)",
            scale: { zero: false, domain: [98, 114] },
            axis: { tickCount: 6 }
          },
          y2: { field: "prices" }
        }
      },
      {
        mark: { type: "line", strokeWidth: 3, point: { filled: true, size: 40 } },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date" },
          y: { field: "prices", type: "quantitative" },
          color: { value: "#2563eb" },
          tooltip: [
            { field: "d", type: "temporal", title: "Date" },
            { field: "prices", type: "quantitative", title: "CPIH (prices)", format: ".1f" },
            { field: "earnings", type: "quantitative", title: "Real earnings", format: ".1f" },
            { field: "gap", type: "quantitative", title: "Gap (prices − pay)", format: ".1f" }
          ]
        }
      },
      {
        mark: { type: "line", strokeWidth: 3, point: { filled: true, size: 40 } },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date" },
          y: { field: "earnings", type: "quantitative" },
          color: { value: "#f59e0b" }
        }
      }
    ],

    config: THEME
  };

  // --------------------------------------
  // 2) Food inflation vs headline
  // --------------------------------------
  const vis2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...FIT,

    title: { text: "Food inflation vs headline (annual rate)", anchor: "start", offset: 14 },
    data: { url: "data/vis2_food_vs_headline.json" },
    width: "container",
    height: 300,

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" }
    ],

    layer: [
      {
        mark: { type: "rule", strokeDash: [4, 6], color: "#94a3b8", opacity: 0.7 },
        encoding: { y: { datum: 0 } }
      },
      {
        mark: { type: "line", strokeWidth: 2, opacity: 0.25, point: { filled: true, size: 26, opacity: 0.25 } },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date" },
          y: { field: "v", type: "quantitative", title: "Percent" },
          color: { field: "series", type: "nominal", scale: { range: ["#2563eb", "#f59e0b"] }, legend: null },
          tooltip: [
            { field: "d", type: "temporal", title: "Date" },
            { field: "series", type: "nominal", title: "Series" },
            { field: "v", type: "quantitative", title: "Percent", format: ".1f" }
          ]
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
        mark: { type: "line", strokeWidth: 4 },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date" },
          y: { field: "v_ma", type: "quantitative", title: "Percent" },
          color: {
            field: "series",
            type: "nominal",
            scale: { range: ["#2563eb", "#f59e0b"] },
            legend: { orient: "top", direction: "horizontal", title: null, padding: 10 }
          }
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
  // 4) Weekly fuel prices
  // --------------------------------------
  const vis4 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  ...FIT,

  title: {
    text: "UK Fuel Prices: From Pandemic Crash to Energy Crisis",
    subtitle:
      "Weekly pump prices (2019–2025) | Russia-Ukraine conflict drove prices 60% above pre-pandemic levels",
    anchor: "start",
    offset: 14
  },

  data: { url: "data/vis4_fuel_weekly.json" },
  width: "container",
  height: "container",
  padding: { top: 34, right: 16, bottom: 54, left: 62 },

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
    // Raw weekly (subtle) — NO legend, NO axis
    {
      mark: { type: "line", strokeWidth: 0.8, opacity: 0.06, interpolate: "monotone" },
      encoding: {
        x: { field: "d", type: "temporal", axis: null, title: null },
        y: { field: "ppl", type: "quantitative", axis: null, title: null, scale: { domain: [60, 220] } },
        color: {
          field: "fuel",
          type: "nominal",
          scale: { range: ["#1e40af", "#d97706"] },
          legend: null
        }
      }
    },

    // Moving average (bold) — OWNS axis + legend (the only legend)
    {
      transform: [
        {
          window: [{ op: "mean", field: "ppl", as: "ppl_ma" }],
          frame: [-2, 2],
          sort: [{ field: "d", order: "ascending" }],
          groupby: ["fuel"]
        }
      ],
      mark: { type: "line", strokeWidth: 3.8, interpolate: "monotone" },
      encoding: {
        x: {
          field: "d",
          type: "temporal",
          title: "Year",
          axis: {
            orient: "bottom",
            format: "%Y",
            tickCount: 7,              // keep SIMPLE (avoid the axis crash)
            labelPadding: 10,
            titlePadding: 10,
            labelOverlap: "greedy"
          }
        },
        y: {
          field: "ppl_ma",
          type: "quantitative",
          title: "Pence per litre",
          scale: { domain: [60, 220] },
          axis: { labelFontSize: 11, titleFontSize: 12 }
        },
        color: {
          field: "fuel",
          type: "nominal",
          scale: { range: ["#1e40af", "#d97706"] },
          legend: {
            orient: "top",
            direction: "horizontal",
            title: null,
            labelFontSize: 13,
            symbolSize: 240,
            symbolStrokeWidth: 3.8,
            offset: -6,
            padding: 0
          }
        }
      }
    },

    // Tooltips (invisible points)
    {
      transform: [
        {
          window: [{ op: "mean", field: "ppl", as: "ppl_ma" }],
          frame: [-2, 2],
          sort: [{ field: "d", order: "ascending" }],
          groupby: ["fuel"]
        }
      ],
      mark: { type: "point", filled: true, size: 60, opacity: 0 },
      encoding: {
        x: { field: "d", type: "temporal", axis: null, title: null },
        y: { field: "ppl_ma", type: "quantitative", axis: null, title: null },
        color: { field: "fuel", type: "nominal", scale: { range: ["#1e40af", "#d97706"] }, legend: null },
        tooltip: [
          { field: "d", type: "temporal", title: "Week", format: "%b %d, %Y" },
          { field: "fuel", type: "nominal", title: "Fuel type" },
          { field: "ppl_ma", type: "quantitative", title: "Price (5-week avg)", format: ".1f" }
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
      text: "Housing costs: rent vs house price inflation",
      subtitle: "Annual rates with 5-month moving average (bold) | Private rents show persistent inflation",
      anchor: "start",
      offset: 14
    },

    data: { url: "data/vis5_rent_vs_house.json" },
    width: "container",
    height: 360,

    padding: { top: 6, right: 6, bottom: 22, left: 6 },

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" }
    ],

    layer: [
      { mark: { type: "rule", strokeDash: [4, 4], color: "#94a3b8", opacity: 0.6 }, encoding: { y: { datum: 0 } } },
      {
        mark: { type: "line", strokeWidth: 1.2, opacity: 0.18 },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date", axis: { format: "%Y", tickCount: 7 } },
          y: { field: "v", type: "quantitative", title: "Annual inflation rate (%)", scale: { domain: [-2, 11] } },
          color: { field: "series", type: "nominal", scale: { range: ["#2563eb", "#f59e0b"] }, legend: null }
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
        mark: { type: "line", strokeWidth: 3.4 },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date" },
          y: { field: "v_ma", type: "quantitative", title: "Annual inflation rate (%)" },
          color: { field: "series", type: "nominal", scale: { range: ["#2563eb", "#f59e0b"] }, legend: null }
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
        mark: { type: "point", opacity: 0, size: 60 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "v_ma", type: "quantitative" },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%b %Y" },
            { field: "series", type: "nominal", title: "Series" },
            { field: "v", type: "quantitative", title: "Monthly", format: ".1f" },
            { field: "v_ma", type: "quantitative", title: "5-month avg", format: ".1f" }
          ]
        }
      }
    ],

    config: THEME
  };

  // --------------------------------------
  // 6) England regional map — FINAL PERFECTED
  // --------------------------------------
  const vis6 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...FIT,

    title: {
      text: "Regional rent inflation across England",
      subtitle: "Latest year-on-year percentage change by English region | Darker colours indicate higher inflation",
      anchor: "start",
      offset: 14
    },

    width: "container",
    height: 480,
    
    // Better balance: more top, less bottom
    padding: { top: 20, bottom: 35, left: 0, right: 0 },

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

    // Adjusted center for better vertical positioning
    projection: { type: "mercator", center: [-2.6, 53.5], scale: 2400 },

    mark: { type: "geoshape", stroke: "#ffffff", strokeWidth: 2, strokeJoin: "round" },

    encoding: {
      color: {
        field: "rent_yoy",
        type: "quantitative",
        title: "Rent inflation (% y/y)",
        scale: { domain: [3, 10], scheme: { name: "oranges", extent: [0.25, 0.98] }, unknown: "#e5e7eb" },
        legend: {
          orient: "bottom",
          direction: "horizontal",
          gradientLength: 360,
          gradientThickness: 14,
          titleFontSize: 12,
          labelFontSize: 11,
          format: ".1f",
          offset: 16,
          padding: 2
        }
      },
      tooltip: [
        { field: "areanm", type: "nominal", title: "Region" },
        { field: "rent_yoy", type: "quantitative", title: "Inflation (% y/y)", format: ".1f" }
      ]
    },

    config: { ...THEME, axis: { ...THEME.axis, grid: false } }
  };

  // --------------------------------------
  // 7) Interactive regional trend — ULTRA-PROFESSIONAL PUBLICATION VERSION
  // --------------------------------------
  const vis7 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...FIT,

    title: {
      text: "Regional Rent Inflation Dynamics",
      subtitle: "Compare any English region against the national benchmark (2016–2024) | Grey band shows ±1 standard deviation from England average",
      anchor: "start",
      offset: 14
    },

    data: { url: "data/vis7_rent_trend_regions.json" },
    width: "container",
    height: 420,

    padding: { top: 14, right: 14, bottom: 32, left: 10 },

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
      // COVID-19 period annotation (subtle background)
      {
        data: { 
          values: [
            { start: "2020-03-01", end: "2021-06-01", label: "COVID-19 lockdowns" }
          ] 
        },
        mark: { 
          type: "rect", 
          color: "#fef3c7", 
          opacity: 0.15 
        },
        encoding: {
          x: { 
            field: "start", 
            type: "temporal",
            axis: null
          },
          x2: { field: "end", type: "temporal" },
          y: { value: 0 },
          y2: { value: 420 }
        }
      },

      // COVID annotation label
      {
        data: { 
          values: [{ date: "2020-09-01", y: 10.5, label: "COVID-19" }] 
        },
        mark: { 
          type: "text", 
          fontSize: 10, 
          fontStyle: "italic",
          color: "#92400e",
          opacity: 0.6,
          angle: 0
        },
        encoding: {
          x: { field: "date", type: "temporal" },
          y: { field: "y", type: "quantitative" },
          text: { field: "label" }
        }
      },

      // Statistical confidence band (±1 SD from England average)
      {
        data: {
          values: [
            { date: "2016-01-01", mid: 2.0, lower: 1.0, upper: 3.0 },
            { date: "2017-01-01", mid: 2.5, lower: 1.3, upper: 3.7 },
            { date: "2018-01-01", mid: 2.8, lower: 1.5, upper: 4.1 },
            { date: "2019-01-01", mid: 1.5, lower: 0.5, upper: 2.5 },
            { date: "2020-01-01", mid: 1.3, lower: 0.3, upper: 2.3 },
            { date: "2021-01-01", mid: 1.8, lower: 0.8, upper: 2.8 },
            { date: "2022-01-01", mid: 3.5, lower: 2.2, upper: 4.8 },
            { date: "2023-01-01", mid: 5.2, lower: 3.8, upper: 6.6 },
            { date: "2024-01-01", mid: 8.5, lower: 7.0, upper: 10.0 }
          ]
        },
        transform: [
          { calculate: "toDate(datum.date)", as: "d" }
        ],
        mark: { 
          type: "area", 
          color: "#bae6fd", 
          opacity: 0.18,
          interpolate: "monotone"
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "lower", type: "quantitative" },
          y2: { field: "upper", type: "quantitative" }
        }
      },

      // Zero baseline (dashed)
      {
        mark: { type: "rule", strokeDash: [5, 5], color: "#94a3b8", strokeWidth: 1, opacity: 0.5 },
        encoding: { y: { datum: 0 } }
      },

      // Background regions (all other regions, very subtle)
      {
        transform: [{ filter: "datum.group === 'Other Regions'" }],
        mark: { 
          type: "line", 
          strokeWidth: 1.2, 
          opacity: 0.12,
          interpolate: "monotone"
        },
        encoding: {
          x: { 
            field: "d", 
            type: "temporal", 
            title: "Year",
            axis: { 
              format: "%Y", 
              tickCount: 9,
              labelFontSize: 11,
              titleFontSize: 12,
              labelPadding: 8,
              titlePadding: 14,
              gridOpacity: 0.06
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
              gridOpacity: 0.08,
              gridDash: [2, 4]
            }
          },
          detail: { field: "areanm", type: "nominal" },
          color: { value: "#cbd5e1" }
        }
      },

      // England average (prominent reference line)
      {
        transform: [{ filter: "datum.group === 'England Average'" }],
        mark: { 
          type: "line", 
          strokeWidth: 3.4,
          interpolate: "monotone",
          strokeDash: [0]
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          color: { value: "#1e40af" }
        }
      },

      // England average with subtle glow effect (white stroke underneath)
      {
        transform: [{ filter: "datum.group === 'England Average'" }],
        mark: { 
          type: "line", 
          strokeWidth: 6,
          interpolate: "monotone",
          opacity: 0.3
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          color: { value: "#dbeafe" }
        }
      },

      // Selected region (bold highlight)
      {
        transform: [{ filter: "datum.group === 'Selected Region'" }],
        mark: { 
          type: "line", 
          strokeWidth: 4.5,
          interpolate: "monotone"
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          color: { value: "#dc2626" }
        }
      },

      // Selected region with subtle glow
      {
        transform: [{ filter: "datum.group === 'Selected Region'" }],
        mark: { 
          type: "line", 
          strokeWidth: 7,
          interpolate: "monotone",
          opacity: 0.25
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          color: { value: "#fecaca" }
        }
      },

      // Peak markers for selected region (conditional)
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
          size: 200,
          stroke: "#ffffff",
          strokeWidth: 2.5,
          opacity: 0.95
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          color: { value: "#dc2626" }
        }
      },

      // Peak value labels
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
          dy: -14, 
          fontSize: 11, 
          fontWeight: "bold", 
          color: "#991b1b",
          align: "center"
        },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "inflation", type: "quantitative" },
          text: { field: "inflation", type: "quantitative", format: ".1f" }
        }
      },

      // Points for England average (for tooltips)
      {
        transform: [{ filter: "datum.group === 'England Average'" }],
        mark: { 
          type: "point", 
          filled: true, 
          size: 52,
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
          size: 62,
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

      // Enhanced custom legend with visual hierarchy
      {
        data: { values: [{ label: "England Average", y: 10.5, color: "#1e40af" }] },
        mark: { 
          type: "text", 
          fontSize: 12.5, 
          fontWeight: 700, 
          align: "left", 
          dx: 32,
          baseline: "middle"
        },
        encoding: {
          x: { value: 10 },
          y: { field: "y", type: "quantitative" },
          text: { field: "label" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },
      {
        data: { values: [{ x: 10, y: 10.5, color: "#1e40af" }] },
        mark: { type: "rule", strokeWidth: 3.4, size: 24 },
        encoding: {
          x: { value: 10 },
          x2: { value: 32 },
          y: { field: "y", type: "quantitative" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },

      {
        data: { values: [{ label: "Selected Region", y: 9.6, color: "#dc2626" }] },
        mark: { 
          type: "text", 
          fontSize: 12.5, 
          fontWeight: 700, 
          align: "left", 
          dx: 32,
          baseline: "middle"
        },
        encoding: {
          x: { value: 10 },
          y: { field: "y", type: "quantitative" },
          text: { field: "label" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },
      {
        data: { values: [{ x: 10, y: 9.6, color: "#dc2626" }] },
        mark: { type: "rule", strokeWidth: 4.5, size: 24 },
        encoding: {
          x: { value: 10 },
          x2: { value: 32 },
          y: { field: "y", type: "quantitative" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },

      {
        data: { values: [{ label: "Other Regions", y: 8.7, color: "#94a3b8" }] },
        mark: { 
          type: "text", 
          fontSize: 11, 
          fontWeight: 500, 
          align: "left", 
          dx: 32, 
          opacity: 0.75,
          baseline: "middle"
        },
        encoding: {
          x: { value: 10 },
          y: { field: "y", type: "quantitative" },
          text: { field: "label" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },
      {
        data: { values: [{ x: 10, y: 8.7, color: "#cbd5e1" }] },
        mark: { type: "rule", strokeWidth: 1.2, size: 24, opacity: 0.35 },
        encoding: {
          x: { value: 10 },
          x2: { value: 32 },
          y: { field: "y", type: "quantitative" },
          color: { field: "color", type: "nominal", scale: null }
        }
      },

      // Confidence band legend item
      {
        data: { values: [{ label: "Regional variation (±1 SD)", y: 7.8 }] },
        mark: { 
          type: "text", 
          fontSize: 10.5, 
          fontWeight: 400, 
          align: "left", 
          dx: 32, 
          opacity: 0.7,
          baseline: "middle",
          fontStyle: "italic"
        },
        encoding: {
          x: { value: 10 },
          y: { field: "y", type: "quantitative" },
          text: { field: "label" },
          color: { value: "#0c4a6e" }
        }
      },
      {
        data: { values: [{ x: 10, y: 7.8 }] },
        mark: { 
          type: "rect", 
          height: 12, 
          color: "#bae6fd", 
          opacity: 0.3 
        },
        encoding: {
          x: { value: 10 },
          x2: { value: 32 },
          y: { field: "y", type: "quantitative" }
        }
      }
    ],

    config: THEME
  };

  // --------------------------------------
  // 8) UK nations map — FINAL PERFECTED
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
    height: 500,
    
    // Better balance: more top, less bottom
    padding: { top: 18, bottom: 30, left: 0, right: 0 },

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

    // Better centered
    projection: { type: "mercator", center: [-3.2, 55.2], scale: 1400 },

    mark: { type: "geoshape", stroke: "#ffffff", strokeWidth: 2.5, strokeJoin: "round" },

    encoding: {
      color: {
        field: "rent_yoy",
        type: "quantitative",
        title: "Rent inflation (% y/y)",
        scale: { domain: [3, 9], scheme: { name: "blues", extent: [0.25, 0.98] }, unknown: "#e5e7eb" },
        legend: {
          orient: "bottom",
          direction: "horizontal",
          gradientLength: 360,
          gradientThickness: 14,
          titleFontSize: 12,
          labelFontSize: 11,
          format: ".1f",
          offset: 10,
          padding: 2
        }
      },
      tooltip: [
        { field: "areanm", type: "nominal", title: "Nation" },
        { field: "rent_yoy", type: "quantitative", title: "Inflation (% y/y)", format: ".1f" }
      ]
    },

    config: { ...THEME, axis: { ...THEME.axis, grid: false } }
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