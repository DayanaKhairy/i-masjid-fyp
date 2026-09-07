// Root forwarder to js/dark-mode.js
(function () {
  function syncDarkModeUI(isDark) {
    var icon = document.getElementById('dm-icon');
    var label = document.getElementById('dm-label');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (label) label.textContent = isDark ? 'Light' : 'Dark';
  }

  function applyDarkMode(isDark) {
    if (document.body) {
      document.body.classList.toggle('dark-mode', isDark);
    }
    syncDarkModeUI(isDark);
  }

  var isDark = localStorage.getItem('imasjid-dark-mode') === 'true';
  applyDarkMode(isDark);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      applyDarkMode(localStorage.getItem('imasjid-dark-mode') === 'true');
    });
  } else {
    syncDarkModeUI(isDark);
  }

  window.toggleDarkMode = function () {
    var nextState = !document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', nextState);
    localStorage.setItem('imasjid-dark-mode', String(nextState));
    syncDarkModeUI(nextState);
  };

  window.initDarkMode = function () {
    var current = localStorage.getItem('imasjid-dark-mode') === 'true';
    applyDarkMode(current);
  };

  window.addEventListener('storage', function (e) {
    if (e.key === 'imasjid-dark-mode') {
      applyDarkMode(e.newValue === 'true');
    }
  });
})();
