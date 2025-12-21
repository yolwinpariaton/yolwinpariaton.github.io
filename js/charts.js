document.addEventListener("DOMContentLoaded", function () {

  // Chart 1: Inflation
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
    "mark": {"type": "line", "smooth": false, "strokeWidth": 2, "opacity": 1},
    "data": {
      "url": "https://raw.githubusercontent.com/RDeconomist/RDeconomist.github.io/main/charts/ONSinflation/data_OECD_inflation2.csv"
    },
    "transform": [
      {"calculate": "datum.Value/100", "as": "valueToUse"},
      {"calculate": "year(datum.TIME)", "as": "year"},
      {"filter":"datum.LOCATION!='JPN'"},
      {"filter":"datum.LOCATION!='CAN'"},
      {"filter":"datum.LOCATION!='ITA'"},
      {"filter":"datum.year >1999"}
    ],
    "encoding": {
      "x": {"field": "TIME", "type": "temporal", "title": null},
      "y": {"field": "valueToUse", "type": "quantitative", "title": null, "axis":{"format":"%"}},
      "color": {"field":"Country", "title": null, "legend": {"orient":"top-left"}}
    }
  };

  // Chart 2: Sugar
  const sugarSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "description": "Sugar 4b",
    "width": 260,
    "height": 300,
    "data": {"url": "https://raw.githubusercontent.com/RDeconomist/observatory/main/sugar_C4b.csv"},
    "encoding": {
      "x": {
        "field": "Sugar intensity (g per 100ml)",
        "type": "nominal",
        "sort": ["0"],
        "title": "Sugar intensity (g per 100g)",
        "axis": {"labelAngle": 60, "labelFontSize": 6}
      }
    },
    "layer": [
      {
        "mark": {"opacity": 0.5, "type": "bar", "color": "#e6224b"},
        "encoding": {
          "y": {
            "field": "Number of products ",
            "type": "quantitative",
            "scale": {"domain": [0, 350]},
            "title": "Number of products",
            "axis": {"titleColor": "#e6224b"}
          }
        }
      },
      {
        "mark": {"stroke": "#36b7b4", "type": "line", "interpolate": "monotone"},
        "encoding": {
          "y": {
            "field": "Tax (pence per g sugar)",
            "type": "quantitative",
            "title": "Tax (pence per g sugar)",
            "axis": {"titleColor": "#36b7b4"}
          }
        }
      }
    ],
    "resolve": {"scale": {"y": "independent"}}
  };

  // Put chart 1 inside the div with id="chart_inflation"
  vegaEmbed("#chart_inflation", inflationSpec, { actions: false });

  // Put chart 2 inside the div with id="chart_sugar"
  vegaEmbed("#chart_sugar", sugarSpec, { actions: false });

});
