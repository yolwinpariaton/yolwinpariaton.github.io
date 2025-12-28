// =============================
// details.js (Robust embeds + responsive sizing + Task 8 fallbacks)
// =============================

const GITHUB_USER = "yolwinpariaton";
const GITHUB_REPO = "yolwinpariaton.github.io";
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/`;

// Cache-busting helps while iterating (prevents stale JSON/specs)
const CACHE_BUST = `?v=${Date.now()}`;

function withBust(url) {
  // Don’t double-add query if already present
  return url.includes("?") ? `${url}&_=${Date.now()}` : `${url}${CACHE_BUST}`;
}

const BASE_VL_CONFIG = {
  view: { stroke: "transparent" },
  background: "transparent",
  axis: { labelFontSize: 11, titleFontSize: 12 },
  legend: { labelFontSize: 11, titleFontSize: 12 },
  title: { fontSize: 14, subtitleFontSize: 12, anchor: "start" }
};

const embedOptionsBase = {
  actions: false,
  renderer: "svg",
  config: BASE_VL_CONFIG
};

function waitForVegaEmbed(maxTries = 60) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (typeof window.vegaEmbed === "function") {
        clearInterval(timer);
        resolve(true);
        return;
      }
      if (tries >= maxTries) {
        clearInterval(timer);
        reject(new Error("vegaEmbed not available (CDN scripts not loaded)."));
      }
    }, 100);
  });
}

function getJson(url) {
  return fetch(withBust(url), { cache: "no-store" }).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  });
}

function detectSpecType(spec) {
  const schema = String(spec?.$schema || "").toLowerCase();
  if (schema.includes("vega-lite")) return "vega-lite";
  if (schema.includes("vega")) return "vega";
  // heuristic
  if (spec?.marks && !spec?.encoding) return "vega";
  return "vega-lite";
}

function ensurePaddingObject(padding) {
  if (padding == null) return {};
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return { ...padding };
}

/* ---------- PATCHES (kept from your version) ---------- */

function patchTask3_VegaLite(spec) {
  const out = { ...spec };
  out.padding = ensurePaddingObject(out.padding);
  out.padding.top = Math.max(out.padding.top || 0, 18);

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

function patchTask4(spec) {
  const out = { ...spec };
  const type = detectSpecType(out);

  out.padding = ensurePaddingObject(out.padding);
  out.padding.top = Math.max(out.padding.top || 0, 40);
  out.padding.right = Math.max(out.padding.right || 0, 14);
  out.padding.left = Math.max(out.padding.left || 0, 10);
  out.padding.bottom = Math.max(out.padding.bottom || 0, 10);

  if (out.title) {
    if (typeof out.title === "string") {
      out.title = { text: out.title, anchor: "start", fontSize: 16, offset: 16 };
    } else {
      out.title = {
        ...out.title,
        anchor: "start",
        fontSize: out.title.fontSize ?? 16,
        offset: Math.max(out.title.offset ?? 0, 16),
        subtitleFontSize: out.title.subtitleFontSize ?? 12
      };
    }
  }

  if (type === "vega-lite") {
    out.config = out.config || {};
    out.config.legend = {
      ...(out.config.legend || {}),
      orient: "bottom",
      direction: "horizontal",
      columns: 4,
      offset: 10,
      padding: 10,
      titleFontSize: 12,
      labelFontSize: 12
    };
    out.autosize = out.autosize || { type: "fit-x", contains: "padding" };
  }

  return out;
}

function patchTask7_Maps(spec) {
  const out = { ...spec };
  if (out.title && out.title.text === "Scotland") {
    out.projection = { type: "mercator", center: [-4.1, 57.8], scale: 2800 };
  } else if (out.title && out.title.text === "Wales") {
    out.projection = { type: "mercator", center: [-3.8, 52.3], scale: 6500 };
  }
  return out;
}

/* ---------- RESPONSIVE NORMALIZATION ---------- */

function normalizeVegaLite(spec, { height = 320 } = {}) {
  const out = { ...spec };

  // If it's not a projection-based map, make it responsive
  if (!out.projection) out.width = "container";
  out.height = height;

  // Key: fit to the container width so it stays inside the “frame”
  out.autosize = out.autosize || { type: "fit-x", contains: "padding" };

  out.config = out.config || {};
  out.config.view = out.config.view || {};
  out.config.view.stroke = "transparent";
  if (!("background" in out)) out.background = "transparent";

  return out;
}

function normalizeVega(spec, { height = 320 } = {}) {
  const out = { ...spec };
  // Vega does not support width:'container' the same way; keep sane defaults
  if (typeof out.width !== "number") out.width = 700;
  if (typeof out.height !== "number") out.height = height;
  if (!("background" in out)) out.background = "transparent";
  return out;
}

/* ---------- EMBED + RESIZE SUPPORT ---------- */

const embeddedViews = new Map();
const resizeObservers = new Map();

function attachResizeObserver(selector, view) {
  const el = document.querySelector(selector);
  if (!el || !view) return;

  // Avoid duplicate observers
  if (resizeObservers.has(selector)) return;

  const ro = new ResizeObserver(() => {
    try {
      // Vega/Vega-Lite view resize
      if (typeof view.resize === "function") view.resize();
      if (typeof view.runAsync === "function") view.runAsync();
    } catch (e) {
      // silent; resizing should not break page
    }
  });

  ro.observe(el);
  resizeObservers.set(selector, ro);
}

function showError(el, message, triedUrls = []) {
  const tried = triedUrls.length
    ? `<div style="margin-top:8px; font-size:12px; color:#6b7280; text-align:left;">
         <div><strong>Tried:</strong></div>
         <ul style="margin:6px 0 0 18px; padding:0;">
           ${triedUrls.map(u => `<li style="margin:2px 0;">${u}</li>`).join("")}
         </ul>
       </div>`
    : "";

  el.innerHTML = `
    <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
      <div style="font-weight:700;">Chart failed to load</div>
      <div style="margin-top:6px; color:#7f1d1d; font-size:12px;">${message}</div>
      ${tried}
      <div style="margin-top:8px; font-size:12px; color:#6b7280;">
        Open DevTools → Console and Network to see the exact missing file or JSON/spec error.
      </div>
    </div>
  `;
}

async function safeEmbedFromUrl(
  selector,
  url,
  { height = 320, patchFn = null, forceTitle = null } = {}
) {
  const el = document.querySelector(selector);
  if (!el) return false;

  try {
    let spec = await getJson(url);
    if (typeof patchFn === "function") spec = patchFn(spec);

    const type = detectSpecType(spec);

    let finalSpec;
    if (type === "vega-lite") {
      finalSpec = normalizeVegaLite(spec, { height });
      if (forceTitle) {
        finalSpec.title = { text: forceTitle, anchor: "start", fontSize: 16, offset: 10 };
      }
    } else {
      finalSpec = normalizeVega(spec, { height });
      if (forceTitle) {
        // Vega title structure differs; keep simple to avoid breaking specs
        finalSpec.title = forceTitle;
      }
    }

    // IMPORTANT: set correct mode per spec type (prevents ambiguity)
    const embedOptions =
      type === "vega-lite"
        ? { ...embedOptionsBase, mode: "vega-lite" }
        : { ...embedOptionsBase, mode: "vega" };

    const result = await window.vegaEmbed(selector, finalSpec, embedOptions);

    // Keep view to resize with container
    if (result?.view) {
      embeddedViews.set(selector, result.view);
      attachResizeObserver(selector, result.view);
      // Initial resize pass
      if (typeof result.view.resize === "function") result.view.resize();
      if (typeof result.view.runAsync === "function") result.view.runAsync();
    }

    return true;
  } catch (err) {
    console.error(`Embed failed for ${selector}`, err);
    showError(el, String(err?.message || err));
    return false;
  }
}

async function safeEmbedWithFallbacksFromUrl(selector, urls, opts = {}) {
  const el = document.querySelector(selector);
  const tried = [];

  for (const url of urls) {
    tried.push(url);
    try {
      const ok = await safeEmbedFromUrl(selector, url, opts);
      if (ok) return true;
    } catch (e) {
      // safeEmbedFromUrl already handles; continue
    }
  }

  if (el) showError(el, "All candidate URLs failed.", tried);
  return false;
}

/* ---------- INIT ---------- */

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
  const H_MAP = 550;

  // Task 1
  safeEmbedFromUrl("#vis1", "graphs/uk_unemployment_chart.json", { height: H_STD });
  safeEmbedWithFallbacksFromUrl(
    "#vis2",
    ["graphs/inflation_chart.json", "graphs/g7_inflation_chart.json"],
    { height: H_STD }
  );

  // Task 2
  safeEmbedFromUrl("#vis3", "graphs/nigeria_chart.json", { height: H_STD });
  safeEmbedFromUrl("#vis4", "graphs/ethiopia_chart.json", { height: H_STD });

  // Task 3
  safeEmbedFromUrl("#vis5", "graphs/uk_renewable.json", { height: H_STD, patchFn: patchTask3_VegaLite });
  safeEmbedFromUrl("#vis6", "graphs/energy_prices.json", { height: H_STD, patchFn: patchTask3_VegaLite });

  // Task 4
  safeEmbedFromUrl("#vis7", "graphs/financial_times.json", { height: H_T4, patchFn: patchTask4 });
  safeEmbedFromUrl("#vis8", "graphs/financial_times2.json", { height: H_T4, patchFn: patchTask4 });

  // Task 5
  safeEmbedWithFallbacksFromUrl(
    "#vis_api",
    ["graphs/api_chart.json"],
    { height: H_STD, forceTitle: "UK Inflation (API): World Bank Indicator" }
  );
  safeEmbedWithFallbacksFromUrl("#vis_scrape", ["graphs/emissions_tidy.json"], { height: H_STD });

  // Task 6 (Dashboards)
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
    if (!document.querySelector(targetId)) continue;

    const dataPath = `graphs/dashboard${i}.json`;

    try {
      const data = await getJson(dataPath);
      const chartTitle =
        Array.isArray(data) && data.length && data[0].indicator
          ? String(data[0].indicator)
          : `Dashboard ${i}`;

      const result = await window.vegaEmbed(targetId, dashboardSpec(dataPath, chartTitle), {
        ...embedOptionsBase,
        mode: "vega-lite"
      });

      if (result?.view) {
        embeddedViews.set(targetId, result.view);
        attachResizeObserver(targetId, result.view);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Task 7: Maps
  safeEmbedFromUrl("#map_scotland", "graphs/scotland_choropleth.json", { height: H_MAP, patchFn: patchTask7_Maps });
  safeEmbedFromUrl("#map_wales", "graphs/wales_coordinates.json", { height: H_MAP, patchFn: patchTask7_Maps });

  // Task 8: Big Data (ROBUST fallbacks)
  // This fixes your 404 situation if the file lives in a different folder
  // or if GitHub Pages hasn’t updated yet but the raw file exists in the repo.
  await safeEmbedWithFallbacksFromUrl("#vis_bread", [
    "graphs/lrpd_bread.json",
    "data/lrpd_bread.json",
    `${RAW_BASE}graphs/lrpd_bread.json`,
    `${RAW_BASE}data/lrpd_bread.json`
  ], { height: H_STD });

  await safeEmbedWithFallbacksFromUrl("#vis_beer", [
    "graphs/lrpd_beer.json",
    "data/lrpd_beer.json",
    `${RAW_BASE}graphs/lrpd_beer.json`,
    `${RAW_BASE}data/lrpd_beer.json`
  ], { height: H_STD });

  // Task 9
  safeEmbedFromUrl("#interactive1", "graphs/interactive_economy.json", { height: H_SM });
  safeEmbedFromUrl("#interactive2", "graphs/interactive_scatter.json", { height: H_SM });

  // Task 10
  safeEmbedWithFallbacksFromUrl("#task10a", ["graphs/task10_histogram.json"], { height: H_SM });
});
