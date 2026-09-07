// ═══════════════════════════════════════════════════════════════════
// js/prayer-engine.js  — Live Prayer Times via Aladhan API + Countdown
// ═══════════════════════════════════════════════════════════════════

// Aladhan API — free, CORS-enabled, Malaysia-accurate
// Method 3 = Muslim World League (closest to JAKIM for Malaysia)
const PRAYER_API_URL = 'https://api.aladhan.com/v1/timingsByCity?city=Melaka&country=Malaysia&method=3';

const FALLBACK_PRAYER_TIMES = {
  Fajr: '05:48', Syuruk: '07:02', Dhuhr: '13:12',
  Asr: '16:34', Maghrib: '19:18', Isyak: '20:31'
};

const ARABIC_NAMES = {
  Fajr: 'الفجر', Syuruk: 'الشروق', Dhuhr: 'الظهر',
  Asr: 'العصر', Maghrib: 'المغرب', Isyak: 'العشاء'
};

let currentPrayerTimes = { ...FALLBACK_PRAYER_TIMES };
let prayerTimerInterval = null;

// ── Fetch live prayer times ──────────────────────────────────────
async function fetchLivePrayerTimes() {
  try {
    const resp = await fetch(PRAYER_API_URL);
    if (!resp.ok) throw new Error('API error ' + resp.status);
    const json = await resp.json();
    if (json.code === 200 && json.data?.timings) {
      const t = json.data.timings;
      currentPrayerTimes = {
        Fajr:    t.Fajr,
        Syuruk:  t.Sunrise,
        Dhuhr:   t.Dhuhr,
        Asr:     t.Asr,
        Maghrib: t.Maghrib,
        Isyak:   t.Isha
      };
      return true;
    }
  } catch (e) {
    console.warn('[Prayer Engine] Live API failed, using fallback times.', e.message);
  }
  return false;
}

// ── Main init (called from app.js) ──────────────────────────────
async function initPrayerTimes() {
  const now = new Date();

  // Gregorian date
  const ptGregorian = document.getElementById('pt-gregorian');
  const ptDay       = document.getElementById('pt-day');
  if (ptGregorian) ptGregorian.innerText = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (ptDay)       ptDay.innerText       = now.toLocaleDateString('en-US', { weekday: 'long' });

  // Hijri date
  const ptHijri = document.getElementById('pt-hijri');
  if (ptHijri) ptHijri.innerText = getHijriDateString(now);

  // Quick strip date
  const stripDate = document.getElementById('strip-date');
  if (stripDate) stripDate.innerText = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  // Fetch live times
  const isLive = await fetchLivePrayerTimes();

  // Show live badge
  const locationEl = document.getElementById('prayer-location');
  if (locationEl) {
    locationEl.innerHTML = `Melaka (MLK001) &nbsp;<span class="badge-live ${isLive ? 'live' : 'offline'}">${isLive ? '🟢 Live' : '🟡 Offline'}</span>`;
  }

  // Render UI
  renderPrayerCards();
  renderWeeklySchedule();

  // Start countdown ticker
  if (prayerTimerInterval) clearInterval(prayerTimerInterval);
  updateCountdown();
  prayerTimerInterval = setInterval(updateCountdown, 1000);
}

// ── Hijri date approximation ─────────────────────────────────────
function getHijriDateString(date) {
  const hijriMonths = [
    "Muharram","Safar","Rabi' al-awwal","Rabi' al-thani",
    "Jumada al-awwal","Jumada al-thani","Rajab","Sha'ban",
    "Ramadhan","Shawwal","Dhu al-Qi'dah","Dhu al-Hijjah"
  ];
  const base = new Date('2026-05-19');
  const diff = Math.round(Math.abs(date - base) / 86400000);
  let hDay = 2 + diff, hMonth = 11, hYear = 1447;
  while (hDay > 30) { hDay -= 30; hMonth++; if (hMonth > 11) { hMonth = 0; hYear++; } }
  return `${hDay} ${hijriMonths[hMonth]} ${hYear} AH`;
}

// ── Render prayer cards ──────────────────────────────────────────
function renderPrayerCards() {
  const grid = document.getElementById('prayer-grid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.keys(currentPrayerTimes).forEach(name => {
    const card = document.createElement('div');
    card.className = 'prayer-card';
    card.id = `pc-${name.toLowerCase()}`;
    card.innerHTML = `
      <div class="p-arabic">${ARABIC_NAMES[name] || ''}</div>
      <h3>${name}</h3>
      <div class="p-time-val">${formatAMPM(currentPrayerTimes[name])}</div>
    `;
    grid.appendChild(card);
  });
}

// ── Weekly schedule ──────────────────────────────────────────────
function renderWeeklySchedule() {
  const tbody = document.getElementById('weekly-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const todayIdx = new Date().getDay();
  days.forEach((day, i) => {
    const isToday = i === todayIdx;
    const tr = document.createElement('tr');
    if (isToday) tr.className = 'today';
    tr.innerHTML = `
      <td>${day}${isToday ? ' 🔑' : ''}</td>
      <td>${formatAMPM(adjustTime(currentPrayerTimes.Fajr,    i - 3))}</td>
      <td>${formatAMPM(adjustTime(currentPrayerTimes.Syuruk,  i - 3))}</td>
      <td>${formatAMPM(adjustTime(currentPrayerTimes.Dhuhr,   i - 3))}</td>
      <td>${formatAMPM(adjustTime(currentPrayerTimes.Asr,     i - 3))}</td>
      <td>${formatAMPM(adjustTime(currentPrayerTimes.Maghrib, i - 3))}</td>
      <td>${formatAMPM(adjustTime(currentPrayerTimes.Isyak,   i - 3))}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Real-time countdown ──────────────────────────────────────────
function updateCountdown() {
  const now = new Date();
  const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const ordered = ['Fajr','Dhuhr','Asr','Maghrib','Isyak'];
  const secs = {};
  ordered.forEach(k => {
    const [h, m] = (currentPrayerTimes[k] || '00:00').split(':').map(Number);
    secs[k] = h * 3600 + m * 60;
  });

  let next = null, nextSecs = null, active = null;
  for (let i = 0; i < ordered.length; i++) {
    if (nowSecs < secs[ordered[i]]) {
      next = ordered[i]; nextSecs = secs[ordered[i]];
      active = ordered[i - 1] || 'Isyak';
      break;
    }
  }
  if (!next) {
    next = 'Fajr';
    const [h, m] = currentPrayerTimes.Fajr.split(':').map(Number);
    nextSecs = h * 3600 + m * 60 + 86400;
    active = 'Isyak';
  }

  // Highlight active card
  document.querySelectorAll('.prayer-card').forEach(c => c.classList.remove('active'));
  const ac = document.getElementById(`pc-${active.toLowerCase()}`);
  if (ac) ac.classList.add('active');

  // Quick strip
  const strip = document.getElementById('strip-prayers');
  if (strip) {
    strip.innerHTML = ordered.map(p => `
      <div class="strip-prayer-item ${p === active ? 'active' : ''}">
        <span class="p-name">${p}</span>
        <span class="p-time">${formatAMPM(currentPrayerTimes[p])}</span>
      </div>
    `).join('');
  }

  // Countdown display
  const diff = nextSecs - nowSecs;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  const pad = n => String(n).padStart(2, '0');

  const npName = document.getElementById('np-name');
  const npTime = document.getElementById('np-time');
  const npCD   = document.getElementById('np-countdown');
  if (npName) npName.innerText = next;
  if (npTime) npTime.innerText = formatAMPM(currentPrayerTimes[next]);
  if (npCD)   npCD.innerText   = `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ── Utilities ────────────────────────────────────────────────────
function adjustTime(timeStr, mins) {
  if (!timeStr) return '00:00';
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + mins, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatAMPM(t) {
  if (!t) return '--:--';
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}
