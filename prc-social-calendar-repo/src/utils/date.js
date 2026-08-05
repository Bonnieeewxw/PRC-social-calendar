export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(date) {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getCalendarDays(viewDate) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function overlapsMonth(startDate, endDate, key) {
  if (!startDate && !endDate) return false;
  const start = String(startDate || endDate);
  const end = String(endDate || startDate);
  const monthStart = `${key}-01`;
  const monthEndDate = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0);
  const monthEnd = `${key}-${String(monthEndDate.getDate()).padStart(2, '0')}`;
  return start <= monthEnd && end >= monthStart;
}

export function visibleCampaignDate(item, key) {
  const monthStart = `${key}-01`;
  if (item.startDate < monthStart && item.endDate >= monthStart) return monthStart;
  return item.startDate;
}
