import { useCallback, useEffect, useMemo, useState } from 'react';
import { exportCalendarWorkbook } from './lib/exportExcel';
import {
  deleteCampaign,
  deletePost,
  loadAll,
  saveCampaign,
  saveMonthlyPlan,
  savePost,
  seedSupabase,
  subscribeToRealtime,
} from './lib/dataStore';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { csaLabels, objectiveLabels, platformColor, platformLabels, sourceLabels, statusColor, statusLabels } from './utils/mapping';
import { getCalendarDays, monthKey, monthLabel, overlapsMonth, toISODate, visibleCampaignDate } from './utils/date';

const defaultPost = (date) => ({
  id: crypto.randomUUID(),
  publishDate: date,
  title: '',
  platforms: ['WeChat'],
  owner: '',
  csa: 'AI Business Solutions',
  objective: 'Consideration – Product Education',
  sourceCategory: 'Local Creation',
  campaign: '',
  status: 'Planned',
  notes: '',
  link: '',
});

const defaultCampaign = (date) => ({
  id: crypto.randomUUID(),
  title: '',
  startDate: date,
  endDate: date,
  type: 'Campaign',
  csa: 'AI Business Solutions',
  objective: 'Awareness – Broad Reach',
  sourceCategory: 'Local Creation',
  status: 'Planned',
  notes: '',
  link: '',
});

function normalizeSearch(value) {
  return String(value || '').trim().toLowerCase();
}

function App() {
  const [viewDate, setViewDate] = useState(new Date(2026, 7, 1));
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
      const matchesText = !q || text.includes(q);
      const matchesPlatform = platformFilter === 'All' || post.platforms?.includes(platformFilter);
      return matchesText && matchesPlatform;
    });
  }, [data.posts, platformFilter, search]);

  const monthPosts = useMemo(() => filteredPosts.filter((post) => post.publishDate?.startsWith(currentKey)), [filteredPosts, currentKey]);
  const monthCampaigns = useMemo(() => data.campaigns.filter((item) => overlapsMonth(item.startDate, item.endDate, currentKey)), [data.campaigns, currentKey]);
  const monthPlan = useMemo(() => data.monthlyPlans.find((plan) => plan.month === currentKey) || { month: currentKey, focus: '', priorities: [], events: [] }, [data.monthlyPlans, currentKey]);

  function shiftMonth(delta) {
    setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + delta, 1));
  }

  async function onSavePost(post) {
    const saved = await savePost(post, data);
    setData((current) => ({
      ...current,
      posts: current.posts.some((p) => p.id === saved.id) ? current.posts.map((p) => (p.id === saved.id ? saved : p)) : [...current.posts, saved],
    }));
    setEditingPost(null);
    setMessage('Post saved');
  }

  async function onDeletePost(id) {
    await deletePost(id, data);
    setData((current) => ({ ...current, posts: current.posts.filter((p) => p.id !== id) }));
    setEditingPost(null);
    setMessage('Post deleted');
  }

  async function onSaveCampaign(item) {
    const saved = await saveCampaign(item, data);
    setData((current) => ({
      ...current,
      campaigns: current.campaigns.some((c) => c.id === saved.id) ? current.campaigns.map((c) => (c.id === saved.id ? saved : c)) : [...current.campaigns, saved],
    }));
    setEditingCampaign(null);
    setMessage('Campaign/Event saved');
  }

  async function onDeleteCampaign(id) {
    await deleteCampaign(id, data);
    setData((current) => ({ ...current, campaigns: current.campaigns.filter((c) => c.id !== id) }));
    setEditingCampaign(null);
    setMessage('Campaign/Event deleted');
  }

  async function onSavePlan(plan) {
    const saved = await saveMonthlyPlan(plan, data);
    setData((current) => ({
      ...current,
      monthlyPlans: current.monthlyPlans.some((p) => p.month === saved.month) ? current.monthlyPlans.map((p) => (p.month === saved.month ? saved : p)) : [...current.monthlyPlans, saved],
    }));
    setEditingPlan(false);
    setMessage('Monthly planning saved');
  }

  async function movePostToDate(id, date) {
    const post = data.posts.find((item) => item.id === id);
    if (!post) return;
    await onSavePost({ ...post, publishDate: date });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>PRC Social Calendar</h1>
          <p>Bold Platform style · PRC organic social planning · realtime-ready</p>
        </div>
        <div className="top-actions">
          <button className="btn" onClick={() => exportCalendarWorkbook(data)}>Export Excel</button>
         
          <button className="btn primary" onClick={() => setEditingPost(defaultPost(toISODate(new Date())))}>+ New Post</button>
          <button className="btn" onClick={() => setEditingCampaign(defaultCampaign(toISODate(new Date())))}>+ New Campaign/Event</button>
        </div>
      </header>

      <section className="notice">
        <strong>{data.mode === 'supabase' ? 'Team realtime editing is on.' : 'Demo mode.'}</strong>
        <span>{message}</span>
      </section>

      <section className="toolbar">
        <button className="btn" onClick={() => shiftMonth(-1)}>‹</button>
        <span className="month-label">{monthLabel(viewDate)}</span>
        <button className="btn" onClick={() => shiftMonth(1)}>›</button>
        <button className="btn" onClick={() => setViewDate(new Date())}>Today</button>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, campaign, source..." />
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
          <option>All</option>
          {platformLabels.map((platform) => <option key={platform}>{platform}</option>)}
        </select>
      </section>

      <Dashboard posts={monthPosts} />
      <PlanningPanel campaigns={monthCampaigns} onEditCampaign={setEditingCampaign} />

      <main className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="weekday">{day}</div>)}
        {calendarDays.map((date) => {
          const dateKey = toISODate(date);
          const dayPosts = filteredPosts.filter((post) => post.publishDate === dateKey);
          const dayCampaigns = data.campaigns.filter((item) => visibleCampaignDate(item, currentKey) === dateKey);
          const isOutside = date.getMonth() !== viewDate.getMonth();
          return (
            <section
              key={dateKey}
              className={`day ${isOutside ? 'muted' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dragPostId && movePostToDate(dragPostId, dateKey)}
              onClick={() => setEditingPost(defaultPost(dateKey))}
            >
              <div className="date-label">{date.getMonth() + 1}/{date.getDate()}</div>
              {dayCampaigns.map((item) => <CampaignPill key={item.id} item={item} onClick={() => setEditingCampaign(item)} />)}
              {dayPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => setEditingPost(post)}
                  onDragStart={() => setDragPostId(post.id)}
                />
              ))}
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
  const statusCounts = countBy(posts, 'status');
  const sourceCounts = countBy(posts, 'sourceCategory');
  const objectiveCounts = countBy(posts, 'objective');
  return (
    <section className="dashboard">
      <MetricCard title="Posts" subtitle="Month overview" counts={statusCounts} labels={statusLabels} colors={statusColor} />
      <MetricCard title="Content Source" subtitle="按来源分类" counts={sourceCounts} labels={sourceLabels} />
      <MetricCard title="Outcome" subtitle="按目标分类" counts={objectiveCounts} labels={objectiveLabels} />
    </section>
  );
}

function MetricCard({ title, subtitle, counts, labels, colors = {} }) {
  const total = labels.reduce((sum, label) => sum + (counts[label] || 0), 0);
  return (
    <div className="metric-card">
      <div className="card-head"><div><strong>{title}</strong><span>{subtitle}</span></div><b>{total}</b></div>
      {labels.map((label, index) => {
        const count = counts[label] || 0;
        const pct = Math.round((count / Math.max(1, total)) * 100);
        const color = colors[label] || ['#60A5FA', '#8B5CF6', '#F59E0B', '#34D399', '#FB7185'][index % 5];
        return (
          <div className="metric-row" key={label}>
            <span title={label}>{label}</span><b>{count}</b><div className="bar"><i style={{ width: `${pct}%`, background: color }} /></div><em>{pct}%</em>
          </div>
        );
      })}
    </div>
  );
}

function PlanningPanel({ campaigns, onEditCampaign }) {
  return (
    <section className="planning-row events-only">
      <div className="events-card">
        <div className="panel-head"><strong>Upcoming campaigns & events</strong></div>
        <div className="event-list">
          {campaigns.slice(0, 10).map((item) => <CampaignPill key={item.id} item={item} onClick={() => onEditCampaign(item)} />)}
        </div>
      </div>
    </section>
  );
}


function PostCard({ post, onClick, onDragStart }) {
  const statusClass = post.status 
.toLowerCase()
.replace(/\s+/g, '-');
  return (
    <article className={`post-card ${statusClass}`} draggable onDragStart={onDragStart} onClick={onClick}>
      <div className="platforms">
        {(post.platforms || []).slice(0, 3).map((platform) => <span key={platform} style={{ background: platformColor[platform] || '#64748B' }}>{platform}</span>)}
        {(post.platforms || []).length > 3 && <span className="more">+{post.platforms.length - 3}</span>}
      </div>
      <strong>{post.title}</strong>
      <div className="meta"><span className="tag csa">{post.csa}</span><span className="tag outcome">{post.objective}</span><span className="tag source">{post.sourceCategory}</span></div>
      {post.link && <a className="post-link" href={post.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Open link</a>}
      <em style={{ background: statusColor[post.status] || '#8B5CF6' }}>{post.status}</em>
    </article>
  );
}

function CampaignPill({ item, onClick }) {
  return <button className={`campaign-pill ${item.type === 'Event' ? 'event' : ''}`} onClick={onClick}>{item.title}</button>;
}

function PostEditor({ post, onCancel, onSave, onDelete }) {
  const [draft, setDraft] = useState(post);
  function togglePlatform(platform) {
    const exists = draft.platforms?.includes(platform);
    setDraft({ ...draft, platforms: exists ? draft.platforms.filter((p) => p !== platform) : [...(draft.platforms || []), platform] });
  }
  return (
    <Modal title="Edit Post" onCancel={onCancel}>
      <label>Headline<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
      <label>Date<input type="date" value={draft.publishDate} onChange={(e) => setDraft({ ...draft, publishDate: e.target.value })} /></label>
      <div className="check-row">{platformLabels.map((p) => <label key={p}><input type="checkbox" checked={draft.platforms?.includes(p)} onChange={() => togglePlatform(p)} />{p}</label>)}</div>
      <label>Owner<input value={draft.owner || ''} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} /></label>
      <label>CSA<select value={draft.csa} onChange={(e) => setDraft({ ...draft, csa: e.target.value })}>{csaLabels.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Content Source<select value={draft.sourceCategory} onChange={(e) => setDraft({ ...draft, sourceCategory: e.target.value })}>{sourceLabels.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Outcome<select value={draft.objective} onChange={(e) => setDraft({ ...draft, objective: e.target.value })}>{objectiveLabels.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Status<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{statusLabels.map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Campaign<input value={draft.campaign || ''} onChange={(e) => setDraft({ ...draft, campaign: e.target.value })} /></label>
      <label>Link<input value={draft.link || ''} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="素材链接 / 发布链接" /></label>
      <label>Link<input value={draft.link || ''} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="活动链接" /></label>
      <label>Notes<textarea value={draft.notes || ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
      <div className="modal-actions"><button className="danger" onClick={() => onDelete(draft.id)}>Delete</button><button onClick={onCancel}>Cancel</button><button className="primary" onClick={() => onSave(draft)}>Save</button></div>
    </Modal>
  );
}

function CampaignEditor({ item, onCancel, onSave, onDelete }) {
  const [draft, setDraft] = useState(item);
  return (
    <Modal title="Edit Campaign/Event" onCancel={onCancel}>
      <label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
      <label>Start<input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} /></label>
      <label>End<input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} /></label>
      <label>Type<select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option>Campaign</option><option>Event</option></select></label>
      <label>Link<input value={draft.link || ''} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="素材链接 / 发布链接" /></label>
      <label>Notes<textarea value={draft.notes || ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label>
      <div className="modal-actions"><button className="danger" onClick={() => onDelete(draft.id)}>Delete</button><button onClick={onCancel}>Cancel</button><button className="primary" onClick={() => onSave(draft)}>Save</button></div>
    </Modal>
  );
}

function PlanEditor({ plan, onCancel, onSave }) {
  const [focus, setFocus] = useState(plan.focus || '');
  const [priorities, setPriorities] = useState((plan.priorities || []).join('\n'));
  return (
    <Modal title="Edit Monthly Planning" onCancel={onCancel}>
      <label>Focus<input value={focus} onChange={(e) => setFocus(e.target.value)} /></label>
      <label>Priorities<textarea value={priorities} onChange={(e) => setPriorities(e.target.value)} /></label>
      <div className="modal-actions"><button onClick={onCancel}>Cancel</button><button className="primary" onClick={() => onSave({ ...plan, focus, priorities: priorities.split('\n').map(x => x.trim()).filter(Boolean) })}>Save</button></div>
    </Modal>
  );
}

function Modal({ title, children, onCancel }) {
  return <div className="modal-backdrop" onMouseDown={onCancel}><section className="modal" onMouseDown={(e) => e.stopPropagation()}><h2>{title}</h2>{children}</section></div>;
}

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || 'Unspecified';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export default App;
