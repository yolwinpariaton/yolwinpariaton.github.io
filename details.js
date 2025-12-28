// =============================
// details.js (Consistent sizing + Vega/Vega-Lite safe maps)
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

function detectSpecType(spec) {
  const schema = String(spec?.$schema || "").toLowerCase();
  if (schema.includes("vega-lite")) return "vega-lite";
  if (schema.includes("vega")) return "vega";
  // Fallback: if it has "marks" and no "encoding" it's probably Vega
  if (spec?.marks && !spec?.encoding) return "vega";
  return "vega-lite";
}

/**
 * Normalize Vega-Lite safely, and avoid breaking Vega specs.
 */
function normalizeSpec(spec, { height = 320, widthMode = "container", forMaps = false } = {}) {
  const type = detectSpecType(spec);
  const out = { ...spec };

  if (type === "vega-lite") {
    // Vega-Lite supports container width
    if (widthMode === "container") out.width = "container";

    // Keep charts consistent with Task 1–3
    if (typeof height === "number") out.height = height;

    // Fit horizontally; for maps, allow fit (both directions) if it helps
    if (!out.autosize) {
      out.autosize = forMaps
        ? { type: "fit", contains: "padding" }
        : { type: "fit-x", contains: "padding" };
    }

    out.config = out.config || {};
    out.config.view = out.config.view || {};
    out.config.view.stroke = "transparent";
    if (!("background" in out)) out.background = "transparent";

    return out;
  }

  // Vega spec: width must be numeric (NOT "container")
  // Do NOT override width unless missing/invalid; do set a safe height if missing.
  if (typeof out.width !== "number") {
    out.width = 700; // safe default for maps; will be scaled by CSS anyway
  }
  if (typeof out.height !== "number") {
    out.height = height;
  }

  // Vega autosize can be "fit" etc; don't force unless missing
  if (!out.autosize) {
    out.autosize = forMaps ? "fit" : "pad";
  }

  if (!("background" in out)) out.background = "transparent";
  return out;
}

async function safeEmbedFromUrl(selector, url, { height = 320, forMaps = false } = {}) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element in HTML: ${selector}`);
    return false;
  }

  try {
    const spec = await getJson(url);
    const normalized = normalizeSpec(spec, { height, widthMode: "container", forMaps });

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

async function safeEmbedWithFallbacksFromUrl(selector, urls, { height = 320, forMaps = false } = {}) {
  for (const url of urls) {
    const ok = await safeEmbedFromUrl(selector, url, { height, forMaps });
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

  // Reference sizes (Task 1–3 are “perfect”)
  const H_STD = 320;
  const H_MAP = 460;
  const H_DASH_INNER = 160; // inside a 190px tile

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

  // Task 4 (force same sizing as Tasks 1–3)
  safeEmbedFromUrl("#vis7", "graphs/financial_times.json", { height: H_STD });
  safeEmbedFromUrl("#vis8", "graphs/financial_times2.json", { height: H_STD });

  // Task 5 (force same sizing as Tasks 1–3)
  safeEmbedWithFallbacksFromUrl("#vis_api", [
    "graphs/api_chart.json",
    "graphs/api_chart_spec.json"
  ], { height: H_STD });

  safeEmbedWithFallbacksFromUrl("#vis_scrape", [
    "graphs/emissions_tidy.json",
    "graphs/emissions_chart.json"
  ], { height: H_STD });

  // Task 6 Dashboard
  function dashboardSpec(dataUrl, chartTitle) {
    return {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": { "url": dataUrl, "format": { "type": "json" } },
      "transform": [{ "calculate": "toDate(datum.date + '-01-01')", "as": "year" }],
      "title": { "text": chartTitle || "", "fontSize": 11, "anchor": "start", "offset": 4 },
      "mark": { "type": "line", "point": false },
      "encoding": {
        "x": { "field": "year", "type": "temporal", "title": null, "axis": { "format": "%Y", "labelAngle": 0 } },
        "y": { "field": "value", "type": "quantitative", "title": null }
      },
      "width": "container",
      "height": H_DASH_INNER,
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

      await window.vegaEmbed(targetId, dashboardSpec(dataPath, chartTitle), embedOptions);
    } catch (err) {
      console.error(`Dashboard ${i} error:`, err);
      el.innerHTML = `<p style="margin:0; padding:8px; color:#b91c1c; font-size:13px;">Dashboard ${i} failed.</p>`;
    }
  }

  // Task 7 Maps (safe for Vega OR Vega-Lite)
  safeEmbedFromUrl("#map_scotland", "graphs/scotland_choropleth.json", { height: H_MAP, forMaps: true });
  safeEmbedFromUrl("#map_wales", "graphs/wales_coordinates.json", { height: H_MAP, forMaps: true });

  // Task 8 (same sizing)
  safeEmbedWithFallbacksFromUrl("#vis_bread", [
    "graphs/lrpd_bread.json",
    "graphs/price_bread.json"
  ], { height: H_STD });

  safeEmbedWithFallbacksFromUrl("#vis_beer", [
    "graphs/lrpd_beer.json",
    "graphs/price_beer.json"
  ], { height: H_STD });

  // Task 9 (same sizing)
  safeEmbedFromUrl("#interactive1", "graphs/interactive_economy.json", { height: H_STD });
  safeEmbedFromUrl("#interactive2", "graphs/interactive_scatter.json", { height: H_STD });

  // Task 10 (same sizing)
  safeEmbedWithFallbacksFromUrl("#task10a", [
    "graphs/task10_histogram.json",
    "graphs/task10_histogram_spec.json"
  ], { height: H_STD });
});
