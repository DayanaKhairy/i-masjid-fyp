// ═══════════════════════════════════════════════════════════════════
// app.js  — i@masjid Main Coordinator
// Navigation, toast, sidebar, and async initialization.
// All data logic lives in js/ modules loaded before this file.
// ═══════════════════════════════════════════════════════════════════

// ── Bootstrap on DOM ready ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Restore the visual theme before async data initialization begins.
    initDarkMode();

    // 1. Navigation routing
    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);

    // 2. Live prayer times (Aladhan API → JAKIM fallback)
    await initPrayerTimes();

    // 3. Events from Supabase (includes rendering teasers on Home)
    await loadEvents();

    // 4. Restore auth session + wire up listener
    await checkAuthSession();

    // 5. Close sidebar when a nav link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

});

// ═══ NAVIGATION ══════════════════════════════════════════════════

function handleHashRouting() {
    const hash = window.location.hash || '#home';
    const sectionId = hash.replace('#', '');
    showSection(sectionId);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === hash);
    });
}

function showSection(id) {
    document.querySelectorAll('.page').forEach(sec => {
        if (sec.id === id) {
            sec.classList.add('active');
            window.scrollTo(0, 0);
        } else {
            sec.classList.remove('active');
        }
    });

    // Show the floating back button on every section except Home
    var backBtn = document.getElementById('page-back-btn');
    if (backBtn) {
        backBtn.style.display = (id === 'home') ? 'none' : 'flex';
    }
}

function navClick(element, id) {
    window.location.hash = '#' + id;
}

// ═══ SIDEBAR ════════════════════════════════════════════════════

function toggleSidebar(e) {
    e.stopPropagation();
    document.getElementById('sidebar')?.classList.toggle('active');
    document.getElementById('menu-btn')?.classList.toggle('active');
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('active');
    document.getElementById('menu-btn')?.classList.remove('active');
}

// Close sidebar on outside click
document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    if (sidebar?.classList.contains('active') &&
        !sidebar.contains(e.target) &&
        !menuBtn?.contains(e.target)) {
        closeSidebar();
    }
});

// ═══ TOAST ═══════════════════════════════════════════════════════

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerText = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 350);
    }, 4000);
}

// ═══ DARK MODE ════════════════════════════════════════════════════

function initDarkMode() {
    const saved = localStorage.getItem('imasjid-dark-mode');
    if (saved === 'true') {
        document.body.classList.add('dark-mode');
        updateDarkModeUI(true);
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('imasjid-dark-mode', isDark);
    updateDarkModeUI(isDark);
}

function updateDarkModeUI(isDark) {
    const icon = document.getElementById('dm-icon');
    const label = document.getElementById('dm-label');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (label) label.textContent = isDark ? 'Light' : 'Dark';
}


