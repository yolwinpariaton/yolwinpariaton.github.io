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

  // 1) Prices vs pay (indexed) — clean version (no legend, no in-chart note, correct x-axis title)
  const vis1 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

    "title": {
      "text": "Prices vs pay (indexed to 2019 = 100)",
      "subtitle": "Shaded area shows the purchasing-power gap when consumer prices rise faster than real earnings."
    },

    "data": { "url": "data/vis1_prices_vs_pay.json" },
    "width": "container",
    "height": 360,

    "transform": [
      { "calculate": "toDate(datum.date)", "as": "d" },
      { "calculate": "toNumber(datum.value)", "as": "v" },
      { "pivot": "series", "value": "v", "groupby": ["d"] },
      { "calculate": "datum['CPIH (prices)']", "as": "prices" },
      { "calculate": "datum['Real earnings']", "as": "earnings" },
      { "calculate": "datum.prices - datum.earnings", "as": "gap" }
    ],

    "layer": [
      // Baseline at 100
      {
        "mark": { "type": "rule" },
        "encoding": {
          "y": { "datum": 100 },
          "color": { "value": "#666" },
          "opacity": { "value": 0.35 }
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
            "axis": { "tickCount": 7, "grid": true }
          },
          "y2": { "field": "prices" }
        }
      },

      // Prices line (tooltip carried here; no legend)
      {
        "mark": { "type": "line", "strokeWidth": 2.8, "point": { "filled": true, "size": 45 } },
        "encoding": {
          "x": { "field": "d", "type": "temporal", "title": "Date" },
          "y": { "field": "prices", "type": "quantitative" },
          "color": { "value": "#1f77b4" },
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
        "mark": { "type": "line", "strokeWidth": 2.8, "point": { "filled": true, "size": 45 } },
        "encoding": {
          "x": { "field": "d", "type": "temporal", "title": "Date" },
          "y": { "field": "earnings", "type": "quantitative" },
          "color": { "value": "#ff7f0e" }
        }
      }
    ],

    "config": {
      "legend": { "disable": true },
      "axis": { "labelFontSize": 12, "titleFontSize": 12 },
      "title": { "fontSize": 17, "subtitleFontSize": 12 },
      "view": { "stroke": null }
    }
  };

  // 2) Food vs headline — polished (hover rule + hover points + end labels + cleaner axes)
  const vis2 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

    "title": {
      "text": "Food inflation vs headline inflation",
      "subtitle": "UK annual rate (y/y). Hover to compare months precisely."
    },

    "data": { "url": "data/vis2_food_vs_headline.json" },

    "width": "container",
    "height": 360,

    "transform": [
      { "calculate": "toDate(datum.date)", "as": "d" },
      { "calculate": "toNumber(datum.value)", "as": "v" }
    ],

    "params": [
      {
        "name": "hover",
        "select": {
          "type": "point",
          "fields": ["d"],
          "nearest": true,
          "on": "mousemove",
          "clear": "mouseout"
        }
      }
    ],

    "encoding": {
      "x": {
        "field": "d",
        "type": "temporal",
        "title": "Date",
        "axis": {
          "format": "%b %Y",
          "labelAngle": 0,
          "tickCount": 8,
          "grid": false
        }
      }
    },

    "layer": [
      // Zero baseline
      {
        "mark": { "type": "rule" },
        "encoding": {
          "y": { "datum": 0 },
          "color": { "value": "#666" },
          "opacity": { "value": 0.25 }
        }
      },

      // Main lines
      {
        "mark": { "type": "line", "strokeWidth": 3 },
        "encoding": {
          "y": {
            "field": "v",
            "type": "quantitative",
            "title": "Annual inflation rate (%)",
            "axis": { "tickCount": 7, "grid": true },
            "scale": { "nice": true }
          },
          "color": {
            "field": "series",
            "type": "nominal",
            "title": "",
            "legend": {
              "orient": "top",
              "direction": "horizontal",
              "symbolSize": 140,
              "labelFontSize": 12
            }
          },
          "opacity": {
            "condition": { "param": "hover", "value": 1 },
            "value": 0.85
          },
          "tooltip": [
            { "field": "d", "type": "temporal", "title": "Month", "format": "%B %Y" },
            { "field": "series", "type": "nominal", "title": "Series" },
            { "field": "v", "type": "quantitative", "title": "Rate (y/y)", "format": ".1f" }
          ]
        }
      },

      // Hover points (only show on hover)
      {
        "transform": [{ "filter": { "param": "hover" } }],
        "mark": { "type": "point", "filled": true, "size": 85 },
        "encoding": {
          "y": { "field": "v", "type": "quantitative" },
          "color": { "field": "series", "type": "nominal", "legend": null }
        }
      },

      // Vertical hover rule
      {
        "transform": [{ "filter": { "param": "hover" } }],
        "mark": { "type": "rule", "color": "#444", "opacity": 0.25 },
        "encoding": { "x": { "field": "d", "type": "temporal" } }
      },

      // End-of-line labels (latest value per series)
      {
        "transform": [
          {
            "window": [{ "op": "rank", "as": "r" }],
            "sort": [{ "field": "d", "order": "descending" }],
            "groupby": ["series"]
          },
          { "filter": "datum.r === 1" }
        ],
        "mark": { "type": "text", "align": "left", "dx": 8, "fontSize": 12 },
        "encoding": {
          "x": { "field": "d", "type": "temporal" },
          "y": { "field": "v", "type": "quantitative" },
          "text": { "field": "series" },
          "color": { "field": "series", "type": "nominal", "legend": null }
        }
      }
    ],

    "config": {
      "view": { "stroke": null },
      "axis": {
        "labelFontSize": 12,
        "titleFontSize": 12,
        "gridColor": "#e6e6e6",
        "domainColor": "#999",
        "tickColor": "#999"
      },
      "title": { "fontSize": 17, "subtitleFontSize": 12, "subtitleColor": "#555" }
    }
  };

  // 3) Energy cap (step line)
  const vis3 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Energy price cap (typical annual bill)" },
    "data": { "url": "data/vis3_energy_cap.json" },
    "width": "container",
    "height": 280,
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
    "height": 320,
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
    "height": 320,
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

  safeEmbed("#vis1", vis1);
  safeEmbed("#vis2", vis2);
  safeEmbed("#vis3", vis3);
  safeEmbed("#vis4", vis4);
  safeEmbed("#vis5", vis5);
  safeEmbed("#vis6", vis6);
  safeEmbed("#vis7", vis7);
  safeEmbed("#vis8", vis8);
})();
