/* js/project-charts.js
   Eight interactive Vega-Lite charts for the UK cost of living project.
*/
(function () {
  const opts = { actions: false, renderer: "canvas" };

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
    title: { fontSize: 20, subtitleFontSize: 12, color: "#0f172a", subtitleColor: "#64748b" }
  };

  function safeEmbed(selector, spec) {
    const el = document.querySelector(selector);
    if (!el) return;
    vegaEmbed(selector, spec, opts).catch((err) => {
      console.error("Vega embed error for", selector, err);
      el.innerHTML = "<p>Chart failed to load. Check console and JSON paths.</p>";
    });
  }

  // --------------------------------------
  // 1) Prices vs pay (indexed) — clean, no legend warnings
  // --------------------------------------
  const vis1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",

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
      // Baseline at 100
      {
        mark: { type: "rule", strokeDash: [4, 6], color: "#94a3b8", opacity: 0.7 },
        encoding: { y: { datum: 100 } }
      },

      // Gap shading between earnings and prices
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

      // Prices line
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

      // Earnings line
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
  // 2) Food inflation vs headline — FIX legend conflict (legend defined once only)
  // --------------------------------------
  const vis2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Food inflation vs headline (annual rate)", anchor: "start", offset: 14 },
    data: { url: "data/vis2_food_vs_headline.json" },
    width: "container",
    height: 300,

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" }
    ],

    layer: [
      // Zero line
      {
        mark: { type: "rule", strokeDash: [4, 6], color: "#94a3b8", opacity: 0.7 },
        encoding: { y: { datum: 0 } }
      },

      // Raw monthly (legend OFF here to avoid conflicts)
      {
        mark: {
          type: "line",
          strokeWidth: 2,
          opacity: 0.25,
          point: { filled: true, size: 26, opacity: 0.25 }
        },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date" },
          y: { field: "v", type: "quantitative", title: "Percent" },
          color: {
            field: "series",
            type: "nominal",
            scale: { range: ["#2563eb", "#f59e0b"] },
            legend: null
          },
          tooltip: [
            { field: "d", type: "temporal", title: "Date" },
            { field: "series", type: "nominal", title: "Series" },
            { field: "v", type: "quantitative", title: "Percent", format: ".1f" }
          ]
        }
      },

      // Smoothed (legend ON here only)
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
  // 3) Energy cap — reduce height; keep your design; align sorting to avoid union warnings
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

    layer: [
      // Pre-crisis shading
      {
        data: { values: [{ period_label: "2021 Q4" }, { period_label: "2022 Q1" }, { period_label: "2022 Q2" }] },
        mark: { type: "bar", color: "#dbeafe", opacity: 0.28 },
        encoding: {
          x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT },
          y: { datum: 2200 }
        }
      },

      // Peak shading
      {
        data: { values: [{ period_label: "2024 Q2" }, { period_label: "2024 Q3" }, { period_label: "2024 Q4" }] },
        mark: { type: "bar", color: "#fef3c7", opacity: 0.32 },
        encoding: {
          x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT },
          y: { datum: 2200 }
        }
      },

      // Reference line
      {
        mark: { type: "rule", strokeDash: [4, 4], color: "#0891b2", strokeWidth: 1.5, opacity: 0.5 },
        encoding: { y: { datum: 1070 } }
      },

      // Line + points
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

      // Value labels (950 and 2070)
      {
        transform: [{ filter: "datum.typical_annual_bill_gbp === 950 || datum.typical_annual_bill_gbp === 2070" }],
        mark: { type: "text", dy: -16, fontSize: 12, fontWeight: "bold", color: "#0f172a" },
        encoding: {
          x: { field: "period_label", type: "ordinal", sort: QUARTER_SORT },
          y: { field: "typical_annual_bill_gbp", type: "quantitative" },
          text: { field: "typical_annual_bill_gbp", type: "quantitative", format: ",.0f" }
        }
      },

      // +118% label
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
  // 4) Weekly fuel prices — FIX Infinity extent warnings (no start/end fields)
  // --------------------------------------
  const vis4 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",

    title: {
      text: "UK fuel prices: weekly volatility (2019–2024)",
      subtitle: "Raw weekly data (faint) with 5-week moving average (bold) | Peak prices during the 2022 energy shock",
      anchor: "start",
      offset: 14
    },

    data: { url: "data/vis4_fuel_weekly.json" },
    width: "container",
    height: 360,

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
      // Crisis shading (ROBUST: datum-based temporal bounds)
      {
        mark: { type: "rect", color: "#fee2e2", opacity: 0.28 },
        encoding: {
          x: { datum: "2022-03-01", type: "temporal" },
          x2: { datum: "2022-08-01", type: "temporal" }
        }
      },

      // Raw weekly (faint)
      {
        mark: { type: "line", strokeWidth: 1.5, opacity: 0.22 },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date", axis: { format: "%Y", tickCount: 7 } },
          y: { field: "ppl", type: "quantitative", title: "Pence per litre" },
          color: { field: "fuel", type: "nominal", scale: { range: ["#2563eb", "#f59e0b"] }, legend: null }
        }
      },

      // Smoothed (5-week MA)
      {
        transform: [
          {
            window: [{ op: "mean", field: "ppl", as: "ppl_ma" }],
            frame: [-2, 2],
            sort: [{ field: "d", order: "ascending" }],
            groupby: ["fuel"]
          }
        ],
        mark: { type: "line", strokeWidth: 3.2 },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date" },
          y: { field: "ppl_ma", type: "quantitative", title: "Pence per litre" },
          color: {
            field: "fuel",
            type: "nominal",
            scale: { range: ["#2563eb", "#f59e0b"] },
            legend: { title: "Fuel type", orient: "top", direction: "horizontal", title: null, padding: 10 }
          }
        }
      },

      // Tooltip points on MA
      {
        transform: [
          {
            window: [{ op: "mean", field: "ppl", as: "ppl_ma" }],
            frame: [-2, 2],
            sort: [{ field: "d", order: "ascending" }],
            groupby: ["fuel"]
          }
        ],
        mark: { type: "point", filled: true, size: 50, opacity: 0.8 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "ppl_ma", type: "quantitative" },
          color: { field: "fuel", type: "nominal", scale: { range: ["#2563eb", "#f59e0b"] }, legend: null },
          tooltip: [
            { field: "d", type: "temporal", title: "Week", format: "%b %Y" },
            { field: "fuel", type: "nominal", title: "Fuel type" },
            { field: "ppl", type: "quantitative", title: "Weekly", format: ".1f" },
            { field: "ppl_ma", type: "quantitative", title: "5-week avg", format: ".1f" }
          ]
        }
      }
    ],

    config: THEME
  };

  // --------------------------------------
  // 5) Rent vs house price — reduce height; keep professional styling
  // --------------------------------------
  const vis5 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",

    title: {
      text: "Housing costs: rent vs house price inflation",
      subtitle: "Annual rates with 5-month moving average (bold) | Private rents show persistent inflation",
      anchor: "start",
      offset: 14
    },

    data: { url: "data/vis5_rent_vs_house.json" },
    width: "container",
    height: 360,

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" }
    ],

    layer: [
      { mark: { type: "rule", strokeDash: [4, 4], color: "#94a3b8", opacity: 0.6 }, encoding: { y: { datum: 0 } } },

      // Raw monthly
      {
        mark: { type: "line", strokeWidth: 1.2, opacity: 0.18 },
        encoding: {
          x: { field: "d", type: "temporal", title: "Date", axis: { format: "%Y", tickCount: 7 } },
          y: { field: "v", type: "quantitative", title: "Annual inflation rate (%)", scale: { domain: [-2, 11] } },
          color: { field: "series", type: "nominal", scale: { range: ["#2563eb", "#f59e0b"] }, legend: null }
        }
      },

      // Smoothed lines
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

      // Tooltip points
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
  // 6) England regional map — centered, compact, consistent legend
  // --------------------------------------
  const vis6 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",

    title: {
      text: "Regional rent inflation across England",
      subtitle: "Latest year-on-year percentage change by English region | Darker colours indicate higher inflation",
      anchor: "start",
      offset: 14
    },

    width: "container",
    height: 360,
    padding: { top: 6, bottom: 44, left: 0, right: 0 },

    data: {
      url: UK_TOPO_URL,
      format: { type: "topojson", feature: "rgn" }
    },

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

    projection: { type: "mercator", center: [-2.6, 53.7], scale: 1900 },

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
          gradientLength: 320,
          gradientThickness: 14,
          titleFontSize: 12,
          labelFontSize: 11,
          titleColor: "#0f172a",
          labelColor: "#475569",
          format: ".1f"
        }
      },
      tooltip: [
        { field: "areanm", type: "nominal", title: "Region" },
        { field: "rent_yoy", type: "quantitative", title: "Inflation (% y/y)", format: ".1f" }
      ]
    },

    config: THEME
  };

  // --------------------------------------
  // 7) Interactive regional trend — reduce height
  // --------------------------------------
  const vis7 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",

    title: {
      text: "Regional rent inflation trends over time",
      subtitle: "Select a region to compare with England average",
      anchor: "start",
      offset: 14
    },

    data: { url: "data/vis7_rent_trend_regions.json" },
    width: "container",
    height: 340,

    params: [
      {
        name: "Region",
        value: "London",
        bind: {
          input: "select",
          name: "Select Region: ",
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
      {
        calculate:
          "datum.areanm === Region ? 'Selected region' : (datum.areanm === 'England' ? 'England' : 'Other')",
        as: "group"
      }
    ],

    mark: { type: "line" },

    encoding: {
      x: { field: "date", type: "temporal", title: "Date", axis: { format: "%Y", tickCount: 7 } },
      y: { field: "rent_inflation_yoy_pct", type: "quantitative", title: "Rent inflation (% y/y)" },
      detail: { field: "areanm", type: "nominal" },
      opacity: {
        condition: [{ test: "datum.group === 'Selected region' || datum.group === 'England'", value: 1 }],
        value: 0.15
      },
      size: {
        condition: [
          { test: "datum.group === 'Selected region'", value: 3.8 },
          { test: "datum.group === 'England'", value: 2.6 }
        ],
        value: 1.2
      },
      color: {
        condition: [
          { test: "datum.group === 'Selected region'", value: "#f59e0b" },
          { test: "datum.group === 'England'", value: "#2563eb" }
        ],
        value: "#cbd5e1"
      },
      tooltip: [
        { field: "date", type: "temporal", title: "Date", format: "%b %Y" },
        { field: "areanm", type: "nominal", title: "Area" },
        { field: "rent_inflation_yoy_pct", type: "quantitative", title: "Inflation (% y/y)", format: ".1f" }
      ]
    },

    config: THEME
  };

  // --------------------------------------
  // 8) UK nations map — centered, compact
  // --------------------------------------
  const vis8 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",

    title: {
      text: "Rent inflation across UK nations",
      subtitle: "Latest year-on-year percentage change | Darker blues indicate higher inflation",
      anchor: "start",
      offset: 14
    },

    width: "container",
    height: 380,
    padding: { top: 6, bottom: 44, left: 0, right: 0 },

    data: {
      url: UK_TOPO_URL,
      format: { type: "topojson", feature: "ctry" }
    },

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

    projection: { type: "mercator", center: [-4.3, 55.6], scale: 1020 },

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
          gradientLength: 320,
          gradientThickness: 14,
          titleFontSize: 12,
          labelFontSize: 11,
          titleColor: "#0f172a",
          labelColor: "#475569",
          format: ".1f"
        }
      },
      tooltip: [
        { field: "areanm", type: "nominal", title: "Nation" },
        { field: "rent_yoy", type: "quantitative", title: "Inflation (% y/y)", format: ".1f" }
      ]
    },

    config: THEME
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
