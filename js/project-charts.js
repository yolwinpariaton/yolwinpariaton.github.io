/* js/project-charts.js
   Embed Vega-Lite JSON specs from /data into #vis1 ... #vis8
   (Restores the working setup: each visX_*.json is a Vega/Vega-Lite spec file.)
*/

(function () {
  const charts = [
    { id: "vis1", spec: "data/vis1_prices_vs_pay.json" },
    { id: "vis2", spec: "data/vis2_food_vs_headline.json" },
    { id: "vis3", spec: "data/vis3_energy_cap.json" },
    { id: "vis4", spec: "data/vis4_fuel_weekly.json" },
    { id: "vis5", spec: "data/vis5_rent_vs_house.json" },
    { id: "vis6", spec: "data/vis6_rent_map_regions.json" },
    { id: "vis7", spec: "data/vis7_rent_trend_regions.json" },
    { id: "vis8", spec: "data/vis8_rent_map_countries.json" }
  ];

  function fail(elId, err, specPath) {
    const el = document.getElementById(elId);
    if (el) {
      el.innerHTML =
        '<div style="padding:16px;font-size:18px;">Chart failed to load. Check console and JSON paths.</div>';
    }
    // Log details for debugging
    console.error(`[${elId}] failed to render ${specPath}`, err);
  }

  async function renderOne({ id, spec }) {
    const el = document.getElementById(id);
    if (!el) return;

    try {
      await vegaEmbed(`#${id}`, spec, {
        actions: false,
        renderer: "svg" // stable sizing + crisp labels
      });
    } catch (err) {
      fail(id, err, spec);
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    for (const c of charts) {
      // render sequentially (easier to debug, fewer race issues)
      // eslint-disable-next-line no-await-in-loop
      await renderOne(c);
    }
  });
})();
