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
    const nigeriaSpec = await loadSpec("graphs/nigeria_chart.json");
    const ethiopiaSpec = await loadSpec("graphs/ethiopia_chart.json");

    // Responsive inside the cards
    nigeriaSpec.width = "container";
    ethiopiaSpec.width = "container";

    await vegaEmbed("#chart_nigeria", nigeriaSpec, embedOptions);
    await vegaEmbed("#chart_ethiopia", ethiopiaSpec, embedOptions);

  } catch (err) {
    console.error(err);
    const el = document.querySelector("#chart_nigeria");
    if (el) el.innerHTML = `<p style="color:#b91c1c;font-weight:700;">Charts failed to load. Check console for details.</p>`;
  }
});
