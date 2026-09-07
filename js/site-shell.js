(function () {
  var body = document.body;
  if (!body) return;
  body.classList.add('standalone-shell');

  if (!document.querySelector('.standalone-sidebar')) {
    body.insertAdjacentHTML('afterbegin', `
      <button class="dark-mode-toggle" id="dark-mode-toggle" onclick="toggleDarkMode()" aria-label="Toggle dark mode">
        <div class="dm-track"><div class="dm-thumb"></div></div><span class="dm-icon" id="dm-icon">🌙</span><span id="dm-label">Dark</span>
      </button>
      <input class="standalone-sidebar-toggle" id="standalone-sidebar-toggle" type="checkbox" aria-label="Toggle navigation menu">
      <label class="menu-btn standalone-menu-btn" for="standalone-sidebar-toggle" aria-label="Toggle navigation menu"><span></span><span></span><span></span></label>
      <aside class="sidebar w2-sidebar standalone-sidebar" role="navigation" aria-label="Main navigation">
        <div class="w2-sidebar-header"><a href="index.html" class="sidebar-logo"><img src="logo.png" alt="i@masjid logo" class="sidebar-logo-img w2-sidebar-logo"><span class="sidebar-brand w2-sidebar-title">i<span class="brand-at">@</span>masjid</span></a></div>
        <div class="sidebar-divider"></div>
        <ul class="sidebar-links w2-nav-list">
          <li><a href="index.html" class="nav-link w2-nav-item"><span class="sl-icon"><i class="fa-solid fa-house"></i></span> Home</a></li>
          <li><a href="index.html#prayer" class="nav-link w2-nav-item"><span class="sl-icon"><i class="fa-solid fa-clock"></i></span> Prayer Times</a></li>
          <li><a href="index.html#events" class="nav-link w2-nav-item"><span class="sl-icon"><i class="fa-solid fa-calendar-days"></i></span> Events</a></li>
          <li><a href="korban.html" class="nav-link w2-nav-item"><span class="sl-icon"><i class="fa-solid fa-cow"></i></span> Ibadah Qurban</a></li>
          <li><a href="khairat.html" class="nav-link w2-nav-item"><span class="sl-icon"><i class="fa-solid fa-heart-pulse"></i></span> Khairat Kematian</a></li>
          <li><a href="announcements.html" class="nav-link w2-nav-item"><span class="sl-icon"><i class="fa-solid fa-tower-broadcast"></i></span> Announcements</a></li>
          <li><a href="donate.html" class="nav-link w2-nav-item"><span class="sl-icon"><i class="fa-solid fa-hand-holding-dollar"></i></span> Infaq &amp; Donate</a></li>
          <li><a href="index.html#about" class="nav-link w2-nav-item"><span class="sl-icon"><i class="fa-solid fa-mosque"></i></span> About</a></li>
        </ul>
        <div class="sidebar-divider"></div><a href="index.html#login" class="nav-link btn-gold-w2 sidebar-login">Login Portal</a>
      </aside>`);
  }

  var sidebarToggle = document.getElementById('standalone-sidebar-toggle');
  var sidebarKey = 'imasjid-sidebar-open';
  if (sidebarToggle) {
    sidebarToggle.checked = localStorage.getItem(sidebarKey) === 'true';
    sidebarToggle.addEventListener('change', function () {
      localStorage.setItem(sidebarKey, String(sidebarToggle.checked));
    });
  }

  function syncUI(isDark) {
    body.classList.toggle('dark-mode', isDark);
    var icon = document.getElementById('dm-icon');
    var label = document.getElementById('dm-label');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (label) label.textContent = isDark ? 'Light' : 'Dark';
  }

  var isDark = localStorage.getItem('imasjid-dark-mode') === 'true';
  syncUI(isDark);

  window.toggleDarkMode = function () {
    var nextState = !body.classList.contains('dark-mode');
    localStorage.setItem('imasjid-dark-mode', String(nextState));
    syncUI(nextState);
  };

  window.addEventListener('storage', function (e) {
    if (e.key === 'imasjid-dark-mode') {
      syncUI(e.newValue === 'true');
    }
  });
})();
