// src/debtToIncome.test.js
import { describe, it, expect } from 'vitest';
import { calculateDTI } from './debtToIncome.js';

describe('calculateDTI', () => {
  it('bands a low ratio as healthy', () => {
    const result = calculateDTI({ monthlyDebtPayments: 1500, grossMonthlyIncome: 20000 });
    expect(result.ratio).toBeCloseTo(7.5, 5);
    expect(result.band).toBe('healthy');
  });

  it('bands a moderate ratio as manageable', () => {
    const result = calculateDTI({ monthlyDebtPayments: 6000, grossMonthlyIncome: 20000 });
    expect(result.ratio).toBeCloseTo(30, 5);
    expect(result.band).toBe('manageable');
  });

  it('bands a high ratio as getting stretched, and a very high one as high risk', () => {
    expect(calculateDTI({ monthlyDebtPayments: 8000, grossMonthlyIncome: 20000 }).band).toBe('stretched'); // 40%
    expect(calculateDTI({ monthlyDebtPayments: 12000, grossMonthlyIncome: 20000 }).band).toBe('high'); // 60%
  });

  it('treats the exact band boundary as still within the lower band (<=, not <)', () => {
    expect(calculateDTI({ monthlyDebtPayments: 4000, grossMonthlyIncome: 20000 }).band).toBe('healthy'); // exactly 20%
    expect(calculateDTI({ monthlyDebtPayments: 4001, grossMonthlyIncome: 20000 }).band).toBe('manageable');
  });

  it('returns a 0 ratio with no NaN when income is 0', () => {
    const result = calculateDTI({ monthlyDebtPayments: 500, grossMonthlyIncome: 0 });
    expect(result.ratio).toBe(0);
    expect(result.band).toBe('healthy');
  });

  it('clamps negative inputs to 0 rather than an invalid ratio', () => {
    const result = calculateDTI({ monthlyDebtPayments: -500, grossMonthlyIncome: -20000 });
    expect(result.ratio).toBe(0);
  });
});
