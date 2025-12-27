const BASE_VL_CONFIG = {
  view: { stroke: "transparent" },
  background: "transparent",
  title: { fontSize: 14, subtitleFontSize: 12, anchor: "start" },
  axis: {
    labelFontSize: 11,
    titleFontSize: 12,
    gridColor: "#e5e7eb",
    domainColor: "#111827",
    tickColor: "#111827"
  },
  legend: { labelFontSize: 11, titleFontSize: 12 }
};

const embedStandard    = { actions: false, renderer: "svg", width: 400, height: 300, config: BASE_VL_CONFIG };
const embedTask3       = { actions: false, renderer: "svg", width: 380, height: 280, config: BASE_VL_CONFIG };
const embedLarge       = { actions: false, renderer: "svg", width: 900, height: 380, config: BASE_VL_CONFIG };
const embedInteractive = { actions: false, renderer: "svg", width: 650, height: 420, config: BASE_VL_CONFIG };
const embedTask10      = { actions: false, renderer: "svg", width: 650, height: 420, config: BASE_VL_CONFIG };
const embedMap         = { actions: false, renderer: "svg", width: 400, height: 500, config: BASE_VL_CONFIG };

function safeEmbed(selector, spec, options) {
  const el = document.querySelector(selector);
  if (!el) return;
  vegaEmbed(selector, spec, options).catch(err => {
    console.error(`Embed failed: ${selector}`, err);
    el.innerHTML = `<div style="padding:14px; text-align:center; color:#b91c1c;">Chart failed to load.</div>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Tasks 1-5
  safeEmbed("#vis1", "graphs/uk_unemployment_chart.json", embedStandard);
  safeEmbed("#vis2", "graphs/g7_inflation_chart.json", embedStandard);
  safeEmbed("#vis3", "graphs/nigeria_chart.json", embedStandard);
  safeEmbed("#vis4", "graphs/ethiopia_chart.json", embedStandard);
  safeEmbed("#vis5", "graphs/uk_renewable.json", embedTask3);
  safeEmbed("#vis6", "graphs/energy_prices.json", embedTask3);
  safeEmbed("#vis7", "graphs/financial_times.json", embedStandard);
  safeEmbed("#vis8", "graphs/financial_times2.json", embedLarge);
  safeEmbed("#vis_api", "graphs/api_chart.json", embedStandard);
  safeEmbed("#vis_scrape", "graphs/emissions_tidy.json", embedStandard);

  // Task 6: Dashboard
  const dashboardEmbedOptions = { actions: false, renderer: "svg", config: BASE_VL_CONFIG };
  async function renderDashboard() {
    for (let i = 1; i <= 6; i++) {
      const dataPath = `graphs/dashboard${i}.json`;
      const targetId = `#dash${i}`;
      const el = document.querySelector(targetId);
      if (!el) continue;
      try {
        const res = await fetch(dataPath);
        const data = await res.json();
        const chartTitle = data[0]?.indicator || `Dashboard ${i}`;
        const spec = {
          "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
          "data": { "url": dataPath },
          "transform": [{ "calculate": "toDate(datum.date + '-01-01')", "as": "year" }],
          "title": { "text": chartTitle, "fontSize": 12 },
          "mark": { "type": "line", "point": true },
          "encoding": {
            "x": { "field": "year", "type": "temporal", "axis": { "format": "%Y" } },
            "y": { "field": "value", "type": "quantitative" }
          },
          "width": "container", "height": 170
        };
        await vegaEmbed(targetId, spec, dashboardEmbedOptions);
      } catch (e) { el.innerHTML = "Error loading"; }
    }
  }
  renderDashboard();

  // Task 7: Maps
  safeEmbed("#map_scotland", "graphs/scotland_choropleth.json", embedMap);
  safeEmbed("#map_wales", "graphs/wales_coordinates.json", embedMap);

  // Task 8: Big Data
  safeEmbed("#vis_bread", "graphs/price_bread.json", embedStandard);
  safeEmbed("#vis_beer", "graphs/price_beer.json", embedStandard);

  // Task 9: Interactive
  safeEmbed("#interactive1", "graphs/interactive_economy.json", embedInteractive);
  safeEmbed("#interactive2", "graphs/interactive_scatter.json", embedInteractive);

  // Task 10
  safeEmbed("#task10a", "graphs/task10_histogram.json", embedTask10);
});