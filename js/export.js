// Esportazione dati JSON.

export function exportStateAsJson(state) {
  const payload = {
    app: "Checklist SPA Reception",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: JSON.parse(JSON.stringify(state.settings)),
    currentDay: state.currentDay,
    days: JSON.parse(JSON.stringify(state.days)),
  };

  const fileName = `checklist-spa-reception-${state.currentDay}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
