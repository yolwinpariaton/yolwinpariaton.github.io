// =============================
// details.js (Robust embeds)
// =============================

const BASE_VL_CONFIG = {
  view: { stroke: "transparent" },
  background: "transparent"
};

const embedOptions = {
  actions: false,
  renderer: "svg",
  config: BASE_VL_CONFIG
};

function waitForVegaEmbed(maxTries = 50) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (typeof window.vegaEmbed === "function") {
        clearInterval(timer);
        resolve(true);
      }
      if (tries >= maxTries) {
        clearInterval(timer);
        reject(new Error("vegaEmbed not available (CDN scripts not loaded)."));
      }
    }, 100);
  });
}

function safeEmbed(selector, spec, options = embedOptions) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element in HTML: ${selector}`);
    return Promise.resolve(false);
  }

  return window.vegaEmbed(selector, spec, options)
    .then(() => true)
    .catch(err => {
      console.error(`Embed failed for ${selector} using ${spec}`, err);
      el.innerHTML = `
        <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
          Chart failed to load. Open the browser console for details.
        </div>
      `;
      return false;
    });
}

async function safeEmbedWithFallbacks(selector, specs, options = embedOptions) {
  for (const spec of specs) {
    const ok = await safeEmbed(selector, spec, options);
    if (ok) return true;
  }
  return false;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await waitForVegaEmbed();
  } catch (e) {
    console.error(e);
    return;
  }

  // Task 1
  safeEmbed("#vis1", "graphs/uk_unemployment_chart.json", embedOptions);
  await safeEmbedWithFallbacks("#vis2", [
    "graphs/inflation_chart.json",
    "graphs/g7_inflation_chart.json"
  ], embedOptions);

  // Task 2
  safeEmbed("#vis3", "graphs/nigeria_chart.json", embedOptions);
  safeEmbed("#vis4", "graphs/ethiopia_chart.json", embedOptions);

  // Task 3
  safeEmbed("#vis5", "graphs/uk_renewable.json", embedOptions);
  safeEmbed("#vis6", "graphs/energy_prices.json", embedOptions);

  // Task 4
  safeEmbed("#vis7", "graphs/financial_times.json", embedOptions);
  safeEmbed("#vis8", "graphs/financial_times2.json", embedOptions);

  // Task 5
  safeEmbedWithFallbacks("#vis_api", [
    "graphs/api_chart.json",
    "graphs/api_chart_spec.json"
  ], embedOptions);

  safeEmbedWithFallbacks("#vis_scrape", [
    "graphs/emissions_tidy.json",
    "graphs/emissions_chart.json"
  ], embedOptions);

  // Task 6 Dashboard (if your dashboard JSONs exist)
  const dashboardEmbedOptions = embedOptions;

  function dashboardSpec(dataUrl, chartTitle) {
    return {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": { "url": dataUrl, "format": { "type": "json" } },
      "transform": [{ "calculate": "toDate(datum.date + '-01-01')", "as": "year" }],
      "title": { "text": chartTitle || "", "fontSize": 12, "anchor": "start", "offset": 6 },
      "mark": { "type": "line", "point": true },
      "encoding": {
        "x": { "field": "year", "type": "temporal", "title": null, "axis": { "format": "%Y", "labelAngle": 0 } },
        "y": { "field": "value", "type": "quantitative", "title": null }
      },
      "width": "container",
      "height": 170,
      "config": { "view": { "stroke": "transparent" } }
    };
  }

  for (let i = 1; i <= 6; i++) {
    const targetId = `#dash${i}`;
    const el = document.querySelector(targetId);
    if (!el) continue;

    const dataPath = `graphs/dashboard${i}.json`;
    try {
      const res = await fetch(dataPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${dataPath}`);
      const data = await res.json();

      const chartTitle =
        Array.isArray(data) && data.length && data[0].indicator
          ? String(data[0].indicator)
          : `Dashboard ${i}`;

      await window.vegaEmbed(targetId, dashboardSpec(dataPath, chartTitle), dashboardEmbedOptions);
    } catch (err) {
      console.error(`Dashboard ${i} error:`, err);
      el.innerHTML = `<p style="margin:0; padding:8px; color:#b91c1c; font-size:13px;">Dashboard ${i} failed.</p>`;
    }
  }

  // Task 7 Maps
  safeEmbed("#map_scotland", "graphs/scotland_choropleth.json", embedOptions);
  safeEmbed("#map_wales", "graphs/wales_coordinates.json", embedOptions);

  // Task 8
  safeEmbedWithFallbacks("#vis_bread", [
    "graphs/lrpd_bread.json",
    "graphs/price_bread.json"
  ], embedOptions);

  safeEmbedWithFallbacks("#vis_beer", [
    "graphs/lrpd_beer.json",
    "graphs/price_beer.json"
  ], embedOptions);

  // Task 9
  safeEmbed("#interactive1", "graphs/interactive_economy.json", embedOptions);
  safeEmbed("#interactive2", "graphs/interactive_scatter.json", embedOptions);

  // Task 10A
  safeEmbedWithFallbacks("#task10a", [
    "graphs/task10_histogram.json",
    "graphs/task10_histogram_spec.json"
  ], embedOptions);
});
