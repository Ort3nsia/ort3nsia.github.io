// Stato applicativo, normalizzazione dati e helper giornalieri.

import { CHECKLIST_SECTIONS, CHECKLIST_TASKS } from "./data/checklist-data.js";
import { DEFAULT_PALETTE, sanitizePaletteId } from "./settings.js";

export function getTodayISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addDays(dateIso, amount) {
  const date = new Date(`${dateIso}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return getTodayISODate(date);
}

function normalizeNotes(value) {
  return typeof value === "string" ? value : "";
}

function createTaskRecord(taskDefinition, existingTask = null) {
  const completed = Boolean(existingTask?.completed);

  return {
    id: taskDefinition.id,
    label: taskDefinition.label,
    section: taskDefinition.section,
    sectionId: taskDefinition.sectionId,
    order: taskDefinition.order,
    completed,
    completedAt: completed ? existingTask?.completedAt ?? null : null,
  };
}

function normalizeTasks(taskMap = {}) {
  return Object.fromEntries(
    CHECKLIST_TASKS.map((taskDefinition) => [
      taskDefinition.id,
      createTaskRecord(taskDefinition, taskMap[taskDefinition.id]),
    ]),
  );
}

export function calculateDayStats(day) {
  const tasks = Object.values(day.tasks);
  const totalCount = tasks.length;
  const completedCount = tasks.filter((task) => task.completed).length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    percent,
  };
}

export function createEmptyDay(dateIso) {
  const day = {
    date: dateIso,
    notes: "",
    tasks: normalizeTasks(),
  };

  return {
    ...day,
    stats: calculateDayStats(day),
  };
}

function normalizeDay(dateIso, dayValue) {
  const normalized = {
    date: dateIso,
    notes: normalizeNotes(dayValue?.notes),
    tasks: normalizeTasks(dayValue?.tasks),
  };

  return {
    ...normalized,
    stats: calculateDayStats(normalized),
  };
}

function ensureDay(state, dateIso) {
  if (!state.days[dateIso]) {
    state.days[dateIso] = createEmptyDay(dateIso);
  }

  return state.days[dateIso];
}

function backfillMissingDays(state, todayIso) {
  const existingDates = Object.keys(state.days).filter(isValidIsoDate).sort();

  if (existingDates.length === 0) {
    state.days[todayIso] = createEmptyDay(todayIso);
    return;
  }

  const latestDate = existingDates[existingDates.length - 1];
  let cursor = latestDate;

  while (cursor < todayIso) {
    cursor = addDays(cursor, 1);
    if (!state.days[cursor]) {
      state.days[cursor] = createEmptyDay(cursor);
    }
  }

  ensureDay(state, todayIso);
}

export function createInitialState(todayIso = getTodayISODate()) {
  return {
    settings: {
      activePalette: DEFAULT_PALETTE,
    },
    currentDay: todayIso,
    days: {
      [todayIso]: createEmptyDay(todayIso),
    },
  };
}

export function hydrateState(rawState, todayIso = getTodayISODate()) {
  if (!rawState || typeof rawState !== "object") {
    return createInitialState(todayIso);
  }

  const hydrated = {
    settings: {
      activePalette: sanitizePaletteId(rawState?.settings?.activePalette),
    },
    currentDay: todayIso,
    days: {},
  };

  if (rawState.days && typeof rawState.days === "object") {
    for (const [dateIso, dayValue] of Object.entries(rawState.days)) {
      if (isValidIsoDate(dateIso)) {
        hydrated.days[dateIso] = normalizeDay(dateIso, dayValue);
      }
    }
  }

  backfillMissingDays(hydrated, todayIso);
  hydrated.currentDay = todayIso;

  return hydrated;
}

export function getCurrentDay(state) {
  return ensureDay(state, state.currentDay);
}

export function getDay(state, dateIso) {
  return ensureDay(state, dateIso);
}

export function setTaskCompletion(state, taskId, completed, dateIso = state.currentDay) {
  const day = ensureDay(state, dateIso);
  const task = day.tasks[taskId];

  if (!task) {
    return;
  }

  task.completed = Boolean(completed);
  task.completedAt = task.completed ? new Date().toISOString() : null;
  day.stats = calculateDayStats(day);
}

export function setDayNotes(state, notes, dateIso = state.currentDay) {
  const day = ensureDay(state, dateIso);
  day.notes = normalizeNotes(notes);
}

export function markAllTasksCompleted(state, dateIso = state.currentDay) {
  const day = ensureDay(state, dateIso);
  const completedAt = new Date().toISOString();

  Object.values(day.tasks).forEach((task) => {
    task.completed = true;
    task.completedAt = task.completedAt ?? completedAt;
  });

  day.stats = calculateDayStats(day);
}

export function resetDayTasks(state, dateIso = state.currentDay) {
  const day = ensureDay(state, dateIso);

  Object.values(day.tasks).forEach((task) => {
    task.completed = false;
    task.completedAt = null;
  });

  day.stats = calculateDayStats(day);
}

export function setActivePalette(state, paletteId) {
  state.settings.activePalette = sanitizePaletteId(paletteId);
}

export function getSectionTasks(day, sectionId) {
  return Object.values(day.tasks)
    .filter((task) => task.sectionId === sectionId)
    .sort((left, right) => left.order - right.order);
}

export function getSectionProgress(day, sectionId) {
  const tasks = getSectionTasks(day, sectionId);
  const totalCount = tasks.length;
  const completedCount = tasks.filter((task) => task.completed).length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  if (completedCount === 0) {
    return {
      completedCount,
      totalCount,
      percent,
      key: "not-started",
      label: "Da iniziare",
    };
  }

  if (completedCount === totalCount) {
    return {
      completedCount,
      totalCount,
      percent,
      key: "completed",
      label: "Completata",
    };
  }

  return {
    completedCount,
    totalCount,
    percent,
    key: "in-progress",
    label: "In corso",
  };
}

export function getSectionsWithProgress(day) {
  return CHECKLIST_SECTIONS.map((section) => ({
    ...section,
    tasks: getSectionTasks(day, section.id),
    progress: getSectionProgress(day, section.id),
  }));
}
