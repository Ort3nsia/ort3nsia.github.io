// Rendering HTML dell'interfaccia.

import { CHECKLIST_SECTIONS } from "./data/checklist-data.js";
import { MASSAGE_GUIDE } from "./data/massage-data.js";
import { getHistoryRows } from "./history.js";
import { PALETTES } from "./settings.js";
import { getCurrentDay, getDay, getSectionProgress, getSectionsWithProgress } from "./state.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDisplayDate(dateIso) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateIso}T00:00:00`));
}

function formatShortTime(dateString) {
  if (!dateString) {
    return "";
  }

  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function renderStatusChip(status) {
  return `<span class="status-chip status-chip--${status.key}">${escapeHtml(status.label)}</span>`;
}

function renderHeader(day, currentDayIso) {
  return `
    <header class="app-header">
      <section class="surface-card hero-card">
        <div class="header-top">
          <span class="badge">SPA RECEPTION</span>
          <button type="button" class="icon-button" data-action="open-settings" aria-label="Apri impostazioni">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3.75 13.6 6.7a1 1 0 0 0 .75.51l3.33.46-2.41 2.35a1 1 0 0 0-.28.87l.58 3.3-2.97-1.42a1 1 0 0 0-.86 0l-2.97 1.42.58-3.3a1 1 0 0 0-.28-.87L6.32 7.67l3.33-.46a1 1 0 0 0 .75-.51L12 3.75Z" />
              <circle cx="12" cy="12" r="2.65" />
            </svg>
            <span>Impostazioni</span>
          </button>
        </div>

        <div class="summary-stack">
          <div class="panel-header">
            <h1 class="hero-title">Checklist SPA Giornaliera</h1>
            <p class="muted" style="text-transform: capitalize;">${escapeHtml(formatDisplayDate(currentDayIso))}</p>
          </div>

          <div class="summary-inline">
            <div class="stat-pill">
              <strong>${day.stats.completedCount}/${day.stats.totalCount}</strong>
              <span class="muted">task completate</span>
            </div>
            <div class="stat-pill">
              <strong>${day.stats.percent}%</strong>
              <span class="muted">avanzamento</span>
            </div>
          </div>

          <div class="progress-wrap" aria-hidden="true">
            <div class="progress-bar" style="width: ${day.stats.percent}%;"></div>
          </div>
        </div>
      </section>
    </header>
  `;
}

function renderFilterRow(activeSectionId) {
  const items = [
    {
      id: "all",
      label: "Tutte",
    },
    ...CHECKLIST_SECTIONS.map((section) => ({
      id: section.id,
      label: section.label,
    })),
  ];

  return `
    <div class="filter-row" aria-label="Filtro sezioni">
      ${items
        .map(
          (item) => `
            <button
              type="button"
              class="filter-pill ${activeSectionId === item.id ? "is-active" : ""}"
              data-action="set-filter"
              data-section="${escapeHtml(item.id)}"
            >
              ${escapeHtml(item.label)}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTodaySection(section) {
  return `
    <section class="surface-card section-card">
      <div class="section-head">
        <div class="section-title-group">
          <div class="section-title-row">
            <h2 class="section-title">${escapeHtml(section.label)}</h2>
            ${renderStatusChip(section.progress)}
          </div>
          <p class="section-count">${section.progress.completedCount}/${section.progress.totalCount} completate</p>
        </div>

        <div class="metric-badge">${section.progress.percent}%</div>
      </div>

      <ul class="task-list">
        ${section.tasks
          .map(
            (task) => `
              <li class="task-item ${task.completed ? "is-complete" : ""}">
                <label class="task-label" for="task-${escapeHtml(task.id)}">
                  <input
                    id="task-${escapeHtml(task.id)}"
                    class="task-checkbox"
                    type="checkbox"
                    data-action="toggle-task"
                    data-task-id="${escapeHtml(task.id)}"
                    ${task.completed ? "checked" : ""}
                  />
                  <span class="task-copy">
                    <span class="task-title">${escapeHtml(task.label)}</span>
                    <span class="task-meta">${task.completed ? `Completata alle ${escapeHtml(formatShortTime(task.completedAt))}` : "Da fare"}</span>
                  </span>
                </label>
              </li>
            `,
          )
          .join("")}
      </ul>
    </section>
  `;
}

function renderNotesCard(day) {
  const notes = day.notes ?? "";
  const notesCount = notes.trim().length;

  return `
    <section class="surface-card notes-card">
      <div class="section-head">
        <div class="section-title-group">
          <div class="section-title-row">
            <h2 class="section-title">Note del giorno</h2>
            ${notesCount > 0 ? '<span class="status-chip status-chip--in-progress">Salvate</span>' : '<span class="status-chip status-chip--not-started">Vuote</span>'}
          </div>
          <p class="section-count">Queste note vengono salvate nel giorno corrente e restano nello storico.</p>
        </div>
        <div class="metric-badge">${notesCount} caratteri</div>
      </div>

      <label class="sr-only" for="daily-notes">Note del giorno</label>
      <textarea
        id="daily-notes"
        class="notes-textarea"
        data-action="update-notes"
        placeholder="Scrivi qui promemoria, anomalie, prodotti mancanti, clienti particolari o qualsiasi nota utile per oggi..."
      >${escapeHtml(notes)}</textarea>
      <p class="inline-note">Salvataggio automatico immediato in locale.</p>
    </section>
  `;
}

function renderTodayPanel(state, uiState) {
  const day = getCurrentDay(state);
  const filteredSections = getSectionsWithProgress(day).filter((section) => {
    return uiState.activeSection === "all" || section.id === uiState.activeSection;
  });

  return `
    <section class="app-main" aria-labelledby="oggi-title">
      <div class="panel-header">
        <h2 id="oggi-title" class="panel-title">Oggi</h2>
        <p class="muted">Checklist divisa per aree con salvataggio automatico locale.</p>
      </div>

      ${renderFilterRow(uiState.activeSection)}

      <div class="section-list">
        ${filteredSections.length > 0 ? filteredSections.map(renderTodaySection).join("") : '<div class="empty-state">Nessuna sezione trovata per questo filtro.</div>'}
      </div>

      ${renderNotesCard(day)}
    </section>
  `;
}

function renderHistoryPanel(state) {
  const rows = getHistoryRows(state.days);

  return `
    <section class="app-main" aria-labelledby="storico-title">
      <div class="panel-header">
        <h2 id="storico-title" class="panel-title">Storico</h2>
        <p class="muted">Tutti i giorni salvati restano in locale e possono essere riaperti in dettaglio.</p>
      </div>

      <div class="history-list">
        ${rows
          .map(
            (row) => `
              <article class="surface-card history-card">
                <button
                  type="button"
                  class="history-button"
                  data-action="open-history-detail"
                  data-date="${escapeHtml(row.date)}"
                  aria-label="Apri dettaglio del giorno ${escapeHtml(row.date)}"
                >
                  <div class="history-head">
                    <div class="panel-header">
                      <h3>${escapeHtml(formatDisplayDate(row.date))}</h3>
                      <p class="muted">${escapeHtml(row.date)}</p>
                    </div>
                    ${renderStatusChip(row.status)}
                  </div>

                  <div class="history-foot">
                    <div class="history-metrics">
                      <span class="metric-badge">${row.completedCount}/${row.totalCount} completate</span>
                      <span class="metric-badge">${row.percent}%</span>
                      ${row.hasNotes ? '<span class="metric-badge">Con note</span>' : ""}
                    </div>
                    <span class="muted">Apri dettaglio</span>
                  </div>
                </button>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderMassagePanel(uiState) {
  return `
    <section class="app-main" aria-labelledby="massaggi-title">
      <div class="panel-header">
        <h2 id="massaggi-title" class="panel-title">Massaggi</h2>
        <p class="muted">Promemoria consultabile, organizzato per fasi del trattamento.</p>
      </div>

      <div class="massage-list">
        ${MASSAGE_GUIDE.map((phase) => {
          const isOpen = uiState.openMassageIds.has(phase.id);
          return `
            <article class="surface-card massage-card ${isOpen ? "is-open" : ""}">
              <button
                type="button"
                class="accordion-trigger"
                data-action="toggle-massage-phase"
                data-phase-id="${escapeHtml(phase.id)}"
                aria-expanded="${isOpen ? "true" : "false"}"
              >
                <div class="accordion-head">
                  <div style="display:flex; gap:0.85rem; align-items:flex-start;">
                    <span class="phase-badge">${phase.number}</span>
                    <div class="panel-header">
                      <h3>${escapeHtml(phase.title)}</h3>
                      <p class="muted">${escapeHtml(phase.subtitle)}</p>
                    </div>
                  </div>
                  <span class="accordion-icon" aria-hidden="true">+</span>
                </div>
              </button>

              ${
                isOpen
                  ? `
                    <div class="accordion-body">
                      <ul class="massage-steps">
                        ${phase.steps.map((step) => `<li class="massage-step">${escapeHtml(step)}</li>`).join("")}
                      </ul>
                    </div>
                  `
                  : ""
              }
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderTabbar(activeTab) {
  const tabs = [
    { id: "today", label: "Oggi", subtitle: "Checklist" },
    { id: "history", label: "Storico", subtitle: "Giorni" },
    { id: "massages", label: "Massaggi", subtitle: "Guida" },
  ];

  return `
    <nav class="tabbar" aria-label="Navigazione principale">
      <div class="tabbar-inner surface-card">
        ${tabs
          .map(
            (tab) => `
              <button
                type="button"
                class="tab-button ${activeTab === tab.id ? "is-active" : ""}"
                data-action="set-tab"
                data-tab="${escapeHtml(tab.id)}"
              >
                <span>${escapeHtml(tab.label)}</span>
                <small>${escapeHtml(tab.subtitle)}</small>
              </button>
            `,
          )
          .join("")}
      </div>
    </nav>
  `;
}

function renderSettingsModal(activePalette) {
  return `
    <div class="modal-root" aria-modal="true" role="dialog" aria-labelledby="settings-title">
      <button type="button" class="modal-overlay" data-action="close-settings" aria-label="Chiudi impostazioni"></button>
      <section class="modal-panel surface-card">
        <div class="modal-content">
          <div class="modal-header">
            <div class="panel-header">
              <span class="badge">Personalizzazione</span>
              <h2 id="settings-title" class="panel-title">Impostazioni</h2>
              <p class="muted">Palette, azioni rapide e backup in JSON.</p>
            </div>
            <button type="button" class="icon-button" data-action="close-settings" aria-label="Chiudi impostazioni">
              Chiudi
            </button>
          </div>

          <section class="settings-section settings-card surface-card">
            <div class="panel-header">
              <h3>Palette colori</h3>
              <p class="muted">La palette selezionata viene salvata automaticamente in locale.</p>
            </div>

            <div class="palette-grid">
              ${PALETTES.map(
                (palette) => `
                  <button
                    type="button"
                    class="palette-button ${activePalette === palette.id ? "is-active" : ""}"
                    data-action="set-palette"
                    data-palette="${escapeHtml(palette.id)}"
                    aria-pressed="${activePalette === palette.id ? "true" : "false"}"
                  >
                    <div class="panel-header">
                      <strong>${escapeHtml(palette.name)}</strong>
                      <span class="muted">${escapeHtml(palette.description)}</span>
                    </div>
                    <div class="palette-swatches" aria-hidden="true">
                      ${palette.swatches
                        .map((swatch) => `<span class="palette-swatch" style="background:${escapeHtml(swatch)};"></span>`)
                        .join("")}
                    </div>
                  </button>
                `,
              ).join("")}
            </div>
          </section>

          <section class="settings-section settings-card surface-card">
            <div class="panel-header">
              <h3>Azioni rapide</h3>
              <p class="muted">Il reset agisce solo sul giorno corrente e non cancella lo storico passato.</p>
            </div>

            <div class="modal-actions">
              <button type="button" class="primary-button" data-action="mark-all-completed">Segna tutto completato</button>
              <button type="button" class="danger-button" data-action="reset-current-day">Reset manuale</button>
              <button type="button" class="secondary-button" data-action="export-json">Esporta dati JSON</button>
            </div>
          </section>
        </div>
      </section>
    </div>
  `;
}

function renderHistoryDetailModal(state, dateIso) {
  const day = getDay(state, dateIso);
  const sections = CHECKLIST_SECTIONS.map((section) => ({
    ...section,
    tasks: Object.values(day.tasks)
      .filter((task) => task.sectionId === section.id)
      .sort((left, right) => left.order - right.order),
    progress: getSectionProgress(day, section.id),
  }));

  return `
    <div class="modal-root" aria-modal="true" role="dialog" aria-labelledby="history-detail-title">
      <button type="button" class="modal-overlay" data-action="close-history-detail" aria-label="Chiudi dettaglio storico"></button>
      <section class="modal-panel surface-card">
        <div class="modal-content">
          <div class="modal-header">
            <div class="panel-header">
              <span class="badge">Dettaglio giorno</span>
              <h2 id="history-detail-title" class="panel-title">${escapeHtml(formatDisplayDate(dateIso))}</h2>
              <p class="muted">${day.stats.completedCount}/${day.stats.totalCount} completate • ${day.stats.percent}%</p>
            </div>
            <button type="button" class="icon-button" data-action="close-history-detail" aria-label="Chiudi dettaglio storico">
              Chiudi
            </button>
          </div>

          ${day.notes?.trim()
            ? `
              <section class="surface-card detail-card">
                <div class="panel-header">
                  <h3>Note salvate</h3>
                  <p class="muted">Appunti registrati per questa giornata.</p>
                </div>
                <div class="note-preview">${escapeHtml(day.notes)}</div>
              </section>
            `
            : ""
          }

          <div class="section-list">
            ${sections
              .map(
                (section) => `
                  <section class="surface-card detail-card">
                    <div class="section-head">
                      <div class="section-title-group">
                        <div class="section-title-row">
                          <h3 class="section-title">${escapeHtml(section.label)}</h3>
                          ${renderStatusChip(section.progress)}
                        </div>
                        <p class="section-count">${section.progress.completedCount}/${section.progress.totalCount} completate</p>
                      </div>
                      <div class="metric-badge">${section.progress.percent}%</div>
                    </div>

                    <ul class="detail-section-list">
                      ${section.tasks
                        .map(
                          (task) => `
                            <li class="detail-task-item ${task.completed ? "is-complete" : ""}">
                              <span class="detail-task-check">${task.completed ? "✓" : ""}</span>
                              <div class="task-copy">
                                <span class="detail-task-text">${escapeHtml(task.label)}</span>
                                <span class="task-meta">${task.completed ? `Completata alle ${escapeHtml(formatShortTime(task.completedAt))}` : "Non completata"}</span>
                              </div>
                            </li>
                          `,
                        )
                        .join("")}
                    </ul>
                  </section>
                `,
              )
              .join("")}
          </div>
        </div>
      </section>
    </div>
  `;
}

export function renderApp({ state, uiState }) {
  const currentDay = getCurrentDay(state);

  let panelMarkup = renderTodayPanel(state, uiState);
  if (uiState.activeTab === "history") {
    panelMarkup = renderHistoryPanel(state);
  }
  if (uiState.activeTab === "massages") {
    panelMarkup = renderMassagePanel(uiState);
  }

  return `
    <div class="app-shell">
      ${renderHeader(currentDay, state.currentDay)}
      ${panelMarkup}
      ${renderTabbar(uiState.activeTab)}
      ${uiState.isSettingsOpen ? renderSettingsModal(state.settings.activePalette) : ""}
      ${uiState.historyDetailDate ? renderHistoryDetailModal(state, uiState.historyDetailDate) : ""}
    </div>
  `;
}
