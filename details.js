const BASE_VL_CONFIG = {
  view: { stroke: "transparent" },
  background: "transparent"
};

const embedMapOptions = { 
  actions: false, 
  renderer: "svg", 
  width: 400, 
  height: 500, 
  config: BASE_VL_CONFIG 
};

function safeEmbed(selector, spec, options) {
  const el = document.querySelector(selector);
  if (!el) return;
  vegaEmbed(selector, spec, options).catch(err => {
    console.error(`Embed failed: ${selector}`, err);
    el.innerHTML = `<div style="color:red; text-align:center;">Error loading chart.</div>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Task 7: Specific Map Embeds
  safeEmbed("#map_scotland", "graphs/scotland_choropleth.json", embedMapOptions);
  safeEmbed("#map_wales", "graphs/wales_coordinates.json", embedMapOptions);

  // Example for other tasks using standard options
  const standardOptions = { actions: false, width: 400, height: 300, config: BASE_VL_CONFIG };
  safeEmbed("#vis1", "graphs/uk_unemployment_chart.json", standardOptions);
});