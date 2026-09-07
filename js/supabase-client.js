// ═══════════════════════════════════════════════════════════════════
// js/supabase-client.js  — Supabase Client Initialization
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL      = 'https://cfcysdzgfeldlsgpsbfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmY3lzZHpnZmVsZGxzZ3BzYmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMDAyMDgsImV4cCI6MjA5NjY3NjIwOH0.eh8ApZOzp8-CoXsFsBjnBB9PA_GUUpNiENUsv6t03Gk';

// Create a single global Supabase client (accessed as window.sb)
try {
  if (typeof supabase === 'undefined') {
    throw new Error('Supabase script from CDN did not load (check adblockers or internet connection).');
  }
  window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[i@masjid] Supabase client initialized ✅');
} catch (e) {
  console.error('[i@masjid] Failed to initialize Supabase client:', e.message);
  window.sb = null; // Set to null to indicate failure explicitly
}
