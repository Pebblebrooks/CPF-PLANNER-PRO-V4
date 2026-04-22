// ── CPF LIFE 2026 Payout Reference Dataset ──────────────────────────────────
// Source: CPF Board Monthly Payout Estimator (2026 cohort, male, payout age 65).
// CPF Board does not publish exact actuarial/mortality formulas — industry standard
// is to use verified Estimator data points with linear interpolation between them.
// Escalating ≈ 80% of Standard; Basic ≈ 92% of Standard (confirmed across all RA levels).
// Female: apply 0.93 multiplier to male figures (longer life expectancy).
export const CPF_LIFE_TABLE_M = [
  { ra:  50000, std:  490, esc:  390, bas:  450 },
  { ra: 110200, std:  950, esc:  760, bas:  880 }, // BRS
  { ra: 150000, std: 1250, esc: 1000, bas: 1150 },
  { ra: 220400, std: 1780, esc: 1420, bas: 1640 }, // FRS
  { ra: 300000, std: 2380, esc: 1900, bas: 2190 },
  { ra: 440800, std: 3440, esc: 2750, bas: 3160 }, // ERS
];
export const FEMALE_PAYOUT_MULTIPLIER = 0.93;

// Phase 1B trigger age: age when RA_Retained drops below $60K and payout slope begins.
// Source: CPF LIFE Basic Plan documentation (2026 cohort estimates).
// Members with larger RA stay in Phase 1A longer before Phase 1B slope begins.
const BASIC_PHASE1B_TRIGGER = [
  { ra:  100000, triggerAge: 73 },
  { ra:  150000, triggerAge: 78 },
  { ra:  200000, triggerAge: 81 },
  { ra:  300000, triggerAge: 85 },
  { ra:  400000, triggerAge: 87 },
  { ra:  500000, triggerAge: 88 },
];

// Interpolate Phase 1B trigger age for a given RA and payout start age.
// pAge offset: deferring payout means RA is larger AND Phase 1A lasts longer.
export const interpolatePhase1bTrigger = (raBalance, pAge) => {
  const tbl = BASIC_PHASE1B_TRIGGER;
  let baseAge;
  if (raBalance <= tbl[0].ra) {
    baseAge = tbl[0].triggerAge - (tbl[0].ra - raBalance) / tbl[0].ra * 4;
  } else if (raBalance >= tbl[tbl.length-1].ra) {
    baseAge = Math.min(89, tbl[tbl.length-1].triggerAge + (raBalance - tbl[tbl.length-1].ra) / 100000);
  } else {
    let lo = tbl[0], hi = tbl[1];
    for (let i = 0; i < tbl.length-1; i++) {
      if (raBalance >= tbl[i].ra && raBalance <= tbl[i+1].ra) { lo = tbl[i]; hi = tbl[i+1]; break; }
    }
    baseAge = lo.triggerAge + (raBalance - lo.ra) * ((hi.triggerAge - lo.triggerAge) / (hi.ra - lo.ra));
  }
  // Deferral offset: each year of deferral beyond 65 shifts trigger ~0.8 yrs later
  const deferralOffset = Math.max(0, pAge - 65) * 0.8;
  return Math.min(89, Math.round(baseAge + deferralOffset));
};

// Phase 2 payout drop % relative to Phase 1A, sourced from CPF LIFE Basic Plan estimates.
// Phase 2 payout = Phase 1A × (1 − drop). Larger RA → smaller drop (more self-sustaining).
// Source: CPF Basic Plan payout model documentation (2026 cohort).
const BASIC_PHASE2_DROP = [
  { ra:  100000, drop: 0.072 },
  { ra:  200000, drop: 0.067 },
  { ra:  300000, drop: 0.058 },
  { ra:  400000, drop: 0.053 },
  { ra:  500000, drop: 0.051 },
  { ra:  700000, drop: 0.042 },
  { ra: 1000000, drop: 0.034 },
];

// Linear interpolation of Phase 2 drop % for any RA balance.
export const interpolatePhase2Drop = (raBalance) => {
  if (raBalance <= 0) return 0.072;
  const tbl = BASIC_PHASE2_DROP;
  if (raBalance <= tbl[0].ra) return tbl[0].drop;
  if (raBalance >= tbl[tbl.length - 1].ra) return tbl[tbl.length - 1].drop;
  let lo = tbl[0], hi = tbl[1];
  for (let i = 0; i < tbl.length - 1; i++) {
    if (raBalance >= tbl[i].ra && raBalance <= tbl[i + 1].ra) { lo = tbl[i]; hi = tbl[i + 1]; break; }
  }
  return lo.drop + (raBalance - lo.ra) * ((hi.drop - lo.drop) / (hi.ra - lo.ra));
};

// Newton-Raphson solver: find the effective monthly rate r such that
// PMT × [1-(1+r)^-n]/r = PV  (i.e. the rate that depletes PV to $0 in n months paying PMT/mo).
// Used to track RA_Retained depletion correctly when Phase 1A PMT comes from lookup table.
export const solveEffectiveRate = (pmt, pv, n) => {
  if (pmt <= 0 || pv <= 0 || n <= 0) return 0.04 / 12;
  let r = 0.06 / 12;
  for (let i = 0; i < 120; i++) {
    const factor = (1 - Math.pow(1 + r, -n)) / r;
    const f = pmt * factor - pv;
    const df = pmt * ((-n * Math.pow(1 + r, -n - 1) * r - (1 - Math.pow(1 + r, -n))) / (r * r));
    if (Math.abs(df) < 1e-15) break;
    r -= f / df;
    if (r <= 0.001 / 12) r = 0.001 / 12;
    if (r > 0.20 / 12) r = 0.20 / 12;
  }
  return r;
};

// Linear interpolation between two known CPF Estimator data points.
// For RA above ERS: extrapolate using the slope of the last two points.
// For RA below minimum: scale proportionally from the first data point.
export const interpolateCpfLife = (raBalance, plan, isMale) => {
  const tbl = CPF_LIFE_TABLE_M;
  let monthly;
  if (raBalance <= 0) return 0;
  if (raBalance <= tbl[0].ra) {
    // Below minimum — scale proportionally from first point
    monthly = tbl[0][plan] * (raBalance / tbl[0].ra);
  } else if (raBalance >= tbl[tbl.length - 1].ra) {
    // Above ERS — extrapolate using last two points
    const lo = tbl[tbl.length - 2], hi = tbl[tbl.length - 1];
    monthly = hi[plan] + (raBalance - hi.ra) * ((hi[plan] - lo[plan]) / (hi.ra - lo.ra));
  } else {
    // Standard linear interpolation between bracket
    let lo = tbl[0], hi = tbl[1];
    for (let i = 0; i < tbl.length - 1; i++) {
      if (raBalance >= tbl[i].ra && raBalance <= tbl[i + 1].ra) { lo = tbl[i]; hi = tbl[i + 1]; break; }
    }
    monthly = lo[plan] + (raBalance - lo.ra) * ((hi[plan] - lo[plan]) / (hi.ra - lo.ra));
  }
  return Math.max(0, monthly * (isMale ? 1 : FEMALE_PAYOUT_MULTIPLIER));
};

// Shared Basic Plan parameter setup — used by payoutProjection and sensitivityData.
// Accepts phase1aMonthly from caller so each site can source it differently:
//   payoutProjection  → lifePlans.basic.start  (gender-adjusted lookup, already computed)
//   sensitivityData   → interpolateCpfLife(raVal, 'bas', isMaleSens)  (per-pAge RA)
export const computeBasicPlanParams = (raVal, pAge, phase1aMonthly, premiumPct) => {
  const bPct         = (premiumPct || 10) / 100;
  const premium      = raVal * bPct;
  const pv           = raVal * (1 - bPct);
  const nMonths      = Math.max(12, (90 - pAge) * 12);
  const phase1aAnnual  = phase1aMonthly * 12;
  const dropPct      = interpolatePhase2Drop(raVal);
  const phase2Annual = phase1aAnnual * (1 - dropPct);
  const phase1bTrigger = interpolatePhase1bTrigger(raVal, pAge);
  const effR         = solveEffectiveRate(phase1aMonthly, pv, nMonths);
  const effAnnualFactor = Math.pow(1 + effR, 12);
  return { premium, pv, nMonths, phase1aAnnual, dropPct, phase2Annual, phase1bTrigger, effR, effAnnualFactor };
};

// CQ-1: Shared Basic Plan year-payout helper — eliminates the duplicated Phase 1A/1B/2
// decision tree that previously existed identically in payoutProjection AND sensitivityData.
// Returns {basPay, newRaRem} for one projection year. Caller is responsible for accumulating
// cumPayoutBasicPool (Phase 2 bequest calc) — it is not tracked here to keep the function pure.
//
// Params: age, phase1bTrigger, phase1aAnnual, phase2Annual, basicRaRem, effAnnualFactor
// Returns: { basPay: annual payout this year, newRaRem: updated RA_Retained }
export const computeBasicPlanYearPayout = (age, phase1bTrigger, phase1aAnnual, phase2Annual, basicRaRem, effAnnualFactor) => {
  if (age < 90) {
    let basPay;
    if (age < phase1bTrigger) {
      // Phase 1A: stable lookup-table payout
      basPay = phase1aAnnual;
    } else {
      // Phase 1B: linear decline from Phase 1A → Phase 2 between trigger age and 90
      const yTotal = 90 - phase1bTrigger;
      const yLeft  = 90 - age;
      const t = yTotal > 0 ? yLeft / yTotal : 0;
      basPay = phase2Annual + t * (phase1aAnnual - phase2Annual);
    }
    // RA_Retained: effective annual factor (~8–11%/yr) embeds the annuity pool subsidy,
    // calibrated to deplete basicPV to $0 at age 90 at the lookup-table PMT.
    const newRaRem = Math.max(0, (basicRaRem * effAnnualFactor) - basPay);
    return { basPay, newRaRem };
  } else {
    // Phase 2 (age ≥ 90): lower constant payout from communal annuity pool
    return { basPay: phase2Annual, newRaRem: 0 };
  }
};

// CQ-2: Pure helper that computes one sensitivity-table row for a given payout age.
// Extracted from the sensitivityData useMemo so the per-pAge accumulation loop is no
// longer duplicated alongside the payoutProjection loop — it lives here once.
//
// Params:
//   pAge             — payout age to evaluate (e.g. 65–70)
//   raAfterTransfer  — RA balance at pAge after the standard 20% OA transfer deduction
//   isMale           — gender flag (same as debouncedInputs.isMale)
//   basicPremiumPct  — premium percentage for Basic Plan (usually ~10)
//
// Returns: { pAge, stdMonthly, escMonthly, basMonthly, escVsStd, stdVsBasic, escVsBasic }
export const computeSensitivityRow = (pAge, raAfterTransfer, isMale, basicPremiumPct) => {
  const stdStart = interpolateCpfLife(raAfterTransfer, 'std', isMale);
  const escStart = interpolateCpfLife(raAfterTransfer, 'esc', isMale);

  const { premium: basicPremS, pv: basicPVS,
          phase1aAnnual: basicP1aAnnual, phase2Annual: basicP2Annual,
          phase1bTrigger: phase1bTriggerS, effAnnualFactor: basicEffAFS
        } = computeBasicPlanParams(raAfterTransfer, pAge, interpolateCpfLife(raAfterTransfer, 'bas', isMale), basicPremiumPct);

  let basicRaRem = basicPVS, cumStd = 0, cumEsc = 0, cumBas = 0;
  let escVsStd = null, stdVsBasic = null, escVsBasic = null;

  for (let age = pAge; age <= 95; age++) {
    const yr = age - pAge;
    const stdPay = stdStart * 12;
    const escPay = (escStart * Math.pow(1.02, yr)) * 12;
    cumStd += stdPay; cumEsc += escPay;

    const { basPay, newRaRem } = computeBasicPlanYearPayout(
      age, phase1bTriggerS, basicP1aAnnual, basicP2Annual, basicRaRem, basicEffAFS
    );
    let basBeq = 0;
    if (age < 90) {
      basicRaRem = newRaRem;
      basBeq = basicRaRem + basicPremS;
    } else {
      basicRaRem = 0;
      basBeq = Math.max(0, basicPremS - cumBas);
    }
    cumBas += basPay;

    // E2 fix: bequest pool uses post-transfer RA
    const stdBeq = Math.max(0, raAfterTransfer - cumStd);
    const escBeq = Math.max(0, raAfterTransfer - cumEsc);
    const stdT = cumStd + stdBeq, escT = cumEsc + escBeq, basT = cumBas + basBeq;
    if (!escVsStd   && age > pAge && escT > stdT)  escVsStd   = age;
    if (!stdVsBasic && age > pAge && stdT > basT)  stdVsBasic = age;
    if (!escVsBasic && age > pAge && escT > basT)  escVsBasic = age;
  }

  return {
    pAge,
    stdMonthly: Math.round(stdStart),
    escMonthly: Math.round(escStart),
    basMonthly: Math.round(interpolateCpfLife(raAfterTransfer, 'bas', isMale)),
    escVsStd, stdVsBasic, escVsBasic
  };
};

// ── makeComputeGF ─────────────────────────────────────────────────────────────
// Factory that returns a computeGF closure bound to the given engine setup variables.
// Both runRSSEngine and runProjectionEngine previously defined an identical inline
// closure — this single factory eliminates that duplication.
//
// Usage inside each engine (after all setup variables are declared):
//   const computeGF = makeComputeGF(startAge, salaryGrowth, salaryPhaseAge,
//                                   salaryGrowthRate2, careerBreakStart, careerBreakEnd);
//
// Returns: (age: number, bump?: number) => number
//   — salary growth factor at a given age, respecting phase change and career break.
//   — Phase 1: (1+r1)^(age-startAge)
//   — Phase 2 (age >= phaseAge): (1+r1)^(phaseAge-startAge) * (1+r2)^(age-phaseAge)
//   — Career break: returns 0 for ages within [breakStart, breakEnd]
export const makeComputeGF = (startAge, salaryGrowth, salaryPhaseAge, salaryGrowthRate2, careerBreakStart, careerBreakEnd) =>
  (age, bump = 0) => {
    const inBreak = careerBreakStart !== null && careerBreakEnd !== null && age >= careerBreakStart && age <= careerBreakEnd;
    if (inBreak) return 0;
    const yearsTotal = Math.max(0, age - startAge);
    let gfVal;
    if (salaryPhaseAge !== null && age >= salaryPhaseAge) {
      const years1 = Math.max(0, salaryPhaseAge - startAge);
      const years2 = Math.max(0, age - salaryPhaseAge);
      gfVal = Math.pow(1 + salaryGrowth, years1) * Math.pow(1 + salaryGrowthRate2, years2);
    } else {
      gfVal = Math.pow(1 + salaryGrowth, yearsTotal);
    }
    return gfVal * (1 + bump);
  };
