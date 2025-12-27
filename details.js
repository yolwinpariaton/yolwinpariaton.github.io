// =============================
// Vega Embed Helpers / Options
// =============================
const embedStandard    = { actions: false, renderer: "svg", width: 400, height: 300 };
const embedTask3       = { actions: false, renderer: "svg", width: 380, height: 280 };
const embedLarge       = { actions: false, renderer: "svg", width: 900, height: 380 };
const embedInteractive = { actions: false, renderer: "svg", width: 650, height: 420 };
const embedTask10      = { actions: false, renderer: "svg", width: 650, height: 420 };

function safeEmbed(selector, spec, options) {
  const el = document.querySelector(selector);
  if (!el) return;

  vegaEmbed(selector, spec, options).catch(err => {
    console.error(`Embed failed: ${selector}`, err);
    el.innerHTML = `<div style="color:red;">Chart failed to load.</div>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Tasks 1–5
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

  // Task 7: Maps
  safeEmbed("#map_scotland", "graphs/scotland_choropleth.json", { actions: false });
  safeEmbed("#map_wales", "graphs/wales_coordinates.json", { actions: false });

  // Task 8: Big Data (The new ones!)
  safeEmbed("#vis_bread", "graphs/price_bread.json", embedStandard);
  safeEmbed("#vis_beer", "graphs/price_beer.json", embedStandard);

  // Task 9 & 10
  safeEmbed("#interactive1", "graphs/interactive_economy.json", embedInteractive);
  safeEmbed("#interactive2", "graphs/interactive_scatter.json", embedInteractive);
  safeEmbed("#task10a", "graphs/task10_histogram.json", embedTask10);
});