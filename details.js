const BASE_VL_CONFIG = {
  view: { stroke: "transparent" },
  background: "transparent",
  title: { fontSize: 16, anchor: "start" }
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
    el.innerHTML = `<div style="padding:20px; color:red;">Map failed to load. Check console.</div>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Task 7 Maps
  safeEmbed("#map_scotland", "graphs/scotland_choropleth.json", embedMapOptions);
  safeEmbed("#map_wales", "graphs/wales_coordinates.json", embedMapOptions);
  
  // Example for other charts
  const stdOptions = { actions: false, width: 400, height: 300, config: BASE_VL_CONFIG };
  safeEmbed("#vis1", "graphs/uk_unemployment_chart.json", stdOptions);
});