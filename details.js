const BASE_VL_CONFIG = {
  view: { stroke: "transparent" },
  background: "transparent",
  title: { fontSize: 16, anchor: "start" }
};

const embedOptions = { 
  actions: false, 
  renderer: "svg", 
  config: BASE_VL_CONFIG 
};

// Larger options for Maps
const embedMapOptions = { 
  ...embedOptions,
  width: 400, 
  height: 500 
};

function safeEmbed(selector, spec, options) {
  const el = document.querySelector(selector);
  if (!el) return;
  // Cache buster to force update
  const versionedSpec = spec + "?v=" + new Date().getTime();
  vegaEmbed(selector, versionedSpec, options).catch(err => {
    console.error(`Embed failed: ${selector}`, err);
    el.innerHTML = `<div style="padding:10px; color:red;">Chart failed to load.</div>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Task 1
  safeEmbed("#vis1", "graphs/uk_unemployment_chart.json", embedOptions);
  safeEmbed("#vis2", "graphs/inflation_chart.json", embedOptions);
  
  // Task 2
  safeEmbed("#vis3", "graphs/economics_obs_1.json", embedOptions);
  safeEmbed("#vis4", "graphs/economics_obs_2.json", embedOptions);

  // Task 7: Maps
  safeEmbed("#map_scotland", "graphs/scotland_choropleth.json", embedMapOptions);
  safeEmbed("#map_wales", "graphs/wales_coordinates.json", embedMapOptions);
  
  // Task 8
  safeEmbed("#vis_bread", "graphs/lrpd_bread.json", embedOptions);
  safeEmbed("#vis_beer", "graphs/lrpd_beer.json", embedOptions);

  // Add remaining safeEmbed calls for Task 3-6, 9-10 here as needed
});