import { useMemo } from 'react';
import { CPF_RATES, RETIREMENT_SUMS_2026 } from '../config/constants.js';
import { interpolateCpfLife, computeSensitivityRow } from '../engine/actuarial.js';
import { runProjectionEngine } from '../engine/projectionEngine.js';
import { runRSSEngine }        from '../engine/rssEngine.js';

// ─── useAnalytics ─────────────────────────────────────────────────────────────
// Expensive and/or conditional computations: Monte Carlo, What-If, Compare,
// sensitivity table, strategy chart data, and OA exhaustion age.
//
// Accepts:
//   debouncedInputs          — from App state (debounced)
//   isRealDollars            — boolean
//   basicPremiumPct          — number (default 10)
//   showMonteCarlo           — boolean UI toggle
//   showBaseline             — boolean UI toggle
//   showWhatIf               — boolean UI toggle
//   whatIfPayoutAge / whatIfSaTopup / whatIfHousing / whatIfSalaryBump /
//   whatIfContribStop / whatIfOaDrawdown / whatIfSrsContrib / whatIfPrivGrowth
//                            — What-If override values (null = use current input)
//   scenarioA / scenarioB    — saved scenario objects for Compare tab
//   highlightPlan            — 'standard' | 'escalating' | 'basic'
//
//   From useProjection:
//     projection, projectionByAge
//     displayProjection, displayAccumulation
//     accumulationByAge, payoutByAge
//     payoutAge65
//     effectiveOaDrawMonthly, effectiveOaDrawStartAge, effectiveOaDrawFloor
//
// Returns:
//   monteCarloData      — null or { rows, probSufficiency, frsAtPayout }
//   baselineProjection  — null or array of { age, baselineTotal }
//   whatIfProjection    — null or { rows, effPA, effST, effH, effSB, effCS, effOAD, effSRS, effPG }
//   comparisonData      — array of { age, yieldA?, yieldB? }
//   sensitivityData     — array of sensitivity rows
//   strategyChartData   — array of monthly income stream rows
//   oaExhaustAge        — age number or null
//   isRSSMode           — boolean
//   summaryRefAge       — number (payout age or currentAge for RSS)
//   payoutAgeData       — accumulation row at summaryRefAge
//   totalCpfAtPayout    — OA + SA + MA + RA at summaryRefAge
// ─────────────────────────────────────────────────────────────────────────────

export function useAnalytics({
  debouncedInputs,
  isRealDollars,
  basicPremiumPct,
  showMonteCarlo,
  showBaseline,
  showWhatIf,
  whatIfPayoutAge, whatIfSaTopup, whatIfHousing, whatIfSalaryBump,
  whatIfContribStop, whatIfOaDrawdown, whatIfSrsContrib, whatIfPrivGrowth,
  scenarioA, scenarioB,
  highlightPlan,
  // From useProjection:
  projection,
  projectionByAge,
  displayProjection,
  displayAccumulation,
  accumulationByAge,
  payoutByAge,
  payoutAge65,
  effectiveOaDrawMonthly,
  effectiveOaDrawStartAge,
  effectiveOaDrawFloor,
}) {

  // ── monteCarloData ────────────────────────────────────────────────────────────
  const monteCarloData = useMemo(() => {
    if (!showMonteCarlo) return null;
    const RUNS = 200;
    const pa = Number(debouncedInputs.payoutAge) || 65;
    const ca = Number(debouncedInputs.currentAge) || 35;
    const isRSSMC = debouncedInputs.cpfScheme === 'rss';
    const endAge = isRSSMC ? 95 : pa;
    const ageTotals = {};
    for (let age = ca; age <= endAge; age++) ageTotals[age] = [];
    const mcVar = Math.max(0.1, Number(debouncedInputs.mcVariancePct) || 1);
    for (let run = 0; run < RUNS; run++) {
      const _inflBand = (mcVar / 100) / 2;
      const mcInflRate = (Number(debouncedInputs.inflationRate) || 2) / 100 + (Math.random() * _inflBand * 2 - _inflBand);
      const mcRows = isRSSMC
        ? runRSSEngine(debouncedInputs, { maxAge: endAge, randomiseRates: true, mcVariance: mcVar })
        : runProjectionEngine(debouncedInputs, { maxAge: endAge, randomiseRates: true, mcVariance: mcVar });
      for (const row of mcRows) {
        if (ageTotals[row.age] !== undefined) {
          const real = row.total / Math.pow(1 + mcInflRate, Math.max(0, row.age - ca));
          ageTotals[row.age].push(isRealDollars ? real : row.total);
        }
      }
    }
    const rows = Object.entries(ageTotals).map(([age, vals]) => {
      vals.sort((a, b) => a - b);
      const p = pct => vals[Math.floor(pct * vals.length)] || 0;
      return { age: Number(age), p10: p(0.10), p50: p(0.50), p90: p(0.90), allVals: vals };
    });
    if (isRSSMC) {
      return { rows: rows.map(({ allVals: _, ...r }) => r), probSufficiency: null, frsAtPayout: null };
    }
    const payoutRow = rows.find(r => r.age === pa);
    const yrsToPFRS = Math.max(0, pa - ca);
    const frsAtPayout = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + (Number(debouncedInputs.retirementSumGrowth)||3)/100,
      Math.max(0, (Number(debouncedInputs.currentYear) || 2026) + yrsToPFRS - 2026)));
    const probSufficiency = payoutRow
      ? Math.round((payoutRow.allVals.filter(v => v >= frsAtPayout).length / payoutRow.allVals.length) * 100)
      : null;
    return { rows: rows.map(({ allVals: _, ...r }) => r), probSufficiency, frsAtPayout };
  }, [showMonteCarlo, debouncedInputs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── baselineProjection: mandatory-only ghost line on Accumulation chart ───────
  const baselineProjection = useMemo(() => {
    if (!showBaseline) return null;
    const pa = Number(debouncedInputs.payoutAge) || 65;
    const baselineInputs = {
      ...debouncedInputs,
      vc3aCash: 0, vcSaTopup: 0, vcVhr: 0, vcMaCash: 0,
      annualGovGrant: 0, mrssGrant: 0, mmssGrant: 0, wisAmount: 0,
      oaToSaTransfer: 0, oaToMaTransfer: 0,
      cpfisOaAmount: 0, cpfisSaAmount: 0,
      oaDrawdownMonthly: 0,
    };
    const isRSSBaseline = debouncedInputs.cpfScheme === 'rss';
    const rows = isRSSBaseline
      ? runRSSEngine(baselineInputs, { maxAge: 95 })
      : runProjectionEngine(baselineInputs, { maxAge: pa });
    if (isRealDollars) {
      const ca = Number(debouncedInputs.currentAge) || 35;
      const inflRate = (Number(debouncedInputs.inflationRate) || 2) / 100;
      return rows.map(r => ({ age: r.age, baselineTotal: Math.round(r.total / Math.pow(1 + inflRate, Math.max(0, r.age - ca))) }));
    }
    return rows.map(r => ({ age: r.age, baselineTotal: r.total }));
  }, [showBaseline, debouncedInputs, isRealDollars]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── whatIfProjection: overlay with What-If slider overrides ──────────────────
  const whatIfProjection = useMemo(() => {
    if (!showWhatIf) return null;
    const effPA  = whatIfPayoutAge   !== null ? whatIfPayoutAge   : (Number(debouncedInputs.payoutAge) || 65);
    const effST  = whatIfSaTopup     !== null ? whatIfSaTopup     : (Number(debouncedInputs.vcSaTopup) || 0);
    const effH   = whatIfHousing     !== null ? whatIfHousing     : (Number(debouncedInputs.housingOutflow) || 0);
    const effSB  = whatIfSalaryBump  !== null ? whatIfSalaryBump  : 0;
    const effCS  = whatIfContribStop !== null ? whatIfContribStop : (Number(debouncedInputs.contributionStopAge) || 65);
    const effOAD = whatIfOaDrawdown  !== null ? whatIfOaDrawdown  : (Number(debouncedInputs.oaDrawdownMonthly) || 0);
    const effSRS = whatIfSrsContrib  !== null ? whatIfSrsContrib  : (Number(debouncedInputs.srsAnnualContribution) || 0);
    const effPG  = whatIfPrivGrowth  !== null ? whatIfPrivGrowth  : (Number(debouncedInputs.privateAssetGrowthRate) || 0);
    // Bug-WI2: inject effPA as draw start age if drawdown is active but start age is 0
    const wiInputs = (effOAD > 0 && (Number(debouncedInputs.oaDrawdownStartAge) || 0) === 0)
      ? { ...debouncedInputs, oaDrawdownStartAge: effPA }
      : debouncedInputs;
    const isRSSWI = debouncedInputs.cpfScheme === 'rss';
    const wiMaxAge = isRSSWI ? 95 : effPA;
    const overrides = { maxAge: wiMaxAge, overrideVcSA: effST, overrideHousingOutflow: effH,
      overrideSalaryBump: effSB, overrideContribStop: effCS, overrideOaDrawdownMonthly: effOAD,
      overrideSrsContrib: effSRS, overridePrivGrowthRate: effPG };
    const rows = isRSSWI ? runRSSEngine(wiInputs, overrides) : runProjectionEngine(wiInputs, overrides);
    return { rows, effPA, effST, effH, effSB, effCS, effOAD, effSRS, effPG };
  }, [showWhatIf, whatIfPayoutAge, whatIfSaTopup, whatIfHousing, whatIfSalaryBump,
      whatIfContribStop, whatIfOaDrawdown, whatIfSrsContrib, whatIfPrivGrowth,
      debouncedInputs]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── comparisonData: net-worth series for both saved scenarios ─────────────────
  const comparisonData = useMemo(() => {
    const makePayoutMap = (s) => s?.payoutProj?.length  ? new Map(s.payoutProj.map(d  => [d.age, d])) : null;
    const makeProjMap   = (s) => s?.projection?.length  ? new Map(s.projection.map(d  => [d.age, d])) : null;
    const scAPayoutMap  = makePayoutMap(scenarioA);
    const scBPayoutMap  = makePayoutMap(scenarioB);
    const scAProjMap    = makeProjMap(scenarioA);
    const scBProjMap    = makeProjMap(scenarioB);

    const getNetWorth = (scenario, age, payoutMap, projMap) => {
      if (!scenario) return undefined;
      if (payoutMap) {
        const pm = payoutMap.get(age);
        if (pm) return pm[`${highlightPlan}Total`] ?? pm.standardTotal;
      }
      const am = projMap?.get(age);
      if (!am) return undefined;
      const pa = Number(scenario.inputs?.payoutAge) || 65;
      const raRow = projMap?.get(pa);
      const raAtPa = raRow?.ra || 0;
      const raForLife = Math.round(raAtPa * 0.8);
      const oaFromTransfer = Math.round(raAtPa * 0.2);
      const monthlyEst = interpolateCpfLife(raForLife, 'std', scenario.inputs?.isMale !== false);
      const yearsInPayout = Math.max(0, age - pa);
      const cumPayout = age >= pa ? monthlyEst * 12 * yearsInPayout : 0;
      const oaBonus = age >= pa ? oaFromTransfer : 0;
      return (am.total || 0) + cumPayout + oaBonus;
    };

    let data = [];
    const startA = scenarioA?.projection?.[0]?.age ?? 35;
    const startB = scenarioB?.projection?.[0]?.age ?? 35;
    const startAge = Math.min(startA, startB, 35);
    for (let age = startAge; age <= 95; age++) {
      const yA = getNetWorth(scenarioA, age, scAPayoutMap, scAProjMap);
      const yB = getNetWorth(scenarioB, age, scBPayoutMap, scBProjMap);
      if (yA != null || yB != null) {
        const row = { age };
        if (yA != null) row.yieldA = yA;
        if (yB != null) row.yieldB = yB;
        data.push(row);
      }
    }
    return data;
  }, [scenarioA, scenarioB, highlightPlan]);

  // ── sensitivityData: payout-age × RA sensitivity table ───────────────────────
  const sensitivityData = useMemo(() => {
    const isRSSsens = debouncedInputs.cpfScheme === 'rss';
    if (isRSSsens) {
      const baseMonthly = Number(debouncedInputs.rssMonthlyPayout) || 0;
      const baseRa      = projectionByAge.get(Number(debouncedInputs.rssPayoutStartAge) || 65)?.ra
                          || Number(debouncedInputs.saBalance) || 0;
      if (baseMonthly <= 0 || baseRa <= 0) return [];
      const payoutLevels = [0.60, 0.80, 1.00, 1.20, 1.40].map(f => Math.round(baseMonthly * f));
      const raLevels     = [0.60, 0.80, 1.00, 1.20, 1.40].map(f => Math.round(baseRa * f));
      return payoutLevels.map(monthly => {
        const annual = monthly * 12;
        const row = { monthly, cols: [] };
        raLevels.forEach(ra => {
          let bal = ra; let depAge = null;
          const start = Number(debouncedInputs.rssPayoutStartAge) || 65;
          for (let age = start; age <= 95; age++) {
            bal = bal * (1 + CPF_RATES.RA) - annual;
            if (bal <= 0) { depAge = age; break; }
          }
          row.cols.push({ ra, depAge: depAge || '>95' });
        });
        return row;
      });
    }
    const pAs = [65, 66, 67, 68, 69, 70];
    const isMaleSens = debouncedInputs.isMale !== false;
    return pAs.map(pAge => {
      const raRow = projectionByAge.get(pAge);
      if (!raRow) return { pAge, stdMonthly: 0, escMonthly: 0, basMonthly: 0, escVsStd: null, stdVsBasic: null, escVsBasic: null };
      const raVal = raRow.ra || 0;
      const raTransferBaseSens  = Math.max(0, raVal - (raRow.cumRaCashTopUps || 0) - (raRow.cumRaInterest || 0));
      const raOaTransferSens    = Math.round(raTransferBaseSens * 0.20);
      const raAfterTransferSens = Math.max(0, raVal - raOaTransferSens);
      return computeSensitivityRow(pAge, raAfterTransferSens, isMaleSens, basicPremiumPct);
    });
  }, [projection, projectionByAge, basicPremiumPct, debouncedInputs.isMale,
      debouncedInputs.cpfScheme, debouncedInputs.rssMonthlyPayout,
      debouncedInputs.rssPayoutStartAge, debouncedInputs.saBalance]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── strategyChartData: monthly income streams from age 65→95 ─────────────────
  const strategyChartData = useMemo(() => {
    const pa = payoutAge65;
    const srsStart = Math.max(Number(debouncedInputs.srsDrawdownStartAge) || 63, 63);
    const srsYears = Math.min(Math.max(Number(debouncedInputs.srsDrawdownYears) || 10, 1), 10);
    const oaDrawStart   = effectiveOaDrawStartAge;
    const oaDrawMonthly = effectiveOaDrawMonthly;
    const oaFloor       = effectiveOaDrawFloor;
    const propMonAge    = Number(debouncedInputs.propMonetiseAge) || 65;
    const propMonCash   = Number(debouncedInputs.propMonetiseCashProceeds) || 0;
    const propEnabled   = debouncedInputs.propMonetiseEnabled === true;

    const srsRowAtStart = accumulationByAge.get(srsStart);
    const srsBalAtStart = srsRowAtStart?.srsBalance || 0;
    const srsRateDisp = (Number(debouncedInputs.srsReturnRate) || 0) / 100;
    const srsAnnualDraw = srsYears > 0
      ? (srsRateDisp > 0
          ? Math.round(srsBalAtStart * srsRateDisp / (1 - Math.pow(1 + srsRateDisp, -srsYears)))
          : Math.round(srsBalAtStart / srsYears))
      : srsBalAtStart;
    const srsMonthlyDraw = Math.round(srsAnnualDraw / 12);

    const data = [];
    for (let age = pa; age <= 95; age++) {
      const ppRow      = payoutByAge.get(age)       || {};
      const projRow    = accumulationByAge.get(age)  || {};
      const prevProjRow = accumulationByAge.get(age - 1) || {};

      const cpfLife = ppRow[`${highlightPlan}Monthly`] || 0;

      const rssDrawdown = (() => {
        if (debouncedInputs.cpfScheme !== 'rss') return 0;
        const rssStart  = Number(debouncedInputs.rssPayoutStartAge) || 65;
        const rssMonAmt = Number(debouncedInputs.rssMonthlyPayout)  || 0;
        if (age < rssStart || rssMonAmt <= 0) return 0;
        return (projRow.ra || 0) > 0 ? rssMonAmt : 0;
      })();

      let oaDraw = 0;
      if (oaDrawStart > 0 && oaDrawMonthly > 0 && age >= oaDrawStart) {
        const oaBal = projRow.oa || 0;
        if (oaBal > oaFloor) oaDraw = Math.min(oaDrawMonthly, Math.max(0, Math.round((oaBal - oaFloor) / 12)));
        oaDraw = Math.min(oaDraw, oaDrawMonthly);
      }

      let srs = 0;
      if (age >= srsStart && age < srsStart + srsYears && srsMonthlyDraw > 0) srs = srsMonthlyDraw;

      const paPriv = projRow.privateAssets || 0;
      const prevPriv = prevProjRow.privateAssets || paPriv;
      const privateDrawdown = Math.max(0, Math.round((prevPriv - paPriv) / 12));

      const propMon = (propEnabled && age === propMonAge && propMonCash > 0) ? Math.round(propMonCash / 12) : 0;

      const totalMonthly = cpfLife + rssDrawdown + oaDraw + srs + privateDrawdown + propMon;
      data.push({ age, cpfLife, rssDrawdown, oaDraw, srs, privateAsset: privateDrawdown, propMon, totalMonthly });
    }
    return data;
  }, [displayProjection, displayAccumulation, accumulationByAge, payoutByAge,
      isRealDollars, payoutAge65,
      debouncedInputs.srsDrawdownStartAge, debouncedInputs.srsDrawdownYears,
      effectiveOaDrawStartAge, effectiveOaDrawMonthly, effectiveOaDrawFloor,
      debouncedInputs.propMonetiseEnabled, debouncedInputs.propMonetiseAge, debouncedInputs.propMonetiseCashProceeds,
      debouncedInputs.srsReturnRate, highlightPlan,
      debouncedInputs.cpfScheme, debouncedInputs.rssPayoutStartAge, debouncedInputs.rssMonthlyPayout]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── oaExhaustAge ──────────────────────────────────────────────────────────────
  const oaExhaustAge = useMemo(() => {
    if (effectiveOaDrawStartAge <= 0 || effectiveOaDrawMonthly <= 0) return null;
    for (const row of projection) {
      if (row.age >= effectiveOaDrawStartAge && row.oa <= effectiveOaDrawFloor) return row.age;
    }
    return null;
  }, [projection, effectiveOaDrawStartAge, effectiveOaDrawMonthly, effectiveOaDrawFloor]);

  // ── Inline derived values ─────────────────────────────────────────────────────
  const isRSSMode = debouncedInputs.cpfScheme === 'rss';
  const summaryRefAge = isRSSMode
    ? (Number(debouncedInputs.currentAge) || 68)
    : payoutAge65;
  const payoutAgeData     = accumulationByAge.get(summaryRefAge) || {};
  const totalCpfAtPayout  = (payoutAgeData.oa || 0) + (payoutAgeData.sa || 0) + (payoutAgeData.ma || 0) + (payoutAgeData.ra || 0);

  return {
    monteCarloData,
    baselineProjection,
    whatIfProjection,
    comparisonData,
    sensitivityData,
    strategyChartData,
    oaExhaustAge,
    // Inline derived
    isRSSMode,
    summaryRefAge,
    payoutAgeData,
    totalCpfAtPayout,
  };
}
