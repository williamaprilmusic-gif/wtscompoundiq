// src/components/OnboardingTour.jsx
// A short first-visit walkthrough of the app shell -- not a spotlight-overlay tour
// (computing/tracking a cutout mask against scroll+resize for every step is a lot of
// fragile positioning code for a 4-step tour). Instead: scroll the real target
// element into view, ring-highlight it with CSS, and show a small fixed step card
// describing it. Every target here is header/nav/footer chrome that's mounted
// regardless of which tab is active, so the tour works the same on first visit
// (always lands on Start Here) as it does when replayed from any other tab.
import React, { useEffect, useState } from 'react';
import './OnboardingTour.css';
import { useLanguage } from '../i18n/LanguageContext';

export const TOUR_SEEN_KEY = 'wts_compoundiq_tour_seen';

// title/body come from the translations (tour.s{n}Title / tour.s{n}Body).
const STEPS = [
  { selector: '.tabs-nav', n: 1 },
  { selector: '.header-actions .btn-upgrade', n: 2 },
  { selector: '.language-switcher', n: 3 },
  { selector: '.data-backup', n: 4 }
];

const OnboardingTour = ({ onClose }) => {
  const { t } = useLanguage();
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  useEffect(() => {
    const el = document.querySelector(step.selector);
    if (!el) {
      // Target isn't in the DOM right now (shouldn't normally happen -- see the
      // header/nav/footer-only selector list above) -- skip forward rather than
      // showing a step card pointing at nothing.
      if (stepIdx < STEPS.length - 1) setStepIdx(i => i + 1); else onClose();
      return;
    }
    el.classList.add('tour-highlight');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return () => el.classList.remove('tour-highlight');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx]);

  const next = () => stepIdx < STEPS.length - 1 ? setStepIdx(i => i + 1) : onClose();
  const back = () => setStepIdx(i => Math.max(0, i - 1));

  return (
    <div className="tour-card" role="dialog" aria-label={t('tour.aria', { n: stepIdx + 1, total: STEPS.length, title: t(`tour.s${step.n}Title`) })}>
      <div className="tour-card-header">
        <span className="tour-step-count">{stepIdx + 1} / {STEPS.length}</span>
        <button className="tour-skip-btn" onClick={onClose}>{t('tour.skip')}</button>
      </div>
      <h3>{t(`tour.s${step.n}Title`)}</h3>
      <p>{t(`tour.s${step.n}Body`)}</p>
      <div className="tour-card-actions">
        {stepIdx > 0 && <button className="tour-back-btn" onClick={back}>{t('tour.back')}</button>}
        <button className="tour-next-btn" onClick={next}>{stepIdx < STEPS.length - 1 ? t('tour.next') : t('tour.done')}</button>
      </div>
    </div>
  );
};

export default OnboardingTour;
