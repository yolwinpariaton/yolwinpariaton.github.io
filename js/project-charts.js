// ========================================
// PROJECT CHARTS - UK COST OF LIVING CRISIS
// Robust embedding + safe rewriting of relative data URLs in specs
// ========================================

const CACHE_BUST = `?v=${new Date().toISOString().slice(0, 10)}`; // daily
const SITE_DATA_PATH = `${window.location.origin}/data/`;

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
    console.error("vegaEmbed is not available yet. Check script loading order/CDN.");
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
      <div style="padding:14px; text-align:left; color:#b91c1c; font-size:13px; line-height:1.35;">
        <div style="font-weight:700; margin-bottom:6px;">Chart failed to load</div>
        <div style="white-space:pre-wrap; color:#7f1d1d; font-size:12px;">${String(err?.message || err)}</div>
      </div>
    `;
  });
}

function isRelativeDataUrl(u) {
  return (
    typeof u === "string" &&
    u.length > 0 &&
    !u.startsWith("http://") &&
    !u.startsWith("https://") &&
    !u.startsWith("/") &&
    !u.startsWith("data:")
  );
}

function rewriteDataUrlsDeep(node) {
  if (!node || typeof node !== "object") return;

  if (node.data && typeof node.data === "object" && isRelativeDataUrl(node.data.url)) {
    const raw = String(node.data.url);
    const normalized = raw.startsWith("./") ? raw.slice(2) : raw;
    node.data.url = siteDataUrl(normalized);
  }

  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) v.forEach(rewriteDataUrlsDeep);
    else if (v && typeof v === "object") rewriteDataUrlsDeep(v);
  }
}

async function loadSpecAndFix(file) {
  const res = await fetch(siteDataUrl(file), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${file}: HTTP ${res.status}`);
  const spec = await res.json();
  rewriteDataUrlsDeep(spec);
  return spec;
}

function initCharts() {
  loadSpecAndFix("chart1_spec.json").then(spec => safeEmbed("#chart1", spec));
  loadSpecAndFix("chart2_spec.json").then(spec => safeEmbed("#chart2", spec));

  loadSpecAndFix("chart3_spec.json").then(spec => {
    // DEBUG: confirm the rewritten URLs for chart3 data layers
    try {
      console.log("Chart3 spec after rewrite:", spec);
    } catch (e) {
      // no-op
    }
    safeEmbed("#chart3", spec);
  });

  console.log("✅ project-charts.js loaded and embed calls executed.");
}

window.addEventListener("load", initCharts);
