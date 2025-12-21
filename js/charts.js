document.addEventListener("DOMContentLoaded", function () {

  // Chart 1: Unemployment (UK)
  const unemploymentSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

    "data": {
      "url": "https://api.economicsobservatory.com/gbr/unem",
      "format": { "type": "json", "property": "raw.years" }
    },

    "title": {
      "text": "Unemployment level (16+)",
      "subtitle": "United Kingdom (thousands) seasonally adjusted",
      "subtitleFontStyle": "italic",
      "subtitleFontSize": 10,
      "anchor": "start",
      "color": "black"
    },

    "width": 300,
    "height": 300,

    "mark": {
      "type": "line",
      "color": "seagreen",
      "strokeWidth": 2,
      "opacity": 1
    },

    "encoding": {
      "x": { "field": "date", "type": "temporal", "title": null },
      "y": { "field": "value", "type": "quantitative", "title": null }
    }
  };

  // Chart 2: Inflation (G7)
  const inflationSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",

    "title": {
      "text": "Inflation - four G7 countries",
      "subtitle": ["Source: OECD", ""],
      "subtitleFontStyle": "italic",
      "subtitleFontSize": 10,
      "anchor": "start",
      "color": "black"
    },

    "width": 300,
    "height": 300,

    "mark": {
      "type": "line",
      "smooth": false,
      "strokeWidth": 2,
      "opacity": 1
    },

    "data": {
      "url": "https://raw.githubusercontent.com/RDeconomist/RDeconomist.github.io/main/charts/ONSinflation/data_OECD_inflation2.csv"
    },

    "transform": [
      { "calculate": "datum.Value/100", "as": "valueToUse" },
      { "calculate": "year(datum.TIME)", "as": "year" },

      { "filter": "datum.LOCATION!='JPN'" },
      { "filter": "datum.LOCATION!='CAN'" },
      { "filter": "datum.LOCATION!='ITA'" },

      { "filter": "datum.year >1999" }
    ],

    "encoding": {
      "x": { "field": "TIME", "type": "temporal", "title": null },
      "y": { "field": "valueToUse", "type": "quantitative", "title": null, "axis": { "format": "%" } },
      "color": { "field": "Country", "title": null, "legend": { "orient": "top-left" } }
    }
  };

  // Embed both charts into the matching divs
  vegaEmbed("#chart_unemployment", unemploymentSpec, { actions: false });
  vegaEmbed("#chart_inflation", inflationSpec, { actions: false });

});
