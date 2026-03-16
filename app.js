/*
  Logica applicativa della checklist SPA.
  I dati statici sono in data.js, gli stili in styles.css.
*/

// -------------------------------
    // Configurazione attività
    // -------------------------------
            // -------------------------------
    // Chiavi localStorage
    // -------------------------------
        // -------------------------------
    // Stato applicazione
    // -------------------------------
    let state = {
      currentDate: "",
      tasksState: {},
      completionTimes: {},
      dailyNotes: "",
      history: [],
      lastCompletedTask: null
    };

    let currentView = "today";
    let currentSectionFilter = "all";
    let currentTheme = "emerald";
    let saveToastTimer = null;

        // -------------------------------
    // Elementi DOM
    // -------------------------------
    const elements = {
      currentDateLabel: document.getElementById("currentDateLabel"),
      statusSummary: document.getElementById("statusSummary"),
      progressPercent: document.getElementById("progressPercent"),
      progressBar: document.getElementById("progressBar"),
      sectionsContainer: document.getElementById("sectionsContainer"),
      dailyNotes: document.getElementById("dailyNotes"),
      historyList: document.getElementById("historyList"),
      saveToast: document.getElementById("saveToast"),
      sectionFilters: document.getElementById("sectionFilters"),
      todayView: document.getElementById("todayView"),
      historyView: document.getElementById("historyView"),
      massageView: document.getElementById("massageView"),
      massageQuickNav: document.getElementById("massageQuickNav"),
      massageContainer: document.getElementById("massageContainer"),
      lastCompletedBox: document.getElementById("lastCompletedBox"),
      lastCompletedText: document.getElementById("lastCompletedText"),
      todayBtn: document.getElementById("todayBtn"),
      historyBtn: document.getElementById("historyBtn"),
      massageBtn: document.getElementById("massageBtn"),
      completeAllBtn: document.getElementById("completeAllBtn"),
      resetBtn: document.getElementById("resetBtn"),
      exportBtn: document.getElementById("exportBtn"),
      themeEmerald: document.getElementById("themeEmerald"),
      themeCipria: document.getElementById("themeCipria"),
      themeColorMeta: document.getElementById("themeColorMeta")
    };

    // -------------------------------
    // Utility
    // -------------------------------
    function getLocalISODate() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function getCurrentTimeString() {
      return new Date().toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    function formatDateLong(isoDate) {
      const [y, m, d] = isoDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    }

    function formatDateShort(isoDate) {
      const [y, m, d] = isoDate.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function csvEscape(value) {
      const str = String(value ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    }

    function showSavedToast(message = "Salvato") {
      elements.saveToast.textContent = message;
      elements.saveToast.classList.add("show");
      clearTimeout(saveToastTimer);
      saveToastTimer = setTimeout(() => {
        elements.saveToast.classList.remove("show");
      }, 1300);
    }

    function loadTheme() {
      const storedTheme = loadFromStorage(STORAGE_KEYS.theme, "emerald");
      currentTheme = THEMES[storedTheme] ? storedTheme : "emerald";
      applyTheme(false);
    }

    function persistTheme(showToast = false) {
      localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(currentTheme));
      if (showToast) showSavedToast("Palette aggiornata");
    }

    function renderThemeOptions() {
      [elements.themeEmerald, elements.themeCipria].forEach(button => {
        const isActive = button.dataset.theme === currentTheme;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-checked", String(isActive));
      });
    }

    
function applyTheme(showToast = false) {
      if (!THEMES[currentTheme]) currentTheme = "emerald";
      document.body.dataset.theme = currentTheme;
      renderThemeOptions();
      if (elements.themeColorMeta) {
        elements.themeColorMeta.setAttribute("content", THEMES[currentTheme].themeColor);
      }
      persistTheme(showToast);
    }


    function createEmptyTasksState() {
      const obj = {};
      TASKS.forEach(task => {
        obj[task.id] = false;
      });
      return obj;
    }

    function loadFromStorage(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    }

    function persist(showToast = true) {
      localStorage.setItem(STORAGE_KEYS.currentDate, JSON.stringify(state.currentDate));
      localStorage.setItem(STORAGE_KEYS.tasksState, JSON.stringify(state.tasksState));
      localStorage.setItem(STORAGE_KEYS.completionTimes, JSON.stringify(state.completionTimes));
      localStorage.setItem(STORAGE_KEYS.dailyNotes, JSON.stringify(state.dailyNotes));
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
      localStorage.setItem(STORAGE_KEYS.lastCompletedTask, JSON.stringify(state.lastCompletedTask));

      if (showToast) showSavedToast();
    }

    function loadState() {
      state.currentDate = loadFromStorage(STORAGE_KEYS.currentDate, getLocalISODate());
      state.tasksState = loadFromStorage(STORAGE_KEYS.tasksState, createEmptyTasksState());
      state.completionTimes = loadFromStorage(STORAGE_KEYS.completionTimes, {});
      state.dailyNotes = loadFromStorage(STORAGE_KEYS.dailyNotes, "");
      state.history = loadFromStorage(STORAGE_KEYS.history, []);
      state.lastCompletedTask = loadFromStorage(STORAGE_KEYS.lastCompletedTask, null);

      // Garanzia robusta: se manca qualche task nello stato, la aggiungiamo
      TASKS.forEach(task => {
        if (typeof state.tasksState[task.id] !== "boolean") {
          state.tasksState[task.id] = false;
        }
      });
    }

    function buildDaySnapshot(dateString) {
      const completedCount = TASKS.filter(task => !!state.tasksState[task.id]).length;
      const percent = Math.round((completedCount / TOTAL_TASKS) * 100);

      return {
        date: dateString,
        tasksState: { ...state.tasksState },
        completionTimes: { ...state.completionTimes },
        dailyNotes: state.dailyNotes || "",
        lastCompletedTask: state.lastCompletedTask || null,
        completedCount,
        totalTasks: TOTAL_TASKS,
        percent
      };
    }

    function archivePreviousDayIfNeeded(previousDate) {
      // Evitiamo di archiviare giornate completamente vuote e inutili
      const hasCompleted = Object.values(state.tasksState).some(Boolean);
      const hasNotes = (state.dailyNotes || "").trim().length > 0;

      if (!hasCompleted && !hasNotes) return;

      const snapshot = buildDaySnapshot(previousDate);

      // Rimpiazza se già esiste quella data, altrimenti aggiunge
      const existingIndex = state.history.findIndex(item => item.date === previousDate);
      if (existingIndex >= 0) {
        state.history[existingIndex] = snapshot;
      } else {
        state.history.unshift(snapshot);
      }

      // Mantieni lo storico completo ordinato dal più recente
      state.history = state.history
        .sort((a, b) => b.date.localeCompare(a.date));
    }

    function resetCurrentDayData(newDate) {
      state.currentDate = newDate;
      state.tasksState = createEmptyTasksState();
      state.completionTimes = {};
      state.dailyNotes = "";
      state.lastCompletedTask = null;
    }

    /*
      Reset giornaliero:
      - non usa timer in background
      - controlla la data locale del dispositivo
      - se la data è cambiata: archivia il giorno precedente e crea nuova giornata
    */
    function ensureCurrentDay() {
      const today = getLocalISODate();

      if (!state.currentDate) {
        state.currentDate = today;
        persist(false);
        return;
      }

      if (state.currentDate !== today) {
        archivePreviousDayIfNeeded(state.currentDate);
        resetCurrentDayData(today);
        persist(false);
      }
    }

    function getCompletedCount() {
      return TASKS.filter(task => !!state.tasksState[task.id]).length;
    }

    function getProgressPercent() {
      return Math.round((getCompletedCount() / TOTAL_TASKS) * 100);
    }

    function getSectionProgress(sectionId) {
      const tasks = TASKS.filter(task => task.sectionId === sectionId);
      const completed = tasks.filter(task => !!state.tasksState[task.id]).length;
      return {
        completed,
        total: tasks.length,
        done: completed === tasks.length
      };
    }

    function setView(view) {
      currentView = view;

      const todayActive = view === "today";
      const historyActive = view === "history";
      const massageActive = view === "massage";

      elements.todayView.classList.toggle("active", todayActive);
      elements.historyView.classList.toggle("active", historyActive);
      elements.massageView.classList.toggle("active", massageActive);

      elements.todayBtn.classList.toggle("active", todayActive);
      elements.historyBtn.classList.toggle("active", historyActive);
      elements.massageBtn.classList.toggle("active", massageActive);


      if (historyActive) renderHistory();
      if (massageActive) renderMassage();

      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function setSectionFilter(sectionId) {
      currentSectionFilter = sectionId;
      renderSectionFilters();
      renderSections();
    }

    // -------------------------------
    // Render intestazione e progressi
    // -------------------------------
    function renderHeader() {
      elements.currentDateLabel.textContent = formatDateLong(state.currentDate);

      const completed = getCompletedCount();
      const percent = getProgressPercent();

      elements.statusSummary.textContent = `${completed} / ${TOTAL_TASKS} completate`;
      elements.progressPercent.textContent = `${percent}%`;
      elements.progressBar.style.width = `${percent}%`;

      if (state.lastCompletedTask && state.lastCompletedTask.label) {
        const time = state.lastCompletedTask.time ? ` · ${state.lastCompletedTask.time}` : "";
        elements.lastCompletedText.textContent = `${state.lastCompletedTask.label}${time}`;
        elements.lastCompletedBox.classList.add("show");
      } else {
        elements.lastCompletedBox.classList.remove("show");
      }
    }

    // -------------------------------
    // Render filtri sezione
    // -------------------------------
    function renderSectionFilters() {
      const allChips = [
        { id: "all", label: "Tutte" },
        ...SECTIONS.map(section => ({ id: section.id, label: section.title }))
      ];

      elements.sectionFilters.innerHTML = allChips.map(chip => `
        <button
          type="button"
          class="chip ${currentSectionFilter === chip.id ? "active" : ""}"
          data-filter="${escapeHtml(chip.id)}"
        >
          ${escapeHtml(chip.label)}
        </button>
      `).join("");

      elements.sectionFilters.querySelectorAll("[data-filter]").forEach(btn => {
        btn.addEventListener("click", () => {
          setSectionFilter(btn.dataset.filter);
        });
      });
    }

    // -------------------------------
    // Render sezione attività
    // -------------------------------
    function renderSections() {
      const visibleSections = currentSectionFilter === "all"
        ? SECTIONS
        : SECTIONS.filter(section => section.id === currentSectionFilter);

      elements.sectionsContainer.innerHTML = visibleSections.map(section => {
        const sectionTasks = TASKS.filter(task => task.sectionId === section.id);
        const progress = getSectionProgress(section.id);

        return `
          <section class="card section-card" id="section-${escapeHtml(section.id)}" aria-label="${escapeHtml(section.title)}">
            <div class="section-head">
              <div class="section-title-wrap">
                <h2 class="section-title">Sezione ${escapeHtml(section.title)}</h2>
                <div class="section-sub">${progress.completed} / ${progress.total} completate</div>
              </div>
              <div class="badge ${progress.done ? "success" : ""}">
                ${progress.done ? "Sezione completata" : "In corso"}
              </div>
            </div>

            <div class="task-list">
              ${sectionTasks.map(task => {
                const checked = !!state.tasksState[task.id];
                const time = state.completionTimes[task.id] || "";
                return `
                  <div class="task ${checked ? "completed" : ""}" data-task-row="${escapeHtml(task.id)}">
                    <div class="task-check">
                      <input
                        type="checkbox"
                        id="${escapeHtml(task.id)}"
                        data-task-id="${escapeHtml(task.id)}"
                        ${checked ? "checked" : ""}
                        aria-label="${escapeHtml(task.label)}"
                      />
                    </div>
                    <div class="task-body">
                      <label for="${escapeHtml(task.id)}">${escapeHtml(task.label)}</label>
                      <div class="task-meta">
                        <span>${escapeHtml(task.sectionTitle)}</span>
                      </div>
                    </div>
                    <div class="task-time">${checked && time ? escapeHtml(time) : ""}</div>
                  </div>
                `;
              }).join("")}
            </div>
          </section>
        `;
      }).join("");

      elements.sectionsContainer.querySelectorAll("input[data-task-id]").forEach(input => {
        input.addEventListener("change", () => {
          toggleTask(input.dataset.taskId, input.checked);
        });
      });
    }

    // -------------------------------
    // Toggle attività
    // -------------------------------
    function toggleTask(taskId, isCompleted) {
      ensureCurrentDay();

      const task = TASKS.find(t => t.id === taskId);
      if (!task) return;

      state.tasksState[taskId] = isCompleted;

      if (isCompleted) {
        const time = getCurrentTimeString();
        state.completionTimes[taskId] = time;
        state.lastCompletedTask = {
          id: task.id,
          label: task.label,
          sectionId: task.sectionId,
          sectionTitle: task.sectionTitle,
          time
        };
      } else {
        delete state.completionTimes[taskId];

        if (state.lastCompletedTask && state.lastCompletedTask.id === taskId) {
          // Ricalcola l'ultima attività completata cercando l'ultimo orario presente
          const completedTasks = TASKS
            .filter(t => !!state.tasksState[t.id] && state.completionTimes[t.id])
            .map(t => ({
              id: t.id,
              label: t.label,
              sectionId: t.sectionId,
              sectionTitle: t.sectionTitle,
              time: state.completionTimes[t.id]
            }));

          state.lastCompletedTask = completedTasks.length
            ? completedTasks[completedTasks.length - 1]
            : null;
        }
      }

      persist();
      renderAll();
    }

    // -------------------------------
    // Segna tutto completato
    // -------------------------------
    function markAllCompleted() {
      ensureCurrentDay();
      const now = getCurrentTimeString();

      TASKS.forEach(task => {
        state.tasksState[task.id] = true;
        if (!state.completionTimes[task.id]) {
          state.completionTimes[task.id] = now;
        }
      });

      const lastTask = TASKS[TASKS.length - 1];
      state.lastCompletedTask = {
        id: lastTask.id,
        label: lastTask.label,
        sectionId: lastTask.sectionId,
        sectionTitle: lastTask.sectionTitle,
        time: now
      };

      persist();
      renderAll();
    }

    // -------------------------------
    // Reset manuale con conferma
    // -------------------------------
    function manualReset() {
      const confirmReset = confirm(
        "Vuoi davvero azzerare la checklist di oggi?\n\nLe attività e gli orari di oggi verranno cancellati. Lo storico già archiviato non verrà eliminato."
      );

      if (!confirmReset) return;

      state.tasksState = createEmptyTasksState();
      state.completionTimes = {};
      state.dailyNotes = "";
      state.lastCompletedTask = null;

      persist();
      renderAll();
    }

    // -------------------------------
    // Render note
    // -------------------------------
    function renderNotes() {
      elements.dailyNotes.value = state.dailyNotes || "";
    }

    function bindNotes() {
      elements.dailyNotes.addEventListener("input", () => {
        ensureCurrentDay();
        state.dailyNotes = elements.dailyNotes.value;
        persist();
      });
    }

    // -------------------------------
    // Storico
    // -------------------------------
    function getHistoryTaskLists(day) {
      const completed = [];
      const pending = [];

      TASKS.forEach(task => {
        const isDone = !!day.tasksState?.[task.id];
        const item = {
          label: task.label,
          sectionTitle: task.sectionTitle,
          time: day.completionTimes?.[task.id] || ""
        };

        if (isDone) completed.push(item);
        else pending.push(item);
      });

      return { completed, pending };
    }

    function renderHistory() {
      if (!state.history.length) {
        elements.historyList.innerHTML = `
          <div class="history-empty">
            Nessuno storico disponibile per ora. Verrà creato automaticamente al cambio della data locale.
          </div>
        `;
        return;
      }

      elements.historyList.innerHTML = state.history
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(day => {
          const { completed, pending } = getHistoryTaskLists(day);
          const noteText = (day.dailyNotes || "").trim() || "Nessuna nota inserita.";

          return `
            <details class="history-item">
              <summary>
                <div class="history-summary">
                  <div class="history-top">
                    <div class="history-date">${escapeHtml(formatDateLong(day.date))}</div>
                    <div class="history-kpis">
                      <span class="pill">${escapeHtml(String(day.percent || 0))}%</span>
                      <span class="pill">${escapeHtml(String(day.completedCount || 0))}/${escapeHtml(String(day.totalTasks || TOTAL_TASKS))}</span>
                    </div>
                  </div>
                  <div class="history-note">${escapeHtml(noteText)}</div>
                </div>
              </summary>

              <div class="history-body">
                <div class="history-group">
                  <h4>Attività completate</h4>
                  <ul class="history-ul">
                    ${
                      completed.length
                        ? completed.map(item => `
                          <li>
                            <span>${escapeHtml(item.label)}</span>
                            <span>${escapeHtml(item.time || "—")}</span>
                          </li>
                        `).join("")
                        : `<li><span>Nessuna attività completata</span><span>—</span></li>`
                    }
                  </ul>
                </div>

                <div class="history-group">
                  <h4>Attività non completate</h4>
                  <ul class="history-ul">
                    ${
                      pending.length
                        ? pending.map(item => `
                          <li>
                            <span>${escapeHtml(item.label)}</span>
                            <span>Non completata</span>
                          </li>
                        `).join("")
                        : `<li><span>Tutte completate</span><span>✓</span></li>`
                    }
                  </ul>
                </div>
              </div>
            </details>
          `;
        }).join("");
    }

    // -------------------------------
    // Export dati
    // -------------------------------
    function exportData() {
      ensureCurrentDay();

      // Includiamo anche il giorno corrente in un export completo
      const exportPayload = {
        exportedAt: new Date().toISOString(),
        currentDay: buildDaySnapshot(state.currentDate),
        history: state.history
      };

      // JSON
      const jsonBlob = new Blob(
        [JSON.stringify(exportPayload, null, 2)],
        { type: "application/json" }
      );

      // CSV
      const rows = [];
      rows.push([
        "date",
        "section",
        "taskId",
        "taskLabel",
        "completed",
        "completionTime",
        "dailyNotes",
        "completedCount",
        "totalTasks",
        "percent"
      ]);

      const allDays = [buildDaySnapshot(state.currentDate), ...state.history];

      allDays.forEach(day => {
        TASKS.forEach(task => {
          rows.push([
            day.date,
            task.sectionTitle,
            task.id,
            task.label,
            day.tasksState?.[task.id] ? "yes" : "no",
            day.completionTimes?.[task.id] || "",
            day.dailyNotes || "",
            day.completedCount ?? "",
            day.totalTasks ?? TOTAL_TASKS,
            day.percent ?? ""
          ]);
        });
      });

      const csvContent = rows
        .map(row => row.map(csvEscape).join(","))
        .join("\n");

      const csvBlob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
      });

      downloadBlob(jsonBlob, `spa-checklist-storico-${state.currentDate}.json`);
      setTimeout(() => {
        downloadBlob(csvBlob, `spa-checklist-storico-${state.currentDate}.csv`);
      }, 220);
    }

    function downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 800);
    }


    // -------------------------------
    // Sequenza massaggio
    // -------------------------------
    function renderMassage() {
      elements.massageQuickNav.innerHTML = MASSAGE_SEQUENCE.map((step, index) => `
        <a href="#massage-${escapeHtml(step.id)}">${index + 1}. ${escapeHtml(step.title)}</a>
      `).join("");

      elements.massageContainer.innerHTML = MASSAGE_SEQUENCE.map((step, index) => `
        <section class="card massage-step-card" id="massage-${escapeHtml(step.id)}" aria-label="${escapeHtml(step.title)}">
          <div class="massage-step-top">
            <div class="massage-step-no">${index + 1}</div>
            <div class="massage-step-info">
              <h3 class="massage-step-title">${escapeHtml(step.title)}</h3>
              <div class="massage-step-sub">${escapeHtml(step.subtitle)}</div>
            </div>
          </div>

          <ol class="massage-list">
            ${step.steps.map(item => `
              <li>
                <div class="massage-line">${escapeHtml(item.line)}</div>
                ${
                  item.details && item.details.length
                    ? `
                      <ul class="massage-sublist">
                        ${item.details.map(detail => `<li>${escapeHtml(detail)}</li>`).join("")}
                      </ul>
                    `
                    : ""
                }
              </li>
            `).join("")}
          </ol>

          ${index === MASSAGE_SEQUENCE.length - 1 ? `
            <div class="massage-footer-note">
              Promemoria consultivo: la sequenza è sempre disponibile qui come riferimento rapido, separata dalla checklist giornaliera.
            </div>
          ` : ""}
        </section>
      `).join("");
    }

    // -------------------------------
    // Render completo
    // -------------------------------
    function renderAll() {
      renderThemeOptions();
      renderHeader();
      renderSectionFilters();
      renderSections();
      renderNotes();
      renderMassage();
      if (currentView === "history") renderHistory();
    }

    // -------------------------------
    // Eventi globali
    // -------------------------------
    function bindEvents() {
      elements.todayBtn.addEventListener("click", () => setView("today"));
      elements.historyBtn.addEventListener("click", () => setView("history"));
      elements.massageBtn.addEventListener("click", () => setView("massage"));
      elements.themeEmerald.addEventListener("click", () => {
        currentTheme = "emerald";
        applyTheme(true);
      });
      elements.themeCipria.addEventListener("click", () => {
        currentTheme = "cipria";
        applyTheme(true);
      });

      elements.completeAllBtn.addEventListener("click", markAllCompleted);
      elements.resetBtn.addEventListener("click", manualReset);
      elements.exportBtn.addEventListener("click", exportData);

      bindNotes();

      // Controllo giornaliero quando la pagina torna visibile
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          const before = state.currentDate;
          ensureCurrentDay();
          if (before !== state.currentDate) renderAll();
        }
      });

      // Controllo giornaliero anche all'interazione
      ["focus", "pageshow"].forEach(eventName => {
        window.addEventListener(eventName, () => {
          const before = state.currentDate;
          ensureCurrentDay();
          if (before !== state.currentDate) renderAll();
        });
      });
    }



function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      // Nessun blocco: l'app continua a funzionare anche senza service worker.
    });
  });
}

    // -------------------------------
    // Init
    // -------------------------------
    function init() {
      loadTheme();
      loadState();
      ensureCurrentDay();
      bindEvents();
      renderAll();
      registerServiceWorker();
    }

    init();
