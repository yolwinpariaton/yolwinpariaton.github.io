// =============================
// Vega Embed Helpers / Options
// =============================
const embedStandard = { actions: false, renderer: "svg", width: 400, height: 300 };
const embedTask3    = { actions: false, renderer: "svg", width: 380, height: 280 };
const embedLarge    = { actions: false, renderer: "svg", width: 900, height: 380 };

// -----------------------------
// Tasks 1–5
// -----------------------------
vegaEmbed("#vis1", "graphs/uk_unemployment_chart.json", embedStandard);
vegaEmbed("#vis2", "graphs/g7_inflation_chart.json", embedStandard);
vegaEmbed("#vis3", "graphs/nigeria_chart.json", embedStandard);
vegaEmbed("#vis4", "graphs/ethiopia_chart.json", embedStandard);

vegaEmbed("#vis5", "graphs/uk_renewable.json", embedTask3);
vegaEmbed("#vis6", "graphs/energy_prices.json", embedTask3);

vegaEmbed("#vis7", "graphs/financial_times.json", embedStandard);
vegaEmbed("#vis8", "graphs/financial_times2.json", embedLarge);

vegaEmbed("#vis_api", "graphs/api_chart.json", { actions: false, renderer: "svg", width: 450, height: 300 });
vegaEmbed("#vis_scrape", "graphs/emissions_tidy.json", { actions: false, renderer: "svg", width: 450, height: 300 });

// =============================
// Task 6: Dashboard
// =============================
const dashboardEmbedOptions = { actions: false, renderer: "svg" };

function dashboardSpec(dataUrl, chartTitle) {
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "data": { "url": dataUrl, "format": { "type": "json" } },
    "transform": [{ "calculate": "toDate(datum.date + '-01-01')", "as": "year" }],
    "title": { "text": chartTitle || "", "fontSize": 12, "anchor": "start", "offset": 6 },
    "mark": { "type": "line", "point": true },
    "encoding": {
      "x": { "field": "year", "type": "temporal", "title": null, "axis": { "format": "%Y", "labelAngle": 0 } },
      "y": { "field": "value", "type": "quantitative", "title": null },
      "tooltip": [
        { "field": "indicator", "type": "nominal", "title": "Indicator" },
        { "field": "date", "type": "nominal", "title": "Year" },
        { "field": "value", "type": "quantitative", "title": "Value" }
      ]
    },
    "width": "container",
    "height": 170,
    "config": { "view": { "stroke": "transparent" }, "axis": { "labelFontSize": 10, "titleFontSize": 11 } }
  };
}

async function renderDashboard() {
  for (let i = 1; i <= 6; i++) {
    const dataPath = `graphs/dashboard${i}.json`;
    const targetId = `#dash${i}`;
    const el = document.querySelector(targetId);
    if (!el) continue;

    try {
      const res = await fetch(dataPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${dataPath}`);
      const data = await res.json();

      const chartTitle =
        Array.isArray(data) && data.length && data[0].indicator
          ? String(data[0].indicator)
          : `Dashboard ${i}`;

      await vegaEmbed(targetId, dashboardSpec(dataPath, chartTitle), dashboardEmbedOptions);
    } catch (err) {
      console.error(`Dashboard ${i} error:`, err);
      el.innerHTML = `<p style="margin:0; padding:8px; color:#b91c1c; font-size:13px;">Dashboard ${i} failed.</p>`;
    }
  }
}
renderDashboard();

// =============================
// Task 7: Maps - Inline specifications
// =============================

// Scotland Choropleth Map Specification
const scotlandMapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 380,
  "height": 350,
  "data": {
    "url": "https://raw.githubusercontent.com/martinjc/UK-GeoJSON/master/json/administrative/sco/lad.json",
    "format": {"type": "topojson", "feature": "lad"}
  },
  "projection": {"type": "mercator"},
  "mark": {
    "type": "geoshape",
    "fill": "lightblue",
    "stroke": "white",
    "strokeWidth": 0.5
  },
  "encoding": {
    "tooltip": [
      {"field": "properties.LAD13NM", "type": "nominal", "title": "Council Area"}
    ]
  }
};

// Wales Coordinates Map Specification  
const walesMapSpec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 380,
  "height": 350,
  "layer": [
    {
      "data": {
        "url": "https://raw.githubusercontent.com/martinjc/UK-GeoJSON/master/json/administrative/wls/lad.json",
        "format": {"type": "topojson", "feature": "lad"}
      },
      "projection": {"type": "mercator"},
      "mark": {
        "type": "geoshape",
        "fill": "#e8f4f8",
        "stroke": "#333",
        "strokeWidth": 0.5
      }
    },
    {
      "data": {
        "values": [
          {"city": "Cardiff", "lat": 51.4816, "lon": -3.1791, "population": 362400},
          {"city": "Swansea", "lat": 51.6214, "lon": -3.9436, "population": 246466},
          {"city": "Newport", "lat": 51.5842, "lon": -2.9977, "population": 156447}
        ]
      },
      "projection": {"type": "mercator"},
      "mark": {
        "type": "circle",
        "opacity": 0.8,
        "stroke": "white"
      },
      "encoding": {
        "longitude": {"field": "lon", "type": "quantitative"},
        "latitude": {"field": "lat", "type": "quantitative"},
        "size": {
          "field": "population",
          "type": "quantitative",
          "scale": {"range": [100, 500]}
        },
        "color": {"value": "red"},
        "tooltip": [
          {"field": "city", "title": "City"},
          {"field": "population", "title": "Population", "format": ","}
        ]
      }
    }
  ]
};

// Embed the maps
vegaEmbed("#map_scotland", scotlandMapSpec, { actions: false, renderer: "svg" })
  .catch(err => {
    console.error("Scotland map error:", err);
    document.querySelector("#map_scotland").innerHTML = 
      `<div style="padding:20px; text-align:center; color:#666;">
        <p>Scotland map not loading.</p>
      </div>`;
  });

vegaEmbed("#map_wales", walesMapSpec, { actions: false, renderer: "svg" })
  .catch(err => {
    console.error("Wales map error:", err);
    document.querySelector("#map_wales").innerHTML = 
      `<div style="padding:20px; text-align:center; color:#666;">
        <p>Wales map not loading.</p>
      </div>`;
  });

// =============================
// Task 8: Big Data
// =============================
vegaEmbed("#vis_bread", "graphs/price_bread.json", embedStandard);
vegaEmbed("#vis_beer", "graphs/price_beer.json", embedStandard);

// =============================
// Task 9: Interactive Charts
// =============================
vegaEmbed("#interactive1", "graphs/interactive_economy.json", embedStandard);
vegaEmbed("#interactive2", "graphs/interactive_scatter.json", embedStandard);