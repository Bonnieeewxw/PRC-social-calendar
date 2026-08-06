import * as XLSX from 'xlsx';

export function exportCalendarWorkbook({ posts, campaigns, monthlyPlans }) {
const postRows = posts.flatMap(p =>
  (p.platforms || []).map(platform => ({
    'Publish Date': p.publishDate,
    Title: p.title,
    Platform: platform,
    Owner: p.owner || '',
    CSA: p.csa || '',
    Objective: p.objective || '',
    'Source Category': p.sourceCategory || '',
    Status: p.status || '',
    Link: p.link || '',
    Notes: p.notes || ''
  }))
);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(postRows), 'Posts');
  XLSX.writeFile(wb, `PRC_Social_Calendar_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
