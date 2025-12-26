// =============================
// Vega Embed Helpers / Options
// =============================
const embedStandard = { actions: false, renderer: "svg", width: 400, height: 300 };
const embedTask3    = { actions: false, renderer: "svg", width: 380, height: 280 };
const embedLarge    = { actions: false, renderer: "svg", width: 900, height: 380 };

function showEmbedError(target, label, err) {
  console.error(`${label} error:`, err);
  const el = document.querySelector(target);
  if (el) {
    el.innerHTML = `
      <p style="margin:0; padding:10px; color:#b91c1c; font-size:13px; line-height:1.35;">
        ${label} failed to load.<br>
        Open DevTools → Console to see the exact error.
      </p>`;
  }
}

function embedSafe(target, specOrUrl, options, label) {
  return vegaEmbed(target, specOrUrl, options).catch((err) => showEmbedError(target, label, err));
}

// =============================
// IMPORTANT FIX: Patch spec data URLs
// =============================
// Vega resolves relative data URLs against the *page*, not the spec file.
// This function prefixes relative data URLs with "graphs/" so they load.
function isRelativeUrl(u) {
  if (typeof u !== "string") return false;
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("//")) return false;
  if (u.startsWith("data:")) return false;
  return true;
}

function patchDataUrls(node) {
  if (!node || typeof node !== "object") return;

  // If this node has data.url, patch it.
  if (node.data && typeof node.data === "object" && "url" in node.data) {
    const u = node.data.url;
    if (isRelativeUrl(u) && !u.startsWith("graphs/")) {
      node.data.url = `graphs/${u}`;
    }
  }

  // Recurse through all properties (covers layer/specs/etc.)
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (Array.isArray(v)) {
      v.forEach(patchDataUrls);
    } else if (v && typeof v === "object") {
      patchDataUrls(v);
    }
  }
}

async function embedPatchedSpecFromFile(target, specPath, options, label) {
  try {
    const res = await fetch(specPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${specPath}`);
    const spec = await res.json();

    patchDataUrls(spec);

    await vegaEmbed(target, spec, options);
  } catch (err) {
    showEmbedError(target, label, err);
  }
}

// -----------------------------
// Tasks 1–5 (as before)
// -----------------------------
embedSafe("#vis1", "graphs/uk_unemployment_chart.json", embedStandard, "Task 1 Chart 1");
embedSafe("#vis2", "graphs/g7_inflation_chart.json", embedStandard, "Task 1 Chart 2");
embedSafe("#vis3", "graphs/nigeria_chart.json", embedStandard, "Task 2 Chart 1");
embedSafe("#vis4", "graphs/ethiopia_chart.json", embedStandard, "Task 2 Chart 2");

embedSafe("#vis5", "graphs/uk_renewable.json", embedTask3, "Task 3 Chart 1");
embedSafe("#vis6", "graphs/energy_prices.json", embedTask3, "Task 3 Chart 2");

embedSafe("#vis7", "graphs/financial_times.json", embedStandard, "Task 4 Replication");
embedSafe("#vis8", "graphs/financial_times2.json", embedLarge, "Task 4 Improved");

embedSafe("#vis_api", "graphs/api_chart.json", embedStandard, "Task 5 API");
embedSafe("#vis_scrape", "graphs/emissions_tidy.json", embedStandard, "Task 5 Scrape");

// =============================
// Task 6: Dashboard (data -> spec)
// =============================
const dashboardEmbedOptions = { actions: false, renderer: "svg" };

function dashboardSpec(dataUrl, chartTitle) {
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "data": { "url": dataUrl, "format": { "type": "json" } },
    "transform": [
      { "calculate": "toDate(datum.date + '-01-01')", "as": "year" }
    ],
    "title": {
      "text": chartTitle || "",
      "fontSize": 12,
      "anchor": "start",
      "offset": 6
    },
    "mark": { "type": "line", "point": true },
    "encoding": {
      "x": {
        "field": "year",
        "type": "temporal",
        "title": null,
        "axis": { "format": "%Y", "labelAngle": 0 }
      },
      "y": {
        "field": "value",
        "type": "quantitative",
        "title": null
      },
      "tooltip": [
        { "field": "indicator", "type": "nominal", "title": "Indicator" },
        { "field": "date", "type": "nominal", "title": "Year" },
        { "field": "value", "type": "quantitative", "title": "Value" }
      ]
    },
    "width": "container",
    "height": 170,
    "config": {
      "view": { "stroke": "transparent" },
      "axis": { "labelFontSize": 10, "titleFontSize": 11 }
    }
  };
}

async function renderDashboard() {
  for (let i = 1; i <= 6; i++) {
    const dataPath = `graphs/dashboard${i}.json`;
    const targetId = `#dash${i}`;
    const el = document.querySelector(targetId);
    if (!el) continue;

    try {
      const res = await fetch(dataPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${dataPath}`);
      const data = await res.json();

      const chartTitle =
        Array.isArray(data) && data.length && data[0].indicator
          ? String(data[0].indicator)
          : `Dashboard ${i}`;

      await vegaEmbed(targetId, dashboardSpec(dataPath, chartTitle), dashboardEmbedOptions);
    } catch (err) {
      showEmbedError(targetId, `Dashboard ${i}`, err);
    }
  }
}

renderDashboard();

// =============================
// Task 7: Maps (FIXED: patch internal data.url)
// =============================
const mapOptions = {
  actions: false,
  renderer: "svg",
  width: "container",
  height: 320
};

// IMPORTANT: load spec file, patch its internal data URLs, then embed
embedPatchedSpecFromFile("#map_scotland", "graphs/scotland_choropleth.json", mapOptions, "Scotland map");
embedPatchedSpecFromFile("#map_wales", "graphs/wales_coordinates.json", mapOptions, "Wales map");

// =============================
// Task 8: Big Data Charts (FIXED: patch internal data.url)
// =============================
embedPatchedSpecFromFile("#vis_bread", "graphs/price_bread.json", embedStandard, "Task 8 Bread chart");
embedPatchedSpecFromFile("#vis_beer", "graphs/price_beer.json", embedStandard, "Task 8 Beer chart");
