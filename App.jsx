import React, { useState, useMemo, useEffect, useRef, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea,
  PieChart as RechartsPieChart, Pie as RechartsPie, Cell as RechartsCell
} from "recharts";
import {
  Calculator, TrendingUp, User, Info, ShieldCheck, PieChart,
  AlignJustify, HelpCircle, MinusCircle, Printer,
  Briefcase, Gift, Download, Loader2, FileText, BarChart2,
  AlertTriangle, Clock, CheckCircle2, Split, BookOpen, Scale,
  LayoutDashboard, RotateCcw, Activity, Bell, X,
  SlidersHorizontal, Percent, Link, Target,
  Moon, Sun, Monitor, Lightbulb, Copy, ChevronDown, ChevronUp,
  ArrowRightLeft, LogOut, Users, ExternalLink, Home, Upload
} from "lucide-react";

const TableIcon = AlignJustify;
const BarChart3 = BarChart2;
const ArrowDownToLine = Download;

// ── Config & constants ───────────────────────────────────────────────────────
import {
  CPF_RATES, RETIREMENT_SUMS_2026, ANNUAL_LIMIT, ASSUMED_TARGET_GROWTH,
  SRS_CAP_SC_PR, SRS_CAP_FOREIGNER,
  MMSS_PILOT_START_YEAR, MMSS_PILOT_END_YEAR,
  LIFE_EVENT_TYPES, DRAW_SOURCE_LABELS, WINDFALL_DEST_LABELS,
  PR_CONTRIBUTION_RATES, PR_FG_CONTRIBUTION_RATES, getPRRates,
} from './config/constants.js';

import {
  LEGAL_DISCLAIMER, DEFAULT_INPUTS, PRESET_PROFILES,
  INPUT_LABELS, SCENARIO_LABELS,
} from './config/presets.js';

// ── Engines & actuarial ──────────────────────────────────────────────────────
import {
  CPF_LIFE_TABLE_M, FEMALE_PAYOUT_MULTIPLIER,
  interpolatePhase1bTrigger, interpolatePhase2Drop,
  solveEffectiveRate, interpolateCpfLife,
  computeBasicPlanParams, computeBasicPlanYearPayout,
  computeSensitivityRow,
} from './engine/actuarial.js';
import { runProjectionEngine } from './engine/projectionEngine.js';
import { runRSSEngine }        from './engine/rssEngine.js';

// ── Utilities ────────────────────────────────────────────────────────────────
import { formatCurrency, computeXIRR, lzCompress, lzDecompress } from './utils/helpers.js';
import { generatePDF } from './utils/generatePDF.js';

// ── Custom hooks ─────────────────────────────────────────────────────────────
import { useProjection } from './hooks/useProjection.js';
import { useMilestones } from './hooks/useMilestones.js';
import { useAnalytics }  from './hooks/useAnalytics.js';

// ── Shared components ─────────────────────────────────────────────────────────
import { TooltipContext, TooltipBox, FreqToggle, ErrorBoundary } from './SharedComponents.jsx';

// ── Sidebar ───────────────────────────────────────────────────────────────────
import Sidebar from './Sidebar.jsx';

// ── Tab components ────────────────────────────────────────────────────────────
import WelcomeTab      from './tabs/WelcomeTab.jsx';
import SummaryTab      from './tabs/SummaryTab.jsx';
import AccumulationTab from './tabs/AccumulationTab.jsx';
import RSSTab          from './tabs/RSSTab.jsx';
import LifeTab         from './tabs/LifeTab.jsx';
import CompareTab      from './tabs/CompareTab.jsx';
import TableTab        from './tabs/TableTab.jsx';
import NotesTab        from './tabs/NotesTab.jsx';
import StrategyTab     from './tabs/StrategyTab.jsx';

export default function App() {
  const rootRef = useRef(null); // used for sandbox-safe downloads
  const rstuRef = useRef(null); // scroll target for gap-alert "Fix in Inflows ↗" banner
  const [inputs, setInputs] = useState({ ...DEFAULT_INPUTS });
  // Stable refs for keyboard shortcut handler — avoids stale closures in the
  // useEffect (which uses [] deps so the listener is only registered once).
  // Declared here, before activeTab useState, so activeTabRef.current = activeTab
  // on the next line is never in the Temporal Dead Zone.
  const handleShareLinkInitRef = useRef(null);
  const handleResetRef = useRef(null);
  const activeTabRef = useRef("summary");
  const isForeignerRef = useRef(false); // stable ref so keyboard nav can read current citizenship
  const cpfSchemeRef   = useRef('cpf_life'); // stable ref so keyboard nav can read current scheme

  const [activeTab, setActiveTab] = useState("summary");
  activeTabRef.current = activeTab; // keep ref current for keyboard shortcut handler
  const [highlightPlan, setHighlightPlan] = useState("standard");
  const [viewMode, setViewMode] = useState("bequest");
  const [showTooltipId, setShowTooltipId] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isRealDollars, setIsRealDollars] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [scenarioA, setScenarioA] = useState(null);
  const [scenarioB, setScenarioB] = useState(null);
  const [scenarioLabelA, setScenarioLabelA] = useState("");
  const [scenarioLabelB, setScenarioLabelB] = useState("");
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [showLifeEventMarkers, setShowLifeEventMarkers] = useState(true); // Rev #D2: default ON so events are visible immediately
  const [whatIfPayoutAge, setWhatIfPayoutAge] = useState(null);
  const [whatIfSaTopup, setWhatIfSaTopup] = useState(null);
  const [whatIfHousing, setWhatIfHousing] = useState(null);
  const [whatIfSalaryBump, setWhatIfSalaryBump] = useState(null);
  const [whatIfContribStop, setWhatIfContribStop] = useState(null);   // Rev #12
  const [whatIfOaDrawdown, setWhatIfOaDrawdown]   = useState(null);   // Rev #12
  const [whatIfSrsContrib, setWhatIfSrsContrib]   = useState(null);   // Rev #12
  const [whatIfPrivGrowth, setWhatIfPrivGrowth]   = useState(null);   // Rev #12
  const [showWhatIf, setShowWhatIf] = useState(false);
  // Payout premium percentages for CPF LIFE plans (Basic: 10-20%, Standard: 100%, Escalating: 100%)
  const [basicPremiumPct, setBasicPremiumPct] = useState(10);
  const [pdfOrientation, setPdfOrientation] = useState("portrait");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMode, setDesktopMode] = useState("auto");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  const [tableSubTab, setTableSubTab] = useState("projection");
  const [showDataTableGuide, setShowDataTableGuide] = useState(false);
  const [showWisEligibility, setShowWisEligibility] = useState(false); // WIS eligibility panel toggle — must be top-level (Rules of Hooks)
  // BUG-2 fix: Life Events panel state hoisted from IIFE to top-level useState.
  // Calling React.useState inside an IIFE embedded in JSX violates Rules of Hooks:
  // the hook call count changes when the IIFE is conditionally skipped, React's
  // identity checks break under Strict Mode double-invocation, and the state is
  // re-created from scratch on every render rather than being stable across renders.
  // Renamed with "le" prefix to avoid collision with any future same-named locals.
  const [leEditingId, setLeEditingId] = useState(null); // null = closed; 'new' = adding new
  const [leFormState, setLeFormState] = useState({});

  // Sidebar accordion — supports multiple open sections simultaneously
  // All section IDs — used for expand-all default and expandAllSections helper
  // BUG-2b fix: "lifeevents" was missing — section never opened on fresh load, was excluded
  // from Expand All, and its open/closed state was not persisted in localStorage.
  const ALL_SECTION_IDS = ["profile", "contribs", "topups", "outflows", "transfers", "property", "privateAssets", "lifeevents", "decumulation"];
  // Item 28: use localStorage (persists across tab closes) with a versioned key so
  // a future schema change can bump to 'cpf_planner_v2_sections' without reading stale data.
  const SECTIONS_STORAGE_KEY = 'cpf_planner_v1_sections';
  const [openSections, setOpenSections] = useState(() => {
    try {
      const saved = localStorage.getItem(SECTIONS_STORAGE_KEY);
      // No saved state: default to ALL sections open so the sidebar is immediately usable
      return saved ? new Set(JSON.parse(saved)) : new Set(ALL_SECTION_IDS);
    } catch { return new Set(ALL_SECTION_IDS); } // also default open on parse error
  });
  const toggleSection = (id) => setOpenSections(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    try { localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify([...next])); } catch { }
    return next;
  });
  const expandAllSections = () => {
    const all = new Set(ALL_SECTION_IDS);
    setOpenSections(all);
    try { localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(ALL_SECTION_IDS)); } catch { }
  };
  const collapseAllSections = () => {
    setOpenSections(new Set());
    try { localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify([])); } catch { }
  };

  // Welcome Modal, Share Modal & Toast State
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  // In-app export modals (sandbox-safe alternatives to download/print)
  const [exportModal, setExportModal] = useState(null); // {type:'csv'|'json'|'print'|'pdf', content:string}
  // In-app confirm dialog (replaces window.confirm which is blocked in sandbox)
  const [confirmModal, setConfirmModal] = useState(null); // {message, onConfirm}
  // RSS switch action pending — decoupled from closure to always read latest inputs
  const [rssActionPending, setRssActionPending] = useState(null); // null | 'keep' | 'reset'
  // Rev #13 — tracks the currently focused sidebar input so currency fields show raw value while editing
  const [focusedField, setFocusedField] = useState(null);

  // Theme Management
  const [themeMode, setThemeMode] = useState(() => { try { return localStorage.getItem('cpf_theme') || 'dark'; } catch { return 'dark'; } });
  const [isDark, setIsDark] = useState(true);

  // ── Debounced inputs for expensive computations ──────────────────────────
  // UI inputs update immediately; heavy projections use the debounced copy
  const [debouncedInputs, setDebouncedInputs] = useState({ ...DEFAULT_INPUTS });
  useEffect(() => {
    const t = setTimeout(() => setDebouncedInputs(inputs), 180);
    return () => clearTimeout(t);
  }, [inputs]);

  // #8 — Warn before leaving if inputs differ from last saved state
  const lastSavedRef = useRef(JSON.stringify(inputs));
  // Rev#18: savedSeq is incremented on export to trigger hasUnsaved recompute
  // (handleExportProfile stamps lastSavedRef without calling setInputs, so we
  //  need an explicit re-render trigger; all other stamp sites already call setInputs)
  const [savedSeq, setSavedSeq] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      if (JSON.stringify(inputs) !== lastSavedRef.current) {
        e.preventDefault(); e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [inputs]);

  // Rev#18: derived boolean — true whenever inputs have drifted from the last export/import/reset.
  // Recomputes on every input edit (via `inputs` dep) and immediately after export (via `savedSeq` dep).
  const hasUnsaved = useMemo(
    () => JSON.stringify(inputs) !== lastSavedRef.current,
    [inputs, savedSeq] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Input validation helpers ─────────────────────────────────────────────
  const [inputErrors, setInputErrors] = useState({});
  const validateInputs = (inp) => {
    const errs = {};
    const ca = Number(inp.currentAge) || 0;
    const pa = Number(inp.payoutAge) || 65;
    const cs = Number(inp.contributionStopAge) || 65;
    const hs = Number(inp.housingStopAge) || 55;
    if (ca < 0 || ca > 95) errs.currentAge = "Age must be 0–95";
    // D3: under-16 info note — cash top-ups locked, CPF nominations and CPFIS not yet available
    if (!errs.currentAge && ca >= 0 && ca < 16) errs.currentAge = "Members under 16 are managed by a parent or guardian. Cash top-ups to SA/MA, OA→SA, and OA→RA transfers are supported by a parent/guardian. CPF nominations require age 16+. CPFIS requires age 18+. Both are locked in this simulation.";
    // D3: age 16–17 info note — nominations OK, CPFIS still locked
    if (!errs.currentAge && ca >= 16 && ca < 18) errs.currentAge = "CPF nominations are available from age 16. CPFIS requires age 18+ and is locked in the Outflows section.";
    // A7: soft warning when current age is at or beyond payout age (no hard block)
    // RSS guard: RSS members use rssPayoutStartAge, not payoutAge — this warning is CPF LIFE-only.
    if (inp.cpfScheme !== 'rss' && !errs.currentAge && ca > 0 && ca >= pa) errs.currentAge = `Age ${ca} ≥ payout age ${pa} — CPF LIFE has likely started. Most contribution fields will have no effect.`;
    // RSS isolation: payoutAge 65–70 rule only applies to CPF LIFE members.
    // RSS members use rssPayoutStartAge instead — validated in the RSS block below.
    if (inp.cpfScheme !== 'rss' && (pa < 65 || pa > 70)) errs.payoutAge = "Payout age must be 65–70";
    // ── RSS-specific validations (additive block — does not touch any CPF LIFE check above) ──
    if (inp.cpfScheme === 'rss') {
      const rssStart = Number(inp.rssPayoutStartAge) || 65;
      const rssPay   = Number(inp.rssMonthlyPayout)  || 0;
      const rssMigr  = Number(inp.lifeMigrationAge)  || 0;
      // Fix 4a: RSS minimum age gate — must be born before 1958.
      // minRssAge = currentYear − 1958 (e.g. 2026 → 68). Members born Jan 1958 turn 68 in 2026.
      const minRssAge = (Number(inp.currentYear) || 2026) - 1958;
      if (!errs.currentAge && ca > 0 && ca < minRssAge)
        errs.currentAge = `RSS (Retirement Sum Scheme) applies to members born before 1958. Minimum valid age in ${Number(inp.currentYear) || 2026} is ${minRssAge}. Younger members should use CPF LIFE instead.`;
      if (rssStart < 55 || rssStart > 70) errs.rssPayoutStartAge = "RSS payout start age must be 55–70";
      if (!errs.rssPayoutStartAge && ca > 0 && rssStart > ca) errs.rssPayoutStartAge = "RSS payouts must have already started — enter the age when CPF Board began paying you (must be ≤ current age)";
      if (rssPay <= 0) errs.rssMonthlyPayout = "Enter your fixed monthly RSS payout amount from your CPF statement";
      if (rssMigr > 0) {
        if (rssMigr > 80) errs.lifeMigrationAge = "Migration to CPF LIFE must occur before age 80 (CPF policy deadline)";
        else if (ca > 0 && rssMigr <= ca) errs.lifeMigrationAge = "Migration age must be in the future (> current age)";
        else {
          // Soft warning: estimate RA at migration age using simple 4% growth minus RSS draw
          // This is an approximation — the engine's actual projection is authoritative.
          const currentRa  = Number(inp.saBalance) || 0;
          const annualDraw = (Number(inp.rssMonthlyPayout) || 0) * 12;
          const yearsToMigr = Math.max(0, rssMigr - (ca || 0));
          let estRaAtMigr = currentRa;
          for (let y = 0; y < yearsToMigr; y++) {
            estRaAtMigr = estRaAtMigr * (1 + CPF_RATES.RA) - annualDraw;
            if (estRaAtMigr <= 0) { estRaAtMigr = 0; break; }
          }
          if (estRaAtMigr > 0 && estRaAtMigr < 60000) {
            errs.lifeMigrationAge = `Estimated RA at age ${rssMigr} is ~${formatCurrency(Math.round(estRaAtMigr))}, below the $60,000 CPF LIFE minimum. Consider an RSTU top-up or an earlier migration age.`;
          } else if (estRaAtMigr <= 0) {
            errs.lifeMigrationAge = `RA is projected to deplete before age ${rssMigr}. Migration cannot occur after RA reaches $0.`;
          }
        }
      }
    }
    if (cs < ca) errs.contributionStopAge = "Must be ≥ current age";
    if (hs < ca) errs.housingStopAge = "Must be ≥ current age";
    const infl = Number(inp.inflationRate) || 0;
    if (infl < 0 || infl > 20) errs.inflationRate = "0–20%";
    const mInfl = Number(inp.medicalInflationRate) || 0;
    if (mInfl < 0 || mInfl > 30) errs.medicalInflationRate = "0–30%";
    // MRSS and MMSS: no longer user-entered — both auto-derived by the projection engine.
    // Engine enforces all eligibility gates (SC, age, balance, income, pilot end, lifetime cap) per year.
    // WIS: max $4,900/yr (employee cap from 2025); eligibility requires avg gross monthly income $500–$3,000
    const wis = Number(inp.wisAmount) || 0;
    if (wis < 0) errs.wisAmount = "Must be ≥ 0";
    else if (wis > 4900) errs.wisAmount = "Max $4,900/yr (employee WIS cap from 2025)";
    // W1: Salary eligibility gate — amber warning only, not a hard block
    if (wis > 0 && !errs.wisAmount) {
      const sg = Number(inp.salaryGross) || 0;
      const nti = Number(inp.netTradeIncome) || 0;
      const monthlyIncome = inp.isSelfEmployed ? (nti / 12) : sg;
      if (monthlyIncome > 3000) errs.wisAmount = `WIS eligibility: avg gross ≤ $3,000/mo (your income: ~$${Math.round(monthlyIncome).toLocaleString()}/mo). Verify at cpf.gov.sg/wis.`;
      else if (monthlyIncome > 0 && monthlyIncome < 500) errs.wisAmount = `WIS eligibility: avg gross ≥ $500/mo (unless PWD/caregiver/ComCare). Your income: ~$${Math.round(monthlyIncome).toLocaleString()}/mo.`;
    }
    // Pledge withdrawal age must be ≥ 55
    if (inp.usePropertyPledge) {
      const pwa = Number(inp.pledgeWithdrawalAge) || 55;
      if (pwa < 55) errs.pledgeWithdrawalAge = "Min age 55";
      if (pwa > 95) errs.pledgeWithdrawalAge = "Max age 95";
    }
    // CPF balances: 0 – $5,000,000
    ["oaBalance", "saBalance", "maBalance"].forEach(k => {
      const v = Number(inp[k]) || 0;
      if (v < 0 || v > 5000000) errs[k] = "0 – $5,000,000";
    });
    // NTI
    const nti = Number(inp.netTradeIncome) || 0;
    if (nti < 0 || nti > 2000000) errs.netTradeIncome = "0 – $2,000,000";
    // Annual contributions: 0 – $100,000
    ["empOaCont", "empSaCont", "empMaCont"].forEach(k => {
      const v = Number(inp[k]) || 0;
      if (v < 0 || v > 100000) errs[k] = "0 – $100,000/yr";
    });
    // Salary: 0 – $50,000/mo
    const sg = Number(inp.salaryGross) || 0;
    if (sg < 0 || sg > 50000) errs.salaryGross = "0 – $50,000/mo";
    // A6: PR Year 1/2 engine derives contributions from salary — warn if salary is 0
    // so the user knows why the projection shows zero mandatory contributions.
    if (!errs.salaryGross
        && (inp.citizenStatus || 'SC') === 'PR'
        && (Number(inp.prYear) || 3) < 3
        && !inp.isSelfEmployed
        && sg === 0) {
      const prYrLabel = (Number(inp.prYear) || 1);
      const totalPct  = prYrLabel === 1 ? '9%' : '~24%';
      const rateType  = (inp.prRateType || 'GG') === 'FG' ? 'F/G (Full ER)' : 'G/G (Graduated)';
      errs.salaryGross = `PR Year ${prYrLabel} ${rateType}: contributions are computed from your salary (${totalPct} total). Enter your monthly gross then click ⚡ Auto-Calc — otherwise the engine projects zero mandatory contributions.`;
    }
    // B1: Foreigner — zero out effect warning. Salary, contributions and voluntary
    // top-up fields have no effect because the engine gates all CPF flows for foreigners.
    if ((inp.citizenStatus || 'SC') === 'foreigner') {
      if (!errs.salaryGross && ((Number(inp.salaryGross) || 0) > 0 || (Number(inp.empOaCont) || 0) > 0))
        errs.salaryGross = "Foreigners are not subject to mandatory CPF contributions — salary and contribution fields have no effect on the CPF projection. Only SRS and private assets are modelled.";
      if ((Number(inp.vcSaTopup) || 0) > 0 || (Number(inp.vc3aCash) || 0) > 0 || (Number(inp.vcMaCash) || 0) > 0)
        errs.vc3aCash = "Foreigners cannot make voluntary CPF top-ups — VC3A, RSTU, and VCMA fields have no effect on the projection.";
    }
    const sb = Number(inp.salaryBonus) || 0;
    if (sb < 0 || sb > 2000000) errs.salaryBonus = "0 – $2,000,000";
    // Growth rates: -50% to 50%
    const sgr = Number(inp.salaryGrowthRate) || 0;
    if (sgr < -50 || sgr > 50) errs.salaryGrowthRate = "-50% to 50%";
    // Rev #22: phased salary validation
    const phaseAge = inp.salaryPhaseAge !== "" && inp.salaryPhaseAge != null ? Number(inp.salaryPhaseAge) : null;
    const sgr2 = Number(inp.salaryGrowthRate2) || 0;
    if (phaseAge !== null) {
      if (isNaN(phaseAge) || phaseAge < ca || phaseAge > 95) errs.salaryPhaseAge = `Must be ${ca}–95`;
      if (sgr2 < -50 || sgr2 > 50) errs.salaryGrowthRate2 = "-50% to 50%";
    }
    // Rev #22: career break validation
    const cbStart = inp.careerBreakStartAge !== "" && inp.careerBreakStartAge != null ? Number(inp.careerBreakStartAge) : null;
    const cbEnd   = inp.careerBreakEndAge   !== "" && inp.careerBreakEndAge   != null ? Number(inp.careerBreakEndAge)   : null;
    if (cbStart !== null) {
      if (isNaN(cbStart) || cbStart < ca || cbStart > 95) errs.careerBreakStartAge = `Must be ${ca}–95`;
    }
    if (cbEnd !== null) {
      if (isNaN(cbEnd) || cbEnd > 95) errs.careerBreakEndAge = "Must be ≤ 95";
      else if (cbStart !== null && cbEnd < cbStart) errs.careerBreakEndAge = "Must be ≥ break start age";
      else if (cbEnd < ca) errs.careerBreakEndAge = `Must be ≥ current age (${ca})`;
    }
    if (cbStart !== null && cbEnd === null) errs.careerBreakEndAge = "Enter a break end age";
    if (cbEnd !== null && cbStart === null) errs.careerBreakStartAge = "Enter a break start age";
    // Rev #D2: Life event validation
    const lifeEvs = Array.isArray(inp.lifeEvents) ? inp.lifeEvents : [];
    const leErrs = [];
    lifeEvs.forEach((ev, idx) => {
      const evErrs = {};
      const sa = Number(ev.startAge);
      const ea = Number(ev.endAge);
      const mag = Number(ev.magnitude);
      const isPoint = ev.type === 'windfall' || ev.type === 'early_retirement';
      if (!ev.type) evErrs.type = "Select an event type";
      if (isNaN(sa) || sa < ca || sa > 95) evErrs.startAge = `Must be ${ca}–95`;
      if (!isPoint) {
        if (isNaN(ea) || ea < sa) evErrs.endAge = "Must be ≥ start age";
        if (ea > 95) evErrs.endAge = "Must be ≤ 95";
      }
      if (isNaN(mag) || mag <= 0) evErrs.magnitude = "Must be > 0";
      if (ev.type === 'hyperinflation' && mag > 50) evErrs.magnitude = "Max 50%";
      // Overlap check: same type, overlapping age range, both enabled
      lifeEvs.forEach((other, otherIdx) => {
        if (otherIdx === idx || other.type !== ev.type || other.enabled === false || ev.enabled === false) return;
        const oStart = Number(other.startAge), oEnd = Number(other.endAge);
        if (sa <= oEnd && ea >= oStart) evErrs.startAge = (evErrs.startAge ? evErrs.startAge + "; " : "") + "Overlaps another event of the same type";
      });
      if (Object.keys(evErrs).length > 0) leErrs.push({ idx, ...evErrs });
    });
    if (leErrs.length > 0) errs.lifeEvents = leErrs;
    // Rev #5: Retirement sum growth rate — valid range 0–10%; warn outside 0–6%
    const rsg = Number(inp.retirementSumGrowth);
    if (!isNaN(rsg) && (rsg < 0 || rsg > 10)) errs.retirementSumGrowth = "0% to 10%";
    else if (!isNaN(rsg) && rsg > 6) errs.retirementSumGrowth = "Above 6% is aggressive — CPF Board historical average is ~3%";
    // Property value: 0 – $50,000,000
    const sPA = Number(inp.sellPropertyAge) || 0;
    if (sPA > 0 && (sPA < (Number(inp.currentAge) || 35) || sPA > 95)) errs.sellPropertyAge = `Must be ${Number(inp.currentAge) || 35}–95`;
    const pv = Number(inp.propertyValue) || 0;
    if (pv < 0 || pv > 50000000) errs.propertyValue = "0 – $50M";
    const pgr = Number(inp.propertyGrowthRate) || 0;
    if (pgr < -20 || pgr > 30) errs.propertyGrowthRate = "-20% to 30%";
    // Housing outflow: 0 – $200,000/yr
    const ho = Number(inp.housingOutflow) || 0;
    if (ho < 0 || ho > 200000) errs.housingOutflow = "0 – $200,000/yr";
    // Medical: 0 – $100,000/yr
    ["medicalUsage", "medishieldIP", "elderCareShield"].forEach(k => {
      const v = Number(inp[k]) || 0;
      if (v < 0 || v > 100000) errs[k] = "0 – $100,000/yr";
    });
    // CPFIS OA tranche: only OA savings above $20,000 are investible; requires age 18+
    const cpfisOaVal = Number(inp.cpfisOaAmount) || 0;
    if (cpfisOaVal < 0) errs.cpfisOaAmount = "Must be ≥ 0";
    if (cpfisOaVal > 0) {
      if ((Number(inp.currentAge) || 0) < 18) {
        errs.cpfisOaAmount = "CPFIS requires age 18+";
      } else {
        const cpfisOaBal = Number(inp.oaBalance) || 0;
        const cpfisOaInvestible = Math.max(0, cpfisOaBal - 20000);
        if (cpfisOaBal <= 20000) {
          errs.cpfisOaAmount = `OA must exceed $20,000 before investing. Current OA: ${formatCurrency(cpfisOaBal)}.`;
        } else if (cpfisOaVal > cpfisOaInvestible) {
          errs.cpfisOaAmount = `Max investible from OA is $${cpfisOaInvestible.toLocaleString()} (OA − $20k reserve). Engine auto-caps.`;
        }
      }
    }
    // CPFIS SA tranche: only SA savings above $40,000 are investible; SA is only available pre-55; requires age 18+
    const cpfisSaVal = Number(inp.cpfisSaAmount) || 0;
    if (cpfisSaVal < 0) errs.cpfisSaAmount = "Must be ≥ 0";
    if (cpfisSaVal > 0) {
      const ca_cpfis = Number(inp.currentAge) || 0;
      if (ca_cpfis < 18) {
        errs.cpfisSaAmount = "CPFIS requires age 18+";
      } else if (ca_cpfis >= 55) {
        errs.cpfisSaAmount = "SA is closed at 55 — SA CPFIS not available at age 55+.";
      } else {
        const cpfisSaBal = Number(inp.saBalance) || 0;
        const cpfisSaInvestible = Math.max(0, cpfisSaBal - 40000);
        if (cpfisSaBal <= 40000) {
          errs.cpfisSaAmount = `SA must exceed $40,000 before investing. Current SA: ${formatCurrency(cpfisSaBal)}.`;
        } else if (cpfisSaVal > cpfisSaInvestible) {
          errs.cpfisSaAmount = `Max investible from SA is $${cpfisSaInvestible.toLocaleString()} (SA − $40k reserve). Engine auto-caps.`;
        }
      }
    }
    // D1: OA Education Loan validation
    const oaEduLoanVal = Number(inp.oaEduLoan) || 0;
    if (oaEduLoanVal < 0) {
      errs.oaEduLoan = "Must be ≥ 0";
    } else if (oaEduLoanVal > 0) {
      const oaBal = Number(inp.oaBalance) || 0;
      // BUG-21 fix: engine uses cumulative formula (oa + cumEduOut) * 0.40 − cumEduOut, so the cap
      // grows as prior education withdrawals accumulate. The sidebar check uses oaBal * 0.40 (first-year
      // cap, cumEduOut = 0). Warning is conservative — engine may allow more in later projection years.
      const eduCap40 = Math.max(0, oaBal * 0.40);
      if (oaBal === 0) {
        errs.oaEduLoan = "OA balance is $0 — no funds available for education loan";
      } else if (oaEduLoanVal > oaBal) {
        errs.oaEduLoan = `Exceeds current OA balance ($${oaBal.toLocaleString()}). Engine will cap to available OA.`;
      } else if (oaEduLoanVal > eduCap40) {
        errs.oaEduLoan = `Exceeds initial 40% OA cap ($${Math.round(eduCap40).toLocaleString()}). Engine applies cumulative formula — cap may be higher in later years.`;
      }
    }
    // Minor age gate: cash top-ups require the initiator to be age 16+ (CPF policy)
    const _under16 = (Number(inp.currentAge) || 0) < 16;
    // VC3A: 0 – Annual Limit, reduced by mandatory contributions already in use.
    // Bug fix: previously validated against hardcoded $37,740; a user with $35k in mandatory
    // contributions could enter $5,000 VC3A with no warning, even though combined total
    // exceeded the Annual Limit. Engine silently caps it — now the UI warns correctly.
    const vc3a = Number(inp.vc3aCash) || 0;
    const _isSepForVC = !!inp.isSelfEmployed;
    const _mandatoryVC = _isSepForVC
      ? (Number(inp.empMaCont) || 0)                                           // SEP: only mandatory MA counts
      : (Number(inp.empOaCont) || 0) + (Number(inp.empSaCont) || 0) + (Number(inp.empMaCont) || 0);
    const _maxVC3A = Math.max(0, ANNUAL_LIMIT - _mandatoryVC);
    if (_under16 && vc3a > 0) errs.vc3aCash = "Cash top-ups require age 16+. A parent/guardian may action this on the member's behalf.";
    else if (vc3a < 0 || vc3a > ANNUAL_LIMIT) errs.vc3aCash = `0 – $${ANNUAL_LIMIT.toLocaleString()} (Annual Limit)`;
    else if (!errs.vc3aCash && vc3a > _maxVC3A && _maxVC3A < ANNUAL_LIMIT)
      errs.vc3aCash = `Exceeds available Annual Limit room ($${_maxVC3A.toLocaleString()}) after mandatory contributions of $${_mandatoryVC.toLocaleString()}. Engine will scale down.`;
    // RSTU SA top-up: 0 – current projected ERS (BUG-B fix: was hardcoded $500,000 which exceeds legal ERS ceiling)
    const rstu = Number(inp.vcSaTopup) || 0;
    const _rstuYearsFrom2026 = Math.max(0, (Number(inp.currentYear) || 2026) - 2026);
    const _ersForRstu = Math.round(RETIREMENT_SUMS_2026.ERS * Math.pow(1 + (Number(inp.retirementSumGrowth)||3)/100, _rstuYearsFrom2026));
    if (_under16 && rstu > 0) errs.vcSaTopup = "Cash top-ups require age 16+. A parent/guardian may action this on the member's behalf.";
    else if (rstu < 0 || rstu > _ersForRstu) errs.vcSaTopup = `0 – $${_ersForRstu.toLocaleString()} (current ERS ceiling)`;
    // Cash MA top-up validation
    const vcMaCashVal = Number(inp.vcMaCash) || 0;
    if (_under16 && vcMaCashVal > 0) {
      errs.vcMaCash = "Cash top-ups require age 16+. A parent/guardian may action this on the member's behalf.";
    } else if (vcMaCashVal < 0) { errs.vcMaCash = "Must be ≥ 0"; }
    if (!errs.vcMaCash && vcMaCashVal > 0) {
      const bhsForMa = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + (Number(inp.retirementSumGrowth)||3)/100, Math.max(0, (Number(inp.currentYear)||2026) - 2026)));
      const maHead = Math.max(0, bhsForMa - (Number(inp.maBalance)||0));
      if (vcMaCashVal > maHead) errs.vcMaCash = `Exceeds BHS headroom ($${maHead.toLocaleString()}). Engine auto-caps.`;
    }
    // OA transfers: negative not allowed
    const oaToSa = Number(inp.oaToSaTransfer) || 0;
    if (oaToSa < 0) errs.oaToSaTransfer = "Must be ≥ 0";
    // Warn if OA balance is zero — transfers will have no effect
    const currentOaBal = Number(inp.oaBalance) || 0;
    if (currentOaBal === 0 && oaToSa > 0) {
      errs.oaToSaTransfer = "OA balance is $0 — transfer has no effect until OA accumulates funds";
    } else if (oaToSa > 0 && oaToSa > currentOaBal) {
      errs.oaToSaTransfer = `Exceeds current OA balance ($${currentOaBal.toLocaleString()}). Engine will transfer up to available OA each year.`;
    }
    const yearsFromBaseVal = Math.max(0, (Number(inp.currentYear) || 2026) - 2026);
    const currentAge_v = Number(inp.currentAge) || 0;
    const isOaToSaForLovedOne = inp.oaToSaForLovedOne === true;
    // FRS/ERS headroom checks only apply for Self (not Loved One — their account isn't tracked here).
    // N2 fix: guard with !errs.oaToSaTransfer so an OA balance error set above is never silently
    // overwritten by a FRS/ERS headroom message (OA balance is the more actionable constraint).
    if (!isOaToSaForLovedOne && !errs.oaToSaTransfer) {
      if (currentAge_v < 55) {
        const frsNowVal = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + (Number(inp.retirementSumGrowth)||3)/100, yearsFromBaseVal));
        const saRoomNow = Math.max(0, frsNowVal - (Number(inp.saBalance) || 0));
        if (oaToSa > 0 && oaToSa > saRoomNow) errs.oaToSaTransfer = `Exceeds FRS headroom in your SA ($${saRoomNow.toLocaleString()}). Engine auto-caps.`;
      } else {
        const ersNowVal = Math.round(RETIREMENT_SUMS_2026.ERS * Math.pow(1 + (Number(inp.retirementSumGrowth)||3)/100, yearsFromBaseVal));
        const raRoomNow = Math.max(0, ersNowVal - (Number(inp.saBalance) || 0));
        if (oaToSa > 0 && oaToSa > raRoomNow) errs.oaToSaTransfer = `Exceeds ERS headroom in your RA ($${raRoomNow.toLocaleString()}). Engine auto-caps.`;
      }
    }
    const oaToMa = Number(inp.oaToMaTransfer) || 0;
    if (oaToMa < 0) errs.oaToMaTransfer = "Must be ≥ 0";
    // OA→MA: CPF policy requires age 55+ for both self and loved one
    if (oaToMa > 0 && currentAge_v < 55) {
      errs.oaToMaTransfer = "OA→MA requires age 55+ (CPF policy). Engine will not apply this transfer until age 55.";
    } else if (oaToMa > 0 && currentAge_v >= 55) {
      // Check FRS or BRS+property condition
      const frsNow55 = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + (Number(inp.retirementSumGrowth)||3)/100, yearsFromBaseVal));
      const brsNow55 = Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1 + (Number(inp.retirementSumGrowth)||3)/100, yearsFromBaseVal));
      const raBalNow = Number(inp.saBalance) || 0; // saBalance holds RA post-55
      const hasProperty = (Number(inp.propertyValue) || 0) > 0;
      if (raBalNow < brsNow55) {
        errs.oaToMaTransfer = `RA ($${raBalNow.toLocaleString()}) is below BRS ($${brsNow55.toLocaleString()}). Must meet FRS or BRS with property to transfer OA→MA.`;
      } else if (raBalNow < frsNow55 && !hasProperty) {
        errs.oaToMaTransfer = `RA ($${raBalNow.toLocaleString()}) is below FRS ($${frsNow55.toLocaleString()}). Must own a property (BRS+property) or meet FRS to transfer OA→MA.`;
      }
      // OA balance sufficiency check (mirrors A2 fix for OA→SA)
      if (currentOaBal === 0) errs.oaToMaTransfer = "OA balance is $0 — transfer has no effect until OA accumulates funds";
      else if (!errs.oaToMaTransfer && oaToMa > currentOaBal && currentOaBal > 0) errs.oaToMaTransfer = `Exceeds current OA balance ($${currentOaBal.toLocaleString()}). Engine will transfer up to available OA each year.`;
      // BHS headroom check (only relevant for self transfer)
      if (!errs.oaToMaTransfer && !(inp.oaToMaForLovedOne)) {
        const bhsNowVal = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + (Number(inp.retirementSumGrowth)||3)/100, Math.max(0, (Number(inp.currentYear) || 2026) - 2026)));
        const maRoomNow = Math.max(0, bhsNowVal - (Number(inp.maBalance) || 0));
        if (oaToMa > maRoomNow) errs.oaToMaTransfer = `Exceeds BHS headroom ($${maRoomNow.toLocaleString()}/yr). Engine auto-caps.`;
      }
    }
    // Contrib stop and housing stop age bounds
    if (cs > 95) errs.contributionStopAge = "Must be ≤ 95";
    if (hs > 95) errs.housingStopAge = "Must be ≤ 95";
    // OA Drawdown validation
    const oaDrawStart = Number(inp.oaDrawdownStartAge) || 0;
    const pa2 = Number(inp.payoutAge) || 65;
    if (oaDrawStart > 0 && oaDrawStart < pa2) errs.oaDrawdownStartAge = `Must be ≥ payout age (${pa2})`;
    if (oaDrawStart > 95) errs.oaDrawdownStartAge = "Must be ≤ 95";
    const oaDrawAmt = Number(inp.oaDrawdownMonthly) || 0;
    if (oaDrawAmt < 0 || oaDrawAmt > 50000) errs.oaDrawdownMonthly = "0 – $50,000/mo";
    const oaFloor = Number(inp.oaDrawdownFloor) || 0;
    if (oaFloor < 0 || oaFloor > 5000000) errs.oaDrawdownFloor = "0 – $5,000,000";
    // NX2 fix: warn if annual lump-sum withdrawal and monthly drawdown are both active — they stack
    if ((Number(inp.oaWithdrawalAt55) || 0) > 0 && inp.oaWithdrawalFreq === 'annual'
        && (Number(inp.oaDrawdownMonthly) || 0) > 0 && !inp.dieWithZeroEnabled) {
      errs.oaWithdrawalAt55 = 'Annual OA withdrawal + monthly drawdown both active — these stack and may deplete OA faster than intended.';
    }
    // Die with Zero age validation
    if (inp.dieWithZeroEnabled) {
      const dwzA = Number(inp.dieWithZeroAge) || 85;
      // Q3 fix: for RSS members the drawdown window starts at currentAge, not payoutAge.
      // Comparing dwzA against payoutAge (65) for a 68-year-old always passes silently
      // while the engine uses the wrong reference — no error shown, DWZ does nothing.
      const isRSSdwz = inp.cpfScheme === 'rss';
      const dwzFloor = isRSSdwz
        ? (Number(inp.currentAge) || 68)   // RSS: must be after current age
        : (Number(inp.payoutAge) || 65);   // LIFE: must be after payout age
      if (dwzA <= dwzFloor) errs.dieWithZeroAge = isRSSdwz
        ? `Must be after current age (${dwzFloor})`
        : `Must be after payout age (${dwzFloor})`;
      else if (dwzA > 95) errs.dieWithZeroAge = "Must be ≤ 95";
    }
    // Property Monetisation validation — Q1: LBS and SHB are HDB/CPF schemes, SC/PR only; foreigners cannot use them
    if (inp.propMonetiseEnabled && (inp.citizenStatus || 'SC') !== 'foreigner') {
      const pmScheme = inp.propMonetiseScheme ?? 'downgrade';
      const pmAge = Number(inp.propMonetiseAge) || 65;
      const ca3 = Number(inp.currentAge) || 35;
      if (pmAge < ca3 || pmAge > 95) errs.propMonetiseAge = `${ca3}–95`;
      // LBS-specific: CPF Board minimum entry age is 65
      if (pmScheme === 'lbs' && !errs.propMonetiseAge && pmAge < 65) errs.propMonetiseAge = "LBS requires age 65+ (CPF Board eligibility)";
      const pmCash = Number(inp.propMonetiseCashProceeds) || 0;
      if (pmCash < 0 || pmCash > 10000000) errs.propMonetiseCashProceeds = "0 – $10M";
      const pmRA = Number(inp.propMonetiseRaTopup) || 0;
      if (pmRA < 0 || pmRA > 2000000) errs.propMonetiseRaTopup = "0 – $2,000,000";
      // LBS-specific: HDB pays annuity premium into RA; total RA cannot exceed ERS
      if (pmScheme === 'lbs' && !errs.propMonetiseRaTopup && pmRA > 440800) errs.propMonetiseRaTopup = "LBS RA top-up capped at ERS ($440,800)";
      // SHB-specific: bonus is $30k (3-room or smaller) or $15k (2-room Flexi); soft warn if suspiciously high
      if (pmScheme === 'shb' && !errs.propMonetiseRaTopup && pmRA > 90000) errs.propMonetiseRaTopup = "SHB RA bonus cap is $30,000–$90,000 depending on flat type — verify with CPF Board";
    }
    // SRS validation
    const srsCap = (inp.citizenStatus === 'foreigner') ? SRS_CAP_FOREIGNER : SRS_CAP_SC_PR; // P2 fix: use module constants
    const srsContrib = Number(inp.srsAnnualContribution) || 0;
    if (srsContrib < 0 || srsContrib > srsCap) errs.srsAnnualContribution = `Max $${srsCap.toLocaleString()}/yr`;
    const srsBal = Number(inp.srsBalance) || 0;
    if (srsBal < 0 || srsBal > 5000000) errs.srsBalance = "0 – $5,000,000";
    const srsRate = Number(inp.srsReturnRate) || 0;
    if (srsRate < 0 || srsRate > 30) errs.srsReturnRate = "0–30%";
    const srsStop = Number(inp.srsContribStopAge) || 63;
    if (srsStop < (Number(inp.currentAge) || 35) || srsStop > 95) errs.srsContribStopAge = `${Number(inp.currentAge) || 35}–95`;
    const srsDraw = Number(inp.srsDrawdownStartAge) || 63;
    if (srsDraw < 63 || srsDraw > 95) errs.srsDrawdownStartAge = "Min age 63 (statutory retirement age)";
    // BUG-17 fix: cross-field check — contributions must stop before or at drawdown start
    if (!errs.srsContribStopAge && !errs.srsDrawdownStartAge && srsStop > srsDraw) {
      errs.srsContribStopAge = `Must be ≤ drawdown start age (${srsDraw}). SRS contributions cannot run past the drawdown start.`;
    }
    const srsYrs = Number(inp.srsDrawdownYears) || 10;
    if (srsYrs < 1 || srsYrs > 10) errs.srsDrawdownYears = "1–10 years";
    setInputErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    // Parse state from URL on mount
    try {
      const params = new URLSearchParams(window.location.search);
      const pParam = params.get('p');      // New full-profile share link
      const sParam = params.get('s');      // Legacy compressed format
      const stateParam = params.get('state'); // Legacy plain format
      if (pParam) {
        // New format: full state encoded via lzCompress (LZ77 or legacy base64url)
        const fullState = JSON.parse(lzDecompress(pParam));
        if (fullState.inputs) {
          // Whitelist only known keys from DEFAULT_INPUTS to prevent injection
          const safeInputs = {};
          Object.keys(DEFAULT_INPUTS).forEach(k => {
            if (fullState.inputs[k] !== undefined) safeInputs[k] = fullState.inputs[k];
          });
          const mergedInputs = { ...DEFAULT_INPUTS, ...safeInputs };
          setInputs(mergedInputs);
          // R1 fix: stamp lastSavedRef with the merged object so the beforeunload
          // "unsaved changes" guard doesn't fire on every navigation after a share-link load.
          // setInputs() is async — inputs won't reflect the new value until next render —
          // so we must use the locally-built mergedInputs, not the stale inputs state.
          lastSavedRef.current = JSON.stringify(mergedInputs);
        }
        if (fullState.activeTab) setActiveTab(fullState.activeTab);
        if (fullState.highlightPlan) setHighlightPlan(fullState.highlightPlan);
        if (fullState.viewMode) setViewMode(fullState.viewMode);
        if (fullState.basicPremiumPct != null) setBasicPremiumPct(fullState.basicPremiumPct);
        if (fullState.scenarioLabelA != null) setScenarioLabelA(fullState.scenarioLabelA);
        if (fullState.scenarioLabelB != null) setScenarioLabelB(fullState.scenarioLabelB);
        if (fullState.whatIfPayoutAge != null) setWhatIfPayoutAge(fullState.whatIfPayoutAge);
        if (fullState.whatIfSaTopup != null) setWhatIfSaTopup(fullState.whatIfSaTopup);
        if (fullState.whatIfHousing != null) setWhatIfHousing(fullState.whatIfHousing);
        if (fullState.whatIfSalaryBump != null) setWhatIfSalaryBump(fullState.whatIfSalaryBump);
        if (fullState.whatIfContribStop != null) setWhatIfContribStop(fullState.whatIfContribStop);
        if (fullState.whatIfOaDrawdown != null) setWhatIfOaDrawdown(fullState.whatIfOaDrawdown);
        if (fullState.whatIfSrsContrib != null) setWhatIfSrsContrib(fullState.whatIfSrsContrib);
        if (fullState.whatIfPrivGrowth != null) setWhatIfPrivGrowth(fullState.whatIfPrivGrowth);
        if (fullState.showWhatIf != null) setShowWhatIf(fullState.showWhatIf);
        if (fullState.isRealDollars != null) setIsRealDollars(fullState.isRealDollars);
        if (fullState.pdfOrientation) setPdfOrientation(fullState.pdfOrientation);
        // Fix 3 + Fix 4: Scenario slot restoration from share link.
        //
        // Three cases per slot:
        //   A) scenarioAInputs key present + is object  → reconstruct projection from inputs (Fix 3)
        //   B) scenarioAInputs key present + is null    → no scenario saved; clear slot (Fix 4)
        //   C) scenarioAInputs key absent               → old share link; leave existing slot untouched (Fix 4)
        //
        // runProjectionEngine is module-level — safe to call synchronously here.
        // payoutProj set to null; getNetWorth fallback path handles it correctly.
        let shareLinkScenariosRestored = false;
        if ('scenarioAInputs' in fullState) {
          if (fullState.scenarioAInputs && typeof fullState.scenarioAInputs === 'object') {
            const safeScenA = { ...DEFAULT_INPUTS };
            Object.keys(DEFAULT_INPUTS).forEach(k => { if (fullState.scenarioAInputs[k] !== undefined) safeScenA[k] = fullState.scenarioAInputs[k]; });
            setScenarioA({ inputs: safeScenA, projection: runProjectionEngine(safeScenA), payoutProj: null });
            shareLinkScenariosRestored = true;
          } else {
            setScenarioA(null); // explicit null → no scenario in this share link
          }
        }
        // else: key absent → leave existing slot untouched
        if ('scenarioBInputs' in fullState) {
          if (fullState.scenarioBInputs && typeof fullState.scenarioBInputs === 'object') {
            const safeScenB = { ...DEFAULT_INPUTS };
            Object.keys(DEFAULT_INPUTS).forEach(k => { if (fullState.scenarioBInputs[k] !== undefined) safeScenB[k] = fullState.scenarioBInputs[k]; });
            setScenarioB({ inputs: safeScenB, projection: runProjectionEngine(safeScenB), payoutProj: null });
            shareLinkScenariosRestored = true;
          } else {
            setScenarioB(null);
          }
        }
        // Backward compat: very old share links that carried full scenarioA/B objects directly
        // (pre-Fix 2, appVersion V4-2026). Only act if new scenarioAInputs key is absent.
        if (!('scenarioAInputs' in fullState) && fullState.appVersion === "V4-2026" && fullState.scenarioA) {
          setScenarioA(fullState.scenarioA);
        }
        if (!('scenarioBInputs' in fullState) && fullState.appVersion === "V4-2026" && fullState.scenarioB) {
          setScenarioB(fullState.scenarioB);
        }
        showToast(shareLinkScenariosRestored
          ? "✓ Profile loaded — Compare scenarios restored (projections recalculated)"
          : "✓ Profile loaded from share link");
        // Clean URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
      } else if (sParam) {
        // Legacy compressed base64url format — lzDecompress handles both old and new encoding
        const decoded = JSON.parse(lzDecompress(sParam));
        // Whitelist only known keys from DEFAULT_INPUTS to prevent unknown key injection
        const safeDecoded = {};
        Object.keys(DEFAULT_INPUTS).forEach(k => { if (decoded[k] !== undefined) safeDecoded[k] = decoded[k]; });
        const mergedLegacy = { ...DEFAULT_INPUTS, ...safeDecoded };
        setInputs(mergedLegacy);
        // R1 fix: stamp lastSavedRef so the beforeunload guard doesn't fire after a legacy share-link load.
        lastSavedRef.current = JSON.stringify(mergedLegacy);
      } else if (stateParam) {
        // Legacy plain format
        const decoded = JSON.parse(decodeURIComponent(stateParam));
        // Whitelist only known keys from DEFAULT_INPUTS to prevent unknown key injection
        const safeDecoded = {};
        Object.keys(DEFAULT_INPUTS).forEach(k => { if (decoded[k] !== undefined) safeDecoded[k] = decoded[k]; });
        const mergedPlain = { ...DEFAULT_INPUTS, ...safeDecoded };
        setInputs(mergedPlain);
        // R1 fix: stamp lastSavedRef so the beforeunload guard doesn't fire after a legacy plain share-link load.
        lastSavedRef.current = JSON.stringify(mergedPlain);
      } else {
        // Always show welcome modal on fresh load
        setShowWelcome(true);
      }
    } catch (e) {
      console.error("Failed to parse URL state");
    }
  }, []);

  const closeWelcome = () => {
    setShowWelcome(false);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (themeMode === 'system') setIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);

    if (themeMode === 'system') {
      setIsDark(mediaQuery.matches);
    } else {
      setIsDark(themeMode === 'dark');
    }
    try { localStorage.setItem('cpf_theme', themeMode); } catch { }
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  useEffect(() => {
    setSaveStatus("Saving...");
    const t = setTimeout(() => setSaveStatus("Saved"), 600);
    return () => clearTimeout(t);
  }, [inputs]);

  // Dismiss any open tooltip when clicking outside
  useEffect(() => {
    const dismiss = () => setShowTooltipId(null);
    document.addEventListener('click', dismiss);
    document.addEventListener('touchstart', dismiss, { passive: true });
    return () => {
      document.removeEventListener('click', dismiss);
      document.removeEventListener('touchstart', dismiss);
    };
  }, []);

  // iOS Safari keyboard dismiss fix — directly update root div height when keyboard closes
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let ticking = false;
    const onResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const h = vv.height + 'px';
        // Set CSS variable (for any CSS rules using it)
        document.documentElement.style.setProperty('--viewport-height', h);
        // Directly set the root div height — bypasses any inline style specificity
        if (rootRef.current) rootRef.current.style.height = h;
        ticking = false;
      });
    };
    // Set immediately on mount
    onResize();
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  // Keyboard Shortcuts — registered once ([] deps). All mutable values are read
  // through stable refs so the handler always uses current state/functions.
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleShareLinkInitRef.current?.();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleResetRef.current?.();
      } else if (e.ctrlKey && e.key === ']') {
        e.preventDefault();
        const tabs = ["summary", "strategy", "accumulation", ...(cpfSchemeRef.current === 'rss' ? ["rss"] : isForeignerRef.current ? [] : ["life"]), "compare", "table", "notes"];
        const idx = tabs.indexOf(activeTabRef.current);
        setActiveTab(tabs[(idx + 1) % tabs.length]);
      } else if (e.ctrlKey && e.key === '[') {
        e.preventDefault();
        const tabs = ["summary", "strategy", "accumulation", ...(cpfSchemeRef.current === 'rss' ? ["rss"] : isForeignerRef.current ? [] : ["life"]), "compare", "table", "notes"];
        const idx = tabs.indexOf(activeTabRef.current);
        setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const is55Plus     = (Number(inputs.currentAge) || 0) >= 55;
  const isUnder16    = (Number(inputs.currentAge) || 0) < 16;   // CPF minor gate: cash top-ups require age 16+
  const isSelfEmployed = inputs.isSelfEmployed === true;
  // BUG-NEW-1 fix: isForeigner must be declared at component scope so JSX references in the
  // LIFE tab (line ~8140) and elsewhere resolve correctly. Previously only existed inside a
  // local IIFE (line ~6994) and inside runProjectionEngine — both out of component render scope.
  // Accessing an undeclared identifier in JSX throws ReferenceError, crashing the LIFE tab
  // for every user who navigates to it. reads live `inputs` (not debounced) — intentional,
  // as this gates UI display only, not projection computation.
  const isForeigner  = (inputs.citizenStatus || 'SC') === 'foreigner';
  isForeignerRef.current = isForeigner; // keep ref current for keyboard shortcut handler
  cpfSchemeRef.current   = inputs.cpfScheme || 'cpf_life'; // keep ref current for keyboard shortcut handler

  // Rev #13 — Currency fields that display as $X,XXX when not focused.
  // Excludes: age fields, rate/% fields, duration (Dur) fields, year fields, boolean fields.
  const CURRENCY_FIELDS = new Set([
    'oaBalance','saBalance','maBalance',
    'salaryGross','salaryBonus','netTradeIncome',
    'empOaCont','empSaCont','empMaCont',
    'housingOutflow','medicalUsage','medishieldIP','elderCareShield',
    'propertyValue',
    'vc3aCash','vcSaTopup','vcVhr','vcMaCash',
    'annualGovGrant','wisAmount',                  // BUG-E fix: removed dead mrssGrant/mmssGrant (engine ignores them; always 0)
    'oaToSaTransfer','oaToMaTransfer','oaWithdrawalAt55',
    'oaDrawdownMonthly','oaDrawdownFloor',        // BUG-A fix: corrected from oaMonthlyDraw / oaBequestFloor
    'srsBalance','srsAnnualContribution',
    'currentPrivateAssets','annualPrivateSaving',
    'propMonetiseCashProceeds','propMonetiseRaTopup',
    'targetMonthlyIncome',
    'oaEduLoan',                                  // BUG-H fix: corrected from oaEduLoanAnnual
    'cpfisOaAmount','cpfisSaAmount',
    'rssMonthlyPayout',                             // RSS: fixed monthly payout in $ — display formatted
  ]);
  // Returns formatted display value: $X,XXX when not focused, raw number string when focused.
  const getDisplayValue = (name, rawValue) => {
    if (focusedField === name) return String(rawValue ?? '');
    const n = Number(rawValue);
    if (CURRENCY_FIELDS.has(name) && n > 0) return '$' + n.toLocaleString();
    return String(rawValue ?? '');
  };

  // FreqToggle is now a top-level component (defined before App) — receives inputs+setInputs as props.
  // This prevents it from being recreated on every App render, which was causing sidebar section flicker.
  // SEP has no mandatory contributions → full $37,740 VC3A available
  const currentAge_ui = Number(inputs.currentAge) || 35;
  const nti_ui = Number(inputs.netTradeIncome) || 0;
  let sepMandatoryMA_ui = 0;
  if (isSelfEmployed && nti_ui > 6000) {
      let maRate = 0.08;
      if (currentAge_ui > 50) maRate = 0.105;
      else if (currentAge_ui > 45) maRate = 0.10;
      else if (currentAge_ui > 35) maRate = 0.09;
      sepMandatoryMA_ui = Math.round(Math.min(nti_ui, 96000) * maRate);
  }
  const totalMandatory = isSelfEmployed ? sepMandatoryMA_ui : ((Number(inputs.empOaCont) || 0) + (Number(inputs.empSaCont) || 0) + (Number(inputs.empMaCont) || 0));
  const maxAllowableVC = Math.max(0, ANNUAL_LIMIT - totalMandatory);
  // VC3A lump-sum + VHR counted toward Annual Limit; RSTU is separate (no Annual Limit)
  // VHR (Housing Refund) is NOT subject to the Annual Limit — it refunds CPF used for housing
  // Only VC3A counts toward the Annual Limit
  const totalVC = (Number(inputs.vc3aCash) || 0);
  const isVcOverLimit = totalVC > maxAllowableVC;

  const annualGross = ((Number(inputs.salaryGross) || 0) * 12) + (Number(inputs.salaryBonus) || 0);
  const estimatedTaxRate = annualGross > 320000 ? 0.22 : annualGross > 240000 ? 0.19 : annualGross > 160000 ? 0.17 : annualGross > 120000 ? 0.15 : annualGross > 80000 ? 0.115 : annualGross > 40000 ? 0.07 : 0.035;

  const baseYear = Number(inputs.currentYear) || 2026;
  const yearsFrom2026 = Math.max(0, baseYear - 2026);
  const currentBRS = Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, yearsFrom2026));
  const currentFRS = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, yearsFrom2026));
  const currentERS = currentFRS * 2;
  const currentBHS = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, yearsFrom2026));

  const currentSaRa = Number(inputs.saBalance) || 0;
  const currentMa = Number(inputs.maBalance) || 0;

  // Tax relief only applies to top-ups that bring SA/RA up to FRS (not beyond).
  // If currentSaRa >= currentFRS, eligible amount is $0. Hard cap $8,000/yr.
  const frsHeadroomForRelief = Math.max(0, currentFRS - currentSaRa);
  const topupEligibleForRelief = Math.min(Number(inputs.vcSaTopup) || 0, frsHeadroomForRelief);
  const eligibleRSTU = Math.min(topupEligibleForRelief, 8000);
  const estimatedTaxSavings = Math.round(eligibleRSTU * estimatedTaxRate);

  const ersPercentText = ((currentSaRa / currentERS) * 100).toFixed(1);
  const bhsPercentText = Math.min(100, (currentMa / currentBHS) * 100).toFixed(1);
  const saRaVisualWidth = Math.min(100, (currentSaRa / currentERS) * 100);
  const bhsVisualWidth = Math.min(100, (currentMa / currentBHS) * 100);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    let { name, value } = e.target;
    // Fix 5: strip currency formatting before coercing to a number.
    // getDisplayValue renders "$30,000" when focusedField is null.  If a React re-render
    // commits focusedField = null BEFORE blur fires (e.g. clicking a collapsed section
    // header triggers mousedown → setState → re-render → blur), e.target.value already
    // holds the formatted string.  Number("$30,000") = NaN → previous code coerced to 0,
    // silently zeroing the field.  Stripping $ and , first makes the parse robust.
    const stripped = String(value).replace(/[$,]/g, '').trim();
    const coerced = (stripped === "" || isNaN(Number(stripped))) ? 0 : Number(stripped);
    // Pure updater — no side effects inside setState. Validation is handled by the
    // dedicated useEffect below which always receives the fully committed inputs state,
    // eliminating the stale-closure risk of the previous Promise.resolve microtask.
    setInputs(prev => ({ ...prev, [name]: coerced }));
    // Always clear focusedField on blur so the committed field immediately renders in
    // currency format.  Event order is guaranteed: blur(A) fires before focus(B), so
    // field B's onFocus will set focusedField(B) after this null — no perceptible flicker.
    setFocusedField(null);
  };

  // Bug 1 fix: validation useEffect — replaces the Promise.resolve microtask that was
  // previously scheduled inside the handleBlur setState updater. Running here guarantees:
  //   1. inputs is the fully committed, up-to-date state — no stale-closure risk.
  //   2. Programmatic input changes (Apply Top-Up, Auto-Calc, profile import, preset load)
  //      are also validated automatically, not just blur events.
  //   3. No double-invocation risk under React 18 Strict Mode / Concurrent Mode.
  // validateInputs closes over only setInputErrors (a stable React setter) — safe to omit
  // from deps. All other reads go through the `inp` parameter, not component closure.
  useEffect(() => {
    validateInputs(inputs);
  }, [inputs]); // eslint-disable-line react-hooks/exhaustive-deps

  // BUG-11 fix: cache the focusable-element list outside the keydown handler so it is
  // built once per mount rather than on every Enter keypress (was an O(n) DOM scan
  // on every keystroke in a ~60-field form).  Rebuilt on any input/select mount/unmount
  // via a MutationObserver attached below.
  const focusableListRef = useRef([]);
  useEffect(() => {
    const rebuild = () => {
      focusableListRef.current = Array.from(
        document.querySelectorAll('input:not([type="hidden"]):not([readonly]), select')
      );
    };
    rebuild();
    const obs = new MutationObserver(rebuild);
    obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['readonly', 'disabled'] });
    return () => obs.disconnect();
  }, []);

  // Move to next input on Enter, set 0 if blank
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      let { name, value } = e.target;
      if (value === "" || isNaN(Number(value))) {
        setInputs(prev => ({ ...prev, [name]: 0 }));
      } else {
        setInputs(prev => ({ ...prev, [name]: Number(value) }));
      }
      // Clear focus tracking so the committed field renders in currency format
      // immediately. Without this, if focus moves to an element without an
      // onFocus:setFocusedField handler (e.g. a collapsed section's toggle button),
      // focusedField stays set and getDisplayValue returns the raw number string.
      setFocusedField(null);
      const formElements = focusableListRef.current;
      const index = formElements.indexOf(e.target);
      if (index > -1 && index < formElements.length - 1) {
        formElements[index + 1].focus();
      }
    }
  };

  const handleAutoCalc = () => {
    const gross = Number(inputs.salaryGross) || 0;
    const bonus = Number(inputs.salaryBonus) || 0;
    const cappedGross = Math.min(gross, 8000); // OW ceiling $8,000/mo
    const age = Number(inputs.currentAge) || 35;
    const prYr = Number(inputs.prYear) || 3;
    const isPR = (inputs.citizenStatus || 'SC') === 'PR';
    const prRateType = (isPR && prYr < 3) ? (inputs.prRateType || 'GG') : 'GG';

    // ── Step 1: determine OA/SA/MA rates and salary-band parameters ──────────────
    // totalRate = combined employer+employee rate for OW > $750 (standard band).
    // flatRate  = employer-only rate for OW $50–$500 (employee Nil in this band).
    //             Equals the employer share of the standard rate.
    // gradFactor = employee phase-in coefficient for OW $500–$750.
    //              = employeeRate × 750 / (750 − 500) = employeeRate × 3.
    //              At exactly OW = $750: flatRate×750 + gradFactor×250 = totalRate×750 ✓
    let oaRate, saRate, maRate, flatRate, gradFactor;

    if (isPR && prYr < 3) {
      // PR Year 1 or 2 — CPF Tables 2 & 3 (G/G) or F/G rates (1 Jan 2026)
      const prRates = getPRRates(prYr, age, prRateType);
      oaRate = prRates.oa;
      saRate = prRates.sa;
      maRate = prRates.ma;
      flatRate = prRates.flatRate;
      gradFactor = prRates.gradFactor;
    } else {
      // SC / PR Year 3+ — CPF Table 1 (1 Jan 2026), combined employer+employee rates
      // flatRate = employer rate (= total − employee). gradFactor = employeeRate × 3.
      if      (age <= 35) { oaRate=0.23; saRate=0.06;  maRate=0.08;  flatRate=0.17;  gradFactor=0.60;  }
      else if (age <= 45) { oaRate=0.21; saRate=0.07;  maRate=0.09;  flatRate=0.17;  gradFactor=0.60;  }
      else if (age <= 50) { oaRate=0.19; saRate=0.08;  maRate=0.10;  flatRate=0.17;  gradFactor=0.60;  }
      else if (age <= 55) { oaRate=0.15; saRate=0.115; maRate=0.105; flatRate=0.17;  gradFactor=0.60;  }
      else if (age <= 60) { oaRate=0.12; saRate=0.115; maRate=0.105; flatRate=0.16;  gradFactor=0.54;  }
      else if (age <= 65) { oaRate=0.035;saRate=0.11;  maRate=0.105; flatRate=0.125; gradFactor=0.375; }
      else if (age <= 70) { oaRate=0.01; saRate=0.05;  maRate=0.105; flatRate=0.09;  gradFactor=0.225; }
      else                { oaRate=0.01; saRate=0.01;  maRate=0.105; flatRate=0.075; gradFactor=0.15;  }
    }

    // ── Step 2: apply salary-band formula to monthly OW ──────────────────────────
    // OW ≤ $50:       Nil (no contribution)
    // OW $50–$500:    flatRate × OW  (employer share only, employee contributes Nil)
    // OW $500–$750:   flatRate × OW + gradFactor × (OW − $500)  (employee phases in)
    // OW > $750:      totalRate × OW  (standard full rates — most members fall here)
    const totalRate = oaRate + saRate + maRate;
    let monthlyOwContrib;
    if (cappedGross <= 50) {
      monthlyOwContrib = 0;
    } else if (cappedGross <= 500) {
      monthlyOwContrib = flatRate * cappedGross;
    } else if (cappedGross <= 750) {
      monthlyOwContrib = flatRate * cappedGross + gradFactor * (cappedGross - 500);
    } else {
      monthlyOwContrib = totalRate * cappedGross;
    }
    const annualOwContrib = monthlyOwContrib * 12;

    // ── Step 3: proportionally allocate OW contribution across OA/SA/MA ──────────
    // Uses OA:SA:MA ratios from the standard (>$750) rates — the same proportions
    // apply regardless of which wage band is active; only the total changes.
    const owOA = (totalRate > 0 && annualOwContrib > 0) ? Math.round(annualOwContrib * oaRate / totalRate) : 0;
    const owMA = (totalRate > 0 && annualOwContrib > 0) ? Math.round(annualOwContrib * maRate / totalRate) : 0;
    const owSA = (annualOwContrib > 0) ? (Math.round(annualOwContrib) - owOA - owMA) : 0;

    // ── Step 4: AW (bonus) — always uses standard (>$750) rates ─────────────────
    // AW ceiling = $102,000 − annual OW subject to CPF (wages, not contributions).
    const owIncome = cappedGross * 12;
    const awCap = Math.max(0, 102000 - owIncome);
    const bonusCpf = Math.min(bonus, awCap);
    const annualOA = owOA + Math.round(bonusCpf * oaRate);
    const annualSA = owSA + Math.round(bonusCpf * saRate);
    const annualMA = owMA + Math.round(bonusCpf * maRate);

    // ── Step 5: duplicate-press guard ────────────────────────────────────
    // If computed values are identical to what is already in the fields,
    // do NOT update state. Prevents user confusion about whether repeated
    // presses accumulate values (they never do — this just makes it explicit).
    const alreadyCurrent =
      Number(inputs.empOaCont) === annualOA &&
      Number(inputs.empSaCont) === annualSA &&
      Number(inputs.empMaCont) === annualMA;

    if (alreadyCurrent) {
      showToast(
        `ℹ Contributions already up to date — ` +
        `OA $${annualOA.toLocaleString()} / SA $${annualSA.toLocaleString()} / MA $${annualMA.toLocaleString()} (annual). ` +
        `No changes made.`
      );
      return;
    }

    setInputs(prev => ({
      ...prev,
      empOaCont: annualOA,
      empSaCont: annualSA,
      empMaCont: annualMA,
      showSalaryCalc: false
    }));

    // ── Step 6: toast — state annual figures and basis explicitly ─────────
    // "Annual" is called out prominently so users don't confuse these totals
    // with the monthly salary figure shown in the input above.
    const totalAnnual = annualOA + annualSA + annualMA;
    const annualSalaryBase = cappedGross * 12;
    const effectivePct = annualSalaryBase > 0
      ? Math.round((totalAnnual / annualSalaryBase) * 1000) / 10
      : 0;
    const bandNote = cappedGross <= 50  ? ' [OW ≤$50: Nil]'
      : cappedGross <= 500 ? ' [OW ≤$500: employer-only flat rate]'
      : cappedGross <= 750 ? ' [OW $500–$750: graduated rate]'
      : '';

    if (isPR && prYr < 3) {
      const rateLabel = prRateType === 'FG' ? 'F/G (Full ER)' : 'G/G (Graduated)';
      showToast(
        `⚡ PR Year ${prYr} ${rateLabel} applied${bandNote}. ` +
        `Annual contributions: OA $${annualOA.toLocaleString()} / SA $${annualSA.toLocaleString()} / MA $${annualMA.toLocaleString()} ` +
        `= $${totalAnnual.toLocaleString()} (${effectivePct}% of $${annualSalaryBase.toLocaleString()}/yr). ` +
        `Rates auto-advance Yr 1 → Yr 2 → Yr 3+ in the projection.`
      );
    } else {
      showToast(
        `⚡ ${isPR ? 'PR Year 3+' : 'SC'} rates applied${bandNote}. ` +
        `Annual contributions: OA $${annualOA.toLocaleString()} / SA $${annualSA.toLocaleString()} / MA $${annualMA.toLocaleString()} ` +
        `= $${totalAnnual.toLocaleString()} (${effectivePct}% of $${annualSalaryBase.toLocaleString()}/yr).`
      );
    }
  };

  // ── RSS scheme switch handler ─────────────────────────────────────────────
  // Called when the user clicks the RSS button while currently on CPF LIFE.
  // Shows a three-option modal:
  //   Cancel        — do nothing, stay on CPF LIFE
  //   Keep Existing — switch to RSS but leave all fields intact
  //   Reset Fields  — switch to RSS and zero out CPF LIFE-specific fields
  //                   (balances, personal profile, medical, housing, property,
  //                   private assets, SRS and salary are all preserved)
  const handleSwitchToRSS = () => {
    if (inputs.cpfScheme === 'rss') return; // already RSS — no-op
    setConfirmModal({
      title: "Switch to RSS Mode",
      message:
        "RSS (Retirement Sum Scheme) applies to members born before 1958. " +
        "Your balances, personal details, medical, housing, and private assets will always be kept.\n\n" +
        "Do you want to reset contribution top-up fields that don't apply to RSS members " +
        "(RSTU, VC3A, CPFIS, OA→SA transfer)? " +
        "Or keep them as-is?",
      // Secondary: switch to RSS, keep all fields unchanged
      secondaryLabel: "Keep Existing",
      onSecondary: () => { setRssActionPending('keep'); },
      // Primary (confirm): switch to RSS and reset CPF LIFE-specific fields
      confirmLabel: "Reset Fields",
      confirmColor: "#2563eb",
      onConfirm: () => { setRssActionPending('reset'); },
    });
  };

  const handleReset = () => {
    setConfirmModal({
      message: "Reset all inputs and clear all scenarios, What-If, and comparison data?",
      onConfirm: () => {
        // R3 fix: stamp lastSavedRef INSIDE onConfirm, not before the dialog opens.
        // Previously it was stamped before setConfirmModal — if the user cancelled,
        // lastSavedRef was already overwritten with DEFAULT_INPUTS, falsely marking
        // their real inputs as "unsaved" and triggering spurious beforeunload warnings.
        lastSavedRef.current = JSON.stringify(DEFAULT_INPUTS);
        setInputs({ ...DEFAULT_INPUTS });
        setInputErrors({});
        setScenarioA(null);
        setScenarioB(null);
        setScenarioLabelA("");
        setScenarioLabelB("");
        setShowWhatIf(false);
        setWhatIfPayoutAge(null);
        setWhatIfSaTopup(null);
        setWhatIfHousing(null);
        setWhatIfSalaryBump(null);
        setWhatIfContribStop(null);
        setWhatIfOaDrawdown(null);
        setWhatIfSrsContrib(null);
        setWhatIfPrivGrowth(null);
        setActiveTab("summary");
        showToast("All inputs, scenarios, and What-If data reset to defaults.");
      }
    });
  };
  handleResetRef.current = handleReset; // keep ref current for keyboard shortcut handler

  // ── RSS switch: decoupled useEffect so we always read latest inputs state ──────────
  // The modal's onSecondary/onConfirm now just set a string flag (rssActionPending).
  // This effect fires AFTER React has committed all state, guaranteeing inputs is fresh.
  useEffect(() => {
    if (!rssActionPending) return;
    const ca = Number(inputs.currentAge) || 65;
    // Fix 4b: RSS is only valid for members born before 1958.
    // Clamp currentAge to the minimum valid RSS age (currentYear − 1958) in both branches.
    // If the user's age is below the minimum, snap it up and note it in the toast.
    const minRssAge = (Number(inputs.currentYear) || 2026) - 1958;
    const enforcedAge = Math.max(ca, minRssAge);
    const ageClamped = enforcedAge > ca;
    const ageClampNote = ageClamped ? ` Age adjusted to ${enforcedAge} (RSS minimum for ${Number(inputs.currentYear)||2026}).` : '';

    if (rssActionPending === 'keep') {
      // Keep all existing fields — only override cpfScheme (and currentAge if invalid for RSS).
      const updates = { cpfScheme: 'rss' };
      if (ageClamped) updates.currentAge = enforcedAge;
      setInputs(p => ({ ...p, ...updates }));
      // R6 fix: if the user was on the LIFE tab when switching to RSS, redirect to the RSS tab.
      // The LIFE tab is removed from the tab bar for RSS members; leaving activeTab on "life"
      // causes a blank panel until the user manually clicks another tab.
      setActiveTab(at => at === 'life' ? 'rss' : at);
      showToast(`✓ Switched to RSS — all existing fields kept.${ageClampNote}`);
    } else if (rssActionPending === 'reset') {
      setInputs(p => ({
        ...p,
        cpfScheme: 'rss',
        currentAge: enforcedAge,
        // Fix 4b: default to 55 (CPF policy minimum payout start), not current age.
        // Previously defaulted to `ca` which could be 75+ — users then had to manually
        // correct it. 55 is the earliest valid RSS payout start per CPF policy.
        rssPayoutStartAge: 55,
        rssMonthlyPayout:  0,        // must be entered from CPF statement
        lifeMigrationAge:  0,        // no migration configured
        lifePlanAtMigration: 'std',  // reset to standard for cleanliness
        // ── CPF LIFE-specific top-ups (SA is closed for 68+ members) ────
        vcSaTopup: 0, vcSaFreq: 'annual', vcSaDur: 0,
        // ── VC3A (rarely applicable at 68+) ─────────────────────────────
        vc3aCash: 0, vc3aFreq: 'annual', vc3aDur: 0,
        // ── OA→SA transfer (SA closed) ───────────────────────────────────
        oaToSaTransfer: 0, oaToSaForLovedOne: false,
        oaToSaFreq: 'annual', oaToSaDur: 0,
        // ── CPFIS (SA investments) ───────────────────────────────────────
        cpfisOaAmount: 0, cpfisOaFreq: 'annual', cpfisOaDur: 0,
        cpfisSaAmount: 0, cpfisSaFreq: 'annual', cpfisSaDur: 0,
        // ── Payout age (CPF LIFE only) ───────────────────────────────────
        payoutAge: 65,
      }));
      // R6 fix: redirect away from LIFE tab (same reason as 'keep' branch above).
      setActiveTab(at => at === 'life' ? 'rss' : at);
      showToast(`✓ Switched to RSS — contribution & top-up fields reset.${ageClampNote}`);
    }
    setRssActionPending(null); // clear the flag
  }, [rssActionPending]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sandbox-safe file download — tries Blob URL, always falls back to copy modal ──
  const triggerDownload = (content, filename, mimeType) => {
    const isCSV = mimeType.includes("csv");
    // Always open the export modal so user sees content regardless of download success
    setExportModal({ type: isCSV ? "csv" : "json", content, filename });
    // Also try Blob URL download (works in most browsers even in iframes)
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      a.style.cssText = "position:fixed;top:-9999px;left:-9999px;";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 500);
      showToast(`✓ Download started: ${filename}`);
    } catch (e) {
      // Modal already open — user can copy from there
    }
  };

  // ── Save Profile: saves ALL app state — inputs + scenarios + UI choices — as JSON directly ──
  const handleExportProfile = () => {
    lastSavedRef.current = JSON.stringify(inputs);
    setSavedSeq(s => s + 1); // Rev#18: trigger hasUnsaved recompute → badge disappears
    const memberName = (inputs.name || "Member").replace(/[^a-zA-Z0-9]/g, "_");
    const fullState = {
      // Core inputs
      inputs,
      // Tab + LIFE tab choices
      activeTab,
      highlightPlan,
      viewMode,
      basicPremiumPct,
      // Scenario comparison state
      // M2 fix: omit projection arrays from export — they are stale snapshots (~95 rows × 25 fields)
      // and handleImportProfile regenerates projections fresh from inputs on load (line ~2588).
      // Stripping them reduces export file size significantly and prevents stale-data confusion.
      scenarioA: scenarioA ? { inputs: scenarioA.inputs, payoutProj: scenarioA.payoutProj, label: scenarioA.label } : null,
      scenarioB: scenarioB ? { inputs: scenarioB.inputs, payoutProj: scenarioB.payoutProj, label: scenarioB.label } : null,
      scenarioLabelA,
      scenarioLabelB,
      // What-If explorer state
      whatIfPayoutAge,
      whatIfSaTopup,
      whatIfHousing,
      whatIfSalaryBump,
      whatIfContribStop,
      whatIfOaDrawdown,
      whatIfSrsContrib,
      whatIfPrivGrowth,
      showWhatIf,
      // Display preferences
      isRealDollars,
      pdfOrientation,
      // Meta
      savedAt: new Date().toISOString(),
      appVersion: "V4-2026"
    };
    const json = JSON.stringify(fullState, null, 2);
    // Download directly — no modal
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `CPF_Profile_${memberName}.json`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 500);
      showToast(`✓ Profile saved: CPF_Profile_${memberName}.json`);
    } catch (e) {
      // Fallback: show modal with JSON to copy
      setExportModal({ type: "json", content: json, filename: `CPF_Profile_${memberName}.json` });
    }
  };

  const handleImportProfile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const target = e.target;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const p = JSON.parse(ev.target.result);
        // Whitelist helper — only copies known DEFAULT_INPUTS keys, fills gaps with
        // defaults so a profile from any older/newer version never injects unknown
        // keys or leaves required fields undefined (which causes NaN in the engine).
        const sanitiseInputs = (raw) => {
          const safe = { ...DEFAULT_INPUTS };
          Object.keys(DEFAULT_INPUTS).forEach(k => {
            if (raw[k] !== undefined) safe[k] = raw[k];
          });
          // Legacy migration: old profiles stored a single cpfisAmount — seed OA field from it
          if (raw.cpfisAmount !== undefined && !raw.cpfisOaAmount) {
            safe.cpfisOaAmount = raw.cpfisAmount;
          }
          return safe;
        };
        // Support both old format (just inputs) and new full-state format.
        // Fix 3: explicit object-type guard prevents a non-object p.inputs value
        // (e.g. null, string) from being used as-is — falls back to p for legacy format.
        const rawInputs = (p.inputs && typeof p.inputs === 'object') ? p.inputs : p;
        if (!rawInputs || typeof rawInputs !== "object") {
          alert("Invalid profile file — no inputs found. Make sure you are loading a CPF Planner Pro JSON export.");
          target.value = "";
          return;
        }
        const safeIn = sanitiseInputs(rawInputs);
        setInputs(safeIn);
        // Restore optional UI state — each wrapped individually so one bad field
        // doesn't prevent the rest of the profile from loading
        if (p.inputs) {
          try { if (p.activeTab) setActiveTab(p.activeTab); } catch {}
          try { if (p.highlightPlan) setHighlightPlan(p.highlightPlan); } catch {}
          try { if (p.viewMode) setViewMode(p.viewMode); } catch {}
          try { if (p.basicPremiumPct != null) setBasicPremiumPct(p.basicPremiumPct); } catch {}
          try { if (p.scenarioLabelA != null) setScenarioLabelA(p.scenarioLabelA); } catch {}
          try { if (p.scenarioLabelB != null) setScenarioLabelB(p.scenarioLabelB); } catch {}
          // IMP-1: Changed != null → !== undefined for all What-If fields.
          // Previously, exported null values (meaning "no override active") were
          // silently skipped, leaving stale overrides from a prior profile in place.
          // undefined means the key is absent from the file (pre-dates the field) —
          // in that case we correctly leave the current state untouched.
          try { if (p.whatIfPayoutAge !== undefined) setWhatIfPayoutAge(p.whatIfPayoutAge); } catch {}
          try { if (p.whatIfSaTopup !== undefined) setWhatIfSaTopup(p.whatIfSaTopup); } catch {}
          try { if (p.whatIfHousing !== undefined) setWhatIfHousing(p.whatIfHousing); } catch {}
          try { if (p.whatIfSalaryBump !== undefined) setWhatIfSalaryBump(p.whatIfSalaryBump); } catch {}
          try { if (p.whatIfContribStop !== undefined) setWhatIfContribStop(p.whatIfContribStop); } catch {}
          try { if (p.whatIfOaDrawdown !== undefined) setWhatIfOaDrawdown(p.whatIfOaDrawdown); } catch {}
          try { if (p.whatIfSrsContrib !== undefined) setWhatIfSrsContrib(p.whatIfSrsContrib); } catch {}
          try { if (p.whatIfPrivGrowth !== undefined) setWhatIfPrivGrowth(p.whatIfPrivGrowth); } catch {}
          try { if (p.showWhatIf != null) setShowWhatIf(p.showWhatIf); } catch {}
          try { if (p.isRealDollars != null) setIsRealDollars(p.isRealDollars); } catch {}
          try { if (p.pdfOrientation) setPdfOrientation(p.pdfOrientation); } catch {}
          // Fix 1: Restore scenario slots — if payoutProj is missing (old export format),
          // regenerate the projection from the sanitised inputs so the Compare chart
          // uses current-format engine output rather than stale stored rows.
          // runProjectionEngine is a module-level function — safe to call synchronously here.
          let scenariosRefreshed = false;
          // IMP-2: cpfScheme-aware engine dispatch for scenario regeneration.
          // Previously always called runProjectionEngine regardless of scheme, so RSS
          // scenarios would silently use the wrong engine once PR-2 (full RSS engine)
          // is merged. Now routes correctly: RSS → runRSSEngine, LIFE → runProjectionEngine.
          const scenarioEngineFn = (inp) =>
            inp.cpfScheme === 'rss' ? runRSSEngine(inp) : runProjectionEngine(inp);
          try {
            // Fix 1: dual-format detection for Scenario A.
            // — Flat key (scenarioAInputs): used by share-link exports; future-proofs JSON export if aligned.
            // — Nested key (scenarioA.inputs): used by current JSON file export format.
            // IMP-3: Projection validity check simplified.
            // Old:  projection === undefined || (Array.isArray && length > 0)
            //   → empty array [] failed both conditions and silently dropped the scenario.
            // New:  projection == null (covers undefined + null) || Array.isArray (covers [] and [rows])
            //   → all valid cases proceed to regeneration; only non-array garbage is rejected.
            const scenAInputsRaw =
              ('scenarioAInputs' in p && p.scenarioAInputs && typeof p.scenarioAInputs === 'object')
                ? p.scenarioAInputs
                : (p.scenarioA && p.scenarioA.inputs && typeof p.scenarioA.inputs === 'object' &&
                   (p.scenarioA.projection == null || Array.isArray(p.scenarioA.projection))
                   ? p.scenarioA.inputs : null);
            if (scenAInputsRaw) {
              const safeScenAInputs = sanitiseInputs(scenAInputsRaw);
              // Always regenerate projection from sanitised inputs — never restore stale stored rows.
              const freshProjA = scenarioEngineFn(safeScenAInputs);
              setScenarioA({ inputs: safeScenAInputs, projection: freshProjA, payoutProj: null, label: p.scenarioA?.label });
              scenariosRefreshed = true;
            } else { setScenarioA(null); }
          } catch { setScenarioA(null); }
          try {
            // Fix 1: dual-format detection for Scenario B — mirrors Scenario A logic above.
            const scenBInputsRaw =
              ('scenarioBInputs' in p && p.scenarioBInputs && typeof p.scenarioBInputs === 'object')
                ? p.scenarioBInputs
                : (p.scenarioB && p.scenarioB.inputs && typeof p.scenarioB.inputs === 'object' &&
                   (p.scenarioB.projection == null || Array.isArray(p.scenarioB.projection))
                   ? p.scenarioB.inputs : null);
            if (scenBInputsRaw) {
              const safeScenBInputs = sanitiseInputs(scenBInputsRaw);
              // Always regenerate projection from sanitised inputs — never restore stale stored rows.
              const freshProjB = scenarioEngineFn(safeScenBInputs);
              setScenarioB({ inputs: safeScenBInputs, projection: freshProjB, payoutProj: null, label: p.scenarioB?.label });
              scenariosRefreshed = true;
            } else { setScenarioB(null); }
          } catch { setScenarioB(null); }
          setMobileMenuOpen(false);
          lastSavedRef.current = JSON.stringify(safeIn); // clear unsaved-changes flag
          showToast(scenariosRefreshed
            ? "✓ Profile loaded — scenario projections refreshed from inputs (older export format detected)"
            : "✓ Profile loaded successfully");
        } else {
          // Legacy: old format was just the inputs object directly
          setScenarioA(null);
          setScenarioB(null);
          setMobileMenuOpen(false);
          lastSavedRef.current = JSON.stringify(safeIn); // clear unsaved-changes flag
          showToast("✓ Profile inputs imported (legacy format)");
        }
      } catch (err) {
        alert(`Could not read profile file.\n\nMake sure you are loading a CPF Planner Pro JSON export (.json). If the file was saved with an older version of the app, try the Share Code import instead.\n\nTechnical detail: ${err.message}`);
      }
      target.value = "";
    };
    reader.readAsText(file);
  };

  // lzCompress / lzDecompress are module-level (see top of file) — accessible here via closure.

  const handleShareLinkInit = () => {
    try {
      // Fix 2: include scenario INPUTS only (not projection arrays) so the recipient
      // can restore Compare slots from the share link. Projections are recalculated on load.
      // scenarioAInputs: null means no scenario saved; absent key = old link format.
      // BUG-4 fix: whatIfContribStop / OaDrawdown / SrsContrib / PrivGrowth were restored
      // on decode (lines ~2567-2570) but were never written into fullState, so they were
      // silently dropped from every share link. All 8 What-If fields now included.
      // Bug5-SL fix: use debouncedInputs (not live inputs) so the share link encodes exactly
      // the same input state that drove the visible projection on screen. If a user typed a
      // value and immediately pressed Ctrl+S before the 180ms debounce fired, the previous
      // code serialised the new keystroke value while the chart still showed the old projection.
      // debouncedInputs is always in sync with the displayed projection.
      const fullState = {
        inputs: debouncedInputs, activeTab, highlightPlan, viewMode, basicPremiumPct,
        scenarioLabelA, scenarioLabelB,
        scenarioAInputs: scenarioA?.inputs ?? null,
        scenarioBInputs: scenarioB?.inputs ?? null,
        whatIfPayoutAge, whatIfSaTopup, whatIfHousing, whatIfSalaryBump,
        whatIfContribStop, whatIfOaDrawdown, whatIfSrsContrib, whatIfPrivGrowth,
        showWhatIf, isRealDollars, pdfOrientation, appVersion: "V4-2026"
      };
      const compressed = lzCompress(JSON.stringify(fullState));
      setShareUrl(compressed);
      setShowShareModal(true);
    } catch (e) {
      alert("Could not generate share code: " + e.message);
    }
  };
  handleShareLinkInitRef.current = handleShareLinkInit; // keep ref current for keyboard shortcut handler

  const executeCopy = () => {
    if (navigator?.clipboard?.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("Link Copied to Clipboard!");
        setShowShareModal(false);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    const el = document.createElement('textarea');
    el.value = shareUrl;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      showToast("Link Copied to Clipboard!");
      setShowShareModal(false);
    } catch (err) {
      alert("Failed to copy automatically. Please manually copy the link from the text box.");
    }
    document.body.removeChild(el);
  };

  const handleExportCSV = () => {
    if (!projection || projection.length === 0) return;
    const baseYear = Number(inputs.currentYear) || 2026;
    const startAge = Number(inputs.currentAge) || 35;
    const headers = [
      "Age", "Year", "OA Balance", "SA Balance", "MA Balance", "RA Balance", "Total CPF",
      "Annual Inflow", "Cumulative Inflow", "Annual Outflow", "Cumulative Outflow",
      "Annual Interest", "Cumulative Interest", "Property Value",
      "Std Monthly Payout", "Std Annual Payout", "Std Bequest",
      "Esc Monthly Payout", "Esc Annual Payout", "Esc Bequest",
      "Bas Monthly Payout", "Bas Annual Payout", "Bas Bequest",
      "Std Total Yield", "Esc Total Yield", "Bas Total Yield",
      "Net Worth - Std (incl. Property)", "Net Worth - Esc (incl. Property)", "Net Worth - Bas (incl. Property)",
      "Yield (B) Amount", "Yield (S) Amount", "Yield (E) Amount", "Yield IRR % (Std)", "Yield IRR % (Esc)", "Yield IRR % (Bas)"
    ];
    const rows = projection.map(row => {
      const lr = payoutByAge.get(row.age) || {};
      const yr = baseYear + (row.age - startAge);
      return [
        row.age, yr,
        row.oa, row.sa, row.ma, row.ra, row.total,
        row.injected, row.cumulativeInjected,
        row.outflow, row.cumulativeOutflow,
        row.interest, row.cumulativeInterest,
        row.propertyValue,
        lr.standardMonthly || "", lr.standardAnnual || "", lr.standardBequest ?? "",
        lr.escalatingMonthly || "", lr.escalatingAnnual || "", lr.escalatingBequest ?? "",
        lr.basicMonthly || "", lr.basicAnnual || "", lr.basicBequest ?? "",
        lr.standardTotal || "", lr.escalatingTotal || "", lr.basicTotal || "",
        lr.standardNetWorth || "", lr.escalatingNetWorth || "", lr.basicNetWorth || "",
        // Yield amounts (annual payout per plan)
        lr.basicAnnual || "", lr.standardAnnual || "", lr.escalatingAnnual || "",
        // Yield XIRR % — pre-computed Newton-Raphson XIRR for each plan
        ...(["standard", "escalating", "basic"].map(plan => {
          const pa = payoutAge65; // use debounced value — matches xirrByAge which is keyed on debounced pa
          if (row.age < pa) return "";
          const xirr = xirrByAge[plan]?.[row.age];
          return xirr != null ? xirr.toFixed(2) + "%" : "";
        }))
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const memberName = (inputs.name || "Member").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `CPF_Projection_${memberName}_Age${startAge}_to95.csv`;
    // Download directly — no modal
    try {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 500);
      showToast(`✓ CSV downloaded: ${filename}`);
    } catch (e) {
      // Fallback: show modal with CSV content to copy
      setExportModal({ type: "csv", content: csv, filename });
    }
  };

  const handleExportLedgerCSV = () => {
    if (!displayAccumulation || displayAccumulation.length === 0) return;
    const memberName = (inputs.name || "Member").replace(/[^a-zA-Z0-9]/g, "_");
    const startAge = Number(inputs.currentAge) || 35;
    const saRaLabel = (Number(inputs.currentAge) >= 55 || (Number(inputs.payoutAge) <= Number(inputs.currentAge))) ? "RA Interest" : "SA Interest";
    const headers = [
      "Age",
      "Mandatory",
      "Voluntary",
      "Grants/WIS",
      "OA Interest",
      saRaLabel,
      "MA Interest",
      "Total Inflow",
      "Housing Out",
      "Medical Out",
      "OA Draw",
      "Edu Loan Out",
      "Loved One Out",
      "CPFIS Out",
      "Events In",
      "Events Out",
      "Total Outflow",
      "Net Flow"
    ];
    // Accumulate totals for the TOTAL row
    const totals = { mandatory:0, voluntary:0, grants:0, oaInt:0, saRaInt:0, maInt:0, housOut:0, medOut:0, oaDraw:0, eduOut:0, lovedOut:0, cpfisOut:0, eventsIn:0, eventsOut:0 };
    const dataRows = displayAccumulation.map(row => {
      const mandatory  = row.yearMandatory    || 0;
      const voluntary  = row.yearVoluntary    || 0;
      const grants     = row.yearGovGrants    || 0;
      const oaInt      = row.yearOaInterest   || 0;
      const saRaInt    = row.yearSaRaInterest || 0;
      const maInt      = row.yearMaInterest   || 0;
      const housOut    = row.yearHousingOut   || 0;
      const medOut     = row.yearMedOut       || 0;
      const oaDraw     = row.yearOaDrawOut    || 0;
      const eduOut     = row.yearEduOut       || 0;
      const lovedOut   = row.yearLovedOneOut  || 0;
      const cpfisOut   = row.yearCpfisOut     || 0;
      const eventsIn   = row.yearEventsIn     || 0;
      const eventsOut  = row.yearEventsOut    || 0;
      const totalIn    = mandatory + voluntary + grants + oaInt + saRaInt + maInt + eventsIn;
      const totalOut   = housOut + medOut + oaDraw + eduOut + lovedOut + cpfisOut + eventsOut;
      const net        = totalIn - totalOut;
      totals.mandatory += mandatory; totals.voluntary += voluntary; totals.grants += grants;
      totals.oaInt     += oaInt;     totals.saRaInt   += saRaInt;  totals.maInt  += maInt;
      totals.housOut   += housOut;   totals.medOut    += medOut;   totals.oaDraw += oaDraw;
      totals.eduOut    += eduOut;    totals.lovedOut  += lovedOut; totals.cpfisOut += cpfisOut;
      totals.eventsIn  += eventsIn;  totals.eventsOut += eventsOut;
      return [row.age, mandatory, voluntary, grants, oaInt, saRaInt, maInt, totalIn, housOut, medOut, oaDraw, eduOut, lovedOut, cpfisOut, eventsIn, eventsOut, totalOut, net];
    });
    const totIn  = totals.mandatory + totals.voluntary + totals.grants + totals.oaInt + totals.saRaInt + totals.maInt + totals.eventsIn;
    const totOut = totals.housOut + totals.medOut + totals.oaDraw + totals.eduOut + totals.lovedOut + totals.cpfisOut + totals.eventsOut;
    const totNet = totIn - totOut;
    const totalRow = ["TOTAL", totals.mandatory, totals.voluntary, totals.grants, totals.oaInt, totals.saRaInt, totals.maInt, totIn, totals.housOut, totals.medOut, totals.oaDraw, totals.eduOut, totals.lovedOut, totals.cpfisOut, totals.eventsIn, totals.eventsOut, totOut, totNet];
    const csv = [headers, ...dataRows, totalRow].map(r => r.join(",")).join("\n");
    const filename = `CPF_Cashflow_Ledger_${memberName}_Age${startAge}_to95.csv`;
    try {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 500);
      showToast(`✓ Ledger CSV downloaded: ${filename}`);
    } catch (e) {
      setExportModal({ type: "csv", content: csv, filename });
    }
  };

  // Rev #24 — Scenario A vs B diff export (CSV)
  const handleExportScenarioDiff = () => {
    if (!scenarioA?.projection?.length || !scenarioB?.projection?.length) return;
    const labelA = scenarioLabelA || "Scenario A";
    const labelB = scenarioLabelB || "Scenario B";

    // Build O(1) lookup maps
    const mapA = new Map(scenarioA.projection.map(r => [r.age, r]));
    const mapB = new Map(scenarioB.projection.map(r => [r.age, r]));

    // Collect key ages: every 5 years + both payout ages, sorted
    const paA = Number(scenarioA.inputs?.payoutAge) || 65;
    const paB = Number(scenarioB.inputs?.payoutAge) || 65;
    const startAge = Math.min(
      Number(scenarioA.inputs?.currentAge) || 35,
      Number(scenarioB.inputs?.currentAge) || 35
    );
    const ageSet = new Set([paA, paB]);
    for (let a = startAge; a <= 95; a += 5) ageSet.add(a);
    const ages = [...ageSet].filter(a => a >= startAge && a <= 95).sort((x, y) => x - y);

    // Headers — label each column with scenario name
    const headers = [
      "Age",
      `OA (${labelA})`, `OA (${labelB})`, "ΔOA (B−A)",
      `SA/RA (${labelA})`, `SA/RA (${labelB})`, "ΔSA/RA (B−A)",
      `MA (${labelA})`, `MA (${labelB})`, "ΔMA (B−A)",
      `Total (${labelA})`, `Total (${labelB})`, "ΔTotal (B−A)",
    ];

    const rows = ages.map(age => {
      const rA = mapA.get(age) || {};
      const rB = mapB.get(age) || {};
      const oaA = rA.oa || 0; const oaB = rB.oa || 0;
      const saA = rA.sa || 0; const saB = rB.sa || 0;
      const maA = rA.ma || 0; const maB = rB.ma || 0;
      const totA = rA.total || 0; const totB = rB.total || 0;
      return [
        age,
        oaA, oaB, oaB - oaA,
        saA, saB, saB - saA,
        maA, maB, maB - maA,
        totA, totB, totB - totA,
      ];
    });

    // Inputs-diff footer — show only keys that differ between the two scenarios
    const diffKeys = Object.keys(scenarioA.inputs || {}).filter(k =>
      String(scenarioA.inputs[k]) !== String(scenarioB.inputs[k]) && k !== 'name'
    );
    const diffRows = [
      [],
      ["KEY INPUTS THAT DIFFER", labelA, labelB, ""],
      ...diffKeys.map(k => [k, scenarioA.inputs[k], scenarioB.inputs[k], ""])
    ];

    const csv = [headers, ...rows, ...diffRows].map(r => r.join(",")).join("\n");
    const filename = `CPF_ScenarioDiff_${labelA.replace(/\W/g,"_")}_vs_${labelB.replace(/\W/g,"_")}.csv`;
    try {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 500);
      showToast(`✓ Scenario diff downloaded: ${filename}`);
    } catch (e) {
      setExportModal({ type: "csv", content: csv, filename });
    }
  };

  const handlePrintTable = () => {
    const memberName = debouncedInputs.name || "Member";
    const startAge = Number(debouncedInputs.currentAge) || 35;
    // R2 fix: use payoutAge65 (debounced) so the pa guard and row highlighting
    // match the debounced displayProjection data. Using live inputs.payoutAge caused
    // the wrong row to be highlighted green during the 180ms debounce window.
    const pa = payoutAge65;
    const fmt = v => v != null ? `$${Number(v).toLocaleString()}` : "-";

    // Build HTML table for print
    const rowsHtml = displayProjection.map(row => {
      const baseRow = accumulationByAge.get(row.age) || {};
      const raSaBal = (baseRow.sa || 0) + (row[`${highlightPlan}RA`] || 0);
      const isPA = row.age >= pa;
      const bg = row.age === pa ? "#e8f5e9" : row.age % 2 === 0 ? "#f8fafc" : "#ffffff";
      return `<tr style="background:${bg}">
        <td style="font-weight:700">${row.age}</td>
        <td>${fmt(baseRow.oa)}</td><td>${fmt(baseRow.ma)}</td><td>${fmt(raSaBal)}</td>
        <td>${fmt(baseRow.injected)}</td><td>${fmt(baseRow.outflow)}</td>
        <td>${isPA ? fmt(row.basicAnnual) : "-"}</td><td>${fmt(row.basicBequest)}</td>
        <td>${isPA ? fmt(row.standardAnnual) : "-"}</td><td>${fmt(row.standardBequest)}</td>
        <td>${isPA ? fmt(row.escalatingAnnual) : "-"}</td><td>${fmt(row.escalatingBequest)}</td>
        <td style="font-weight:700">${fmt(row[`${highlightPlan}Total`])}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html style="background:#ffffff"><head><meta charset="UTF-8"/>
<title>CPF Data Table — ${memberName}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: Arial, sans-serif; font-size: 9px; color: #0f172a; }
  h1 { font-size: 14px; font-weight: 900; margin: 0 0 4px; }
  p { font-size: 9px; color: #64748b; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0f172a; color: #fff; padding: 5px 6px; text-align: right; font-size: 8px; text-transform: uppercase; }
  th:first-child { text-align: left; }
  td { padding: 4px 6px; text-align: right; border-bottom: 1px solid #e2e8f0; }
  td:first-child { text-align: left; font-weight: 700; }
</style></head><body>
<h1>CPF Projection — ${memberName} (Age ${startAge} to 95)</h1>
<p>Plan shown: ${highlightPlan.charAt(0).toUpperCase() + highlightPlan.slice(1)} | Payout Age: ${pa} | Generated: ${new Date().toLocaleDateString("en-SG")}</p>
<table>
<thead><tr><th>Age</th><th>OA</th><th>MA</th><th>SA/RA</th><th>Inflows</th><th>Outflows</th>
<th>Bas Pay</th><th>Bas Beq</th><th>Std Pay</th><th>Std Beq</th><th>Esc Pay</th><th>Esc Beq</th><th>Total Yield</th></tr></thead>
<tbody>${rowsHtml}</tbody>
</table>
</body></html>`;

    try {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.onload = () => { setTimeout(() => { win.focus(); win.print(); URL.revokeObjectURL(url); }, 400); };
        showToast("Data table opened — use print dialog to save as PDF or print");
      } else {
        URL.revokeObjectURL(url);
        showToast("Pop-up blocked — please allow pop-ups for this site and try again");
      }
    } catch (e) {
      // Fallback to text modal
      // R2 fix: derive is55Plus from debouncedInputs so the SA/RA column label
      // matches the same data source as the rest of the print function.
      const is55PlusAtPrint = (Number(debouncedInputs.currentAge) || 0) >= 55;
      const headers = ["Age", "OA", "MA", is55PlusAtPrint ? "RA" : "SA", "Inflows", "Outflows", "Bas Pay", "Bas Beq", "Std Pay", "Std Beq", "Esc Pay", "Esc Beq", "Yield"].join("\t");
      const textRows = displayProjection.map(row => {
        const baseRow = accumulationByAge.get(row.age) || {};
        const raSaBal = (baseRow.sa || 0) + (row[`${highlightPlan}RA`] || 0);
        const isPA = row.age >= pa;
        return [row.age, fmt(baseRow.oa), fmt(baseRow.ma), fmt(raSaBal), fmt(baseRow.injected), fmt(baseRow.outflow), isPA ? fmt(row.basicAnnual) : "-", fmt(row.basicBequest), isPA ? fmt(row.standardAnnual) : "-", fmt(row.standardBequest), isPA ? fmt(row.escalatingAnnual) : "-", fmt(row.escalatingBequest), fmt(row[`${highlightPlan}Total`])].join("\t");
      }).join("\n");
      setExportModal({ type: "print", content: `CPF Projection — ${memberName} (Age ${startAge} to 95)\n${"=".repeat(60)}\n${headers}\n${textRows}` });
    }
  };

  const printMilestoneReport = () => {
    const lines = milestones.map(m => `Age ${String(m.age).padStart(3)}  |  ${m.label.padEnd(40)}  |  ${m.detail}`).join("\n");
    const content = `MILESTONE REPORT — ${inputs.name || "Member"}\n${"=".repeat(80)}\n${"Age".padEnd(8)}Event${" ".repeat(35)}Details\n${"-".repeat(80)}\n${lines}\n\n${LEGAL_DISCLAIMER}`;
    setExportModal({ type: "milestone", content });
  };


  // ── Custom hooks — replace 33 useMemos ───────────────────────────────────
  const {
    projection, projectionByAge, lifePlans, payoutProjection,
    displayProjection, displayAccumulation,
    accumulationByAge, payoutByAge, displayProjectionByAge,
    payoutAge65, raAtPayout, raAfterTransfer, raOaTransfer,
    cumulativeCashTopUps, cumulativeRaInterest,
    effectiveOaDrawMonthly, effectiveOaDrawStartAge, effectiveOaDrawFloor,
  } = useProjection(debouncedInputs, isRealDollars, basicPremiumPct);

  const {
    oaToSaCrossover, gapAlert, milestones,
    intersectionEscVsStd, intersectionStdVsBasic,
    intersectionEscVsBasic, intersectionEscPayVsStdPay,
    xirrByAge,
  } = useMilestones({
    inputs, debouncedInputs,
    projection, projectionByAge,
    displayAccumulation, accumulationByAge,
    payoutProjection, payoutAge65,
    effectiveOaDrawMonthly, effectiveOaDrawStartAge, effectiveOaDrawFloor,
    activeTab,
  });

  const {
    monteCarloData, baselineProjection, whatIfProjection,
    comparisonData, sensitivityData, strategyChartData, oaExhaustAge,
    isRSSMode, summaryRefAge, payoutAgeData, totalCpfAtPayout,
  } = useAnalytics({
    debouncedInputs, isRealDollars, basicPremiumPct,
    showMonteCarlo, showBaseline, showWhatIf,
    whatIfPayoutAge, whatIfSaTopup, whatIfHousing, whatIfSalaryBump,
    whatIfContribStop, whatIfOaDrawdown, whatIfSrsContrib, whatIfPrivGrowth,
    scenarioA, scenarioB, highlightPlan,
    projection, projectionByAge,
    displayProjection, displayAccumulation, accumulationByAge, payoutByAge,
    payoutAge65, effectiveOaDrawMonthly, effectiveOaDrawStartAge, effectiveOaDrawFloor,
  });

  return (
    <TooltipContext.Provider value={{ show: showTooltipId, set: setShowTooltipId }}>
      <ErrorBoundary>
      <div ref={rootRef} className={isDark ? "theme-dark" : "theme-light"} style={{ width: "100%", display: "flex", flexDirection: "column", background: "var(--bg-base)", color: "var(--text-main)", fontFamily: "system-ui,sans-serif" }}>
      <style>{`
        /* ─── VITE OVERRIDES (Fix Desktop White Space) ─── */
        html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; overflow-x: hidden !important; }
        #root { max-width: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; display: flex; min-height: 100vh; min-height: 100dvh; }
        :root { --app-height: 100vh; --viewport-height: 100vh; }
        @supports (height: 100dvh) { :root { --app-height: 100dvh; --viewport-height: 100dvh; } }
        /* Base height on theme classes — controlled by JS on mobile */
        .theme-dark, .theme-light { height: 100vh; height: 100dvh; overflow: hidden; }
        /* iOS Safari keyboard fix — JS sets rootRef height directly via visualViewport */
        @media (max-width: 1024px) {
          .theme-dark, .theme-light { height: var(--viewport-height, 100dvh) !important; min-height: var(--viewport-height, 100dvh) !important; }
        }
        .theme-dark {
          --bg-base: #060d1f;
          --bg-panel: #0d1b2e;
          --bg-input: #162032;
          --bg-muted: rgba(22,32,50,0.6);
          --bg-panel-muted: rgba(13,27,46,0.7);
          --tooltip-bg: rgba(6, 13, 31, 0.95);
          --tooltip-text: #ffffff;
          --tooltip-border: rgba(255,255,255,0.15);
          --tooltip-label: #94a3b8;
          --border-subtle: #1f3050;
          --border-strong: #2d4a6e;
          --text-main: #e8f0fe;
          --text-bright: #ffffff;
          --text-highlight: #c8d8f0;
          --text-muted: #a0b4cc;
          --text-subtle: #7090a8;
          --header-bg: rgba(13,27,46,0.97);
          --chart-grid: #1a2d45;
          --chart-text: #7090a8;
          /* Hero panel */
          --hero-left-bg: #1e3a5f;
          --hero-right-bg: #162032;
          --hero-border: #2d4a6e;
          --ctrl-on-text: #c8d8f0;   /* active toggle btn text on --border-strong bg */
          --ctrl-active-bg: #2563eb; /* active toggle btn bg — bright blue, 4.6:1 on --bg-panel #0d1b2e */
          --hero-text: #ffffff;
          --hero-label: rgba(255,255,255,0.55);
          --hero-card-bg: rgba(255,255,255,0.08);
          --hero-acct-bg: rgba(255,255,255,0.05);
          --hero-acct-border: rgba(255,255,255,0.08);
          --hero-ring-bg: rgba(255,255,255,0.1);
          --hero-divider: rgba(255,255,255,0.15);
          --hero-arrow: white;
          /* Shadows & interactive */
          --shadow-modal: 0 25px 50px -12px rgba(0,0,0,0.75);
          --shadow-panel: 0 4px 8px rgba(0,0,0,0.35);
          --shadow-sticky: 2px 0 6px rgba(0,0,0,0.35);
          --shadow-mobile-menu: 0 8px 24px rgba(0,0,0,0.4);
          --shadow-kpi: 0 2px 4px rgba(0,0,0,0.25);

          /* ── Accent colour tokens (theme-aware — light mode overrides below) ── */
          --clr-blue:         #60a5fa;   --clr-blue-rgb:      96,165,250;
          --clr-green:        #34d399;   --clr-green-rgb:     52,211,153;
          --clr-emerald:      #10b981;   --clr-emerald-rgb:   16,185,129;
          --clr-amber:        #fbbf24;   --clr-amber-rgb:     251,191,36;
          --clr-amber2:       #d97706;   --clr-amber2-rgb:    217,119,6;
          --clr-amber3:       #f59e0b;   --clr-amber3-rgb:    245,158,11;
          --clr-purple:       #a855f7;   --clr-purple-rgb:    168,85,247;
          --clr-purple2:      #7c3aed;   --clr-purple2-rgb:   124,58,237;
          --clr-violet:       #a78bfa;   --clr-violet-rgb:    167,139,250;
          --clr-violet2:      #c084fc;
          --clr-red:          #f87171;   --clr-red-rgb:       248,113,113;
          --clr-orange:       #fb923c;   --clr-orange-rgb:    251,146,60;
          --clr-indigo:       #818cf8;
          --clr-indigo2:      #6366f1;   --clr-indigo2-rgb:   99,102,241;
          --clr-cyan:         #22d3ee;   --clr-cyan-rgb:      34,211,238;
          --clr-blue2:        #3b82f6;   --clr-blue2-rgb:     59,130,246;
          --clr-slate:        #94a3b8;
          --chart-cursor: rgba(255,255,255,0.2);
          --tooltip-border-inline: rgba(255,255,255,0.15);
          --tooltip-shadow-inline: 0 8px 24px rgba(0,0,0,0.65);
          --code-bg: #060d1f;
          --code-text: #c8d8f0;
          --share-url-color: #6ee7b7;
          --mc-total-border: rgba(255,255,255,0.12);
          --mc-total-color: #ffffff;
          /* ── Section-header accent colours (theme-aware) ── */
          --clr-sky:  #38bdf8;   /* Profile & Balances header + body accents */
          --clr-lime: #a3e635;   /* Mandatory Contributions header + body accents */
        }
        .theme-light {
          /* ── Backgrounds: reduced luminance ~15% to ease eye strain ── */
          --bg-base: #c4d2de;
          --bg-panel: #d8e4f0;
          --bg-input: #b8c8d4;
          --bg-muted: rgba(196,210,222,0.96);
          --bg-panel-muted: rgba(216,228,240,0.92);
          --tooltip-bg: rgba(216,228,240,0.99);
          --tooltip-text: #0d1520;
          --tooltip-border: rgba(20,40,70,0.25);
          --tooltip-label: #2a4260;
          /* ── Borders: stronger contrast on darker base ── */
          --border-subtle: #7a96ae;
          --border-strong: #4a6680;
          /* ── Text: unchanged — already passes WCAG AA ── */
          --text-main: #162033;
          --text-bright: #08111e;
          --text-highlight: #0d2a4a;
          --text-muted: #2e4560;
          --text-subtle: #2a4565;
          --header-bg: rgba(181,200,218,0.98);
          /* ── Charts: deeper gridlines for contrast on darker bg ── */
          --chart-grid: #8aa4bc;
          --chart-text: #1e3350;
          /* ── Hero / KPI panel ── */
          --hero-left-bg: #a8bece;
          --hero-right-bg: #bccedd;
          --hero-border: #7a9ab2;
          --ctrl-on-text: #ffffff;   /* active toggle btn text on --border-strong (#4a6680) = 5.99:1 ✓ */
          --ctrl-active-bg: #1e40af; /* active toggle btn bg — deep blue, 5.3:1 on --bg-panel #d8e4f0 */
          --hero-text: #0a1c2e;
          --hero-label: #1e3248;
          --hero-card-bg: rgba(10,28,46,0.09);
          --hero-acct-bg: rgba(10,28,46,0.07);
          --hero-acct-border: rgba(10,28,46,0.20);
          --hero-ring-bg: rgba(10,28,46,0.14);
          --hero-divider: rgba(10,28,46,0.20);
          --hero-arrow: #0d2a4a;
          /* ── Shadows & interactive ── */
          --shadow-modal: 0 25px 50px -12px rgba(0,0,0,0.25);
          --shadow-panel: 0 2px 8px rgba(0,0,0,0.12);
          --shadow-sticky: 2px 0 5px rgba(0,0,0,0.11);
          --shadow-mobile-menu: 0 6px 18px rgba(0,0,0,0.16);
          --shadow-kpi: 0 1px 4px rgba(0,0,0,0.12);

          /* ── Accent colour tokens — WCAG AA on new darker backgrounds ── */
          --clr-blue:         #1d4ed8;   --clr-blue-rgb:      29,78,216;
          --clr-green:        #065f46;   --clr-green-rgb:     6,95,70;
          --clr-emerald:      #065f46;   --clr-emerald-rgb:   6,95,70;
          --clr-amber:        #92400e;   --clr-amber-rgb:     146,64,14;
          --clr-amber2:       #92400e;   --clr-amber2-rgb:    146,64,14;
          --clr-amber3:       #92400e;   --clr-amber3-rgb:    146,64,14;
          --clr-purple:       #5b21b6;   --clr-purple-rgb:    91,33,182;
          --clr-purple2:      #5b21b6;   --clr-purple2-rgb:   91,33,182;
          --clr-violet:       #5b21b6;   --clr-violet-rgb:    91,33,182;
          --clr-violet2:      #6d28d9;
          --clr-red:          #b91c1c;   --clr-red-rgb:       185,28,28;
          --clr-orange:       #c2410c;   --clr-orange-rgb:    194,65,12;
          --clr-indigo:       #4338ca;
          --clr-indigo2:      #4338ca;   --clr-indigo2-rgb:   67,56,202;
          --clr-cyan:         #0e7490;   --clr-cyan-rgb:      14,116,144;
          --clr-blue2:        #1e40af;   --clr-blue2-rgb:     30,64,175;
          --clr-slate:        #334155;
          --chart-cursor: rgba(20,40,70,0.22);
          --tooltip-border-inline: rgba(20,40,70,0.25);
          --tooltip-shadow-inline: 0 8px 24px rgba(0,0,0,0.18);
          --code-bg: #b8c8d4;
          --code-text: #0d2a4a;
          --share-url-color: #065f46;
          --mc-total-border: rgba(20,40,70,0.20);
          --mc-total-color: #08111e;
          /* ── Section-header accent colours — WCAG AA on new darker base ── */
          --clr-sky:  #0059a0;   /* 4.72:1 on #c4d2de — was #0284c7 (3.19:1 fail) */
          --clr-lime: #166534;   /* 4.62:1 on #c4d2de — was #4d7c0f (3.89:1 fail) */
        }
        /* ══════════════════════════════════════════════════════════════
           LIGHT MODE SPECIFIC OVERRIDES
           All accent-colour contrast is now handled via CSS custom
           properties (--clr-blue, --clr-green, etc.) defined above.
           These overrides handle structural and component-level fixes
           that cannot be done purely via colour tokens.
           ══════════════════════════════════════════════════════════════ */

        /* ── Logo: override inline gradient in light mode — mint+blue (#10b981/#3b82f6)
           both fail on light header. Replace with dark teal→navy: both ≥4.5:1 ── */
        .theme-light .cpf-logo-text {
          background: linear-gradient(90deg, #065f46, #1e3a8f) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
        }
        /* ── Logo sub-tagline: ensure readable on new darker header ── */
        .theme-light .cpf-logo-sub {
          color: #065f46 !important;
        }

        /* ── Active toggle/nav buttons: white text on --ctrl-active-bg (#1e40af) = 7.5:1 ✓ ── */
        .theme-light .cpf-nav-btn.active {
          color: #ffffff !important;
          font-weight: 800 !important;
        }

        /* ── Calculator icon box: soft tinted bg in light mode ──
           Dark icon (#020617) on solid emerald (#065f46) = 2.63:1 FAIL — fixed in JSX (white icon).
           This rule keeps the bg tinted so the box reads as a light-mode element. ── */
        .theme-light .cpf-calc-icon-box {
          background: rgba(6,95,70,0.18) !important;
          border: 1px solid rgba(6,95,70,0.35) !important;
        }

        /* ── All primary action buttons: white text on emerald bg ──
           #020617 on #065f46 = 2.63:1 FAIL → white on #065f46 = 9.37:1 ✓ — fixed in JSX.
           CSS class as belt-and-suspenders backup. ── */
        .theme-light .cpf-btn-primary {
          color: #ffffff !important;
        }

        /* ── Sidebar section headers ── */
        .theme-light .sidebar-section-hdr {
          background: linear-gradient(135deg, #aec2d4 0%, #bccedd 100%) !important;
          border-color: #7a9ab2 !important;
        }

        /* ── Input & select: inset appearance on white panels ── */
        .theme-light input[type="number"],
        .theme-light input[type="text"],
        .theme-light select {
          color: #162033 !important;
          background: #b8c8d4 !important;
        }
        .theme-light input[type="number"]::placeholder,
        .theme-light input[type="text"]::placeholder { color: #4a6480 !important; }

        /* ── Table ── */
        .theme-light table thead th {
          color: #162033 !important; font-weight: 800 !important;
          background: #a8bece !important;
        }
        .theme-light table thead th:first-child { background: #a8bece !important; }
        .theme-light table tbody tr:nth-child(even) { background: rgba(140,172,200,0.30) !important; }
        .theme-light table tbody td { color: #1e3350; }

        /* ── Nav/tab bar ── */
        .theme-light .cpf-nav-btn { color: #2e4560 !important; }
        .theme-light .cpf-nav-btn.active { color: #08111e !important; font-weight: 800 !important; }

        /* ── KPI strip ── */
        .theme-light .kpi-inactive-val { color: #2e4560 !important; }

        /* ── Panel/card borders ── */
        .theme-light .panel-card { border-color: #7a96ae !important; background: #d4e2ee !important; }

        /* ── Lifetime Summary card labels ── */
        .theme-light .lifetime-label { color: #2e4560 !important; font-size: 11px !important; }

        /* ── Chart legend & axis ── */
        .theme-light .recharts-legend-item-text { color: #2e4560 !important; font-weight: 600 !important; }
        .theme-light .recharts-cartesian-axis-tick-value { fill: #2e4560 !important; }

        /* ── Recharts tooltip ── */
        .theme-light .recharts-default-tooltip {
          background: rgba(196,214,228,0.99) !important;
          border-color: rgba(20,40,70,0.25) !important;
          color: #162033 !important;
        }
        .theme-light .recharts-tooltip-label { color: #162033 !important; font-weight: 700 !important; }
        .theme-light .recharts-tooltip-item  { color: #2e4560 !important; }

        /* ── Sidebar gap alert ── */
        .theme-light .gap-alert-box {
          background: rgba(254,243,199,0.85) !important;
          border-color: #92400e !important;
        }

        /* ── Info badge pills ── */
        .theme-light .info-badge {
          background: #b8c8d4 !important; color: #162033 !important; border-color: #7a96ae !important;
        }

        /* ── Toast ── */
        .theme-light .cpf-toast {
          background: #162033 !important; color: #f0f6ff !important; border-color: #2e4560 !important;
        }

        /* ── Tooltip box text inside sidebar ── */
        .theme-light .tooltip-content {
          color: #162033 !important;
          background: rgba(196,214,228,0.99) !important;
          border-color: rgba(20,40,70,0.25) !important;
        }

        /* ── Sidebar field labels ── */
        .theme-light .sidebar-field-label { color: #2e4560 !important; font-weight: 600 !important; }

        /* ── FreqToggle badges ── */
        .theme-light .freq-recurring-active { color: #065f46 !important; background: rgba(6,95,70,0.14) !important; }
        .theme-light .freq-onetime-active   { color: #92400e !important; background: rgba(146,64,14,0.14) !important; }

        /* ── Modal overlays ── */
        .theme-light .modal-heading { color: #08111e !important; }

        /* ── Theme-aware class helpers (used in JSX via className) ── */
        .theme-light .clr-sky  { color: var(--clr-sky)  !important; }
        .theme-light .clr-lime { color: var(--clr-lime) !important; }

        /* ══════════════════════════════════════════════════════════════
           LIGHT MODE CONTRAST FIXES — ported & extended from App_Pass4
           Background tints NOT ported — handled by CSS variable system
           (rgba(var(--clr-XXX-rgb), opacity) auto-adapts per theme).
           All rules scoped to .theme-light. Dark mode unaffected.
           ══════════════════════════════════════════════════════════════ */

        /* ── Hardcoded hex inline colour overrides ──────────────────────
           Chrome serialises hex → rgb() in inline styles at runtime, so
           both hex AND rgb() forms are required for full browser coverage.
           Firefox / Safari keep the original hex; Chrome uses rgb().    ── */

        /* #f472b6 (pink-400) — Housing Out col, ▶ Total Out col: 16 uses */
        .theme-light [style*="color: #f472b6"],
        .theme-light [style*='color: "#f472b6"'],
        .theme-light [style*="color: rgb(244, 114, 182)"],
        .theme-light [style*="color: rgb(244,114,182)"] { color: #9d174d !important; }

        /* #93c5fd (blue-300) — hero OA value, account labels: 15 uses */
        .theme-light [style*="color: #93c5fd"],
        .theme-light [style*='color: "#93c5fd"'],
        .theme-light [style*="color: rgb(147, 197, 253)"],
        .theme-light [style*="color: rgb(147,197,253)"] { color: #1d4ed8 !important; }

        /* #0ea5e9 (sky-500) — RSS section accents, badges: 13 uses */
        .theme-light [style*="color: #0ea5e9"],
        .theme-light [style*='color: "#0ea5e9"'],
        .theme-light [style*="color: rgb(14, 165, 233)"],
        .theme-light [style*="color: rgb(14,165,233)"] { color: #0369a1 !important; }

        /* #f43f5e (rose-500) — shortfall amount, goal card: 12 uses */
        .theme-light [style*="color: #f43f5e"],
        .theme-light [style*='color: "#f43f5e"'],
        .theme-light [style*="color: rgb(244, 63, 94)"],
        .theme-light [style*="color: rgb(244,63,94)"] { color: #be123c !important; }

        /* #fdba74 (orange-300) — SEP notice, transfer warnings: 10 uses */
        .theme-light [style*="color: #fdba74"],
        .theme-light [style*='color: "#fdba74"'],
        .theme-light [style*="color: rgb(253, 186, 116)"],
        .theme-light [style*="color: rgb(253,186,116)"] { color: #9a3412 !important; }

        /* #6ee7b7 (emerald-300 / mint) — Voluntary ledger col, hints: 10 uses */
        .theme-light [style*="color: #6ee7b7"],
        .theme-light [style*='color: "#6ee7b7"'],
        .theme-light [style*="color: rgb(110, 231, 183)"],
        .theme-light [style*="color: rgb(110,231,183)"] { color: #065f46 !important; }

        /* #c4b5fd (violet-300) — RA hero value, chart labels: 7 uses */
        .theme-light [style*="color: #c4b5fd"],
        .theme-light [style*='color: "#c4b5fd"'],
        .theme-light [style*="color: rgb(196, 181, 253)"],
        .theme-light [style*="color: rgb(196,181,253)"] { color: #7c3aed !important; }

        /* #fde68a (amber-200) — pale yellow foreigner/PR notices: 7 uses */
        .theme-light [style*="color: #fde68a"],
        .theme-light [style*='color: "#fde68a"'],
        .theme-light [style*="color: rgb(253, 230, 138)"],
        .theme-light [style*="color: rgb(253,230,138)"] { color: #78350f !important; }

        /* #ef4444 (red-500) — error states, validation messages: 7 uses */
        .theme-light [style*="color: #ef4444"],
        .theme-light [style*='color: "#ef4444"'],
        .theme-light [style*="color: rgb(239, 68, 68)"],
        .theme-light [style*="color: rgb(239,68,68)"] { color: #b91c1c !important; }

        /* #fcd34d (amber-300) — gap alert computed values: 5 uses */
        .theme-light [style*="color: #fcd34d"],
        .theme-light [style*='color: "#fcd34d"'],
        .theme-light [style*="color: rgb(252, 211, 77)"],
        .theme-light [style*="color: rgb(252,211,77)"] { color: #78350f !important; }

        /* #fca5a5 (red-300) — gap alert body text, Loved One col: 5 uses */
        .theme-light [style*="color: #fca5a5"],
        .theme-light [style*='color: "#fca5a5"'],
        .theme-light [style*="color: rgb(252, 165, 165)"],
        .theme-light [style*="color: rgb(252,165,165)"] { color: #9b1c1c !important; }

        /* #2dd4bf (teal-400) — Cashflow Ledger feature badge, accents: 5 uses */
        .theme-light [style*="color: #2dd4bf"],
        .theme-light [style*='color: "#2dd4bf"'],
        .theme-light [style*="color: rgb(45, 212, 191)"],
        .theme-light [style*="color: rgb(45,212,191)"] { color: #0f766e !important; }

        /* #d8b4fe (violet-300) — purple accent labels: 2 uses */
        .theme-light [style*="color: #d8b4fe"],
        .theme-light [style*='color: "#d8b4fe"'],
        .theme-light [style*="color: rgb(216, 180, 254)"],
        .theme-light [style*="color: rgb(216,180,254)"] { color: #6d28d9 !important; }

        /* #fb7185 (rose-400) — Medical Out ledger col: 2 uses */
        .theme-light [style*="color: #fb7185"],
        .theme-light [style*='color: "#fb7185"'],
        .theme-light [style*="color: rgb(251, 113, 133)"],
        .theme-light [style*="color: rgb(251,113,133)"] { color: #be123c !important; }

        /* #f9a8d4 (pink-300) — pink accent labels: 1 use */
        .theme-light [style*="color: #f9a8d4"],
        .theme-light [style*='color: "#f9a8d4"'],
        .theme-light [style*="color: rgb(249, 168, 212)"],
        .theme-light [style*="color: rgb(249,168,212)"] { color: #9d174d !important; }

        /* #fda4af (rose-300) — shortfall actionable insight text: 1 use */
        .theme-light [style*="color: #fda4af"],
        .theme-light [style*='color: "#fda4af"'],
        .theme-light [style*="color: rgb(253, 164, 175)"],
        .theme-light [style*="color: rgb(253,164,175)"] { color: #9f1239 !important; }

        /* #38bdf8 (sky-400) — sky-blue labels remaining post-migration: 3 uses */
        .theme-light [style*="color: #38bdf8"],
        .theme-light [style*='color: "#38bdf8"'],
        .theme-light [style*="color: rgb(56, 189, 248)"],
        .theme-light [style*="color: rgb(56,189,248)"] { color: #0284c7 !important; }

        /* #7dd3fc (sky-300) — very light sky-blue accents: 3 uses */
        .theme-light [style*="color: #7dd3fc"],
        .theme-light [style*='color: "#7dd3fc"'],
        .theme-light [style*="color: rgb(125, 211, 252)"],
        .theme-light [style*="color: rgb(125,211,252)"] { color: #0369a1 !important; }

        /* ── Font-size floor — unreadable micro-text ─────────────────
           Recharts SVG label props (fontSize: 8 as SVG attr) are not
           matched by these CSS selectors and remain unchanged.         ── */
        .theme-light [style*="font-size: 7px"] { font-size: 11px !important; }
        .theme-light [style*="font-size: 8px"] { font-size: 11px !important; }
        .theme-light [style*="font-size: 9px"] { font-size: 11px !important; }
        .theme-light [style*="font-size: 10px"] { font-size: 11px !important; }

        /* ── Dark navy rgba backgrounds — invisible text in light mode ──
           rgba(30,41,59,*) is a dark slate used for dark-mode panels;
           in light mode it creates near-black boxes. Replace with the
           muted panel bg so text stays readable.                        ── */
        .theme-light [style*="background: rgba(30,41,59,0.6)"],
        .theme-light [style*="background: rgba(30, 41, 59, 0.6)"] {
          background: var(--bg-input) !important;
          color: var(--text-muted) !important;
        }

        /* ── Hero account donut ring SVG percentage text ──────────────
           fill={tc} is rendered as a SVG presentation attribute — the
           CSS fill property overrides SVG presentation attributes.     ── */
        .theme-light .hero-acct-grid svg text { fill: #1e3248 !important; }

        /* ── Foreigner lock overlays ───────────────────────────────────
           Dark mode: rgba(15,23,42,0.55) curtain + rgba(15,23,42,0.9)
           opaque pill look fine against dark panels.
           Light mode: they become jarring solid-black rectangles.
           Fix: curtain → soft blue-grey; pill → panel bg + dark text. ── */
        .theme-light [style*="background: rgba(15,23,42,0.55)"],
        .theme-light [style*="background: rgba(15, 23, 42, 0.55)"] {
          background: rgba(160,184,210,0.70) !important;
        }
        .theme-light [style*="background: rgba(15,23,42,0.9)"],
        .theme-light [style*="background: rgba(15, 23, 42, 0.9)"],
        .theme-light [style*="background: rgba(15,23,42,0.82)"],
        .theme-light [style*="background: rgba(15, 23, 42, 0.82)"] {
          background: var(--bg-panel) !important;
          color: #0d2a4a !important;
          border-color: #6b8fae !important;
        }

        /* ── Sub-tab toggle border (Projection Table / Cashflow Ledger) ── */
        .theme-light button[style*="borderRadius: 20"] {
          border-color: #9a958e !important;
        }

        /* ── Table tbody: ensure all non-coloured cells are dark enough ── */
        .theme-light table tbody td { color: #162033 !important; }

        @keyframes slideDown {
          from { transform: translate(-50%, -20px); opacity: 0; }
          to   { transform: translate(-50%, 0);     opacity: 1; }
        }
        @keyframes sidebarIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes unsavedPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        
        /* ─── BASE LAYOUT (desktop default) ─────────────────────────── */
        .cpf-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          width: 100%;
          margin: 0 auto;
          padding: 24px 20px;
          align-items: start;
          box-sizing: border-box;
          transition: max-width 0.3s ease, grid-template-columns 0.3s ease, padding 0.3s ease;
          /* Fill all available height between header and footer */
          height: 100%;
          overflow: hidden;
        }
        /* Sidebar scrolls independently */
        .cpf-sidebar-wrap {
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: var(--border-strong) transparent;
          align-self: stretch;
        }
        .cpf-sidebar-wrap::-webkit-scrollbar { width: 4px; }
        .cpf-sidebar-wrap::-webkit-scrollbar-track { background: transparent; }
        .cpf-sidebar-wrap::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }
        /* Main content panel: grid with sticky header row + scrollable content row */
        .cpf-main-wrap {
          height: 100%;
          display: grid !important;
          grid-template-rows: auto 1fr;
          overflow: hidden;
          min-width: 0;
        }
        /* The scrollable content area inside the main wrap */
        .cpf-tab-content {
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: var(--border-strong) transparent;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .cpf-tab-content::-webkit-scrollbar { width: 5px; }
        .cpf-tab-content::-webkit-scrollbar-track { background: transparent; }
        .cpf-tab-content::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }
        /* ─── DESKTOP VIEWPORT MODES ─────────────────────────────────── */
        .cpf-layout[data-mode="fhd"] { grid-template-columns: 380px 1fr; max-width: 1920px; gap: 28px; padding: 28px 32px; }
        .cpf-layout[data-mode="hd"] { grid-template-columns: 360px 1fr; max-width: 1440px; gap: 24px; padding: 24px 28px; }
        @media (min-width: 1920px) { .cpf-layout[data-mode="auto"] { grid-template-columns: 380px 1fr; gap: 28px; padding: 28px 32px; } }
        @media (min-width: 1440px) and (max-width: 1919px) { .cpf-layout[data-mode="auto"] { grid-template-columns: 360px 1fr; gap: 24px; padding: 24px 24px; } }
        @media (max-width: 1439px) and (min-width: 1025px) { .cpf-layout[data-mode="auto"] { grid-template-columns: 300px 1fr; gap: 16px; padding: 16px 16px; } }

        /* ─── PAGE-WIDE WRAPPER ─── */
        .cpf-page-wrap { max-width: 1920px; margin: 0 auto; padding: 6px 20px; width: 100%; box-sizing: border-box; }
        .cpf-page-wrap[data-mode="fhd"] { max-width: 1920px; padding: 6px 32px; }
        .cpf-page-wrap[data-mode="hd"]  { max-width: 1440px; padding: 6px 28px; }
        .cpf-page-wrap[data-mode="auto"] { max-width: 1920px; padding: 6px 20px; }
        @media (min-width: 1920px) { .cpf-page-wrap[data-mode="auto"] { padding: 6px 32px; } }
        @media (min-width: 1440px) and (max-width: 1919px) { .cpf-page-wrap[data-mode="auto"] { max-width: 1920px; padding: 6px 24px; } }
        @media (max-width: 1439px) and (min-width: 1025px) { .cpf-page-wrap[data-mode="auto"] { max-width: 1920px; padding: 6px 16px; } }

        .cpf-header-actions { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; justify-content: flex-end; flex: 1 1 auto; min-width: 0; }
        .mobile-menu-btn { display: none; }
        .desktop-only { display: flex; }
        .cpf-tabs { display: flex; gap: 4px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; touch-action: pan-x; }
        .cpf-tabs::-webkit-scrollbar { display: none; }
        /* Ensure active tab scrolls into view on mobile */
        .cpf-tabs button[aria-selected="true"] { scroll-snap-align: center; }
        .cpf-tabs { scroll-snap-type: x proximity; scroll-padding: 0 20px; }

        .rg-6 { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; }
        .rg-5 { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; }
        .rg-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .rg-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .rg-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .sidebar-toggle-btn { display: none; }
        /* Sidebar sticky expand/collapse bar — only meaningful on desktop where sidebar scrolls */
        .sidebar-sticky-bar { display: flex; }
        @media (max-width: 1024px) { .sidebar-sticky-bar { display: none !important; } }
        /* Keyboard accessibility for sidebar sections */
        .sidebar-section-header:focus { outline: 2px solid #34d399; outline-offset: -2px; border-radius: 8px; }
        .sidebar-section-header:focus:not(:focus-visible) { outline: none; }
        /* FreqToggle responsive — larger touch targets on narrow screens */
        @media (max-width: 768px) {
          .freq-toggle-wrap { margin-left: 0 !important; display: flex !important; }
          .freq-toggle-wrap button { padding: 4px 10px !important; font-size: 9px !important; min-height: 28px; }
        }

        /* ─── TABLET LANDSCAPE  769 – 1024 px ───────────────────────── */
        @media (max-width: 1024px) and (min-width: 769px) {
          /* Revert to normal page flow — no sticky panels on tablet */
          .theme-dark, .theme-light { height: auto !important; overflow: visible !important; }
          .cpf-layout { grid-template-columns: 1fr !important; gap: 0 !important; padding: 0 !important; max-width: 100% !important; height: auto !important; overflow: visible !important; flex: none !important; }
          .cpf-sidebar-wrap { width: 100%; border-bottom: 2px solid var(--border-subtle); position: static !important; background: var(--bg-base); height: auto !important; overflow-y: visible !important; align-self: auto !important; }
          .cpf-main-wrap { height: auto !important; overflow: visible !important; display: flex !important; grid-template-rows: none !important; flex-direction: column !important; }
          .cpf-tab-content { overflow-y: visible !important; padding: 10px 14px !important; }
          .cpf-sidebar-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px 14px 16px; animation: sidebarIn 0.2s ease-out; overflow-y: visible; }
          .cpf-sidebar-inner.sidebar-collapsed { display: none !important; }
          .cpf-main-wrap { padding: 16px 14px; }
          .sidebar-toggle-btn { display: flex !important; position: sticky; top: 0; z-index: 40; background: var(--bg-panel); }
          .desktop-only { display: none !important; }
          .rg-6, .rg-5 { grid-template-columns: repeat(3,1fr) !important; }
          .rg-4, .rg-3, .rg-2, .life-plans-grid { grid-template-columns: 1fr 1fr !important; }
          .cpf-table-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .cpf-modal-inner { max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
          .welcome-step3-grid { grid-template-columns: 1fr 1fr !important; }
        }

        /* ─── TABLET PORTRAIT + MOBILE  ≤ 768 px ────────────────────── */
        @media (max-width: 768px) {
          /* Revert to normal page flow — no sticky panels on mobile */
          .theme-dark, .theme-light { height: auto !important; overflow: visible !important; }
          .cpf-layout { grid-template-columns: 1fr !important; gap: 0 !important; padding: 0 !important; max-width: 100% !important; height: auto !important; overflow: visible !important; flex: none !important; }
          .cpf-header-actions .hide-mobile { display: none; }
          .cpf-sidebar-wrap { width: 100%; border-bottom: 2px solid var(--border-subtle); position: static !important; background: var(--bg-base); height: auto !important; overflow-y: visible !important; align-self: auto !important; }
          .cpf-sidebar-inner { display: flex; flex-direction: column; gap: 12px; padding: 10px 12px 14px; animation: sidebarIn 0.2s ease-out; overflow-y: visible; }
          .cpf-sidebar-inner.sidebar-collapsed { display: none !important; }
          .cpf-main-wrap { height: auto !important; overflow: visible !important; display: flex !important; grid-template-rows: none !important; flex-direction: column !important; }
          .cpf-tab-content { overflow-y: visible !important; padding: 10px 10px !important; }
          .sidebar-toggle-btn { display: flex !important; position: sticky; top: 0; z-index: 40; background: var(--bg-panel); }
          .desktop-only { display: none !important; }
          .rg-6 { grid-template-columns: repeat(2,1fr) !important; gap: 6px !important; }
          .rg-5, .rg-4, .rg-3, .rg-2 { grid-template-columns: 1fr 1fr !important; }
          .life-plans-grid { grid-template-columns: 1fr !important; }
          .cpf-table-scroll { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .cpf-tabs { overflow-x: auto !important; flex-wrap: nowrap !important; }
          .cpf-modal-inner { max-width: 100% !important; border-radius: 12px !important; }
          .cpf-welcome-body { max-height: 50vh !important; overflow-y: auto !important; }
          .welcome-step3-grid { grid-template-columns: 1fr !important; }
          .kpi-strip { grid-template-columns: 1fr 1fr !important; }
          .kpi-strip > div { min-width: 0 !important; padding: 4px 8px !important; }
          .cpf-kpi-value { font-size: 12px !important; }
          .cpf-kpi-label { font-size: 8px !important; }
          body { overflow-x: hidden !important; }
          .pie-chart-wrap { flex-direction: column !important; align-items: stretch !important; }
          .pie-chart-wrap > div:first-child { width: 100% !important; }
          .pie-legend { grid-template-columns: 1fr 1fr !important; }
          .docs-two-col { grid-template-columns: 1fr !important; }
          .life-chart-header { flex-direction: column !important; }
          .hero-split { grid-template-columns: 1fr !important; }
          .hero-split > div { overflow: hidden !important; min-width: 0 !important; }
          .hero-split svg { overflow: visible !important; }
          /* Yield breakeven cards: 1-col on mobile */
          .yield-cards-grid { grid-template-columns: 1fr !important; }
        }

        /* ─── SMALL PHONE  ≤ 480 px ─────────────────────────────────── */
        @media (max-width: 480px) {
          .cpf-main-wrap { padding: 6px 6px; }
          .rg-6, .rg-5, .rg-4, .rg-3 { grid-template-columns: 1fr 1fr !important; gap: 5px !important; }
          .rg-2, .life-plans-grid { grid-template-columns: 1fr !important; }
          .cpf-kpi-value { font-size: 14px !important; }
          .cpf-kpi-label { font-size: 9px !important; }
          .cpf-tab-btn { font-size: 9px !important; padding: 6px 8px !important; }
          .sidebar-toggle-btn span { font-size: 9px !important; }
          .cpf-welcome-header { padding: 10px 12px !important; }
          .cpf-welcome-body { padding: 16px !important; max-height: 45vh !important; overflow-y: auto !important; }
          .welcome-step3-grid { grid-template-columns: 1fr !important; }
          .cpf-welcome-footer { padding: 14px 16px !important; }
        }

        /* ─── MOBILE HEADER  ≤ 640 px ───────────────────────────────── */
        @media (max-width: 640px) {
          .mobile-menu-btn { display: flex !important; }
          .cpf-header-actions > *:not(.mobile-menu-btn):not(.sidebar-toggle-btn) { display: none !important; }
          .cpf-header-actions { gap: 4px; }
          /* Pin the header so inputs toggle + hamburger are always reachable */
          header { position: fixed !important; top: 0; left: 0; right: 0; z-index: 50; }
          /* Push layout content below the fixed header (header is ~48px tall on mobile) */
          .cpf-mobile-top-spacer { display: block !important; height: 48px; flex-shrink: 0; }
          .cpf-mobile-menu { display: flex !important; flex-direction: column; gap: 8px; position: fixed; top: 48px; right: 0; left: 0; background: var(--bg-panel); border-bottom: 1px solid var(--border-subtle); padding: 12px 14px; z-index: 49; box-shadow: var(--shadow-mobile-menu); max-height: calc(100dvh - 48px); overflow-y: auto; }
          .cpf-mobile-menu-row { display: flex; gap: 8px; flex-wrap: wrap; }
          .cpf-logo-text { font-size: 13px !important; }
          .cpf-logo-sub  { display: none !important; }
          /* Show toggle btn on mobile — no positioning here (handled per-context below) */
          .sidebar-toggle-btn { display: flex !important; z-index: 40; background: var(--bg-panel); }
          /* The sidebar INPUT PARAMETERS bar: fixed just below the fixed header */
          .cpf-sidebar-wrap .sidebar-toggle-btn { position: fixed !important; top: 48px; left: 0; right: 0; z-index: 48; }
          /* Push sidebar sections below the fixed toggle bar (~44px tall) */
          .cpf-sidebar-wrap { padding-top: 44px; }
          .desktop-only { display: none !important; }
          .rg-5, .rg-4, .rg-3 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (min-width: 641px) {
          .cpf-mobile-menu { display: none !important; }
          .cpf-mobile-top-spacer { display: none !important; }
        }

        /* ─── GLOBAL OVERFLOW GUARD (Fixed for Recharts) ───────────── */
        @media (max-width: 1024px) {
          body, html, #root, .cpf-page-wrap, .cpf-layout, .cpf-main-wrap { max-width: 100vw; box-sizing: border-box; overflow-x: hidden; }
          img { max-width: 100%; height: auto; }
          pre, code { white-space: pre-wrap; word-break: break-word; }
          input, select, textarea { max-width: 100%; }
          table { table-layout: auto; }
        }

        /* ─── MOBILE TOUCH SCROLL FIX ─── */
        .recharts-wrapper, .recharts-surface, input[type="range"] {
          touch-action: pan-y !important;
        }
      `}</style>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 99999, background: "var(--clr-emerald)", color: "#ffffff", padding: "12px 24px", borderRadius: 12, fontWeight: 800, boxShadow: "0 10px 25px rgba(var(--clr-emerald-rgb),0.3)", display: "flex", alignItems: "center", gap: 8, animation: "slideDown 0.3s ease-out" }}>
          <CheckCircle2 style={{ width: 18, height: 18 }} /> {toastMessage}
        </div>
      )}

      {/* IN-APP CONFIRM DIALOG — replaces window.confirm (blocked in sandbox) */}
      {confirmModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(2,6,23,0.88)", backdropFilter: "blur(6px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 16, width: "100%", maxWidth: 420, padding: 28, boxShadow: "var(--shadow-modal)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <AlertTriangle style={{ width: 22, height: 22, color: "var(--clr-amber3)", flexShrink: 0 }} />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-bright)", margin: 0 }}>{confirmModal.title || "Confirm Action"}</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>{confirmModal.message}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setConfirmModal(null)} style={{ flex: 1, minWidth: 80, padding: "11px", borderRadius: 10, background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-strong)", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Cancel</button>
              {confirmModal.secondaryLabel && (
                <button onClick={() => { confirmModal.onSecondary(); setConfirmModal(null); }} style={{ flex: 1, minWidth: 100, padding: "11px", borderRadius: 10, background: "var(--bg-muted)", color: "var(--text-bright)", border: "1px solid var(--border-strong)", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{confirmModal.secondaryLabel}</button>
              )}
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} style={{ flex: 1, minWidth: 80, padding: "11px", borderRadius: 10, background: confirmModal.confirmColor || "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13 }}>{confirmModal.confirmLabel || "Reset"}</button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE CODE MODAL */}
      {showShareModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 20, width: "100%", maxWidth: 520, padding: 28, boxShadow: "var(--shadow-modal)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <Link style={{ width: 18, height: 18, color: "var(--clr-blue)" }} />Share This Projection
              </h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: "none", border: "none", color: "var(--text-subtle)", cursor: "pointer" }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18, lineHeight: 1.5 }}>
              Copy the code below and send to your financial advisor or colleague. They paste it into the <strong style={{ color: "var(--text-main)" }}>Restore</strong> box to see your exact projection instantly.
            </p>

            {/* Profile Code */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--clr-emerald)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>📋 Your Encoded Profile Code</label>
              <textarea readOnly value={shareUrl} rows={4} onFocus={e => e.target.select()} style={{ width: "100%", padding: "10px 12px", background: "var(--bg-input)", border: "1px solid var(--border-strong)", borderRadius: 10, color: "var(--share-url-color)", fontSize: 10, outline: "none", resize: "none", fontFamily: "monospace", boxSizing: "border-box", lineBreak: "anywhere" }} />
            </div>
            <button onClick={executeCopy} className="cpf-btn-primary" style={{ width: "100%", padding: "11px", borderRadius: 12, background: "var(--clr-emerald)", color: "#ffffff", fontWeight: 800, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, marginBottom: 18 }}>
              <Copy style={{ width: 15, height: 15 }} />Copy Code to Clipboard
            </button>

            {/* Restore */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16, marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--clr-blue)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>📥 Restore from a Received Code</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input id="import-code-input" type="text" placeholder="Paste a received profile code here…" style={{ flex: 1, padding: "10px 12px", background: "var(--bg-input)", border: "1px solid var(--border-strong)", borderRadius: 10, color: "var(--text-bright)", fontSize: 11, outline: "none" }} />
                <button onClick={() => {
                  const val = document.getElementById("import-code-input")?.value?.trim();
                  if (!val) return;
                  try {
                    const decoded = lzDecompress(val);
                    const parsed = JSON.parse(decoded);
                    const rawInp = parsed.inputs || parsed;
                    // Whitelist — same guard as JSON file import
                    const safeInp = { ...DEFAULT_INPUTS };
                    Object.keys(DEFAULT_INPUTS).forEach(k => { if (rawInp[k] !== undefined) safeInp[k] = rawInp[k]; });
                    setInputs(safeInp);
                    if (parsed.highlightPlan) setHighlightPlan(parsed.highlightPlan);
                    if (parsed.viewMode) setViewMode(parsed.viewMode);
                    if (parsed.basicPremiumPct != null) setBasicPremiumPct(parsed.basicPremiumPct);
                    if (parsed.scenarioLabelA != null) setScenarioLabelA(parsed.scenarioLabelA);
                    if (parsed.scenarioLabelB != null) setScenarioLabelB(parsed.scenarioLabelB);
                    if (parsed.whatIfPayoutAge != null) setWhatIfPayoutAge(parsed.whatIfPayoutAge);
                    if (parsed.whatIfSaTopup != null) setWhatIfSaTopup(parsed.whatIfSaTopup);
                    if (parsed.whatIfHousing != null) setWhatIfHousing(parsed.whatIfHousing);
                    if (parsed.whatIfSalaryBump != null) setWhatIfSalaryBump(parsed.whatIfSalaryBump);
                    if (parsed.showWhatIf != null) setShowWhatIf(parsed.showWhatIf);
                    if (parsed.isRealDollars != null) setIsRealDollars(parsed.isRealDollars);
                    // Scenario restore — handle both formats:
                    //   New format (V4-2026+): scenarioAInputs key holds just inputs; projection recalculated.
                    //   Old format (pre-Fix 2): scenarioA.inputs + scenarioA.projection stored directly.
                    // This mirrors the URL-parameter decode logic at the top of the mount useEffect.
                    let scenariosRestored = false;
                    if ('scenarioAInputs' in parsed) {
                      if (parsed.scenarioAInputs && typeof parsed.scenarioAInputs === 'object') {
                        const safeScenA = { ...DEFAULT_INPUTS };
                        Object.keys(DEFAULT_INPUTS).forEach(k => { if (parsed.scenarioAInputs[k] !== undefined) safeScenA[k] = parsed.scenarioAInputs[k]; });
                        setScenarioA({ inputs: safeScenA, projection: runProjectionEngine(safeScenA), payoutProj: null });
                        scenariosRestored = true;
                      } else { setScenarioA(null); } // explicit null = no scenario in this code
                    } else if (parsed.scenarioA && parsed.scenarioA.inputs && parsed.scenarioA.projection) {
                      // BUG-6 fix: old-format code with embedded projection — was restored as-is
                      // (stale rows, missing newer fields). Now regenerate from sanitised inputs.
                      const safeOldScenA = { ...DEFAULT_INPUTS };
                      Object.keys(DEFAULT_INPUTS).forEach(k => { if (parsed.scenarioA.inputs[k] !== undefined) safeOldScenA[k] = parsed.scenarioA.inputs[k]; });
                      setScenarioA({ inputs: safeOldScenA, projection: runProjectionEngine(safeOldScenA), payoutProj: null, label: parsed.scenarioA.label });
                      scenariosRestored = true;
                    } else { setScenarioA(null); }
                    if ('scenarioBInputs' in parsed) {
                      if (parsed.scenarioBInputs && typeof parsed.scenarioBInputs === 'object') {
                        const safeScenB = { ...DEFAULT_INPUTS };
                        Object.keys(DEFAULT_INPUTS).forEach(k => { if (parsed.scenarioBInputs[k] !== undefined) safeScenB[k] = parsed.scenarioBInputs[k]; });
                        setScenarioB({ inputs: safeScenB, projection: runProjectionEngine(safeScenB), payoutProj: null });
                        scenariosRestored = true;
                      } else { setScenarioB(null); }
                    } else if (parsed.scenarioB && parsed.scenarioB.inputs && parsed.scenarioB.projection) {
                      // BUG-6 fix: same as Scenario A — regenerate from sanitised inputs.
                      const safeOldScenB = { ...DEFAULT_INPUTS };
                      Object.keys(DEFAULT_INPUTS).forEach(k => { if (parsed.scenarioB.inputs[k] !== undefined) safeOldScenB[k] = parsed.scenarioB.inputs[k]; });
                      setScenarioB({ inputs: safeOldScenB, projection: runProjectionEngine(safeOldScenB), payoutProj: null, label: parsed.scenarioB.label });
                      scenariosRestored = true;
                    } else { setScenarioB(null); }
                    setShowShareModal(false);
                    showToast(scenariosRestored
                      ? "✓ Profile restored — Compare scenarios loaded (projections recalculated)"
                      : "✓ Profile restored — all settings loaded");
                  } catch (e) { alert("Invalid code — please check and try again."); }
                }} style={{ padding: "10px 18px", borderRadius: 10, background: "var(--clr-blue2)", color: "#fff", fontWeight: 800, border: "none", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>Load</button>
              </div>
            </div>

            {/* Deploy tip */}
            <div style={{ background: "rgba(var(--clr-amber3-rgb),0.07)", border: "1px solid rgba(var(--clr-amber3-rgb),0.2)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-amber)", marginBottom: 4 }}>🌐 Want a shareable public URL?</div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>Deploy the ZIP to <strong style={{ color: "var(--text-main)" }}>Vercel</strong> or <strong style={{ color: "var(--text-main)" }}>Netlify</strong> (free, ~2 min). Anyone with the URL can open the app and paste your code to see your exact projection. Use <strong style={{ color: "var(--text-main)" }}>Export Profile</strong> (💾) to back up your full .json file locally.</p>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP EXPORT MODAL */}
      {exportModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(8px)", zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 20, width: "100%", maxWidth: exportModal.type === "pdf" ? "1040px" : "740px", maxHeight: "94vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-modal)" }}>

            {/* ── Header ── */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-bright)", margin: "0 0 3px" }}>
                  {exportModal.type === "pdf" && "📄 PDF Report"}
                  {exportModal.type === "csv" && "📊 CSV Export — Year-by-Year Projection"}
                  {exportModal.type === "json" && "💾 Profile Backup — JSON"}
                  {exportModal.type === "print" && "🖨️ Data Table — Plain Text"}
                  {exportModal.type === "milestone" && "🎯 Milestone Report"}
                </h3>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
                  {exportModal.type === "pdf" && "Preview your report below. Use the buttons to print or save as PDF."}
                  {exportModal.type === "csv" && "Click Download to save the file, or select-all and copy to paste into Excel / Google Sheets."}
                  {exportModal.type === "json" && "Click Download to save your profile backup as a .json file."}
                  {(exportModal.type === "print" || exportModal.type === "milestone") && "Select all and copy, then paste into any text editor or spreadsheet."}
                </p>
              </div>
              <button onClick={() => setExportModal(null)} style={{ background: "none", border: "none", color: "var(--text-subtle)", cursor: "pointer", flexShrink: 0, marginLeft: 16, marginTop: 2 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>

            {/* ── Action bar ── */}
            <div style={{ padding: "10px 16px", flexShrink: 0, display: "flex", gap: 8, flexWrap: "wrap", background: "var(--bg-muted)", borderBottom: "1px solid var(--border-subtle)", alignItems: "center" }}>
              {/* PDF actions */}
              {exportModal.type === "pdf" && (<>
                {/* Orientation: Chrome ignores @page size — user sets it in the print dialog */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "rgba(var(--clr-amber-rgb),0.08)", border: "1px solid rgba(var(--clr-amber-rgb),0.25)", fontSize: 10, color: "var(--clr-amber)" }}>
                  <span style={{ fontWeight: 700 }}>Landscape:</span> In print dialog → <strong style={{ color: "var(--text-main)" }}>More settings → Layout → Landscape</strong>
                </div>
                <button onClick={() => {
                  // Use the preview iframe directly — most reliable for @page CSS
                  const iframe = document.getElementById("pdf-preview-frame");
                  if (iframe?.contentDocument) {
                    try {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                      showToast("🖨️ Print dialog open — set destination to Save as PDF");
                    } catch (e) {
                      // Fallback: open blob in new tab
                      const blob = new Blob([exportModal.content], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      const win = window.open(url, "_blank");
                      if (win) { win.onload = () => { setTimeout(() => { win.focus(); win.print(); URL.revokeObjectURL(url); }, 600); }; }
                      else { URL.revokeObjectURL(url); showToast("⚠️ Allow pop-ups then try again"); }
                    }
                  } else {
                    const blob = new Blob([exportModal.content], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const win = window.open(url, "_blank");
                    if (win) { win.onload = () => { setTimeout(() => { win.focus(); win.print(); URL.revokeObjectURL(url); }, 600); }; showToast("📄 Print dialog opening"); }
                    else { URL.revokeObjectURL(url); showToast("⚠️ Allow pop-ups then try again"); }
                  }
                }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, background: "var(--clr-emerald)", color: "#ffffff", fontWeight: 800, border: "none", cursor: "pointer", fontSize: 12 }}>
                  <Printer style={{ width: 14, height: 14 }} />Print / Save as PDF
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(var(--clr-blue-rgb),0.08)", border: "1px solid rgba(var(--clr-blue-rgb),0.2)", fontSize: 10, color: "var(--text-muted)" }}>
                  In print dialog → destination: <strong style={{ color: "var(--text-main)", margin: "0 3px" }}>"Save as PDF"</strong> → click Save
                </div>
              </>)}

              {/* CSV / JSON download */}
              {(exportModal.type === "csv" || exportModal.type === "json") && (<>
                <button onClick={() => {
                  const mimeType = exportModal.type === "csv" ? "text/csv" : "application/json";
                  const fname = exportModal.filename || (exportModal.type === "csv" ? "projection.csv" : "profile.json");
                  try {
                    const blob = new Blob([exportModal.content], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = fname;
                    document.body.appendChild(a); a.click();
                    setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 500);
                    showToast(`✓ Downloading ${fname}`);
                  } catch (e) { showToast("Download blocked — select all text below and paste into a new file"); }
                }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, background: "var(--clr-emerald)", color: "#ffffff", fontWeight: 800, border: "none", cursor: "pointer", fontSize: 12 }}>
                  <Download style={{ width: 14, height: 14 }} />Download {exportModal.type === "csv" ? "CSV" : "JSON"} File
                </button>
                <button onClick={() => {
                  const el = document.getElementById("export-modal-content");
                  if (el) { el.select(); try { document.execCommand("copy"); showToast("✓ Copied to clipboard"); } catch (e) { showToast("Press Ctrl+A then Ctrl+C to copy"); } }
                }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(var(--clr-blue-rgb),0.12)", color: "var(--clr-blue)", fontWeight: 700, border: "1px solid rgba(var(--clr-blue-rgb),0.3)", cursor: "pointer", fontSize: 12 }}>
                  <Copy style={{ width: 13, height: 13 }} />Select All &amp; Copy
                </button>
              </>)}

              {/* Text print / milestone */}
              {(exportModal.type === "print" || exportModal.type === "milestone") && (
                <button onClick={() => {
                  const el = document.getElementById("export-modal-content");
                  if (el) { el.select(); try { document.execCommand("copy"); showToast("✓ Copied — paste into any app and print"); } catch (e) { showToast("Press Ctrl+A then Ctrl+C to copy"); } }
                }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, background: "var(--clr-emerald)", color: "#ffffff", fontWeight: 800, border: "none", cursor: "pointer", fontSize: 12 }}>
                  <Copy style={{ width: 13, height: 13 }} />Select All &amp; Copy
                </button>
              )}
            </div>

            {/* ── Content area ── */}
            <div style={{ flex: 1, overflow: "auto", padding: exportModal.type === "pdf" ? 0 : 12 }}>
              {exportModal.type === "pdf" ? (
                <iframe id="pdf-preview-frame" srcDoc={exportModal.content} style={{ width: "100%", height: "100%", minHeight: 560, border: "none", background: "#fff" }} title="PDF Report Preview" />
              ) : (
                <textarea id="export-modal-content" readOnly value={exportModal.content}
                  style={{ width: "100%", height: "100%", minHeight: 420, padding: 12, background: "var(--code-bg)", border: "1px solid var(--border-strong)", borderRadius: 10, color: "var(--code-text)", fontSize: 11, fontFamily: "monospace", resize: "none", outline: "none", lineHeight: 1.5, boxSizing: "border-box" }}
                  onFocus={e => e.target.select()}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ONBOARDING MODAL */}
      {/* PRESET PROFILES MODAL */}
      {showPresets && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.88)", backdropFilter: "blur(6px)", zIndex: 99998, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-panel)", borderRadius: 20, border: "1px solid var(--border-strong)", width: "100%", maxWidth: 640, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: "var(--text-bright)", margin: 0 }}>Sample Profiles</h3>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>Load a pre-built scenario to explore the tool — all values can be edited after loading.</p>
              </div>
              <button onClick={() => setShowPresets(false)} style={{ background: "none", border: "none", color: "var(--text-subtle)", cursor: "pointer", padding: 4 }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ padding: "16px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {PRESET_PROFILES.map(p => (
                <button key={p.id} onClick={() => {
                  const merged = { ...DEFAULT_INPUTS, ...p.inputs };
                  setInputs(merged);
                  // BUG-12 fix: stamp lastSavedRef so the beforeunload "unsaved changes"
                  // guard doesn't fire the moment a user navigates away after loading a
                  // preset — the profile was just loaded fresh, nothing has changed yet.
                  lastSavedRef.current = JSON.stringify(merged);
                  setInputErrors({});
                  // Clear scenario comparison slots — a sample profile is a fresh start;
                  // leaving stale scenarios from the previous session would show mismatched
                  // Compare data (old profile's scenarios vs. new profile's inputs).
                  setScenarioA(null);
                  setScenarioB(null);
                  setScenarioLabelA("");
                  setScenarioLabelB("");
                  // Clear What-If overrides — old values are meaningless against new inputs.
                  setShowWhatIf(false);
                  setWhatIfPayoutAge(null);
                  setWhatIfSaTopup(null);
                  setWhatIfHousing(null);
                  setWhatIfSalaryBump(null);
                  setWhatIfContribStop(null);
                  setWhatIfOaDrawdown(null);
                  setWhatIfSrsContrib(null);
                  setWhatIfPrivGrowth(null);
                  setShowPresets(false);
                  showToast(`✓ Loaded: ${p.label}`);
                }} style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--bg-muted)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", textAlign: "left", width: "100%", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--clr-amber)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}
                >
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{p.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-bright)", marginBottom: 3 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{p.desc}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--clr-amber)", fontWeight: 700, flexShrink: 0 }}>Load →</div>
                </button>
              ))}
            </div>
            <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-base)", borderRadius: "0 0 20px 20px" }}>
              <p style={{ fontSize: 10, color: "var(--text-subtle)", margin: 0 }}>⚠ Loading a sample profile will overwrite your current inputs. Export your profile first if you want to keep it.</p>
            </div>
          </div>
        </div>
      )}
      {showWelcome && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 24, width: "100%", maxWidth: 640, height: "min(90vh,700px)", overflow: "hidden", boxShadow: "var(--shadow-modal)", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div className="cpf-welcome-header" style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ background: "#10b98122", padding: 10, borderRadius: 12 }}>
                  {welcomeStep === 0 && <Calculator style={{ width: 24, height: 24, color: "var(--clr-emerald)" }} />}
                  {welcomeStep === 1 && <User style={{ width: 24, height: 24, color: "var(--clr-blue2)" }} />}
                  {welcomeStep === 2 && <LayoutDashboard style={{ width: 24, height: 24, color: "var(--clr-purple)" }} />}
                  {welcomeStep === 3 && <Lightbulb style={{ width: 24, height: 24, color: "var(--clr-amber)" }} />}
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-bright)", marginBottom: 2 }}>
                    {welcomeStep === 0 && "Welcome to CPF Planner Pro"}
                    {welcomeStep === 1 && "Setting Up Your Profile"}
                    {welcomeStep === 2 && "Exploring the Dashboard"}
                    {welcomeStep === 3 && "Advanced Features & Disclaimer"}
                  </h2>
                  <p style={{ color: "var(--text-subtle)", fontSize: 11, margin: 0 }}>
                    {welcomeStep === 0 && "Your end-to-end Singapore retirement simulation engine"}
                    {welcomeStep === 1 && "Step 1 of 3 — The Input Engine (left panel)"}
                    {welcomeStep === 2 && "Step 2 of 3 — The right panel tabs"}
                    {welcomeStep === 3 && "Step 3 of 3 — Power tools and legal notice"}
                  </p>
                </div>
              </div>
              <button onClick={closeWelcome} style={{ background: "none", border: "none", color: "var(--text-subtle)", cursor: "pointer" }}><X style={{ width: 20, height: 20 }} /></button>
            </div>

            {/* Body */}
            <div className="cpf-welcome-body" style={{ padding: "18px 20px", flex: "1 1 0", minHeight: 0, overflowY: "auto" }}>
              {welcomeStep === 0 && (
                <>
                  <p style={{ color: "var(--text-main)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>This tool models your entire CPF journey — from today's balances through to monthly payouts in retirement — using <strong>2026 CPF Board rates and policies</strong>.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                    {[
                      ["Year-by-year accumulation", TrendingUp], ["CPF LIFE plan comparison", ShieldCheck],
                      ["Monte Carlo stress testing (Mild / Base / Stress variance)", Activity], ["Milestone alerts", Bell],
                      ["OA→SA / OA→RA transfers + ⚡ Fill Gap", ArrowRightLeft], ["Holistic Strategy & income gap analysis", Target],
                      ["OA Drawdown decumulation engine", Download], ["What-If Explorer sliders", SlidersHorizontal],
                      ["SRS — tax-deferred retirement savings", BookOpen], ["Property Monetisation (LBS / downgrade)", Home],
                      ["Die with Zero — PMT draw-down planner", Clock], ["7 sample profiles to explore instantly", Users],
                      ["PR G/G & F/G contribution rates", Users], ["Recurring / One-Time frequency toggles", ArrowRightLeft],
                      ["For Loved One CPF transfers (OA→MA / OA→SA / OA→RA)", Users], ["Annual Cashflow Ledger", TableIcon],
                      ["Education Loan from OA (40% ceiling)", BookOpen], ["PwD MRSS bypass (age-55 waiver)", ShieldCheck],
                      ["MMSS — MA top-up matching grant", Gift], ["SA / RA balance split view at age 55", Split],
                      ["Retirement Sum Growth — adjustable FRS/BHS projection rate", TrendingUp], ["Phased Salary & Career Break modelling", Briefcase],
                      ["Life Events & Stress Testing (retrenchment, medical, windfall)", Activity],
                    ].map(([text, Icon], i) => (
                      <div key={i} style={{ background: "var(--bg-muted)", padding: "12px 16px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--border-subtle)" }}>
                        <Icon style={{ width: 16, height: 16, color: "var(--clr-emerald)" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-highlight)" }}>{text}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "var(--bg-base)", padding: 16, borderRadius: 12, border: "1px solid var(--border-subtle)" }}>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}><strong style={{ color: "var(--text-bright)" }}>Data stays on your device.</strong> Use <strong style={{ color: "var(--text-bright)" }}>Export Profile</strong> to back up your inputs as a JSON file, or Share to generate an encoded profile code you can send to others. Hit <strong style={{ color: "var(--text-bright)" }}>Samples</strong> in the header to load a pre-built profile and explore the tool instantly.</p>
                  </div>
                </>
              )}
              {welcomeStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    ["1", "Enter your CPF balances & select citizenship", "Type your current OA, SA, and MA balances. Select Male or Female — this sets the correct CPF LIFE payout ratio. Select SC or PR — citizenship gates which schemes apply (MRSS/MMSS are SC-only; PR Year 1/2 use lower contribution rates). The progress bars compare against the 2026 FRS ($220,400), ERS ($440,800), and BHS ($79,000) milestones.", "var(--clr-blue2)"],
                    ["2", "Auto-Calc your contributions", "Click ⚡ Auto-Calc in the Mandatory Contributions panel. Enter OW (Monthly Gross), AW (Annual Bonus), and Salary Growth %, then hit the button. SC uses full rates. PR: select tenure year (1/2/3+) and rate type — G/G (graduated employer, default) or F/G (full employer 17%, requires joint CPF application). The engine advances PR tiers automatically year by year. Use Phase 2 / Career Break (below Salary Growth) to model a growth rate change at a specific age or a contribution pause (e.g. sabbatical, NS, parental leave). Set Retirement Sum Growth (default 3%) to control how fast the FRS/BHS targets rise.", "var(--clr-emerald)"],
                    ["3", "Inflows, Outflows & CPF Transfers", "The Inflows panel has: VC3A (single cash lump-sum, auto-split by age-band), RSTU (SA/RA cash top-up, tax-relievable), VHR, gov grants, MRSS (RA top-up, up to $2,000/yr · RA below BRS), MMSS (MA match, up to $1,000/yr), and WIS/Workfare (60% CPF for employees, 90% MA for SEPs). Outflows: Housing Loan (OA), medical, CPFIS. CPF Transfers: OA→MA, OA→SA (pre-55, capped at FRS), and OA→RA (age 55+, capped at ERS).", "var(--clr-purple)"],
                    ["4", "Set your life-phase timelines", "Use Contrib Stop Age (when you retire) and Housing Stop Age (when your mortgage ends) to model real-world cash flow transitions accurately.", "var(--clr-amber)"],
                    ["5", "Set up SRS (optional)", "If you contribute to the Supplementary Retirement Scheme, enter your SRS balance, annual contribution, and drawdown start age in the SRS panel. Contributions are tax-deductible; 50% of withdrawals are taxable from age 63. All funds must be withdrawn within 10 years.", "var(--clr-emerald)"],
                                    ].map(([num, title, desc, color]) => (
                    <div key={num} style={{ display: "flex", gap: 16 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${color}22`, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{num}</div>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-bright)", marginBottom: 4 }}>{title}</h4>
                        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {welcomeStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    ["Summary", PieChart, "var(--clr-emerald)", "Key metrics at a glance: total CPF at payout age, 20% RA-to-OA transfer notice, net worth breakdown, milestone alerts, and the What-If Explorer sliders."],
                    ["Strategy", Target, "#f43f5e", "Holistic retirement income planner. Set a Target Monthly Income, then use ⚡ Fill Gap to auto-calculate the OA Drawdown needed to close the shortfall. Shows CPF LIFE + OA Drawdown + SRS + Private Assets in a Gantt timeline and income table. Displays real OA exhaustion age."],
                    ["Accumulation", BarChart3, "var(--clr-blue2)", "Stacked area chart of OA/SA/MA/RA year-by-year. Toggle Monte Carlo to overlay a P10–P90 confidence band from 200 simulations. Choose Mild (±0.5%), Base (±1%), or Stress (±2%) variance — the active band is shown on the Probability of Sufficiency badge."],
                    ["LIFE Comparison", ShieldCheck, "var(--clr-purple)", "Side-by-side payout curves for Standard, Escalating, and Basic plans. Basic payout = PMT formula; bequest in Phase 1 includes full premium refund. Vertical lines mark exact break-even ages."],
                    ["Compare", Split, "var(--clr-orange)", "Save two scenarios (e.g. retire at 65 vs 70) and view a colour-coded diff table showing every metric that changes between them."],
                    ["Data Table", TableIcon, "var(--clr-amber)", "Full year-by-year projection table with sticky Age column, Yield (B/S/E), and IRR %. Switch to the Cashflow Ledger sub-tab for a complete annual breakdown of every inflow, outflow, and interest component. Download either view as CSV."]
                  ].map(([title, Icon, color, desc]) => (
                    <div key={title}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${color}15`, border: `1px solid ${color}33`, padding: "4px 10px", borderRadius: 8, marginBottom: 8 }}>
                        <Icon style={{ width: 12, height: 12, color }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color }}>{title}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  ))}
                </div>
              )}
              {welcomeStep === 3 && (
                <div>
                  <div className="welcome-step3-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                    {[
                      ["Share Link", Link, "Generates a URL with your full profile encoded. Anyone opening the link sees your exact inputs and projection — no file needed."],
                      ["PDF Report", Download, "Print-ready 6-page report: cover, inputs & CPF LIFE, charts, projection & sensitivity, Decumulation Strategy (income table + OA exhaustion), milestones & disclaimer."],
                      ["SEP Mode", Briefcase, "Self-Employed mode: no mandatory contributions. VC3A up to $37,740/yr proportionally allocated. BHS, ERS, and AW ceiling enforced."],
                      ["Monte Carlo", Activity, "200 simulations with user-selectable variance: Mild ±0.5% / Base ±1% / Stress ±2%. Toggle in the Accumulation tab. Shows probability of meeting FRS at payout age and a live P10–P90 confidence band on the chart."],
                      ["Retirement Sum Growth", TrendingUp, "Control the annual rate at which FRS, BRS, ERS, and BHS targets rise (default 3%, CPF Board historical average). Lower it for a conservative FRS target; raise it for a pessimistic view. Preset buttons: 2% / 3% / 4%. Found in the Salary section."],
                      ["Phased Salary & Career Break", Briefcase, "Model two-phase salary growth (e.g. 4%/yr to age 45, then 1%/yr after) or pause contributions entirely for a career break age range (sabbatical, NS, parental leave). Both affect all mandatory contribution projections. Found in the Salary section below Retirement Sum Growth."],
                      ["Life Events", Activity, "Overlay stress-test events: Retrenchment, Career Break (contributions pause), Medical Crisis (draws from OA/private), Windfall (one-off inflow), Early Retirement, or Hyperinflation. Visible as coloured bands on the Accumulation chart and a row in the Strategy Gantt. Found in the Life Events panel."],
                      ["SRS", BookOpen, "Supplementary Retirement Scheme — tax-deductible contributions up to $15,300/yr (SC/PR). 50% of withdrawals taxable from age 63. Must deplete within 10 years of first withdrawal. Modelled in the SRS panel."],
                      ["Property Monetisation", Home, "Model a one-time monetisation event: downgrade, Lease Buyback Scheme, or Silver Housing Bonus. Net cash proceeds go to private assets; RA top-up credited to RA. Now in the Property & Timelines panel."],
                      ["Die with Zero Mode", Clock, "Toggle in Decumulation & Goals. Uses the PMT annuity formula to compute the optimal monthly draw from OA, SRS, and Private Assets so all reach $0 at your target age. RA/CPF LIFE cannot be depleted."],
                      ["Sample Profiles", Users, "7 pre-built scenarios (Blank Slate, Typical Employee, Late Starter, SEP, High Earner, Near Retirement, Post-55). Load from the Samples button in the header — a great way to explore the tool quickly."],
                      ["OA→SA / OA→RA Transfer", ArrowRightLeft, "Pre-55: transfer OA to SA (capped at FRS). Age 55+: SA closes — transfer OA to RA instead (capped at ERS, $440,800). Both earn 4% vs 2.5%. Irreversible. No tax relief. CPF Transfers panel."],
                      ["OA Drawdown & ⚡ Fill Gap", Download, "Draw monthly cash from OA post-retirement to supplement CPF LIFE. Set a Target Monthly Income, then click ⚡ Fill Gap to auto-calculate the exact OA draw needed. Shows OA exhaustion age and sustainability warning."],
                      ["Property Pledge", Target, "Only BRS needed in RA at 55 (not FRS). Reduces locked-in RA but also reduces monthly CPF LIFE payouts. Toggle in Advanced panel."],
                      ["MRSS Grant", Gift, "Matched Retirement Savings Scheme — govt matches RSTU cash top-ups up to $2,000/yr (lifetime cap $20,000) for Singapore Citizens aged 55+ with RA below BRS."],
                      ["What-If Explorer", SlidersHorizontal, "Drag sliders to instantly see how changing payout age, SA top-ups, or housing affects your outcome. Hover any point on the What-If chart for a full per-account breakdown tooltip."],
                      ["Gender Toggle", Users, "Male/Female selection (Profile section). Affects CPF LIFE payout — female payouts are ~7% lower (0.93× male) due to longer statistical life expectancy. Estimates based on 2026 CPF Board Estimator data."],
                      ["MMSS Grant", Gift, "Matched MediSave Savings Scheme — govt tops up MA dollar-for-dollar up to $1,000/yr for Singapore Citizens aged 55–70 with MA below half of the Basic Healthcare Sum (~$39,500). SC only. Auto-assessed."],
                      ["Education Loan from OA", BookOpen, "Model CPF Education Scheme withdrawals. Engine enforces the 40% OA ceiling (based on accumulated OA savings) and the age 55+ FRS-first rule. Modelled as a pure OA outflow in the Outflows panel."],
                      ["PwD MRSS Bypass", ShieldCheck, "Enable the Person with Disabilities (PwD) flag in Profile to unlock MRSS eligibility below age 55. PwD members are exempt from the age-55 requirement for the Matched Retirement Savings Scheme. SC only."],
                      ["PR G/G & F/G Rates", Users, "PR members in Year 1 or 2 can select G/G (graduated employer, default) or F/G (full employer 17% — requires joint CPF application). The engine automatically advances Yr 1 → Yr 2 → Yr 3+ rates year-by-year in the projection."],
                      ["Recurring / One-Time Toggles", ArrowRightLeft, "Every inflow and outflow field has a frequency toggle. 'Recurring' applies the amount every projection year. 'One-Time' applies it only in the first projection year — ideal for lump-sum top-ups or one-off withdrawals."],
                    ].map(([title, Icon, desc]) => (
                      <div key={title} style={{ background: "var(--bg-muted)", padding: "12px", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <Icon style={{ width: 14, height: 14, color: "var(--clr-blue2)" }} />
                          <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)" }}>{title}</h4>
                        </div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}>{desc}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(var(--clr-amber3-rgb),0.08)", border: "1px solid rgba(var(--clr-amber3-rgb),0.3)", padding: "12px 14px", borderRadius: "10px" }}>
                    <p style={{ fontSize: 10, color: "var(--clr-amber)", lineHeight: 1.6, textAlign: "justify" }}><strong style={{ fontWeight: 800 }}>Legal Disclaimer:</strong> {LEGAL_DISCLAIMER} By using this tool, you acknowledge and accept that you are using the information provided at your own risk.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="cpf-welcome-footer" style={{ padding: "20px 32px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-base)" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ width: i === welcomeStep ? 24 : 8, height: 8, borderRadius: 4, background: i === welcomeStep ? "var(--clr-emerald)" : "var(--border-strong)", transition: "all 0.3s" }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {welcomeStep > 0 && <button onClick={() => setWelcomeStep(s => s - 1)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--bg-panel)", color: "var(--text-highlight)", border: "1px solid var(--border-strong)", cursor: "pointer" }}>Back</button>}
                {welcomeStep < 3 ? (
                  <button onClick={() => setWelcomeStep(s => s + 1)} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "var(--clr-emerald)", color: "#ffffff", border: "none", cursor: "pointer" }}>Next &rarr;</button>
                ) : (
                  <button onClick={closeWelcome} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "var(--clr-emerald)", color: "#ffffff", border: "none", cursor: "pointer" }}>I Understand &mdash; Start Planning</button>
                )}
                <button onClick={closeWelcome} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-strong)", cursor: "pointer" }}>Skip</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{ background: "var(--header-bg)", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0, zIndex: 50, backdropFilter: "blur(8px)" }}>
        <div className="cpf-page-wrap" data-mode={desktopMode} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div className="cpf-calc-icon-box" style={{ background: "var(--clr-emerald)", padding: 8, borderRadius: 12 }}>
              <Calculator style={{ color: "#ffffff", width: 18, height: 18 }} />
            </div>
            <div>
              <div className="cpf-logo-text" style={{ fontWeight: 900, fontSize: 16, background: "linear-gradient(90deg,#10b981,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", whiteSpace: "nowrap" }}>CPF Planner Pro</div>
              <div className="cpf-logo-sub" style={{ fontSize: 9, color: "var(--clr-emerald)", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Retirement Engine v2026</div>
            </div>
          </div>
          <div className="cpf-header-actions" style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 auto", minWidth: 0 }}>
            {/* Sidebar toggle — tablet/mobile only via CSS */}
            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(v => !v)} style={{ display: "none", alignItems: "center", justifyContent: "center", gap: 5, background: sidebarOpen ? "rgba(var(--clr-emerald-rgb),0.12)" : "var(--bg-panel)", border: `1px solid ${sidebarOpen ? "rgba(var(--clr-emerald-rgb),0.4)" : "var(--border-strong)"}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: sidebarOpen ? "var(--clr-green)" : "var(--text-muted)" }}>
              <SlidersHorizontal style={{ width: 14, height: 14 }} />
              <span style={{ fontSize: 10, fontWeight: 700 }}>{sidebarOpen ? "Inputs ▲" : "Inputs ▼"}</span>
            </button>
            {/* Mobile hamburger menu button */}
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(v => !v)} style={{ alignItems: "center", justifyContent: "center", background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "var(--text-muted)" }}>
              <AlignJustify style={{ width: 18, height: 18 }} />
            </button>
            {/* Real vs Nominal Toggle */}
            <div style={{ display: "flex", background: "var(--bg-panel)", padding: 4, borderRadius: 8, border: "1px solid var(--border-strong)" }}>
              <button onClick={() => setIsRealDollars(false)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: !isRealDollars ? "var(--ctrl-active-bg)" : "transparent", color: !isRealDollars ? "#ffffff" : "var(--text-muted)" }}>Nom.</button>
              <button onClick={() => setIsRealDollars(true)} style={{ padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: isRealDollars ? "var(--ctrl-active-bg)" : "transparent", color: isRealDollars ? "#ffffff" : "var(--text-muted)" }}>Real</button>
            </div>

            <button onClick={handleReset} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(239,68,68,0.12)", color: "var(--clr-red)", padding: "6px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid rgba(239,68,68,0.35)", cursor: "pointer" }} title="Reset all inputs and scenarios to defaults">
              <RotateCcw style={{ width: 12, height: 12 }} />Reset
            </button>
            {/* Rev#18: Unsaved changes badge — appears when inputs differ from last export/import/reset */}
            {hasUnsaved && (
              <span title="Inputs have changed since last export — click Export Profile to save" style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(var(--clr-amber-rgb),0.15)", color: "var(--clr-amber)", padding: "6px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid rgba(var(--clr-amber-rgb),0.4)", animation: "unsavedPulse 2.4s ease-in-out infinite", whiteSpace: "nowrap", userSelect: "none" }}>
                ● Unsaved
              </span>
            )}
            <button onClick={() => setShowPresets(true)} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(var(--clr-amber-rgb),0.12)", color: "var(--clr-amber)", padding: "6px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid rgba(var(--clr-amber-rgb),0.3)", cursor: "pointer" }} title="Load a sample scenario to explore different profiles">
              <Users style={{ width: 12, height: 12 }} />Samples
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(var(--clr-blue2-rgb),0.1)", color: "var(--clr-blue)", padding: "6px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid rgba(var(--clr-blue2-rgb),0.3)", cursor: "pointer" }} title="Load a previously saved JSON profile">
              <Upload style={{ width: 12, height: 12 }} />Import Profile<input type="file" accept=".json" style={{ display: "none" }} onChange={handleImportProfile} />
            </label>
            <button onClick={handleExportProfile} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(var(--clr-blue2-rgb),0.1)", color: "var(--clr-blue)", padding: "6px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid rgba(var(--clr-blue2-rgb),0.3)", cursor: "pointer" }} title="Save inputs as a JSON backup file">
              <Download style={{ width: 12, height: 12 }} />Export Profile
            </button>
            <button onClick={() => {
              try {
                const fullState = { inputs: debouncedInputs, activeTab, highlightPlan, viewMode, basicPremiumPct, scenarioLabelA, scenarioLabelB, scenarioAInputs: scenarioA?.inputs ?? null, scenarioBInputs: scenarioB?.inputs ?? null, whatIfPayoutAge, whatIfSaTopup, whatIfHousing, whatIfSalaryBump, showWhatIf, isRealDollars, pdfOrientation, appVersion: "V4-2026" }; // Fix 2: scenario inputs included; Bug5-SL: debouncedInputs so link matches visible projection
              } catch (e) { showToast("Could not generate share link: " + e.message); }
            }} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(var(--clr-blue2-rgb),0.1)", color: "var(--clr-blue)", padding: "6px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid rgba(var(--clr-blue2-rgb),0.3)", cursor: "pointer" }} title="Copy a shareable URL encoding all inputs, active tab, and Compare scenario slots A &amp; B. Anyone opening this link sees your exact projection. Use Export Profile for a JSON backup.">
              <Link style={{ width: 12, height: 12 }} />Share Link
            </button>
            <button onClick={() => generatePDF({
              inputs, debouncedInputs, pdfOrientation, isRealDollars,
              highlightPlan, isSelfEmployed, basicPremiumPct,
              projection, payoutProjection, accumulationByAge, payoutByAge,
              lifePlans, milestones, monteCarloData,
              intersectionEscVsStd, intersectionStdVsBasic,
              intersectionEscVsBasic, intersectionEscPayVsStdPay,
              effectiveOaDrawMonthly, effectiveOaDrawStartAge, effectiveOaDrawFloor,
              setIsGeneratingPdf, setExportModal, showToast,
              orientOverride: undefined,
            })} disabled={isGeneratingPdf} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(var(--clr-emerald-rgb),0.15)", color: "var(--clr-green)", padding: "6px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid rgba(var(--clr-emerald-rgb),0.4)", cursor: "pointer", opacity: isGeneratingPdf ? 0.5 : 1 }} title="Generate a full PDF report with all charts and tables">
              {isGeneratingPdf ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> : <Printer style={{ width: 12, height: 12 }} />}PDF Report
            </button>

            {/* Desktop Viewport Mode: FHD / HD / Auto — hidden on mobile via .desktop-only */}
            <div className="desktop-only" style={{ display: "flex", background: "var(--bg-panel)", padding: 4, borderRadius: 8, border: "1px solid var(--border-strong)", gap: 0 }}>
              {[["fhd", "FHD", "1920px"], ["hd", "HD", "1440px"], ["auto", "Auto", ""]].map(([mode, label, sub]) => (
                <button key={mode} onClick={() => setDesktopMode(mode)} title={sub || "Follow screen width"} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", lineHeight: 1.3, background: desktopMode === mode ? "var(--ctrl-active-bg)" : "transparent", color: desktopMode === mode ? "#ffffff" : "var(--text-muted)" }}>
                  <span>{label}</span>
                  {sub && <span style={{ fontSize: 7, opacity: 0.55, fontWeight: 500 }}>{sub}</span>}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <div style={{ display: "flex", background: "var(--bg-panel)", padding: 4, borderRadius: 8, border: "1px solid var(--border-strong)" }}>
              <button onClick={() => setThemeMode('dark')} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: themeMode === 'dark' ? "var(--ctrl-active-bg)" : "transparent", color: themeMode === 'dark' ? "#ffffff" : "var(--text-muted)" }}>
                <Moon style={{ width: 11, height: 11 }} />Dark
              </button>
              <button onClick={() => setThemeMode('light')} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: themeMode === 'light' ? "var(--ctrl-active-bg)" : "transparent", color: themeMode === 'light' ? "#ffffff" : "var(--text-muted)" }}>
                <Sun style={{ width: 11, height: 11 }} />Light
              </button>
              <button onClick={() => setThemeMode('system')} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: themeMode === 'system' ? "var(--ctrl-active-bg)" : "transparent", color: themeMode === 'system' ? "#ffffff" : "var(--text-muted)" }}>
                <Monitor style={{ width: 11, height: 11 }} />System
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="cpf-mobile-menu">
          <div className="cpf-mobile-menu-row">
            <div style={{ display: "flex", background: "var(--bg-input)", padding: 4, borderRadius: 8, border: "1px solid var(--border-strong)" }}>
              <button onClick={() => setIsRealDollars(false)} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", background: !isRealDollars ? "var(--ctrl-active-bg)" : "transparent", color: !isRealDollars ? "#ffffff" : "var(--text-muted)" }}>Nominal</button>
              <button onClick={() => setIsRealDollars(true)} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", background: isRealDollars ? "var(--ctrl-active-bg)" : "transparent", color: isRealDollars ? "#ffffff" : "var(--text-muted)" }}>Real $</button>
            </div>
            <div style={{ display: "flex", background: "var(--bg-input)", padding: 4, borderRadius: 8, border: "1px solid var(--border-strong)" }}>
              <button onClick={() => setThemeMode('dark')} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", background: themeMode === 'dark' ? "var(--ctrl-active-bg)" : "transparent", color: themeMode === 'dark' ? "#ffffff" : "var(--text-muted)" }}>● Dark</button>
              <button onClick={() => setThemeMode('light')} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", background: themeMode === 'light' ? "var(--ctrl-active-bg)" : "transparent", color: themeMode === 'light' ? "#ffffff" : "var(--text-muted)" }}>○ Light</button>
            </div>
            {/* Sidebar toggle shortcut in mobile dropdown */}
            <button onClick={() => { setSidebarOpen(v => !v); setMobileMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: `1px solid ${sidebarOpen ? "rgba(var(--clr-emerald-rgb),0.4)" : "var(--border-strong)"}`, background: sidebarOpen ? "rgba(var(--clr-emerald-rgb),0.1)" : "rgba(100,116,139,0.15)", color: sidebarOpen ? "var(--clr-green)" : "var(--text-subtle)", cursor: "pointer" }}>
              <SlidersHorizontal style={{ width: 13, height: 13 }} />{sidebarOpen ? "Hide Inputs" : "Show Inputs"}
            </button>
          </div>
          <div className="cpf-mobile-menu-row">
            <button onClick={() => { setMobileMenuOpen(false); setShowPresets(true); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(var(--clr-amber-rgb),0.12)", color: "var(--clr-amber)", padding: "8px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid rgba(var(--clr-amber-rgb),0.3)", cursor: "pointer" }}>
              <Users style={{ width: 13, height: 13 }} />Samples
            </button>
            <button onClick={() => { setMobileMenuOpen(false); handleReset(); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.12)", color: "var(--clr-red)", padding: "8px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid rgba(239,68,68,0.35)", cursor: "pointer" }} title="Reset all inputs and scenarios to defaults">
              <RotateCcw style={{ width: 13, height: 13 }} />Reset
            </button>
            <label style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(var(--clr-blue2-rgb),0.1)", color: "var(--clr-blue)", padding: "8px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid rgba(var(--clr-blue2-rgb),0.3)", cursor: "pointer" }}>
              <Upload style={{ width: 13, height: 13 }} />Import Profile
              <input type="file" accept=".json" style={{ display: "none" }} onChange={handleImportProfile} />
            </label>
            {/* Rev#18: mobile unsaved badge — same logic as desktop */}
            {hasUnsaved && (
              <span title="Inputs have changed since last export" style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(var(--clr-amber-rgb),0.15)", color: "var(--clr-amber)", padding: "8px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid rgba(var(--clr-amber-rgb),0.4)", animation: "unsavedPulse 2.4s ease-in-out infinite", whiteSpace: "nowrap", userSelect: "none" }}>
                ● Unsaved
              </span>
            )}
            <button onClick={() => { setMobileMenuOpen(false); handleExportProfile(); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(var(--clr-blue2-rgb),0.1)", color: "var(--clr-blue)", padding: "8px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid rgba(var(--clr-blue2-rgb),0.3)", cursor: "pointer" }}>
              <Download style={{ width: 13, height: 13 }} />Export Profile
            </button>
            <button onClick={() => {
              setMobileMenuOpen(false);
              try {
                const fullState = { inputs: debouncedInputs, activeTab, highlightPlan, viewMode, basicPremiumPct, scenarioLabelA, scenarioLabelB, scenarioAInputs: scenarioA?.inputs ?? null, scenarioBInputs: scenarioB?.inputs ?? null, whatIfPayoutAge, whatIfSaTopup, whatIfHousing, whatIfSalaryBump, showWhatIf, isRealDollars, pdfOrientation, appVersion: "V4-2026" }; // Fix 2: scenario inputs included; Bug5-SL: debouncedInputs so link matches visible projection
                const code = lzCompress(JSON.stringify(fullState));
                const base = (window.location.origin + window.location.pathname).replace(/\/$/, '');
                const shareURL = `${base}?p=${code}`;
                if (navigator?.clipboard?.writeText) {
                  navigator.clipboard.writeText(shareURL).then(() => showToast("✓ Share link copied!")).catch(() => { prompt("Copy this link:", shareURL); });
                } else { prompt("Copy this link:", shareURL); }
              } catch (e) { showToast("Could not generate share link"); }
            }} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(var(--clr-blue2-rgb),0.1)", color: "var(--clr-blue)", padding: "8px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid rgba(var(--clr-blue2-rgb),0.3)", cursor: "pointer" }}>
              <Link style={{ width: 13, height: 13 }} />Share Link
            </button>
            <button onClick={() => { setMobileMenuOpen(false); generatePDF({
              inputs, debouncedInputs, pdfOrientation, isRealDollars,
              highlightPlan, isSelfEmployed, basicPremiumPct,
              projection, payoutProjection, accumulationByAge, payoutByAge,
              lifePlans, milestones, monteCarloData,
              intersectionEscVsStd, intersectionStdVsBasic,
              intersectionEscVsBasic, intersectionEscPayVsStdPay,
              effectiveOaDrawMonthly, effectiveOaDrawStartAge, effectiveOaDrawFloor,
              setIsGeneratingPdf, setExportModal, showToast,
              orientOverride: undefined,
            }); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(var(--clr-emerald-rgb),0.15)", color: "var(--clr-green)", padding: "8px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "1px solid rgba(var(--clr-emerald-rgb),0.4)", cursor: "pointer" }}>
              <Printer style={{ width: 13, height: 13 }} />PDF Report
            </button>
          </div>
        </div>
      )}

      {/* Mobile fixed-header spacer — hidden on desktop via CSS */}
      <div className="cpf-mobile-top-spacer" style={{ display: "none" }} />
      {isVcOverLimit && (
        <div style={{ background: "rgba(234,88,12,0.2)", borderBottom: "1px solid rgba(234,88,12,0.5)", padding: "8px 20px", textAlign: "center", color: "#fdba74", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <AlertTriangle style={{ width: 14, height: 14, color: "var(--clr-orange)" }} />VC Exceeds Available Limit ({formatCurrency(maxAllowableVC)})
        </div>
      )}
      <div
        className="cpf-layout"
        data-mode={desktopMode}
        style={{
          maxWidth: desktopMode === 'fhd' ? '1920px' : desktopMode === 'hd' ? '1440px' : '100%',
          flex: '1 1 0',
          overflow: 'hidden',
          background: 'var(--bg-base)'
        }}
      >
        {/* SIDEBAR — desktop: left column | tablet/mobile: collapsible strip */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          openSections={openSections}
          toggleSection={toggleSection}
          expandAllSections={expandAllSections}
          collapseAllSections={collapseAllSections}
          inputs={inputs}
          setInputs={setInputs}
          inputErrors={inputErrors}
          handleInputChange={handleInputChange}
          handleBlur={handleBlur}
          handleKeyDown={handleKeyDown}
          getDisplayValue={getDisplayValue}
          formatCurrency={formatCurrency}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
          is55Plus={is55Plus}
          isForeigner={isForeigner}
          isSelfEmployed={isSelfEmployed}
          isUnder16={isUnder16}
          debouncedInputs={debouncedInputs}
          projection={projection}
          projectionByAge={projectionByAge}
          displayAccumulation={displayAccumulation}
          oaToSaCrossover={oaToSaCrossover}
          gapAlert={gapAlert}
          rstuRef={rstuRef}
          effectiveOaDrawMonthly={effectiveOaDrawMonthly}
          effectiveOaDrawStartAge={effectiveOaDrawStartAge}
          oaExhaustAge={oaExhaustAge}
          eligibleRSTU={eligibleRSTU}
          showWisEligibility={showWisEligibility}
          setShowWisEligibility={setShowWisEligibility}
          handleAutoCalc={handleAutoCalc}
          handleSwitchToRSS={handleSwitchToRSS}
          leEditingId={leEditingId}
          setLeEditingId={setLeEditingId}
          leFormState={leFormState}
          setLeFormState={setLeFormState}
        />
        {/* Confidence badge comment cleaned up */}
        <section className="cpf-main-wrap" style={{ minWidth: 0, boxSizing: "border-box", width: "100%" }}>
          {/* Tabs + Persistent KPI Strip — sticky within the main scroll panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: "16px 16px 0 0", zIndex: 30, boxShadow: "var(--shadow-panel)" }}>
            {/* Tab navigation */}
            <div className="cpf-tabs" role="tablist" aria-label="Dashboard sections" style={{ display: "flex", flexWrap: "nowrap", justifyContent: "center", padding: "6px 6px 0", gap: 2, borderBottom: "1px solid var(--border-subtle)", overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
              {[["welcome", "Welcome", Lightbulb, "#64748b"], ["summary", "Summary", PieChart, "var(--clr-emerald)"], ["strategy", "Strategy", Target, "#f43f5e"], ["accumulation", "Growth", BarChart3, "var(--clr-blue2)"], ...(debouncedInputs.cpfScheme === 'rss' ? [["rss", "RSS", Clock, "var(--clr-blue)"]] : [["life", "LIFE", ShieldCheck, "var(--clr-purple)"]]), ["compare", "Compare", Split, "var(--clr-amber3)"], ["table", "Data Table", TableIcon, "var(--clr-slate)"], ["notes", "Docs", BookOpen, "var(--clr-blue)"]].map(([id, label, Icon, accent]) => {
                const isLifeLocked = id === "life" && isForeigner;
                return (
                <button key={id} role="tab" aria-selected={activeTab === id} aria-controls={`panel-${id}`}
                  onClick={() => { if (isLifeLocked) return; setActiveTab(id); }}
                  title={isLifeLocked ? "CPF LIFE — not available to foreigners" : undefined}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 14px", borderRadius: "10px 10px 0 0", fontSize: 11, fontWeight: 700, border: "none", cursor: isLifeLocked ? "not-allowed" : "pointer", background: activeTab === id ? "var(--bg-base)" : "transparent", color: activeTab === id ? accent : isLifeLocked ? "rgba(var(--clr-purple-rgb),0.3)" : "var(--text-muted)", borderBottom: activeTab === id ? `2px solid ${accent}` : "2px solid transparent", transition: "all 0.15s", whiteSpace: "nowrap", marginBottom: -1, opacity: isLifeLocked ? 0.45 : 1 }}>
                  <Icon style={{ width: 12, height: 12 }} />{label}{isLifeLocked && <span style={{ fontSize: 9, marginLeft: 2 }}>🔒</span>}
                </button>
                );
              })}
            </div>
            {/* Persistent KPI strip */}
            {activeTab !== "welcome" && activeTab !== "notes" && (
              <div className="kpi-strip" style={{ display: "flex", flexWrap: "nowrap", justifyContent: "center", gap: 0, background: "var(--bg-muted)", borderBottom: "1px solid var(--border-subtle)", overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
                {(() => {
                  const pa = payoutAge65; // CQ-2 fix: use debounced value to match displayProjection/displayAccumulation
                  // Use displayProjection (already inflation-adjusted when isRealDollars=true)
                  const paRow = displayProjectionByAge.get(pa)
                    || displayProjectionByAge.get(pa + 1)      // O(1) fallback — Map miss means pa is beyond projection horizon; next age is best available
                    || displayProjection[0];
                  // totalCpfAtPayout from displayAccumulation (also inflation-adjusted)
                  // REM-2d/2e fix: replaced O(n) displayAccumulation.find() with O(1) accumulationByAge.get()
                  const dispPayoutData = accumulationByAge.get(pa) || {};
                  const dispTotal = (dispPayoutData.oa || 0) + (dispPayoutData.sa || 0) + (dispPayoutData.ma || 0) + (dispPayoutData.ra || 0);
                  // RA at 55 — from displayAccumulation; if already past 55, use current RA
                  const ca2 = Number(inputs.currentAge) || 35;
                  const ra55Row = ca2 >= 55
                    ? displayAccumulation[0]  // current state — index 0 is current age, not age-keyed
                    : accumulationByAge.get(55);
                  const ra55 = ra55Row?.ra || 0;
                  const ra55Label = ca2 >= 55 ? "Current RA" : "RA at 55";
                  // RSS mode: replace CPF LIFE plan KPIs with RSS-specific figures
                  const isRSSKpi = debouncedInputs.cpfScheme === 'rss';
                  const rssCurrentRa = (accumulationByAge.get(ca2) || displayAccumulation[0])?.ra || Number(inputs.saBalance) || 0;
                  const rssAnnual = (Number(inputs.rssMonthlyPayout) || 0) * 12;
                  // Bug6-KPI fix: replaced simplified flat-4% depletion loop with a direct
                  // read from the engine projection. The old formula used only CPF_RATES.RA (4%)
                  // and ignored the 1% extra on first $60k and 1% extra on first $30k, producing
                  // a depletion age 2–5 years earlier than the RSS tab for typical balances.
                  // The engine already computes the authoritative answer — read rssDepletionAge
                  // from the last row that carries it (same pattern as milestones at line ~5300).
                  const rssDepEst = (() => {
                    if (!isRSSKpi || rssAnnual <= 0) return null;
                    for (let i = projection.length - 1; i >= 0; i--) {
                      if (projection[i]?.rssDepletionAge != null) return projection[i].rssDepletionAge;
                    }
                    return ">95";
                  })();
                  // rssIsGrowing: RA can never deplete when annual draw < RA interest at current balance.
                  // Use the live rssCurrentRa for the interest estimate (same logic as before, but
                  // the payout display now matches the RSS tab exactly).
                  const rssIsGrowing = rssDepEst === ">95" && rssAnnual > 0 && rssAnnual < rssCurrentRa * CPF_RATES.RA;
                  return isRSSKpi ? [
                    { label: "Current RA", value: formatCurrency(rssCurrentRa), color: "var(--clr-blue)", tip: "Current Retirement Account balance — this is drawn down each month under RSS" },
                    { label: "RSS Payout", value: inputs.rssMonthlyPayout > 0 ? formatCurrency(Number(inputs.rssMonthlyPayout)) + "/mo" : "Not set", color: inputs.rssMonthlyPayout > 0 ? "var(--clr-green)" : "var(--clr-red)", tip: "Your fixed CPF Board monthly payout under RSS" },
                    { label: "Annual Draw", value: rssAnnual > 0 ? formatCurrency(rssAnnual) + "/yr" : "—", color: "var(--clr-blue)", tip: "Total annual RSS drawdown from RA (monthly × 12)" },
                    { label: "Est. Depletion",
                      value: rssDepEst ? `Age ${rssDepEst}` : "—",
                      color: rssIsGrowing ? "var(--clr-amber)"
                           : (rssDepEst && typeof rssDepEst === "number" && rssDepEst < 85 ? "var(--clr-red)" : "var(--clr-green)"),
                      tip: rssIsGrowing
                        ? `RA is growing — your annual payout (${formatCurrency(rssAnnual)}/yr) is less than the 4% base interest your RA earns (~${formatCurrency(Math.round(rssCurrentRa * CPF_RATES.RA))}/yr). Increase your monthly payout above ~${formatCurrency(Math.ceil(rssCurrentRa * CPF_RATES.RA / 12))}/mo to project a depletion date.`
                        : `Projected age when RA reaches $0 under RSS — read directly from the engine projection (4% base + 1% extra on first $60k + 1% extra on first $30k). Matches the RSS tab depletion age exactly.` },
                    { label: "Migration", value: inputs.lifeMigrationAge > 0 ? `Age ${inputs.lifeMigrationAge} · ${{ bas: 'Basic', std: 'Std', esc: 'Esc' }[inputs.lifePlanAtMigration || 'std']}` : "None", color: inputs.lifeMigrationAge > 0 ? "var(--clr-purple)" : "var(--text-muted)", tip: inputs.lifeMigrationAge > 0 ? `Migrating to CPF LIFE ${{ bas: 'Basic', std: 'Standard', esc: 'Escalating' }[inputs.lifePlanAtMigration || 'std']} plan at age ${inputs.lifeMigrationAge}` : "Staying on RSS until RA depletes — no CPF LIFE migration planned" },
                    { label: "Payout Start", value: `Age ${inputs.rssPayoutStartAge || 65}`, color: "var(--clr-amber)", tip: "Age when CPF Board began your RSS monthly payouts" },
                  ] : [
                    { label: "At Payout", value: formatCurrency(dispTotal), color: "var(--clr-blue)", tip: "Total CPF balance (OA+MA+RA) at your chosen payout age" },
                    { label: "Monthly (Std)", value: paRow?.standardMonthly ? formatCurrency(paRow.standardMonthly) : "—", color: "var(--clr-slate)", tip: "Standard Plan: fixed level monthly payout for life" },
                    { label: "Monthly (Esc)", value: paRow?.escalatingMonthly ? formatCurrency(paRow.escalatingMonthly) : "—", color: "var(--clr-emerald)", tip: "Escalating Plan: starts ~20% lower, grows 2%/yr for life" },
                    { label: "Monthly (Bas)", value: paRow?.basicMonthly ? formatCurrency(paRow.basicMonthly) : "—", color: "var(--clr-amber3)", tip: "Basic Plan: RA self-funds to ~age 90, then pool phase" },
                    { label: ra55Label || "RA at 55", value: formatCurrency(ra55), color: "var(--clr-purple)", tip: ca2 >= 55 ? "Current Retirement Account balance — determines CPF LIFE payout tier (BRS/FRS/ERS)" : "Projected RA at age 55 — determines CPF LIFE payout tier (BRS/FRS/ERS)" },
                    { label: "Payout Age", value: `${inputs.payoutAge}`, color: "var(--clr-amber)", tip: "Age CPF LIFE payouts begin. Deferring allows RA to grow further, increasing monthly payouts. Estimates based on 2026 CPF Board data." },
                  ];
                })().map(({ label, value, color, tip }, i) => (
                  <div key={i} title={tip || ""} style={{ padding: "4px 20px", borderRight: "1px solid var(--border-subtle)", flex: "1 1 0", minWidth: 100, textAlign: "center", boxSizing: "border-box", cursor: "help", background: i === 0 ? "rgba(var(--clr-blue-rgb),0.08)" : i > 0 && i < 4 ? "rgba(var(--clr-emerald-rgb),0.04)" : "transparent" }}>
                    <div className="cpf-kpi-label" style={{ fontSize: 11, fontWeight: 800, color: i === 0 ? "var(--clr-blue)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
                    <div className="cpf-kpi-value" style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "monospace", textShadow: "var(--shadow-kpi)" }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Tab content panels — scrollable row 2 of main wrap grid */}
          <div className="cpf-tab-content">

            {activeTab === "welcome" && <WelcomeTab />}

            {activeTab === "summary" && (
              <SummaryTab
                inputs={inputs} setInputs={setInputs} debouncedInputs={debouncedInputs}
                projection={projection} projectionByAge={projectionByAge}
                accumulationByAge={accumulationByAge} payoutByAge={payoutByAge}
                lifePlans={lifePlans} payoutProjection={payoutProjection}
                gapAlert={gapAlert} milestones={milestones}
                isRSSMode={isRSSMode} summaryRefAge={summaryRefAge}
                totalCpfAtPayout={totalCpfAtPayout} payoutAgeData={payoutAgeData}
                payoutAge65={payoutAge65} raAfterTransfer={raAfterTransfer}
                raOaTransfer={raOaTransfer} cumulativeCashTopUps={cumulativeCashTopUps}
                cumulativeRaInterest={cumulativeRaInterest}
                effectiveOaDrawMonthly={effectiveOaDrawMonthly}
                effectiveOaDrawStartAge={effectiveOaDrawStartAge}
                isForeigner={isForeigner} is55Plus={is55Plus}
                highlightPlan={highlightPlan} isRealDollars={isRealDollars}
                viewMode={viewMode} showWhatIf={showWhatIf}
                whatIfProjection={whatIfProjection}
                whatIfPayoutAge={whatIfPayoutAge} whatIfSaTopup={whatIfSaTopup}
                whatIfHousing={whatIfHousing} whatIfSalaryBump={whatIfSalaryBump}
                whatIfContribStop={whatIfContribStop} whatIfOaDrawdown={whatIfOaDrawdown}
                whatIfSrsContrib={whatIfSrsContrib} whatIfPrivGrowth={whatIfPrivGrowth}
                setShowWhatIf={setShowWhatIf}
                setWhatIfPayoutAge={setWhatIfPayoutAge} setWhatIfSaTopup={setWhatIfSaTopup}
                setWhatIfHousing={setWhatIfHousing} setWhatIfSalaryBump={setWhatIfSalaryBump}
                setWhatIfContribStop={setWhatIfContribStop} setWhatIfOaDrawdown={setWhatIfOaDrawdown}
                setWhatIfSrsContrib={setWhatIfSrsContrib} setWhatIfPrivGrowth={setWhatIfPrivGrowth}
              />
            )}

            {activeTab === "accumulation" && (
              <AccumulationTab
                inputs={inputs} setInputs={setInputs} debouncedInputs={debouncedInputs}
                projection={projection} displayAccumulation={displayAccumulation}
                accumulationByAge={accumulationByAge} payoutAge65={payoutAge65}
                monteCarloData={monteCarloData} baselineProjection={baselineProjection}
                milestones={milestones} isForeigner={isForeigner}
                showMonteCarlo={showMonteCarlo} setShowMonteCarlo={setShowMonteCarlo}
                showBaseline={showBaseline} setShowBaseline={setShowBaseline}
              />
            )}

            {activeTab === "rss" && (
              <RSSTab
                debouncedInputs={debouncedInputs} projection={projection}
                displayAccumulation={displayAccumulation} accumulationByAge={accumulationByAge}
                isRSSMode={isRSSMode}
              />
            )}

            {/* R6 fix: guard against stale activeTab === "life" when RSS mode is active */}
            {activeTab === "life" && debouncedInputs.cpfScheme !== 'rss' && (
              <LifeTab
                inputs={inputs} debouncedInputs={debouncedInputs}
                displayProjection={displayProjection} sensitivityData={sensitivityData}
                highlightPlan={highlightPlan} setHighlightPlan={setHighlightPlan}
                viewMode={viewMode} setViewMode={setViewMode}
                basicPremiumPct={basicPremiumPct} setBasicPremiumPct={setBasicPremiumPct}
                payoutAge65={payoutAge65} isForeigner={isForeigner}
                intersectionEscVsStd={intersectionEscVsStd}
                intersectionStdVsBasic={intersectionStdVsBasic}
                intersectionEscVsBasic={intersectionEscVsBasic}
                intersectionEscPayVsStdPay={intersectionEscPayVsStdPay}
              />
            )}

            {activeTab === "compare" && (
              <CompareTab
                inputs={inputs} projection={projection}
                scenarioA={scenarioA} scenarioB={scenarioB}
                scenarioLabelA={scenarioLabelA} scenarioLabelB={scenarioLabelB}
                comparisonData={comparisonData} highlightPlan={highlightPlan}
                setScenarioA={setScenarioA} setScenarioB={setScenarioB}
                setScenarioLabelA={setScenarioLabelA} setScenarioLabelB={setScenarioLabelB}
                handleExportScenarioDiff={handleExportScenarioDiff}
              />
            )}

            {activeTab === "table" && (
              <TableTab
                inputs={inputs} projection={projection}
                displayProjection={displayProjection} displayAccumulation={displayAccumulation}
                accumulationByAge={accumulationByAge}
                scenarioA={scenarioA} scenarioB={scenarioB}
                scenarioLabelA={scenarioLabelA} scenarioLabelB={scenarioLabelB}
                xirrByAge={xirrByAge} highlightPlan={highlightPlan}
                payoutAge65={payoutAge65} isRSSMode={isRSSMode} is55Plus={is55Plus}
                tableSubTab={tableSubTab} setTableSubTab={setTableSubTab}
                showDataTableGuide={showDataTableGuide} setShowDataTableGuide={setShowDataTableGuide}
                handleExportCSV={handleExportCSV} handleExportLedgerCSV={handleExportLedgerCSV}
                handlePrintTable={handlePrintTable} showToast={showToast}
              />
            )}

            {activeTab === "notes" && (
              <NotesTab
                inputs={inputs} projection={projection} milestones={milestones}
                intersectionEscVsStd={intersectionEscVsStd}
                intersectionStdVsBasic={intersectionStdVsBasic}
                intersectionEscVsBasic={intersectionEscVsBasic}
              />
            )}

            {activeTab === "strategy" && (
              <StrategyTab
                inputs={inputs} debouncedInputs={debouncedInputs}
                projection={projection} projectionByAge={projectionByAge}
                payoutProjection={payoutProjection} payoutByAge={payoutByAge}
                strategyChartData={strategyChartData} oaExhaustAge={oaExhaustAge}
                effectiveOaDrawMonthly={effectiveOaDrawMonthly}
                effectiveOaDrawStartAge={effectiveOaDrawStartAge}
                payoutAge65={payoutAge65} highlightPlan={highlightPlan}
                isForeigner={isForeigner}
              />
            )}
          </div>
        </section>
      </div>
    </div>
    </ErrorBoundary>
  </TooltipContext.Provider>
  );
}

