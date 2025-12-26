// =============================
// Vega Embed Helpers / Options
// =============================
const embedStandard = { actions: false, renderer: "svg", width: 400, height: 300 };
const embedTask3    = { actions: false, renderer: "svg", width: 380, height: 280 };
const embedLarge    = { actions: false, renderer: "svg", width: 900, height: 380 };

// Utility: embed with visible error message (so you don’t need to open console)
function embedSafe(target, specOrUrl, options, label) {
  return vegaEmbed(target, specOrUrl, options).catch((err) => {
    console.error(`${label} error:`, err);
    const el = document.querySelector(target);
    if (el) {
      el.innerHTML = `
        <p style="margin:0; padding:10px; color:#b91c1c; font-size:13px; line-height:1.35;">
          ${label} failed to load.<br>
          Open DevTools → Console to see the exact error.
        </p>`;
    }
  });
}

// -----------------------------
// Tasks 1–5
// -----------------------------
embedSafe("#vis1", "graphs/uk_unemployment_chart.json", embedStandard, "Task 1 Chart 1");
embedSafe("#vis2", "graphs/g7_inflation_chart.json", embedStandard, "Task 1 Chart 2");
embedSafe("#vis3", "graphs/nigeria_chart.json", embedStandard, "Task 2 Chart 1");
embedSafe("#vis4", "graphs/ethiopia_chart.json", embedStandard, "Task 2 Chart 2");

embedSafe("#vis5", "graphs/uk_renewable.json", embedTask3, "Task 3 Chart 1");
embedSafe("#vis6", "graphs/energy_prices.json", embedTask3, "Task 3 Chart 2");

embedSafe("#vis7", "graphs/financial_times.json", embedStandard, "Task 4 Replication");
embedSafe("#vis8", "graphs/financial_times2.json", embedLarge, "Task 4 Improved");

embedSafe("#vis_api", "graphs/api_chart.json", embedStandard, "Task 5 API");
embedSafe("#vis_scrape", "graphs/emissions_tidy.json", embedStandard, "Task 5 Scrape");

// =============================
// Task 6: Dashboard (data -> spec)
// =============================
const dashboardEmbedOptions = { actions: false, renderer: "svg" };

function dashboardSpec(dataUrl, chartTitle) {
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "data": { "url": dataUrl, "format": { "type": "json" } },
    "transform": [
      { "calculate": "toDate(datum.date + '-01-01')", "as": "year" }
    ],
    "title": {
      "text": chartTitle || "",
      "fontSize": 12,
      "anchor": "start",
      "offset": 6
    },
    "mark": { "type": "line", "point": true },
    "encoding": {
      "x": {
        "field": "year",
        "type": "temporal",
        "title": null,
        "axis": { "format": "%Y", "labelAngle": 0 }
      },
      "y": {
        "field": "value",
        "type": "quantitative",
        "title": null
      },
      "tooltip": [
        { "field": "indicator", "type": "nominal", "title": "Indicator" },
        { "field": "date", "type": "nominal", "title": "Year" },
        { "field": "value", "type": "quantitative", "title": "Value" }
      ]
    },
    "width": "container",
    "height": 170,
    "config": {
      "view": { "stroke": "transparent" },
      "axis": { "labelFontSize": 10, "titleFontSize": 11 }
    }
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
// Task 7: Maps (CRITICAL: keep explicit size)
// =============================
const mapOptions = {
  actions: false,
  renderer: "svg",
  width: "container",
  height: 320
};

embedSafe("#map_scotland", "graphs/scotland_choropleth.json", mapOptions, "Scotland map");
embedSafe("#map_wales", "graphs/wales_coordinates.json", mapOptions, "Wales map");

// =============================
// Task 8: Big Data Charts
// =============================
embedSafe("#vis_bread", "graphs/price_bread.json", embedStandard, "Task 8 Bread chart");
embedSafe("#vis_beer", "graphs/price_beer.json", embedStandard, "Task 8 Beer chart");
