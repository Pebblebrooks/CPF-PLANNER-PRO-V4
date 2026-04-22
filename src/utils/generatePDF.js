import { runProjectionEngine } from "../engine/projectionEngine.js";
import { interpolateCpfLife } from "../engine/actuarial.js";
import { RETIREMENT_SUMS_2026 } from "../config/constants.js";
import { LEGAL_DISCLAIMER } from "../config/presets.js";

// ── generatePDF ───────────────────────────────────────────────────────────────
// Async function that builds the 6-page HTML retirement report and opens it
// in the in-app export modal. Called from App.jsx with all dependencies injected.
//
// Extracted from App.jsx to keep the main component under 1,500 lines.
// All state reads come via parameters — no React state closures.
//
// Parameters mirror the App.jsx state/computed values this function reads.
// ─────────────────────────────────────────────────────────────────────────────
export async function generatePDF({
  // User inputs & UI state
  inputs,
  debouncedInputs,
  pdfOrientation,
  isRealDollars,
  highlightPlan,
  isSelfEmployed,
  basicPremiumPct,
  // Computed projection data (from useProjection / useAnalytics / useMilestones)
  projection,
  payoutProjection,
  accumulationByAge,
  payoutByAge,
  lifePlans,
  milestones,
  monteCarloData,
  intersectionEscVsStd,
  intersectionStdVsBasic,
  intersectionEscVsBasic,
  intersectionEscPayVsStdPay,
  effectiveOaDrawMonthly,
  effectiveOaDrawStartAge,
  effectiveOaDrawFloor,
  // App state setters / side-effect functions
  setIsGeneratingPdf,
  setExportModal,
  showToast,
  // orientOverride — passed directly when called
  orientOverride,
}) {
    setIsGeneratingPdf(true);
    // Safety timeout — clear flag after 30s even if generation hangs
    const pdfTimeout = setTimeout(() => {
      setIsGeneratingPdf(false);
      showToast("⚠️ PDF generation timed out — try again");
    }, 30000);
    try {
      const pa = Number(inputs.payoutAge) || 65;
      const ca = Number(inputs.currentAge) || 35;
      const cy = Number(inputs.currentYear) || 2026;
      const fc = n => "$" + Math.round(n || 0).toLocaleString();
      const pRow = accumulationByAge.get(pa) || {};    // O(1) — was displayAccumulation.find
      const ppRow = payoutByAge.get(pa) || {};         // O(1) — was payoutProjection.find
      const nwPayout = ppRow[`${highlightPlan}NetWorth`] || 0;
      const nwAt95 = payoutByAge.get(95)?.[`${highlightPlan}NetWorth`] || 0; // E3/P1 fix: O(1) via existing payoutByAge Map
      const totalCpf = (pRow.oa || 0) + (pRow.sa || 0) + (pRow.ma || 0) + (pRow.ra || 0);
      const dateStr = new Date().toLocaleDateString("en-SG", { day: "2-digit", month: "long", year: "numeric" });
      const stdMonthly = Math.round(lifePlans.standard.start);
      const escMonthly = Math.round(lifePlans.escalating.start);
      const basMonthly = Math.round(lifePlans.basic.start);
      const memberType = isSelfEmployed ? "Self-Employed" : "Employed";
      const genderLabel = inputs.isMale !== false ? "Male" : "Female";
      const dollarMode = isRealDollars ? "Real Dollars" : "Nominal Dollars";

      // Year-by-year rows (every 5 years + payout age)
      // Pre-build local Map so .map() below is O(1) per row, not O(n) payoutProjection.find
      const ppByAgePdf = new Map(payoutProjection.map(d => [d.age, d]));
      // E3 fix: pre-build projection Map for FRS Tracker, SRS and private-asset PDF sections
      const projByAgePdf = new Map(projection.map(r => [r.age, r]));
      const projRowsData = projection.filter(r => r.age % 5 === 0 || r.age === pa || r.age === ca).map(r => {
        const ppR = ppByAgePdf.get(r.age) || {};
        const rowTotal = (r.oa || 0) + (r.sa || 0) + (r.ma || 0) + (r.ra || 0);
        const nw = ppR[`${highlightPlan}NetWorth`] || rowTotal + (inputs.includeProperty ? r.propertyValue : 0);
        return `<tr style="background:${r.age === pa ? "#e8f5e9" : ""}">
          <td style="font-weight:700">${r.age}</td>
          <td>${fc(r.oa)}</td>
          <td>${fc(r.sa)}</td>
          <td>${fc(r.ma)}</td>
          <td>${fc(r.ra)}</td>
          <td style="font-weight:700;color:#0369a1">${fc(rowTotal)}</td>
          <td style="font-weight:700;color:#047857">${fc(nw)}</td>
        </tr>`;
      }).join("");

      // Sensitivity analysis: housing outflow rows × SA top-up columns
      const baseH = Number(inputs.housingOutflow) || 0;
      const baseSATopup = Number(inputs.vcSaTopup) || 0;
      const hRows = [Math.max(0, baseH - 6000), Math.max(0, baseH - 3000), baseH, baseH + 3000, baseH + 6000];
      const saTopupCols = [Math.max(0, baseSATopup - 4000), Math.max(0, baseSATopup - 2000), baseSATopup, baseSATopup + 2000, baseSATopup + 4000];
      const calcTotalAtPA = (hOut, saTop) => {
        // Use debouncedInputs (same source as main projection) for strict consistency
        const rows = runProjectionEngine(debouncedInputs, {
          overrideVcSA: saTop,
          overrideHousingOutflow: hOut,
          overrideContribStop: Number(debouncedInputs.contributionStopAge) || 65,
          maxAge: pa,
        });
        const last = rows.find(r => r.age === pa) || rows[rows.length - 1];
        return last ? last.total : 0;
      };
      const baseTotal = calcTotalAtPA(baseH, baseSATopup);
      // Q3 fix: yield after EVERY sensitivity cell (batch size 1) so the browser
      // gets a paint opportunity between each of the 25 engine calls. Previously
      // SENS_BATCH=5 meant 5 synchronous engine calls (~100-150ms) before each yield,
      // causing perceptible jank on mobile. With batch=1 the UI stays responsive.
      showToast("⏳ Building PDF — computing sensitivity tables...");
      const sensCache = new Map();
      const allParams = [...hRows.flatMap(h => saTopupCols.map(s => [h, s]))];
      const SENS_BATCH = 1; // Q3 fix: was 5 — yield after every single cell
      for (let _bi = 0; _bi < allParams.length; _bi += SENS_BATCH) {
        const batch = allParams.slice(_bi, _bi + SENS_BATCH);
        batch.forEach(([h, s]) => { const key = `${h}_${s}`; if (!sensCache.has(key)) sensCache.set(key, calcTotalAtPA(h, s)); });
        await new Promise(r => setTimeout(r, 0)); // yield to browser after every cell
      }
      const sensRows = hRows.map(h => {
        const cells = saTopupCols.map(s => {
          const val = sensCache.get(`${h}_${s}`) || 0;
          const isBase = h === baseH && s === baseSATopup;
          return `<td style="text-align:right;font-weight:${isBase ? "900" : "400"};background:${isBase ? "#dcfce7" : ""};color:${isBase ? "#166534" : ""};padding:5px 8px">${fc(val)}</td>`;
        }).join("");
        return `<tr><td style="padding:5px 8px;font-weight:700">${fc(h)}</td>${cells}</tr>`;
      }).join("");

      // Milestone rows
      const msRows = milestones.map(m => `<tr><td style="padding:5px 8px;font-weight:700">${m.age}</td><td style="padding:5px 8px">${m.label}</td><td style="padding:5px 8px;color:#475569">${m.detail}</td></tr>`).join("");

      // Payout-age sensitivity: 6 engine runs pre-computed here (async, yielding after every call)
      // so the template literal below can simply reference payAgeSensHtml as a plain string.
      const isMalePdf = inputs.isMale !== false;
      let payAgeSensRows = '';
      const pAges = [65, 66, 67, 68, 69, 70];
      for (let _pi = 0; _pi < pAges.length; _pi++) {
        const testPA = pAges[_pi];
        const testRows = runProjectionEngine(debouncedInputs, { maxAge: testPA, overrideContribStop: Number(debouncedInputs.contributionStopAge) || 65 });
        const raRow = testRows.find(r => r.age === testPA) || testRows[testRows.length - 1];
        const ra = raRow?.ra || 0;
        const stdM = Math.round(interpolateCpfLife(ra, 'std', isMalePdf));
        const escM = Math.round(interpolateCpfLife(ra, 'esc', isMalePdf));
        const basM = Math.round(interpolateCpfLife(ra, 'bas', isMalePdf));
        const isCurrent = testPA === pa;
        payAgeSensRows += `<tr style="background:${isCurrent ? "#dcfce7" : ""}"><td style="font-weight:${isCurrent ? "900" : "400"};color:${isCurrent ? "#166534" : ""}">${testPA}${isCurrent ? " ◄" : ""}</td><td style="text-align:right">${fc(stdM)}/mo</td><td style="text-align:right;color:#059669">${fc(escM)}/mo</td><td style="text-align:right;color:#b45309">${fc(basM)}/mo</td></tr>`;
        await new Promise(r => setTimeout(r, 0)); // Q3 fix: yield after every call (was every 2)
      }
      const payAgeSensHtml = `
<h2 style="margin-top:12px">Payout Age Sensitivity — Monthly Starting Payouts</h2>
<p style="font-size:8px;color:#64748b;margin-bottom:6px">Each row shows estimated monthly payouts based on 2026 CPF Board data, interpolated from the official CPF LIFE Estimator. Deferral gain comes from RA growth during additional contribution years. Green row = your selected payout age.</p>
<table><thead><tr><th>Payout Age</th><th style="text-align:right">Standard</th><th style="text-align:right;color:#059669">Escalating</th><th style="text-align:right;color:#b45309">Basic</th></tr></thead>
<tbody>${payAgeSensRows}</tbody></table>`;

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="color-scheme" content="light only"/><style>:root{color-scheme:light only}html,body{background:#fff!important}</style><title>CPF Retirement Report — ${inputs.name}</title>
<style>
  @page{size:A4 ${orientOverride || pdfOrientation};margin:${(orientOverride || pdfOrientation) === "landscape" ? "12mm 15mm" : "15mm 12mm"}}
  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important;}
  html,body{background:#ffffff !important;color:#0f172a !important;}
  @media print{
    @page{size:A4 ${orientOverride || pdfOrientation};margin:${(orientOverride || pdfOrientation) === "landscape" ? "12mm 15mm" : "15mm 12mm"}}
    body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .page-break{page-break-before:always;break-before:page;}
  }
  /* Force orientation via print stylesheet — Chrome respects this form */
  @media print{html{width:${(orientOverride || pdfOrientation) === "landscape" ? "277mm" : "190mm"}}}
  body{font-family:Arial,sans-serif;font-size:10px;color:#0f172a;background:#ffffff !important;margin:0;padding:${(orientOverride || pdfOrientation) === "landscape" ? "6mm 12mm" : "8mm 10mm"};-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  /* Force browser to respect orientation by setting explicit page size */
  html{width:${(orientOverride || pdfOrientation) === "landscape" ? "297mm" : "210mm"};max-width:${(orientOverride || pdfOrientation) === "landscape" ? "297mm" : "210mm"}}
  h1{font-size:18px;font-weight:900;color:#0f172a;margin:0 0 4px}
  h2{font-size:13px;font-weight:800;color:#1e3a5f;margin:14px 0 6px;border-bottom:2px solid #0f172a;padding-bottom:4px;text-transform:uppercase;letter-spacing:0.05em}
  h3{font-size:11px;font-weight:700;color:#334155;margin:10px 0 4px}
  table{width:100%;border-collapse:collapse;font-size:9.5px}
  th{background:#0f172a;color:#fff;padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.04em}
  td{padding:5px 8px;border-bottom:1px solid #e2e8f0}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}
  .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px}
  .kpi-label{font-size:8px;font-weight:900;text-transform:uppercase;color:#64748b;margin-bottom:4px}
  .kpi-value{font-size:16px;font-weight:900}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px}
  .row-kv{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9;font-size:9.5px}
  .row-kv:last-child{border-bottom:none}
  .tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:8px;font-weight:800;text-transform:uppercase}
  .page-break{page-break-before:always}
  @media print{.page-break{page-break-before:always}}
</style>
</head><body>

<!-- PAGE 1: COVER -->
<div style="text-align:center;padding:20px 0 10px">
  <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#64748b;margin-bottom:8px">CPF RETIREMENT PLANNER PRO &middot; RETIREMENT ENGINE V2026</div>
  <h1 style="font-size:22px;margin-bottom:6px">Retirement Projection Report</h1>
  <p style="color:#64748b;font-size:11px;margin:0"><strong>${inputs.name}</strong> &middot; Current Age ${ca} &middot; Payout Age ${pa} &middot; ${dollarMode} &middot; ${memberType}</p>
  <p style="color:#94a3b8;font-size:9px;margin-top:6px">Generated on ${dateStr}</p>
</div>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">Total CPF @ Age ${pa}</div><div class="kpi-value" style="color:#059669">${fc(totalCpf)}</div></div>
  <div class="kpi"><div class="kpi-label">Standard Monthly Payout</div><div class="kpi-value" style="color:#1d4ed8">${fc(stdMonthly)}/mo</div></div>
  <div class="kpi"><div class="kpi-label">Net Worth @ Age ${pa}</div><div class="kpi-value" style="color:#7c3aed">${fc(nwPayout)}</div></div>
  <div class="kpi"><div class="kpi-label">Net Worth @ Age 95</div><div class="kpi-value" style="color:#b45309">${fc(nwAt95)}</div></div>
</div>
<p style="font-size:8px;color:#94a3b8;text-align:center;margin-top:6px">For informational purposes only — not financial advice</p>

<!-- PAGE 2: INPUT PARAMETERS + RETIREMENT SUMMARY + CPF LIFE ESTIMATES -->
<div class="page-break">
<h2>Input Parameters</h2>
<div class="two-col">
  <div class="box">
    <h3>Profile</h3>
    <div class="row-kv"><span>Name</span><strong>${inputs.name}</strong></div>
    <div class="row-kv"><span>Member Type</span><strong>${memberType}</strong></div>
    <div class="row-kv"><span>Gender</span><strong>${genderLabel}</strong></div>
    ${inputs.oaWithdrawalAt55 > 0 ? `<div class="row-kv"><span>OA Withdrawal at 55</span><strong>${fc(inputs.oaWithdrawalAt55)}</strong></div>` : ''}
    ${inputs.usePropertyPledge ? `<div class="row-kv"><span>Property Pledge</span><strong>Yes (BRS target)</strong></div>` : ''}
    ${(Number(inputs.sellPropertyAge) || 0) > 0 ? `<div class="row-kv"><span>Sell Property at Age</span><strong>Age ${inputs.sellPropertyAge} — CPF OA refund + 2.5%/yr interest credited to OA${inputs.usePropertyPledge ? " (pledge: RA restored to FRS first)" : ""}</strong></div>` : ''}
    ${inputs.oaToSaTransfer > 0 ? `<div class="row-kv"><span>OA→SA Transfer/yr</span><strong>${fc(inputs.oaToSaTransfer)}</strong></div>` : ''}
    ${(() => { const _rstu = Number(inputs.vcSaTopup) || 0; const _ca = Number(inputs.currentAge) || 0; const _isSC = (inputs.citizenStatus === 'SC') || !inputs.citizenStatus; const _mrssAmt = _isSC && _rstu > 0 && (_ca >= 55 || !!inputs.isPwD) ? Math.min(_rstu, 2000) : 0; return _mrssAmt > 0 ? `<div class="row-kv"><span>Est. MRSS Grant/yr</span><strong>${fc(_mrssAmt)}</strong></div>` : ''; })()}
    <div class="row-kv"><span>Current Age</span><strong>${ca}</strong></div>
    <div class="row-kv"><span>Current Year</span><strong>${cy}</strong></div>
    <div class="row-kv"><span>Payout Age</span><strong>${pa}</strong></div>
    <div class="row-kv"><span>Contribution Stop Age</span><strong>${inputs.contributionStopAge}</strong></div>
    <div class="row-kv"><span>Housing Stop Age</span><strong>${inputs.housingStopAge}</strong></div>
  </div>
  <div class="box">
    <h3>CPF Balances &amp; Annual Flows</h3>
    <div class="row-kv"><span>OA Balance</span><strong>${fc(inputs.oaBalance)}</strong></div>
    <div class="row-kv"><span>${ca >= 55 ? "RA" : "SA"} Balance</span><strong>${fc(inputs.saBalance)}</strong></div>
    <div class="row-kv"><span>MA Balance</span><strong>${fc(inputs.maBalance)}</strong></div>
    <div class="row-kv"><span>Annual Inflow (OA+SA+MA)</span><strong>${fc((Number(inputs.empOaCont) || 0) + (Number(inputs.empSaCont) || 0) + (Number(inputs.empMaCont) || 0))}</strong></div>
    <div class="row-kv"><span>Annual Housing Outflow</span><strong>${fc(inputs.housingOutflow)}</strong></div>
    <div class="row-kv"><span>Annual VC Top-ups</span><strong>${fc((Number(inputs.vc3aCash) || 0) + (Number(inputs.vcSaTopup) || 0) + (Number(inputs.vcVhr) || 0))}</strong></div>
  </div>
</div>
<h2>Retirement Summary at Payout Age ${pa}</h2>
<div class="two-col">
  <div class="box">
    <div class="row-kv"><span>OA Balance</span><strong style="color:#2563eb">${fc(pRow.oa)}</strong></div>
    <div class="row-kv"><span>SA Balance (Closed at 55)</span><strong style="color:#64748b">${fc(pRow.sa || 0)}</strong></div>
    <div class="row-kv"><span>MA Balance</span><strong style="color:#7c3aed">${fc(pRow.ma)}</strong></div>
    <div class="row-kv"><span>RA Balance</span><strong style="color:#059669">${fc(pRow.ra)}</strong></div>
    <div class="row-kv"><span style="font-weight:800">Total CPF</span><strong style="color:#0369a1;font-size:12px">${fc(totalCpf)}</strong></div>
  </div>
  <div class="box">
    <div class="row-kv"><span>Cumulative Top-ups</span><strong>${fc(pRow.cumulativeInjected)}</strong></div>
    <div class="row-kv"><span>Cumulative Outflow</span><strong>${fc(pRow.cumulativeOutflow)}</strong></div>
    <div class="row-kv"><span>Cumulative Interest Earned</span><strong>${fc(pRow.cumulativeInterest)}</strong></div>
    <div class="row-kv"><span>Net Worth @ Payout Age</span><strong style="color:#7c3aed">${fc(nwPayout)}</strong></div>
  </div>
</div>
<h2>CPF LIFE Payout Estimates (Monthly, from Age ${pa})</h2>
<table><thead><tr><th>Plan</th><th>Monthly Payout</th><th>Annual Payout</th><th>Payout Type</th><th>Net Worth @ Age 95</th></tr></thead><tbody>
  <tr><td><strong>Standard Plan</strong></td><td>${fc(stdMonthly)}/mo</td><td>${fc(stdMonthly * 12)}/yr</td><td>Level payouts for life</td><td>${fc(payoutByAge.get(95)?.standardNetWorth || 0)}</td></tr>
  <tr><td><strong>Escalating Plan</strong></td><td>${fc(escMonthly)}/mo</td><td>${fc(escMonthly * 12)}/yr</td><td>+2% per year escalation</td><td>${fc(payoutByAge.get(95)?.escalatingNetWorth || 0)}</td></tr>
  <tr><td><strong>Basic Plan</strong></td><td>${fc(basMonthly)}/mo</td><td>${fc(basMonthly * 12)}/yr</td><td>RA drawdown to ~90, pool thereafter</td><td>${fc(payoutByAge.get(95)?.basicNetWorth || 0)}</td></tr>
</tbody></table>
</div>

<!-- PAGE 3: CHARTS -->
<div class="page-break">
<h2>CPF Balance Accumulation Chart (Age ${ca} to 95)</h2>
${(() => {
          const chartRows = projection.filter(r => r.age % 5 === 0 || r.age === pa || r.age === ca);
          const maxTotal = Math.max(...chartRows.map(r => (r.oa || 0) + (r.sa || 0) + (r.ma || 0) + (r.ra || 0))) || 1;
          const W = 700, H = 200, PAD_L = 60, PAD_B = 30, PAD_T = 10, PAD_R = 10;
          const chartW = W - PAD_L - PAD_R;
          const chartH = H - PAD_T - PAD_B;
          const n = chartRows.length;
          const barW = Math.max(4, Math.floor(chartW / n) - 3);
          const fmt3 = v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v;
          const bars = chartRows.map((r, idx) => {
            const x = PAD_L + idx * (chartW / n) + (chartW / n - barW) / 2;
            const total = (r.oa || 0) + (r.sa || 0) + (r.ma || 0) + (r.ra || 0);
            const oaH = Math.round((r.oa || 0) / maxTotal * chartH);
            const saH = Math.round((r.sa || 0) / maxTotal * chartH);
            const maH = Math.round((r.ma || 0) / maxTotal * chartH);
            const raH = Math.round((r.ra || 0) / maxTotal * chartH);
            const y0 = PAD_T + chartH;
            const isPA = r.age === pa;
            return `<rect x="${x}" y="${y0 - oaH}" width="${barW}" height="${oaH}" fill="var(--clr-blue2)" opacity="0.85"/>
<rect x="${x}" y="${y0 - oaH - saH}" width="${barW}" height="${saH}" fill="var(--clr-emerald)" opacity="0.85"/>
<rect x="${x}" y="${y0 - oaH - saH - maH}" width="${barW}" height="${maH}" fill="var(--clr-purple)" opacity="0.85"/>
<rect x="${x}" y="${y0 - oaH - saH - maH - raH}" width="${barW}" height="${raH}" fill="var(--clr-amber3)" opacity="0.85"/>
${isPA ? `<line x1="${x + barW / 2}" y1="${PAD_T}" x2="${x + barW / 2}" y2="${y0}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.7"/>` : ''}
<text x="${x + barW / 2}" y="${y0 + 14}" text-anchor="middle" font-size="7" fill="#64748b">${r.age}</text>`;
          }).join('');
          const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(t => {
            const val = Math.round(t * maxTotal);
            const y = PAD_T + chartH - Math.round(t * chartH);
            return `<line x1="${PAD_L - 4}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/><text x="${PAD_L - 6}" y="${y + 3}" text-anchor="end" font-size="7" fill="var(--clr-slate)">${fmt3(val)}</text>`;
          }).join('');
          return `<svg width="${W}" height="${H}" style="display:block;margin:8px 0;border:1px solid #e2e8f0;border-radius:6px;background:#fafafa">
${yTicks}${bars}
<text x="${PAD_L}" y="${PAD_T + chartH + 26}" font-size="7" fill="var(--clr-slate)">Age</text>
</svg>
<div style="display:flex;gap:16px;font-size:8px;color:#64748b;margin-bottom:8px">
<span><rect width="10" height="10" fill="var(--clr-blue2)" style="display:inline-block;vertical-align:middle;margin-right:3px"></rect>OA</span>
<span><rect width="10" height="10" fill="var(--clr-emerald)" style="display:inline-block;vertical-align:middle;margin-right:3px"></rect>SA</span>
<span><rect width="10" height="10" fill="var(--clr-purple)" style="display:inline-block;vertical-align:middle;margin-right:3px"></rect>MA</span>
<span><rect width="10" height="10" fill="var(--clr-amber3)" style="display:inline-block;vertical-align:middle;margin-right:3px"></rect>RA</span>
<span style="color:#ef4444">&#9135; Payout Age ${pa}</span>
</div>`;
        })()}

<h2>CPF LIFE Payout Comparison Chart (Age ${pa} to 95)</h2>
${(() => {
          const lifeRows = payoutProjection.filter(r => r.age >= pa && r.age <= 95);
          if (lifeRows.length < 2) return '<p style="color:#94a3b8;font-size:9px">Insufficient data for chart.</p>';
          const maxY = Math.max(...lifeRows.map(r => Math.max(r.standardTotal || 0, r.escalatingTotal || 0, r.basicTotal || 0))) || 1;
          const W = 700, H = 180, PAD_L = 65, PAD_B = 28, PAD_T = 10, PAD_R = 10;
          const chartW = W - PAD_L - PAD_R;
          const chartH = H - PAD_T - PAD_B;
          const n = lifeRows.length;
          const xOf = idx => PAD_L + idx * (chartW / (n - 1));
          const yOf = val => PAD_T + chartH - Math.round((val / maxY) * chartH);
          const polyline = (key, color) => {
            const pts = lifeRows.map((r, i) => `${xOf(i)},${yOf(r[key] || 0)}`).join(' ');
            return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" opacity="0.9"/>`;
          };
          const fmt3 = v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v;
          const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(t => {
            const val = Math.round(t * maxY);
            const y = PAD_T + chartH - Math.round(t * chartH);
            return `<line x1="${PAD_L - 4}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/><text x="${PAD_L - 6}" y="${y + 3}" text-anchor="end" font-size="7" fill="var(--clr-slate)">${fmt3(val)}</text>`;
          }).join('');
          const xTicks = lifeRows.filter((r, i) => i % Math.ceil(n / 10) === 0 || r.age === 95).map((r, _, arr) => {
            const idx = lifeRows.indexOf(r);
            return `<text x="${xOf(idx)}" y="${PAD_T + chartH + 14}" text-anchor="middle" font-size="7" fill="var(--clr-slate)">${r.age}</text>`;
          }).join('');
          return `<svg width="${W}" height="${H}" style="display:block;margin:8px 0;border:1px solid #e2e8f0;border-radius:6px;background:#fafafa">
${yTicks}${xTicks}
${polyline('standardTotal', '#2563eb')}
${polyline('escalatingTotal', '#10b981')}
${polyline('basicTotal', '#f59e0b')}
</svg>
<div style="display:flex;gap:16px;font-size:8px;color:#64748b;margin-bottom:8px">
<span style="color:#2563eb">&#9644; Standard Plan</span>
<span style="color:#10b981">&#9644; Escalating Plan</span>
<span style="color:#f59e0b">&#9644; Basic Plan</span>
<span style="color:#94a3b8">(Cumulative Total Value = Payouts + Bequest)</span>
</div>`;
        })()}
${(() => {
          // Net Worth chart
          const nwRows = payoutProjection.filter(r => r.age >= pa && r.age <= 95);
          if (nwRows.length < 2) return '';
          const maxNW = Math.max(...nwRows.map(r => Math.max(r.standardNetWorth || 0, r.escalatingNetWorth || 0, r.basicNetWorth || 0))) || 1;
          const W2 = 700, H2 = 160, PL2 = 65, PB2 = 28, PT2 = 10, PR2 = 10;
          const cW2 = W2 - PL2 - PR2, cH2 = H2 - PT2 - PB2, n2 = nwRows.length;
          const xOf2 = idx => PL2 + idx * (cW2 / (n2 - 1));
          const yOf2 = val => PT2 + cH2 - Math.round((Math.max(0, val) / maxNW) * cH2);
          const fmt4 = v => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : String(Math.round(v));
          const poly2 = (key, color) => { const pts = nwRows.map((r, i) => `${xOf2(i)},${yOf2(r[key] || 0)}`).join(' '); return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" opacity="0.9"/>`; };
          const yT2 = [0, 0.25, 0.5, 0.75, 1.0].map(t => { const val = Math.round(t * maxNW); const y = PT2 + cH2 - Math.round(t * cH2); return `<line x1="${PL2 - 4}" y1="${y}" x2="${W2 - PR2}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/><text x="${PL2 - 6}" y="${y + 3}" text-anchor="end" font-size="7" fill="var(--clr-slate)">${fmt4(val)}</text>`; }).join('');
          const xT2 = nwRows.filter((_, i) => i % Math.ceil(n2 / 10) === 0 || nwRows[i].age === 95).map(r => { const idx = nwRows.indexOf(r); return `<text x="${xOf2(idx)}" y="${PT2 + cH2 + 14}" text-anchor="middle" font-size="7" fill="var(--clr-slate)">${r.age}</text>`; }).join('');
          return `<h2>Net Worth Comparison Chart (Age ${pa} to 95)</h2><svg width="${W2}" height="${H2}" style="display:block;margin:8px 0;border:1px solid #e2e8f0;border-radius:6px;background:#fafafa">${yT2}${xT2}${poly2('standardNetWorth', '#2563eb')}${poly2('escalatingNetWorth', '#10b981')}${poly2('basicNetWorth', '#f59e0b')}</svg><div style="display:flex;gap:16px;font-size:8px;color:#64748b;margin-bottom:8px"><span style="color:#2563eb">&#9644; Standard</span><span style="color:#10b981">&#9644; Escalating</span><span style="color:#f59e0b">&#9644; Basic</span><span style="color:#94a3b8">(Net Worth = Cumulative Payouts + Bequest + OA + MA)</span></div>`;
        })()}
</div>

<!-- PAGE 4: YEAR-BY-YEAR PROJECTION + SENSITIVITY ANALYSIS -->
<div class="page-break">
<h2>Year-by-Year Projection (Every 5 Years + Payout Age)</h2>
<table><thead><tr><th>Age</th><th>OA</th><th>SA</th><th>MA</th><th>RA</th><th>Total CPF</th><th>Net Worth</th></tr></thead>
<tbody>${projRowsData}</tbody></table>

<h2 style="margin-top:16px">Sensitivity Analysis — Total CPF at Payout Age ${pa}</h2>
<p style="font-size:9px;color:#64748b;margin-bottom:6px">Rows = Housing Outflow / Year &nbsp;|&nbsp; Columns = SA/RA Top-up / Year &nbsp;|&nbsp; <span style="background:#dcfce7;padding:1px 6px;border-radius:3px;color:#166534;font-weight:800">Green = Base Case</span></p>
<table><thead><tr><th>Housing \ SA/RA Top-up</th>${saTopupCols.map(s => `<th style="text-align:right">${fc(s)}</th>`).join("")}</tr></thead>
<tbody>${sensRows}</tbody></table>
</div>

<!-- PAGE 4: FRS TRACKER + BREAKEVEN ANALYSIS + PAYOUT SENSITIVITY -->
<div class="page-break">
${(() => {
          // FRS Tracker
          const yt55 = Math.max(0, 55 - ca);
          const projFRS55 = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, yt55));
          const projBRS55 = Math.round(projFRS55 / 2);
          const projERS55 = projFRS55 * 2;
          const raAt55 = projByAgePdf.get(Math.max(ca, 55))?.ra || 0; // E3 fix: O(1)
          const frsShortfall = projFRS55 - raAt55;
          const frsPct = Math.min(100, Math.round((raAt55 / projERS55) * 100));
          const barsW = Math.round((raAt55 / projERS55) * 500);
          let frsStatus = raAt55 >= projERS55 ? "ERS Achieved ✓" : raAt55 >= projFRS55 ? "FRS Achieved ✓" : raAt55 >= projBRS55 ? "BRS Met — FRS Gap" : "Below BRS";
          let frsColor = raAt55 >= projERS55 ? "#0369a1" : raAt55 >= projFRS55 ? "#166534" : raAt55 >= projBRS55 ? "#92400e" : "#991b1b";
          return `
<h2>FRS Tracker — Projected RA at Age 55</h2>
<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
  <div class="kpi"><div class="kpi-label">Projected RA @ 55</div><div class="kpi-value" style="color:${frsColor};font-size:14px">${fc(raAt55)}</div></div>
  <div class="kpi"><div class="kpi-label">BRS Target @ 55</div><div class="kpi-value" style="font-size:14px">${fc(projBRS55)}</div></div>
  <div class="kpi"><div class="kpi-label">FRS Target @ 55</div><div class="kpi-value" style="font-size:14px">${fc(projFRS55)}</div></div>
  <div class="kpi"><div class="kpi-label">Status</div><div class="kpi-value" style="color:${frsColor};font-size:11px">${frsStatus}</div></div>
</div>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;margin-bottom:6px">
  <div style="background:#e2e8f0;border-radius:4px;height:12px;overflow:hidden;position:relative">
    <div style="height:100%;border-radius:4px;background:${frsColor};width:${frsPct}%"></div>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:7px;color:#94a3b8;margin-top:3px">
    <span>$0</span><span>BRS ${fc(projBRS55)}</span><span>FRS ${fc(projFRS55)}</span><span>ERS ${fc(projERS55)}</span>
  </div>
  ${frsShortfall > 0 ? `<p style="font-size:8px;color:#b45309;margin-top:4px">Top up ${fc(Math.abs(frsShortfall))} more to reach FRS and unlock higher CPF LIFE payouts.</p>` : `<p style="font-size:8px;color:#166534;margin-top:4px">FRS achieved — consider topping up to ERS (${fc(projERS55)}) for maximum payouts.</p>`}
</div>`;
        })()}

${(() => {
          // Monte Carlo probability (if available)
          if (!monteCarloData?.probSufficiency) return '';
          const prob = monteCarloData.probSufficiency;
          const probColor = prob >= 80 ? "#166534" : prob >= 50 ? "#92400e" : "#991b1b";
          return `
<h2>Monte Carlo — Probability of Sufficiency</h2>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:16px">
  <div style="font-size:32px;font-weight:900;color:${probColor}">${prob}%</div>
  <div>
    <p style="font-size:9px;font-weight:700;color:#334155;margin:0 0 3px">Of 200 simulations (±1% rate variance), ${prob}% reached the projected FRS (${fc(monteCarloData.frsAtPayout)}) by payout age ${pa}.</p>
    <p style="font-size:8px;color:#64748b;margin:0">${prob >= 80 ? "Strong result — your plan is resilient to interest rate variation." : prob >= 50 ? "Moderate — consider increasing RSTU top-ups or deferring payout age." : "Lower confidence — significant top-ups or later payout age recommended."}</p>
  </div>
  <div style="flex:1;background:#e2e8f0;border-radius:4px;height:10px;overflow:hidden">
    <div style="height:100%;border-radius:4px;background:${probColor};width:${prob}%"></div>
  </div>
</div>`;
        })()}

<h2>CPF LIFE Breakeven Analysis</h2>
<table><thead><tr>
  <th>Comparison</th><th>Result</th><th>What it means</th>
</tr></thead><tbody>
  <tr><td><strong>Escalating overtakes Standard</strong></td>
    <td style="font-weight:900;color:#92400e">${intersectionEscVsStd ? `Age ${intersectionEscVsStd}` : "Beyond Age 95"}</td>
    <td style="font-size:8.5px;color:#475569">Escalating starts ~20% lower but grows 2%/yr. Cumulative total yield surpasses Standard at this age.</td></tr>
  <tr><td><strong>Standard overtakes Basic</strong></td>
    <td style="font-weight:900;color:#1d4ed8">${intersectionStdVsBasic ? `Age ${intersectionStdVsBasic}` : "Beyond Age 95"}</td>
    <td style="font-size:8.5px;color:#475569">Basic yields more early (RA earns 4%), but Standard overtakes after Basic RA depletes at ~90.</td></tr>
  <tr><td><strong>Escalating overtakes Basic</strong></td>
    <td style="font-weight:900;color:#7c3aed">${intersectionEscVsBasic ? `Age ${intersectionEscVsBasic}` : "Beyond Age 95"}</td>
    <td style="font-size:8.5px;color:#475569">Escalating's 2%/yr growth eventually compounds past Basic's early advantage.</td></tr>
  <tr><td><strong>Esc monthly payout exceeds Standard</strong></td>
    <td style="font-weight:900;color:#047857">${intersectionEscPayVsStdPay ? `Age ${intersectionEscPayVsStdPay}` : "Beyond Age 95"}</td>
    <td style="font-size:8.5px;color:#475569">The age your monthly Escalating cheque exceeds the fixed Standard amount.</td></tr>
</tbody></table>

${payAgeSensHtml}
</div>

<!-- PAGE 5: DECUMULATION STRATEGY -->
<div class="page-break">
<h2>Decumulation Strategy — Income at Retirement</h2>
${(() => {
          const oaDrawStart = effectiveOaDrawStartAge;
          const oaDrawMo   = effectiveOaDrawMonthly;
          const oaFloor    = effectiveOaDrawFloor;
          const target = Number(inputs.targetMonthlyIncome) || 0;
          const srsStartPdf = Math.max(Number(inputs.srsDrawdownStartAge) || 63, 63);
          const srsYearsPdf = Math.min(Math.max(Number(inputs.srsDrawdownYears) || 10, 1), 10);
          const srsRowPdf = projByAgePdf.get(srsStartPdf); // E3 fix: O(1)
          // P2-B fix: use PMT annuity formula (mirrors engine) instead of naive balance/years/12 division
          const srsBalPdf = srsRowPdf?.srsBalance || 0;
          const srsRatePdf = Math.max(0, (Number(inputs.srsReturnRate) || 0) / 100);
          const srsAnnualDrawPdf = srsYearsPdf > 0
            ? (srsRatePdf > 0
                ? Math.round(srsBalPdf * srsRatePdf / (1 - Math.pow(1 + srsRatePdf, -srsYearsPdf)))
                : Math.round(srsBalPdf / srsYearsPdf))
            : srsBalPdf;
          const srsMoPdf = Math.round(srsAnnualDrawPdf / 12);
          const privRowPdf = projByAgePdf.get(pa) || {};       // E3 fix: O(1)
          const prevPrivRowPdf = projByAgePdf.get(pa - 1) || {}; // E3 fix: O(1)
          // When DWZ is active, use the engine-computed _dwzPrivMonthly (exact PMT draw).
          // When DWZ is off, use the private-asset delta (growth reduction from manual scenarios).
          const privMoPdf = debouncedInputs.dieWithZeroEnabled
            ? (projection._dwzPrivMonthly || 0)
            : Math.max(0, Math.round(((prevPrivRowPdf.privateAssets || 0) - (privRowPdf.privateAssets || 0)) / 12));
          const cpfLifeMoPdf = stdMonthly;
          const totalMoPdf = cpfLifeMoPdf + (oaDrawMo || 0) + srsMoPdf + privMoPdf;
          const shortfallPdf = target > 0 ? target - totalMoPdf : 0;
          // Compute OA exhaust age for PDF
          let oaExhaustPdf = null;
          if (oaDrawStart > 0 && oaDrawMo > 0) {
            for (const row of projection) {
              if (row.age >= oaDrawStart && row.oa <= oaFloor) { oaExhaustPdf = row.age; break; }
            }
          }
          const incomeRows = [
            { label: "CPF LIFE (Standard)", start: pa, end: "Life", mo: cpfLifeMoPdf, color: "var(--clr-purple2)" },
            ...(oaDrawStart > 0 && oaDrawMo > 0 ? [{ label: "OA Drawdown", start: oaDrawStart, end: oaExhaustPdf ?? "95+", mo: oaDrawMo, color: "#b45309" }] : []),
            ...(srsMoPdf > 0 ? [{ label: "SRS Drawdown", start: srsStartPdf, end: srsStartPdf + srsYearsPdf - 1, mo: srsMoPdf, color: "#0369a1" }] : []),
            ...(privMoPdf > 0 ? [{ label: "Private Assets", start: pa, end: "95+", mo: privMoPdf, color: "#166534" }] : []),
          ];
          return `
<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
  <div class="kpi"><div class="kpi-label">CPF LIFE (Standard)</div><div class="kpi-value" style="color:#7c3aed;font-size:14px">${fc(cpfLifeMoPdf)}/mo</div></div>
  <div class="kpi"><div class="kpi-label">OA Drawdown</div><div class="kpi-value" style="color:#b45309;font-size:14px">${oaDrawMo > 0 ? fc(oaDrawMo) + "/mo" : "—"}</div></div>
  <div class="kpi"><div class="kpi-label">SRS / Private</div><div class="kpi-value" style="color:#0369a1;font-size:14px">${fc(srsMoPdf + privMoPdf)}/mo</div></div>
  <div class="kpi"><div class="kpi-label">${target > 0 ? (shortfallPdf <= 0 ? "Surplus vs Target" : "Shortfall vs Target") : "Total Income"}</div><div class="kpi-value" style="color:${target > 0 ? (shortfallPdf <= 0 ? "#166534" : "#991b1b") : "#334155"};font-size:14px">${target > 0 ? (shortfallPdf <= 0 ? "+" : "-") + fc(Math.abs(shortfallPdf)) : fc(totalMoPdf)}/mo</div></div>
</div>
<table><thead><tr><th>Income Stream</th><th>Start Age</th><th>End Age</th><th style="text-align:right">Monthly Income</th><th style="text-align:right">Lifetime Total</th></tr></thead>
<tbody>${incomeRows.map(r => `<tr><td style="color:${r.color};font-weight:700">${r.label}</td><td>${r.start}</td><td>${r.end}</td><td style="text-align:right;font-weight:700">${fc(r.mo)}/mo</td><td style="text-align:right">${typeof r.end === "number" ? fc(r.mo * 12 * (r.end - r.start + 1)) : fc(r.mo * 12 * (95 - r.start + 1))}</td></tr>`).join("")}
<tr style="background:#f1f5f9;font-weight:900"><td colspan="3">Combined Monthly (excl. one-time)</td><td style="text-align:right;font-size:12px">${fc(totalMoPdf)}/mo</td><td style="text-align:right">${target > 0 ? `Target: ${fc(target)}/mo` : ""}</td></tr>
</tbody></table>
${oaDrawStart > 0 && oaDrawMo > 0 ? `
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;margin-top:8px;font-size:8.5px">
  <strong>OA Drawdown Details:</strong> ${fc(oaDrawMo)}/mo from age ${oaDrawStart} · Bequest floor: ${fc(oaFloor)} · OA earns 2.5%/yr on remaining balance · ${oaExhaustPdf ? `OA reaches floor at age <strong>${oaExhaustPdf}</strong>` : "OA sustains to age 95+"}
</div>` : ""}
${target > 0 ? `<div style="background:${shortfallPdf <= 0 ? "#f0fdf4" : "#fef2f2"};border:1px solid ${shortfallPdf <= 0 ? "#bbf7d0" : "#fecaca"};border-radius:6px;padding:8px 12px;margin-top:6px;font-size:8.5px;color:${shortfallPdf <= 0 ? "#166534" : "#991b1b"}"><strong>${shortfallPdf <= 0 ? "✓ Income goal met" : "⚠ Income shortfall"}:</strong> Combined income of ${fc(totalMoPdf)}/mo vs target of ${fc(target)}/mo — ${shortfallPdf <= 0 ? "surplus of " + fc(Math.abs(shortfallPdf)) + "/mo" : "gap of " + fc(shortfallPdf) + "/mo. Increase OA drawdown or private savings to close the gap."}</div>` : ""}`;
        })()}
</div>

<!-- PAGE 6: MILESTONE ALERTS + DISCLAIMER -->
<div class="page-break">
<h2>Milestone Alerts</h2>
${milestones.length > 0 ? `<table><thead><tr><th>Age</th><th>Event</th><th>Details</th></tr></thead><tbody>${msRows}</tbody></table>` : `<p style="color:#64748b;font-style:italic">No milestone alerts detected for current inputs.</p>`}

<h2 style="margin-top:20px">Legal Disclaimer</h2>
<p style="font-size:8.5px;color:#64748b;line-height:1.6;text-align:justify">${LEGAL_DISCLAIMER}</p>
</div>

</body></html>`;

      // Always open in-app modal first so user can pick orientation and preview before printing
      setExportModal({ type: "pdf", content: html });
    } catch (e) { alert("Report failed: " + e.message); } finally { clearTimeout(pdfTimeout); setIsGeneratingPdf(false); }
}