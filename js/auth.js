// ═══════════════════════════════════════════════════════════════════
// js/auth.js  — Custom Authentication (Bypassing Supabase Auth)
// ═══════════════════════════════════════════════════════════════════

// Get the current logged-in user profile from localStorage
function getLocalUser() {
  try {
    const data = localStorage.getItem('imasjid_profile');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// ── Recent Login Suggestions ─────────────────────────────────────
const RECENT_LOGINS_KEY = 'imasjid_recent_logins';
const MAX_SUGGESTIONS   = 3;

function saveRecentLogin(profile) {
  try {
    const initials = ((profile.first_name || '?')[0] + (profile.last_name || '?')[0]).toUpperCase();
    const entry = {
      email:       profile.email,
      displayName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      initials,
      is_admin:    !!profile.is_admin
    };
    let list = getRecentLogins();
    // Remove duplicate email and push to front
    list = list.filter(u => u.email !== entry.email);
    list.unshift(entry);
    // Keep max 3
    list = list.slice(0, MAX_SUGGESTIONS);
    localStorage.setItem(RECENT_LOGINS_KEY, JSON.stringify(list));
  } catch (e) {}
}

function getRecentLogins() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_LOGINS_KEY) || '[]');
  } catch (e) { return []; }
}

function showLoginSuggestions() {
  const list = getRecentLogins();
  const box  = document.getElementById('login-suggestions');
  if (!box || list.length === 0) return;
  renderSuggestions(list);
  box.style.display = 'block';
}

function filterLoginSuggestions(query) {
  const list = getRecentLogins();
  const box  = document.getElementById('login-suggestions');
  if (!box) return;
  const filtered = query
    ? list.filter(u => u.email.toLowerCase().includes(query.toLowerCase()) ||
                       u.displayName.toLowerCase().includes(query.toLowerCase()))
    : list;
  if (filtered.length === 0) { box.style.display = 'none'; return; }
  renderSuggestions(filtered);
  box.style.display = 'block';
}

function renderSuggestions(list) {
  const box = document.getElementById('login-suggestions');
  if (!box) return;
  const colors = ['#06b6d4', '#8b5cf6', '#f59e0b'];
  box.innerHTML = list.map((u, i) => `
    <div onclick="pickLoginSuggestion('${u.email.replace(/'/g, "\\'")}','${u.displayName.replace(/'/g, "\\'")}')"
      style="display:flex; align-items:center; gap:0.9rem; padding:0.75rem 1rem; cursor:pointer;
             border-bottom:${i < list.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'};
             transition:background 0.15s;"
      onmouseover="this.style.background='rgba(6,182,212,0.08)'"
      onmouseout="this.style.background='transparent'">
      <div style="width:36px; height:36px; border-radius:50%; background:${colors[i] || '#06b6d4'};
                  display:flex; align-items:center; justify-content:center;
                  font-weight:700; font-size:0.85rem; color:#0f172a; flex-shrink:0;">
        ${u.initials}
      </div>
      <div style="overflow:hidden;">
        <div style="font-weight:600; font-size:0.9rem; color:#f1f5f9; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${u.displayName}${u.is_admin ? ' <span style="font-size:0.7rem;color:#f59e0b;">(Admin)</span>' : ''}
        </div>
        <div style="font-size:0.78rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${u.email}
        </div>
      </div>
      <i class="fa-solid fa-arrow-right" style="margin-left:auto; color:#94a3b8; font-size:0.75rem;"></i>
    </div>
  `).join('');
}

function pickLoginSuggestion(email, name) {
  const emailInput = document.getElementById('login-email');
  const pwInput    = document.getElementById('login-password');
  if (emailInput) emailInput.value = email;
  hideLoginSuggestions();
  // Focus password field for quick login
  if (pwInput) { pwInput.focus(); }
}

function hideLoginSuggestions() {
  const box = document.getElementById('login-suggestions');
  if (box) box.style.display = 'none';
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
  const box   = document.getElementById('login-suggestions');
  const input = document.getElementById('login-email');
  if (box && input && !box.contains(e.target) && e.target !== input) {
    hideLoginSuggestions();
  }
});



// ── Login handler ────────────────────────────────────────────────
async function handleLogin(event) {
  event.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('btn-login');

  btn.disabled    = true;
  btn.innerHTML   = '⏳ Signing in…';

  try {
    if (!window.sb) {
      throw new Error("Database connection unavailable. Please check your internet or ad-blocker.");
    }

    let profileData = null;

    // 1. Query custom profiles table
    const { data: userData, error: userError } = await window.sb
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (userError) throw userError;

    if (userData) {
      profileData = userData;
    } else {
      // 2. Fallback: Query admins table
      const { data: adminData, error: adminError } = await window.sb
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

      if (adminError) throw adminError;

      if (adminData) {
        profileData = {
          id: adminData.id,
          first_name: adminData.name,
          last_name: '(Admin)',
          email: adminData.email,
          is_admin: true
        };
      }
    }

    if (!profileData) {
      showToast('❌ Invalid email or password.');
      btn.disabled  = false;
      btn.innerHTML = 'Login';
      return;
    }

    // Save profile locally
    localStorage.setItem('imasjid_profile', JSON.stringify(profileData));
    saveRecentLogin(profileData);
    showToast(`Welcome back, ${profileData.first_name}! 👋`);
    
    await loadUserRegistrations(profileData.email);
    await loadUserQurbanHistory(profileData.phone_number || profileData.email);
    renderEvents(allEvents);
    updateAuthStateUI(profileData);

    setTimeout(() => {
      window.location.hash = '#home';
    }, 100);

  } catch (err) {
    showToast('❌ Error logging in: ' + err.message);
  } finally {
    btn.disabled  = false;
    btn.innerHTML = 'Login';
  }
}

// ── Register handler ─────────────────────────────────────────────
async function handleRegister(event) {
  event.preventDefault();
  const first    = document.getElementById('reg-first').value.trim();
  const last     = document.getElementById('reg-last').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const phone    = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  const btn      = document.getElementById('btn-register');

  if (password !== confirm) {
    showToast('❌ Passwords do not match!');
    return;
  }

  btn.disabled    = true;
  btn.innerHTML   = '⏳ Creating account…';

  try {
    if (!window.sb) {
      throw new Error("Database connection unavailable. Please check your internet or ad-blocker.");
    }

    // Insert profile directly into custom profiles table
    const { data, error } = await window.sb
      .from('profiles')
      .insert({
        first_name:   first,
        last_name:    last,
        email:        email,
        phone_number: phone,
        password:     password
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique constraint') || error.code === '23505') {
        throw new Error('This email is already registered.');
      }
      throw error;
    }

    // Automatically log user in
    localStorage.setItem('imasjid_profile', JSON.stringify(data));
    showToast('✅ Welcome to i@masjid! 🌙');
    
    await loadUserRegistrations(data.email);
    await loadUserQurbanHistory(data.phone_number || data.email);
    renderEvents(allEvents);
    updateAuthStateUI(data);

    setTimeout(() => { window.location.hash = '#home'; }, 100);

  } catch (err) {
    if (err.message.includes('already registered')) {
      showToast('❌ Email already registered. Please login instead.');
      switchAuthTab('login');
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').focus();
    } else {
      showToast('❌ Registration failed: ' + err.message);
    }
  } finally {
    btn.disabled  = false;
    btn.innerHTML = 'Create Account';
  }
}

// ── Logout ───────────────────────────────────────────────────────
async function logout() {
  try {
    // 1. Wipe ALL session data from localStorage
    localStorage.removeItem('imasjid_profile');
    localStorage.removeItem('imasjid_admin');
    
    // 2. Clear global state variables
    if (typeof userRegistrations !== 'undefined') userRegistrations = new Set();

    // 3. Immediately hide the success box and show the login form
    //    so the user sees a clean page BEFORE the reload
    updateAuthStateUI(null);

    showToast('Logged out successfully. Ma\'a As-salaama! 🌙');
  } catch (err) {
    console.error('Error during logout:', err);
  } finally {
    // 4. Hard-reload the page for a 100% clean state
    setTimeout(() => { window.location.reload(); }, 800);
  }
}

// ── Check existing session on page load ──────────────────────────
async function checkAuthSession() {
  const profile = getLocalUser();
  if (profile) {
    updateAuthStateUI(profile);
    await loadUserRegistrations(profile.email);
    await loadUserQurbanHistory(profile.phone_number || profile.email);
    renderEvents(allEvents);
  } else {
    updateAuthStateUI(null);
  }
}

// ── Load User Qurban History ──────────────────────────────────────
async function loadUserQurbanHistory(identifier) {
  if (!identifier) return;
  try {
    const { data, error } = await window.sb.from('korban_participants')
      .select(`
        id, parts_qty, payment_status, registered_at,
        korban_campaigns ( animal_type, year, price_per_part )
      `)
      .eq('phone_number', identifier)
      .order('registered_at', { ascending: false });

    if (error) {
      console.warn("Could not fetch Qurban history:", error);
      return;
    }
    
    const section = document.getElementById('ud-qurban-receipts');
    const list = document.getElementById('ud-qurban-list');
    
    if (data && data.length > 0 && section && list) {
      section.style.display = 'block';
      list.innerHTML = '';
      
      data.forEach(reg => {
        const c = reg.korban_campaigns || { animal_type: 'Unknown', year: '2026', price_per_part: 0 };
        const isPaid      = reg.payment_status === 'paid';
        const isRejected  = reg.payment_status === 'rejected';
        const isCancelled = reg.payment_status === 'cancelled';
        const statusColor  = isPaid ? '#22c55e' : isRejected ? '#ef4444' : isCancelled ? '#94a3b8' : '#eab308';
        const statusBg     = isPaid ? 'rgba(34,197,94,0.12)' : isRejected ? 'rgba(239,68,68,0.12)' : isCancelled ? 'rgba(148,163,184,0.12)' : 'rgba(234,179,8,0.12)';
        const statusBorder = isPaid ? 'rgba(34,197,94,0.35)' : isRejected ? 'rgba(239,68,68,0.35)' : isCancelled ? 'rgba(148,163,184,0.35)' : 'rgba(234,179,8,0.35)';
        const statusLabel  = isPaid ? '✅ PAID' : isRejected ? '❌ REJECTED' : isCancelled ? '🚫 CANCELLED' : '⏳ PENDING VERIFICATION';
        const statusNote   = isPaid ? ''
          : isRejected
            ? '<p style="font-size:0.78rem; color:#ef4444; margin-top:0.6rem; background:rgba(239,68,68,0.08); border-radius:6px; padding:0.4rem 0.7rem;">❌ Your payment was <strong>rejected</strong> by the admin. Please contact the mosque for assistance.</p>'
            : isCancelled
              ? '<p style="font-size:0.78rem; color:#94a3b8; margin-top:0.6rem; background:rgba(148,163,184,0.08); border-radius:6px; padding:0.4rem 0.7rem;">🚫 You <strong>cancelled</strong> this payment. You may register again to proceed.</p>'
              : '<p style="font-size:0.78rem; color:#eab308; margin-top:0.6rem; background:rgba(234,179,8,0.08); border-radius:6px; padding:0.4rem 0.7rem;">⚠️ Awaiting admin payment verification. Your registration is confirmed.</p>';
        const icon = c.animal_type.toLowerCase().includes('kambing') ? 'fa-paw' : 'fa-cow';
        
        list.innerHTML += `
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1.2rem; position: relative;">
            <div style="position: absolute; top: 1rem; right: 1rem; color: ${statusColor}; font-weight: bold; font-size: 0.75rem; background: ${statusBg}; border: 1px solid ${statusBorder}; padding: 0.3rem 0.6rem; border-radius: 4px;">
              ${statusLabel}
            </div>
            <div style="display:flex; align-items:center; gap: 1rem; margin-bottom: 1rem;">
              <div style="background: rgba(6,182,212,0.1); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
                <i class="fa-solid ${icon}"></i>
              </div>
              <div>
                <div style="font-weight: 700; color:#fff;">${c.animal_type} ${c.year}</div>
                <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${new Date(reg.registered_at).toLocaleDateString('en-MY', {day:'2-digit',month:'short',year:'numeric'})}</div>
              </div>
            </div>
            <div style="font-size: 0.9rem; color:#fff;">
              <div style="display:flex; justify-content:space-between; margin-bottom: 0.3rem;">
                <span style="color:var(--color-text-muted);">Portions:</span>
                <span>${reg.parts_qty} Bahagian</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--color-text-muted);">Total:</span>
                <strong style="color:var(--color-primary);">RM ${(reg.parts_qty * c.price_per_part).toFixed(2)}</strong>
              </div>
            </div>
            ${statusNote}
          </div>
        `;
      });
    } else if (section) {
      section.style.display = 'none';
    }
  } catch(err) {
    console.error(err);
  }
}

// ── Update UI based on auth state ────────────────────────────────
function updateAuthStateUI(profile) {
  const formLogin    = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const successState = document.getElementById('auth-success');
  const successTitle = document.getElementById('success-title');
  const successMsg   = document.getElementById('success-msg');
  const loginNavLink = document.getElementById('sidebar-login-btn');
  
  // Home Dashboard elements
  const userDashboard = document.getElementById('user-dashboard');
  const adminDashboard = document.getElementById('admin-dashboard');
  const udGreeting    = document.getElementById('ud-greeting');
  const memberPortalCard = document.getElementById('member-portal-card');

  // Login page layout elements
  const authWrapper = document.querySelector('.auth-wrapper');
  const authLeft    = document.querySelector('.auth-left');
  const authTabs    = document.querySelector('.auth-tabs');

  if (profile) {
    const display  = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

    if (formLogin)    formLogin.style.display    = 'none';
    if (formRegister) formRegister.style.display = 'none';
    if (successState) successState.style.display = 'flex';

    if (successTitle) successTitle.innerText = `Assalamu Alaykum, ${display}! 🌙`;
    if (successMsg)   successMsg.innerHTML   = `
      You are signed in to i@masjid.<br>
      User ID: <strong>#${profile.id ? String(profile.id).substring(0,8) : 'ADMIN'}</strong><br>
      Email: <em>${profile.email}</em>
    `;

    // Hide Member Portal card on Home since they already have the dashboard
    if (memberPortalCard) memberPortalCard.style.display = 'none';
    
    if (profile.is_admin) {
      if (userDashboard) userDashboard.style.display = 'none';
      if (adminDashboard) {
        adminDashboard.style.display = 'block';
        loadAdminQurbanData();
      }
    } else {
      if (adminDashboard) adminDashboard.style.display = 'none';
      if (userDashboard) {
        userDashboard.style.display = 'block';
        if (udGreeting) udGreeting.innerHTML = `Hello, ${display}! 🌙`;
      }
    }

    // Remove old logout btn and add fresh one
    successState?.querySelector('.btn-logout-dyn')?.remove();
    const logoutBtn    = document.createElement('button');
    logoutBtn.className = 'btn-secondary btn-logout-dyn';
    logoutBtn.innerText = 'Logout';
    logoutBtn.style.marginTop = '.75rem';
    logoutBtn.onclick = logout;
    successState?.appendChild(logoutBtn);

    if (loginNavLink) loginNavLink.innerHTML = 'Portal 👤';

    // Simplify Login Page to only show user info
    if (authLeft) authLeft.style.display = 'none';
    if (authTabs) authTabs.style.display = 'none';
    if (authWrapper) {
      authWrapper.style.gridTemplateColumns = '1fr';
      authWrapper.style.maxWidth = '450px';
      authWrapper.style.margin = '4rem auto';
    }
  } else {
    // ── LOGGED OUT: Hide everything session-related, show login form ──
    if (successState) successState.style.display = 'none';    // HIDE the success box
    if (userDashboard)  userDashboard.style.display  = 'none';
    if (adminDashboard) adminDashboard.style.display = 'none';

    // Restore login form visibility explicitly
    if (formLogin) {
      formLogin.style.display = 'flex';
      formLogin.classList.add('active');
    }
    if (formRegister) {
      formRegister.style.display = 'none';
      formRegister.classList.remove('active');
    }

    if (memberPortalCard) memberPortalCard.style.display = 'flex';
    successState?.querySelector('.btn-logout-dyn')?.remove();
    if (loginNavLink) loginNavLink.innerHTML = 'Login';

    // Restore Login Page layout
    if (authLeft)    authLeft.style.display    = 'flex';
    if (authTabs)    authTabs.style.display    = 'flex';
    if (authWrapper) {
      authWrapper.style.gridTemplateColumns = '';
      authWrapper.style.maxWidth = '';
      authWrapper.style.margin   = '';
    }
  }
}

// ── Admin Functions ──────────────────────────────────────────────
window.loadAdminQurbanData = async function() {
  const tbody = document.getElementById('admin-qurban-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="7" style="padding: 1rem; text-align:center;">Loading...</td></tr>';
  try {
    if (!window.sb) {
      throw new Error("Database connection unavailable.");
    }
    const { data, error } = await window.sb.from('korban_participants')
      .select(`
        id, name, phone_number, parts_qty, payment_status, registered_at,
        payment_method, installment_months, charge_fee,
        korban_campaigns ( animal_type, price_per_part )
      `)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="padding: 1rem; text-align:center;">No transactions found.</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    data.forEach(row => {
      const c = row.korban_campaigns || { animal_type: 'Unknown', price_per_part: 0 };
      const subtotal = (row.parts_qty * c.price_per_part);
      const fee      = parseFloat(row.charge_fee || 0);
      const total    = (subtotal + fee).toFixed(2);
      const isPaid   = row.payment_status === 'paid';

      // Payment plan badge
      const pm = row.payment_method || 'full';
      const months = row.installment_months;
      let planBadge = '';
      if (pm === 'installment_3') {
        const monthly = (subtotal / 3).toFixed(2);
        planBadge = `<span style="background:rgba(59,130,246,0.12);color:#3b82f6;border:1px solid rgba(59,130,246,0.35);padding:0.25rem 0.6rem;border-radius:4px;font-size:0.78rem;font-weight:700;">📅 3-Month</span><br><small style="color:var(--color-text-muted);">RM ${monthly}/mth · No fee</small>`;
      } else if (pm === 'installment_6') {
        const monthly = ((subtotal + fee) / 6).toFixed(2);
        planBadge = `<span style="background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid rgba(245,158,11,0.35);padding:0.25rem 0.6rem;border-radius:4px;font-size:0.78rem;font-weight:700;">🗓️ 6-Month</span><br><small style="color:var(--color-text-muted);">RM ${monthly}/mth · +RM ${fee.toFixed(2)} fee</small>`;
      } else {
        planBadge = `<span style="background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.3);padding:0.25rem 0.6rem;border-radius:4px;font-size:0.78rem;font-weight:700;">💳 Full</span>`;
      }

      const badge = isPaid
        ? '<span style="background:rgba(34,197,94,0.1);color:#22c55e;padding:0.3rem 0.6rem;border-radius:4px;font-size:0.8rem;font-weight:bold;">PAID</span>'
        : row.payment_status === 'rejected'
          ? '<span style="background:rgba(239,68,68,0.1);color:#ef4444;padding:0.3rem 0.6rem;border-radius:4px;font-size:0.8rem;font-weight:bold;">REJECTED</span>'
          : row.payment_status === 'cancelled'
            ? '<span style="background:rgba(148,163,184,0.1);color:#94a3b8;padding:0.3rem 0.6rem;border-radius:4px;font-size:0.8rem;font-weight:bold;">CANCELLED</span>'
            : '<span style="background:rgba(234,179,8,0.1);color:#eab308;padding:0.3rem 0.6rem;border-radius:4px;font-size:0.8rem;font-weight:bold;">PENDING</span>';

      const isRejected  = row.payment_status === 'rejected';
      const isCancelled = row.payment_status === 'cancelled';
      const actionBtn = (isPaid || isRejected || isCancelled)
        ? `<span style="color:var(--color-text-muted);">—</span>`
        : `<div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
             <button onclick="markAdminAsPaid('${row.id}')"
               style="background:#22c55e;color:#fff;border:none;padding:0.4rem 0.75rem;
                      border-radius:6px;cursor:pointer;font-weight:700;font-size:0.82rem;
                      transition:opacity 0.2s;"
               onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
               ✅ Approve
             </button>
             <button onclick="rejectAdminPayment('${row.id}')"
               style="background:#ef4444;color:#fff;border:none;padding:0.4rem 0.75rem;
                      border-radius:6px;cursor:pointer;font-weight:700;font-size:0.82rem;
                      transition:opacity 0.2s;"
               onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
               ❌ Reject
             </button>
           </div>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);"><small>${row.id.substring(0,8).toUpperCase()}</small></td>
        <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);"><strong>${row.name}</strong><br><small style="color:var(--color-text-secondary);">${row.phone_number}</small></td>
        <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">${c.animal_type}<br><small style="color:var(--color-text-secondary);">${row.parts_qty} Bahagian</small></td>
        <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); color:var(--color-primary); font-weight:bold;">RM ${total}</td>
        <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">${planBadge}</td>
        <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">${badge}</td>
        <td style="padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);">${actionBtn}</td>
      `;
      tbody.appendChild(tr);
    });
    
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="6" style="padding: 1rem; text-align:center; color:#ef4444;">Failed to load data.</td></tr>';
  }
}

window.markAdminAsPaid = async function(id) {
  if (!confirm("Approve this payment? The user's receipt will update to PAID.")) return;
  try {
    const { error } = await window.sb.from('korban_participants').update({ payment_status: 'paid' }).eq('id', id);
    if (error) throw error;
    showToast('✅ Payment Approved successfully!');
    loadAdminQurbanData();
  } catch(err) {
    showToast('❌ Error approving: ' + err.message);
  }
}

window.rejectAdminPayment = async function(id) {
  if (!confirm("Reject this payment? The user will be notified their payment was not approved.")) return;
  try {
    const { error } = await window.sb.from('korban_participants').update({ payment_status: 'rejected' }).eq('id', id);
    if (error) throw error;
    showToast('❌ Payment Rejected.');
    loadAdminQurbanData();
  } catch(err) {
    showToast('❌ Error rejecting: ' + err.message);
  }
}

// ── Auth tab switcher ─────────────────────────────────────────────
function switchAuthTab(tab) {
  const tabLogin    = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin   = document.getElementById('form-login');
  const formRegister= document.getElementById('form-register');

  const isLogin = tab === 'login';
  
  if (tabLogin) tabLogin.classList.toggle('active', isLogin);
  if (tabRegister) tabRegister.classList.toggle('active', !isLogin);
  
  if (formLogin) {
    formLogin.classList.toggle('active', isLogin);
    formLogin.style.display = isLogin ? 'flex' : 'none';
  }
  
  if (formRegister) {
    formRegister.classList.toggle('active', !isLogin);
    formRegister.style.display = isLogin ? 'none' : 'flex';
  }
}

// ── Password visibility toggle ────────────────────────────────────
function togglePw(fieldId, button) {
  const input = document.getElementById(fieldId);
  const isHidden = input.type === 'password';
  input.type    = isHidden ? 'text' : 'password';
  button.innerText = isHidden ? '🙈' : '👁️';
}

// ── OAuth Simulation ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const btnGoogle = document.getElementById('btn-google-login');
  const btnFb = document.getElementById('btn-fb-login');
  
  if (btnGoogle) {
    btnGoogle.addEventListener('click', () => {
      window.location.href = 'mock-oauth.html?provider=google';
    });
  }
  
  if (btnFb) {
    btnFb.addEventListener('click', () => {
      window.location.href = 'mock-oauth.html?provider=facebook';
    });
  }

  // Check for OAuth return
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('oauth_success') === '1') {
    handleOAuthSuccess(urlParams.get('email'), urlParams.get('name'), urlParams.get('provider'));
  }
});

async function handleOAuthSuccess(email, name, provider) {
  // Clean URL without reloading
  window.history.replaceState({}, document.title, window.location.pathname);
  
  try {
    if (!window.sb) throw new Error("Database unavailable.");
    
    // Check if user exists
    const { data: existingUser, error: checkError } = await window.sb
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    let profileData = existingUser;
    
    if (!existingUser) {
      // Create new user via OAuth mock
      const parts = name.split(' ');
      const first = parts[0];
      const last = parts.slice(1).join(' ') || '';
      
      const { data: newUser, error: insertError } = await window.sb
        .from('profiles')
        .insert({
          first_name: first,
          last_name: last,
          email: email,
          password: `oauth_${provider}_${Date.now()}` // dummy password
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      profileData = newUser;
    }
    
    // Log them in natively
    localStorage.setItem('imasjid_profile', JSON.stringify(profileData));
    saveRecentLogin(profileData);
    
    // Render UI state
    updateAuthStateUI(profileData);
    if (typeof loadUserRegistrations === 'function') loadUserRegistrations(profileData.email);
    if (typeof loadUserQurbanHistory === 'function') loadUserQurbanHistory(profileData.phone_number || profileData.email);
    
    setTimeout(() => {
      showToast(`✅ Successfully logged in via ${provider === 'google' ? 'Google' : 'Facebook'}!`);
      window.location.hash = '#home';
    }, 500);
    
  } catch (err) {
    console.error("OAuth login error:", err);
    showToast('❌ OAuth Login Failed: ' + err.message);
  }
}
