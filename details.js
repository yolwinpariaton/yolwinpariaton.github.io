// Embed options for different chart types
const embedStandard = { 
  actions: false, 
  renderer: "svg", 
  width: 400, 
  height: 300 
};

const embedTask3 = { 
  actions: false, 
  renderer: "svg", 
  width: 380, 
  height: 280 
};

const embedLarge = { 
  actions: false, 
  renderer: "svg", 
  width: 800, 
  height: 400 
};

const embedWide = { 
  actions: false, 
  renderer: "svg", 
  width: "container", 
  height: 300 
};

// Tasks 1-5: Individual embeds
vegaEmbed("#vis1", "graphs/dashboard1.json", embedStandard);
vegaEmbed("#vis2", "graphs/dashboard2.json", embedStandard);
vegaEmbed("#vis3", "graphs/dashboard3.json", embedStandard);
vegaEmbed("#vis4", "graphs/dashboard4.json", embedStandard);
vegaEmbed("#vis5", "graphs/dashboard5.json", embedTask3);
vegaEmbed("#vis6", "graphs/dashboard6.json", embedTask3);

// Task 4
vegaEmbed("#vis7", "graphs/financial_times.json", embedWide);
vegaEmbed("#vis8", "graphs/financial_times2.json", embedLarge);

// Task 5
vegaEmbed("#vis_api", "graphs/api_chart.json", embedWide);
vegaEmbed("#vis_scrape", "graphs/emissions_tidy.json", embedWide);

// Task 6: Dashboard - Using LOOP to embed 6 charts
const dashboardOptions = {
  actions: false,
  renderer: "svg"
};

// Loop to embed all 6 dashboard charts
for (let i = 1; i <= 6; i++) {
  vegaEmbed(`#dash${i}`, `graphs/dashboard_${i}.json`, dashboardOptions);
}