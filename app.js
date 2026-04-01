const UNIT_FACTORS_TO_M = {
  mm: 0.001,
  cm: 0.01,
  m: 1
};

const SHAPES = {
  cylindre: {
    label: "Cylindre",
    fields: [
      { key: "r", label: "Rayon" },
      { key: "h", label: "Hauteur" }
    ],
    formula: "V = π × r² × h"
  },
  troncCone: {
    label: "Tronc de cône",
    fields: [
      { key: "R", label: "Grand rayon" },
      { key: "r", label: "Petit rayon" },
      { key: "h", label: "Hauteur" }
    ],
    formula: "V = (π × h × (R² + Rr + r²)) / 3"
  },
  parallelepipede: {
    label: "Parallélépipède rectangle",
    fields: [
      { key: "L", label: "Longueur" },
      { key: "l", label: "Largeur" },
      { key: "e", label: "Épaisseur" }
    ],
    formula: "V = L × l × e"
  },
  cone: {
    label: "Cône",
    fields: [
      { key: "r", label: "Rayon" },
      { key: "h", label: "Hauteur" }
    ],
    formula: "V = (π × r² × h) / 3"
  },
  sphere: {
    label: "Sphère",
    fields: [
      { key: "r", label: "Rayon" }
    ],
    formula: "V = (4/3) × π × r³"
  }
};

const FORESTRY_METHODS = {
  smalian: {
    label: "Smalian",
    description: "Utilise les sections aux deux extrémités de la grume.",
    fields: [
      { key: "d1", label: "Diamètre petit bout" },
      { key: "d2", label: "Diamètre gros bout" },
      { key: "L", label: "Longueur de la grume" }
    ],
    formula: "V = L × (A₁ + A₂) / 2"
  },
  huber: {
    label: "Huber",
    description: "Utilise la section au milieu de la grume.",
    fields: [
      { key: "dm", label: "Diamètre médian" },
      { key: "L", label: "Longueur de la grume" }
    ],
    formula: "V = L × Aₘ"
  },
  newton: {
    label: "Newton",
    description: "Utilise les sections aux deux extrémités et au milieu.",
    fields: [
      { key: "d1", label: "Diamètre petit bout" },
      { key: "dm", label: "Diamètre médian" },
      { key: "d2", label: "Diamètre gros bout" },
      { key: "L", label: "Longueur de la grume" }
    ],
    formula: "V = L × (A₁ + 4Aₘ + A₂) / 6"
  }
};

const WOOD_SPECIES = {
  resineux: [
    { label: "Pin (500)", density: 500 },
    { label: "Sapin (450)", density: 450 },
    { label: "Épicéa (470)", density: 470 }
  ],
  feuillu: [
    { label: "Chêne (750)", density: 750 },
    { label: "Hêtre (650)", density: 650 },
    { label: "Frêne (680)", density: 680 }
  ]
};

const state = {
  unit: "cm",
  activeTab: "solides",
  shape: "cylindre",
  forestryMethod: "smalian",
  woodCategory: "resineux",
  shapeValues: {},
  forestryValues: {},
  conversionValues: {
    density: "",
    solidM3PerStere: ""
  }
};

const globalUnit = document.getElementById("globalUnit");
const shapeSelect = document.getElementById("shapeSelect");
const forestrySelect = document.getElementById("forestrySelect");
const woodCategory = document.getElementById("woodCategory");
const shapeInputs = document.getElementById("shapeInputs");
const forestryInputs = document.getElementById("forestryInputs");
const woodDensity = document.getElementById("woodDensity");
const solidM3PerStere = document.getElementById("solidM3PerStere");
const densitySuggestions = document.getElementById("densitySuggestions");

function toMeters(value, unit) {
  return value * UNIT_FACTORS_TO_M[unit];
}

function areaFromDiameter(diameterInMeters) {
  const radius = diameterInMeters / 2;
  return Math.PI * radius * radius;
}

function parsePositiveNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }

  return n;
}

function formatM3(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return `${value.toFixed(6)} m³`;
}

function formatVolumeSet(volumeM3) {
  if (!Number.isFinite(volumeM3)) {
    return {
      m3: "-",
      dm3: "-",
      litres: "-",
      cm3: "-"
    };
  }

  return {
    m3: `${volumeM3.toFixed(6)} m³`,
    dm3: `${(volumeM3 * 1000).toFixed(3)} dm³`,
    litres: `${(volumeM3 * 1000).toFixed(3)} L`,
    cm3: `${(volumeM3 * 1000000).toFixed(0)} cm³`
  };
}

function formatTons(volumeM3, densityKgM3) {
  if (!Number.isFinite(volumeM3) || !Number.isFinite(densityKgM3)) {
    return "-";
  }

  return `${((volumeM3 * densityKgM3) / 1000).toFixed(3)} t`;
}

function formatSteres(volumeM3, solidM3PerStereValue) {
  if (!Number.isFinite(volumeM3) || !Number.isFinite(solidM3PerStereValue)) {
    return "-";
  }

  return `${(volumeM3 / solidM3PerStereValue).toFixed(3)} st`;
}

function createField(field, type) {
  const wrapper = document.createElement("div");
  wrapper.className = "field";

  const label = document.createElement("label");
  label.setAttribute("for", `${type}_${field.key}`);
  label.textContent = `${field.label} (${state.unit})`;

  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "any";
  input.id = `${type}_${field.key}`;
  input.placeholder = `${field.label} en ${state.unit}`;
  input.value =
    type === "shape"
      ? (state.shapeValues[field.key] || "")
      : (state.forestryValues[field.key] || "");

  input.addEventListener("input", (e) => {
    if (type === "shape") {
      state.shapeValues[field.key] = e.target.value;
    } else {
      state.forestryValues[field.key] = e.target.value;
    }

    const errorNode = wrapper.querySelector(".error");
    if (errorNode) {
      errorNode.textContent = "";
    }
  });

  const error = document.createElement("div");
  error.className = "error";
  error.dataset.errorFor = `${type}_${field.key}`;

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  wrapper.appendChild(error);

  return wrapper;
}

function renderShapeSelect() {
  shapeSelect.innerHTML = "";

  Object.entries(SHAPES).forEach(([key, config]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = config.label;

    if (key === state.shape) {
      option.selected = true;
    }

    shapeSelect.appendChild(option);
  });
}

function renderForestrySelect() {
  forestrySelect.innerHTML = "";

  Object.entries(FORESTRY_METHODS).forEach(([key, config]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = config.label;

    if (key === state.forestryMethod) {
      option.selected = true;
    }

    forestrySelect.appendChild(option);
  });
}

function renderShapePanel() {
  const config = SHAPES[state.shape];

  document.getElementById("shapeBadge").textContent = config.label;
  document.getElementById("shapeFormula").textContent = config.formula;
  document.getElementById("shapeResultTitle").textContent = `Résultat pour ${config.label}`;
  document.getElementById("shapeResultFormula").textContent = config.formula;

  shapeInputs.innerHTML = "";

  config.fields.forEach((field) => {
    shapeInputs.appendChild(createField(field, "shape"));
  });
}

function renderBusinessLogicText() {
  const node = document.getElementById("businessLogicText");

  if (state.woodCategory === "resineux") {
    node.textContent =
      "Résineux : le volume calculé est traité comme un m³ sur écorce. Le m³S sous écorce est calculé avec un abattement forfaitaire de 12 %. Les tonnes et les stères sont calculés sur le m³S, qui sert ici de volume de référence métier.";
  } else {
    node.textContent =
      "Feuillu : le volume calculé est traité comme un m³ sur écorce. Aucun m³S n’est calculé dans cette version faute de règle métier fournie. Les tonnes et les stères sont calculés sur le m³ sur écorce, qui sert ici de volume de référence métier.";
  }
}

function renderDensitySuggestions() {
  densitySuggestions.innerHTML = "";

  WOOD_SPECIES[state.woodCategory].forEach((species) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip-button";
    button.dataset.density = species.density;
    button.textContent = species.label;

    button.addEventListener("click", () => {
      woodDensity.value = species.density;
      state.conversionValues.density = String(species.density);
      showError("conversion", "density", "");
    });

    densitySuggestions.appendChild(button);
  });
}

function renderForestryPanel() {
  const config = FORESTRY_METHODS[state.forestryMethod];

  document.getElementById("forestryMethodName").textContent = config.label;
  document.getElementById("forestryMethodDescription").textContent = config.description;
  document.getElementById("forestryMethodFormula").textContent = config.formula;
  document.getElementById("forestryResultTitle").textContent = `Résultat selon ${config.label}`;
  document.getElementById("forestryResultFormula").textContent = config.formula;
  document.getElementById("forestryCategoryLabel").textContent =
    state.woodCategory === "resineux" ? "Résineux" : "Feuillu";

  forestryInputs.innerHTML = "";

  config.fields.forEach((field) => {
    forestryInputs.appendChild(createField(field, "forestry"));
  });

  woodDensity.value = state.conversionValues.density;
  solidM3PerStere.value = state.conversionValues.solidM3PerStere;

  renderBusinessLogicText();
  renderDensitySuggestions();
}

function setShapeResult(volumeM3) {
  const formatted = formatVolumeSet(volumeM3);

  document.getElementById("shapeMainValue").textContent = formatted.m3;
  document.getElementById("shapeM3").textContent = formatted.m3;
  document.getElementById("shapeDM3").textContent = formatted.dm3;
  document.getElementById("shapeL").textContent = formatted.litres;
  document.getElementById("shapeCM3").textContent = formatted.cm3;
}

function setForestryResult(result) {
  document.getElementById("forestryM3OverBark").textContent = result.overBark;
  document.getElementById("forestryM3UnderBark").textContent = result.underBark;
  document.getElementById("forestryTons").textContent = result.tons;
  document.getElementById("forestrySteres").textContent = result.steres;
  document.getElementById("forestryDM3").textContent = result.dm3;
  document.getElementById("forestryL").textContent = result.litres;
  document.getElementById("forestryCM3").textContent = result.cm3;
  document.getElementById("forestryMainValue").textContent = result.mainValue;
  document.getElementById("forestryMainSubtitle").textContent = result.mainSubtitle;
  document.getElementById("forestryCategoryLabel").textContent =
    state.woodCategory === "resineux" ? "Résineux" : "Feuillu";
}

function setForestryEmptyResult() {
  setForestryResult({
    overBark: "-",
    underBark: "-",
    tons: "-",
    steres: "-",
    dm3: "-",
    litres: "-",
    cm3: "-",
    mainValue: "-",
    mainSubtitle: "-"
  });
}

function clearErrors(containerId) {
  document.querySelectorAll(`#${containerId} .error`).forEach((node) => {
    node.textContent = "";
  });
}

function clearConversionErrors() {
  document.querySelectorAll("[data-error-for^='conversion_']").forEach((node) => {
    node.textContent = "";
  });
}

function showError(type, key, message) {
  const node = document.querySelector(`[data-error-for="${type}_${key}"]`);
  if (node) {
    node.textContent = message;
  }
}

function validateValues(fields, values, type) {
  clearErrors(type === "shape" ? "shapeInputs" : "forestryInputs");

  let valid = true;

  fields.forEach((field) => {
    const parsed = parsePositiveNumber(values[field.key]);

    if (parsed === null) {
      valid = false;
      showError(type, field.key, "Saisir une valeur numérique strictement positive.");
    }
  });

  return valid;
}

function calculateShapeVolume() {
  const config = SHAPES[state.shape];

  if (!validateValues(config.fields, state.shapeValues, "shape")) {
    setShapeResult(NaN);
    return;
  }

  const v = Object.fromEntries(
    Object.entries(state.shapeValues).map(([k, val]) => [k, Number(val)])
  );

  let volume = NaN;

  switch (state.shape) {
    case "cylindre": {
      const r = toMeters(v.r, state.unit);
      const h = toMeters(v.h, state.unit);
      volume = Math.PI * r * r * h;
      break;
    }

    case "troncCone": {
      const R = toMeters(v.R, state.unit);
      const r = toMeters(v.r, state.unit);
      const h = toMeters(v.h, state.unit);
      volume = (Math.PI * h * (R * R + R * r + r * r)) / 3;
      break;
    }

    case "parallelepipede": {
      const L = toMeters(v.L, state.unit);
      const l = toMeters(v.l, state.unit);
      const e = toMeters(v.e, state.unit);
      volume = L * l * e;
      break;
    }

    case "cone": {
      const r = toMeters(v.r, state.unit);
      const h = toMeters(v.h, state.unit);
      volume = (Math.PI * r * r * h) / 3;
      break;
    }

    case "sphere": {
      const r = toMeters(v.r, state.unit);
      volume = (4 / 3) * Math.PI * r * r * r;
      break;
    }
  }

  setShapeResult(volume);
}

function calculateRawForestryVolume() {
  const v = Object.fromEntries(
    Object.entries(state.forestryValues).map(([k, val]) => [k, Number(val)])
  );

  switch (state.forestryMethod) {
    case "smalian": {
      const d1 = toMeters(v.d1, state.unit);
      const d2 = toMeters(v.d2, state.unit);
      const L = toMeters(v.L, state.unit);
      const A1 = areaFromDiameter(d1);
      const A2 = areaFromDiameter(d2);
      return L * (A1 + A2) / 2;
    }

    case "huber": {
      const dm = toMeters(v.dm, state.unit);
      const L = toMeters(v.L, state.unit);
      const Am = areaFromDiameter(dm);
      return L * Am;
    }

    case "newton": {
      const d1 = toMeters(v.d1, state.unit);
      const dm = toMeters(v.dm, state.unit);
      const d2 = toMeters(v.d2, state.unit);
      const L = toMeters(v.L, state.unit);
      const A1 = areaFromDiameter(d1);
      const Am = areaFromDiameter(dm);
      const A2 = areaFromDiameter(d2);
      return L * (A1 + 4 * Am + A2) / 6;
    }

    default:
      return NaN;
  }
}

function calculateForestryVolume() {
  const config = FORESTRY_METHODS[state.forestryMethod];

  if (!validateValues(config.fields, state.forestryValues, "forestry")) {
    setForestryEmptyResult();
    return;
  }

  clearConversionErrors();

  const overBarkVolume = calculateRawForestryVolume();
  let underBarkVolume = null;
  let referenceVolume = overBarkVolume;
  let referenceLabel = "Volume de référence : m³ sur écorce";

  if (state.woodCategory === "resineux") {
    underBarkVolume = overBarkVolume * 0.88;
    referenceVolume = underBarkVolume;
    referenceLabel = "Volume de référence : m³S sous écorce (abattement 12 %)";
  }

  const density = parsePositiveNumber(state.conversionValues.density);
  const stereCoefficient = parsePositiveNumber(state.conversionValues.solidM3PerStere);

  let tons = "-";
  let steres = "-";

  if (state.conversionValues.density !== "" && density === null) {
    showError("conversion", "density", "Saisir une masse volumique strictement positive.");
  } else if (density !== null) {
    tons = formatTons(referenceVolume, density);
  }

  if (state.conversionValues.solidM3PerStere !== "" && stereCoefficient === null) {
    showError("conversion", "stere", "Saisir un coefficient stère strictement positif.");
  } else if (stereCoefficient !== null) {
    steres = formatSteres(referenceVolume, stereCoefficient);
  }

  const formattedReference = formatVolumeSet(referenceVolume);

  setForestryResult({
    overBark: formatM3(overBarkVolume),
    underBark: underBarkVolume === null ? "Non applicable" : formatM3(underBarkVolume),
    tons,
    steres,
    dm3: formattedReference.dm3,
    litres: formattedReference.litres,
    cm3: formattedReference.cm3,
    mainValue: formattedReference.m3,
    mainSubtitle: referenceLabel
  });
}

function resetShape() {
  state.shapeValues = {};
  renderShapePanel();
  setShapeResult(NaN);
}

function resetForestry() {
  state.forestryValues = {};
  state.conversionValues = {
    density: "",
    solidM3PerStere: ""
  };

  renderForestryPanel();
  clearConversionErrors();
  setForestryEmptyResult();
}

function setupTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;

      document.querySelectorAll(".tab-button").forEach((btn) => {
        btn.classList.remove("active");
      });

      document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.remove("active");
      });

      button.classList.add("active");
      document.getElementById(state.activeTab).classList.add("active");
    });
  });
}

function setupStaticSuggestionButtons() {
  document.querySelectorAll("[data-stere]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.stere;
      solidM3PerStere.value = value;
      state.conversionValues.solidM3PerStere = value;
      showError("conversion", "stere", "");
    });
  });
}

function setupEvents() {
  globalUnit.addEventListener("change", (e) => {
    state.unit = e.target.value;
    renderShapePanel();
    renderForestryPanel();
  });

  shapeSelect.addEventListener("change", (e) => {
    state.shape = e.target.value;
    renderShapePanel();
    setShapeResult(NaN);
  });

  forestrySelect.addEventListener("change", (e) => {
    state.forestryMethod = e.target.value;
    renderForestryPanel();
    setForestryEmptyResult();
  });

  woodCategory.addEventListener("change", (e) => {
    state.woodCategory = e.target.value;
    renderForestryPanel();
    setForestryEmptyResult();
  });

  woodDensity.addEventListener("input", (e) => {
    state.conversionValues.density = e.target.value;
    showError("conversion", "density", "");
  });

  solidM3PerStere.addEventListener("input", (e) => {
    state.conversionValues.solidM3PerStere = e.target.value;
    showError("conversion", "stere", "");
  });

  document.getElementById("shapeCalculate").addEventListener("click", calculateShapeVolume);
  document.getElementById("shapeReset").addEventListener("click", resetShape);
  document.getElementById("forestryCalculate").addEventListener("click", calculateForestryVolume);
  document.getElementById("forestryReset").addEventListener("click", resetForestry);
}

function init() {
  renderShapeSelect();
  renderForestrySelect();
  renderShapePanel();
  renderForestryPanel();
  setShapeResult(NaN);
  setForestryEmptyResult();
  setupTabs();
  setupEvents();
  setupStaticSuggestionButtons();
}

init();