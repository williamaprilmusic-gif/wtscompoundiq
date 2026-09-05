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

export const TOUR_SEEN_KEY = 'wts_compoundiq_tour_seen';

const STEPS = [
  {
    selector: '.tabs-nav',
    title: 'Your toolkit',
    body: "Everything lives here -- free tools first, then Planning and AI-powered tools as you go Pro or Ultra. Click any tab to jump straight in."
  },
  {
    selector: '.header-actions .btn-upgrade',
    title: 'See what unlocks what',
    body: 'A locked tab shows 🔒 until your plan covers it -- tap this anytime to compare Free, Pro and Ultra side by side.'
  },
  {
    selector: '.language-switcher',
    title: 'Your language',
    body: 'Switch the app language here -- it stays visible from every tab, so you never need to hunt for it.'
  },
  {
    selector: '.data-backup',
    title: 'Nothing leaves your browser',
    body: "Your plan, tier, and everything you've entered is saved only on this device. Export a backup here before clearing browser data or switching devices, then import it to pick up where you left off."
  }
];

const OnboardingTour = ({ onClose }) => {
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
    <div className="tour-card" role="dialog" aria-label={`Tour step ${stepIdx + 1} of ${STEPS.length}: ${step.title}`}>
      <div className="tour-card-header">
        <span className="tour-step-count">{stepIdx + 1} / {STEPS.length}</span>
        <button className="tour-skip-btn" onClick={onClose}>Skip tour</button>
      </div>
      <h3>{step.title}</h3>
      <p>{step.body}</p>
      <div className="tour-card-actions">
        {stepIdx > 0 && <button className="tour-back-btn" onClick={back}>Back</button>}
        <button className="tour-next-btn" onClick={next}>{stepIdx < STEPS.length - 1 ? 'Next' : 'Done'}</button>
      </div>
    </div>
  );
};

export default OnboardingTour;
