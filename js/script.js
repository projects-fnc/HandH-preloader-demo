(() => {
  'use strict';

  const preloader = document.getElementById('preloader');
  const fill = document.getElementById('progressFill');
  const percentage = document.getElementById('progressText');
  const progressBar = document.getElementById('progressBar');
  const skipButton = document.getElementById('skipIntro');
  const loadingNote = document.getElementById('loadingNote');

  if (!preloader || !fill || !percentage || !progressBar) return;

  document.body.classList.add('is-intro-running');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const minimumIntroTime = reducedMotion ? 350 : 3000;
  const failsafeTime = reducedMotion ? 1000 : 7000;
  const startTime = performance.now();

  let pageReady = document.readyState === 'complete';
  let didExit = false;
  let rafId = 0;
  let finishTimeout = 0;
  let failsafeTimeout = 0;
  let shownProgress = 0;

  const setProgress = (value) => {
    shownProgress = Math.max(shownProgress, Math.min(100, Math.round(value)));
    fill.style.width = `${shownProgress}%`;
    percentage.textContent = `${shownProgress}%`;
    progressBar.setAttribute('aria-valuenow', String(shownProgress));
  };

  const finishIntro = () => {
    if (didExit) return;
    didExit = true;
    window.cancelAnimationFrame(rafId);
    window.clearTimeout(finishTimeout);
    window.clearTimeout(failsafeTimeout);
    setProgress(100);
    if (loadingNote) loadingNote.textContent = 'Welcome to Herbs & Harmony';
    preloader.classList.add('is-exiting');
    document.body.classList.remove('is-intro-running');

    const removeOverlay = () => {
      preloader.hidden = true;
      preloader.setAttribute('aria-hidden', 'true');
    };
    preloader.addEventListener('transitionend', removeOverlay, { once: true });
    // Fallback in case the transition event is not fired.
    window.setTimeout(removeOverlay, reducedMotion ? 300 : 1200);
  };

  const waitForMinimumAndFinish = () => {
    if (didExit) return;
    window.clearTimeout(finishTimeout);
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, minimumIntroTime - elapsed);
    finishTimeout = window.setTimeout(finishIntro, remaining);
  };

  const markPageReady = () => {
    if (pageReady) return;
    pageReady = true;
    waitForMinimumAndFinish();
  };

  const updateProgress = (now) => {
    if (didExit) return;
    const elapsed = now - startTime;
    // Ease the progress toward 91%, then finish when the page is ready and
    // the minimum display duration has elapsed. A failsafe prevents hanging.
    setProgress(Math.min(91, (elapsed / minimumIntroTime) * 91));

    if (pageReady && elapsed >= minimumIntroTime) {
      finishIntro();
      return;
    }
    if (!pageReady && elapsed >= failsafeTime) {
      pageReady = true;
      waitForMinimumAndFinish();
      return;
    }
    // Keep the indicator moving even if the browser has loaded the page
    // quickly; it eases to 91% and then completes when the intro exits.
    rafId = window.requestAnimationFrame(updateProgress);
  };

  window.addEventListener('load', markPageReady, { once: true });

  if (pageReady) {
    waitForMinimumAndFinish();
  } else {
    rafId = window.requestAnimationFrame(updateProgress);
  }

  // Independent failsafe for suspended animation frames or unusual load states.
  failsafeTimeout = window.setTimeout(() => {
    if (!pageReady) {
      pageReady = true;
      waitForMinimumAndFinish();
    }
  }, failsafeTime);

  skipButton?.addEventListener('click', finishIntro);
  preloader.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') finishIntro();
  });
})();
