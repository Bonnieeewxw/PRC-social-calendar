import { supabase, isSupabaseConfigured } from './supabaseClient';
import { seedPosts, seedCampaigns, seedMonthlyPlans } from '../data/seedData';

const LS_KEY = 'prc-social-calendar-local-v1';

function localInitial() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return JSON.parse(raw);
  const data = { posts: seedPosts, campaigns: seedCampaigns, monthlyPlans: seedMonthlyPlans };
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return data;
}

function saveLocal(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY }));
}

function toDbPost(post) {
  return {
    id: post.id,
    publish_date: post.publishDate,
    title: post.title,
    platforms: post.platforms || [],
    owner: post.owner || '',
    csa: post.csa || '',
    marketing_play: post.marketingPlay || '',
    event_workstream: post.eventWorkstream || '',
    event_mktg: post.eventMktg || '',
    event_name: post.eventMktg === 'Not Aligned to an Event' ? '' : (post.eventName || ''),
    audience_level2: post.audienceLevel2 || '',
    moment: post.moment || '',
    moment_level2: post.momentLevel2 || '',
    url_content_type: post.urlContentType || '',
    url_content_type_level2: post.urlContentTypeLevel2 || '',
    content_theme: post.contentTheme || '',
    team_specific_tag: post.teamSpecificTag || '',
    ee_moments_campaign: post.eeMomentsCampaign || '',
    outcome: post.outcome || '',
    outcome_level2: post.outcomeLevel2 || (post.objective && post.objective !== post.outcome ? post.objective : '') || '',
    objective: post.objective || '',
    source_category: post.sourceCategory || '',
    campaign: post.campaign || '',
    status: post.status || 'Planned',
    notes: post.notes || '',
    link: post.link || '',
  };
}
function fromDbPost(row) {
  return {
    id: row.id,
    publishDate: row.publish_date,
    title: row.title,
    platforms: row.platforms || [],
    owner: row.owner || '',
    csa: row.csa || '',
    marketingPlay: row.marketing_play || '',
    eventWorkstream: row.event_workstream || '',
    eventMktg: row.event_mktg || '',
    eventName: row.event_name || '',
    audienceLevel2: row.audience_level2 || '',
    moment: row.moment || '',
    momentLevel2: row.moment_level2 || '',
    urlContentType: row.url_content_type || '',
    urlContentTypeLevel2: row.url_content_type_level2 || '',
    contentTheme: row.content_theme || '',
    teamSpecificTag: row.team_specific_tag || '',
    eeMomentsCampaign: row.ee_moments_campaign || '',
    outcome: row.outcome || '',
    outcomeLevel2: row.outcome_level2 || '',
    objective: row.objective || '',
    sourceCategory: row.source_category || '',
    campaign: row.campaign || '',
    status: row.status || 'Planned',
    notes: row.notes || '',
    link: row.link || '',
  };
}
function toDbCampaign(item) {
  return {
    id: item.id,
    title: item.title,
    start_date: item.startDate,
    end_date: item.endDate,
    type: item.type || 'Campaign',
    csa: item.csa || '',
    objective: item.objective || '',
    source_category: item.sourceCategory || '',
    status: item.status || 'Planned',
    notes: item.notes || '',
    link: item.link || '',
  };
}
function fromDbCampaign(row) {
  return {
    id: row.id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    type: row.type || 'Campaign',
    csa: row.csa || '',
    objective: row.objective || '',
    sourceCategory: row.source_category || '',
    status: row.status || 'Planned',
    notes: row.notes || '',
    link: row.link || '',
  };
}
function toDbPlan(plan) {
  return {
    month: plan.month,
    focus: plan.focus || '',
    priorities: plan.priorities || [],
    events: plan.events || [],
    source_counts: plan.sourceCounts || [],
    outcome_counts: plan.outcomeCounts || [],
  };
}
function fromDbPlan(row) {
  return {
    month: row.month,
    focus: row.focus || '',
    priorities: row.priorities || [],
    events: row.events || [],
    sourceCounts: row.source_counts || [],
    outcomeCounts: row.outcome_counts || [],
  };
}

export async function loadAll() {
  if (!isSupabaseConfigured) return { ...localInitial(), mode: 'local' };
  const [postsRes, campaignsRes, plansRes] = await Promise.all([
    supabase.from('posts').select('*').order('publish_date'),
    supabase.from('campaigns').select('*').order('start_date'),
    supabase.from('monthly_plans').select('*').order('month'),
  ]);
  if (postsRes.error) throw postsRes.error;
  if (campaignsRes.error) throw campaignsRes.error;
  if (plansRes.error) throw plansRes.error;
  return {
    posts: postsRes.data.map(fromDbPost),
    campaigns: campaignsRes.data.map(fromDbCampaign),
    monthlyPlans: plansRes.data.map(fromDbPlan),
    mode: 'supabase',
  };
}

export async function seedSupabase() {
  if (!isSupabaseConfigured) return;
  await supabase.from('posts').upsert(seedPosts.map(toDbPost));
  await supabase.from('campaigns').upsert(seedCampaigns.map(toDbCampaign));
  await supabase.from('monthly_plans').upsert(seedMonthlyPlans.map(toDbPlan));
}

export async function savePost(post, currentData) {
  if (!isSupabaseConfigured) {
    const data = { ...currentData, posts: currentData.posts.some(p => p.id === post.id) ? currentData.posts.map(p => p.id === post.id ? post : p) : [...currentData.posts, post] };
    saveLocal(data);
    return post;
  }
  const { data, error } = await supabase.from('posts').upsert(toDbPost(post)).select().single();
  if (error) throw error;
  return fromDbPost(data);
}

export async function deletePost(id, currentData) {
  if (!isSupabaseConfigured) {
    saveLocal({ ...currentData, posts: currentData.posts.filter(p => p.id !== id) });
    return;
  }
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

export async function saveCampaign(item, currentData) {
  if (!isSupabaseConfigured) {
    const data = { ...currentData, campaigns: currentData.campaigns.some(c => c.id === item.id) ? currentData.campaigns.map(c => c.id === item.id ? item : c) : [...currentData.campaigns, item] };
    saveLocal(data);
    return item;
  }
  const { data, error } = await supabase.from('campaigns').upsert(toDbCampaign(item)).select().single();
  if (error) throw error;
  return fromDbCampaign(data);
}

export async function deleteCampaign(id, currentData) {
  if (!isSupabaseConfigured) {
    saveLocal({ ...currentData, campaigns: currentData.campaigns.filter(c => c.id !== id) });
    return;
  }
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
}

export async function saveMonthlyPlan(plan, currentData) {
  if (!isSupabaseConfigured) {
    const data = { ...currentData, monthlyPlans: currentData.monthlyPlans.some(p => p.month === plan.month) ? currentData.monthlyPlans.map(p => p.month === plan.month ? plan : p) : [...currentData.monthlyPlans, plan] };
    saveLocal(data);
    return plan;
  }
  const { data, error } = await supabase.from('monthly_plans').upsert(toDbPlan(plan)).select().single();
  if (error) throw error;
  return fromDbPlan(data);
}

export function subscribeToRealtime(onChange) {
  if (!isSupabaseConfigured) {
    const handler = (event) => { if (!event.key || event.key === LS_KEY) onChange(); };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
  const channel = supabase
    .channel('prc-social-calendar-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_plans' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
