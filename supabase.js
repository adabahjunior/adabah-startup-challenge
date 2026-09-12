// supabase.js - Supabase Database Client for The ADABAH Startup Challenge 2026
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://shvnajqmpwnppnvvienx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodm5hanFtcHducHBudnZpZW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNTMzMjIsImV4cCI6MjEwNDcyOTMyMn0.f65SueQ2n387QaPLw2yr3M1o7eukp-e3JReR_szJp68';

let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
  });
  console.log('✅ Supabase Client initialized for project:', process.env.SUPABASE_PROJECT_REF || 'startup');
} else {
  console.warn('⚠️ Supabase credentials not found in environment. Falling back to local storage.');
}

// Convert DB snake_case row to frontend camelCase object
function toAppModel(row) {
  if (!row) return null;
  return {
    id: row.id,
    submittedAt: row.submitted_at,
    status: row.status,
    statusNotes: row.status_notes,
    score: row.score,
    startupName: row.startup_name,
    tagline: row.tagline,
    foundedYear: row.founded_year,
    stage: row.stage,
    track: row.track,
    website: row.website,
    country: row.country,
    city: row.city,
    founderName: row.founder_name,
    founderEmail: row.founder_email,
    founderPhone: row.founder_phone,
    founderRole: row.founder_role,
    academicLevel: row.academic_level,
    teamSize: row.team_size,
    primaryGoal: row.primary_goal,
    problem: row.problem,
    solution: row.solution,
    traction: row.traction,
    fundingRaised: row.funding_raised,
    deckUrl: row.deck_url,
    videoUrl: row.video_url,
    heardFrom: row.heard_from,
    team: Array.isArray(row.team) ? row.team : (typeof row.team === 'string' ? JSON.parse(row.team || '[]') : []),
    deliverables: Array.isArray(row.deliverables) ? row.deliverables : (typeof row.deliverables === 'string' ? JSON.parse(row.deliverables || '[]') : []),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Convert frontend camelCase object to DB snake_case row
function toDbRow(data) {
  return {
    id: data.id,
    submitted_at: data.submittedAt || new Date().toISOString(),
    status: data.status || 'submitted',
    status_notes: data.statusNotes || 'Application submitted successfully. Under preliminary compliance and eligibility screening.',
    score: data.score !== undefined ? data.score : null,
    startup_name: data.startupName,
    tagline: data.tagline || '',
    founded_year: data.foundedYear || '2026',
    stage: data.stage,
    track: data.track,
    website: data.website || '',
    country: data.country || 'Ghana',
    city: data.city || '',
    founder_name: data.founderName,
    founder_email: data.founderEmail,
    founder_phone: data.founderPhone || '',
    founder_role: data.founderRole || 'Founder',
    academic_level: data.academicLevel || '',
    team_size: Number(data.teamSize) || 2,
    primary_goal: data.primaryGoal || '',
    problem: data.problem,
    solution: data.solution,
    traction: data.traction || '',
    funding_raised: data.fundingRaised || 'Bootstrapped',
    deck_url: data.deckUrl || '',
    video_url: data.videoUrl || '',
    heard_from: data.heardFrom || 'Direct Website',
    team: data.team || [],
    deliverables: data.deliverables || [],
    updated_at: new Date().toISOString()
  };
}

// Test connection
async function checkConnection() {
  if (!supabase) return { connected: false, error: 'No client' };
  try {
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return {
      connected: true,
      projectRef: process.env.SUPABASE_PROJECT_REF || 'shvnajqmpwnppnvvienx',
      url: SUPABASE_URL,
      totalApplications: count
    };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

// Fetch all applications with optional filters
async function getApplications({ track, status, search } = {}) {
  if (!supabase) return null;
  try {
    let query = supabase
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (track && track !== 'all') {
      query = query.ilike('track', track);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(
        `startup_name.ilike.%${search}%,id.ilike.%${search}%,founder_name.ilike.%${search}%,founder_email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toAppModel);
  } catch (err) {
    console.error('Supabase getApplications error:', err.message);
    return null;
  }
}

// Get single application by ID or email
async function getApplicationById(identifier) {
  if (!supabase || !identifier) return null;
  const idTrimmed = identifier.trim().toLowerCase();
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .or(`id.ilike.${idTrimmed},founder_email.ilike.${idTrimmed}`)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? toAppModel(data) : null;
  } catch (err) {
    console.error('Supabase getApplicationById error:', err.message);
    return null;
  }
}

// Save new application
async function saveApplication(appData) {
  if (!supabase) return null;
  try {
    const row = toDbRow(appData);
    const { data, error } = await supabase
      .from('applications')
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return toAppModel(data);
  } catch (err) {
    console.error('Supabase saveApplication error:', err.message);
    return null;
  }
}

// Update application status/score/team/deliverables
async function updateApplication(id, updates) {
  if (!supabase) return null;
  try {
    const dbUpdates = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.score !== undefined) dbUpdates.score = updates.score;
    if (updates.statusNotes !== undefined) dbUpdates.status_notes = updates.statusNotes;
    if (updates.team !== undefined) dbUpdates.team = updates.team;
    if (updates.deliverables !== undefined) dbUpdates.deliverables = updates.deliverables;
    if (updates.teamSize !== undefined) dbUpdates.team_size = Number(updates.teamSize);
    if (updates.deckUrl !== undefined) dbUpdates.deck_url = updates.deckUrl;
    if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
    if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
    if (updates.website !== undefined) dbUpdates.website = updates.website;
    if (updates.primaryGoal !== undefined) dbUpdates.primary_goal = updates.primaryGoal;

    const { data, error } = await supabase
      .from('applications')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toAppModel(data);
  } catch (err) {
    console.error('Supabase updateApplication error:', err.message);
    return null;
  }
}

// Save partner inquiry
async function saveInquiry(inquiryData) {
  if (!supabase) return null;
  try {
    const row = {
      id: inquiryData.id || `INQ-${Date.now()}`,
      name: inquiryData.name,
      email: inquiryData.email,
      type: inquiryData.type || 'Sponsorship',
      message: inquiryData.message || '',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('inquiries')
      .insert([row])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase saveInquiry error:', err.message);
    return null;
  }
}

module.exports = {
  client: supabase,
  checkConnection,
  getApplications,
  getApplicationById,
  saveApplication,
  updateApplication,
  saveInquiry
};
