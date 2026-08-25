// =========================================================
//  CraftBars Network — Client-side interactivity
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  // ---- Mobile nav toggle ----
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      navLinks.classList.toggle('is-open');
    });
  }

  // ---- Copy server IP buttons ----
  document.querySelectorAll('[data-ip]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ip = btn.getAttribute('data-ip');
      try {
        await navigator.clipboard.writeText(ip);
        const original = btn.innerHTML;
        btn.classList.add('is-copied');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
          btn.innerHTML = original;
          btn.classList.remove('is-copied');
        }, 1800);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    });
  });

  // ---- Rules page: sidebar tab switching ----
  const ruleTabs = document.querySelectorAll('.rules-tab');
  const rulePanels = document.querySelectorAll('.rules-panel');
  ruleTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');

      ruleTabs.forEach((t) => t.classList.remove('is-active'));
      rulePanels.forEach((p) => p.classList.remove('is-active'));

      tab.classList.add('is-active');
      const panel = document.querySelector(`.rules-panel[data-panel="${target}"]`);
      if (panel) panel.classList.add('is-active');
    });
  });

  // ---- Admin panel: rules editor tab switching ----
  const editorTabs = document.querySelectorAll('.rules-editor-tab');
  const editorPanels = document.querySelectorAll('.rules-editor-panel');
  editorTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');

      editorTabs.forEach((t) => t.classList.remove('is-active'));
      editorPanels.forEach((p) => p.classList.remove('is-active'));

      tab.classList.add('is-active');
      const panel = document.querySelector(`.rules-editor-panel[data-panel="${target}"]`);
      if (panel) panel.classList.add('is-active');
    });
  });

  // ---- Confirm before deleting a notice in the admin panel ----
  document.querySelectorAll('.js-confirm-delete').forEach((form) => {
    form.addEventListener('submit', (e) => {
      if (!confirm('Delete this announcement? This cannot be undone.')) {
        e.preventDefault();
      }
    });
  });
});
