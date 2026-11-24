'use strict';
(() => {
  const dialog = document.getElementById('onboardingGuideDialog');
  if (!dialog) return;
  const steps = [...dialog.querySelectorAll('[data-guide-step]')];
  const progressLabel = document.getElementById('guideProgressLabel');
  const progressBar = document.getElementById('guideProgressBar');
  const previous = document.getElementById('previousGuideStep');
  const next = document.getElementById('nextGuideStep');
  const finish = document.getElementById('finishOnboardingGuide');
  const close = document.getElementById('closeOnboardingGuide');
  const skip = document.getElementById('skipOnboardingGuide');
  const shell = document.querySelector('.shell');
  let activeStep = 0;
  let currentKey = '';
  const total = steps.length;
  function storageKey() {
    const userId = shell?.dataset.userId || 'local-user';
    return 'velovi-guide-v1:' + userId;
  }
  function renderStep() {
    steps.forEach((step, index) => { step.hidden = index !== activeStep; });
    if (progressLabel) progressLabel.textContent = document.documentElement.lang === 'de' ? 'Schritt ' + (activeStep + 1) + ' von ' + total : document.documentElement.lang === 'en' ? 'Step ' + (activeStep + 1) + ' of ' + total : 'الخطوة ' + (activeStep + 1) + ' من ' + total;
    if (progressBar) progressBar.style.width = (((activeStep + 1) / total) * 100) + '%';
    if (previous) previous.disabled = activeStep === 0;
    if (next) next.hidden = activeStep === total - 1;
    if (finish) finish.hidden = activeStep !== total - 1;
  }
  function openTour(force = false) {
    currentKey = storageKey();
    if (!force && localStorage.getItem(currentKey) === 'completed') return;
    activeStep = 0;
    renderStep();
    if (!dialog.open) dialog.showModal();
  }
  function completeTour() {
    if (currentKey) localStorage.setItem(currentKey, 'completed');
    dialog.close();
  }
  previous?.addEventListener('click', () => { activeStep = Math.max(0, activeStep - 1); renderStep(); });
  next?.addEventListener('click', () => { activeStep = Math.min(total - 1, activeStep + 1); renderStep(); });
  finish?.addEventListener('click', completeTour);
  skip?.addEventListener('click', completeTour);
  close?.addEventListener('click', completeTour);
  document.getElementById('replayOnboardingGuide')?.addEventListener('click', () => openTour(true));
  document.getElementById('openPrivacyPolicy')?.addEventListener('click', () => {
    const details = document.getElementById('privacyPolicyDetails');
    if (details) { details.open = true; details.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
  dialog.querySelectorAll('[data-guide-goto]').forEach(button => button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.guideGoto);
    if (target) {
      completeTour();
      document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view === target));
      document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === target.id));
      document.querySelectorAll('.mobile-more[open]').forEach(menu => { menu.open = false; });
      window.scrollTo({top:0, behavior:'smooth'});
    }
  }));
  dialog.querySelector('[data-guide-action="privacy"]')?.addEventListener('click', () => {
    completeTour();
    const settings = document.getElementById('settings');
    document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view === settings));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === 'settings'));
    const details = document.getElementById('privacyPolicyDetails');
    if (details) { details.open = true; details.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
  document.addEventListener('velovi:language-changed', renderStep);
  window.addEventListener('velovi:authenticated', () => openTour(false));
  if (shell?.classList.contains('is-authenticated')) openTour(false);
})();
