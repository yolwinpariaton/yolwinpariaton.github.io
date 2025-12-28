// =============================
// details.js (Robust embeds + layout patches)
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

/* Task 3: enforce smaller titles */
function patchTask3(spec) {
  const out = { ...spec };
  out.padding = out.padding || { top: 18, left: 10, right: 10, bottom: 8 };

  if (out.title) {
    if (typeof out.title === "string") {
      out.title = { text: out.title, anchor: "start", fontSize: 16, offset: 10 };
    } else {
      out.title = {
        ...out.title,
        anchor: "start",
        fontSize: 16,
        offset: 10,
        subtitleFontSize: 12
      };
      if (out.title.subtitle) out.title.subtitleFontSize = 12;
    }
  }
  return out;
}

/* ✅ Task 4: Fix title/legend spacing + frame “fill” look */
function patchTask4(spec) {
  const out = { ...spec };

  // Give the title/legend area more vertical room
  out.padding = out.padding || {};
  out.padding.top = Math.max(out.padding.top || 0, 38);
  out.padding.left = Math.max(out.padding.left || 0, 10);
  out.padding.right = Math.max(out.padding.right || 0, 14);
  out.padding.bottom = Math.max(out.padding.bottom || 0, 10);

  // Title: make it slightly smaller + push it away from the legend
  if (out.title) {
    if (typeof out.title === "string") {
      out.title = {
        text: out.title,
        anchor: "start",
        fontSize: 16,
        offset: 16
      };
    } else {
      out.title = {
        ...out.title,
        anchor: "start",
        fontSize: 16,
        offset: 16,
        subtitleFontSize: out.title.subtitleFontSize ?? 12
      };
    }
  }

  // Legend: keep at top (FT-style) but add real spacing
  out.config = out.config || {};
  out.config.legend = {
    ...(out.config.legend || {}),
    orient: "top",
    direction: "horizontal",
    titleFontSize: 12,
    labelFontSize: 12,
    // offset: distance from plot area; padding: inside legend group
    offset: 14,
    padding: 12,
    // ensures it doesn't squeeze into title space
    columns: 4
  };

  // If any channel has its own legend settings, normalize it too
  if (out.encoding) {
    Object.keys(out.encoding).forEach(k => {
      const enc = out.encoding[k];
      if (enc && typeof enc === "object" && enc.legend) {
        enc.legend = {
          ...enc.legend,
          orient: "top",
          direction: "horizontal",
          offset: 14,
          padding: 12,
          columns: 4
        };
      }
    });
  }

  // Make autosize consistent so chart uses the container well
  out.autosize = { type: "fit-x", contains: "padding" };

  return out;
}

function normalizeVegaLite(spec, { height = 320, patchFn = null, forceTitle = null } = {}) {
  let out = { ...spec };

  if (typeof patchFn === "function") out = patchFn(out);

  out.width = "container";
  out.height = height;
  out.autosize = out.autosize || { type: "fit-x", contains: "padding" };

  out.config = out.config || {};
  out.config.view = out.config.view || {};
  out.config.view.stroke = "transparent";
  if (!("background" in out)) out.background = "transparent";

  if (forceTitle) {
    out.title = { text: forceTitle, anchor: "start", fontSize: 16, offset: 10 };
  }

  return out;
}

async function safeEmbedFromUrl(selector, url, { height = 320, patchFn = null, forceTitle = null } = {}) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element in HTML: ${selector}`);
    return false;
  }

  try {
    const spec = await getJson(url);
    const type = detectSpecType(spec);

    let finalSpec = spec;

    if (type === "vega-lite") {
      finalSpec = normalizeVegaLite(spec, { height, patchFn, forceTitle });
    } else {
      finalSpec = { ...spec };
      if (typeof finalSpec.width !== "number") finalSpec.width = 700;
      if (typeof finalSpec.height !== "number") finalSpec.height = height;
      if (!("background" in finalSpec)) finalSpec.background = "transparent";
    }

    await window.vegaEmbed(selector, finalSpec, embedOptions);
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

async function embedMapFromUrl(selector, url, { height = 460 } = {}) {
  return safeEmbedFromUrl(selector, url, { height });
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
  safeEmbedFromUrl("#vis5", "graphs/uk_renewable.json", { height: H_STD, patchFn: patchTask3 });
  safeEmbedFromUrl("#vis6", "graphs/energy_prices.json", { height: H_STD, patchFn: patchTask3 });

  // ✅ Task 4 (the only graphs you asked to fix)
  safeEmbedFromUrl("#vis7", "graphs/financial_times.json", { height: H_T4, patchFn: patchTask4 });
  safeEmbedFromUrl("#vis8", "graphs/financial_times2.json", { height: H_T4, patchFn: patchTask4 });

  // Task 5
  safeEmbedWithFallbacksFromUrl("#vis_api", [
    "graphs/api_chart.json",
    "graphs/api_chart_spec.json"
  ], { height: H_STD, forceTitle: "UK Inflation (API): World Bank Indicator" });

  safeEmbedWithFallbacksFromUrl("#vis_scrape", [
    "graphs/emissions_tidy.json",
    "graphs/emissions_chart.json"
  ], { height: H_STD });

  // Task 6 Dashboard unchanged (your existing logic)
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
      "height": 160,
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

  // Task 7
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
