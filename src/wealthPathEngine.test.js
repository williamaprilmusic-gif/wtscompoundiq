import { describe, it, expect } from 'vitest';
import { computeWealthPath, FI_MULTIPLE } from './wealthPathEngine';

const byId = (res, id) => res.steps.find((s) => s.id === id);

describe('computeWealthPath', () => {
  it('with no data: budget + tfsa are to-do, data-dependent steps are unknown', () => {
    const res = computeWealthPath({});
    expect(byId(res, 'budget').status).toBe('todo');
    expect(byId(res, 'tfsa').status).toBe('todo');
    expect(byId(res, 'starterEf').status).toBe('unknown');
    expect(byId(res, 'killDebt').status).toBe('unknown');
    expect(byId(res, 'invest').status).toBe('unknown');
    expect(byId(res, 'retireFund').status).toBe('info');
    expect(res.currentId).toBe('budget');
    expect(res.fiNumber).toBeNull();
    expect(res.fiProgressPct).toBeNull();
  });

  it('marks the starter and full emergency-fund steps from savings vs monthly expenses', () => {
    const base = { monthlyExpenses: 20000, emergencySavings: 25000 };
    const res = computeWealthPath(base);
    expect(byId(res, 'starterEf').status).toBe('done');   // 25k >= 20k
    expect(byId(res, 'starterEf').target).toBe(20000);
    expect(byId(res, 'fullEf').status).toBe('todo');       // 25k < 60k
    expect(byId(res, 'fullEf').target).toBe(60000);
  });

  it('flags expensive debt as to-do and treats sub-threshold or no debt as clear', () => {
    expect(byId(computeWealthPath({ anyDebtData: true, expensiveDebt: 5000 }), 'killDebt').status).toBe('todo');
    expect(byId(computeWealthPath({ anyDebtData: true, expensiveDebt: 0 }), 'killDebt').status).toBe('done');
    expect(byId(computeWealthPath({ anyDebtData: false }), 'killDebt').status).toBe('unknown');
  });

  it('tfsa step follows the wrapper toggle and reports the monthly allowance', () => {
    const on = computeWealthPath({ wrapperOn: true, annualWrapperLimit: 46000 });
    expect(byId(on, 'tfsa').status).toBe('done');
    expect(byId(on, 'tfsa').target).toBeCloseTo(46000 / 12);
    expect(byId(computeWealthPath({ wrapperOn: false }), 'tfsa').status).toBe('todo');
  });

  it('computes the FI number as 25x annual expenses and progress from invested assets', () => {
    const res = computeWealthPath({ monthlyExpenses: 20000, investedAssets: 1500000 });
    expect(res.fiNumber).toBe(20000 * 12 * FI_MULTIPLE); // 6,000,000
    expect(res.fiProgressPct).toBeCloseTo(25);
    expect(byId(res, 'invest').status).toBe('todo');
  });

  it('caps FI progress at 100 and marks invest + fi done once assets clear the number', () => {
    const res = computeWealthPath({ monthlyExpenses: 10000, investedAssets: 5000000 });
    expect(res.fiNumber).toBe(3000000);
    expect(res.fiProgressPct).toBe(100);
    expect(byId(res, 'invest').status).toBe('done');
    expect(byId(res, 'fi').status).toBe('done');
  });

  it('currentId walks to the first unfinished actionable step', () => {
    const res = computeWealthPath({
      hasBudget: true,
      monthlyExpenses: 15000,
      emergencySavings: 60000,      // clears starter (15k) and full (45k)
      anyDebtData: true,
      expensiveDebt: 0,
      wrapperOn: false
    });
    expect(byId(res, 'budget').status).toBe('done');
    expect(byId(res, 'starterEf').status).toBe('done');
    expect(byId(res, 'killDebt').status).toBe('done');
    expect(byId(res, 'fullEf').status).toBe('done');
    expect(res.currentId).toBe('tfsa');
  });

  it('lands on the finish line when everything actionable is done', () => {
    const res = computeWealthPath({
      hasBudget: true,
      monthlyExpenses: 10000,
      emergencySavings: 40000,
      anyDebtData: true,
      expensiveDebt: 0,
      wrapperOn: true,
      investedAssets: 5000000 // > 3,000,000 FI number
    });
    expect(res.currentId).toBe('fi');
  });
});
