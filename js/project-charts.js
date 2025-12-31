/* js/project-charts.js
   Renders Vega-Lite charts into #vis1 ... #vis8.
   - vis1–vis3 are defined inline (stable styling + sizing)
   - vis4–vis8 embed existing JSON specs from /data unchanged
*/

(function () {
  // ---------- helpers ----------
  function showError(elId, err) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML =
      '<div style="padding:16px;font-size:18px;">Chart failed to load. Check console and JSON paths.</div>';
    // Log full error for debugging
    // eslint-disable-next-line no-console
    console.error(`Error rendering ${elId}:`, err);
  }

  async function embedSpec(elId, spec) {
    try {
      const el = document.getElementById(elId);
      if (!el) return;

      await vegaEmbed(`#${elId}`, spec, {
        actions: false,
        renderer: "svg" // crisp text and avoids some canvas sizing quirks
      });
    } catch (err) {
      showError(elId, err);
    }
  }

  async function embedFromFile(elId, jsonPath) {
    try {
      const res = await fetch(jsonPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch ${jsonPath}: ${res.status}`);
      const spec = await res.json();
      await embedSpec(elId, spec);
    } catch (err) {
      showError(elId, err);
    }
  }

  // ---------- shared style ----------
  const BASE_CONFIG = {
    view: { stroke: null },
    background: "transparent",
    axis: {
      labelFontSize: 12,
      titleFontSize: 12,
      gridColor: "#e6e6e6",
      tickColor: "#999",
      domainColor: "#777"
    },
    title: {
      fontSize: 18,
      subtitleFontSize: 12,
      anchor: "middle",
      subtitleColor: "#333"
    },
    legend: {
      title: null,
      orient: "top",
      direction: "horizontal",
      labelFontSize: 12,
      symbolType: "stroke",
      symbolStrokeWidth: 5,
      symbolSize: 140
    }
  };

  // ============================================================
  // VIS 1 — Prices vs pay (indexed)
  // ============================================================
  const vis1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: {
      text: "Prices vs pay (indexed to 2019 = 100)",
      subtitle:
        "Shaded area shows the purchasing-power gap when consumer prices rise faster than real earnings."
    },
    data: { url: "data/vis1_prices_vs_pay.csv" }, // uses your CSV (more robust than guessing spec internals)
    width: "container",
    height: 300,

    // Robust field mapping (works if your CSV column names differ slightly)
    transform: [
      {
        calculate:
          "toDate(datum.date ? datum.date : (datum.Date ? datum.Date : (datum.month ? datum.month : (datum.period ? datum.period : datum.time))))",
        as: "d"
      },
      {
        calculate:
          "toNumber(datum.cpih ? datum.cpih : (datum.CPIH ? datum.CPIH : (datum.prices ? datum.prices : (datum.price_index ? datum.price_index : datum.price))))",
        as: "cpih"
      },
      {
        calculate:
          "toNumber(datum.real_earnings ? datum.real_earnings : (datum.earnings ? datum.earnings : (datum.pay ? datum.pay : (datum.real_pay ? datum.real_pay : datum.awe_real_pay))))",
        as: "earn"
      },
      { filter: "isValid(datum.d) && isFinite(datum.cpih) && isFinite(datum.earn)" }
    ],

    layer: [
      // Shaded gap (only when CPIH > earnings)
      {
        transform: [{ filter: "datum.cpih > datum.earn" }],
        mark: { type: "area", opacity: 0.18 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "earn", type: "quantitative" },
          y2: { field: "cpih" }
        }
      },

      // CPIH line
      {
        mark: { type: "line", strokeWidth: 3, opacity: 0.95 },
        encoding: {
          x: {
            field: "d",
            type: "temporal",
            title: "Date",
            axis: { format: "%Y", tickCount: 7, labelAngle: 0 }
          },
          y: {
            field: "cpih",
            type: "quantitative",
            title: "Index (2019 = 100)",
            scale: { domain: [98, 114] }
          },
          color: { value: "#4c72b0" }
        }
      },
      {
        mark: { type: "point", filled: true, size: 55, opacity: 0.9 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "cpih", type: "quantitative" },
          color: { value: "#4c72b0" },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%b %Y" },
            { field: "cpih", type: "quantitative", title: "CPIH (prices)", format: ".1f" }
          ]
        }
      },

      // Earnings line
      {
        mark: { type: "line", strokeWidth: 3, opacity: 0.95 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "earn", type: "quantitative" },
          color: { value: "#dd8452" }
        }
      },
      {
        mark: { type: "point", filled: true, size: 55, opacity: 0.9 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "earn", type: "quantitative" },
          color: { value: "#dd8452" },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%b %Y" },
            { field: "earn", type: "quantitative", title: "Real earnings", format: ".1f" }
          ]
        }
      },

      // Reference line at 100 (dotted)
      {
        mark: { type: "rule", strokeDash: [6, 6], strokeWidth: 2, opacity: 0.9, color: "#6b7280" },
        encoding: { y: { datum: 100 } }
      },

      // Centered “legend” row under subtitle (as marks, not Vega legend)
      {
        data: { values: [{ x: 0 }, { x: 1 }] },
        mark: { type: "text", fontSize: 13, fontWeight: 600 },
        encoding: {
          x: {
            field: "x",
            type: "quantitative",
            axis: null,
            scale: { domain: [0, 1], range: [260, 700] }
          },
          y: { datum: -8 },
          text: {
            field: "x",
            type: "nominal",
            format: ""
          },
          color: {
            condition: [
              { test: "datum.x == 0", value: "#4c72b0" },
              { test: "datum.x == 1", value: "#dd8452" }
            ],
            value: "#111"
          }
        }
      }
    ],

    config: BASE_CONFIG
  };

  // ============================================================
  // VIS 2 — Food inflation vs headline (nicer: raw + smoothed)
  // ============================================================
  const vis2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    title: {
      text: "Food inflation vs headline (annual rate)",
      subtitle: "Thin lines show monthly volatility; thick lines show a 6-month moving average."
    },
    data: { url: "data/vis2_food_vs_headline.csv" },
    width: "container",
    height: 300,

    transform: [
      {
        calculate:
          "toDate(datum.date ? datum.date : (datum.Date ? datum.Date : (datum.month ? datum.month : (datum.period ? datum.period : datum.time))))",
        as: "d"
      },
      {
        calculate:
          "toNumber(datum.food ? datum.food : (datum.food_cpi ? datum.food_cpi : (datum.food_inflation ? datum.food_inflation : datum.Food)))",
        as: "food"
      },
      {
        calculate:
          "toNumber(datum.headline ? datum.headline : (datum.cpih ? datum.cpih : (datum.headline_cpih ? datum.headline_cpih : datum.Headline)))",
        as: "head"
      },
      { filter: "isValid(datum.d) && isFinite(datum.food) && isFinite(datum.head)" }
    ],

    layer: [
      // Raw monthly (thin)
      {
        mark: { type: "line", strokeWidth: 2, opacity: 0.25 },
        encoding: {
          x: {
            field: "d",
            type: "temporal",
            title: "Date",
            axis: { format: "%Y", tickCount: 7, labelAngle: 0 }
          },
          y: { field: "food", type: "quantitative", title: "Percent" },
          color: { value: "#4c72b0" }
        }
      },
      {
        mark: { type: "line", strokeWidth: 2, opacity: 0.25 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "head", type: "quantitative" },
          color: { value: "#dd8452" }
        }
      },

      // Smoothed (thick) – moving average via window
      {
        transform: [
          {
            window: [{ op: "mean", field: "food", as: "food_ma" }],
            frame: [-5, 0],
            sort: [{ field: "d" }]
          }
        ],
        mark: { type: "line", strokeWidth: 4, opacity: 0.95 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "food_ma", type: "quantitative" },
          color: { value: "#4c72b0" },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%b %Y" },
            { field: "food", type: "quantitative", title: "Food (monthly)", format: ".1f" },
            { field: "food_ma", type: "quantitative", title: "Food (6m avg)", format: ".1f" }
          ]
        }
      },
      {
        transform: [
          {
            window: [{ op: "mean", field: "head", as: "head_ma" }],
            frame: [-5, 0],
            sort: [{ field: "d" }]
          }
        ],
        mark: { type: "line", strokeWidth: 4, opacity: 0.95 },
        encoding: {
          x: { field: "d", type: "temporal" },
          y: { field: "head_ma", type: "quantitative" },
          color: { value: "#dd8452" },
          tooltip: [
            { field: "d", type: "temporal", title: "Date", format: "%b %Y" },
            { field: "head", type: "quantitative", title: "Headline (monthly)", format: ".1f" },
            { field: "head_ma", type: "quantitative", title: "Headline (6m avg)", format: ".1f" }
          ]
        }
      },

      // Zero line (dotted)
      {
        mark: { type: "rule", strokeDash: [6, 6], strokeWidth: 2, opacity: 0.9, color: "#6b7280" },
        encoding: { y: { datum: 0 } }
      }
    ],

    // Use Vega legend (kept simple) + consistent config
    encoding: {
      color: {
        legend: { orient: "top", direction: "horizontal" }
      }
    },

    config: BASE_CONFIG
  };

  // ============================================================
  // VIS 3 — Energy price cap (step chart) — FIXED (no ??)
  // ============================================================
  const vis3 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Energy price cap (typical annual bill)" },
    "data": { "url": "data/vis3_energy_cap.json" },
    "width": "container",
    "height": 300,

    "transform": [
      {
        "calculate":
          "toDate(datum.period_date ? datum.period_date : (datum.date ? datum.date : (datum.period ? datum.period : (datum.cap_period ? datum.cap_period : datum.time))))",
        "as": "d"
      },
      {
        "calculate":
          "toNumber(datum.typical_annual_bill_gbp ? datum.typical_annual_bill_gbp : (datum.bill ? datum.bill : (datum.value ? datum.value : (datum.gbp ? datum.gbp : (datum.GBP ? datum.GBP : (datum.annual_bill ? datum.annual_bill : datum.typical_annual_bill))))))",
        "as": "bill"
      },
      {
        "calculate":
          "(datum.period_label ? datum.period_label : (datum.label ? datum.label : (datum.period ? datum.period : timeFormat(datum.d, '%b %Y'))))",
        "as": "lbl"
      },
      { "filter": "isValid(datum.d) && isFinite(datum.bill)" }
    ],

    "layer": [
      {
        "mark": { "type": "line", "interpolate": "step-after", "strokeWidth": 3, "opacity": 0.95 },
        "encoding": {
          "x": {
            "field": "d",
            "type": "temporal",
            "title": "Cap period",
            "axis": { "format": "%b %Y", "labelAngle": -25, "labelFlush": true, "tickCount": 10 }
          },
          "y": {
            "field": "bill",
            "type": "quantitative",
            "title": "GBP",
            "axis": { "format": "£,.0f" },
            "scale": { "zero": false }
          },
          "tooltip": [
            { "field": "lbl", "type": "nominal", "title": "Period" },
            { "field": "bill", "type": "quantitative", "title": "GBP", "format": "£,.0f" }
          ]
        }
      },
      {
        "mark": { "type": "point", "filled": true, "size": 60, "opacity": 0.95 },
        "encoding": {
          "x": { "field": "d", "type": "temporal" },
          "y": { "field": "bill", "type": "quantitative" },
          "tooltip": [
            { "field": "lbl", "type": "nominal", "title": "Period" },
            { "field": "bill", "type": "quantitative", "title": "GBP", "format": "£,.0f" }
          ]
        }
      }
    ],

    "config": BASE_CONFIG
  };

  // ---------- render all ----------
  document.addEventListener("DOMContentLoaded", async () => {
    // Inline specs (stable styling)
    await embedSpec("vis1", vis1);
    await embedSpec("vis2", vis2);
    await embedSpec("vis3", vis3);

    // Existing JSON specs unchanged (do not touch the rest)
    await embedFromFile("vis4", "data/vis4_fuel_weekly.json");
    await embedFromFile("vis5", "data/vis5_rent_vs_house.json");
    await embedFromFile("vis6", "data/vis6_rent_map_regions.json");
    await embedFromFile("vis7", "data/vis7_rent_trend_regions.json");
    await embedFromFile("vis8", "data/vis8_rent_map_countries.json");
  });
})();
