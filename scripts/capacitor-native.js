import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  App.addListener('backButton', async () => {
    const dialog = document.querySelector('dialog[open]');
    if (dialog) {
      dialog.close();
      return;
    }

    const moreMenu = document.querySelector('.mobile-more[open]');
    if (moreMenu) {
      moreMenu.open = false;
      return;
    }

    const authGate = document.querySelector('.auth-gate:not([hidden])');
    if (authGate) {
      await App.exitApp();
      return;
    }

    const activeView = document.querySelector('.view.active');
    if (activeView && activeView.id !== 'home') {
      document.querySelector('[data-view="home"]')?.click();
      return;
    }

    await App.exitApp();
  });

  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) window.VELOVI_STOP_BARCODE_SCANNER?.();
  });
}
