// Root forwarder to js/sidebar-state.js
(function () {
  var toggle = document.getElementById('standalone-sidebar-toggle');
  if (!toggle) return;

  var storageKey = 'imasjid-sidebar-open';
  toggle.checked = localStorage.getItem(storageKey) === 'true';

  toggle.addEventListener('change', function () {
    localStorage.setItem(storageKey, String(toggle.checked));
  });
})();
