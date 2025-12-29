// ========================================
// PROJECT CHARTS - UK COST OF LIVING CRISIS
// GitHub Pages-safe loader: always read from /data/
// ========================================

const CACHE_BUST = `?v=${new Date().toISOString().slice(0, 10)}`;
const SITE_DATA_PATH = "/data/";

function siteDataUrl(file) {
  return `${SITE_DATA_PATH}${file}${CACHE_BUST}`;
}

const BASE_VL_CONFIG = {
  view: { stroke: "transparent" },
  background: "transparent",
  title: { fontSize: 14, subtitleFontSize: 12, anchor: "start" },
  axis: {
    labelFontSize: 11,
    titleFontSize: 12,
    gridColor: "#e5e7eb",
    domainColor: "#111827",
    tickColor: "#111827"
  },
  legend: { labelFontSize: 11, titleFontSize: 12 }
};

const EMBED_OPTS = {
  actions: false,
  renderer: "svg",
  mode: "vega-lite",
  config: BASE_VL_CONFIG
};

function safeEmbed(selector, specOrUrl, opts = EMBED_OPTS) {
  const el = document.querySelector(selector);
  if (!el) {
    console.warn(`Missing element in HTML: ${selector}`);
    return Promise.resolve();
  }

  if (typeof vegaEmbed !== "function") {
    console.error("vegaEmbed is not available yet. Check CDN script loading.");
    el.innerHTML = `
      <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
        Vega libraries not loaded. Check console and script tags.
      </div>
    `;
    return Promise.resolve();
  }

  return vegaEmbed(selector, specOrUrl, opts).catch(err => {
    console.error(`Embed failed: ${selector}`, err);
    el.innerHTML = `
      <div style="padding:14px; text-align:center; color:#b91c1c; font-size:13px;">
        Chart failed to load.<br/>
        <span style="color:#7f1d1d; font-size:12px;">${String(err?.message || err)}</span>
      </div>
    `;
  });
}

function isRelativeUrl(u) {
  return (
    typeof u === "string" &&
    u.length > 0 &&
    !u.startsWith("http://") &&
    !u.startsWith("https://") &&
    !u.startsWith("/") &&
    !u.startsWith("data:")
  );
}

function rewriteUrlsDeep(node) {
  if (!node || typeof node !== "object") return;

  if (node.data && typeof node.data === "object" && isRelativeUrl(node.data.url)) {
    node.data.url = `${SITE_DATA_PATH}${node.data.url}${CACHE_BUST}`;
  }

  if (isRelativeUrl(node.url)) {
    node.url = `${SITE_DATA_PATH}${node.url}${CACHE_BUST}`;
  }

  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach(rewriteUrlsDeep);
    else if (v && typeof v === "object") rewriteUrlsDeep(v);
  }
}

async function loadAndFixSpec(filename) {
  const res = await fetch(siteDataUrl(filename), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${siteDataUrl(filename)}: HTTP ${res.status}`);
  const spec = await res.json();
  rewriteUrlsDeep(spec);
  return spec;
}

function initCharts() {
  loadAndFixSpec("chart1_spec.json")
    .then(spec => safeEmbed("#chart1", spec))
    .catch(err => safeEmbed("#chart1", { error: String(err) }));

  loadAndFixSpec("chart2_spec.json")
    .then(spec => safeEmbed("#chart2", spec))
    .catch(err => safeEmbed("#chart2", { error: String(err) }));

  loadAndFixSpec("chart3_spec.json")
    .then(spec => safeEmbed("#chart3", spec))
    .catch(err => safeEmbed("#chart3", { error: String(err) }));

  // Charts 4–8 can remain as you already had them (inline specs),
  // as long as you use siteDataUrl("filename.json") with NO "data/" prefix.

  console.log("✅ project-charts.js loaded and embed calls executed.");
}

window.addEventListener("load", initCharts);
