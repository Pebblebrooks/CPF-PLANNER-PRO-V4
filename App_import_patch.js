// ═══════════════════════════════════════════════════════════════════════════════
// APP.JSX — IMPORT PATCH  (PR-2 + PR-3)
// ═══════════════════════════════════════════════════════════════════════════════
//
// HOW TO APPLY THIS PATCH
// ─────────────────────────────────────────────────────────────────────────────
// 1. Open App.jsx
// 2. DELETE lines 23–2557 (everything from the first CPF constants comment down
//    to the end of the runProjectionEngine function — the ErrorBoundary and
//    everything after line 2558 stays).
// 3. INSERT the import block below immediately after line 22
//    (after the "const ArrowDownToLine = Download;" alias line).
// 4. The rest of App.jsx (ErrorBoundary onward, the App() component, JSX) is
//    unchanged — it already uses all these names, so no other edits are needed.
//
// LINE COUNT REDUCTION:
//   Before patch:  lines 23–2557 = 2,535 lines of constants + engines in App.jsx
//   After patch:   6 import statements = 6 lines
//   Net reduction: 2,529 lines removed from App.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// INSERT THESE 6 LINES after line 22 of App.jsx:
// ─────────────────────────────────────────────────────────────────────────────

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

import {
  CPF_LIFE_TABLE_M, FEMALE_PAYOUT_MULTIPLIER,
  interpolatePhase1bTrigger, interpolatePhase2Drop,
  solveEffectiveRate, interpolateCpfLife,
  computeBasicPlanParams, computeBasicPlanYearPayout,
  computeSensitivityRow,
  makeComputeGF,
} from './engine/actuarial.js';

import { runProjectionEngine } from './engine/projectionEngine.js';
import { runRSSEngine }        from './engine/rssEngine.js';

import {
  formatCurrency, computeXIRR,
  lzCompress, lzDecompress,
} from './utils/helpers.js';


// ─────────────────────────────────────────────────────────────────────────────
// ALSO REMOVE from App.jsx (now dead — provided by imports above):
// ─────────────────────────────────────────────────────────────────────────────
//
//  Lines 2700–2797  const lzCompress = ...   / const lzDecompress = ...
//  Lines 2773       const formatCurrency = ...
//  Lines 2777–2795  const computeXIRR = ...
//
// These four definitions are now in src/utils/helpers.js.
// After deleting them, the only remaining module-level code above ErrorBoundary
// should be the TooltipBox component (line ~2558) and the FreqToggle component
// (line ~2617), which stay in App.jsx for now (extracted in PR-4/Layer 4).
//
// ─────────────────────────────────────────────────────────────────────────────
// DEPENDENCY MAP (for reference during review)
// ─────────────────────────────────────────────────────────────────────────────
//
//  constants.js
//    └── consumed by: projectionEngine.js, rssEngine.js, App.jsx
//
//  presets.js
//    └── consumed by: helpers.js (lzCompress delta), App.jsx
//
//  actuarial.js
//    └── consumed by: projectionEngine.js, rssEngine.js, App.jsx
//         (App uses: interpolateCpfLife, computeBasicPlanParams,
//          computeBasicPlanYearPayout, computeSensitivityRow)
//
//  projectionEngine.js
//    imports: constants.js, actuarial.js
//    └── consumed by: App.jsx
//
//  rssEngine.js
//    imports: constants.js, actuarial.js
//    └── consumed by: App.jsx
//
//  helpers.js
//    imports: presets.js (DEFAULT_INPUTS for delta encoding)
//    └── consumed by: App.jsx
