// Task 6: Dashboard - Using LOOP to embed 6 charts
const dashboardOptions = {
  actions: false,
  renderer: "svg",
  width: 300,
  height: 200
};

// IMPORTANT: matches portfolio.html (dashboard1.json ... dashboard6.json)
for (let i = 1; i <= 6; i++) {
  vegaEmbed(`#dash${i}`, `graphs/dashboard${i}.json`, dashboardOptions);
}

// Task 7: Maps
const mapOptions = {
  actions: false,
  renderer: "svg"
};

vegaEmbed("#map_scotland", "graphs/scotland_choropleth.json", mapOptions);
vegaEmbed("#map_wales", "graphs/wales_coordinates.json", mapOptions);