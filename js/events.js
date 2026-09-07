// ═══════════════════════════════════════════════════════════════════
// js/events.js  — Events from Supabase (with local fallback)
// ═══════════════════════════════════════════════════════════════════

// ── FALLBACK DATA must be at the top so it is always available ────
const FALLBACK_EVENTS = [

  // ── RELIGIOUS ──────────────────────────────────────────────────
  {
    id: 'A1',
    title: 'Kuliah Subuh Perdana',
    category: 'religious',
    date: '2026-06-24',
    time_range: '06:15 AM - 07:30 AM',
    speaker: 'Ustaz Dr. Abdul Halim',
    location: 'Dewan Solat Utama',
    description: 'A special morning lecture discussing Adab & Akhlak in the Modern Era with light breakfast served afterwards.',
    image_url: 'assets/images/kuliah-subuh.jpg',
    youtube_link: null
  },
  {
    id: 'A2',
    title: 'Solat Hajat Berjemaah & Tazkirah Malam',
    category: 'religious',
    date: '2026-07-03',
    time_range: '09:00 PM - 10:30 PM',
    speaker: 'Imam Haji Roslan',
    location: 'Dewan Solat Utama',
    description: 'A congregational night prayer followed by a tazkirah session on strengthening faith and reliance upon Allah in times of difficulty.',
    icon_fa: 'fa-moon',
    youtube_link: null
  },
  {
    id: 'A3',
    title: 'Maulid Al-Rasul Celebration',
    category: 'religious',
    date: '2026-07-14',
    time_range: '08:00 PM - 10:30 PM',
    speaker: 'Panel of Ustaz',
    location: 'Dewan Masjid Utama',
    description: 'Annual celebration of the Prophet Muhammad\'s (PBUH) birthday with nasheed performances, lectures on his seerah, and a communal feast.',
    icon_fa: 'fa-star-and-crescent',
    youtube_link: null
  },
  {
    id: 'A4',
    title: 'Podcast Dakwah Digital: Islam di Era Moden',
    category: 'religious',
    date: '2026-07-15',
    time_range: '08:00 PM - 09:30 PM',
    speaker: 'Ustaz Syafiq Riza Basri',
    location: 'YouTube Live / Masjid Al-Rahman',
    description: 'Live Islamic podcast streamed on YouTube covering Dakwah in the digital age, social media responsibility, and thriving as a Muslim in the modern world.',
    icon_fa: 'fa-microphone',
    youtube_link: 'https://youtube.com/@imasjid'
  },

  // ── EDUCATION ──────────────────────────────────────────────────
  {
    id: 'B1',
    title: 'Tajweed & Quranic Circle',
    category: 'education',
    date: '2026-06-26',
    time_range: '08:00 PM - 09:30 PM',
    speaker: 'Imam Haji Ghazali',
    location: 'Bilik Kuliah 1',
    description: 'Weekly class focused on improving Quranic recitation, tajweed rules, and memorization verification. Suitable for all levels.',
    icon_fa: 'fa-graduation-cap',
    youtube_link: null
  },
  {
    id: 'B2',
    title: 'Fiqh of Worship Seminar',
    category: 'education',
    date: '2026-07-10',
    time_range: '09:00 AM - 04:00 PM',
    speaker: 'Dr. Mufti Muhammad',
    location: 'Seminar Hall',
    description: 'Intensive 1-day seminar covering the essentials of Solat, Taharah, Zakat, and modern day Fiqh challenges. Certificate provided.',
    icon_fa: 'fa-mosque',
    youtube_link: null
  },
  {
    id: 'B3',
    title: 'Islamic Parenting Workshop',
    category: 'education',
    date: '2026-07-19',
    time_range: '09:00 AM - 01:00 PM',
    speaker: 'Ustazah Dr. Siti Aminah',
    location: 'Bilik Kuliah 2',
    description: 'A practical workshop on raising children with Islamic values — covering screen time, moral education, and building a faith-centred home.',
    icon_fa: 'fa-people-roof',
    youtube_link: null
  },
  {
    id: 'B4',
    title: 'Arabic Language for Beginners',
    category: 'education',
    date: '2026-07-26',
    time_range: '10:00 AM - 12:00 PM',
    speaker: 'Ustaz Ahmad Firdaus',
    location: 'Bilik Kuliah 1',
    description: 'A 4-week introductory Arabic course focusing on conversational phrases, Quranic vocabulary, and basic grammar. Limited to 25 participants.',
    icon_fa: 'fa-language',
    youtube_link: null
  },

  // ── COMMUNITY ──────────────────────────────────────────────────
  {
    id: 'C1',
    title: 'Community Gotong-Royong',
    category: 'community',
    date: '2026-06-30',
    time_range: '08:00 AM - 12:00 PM',
    speaker: 'Masjid Committee',
    location: 'Mosque Compound',
    description: 'Clean-up and beautification campaign of the mosque area, gardens, and community hall. Refreshments provided for all volunteers.',
    icon_fa: 'fa-people-group',
    youtube_link: null
  },
  {
    id: 'C2',
    title: 'Youth Futsal Friendly Tournament',
    category: 'community',
    date: '2026-07-06',
    time_range: '04:30 PM - 07:00 PM',
    speaker: 'Youth Bureau',
    location: 'Kompleks Sukan Komuniti',
    description: 'Sporting event for the community youth to build friendship and healthy lifestyles. Register your team of 5-7 players before slots fill.',
    icon_fa: 'fa-futbol',
    youtube_link: null
  },
  {
    id: 'C3',
    title: 'Mosque Open Day & Community Carnival',
    category: 'community',
    date: '2026-07-12',
    time_range: '10:00 AM - 05:00 PM',
    speaker: 'Masjid Committee',
    location: 'Mosque Grounds',
    description: 'Family-friendly open day with guided mosque tours, cultural booths, kids activities, and a shared community meal. Everyone is welcome.',
    icon_fa: 'fa-door-open',
    youtube_link: null
  },
  {
    id: 'C4',
    title: 'Seniors Gathering & Health Screening',
    category: 'community',
    date: '2026-07-20',
    time_range: '02:00 PM - 05:00 PM',
    speaker: 'Community Welfare Unit',
    location: 'Dewan Serbaguna',
    description: 'An afternoon for our senior community members featuring tazkirah, blood pressure and sugar level screening, and a communal tea session.',
    icon_fa: 'fa-heart-pulse',
    youtube_link: null
  },

  // ── CHARITY ────────────────────────────────────────────────────
  {
    id: 'D1',
    title: 'Infaq & Food Bank Distribution',
    category: 'charity',
    date: '2026-07-01',
    time_range: '09:00 AM - 01:00 PM',
    speaker: 'Charity Unit',
    location: 'Masjid Foyer',
    description: 'Distribution of essential goods and food supplies to registered Asnaf and families in need. Volunteers welcome to assist.',
    icon_fa: 'fa-hand-holding-dollar',
    youtube_link: null
  },
  {
    id: 'D2',
    title: 'Blood Donation Campaign',
    category: 'charity',
    date: '2026-07-08',
    time_range: '09:00 AM - 03:00 PM',
    speaker: 'Hospital Melaka & Masjid Committee',
    location: 'Dewan Serbaguna',
    description: 'Community blood donation drive in partnership with Hospital Melaka. All blood types needed. Donors receive health check, refreshments, and a certificate.',
    icon_fa: 'fa-droplet',
    youtube_link: null
  },
  {
    id: 'D3',
    title: 'Back-to-School Supply Drive',
    category: 'charity',
    date: '2026-07-22',
    time_range: '09:00 AM - 12:00 PM',
    speaker: 'Education Welfare Unit',
    location: 'Masjid Foyer',
    description: 'Collecting and distributing school bags, stationery, uniforms, and books to underprivileged students ahead of the new school term.',
    icon_fa: 'fa-school',
    youtube_link: null
  },
  {
    id: 'D4',
    title: 'Zakat & Asnaf Assistance Program',
    category: 'charity',
    date: '2026-07-29',
    time_range: '09:00 AM - 01:00 PM',
    speaker: 'Lembaga Zakat Melaka',
    location: 'Bilik Mesyuarat',
    description: 'Registration and assistance for eligible Asnaf families. Zakat distributed directly to verified recipients. Bring IC and relevant documents.',
    icon_fa: 'fa-hand-holding-heart',
    youtube_link: null
  }

];

// ── Runtime state ────────────────────────────────────────────────
var allEvents         = [];
var userRegistrations = new Set(); // Set of registered event IDs

// ── Load events from Supabase ────────────────────────────────────
async function loadEvents() {
  var container = document.getElementById('events-grid');
  if (container) {
    container.innerHTML = '<div class="loading-state"><i class="fa-solid fa-rotate fa-spin"></i> Loading events...</div>';
  }

  try {
    var result = await window.sb
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (result.error) throw result.error;

    // Use fallback if the table is empty (not yet seeded in Supabase)
    if (!result.data || result.data.length === 0) {
      console.info('[Events] Supabase events table is empty — using built-in fallback data.');
      allEvents = FALLBACK_EVENTS;
    } else {
      allEvents = result.data;
    }

    // Load user registrations if logged in
    var profile = (typeof getLocalUser === 'function') ? getLocalUser() : null;
    if (profile && profile.email) {
      await loadUserRegistrations(profile.email);
    }

  } catch (err) {
    console.warn('[Events] Supabase unavailable, using fallback data:', err.message || err);
    allEvents = FALLBACK_EVENTS;
  }

  renderEvents(allEvents);
  renderTeasers();
}

// ── Load which events the logged-in user registered for ──────────
async function loadUserRegistrations(email) {
  try {
    var result = await window.sb
      .from('registrations')
      .select('event_id')
      .eq('email', email);

    if (!result.error && result.data) {
      userRegistrations = new Set(result.data.map(function(r) { return r.event_id; }));
    }
  } catch (e) {
    console.warn('[Events] Could not load user registrations:', e.message || e);
  }
}

// ── Build image area HTML ─────────────────────────────────────────
function buildImgArea(ev, hasYT) {
  var ytBadge = hasYT
    ? '<span class="event-badge youtube-badge"><i class="fa-brands fa-youtube"></i> YouTube Live</span>'
    : '';

  if (ev.image_url) {
    return '<div class="event-img-placeholder event-img-photo" style="background-image:url(\'' + ev.image_url + '\');">' +
             '<div class="event-img-photo-overlay"></div>' +
             '<span class="event-badge">' + ev.category + '</span>' +
             ytBadge +
           '</div>';
  }

  var iconCls = ev.icon_fa || 'fa-calendar-days';
  return '<div class="event-img-placeholder">' +
           '<div class="event-img-pattern"></div>' +
           '<span class="ev-icon"><i class="fa-solid ' + iconCls + '"></i></span>' +
           '<span class="event-badge">' + ev.category + '</span>' +
           ytBadge +
         '</div>';
}

// ── Render events grid ───────────────────────────────────────────
function renderEvents(events) {
  var container = document.getElementById('events-grid');
  if (!container) return;

  if (!events || events.length === 0) {
    container.innerHTML = '<div class="no-events">No events found matching this category.</div>';
    return;
  }

  container.innerHTML = events.map(function(ev) {
    var isReg    = userRegistrations.has(ev.id);
    var regClass = isReg ? 'btn-event-reg registered' : 'btn-event-reg';
    var regStyle = isReg ? 'background:#f59e0b;border-color:#f59e0b;color:#0f172a;' : '';
    var hasYT    = !!ev.youtube_link;
    var imgArea  = buildImgArea(ev, hasYT);
    var regBtn   = isReg
      ? '<i class="fa-solid fa-circle-check"></i> Registered'
      : 'Register Now';

    return '<div class="event-card' + (hasYT ? ' event-card-podcast' : '') + '">' +
             imgArea +
             '<div class="event-body">' +
               '<div class="event-time-strip">' +
                 '<span><i class="fa-solid fa-calendar-days"></i> ' + formatEventDate(ev.date) + '</span>' +
                 '<span><i class="fa-solid fa-clock"></i> ' + (ev.time_range || '') + '</span>' +
               '</div>' +
               '<h3>' + ev.title + '</h3>' +
               '<p class="event-desc">' + (ev.description || '').substring(0, 100) + ((ev.description || '').length > 100 ? '...' : '') + '</p>' +
             '</div>' +
             '<div class="event-footer">' +
               '<span class="event-location"><i class="fa-solid fa-location-dot"></i> ' + (ev.location || '') + '</span>' +
               '<button class="' + regClass + '" style="' + regStyle + '" onclick="openEventDetails(\'' + ev.id + '\')">' +
                 regBtn +
               '</button>' +
             '</div>' +
           '</div>';
  }).join('');
}

// ── Render 3 teaser events on Home page ─────────────────────────
function renderTeasers() {
  var container = document.getElementById('teaser-events');
  if (!container) return;

  var teasers = allEvents.slice(0, 3);
  if (teasers.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--color-text-secondary);">No upcoming events.</p>';
    return;
  }

  container.innerHTML = teasers.map(function(ev) {
    var imgArea = buildImgArea(ev, false);
    return '<div class="event-card">' +
             imgArea +
             '<div class="event-body">' +
               '<div class="event-time-strip">' +
                 '<span><i class="fa-solid fa-calendar-days"></i> ' + formatEventDate(ev.date) + '</span>' +
                 '<span><i class="fa-solid fa-clock"></i> ' + (ev.time_range || '') + '</span>' +
               '</div>' +
               '<h3>' + ev.title + '</h3>' +
               '<p class="event-desc">' + (ev.description || '').substring(0, 80) + '...</p>' +
             '</div>' +
             '<div class="event-footer">' +
               '<span class="event-location"><i class="fa-solid fa-location-dot"></i> ' + (ev.location || '') + '</span>' +
               '<button class="btn-event-reg" onclick="navClick(null,\'events\')">View Details</button>' +
             '</div>' +
           '</div>';
  }).join('');
}

// ── Format event date ────────────────────────────────────────────
function formatEventDate(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Filter events by category ────────────────────────────────────
function filterEvents(category, button) {
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
  button.classList.add('active');
  var filtered = category === 'all'
    ? allEvents
    : allEvents.filter(function(e) { return e.category === category; });
  renderEvents(filtered);
}

// ── Open event detail modal ──────────────────────────────────────
async function openEventDetails(eventId) {
  var ev = allEvents.find(function(e) { return e.id === eventId; });
  if (!ev) return;

  var content = document.getElementById('modal-content');
  var modal   = document.getElementById('event-modal');
  if (!content || !modal) return;

  var isReg = userRegistrations.has(ev.id);
  var hasYT = !!ev.youtube_link;
  var iconCls = ev.icon_fa || 'fa-calendar-days';

  var ytBox = hasYT
    ? '<div class="yt-link-box">' +
        '<span><i class="fa-brands fa-youtube" style="color:#ef4444;"></i> <strong>YouTube Live Stream:</strong></span>' +
        '<a href="' + ev.youtube_link + '" target="_blank" rel="noopener noreferrer">' + ev.youtube_link + '</a>' +
      '</div>'
    : '';

  var ytBtn = hasYT
    ? '<a href="' + ev.youtube_link + '" target="_blank" rel="noopener" class="btn-primary" style="text-decoration:none;">' +
        '<i class="fa-brands fa-youtube"></i> Watch on YouTube' +
      '</a>'
    : '';

  var regBtnLabel = isReg
    ? '<i class="fa-solid fa-xmark"></i> Cancel Registration'
    : '<i class="fa-solid fa-circle-check"></i> Confirm Registration';

  content.innerHTML =
    '<h2 style="font-size:1.8rem;margin-bottom:1rem;">' +
      '<i class="fa-solid ' + iconCls + '"></i> ' + ev.title +
    '</h2>' +
    '<div style="display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.5rem;">' +
      '<p><i class="fa-solid fa-microphone" style="color:var(--primary-yellow, #FEBC2F);margin-right:6px;"></i><strong>Speaker / Host:</strong> ' + (ev.speaker || '-') + '</p>' +
      '<p><i class="fa-solid fa-calendar-days" style="color:var(--primary-yellow, #FEBC2F);margin-right:6px;"></i><strong>Date:</strong> ' + formatEventDate(ev.date) + '</p>' +
      '<p><i class="fa-solid fa-clock" style="color:var(--primary-yellow, #FEBC2F);margin-right:6px;"></i><strong>Time:</strong> ' + (ev.time_range || '-') + '</p>' +
      '<p><i class="fa-solid fa-location-dot" style="color:var(--primary-yellow, #FEBC2F);margin-right:6px;"></i><strong>Location:</strong> ' + (ev.location || '-') + '</p>' +
      '<p><i class="fa-solid fa-tag" style="color:var(--primary-yellow, #FEBC2F);margin-right:6px;"></i><strong>Category:</strong> <span style="text-transform:capitalize;">' + ev.category + '</span></p>' +
      ytBox +
      '<p style="color:var(--color-text-secondary);line-height:1.7;margin-top:.5rem;">' + (ev.description || '') + '</p>' +
    '</div>' +
    '<div style="display:flex;gap:1rem;justify-content:flex-end;flex-wrap:wrap;">' +
      '<button class="btn-secondary" onclick="closeEventModal()">Close</button>' +
      '<button class="' + (isReg ? 'btn-secondary' : 'btn-primary') + '" onclick="toggleEventRegistration(\'' + ev.id + '\')">' +
        regBtnLabel +
      '</button>' +
      ytBtn +
    '</div>';

  modal.style.display = 'flex';
}

// ── Close modal ──────────────────────────────────────────────────
function closeEventModal(event) {
  var modal = document.getElementById('event-modal');
  if (!modal) return;
  if (!event || event.target === modal || (event.target && event.target.classList.contains('modal-close'))) {
    modal.style.display = 'none';
  }
}

// ── Toggle registration (Supabase insert/delete) ─────────────────
async function toggleEventRegistration(eventId) {
  var profile = (typeof getLocalUser === 'function') ? getLocalUser() : null;

  if (!profile) {
    if (typeof showToast === 'function') showToast('Please login first to register for events.');
    closeEventModal();
    navClick(null, 'login');
    return;
  }

  var ev = allEvents.find(function(e) { return e.id === eventId; });
  if (!ev) return;

  var isReg = userRegistrations.has(eventId);

  if (isReg) {
    // Cancel registration
    var del = await window.sb
      .from('registrations')
      .delete()
      .eq('email', profile.email)
      .eq('event_id', eventId);

    if (!del.error) {
      userRegistrations.delete(eventId);
      if (typeof showToast === 'function') showToast('Registration cancelled for "' + ev.title + '".');
    } else {
      if (typeof showToast === 'function') showToast('Could not cancel. Please try again.');
    }
  } else {
    // New registration
    var fullName = ((profile.first_name || '') + ' ' + (profile.last_name || '')).trim();
    var ins = await window.sb
      .from('registrations')
      .insert({
        event_id:     eventId,
        name:         fullName,
        email:        profile.email,
        phone_number: profile.phone_number || ''
      });

    if (!ins.error) {
      userRegistrations.add(eventId);
      if (typeof showToast === 'function') showToast('Registered for "' + ev.title + '"! See you there.');
    } else {
      if (typeof showToast === 'function') showToast('Registration failed. ' + (ins.error.message || 'Please try again.'));
    }
  }

  renderEvents(allEvents);
  closeEventModal();
}
