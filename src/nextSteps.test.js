// src/nextSteps.test.js
import { describe, it, expect } from 'vitest';
import { buildNextSteps } from './nextSteps.js';

describe('buildNextSteps', () => {
  it('a brand-new user is pointed at the emergency fund, FIRE number, net worth, and health score', () => {
    const steps = buildNextSteps({ plan: {}, hasNetWorth: false, hasHealthScore: false });
    // The health-score step carries no tab (it's shown on the Dashboard itself, so it's
    // informational rather than a self-navigating link).
    expect(steps.map(s => s.tab)).toEqual(['Emergency Fund', 'Power Tools', 'Net Worth', null]);
  });

  it('caps the list at four items', () => {
    const steps = buildNextSteps({ plan: {}, hasNetWorth: false, hasHealthScore: false });
    expect(steps.length).toBeLessThanOrEqual(4);
  });

  it('a well-set-up user gets no steps', () => {
    const plan = {
      emergencyFund: { targetAmount: 100000, currentSavings: 100000 },
      debt: { totalBalance: 0, avalancheMonths: 0, avalancheReachable: true },
      fire: { yearsToFire: 12 }
    };
    const steps = buildNextSteps({ plan, hasNetWorth: true, hasHealthScore: true });
    expect(steps).toHaveLength(0);
  });

  it('flags an under-funded emergency fund', () => {
    const plan = { emergencyFund: { targetAmount: 100000, currentSavings: 30000 }, fire: { yearsToFire: 10 } };
    const steps = buildNextSteps({ plan, hasNetWorth: true, hasHealthScore: true });
    expect(steps.some(s => s.tab === 'Emergency Fund')).toBe(true);
  });

  it('flags an unreachable debt plan and an unreachable FIRE number', () => {
    const plan = {
      emergencyFund: { targetAmount: 100000, currentSavings: 100000 },
      debt: { totalBalance: 200000, avalancheMonths: 600, avalancheReachable: false },
      fire: { yearsToFire: null }
    };
    const steps = buildNextSteps({ plan, hasNetWorth: true, hasHealthScore: true });
    expect(steps.some(s => s.tab === 'Debt Payoff')).toBe(true);
    expect(steps.some(s => s.tab === 'Power Tools')).toBe(true);
  });

  it('flags a debt payoff that is reachable but a long way out', () => {
    const plan = {
      emergencyFund: { targetAmount: 100000, currentSavings: 100000 },
      debt: { totalBalance: 150000, avalancheMonths: 96, avalancheReachable: true },
      fire: { yearsToFire: 10 }
    };
    const steps = buildNextSteps({ plan, hasNetWorth: true, hasHealthScore: true });
    expect(steps.some(s => s.tab === 'Debt Payoff' && /5 years/.test(s.text))).toBe(true);
  });
});
