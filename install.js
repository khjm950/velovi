// Adds a native-style install action when Chrome exposes the PWA install prompt.
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  let button = document.getElementById('veloviInstallButton');
  if (!button) {
    button = document.createElement('button');
    button.id = 'veloviInstallButton';
    button.type = 'button';
    button.textContent = 'تثبيت Velovi';
    button.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:20;background:#173f35;color:#fff;border:0;border-radius:12px;padding:12px 18px;font:600 14px sans-serif;box-shadow:0 4px 18px #0002';
    document.body.appendChild(button);
    button.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      button.remove();
    });
  }
});
window.addEventListener('appinstalled', () => {
  document.getElementById('veloviInstallButton')?.remove();
});
