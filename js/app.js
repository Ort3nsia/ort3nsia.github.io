// Entry point dell'applicazione.

import { exportStateAsJson } from "./export.js";
import { MASSAGE_GUIDE } from "./data/massage-data.js";
import { applyPalette } from "./settings.js";
import {
  getTodayISODate,
  hydrateState,
  markAllTasksCompleted,
  resetDayTasks,
  setActivePalette,
  setDayNotes,
  setTaskCompletion,
} from "./state.js";
import { loadAppState, saveAppState } from "./storage.js";
import { renderApp } from "./ui.js";

const root = document.querySelector("#app");

let state = hydrateState(loadAppState());

const uiState = {
  activeTab: "today",
  activeSection: "all",
  isSettingsOpen: false,
  historyDetailDate: null,
  openMassageIds: new Set([MASSAGE_GUIDE[0]?.id].filter(Boolean)),
};

function persistState() {
  saveAppState(state);
}

function syncBodyScrollLock() {
  const hasModal = uiState.isSettingsOpen || Boolean(uiState.historyDetailDate);
  document.body.classList.toggle("has-modal-open", hasModal);
}

function render() {
  applyPalette(state.settings.activePalette);
  root.innerHTML = renderApp({ state, uiState });
  syncBodyScrollLock();
}

function commit() {
  persistState();
  render();
}

function ensureCurrentDayIsFresh() {
  const todayIso = getTodayISODate();

  if (state.currentDay !== todayIso || !state.days[todayIso]) {
    state = hydrateState(state, todayIso);
    commit();
  }
}

function toggleMassagePhase(phaseId) {
  if (uiState.openMassageIds.has(phaseId)) {
    uiState.openMassageIds.delete(phaseId);
    return;
  }

  uiState.openMassageIds.add(phaseId);
}

function handleActionClick(event) {
  const actionElement = event.target.closest("[data-action]");
  if (!actionElement) {
    return;
  }

  const { action } = actionElement.dataset;

  switch (action) {
    case "open-settings": {
      uiState.isSettingsOpen = true;
      render();
      break;
    }

    case "close-settings": {
      uiState.isSettingsOpen = false;
      render();
      break;
    }

    case "set-tab": {
      uiState.activeTab = actionElement.dataset.tab || "today";
      render();
      break;
    }

    case "set-filter": {
      uiState.activeSection = actionElement.dataset.section || "all";
      render();
      break;
    }

    case "set-palette": {
      setActivePalette(state, actionElement.dataset.palette);
      commit();
      break;
    }

    case "mark-all-completed": {
      markAllTasksCompleted(state);
      commit();
      break;
    }

    case "reset-current-day": {
      const shouldReset = window.confirm(
        "Vuoi davvero resettare tutte le task del giorno corrente? Lo storico degli altri giorni resterà intatto.",
      );

      if (shouldReset) {
        resetDayTasks(state);
        commit();
      }
      break;
    }

    case "export-json": {
      exportStateAsJson(state);
      break;
    }

    case "open-history-detail": {
      uiState.historyDetailDate = actionElement.dataset.date || null;
      render();
      break;
    }

    case "close-history-detail": {
      uiState.historyDetailDate = null;
      render();
      break;
    }

    case "toggle-massage-phase": {
      toggleMassagePhase(actionElement.dataset.phaseId);
      render();
      break;
    }

    default:
      break;
  }
}

function handleInputChange(event) {
  const checkbox = event.target.closest('[data-action="toggle-task"]');
  if (!checkbox) {
    return;
  }

  setTaskCompletion(state, checkbox.dataset.taskId, checkbox.checked);
  commit();
}

function handleTextInput(event) {
  const textarea = event.target.closest('[data-action="update-notes"]');
  if (!textarea) {
    return;
  }

  setDayNotes(state, textarea.value);
  persistState();
}

function handleKeyboardShortcuts(event) {
  if (event.key !== "Escape") {
    return;
  }

  if (uiState.historyDetailDate) {
    uiState.historyDetailDate = null;
    render();
    return;
  }

  if (uiState.isSettingsOpen) {
    uiState.isSettingsOpen = false;
    render();
  }
}

function init() {
  root.addEventListener("click", handleActionClick);
  root.addEventListener("change", handleInputChange);
  root.addEventListener("input", handleTextInput);
  window.addEventListener("focus", ensureCurrentDayIsFresh);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      ensureCurrentDayIsFresh();
    }
  });
  document.addEventListener("keydown", handleKeyboardShortcuts);

  persistState();
  render();
}

init();
