// =============================
// details.js (Final refinements: task patches + safe maps)
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
  if (spec?.marks && !spec?.encoding) return "vega";
  return "vega-lite";
}

function applyTitle(spec, titleText) {
  if (!titleText) return spec;
  const out = { ...spec };
  out.title = {
    text: titleText,
    anchor: "start",
    fontSize: 14,
    offset: 10
  };
  return out;
}

/* Task 3: titles a bit smaller + safer padding */
function patchTask3(spec) {
  const out = { ...spec };

  if (!out.padding) out.padding = { top: 16, left: 6, right: 6, bottom: 6 };

  if (out.title) {
    if (typeof out.title === "string") {
      out.title = { text: out.title, anchor: "start", fontSize: 14, offset: 10 };
    } else {
      out.title = {
        ...out.title,
        anchor: out.title.anchor || "start",
        fontSize: out.title.fontSize ?? 14,
        offset: out.title.offset ?? 10
      };
      if (out.title.subtitle) {
        out.title.subtitleFontSize = out.title.subtitleFontSize ?? 11;
      }
    }
  }
  return out;
}

/* Task 4: stop title overlapping legend + reduce compression */
function patchTask4(spec) {
  const out = { ...spec };

  // more breathing room
  out.padding = out.padding || { top: 20, left: 8, right: 8, bottom: 10 };

  // keep title neat
  if (out.title) {
    if (typeof out.title === "string") {
      out.title = { text: out.title, anchor: "start", fontSize: 14, offset: 12 };
    } else {
      out.title = {
        ...out.title,
        anchor: out.title.anchor || "start",
        fontSize: out.title.fontSize ?? 14,
        offset: out.title.offset ?? 12
      };
    }
  }

  // force legend bottom for consistency
  out.config = out.config || {};
  out.config.legend = {
    ...(out.config.legend || {}),
    orient: "bottom",
    direction: "horizontal",
    titleFontSize: 11,
    labelFontSize: 11,
    offset: 6
  };

  return out;
}

function normalizeVegaLite(spec, { height = 320, titleText = "", patchFn = null } = {}) {
  let out = { ...spec };

  if (titleText) out = applyTitle(out, titleText);
  if (typeof patchFn === "function") out = patchFn(out);

  out.width = "container";
  out.height = height;

  if (!out.autosize) out.autosize = { type: "fit-x", contains: "padding" };

  out.config = out.config || {};
  out.config.view = out.config.view || {};
  out.config.view.stroke = "transparent";
  if (!("background" in out)) out.background = "transparent";

  return out;
}

async function safeEmbedFromUrl(selector, url, { height = 320, titleText = "", patchFn = null } = {}) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element in HTML: ${selector}`);
    return false;
  }

  try {
    const spec = await getJson(url);
    const type = detectSpecType(spec);

    let normalized = spec;

    if (type === "vega-lite") {
      normalized = normalizeVegaLite(spec, { height, titleText, patchFn });
    } else {
      // Vega fallback: keep numeric width/height safe (do not set width:"container")
      normalized = { ...spec };
      if (typeof normalized.width !== "number") normalized.width = 700;
      if (typeof normalized.height !== "number") normalized.height = height;
      if (!("background" in normalized)) normalized.background = "transparent";
    }

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

async function safeEmbedWithFallbacksFromUrl(selector, urls, opts = {}) {
  for (const url of urls) {
    const ok = await safeEmbedFromUrl(selector, url, opts);
    if (ok) return true;
  }
  return false;
}

/**
 * Maps: do NOT enforce autosize changes that can break projection rendering.
 * Force width:"container" for Vega-Lite maps only, and set a stable height.
 */
async function embedMapFromUrl(selector, url, { height = 460 } = {}) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element in HTML: ${selector}`);
    return false;
  }

  try {
    const spec = await getJson(url);
    const type = detectSpecType(spec);

    let out = { ...spec };

    if (type === "vega-lite") {
      out.width = "container";
      out.height = height;

      // Keep whatever autosize/projection the spec already has; just ensure transparent + no border
      out.config = out.config || {};
      out.config.view = out.config.view || {};
      out.config.view.stroke = "transparent";
      if (!("background" in out)) out.background = "transparent";
    } else {
      // Vega: keep numeric width/height
      if (typeof out.width !== "number") out.width = 700;
      if (typeof out.height !== "number") out.height = height;
      if (!("background" in out)) out.background = "transparent";
    }

    await window.vegaEmbed(selector, out, embedOptions);
    return true;
  } catch (err) {
    console.error(`Map embed failed for ${selector} using ${url}`, err);
    el.innerHTML = `
      <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
        Map failed to load. Check console for details.
      </div>
    `;
    return false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await waitForVegaEmbed();
  } catch (e) {
    console.error(e);
    return;
  }

  const H_STD = 320;
  const H_SM = 280;
  const H_T4 = 360;
  const H_MAP = 460;
  const H_DASH_INNER = 160;

  // Task 1
  safeEmbedFromUrl("#vis1", "graphs/uk_unemployment_chart.json", { height: H_STD });
  await safeEmbedWithFallbacksFromUrl("#vis2", [
    "graphs/inflation_chart.json",
    "graphs/g7_inflation_chart.json"
  ], { height: H_STD });

  // Task 2
  safeEmbedFromUrl("#vis3", "graphs/nigeria_chart.json", { height: H_STD });
  safeEmbedFromUrl("#vis4", "graphs/ethiopia_chart.json", { height: H_STD });

  // Task 3 (patch titles)
  safeEmbedFromUrl("#vis5", "graphs/uk_renewable.json", { height: H_STD, patchFn: patchTask3 });
  safeEmbedFromUrl("#vis6", "graphs/energy_prices.json", { height: H_STD, patchFn: patchTask3 });

  // Task 4 (patch title/legend + extra height)
  safeEmbedFromUrl("#vis7", "graphs/financial_times.json", { height: H_T4, patchFn: patchTask4 });
  safeEmbedFromUrl("#vis8", "graphs/financial_times2.json", { height: H_T4, patchFn: patchTask4 });

  // Task 5 (add titles inside charts)
  safeEmbedWithFallbacksFromUrl("#vis_api", [
    "graphs/api_chart.json",
    "graphs/api_chart_spec.json"
  ], { height: H_STD, titleText: "UK Inflation (API): World Bank Indicator" });

  safeEmbedWithFallbacksFromUrl("#vis_scrape", [
    "graphs/emissions_tidy.json",
    "graphs/emissions_chart.json"
  ], { height: H_STD, titleText: "Emissions (Scraped): Wikipedia Data (Tidy Format)" });

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

  // Task 7 Maps (dedicated embed)
  embedMapFromUrl("#map_scotland", "graphs/scotland_choropleth.json", { height: H_MAP });
  embedMapFromUrl("#map_wales", "graphs/wales_coordinates.json", { height: H_MAP });

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
  safeEmbedFromUrl("#interactive1", "graphs/interactive_economy.json", { height: H_SM });
  safeEmbedFromUrl("#interactive2", "graphs/interactive_scatter.json", { height: H_SM });

  // Task 10
  safeEmbedWithFallbacksFromUrl("#task10a", [
    "graphs/task10_histogram.json",
    "graphs/task10_histogram_spec.json"
  ], { height: H_SM });
});
