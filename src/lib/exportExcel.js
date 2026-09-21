import * as XLSX from 'xlsx';

function getMonthLabel(publishDate) {
  if (!publishDate) return '';

  const [year, month] = publishDate.split('-').map(Number);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function getDayNumber(publishDate) {
  if (!publishDate) return '';

  return Number(publishDate.split('-')[2]);
}

export function exportCalendarWorkbook({ posts, campaigns, monthlyPlans },viewDate) {
const exportPosts = posts.filter((p) => {
  if (!p.publishDate) return false;

  const d = new Date(p.publishDate);

  return (
    d.getFullYear() === viewDate.getFullYear() &&
    d.getMonth() === viewDate.getMonth()
  );
});
const postRows = exportPosts.flatMap((p) =>
  (p.platforms || []).map((platform) => ({
    'Outcome': p.outcome || '',
    'Outcome (Level 2)': p.outcomeLevel2 || '',
    'CSA': p.csa || '',
    'Marketing Play': p.marketingPlay || '',
    'Event Workstream': p.eventWorkstream || '',
    'Event Mktg': p.eventMktg || '',
    'Event Name': p.eventName || '',
    'Audience': 'Commercial',
    'Audience (2nd Level)': p.audienceLevel2 || '',
    'Regional Content Source ( before: Content Source)': p.sourceCategory || '',
    'URL Content Type 1': p.urlContentType || '',
    'URL Content Type 2': p.urlContentTypeLevel2 || '',
    'Moment': p.moment || '',
    'Moment (2nd Level)': p.momentLevel2 || '',
    'Team-Specific Tags': p.teamSpecificTag || '',
    'E&E Moments & Campaigns': p.eeMomentsCampaign || '',
    'Content Theme': p.contentTheme || '',
    'platforms': platform,
    'Month': getMonthLabel(p.publishDate),
    'Date': getDayNumber(p.publishDate),
    'Head lines': p.title || '',
  }))
);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(postRows), 'Posts');
  XLSX.writeFile(wb, `PRC_Social_Calendar_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
