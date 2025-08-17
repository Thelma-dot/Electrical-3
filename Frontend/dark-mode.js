// dark-mode.js

// Check for saved preference on load
window.addEventListener('DOMContentLoaded', () => {
    const isDark = localStorage.getItem('dark-mode') === 'enabled';
    if (isDark) {
      document.body.classList.add('dark-mode');
    }
  });
  
  // Toggle dark mode and save preference
  function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
  
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('dark-mode', 'enabled');
    } else {
      localStorage.setItem('dark-mode', 'disabled');
    }
  }
  