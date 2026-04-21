import { useMemo } from 'react';
import { RETIREMENT_SUMS_2026 } from '../config/constants.js';
import {
  interpolateCpfLife,
  computeBasicPlanParams,
  computeBasicPlanYearPayout,
} from '../engine/actuarial.js';
import { runProjectionEngine } from '../engine/projectionEngine.js';
import { runRSSEngine }        from '../engine/rssEngine.js';

// ─── useProjection ────────────────────────────────────────────────────────────
// Core data pipeline for CPF Planner Pro.
//
// Accepts:
//   debouncedInputs  — debounced copy of the user's input state (180ms lag)
//   isRealDollars    — boolean toggle (deflated vs nominal display)
//   basicPremiumPct  — Basic Plan premium % (UI slider, default 10)
//
// Returns a stable object whose fields map 1:1 to the useMemos and inline
// derived values previously scattered across App.jsx lines 4581–4934:
//
//   engineKey            — JSON key driving the projection useMemo
//   projection           — raw engine output array (nominal)
//   projectionByAge      — Map<age, row> for O(1) lookup
//   lifePlans            — { standard, escalating, basic } monthly payout objects
//   payoutProjection     — year-by-year CPF LIFE payout + bequest + net worth
//   displayProjection    — payoutProjection deflated if isRealDollars
//   displayAccumulation  — projection deflated if isRealDollars
//   accumulationByAge    — Map<age, row> of displayAccumulation
//   payoutByAge          — Map<age, row> of payoutProjection
//   displayProjectionByAge — Map<age, row> of displayProjection
//
//   payoutAge65          — debounced payoutAge (number)
//   raAtPayout           — RA balance at payoutAge65 (nominal)
//   raAfterTransfer      — RA after 20% CPF OA-transfer deduction
//   raOaTransfer         — the 20% transfer amount
//   cumulativeCashTopUps — cumulative SA/RA cash top-ups to payout age
//   cumulativeRaInterest — cumulative SA/RA interest to payout age
//
//   effectiveOaDrawMonthly  — monthly OA draw (respects DieWithZero override)
//   effectiveOaDrawStartAge — OA draw start age (respects DieWithZero)
//   effectiveOaDrawFloor    — OA draw floor (0 when DieWithZero active)
//
// Extraction note: all useMemos and inline values are reproduced verbatim from
// App.jsx. The only change is that they receive their inputs via parameters
// rather than closing over App() component state.
// ─────────────────────────────────────────────────────────────────────────────

export function useProjection(debouncedInputs, isRealDollars, basicPremiumPct) {

  // ── engineKey: stable JSON string that gates all downstream projection work ──
  // Destructuring here is the authoritative list of every field that affects
  // engine output. Adding a new field to the engine requires adding it here too.
  const engineKey = useMemo(() => {
    const {
      currentAge, currentYear, payoutAge, contributionStopAge, housingStopAge,
      isSelfEmployed, isMale, oaBalance, saBalance, maBalance,
      empOaCont, empSaCont, empMaCont, vc3aCash, vcSaTopup, vcVhr,
      annualGovGrant, wisAmount,
      oaToSaTransfer, oaToMaTransfer, oaWithdrawalAt55,
      usePropertyPledge, pledgeWithdrawalAmount, pledgeWithdrawalAge,
      cpfisOaAmount, cpfisSaAmount, housingOutflow, oaEduLoan, oaEduLoanFreq,
      medicalUsage, medishieldIP, elderCareShield,
      medicalInflationRate, propertyValue, propertyGrowthRate,
      propertyLeasehold, propertyLeaseYears, inflationRate, includeProperty,
      salaryGross, salaryBonus, salaryGrowthRate, netTradeIncome,
      sellPropertyAge,
      currentPrivateAssets, annualPrivateSaving, privateAssetGrowthRate,
      plannedDownpaymentOA, downpaymentAge,
      srsBalance, srsAnnualContribution, srsContribStopAge, srsReturnRate,
      srsDrawdownStartAge, srsDrawdownYears,
      oaDrawdownStartAge, oaDrawdownMonthly, oaDrawdownFloor,
      propMonetiseEnabled, propMonetiseScheme, propMonetiseAge,
      propMonetiseCashProceeds, propMonetiseRaTopup,
      vcMaCash, oaToMaForLovedOne, oaToSaForLovedOne, citizenStatus, prYear, prRateType, isPwD,
      vc3aFreq, vcSaFreq, vcMaFreq, vcVhrFreq, govGrantFreq, wisFreq,
      cpfisOaFreq, cpfisSaFreq, housingFreq, oaWithdrawalFreq, oaToMaFreq, oaToSaFreq,
      vc3aDur, vcSaDur, vcMaDur, vcVhrDur, govGrantDur, wisDur,
      cpfisOaDur, cpfisSaDur, housingDur, oaToMaDur, oaToSaDur, oaEduLoanDur,
      dieWithZeroEnabled, dieWithZeroAge,
      retirementSumGrowth,
      salaryPhaseAge, salaryGrowthRate2, careerBreakStartAge, careerBreakEndAge,
      lifeEvents,
      cpfScheme, rssPayoutStartAge, rssMonthlyPayout, lifeMigrationAge, lifePlanAtMigration,
    } = debouncedInputs;
    return JSON.stringify({
      currentAge, currentYear, payoutAge, contributionStopAge, housingStopAge,
      isSelfEmployed, isMale, oaBalance, saBalance, maBalance,
      empOaCont, empSaCont, empMaCont, vc3aCash, vcSaTopup, vcVhr,
      annualGovGrant, wisAmount,
      oaToSaTransfer, oaToMaTransfer, oaWithdrawalAt55,
      usePropertyPledge, pledgeWithdrawalAmount, pledgeWithdrawalAge,
      cpfisOaAmount, cpfisSaAmount, housingOutflow, oaEduLoan, oaEduLoanFreq,
      medicalUsage, medishieldIP, elderCareShield,
      medicalInflationRate, propertyValue, propertyGrowthRate,
      propertyLeasehold, propertyLeaseYears, inflationRate, includeProperty,
      salaryGross, salaryBonus, salaryGrowthRate, netTradeIncome,
      sellPropertyAge,
      currentPrivateAssets, annualPrivateSaving, privateAssetGrowthRate,
      plannedDownpaymentOA, downpaymentAge,
      srsBalance, srsAnnualContribution, srsContribStopAge, srsReturnRate,
      srsDrawdownStartAge, srsDrawdownYears,
      oaDrawdownStartAge, oaDrawdownMonthly, oaDrawdownFloor,
      propMonetiseEnabled, propMonetiseScheme, propMonetiseAge,
      propMonetiseCashProceeds, propMonetiseRaTopup,
      vcMaCash, oaToMaForLovedOne, oaToSaForLovedOne, citizenStatus, prYear, prRateType, isPwD,
      vc3aFreq, vcSaFreq, vcMaFreq, vcVhrFreq, govGrantFreq, wisFreq,
      cpfisOaFreq, cpfisSaFreq, housingFreq, oaWithdrawalFreq, oaToMaFreq, oaToSaFreq,
      vc3aDur, vcSaDur, vcMaDur, vcVhrDur, govGrantDur, wisDur,
      cpfisOaDur, cpfisSaDur, housingDur, oaToMaDur, oaToSaDur, oaEduLoanDur,
      dieWithZeroEnabled, dieWithZeroAge,
      retirementSumGrowth,
      salaryPhaseAge, salaryGrowthRate2, careerBreakStartAge, careerBreakEndAge,
      lifeEvents,
      cpfScheme, rssPayoutStartAge, rssMonthlyPayout, lifeMigrationAge, lifePlanAtMigration,
    });
  }, [debouncedInputs]);

  // ── projection: main engine run (routes to RSS or CPF LIFE engine) ──────────
  const projection = useMemo(() => {
    const isRSS = debouncedInputs.cpfScheme === 'rss';
    const engineFn = isRSS ? runRSSEngine : runProjectionEngine;

    if (debouncedInputs.dieWithZeroEnabled) {
      // Q3 fix: RSS members use currentAge as draw start (payoutAge is outside their window)
      const pa   = isRSS
        ? (Number(debouncedInputs.currentAge) || 68)
        : (Number(debouncedInputs.payoutAge) || 65);
      const dwzA = Number(debouncedInputs.dieWithZeroAge) || 85;
      const n    = Math.max(1, dwzA - pa);
      const rOA  = 0.025;

      // Pass 1: no drawdown — read OA balance at payout age
      const pass1 = engineFn({ ...debouncedInputs, oaDrawdownMonthly: 0, oaDrawdownStartAge: 0 });
      const pass1ByAge = new Map(pass1.map(r => [r.age, r]));
      const oaAtPayout = pass1ByAge.get(pa)?.oa || 0;
      const dwzPmt = oaAtPayout > 0
        ? (rOA > 0 ? Math.round(oaAtPayout * rOA / (1 - Math.pow(1 + rOA, -n)) / 12) : Math.round(oaAtPayout / n / 12))
        : 0;

      // Pass 2: apply PMT draw
      const pass2 = engineFn({ ...debouncedInputs, oaDrawdownMonthly: dwzPmt, oaDrawdownStartAge: pa, oaDrawdownFloor: 0 });
      const pass2ByAge = new Map(pass2.map(r => [r.age, r]));
      const residualOa = pass2ByAge.get(dwzA)?.oa || 0;

      // NX3 fix: first-order residual correction pass
      let finalPmt  = dwzPmt;
      let finalPass = pass2;
      if (residualOa > 500 && dwzPmt > 0) {
        const correctionMonthly = Math.round(residualOa / Math.max(1, n * 12));
        finalPmt  = dwzPmt + correctionMonthly;
        finalPass = engineFn({ ...debouncedInputs, oaDrawdownMonthly: finalPmt, oaDrawdownStartAge: pa, oaDrawdownFloor: 0 });
      }
      const finalPassByAge = new Map(finalPass.map(r => [r.age, r]));
      finalPass._dwzOaMonthly  = finalPmt;
      finalPass._dwzStartAge   = pa;
      finalPass._dwzResidualOa = finalPassByAge.get(dwzA)?.oa || 0;
      // H2 fix: always initialise _dwzResidualPriv so downstream reads never produce NaN
      finalPass._dwzResidualPriv = 0;

      // P1-D fix: private-asset DWZ draw — mirrors OA three-pass pattern
      const rPriv = Math.max(0, (Number(debouncedInputs.privateAssetGrowthRate) || 0) / 100);
      const privAtPayout = finalPassByAge.get(pa)?.privateAssets || 0;
      let pmtPrivAnnual = privAtPayout > 0
        ? (rPriv > 0
            ? Math.round(privAtPayout * rPriv / (1 - Math.pow(1 + rPriv, -n)))
            : Math.round(privAtPayout / n))
        : 0;

      if (pmtPrivAnnual > 0) {
        let privPass = engineFn(
          { ...debouncedInputs, oaDrawdownMonthly: finalPmt, oaDrawdownStartAge: pa, oaDrawdownFloor: 0 },
          { overridePrivDrawdown: pmtPrivAnnual, overridePrivDrawdownStart: pa }
        );
        let privPassByAge = new Map(privPass.map(r => [r.age, r]));
        const residualPriv = privPassByAge.get(dwzA)?.privateAssets || 0;

        // BUG-9 fix: engine adds privateSaving every year — spread residual over drawdown window
        if (residualPriv > 500 && pmtPrivAnnual > 0) {
          const correctionAnnual = Math.round(residualPriv / Math.max(1, n));
          pmtPrivAnnual += correctionAnnual;
          privPass = engineFn(
            { ...debouncedInputs, oaDrawdownMonthly: finalPmt, oaDrawdownStartAge: pa, oaDrawdownFloor: 0 },
            { overridePrivDrawdown: pmtPrivAnnual, overridePrivDrawdownStart: pa }
          );
          privPassByAge = new Map(privPass.map(r => [r.age, r]));
        }
        finalPass = privPass;
        finalPass._dwzOaMonthly    = finalPmt;
        finalPass._dwzStartAge     = pa;
        finalPass._dwzResidualOa   = privPassByAge.get(dwzA)?.oa || 0;
        finalPass._dwzResidualPriv = privPassByAge.get(dwzA)?.privateAssets || 0;
      }
      finalPass._dwzPrivMonthly = Math.round(pmtPrivAnnual / 12);
      return finalPass;
    }
    return engineFn(debouncedInputs);
  }, [engineKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── O(1) Maps ────────────────────────────────────────────────────────────────
  const projectionByAge = useMemo(
    () => new Map((projection || []).map(r => [r.age, r])),
    [projection]);

  // ── Inline derived values (not useMemos — pure reads, stable on same projection) ──
  const effectiveOaDrawMonthly  = debouncedInputs.dieWithZeroEnabled ? (projection._dwzOaMonthly || 0) : (Number(debouncedInputs.oaDrawdownMonthly) || 0);
  const effectiveOaDrawStartAge = debouncedInputs.dieWithZeroEnabled ? (projection._dwzStartAge || Number(debouncedInputs.payoutAge) || 65) : (Number(debouncedInputs.oaDrawdownStartAge) || 0);
  const effectiveOaDrawFloor    = debouncedInputs.dieWithZeroEnabled ? 0 : (Number(debouncedInputs.oaDrawdownFloor) || 0);

  const payoutAge65 = Number(debouncedInputs.payoutAge) || 65;
  const raAtPayout  = projectionByAge.get(payoutAge65)?.ra || 0;

  // 20% RA→OA transfer at payout age (CPF policy)
  // RSS guard: pure RSS members skip this — transfer is handled inside runRSSEngine at migration.
  const _isRSSForTransfer = debouncedInputs.cpfScheme === 'rss';
  const payoutRow65 = _isRSSForTransfer ? null : projectionByAge.get(payoutAge65);
  const cumulativeCashTopUps = payoutRow65?.cumRaCashTopUps ?? 0;
  const cumulativeRaInterest = payoutRow65?.cumRaInterest ?? 0;
  const raTransferBase  = _isRSSForTransfer ? 0 : Math.max(0, raAtPayout - cumulativeCashTopUps - cumulativeRaInterest);
  const raOaTransfer    = _isRSSForTransfer ? 0 : Math.round(raTransferBase * 0.20);
  const raAfterTransfer = raAtPayout - raOaTransfer;

  // ── lifePlans: CPF LIFE monthly payout for all three plans at raAfterTransfer ──
  const lifePlans = useMemo(() => {
    const pAge = Number(debouncedInputs.payoutAge) || 65;
    const male = debouncedInputs.isMale !== false;
    const raBase = raAfterTransfer;
    const startM = interpolateCpfLife(raBase, 'std', true);
    const startF = interpolateCpfLife(raBase, 'std', false);
    const escStartM = interpolateCpfLife(raBase, 'esc', true);
    const escStartF = interpolateCpfLife(raBase, 'esc', false);
    const basStartM = interpolateCpfLife(raBase, 'bas', true);
    const basStartF = interpolateCpfLife(raBase, 'bas', false);
    return {
      standard:   { name: "Standard",   start: male ? startM   : startF,   startM,       startF       },
      escalating: { name: "Escalating", start: male ? escStartM : escStartF, startM: escStartM, startF: escStartF },
      basic:      { name: "Basic",      start: male ? basStartM : basStartF, startM: basStartM, startF: basStartF }
    };
  }, [raAfterTransfer, debouncedInputs.payoutAge, debouncedInputs.isMale]);

  // ── payoutProjection: year-by-year CPF LIFE payout, bequest, and net worth ──
  const payoutProjection = useMemo(() => {
    let data = [];
    const pAge = Number(debouncedInputs.payoutAge) || 65;
    const initialRA = raAfterTransfer;
    const includeProp = debouncedInputs.includeProperty ?? true;
    let cumPayoutStandard = 0, cumPayoutEscalating = 0, cumPayoutBasic = 0;

    const basicPhase1aMonthly = lifePlans.basic.start;
    const { premium: basicPremium, pv: basicPV,
            phase1aAnnual: basicPhase1aAnnual, phase2Annual: basicPhase2Annual,
            phase1bTrigger: phase1bStartAge, effAnnualFactor: basicEffAnnualFactor
          } = computeBasicPlanParams(initialRA, pAge, basicPhase1aMonthly, basicPremiumPct);
    let basicRaRemaining = basicPV;
    let cumPayoutBasicPool = 0;

    for (let p of projection) {
      const age = p.age;
      const yearsElapsed = age - pAge;
      let stdBeq = 0, escBeq = 0, basBeq = 0, stdPayY = 0, escPayY = 0, basPayY = 0, stdRA = 0, escRA = 0, basRA = 0;
      if (age < pAge) {
        stdRA = p.ra; escRA = p.ra; basRA = p.ra;
        stdBeq = p.sa + p.ra; escBeq = p.sa + p.ra; basBeq = p.sa + p.ra;
      } else {
        stdPayY = lifePlans.standard.start * 12; cumPayoutStandard += stdPayY;
        stdBeq = Math.max(0, initialRA - cumPayoutStandard);

        escPayY = (lifePlans.escalating.start * Math.pow(1.02, yearsElapsed)) * 12; cumPayoutEscalating += escPayY;
        escBeq = Math.max(0, initialRA - cumPayoutEscalating);

        if (age < 90) {
          const { basPay, newRaRem } = computeBasicPlanYearPayout(
            age, phase1bStartAge, basicPhase1aAnnual, basicPhase2Annual,
            basicRaRemaining, basicEffAnnualFactor
          );
          basPayY = basPay;
          basicRaRemaining = newRaRem;
          cumPayoutBasic += basPayY;
          basRA = basicRaRemaining;
          basBeq = basRA + basicPremium;
        } else {
          const { basPay } = computeBasicPlanYearPayout(
            age, phase1bStartAge, basicPhase1aAnnual, basicPhase2Annual, 0, basicEffAnnualFactor
          );
          basicRaRemaining = 0; basRA = 0;
          basPayY = basPay;
          cumPayoutBasic += basPayY;
          cumPayoutBasicPool += basPayY;
          basBeq = Math.max(0, basicPremium - cumPayoutBasicPool);
        }
      }
      const propVal   = includeProp ? p.propertyValue : 0;
      const privAsset = p.privateAssets || 0;
      const srsBal    = p.srsBalance || 0;
      data.push({
        age,
        standardMonthly: Math.round(stdPayY / 12), escalatingMonthly: Math.round(escPayY / 12), basicMonthly: Math.round(basPayY / 12),
        standardAnnual:  Math.round(stdPayY),       escalatingAnnual:  Math.round(escPayY),       basicAnnual:  Math.round(basPayY),
        standardBequest: Math.round(stdBeq),         escalatingBequest: Math.round(escBeq),         basicBequest: Math.round(basBeq),
        standardRA:      Math.round(stdRA),           escalatingRA:      Math.round(escRA),           basicRA:      Math.round(basRA),
        standardTotal:   Math.round(cumPayoutStandard + stdBeq),
        escalatingTotal: Math.round(cumPayoutEscalating + escBeq),
        basicTotal:      Math.round(cumPayoutBasic + basBeq),
        srsBalance: srsBal,
        standardNetWorth:   Math.round(p.oa + p.sa + p.ma + stdBeq + propVal + privAsset + srsBal),
        escalatingNetWorth: Math.round(p.oa + p.sa + p.ma + escBeq + propVal + privAsset + srsBal),
        basicNetWorth:      Math.round(p.oa + p.sa + p.ma + basBeq + propVal + privAsset + srsBal),
      });
    }
    return data;
  }, [projection, lifePlans, debouncedInputs.payoutAge, raAtPayout, raAfterTransfer, debouncedInputs.includeProperty, basicPremiumPct]);

  // ── Deflation helpers ─────────────────────────────────────────────────────────
  // BUG-12 fix: use debouncedInputs for deflation factors so displayProjection and
  // displayAccumulation only recompute when their debounced source data also recomputes.
  const displayProjection = useMemo(() => {
    if (!isRealDollars) return payoutProjection;
    const inflD = (Number(debouncedInputs.inflationRate) || 0) / 100;
    const caD   = Number(debouncedInputs.currentAge) || 35;
    const deflate = (val, age) => isNaN(val) ? val : Math.round(val / Math.pow(1 + inflD, Math.max(0, age - caD)));
    return payoutProjection.map(row => {
      let n = { ...row };
      Object.keys(n).forEach(k => { if (typeof n[k] === 'number' && k !== 'age') n[k] = deflate(n[k], row.age); });
      return n;
    });
  }, [payoutProjection, isRealDollars, debouncedInputs.inflationRate, debouncedInputs.currentAge]);

  const displayAccumulation = useMemo(() => {
    if (!isRealDollars) return projection;
    const inflD = (Number(debouncedInputs.inflationRate) || 0) / 100;
    const caD   = Number(debouncedInputs.currentAge) || 35;
    const deflate = (val, age) => isNaN(val) ? val : Math.round(val / Math.pow(1 + inflD, Math.max(0, age - caD)));
    return projection.map(row => {
      let n = { ...row };
      Object.keys(n).forEach(k => { if (typeof n[k] === 'number' && k !== 'age') n[k] = deflate(n[k], row.age); });
      return n;
    });
  }, [projection, isRealDollars, debouncedInputs.inflationRate, debouncedInputs.currentAge]);

  // ── O(1) Maps for display arrays ─────────────────────────────────────────────
  const accumulationByAge = useMemo(
    () => new Map((displayAccumulation || []).map(r => [r.age, r])),
    [displayAccumulation]);

  const payoutByAge = useMemo(
    () => new Map((payoutProjection || []).map(r => [r.age, r])),
    [payoutProjection]);

  const displayProjectionByAge = useMemo(
    () => new Map((displayProjection || []).map(r => [r.age, r])),
    [displayProjection]);

  return {
    // Core engine data
    engineKey,
    projection,
    projectionByAge,
    // CPF LIFE payout plans
    lifePlans,
    payoutProjection,
    // Display (deflated when isRealDollars)
    displayProjection,
    displayAccumulation,
    // O(1) Maps
    accumulationByAge,
    payoutByAge,
    displayProjectionByAge,
    // Derived scalars
    payoutAge65,
    raAtPayout,
    raAfterTransfer,
    raOaTransfer,
    cumulativeCashTopUps,
    cumulativeRaInterest,
    // Effective OA draw values (respects DieWithZero overrides)
    effectiveOaDrawMonthly,
    effectiveOaDrawStartAge,
    effectiveOaDrawFloor,
  };
}
