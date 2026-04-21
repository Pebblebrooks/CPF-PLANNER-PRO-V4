import React from "react";
import {
  Briefcase, Gift, ShieldCheck, AlertTriangle, Info, HelpCircle,
} from "lucide-react";
import { RETIREMENT_SUMS_2026 } from "../config/constants.js";
import { TooltipBox } from "../SharedComponents.jsx";
import { FreqToggle } from "../SharedComponents.jsx";

// SidebarContribs
// Receives all state as props — no direct App state access.
// Shared props: inputs, setInputs, inputErrors, openSections, toggleSection,
//              handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency
// Section-specific props: is55Plus, isForeigner, isSelfEmployed, isUnder16, projection, gapAlert, rstuRef, showWisEligibility, setShowWisEligibility, handleAutoCalc, eligibleRSTU
export default function SidebarContribs({ inputs, setInputs, inputErrors, openSections, toggleSection, handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency,
  is55Plus, isForeigner, isSelfEmployed, isUnder16, projection, gapAlert, rstuRef, showWisEligibility, setShowWisEligibility, handleAutoCalc, eligibleRSTU }) {
  return (
    <>
              <div onClick={() => toggleSection("contribs")} tabIndex={0} className="sidebar-section-header" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection("contribs"); } }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none", background: openSections.has("contribs") ? "rgba(163,230,53,0.07)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--clr-lime)" }}>
                  <Briefcase style={{ width: 14, height: 14 }} /><span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>Mandatory Contributions{isSelfEmployed ? " (SEP)" : ""}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isSelfEmployed && <span style={{ fontSize: 9, background: "rgba(var(--clr-orange-rgb),0.15)", color: "var(--clr-orange)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>SEP</span>}
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{openSections.has("contribs") ? "▲" : "▼"}</span>
                </div>
              </div>
              {openSections.has("contribs") && <div style={{ padding: "0 16px 16px" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 10 }}>
                  <button onClick={() => setInputs(p => ({ ...p, isSelfEmployed: !p.isSelfEmployed, empOaCont: p.isSelfEmployed ? DEFAULT_INPUTS.empOaCont : 0, empSaCont: p.isSelfEmployed ? DEFAULT_INPUTS.empSaCont : 0, empMaCont: p.isSelfEmployed ? DEFAULT_INPUTS.empMaCont : 0 }))} style={{ fontSize: 10, background: isSelfEmployed ? "rgba(var(--clr-orange-rgb),0.15)" : "rgba(100,116,139,0.15)", color: isSelfEmployed ? "var(--clr-orange)" : "var(--text-subtle)", padding: "4px 10px", borderRadius: 6, fontWeight: 700, border: `1px solid ${isSelfEmployed ? "rgba(var(--clr-orange-rgb),0.4)" : "var(--border-strong)"}`, cursor: "pointer" }}>
                    {isSelfEmployed ? "SEP ✓" : "SEP?"}
                  </button>
                  {!isSelfEmployed && <button onClick={() => setInputs(p => ({ ...p, showSalaryCalc: !p.showSalaryCalc }))} style={{ fontSize: 10, background: "rgba(163,230,53,0.12)", color: "var(--clr-lime)", padding: "4px 10px", borderRadius: 6, fontWeight: 700, border: "none", cursor: "pointer" }}>
                    {inputs.showSalaryCalc ? "Hide" : "Auto-Calc"}
                  </button>}
                </div>
                {isSelfEmployed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, padding: 10, borderRadius: 10, background: "var(--bg-muted)", border: "1px solid var(--border-strong)" }}>
                  <div style={{ background: "rgba(var(--clr-orange-rgb),0.08)", border: "1px solid rgba(var(--clr-orange-rgb),0.25)", borderRadius: 10, padding: 10, marginBottom: 4, fontSize: 10, color: "#fdba74", lineHeight: 1.5 }}>
                    <strong style={{ color: "var(--clr-orange)" }}>Self-Employed Member (SEP):</strong> No mandatory OA/SA contributions. Use the Inflows panel below to enter your VC3A (up to $37,740/yr). Funds are <strong style={{ color: "#fdba74" }}>proportionally allocated</strong> across OA/SA/MA using your age-based CPF rates. MA excess above BHS spills to SA/RA (capped at FRS); further excess flows to OA. MA contributions required if net trade income &gt; $6,000.
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-lime)", textTransform: "uppercase", marginBottom: 4 }}>Net Trade Income ($/yr)</label>
                    <input type="text" inputMode="decimal" name="netTradeIncome" value={getDisplayValue("netTradeIncome", inputs.netTradeIncome)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Net Trade Income" onFocus={() => setFocusedField("netTradeIncome")} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  </div>
                )}
                {/* Salary fields — always visible for employed members */}
                {!isSelfEmployed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, padding: 10, borderRadius: 10, background: "var(--bg-muted)", border: "1px solid var(--border-strong)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "var(--clr-lime)", textTransform: "uppercase", marginBottom: 2 }}>Salary Inputs</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[["salaryGross", "OW / Monthly Gross ($)"], ["salaryBonus", "AW / Annual Bonus ($)"]].map(([n, l]) => (
                        <div key={n}><label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--clr-lime)", textTransform: "uppercase", marginBottom: 3 }}>{l}</label>
                          <input type="text" inputMode="decimal" name={n} value={getDisplayValue(n, inputs[n])} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={() => setFocusedField(n)} aria-label={l} style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} /></div>
                      ))}
                    </div>
                    <div><label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--clr-lime)", textTransform: "uppercase", marginBottom: 3 }}>Salary Growth Rate (% /yr)</label>
                      <input type="text" inputMode="decimal" name="salaryGrowthRate" value={inputs.salaryGrowthRate} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Annual salary growth rate" step="0.5" style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel)", border: "1px solid var(--border-strong)", borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>OW ceiling: $8,000/mo · AW ceiling: $102,000/yr</p>
                    </div>
                    {/* Rev #5: Retirement Sum Growth — controls FRS/BHS/BRS/ERS projection rate */}
                    <div>
                      {/* a11y fix: was <label> — changed to <div> because TooltipBox (role=button) inside
                          a <label> triggers double-focus on mobile tap: label activates the input AND
                          the tooltip button fires simultaneously. aria-label on the input below preserves
                          screen-reader association without the <label> wrapper. */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "var(--clr-lime)", textTransform: "uppercase", marginBottom: 3 }}>
                        Retirement Sum Growth (% /yr)
                        <TooltipBox id="t-rsGrowth" text="Annual rate at which CPF Board raises the Retirement Sums (FRS, BRS, ERS) and Basic Healthcare Sum (BHS). Historically ~3%/yr. Lowering this makes future FRS targets easier to reach; raising it makes them harder. Range: 0–10%. Values above 6% are flagged as aggressive." />
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="text" inputMode="decimal" name="retirementSumGrowth"
                          value={inputs.retirementSumGrowth ?? 3}
                          onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                          aria-label="Retirement sum annual growth rate"
                          style={{ flex: 1, padding: "6px 10px", background: "var(--bg-panel)", border: `1px solid ${inputErrors.retirementSumGrowth ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                        {/* Quick-set presets: Conservative / Base / Optimistic */}
                        {[["2%", 2, "var(--clr-blue)"], ["3%", 3, "var(--clr-green)"], ["4%", 4, "var(--clr-orange)"]].map(([lbl, val, clr]) => (
                          <button key={lbl} onClick={() => setInputs(p => ({ ...p, retirementSumGrowth: val }))}
                            style={{ padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, border: `1px solid ${(Number(inputs.retirementSumGrowth)||3) === val ? clr : "var(--border-strong)"}`, background: (Number(inputs.retirementSumGrowth)||3) === val ? `${clr}22` : "transparent", color: (Number(inputs.retirementSumGrowth)||3) === val ? clr : "var(--text-muted)", cursor: "pointer" }}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                      {inputErrors.retirementSumGrowth && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>{inputErrors.retirementSumGrowth}</p>}
                      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>CPF Board historical average ~3%/yr</p>
                    </div>
                    {/* Rev #22: Phase 2 salary & Career Break sub-section */}
                    {(() => {
                      const hasPhase = inputs.salaryPhaseAge !== "" && inputs.salaryPhaseAge != null;
                      const hasBreak = inputs.careerBreakStartAge !== "" && inputs.careerBreakStartAge != null;
                      return (
                        <div style={{ borderTop: "1px dashed var(--border-strong)", paddingTop: 8, marginTop: 2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Phase 2 / Career Break</span>
                            <TooltipBox id="t-phase2" text="Phase 2: model a salary growth rate change from a specified age (e.g. slower growth post-45, or 0% after a promotion plateau). Career Break: contributions and salary drop to $0 for the specified age range (e.g. a sabbatical, NS, or parental leave). Both can be used independently or together." />
                          </div>
                          {/* Phase 2 start age */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
                            <div>
                              <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--clr-lime)", textTransform: "uppercase", marginBottom: 3 }}>Phase 2 Start Age</label>
                              <input type="text" inputMode="decimal" name="salaryPhaseAge"
                                value={inputs.salaryPhaseAge ?? ""}
                                onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                                placeholder="–"
                                aria-label="Phase 2 salary start age"
                                style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel)", border: `1px solid ${inputErrors.salaryPhaseAge ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                              {inputErrors.salaryPhaseAge && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>{inputErrors.salaryPhaseAge}</p>}
                            </div>
                            {/* Phase 2 growth rate — only show when phase age is entered */}
                            <div style={{ opacity: hasPhase ? 1 : 0.35, pointerEvents: hasPhase ? "auto" : "none" }}>
                              <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--clr-lime)", textTransform: "uppercase", marginBottom: 3 }}>Phase 2 Growth %</label>
                              <input type="text" inputMode="decimal" name="salaryGrowthRate2"
                                value={inputs.salaryGrowthRate2 ?? 0}
                                onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                                placeholder="0"
                                readOnly={!hasPhase}
                                aria-label="Phase 2 salary growth rate"
                                style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel)", border: `1px solid ${inputErrors.salaryGrowthRate2 ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                              {inputErrors.salaryGrowthRate2 && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>{inputErrors.salaryGrowthRate2}</p>}
                            </div>
                          </div>
                          {hasPhase && (
                            <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>
                              Phase 1: {inputs.salaryGrowthRate || 0}%/yr up to age {inputs.salaryPhaseAge} → Phase 2: {inputs.salaryGrowthRate2 || 0}%/yr thereafter
                            </p>
                          )}
                          {/* Career break */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div>
                              <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--clr-orange)", textTransform: "uppercase", marginBottom: 3 }}>Break Start Age</label>
                              <input type="text" inputMode="decimal" name="careerBreakStartAge"
                                value={inputs.careerBreakStartAge ?? ""}
                                onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                                placeholder="–"
                                aria-label="Career break start age"
                                style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel)", border: `1px solid ${inputErrors.careerBreakStartAge ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                              {inputErrors.careerBreakStartAge && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>{inputErrors.careerBreakStartAge}</p>}
                            </div>
                            <div style={{ opacity: hasBreak ? 1 : 0.35, pointerEvents: hasBreak ? "auto" : "none" }}>
                              <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "var(--clr-orange)", textTransform: "uppercase", marginBottom: 3 }}>Break End Age</label>
                              <input type="text" inputMode="decimal" name="careerBreakEndAge"
                                value={inputs.careerBreakEndAge ?? ""}
                                onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                                placeholder="–"
                                readOnly={!hasBreak}
                                aria-label="Career break end age"
                                style={{ width: "100%", padding: "6px 10px", background: "var(--bg-panel)", border: `1px solid ${inputErrors.careerBreakEndAge ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 6, color: "var(--text-bright)", fontSize: 11, outline: "none", boxSizing: "border-box" }} />
                              {inputErrors.careerBreakEndAge && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>{inputErrors.careerBreakEndAge}</p>}
                            </div>
                          </div>
                          {hasBreak && inputs.careerBreakEndAge && (
                            <p style={{ fontSize: 10, color: "#fdba74", marginTop: 4 }}>
                              ⏸ Contributions paused ages {inputs.careerBreakStartAge}–{inputs.careerBreakEndAge} ({Math.max(0, (Number(inputs.careerBreakEndAge) - Number(inputs.careerBreakStartAge)) + 1)} yr{Math.max(0, (Number(inputs.careerBreakEndAge) - Number(inputs.careerBreakStartAge)) + 1) !== 1 ? "s" : ""})
                            </p>
                          )}
                        </div>
                      );
                    })()}
                    <button onClick={handleAutoCalc} style={{ width: "100%", background: "var(--clr-lime)", color: "var(--ctrl-on-text)", fontWeight: 700, padding: "7px", borderRadius: 8, fontSize: 11, border: "none", cursor: "pointer" }}>⚡ Auto-Calc CPF Contributions</button>
                  </div>
                )}
                {inputs.showSalaryCalc && !isSelfEmployed && (() => {
                  const displayAge = Number(inputs.currentAge) || 35;
                  const displayIsPR = (inputs.citizenStatus || 'SC') === 'PR';
                  const displayPrYr = Number(inputs.prYear) || 3;
                  const displayRateType = (inputs.prRateType || 'GG');
                  // SC/PR3+ (Table 1 2026): combined employer+employee rates. PR1/PR2: correct totals, proportional splits.
                  const scTable = [
                    ["≤ 35",  23,   6,    8,    37,   "17%",   "0.60"],
                    ["36–45", 21,   7,    9,    37,   "17%",   "0.60"],
                    ["46–50", 19,   8,    10,   37,   "17%",   "0.60"],
                    ["51–55", 15,   11.5, 10.5, 37,   "17%",   "0.60"],
                    ["56–60", 12,   11.5, 10.5, 34,   "16%",   "0.54"],
                    ["61–65", 3.5,  11,   10.5, 25,   "12.5%", "0.375"],
                    ["66–70", 1,    5,    10.5, 16.5, "9%",    "0.225"],
                    ["> 70",  1,    1,    10.5, 12.5, "7.5%",  "0.15"],
                  ];
                  const pr1Table = [
                    ["≤ 35",  5.6, 1.5, 1.9, 9.0, "4%",   "0.15"],
                    ["36–45", 5.1, 1.7, 2.2, 9.0, "4%",   "0.15"],
                    ["46–50", 4.6, 1.9, 2.5, 9.0, "4%",   "0.15"],
                    ["51–55", 3.6, 2.8, 2.6, 9.0, "4%",   "0.15"],
                    ["56–60", 3.2, 3.0, 2.8, 9.0, "4%",   "0.15"],
                    ["61–65", 1.2, 3.7, 3.6, 8.5, "3.5%", "0.15"],
                    ["> 65",  0.5, 2.6, 5.4, 8.5, "3.5%", "0.15"],
                  ];
                  const pr2Table = [
                    ["≤ 35",  14.9, 3.9, 5.2, 24.0, "9%",   "0.45"],
                    ["36–45", 13.6, 4.5, 5.9, 24.0, "9%",   "0.45"],
                    ["46–50", 12.3, 5.2, 6.5, 24.0, "9%",   "0.45"],
                    ["51–55", 9.7,  7.5, 6.8, 24.0, "9%",   "0.45"],
                    ["56–60", 6.5,  6.3, 5.7, 18.5, "6%",   "0.375"],
                    ["61–65", 1.5,  4.9, 4.6, 11.0, "3.5%", "0.225"],
                    ["> 65",  0.5,  2.6, 5.4, 8.5,  "3.5%", "0.15"],
                  ];
                  // F/G Year 1: Full Employer (17%) + Graduated Employee (5%)
                  const fg1Table = [
                    ["≤ 35",  13.6, 3.6, 4.8, 22.0, "17%",   "0.15"],
                    ["36–45", 12.4, 4.2, 5.4, 22.0, "17%",   "0.15"],
                    ["46–50", 11.2, 4.8, 6.0, 22.0, "17%",   "0.15"],
                    ["51–55", 9.0,  6.8, 6.2, 22.0, "17%",   "0.15"],
                    ["56–60", 7.4,  7.1, 6.5, 21.0, "16%",   "0.15"],
                    ["61–65", 2.4,  7.7, 7.4, 17.5, "12.5%", "0.15"],
                    ["> 65",  0.9,  4.2, 8.9, 14.0, "9%",    "0.15"],
                  ];
                  // F/G Year 2: Full Employer + Graduated Employee (15% ≤55, 12.5% 56–60, 7.5% 61–65, 5% >65)
                  const fg2Table = [
                    ["≤ 35",  19.9, 5.2, 6.9, 32.0, "17%",   "0.45"],
                    ["36–45", 18.2, 6.0, 7.8, 32.0, "17%",   "0.45"],
                    ["46–50", 16.4, 6.9, 8.7, 32.0, "17%",   "0.45"],
                    ["51–55", 13.0, 9.9, 9.1, 32.0, "17%",   "0.45"],
                    ["56–60", 10.1, 9.6, 8.8, 28.5, "16%",   "0.375"],
                    ["61–65", 2.8,  8.8, 8.4, 20.0, "12.5%", "0.225"],
                    ["> 65",  0.9,  4.2, 8.9, 14.0, "9%",    "0.15"],
                  ];
                  const isFG = displayIsPR && displayPrYr < 3 && displayRateType === 'FG';
                  const activeTable =
                    displayIsPR && displayPrYr === 1 ? (isFG ? fg1Table : pr1Table) :
                    displayIsPR && displayPrYr === 2 ? (isFG ? fg2Table : pr2Table) :
                    scTable;
                  const tableTitle =
                    displayIsPR && displayPrYr === 1 && isFG ? "PR Year 1 F/G (Full ER) — 1 Jan 2026" :
                    displayIsPR && displayPrYr === 1         ? "PR Year 1 G/G — Table 2 (1 Jan 2026)" :
                    displayIsPR && displayPrYr === 2 && isFG ? "PR Year 2 F/G (Full ER) — 1 Jan 2026" :
                    displayIsPR && displayPrYr === 2         ? "PR Year 2 G/G — Table 3 (1 Jan 2026)" :
                    "SC / PR Year 3+ — Table 1 (1 Jan 2026)";
                  const isActive = (bracket) => {
                    const a = displayAge;
                    if (bracket === "≤ 35")  return a <= 35;
                    if (bracket === "36–45") return a > 35 && a <= 45;
                    if (bracket === "46–50") return a > 45 && a <= 50;
                    if (bracket === "51–55") return a > 50 && a <= 55;
                    if (bracket === "56–60") return a > 55 && a <= 60;
                    if (bracket === "61–65") return a > 60 && a <= 65;
                    if (bracket === "66–70") return a > 65 && a <= 70;
                    if (bracket === "> 70")  return a > 70;
                    if (bracket === "> 65")  return a > 65;
                    return false;
                  };
                  const activeRow = activeTable.find(r => isActive(r[0])) || activeTable[0];
                  const activeFlatRate = activeRow[5];
                  const activeGradFactor = activeRow[6];
                  return (
                    <div style={{ background: "var(--bg-input)", padding: 14, borderRadius: 12, marginBottom: 14, border: "1px solid var(--border-strong)" }}>
                      <div style={{ marginTop: 4, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-strong)" }}>
                        <div style={{ background: "var(--bg-panel)", padding: "6px 10px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>{tableTitle}</div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                          <thead><tr style={{ background: "var(--bg-muted)" }}>
                            <th style={{ padding: "4px 8px", textAlign: "left",   color: "var(--text-muted)" }}>Age</th>
                            <th style={{ padding: "4px 8px", textAlign: "center", color: "var(--clr-blue)" }}>OA</th>
                            <th style={{ padding: "4px 8px", textAlign: "center", color: "var(--clr-lime)" }}>{is55Plus ? "RA" : "SA"}</th>
                            <th style={{ padding: "4px 8px", textAlign: "center", color: "var(--clr-violet)" }}>MA</th>
                            <th style={{ padding: "4px 8px", textAlign: "center", color: "var(--text-highlight)" }}>Total</th>
                          </tr></thead>
                          <tbody>
                            {activeTable.map(([bracket, oa, sa, ma, total]) => {
                              const active = isActive(bracket);
                              return (
                                <tr key={bracket} style={{ borderTop: "1px solid var(--border-subtle)", background: active ? "rgba(163,230,53,0.08)" : "" }}>
                                  <td style={{ padding: "5px 8px", fontWeight: 700, color: active ? "var(--clr-lime)" : "var(--text-muted)", fontFamily: "system-ui" }}>
                                    {bracket}{active && <span style={{ marginLeft: 4, fontSize: 7, background: "rgba(var(--clr-emerald-rgb),0.2)", color: "var(--clr-lime)", padding: "1px 4px", borderRadius: 4 }}>YOU</span>}
                                  </td>
                                  <td style={{ padding: "5px 8px", textAlign: "center", color: "#93c5fd", fontFamily: "monospace" }}>{oa}%</td>
                                  <td style={{ padding: "5px 8px", textAlign: "center", color: "#6ee7b7", fontFamily: "monospace" }}>{sa}%</td>
                                  <td style={{ padding: "5px 8px", textAlign: "center", color: "#c4b5fd", fontFamily: "monospace" }}>{ma}%</td>
                                  <td style={{ padding: "5px 8px", textAlign: "center", color: "var(--text-highlight)", fontFamily: "monospace", fontWeight: 700 }}>{total}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 6, background: "rgba(var(--clr-amber-rgb),0.06)", border: "1px solid rgba(var(--clr-amber-rgb),0.15)", fontSize: 9, color: "var(--text-muted)", lineHeight: 1.7 }}>
                        <strong style={{ color: "var(--clr-amber)" }}>Salary banding (OW/month, your age band):</strong><br />
                        ≤ $50 → Nil &nbsp;|&nbsp; $51–$500 → {activeFlatRate} × OW (employer only) &nbsp;|&nbsp; $501–$750 → {activeFlatRate} × OW + {activeGradFactor} × (OW − $500) &nbsp;|&nbsp; &gt; $750 → full rates above
                        <br /><span style={{ color: "var(--text-subtle)" }}>Rates shown are combined employer + employee as % of wages (OW &gt; $750). Auto-Calc applies the correct band formula automatically.</span>
                      </div>

                      {/* ── PR Tier Progression Panel — only shown when PR Year 1 or Year 2 ── */}
                      {displayIsPR && displayPrYr < 3 && (() => {
                        const growthRate  = (Number(inputs.salaryGrowthRate)  || 0) / 100;
                        const growthRate2 = (Number(inputs.salaryGrowthRate2) || 0) / 100;
                        const phaseAge_ui  = inputs.salaryPhaseAge !== "" && inputs.salaryPhaseAge != null ? Number(inputs.salaryPhaseAge) : null;
                        const cbStart_ui   = inputs.careerBreakStartAge !== "" && inputs.careerBreakStartAge != null ? Number(inputs.careerBreakStartAge) : null;
                        const cbEnd_ui     = inputs.careerBreakEndAge   !== "" && inputs.careerBreakEndAge   != null ? Number(inputs.careerBreakEndAge)   : null;
                        const baseMonthly = Math.min(Number(inputs.salaryGross) || 0, 8000);
                        const bonusBase   = Number(inputs.salaryBonus) || 0;
                        // Phase/break-aware GF for UI preview (mirrors engine computeGF)
                        const uiGF = (ageAtYear) => {
                          const inBreak = cbStart_ui !== null && cbEnd_ui !== null && ageAtYear >= cbStart_ui && ageAtYear <= cbEnd_ui;
                          if (inBreak) return 0;
                          if (phaseAge_ui !== null && ageAtYear >= phaseAge_ui) {
                            const y1 = Math.max(0, phaseAge_ui - displayAge);
                            const y2 = Math.max(0, ageAtYear  - phaseAge_ui);
                            return Math.pow(1 + growthRate, y1) * Math.pow(1 + growthRate2, y2);
                          }
                          return Math.pow(1 + growthRate, Math.max(0, ageAtYear - displayAge));
                        };

                        // Helper: compute annual OA/SA/MA for a given PR tier and year offset
                        const computeTierYear = (tierYear, offset) => {
                          const ageAtYear = displayAge + offset;
                          const gf = uiGF(ageAtYear);
                          const cappedMo = Math.min(baseMonthly * gf, 8000);
                          let oaR, saR, maR, totalPct;
                          if (tierYear < 3) {
                            const r = getPRRates(tierYear, ageAtYear, displayRateType);
                            oaR = r.oa; saR = r.sa; maR = r.ma;
                            totalPct = Math.round(r.total * 1000) / 10;
                          } else {
                            // SC/PR3+ full rates
                            if      (ageAtYear <= 35) { oaR=0.23; saR=0.06;  maR=0.08;  }
                            else if (ageAtYear <= 45) { oaR=0.21; saR=0.07;  maR=0.09;  }
                            else if (ageAtYear <= 50) { oaR=0.19; saR=0.08;  maR=0.10;  }
                            else if (ageAtYear <= 55) { oaR=0.15; saR=0.115; maR=0.105; }
                            else if (ageAtYear <= 60) { oaR=0.12; saR=0.115; maR=0.105; }
                            else if (ageAtYear <= 65) { oaR=0.035;saR=0.11;  maR=0.105; }
                            else if (ageAtYear <= 70) { oaR=0.01; saR=0.05;  maR=0.105; }
                            else                      { oaR=0.01; saR=0.01;  maR=0.105; }
                            totalPct = Math.round((oaR+saR+maR) * 1000) / 10;
                          }
                          const totalR  = oaR + saR + maR;
                          const owAnn   = cappedMo * 12;
                          const owOwContrib = totalR * owAnn;
                          const owOA   = totalR > 0 ? Math.round(owOwContrib * oaR / totalR) : 0;
                          const owMA   = totalR > 0 ? Math.round(owOwContrib * maR / totalR) : 0;
                          const owSA   = owOwContrib > 0 ? Math.round(owOwContrib) - owOA - owMA : 0;
                          // AW (bonus) — always at full standard rates
                          const awCap  = Math.max(0, 102000 - owAnn);
                          const bCpf   = Math.min(bonusBase * gf, awCap);
                          const oa  = owOA + Math.round(bCpf * oaR);
                          const sa  = owSA + Math.round(bCpf * saR);
                          const ma  = owMA + Math.round(bCpf * maR);
                          return { oa, sa, ma, total: oa+sa+ma, totalPct, tierYear, ageAtYear };
                        };

                        // Build 4 rows: absolute PR years based on user-selected starting year
                        const rows = [
                          { label: `Yr ${displayPrYr}`,               offset: 0, tier: displayPrYr,                       absYear: displayPrYr },
                          { label: `Yr ${Math.min(displayPrYr+1,3)}${displayPrYr+1>3?"+ (steady)":""}`, offset: 1, tier: Math.min(displayPrYr + 1, 3), absYear: displayPrYr + 1 },
                          { label: `Yr ${Math.min(displayPrYr+2,3)}${displayPrYr+2>3?"+ (steady)":""}`, offset: 2, tier: Math.min(displayPrYr + 2, 3), absYear: displayPrYr + 2 },
                          { label: `Yr ${Math.min(displayPrYr+3,3)}${displayPrYr+3>3?"+ (steady)":""}`, offset: 3, tier: 3,                           absYear: displayPrYr + 3 },
                        ].map(r => ({ ...r, ...computeTierYear(r.tier, r.offset) }));

                        const tierLabel = t => t === 1 ? 'PR Yr 1' : t === 2 ? 'PR Yr 2' : 'SC/PR3+';
                        const tierColor = t => t === 1 ? '#fbbf24' : t === 2 ? '#fb923c' : 'var(--clr-lime)';
                        const fc = v => `$${(v/1000).toFixed(1)}k`;

                        return (
                          <div style={{ marginTop: 10, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(var(--clr-amber-rgb),0.3)" }}>
                            <div style={{ background: "rgba(var(--clr-amber-rgb),0.08)", padding: "6px 10px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--clr-amber)", letterSpacing: "0.05em" }}>
                              📈 PR Tier Progression — Annual Contributions (Yr 1 → Yr 4+)
                              <span style={{ marginLeft: 6, fontWeight: 400, color: "var(--text-muted)", textTransform: "none" }}>Rate tier auto-advances each year in the engine</span>
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                              <thead>
                                <tr style={{ background: "var(--bg-muted)" }}>
                                  {["Proj. Year", "Tier (Rate)", "OA", is55Plus ? "RA" : "SA", "MA", "Total"].map((h, i) => (
                                    <th key={h} style={{ padding: "4px 8px", textAlign: i <= 1 ? "left" : "right",
                                      color: i===2?"var(--clr-blue)": i===3?"var(--clr-lime)": i===4?"var(--clr-violet)": i===5?"var(--text-highlight)":"var(--text-muted)",
                                      fontWeight: 800, fontSize: 9 }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rows.map((r, idx) => {
                                  const isNow = r.absYear === displayPrYr;
                                  const isFull = r.tier >= 3;
                                  return (
                                    <tr key={r.label} style={{ borderTop: "1px solid var(--border-subtle)", background: isNow ? "rgba(var(--clr-amber-rgb),0.06)" : isFull ? "rgba(163,230,53,0.06)" : "" }}>
                                      <td style={{ padding: "5px 8px", fontWeight: isNow ? 800 : 600, color: isNow ? "var(--clr-amber)" : "var(--text-muted)", fontFamily: "system-ui", whiteSpace: "nowrap" }}>
                                        {r.label}{isNow && <span style={{ marginLeft: 4, fontSize: 7, background: "rgba(163,230,53,0.25)", color: "var(--clr-lime)", padding: "1px 4px", borderRadius: 4 }}>You</span>}
                                        {growthRate > 0 && <span style={{ marginLeft: 3, fontSize: 7, color: "var(--text-subtle)" }}>×{(Math.pow(1+growthRate, r.offset)*100).toFixed(0)}%</span>}
                                      </td>
                                      <td style={{ padding: "5px 8px" }}>
                                        <span style={{ fontSize: 8, fontWeight: 800, color: tierColor(r.tier), background: `${tierColor(r.tier)}18`, border: `1px solid ${tierColor(r.tier)}40`, borderRadius: 4, padding: "1px 5px" }}>
                                          {tierLabel(r.tier)} · {r.totalPct}%
                                        </span>
                                      </td>
                                      <td style={{ padding: "5px 8px", textAlign: "right", color: "#93c5fd", fontFamily: "monospace" }}>{fc(r.oa)}</td>
                                      <td style={{ padding: "5px 8px", textAlign: "right", color: "#6ee7b7", fontFamily: "monospace" }}>{fc(r.sa)}</td>
                                      <td style={{ padding: "5px 8px", textAlign: "right", color: "#c4b5fd", fontFamily: "monospace" }}>{fc(r.ma)}</td>
                                      <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--text-highlight)", fontFamily: "monospace", fontWeight: 800 }}>{fc(r.total)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            <div style={{ padding: "5px 10px", background: "rgba(var(--clr-amber-rgb),0.04)", fontSize: 8, color: "var(--text-subtle)", lineHeight: 1.6 }}>
                              Auto-Calc fills Year 1 figures into the OA/SA/MA fields below. Year 2–4+ are projections only — the engine advances the tier automatically each year without further input.
                              {growthRate > 0 && ` Salary growth of ${inputs.salaryGrowthRate}%/yr applied.`}
                              {(inputs.salaryPhaseAge !== "" && inputs.salaryPhaseAge != null) && <span style={{ color: "var(--clr-amber)" }}> Phase 2 growth ({inputs.salaryGrowthRate2 || 0}%/yr from age {inputs.salaryPhaseAge}) is modelled in the projection but not reflected in this Year-1 Auto-Calc.</span>}
                              {(inputs.careerBreakStartAge !== "" && inputs.careerBreakStartAge != null) && <span style={{ color: "#fdba74" }}> Career break ages {inputs.careerBreakStartAge}–{inputs.careerBreakEndAge || "?"} is modelled in the projection — contributions drop to $0 during that period.</span>}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
                {!isSelfEmployed && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[["empOaCont", "OA"], ["empSaCont", is55Plus ? "RA" : "SA"], ["empMaCont", "MA"]].map(([n, l]) => (
                    <div key={n}><label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--clr-lime)", textTransform: "uppercase", marginBottom: 4 }}>{l}</label>
                      <input type="text" inputMode="decimal" name={n} value={getDisplayValue(n, inputs[n])} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={() => setFocusedField(n)} aria-label={l} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} /></div>
                  ))}
                  {/* ── PR Yr1→4 progression table: always visible for PR Year 1 or 2 members ── */}
                  {(() => {
                    const _isPR2 = (inputs.citizenStatus || 'SC') === 'PR';
                    const _prYr2 = Number(inputs.prYear) || 3;
                    if (!_isPR2 || _prYr2 >= 3) return null;
                    const _growthRate  = (Number(inputs.salaryGrowthRate)  || 0) / 100;
                    const _growthRate2 = (Number(inputs.salaryGrowthRate2) || 0) / 100;
                    const _phaseAge    = inputs.salaryPhaseAge !== "" && inputs.salaryPhaseAge != null ? Number(inputs.salaryPhaseAge) : null;
                    const _cbStart     = inputs.careerBreakStartAge !== "" && inputs.careerBreakStartAge != null ? Number(inputs.careerBreakStartAge) : null;
                    const _cbEnd       = inputs.careerBreakEndAge   !== "" && inputs.careerBreakEndAge   != null ? Number(inputs.careerBreakEndAge)   : null;
                    const _baseMonthly = Math.min(Number(inputs.salaryGross) || 0, 8000);
                    const _bonusBase = Number(inputs.salaryBonus) || 0;
                    const _rateType = inputs.prRateType || 'GG';
                    const _age0 = Number(inputs.currentAge) || 35;
                    // Phase/break-aware GF for second PR table (mirrors engine computeGF)
                    const _uiGF = (ageAtYear) => {
                      const inBreak = _cbStart !== null && _cbEnd !== null && ageAtYear >= _cbStart && ageAtYear <= _cbEnd;
                      if (inBreak) return 0;
                      if (_phaseAge !== null && ageAtYear >= _phaseAge) {
                        const y1 = Math.max(0, _phaseAge - _age0);
                        const y2 = Math.max(0, ageAtYear - _phaseAge);
                        return Math.pow(1 + _growthRate, y1) * Math.pow(1 + _growthRate2, y2);
                      }
                      return Math.pow(1 + _growthRate, Math.max(0, ageAtYear - _age0));
                    };
                    const _computeYear = (tierYear, offset) => {
                      const ageAtYear = _age0 + offset;
                      const gf = _uiGF(ageAtYear);
                      const cappedMo = Math.min(_baseMonthly * gf, 8000);
                      let oaR, saR, maR, totalPct;
                      if (tierYear < 3) {
                        const r = getPRRates(tierYear, ageAtYear, _rateType);
                        oaR = r.oa; saR = r.sa; maR = r.ma;
                        totalPct = Math.round(r.total * 1000) / 10;
                      } else {
                        if      (ageAtYear <= 35) { oaR=0.23; saR=0.06;  maR=0.08;  }
                        else if (ageAtYear <= 45) { oaR=0.21; saR=0.07;  maR=0.09;  }
                        else if (ageAtYear <= 50) { oaR=0.19; saR=0.08;  maR=0.10;  }
                        else if (ageAtYear <= 55) { oaR=0.15; saR=0.115; maR=0.105; }
                        else if (ageAtYear <= 60) { oaR=0.12; saR=0.115; maR=0.105; }
                        else if (ageAtYear <= 65) { oaR=0.035;saR=0.11;  maR=0.105; }
                        else if (ageAtYear <= 70) { oaR=0.01; saR=0.05;  maR=0.105; }
                        else                      { oaR=0.01; saR=0.01;  maR=0.105; }
                        totalPct = Math.round((oaR+saR+maR)*1000)/10;
                      }
                      const totalR = oaR + saR + maR;
                      const owAnn = cappedMo * 12;
                      const owContrib = totalR * owAnn;
                      const owOA = totalR > 0 ? Math.round(owContrib * oaR / totalR) : 0;
                      const owMA = totalR > 0 ? Math.round(owContrib * maR / totalR) : 0;
                      const owSA = owContrib > 0 ? Math.round(owContrib) - owOA - owMA : 0;
                      const awCap = Math.max(0, 102000 - owAnn);
                      const bCpf = Math.min(_bonusBase * gf, awCap);
                      const oa = owOA + Math.round(bCpf * oaR);
                      const sa = owSA + Math.round(bCpf * saR);
                      const ma = owMA + Math.round(bCpf * maR);
                      return { oa, sa, ma, total: oa+sa+ma, totalPct, tierYear, ageAtYear };
                    };
                    const rows = [
                      { label: `Yr ${_prYr2}`,                                   offset: 0, tier: _prYr2,                       absYear: _prYr2 },
                      { label: `Yr ${Math.min(_prYr2+1,3)}${_prYr2+1>3?"+ (steady)":""}`, offset: 1, tier: Math.min(_prYr2 + 1, 3), absYear: _prYr2 + 1 },
                      { label: `Yr ${Math.min(_prYr2+2,3)}${_prYr2+2>3?"+ (steady)":""}`, offset: 2, tier: Math.min(_prYr2 + 2, 3), absYear: _prYr2 + 2 },
                      { label: `Yr ${Math.min(_prYr2+3,3)}${_prYr2+3>3?"+ (steady)":""}`, offset: 3, tier: 3,                       absYear: _prYr2 + 3 },
                    ].map(r => ({ ...r, ..._computeYear(r.tier, r.offset) }));
                    const tColor = t => t === 1 ? "var(--clr-amber)" : t === 2 ? "var(--clr-orange)" : "var(--clr-lime)";
                    const tLabel = t => t === 1 ? "PR Yr 1" : t === 2 ? "PR Yr 2" : "SC/PR3+";
                    const fc2 = v => `$${(v/1000).toFixed(1)}k`;
                    return (
                      <div style={{ marginTop: 6, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(var(--clr-amber-rgb),0.3)" }}>
                        <div style={{ background: "rgba(var(--clr-amber-rgb),0.08)", padding: "5px 10px", fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--clr-amber)", letterSpacing: "0.05em" }}>
                          📈 PR Tier Progression — Yr 1 → Yr 4+
                          <span style={{ marginLeft: 6, fontWeight: 400, color: "var(--text-muted)", textTransform: "none" }}>auto-advances each year</span>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                          <thead>
                            <tr style={{ background: "var(--bg-muted)" }}>
                              {["Year", "Rate Tier", "OA", is55Plus ? "RA" : "SA", "MA", "Total"].map((h, i) => (
                                <th key={h} style={{ padding: "4px 6px", textAlign: i <= 1 ? "left" : "right",
                                  color: i===2?"var(--clr-blue)":i===3?"var(--clr-lime)":i===4?"var(--clr-violet)":i===5?"var(--text-highlight)":"var(--text-muted)",
                                  fontWeight: 800, fontSize: 8 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r, idx) => {
                              const isNow = r.absYear === _prYr2;
                              return (
                                <tr key={r.label} style={{ borderTop: "1px solid var(--border-subtle)", background: isNow ? "rgba(var(--clr-amber-rgb),0.07)" : r.tier >= 3 ? "rgba(163,230,53,0.06)" : "" }}>
                                  <td style={{ padding: "4px 6px", fontWeight: isNow ? 800 : 600, color: isNow ? "var(--clr-amber)" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                                    {r.label}{isNow && <span style={{ marginLeft: 4, fontSize: 7, background: "rgba(163,230,53,0.25)", color: "var(--clr-lime)", padding: "1px 3px", borderRadius: 3 }}>You</span>}
                                  </td>
                                  <td style={{ padding: "4px 6px" }}>
                                    <span style={{ fontSize: 7, fontWeight: 800, color: tColor(r.tier), background: `${tColor(r.tier)}18`, border: `1px solid ${tColor(r.tier)}40`, borderRadius: 3, padding: "1px 4px" }}>
                                      {tLabel(r.tier)} · {r.totalPct}%
                                    </span>
                                  </td>
                                  <td style={{ padding: "4px 6px", textAlign: "right", color: "#93c5fd", fontFamily: "monospace" }}>{fc2(r.oa)}</td>
                                  <td style={{ padding: "4px 6px", textAlign: "right", color: "#6ee7b7", fontFamily: "monospace" }}>{fc2(r.sa)}</td>
                                  <td style={{ padding: "4px 6px", textAlign: "right", color: "#c4b5fd", fontFamily: "monospace" }}>{fc2(r.ma)}</td>
                                  <td style={{ padding: "4px 6px", textAlign: "right", color: "var(--text-highlight)", fontFamily: "monospace", fontWeight: 800 }}>{fc2(r.total)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div style={{ padding: "4px 8px", background: "rgba(var(--clr-amber-rgb),0.04)", fontSize: 8, color: "var(--text-subtle)", lineHeight: 1.5 }}>
                          Yr 1 = auto-calc values above. Yr 2–4+ are projections — engine advances tier automatically.{_growthRate > 0 ? ` Salary growth ${inputs.salaryGrowthRate}%/yr applied.` : ""}
                        </div>
                      </div>
                    );
                  })()}
                </div>}
              </div>}
            </div>{/* /contribs inner */}
            </div>{/* /contribs gate wrapper */}
            {/* Inflows */}
            <div style={{ position: "relative" }}>
            {isForeigner && (
              <div style={{ position: "absolute", inset: 0, zIndex: 20, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.55)", pointerEvents: "all" }}>
                <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(var(--clr-amber-rgb),0.4)", borderRadius: 10, padding: "8px 18px", fontSize: 10, color: "var(--clr-amber)", fontWeight: 700 }}>🔒 CPF scheme — not available to foreigners</div>
              </div>
            )}
            <div style={{ opacity: isForeigner ? 0.2 : 1, pointerEvents: isForeigner ? "none" : "auto", background: "var(--bg-panel)", border: `1px solid ${isVcOverLimit ? "#f97316" : isSelfEmployed ? "rgba(var(--clr-orange-rgb),0.3)" : "var(--border-subtle)"}`, borderRadius: 16, overflow: "hidden" }}>
              <div onClick={() => toggleSection("topups")} tabIndex={0} className="sidebar-section-header" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection("topups"); } }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none", background: openSections.has("topups") ? (isVcOverLimit ? "rgba(249,115,22,0.06)" : "rgba(163,230,53,0.08)") : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: isVcOverLimit ? "var(--clr-orange)" : "var(--clr-green)" }}>
                  <Gift style={{ width: 14, height: 14 }} /><span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>Inflows ($/yr)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-subtle)" }}>Limit: {formatCurrency(maxAllowableVC)}/yr</span>
                  {isVcOverLimit && <AlertTriangle style={{ width: 12, height: 12, color: "var(--clr-orange)" }} />}
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{openSections.has("topups") ? "▲" : "▼"}</span>
                </div>
              </div>
              {openSections.has("topups") && <div style={{ padding: "0 16px 16px" }}>
                {isSelfEmployed && (
                  <div style={{ background: "rgba(var(--clr-orange-rgb),0.08)", border: "1px solid rgba(var(--clr-orange-rgb),0.2)", borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 10, color: "#fdba74", lineHeight: 1.5 }}>
                    <strong style={{ color: "var(--clr-orange)" }}>SEP VC3A Flow:</strong> Proportionally split across OA/SA/MA using age-based CPF rates. MA excess above BHS spills to SA/RA up to FRS; further excess flows to OA. Max $37,740/yr.
                  </div>
                )}
                {isVcOverLimit && <div style={{ background: "rgba(249,115,22,0.15)", color: "#fdba74", fontSize: 10, fontWeight: 700, padding: 10, borderRadius: 8, marginBottom: 10, display: "flex", gap: 6 }}>
                  <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0, marginTop: 1 }} />VC3A exceeds available limit ({formatCurrency(maxAllowableVC)}/yr). Contributions will be scaled down.
                </div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                  {/* VC3A — single cash lump-sum + read-only breakdown */}
                  <div>
                    <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: isVcOverLimit ? "var(--clr-orange)" : "var(--clr-green)", textTransform: "uppercase", marginBottom: 4 }}>
                      VC3A – Cash Lump Sum <FreqToggle freqKey="vc3aFreq" durKey="vc3aDur" inputs={inputs} setInputs={setInputs} />
                      <TooltipBox id="t-vc3a" text="Voluntary Contribution to 3 Accounts — cash only. Auto-split across OA/SA/MA using your age-band allocation rates. Counts toward the $37,740 Annual Limit. No tax relief for employees." />
                    </div>
                    <input type="text" inputMode="decimal" name="vc3aCash" value={getDisplayValue("vc3aCash", inputs.vc3aCash)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                      readOnly={isUnder16} tabIndex={isUnder16 ? -1 : undefined}
                      aria-label="VC3A annual cash contribution" onFocus={() => setFocusedField("vc3aCash")} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${isVcOverLimit ? "#f97316" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box", opacity: isUnder16 ? 0.4 : 1, cursor: isUnder16 ? "not-allowed" : "text" }} />
                    {isUnder16
                      ? <p style={{ fontSize: 10, color: "var(--clr-amber)", marginTop: 2 }}>⚠ Cash top-ups require age 16+. A parent/guardian may action this on the member's behalf.</p>
                      : inputErrors.vc3aCash && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.vc3aCash}</p>}
                    {/* Annual Limit headroom badge — colour-coded: green → amber → red */}
                    {!isUnder16 && (() => {
                      const vc3aVal   = Number(inputs.vc3aCash) || 0;
                      const usedPct   = maxAllowableVC > 0 ? Math.min(1, vc3aVal / maxAllowableVC) : (vc3aVal > 0 ? 1 : 0);
                      const badgeCol  = usedPct >= 1 ? "var(--clr-red)" : usedPct >= 0.75 ? "var(--clr-orange)" : "var(--clr-green)";
                      const barBg     = usedPct >= 1 ? "rgba(var(--clr-red-rgb),0.18)" : usedPct >= 0.75 ? "rgba(var(--clr-orange-rgb),0.18)" : "rgba(var(--clr-green-rgb),0.12)";
                      const remaining = Math.max(0, maxAllowableVC - vc3aVal);
                      return (
                        <div style={{ marginTop: 6, padding: "7px 10px", borderRadius: 7, background: barBg, border: `1px solid ${badgeCol}44` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: badgeCol, textTransform: "uppercase", letterSpacing: "0.04em" }}>Annual Limit Headroom</span>
                            <span style={{ fontSize: 9, fontWeight: 900, color: badgeCol, fontFamily: "monospace" }}>
                              {formatCurrency(remaining)} left of {formatCurrency(maxAllowableVC)}
                            </span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: "var(--bg-muted)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, usedPct * 100)}%`, background: badgeCol, borderRadius: 2, transition: "width 0.3s" }} />
                          </div>
                          <p style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>
                            Auto-split by age-band rates · no tax relief
                            {totalMandatory > 0 && ` · $${totalMandatory.toLocaleString()} mandatory already counted`}
                          </p>
                        </div>
                      );
                    })()}
                    {/* Read-only breakdown of how lump-sum is auto-split */}
                    {(Number(inputs.vc3aCash) || 0) > 0 && (() => {
                      const age = Number(inputs.currentAge) || 35;
                      const _isPR_vc3a  = (inputs.citizenStatus || 'SC') === 'PR';
                      const _prYr_vc3a  = Number(inputs.prYear) || 3;
                      const _rtType_vc3a = (inputs.prRateType || 'GG');
                      let oaR, saR, maR;
                      // BUG-13 fix: for PR Year 1 or 2 members use the PR rate table so the
                      // displayed OA/SA/MA split matches what the engine actually applies.
                      // Previously SC/PR3+ constants were hardcoded here regardless of PR status,
                      // showing wrong allocations to PR Year 1/2 members.
                      if (_isPR_vc3a && _prYr_vc3a < 3) {
                        const prR = getPRRates(_prYr_vc3a, age, _rtType_vc3a);
                        oaR = prR.oa; saR = prR.sa; maR = prR.ma;
                      } else {
                        if (age <= 35) { oaR = 0.23; saR = 0.06; maR = 0.08; }
                        else if (age <= 45) { oaR = 0.21; saR = 0.07; maR = 0.09; }
                        else if (age <= 50) { oaR = 0.19; saR = 0.08; maR = 0.10; }
                        else if (age <= 55) { oaR = 0.15; saR = 0.115; maR = 0.105; }
                        else if (age <= 60) { oaR = 0.12; saR = 0.115; maR = 0.105; }
                        else if (age <= 65) { oaR = 0.035; saR = 0.11; maR = 0.105; }
                        else if (age <= 70) { oaR = 0.01; saR = 0.05; maR = 0.105; }
                        else { oaR = 0.01; saR = 0.01; maR = 0.105; }
                      }
                      const total = oaR + saR + maR;
                      const v = Number(inputs.vc3aCash) || 0;
                      const oaAmt = Math.round(v * (oaR / total));
                      const maAmt = Math.round(v * (maR / total));
                      const saAmt = v - oaAmt - maAmt;
                      return (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 8, padding: "8px 10px", background: "var(--bg-base)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
                          {[["OA", oaAmt, "var(--clr-blue)"], ["MA", maAmt, "var(--clr-violet)"], [is55Plus ? "RA" : "SA", saAmt, "var(--clr-green)"]].map(([acct, amt, col]) => (
                            <div key={acct} style={{ textAlign: "center" }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: col, textTransform: "uppercase", marginBottom: 2 }}>{acct}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-bright)", fontFamily: "monospace" }}>{formatCurrency(amt)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    {/* Rev #21 — VC3A per-dollar SA ROI heuristic */}
                    {!isUnder16 && !isForeigner && (Number(inputs.vc3aCash) || 0) > 0 && (() => {
                      const _ca  = Number(inputs.currentAge) || 35;
                      const _pa  = Number(inputs.payoutAge)  || 65;
                      const _yrs = Math.max(0, _pa - _ca);
                      if (_yrs < 1) return null;
                      // Derive SA ratio at current age (mirrors breakdown grid logic above)
                      let _oaR, _saR, _maR;
                      const _isPR_h = (inputs.citizenStatus || 'SC') === 'PR';
                      const _prYr_h = Number(inputs.prYear) || 3;
                      if (_isPR_h && _prYr_h < 3) {
                        const _prR = getPRRates(_prYr_h, _ca, inputs.prRateType || 'GG');
                        _oaR = _prR.oa; _saR = _prR.sa; _maR = _prR.ma;
                      } else {
                        if (_ca <= 35)      { _oaR = 0.23; _saR = 0.06; _maR = 0.08; }
                        else if (_ca <= 45) { _oaR = 0.21; _saR = 0.07; _maR = 0.09; }
                        else if (_ca <= 50) { _oaR = 0.19; _saR = 0.08; _maR = 0.10; }
                        else if (_ca <= 55) { _oaR = 0.15; _saR = 0.115; _maR = 0.105; }
                        else if (_ca <= 60) { _oaR = 0.12; _saR = 0.115; _maR = 0.105; }
                        else if (_ca <= 65) { _oaR = 0.035; _saR = 0.11; _maR = 0.105; }
                        else if (_ca <= 70) { _oaR = 0.01; _saR = 0.05; _maR = 0.105; }
                        else               { _oaR = 0.01; _saR = 0.01; _maR = 0.105; }
                      }
                      const _tot = _oaR + _saR + _maR;
                      const _saFrac = _saR / _tot;
                      // SA/RA portion of $1,000 VC3A, grown at 4%/yr to payout age
                      const _saPortionToday = Math.round(1000 * _saFrac);
                      const _saFV = Math.round(_saPortionToday * Math.pow(1.04, _yrs));
                      return (
                        <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 7, background: "rgba(var(--clr-green-rgb),0.06)", border: "1px solid rgba(var(--clr-green-rgb),0.18)" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--clr-green)" }}>💡 ROI estimate · </span>
                          <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                            {is55Plus ? "RA" : "SA"} portion of <strong style={{ color: "var(--text-bright)" }}>$1,000</strong> VC3A today → <strong style={{ color: "var(--clr-green)", fontFamily: "monospace" }}>${_saPortionToday}</strong> into {is55Plus ? "RA" : "SA"} → grows to <strong style={{ color: "var(--clr-green)", fontFamily: "monospace" }}>{formatCurrency(_saFV)}</strong> at age {_pa} (4%/yr)
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div ref={rstuRef}>
                    <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-green)", textTransform: "uppercase", marginBottom: 4 }}>
                      RSTU – {is55Plus ? "RA" : "SA"} Cash Top-up <FreqToggle freqKey="vcSaFreq" durKey="vcSaDur" inputs={inputs} setInputs={setInputs} />
                      <TooltipBox id="t-rstu" text={`Retirement Sum Topping-Up Scheme — cash top-up to your ${is55Plus ? "RA" : "SA"} directly (not split across accounts). Eligible for up to $8,000/yr tax relief (own account) + $8,000 for loved ones. Capped at FRS (SA) or ERS (RA). NOT counted in Annual Limit.`} />
                    </div>
                    <input type="text" inputMode="decimal" name="vcSaTopup" value={getDisplayValue("vcSaTopup", inputs.vcSaTopup)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                      readOnly={isUnder16} tabIndex={isUnder16 ? -1 : undefined}
                      aria-label="RSTU annual cash top-up" onFocus={() => setFocusedField("vcSaTopup")} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.vcSaTopup ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box", opacity: isUnder16 ? 0.4 : 1, cursor: isUnder16 ? "not-allowed" : "text" }} />
                    {isUnder16
                      ? <p style={{ fontSize: 10, color: "var(--clr-amber)", marginTop: 2 }}>⚠ Cash top-ups require age 16+. A parent/guardian may action this on the member's behalf.</p>
                      : inputErrors.vcSaTopup && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.vcSaTopup}</p>}
                    {!isUnder16 && <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>Tax relief up to $8,000/yr · not in Annual Limit · capped at {is55Plus ? "ERS" : "FRS"}</p>}

                    {/* Live tax-saving badge — shows estimated annual tax saved via RSTU relief */}
                    {!isUnder16 && estimatedTaxSavings > 0 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, padding: "7px 10px", borderRadius: 7, background: "rgba(var(--clr-green-rgb),0.10)", border: "1px solid rgba(var(--clr-green-rgb),0.28)" }}>
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--clr-green)", textTransform: "uppercase", letterSpacing: "0.04em" }}>💰 Est. Tax Saved (RSTU)</span>
                          <p style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>
                            Based on ~{Math.round(estimatedTaxRate * 100)}% marginal rate · relief capped at $8,000/yr
                            {eligibleRSTU < (Number(inputs.vcSaTopup) || 0) && ` · capped at FRS headroom ($${Math.round(eligibleRSTU).toLocaleString()})`}
                          </p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 900, color: "var(--clr-green)", fontFamily: "monospace", whiteSpace: "nowrap", marginLeft: 8 }}>
                          {formatCurrency(estimatedTaxSavings)}<span style={{ fontSize: 9, fontWeight: 400, color: "#6ee7b7", marginLeft: 3 }}>/yr</span>
                        </span>
                      </div>
                    )}

                    {/* Rev #21 — RSTU per-dollar ROI heuristic */}
                    {!isUnder16 && !isForeigner && (Number(inputs.vcSaTopup) || 0) > 0 && (() => {
                      const _ca  = Number(inputs.currentAge) || 35;
                      const _pa  = Number(inputs.payoutAge)  || 65;
                      const _yrs = Math.max(0, _pa - _ca);
                      // Each $1,000 RSTU today grows at 4%/yr SA/RA rate to payout
                      const _fv  = Math.round(1000 * Math.pow(1.04, _yrs));
                      // CPF LIFE Standard Plan payout ≈ $5.40/mo per $1,000 RA (male) / $5.00/mo (female) at age 65.
                      // Apply +7%/yr deferral premium per year beyond 65 (CPF Board guidance).
                      const _baseRate = inputs.isMale !== false ? 5.40 : 5.00;
                      const _deferralBonus = Math.max(0, _pa - 65) * 0.07;
                      const _payoutRate = _baseRate * (1 + _deferralBonus); // $/mo per $1,000 RA at payout
                      const _monthlyAdd = Math.round(_fv * _payoutRate / 1000 * 10) / 10;
                      if (_yrs < 1) return null;
                      return (
                        <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 7, background: "rgba(var(--clr-green-rgb),0.06)", border: "1px solid rgba(var(--clr-green-rgb),0.18)" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--clr-green)" }}>💡 ROI estimate · </span>
                          <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
                            Each <strong style={{ color: "var(--text-bright)" }}>$1,000</strong> top-up today → <strong style={{ color: "var(--clr-green)", fontFamily: "monospace" }}>{formatCurrency(_fv)}</strong> in {is55Plus ? "RA" : "SA"} at age {_pa} (4%/yr) → est. <strong style={{ color: "var(--clr-green)", fontFamily: "monospace" }}>+${_monthlyAdd}/mo</strong> CPF LIFE ({inputs.isMale !== false ? "male" : "female"}, Standard plan)
                          </span>
                        </div>
                      );
                    })()}

                    {/* Inline gap card — only shown when a gap exists and FRS not yet met */}
                    {gapAlert && (
                      <div style={{ marginTop: 10, borderRadius: 10, padding: 12, border: `1px solid ${gapAlert.isUrgent ? "rgba(239,68,68,0.3)" : "rgba(var(--clr-amber3-rgb),0.3)"}`, background: gapAlert.isUrgent ? "rgba(239,68,68,0.07)" : "rgba(var(--clr-amber3-rgb),0.07)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                          <AlertTriangle style={{ width: 12, height: 12, color: gapAlert.isUrgent ? "var(--clr-red)" : "var(--clr-amber)", flexShrink: 0 }} />
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: gapAlert.isUrgent ? "var(--clr-red)" : "var(--clr-amber)" }}>Contribution Gap</span>
                        </div>
                        <p style={{ fontSize: 10, color: gapAlert.isUrgent ? "#fca5a5" : "#fcd34d", marginBottom: 8, lineHeight: 1.4 }}>
                          {gapAlert.raLabel} is <strong>{formatCurrency(gapAlert.raForAlert)}</strong> — <strong>{formatCurrency(gapAlert.frsGap)}</strong> short of FRS ({formatCurrency(gapAlert.projFRS55)}).
                        </p>
                        <div style={{ background: gapAlert.isUrgent ? "rgba(239,68,68,0.08)" : "rgba(var(--clr-amber3-rgb),0.08)", borderRadius: 6, padding: 8, fontSize: 9, fontFamily: "monospace" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ color: "var(--text-muted)" }}>Additional top-up needed*:</span>
                            <span style={{ fontWeight: 900, color: gapAlert.isUrgent ? "var(--clr-red)" : "#fcd34d" }}>{formatCurrency(gapAlert.annualTopUp)}/yr</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ color: "var(--text-muted)" }}>Monthly equivalent:</span>
                            <span style={{ fontWeight: 900, color: gapAlert.isUrgent ? "var(--clr-red)" : "#fcd34d" }}>{formatCurrency(gapAlert.monthlyTopUp)}/mo</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid rgba(100,116,139,0.25)" }}>
                            <span style={{ color: "var(--text-muted)" }}>Years to target age:</span>
                            <span style={{ fontWeight: 900, color: "var(--text-highlight)" }}>{gapAlert.yearsToGo} yrs</span>
                          </div>
                          {gapAlert.currentVcSa > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ color: "var(--text-muted)" }}>Current RSTU top-up:</span>
                              <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>{formatCurrency(gapAlert.currentVcSa)}/yr</span>
                            </div>
                          )}
                          {gapAlert.currentVcSa > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "var(--text-muted)" }}>Suggested new top-up:</span>
                              <span style={{ fontWeight: 900, color: gapAlert.isUrgent ? "var(--clr-red)" : "#fcd34d" }}>{formatCurrency(gapAlert.newTopUp)}/yr</span>
                            </div>
                          )}
                          <p style={{ fontSize: 8, color: "var(--text-muted)", marginTop: 5, lineHeight: 1.4 }}>*Additional top-up ON TOP of current projection. {gapAlert.topupNote}.</p>
                        </div>
                        {gapAlert.annualTopUp > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setInputs(prev => ({ ...prev, vcSaTopup: gapAlert.newTopUp }));
                              showToast(`✓ RSTU set to ${formatCurrency(gapAlert.newTopUp)}/yr — gap closed`);
                            }}
                            style={{ width: "100%", marginTop: 8, padding: "7px 0", borderRadius: 7, fontSize: 10, fontWeight: 800, border: `1px solid ${gapAlert.isUrgent ? "rgba(239,68,68,0.4)" : "rgba(var(--clr-amber3-rgb),0.4)"}`, background: gapAlert.isUrgent ? "rgba(239,68,68,0.12)" : "rgba(var(--clr-amber3-rgb),0.12)", color: gapAlert.isUrgent ? "var(--clr-red)" : "var(--clr-amber)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            ⚡ Apply Top-up — Set RSTU to {formatCurrency(gapAlert.newTopUp)}/yr
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* MRSS auto-badge — shown under RSTU when member is eligible (SC · age 55+ or PwD · RA/OA+SA < BRS · income ≤ $4k) */}
                  {(() => {
                    const _isSC = (inputs.citizenStatus === 'SC') || !inputs.citizenStatus;
                    if (!_isSC) return null;
                    const _ca  = Number(inputs.currentAge) || 0;
                    const _isPwD = !!inputs.isPwD;
                    const _mrssAgeOk = _ca >= 55 || _isPwD;
                    if (!_mrssAgeOk) return null;
                    const _brsNow = Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, Math.max(0, (Number(inputs.currentYear) || 2026) - 2026)));
                    const _oa = Number(inputs.oaBalance) || 0;
                    const _sa = Number(inputs.saBalance) || 0;
                    const _mrssBalOk = _ca >= 55 ? _sa < _brsNow : (_oa + _sa) < _brsNow;
                    // BUG-6 fix: mirror engine income gate (lines 1216–1220) — include AW/bonus
                    // in the monthly gross figure.  Previously only salaryGross (OW) was used,
                    // so a member with $3,800/mo OW + $40k bonus (≈ $7,133/mo gross) was
                    // incorrectly shown as eligible when the engine would deny the grant.
                    const _owAnnual = Math.min((Number(inputs.salaryGross) || 0) * 12, 96000);
                    const _awCeil   = Math.max(0, 102000 - _owAnnual);
                    const _bonus    = Math.min(Number(inputs.salaryBonus) || 0, _awCeil);
                    const _income   = inputs.isSelfEmployed
                      ? Math.round((Number(inputs.netTradeIncome) || 0) / 12)
                      : Math.round((_owAnnual + _bonus) / 12);
                    const _mrssIncomeOk = _income <= 4000;
                    const _rstu = Number(inputs.vcSaTopup) || 0;
                    const _mrssMatch = Math.min(_rstu, 2000);
                    if (!_mrssBalOk) {
                      // Balance already at/above BRS — not eligible
                      return (
                        <div style={{ marginTop: -6, marginBottom: 2, padding: "6px 10px", borderRadius: 8, background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.2)", fontSize: 9, color: "var(--text-muted)" }}>
                          ℹ️ <strong>MRSS:</strong> {_ca >= 55 ? "RA" : "OA + SA"} is at or above BRS ({formatCurrency(_brsNow)}) — not eligible this year.
                        </div>
                      );
                    }
                    if (!_mrssIncomeOk) {
                      return (
                        <div style={{ marginTop: -6, marginBottom: 2, padding: "6px 10px", borderRadius: 8, background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.2)", fontSize: 9, color: "var(--text-muted)" }}>
                          ℹ️ <strong>MRSS:</strong> Monthly income ({formatCurrency(_income)}) exceeds $4,000 limit — not eligible.
                        </div>
                      );
                    }
                    if (_rstu === 0) {
                      return (
                        <div style={{ marginTop: -6, marginBottom: 2, padding: "7px 10px", borderRadius: 8, background: "rgba(var(--clr-amber3-rgb),0.07)", border: "1px solid rgba(var(--clr-amber3-rgb),0.3)", fontSize: 9, color: "var(--clr-amber)" }}>
                          💡 <strong>MRSS eligible{_isPwD && _ca < 55 ? " (PwD)" : ""}:</strong> Add an RSTU top-up above to automatically receive up to <strong>$2,000/yr</strong> government match · $20,000 lifetime cap · SC only
                        </div>
                      );
                    }
                    return (
                      <div style={{ marginTop: -6, marginBottom: 2, padding: "7px 10px", borderRadius: 8, background: "rgba(var(--clr-green-rgb),0.07)", border: "1px solid rgba(var(--clr-green-rgb),0.3)", fontSize: 9, color: "var(--clr-green)" }}>
                        ✓ <strong>MRSS match{_isPwD && _ca < 55 ? " (PwD)" : ""}:</strong> <strong style={{ fontFamily: "monospace", fontSize: 10 }}>{formatCurrency(_mrssMatch)}/yr</strong> auto-credited to {_ca >= 55 ? "RA" : "SA"} · $20,000 lifetime cap · SC only
                        {_mrssMatch < _rstu && <span style={{ marginLeft: 6, color: "var(--text-muted)" }}>({formatCurrency(_rstu - _mrssMatch)} excess RSTU eligible for tax relief)</span>}
                      </div>
                    );
                  })()}

                  {/* VCMA — Cash Top-up to MA (moved directly after RSTU per docx #5) */}
                  <div>
                    <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-green)", textTransform: "uppercase", marginBottom: 4 }}>
                      VCMA – Cash Top-up to MA <FreqToggle freqKey="vcMaFreq" durKey="vcMaDur" inputs={inputs} setInputs={setInputs} />
                      <TooltipBox id="t-vcmacash" text="Voluntary Cash MediSave Top-up (VCMA) — direct annual cash deposit to your own MA. Credited each year, capped at the Basic Healthcare Sum (BHS, $79,000 in 2026). Not subject to the $37,740 Annual Limit. If you are eligible for MMSS (SC, age 55–70, MA below ½ BHS, income ≤ $4,000/mo), the government automatically matches your VCMA dollar-for-dollar up to $1,000/yr — the engine computes and credits the match automatically. No separate entry needed." />
                    </div>
                    {(() => {
                      const bhsNowMa = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, Math.max(0, (Number(inputs.currentYear) || 2026) - 2026)));
                      const maHeadroom = Math.max(0, bhsNowMa - (Number(inputs.maBalance) || 0));
                      const enteredVcMa = Number(inputs.vcMaCash) || 0;
                      const isOver = enteredVcMa > maHeadroom;
                      return (
                        <>
                          <input type="text" inputMode="decimal" name="vcMaCash" value={getDisplayValue("vcMaCash", inputs.vcMaCash)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                            readOnly={isUnder16} tabIndex={isUnder16 ? -1 : undefined}
                            aria-label="VCMA annual cash top-up to MA" onFocus={() => setFocusedField("vcMaCash")} style={{ width: "100%", padding: "8px 12px", background: isOver ? "rgba(var(--clr-orange-rgb),0.07)" : "var(--bg-muted)", border: `1px solid ${inputErrors.vcMaCash ? "var(--clr-red)" : isOver ? "rgba(var(--clr-orange-rgb),0.5)" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box", opacity: isUnder16 ? 0.4 : 1, cursor: isUnder16 ? "not-allowed" : "text" }} />
                          {isUnder16
                            ? <p style={{ fontSize: 10, color: "var(--clr-amber)", marginTop: 2 }}>⚠ Cash top-ups require age 16+. A parent/guardian may action this on the member's behalf.</p>
                            : inputErrors.vcMaCash && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.vcMaCash}</p>}
                          {!isUnder16 && (
                            <p style={{ fontSize: 10, color: maHeadroom === 0 ? "var(--clr-red)" : "var(--text-muted)", marginTop: 3 }}>
                              MA headroom to BHS: <strong style={{ color: maHeadroom === 0 ? "var(--clr-red)" : "var(--clr-green)", fontFamily: "monospace" }}>{formatCurrency(maHeadroom)}</strong>
                              {maHeadroom === 0 && <span style={{ marginLeft: 4, fontWeight: 700 }}>BHS reached ✓</span>}
                              {" "}· not in Annual Limit · no tax relief
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* MMSS auto-badge — shown under VCMA when member is eligible (SC · age 55–70 · MA < BHS/2 · income ≤ $4k · pilot ≤ 2030) */}
                  {(() => {
                    const _isSC = (inputs.citizenStatus === 'SC') || !inputs.citizenStatus;
                    if (!_isSC) return null;
                    const _ca  = Number(inputs.currentAge) || 0;
                    if (_ca < 55 || _ca > 70) return null;
                    const _baseYear = Number(inputs.currentYear) || 2026;
                    if (_baseYear > 2030) return null; // pilot ended
                    if (_baseYear < 2026) return null; // pilot not yet started
                    const _bhsNow = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, Math.max(0, _baseYear - 2026)));
                    const _halfBhs = Math.round(_bhsNow / 2);
                    const _maBal = Number(inputs.maBalance) || 0;
                    // BUG-6 (MMSS): mirror engine income gate — include AW/bonus in monthly gross.
                    // Previously only salaryGross (OW) was checked, matching the MRSS badge error.
                    const _owAnnual_mm = Math.min((Number(inputs.salaryGross) || 0) * 12, 96000);
                    const _awCeil_mm   = Math.max(0, 102000 - _owAnnual_mm);
                    const _bonus_mm    = Math.min(Number(inputs.salaryBonus) || 0, _awCeil_mm);
                    const _income = inputs.isSelfEmployed
                      ? Math.round((Number(inputs.netTradeIncome) || 0) / 12)
                      : Math.round((_owAnnual_mm + _bonus_mm) / 12);
                    const _vcMa = Number(inputs.vcMaCash) || 0;
                    const _mmssMatch = Math.min(_vcMa, 1000);
                    if (_maBal >= _halfBhs) {
                      return (
                        <div style={{ marginTop: -6, marginBottom: 2, padding: "6px 10px", borderRadius: 8, background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.2)", fontSize: 9, color: "var(--text-muted)" }}>
                          ℹ️ <strong>MMSS:</strong> MA ({formatCurrency(_maBal)}) is at or above half of BHS ({formatCurrency(_halfBhs)}) — not eligible.
                        </div>
                      );
                    }
                    if (_income > 4000) {
                      return (
                        <div style={{ marginTop: -6, marginBottom: 2, padding: "6px 10px", borderRadius: 8, background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.2)", fontSize: 9, color: "var(--text-muted)" }}>
                          ℹ️ <strong>MMSS:</strong> Monthly income ({formatCurrency(_income)}) exceeds $4,000 limit — not eligible.
                        </div>
                      );
                    }
                    if (_vcMa === 0) {
                      return (
                        <div style={{ marginTop: -6, marginBottom: 2, padding: "7px 10px", borderRadius: 8, background: "rgba(var(--clr-amber3-rgb),0.07)", border: "1px solid rgba(var(--clr-amber3-rgb),0.3)", fontSize: 9, color: "var(--clr-amber)" }}>
                          💡 <strong>MMSS eligible:</strong> Add a VCMA top-up above to automatically receive up to <strong>$1,000/yr</strong> MediSave match · SC only · pilot ends 2030
                        </div>
                      );
                    }
                    return (
                      <div style={{ marginTop: -6, marginBottom: 2, padding: "7px 10px", borderRadius: 8, background: "rgba(var(--clr-green-rgb),0.07)", border: "1px solid rgba(var(--clr-green-rgb),0.3)", fontSize: 9, color: "var(--clr-green)" }}>
                        ✓ <strong>MMSS match:</strong> <strong style={{ fontFamily: "monospace", fontSize: 10 }}>{formatCurrency(_mmssMatch)}/yr</strong> auto-credited to MA · engine auto-stops when MA reaches {formatCurrency(_halfBhs)} · SC only · pilot ends 2030
                      </div>
                    );
                  })()}

                  {/* Housing Refund (VHR) */}
                  <div>
                    <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-green)", textTransform: "uppercase", marginBottom: 4 }}>
                      Housing Refund – VHR (to OA) <FreqToggle freqKey="vcVhrFreq" durKey="vcVhrDur" inputs={inputs} setInputs={setInputs} />
                      <TooltipBox id="t-vhr" text="Voluntary Housing Refund: cash returned to OA to offset CPF used for housing. Credited to OA. NOT counted in Annual Limit." />
                    </div>
                    <input type="text" inputMode="decimal" name="vcVhr" value={getDisplayValue("vcVhr", inputs.vcVhr)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Voluntary housing refund" onFocus={() => setFocusedField("vcVhr")} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                  </div>

                  {/* Gov grants */}
                  <div>
                    <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-green)", textTransform: "uppercase", marginBottom: 4 }}>
                      Gov Grants (to {is55Plus ? "RA" : "SA"}) <FreqToggle freqKey="govGrantFreq" durKey="govGrantDur" inputs={inputs} setInputs={setInputs} />
                      <TooltipBox id="t-govgrant" text="Government grants credited to SA (pre-55) or RA (post-55). Tracked separately for the 20% RA transfer base calculation." />
                    </div>
                    <input type="text" inputMode="decimal" name="annualGovGrant" value={getDisplayValue("annualGovGrant", inputs.annualGovGrant)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Annual government grant" onFocus={() => setFocusedField("annualGovGrant")} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                  </div>

                  {/* WIS — W2: Estimate button + W3: eligibility panel */}
                  {(() => {
                    // W2: WIS estimate table by monthly income band (employee, 2025 schedule)
                    // Source: CPF Board WIS 2025 — https://www.cpf.gov.sg/member/infohub/news/wis
                    const WIS_EMPLOYEE = [
      { maxIncome: 1000, wis: 4900 }, { maxIncome: 1500, wis: 3267 },
      { maxIncome: 2000, wis: 2450 }, { maxIncome: 2500, wis: 1633 },
      { maxIncome: 3000, wis: 700  },
    ];
                    const WIS_SEP = [
      { maxIncome: 1000, wis: 3267 }, { maxIncome: 1500, wis: 2450 },
      { maxIncome: 2000, wis: 1633 }, { maxIncome: 2500, wis: 1225 },
      { maxIncome: 3000, wis: 467  },
    ];
                    const monthlyIncome = isSelfEmployed
                      ? Math.round((Number(inputs.netTradeIncome) || 0) / 12)
                      : (Number(inputs.salaryGross) || 0);
                    const table = isSelfEmployed ? WIS_SEP : WIS_EMPLOYEE;
                    const estimated = monthlyIncome >= 500 && monthlyIncome <= 3000
                      ? (table.find(r => monthlyIncome <= r.maxIncome) || table[table.length - 1]).wis
                      : null;
                    const [showEligibility, setShowEligibility] = [showWisEligibility, setShowWisEligibility]; // top-level state — no hook call here
                    return (
                      <div>
                        <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-green)", textTransform: "uppercase", marginBottom: 4 }}>
                          WIS – Workfare Supplement <FreqToggle freqKey="wisFreq" durKey="wisDur" inputs={inputs} setInputs={setInputs} />
                          <TooltipBox id="t-wis" text="Workfare Income Supplement (WIS): Enter your total annual WIS award. CPF portion is modelled: Employees — 60% to CPF (OA/SA/MA) + 40% cash paid separately to you. SEPs — 90% to MA (BHS-capped) + 10% cash. The cash portion (shown below) is not included in CPF projection but forms part of your real income. Auto-assessed by CPF Board — no application needed." />
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input type="text" inputMode="decimal" name="wisAmount" value={getDisplayValue("wisAmount", inputs.wisAmount)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Annual WIS workfare supplement" onFocus={() => setFocusedField("wisAmount")}
                            style={{ flex: 1, padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.wisAmount ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                          {/* W2: Estimate WIS button */}
                          {estimated !== null && (
                            <button onClick={() => setInputs(p => ({ ...p, wisAmount: estimated }))}
                              title={`Estimate based on your salary (~$${monthlyIncome.toLocaleString()}/mo)`}
                              style={{ padding: "6px 10px", borderRadius: 7, fontSize: 9, fontWeight: 800, border: "1px solid rgba(var(--clr-green-rgb),0.4)", background: "rgba(var(--clr-green-rgb),0.1)", color: "var(--clr-green)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                              ⚡ ${estimated.toLocaleString()}
                            </button>
                          )}
                        </div>
                        {(Number(inputs.wisAmount) || 0) > 0 && (
                          <p style={{ fontSize: 10, color: "var(--clr-green)", marginTop: 4 }}>
                            CPF portion: {formatCurrency(Math.round((Number(inputs.wisAmount) || 0) * (isSelfEmployed ? 0.9 : 0.6)))} ·
                            Cash paid to you: {formatCurrency(Math.round((Number(inputs.wisAmount) || 0) * (isSelfEmployed ? 0.1 : 0.4)))} (not in projection)
                          </p>
                        )}
                        {inputErrors.wisAmount && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.wisAmount}</p>}
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                          {isSelfEmployed ? "SEP: 90% → MA (BHS-capped), 10% cash (not modelled)" : "Employee: 60% → CPF (age-band split), 40% cash (not modelled)"}
                        </p>
                        {/* W3: Eligibility criteria toggle */}
                        <button onClick={() => setShowEligibility(v => !v)}
                          style={{ marginTop: 5, fontSize: 9, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                          {showEligibility ? "▲ Hide eligibility criteria" : "▼ WIS eligibility criteria"}
                        </button>
                        {showEligibility && (
                          <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: 7, background: "rgba(var(--clr-green-rgb),0.05)", border: "1px solid rgba(var(--clr-green-rgb),0.2)", fontSize: 9, color: "var(--text-muted)", lineHeight: 1.6 }}>
                            <strong style={{ color: "var(--text-highlight)" }}>WIS eligibility (2025):</strong><br />
                            • Singapore Citizen · Age ≥ 30 (or any age if PWD)<br />
                            • Avg gross monthly income: $500–$3,000<br />
                            • Live in property with Annual Value ≤ $21,000<br />
                            • Own ≤ 1 property (≤ 2 combined if married)<br />
                            • Spouse income ≤ $70,000/yr (if married)<br />
                            • <strong>Automatic</strong> — no application needed; CPF Board assesses annually
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              </div>}
            </div>{/* /topups inner */}
            </div>{/* /topups gate wrapper */}

            {/* Outflows */}
            <div style={{ position: "relative" }}>
            {isForeigner && (
              <div style={{ position: "absolute", inset: 0, zIndex: 20, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.55)", pointerEvents: "all" }}>
                <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(var(--clr-amber-rgb),0.4)", borderRadius: 10, padding: "8px 18px", fontSize: 10, color: "var(--clr-amber)", fontWeight: 700 }}>🔒 CPF scheme — not available to foreigners</div>
              </div>
            )}
            <div style={{ opacity: isForeigner ? 0.2 : 1, pointerEvents: isForeigner ? "none" : "auto", background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
    </>
  );
}
