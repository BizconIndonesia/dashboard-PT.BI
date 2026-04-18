import { DailyRecord } from './types';

// Helper to parse numbers from the messy strings
const n = (val: string): number => {
  if (!val || val.trim() === '-' || val.trim() === '') return 0;
  return parseFloat(val.replace(/,/g, '').trim());
};

// Helper to parse percentages
const p = (val: string): number => {
  if (!val || val.trim() === '-' || val.trim() === '') return 0;
  return parseFloat(val.replace(/%/g, '').trim());
};

export const RAW_DATA: DailyRecord[] = [
  {
    date: '26 Mar',
    timestamp: new Date('2026-03-26').getTime(),
    productivity: { t100: 342.49, t50: 203.43, t30: 173.64 },
    ob: { plan: 17667.03, actual: 14015.08, fuel: 6477.00 },
    cg: { plan: 2347.70, actual: 0, fuel: 0 },
    weather: { rainPlan: 4.81, rainActual: 0, slipperyPlan: 1.83, slipperyActual: 0, rainfall: 0 },
    pa: { loader: 100, hauler: 86, cg: 100, grader: 100, bulldozer: 80, support: 100 }
  },
  {
    date: '27 Mar',
    timestamp: new Date('2026-03-27').getTime(),
    productivity: { t100: 344.70, t50: 204.68, t30: 0 },
    ob: { plan: 8833.51, actual: 11167.47, fuel: 14300.00 },
    cg: { plan: 1173.85, actual: 93.82, fuel: 465.00 },
    weather: { rainPlan: 2.41, rainActual: 3.77, slipperyPlan: 0.92, slipperyActual: 0.30, rainfall: 10.50 },
    pa: { loader: 100, hauler: 86, cg: 100, grader: 100, bulldozer: 0, support: 100 }
  },
  {
    date: '28 Mar',
    timestamp: new Date('2026-03-28').getTime(),
    productivity: { t100: 383.75, t50: 200.03, t30: 147.17 },
    ob: { plan: 16922.03, actual: 18042.68, fuel: 13564.00 },
    cg: { plan: 2248.70, actual: 3353.83, fuel: 380.00 },
    weather: { rainPlan: 4.81, rainActual: 1.00, slipperyPlan: 1.83, slipperyActual: 3.18, rainfall: 0 },
    pa: { loader: 100, hauler: 87, cg: 100, grader: 95, bulldozer: 63, support: 100 }
  },
  {
    date: '29 Mar',
    timestamp: new Date('2026-03-29').getTime(),
    productivity: { t100: 372.95, t50: 186.24, t30: 0 },
    ob: { plan: 17667.03, actual: 22199.86, fuel: 15979.00 },
    cg: { plan: 2347.70, actual: 3916.56, fuel: 896.00 },
    weather: { rainPlan: 4.81, rainActual: 0, slipperyPlan: 1.83, slipperyActual: 0, rainfall: 0 },
    pa: { loader: 100, hauler: 83, cg: 87, grader: 87, bulldozer: 87, support: 87 }
  },
  {
    date: '30 Mar',
    timestamp: new Date('2026-03-30').getTime(),
    productivity: { t100: 272.95, t50: 167.45, t30: 26.23 },
    ob: { plan: 17667.03, actual: 2718.95, fuel: 5632.00 },
    cg: { plan: 2347.70, actual: 640.66, fuel: 279.00 },
    weather: { rainPlan: 4.81, rainActual: 8.83, slipperyPlan: 1.83, slipperyActual: 6.08, rainfall: 33.00 },
    pa: { loader: 100, hauler: 86, cg: 100, grader: 100, bulldozer: 100, support: 76 }
  },
  {
    date: '31 Mar',
    timestamp: new Date('2026-03-31').getTime(),
    productivity: { t100: 315.40, t50: 161.37, t30: 66.26 },
    ob: { plan: 17667.03, actual: 12305.70, fuel: 10045.00 },
    cg: { plan: 2347.70, actual: 3191.34, fuel: 841.00 },
    weather: { rainPlan: 4.81, rainActual: 3.42, slipperyPlan: 1.83, slipperyActual: 0, rainfall: 7.00 },
    pa: { loader: 100, hauler: 83, cg: 100, grader: 100, bulldozer: 8, support: 100 }
  },
  {
    date: '1 Apr',
    timestamp: new Date('2026-04-01').getTime(),
    productivity: { t100: 324.05, t50: 127.16, t30: 0 },
    ob: { plan: 17667.03, actual: 2421.34, fuel: 509.00 },
    cg: { plan: 2347.70, actual: 2079.12, fuel: 0 },
    weather: { rainPlan: 4.81, rainActual: 4.00, slipperyPlan: 1.83, slipperyActual: 2.72, rainfall: 46.50 },
    pa: { loader: 100, hauler: 82, cg: 100, grader: 100, bulldozer: 100, support: 100 }
  },
  {
    date: '2 Apr',
    timestamp: new Date('2026-04-02').getTime(),
    productivity: { t100: 271.20, t50: 141.40, t30: 84.20 },
    ob: { plan: 17667.03, actual: 2923.02, fuel: 6400.00 },
    cg: { plan: 2347.70, actual: 816.51, fuel: 588.00 },
    weather: { rainPlan: 4.81, rainActual: 8.90, slipperyPlan: 1.83, slipperyActual: 0, rainfall: 1.50 },
    pa: { loader: 100, hauler: 84, cg: 100, grader: 100, bulldozer: 100, support: 100 }
  },
  {
    date: '3 Apr',
    timestamp: new Date('2026-04-03').getTime(),
    productivity: { t100: 319.04, t50: 112.31, t30: 25.47 },
    ob: { plan: 8833.51, actual: 13749.51, fuel: 15103.00 },
    cg: { plan: 1173.85, actual: 2487.15, fuel: 369.00 },
    weather: { rainPlan: 2.41, rainActual: 0, slipperyPlan: 0.92, slipperyActual: 0, rainfall: 0 },
    pa: { loader: 100, hauler: 90, cg: 86, grader: 86, bulldozer: 86, support: 86 }
  },
  {
    date: '4 Apr',
    timestamp: new Date('2026-04-04').getTime(),
    productivity: { t100: 342.02, t50: 157.76, t30: 84.50 },
    ob: { plan: 16922.03, actual: 17590.22, fuel: 14791.00 },
    cg: { plan: 2248.70, actual: 2912.91, fuel: 1232.00 },
    weather: { rainPlan: 4.81, rainActual: 0.30, slipperyPlan: 1.83, slipperyActual: 0, rainfall: 5.50 },
    pa: { loader: 100, hauler: 87, cg: 100, grader: 100, bulldozer: 100, support: 100 }
  },
  {
    date: '5 Apr',
    timestamp: new Date('2026-04-05').getTime(),
    productivity: { t100: 322.74, t50: 95.50, t30: 149.66 },
    ob: { plan: 17667.03, actual: 9768.38, fuel: 12073.00 },
    cg: { plan: 2347.70, actual: 1988.79, fuel: 258.00 },
    weather: { rainPlan: 4.81, rainActual: 7.70, slipperyPlan: 1.83, slipperyActual: 1.33, rainfall: 31.00 },
    pa: { loader: 100, hauler: 90, cg: 95, grader: 95, bulldozer: 95, support: 95 }
  },
  {
    date: '6 Apr',
    timestamp: new Date('2026-04-06').getTime(),
    productivity: { t100: 329.32, t50: 222.12, t30: 132.27 },
    ob: { plan: 17667.03, actual: 7452.62, fuel: 5284.00 },
    cg: { plan: 2347.70, actual: 1549.52, fuel: 600.00 },
    weather: { rainPlan: 4.81, rainActual: 5.33, slipperyPlan: 1.83, slipperyActual: 5.12, rainfall: 2.00 },
    pa: { loader: 100, hauler: 93, cg: 100, grader: 100, bulldozer: 100, support: 100 }
  },
  {
    date: '7 Apr',
    timestamp: new Date('2026-04-07').getTime(),
    productivity: { t100: 359.20, t50: 119.80, t30: 131.73 },
    ob: { plan: 17667.03, actual: 16778.00, fuel: 13965.00 },
    cg: { plan: 2347.70, actual: 3309.07, fuel: 497.00 },
    weather: { rainPlan: 4.81, rainActual: 0, slipperyPlan: 1.83, slipperyActual: 0, rainfall: 0 },
    pa: { loader: 99, hauler: 86, cg: 100, grader: 100, bulldozer: 100, support: 100 }
  },
  {
    date: '8 Apr',
    timestamp: new Date('2026-04-08').getTime(),
    productivity: { t100: 288.98, t50: 159.48, t30: 0 },
    ob: { plan: 17667.03, actual: 5725.32, fuel: 9805.00 },
    cg: { plan: 2347.70, actual: 1446.48, fuel: 349.00 },
    weather: { rainPlan: 4.81, rainActual: 9.03, slipperyPlan: 1.83, slipperyActual: 4.75, rainfall: 15.00 },
    pa: { loader: 100, hauler: 86, cg: 100, grader: 100, bulldozer: 88, support: 100 }
  },
  {
    date: '9 Apr',
    timestamp: new Date('2026-04-09').getTime(),
    productivity: { t100: 329.70, t50: 142.38, t30: 66.53 },
    ob: { plan: 17667.03, actual: 14026.62, fuel: 9593.00 },
    cg: { plan: 3248.84, actual: 1576.65, fuel: 66.00 },
    weather: { rainPlan: 4.81, rainActual: 0, slipperyPlan: 1.83, slipperyActual: 1.95, rainfall: 0 },
    pa: { loader: 100, hauler: 85, cg: 100, grader: 100, bulldozer: 75, support: 100 }
  },
  {
    date: '10 Apr',
    timestamp: new Date('2026-04-10').getTime(),
    productivity: { t100: 340.87, t50: 202.08, t30: 135.90 },
    ob: { plan: 8833.51, actual: 9119.12, fuel: 9775.00 },
    cg: { plan: 1624.42, actual: 2133.36, fuel: 446.00 },
    weather: { rainPlan: 2.41, rainActual: 4.00, slipperyPlan: 0.92, slipperyActual: 2.33, rainfall: 2.00 },
    pa: { loader: 100, hauler: 93, cg: 100, grader: 100, bulldozer: 100, support: 100 }
  },
  {
    date: '11 Apr',
    timestamp: new Date('2026-04-11').getTime(),
    productivity: { t100: 248.82, t50: 175.10, t30: 134.67 },
    ob: { plan: 16922.03, actual: 3262.55, fuel: 6708.00 },
    cg: { plan: 3111.84, actual: 1675.16, fuel: 805.00 },
    weather: { rainPlan: 4.81, rainActual: 6.75, slipperyPlan: 1.83, slipperyActual: 4.52, rainfall: 21.00 },
    pa: { loader: 100, hauler: 93, cg: 100, grader: 100, bulldozer: 100, support: 100 }
  },
  {
    date: '12 Apr',
    timestamp: new Date('2026-04-12').getTime(),
    productivity: { t100: 291.92, t50: 175.82, t30: 0 },
    ob: { plan: 17667.03, actual: 6032.31, fuel: 7980.00 },
    cg: { plan: 3248.84, actual: 1745.52, fuel: 330.00 },
    weather: { rainPlan: 4.81, rainActual: 7.00, slipperyPlan: 1.83, slipperyActual: 3.98, rainfall: 10.00 },
    pa: { loader: 100, hauler: 90, cg: 100, grader: 100, bulldozer: 80, support: 100 }
  }
];

export const getMonthNames = () => {
  const months = new Set<string>();
  RAW_DATA.forEach(d => {
    const month = d.date.split(' ')[1];
    months.add(month);
  });
  return Array.from(months);
};

export const filterByMonth = (month: string) => {
  return RAW_DATA.filter(d => d.date.endsWith(month));
};
