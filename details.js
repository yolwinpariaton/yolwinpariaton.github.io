const BASE_VL_CONFIG = {
  view: { stroke: "transparent" },
  background: "transparent"
};

const embedOptions = { 
  actions: false, 
  renderer: "svg", 
  config: BASE_VL_CONFIG 
};

function safeEmbed(selector, spec, options) {
  const el = document.querySelector(selector);
  if (!el) return;
  vegaEmbed(selector, spec, options).catch(err => {
    console.error(`Embed failed: ${selector}`, err);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Existing Tasks
  safeEmbed("#vis1", "graphs/uk_unemployment_chart.json", embedOptions);
  safeEmbed("#vis2", "graphs/inflation_chart.json", embedOptions);
  
  // Task 7: Maps (Fixed Paths and Selectors)
  safeEmbed("#map_scotland", "graphs/scotland_choropleth.json", embedOptions);
  safeEmbed("#map_wales", "graphs/wales_coordinates.json", embedOptions);

  // Other tasks...
  safeEmbed("#vis_bread", "graphs/lrpd_bread.json", embedOptions);
  safeEmbed("#vis_beer", "graphs/lrpd_beer.json", embedOptions);
});