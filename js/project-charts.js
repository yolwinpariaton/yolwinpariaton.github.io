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

    const msg =
      (err && err.message) ? err.message :
      (typeof err === "string" ? err : JSON.stringify(err));

    el.innerHTML =
      "<p><strong>Chart failed to load.</strong></p>" +
      "<p style='font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap;'>" +
      msg +
      "</p>";
  });
}


  // 1) Prices vs pay (indexed) — improved + gap shading + robust field names
  const vis1 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": {
      "text": "Prices vs pay (indexed to 2019=100)",
      "subtitle": "Shaded area shows the gap (prices − pay). Hover to inspect monthly values."
    },
    "data": { "url": "data/vis1_prices_vs_pay.json" },
    "width": "container",
    "height": 340,

    "transform": [
      { "calculate": "toDate(datum.date)", "as": "d" },
      { "calculate": "toNumber(datum.value)", "as": "v" },

      // Pivot to wide format by date
      { "pivot": "series", "value": "v", "groupby": ["d"] },

      // Rename to safe field names (avoids issues with parentheses/spaces in encodings)
      { "calculate": "datum['CPIH (prices)']", "as": "prices" },
      { "calculate": "datum['Real earnings']", "as": "earnings" },
      { "calculate": "datum.prices - datum.earnings", "as": "gap" }
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

    "layer": [
      // Baseline at 100
      {
        "mark": { "type": "rule" },
        "encoding": {
          "y": { "datum": 100 },
          "color": { "value": "#777" },
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
            "title": "",
            "axis": { "format": "%Y", "tickCount": 7, "labelPadding": 8 }
          },
          "y": {
            "field": "earnings",
            "type": "quantitative",
            "title": "Index (2019=100)",
            "scale": { "zero": false, "domain": [98, 114] },
            "axis": { "tickCount": 7, "grid": true }
          },
          "y2": { "field": "prices" }
        }
      },

      // Prices line
      {
        "mark": { "type": "line", "strokeWidth": 2.8 },
        "encoding": {
          "x": { "field": "d", "type": "temporal" },
          "y": { "field": "prices", "type": "quantitative" },
          "color": { "value": "#1f77b4" }
        }
      },

      // Earnings line
      {
        "mark": { "type": "line", "strokeWidth": 2.8 },
        "encoding": {
          "x": { "field": "d", "type": "temporal" },
          "y": { "field": "earnings", "type": "quantitative" },
          "color": { "value": "#ff7f0e" }
        }
      },

      // Hover crosshair
      {
        "transform": [{ "filter": { "param": "hover" } }],
        "mark": { "type": "rule", "opacity": 0.35 },
        "encoding": { "x": { "field": "d", "type": "temporal" } }
      },

      // Hover points (prices)
      {
        "transform": [{ "filter": { "param": "hover" } }],
        "mark": { "type": "point", "filled": true, "size": 90 },
        "encoding": {
          "x": { "field": "d", "type": "temporal" },
          "y": { "field": "prices", "type": "quantitative" },
          "color": { "value": "#1f77b4" }
        }
      },

      // Hover points (earnings)
      {
        "transform": [{ "filter": { "param": "hover" } }],
        "mark": { "type": "point", "filled": true, "size": 90 },
        "encoding": {
          "x": { "field": "d", "type": "temporal" },
          "y": { "field": "earnings", "type": "quantitative" },
          "color": { "value": "#ff7f0e" }
        }
      },

      // Tooltip (single date)
      {
        "transform": [{ "filter": { "param": "hover" } }],
        "mark": { "type": "point", "opacity": 0 },
        "encoding": {
          "x": { "field": "d", "type": "temporal" },
          "tooltip": [
            { "field": "d", "type": "temporal", "title": "Date" },
            { "field": "prices", "type": "quantitative", "title": "Prices (index)", "format": ".1f" },
            { "field": "earnings", "type": "quantitative", "title": "Real earnings (index)", "format": ".1f" },
            { "field": "gap", "type": "quantitative", "title": "Gap (prices − pay)", "format": ".1f" }
          ]
        }
      }
    ],

    "config": {
      "axis": { "labelFontSize": 12, "titleFontSize": 12 },
      "title": { "fontSize": 16, "subtitleFontSize": 12 },
      "view": { "stroke": null }
    }
  };

  // 2) Food vs headline
  const vis2 = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "title": { "text": "Food inflation vs headline (annual rate)" },
    "data": { "url": "data/vis2_food_vs_headline.json" },
    "width": "container",
    "height": 320,
    "mark": { "type": "line", "point": true },
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
        {
          "field": "typical_annual_bill_gbp",
          "type": "quantitative",
          "title": "GBP",
          "format": ",.0f"
        }
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
        {
          "field": "rent_inflation_yoy_pct",
          "type": "quantitative",
          "title": "% y/y",
          "format": ".1f"
        }
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
        {
          "field": "rent_inflation_yoy_pct",
          "type": "quantitative",
          "title": "% y/y",
          "format": ".1f"
        }
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
        {
          "field": "rent_inflation_yoy_pct",
          "type": "quantitative",
          "title": "% y/y",
          "format": ".1f"
        }
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
