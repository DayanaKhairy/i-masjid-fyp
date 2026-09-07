(function () {
    var enabled = localStorage.getItem('imasjid-dark-mode') === 'true';
    document.body.classList.toggle('dark-mode', enabled);

    window.toggleDarkMode = function () {
        var isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('imasjid-dark-mode', String(isDark));

        var icon = document.getElementById('dm-icon');
        var label = document.getElementById('dm-label');
        if (icon) icon.textContent = isDark ? '☀️' : '🌙';
        if (label) label.textContent = isDark ? 'Light' : 'Dark';
    };
})();
