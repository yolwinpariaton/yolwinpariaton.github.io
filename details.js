// =============================
// Vega Embed Helpers / Options
// =============================

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

// -----------------------------
// Safe embed: one failure will not break the rest
// -----------------------------
function safeEmbed(selector, spec, options) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element: ${selector}`);
    return;
  }

  vegaEmbed(selector, spec, options).catch(err => {
    console.error(`Embed failed: ${selector}`, err);
    el.innerHTML = `
      <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
        Chart failed to load.
      </div>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {

  // -----------------------------
  // Tasks 1–5
  // -----------------------------
  safeEmbed("#vis1", "graphs/uk_unemployment_chart.json", embedStandard);
  safeEmbed("#vis2", "graphs/g7_inflation_chart.json", embedStandard);
  safeEmbed("#vis3", "graphs/nigeria_chart.json", embedStandard);
  safeEmbed("#vis4", "graphs/ethiopia_chart.json", embedStandard);

  safeEmbed("#vis5", "graphs/uk_renewable.json", embedTask3);
  safeEmbed("#vis6", "graphs/energy_prices.json", embedTask3);

  safeEmbed("#vis7", "graphs/financial_times.json", embedStandard);
  safeEmbed("#vis8", "graphs/financial_times2.json", embedLarge);

  safeEmbed("#vis_api", "graphs/api_chart.json", { actions: false, renderer: "svg", width: 450, height: 300, config: BASE_VL_CONFIG });
  safeEmbed("#vis_scrape", "graphs/emissions_tidy.json", { actions: false, renderer: "svg", width: 450, height: 300, config: BASE_VL_CONFIG });

  // =============================
  // Task 6: Dashboard
  // =============================
  const dashboardEmbedOptions = { actions: false, renderer: "svg", config: BASE_VL_CONFIG };

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
      "config": BASE_VL_CONFIG
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
          <p style="margin:0; padding:8px; color:#b91c1c; font-size:13px;">
            Dashboard ${i} failed.
          </p>
        `;
      }
    }
  }
  renderDashboard();

  // =============================
  // Task 7: Maps (use your local JSONs)
  // =============================
  safeEmbed("#map_scotland", "graphs/scotland_choropleth.json", { actions: false, renderer: "svg", config: BASE_VL_CONFIG });
  safeEmbed("#map_wales", "graphs/wales_coordinates.json", { actions: false, renderer: "svg", config: BASE_VL_CONFIG });

  // =============================
  // Task 8: Big Data
  // =============================
  safeEmbed("#vis_bread", "graphs/price_bread.json", embedStandard);
  safeEmbed("#vis_beer", "graphs/price_beer.json", embedStandard);

  // =============================
  // Task 9: Interactive
  // =============================
  safeEmbed("#interactive1", "graphs/interactive_economy.json", embedInteractive);
  safeEmbed("#interactive2", "graphs/interactive_scatter.json", embedInteractive);

  // =============================
  // Task 10: Advanced Analytics
  // =============================
  safeEmbed("#task10a", "graphs/task10_histogram.json", embedTask10);

});
