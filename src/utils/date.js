function pad(value) { return String(value).padStart(2, '0'); }

export function toISODate(date) {
  if (typeof date === 'string') return date.slice(0, 10);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function monthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
}

export function getCalendarDays(viewDate) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function overlapsMonth(startDate, endDate, key) {
  if (!startDate || !endDate || !key) return false;
  const monthStart = `${key}-01`;
  const [year, month] = key.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${key}-${pad(lastDay)}`;
  return startDate <= monthEnd && endDate >= monthStart;
}

// Kept for compatibility with any other file that still imports it.
export function visibleCampaignDate(item, currentKey) {
  if (!item?.startDate) return '';
  return item.startDate < `${currentKey}-01` ? `${currentKey}-01` : item.startDate;
}
