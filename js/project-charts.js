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

  const UK_TOPO_URL =
    "https://raw.githubusercontent.com/ONSdigital/uk-topojson/refs/heads/main/output/topo.json";

  function safeEmbed(selector, spec) {
    const el = document.querySelector(selector);
    if (!el) return;

    vegaEmbed(selector, spec, opts).catch((err) => {
      console.error("Vega embed error for", selector, err);
      el.innerHTML =
        "<p>Chart failed to load. Check console and JSON paths.</p>";
    });
  }

  // Shared styling to keep charts consistent and avoid clipping.
  const baseConfig = {
    autosize: { type: "fit", contains: "padding" },
    config: {
      view: { stroke: null },
      axis: {
        labelFontSize: 12,
        titleFontSize: 12,
        grid: true,
        gridOpacity: 0.35
      },
      title: {
        anchor: "middle",
        fontSize: 22,
        subtitleFontSize: 13
      },
      legend: {
        orient: "top",
        direction: "horizontal",
        title: null,
        anchor: "middle",
        labelFontSize: 14,
        symbolType: "stroke",
        symbolStrokeWidth: 4
      }
    }
  };

  // 1) Prices vs pay (indexed) — legend centered under subtitle; no source/note inside chart
  const vis1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: {
      text: "Prices vs pay (indexed to 2019 = 100)",
      subtitle:
        "Shaded area shows the purchasing-power gap when consumer prices rise faster than real earnings."
    },
    data: { url: "data/vis1_prices_vs_pay.json" },
    width: "container",
    height: 360,
    padding: { left: 56, right: 18, top: 10, bottom: 46 },

    transform: [
      { calculate: "toDate(datum.date)", as: "d" },
      { calculate: "toNumber(datum.value)", as: "v" },
      { pivot: "series", value: "v", groupby: ["d"] },

      { calculate: "datum['CPIH (prices)']", as: "prices" },
      { calculate: "datum['Real earnings']", as: "earnings" },

      { fold: ["prices", "earnings"], as: ["series_key", "series_value"] },
      {
        calculate:
          "datum.series_key === 'prices' ? 'CPIH (prices)' : 'Real earnings'",
        as: "series_label"
      }
    ],

    layer: [
      // Baseline at 100 (dotted + softer colour)
      {
        mark: { type: "rule", strokeDash: [5, 5], strokeWidth: 1.6 },
        encoding: {
          y: { datum: 100 },
          color: { value: "#7a869a" }
        }
      },

      // Gap shading (between earnings and prices)
      {
        transform: [
          {
            aggregate: [
              { op: "max", field: "prices", as: "prices" },
              { op: "max", field: "earnings", as: "earnings" }
            ],
            groupby: ["d"]
          }
        ],
        mark: { type: "area", opacity: 0.14 },
        encoding: {
          x: {
            field: "d",
            type: "temporal",
            title: "Date",
            axis: { format: "%Y", tickCount: 7 }
          },
          y: {
            field: "earnings",
            type: "quantitative",
            title: "Index (2019 = 100)",
            scale: { zero: false, domain: [98, 114] }
          },
          y2: { field: "prices" },
          color: { value: "#4c78a8" }
        }
      },

      // Series lines
      {
        mark: {
          type: "line",
          strokeWidth: 3,
          opacity: 0.92,
          point: { filled: true, size: 42 }
        },
        encoding: {
          x: {
            field: "d",
            type: "temporal",
            title: "Date",
            axis: { format: "%Y", tickCount: 7 }
          },
          y: {
            field: "series_value",
            type: "quantitative",
            title: "Index (2019 = 100)",
            scale: { zero: false, domain: [98, 114] }
          },
          color: {
            field: "series_label",
            type: "nominal",
            scale: {
              domain: ["CPIH (prices)", "Real earnings"],
              range: ["#4c78a8", "#f58518"]
            },
            legend: {
              orient: "top",
              direction: "horizontal",
              anchor: "middle",
              title: null
            }
          },
          tooltip: [
            { field: "d", type: "temporal", title: "Date" },
            { field: "series_label", type: "nominal", title: "Series" },
            {
              field: "series_value",
              type: "quantitative",
              title: "Index",
              format: ".1f"
            }
          ]
        }
      }
    ],

    ...baseConfig
  };

  // 2) Food vs headline
  const vis2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Food inflation vs headline (annual rate)" },
    data: { url: "data/vis2_food_vs_headline.json" },
    width: "container",
    height: 320,
    padding: { left: 56, right: 18, top: 10, bottom: 42 },
    mark: {
      type: "line",
      strokeWidth: 3,
      opacity: 0.92,
      point: { filled: true, size: 40 }
    },
    encoding: {
      x: { field: "date", type: "temporal", title: "Date", axis: { format: "%Y", tickCount: 7 } },
      y: { field: "value", type: "quantitative", title: "Percent" },
      color: {
        field: "series",
        type: "nominal",
        legend: { orient: "top", direction: "horizontal", anchor: "middle", title: null }
      },
      tooltip: [
        { field: "date", type: "temporal", title: "Date" },
        { field: "series", type: "nominal", title: "Series" },
        { field: "value", type: "quantitative", title: "Percent", format: ".1f" }
      ]
    },
    ...baseConfig
  };

  // 3) Energy cap (step line)
  const vis3 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Energy price cap (typical annual bill)" },
    data: { url: "data/vis3_energy_cap.json" },
    width: "container",
    height: 280,
    padding: { left: 62, right: 18, top: 12, bottom: 42 },
    mark: {
      type: "line",
      interpolate: "step-after",
      strokeWidth: 3,
      opacity: 0.92,
      point: { filled: true, size: 45 }
    },
    encoding: {
      x: { field: "period_date", type: "temporal", title: "Cap period" },
      y: { field: "typical_annual_bill_gbp", type: "quantitative", title: "GBP" },
      tooltip: [
        { field: "period_label", type: "nominal", title: "Period" },
        { field: "typical_annual_bill_gbp", type: "quantitative", title: "GBP", format: ",.0f" }
      ]
    },
    ...baseConfig
  };

  // 4) Fuel weekly (two-series)
  const vis4 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Weekly fuel prices (pence per litre)" },
    data: { url: "data/vis4_fuel_weekly.json" },
    width: "container",
    height: 320,
    padding: { left: 62, right: 18, top: 10, bottom: 42 },
    transform: [{ fold: ["unleaded_ppl", "diesel_ppl"], as: ["fuel", "ppl"] }],
    mark: { type: "line", strokeWidth: 3, opacity: 0.92 },
    encoding: {
      x: { field: "date", type: "temporal", title: "Date", axis: { format: "%Y", tickCount: 7 } },
      y: { field: "ppl", type: "quantitative", title: "Pence per litre" },
      color: {
        field: "fuel",
        type: "nominal",
        legend: { orient: "top", direction: "horizontal", anchor: "middle", title: null }
      },
      tooltip: [
        { field: "date", type: "temporal", title: "Date" },
        { field: "fuel", type: "nominal", title: "Fuel" },
        { field: "ppl", type: "quantitative", title: "ppl", format: ".1f" }
      ]
    },
    ...baseConfig
  };

  // 5) Rent vs house inflation
  const vis5 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Rent vs house price inflation (annual rate)" },
    data: { url: "data/vis5_rent_vs_house.json" },
    width: "container",
    height: 320,
    padding: { left: 56, right: 18, top: 10, bottom: 42 },
    mark: { type: "line", strokeWidth: 3, opacity: 0.92, point: { filled: true, size: 36 } },
    encoding: {
      x: { field: "date", type: "temporal", title: "Date", axis: { format: "%Y", tickCount: 7 } },
      y: { field: "value", type: "quantitative", title: "Percent" },
      color: {
        field: "series",
        type: "nominal",
        legend: { orient: "top", direction: "horizontal", anchor: "middle", title: null }
      },
      tooltip: [
        { field: "date", type: "temporal", title: "Date" },
        { field: "series", type: "nominal", title: "Series" },
        { field: "value", type: "quantitative", title: "Percent", format: ".1f" }
      ]
    },
    ...baseConfig
  };

  // 6) Map: rent inflation by region (choropleth)
  const vis6 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Rent inflation across regions (latest)" },
    width: "container",
    height: 420,
    padding: { left: 10, right: 10, top: 12, bottom: 12 },
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
      }
    ],
    projection: { type: "mercator" },
    mark: { type: "geoshape", stroke: "white", strokeWidth: 0.6 },
    encoding: {
      color: {
        field: "rent_inflation_yoy_pct",
        type: "quantitative",
        title: "% y/y",
        legend: { orient: "bottom" }
      },
      tooltip: [
        { field: "areanm", type: "nominal", title: "Area" },
        { field: "rent_inflation_yoy_pct", type: "quantitative", title: "% y/y", format: ".1f" }
      ]
    },
    ...baseConfig
  };

  // 7) Interactive trend: dropdown select region (compare to England)
  const vis7 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Rent inflation over time (select a region)" },
    data: { url: "data/vis7_rent_trend_regions.json" },
    width: "container",
    height: 320,
    padding: { left: 56, right: 18, top: 12, bottom: 42 },
    params: [
      {
        name: "Region",
        value: "London",
        bind: {
          input: "select",
          name: "Region: ",
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
    mark: { type: "line", strokeWidth: 2.6, opacity: 0.9 },
    encoding: {
      x: { field: "date", type: "temporal", title: "Date", axis: { format: "%Y", tickCount: 7 } },
      y: { field: "rent_inflation_yoy_pct", type: "quantitative", title: "% y/y" },
      detail: { field: "areanm", type: "nominal" },
      opacity: {
        condition: [{ test: "datum.group === 'Selected region' || datum.group === 'England'", value: 1 }],
        value: 0.15
      },
      size: {
        condition: [
          { test: "datum.group === 'Selected region'", value: 3 },
          { test: "datum.group === 'England'", value: 2 }
        ],
        value: 1
      },
      tooltip: [
        { field: "date", type: "temporal", title: "Date" },
        { field: "areanm", type: "nominal", title: "Area" },
        { field: "rent_inflation_yoy_pct", type: "quantitative", title: "% y/y", format: ".1f" }
      ]
    },
    ...baseConfig
  };

  // 8) Map: UK countries rent inflation
  const vis8 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: { text: "Rent inflation across UK countries (latest available)" },
    width: "container",
    height: 420,
    padding: { left: 10, right: 10, top: 12, bottom: 12 },
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
      }
    ],
    projection: { type: "mercator" },
    mark: { type: "geoshape", stroke: "white", strokeWidth: 0.8 },
    encoding: {
      color: {
        field: "rent_inflation_yoy_pct",
        type: "quantitative",
        title: "% y/y",
        legend: { orient: "bottom" }
      },
      tooltip: [
        { field: "areanm", type: "nominal", title: "Country" },
        { field: "rent_inflation_yoy_pct", type: "quantitative", title: "% y/y", format: ".1f" }
      ]
    },
    ...baseConfig
  };

  safeEmbed("#vis1", vis1);
  safeEmbed("#vis2", vis2);
  safeEmbed("#vis3", vis3);
  safeEmbed("#vis4", vis4);
  safeEmbed("#vis5", vis5);
  safeEmbed("#vis6", vis6);
  safeEmbed("#vis7", vis7);
  safeEmbed("#vis8", vis8);
})();
