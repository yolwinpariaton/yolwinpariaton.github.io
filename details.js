// =============================
// details.js (Robust embeds + Task 8 fix)
// =============================

const BASE_VL_CONFIG = {
  view: { stroke: "transparent" },
  background: "transparent"
};

const embedOptions = {
  actions: false,
  renderer: "svg",
  // Force vega-lite mode when we pass a spec object (prevents type ambiguity)
  mode: "vega-lite",
  config: BASE_VL_CONFIG
};

// ---- URL handling (IMPORTANT ON GITHUB PAGES) ----
// Always resolve paths relative to the current HTML page (baseURI).
// This fixes the most common reason charts "work locally" but not on GitHub Pages:
// wrong relative paths like "graphs/..." resolving to a different folder.
function absUrl(relativePath) {
  return new URL(relativePath, document.baseURI).toString();
}

// Cache-busting while you iterate (prevents stale JSON on GitHub Pages/CDN)
const CACHE_BUST = `?v=${Date.now()}`;
function bust(url) {
  // Keep existing query string safe
  return url.includes("?") ? `${url}&_=${Date.now()}` : `${url}${CACHE_BUST}`;
}

function waitForVegaEmbed(maxTries = 80) {
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

function ensurePaddingObject(padding) {
  if (padding == null) return {};
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return { ...padding };
}

function showEmbedError(el, err, triedUrl) {
  if (!el) return;
  el.innerHTML = `
    <div style="padding:12px; border:1px solid #fecaca; background:#fff1f2; color:#7f1d1d; font-size:13px; border-radius:8px;">
      <div style="font-weight:700; margin-bottom:6px;">Chart failed to load</div>
      <div style="margin-bottom:6px;"><strong>Tried:</strong> ${triedUrl}</div>
      <div><strong>Error:</strong> ${String(err?.message || err)}</div>
      <div style="margin-top:8px; color:#991b1b;">
        Open DevTools → Console and Network to see the exact missing file or JSON/spec error.
      </div>
    </div>
  `;
}

/* ---------- PATCHES ---------- */

/* Task 3: enforce smaller titles */
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

/* Task 4: fix title/legend spacing */
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

/* Task 7: Map Specific Patch (Centering and Scaling) */
function patchTask7_Maps(spec) {
  const out = { ...spec };
  if (out.title && out.title.text === "Scotland") {
    out.projection = { type: "mercator", center: [-4.1, 57.8], scale: 2800 };
  } else if (out.title && out.title.text === "Wales") {
    out.projection = { type: "mercator", center: [-3.8, 52.3], scale: 6500 };
  }
  return out;
}

/* Normalize Vega-Lite: enforce responsive width + stable height */
function normalizeVegaLite(spec, { height = 320 } = {}) {
  const out = { ...spec };

  // Do not override width for map projections
  if (!out.projection && out.width == null) {
    out.width = "container";
  }

  // Only set height if not already defined (some concat specs define their own layout)
  if (out.height == null) out.height = height;

  out.autosize = out.autosize || { type: "fit-x", contains: "padding" };
  out.config = out.config || {};
  out.config.view = out.config.view || {};
  out.config.view.stroke = "transparent";
  if (!("background" in out)) out.background = "transparent";
  return out;
}

async function safeEmbedFromUrl(
  selector,
  relativeUrl,
  { height = 320, patchFn = null, forceTitle = null, skipNormalize = false } = {}
) {
  const el = document.querySelector(selector);
  if (!el) return false;

  const resolved = bust(absUrl(relativeUrl));

  try {
    let spec = await getJson(resolved);
    if (typeof patchFn === "function") spec = patchFn(spec);

    const type = detectSpecType(spec);
    let finalSpec = spec;

    if (type === "vega-lite") {
      if (!skipNormalize) {
        finalSpec = normalizeVegaLite(finalSpec, { height });
      } else {
        finalSpec = { ...finalSpec };
        if (!("background" in finalSpec)) finalSpec.background = "transparent";
      }

      if (forceTitle) {
        finalSpec.title = { text: forceTitle, anchor: "start", fontSize: 16, offset: 10 };
      }
    } else {
      finalSpec = { ...finalSpec };
      if (typeof finalSpec.width !== "number") finalSpec.width = 700;
      if (typeof finalSpec.height !== "number") finalSpec.height = height;
      if (!("background" in finalSpec)) finalSpec.background = "transparent";
    }

    await window.vegaEmbed(selector, finalSpec, embedOptions);
    return true;
  } catch (err) {
    console.error(`Embed failed for ${selector}`, err);
    showEmbedError(el, err, resolved);
    return false;
  }
}

async function safeEmbedWithFallbacksFromUrl(selector, urls, opts = {}) {
  for (const u of urls) {
    const ok = await safeEmbedFromUrl(selector, u, opts);
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
  safeEmbedWithFallbacksFromUrl("#vis_api", ["graphs/api_chart.json"], {
    height: H_STD,
    forceTitle: "UK Inflation (API): World Bank Indicator"
  });
  safeEmbedWithFallbacksFromUrl("#vis_scrape", ["graphs/emissions_tidy.json"], { height: H_STD });

  // Task 6 (Dashboards)
  function dashboardSpec(dataUrl, chartTitle) {
    return {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      data: { url: dataUrl, format: { type: "json" } },
      transform: [{ calculate: "toDate(datum.date + '-01-01')", as: "year" }],
      title: { text: chartTitle || "", fontSize: 11, anchor: "start", offset: 4 },
      mark: { type: "line", point: false },
      encoding: {
        x: { field: "year", type: "temporal", title: null, axis: { format: "%Y", labelAngle: 0 } },
        y: { field: "value", type: "quantitative", title: null }
      },
      width: "container",
      height: 160,
      autosize: { type: "fit-x", contains: "padding" },
      config: { view: { stroke: "transparent" }, background: "transparent" }
    };
  }

  for (let i = 1; i <= 6; i++) {
    const targetId = `#dash${i}`;
    if (!document.querySelector(targetId)) continue;

    const dataPathRel = `graphs/dashboard${i}.json`;
    const dataPathAbs = bust(absUrl(dataPathRel));

    try {
      const data = await getJson(dataPathAbs);
      const chartTitle =
        Array.isArray(data) && data.length && data[0].indicator
          ? String(data[0].indicator)
          : `Dashboard ${i}`;

      await window.vegaEmbed(targetId, dashboardSpec(dataPathAbs, chartTitle), embedOptions);
    } catch (err) {
      console.error(err);
      showEmbedError(document.querySelector(targetId), err, dataPathAbs);
    }
  }

  // Task 7: Maps
  safeEmbedFromUrl("#map_scotland", "graphs/scotland_choropleth.json", { height: H_MAP, patchFn: patchTask7_Maps });
  safeEmbedFromUrl("#map_wales", "graphs/wales_coordinates.json", { height: H_MAP, patchFn: patchTask7_Maps });

  // Task 8 (FIX)
  // Most common failure here is *path resolution* or *layout overwrites*.
  // We resolve paths with absUrl(), and we do NOT overwrite vconcat/layer layouts.
  // Also add fallbacks in case you renamed files or moved folders.
  await safeEmbedWithFallbacksFromUrl(
    "#vis_bread",
    [
      "graphs/lrpd_bread.json",
      "./graphs/lrpd_bread.json",
      "data/lrpd_bread.json",
      "./data/lrpd_bread.json"
    ],
    { height: H_STD, skipNormalize: true }
  );

  await safeEmbedWithFallbacksFromUrl(
    "#vis_beer",
    [
      "graphs/lrpd_beer.json",
      "./graphs/lrpd_beer.json",
      "data/lrpd_beer.json",
      "./data/lrpd_beer.json"
    ],
    { height: H_STD, skipNormalize: true }
  );

  // Task 9
  safeEmbedFromUrl("#interactive1", "graphs/interactive_economy.json", { height: H_SM });
  safeEmbedFromUrl("#interactive2", "graphs/interactive_scatter.json", { height: H_SM });

  // Task 10
  safeEmbedWithFallbacksFromUrl("#task10a", ["graphs/task10_histogram.json"], { height: H_SM });
});
