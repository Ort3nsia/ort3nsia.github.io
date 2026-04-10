// Helper dedicati allo storico.

export function sortIsoDatesDesc(dates) {
  return [...dates].sort((left, right) => right.localeCompare(left));
}

export function getDayStatus(day) {
  const completedCount = day?.stats?.completedCount ?? 0;
  const totalCount = day?.stats?.totalCount ?? 0;

  if (totalCount === 0 || completedCount === 0) {
    return { key: "not-started", label: "Da iniziare" };
  }

  if (completedCount === totalCount) {
    return { key: "completed", label: "Completata" };
  }

  return { key: "in-progress", label: "In corso" };
}

export function getHistoryRows(daysMap) {
  return sortIsoDatesDesc(Object.keys(daysMap)).map((date) => {
    const day = daysMap[date];
    const status = getDayStatus(day);

    return {
      date,
      completedCount: day.stats.completedCount,
      totalCount: day.stats.totalCount,
      percent: day.stats.percent,
      hasNotes: Boolean(day.notes?.trim()),
      status,
    };
  });
}
