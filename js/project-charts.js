/* js/project-charts.js
   Eight interactive Vega-Lite charts for the UK cost of living project.

   Expected JSON files in /data (records):
   - vis1_prices_vs_pay.json            fields: date, series, value
   - vis2_food_vs_headline.json         fields: date, series, value
   - vis3_energy_cap.json              fields: period_date, typical_annual_bill_gbp, period_label
   - vis4_fuel_weekly.json             fields: date, unleaded_ppl, diesel_ppl
   - vis5_rent_vs_house.json           fields: date, series, value
   - vis6_rent_map_regions.json        fields: areacd, areanm, rent_inflation_yoy_pct
   - vis7_rent_trend_regions.json      fields: date, areanm, rent_inflation_yoy_pct
   - vis8_rent_map_countries.json      fields: areacd, areanm, rent_inflation_yoy_pct
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

  // 1) Prices vs pay (indexed)
  const vis1 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

    "title": {
      "text": "Prices vs pay (indexed to 2019 = 100)",
      "subtitle":
        "Shaded area shows the purchasing-power gap when consumer prices rise faster than real earnings."
    },

    "data": { "url": "data/vis1_prices_vs_pay.json" },
    "width": "container",
    "height": 420,

    "transform": [
      { "calculate": "toDate(datum.date)", "as": "d" },
      { "calculate": "toNumber(datum.value)", "as": "v" },
      { "pivot": "series", "value": "v", "groupby": ["d"] },
      { "calculate": "datum['CPIH (prices)']", "as": "prices" },
      { "calculate": "datum['Real earnings']", "as": "earnings" },
      { "calculate": "datum.prices - datum.earnings", "as": "gap" }
    ],

    "layer": [
      // Baseline at 100 (dotted, lighter)
      {
        "mark": { "type": "rule", "strokeDash": [6, 5], "strokeWidth": 1.6 },
        "encoding": {
          "y": { "datum": 100 },
          "color": { "value": "#6b7280" },
          "opacity": { "value": 0.85 }
        }
      },

      // Gap shading (between earnings and prices)
      {
        "mark": { "type": "area", "opacity": 0.14 },
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
            "axis": { "tickCount": 7, "grid": true }
          },
          "y2": { "field": "prices" }
        }
      },

      // Prices line
      {
        "mark": {
          "type": "line",
          "strokeWidth": 3.0,
          "opacity": 0.9,
          "point": { "filled": true, "size": 45 }
        },
        "encoding": {
          "x": { "field": "d", "type": "temporal", "title": "Date" },
          "y": { "field": "prices", "type": "quantitative" },
          "color": { "value": "#4C78A8" },
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
        "mark": {
          "type": "line",
          "strokeWidth": 3.0,
          "opacity": 0.9,
          "point": { "filled": true, "size": 45 }
        },
        "encoding": {
          "x": { "field": "d", "type": "temporal", "title": "Date" },
          "y": { "field": "earnings", "type": "quantitative" },
          "color": { "value": "#F58518" }
        }
      }
    ],

    "config": {
      "axis": { "labelFontSize": 12, "titleFontSize": 12 },
      "title": { "fontSize": 18, "subtitleFontSize": 12 },
      "view": { "stroke": null }
    }
  };

  // 2) Food vs headline (IMPROVED: smoother + raw context + hover highlight + centered legend)
  const vis2 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

    "title": { "text": "Food inflation vs headline (annual rate)" },

    "data": { "url": "data/vis2_food_vs_headline.json" },
    "width": "container",
    "height": 420,

    "transform": [
      { "calculate": "toDate(datum.date)", "as": "d" },
      { "calculate": "toNumber(datum.value)", "as": "v" },

      // 5-month centred moving average to reduce jaggedness but keep turning points
      {
        "window": [{ "op": "mean", "field": "v", "as": "v_ma5" }],
        "frame": [-2, 2],
        "groupby": ["series"],
        "sort": [{ "field": "d", "order": "ascending" }]
      }
    ],

    "params": [
      {
        "name": "hover",
        "select": { "type": "point", "fields": ["series"], "on": "mouseover", "clear": "mouseout" }
      }
    ],

    "layer": [
      // Zero line (dotted)
      {
        "mark": { "type": "rule", "strokeDash": [6, 5], "strokeWidth": 1.4 },
        "encoding": {
          "y": { "datum": 0 },
          "color": { "value": "#6b7280" },
          "opacity": { "value": 0.6 }
        }
      },

      // Raw series (light, context)
      {
        "mark": { "type": "line", "strokeWidth": 1.5, "opacity": 0.25 },
        "encoding": {
          "x": {
            "field": "d",
            "type": "temporal",
            "title": "Date",
            "axis": { "format": "%Y", "tickCount": 7 }
          },
          "y": {
            "field": "v",
            "type": "quantitative",
            "title": "Percent (y/y)",
            "axis": { "grid": true, "tickCount": 7 }
          },
          "color": {
            "field": "series",
            "type": "nominal",
            "legend": null,
            "scale": {
              "domain": ["Food (CPI)", "Headline (CPIH)"],
              "range": ["#4C78A8", "#F58518"]
            }
          }
        }
      },

      // Smoothed series (main read)
      {
        "mark": {
          "type": "line",
          "strokeWidth": 3.2,
          "opacity": 0.92,
          "point": false
        },
        "encoding": {
          "x": {
            "field": "d",
            "type": "temporal",
            "title": "Date",
            "axis": { "format": "%Y", "tickCount": 7 }
          },
          "y": { "field": "v_ma5", "type": "quantitative", "title": "Percent (y/y)" },

          "color": {
            "field": "series",
            "type": "nominal",
            "title": null,
            "scale": {
              "domain": ["Food (CPI)", "Headline (CPIH)"],
              "range": ["#4C78A8", "#F58518"]
            },
            // Legend below title/subtitle, centered
            "legend": {
              "orient": "top",
              "direction": "horizontal",
              "title": null,
              "symbolType": "stroke",
              "symbolStrokeWidth": 6,
              "symbolSize": 400,
              "labelFontSize": 13,
              "offset": 6,
              "anchor": "middle"
            }
          },

          // Hover highlight
          "opacity": {
            "condition": { "param": "hover", "value": 1 },
            "value": 0.55
          },

          "tooltip": [
            { "field": "d", "type": "temporal", "title": "Date" },
            { "field": "series", "type": "nominal", "title": "Series" },
            { "field": "v", "type": "quantitative", "title": "Monthly (raw)", "format": ".1f" },
            { "field": "v_ma5", "type": "quantitative", "title": "5-month average", "format": ".1f" }
          ]
        }
      }
    ],

    "config": {
      "axis": { "labelFontSize": 12, "titleFontSize": 12 },
      "title": { "fontSize": 18, "subtitleFontSize": 12 },
      "legend": { "padding": 0 },
      "view": { "stroke": null }
    }
  };

  // 3) Energy cap (step line)
  const vis3 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Energy price cap (typical annual bill)" },
    "data": { "url": "data/vis3_energy_cap.json" },
    "width": "container",
    "height": 320,
    "mark": { "type": "line", "interpolate": "step-after", "point": true },
    "encoding": {
      "x": { "field": "period_date", "type": "temporal", "title": "Cap period" },
      "y": { "field": "typical_annual_bill_gbp", "type": "quantitative", "title": "GBP" },
      "tooltip": [
        { "field": "period_label", "type": "nominal", "title": "Period" },
        { "field": "typical_annual_bill_gbp", "type": "quantitative", "title": "GBP", "format": ",.0f" }
      ]
    }
  };

  // 4) Fuel weekly (two-series)
  const vis4 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Weekly fuel prices (pence per litre)" },
    "data": { "url": "data/vis4_fuel_weekly.json" },
    "width": "container",
    "height": 360,
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
    "height": 360,
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
    "height": 460,
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
    "height": 360,
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
    "height": 460,
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

  safeEmbed("#vis1", vis1);
  safeEmbed("#vis2", vis2);
  safeEmbed("#vis3", vis3);
  safeEmbed("#vis4", vis4);
  safeEmbed("#vis5", vis5);
  safeEmbed("#vis6", vis6);
  safeEmbed("#vis7", vis7);
  safeEmbed("#vis8", vis8);
})();
