document.addEventListener("DOMContentLoaded", () => {
  // =============================
  // Vega Embed Helpers / Options
  // =============================
  const embedStandard = { actions: false, renderer: "svg", width: 400, height: 300 };
  const embedTask3    = { actions: false, renderer: "svg", width: 380, height: 280 };
  const embedLarge    = { actions: false, renderer: "svg", width: 900, height: 380 };

  function safeEmbed(selector, specUrlOrObject, options) {
    return vegaEmbed(selector, specUrlOrObject, options).catch((err) => {
      console.error(`Embed failed for ${selector}:`, err);
      const el = document.querySelector(selector);
      if (el) {
        el.innerHTML = `
          <p style="margin:0; padding:10px; color:#b91c1c; font-size:13px; line-height:1.35;">
            Failed to load <code>${selector}</code>.<br>
            Open DevTools Console for the error message.
          </p>`;
      }
    });
  }

  // -----------------------------
  // Tasks 1–5
  // -----------------------------
  safeEmbed("#vis1", "graphs/uk_unemployment_chart.json", embedStandard);
  safeEmbed("#vis2", "graphs/g7_inflation_chart.json", embedStandard);
  safeEmbed("#vis3", "graphs/nigeria_chart.json", embedStandard);
  safeEmbed("#vis4", "graphs/ethiopia_chart.json", embedStandard);

  safeEmbed("#vis5", "graphs/uk_renewable.json", embedTask3);
  safeEmbed("#vis6", "graphs/energy_prices.json", embedTask3);

  safeEmbed("#vis7", "graphs/financial_times.json", embedStandard);
  safeEmbed("#vis8", "graphs/financial_times2.json", embedLarge);

  safeEmbed("#vis_api", "graphs/api_chart.json", embedStandard);
  safeEmbed("#vis_scrape", "graphs/emissions_tidy.json", embedStandard);

  // =============================
  // Task 6: Dashboard (data -> spec)
  // =============================
  const dashboardEmbedOptions = { actions: false, renderer: "svg" };

  function dashboardSpec(dataUrl, chartTitle) {
    return {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "data": { "url": dataUrl, "format": { "type": "json" } },
      "transform": [{ "calculate": "toDate(datum.date + '-01-01')", "as": "year" }],
      "title": { "text": chartTitle || "", "fontSize": 12, "anchor": "start", "offset": 6 },
      "mark": { "type": "line", "point": true },
      "encoding": {
        "x": { "field": "year", "type": "temporal", "title": null, "axis": { "format": "%Y", "labelAngle": 0 } },
        "y": { "field": "value", "type": "quantitative", "title": null },
        "tooltip": [
          { "field": "indicator", "type": "nominal", "title": "Indicator" },
          { "field": "date", "type": "nominal", "title": "Year" },
          { "field": "value", "type": "quantitative", "title": "Value" }
        ]
      },
      "width": "container",
      "height": 170,
      "config": { "view": { "stroke": "transparent" }, "axis": { "labelFontSize": 10, "titleFontSize": 11 } }
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
        console.error(`Dashboard ${i} error:`, err);
        el.innerHTML = `
          <p style="margin:0; padding:8px; color:#b91c1c; font-size:13px; line-height:1.35;">
            Dashboard ${i} failed to load.<br>
            Check: <code>${dataPath}</code>
          </p>`;
      }
    }
  }

  renderDashboard();

  // =============================
  // Task 7: Maps
  // =============================
  // Key fix: stable height for maps, container width.
  const mapOptions = {
    actions: false,
    renderer: "svg",
    width: "container",
    height: 320
  };

  safeEmbed("#map_scotland", "graphs/scotland_choropleth.json", mapOptions);
  safeEmbed("#map_wales", "graphs/wales_coordinates.json", mapOptions);
});
