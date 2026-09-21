import { useCallback, useEffect, useMemo, useState } from 'react';
import { exportCalendarWorkbook } from './lib/exportExcel';
import {
  deleteCampaign,
  deletePost,
  loadAll,
  saveCampaign,
  saveMonthlyPlan,
  savePost,
  subscribeToRealtime,
} from './lib/dataStore';
import { csaLabels, objectiveLabels, platformColor, platformLabels, sourceLabels, statusColor, statusLabels, csaColor } from './utils/mapping';
import {
  outcomeOptions,
  outcomeLevel2Options,
} from './config/fy27Taxonomy';
import { getCalendarDays, monthKey, monthLabel, overlapsMonth, toISODate } from './utils/date';
import { csaOptions, marketingPlayOptions } from './config/fy27Taxonomy';
import { eventWorkstreamOptions, eventMktgOptions, eventNameOptions } from './config/fy27Taxonomy';
import { audienceLevel2Options } from './config/fy27Taxonomy';
import { momentOptions, momentLevel2Options } from './config/fy27Taxonomy';
import { urlContentTypeOptions, urlContentTypeLevel2Options } from './config/fy27Taxonomy';
import { contentThemeOptions, teamSpecificTagOptions, eeMomentsCampaignOptions } from './config/fy27Taxonomy';
const defaultPost = (date) => ({
  id: crypto.randomUUID(), publishDate: date, title: '', platforms: ['WeChat'],
  csa: 'AI Business Solutions', marketingPlay: '', eventWorkstream: '', eventMktg: 'Not Aligned to an Event', eventName: '', objective: 'Consideration', outcome: 'Consideration', outcomeLevel2: '', sourceCategory: 'Local - Locally Created',
  originalAssetLink: '', finalAssetLink: '', notes: '',
});

const defaultCampaign = (date) => ({
  id: crypto.randomUUID(), title: '', startDate: date, endDate: date, type: 'Campaign',
  csa: 'AI Business Solutions', objective: 'Awareness', sourceCategory: 'Local - Locally Created',
  status: 'Planned', notes: '', link: '',
});

function normalizeSearch(value) { return String(value || '').trim().toLowerCase(); }

function App() {
  const [viewDate, setViewDate] = useState(new Date());
  const [data, setData] = useState({ posts: [], campaigns: [], monthlyPlans: [], mode: 'loading' });
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [editingPost, setEditingPost] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [dragPostId, setDragPostId] = useState(null);
  const [message, setMessage] = useState('Loading calendar...');

  const refresh = useCallback(async () => {
    const loaded = await loadAll();
    setData(loaded);
    setMessage(loaded.mode === 'supabase' ? 'Realtime sync connected' : 'Local demo mode - configure Supabase for team realtime editing');
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToRealtime(refresh);
    return unsubscribe;
  }, [refresh]);

  const currentKey = monthKey(viewDate);
  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);

  const filteredPosts = useMemo(() => {
    const q = normalizeSearch(search);
    return data.posts.filter((post) => {
      const text = normalizeSearch([post.title, post.csa, post.objective, post.sourceCategory, post.status, post.campaign, post.notes, post.platforms?.join(' ')].join(' '));
      return (!q || text.includes(q)) && (platformFilter === 'All' || post.platforms?.includes(platformFilter));
    });
  }, [data.posts, platformFilter, search]);

  const monthPosts = useMemo(() => filteredPosts.filter((post) => post.publishDate?.startsWith(currentKey)), [filteredPosts, currentKey]);
  const monthCampaigns = useMemo(() => data.campaigns.filter((item) => overlapsMonth(item.startDate, item.endDate, currentKey)), [data.campaigns, currentKey]);

  function shiftMonth(delta) { setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1)); }

  async function onSavePost(post) {
    const saved = await savePost(post, data);
    setData((current) => ({ ...current, posts: current.posts.some((p) => p.id === saved.id) ? current.posts.map((p) => p.id === saved.id ? saved : p) : [...current.posts, saved] }));
    setEditingPost(null); setMessage('Post saved');
  }
  async function onDeletePost(id) {
    await deletePost(id, data);
    setData((current) => ({ ...current, posts: current.posts.filter((p) => p.id !== id) }));
    setEditingPost(null); setMessage('Post deleted');
  }
  async function onSaveCampaign(item) {
    const saved = await saveCampaign(item, data);
    setData((current) => ({ ...current, campaigns: current.campaigns.some((c) => c.id === saved.id) ? current.campaigns.map((c) => c.id === saved.id ? saved : c) : [...current.campaigns, saved] }));
    setEditingCampaign(null); setMessage('Campaign/Event saved');
  }
  async function onDeleteCampaign(id) {
    await deleteCampaign(id, data);
    setData((current) => ({ ...current, campaigns: current.campaigns.filter((c) => c.id !== id) }));
    setEditingCampaign(null); setMessage('Campaign/Event deleted');
  }
  async function onSavePlan(plan) {
    const saved = await saveMonthlyPlan(plan, data);
    setData((current) => ({ ...current, monthlyPlans: current.monthlyPlans.some((p) => p.month === saved.month) ? current.monthlyPlans.map((p) => p.month === saved.month ? saved : p) : [...current.monthlyPlans, saved] }));
    setEditingPlan(false); setMessage('Monthly planning saved');
  }
  async function movePostToDate(id, date) {
    const post = data.posts.find((item) => item.id === id);
    if (post) await onSavePost({ ...post, publishDate: date });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div><h1>PRC Social Calendar</h1><p>Bold Platform style · PRC organic social planning · realtime-ready</p></div>
        <div className="top-actions">
          <button className="btn" onClick={() => exportCalendarWorkbook(data, viewDate)}>Export Excel</button>
          <button className="btn primary" onClick={() => setEditingPost(defaultPost(toISODate(new Date())))}>+ New Post</button>
          <button className="btn" onClick={() => setEditingCampaign(defaultCampaign(toISODate(new Date())))}>+ New Campaign/Event</button>
        </div>
      </header>

      <section className="notice"><strong>{data.mode === 'supabase' ? 'Team realtime editing is on.' : 'Demo mode.'}</strong><span>{message}</span></section>
      <section className="toolbar">
        <button className="btn" onClick={() => shiftMonth(-1)}>‹</button><span className="month-label">{monthLabel(viewDate)}</span><button className="btn" onClick={() => shiftMonth(1)}>›</button>
        <button className="btn" onClick={() => setViewDate(new Date())}>Today</button>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, campaign, source..." />
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}><option>All</option>{platformLabels.map((platform) => <option key={platform}>{platform}</option>)}</select>
      </section>

      <Dashboard posts={monthPosts} />
      <PlanningPanel campaigns={monthCampaigns} onEditCampaign={setEditingCampaign} />
      <div className="csa-legend">
        <strong>CSA</strong>
        {Object.entries(csaColor).filter(([label]) => !['Cloud and AI Platform', 'X-CSA', 'Others'].includes(label)).map(([label, color]) => (
          <span key={label}>
            <i style={{ background: color }}></i>
            {label}
          </span>
        ))}
      </div>
      <main className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="weekday">{day}</div>)}
        {calendarDays.map((date, index) => {
          const dateKey = toISODate(date);
      
          const todayKey = toISODate(new Date());
          const isToday = dateKey === todayKey;
      
          const weekStartIndex = Math.floor(index / 7) * 7;
          const weekStart = toISODate(calendarDays[weekStartIndex]);
          const weekEnd = toISODate(calendarDays[weekStartIndex + 6]);
          const dayPosts = filteredPosts.filter((post) => post.publishDate === dateKey);
          const weekCampaigns = data.campaigns
            .filter((item) => item.startDate && item.endDate && item.startDate <= weekEnd && item.endDate >= weekStart)
            .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate) || a.title.localeCompare(b.title));
          const isOutside = date.getMonth() !== viewDate.getMonth();
          return (
            <section key={dateKey} className={`day ${isOutside ? 'muted' : ''} ${isToday ? 'today' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.stopPropagation(); if (dragPostId) movePostToDate(dragPostId, dateKey); }}
              onClick={() => setEditingPost(defaultPost(dateKey))}
            >
              <div className="date-label">{date.getMonth() + 1}/{date.getDate()}</div>
              <div className="campaign-stack">
                {weekCampaigns.map((item) => {
                  const active = dateKey >= item.startDate && dateKey <= item.endDate;
                  if (!active) return <div key={item.id} className="campaign-placeholder" />;
                  const startsHere = dateKey === item.startDate || index % 7 === 0;
                  const endsHere = dateKey === item.endDate || index % 7 === 6;
                  const segment = startsHere && endsHere ? 'single' : startsHere ? 'start' : endsHere ? 'end' : 'middle';
                  return <CampaignPill key={item.id} item={item} segment={segment} showTitle={startsHere}
                    onClick={(event) => { event.stopPropagation(); setEditingCampaign(item); }} />;
                })}
              </div>
              {dayPosts.map((post) => <PostCard key={post.id} post={post}
                onClick={(event) => { event.stopPropagation(); setEditingPost(post); }}
                onDragStart={() => setDragPostId(post.id)} />)}
            </section>
          );
        })}
      </main>

      {editingPost && <PostEditor post={editingPost} onCancel={() => setEditingPost(null)} onSave={onSavePost} onDelete={onDeletePost} />}
      {editingCampaign && <CampaignEditor item={editingCampaign} onCancel={() => setEditingCampaign(null)} onSave={onSaveCampaign} onDelete={onDeleteCampaign} />}
    </div>
  );
}

function Dashboard({ posts }) {
  return <section className="dashboard">
    <MetricCard title="CSA" subtitle="Monthly post distribution" counts={countBy(posts, 'csa')} labels={csaOptions} colors={csaColor} totalCount={posts.length}/>
    <MetricCard title="Content Source" subtitle="按来源分类" counts={countBy(posts, 'sourceCategory')} labels={sourceLabels} totalCount={posts.length}/>
    <MetricCard title="Outcome" subtitle="按目标分类" counts={countBy(posts, 'outcome')} labels={outcomeOptions} totalCount={posts.length}/>
  </section>;
}
function MetricCard({ title, subtitle, counts, labels, colors = {}, totalCount }) {
  const total = totalCount ?? labels.reduce((sum, label) => sum + (counts[label] || 0), 0);444
  return <div className="metric-card"><div className="card-head"><div><strong>{title}</strong><span>{subtitle}</span></div><b>{total}</b></div>
    {labels.map((label, index) => { const count = counts[label] || 0; const pct = Math.round(count / Math.max(1, total) * 100); const color = colors[label] || ['#60A5FA','#8B5CF6','#F59E0B','#34D399','#FB7185'][index % 5]; return <div className="metric-row" key={label}><span title={label}>{label}</span><b>{count}</b><div className="bar"><i style={{ width: `${pct}%`, background: color }} /></div><em>{pct}%</em></div>; })}
  </div>;
}
function PlanningPanel({ campaigns, onEditCampaign }) {
  return <section className="planning-row events-only"><div className="events-card"><div className="panel-head"><strong>Upcoming campaigns & events</strong></div><div className="event-list">
    {campaigns.slice().sort((a,b) => a.startDate.localeCompare(b.startDate)).slice(0,10).map((item) =>
    <button
      key={item.id}
      className={`upcoming-campaign ${
        item.type === 'Holiday'
         ? 'holiday'
         : item.type === 'Event'
          ? 'event'
          : 'campaign'
      }`}
      onClick={() => onEditCampaign(item)}
      >
        <strong>{item.title}</strong><span>{item.startDate} → {item.endDate}</span>
      </button>)}
  </div></div></section>;
}
function PostCard({ post, onClick, onDragStart }) {
  return <article className="post-card" style={{ borderLeft: `6px solid ${csaColor[post.csa] || '#94A3B8'}` }} draggable onDragStart={onDragStart} onClick={onClick}>
    <div className="platforms">{(post.platforms || []).slice(0,3).map((platform) => <span key={platform} style={platform === 'Toutiao'? { background: '#FFFFFF',color: '#D13438',border: '1px solid #D13438'}:{ background: platformColor[platform] || '#64748B' }}>{platform}</span>)}{(post.platforms || []).length > 3 && <span className="more">+{post.platforms.length - 3}</span>}</div>
    <strong>{post.title}</strong><div className="meta"><span className="tag outcome">{post.objective}</span><span className="tag source">{post.sourceCategory}</span></div>
    {post.link && <a className="post-link" href={post.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Open link</a>}
  </article>;
}
function CampaignPill({ item, segment = 'single', showTitle = true, onClick }) {
  return <button className={`campaign-pill ${item.type === 'Holiday'? 'holiday': item.type === 'Event'? 'event': 'campaign'} segment-${segment}`} onClick={onClick} title={`${item.title} · ${item.startDate} to ${item.endDate}`}>
    <span className="campaign-title">{showTitle ? item.title : '\u00A0'}</span>
  </button>;
}
function PostEditor({ post, onCancel, onSave, onDelete }) {
  const [draft, setDraft] = useState(post);
  const selectedOutcome =
  draft.outcome ||
  outcomeOptions.find((item) =>
    String(draft.objective || '').startsWith(item)
  ) ||
  '';

const availableOutcomeLevel2 =
  outcomeLevel2Options[selectedOutcome] || [];
const selectedOutcomeLevel2 = draft.outcomeLevel2 || availableOutcomeLevel2.find((item) => item.toLowerCase().replace(/-/g, '').replace(/\s/g, '') === String(draft.objective || '').toLowerCase().replace(/–/g, '').replace(/-/g, '').replace(/\s/g, '')) || '';
  function togglePlatform(platform) { const exists = draft.platforms?.includes(platform); setDraft({ ...draft, platforms: exists ? draft.platforms.filter((p) => p !== platform) : [...(draft.platforms || []), platform] }); }
  return <Modal title="Edit Post" onCancel={onCancel}>
    <div className="post-editor-grid">
    <div className="editor-section-title">Basic Information</div>
    <label className="full-width">Headline<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
    <label>Date<input type="date" value={draft.publishDate} onChange={(e) => setDraft({ ...draft, publishDate: e.target.value })} /></label>
    <div className="check-row full-width">{platformLabels.map((p) => <label key={p}><input type="checkbox" checked={draft.platforms?.includes(p)} onChange={() => togglePlatform(p)} />{p}</label>)}</div>
    <div className="editor-section-title">Core Reporting Tags</div>
    <label>CSA<select value={draft.csa || ''} onChange={(e) => setDraft({ ...draft, csa: e.target.value, marketingPlay: '' })}>{csaOptions.map(v => <option key={v}>{v}</option>)}</select></label>    
    <label>Marketing Play<select value={draft.marketingPlay || ''} onChange={(e) => setDraft({ ...draft, marketingPlay: e.target.value })}><option value="">Select Marketing Play</option>{(marketingPlayOptions[draft.csa] || []).map(v => <option key={v}>{v}</option>)}</select></label>
    <label>Event Workstream<select value={draft.eventWorkstream || ''} onChange={(e) => setDraft({ ...draft, eventWorkstream: e.target.value })}><option value="">Select Event Workstream</option>{eventWorkstreamOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    <label>Event (Mktg)<select value={draft.eventMktg || ''} onChange={(e) => setDraft({ ...draft, eventMktg: e.target.value, eventName: '' })}><option value="">Select Event</option>{eventMktgOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    {draft.eventMktg && draft.eventMktg !== 'Not Aligned to an Event' && <label>Event Name<select value={draft.eventName || ''} onChange={(e) => setDraft({ ...draft, eventName: e.target.value })}><option value="">Select Event Name</option>{(eventNameOptions[draft.eventMktg] || []).map(v => <option key={v} value={v}>{v}</option>)}</select></label>}
    <label>Audience (2nd Level)<select value={draft.audienceLevel2 || ''} onChange={(e) => setDraft({ ...draft, audienceLevel2: e.target.value })}><option value="">Select Audience</option>{audienceLevel2Options.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    <label>Moment<select value={draft.moment || ''} onChange={(e) => setDraft({ ...draft, moment: e.target.value, momentLevel2: '' })}><option value="">Select Moment</option>{momentOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    {(momentLevel2Options[draft.moment] || []).length > 0 && <label>Moment (2nd Level)<select value={draft.momentLevel2 || ''} onChange={(e) => setDraft({ ...draft, momentLevel2: e.target.value })}><option value="">Select Moment (2nd Level)</option>{(momentLevel2Options[draft.moment] || []).map(v => <option key={v} value={v}>{v}</option>)}</select></label>}
    <label>URL Content Type (1st Level)<select value={draft.urlContentType || ''} onChange={(e) => setDraft({ ...draft, urlContentType: e.target.value, urlContentTypeLevel2: '' })}><option value="">Select URL Content Type</option>{urlContentTypeOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    {(urlContentTypeLevel2Options[draft.urlContentType] || []).length > 0 && <label>URL Content Type (2nd Level)<select value={draft.urlContentTypeLevel2 || ''} onChange={(e) => setDraft({ ...draft, urlContentTypeLevel2: e.target.value })}><option value="">Select URL Content Type (2nd Level)</option>{(urlContentTypeLevel2Options[draft.urlContentType] || []).map(v => <option key={v} value={v}>{v}</option>)}</select></label>}
    <label>Content Theme<select value={draft.contentTheme || ''} onChange={(e) => setDraft({ ...draft, contentTheme: e.target.value })}><option value="">Select Content Theme</option>{contentThemeOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    <label>Outcome<select value={selectedOutcome} onChange={(e) => { const nextOutcome = e.target.value; setDraft({ ...draft, outcome: nextOutcome, outcomeLevel2: '', objective: nextOutcome }); }}><option value="">Select Outcome</option>{outcomeOptions.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
    {availableOutcomeLevel2.length > 0 && <label>Outcome Level 2<select value={selectedOutcomeLevel2} onChange={(e) => { const nextLevel2 = e.target.value; setDraft({ ...draft, outcomeLevel2: nextLevel2, objective: nextLevel2 }); }}><option value="">Select Outcome Level 2</option>{availableOutcomeLevel2.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>}
    <label>Content Source<select value={draft.sourceCategory} onChange={(e) => setDraft({ ...draft, sourceCategory: e.target.value })}>{sourceLabels.map(v => <option key={v}>{v}</option>)}</select></label>
    <div className="editor-section-title">Additional Tags</div>
    <label>Team-Specific Tags<select value={draft.teamSpecificTag || ''} onChange={(e) => setDraft({ ...draft, teamSpecificTag: e.target.value })}><option value="">Select Team-Specific Tag</option>{teamSpecificTagOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    <label>E&E Moments & Campaigns<select value={draft.eeMomentsCampaign || ''} onChange={(e) => setDraft({ ...draft, eeMomentsCampaign: e.target.value })}><option value="">Select E&E Moment / Campaign</option>{eeMomentsCampaignOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
    <div className="editor-section-title">Links & Notes</div>
    <label>Original Asset Link<input value={draft.originalAssetLink || ''} onChange={(e) => setDraft({ ...draft, originalAssetLink: e.target.value })} placeholder="Source article, brief or original asset" /></label>
    <label>Final Asset Link<input value={draft.finalAssetLink || ''} onChange={(e) => setDraft({ ...draft, finalAssetLink: e.target.value })} placeholder="Final copy, video or approved asset" /></label>
    <label className="full-width">Notes<textarea value={draft.notes || ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
    </div>
    <div className="modal-actions"><button className="danger" onClick={() => onDelete(draft.id)}>Delete</button><button onClick={onCancel}>Cancel</button><button className="primary" onClick={() => onSave(draft)}>Save</button></div>
  </Modal>;
}
function CampaignEditor({ item, onCancel, onSave, onDelete }) {
  const [draft, setDraft] = useState(item);
  return <Modal title="Edit Campaign/Event" onCancel={onCancel}>
    <label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
    <label>Start<input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></label>
    <label>End<input type="date" value={draft.endDate} min={draft.startDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></label>
    <label>Type<select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option>Campaign</option><option>Event</option><option>Holiday</option></select></label>
    <label>Link<input value={draft.link || ''} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="活动链接" /></label>
    <label>Notes<textarea value={draft.notes || ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
    <div className="modal-actions"><button className="danger" onClick={() => onDelete(draft.id)}>Delete</button><button onClick={onCancel}>Cancel</button><button className="primary" onClick={() => onSave({ ...draft, endDate: draft.endDate < draft.startDate ? draft.startDate : draft.endDate })}>Save</button></div>
  </Modal>;
}
function Modal({ title, children, onCancel }) { return <div className="modal-backdrop" onMouseDown={onCancel}><section className="modal" onMouseDown={(e) => e.stopPropagation()}><h2>{title}</h2>{children}</section></div>; }
function countBy(rows, field) { return rows.reduce((acc, row) => { const key = row[field] || 'Unspecified'; acc[key] = (acc[key] || 0) + 1; return acc; }, {}); }
export default App;
