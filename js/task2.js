document.addEventListener("DOMContentLoaded", async function () {
  const embedOptions = {
    actions: false,
    renderer: "svg",
    autosize: { type: "fit", contains: "padding" }
  };

  async function loadSpec(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
    return res.json();
  }

  try {
    // These should match your repo structure exactly
    const nigeriaSpec = await loadSpec("graphs/nigeria_chart.json");
    const ethiopiaSpec = await loadSpec("graphs/ethiopia_chart.json");

    // Optional: make charts responsive in the cards
    nigeriaSpec.width = "container";
    ethiopiaSpec.width = "container";

    await vegaEmbed("#chart_nigeria", nigeriaSpec, embedOptions);
    await vegaEmbed("#chart_ethiopia", ethiopiaSpec, embedOptions);

  } catch (err) {
    console.error(err);
    // Show a visible error on the page (so you don’t need DevTools)
    const el = document.querySelector("#chart_nigeria");
    if (el) el.innerHTML = `<p style="color:#b91c1c;font-weight:700;">Charts failed to load. Check console for details.</p>`;
  }
});
