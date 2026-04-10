// Gestione persistenza locale.

const STORAGE_KEY = "checklist-spa-reception-state-v1";

export function loadAppState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error("Impossibile leggere lo stato salvato.", error);
    return null;
  }
}

export function saveAppState(state) {
  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error("Impossibile salvare lo stato dell'app.", error);
  }
}

export function getStorageKey() {
  return STORAGE_KEY;
}
