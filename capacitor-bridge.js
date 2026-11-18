// Native-only module loader. The regular PWA does not load Capacitor modules.
if (window.Capacitor?.isNativePlatform?.()) {
  import('./capacitor-native.js').catch(error => {
    console.error('Velovi native bridge failed to load:', error);
  });
}
