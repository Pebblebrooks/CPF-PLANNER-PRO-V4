import React from "react";
import { Home, Briefcase, Info, AlertTriangle } from "lucide-react";
import { RETIREMENT_SUMS_2026 } from "../config/constants.js";
import { TooltipBox } from "../SharedComponents.jsx";
import { FreqToggle } from "../SharedComponents.jsx";

// SidebarOutflows
// Receives all state as props — no direct App state access.
// Shared props: inputs, setInputs, inputErrors, openSections, toggleSection,
//              handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency
// Section-specific props: is55Plus, isForeigner, projection, displayAccumulation, oaToSaCrossover
export default function SidebarOutflows({ inputs, setInputs, inputErrors, openSections, toggleSection, handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency,
  is55Plus, isForeigner, projection, displayAccumulation, oaToSaCrossover }) {
  return (
    <>
              <div onClick={() => toggleSection("outflows")} tabIndex={0} className="sidebar-section-header" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection("outflows"); } }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none", background: openSections.has("outflows") ? "rgba(244,63,94,0.06)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f472b6" }}>
                  <MinusCircle style={{ width: 14, height: 14 }} /><span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>Outflows ($/yr)</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{openSections.has("outflows") ? "▲" : "▼"}</span>
              </div>
              {openSections.has("outflows") && <div style={{ padding: "0 16px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[["medicalUsage", "Medical Usage (MA) — Annual", "annual"], ["medishieldIP", "MediShield Life / IP (MA) — Annual", "annual"], ["elderCareShield", "ElderShield / CareShield (MA) — Annual", "annual"]].map(([n, l, freq]) => (
                    <div key={n}><div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#f472b6", textTransform: "uppercase", marginBottom: 4 }}>{l.replace(" — Annual","")}</div>
                      <input type="text" inputMode="decimal" name={n} value={getDisplayValue(n, inputs[n])} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={() => setFocusedField(n)} aria-label={l} style={{ width: "100%", padding: "8px 12px", background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} /></div>
                  ))}
                  {/* CPFIS — OA and SA separate fields */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ padding: "10px 0", borderRadius: 10, background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.18)" }}>
                      <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#f472b6", textTransform: "uppercase", marginBottom: 4, paddingLeft: 12, paddingRight: 12 }}>
                        CPFIS – OA Invested <FreqToggle freqKey="cpfisOaFreq" durKey="cpfisOaDur" inputs={inputs} setInputs={setInputs} />
                        <TooltipBox id="t-cpfis-oa" text="CPF Investment Scheme (OA): Only OA savings ABOVE $20,000 are investible — the first $20k must always remain in OA. Investment returns are NOT modelled — only the annual outflow from OA is applied. Age 18+. Complete CPFIS SAQ first." />
                      </div>
                      {(() => {
                        const oaBal = Number(inputs.oaBalance) || 0;
                        const cpfisOaInvestible = Math.max(0, oaBal - 20000);
                        const isUnder18_cpfis = (Number(inputs.currentAge) || 0) < 18;
                        return (
                          <>
                            <input type="text" inputMode="decimal" name="cpfisOaAmount" value={getDisplayValue("cpfisOaAmount", inputs.cpfisOaAmount)} onFocus={() => setFocusedField("cpfisOaAmount")}
                              onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                              readOnly={isUnder18_cpfis} tabIndex={isUnder18_cpfis ? -1 : undefined}
                              aria-label="Annual CPFIS OA investment amount"
                              style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)",
                                border: `1px solid ${inputErrors.cpfisOaAmount ? "var(--clr-red)" : "rgba(244,63,94,0.2)"}`,
                                borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none",
                                fontFamily: "monospace", boxSizing: "border-box",
                                opacity: isUnder18_cpfis ? 0.4 : 1, cursor: isUnder18_cpfis ? "not-allowed" : "text" }} />
                            {isUnder18_cpfis
                              ? <p style={{ fontSize: 10, color: "var(--clr-amber)", marginTop: 2, paddingLeft: 12 }}>⚠ CPFIS requires age 18+</p>
                              : inputErrors.cpfisOaAmount && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2, paddingLeft: 12 }}>⚠ {inputErrors.cpfisOaAmount}</p>}
                            {!isUnder18_cpfis && (
                              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, paddingLeft: 12 }}>
                                Investible (OA − $20k floor): <strong style={{ color: cpfisOaInvestible === 0 ? "var(--clr-red)" : "var(--text-highlight)", fontFamily: "monospace" }}>{formatCurrency(cpfisOaInvestible)}</strong>
                                {cpfisOaInvestible === 0 && <span style={{ color: "var(--clr-red)", fontWeight: 700 }}> · OA ≤ $20k</span>}
                                {" "}· returns not modelled
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div style={{ padding: "10px 0", borderRadius: 10, background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.18)" }}>
                      <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#f472b6", textTransform: "uppercase", marginBottom: 4, paddingLeft: 12, paddingRight: 12 }}>
                        CPFIS – SA Invested <FreqToggle freqKey="cpfisSaFreq" durKey="cpfisSaDur" inputs={inputs} setInputs={setInputs} />
                        <TooltipBox id="t-cpfis-sa" text="CPF Investment Scheme (SA): Only SA savings ABOVE $40,000 are investible. SA CPFIS is only available before age 55 — SA closes at 55 (merges into RA) and cannot be invested via CPFIS after that. Investment returns are NOT modelled — only the annual outflow from SA is applied." />
                      </div>
                      {(() => {
                        const saBal = Number(inputs.saBalance) || 0;
                        const ca = Number(inputs.currentAge) || 0;
                        const is55Plus_cpfis = ca >= 55;
                        const isUnder18_cpfis_sa = ca < 18;
                        const cpfisDisabled = is55Plus_cpfis || isUnder18_cpfis_sa;
                        const cpfisSaInvestible = cpfisDisabled ? 0 : Math.max(0, saBal - 40000);
                        return (
                          <>
                            <input type="text" inputMode="decimal" name="cpfisSaAmount" value={getDisplayValue("cpfisSaAmount", inputs.cpfisSaAmount)} onFocus={() => setFocusedField("cpfisSaAmount")}
                              onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                              readOnly={cpfisDisabled} tabIndex={cpfisDisabled ? -1 : undefined}
                              aria-label="Annual CPFIS SA investment amount"
                              style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)",
                                border: `1px solid ${inputErrors.cpfisSaAmount ? "var(--clr-red)" : "rgba(244,63,94,0.2)"}`,
                                borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none",
                                fontFamily: "monospace", boxSizing: "border-box",
                                cursor: cpfisDisabled ? "not-allowed" : "text",
                                opacity: cpfisDisabled ? 0.4 : 1 }} />
                            {!cpfisDisabled && inputErrors.cpfisSaAmount && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2, paddingLeft: 12 }}>⚠ {inputErrors.cpfisSaAmount}</p>}
                            <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3, paddingLeft: 12 }}>
                              {is55Plus_cpfis
                                ? <span style={{ color: "var(--clr-red)" }}>SA closed at 55 — SA CPFIS not available</span>
                                : isUnder18_cpfis_sa
                                  ? <span style={{ color: "var(--clr-amber)" }}>⚠ CPFIS requires age 18+</span>
                                  : <>Investible (SA − $40k floor): <strong style={{ color: cpfisSaInvestible === 0 ? "var(--clr-red)" : "var(--text-highlight)", fontFamily: "monospace" }}>{formatCurrency(cpfisSaInvestible)}</strong>
                                    {cpfisSaInvestible === 0 && <span style={{ color: "var(--clr-red)", fontWeight: 700 }}> · SA ≤ $40k</span>}
                                    {" "}· returns not modelled</>}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {/* D1: OA Education Loan Scheme */}
                  {(() => {
                    const ca = Number(inputs.currentAge) || 0;
                    const oaBal = Number(inputs.oaBalance) || 0;
                    // BUG-21 fix: engine uses (oa + cumEduOut) * 0.40 − cumEduOut (cumulative policy formula).
                    // At input time cumEduOut = 0 (no prior withdrawals yet), so the first-year cap equals oaBal * 0.40.
                    // However, the engine's cap GROWS as prior education withdrawals accumulate — the sidebar
                    // was showing this as a hard ceiling, misleading users. We now display it as a "starting cap"
                    // with a note that the engine applies the correct cumulative formula throughout the projection.
                    const eduCap40 = Math.max(0, oaBal * 0.40);
                    const enteredEdu = Number(inputs.oaEduLoan) || 0;
                    const isOver40 = enteredEdu > eduCap40 && oaBal > 0;
                    const is55PlusEdu = ca >= 55;
                    // Age 55+ FRS check (informational — engine enforces per year)
                    const currentFRS55 = Math.round(RETIREMENT_SUMS_2026.FRS);
                    const currentSaRa = Number(is55PlusEdu ? inputs.saBalance : 0) || 0;
                    const frsNotMet = is55PlusEdu && currentSaRa < currentFRS55;
                    return (
                      <div style={{ paddingTop: 8, borderTop: "1px solid rgba(244,63,94,0.15)" }}>
                        <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#f472b6", textTransform: "uppercase", marginBottom: 4 }}>
                          OA Education Loan Scheme <FreqToggle freqKey="oaEduLoanFreq" durKey="oaEduLoanDur" inputs={inputs} setInputs={setInputs} />
                          <TooltipBox id="t-oaedu" text="CPF Education Loan Scheme: use your OA savings (or a family member's) to pay subsidised tuition fees at approved local institutions (NUS, NTU, SMU, SIT, SUTD, SUSS, polytechnics, LASALLE, NAFA). Withdrawal limit: 40% of accumulated OA savings (excluding housing amounts already used), or remaining OA balance, whichever is lower. Interest accrues at 2.5%/yr immediately upon withdrawal. Repayment must begin 1 year after graduation and be completed within 12 years — in cash only, not CPF. Age 55+ lenders: FRS must be set aside in RA first. Modelled as a pure OA outflow; cash repayment back to OA is not projected here." />
                        </div>
                        {frsNotMet && (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, background: "rgba(var(--clr-orange-rgb),0.1)", border: "1px solid rgba(var(--clr-orange-rgb),0.35)", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                            <AlertTriangle style={{ width: 11, height: 11, color: "var(--clr-orange)", flexShrink: 0, marginTop: 1 }} />
                            <p style={{ fontSize: 10, color: "#fdba74", margin: 0, lineHeight: 1.5 }}>
                              <strong>Age 55+ — FRS not yet met.</strong> CPF policy requires FRS to be set aside in RA before OA can be used for education loans. Engine will skip this outflow until RA ≥ FRS.
                            </p>
                          </div>
                        )}
                        <input type="text" inputMode="decimal" name="oaEduLoan"
                          value={getDisplayValue("oaEduLoan", inputs.oaEduLoan)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                          onFocus={() => setFocusedField("oaEduLoan")}
                          aria-label="Annual OA education loan amount"
                          style={{ width: "100%", padding: "8px 12px",
                            background: isOver40 ? "rgba(var(--clr-orange-rgb),0.07)" : "rgba(244,63,94,0.05)",
                            border: `1px solid ${inputErrors.oaEduLoan ? "var(--clr-red)" : isOver40 ? "rgba(var(--clr-orange-rgb),0.5)" : "rgba(244,63,94,0.15)"}`,
                            borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none",
                            fontFamily: "monospace", boxSizing: "border-box" }} />
                        {inputErrors.oaEduLoan
                          ? <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.oaEduLoan}</p>
                          : <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                              Initial 40% OA cap: <strong style={{ color: eduCap40 === 0 ? "var(--clr-red)" : isOver40 ? "var(--clr-orange)" : "var(--text-highlight)", fontFamily: "monospace" }}>{formatCurrency(eduCap40)}</strong>
                              {isOver40 && <span style={{ color: "var(--clr-orange)", fontWeight: 700 }}> · Exceeds initial cap — engine auto-caps</span>}
                              {" "}· <span style={{ color: "var(--text-subtle)" }} title="Engine uses (OA + cumulative prior edu/investment withdrawals) × 40% − prior withdrawals each year — cap rises as education loans accumulate">Cap grows as loans accumulate ⓘ</span>
                              {" "}· OA outflow only · repayment in cash (not modelled)
                            </p>}
                      </div>
                    );
                  })()}
                  {/* OA Withdrawal (from age 55) */}
                  <div style={{ paddingTop: 8, borderTop: "1px solid rgba(244,63,94,0.15)" }}>
                    <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#f472b6", textTransform: "uppercase", marginBottom: 4 }}>
                      OA Lump Sum Withdrawal (from age 55) <FreqToggle freqKey="oaWithdrawalFreq" inputs={inputs} setInputs={setInputs} />
                      <TooltipBox id="t-oawithdraw" text="From age 55, after SA closes, you may withdraw OA savings above the BRS ($110,200). Withdrawn from OA permanently. For Property Pledge withdrawals use the Pledge RA Withdrawal fields in the Property & Timelines panel." />
                    </div>
                    <input type="text" inputMode="decimal" name="oaWithdrawalAt55" value={getDisplayValue("oaWithdrawalAt55", inputs.oaWithdrawalAt55)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="OA lump sum withdrawal from age 55" onFocus={() => setFocusedField("oaWithdrawalAt55")} style={{ width: "100%", padding: "8px 12px", background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                    <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>From age 55 · partial or full withdrawal · OA balance reduces accordingly</p>
                  </div>
                  <div><div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#f472b6", textTransform: "uppercase", marginBottom: 4 }}>Medical Inflation Rate (%)</div>
                    <input type="text" inputMode="decimal" name="medicalInflationRate" value={inputs.medicalInflationRate} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} step="0.5" aria-label="Medical inflation rate" style={{ width: "100%", padding: "8px 12px", background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} /></div>
                </div>
              </div>}
            </div>{/* /outflows inner */}
            </div>{/* /outflows gate wrapper */}

            {/* CPF Transfers */}
            <div style={{ position: "relative" }}>
            {isForeigner && (
              <div style={{ position: "absolute", inset: 0, zIndex: 20, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.55)", pointerEvents: "all" }}>
                <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(var(--clr-amber-rgb),0.4)", borderRadius: 10, padding: "8px 18px", fontSize: 10, color: "var(--clr-amber)", fontWeight: 700 }}>🔒 CPF scheme — not available to foreigners</div>
              </div>
            )}
            <div style={{ opacity: isForeigner ? 0.2 : 1, pointerEvents: isForeigner ? "none" : "auto", background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
              <div onClick={() => toggleSection("transfers")} tabIndex={0} className="sidebar-section-header" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection("transfers"); } }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none", background: openSections.has("transfers") ? "rgba(var(--clr-amber-rgb),0.06)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--clr-amber)" }}>
                  <ArrowRightLeft style={{ width: 14, height: 14 }} /><span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>CPF Transfers ($/yr)</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{openSections.has("transfers") ? "▲" : "▼"}</span>
              </div>
              {openSections.has("transfers") && <div style={{ padding: "0 16px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* OA → MA */}
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: inputErrors.oaToMaTransfer ? "var(--clr-orange)" : "var(--clr-amber)", textTransform: "uppercase", marginBottom: 4 }}>
                      <span>OA → MA Transfer</span> <FreqToggle freqKey="oaToMaFreq" durKey="oaToMaDur" inputs={inputs} setInputs={setInputs} />
                      <TooltipBox id="t-oatoma" text="CPF policy: OA→MA requires age 55+. You must have set aside FRS, or BRS if you own a property with sufficient lease. For self: internal move (OA ↓, MA ↑). For loved one (spouse/parent/sibling/grandparent): funds leave your OA permanently as an outflow — your MA does not increase." />
                    </div>
                    {/* Age gate warning */}
                    {!is55Plus && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, background: "rgba(var(--clr-orange-rgb),0.1)", border: "1px solid rgba(var(--clr-orange-rgb),0.35)", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                        <AlertTriangle style={{ width: 11, height: 11, color: "var(--clr-orange)", flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 10, color: "#fdba74", margin: 0, lineHeight: 1.5 }}>
                          <strong>Age 55+ required.</strong> OA→MA transfers are not permitted before age 55 (CPF policy). Any amount entered here will be ignored by the engine until age 55 is reached.
                        </p>
                      </div>
                    )}
                    {/* For self / For loved one toggle */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {[["For Self", false], ["For Loved One", true]].map(([label, val]) => (
                        <button key={label} onClick={() => setInputs(p => ({ ...p, oaToMaForLovedOne: val }))}
                          style={{ flex: 1, padding: "5px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, border: "1px solid", cursor: "pointer",
                            background: inputs.oaToMaForLovedOne === val ? (val ? "rgba(244,63,94,0.2)" : "rgba(var(--clr-amber-rgb),0.15)") : "transparent",
                            color: inputs.oaToMaForLovedOne === val ? (val ? "var(--clr-red)" : "var(--clr-amber)") : "var(--text-muted)",
                            borderColor: inputs.oaToMaForLovedOne === val ? (val ? "rgba(244,63,94,0.5)" : "rgba(var(--clr-amber-rgb),0.4)") : "var(--border-strong)" }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {inputs.oaToMaForLovedOne && (
                      <div style={{ background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 6, padding: "7px 10px", marginBottom: 8 }}>
                        <p style={{ fontSize: 10, color: "#fca5a5", margin: 0, lineHeight: 1.5 }}>
                          <strong style={{ color: "var(--clr-red)" }}>Outflow mode:</strong> Funds leave your OA permanently. Eligible recipients: spouse, parents, parents-in-law, grandparents, grandparents-in-law, or siblings. Recipient's MA must be below BHS.
                        </p>
                      </div>
                    )}
                    {(() => {
                      const bhsNow = Math.round(RETIREMENT_SUMS_2026.BHS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, Math.max(0, (Number(inputs.currentYear) || 2026) - 2026)));
                      const maRoom = Math.max(0, bhsNow - (Number(inputs.maBalance) || 0));
                      const enteredAmt = Number(inputs.oaToMaTransfer) || 0;
                      const isOver = !inputs.oaToMaForLovedOne && enteredAmt > maRoom;
                      return (
                        <>
                          <input type="text" inputMode="decimal" name="oaToMaTransfer" value={getDisplayValue("oaToMaTransfer", inputs.oaToMaTransfer)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Annual OA to MA transfer" onFocus={() => setFocusedField("oaToMaTransfer")} style={{ width: "100%", padding: "8px 12px", background: isOver ? "rgba(var(--clr-orange-rgb),0.07)" : "rgba(var(--clr-amber-rgb),0.05)", border: `1px solid ${inputErrors.oaToMaTransfer ? "var(--clr-red)" : isOver ? "rgba(var(--clr-orange-rgb),0.5)" : "rgba(var(--clr-amber-rgb),0.2)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                          {inputErrors.oaToMaTransfer && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.oaToMaTransfer}</p>}
                          {!inputs.oaToMaForLovedOne && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                              <p style={{ fontSize: 10, color: maRoom === 0 ? "var(--clr-red)" : "var(--text-muted)", margin: 0 }}>
                                MA: <strong style={{ color: "var(--text-highlight)", fontFamily: "monospace" }}>{formatCurrency(Number(inputs.maBalance) || 0)}</strong>
                                {" "}/ BHS: <strong style={{ color: "var(--text-highlight)", fontFamily: "monospace" }}>{formatCurrency(bhsNow)}</strong>
                                {" "}· Headroom: <strong style={{ color: maRoom === 0 ? "var(--clr-red)" : "var(--clr-amber)", fontFamily: "monospace" }}>{formatCurrency(maRoom)}</strong>
                              </p>
                              {maRoom === 0 && <span style={{ fontSize: 9, color: "var(--clr-red)", fontWeight: 700 }}>BHS reached ✓</span>}
                            </div>
                          )}
                          {isOver && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(var(--clr-orange-rgb),0.1)", border: "1px solid rgba(var(--clr-orange-rgb),0.3)", borderRadius: 6, padding: "5px 8px", marginTop: 4 }}>
                              <AlertTriangle style={{ width: 10, height: 10, color: "var(--clr-orange)", flexShrink: 0 }} />
                              <p style={{ fontSize: 10, color: "#fdba74", margin: 0 }}>Exceeds BHS headroom — engine auto-caps to {formatCurrency(maRoom)}/yr</p>
                            </div>
                          )}
                          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                            Age 55+ required · {inputs.oaToMaForLovedOne ? "outflow from your OA (loved one's MA not tracked here)" : "internal move OA→MA"} · irreversible · no tax relief
                          </p>
                        </>
                      );
                    })()}
                  </div>
                  {/* OA → SA (pre-55) / OA → RA (55 and above) */}
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: inputErrors.oaToSaTransfer ? "var(--clr-orange)" : "var(--clr-amber)", textTransform: "uppercase", marginBottom: 4 }}>
                      <span>{is55Plus ? "OA → RA Transfer" : "OA → SA Transfer"}</span> <FreqToggle freqKey="oaToSaFreq" durKey="oaToSaDur" inputs={inputs} setInputs={setInputs} />
                      <TooltipBox id="t-oatosa" text={is55Plus
                        ? "Transfer OA savings to your RA (or a loved one's RA) to earn 4% instead of 2.5%. Available from age 55. For Self: capped at ERS ($440,800) in RA. Irreversible. No tax relief. For Loved One: OA is simply an outflow — their RA is not tracked here."
                        : "Transfer OA savings to your SA (or a loved one's SA) to earn 4% instead of 2.5%. Before age 55 this goes to SA; from age 55 the engine automatically redirects the same amount to RA instead (SA is closed at 55). For Self: capped at FRS ($220,400) in SA pre-55, then ERS in RA post-55. Irreversible. No tax relief."
                      } />
                    </div>
                    {/* For Self / For Loved One toggle — matches OA→MA style */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {[["For Self", false], ["For Loved One", true]].map(([label, val]) => (
                        <button key={label} onClick={() => setInputs(p => ({ ...p, oaToSaForLovedOne: val }))}
                          style={{ flex: 1, padding: "5px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, border: "1px solid", cursor: "pointer",
                            background: inputs.oaToSaForLovedOne === val ? (val ? "rgba(244,63,94,0.2)" : "rgba(var(--clr-amber-rgb),0.15)") : "transparent",
                            color: inputs.oaToSaForLovedOne === val ? (val ? "var(--clr-red)" : "var(--clr-amber)") : "var(--text-muted)",
                            borderColor: inputs.oaToSaForLovedOne === val ? (val ? "rgba(244,63,94,0.5)" : "rgba(var(--clr-amber-rgb),0.4)") : "var(--border-strong)" }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {inputs.oaToSaForLovedOne && (
                      <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.25)", fontSize: 9, color: "#fca5a5", lineHeight: 1.6 }}>
                        <strong style={{ color: "var(--clr-red)" }}>For Loved One:</strong> The entered amount is deducted from <em>your</em> OA each year and treated as an outflow. Your loved one's {is55Plus ? "RA" : "SA"} is not tracked in this tool. FRS/ERS headroom check is skipped — only your OA balance limits the transfer.
                      </div>
                    )}
                    <input type="text" inputMode="decimal" name="oaToSaTransfer" value={getDisplayValue("oaToSaTransfer", inputs.oaToSaTransfer)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label={is55Plus ? "Annual OA to RA transfer" : "Annual OA to SA transfer"} onFocus={() => setFocusedField("oaToSaTransfer")} style={{ width: "100%", padding: "8px 12px", background: inputs.oaToSaForLovedOne ? "rgba(244,63,94,0.05)" : "rgba(var(--clr-amber-rgb),0.05)", border: `1px solid ${inputErrors.oaToSaTransfer ? "var(--clr-red)" : inputs.oaToSaForLovedOne ? "rgba(244,63,94,0.2)" : "rgba(var(--clr-amber-rgb),0.2)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                    {inputErrors.oaToSaTransfer && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.oaToSaTransfer}</p>}
                    <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                      {inputs.oaToSaForLovedOne
                        ? `OA outflow only · loved one's ${is55Plus ? "RA" : "SA"} not tracked · irreversible · no tax relief`
                        : is55Plus
                          ? "Age 55+ · capped at ERS in RA · irreversible · not in Annual Limit · no tax relief"
                          : "Pre-55 → SA · age 55+ auto-redirects to RA · capped at FRS/ERS · irreversible · no tax relief"}
                    </p>
                    {/* NX4 fix: clarify SA→RA auto-transition so users entering this field at 40
                        understand the same amount continues as OA→RA after their 55th birthday */}
                    {!inputs.oaToSaForLovedOne && !is55Plus && (
                      <p style={{ fontSize: 9, color: "var(--text-subtle)", marginTop: 2 }}>
                        ⚙ From age 55 this transfer automatically redirects to RA — SA closes at 55.
                      </p>
                    )}
                    {/* Rev #10 — forward-looking auto-stop message */}
                    {/* P3 fix: was an inline IIFE calling displayAccumulation.find() on every render;
                        now reads from the oaToSaCrossover useMemo computed above */}
                    {!inputs.oaToSaForLovedOne && (() => {
                      const { alreadyMet, crossoverAge, label: _label, capLabel: _capLabel, targetSum: _targetSum } = oaToSaCrossover;
                      if (alreadyMet) {
                        return (
                          <p style={{ fontSize: 9, color: "var(--clr-orange)", marginTop: 2 }}>
                            ⚙ {_label} already at/above {_capLabel} ({formatCurrency(_targetSum)}) — transfers have no effect.
                          </p>
                        );
                      }
                      if (crossoverAge != null) {
                        return (
                          <p style={{ fontSize: 9, color: "var(--clr-green)", marginTop: 2 }}>
                            ⚙ Engine auto-stops transfers at est. age <strong>{crossoverAge}</strong> when {_label} reaches projected {_capLabel}.
                          </p>
                        );
                      }
                      return (
                        <p style={{ fontSize: 9, color: "var(--text-subtle)", marginTop: 2 }}>
                          ⚙ {_label} does not reach {_capLabel} within the projection horizon at current inputs.
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>}
            </div>{/* /transfers inner */}
            </div>{/* /transfers gate wrapper */}

            {/* Property — consolidated section */}
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "hidden" }}>
    </>
  );
}
