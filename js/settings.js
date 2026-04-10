// Configurazione palette e applicazione tema.

export const DEFAULT_PALETTE = "smeraldo";

export const PALETTES = [
  {
    id: "smeraldo",
    name: "Smeraldo",
    description: "Verde menta raffinato",
    swatches: ["#159a7f", "#5ac7ad", "#e8f8f2"],
    themeColor: "#f4fbf8",
  },
  {
    id: "oceano",
    name: "Oceano",
    description: "Blu fresco e arioso",
    swatches: ["#0f7db8", "#6bc6f0", "#e7f5fd"],
    themeColor: "#f3f9fd",
  },
  {
    id: "lavanda",
    name: "Lavanda",
    description: "Viola chiaro e soft",
    swatches: ["#8b76d7", "#bbaaf2", "#f0ecfc"],
    themeColor: "#f8f6fe",
  },
  {
    id: "rosa-cipria",
    name: "Rosa cipria",
    description: "Delicato e pulito",
    swatches: ["#d184a0", "#ebb8cb", "#faecf2"],
    themeColor: "#fdf7fa",
  },
  {
    id: "sabbia",
    name: "Sabbia",
    description: "Neutro caldo e luminoso",
    swatches: ["#c49b63", "#e3c89b", "#f8efe3"],
    themeColor: "#fcf8f3",
  },
  {
    id: "corallo",
    name: "Corallo",
    description: "Caldo ma morbido",
    swatches: ["#e06c5a", "#f2ab9f", "#fbeae6"],
    themeColor: "#fff7f5",
  },
  {
    id: "foresta",
    name: "Foresta",
    description: "Verde profondo e naturale",
    swatches: ["#2f855a", "#84c79d", "#e9f5ec"],
    themeColor: "#f4faf6",
  },
  {
    id: "zaffiro",
    name: "Zaffiro",
    description: "Blu più deciso",
    swatches: ["#2d5bd1", "#84a6ff", "#e9efff"],
    themeColor: "#f4f7fe",
  },
  {
    id: "prugna",
    name: "Prugna",
    description: "Elegante e piena",
    swatches: ["#8d4e8e", "#c396c3", "#f2eaf6"],
    themeColor: "#faf6fb",
  },
  {
    id: "ambra",
    name: "Ambra",
    description: "Dorato morbido",
    swatches: ["#d08a1c", "#efc068", "#fbefdc"],
    themeColor: "#fff9f2",
  },
  {
    id: "salvia",
    name: "Salvia",
    description: "Verde polveroso e rilassante",
    swatches: ["#6a9b83", "#a8cab9", "#edf5f0"],
    themeColor: "#f6faf8",
  },
  {
    id: "grafite",
    name: "Grafite",
    description: "Neutro moderno e pulito",
    swatches: ["#4e5968", "#8d98aa", "#edf1f5"],
    themeColor: "#f5f7fa",
  },
];

export function sanitizePaletteId(candidate) {
  return PALETTES.some((palette) => palette.id === candidate) ? candidate : DEFAULT_PALETTE;
}

export function getPaletteById(candidate) {
  const paletteId = sanitizePaletteId(candidate);
  return PALETTES.find((palette) => palette.id === paletteId);
}

export function applyPalette(candidate) {
  const palette = getPaletteById(candidate);
  document.documentElement.dataset.theme = palette.id;

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", palette.themeColor);
  }

  return palette.id;
}
