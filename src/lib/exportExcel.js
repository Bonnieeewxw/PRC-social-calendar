import * as XLSX from 'xlsx';

export function exportCalendarWorkbook({ posts, campaigns, monthlyPlans }) {
  const postRows = posts.map(p => ({
    'Publish Date': p.publishDate,
    Title: p.title,
    Platforms: (p.platforms || []).join(', '),
    Owner: p.owner || '',
    CSA: p.csa || '',
    Objective: p.objective || '',
    'Source Category': p.sourceCategory || '',
    Campaign: p.campaign || '',
    Status: p.status || '',
    Link: p.link || '',
    Notes: p.notes || '',
  }));
  const campaignRows = campaigns.map(c => ({
    Type: c.type,
    Title: c.title,
    'Start Date': c.startDate,
    'End Date': c.endDate,
    CSA: c.csa || '',
    Objective: c.objective || '',
    Status: c.status || '',
    Link: c.link || '',
    Notes: c.notes || '',
  }));
  const planRows = monthlyPlans.map(m => ({
    Month: m.month,
    Focus: m.focus || '',
    Priorities: (m.priorities || []).join('\n'),
    Events: (m.events || []).map(e => `${e.date}: ${e.title}`).join('\n'),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(postRows), 'Posts');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(campaignRows), 'Campaigns');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(planRows), 'Monthly Plans');
  XLSX.writeFile(wb, `PRC_Social_Calendar_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
