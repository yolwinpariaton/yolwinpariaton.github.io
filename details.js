// =============================
// details.js (Consistent sizing embeds)
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

function getJson(url) {
  return fetch(url, { cache: "no-store" }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  });
}

/**
 * Apply consistent layout constraints to a Vega/Vega-Lite spec.
 * This is the key to meaningfully standardize chart sizes.
 */
function normalizeSpec(spec, { height = 320, forceWidthContainer = true } = {}) {
  const out = { ...spec };

  // For Vega-Lite, enforce container width and a consistent height
  if (forceWidthContainer) out.width = "container";
  if (typeof height === "number") out.height = height;

  // Make charts responsive horizontally
  out.autosize = out.autosize || { type: "fit-x", contains: "padding" };

  // Prevent borders around the view
  out.config = out.config || {};
  out.config.view = out.config.view || {};
  out.config.view.stroke = "transparent";

  // Ensure transparent background
  if (!("background" in out)) out.background = "transparent";

  return out;
}

async function safeEmbedFromUrl(selector, url, { height = 320 } = {}) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element in HTML: ${selector}`);
    return false;
  }

  try {
    const spec = await getJson(url);
    const normalized = normalizeSpec(spec, { height });

    await window.vegaEmbed(selector, normalized, embedOptions);
    return true;
  } catch (err) {
    console.error(`Embed failed for ${selector} using ${url}`, err);
    el.innerHTML = `
      <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
        Chart failed to load. Open the browser console for details.
      </div>
    `;
    return false;
  }
}

async function safeEmbedWithFallbacksFromUrl(selector, urls, { height = 320 } = {}) {
  for (const url of urls) {
    const ok = await safeEmbedFromUrl(selector, url, { height });
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

  // Choose consistent heights (match CSS variables conceptually)
  const H_STD = 320;
  const H_LG = 360;
  const H_MAP = 520;

  // Task 1
  safeEmbedFromUrl("#vis1", "graphs/uk_unemployment_chart.json", { height: H_STD });
  await safeEmbedWithFallbacksFromUrl("#vis2", [
    "graphs/inflation_chart.json",
    "graphs/g7_inflation_chart.json"
  ], { height: H_STD });

  // Task 2
  safeEmbedFromUrl("#vis3", "graphs/nigeria_chart.json", { height: H_STD });
  safeEmbedFromUrl("#vis4", "graphs/ethiopia_chart.json", { height: H_STD });

  // Task 3
  safeEmbedFromUrl("#vis5", "graphs/uk_renewable.json", { height: H_STD });
  safeEmbedFromUrl("#vis6", "graphs/energy_prices.json", { height: H_STD });

  // Task 4
  safeEmbedFromUrl("#vis7", "graphs/financial_times.json", { height: H_STD });
  safeEmbedFromUrl("#vis8", "graphs/financial_times2.json", { height: H_LG });

  // Task 5
  safeEmbedWithFallbacksFromUrl("#vis_api", [
    "graphs/api_chart.json",
    "graphs/api_chart_spec.json"
  ], { height: H_STD });

  safeEmbedWithFallbacksFromUrl("#vis_scrape", [
    "graphs/emissions_tidy.json",
    "graphs/emissions_chart.json"
  ], { height: H_STD });

  // Task 6 Dashboard (kept as your original logic, but still robust)
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
      "autosize": { "type": "fit-x", "contains": "padding" },
      "config": { "view": { "stroke": "transparent" }, "background": "transparent" }
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
  safeEmbedFromUrl("#map_scotland", "graphs/scotland_choropleth.json", { height: H_MAP });
  safeEmbedFromUrl("#map_wales", "graphs/wales_coordinates.json", { height: H_MAP });

  // Task 8
  safeEmbedWithFallbacksFromUrl("#vis_bread", [
    "graphs/lrpd_bread.json",
    "graphs/price_bread.json"
  ], { height: H_STD });

  safeEmbedWithFallbacksFromUrl("#vis_beer", [
    "graphs/lrpd_beer.json",
    "graphs/price_beer.json"
  ], { height: H_STD });

  // Task 9
  safeEmbedFromUrl("#interactive1", "graphs/interactive_economy.json", { height: H_LG });
  safeEmbedFromUrl("#interactive2", "graphs/interactive_scatter.json", { height: H_LG });

  // Task 10A
  safeEmbedWithFallbacksFromUrl("#task10a", [
    "graphs/task10_histogram.json",
    "graphs/task10_histogram_spec.json"
  ], { height: H_LG });
});
