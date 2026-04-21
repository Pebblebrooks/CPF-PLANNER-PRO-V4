import {
  CPF_RATES, RETIREMENT_SUMS_2026, ANNUAL_LIMIT,
  SRS_CAP_SC_PR, SRS_CAP_FOREIGNER,
  MMSS_PILOT_START_YEAR, MMSS_PILOT_END_YEAR,
  getPRRates,
} from '../config/constants.js';
import {
  interpolateCpfLife,
  computeBasicPlanParams,
  computeBasicPlanYearPayout,
  makeComputeGF,
} from './actuarial.js';

// ─── RSS PROJECTION ENGINE ───────────────────────────────────────────────────
// Handles members born before 1958 who are on the Retirement Sum Scheme (RSS).
// Pre-1958 members did not join CPF LIFE — they draw a fixed monthly RSS payout
// (set by CPF Board based on RA balance) that depletes RA over time.
// Engine output row shape is identical to runProjectionEngine so all downstream
// consumers (charts, ledger, milestones) work without change.
// ────────────────────────────────────────────────────────────────────────────
// projection useMemo is safe to merge now with zero output change for any member.
// ARCHITECTURE NOTE: runProjectionEngine is intentionally never modified.
// All RSS logic lives exclusively in this function.
export function runRSSEngine(inputs, {
  overrideContribStop,
  overrideVcSA,
  overrideHousingOutflow,
  overrideSalaryBump,
  overridePrivDrawdown,
  overridePrivDrawdownStart,
  overrideOaDrawdownMonthly,
  overrideSrsContrib,
  overridePrivGrowthRate,
  maxAge = 95,
  randomiseRates = false,
  mcVariance = 1,
} = {}) {
  // ─── RSS-SPECIFIC CONSTANTS ─────────────────────────────────────────────────
  // These are the only additions vs runProjectionEngine setup.
  const rssPayoutStart  = Number(inputs.rssPayoutStartAge) || 65;
  const rssMonthly      = Number(inputs.rssMonthlyPayout)  || 0;
  const rssAnnualPayout = rssMonthly * 12;
  let   rssDepletionAge = null;   // set once, when ra first hits 0
  let   rssDepletionHit = false;  // persistent guard so depletion is only recorded once
  // ── CPF LIFE migration (PR-3) ────────────────────────────────────────────────
  const migrationAge       = Math.max(0, Number(inputs.lifeMigrationAge) || 0);
  // lifePlanKey: which CPF LIFE plan the member chooses at migration.
  // 'std' = Standard (fixed for life), 'esc' = Escalating (2%/yr), 'bas' = Basic (two-phase).
  const lifePlanKey        = (['std','esc','bas'].includes(inputs.lifePlanAtMigration))
                               ? inputs.lifePlanAtMigration : 'std';
  const isMaleRSS          = inputs.isMale !== false;
  let   migrationActivated = false;  // flips true on the year age === migrationAge
  let   postMigrationMonthly = 0;   // CPF LIFE monthly payout at migration age (plan-specific)
  let   migYearsSince      = 0;     // escalating plan: years elapsed since migration (for 2%/yr compounding)
  // CPF LIFE Basic Plan state variables — used post-migration when lifePlanKey === 'bas'.
  let   migRaRem           = 0;     // RA_Retained tracker for Basic Plan post-migration
  let   migPhase1bTrigger  = 0;
  let   migPhase1aAnnual   = 0;
  let   migPhase2Annual    = 0;
  let   migEffAnnualFactor = 1;
  let   migrationRaWarning = false; // true if RA < $60k at migration age

  // ─── SETUP — verbatim copy from runProjectionEngine ────────────────────────
  const startAge = Math.max(0, Number(inputs.currentAge) || 0);
  const baseYear = Number(inputs.currentYear) || 2026;
  const contribStop = overrideContribStop !== undefined ? overrideContribStop : (Number(inputs.contributionStopAge) || 95);
  const housingStop = Number(inputs.housingStopAge) || 95;
  const salaryGrowth = (Number(inputs.salaryGrowthRate) || 0) / 100;
  const salaryBump = (overrideSalaryBump || 0) / 100;
  const salaryPhaseAge    = inputs.salaryPhaseAge !== "" && inputs.salaryPhaseAge != null ? Number(inputs.salaryPhaseAge) : null;
  const salaryGrowthRate2 = (Number(inputs.salaryGrowthRate2) || 0) / 100;
  const careerBreakStart  = inputs.careerBreakStartAge !== "" && inputs.careerBreakStartAge != null ? Number(inputs.careerBreakStartAge) : null;
  const careerBreakEnd    = inputs.careerBreakEndAge   !== "" && inputs.careerBreakEndAge   != null ? Number(inputs.careerBreakEndAge)   : null;
  const computeGF = makeComputeGF(startAge, salaryGrowth, salaryPhaseAge, salaryGrowthRate2, careerBreakStart, careerBreakEnd);
  const baseOA_Emp = Number(inputs.empOaCont) || 0;
  const baseSA_Emp = Number(inputs.empSaCont) || 0;
  const baseMA_Emp = Number(inputs.empMaCont) || 0;
  const vc3aCash   = Number(inputs.vc3aCash)  || 0;
  const vcVhrAmt   = Number(inputs.vcVhr)     || 0;
  const annualOaToSa      = Number(inputs.oaToSaTransfer) || 0;
  const annualOaToMa      = Number(inputs.oaToMaTransfer) || 0;
  const oaToMaForLovedOne = inputs.oaToMaForLovedOne === true;
  const oaToSaForLovedOne = inputs.oaToSaForLovedOne === true;
  const vc3aFreq      = inputs.vc3aFreq     || 'annual';
  const vcSaFreq      = inputs.vcSaFreq     || 'annual';
  const vcMaFreq      = inputs.vcMaFreq     || 'annual';
  const vcVhrFreq     = inputs.vcVhrFreq    || 'annual';
  const govGrantFreq  = inputs.govGrantFreq || 'annual';
  const wisFreq       = inputs.wisFreq      || 'annual';
  const cpfisOaFreq   = inputs.cpfisOaFreq  || 'annual';
  const cpfisSaFreq   = inputs.cpfisSaFreq  || 'annual';
  const housingFreq   = inputs.housingFreq  || 'annual';
  const oaWithdrawalFreq = inputs.oaWithdrawalFreq || 'one-time';
  const oaToMaFreq    = inputs.oaToMaFreq   || 'annual';
  const oaToSaFreq    = inputs.oaToSaFreq   || 'annual';
  const vc3aDur   = Number(inputs.vc3aDur)   || 0;
  const vcSaDur   = Number(inputs.vcSaDur)   || 0;
  const vcMaDur   = Number(inputs.vcMaDur)   || 0;
  const vcVhrDur  = Number(inputs.vcVhrDur)  || 0;
  const govGrantDur = Number(inputs.govGrantDur) || 0;
  const wisDur    = Number(inputs.wisDur)    || 0;
  const cpfisOaDur  = Number(inputs.cpfisOaDur)  || 0;
  const cpfisSaDur  = Number(inputs.cpfisSaDur)  || 0;
  const housingDur  = Number(inputs.housingDur)  || 0;
  const oaToMaDur   = Number(inputs.oaToMaDur)   || 0;
  const oaToSaDur   = Number(inputs.oaToSaDur)   || 0;
  const oaEduLoanDur = Number(inputs.oaEduLoanDur) || 0;
  const vcMaCash = Number(inputs.vcMaCash) || 0;
  const rsGrowth = (Number(inputs.retirementSumGrowth) || 3) / 100;
  const isSC = (inputs.citizenStatus === 'SC') || (inputs.citizenStatus === undefined);
  const isPwD = !!inputs.isPwD;
  const wisAmount     = Number(inputs.wisAmount)    || 0;
  const cpfisOaAmount = Number(inputs.cpfisOaAmount) || 0;
  const cpfisSaAmount = Number(inputs.cpfisSaAmount) || 0;
  const baseHousing   = overrideHousingOutflow !== undefined ? overrideHousingOutflow : (Number(inputs.housingOutflow) || 0);
  const oaEduLoanAnnual = Number(inputs.oaEduLoan)    || 0;
  const oaEduLoanFreq   = inputs.oaEduLoanFreq || 'one-time';
  const baseMedical = (Number(inputs.medicalUsage) || 0) + (Number(inputs.medishieldIP) || 0) + (Number(inputs.elderCareShield) || 0);
  const medInfl     = (Number(inputs.medicalInflationRate) || 0) / 100;
  const isSEP       = inputs.isSelfEmployed === true;
  const isLeasehold = inputs.propertyLeasehold === true;
  const totalLease  = Math.max(30, Number(inputs.propertyLeaseYears) || 99);
  const propGrowth  = (Number(inputs.propertyGrowthRate) || 0) / 100;
  const usePropertyPledge = inputs.usePropertyPledge === true;
  let privateAssets    = Number(inputs.currentPrivateAssets) || 0;
  const privateGrowth  = overridePrivGrowthRate !== undefined ? overridePrivGrowthRate / 100 : (Number(inputs.privateAssetGrowthRate) || 0) / 100;
  const privateSaving  = Number(inputs.annualPrivateSaving)  || 0;
  const plannedDownpaymentOA = Number(inputs.plannedDownpaymentOA) || 0;
  const downpaymentAge       = Number(inputs.downpaymentAge) || 35;
  let downpaymentApplied = startAge > downpaymentAge;
  const srsCap = (inputs.citizenStatus === 'foreigner') ? SRS_CAP_FOREIGNER : SRS_CAP_SC_PR;
  const srsContrib     = overrideSrsContrib !== undefined ? Math.min(overrideSrsContrib, srsCap) : Math.min(Number(inputs.srsAnnualContribution) || 0, srsCap);
  const srsContribStop = Number(inputs.srsContribStopAge)    || 63;
  const srsReturn      = (Number(inputs.srsReturnRate) || 0) / 100;
  const srsDrawStart   = Math.max(Number(inputs.srsDrawdownStartAge) || 63, 63);
  const srsDrawYears   = Math.min(Math.max(Number(inputs.srsDrawdownYears) || 10, 1), 10);
  let srsBalance        = Number(inputs.srsBalance) || 0;
  let srsDrawdownApplied = startAge >= srsDrawStart;
  let srsAnnualDraw      = 0;
  const yearsTo55  = Math.max(0, 55 - startAge);
  const projFRS55  = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + yearsTo55) - 2026)));
  const past55FRS  = Math.round(RETIREMENT_SUMS_2026.FRS / Math.pow(1 + rsGrowth, Math.max(0, startAge - 55)));
  const cohortRetSum = usePropertyPledge
    ? (startAge >= 55 ? Math.round(RETIREMENT_SUMS_2026.BRS / Math.pow(1 + rsGrowth, Math.max(0, startAge - 55)))
      : Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + yearsTo55) - 2026))))
    : (startAge >= 55 ? past55FRS : projFRS55);
  let oa = Number(inputs.oaBalance) || 0;
  let sa = Number(inputs.saBalance) || 0;
  let ma = Number(inputs.maBalance) || 0;
  let ra = startAge >= 55 ? sa : 0;
  if (startAge >= 55) sa = 0;
  let totalInjected = 0, totalInterest = 0, totalOutSpent = 0;
  const sellPropertyAge = Number(inputs.sellPropertyAge) || 0;
  let cumHousingOA = 0;
  let cumEduOut    = 0;
  let cumHousingFV = 0;
  let refundApplied = startAge >= sellPropertyAge && sellPropertyAge > 0;
  let cumRaCashTopUps = 0;
  let cumRaInterest   = 0;
  let cumMrssReceived = 0;
  let currentPropValue  = Number(inputs.propertyValue) || 0;
  let leaseRemaining    = totalLease;
  const oaWithdrawalAt55    = Number(inputs.oaWithdrawalAt55)      || 0;
  let withdrawalApplied     = startAge >= 55;
  const pledgeWithdrawalAmount = (usePropertyPledge && Number(inputs.pledgeWithdrawalAmount)) ? Number(inputs.pledgeWithdrawalAmount) : 0;
  const pledgeWithdrawalAge    = Math.max(55, Number(inputs.pledgeWithdrawalAge) || 55);
  let pledgeWithdrawalApplied  = startAge >= pledgeWithdrawalAge;
  const oaDrawdownStartAge  = Number(inputs.oaDrawdownStartAge) || 0;
  const oaDrawdownMonthly   = overrideOaDrawdownMonthly !== undefined ? overrideOaDrawdownMonthly : (Number(inputs.oaDrawdownMonthly) || 0);
  const oaDrawdownAnnual    = oaDrawdownMonthly * 12;
  const oaDrawdownFloor     = Number(inputs.oaDrawdownFloor) || 0;
  const oaDrawdownActive    = oaDrawdownStartAge > 0 && oaDrawdownMonthly > 0;
  const propMonetiseEnabled = inputs.propMonetiseEnabled === true;
  const propMonetiseAge     = Number(inputs.propMonetiseAge)          || 65;
  const propMonetiseCash    = Number(inputs.propMonetiseCashProceeds) || 0;
  const propMonetiseRaTopup = Number(inputs.propMonetiseRaTopup)      || 0;
  let propMonetiseApplied   = startAge >= propMonetiseAge && propMonetiseEnabled;
  const owMonthly            = Math.min(Number(inputs.salaryGross) || 0, 8000);
  const owAnnualSubjectToCPF = owMonthly * 12;
  const awCeiling            = Math.max(0, 102000 - owAnnualSubjectToCPF);
  const isPR          = (inputs.citizenStatus || 'SC') === 'PR';
  const isForeigner   = (inputs.citizenStatus || 'SC') === 'foreigner';
  const startPrYear   = Math.min(3, Math.max(1, Number(inputs.prYear) || 3));
  const annualGrossSalary = owMonthly * 12;
  let currentPrYear   = startPrYear;
  let pendingMmssCarry = 0;
  let earlyRetireFired = false;
  const data = [];

  // ─── YEAR LOOP ──────────────────────────────────────────────────────────────
  for (let age = startAge; age <= maxAge; age++) {
    let yearInflow    = 0;
    let yearMandatory = 0;
    let yearVoluntary = 0;
    let yearGovGrants = 0;
    let yearWisCash   = 0;
    let yearOaInterest = 0, yearSaRaInterest = 0, yearMaInterest = 0;
    let yearHousingOut = 0, yearMedOut = 0, yearOaDrawOut = 0, yearLovedOneOut = 0;
    let yearEventsIn = 0, yearEventsOut = 0;
    let yearCpfisOut = 0, yearEduOut = 0;
    let rssPayoutThisYear = 0;  // ← RSS-specific; 0 until rssPayoutStart reached

    // Life events
    const activeEvents     = (inputs.lifeEvents || []).filter(e => e.enabled !== false && Number(e.startAge) <= age && age <= Number(e.endAge));
    const leContribPaused  = activeEvents.some(e => e.type === 'retrenchment' || e.type === 'career_break');
    const leEarlyRetire    = activeEvents.some(e => e.type === 'early_retirement');
    if (leEarlyRetire) earlyRetireFired = true;
    const leHyperinflation = activeEvents.find(e => e.type === 'hyperinflation');
    const leMedicalEvents  = activeEvents.filter(e => e.type === 'medical_crisis');
    const leWindfallEvents = activeEvents.filter(e => e.type === 'windfall' && age === Number(e.startAge));

    // MMSS carry
    if (pendingMmssCarry > 0) { ma += pendingMmssCarry; yearGovGrants += pendingMmssCarry; yearInflow += pendingMmssCarry; totalInjected += pendingMmssCarry; pendingMmssCarry = 0; }

    // Frequency & duration gating
    const isFirstYear  = age === startAge;
    const yearIdx      = age - startAge;
    const effVc3aFreq  = vc3aFreq  === 'one-time' && !isFirstYear ? 0 : (vc3aDur  > 0 && yearIdx >= vc3aDur)  ? 0 : 1;
    const effVcSaFreq  = vcSaFreq  === 'one-time' && !isFirstYear ? 0 : (vcSaDur  > 0 && yearIdx >= vcSaDur)  ? 0 : 1;
    const effVcMaFreq  = vcMaFreq  === 'one-time' && !isFirstYear ? 0 : (vcMaDur  > 0 && yearIdx >= vcMaDur)  ? 0 : 1;
    const effVcVhrFreq = vcVhrFreq === 'one-time' && !isFirstYear ? 0 : (vcVhrDur > 0 && yearIdx >= vcVhrDur) ? 0 : 1;
    const effGovGrantFreq = govGrantFreq === 'one-time' && !isFirstYear ? 0 : (govGrantDur > 0 && yearIdx >= govGrantDur) ? 0 : 1;
    const effWisFreq   = wisFreq   === 'one-time' && !isFirstYear ? 0 : (wisDur   > 0 && yearIdx >= wisDur)   ? 0 : 1;
    const effCpfisOaFreq = cpfisOaFreq === 'one-time' && !isFirstYear ? 0 : (cpfisOaDur > 0 && yearIdx >= cpfisOaDur) ? 0 : 1;
    const effCpfisSaFreq = cpfisSaFreq === 'one-time' && !isFirstYear ? 0 : (cpfisSaDur > 0 && yearIdx >= cpfisSaDur) ? 0 : 1;
    const effHousingFreq = housingFreq === 'one-time' && !isFirstYear ? 0 : (housingDur > 0 && yearIdx >= housingDur) ? 0 : 1;
    const effOaToMaFreq  = oaToMaFreq  === 'one-time' && !isFirstYear ? 0 : (oaToMaDur  > 0 && yearIdx >= oaToMaDur)  ? 0 : 1;
    const effOaToSaFreq  = oaToSaFreq  === 'one-time' && !isFirstYear ? 0 : (oaToSaDur  > 0 && yearIdx >= oaToSaDur)  ? 0 : 1;

    // Opening balances for mid-year interest
    const oaOpen = oa, saOpen = sa, maOpen = ma, raOpen = ra;

    // Private assets
    let yearPrivDrawOut = 0;
    if (age > startAge) { privateAssets = privateAssets * (1 + privateGrowth) + privateSaving; } else { privateAssets += privateSaving; }
    if (overridePrivDrawdown > 0 && overridePrivDrawdownStart > 0 && age >= overridePrivDrawdownStart) {
      const actualPrivDraw = Math.min(overridePrivDrawdown, Math.max(0, privateAssets));
      privateAssets = Math.max(0, privateAssets - actualPrivDraw);
      yearPrivDrawOut = actualPrivDraw;
    }

    // SRS
    if (age > startAge) srsBalance = srsBalance * (1 + srsReturn);
    if (age <= srsContribStop && age < srsDrawStart) srsBalance += srsContrib;
    if (age === srsDrawStart && !srsDrawdownApplied) {
      srsAnnualDraw = srsDrawYears > 0 ? (srsReturn > 0 ? Math.round(srsBalance * srsReturn / (1 - Math.pow(1 + srsReturn, -srsDrawYears))) : Math.round(srsBalance / srsDrawYears)) : srsBalance;
      srsDrawdownApplied = true;
    }
    if (srsDrawdownApplied && age >= srsDrawStart && age < srsDrawStart + srsDrawYears) { srsBalance = Math.max(0, srsBalance - srsAnnualDraw); }
    if (srsDrawdownApplied && age === srsDrawStart + srsDrawYears - 1) srsBalance = 0;

    // Downpayment
    if (age === downpaymentAge && plannedDownpaymentOA > 0 && !downpaymentApplied) {
      const actualDownpayment = Math.min(oa, plannedDownpaymentOA);
      oa -= actualDownpayment; cumHousingOA += actualDownpayment; cumHousingFV += actualDownpayment; downpaymentApplied = true;
    }

    // SA closure at 55
    if (age === 55 && startAge < 55) {
      let req = Math.max(0, cohortRetSum - ra);
      const fromSA = Math.min(sa, req); ra += fromSA; req -= fromSA;
      oa += (sa - fromSA); sa = 0;
      const fromOA = Math.min(Math.max(0, oa - 5000), req); ra += fromOA; oa -= fromOA;
    } else if (age === startAge && startAge >= 55 && sa > 0) {
      let req = Math.max(0, cohortRetSum - ra);
      const fromSA = Math.min(sa, req); ra += fromSA; req -= fromSA;
      oa += (sa - fromSA); sa = 0;
    }

    // OA withdrawal at 55
    if (oaWithdrawalAt55 > 0) {
      if (oaWithdrawalFreq === 'annual') {
        if (age >= 55) { const actualW55 = Math.min(oaWithdrawalAt55, Math.max(0, oa - oaDrawdownFloor)); oa -= actualW55; yearOaDrawOut += actualW55; totalOutSpent += actualW55; }
      } else {
        if (age === 55 && !withdrawalApplied) { const actualW55 = Math.min(oaWithdrawalAt55, Math.max(0, oa - oaDrawdownFloor)); oa -= actualW55; yearOaDrawOut += actualW55; totalOutSpent += actualW55; withdrawalApplied = true; }
      }
    }

    // Pledge RA withdrawal
    if (usePropertyPledge && pledgeWithdrawalAmount > 0 && age === pledgeWithdrawalAge && !pledgeWithdrawalApplied) {
      const projBRS_pw = Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
      const actualPledgeWithdraw = Math.min(pledgeWithdrawalAmount, Math.max(0, ra - projBRS_pw));
      ra = Math.max(0, ra - actualPledgeWithdraw); totalOutSpent += actualPledgeWithdraw; yearOaDrawOut += actualPledgeWithdraw; pledgeWithdrawalApplied = true;
    }

    // OA→SA/RA transfers
    if (age < 55 && annualOaToSa > 0 && effOaToSaFreq > 0 && !isForeigner) {
      const actualTransfer = oaToSaForLovedOne ? Math.min(annualOaToSa, oa) : (() => { const projFRS_oaToSa = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026))); return Math.min(annualOaToSa, oa, Math.max(0, projFRS_oaToSa - sa)); })();
      oa -= actualTransfer;
      if (!oaToSaForLovedOne) { sa += actualTransfer; } else { yearLovedOneOut += actualTransfer; totalOutSpent += actualTransfer; }
    }
    if (age >= 55 && annualOaToSa > 0 && effOaToSaFreq > 0 && !isForeigner) {
      const actualTransferRA = oaToSaForLovedOne ? Math.min(annualOaToSa, oa) : (() => { const projERS_oaToRa = Math.round(RETIREMENT_SUMS_2026.ERS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026))); return Math.min(annualOaToSa, oa, Math.max(0, projERS_oaToRa - ra)); })();
      oa -= actualTransferRA;
      if (!oaToSaForLovedOne) { ra += actualTransferRA; cumRaCashTopUps += actualTransferRA; } else { yearLovedOneOut += actualTransferRA; totalOutSpent += actualTransferRA; }
    }

    // OA→MA transfer
    if (age >= 55 && annualOaToMa > 0 && effOaToMaFreq > 0 && !isForeigner) {
      const projBHS_tr = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
      const actualOaToMa = Math.min(annualOaToMa, oa, oaToMaForLovedOne ? annualOaToMa : Math.max(0, projBHS_tr - ma));
      oa -= actualOaToMa;
      if (!oaToMaForLovedOne) { ma += actualOaToMa; } else { yearLovedOneOut += actualOaToMa; totalOutSpent += actualOaToMa; }
    }

    // vcMaCash
    const maBeforeVcMa = ma;
    if (vcMaCash * effVcMaFreq > 0 && !isForeigner) {
      const projBHS_vcma = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
      const actualVcMa = Math.min(vcMaCash * effVcMaFreq, Math.max(0, projBHS_vcma - ma));
      ma += actualVcMa; yearInflow += actualVcMa; totalInjected += actualVcMa; yearVoluntary += actualVcMa;
    }

    // MMSS
    const effectiveBaseYear_mmss = Math.max(MMSS_PILOT_START_YEAR, baseYear);
    const simYear_mmss = effectiveBaseYear_mmss + (age - startAge);
    const gf_mmss = leContribPaused ? 0 : computeGF(age, salaryBump);
    const owAnnualScaled_mmss = Math.min(owMonthly * 12 * gf_mmss, 96000);
    const awCeilingMmss = Math.max(0, 102000 - owAnnualScaled_mmss);
    const bonusMmss     = Math.min((Number(inputs.salaryBonus) || 0) * gf_mmss, awCeilingMmss);
    const mmssMonthlyIncome = isSEP ? (leContribPaused ? 0 : (Number(inputs.netTradeIncome) || 0) / 12) : Math.round((owAnnualScaled_mmss + bonusMmss) / 12);
    if (isSC && age >= 55 && age <= 70 && simYear_mmss >= MMSS_PILOT_START_YEAR && simYear_mmss <= MMSS_PILOT_END_YEAR && mmssMonthlyIncome <= 4000) {
      const projBHS_mm = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + rsGrowth, Math.max(0, simYear_mmss - 2026)));
      if (maBeforeVcMa < projBHS_mm / 2) {
        const vcMaThis = vcMaCash * effVcMaFreq;
        if (vcMaThis > 0) { const actualMmss = Math.min(vcMaThis, 1000, Math.max(0, projBHS_mm - ma)); if (actualMmss > 0) pendingMmssCarry += actualMmss; }
      }
    }

    // CPFIS
    if (cpfisOaAmount * effCpfisOaFreq > 0 && age >= 18 && !isForeigner) {
      const actualCpfisOa = Math.min(cpfisOaAmount * effCpfisOaFreq, Math.max(0, oa - 20000));
      oa -= actualCpfisOa; yearCpfisOut += actualCpfisOa; totalOutSpent += actualCpfisOa;
    }
    if (cpfisSaAmount * effCpfisSaFreq > 0 && age < 55 && age >= 18 && !isForeigner) {
      const actualCpfisSa = Math.min(cpfisSaAmount * effCpfisSaFreq, Math.max(0, sa - 40000));
      sa -= actualCpfisSa; yearCpfisOut += actualCpfisSa; totalOutSpent += actualCpfisSa;
    }

    // Contribution block
    if (age < contribStop && !isForeigner && !leEarlyRetire && !earlyRetireFired) {
      const gf = leContribPaused ? 0 : computeGF(age, salaryBump);
      const mandatorySA_base = Math.round(baseSA_Emp * gf);
      if (isSEP) {
        const nti = Number(inputs.netTradeIncome) || 0;
        let sepMandatoryMA = 0;
        if (nti > 6000) { let maRate = 0.08; if (age > 50) maRate = 0.105; else if (age > 45) maRate = 0.10; else if (age > 35) maRate = 0.09; sepMandatoryMA = Math.round(Math.min(nti, 96000) * maRate); }
        const vc3aTotal = Math.min(vc3aCash * effVc3aFreq, Math.max(0, ANNUAL_LIMIT - sepMandatoryMA));
        let vc3aOaRatio, vc3aSaRatio, vc3aMaRatio;
        if      (age <= 35) { vc3aOaRatio=0.23; vc3aSaRatio=0.06;  vc3aMaRatio=0.08;  }
        else if (age <= 45) { vc3aOaRatio=0.21; vc3aSaRatio=0.07;  vc3aMaRatio=0.09;  }
        else if (age <= 50) { vc3aOaRatio=0.19; vc3aSaRatio=0.08;  vc3aMaRatio=0.10;  }
        else if (age <= 55) { vc3aOaRatio=0.15; vc3aSaRatio=0.115; vc3aMaRatio=0.105; }
        else if (age <= 60) { vc3aOaRatio=0.12; vc3aSaRatio=0.115; vc3aMaRatio=0.105; }
        else if (age <= 65) { vc3aOaRatio=0.035;vc3aSaRatio=0.11;  vc3aMaRatio=0.105; }
        else if (age <= 70) { vc3aOaRatio=0.01; vc3aSaRatio=0.05;  vc3aMaRatio=0.105; }
        else                { vc3aOaRatio=0.01; vc3aSaRatio=0.01;  vc3aMaRatio=0.105; }
        const ratioSum = vc3aOaRatio + vc3aSaRatio + vc3aMaRatio;
        const toOA_vc3a = Math.round(vc3aTotal * (vc3aOaRatio / ratioSum)) + vcVhrAmt * effVcVhrFreq;
        const toMA_vc3a = Math.round(vc3aTotal * (vc3aMaRatio / ratioSum));
        const toSA_vc3a = vc3aTotal - Math.round(vc3aTotal * (vc3aOaRatio / ratioSum)) - toMA_vc3a;
        const wisToMA_sep = wisAmount > 0 ? Math.round(wisAmount * effWisFreq * 0.9) : 0;
        yearWisCash = wisAmount > 0 ? Math.round(wisAmount * effWisFreq * 0.1) : 0;
        const projBHS_i = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
        const maRoom = Math.max(0, projBHS_i - ma);
        const actualMandatoryMA_sep = Math.min(sepMandatoryMA, maRoom);
        const vcMaRoomSep = Math.max(0, maRoom - actualMandatoryMA_sep);
        const actualVcMA_sep = Math.min(toMA_vc3a, vcMaRoomSep);
        const maSpill = (sepMandatoryMA - actualMandatoryMA_sep) + (toMA_vc3a - actualVcMA_sep);
        const remainingMaRoom = Math.max(0, maRoom - actualMandatoryMA_sep - actualVcMA_sep);
        const actualToMAWis = Math.min(wisToMA_sep, remainingMaRoom);
        const wisMASpill = wisToMA_sep - actualToMAWis;
        ma += (actualMandatoryMA_sep + actualVcMA_sep + actualToMAWis);
        const projFRS_sep = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
        if (age >= 55) {
          const raRoom_sep = Math.max(0, projFRS_sep - ra);
          const toRA_sep = Math.min(toSA_vc3a + maSpill + wisMASpill, raRoom_sep);
          ra += toRA_sep; oa += (toSA_vc3a + maSpill + wisMASpill - toRA_sep);
        } else {
          const saRoomSep = Math.max(0, projFRS_sep - sa);
          const toSA_total = toSA_vc3a + maSpill + wisMASpill;
          const actualToSA_sep = Math.min(toSA_total, saRoomSep);
          sa += actualToSA_sep; oa += (toSA_total - actualToSA_sep);
        }
        oa += toOA_vc3a;
        const projBRS_sep = Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
        const mrssAgeOk_sep = age >= 55 || (isPwD && age < 55);
        const mrssBalOk_sep = age >= 55 ? ra < projBRS_sep : (oa + sa) < projBRS_sep;
        const mrssIncomeOk_sep = mmssMonthlyIncome <= 4000;
        const vcSaThis_sep = (overrideVcSA !== undefined ? overrideVcSA : (Number(inputs.vcSaTopup) || 0)) * effVcSaFreq;
        const mrssEligible_sep = isSC && mrssAgeOk_sep && mrssBalOk_sep && mrssIncomeOk_sep && cumMrssReceived < 20000 && vcSaThis_sep > 0;
        const actualMrss_sep = mrssEligible_sep ? Math.min(vcSaThis_sep, 2000, 20000 - cumMrssReceived) : 0;
        if (actualMrss_sep > 0) cumMrssReceived += actualMrss_sep;
        const govGrant_sep = (Number(inputs.annualGovGrant) || 0) * effGovGrantFreq;
        if (age >= 55) { ra += govGrant_sep + actualMrss_sep; } else { sa += govGrant_sep + actualMrss_sep; }
        const sepContribInflow = vc3aTotal + vcVhrAmt * effVcVhrFreq + sepMandatoryMA + govGrant_sep + actualMrss_sep + wisToMA_sep;
        yearInflow += sepContribInflow; totalInjected += sepContribInflow;
        cumRaCashTopUps += toSA_vc3a + maSpill + wisMASpill + govGrant_sep + actualMrss_sep;
        yearMandatory += actualMandatoryMA_sep;
        yearVoluntary += vc3aTotal + vcVhrAmt * effVcVhrFreq;
        yearGovGrants += govGrant_sep + actualMrss_sep + wisToMA_sep;
      } else {
        let mandatoryOA_i, mandatorySA_dyn, mandatoryMA_i;
        if (isPR && currentPrYear < 3) {
          const prRates = getPRRates(currentPrYear, age, inputs.prRateType || 'GG');
          const grossScaled = annualGrossSalary * gf;
          const owScaledCapped = Math.min(grossScaled, 96000);
          const awCeilingEng = Math.max(0, 102000 - owScaledCapped);
          const bonusCpfEng = Math.min((Number(inputs.salaryBonus) || 0) * gf, awCeilingEng);
          const totalScaled = owScaledCapped + bonusCpfEng;
          mandatoryOA_i = Math.round(totalScaled * prRates.oa);
          mandatorySA_dyn = Math.round(totalScaled * prRates.sa);
          mandatoryMA_i = Math.round(totalScaled * prRates.ma);
        } else if (isPR && startPrYear < 3) {
          let scOA, scSA, scMA;
          if      (age <= 35) { scOA=0.23; scSA=0.06;  scMA=0.08;  }
          else if (age <= 45) { scOA=0.21; scSA=0.07;  scMA=0.09;  }
          else if (age <= 50) { scOA=0.19; scSA=0.08;  scMA=0.10;  }
          else if (age <= 55) { scOA=0.15; scSA=0.115; scMA=0.105; }
          else if (age <= 60) { scOA=0.12; scSA=0.115; scMA=0.105; }
          else if (age <= 65) { scOA=0.035;scSA=0.11;  scMA=0.105; }
          else if (age <= 70) { scOA=0.01; scSA=0.05;  scMA=0.105; }
          else                { scOA=0.01; scSA=0.01;  scMA=0.105; }
          const grossScaled = Math.min(annualGrossSalary * gf, 96000);
          const awCeilingEng = Math.max(0, 102000 - grossScaled);
          const bonusCpfEng = Math.min((Number(inputs.salaryBonus) || 0) * gf, awCeilingEng);
          const totalScaled = grossScaled + bonusCpfEng;
          mandatoryOA_i = Math.round(totalScaled * scOA);
          mandatorySA_dyn = Math.round(totalScaled * scSA);
          mandatoryMA_i = Math.round(totalScaled * scMA);
        } else {
          mandatoryOA_i = Math.round(baseOA_Emp * gf);
          mandatorySA_dyn = mandatorySA_base;
          mandatoryMA_i = Math.round(baseMA_Emp * gf);
          const totalC = mandatoryOA_i + mandatorySA_dyn + mandatoryMA_i;
          if (totalC > ANNUAL_LIMIT) { const scaleC = ANNUAL_LIMIT / totalC; mandatoryOA_i = Math.round(mandatoryOA_i * scaleC); mandatorySA_dyn = Math.round(mandatorySA_dyn * scaleC); mandatoryMA_i = ANNUAL_LIMIT - mandatoryOA_i - mandatorySA_dyn; }
        }
        let vc3aOaRatio, vc3aSaRatio, vc3aMaRatio;
        if      (age <= 35) { vc3aOaRatio=0.23; vc3aSaRatio=0.06;  vc3aMaRatio=0.08;  }
        else if (age <= 45) { vc3aOaRatio=0.21; vc3aSaRatio=0.07;  vc3aMaRatio=0.09;  }
        else if (age <= 50) { vc3aOaRatio=0.19; vc3aSaRatio=0.08;  vc3aMaRatio=0.10;  }
        else if (age <= 55) { vc3aOaRatio=0.15; vc3aSaRatio=0.115; vc3aMaRatio=0.105; }
        else if (age <= 60) { vc3aOaRatio=0.12; vc3aSaRatio=0.115; vc3aMaRatio=0.105; }
        else if (age <= 65) { vc3aOaRatio=0.035;vc3aSaRatio=0.11;  vc3aMaRatio=0.105; }
        else if (age <= 70) { vc3aOaRatio=0.01; vc3aSaRatio=0.05;  vc3aMaRatio=0.105; }
        else                { vc3aOaRatio=0.01; vc3aSaRatio=0.01;  vc3aMaRatio=0.105; }
        const ratioSum_emp = vc3aOaRatio + vc3aSaRatio + vc3aMaRatio;
        const wisCpf = wisAmount * effWisFreq > 0 ? Math.round(wisAmount * effWisFreq * 0.6) : 0;
        yearWisCash = Math.round(wisAmount * effWisFreq * 0.4);
        const wisOA = Math.round(wisCpf * (vc3aOaRatio / ratioSum_emp));
        const wisMA = Math.round(wisCpf * (vc3aMaRatio / ratioSum_emp));
        const wisSA = wisCpf - wisOA - wisMA;
        const vc3aCashEff = vc3aCash * effVc3aFreq;
        const vcVhrAmtEff = vcVhrAmt * effVcVhrFreq;
        const vc3aOA = Math.round(vc3aCashEff * (vc3aOaRatio / ratioSum_emp));
        const vc3aMA = Math.round(vc3aCashEff * (vc3aMaRatio / ratioSum_emp));
        const vc3aSA = vc3aCashEff - vc3aOA - vc3aMA;
        const totalMandatory = mandatoryOA_i + mandatorySA_dyn + mandatoryMA_i;
        const vcRoomThisYear = Math.max(0, ANNUAL_LIMIT - totalMandatory);
        const vc3aScale = vc3aCashEff > 0 && vc3aCashEff > vcRoomThisYear ? vcRoomThisYear / vc3aCashEff : 1;
        const cappedVcOA = Math.round(vc3aOA * vc3aScale) + vcVhrAmtEff;
        const cappedVcSA = overrideVcSA !== undefined
          ? Math.round(overrideVcSA * vc3aScale) + (Number(inputs.annualGovGrant) || 0) * effGovGrantFreq
          : Math.round(vc3aSA * vc3aScale) + (Number(inputs.vcSaTopup) || 0) * effVcSaFreq + (Number(inputs.annualGovGrant) || 0) * effGovGrantFreq;
        const cappedVcMA = Math.round(vc3aMA * vc3aScale);
        const totalOA = mandatoryOA_i + cappedVcOA + wisOA;
        const projBHS_emp = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
        const maRoomEmp = Math.max(0, projBHS_emp - ma);
        const actualMandatoryMA_emp = Math.min(mandatoryMA_i, maRoomEmp);
        const vcMaRoomEmp = Math.max(0, maRoomEmp - actualMandatoryMA_emp);
        const actualVcMA_emp = Math.min(cappedVcMA, vcMaRoomEmp);
        const wisMARoom_emp = Math.max(0, vcMaRoomEmp - actualVcMA_emp);
        const actualWisMA_emp = Math.min(wisMA, wisMARoom_emp);
        const actualMA = actualMandatoryMA_emp + actualVcMA_emp + actualWisMA_emp;
        const maSpillEmp = (mandatoryMA_i + cappedVcMA + wisMA) - actualMA;
        oa += totalOA; ma += actualMA;
        const empContribInflowBase = totalOA + mandatorySA_dyn + cappedVcSA + actualMA + wisSA;
        yearMandatory += mandatoryOA_i + mandatorySA_dyn + actualMandatoryMA_emp;
        const govGrantContrib_emp = (Number(inputs.annualGovGrant) || 0) * effGovGrantFreq;
        yearVoluntary += (cappedVcOA - vcVhrAmtEff) + (vc3aCashEff > 0 ? actualVcMA_emp : 0) + (cappedVcSA - govGrantContrib_emp) + vcVhrAmtEff;
        const projBRS_emp = Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
        const mrssAgeOk_emp = age >= 55 || (isPwD && age < 55);
        const mrssBalOk_emp = age >= 55 ? ra < projBRS_emp : (oa + sa) < projBRS_emp;
        const owAnnualScaled_mrss = Math.min(owMonthly * 12 * gf, 96000);
        const bonusMrss = Math.min((Number(inputs.salaryBonus) || 0) * gf, Math.max(0, 102000 - owAnnualScaled_mrss));
        const mrssIncomeOk_emp = Math.round((owAnnualScaled_mrss + bonusMrss) / 12) <= 4000;
        const vcSaThis_emp = (overrideVcSA !== undefined ? overrideVcSA : (Number(inputs.vcSaTopup) || 0)) * effVcSaFreq;
        const mrssEligible_emp = isSC && mrssAgeOk_emp && mrssBalOk_emp && mrssIncomeOk_emp && cumMrssReceived < 20000 && vcSaThis_emp > 0;
        const actualMrss_emp = mrssEligible_emp ? Math.min(vcSaThis_emp, 2000, 20000 - cumMrssReceived) : 0;
        if (actualMrss_emp > 0) cumMrssReceived += actualMrss_emp;
        yearGovGrants += (Number(inputs.annualGovGrant)||0) * effGovGrantFreq + actualMrss_emp + wisCpf * effWisFreq;
        const empContribInflow = empContribInflowBase + actualMrss_emp;
        yearInflow += empContribInflow; totalInjected += empContribInflow;
        if (age >= 55) {
          let roomInRA_Mand = Math.max(0, cohortRetSum - ra);
          let mandToRA = Math.min(mandatorySA_dyn, roomInRA_Mand);
          ra += mandToRA; oa += (mandatorySA_dyn - mandToRA);
          const projFRS_vc3a_emp = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
          const vcToRA = Math.min(cappedVcSA + maSpillEmp + wisSA, Math.max(0, projFRS_vc3a_emp - ra));
          ra += vcToRA; oa += (cappedVcSA + maSpillEmp + wisSA - vcToRA);
          ra += actualMrss_emp; cumRaCashTopUps += vcToRA + actualMrss_emp;
        } else {
          const projFRS_sa = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
          const totalToSA = mandatorySA_dyn + cappedVcSA + maSpillEmp + wisSA + actualMrss_emp;
          const saRoom = Math.max(0, projFRS_sa - sa);
          const actualToSA = Math.min(totalToSA, saRoom);
          sa += actualToSA; oa += (totalToSA - actualToSA);
          cumRaCashTopUps += cappedVcSA + maSpillEmp + wisSA + actualMrss_emp;
        }
      }
    }

    // Interest (mid-year average-balance convention)
    const _band = (mcVariance / 100);
    const rateNoise = randomiseRates ? (Math.random() * _band * 2 - _band) : 0;
    const rOA = CPF_RATES.OA + rateNoise;
    const rSA = CPF_RATES.SA + rateNoise;
    const rMA = CPF_RATES.MA + rateNoise;
    const rRA = CPF_RATES.RA + rateNoise;
    const oaAvg = (oaOpen + oa) / 2;
    const saAvg = (saOpen + sa) / 2;
    const maAvg = (maOpen + ma) / 2;
    const raAvg = (raOpen + ra) / 2;
    let b1ToSA = 0, b1ToMA = 0, b1ToRA = 0, b2ToRA = 0, b2ToMA = 0;
    if (age < 55) {
      const oaP1 = Math.min(oaAvg, 20000); const rem1 = Math.max(0, 60000 - oaP1);
      const saP1 = Math.min(saAvg, rem1);   const maP1 = Math.min(maAvg, Math.max(0, rem1 - saP1));
      b1ToSA = (oaP1 + saP1) * CPF_RATES.EXTRA_1; b1ToMA = maP1 * CPF_RATES.EXTRA_1;
    } else {
      const raP1 = Math.min(raAvg, 60000);  const rem1 = Math.max(0, 60000 - raP1);
      const oaP1 = Math.min(oaAvg, Math.min(20000, rem1)); const maP1 = Math.min(maAvg, Math.max(0, rem1 - oaP1));
      b1ToRA = (raP1 + oaP1) * CPF_RATES.EXTRA_1; b1ToMA = maP1 * CPF_RATES.EXTRA_1;
      const raP2 = Math.min(raAvg, 30000);  const rem2 = Math.max(0, 30000 - raP2);
      const oaP2 = Math.min(oaAvg, Math.min(20000, rem2)); const maP2 = Math.min(maAvg, Math.max(0, rem2 - oaP2));
      b2ToRA = (raP2 + oaP2) * CPF_RATES.EXTRA_2; b2ToMA = maP2 * CPF_RATES.EXTRA_2;
    }
    const yearTotalInterest = (oaAvg * rOA) + (saAvg * rSA) + (maAvg * rMA) + (raAvg * rRA) + b1ToSA + b1ToMA + b1ToRA + b2ToRA + b2ToMA;
    totalInterest += yearTotalInterest;
    yearOaInterest   = Math.round(oaAvg * rOA);
    yearMaInterest   = Math.round(maAvg * rMA + b1ToMA + b2ToMA);
    yearSaRaInterest = Math.round(yearTotalInterest) - yearOaInterest - yearMaInterest;
    const yearRaInterest = age >= 55 ? (raAvg * rRA) + b1ToRA + b2ToRA : (saAvg * rSA) + b1ToSA;
    cumRaInterest += yearRaInterest;
    oa += oaAvg * rOA; sa += saAvg * rSA; ra += raAvg * rRA; ma += maAvg * rMA;
    if (age < 55) { sa += b1ToSA; ma += b1ToMA; } else { ra += b1ToRA + b2ToRA; ma += b1ToMA + b2ToMA; }
    // ── Post-depletion / post-migration RA clamp ──────────────────────────────
    // (1) RSS depletion: ra = 0, redirect OA-sourced extra interest back to OA.
    // (2) CPF LIFE migration (years AFTER the migration year): RA premium is now with
    //     CPF Board. Standard/Escalating: member holds no personal RA, set ra = 0.
    //     Basic: ra mirrors the depleting migRaRem retained reserve.
    //     In all cases, redirect OA-sourced bonus interest (b1ToRA/b2ToRA) to OA.
    if (rssDepletionHit) {
      oa += b1ToRA + b2ToRA; ra = 0;
    } else if (migrationActivated) {
      oa += b1ToRA + b2ToRA;
      ra = lifePlanKey === 'bas' ? Math.max(0, migRaRem) : 0;
    }

    // Outflows: housing
    const activeHousing = age < housingStop ? baseHousing * effHousingFreq : 0;
    if (activeHousing > 0) { cumHousingOA += activeHousing; yearHousingOut = activeHousing; }
    cumHousingFV = (cumHousingFV + activeHousing) * 1.025;
    oa = Math.max(0, oa - activeHousing);

    // Property sale refund
    if (sellPropertyAge > 0 && age === sellPropertyAge && !refundApplied) {
      const totalRefund = Math.round(cumHousingFV);
      oa += totalRefund; yearInflow += totalRefund; totalInjected += totalRefund; yearVoluntary += totalRefund;
      if (usePropertyPledge) {
        const yrsSince2026 = Math.max(0, (baseYear + (age - startAge)) - 2026);
        const projFRSNow   = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + rsGrowth, yrsSince2026));
        const transferToRA = Math.min(Math.max(0, projFRSNow - ra), oa);
        if (transferToRA > 0) { oa -= transferToRA; ra += transferToRA; }
      }
      currentPropValue = 0; refundApplied = true;
    }

    // Medical outflow
    const yrSince = Math.max(0, age - startAge);
    const totalMaOut = Math.round(baseMedical * Math.pow(1 + medInfl, yrSince));
    ma = Math.max(0, ma - totalMaOut); yearMedOut = totalMaOut;
    totalOutSpent += activeHousing + totalMaOut;

    // OA drawdown
    if (oaDrawdownActive && age >= oaDrawdownStartAge) {
      const actualDraw = Math.min(oaDrawdownAnnual, Math.max(0, oa - oaDrawdownFloor));
      oa = Math.max(oaDrawdownFloor, oa - actualDraw); yearOaDrawOut = actualDraw; totalOutSpent += actualDraw;
    }

    // Education loan
    if (oaEduLoanAnnual > 0) {
      const effEduFreq = oaEduLoanFreq === 'one-time' && !isFirstYear ? 0 : (oaEduLoanDur > 0 && yearIdx >= oaEduLoanDur) ? 0 : 1;
      if (effEduFreq > 0) {
        const projFRS_edu = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + rsGrowth, Math.max(0, (baseYear + (age - startAge)) - 2026)));
        if (!(age >= 55 && ra < projFRS_edu)) {
          const eduCap = Math.max(0, (oa + cumEduOut) * 0.40 - cumEduOut);
          const actualEduLoan = Math.min(oaEduLoanAnnual * effEduFreq, eduCap, oa);
          oa = Math.max(0, oa - actualEduLoan); cumEduOut += actualEduLoan; yearEduOut = actualEduLoan; totalOutSpent += actualEduLoan;
        }
      }
    }

    // Property monetisation
    if (propMonetiseEnabled && age === propMonetiseAge && !propMonetiseApplied) {
      privateAssets += propMonetiseCash;
      if (propMonetiseRaTopup > 0 && !isForeigner) { ra += propMonetiseRaTopup; cumRaCashTopUps += propMonetiseRaTopup; yearInflow += propMonetiseRaTopup; totalInjected += propMonetiseRaTopup; yearVoluntary += propMonetiseRaTopup; }
      currentPropValue = Math.max(0, currentPropValue - propMonetiseCash - propMonetiseRaTopup);
      propMonetiseApplied = true;
    }

    // Property growth
    if (!refundApplied) {
      leaseRemaining = Math.max(0, totalLease - yrSince);
      let effPropGrowth = propGrowth;
      if (isLeasehold && leaseRemaining < 60) effPropGrowth = propGrowth + Math.max(-0.05, -0.002 * (60 - leaseRemaining) / 10);
      currentPropValue = Math.max(0, currentPropValue * (1 + effPropGrowth));
    }

    // PR tenure advancement
    if (isPR && currentPrYear < 3) currentPrYear++;

    // Life events
    for (const ev of leMedicalEvents) {
      const amt = Number(ev.magnitude) || 0; if (amt <= 0) continue;
      const src = ev.drawSource || 'oa_then_private'; let actualOut = 0;
      if (src === 'oa') { const fromOA = Math.min(amt, Math.max(0, oa)); oa = Math.max(0, oa - fromOA); actualOut = fromOA; }
      else if (src === 'private') { const fromPriv = Math.min(amt, Math.max(0, privateAssets)); privateAssets = Math.max(0, privateAssets - fromPriv); actualOut = fromPriv; }
      else { const fromOA = Math.min(amt, Math.max(0, oa)); oa = Math.max(0, oa - fromOA); const rem = amt - fromOA; const fromPriv = Math.min(rem, Math.max(0, privateAssets)); privateAssets = Math.max(0, privateAssets - fromPriv); actualOut = fromOA + fromPriv; }
      yearEventsOut += actualOut; totalOutSpent += actualOut;
    }
    for (const ev of leWindfallEvents) {
      const amt = Number(ev.magnitude) || 0; if (amt <= 0) continue;
      const dest = ev.destination || 'private'; let actualCredited = 0;
      if (dest === 'private') { privateAssets += amt; actualCredited = amt; }
      else if (dest === 'oa') { const room = Math.max(0, ANNUAL_LIMIT - (yearMandatory + yearVoluntary)); const actualOA = Math.min(amt, room); oa += actualOA; yearVoluntary += actualOA; actualCredited = actualOA; }
      else if (dest === 'srs') { const actualSRS = Math.min(amt, srsCap); srsBalance += actualSRS; actualCredited = actualSRS; }
      yearEventsIn += actualCredited; yearInflow += actualCredited; totalInjected += actualCredited;
    }

    // ── CPF LIFE MIGRATION (PR-3) ─────────────────────────────────────────────
    // Fires exactly once at age === migrationAge (when configured and not yet activated).
    // After migration, the payout source switches from RSS drawdown to CPF LIFE annuity.
    // The 20% RA-to-OA transfer is applied here inside the engine (not in the external
    // raOaTransfer useMemo, which is bypassed for all RSS members via the _isRSSForTransfer
    // guard added in PR-1). This avoids double-applying the transfer.
    if (migrationAge > 0 && age === migrationAge && !migrationActivated) {
      if (ra >= 60000) {
        // Step 1: Apply 20% RA-to-OA transfer on the eligible base
        // (same formula as the main engine useMemo for CPF LIFE members)
        const migRaTransferBase = Math.max(0, ra - cumRaCashTopUps - cumRaInterest);
        const migRaOaTransfer   = Math.round(migRaTransferBase * 0.20);
        oa += migRaOaTransfer;
        ra -= migRaOaTransfer;
        // Step 2: Compute CPF LIFE payout for the chosen plan from remaining RA at current age.
        // interpolateCpfLife supports 'std', 'esc', and 'bas' — lifePlanKey selects the correct table.
        postMigrationMonthly = Math.round(interpolateCpfLife(ra, lifePlanKey, isMaleRSS));
        // Step 3: Initialise Basic Plan state — only needed when lifePlanKey === 'bas'.
        // Gated to avoid wasteful computation for Standard and Escalating migrations.
        if (lifePlanKey === 'bas') {
          const migPhase1aMonthly = postMigrationMonthly; // already 'bas' lookup above
          const migParams = computeBasicPlanParams(ra, age, migPhase1aMonthly, 10);
          migRaRem          = migParams.pv;
          migPhase1bTrigger = migParams.phase1bTrigger;
          migPhase1aAnnual  = migParams.phase1aAnnual;
          migPhase2Annual   = migParams.phase2Annual;
          migEffAnnualFactor = migParams.effAnnualFactor;
        }
        migYearsSince      = 0; // escalating plan counter starts at migration year
        migrationActivated = true;
        // RA has just become the CPF LIFE premium. Set ra immediately so the migration
        // year's data.push() records the correct post-migration RA balance, not the
        // pre-migration balance that has already had interest added.
        // Standard/Escalating: premium is pooled — member holds $0 personal RA.
        // Basic: RA_Retained reserve (migRaRem) remains accessible to the member.
        ra = lifePlanKey === 'bas' ? Math.max(0, migRaRem) : 0;
      } else {
        // RA < $60,000: CPF LIFE requires at least $60k — migration deferred/skipped.
        // Flag is set so the UI can surface this as a warning.
        migrationRaWarning = true;
      }
    }

    // ── PAYOUT DEBIT — RSS drawdown OR CPF LIFE post-migration ───────────────
    if (migrationActivated && age >= migrationAge) {
      // ── POST-MIGRATION: CPF LIFE payout — plan-specific mechanics ─────────
      // RA does NOT deplete for Standard and Escalating (pool annuity — longevity risk shared).
      // Basic plan retains a portion of RA (migRaRem) that self-funds Phase 1A/1B payouts.
      let annualLifePayout;
      if (lifePlanKey === 'esc') {
        // Escalating: 2%/yr compounding from the migration year (CPF LIFE Escalating plan)
        annualLifePayout = Math.round(postMigrationMonthly * 12 * Math.pow(1.02, migYearsSince));
        migYearsSince++;
      } else if (lifePlanKey === 'bas') {
        // Basic: two-phase payout — Phase 1A (higher), Phase 2 (lower after RA_Retained depletes)
        const { basPay, newRaRem } = computeBasicPlanYearPayout(
          age, migPhase1bTrigger, migPhase1aAnnual, migPhase2Annual, migRaRem, migEffAnnualFactor
        );
        annualLifePayout = basPay;
        migRaRem = newRaRem;
      } else {
        // Standard: fixed monthly for life (CPF Board default)
        annualLifePayout = postMigrationMonthly * 12;
      }
      rssPayoutThisYear = annualLifePayout;   // reuse field — labelled in tab as "CPF LIFE payout"
      totalOutSpent += annualLifePayout;
      // Sync ra to post-payout reality. migRaRem is freshly updated for Basic;
      // Standard/Escalating remain at 0 (defensive — the clamp above handles interest years,
      // but this ensures the payout year row is also correct).
      ra = lifePlanKey === 'bas' ? Math.max(0, migRaRem) : 0;
    } else if (rssAnnualPayout > 0 && age >= rssPayoutStart && !rssDepletionHit) {
      // ── PRE-MIGRATION (or no migration): RSS fixed drawdown from RA ──────────
      const actualPayout = Math.min(rssAnnualPayout, Math.max(0, ra));
      ra               = Math.max(0, ra - actualPayout);
      rssPayoutThisYear = actualPayout;
      totalOutSpent   += actualPayout;
      if (ra <= 0 && rssDepletionAge === null) {
        rssDepletionAge = age;
        rssDepletionHit = true;
      }
    }
    // Propagate depletion age forward — every subsequent row carries the value
    // so consumers can read it from the last row without a scan.

    data.push({
      age,
      oa: Math.round(oa), sa: Math.round(sa),
      ma: Math.round(ma), ra: Math.round(ra),
      total: Math.round(oa + sa + ma + ra),
      propertyValue: Math.round(currentPropValue),
      privateAssets: Math.round(privateAssets),
      srsBalance:    Math.round(srsBalance),
      interest:      Math.round(yearTotalInterest),
      injected:      Math.round(yearInflow),
      outflow: Math.round(yearHousingOut + yearMedOut + yearOaDrawOut + yearCpfisOut + yearEduOut + yearLovedOneOut + yearEventsOut + rssPayoutThisYear),
      cumulativeInjected:  Math.round(totalInjected),
      cumulativeInterest:  Math.round(totalInterest),
      cumulativeOutflow:   Math.round(totalOutSpent),
      cumRaCashTopUps:     Math.round(cumRaCashTopUps),
      cumRaInterest:       Math.round(cumRaInterest),
      yearMandatory:  Math.round(yearMandatory),
      yearVoluntary:  Math.round(yearVoluntary),
      yearGovGrants:  Math.round(yearGovGrants),
      yearOaInterest, yearSaRaInterest, yearMaInterest,
      yearHousingOut: Math.round(yearHousingOut),
      yearMedOut:     Math.round(yearMedOut),
      yearOaDrawOut:  Math.round(yearOaDrawOut),
      yearLovedOneOut:Math.round(yearLovedOneOut),
      yearCpfisOut:   Math.round(yearCpfisOut),
      yearEduOut:     Math.round(yearEduOut),
      yearEventsIn:   Math.round(yearEventsIn),
      yearEventsOut:  Math.round(yearEventsOut),
      yearPrivDrawOut:Math.round(yearPrivDrawOut),
      yearWisCash:    Math.round(yearWisCash),
      cumHousingFV:   Math.round(cumHousingFV),
      activeEventTypes:     activeEvents.map(e => e.type),
      activeHyperinflation: leHyperinflation ? Number(leHyperinflation.magnitude) || 0 : 0,
      // ── RSS-specific fields (ignored by CPF LIFE consumers — extra keys are harmless) ──
      rssPayoutThisYear: Math.round(rssPayoutThisYear),
      rssDepletionAge,                         // null until first depletion year; integer age thereafter
      migrationActivated,                      // false pre-migration; true from migrationAge onward
      postMigrationPayout: postMigrationMonthly, // monthly CPF LIFE payout post-migration (0 if no migration)
      migrationRaWarning,                      // true if RA was < $60k at migration age
    });
  }
  return data;
}

