import { useMemo } from 'react';
import { RETIREMENT_SUMS_2026 } from '../config/constants.js';
import { computeXIRR, formatCurrency } from '../utils/helpers.js';

// ─── useMilestones ────────────────────────────────────────────────────────────
// Analysis layer — derives alerts, gap warnings, XIRR, and plan crossover ages
// from the projection arrays produced by useProjection.
//
// Accepts:
//   inputs            — LIVE inputs (used by oaToSaCrossover for sidebar reactivity)
//   debouncedInputs   — debounced inputs (used by all projection-aligned computations)
//   projection        — raw projection array from useProjection
//   projectionByAge   — Map<age, row> from useProjection
//   displayAccumulation     — deflated accumulation array from useProjection
//   accumulationByAge       — Map<age, row> from useProjection
//   payoutProjection        — CPF LIFE payout array from useProjection
//   payoutAge65             — debounced payout age scalar from useProjection
//   effectiveOaDrawMonthly  — from useProjection
//   effectiveOaDrawStartAge — from useProjection
//   effectiveOaDrawFloor    — from useProjection
//   activeTab         — current tab string (used by xirrByAge lazy bail-out)
//
// Returns:
//   oaToSaCrossover   — sidebar crossover age object (live-input driven)
//   gapAlert          — FRS contribution gap object or null
//   milestones        — sorted array of milestone alert objects
//   intersectionEscVsStd / intersectionStdVsBasic / intersectionEscVsBasic /
//   intersectionEscPayVsStdPay — plan crossover ages (null until crossed)
//   xirrByAge         — { standard, escalating, basic } keyed by age (lazy)
// ─────────────────────────────────────────────────────────────────────────────

export function useMilestones({
  inputs,
  debouncedInputs,
  projection,
  projectionByAge,
  displayAccumulation,
  accumulationByAge,
  payoutProjection,
  payoutAge65,
  effectiveOaDrawMonthly,
  effectiveOaDrawStartAge,
  effectiveOaDrawFloor,
  activeTab,
}) {

  // ── oaToSaCrossover: sidebar UI — reads LIVE inputs for immediate feedback ──
  // P3 fix: extracted from inline IIFE to a useMemo to avoid calling
  // displayAccumulation.find() on every render regardless of change.
  const oaToSaCrossover = useMemo(() => {
    const _ca        = Number(inputs.currentAge) || 35;
    const _cy        = Number(inputs.currentYear) || 2026;
    const _sa        = Number(inputs.saBalance) || 0;
    const _is55Plus  = _ca >= 55;
    const _rsGrowth  = (Number(inputs.retirementSumGrowth) || 3) / 100;
    const _targetSum = _is55Plus
      ? Math.round(RETIREMENT_SUMS_2026.ERS * Math.pow(1 + _rsGrowth, Math.max(0, _cy - 2026)))
      : Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + _rsGrowth, Math.max(0, _cy - 2026)));
    const _currentBal = _sa;
    const _label      = _is55Plus ? "RA" : "SA";
    const _capLabel   = _is55Plus ? "ERS" : "FRS";
    if (_currentBal >= _targetSum) {
      return { alreadyMet: true, crossoverAge: null, label: _label, capLabel: _capLabel, targetSum: _targetSum, currentBal: _currentBal };
    }
    const crossover = displayAccumulation.find(row => {
      const _projCap = _is55Plus
        ? Math.round(RETIREMENT_SUMS_2026.ERS * Math.pow(1 + _rsGrowth, Math.max(0, (_cy + (row.age - _ca)) - 2026)))
        : Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + _rsGrowth, Math.max(0, (_cy + (row.age - _ca)) - 2026)));
      const _bal = _is55Plus ? (row.ra || 0) : (row.sa || 0);
      return row.age > _ca && _bal >= _projCap;
    });
    return { alreadyMet: false, crossoverAge: crossover?.age ?? null, label: _label, capLabel: _capLabel, targetSum: _targetSum, currentBal: _currentBal };
  }, [displayAccumulation, inputs.currentAge, inputs.currentYear, inputs.saBalance, inputs.retirementSumGrowth]);

  // ── gapAlert: FRS contribution gap for the summary banner and RSTU card ─────
  // N1 fix: all scalar reads use debouncedInputs so there is no mismatch during
  // the 180ms debounce window.
  const gapAlert = useMemo(() => {
    const ca = Number(debouncedInputs.currentAge) || 35;
    const cy = Number(debouncedInputs.currentYear) || 2026;
    let raForAlert, projFRS55;

    if (ca >= 55) {
      const past55FRS = Math.round(RETIREMENT_SUMS_2026.FRS / Math.pow(1 + (Number(debouncedInputs.retirementSumGrowth)||3)/100, Math.max(0, ca - 55)));
      projFRS55 = past55FRS;
      const pa_alert = Number(debouncedInputs.payoutAge) || 65;
      const paRow = projectionByAge.get(pa_alert); // E4 fix: always nominal
      raForAlert = paRow ? (paRow.ra || 0) : (Number(debouncedInputs.saBalance) || 0);
    } else {
      const yt55 = Math.max(0, (cy + Math.max(0, 55 - ca)) - 2026);
      projFRS55 = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + (Number(debouncedInputs.retirementSumGrowth)||3)/100, yt55));
      const frsRow55 = projectionByAge.get(55);
      raForAlert = frsRow55 ? (frsRow55.ra || 0) : 0;
    }

    if (raForAlert >= projFRS55) return null;
    const frsGap = Math.max(0, projFRS55 - raForAlert);
    if (frsGap <= 0) return null;

    const pa = Number(debouncedInputs.payoutAge) || 65;
    const yearsToGo = ca >= 55 ? Math.max(1, pa - ca) : Math.max(1, 55 - ca);
    const r = 0.04;
    const fvAnnuityFactor = (Math.pow(1 + r, yearsToGo) - 1) / r;
    const annualTopUp = fvAnnuityFactor > 0 ? Math.round(frsGap / fvAnnuityFactor) : Math.round(frsGap / yearsToGo);
    const monthlyTopUp = Math.round(annualTopUp / 12);
    const isUrgent = yearsToGo <= 5;
    const currentVcSa = Number(debouncedInputs.vcSaTopup) || 0;
    const newTopUp = Math.round(currentVcSa + annualTopUp);
    const raLabel = ca >= 55 ? "Current RA" : "Projected RA at 55";
    const topupNote = ca >= 55
      ? "RSTU cash top-up to RA · credited directly · subject to ERS cap"
      : "RSTU SA/RA cash top-up · compounds at 4% p.a.";
    return { raForAlert, projFRS55, frsGap, annualTopUp, monthlyTopUp, yearsToGo, isUrgent, currentVcSa, newTopUp, raLabel, topupNote };
  }, [projection, projectionByAge, displayAccumulation, accumulationByAge,
      debouncedInputs.currentAge, debouncedInputs.currentYear,
      debouncedInputs.payoutAge, debouncedInputs.saBalance,
      debouncedInputs.vcSaTopup, debouncedInputs.retirementSumGrowth]);

  // ── milestones: sorted array of age-keyed alert objects ──────────────────────
  const milestones = useMemo(() => {
    const alerts = [];
    const payoutAge = Number(debouncedInputs.payoutAge) || 65;
    const ca = Number(debouncedInputs.currentAge) || 35;
    const cy = Number(debouncedInputs.currentYear) || 2026;
    if (!projection || projection.length === 0) return alerts;

    // NX9 fix: use debouncedInputs for all scalar reads so milestones never compute
    // against old projection rows mixed with live (180ms-ahead) input scalars.
    // Note: milestones references inputs.retirementSumGrowth (live) for projFRS/ERS/BRS
    // helpers — this is preserved from the original for sidebar immediate feedback.
    const projFRS = age => Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, Math.max(0, (cy + (age - ca)) - 2026)));
    const projERS = age => Math.round(RETIREMENT_SUMS_2026.ERS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, Math.max(0, (cy + (age - ca)) - 2026)));
    const projBRS = age => Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, Math.max(0, (cy + (age - ca)) - 2026)));

    for (let i = 0; i < projection.length - 1; i++) { const row = projection[i]; const next = projection[i + 1]; if (row.age < 55 && row.sa < projFRS(row.age) && next.sa >= projFRS(next.age)) { alerts.push({ age: next.age, type: "success", label: "SA hits Full Retirement Sum", detail: `SA balance reaches the projected FRS of $${Math.round(projFRS(next.age) / 1000)}k at age ${next.age}.` }); break; } }
    for (let i = 0; i < projection.length - 1; i++) { const row = projection[i]; const next = projection[i + 1]; if (row.age < 55 && row.sa < projERS(row.age) && next.sa >= projERS(next.age)) { alerts.push({ age: next.age, type: "gold", label: "SA hits Enhanced Retirement Sum", detail: `SA balance reaches the projected ERS of $${Math.round(projERS(next.age) / 1000)}k at age ${next.age}. Maximum CPF LIFE payout unlocked.` }); break; } }
    for (let i = 0; i < projection.length - 1; i++) { const row = projection[i]; const next = projection[i + 1]; if (row.age < payoutAge && row.oa > 0 && next.oa === 0) { alerts.push({ age: next.age, type: "warning", label: "OA balance depleted", detail: `Ordinary Account reaches $0 at age ${next.age}. Housing outflows have fully drained OA. Consider reducing CPF housing payments.` }); break; } }

    for (let i = 0; i < projection.length - 1; i++) {
      const row = projection[i]; const next = projection[i + 1];
      if (row.ma > 0 && next.ma === 0) {
        const isRetired = next.age >= payoutAge;
        alerts.push({ age: next.age, type: "danger", label: "MediSave balance depleted",
          detail: `MA reaches $0 at age ${next.age}${isRetired ? " (retirement phase)" : ""}. Medical premiums and outflows exceed MA inflows. Consider increasing VCMA top-ups, reducing MediShield IP tier, or adjusting the medical inflation assumption.`
        });
        break;
      }
    }

    if (effectiveOaDrawStartAge > 0 && effectiveOaDrawMonthly > 0) {
      for (let i = 0; i < projection.length - 1; i++) {
        const row = projection[i]; const next = projection[i + 1];
        if (row.age >= effectiveOaDrawStartAge && row.oa > effectiveOaDrawFloor && next.oa <= effectiveOaDrawFloor) {
          alerts.push({ age: next.age, type: "warning", label: "OA Drawdown exhausted",
            detail: `OA balance reaches the bequest floor (${formatCurrency(effectiveOaDrawFloor)}) at age ${next.age}. Monthly OA draw of ${formatCurrency(effectiveOaDrawMonthly)}/mo stops. Consider reducing the draw amount or lowering the floor.`
          });
          break;
        }
      }
    }

    const row55 = projectionByAge.get(55);
    if (row55 && (row55.sa + row55.ra) < projBRS(55)) alerts.push({ age: 55, type: "danger", label: "RA below Basic Retirement Sum at 55", detail: `Projected RA at age 55 is $${Math.round((row55.sa + row55.ra) / 1000)}k, below the BRS of $${Math.round(projBRS(55) / 1000)}k.` });

    if (debouncedInputs.cpfScheme === 'rss') {
      const rssDepAge = (() => { for (let i = projection.length - 1; i >= 0; i--) { if (projection[i]?.rssDepletionAge != null) return projection[i].rssDepletionAge; } return null; })();
      if (rssDepAge != null) {
        alerts.push({ age: rssDepAge, type: rssDepAge < 85 ? "danger" : "warning",
          label: `RSS RA depletes at age ${rssDepAge}`,
          detail: rssDepAge < 85
            ? `Your RA balance reaches $0 at age ${rssDepAge} — RSS payouts of ${formatCurrency(Number(debouncedInputs.rssMonthlyPayout) || 0)}/mo will stop. Consider migrating to CPF LIFE before age 80 for guaranteed lifetime income.`
            : `RA is projected to sustain RSS payouts until age ${rssDepAge}. A healthy balance — but consider whether migration to CPF LIFE before age 80 offers better longevity protection.`
        });
      }
    }

    const sPA = Number(debouncedInputs.sellPropertyAge) || 0;
    if (sPA > 0 && sPA >= Number(debouncedInputs.currentAge)) {
      const sellRow = projectionByAge.get(sPA - 1) || projection[0];
      const exactRefund = sellRow?.cumHousingFV || 0;
      const pledgeNote2 = debouncedInputs.usePropertyPledge ? " Pledge active: refund restores RA to FRS first; surplus stays in OA." : " Refund credited to OA.";
      const refundDisplay = exactRefund > 0
        ? `~${formatCurrency(exactRefund)} (OA housing principal + 2.5%/yr accrued interest, exact per-withdrawal compounding)`
        : "minimal (no OA housing withdrawals projected before sale)";
      alerts.push({ age: sPA, type: "teal", label: "Property Sale & CPF Refund",
        detail: `Property sold at age ${sPA}. Estimated CPF refund ${refundDisplay}.${pledgeNote2}` });
    }

    return alerts.sort((a, b) => a.age - b.age);
  }, [projection, projectionByAge, debouncedInputs, effectiveOaDrawStartAge, effectiveOaDrawMonthly, effectiveOaDrawFloor]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Plan crossover intersections (M2 fix: single pass) ───────────────────────
  const {
    intersectionEscVsStd,
    intersectionStdVsBasic,
    intersectionEscVsBasic,
    intersectionEscPayVsStdPay,
  } = useMemo(() => {
    let escVsStd = null, stdVsBasic = null, escVsBasic = null, escPayVsStdPay = null;
    for (const d of payoutProjection) {
      if (d.age <= payoutAge65) continue;
      if (!escVsStd       && d.escalatingTotal   > d.standardTotal)   escVsStd        = d.age;
      if (!stdVsBasic     && d.standardTotal      > d.basicTotal)      stdVsBasic      = d.age;
      if (!escVsBasic     && d.escalatingTotal    > d.basicTotal)      escVsBasic      = d.age;
      if (!escPayVsStdPay && d.escalatingMonthly  > d.standardMonthly) escPayVsStdPay  = d.age;
      if (escVsStd && stdVsBasic && escVsBasic && escPayVsStdPay) break;
    }
    return { intersectionEscVsStd: escVsStd, intersectionStdVsBasic: stdVsBasic,
             intersectionEscVsBasic: escVsBasic, intersectionEscPayVsStdPay: escPayVsStdPay };
  }, [payoutProjection, payoutAge65]);

  // ── xirrByAge: lazy — computed only when Data Table tab is active ─────────────
  const xirrByAge = useMemo(() => {
    if (activeTab !== 'table') return {};
    const pa = payoutAge65;
    const ca = Number(debouncedInputs.currentAge) || 35;
    const isRSSxirr = debouncedInputs.cpfScheme === 'rss';

    if (isRSSxirr) {
      const contribFlows = projection.filter(r => r.injected > 0).map(r => ({ t: r.age - ca, v: -(r.injected) }));
      const rssPayoutStart = Number(debouncedInputs.rssPayoutStartAge) || 65;
      const result = { rss: {} };
      const cumFlows = [];
      for (const r of projection.filter(r => r.age >= rssPayoutStart)) {
        cumFlows.push({ t: r.age - ca, v: r.rssPayoutThisYear || 0 });
      }
      for (const row of projection) {
        if (row.age < rssPayoutStart) continue;
        const idx = row.age - rssPayoutStart;
        const terminalFlow = { t: row.age - ca, v: (row.ra || 0) + (row.oa || 0) + (row.ma || 0) };
        const xirr = computeXIRR([...contribFlows, ...cumFlows.slice(0, idx + 1), terminalFlow]);
        result.rss[row.age] = xirr !== null ? Math.max(-0.10, Math.min(0.10, xirr)) * 100 : null;
      }
      result.standard = result.escalating = result.basic = result.rss;
      return result;
    }

    const result = { standard: {}, escalating: {}, basic: {} };
    const contribFlows = projection.filter(r => r.injected > 0).map(r => ({ t: r.age - ca, v: -(r.injected) }));
    const ppByAge = {};
    for (const d of payoutProjection) ppByAge[d.age] = d;
    const payoutRows = payoutProjection.filter(d => d.age >= pa);
    const cumFlows = { standard: [], escalating: [], basic: [] };
    for (const d of payoutRows) {
      for (const plan of ['standard', 'escalating', 'basic']) {
        cumFlows[plan].push({ t: d.age - ca, v: d[`${plan}Annual`] || 0 });
      }
    }
    for (const row of projection) {
      if (row.age < pa) continue;
      const pp = ppByAge[row.age];
      if (!pp) continue;
      const idx = row.age - pa;
      for (const plan of ['standard', 'escalating', 'basic']) {
        const terminalFlow = { t: row.age - ca, v: pp[`${plan}Bequest`] || 0 };
        const xirr = computeXIRR([...contribFlows, ...cumFlows[plan].slice(0, idx + 1), terminalFlow]);
        result[plan][row.age] = xirr !== null ? Math.max(-0.10, Math.min(0.10, xirr)) * 100 : null;
      }
    }
    return result;
  }, [activeTab, projection, payoutProjection, payoutAge65,
      debouncedInputs.currentAge, debouncedInputs.cpfScheme, debouncedInputs.rssPayoutStartAge]);

  return {
    oaToSaCrossover,
    gapAlert,
    milestones,
    intersectionEscVsStd,
    intersectionStdVsBasic,
    intersectionEscVsBasic,
    intersectionEscPayVsStdPay,
    xirrByAge,
  };
}
