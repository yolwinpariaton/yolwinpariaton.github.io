// =============================
// Vega Embed Helpers / Options
// =============================
const embedStandard = { actions: false, renderer: "svg", width: 400, height: 300 };
const embedTask3    = { actions: false, renderer: "svg", width: 380, height: 280 };
const embedLarge    = { actions: false, renderer: "svg", width: 900, height: 380 };

// Task 7 map options - with explicit sizing
const mapOptions = { 
  actions: false, 
  renderer: "svg",
  width: 380,
  height: 400
};

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

vegaEmbed("#vis_api", "graphs/api_chart.json", embedStandard);
vegaEmbed("#vis_scrape", "graphs/emissions_tidy.json", embedStandard);

// =============================
// Task 6: Dashboard (data -> spec)
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
      el.innerHTML = `
        <p style="margin:0; padding:8px; color:#b91c1c; font-size:13px; line-height:1.35;">
          Dashboard ${i} failed to load.<br>
          Check: <code>${dataPath}</code>
        </p>`;
    }
  }
}
renderDashboard();

// =============================
// Task 7: Maps - Fixed with proper sizing
// =============================
vegaEmbed("#map_scotland", "graphs/scotland_choropleth.json", mapOptions)
  .catch(err => {
    console.error("Map Scotland error:", err);
    const el = document.querySelector("#map_scotland");
    if (el) el.innerHTML = `<p style="margin:0; padding:8px; color:#b91c1c; font-size:13px;">Scotland map failed to load. Check console for details.</p>`;
  });

vegaEmbed("#map_wales", "graphs/wales_coordinates.json", mapOptions)
  .catch(err => {
    console.error("Map Wales error:", err);
    const el = document.querySelector("#map_wales");
    if (el) el.innerHTML = `<p style="margin:0; padding:8px; color:#b91c1c; font-size:13px;">Wales map failed to load. Check console for details.</p>`;
  });

// =============================
// Task 8: Big Data
// =============================
vegaEmbed("#vis_bread", "graphs/price_bread.json", embedStandard);
vegaEmbed("#vis_beer",  "graphs/price_beer.json",  embedStandard);

// =============================
// Task 9: Interactive Charts
// =============================
const interactiveOptions = {
  actions: false,
  renderer: "svg"
};

vegaEmbed("#interactive1", "graphs/interactive_economy.json", interactiveOptions);
vegaEmbed("#interactive2", "graphs/interactive_scatter.json", interactiveOptions);