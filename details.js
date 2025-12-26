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
