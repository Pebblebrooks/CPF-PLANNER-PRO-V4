import React from "react";
import { Briefcase, Home, BookOpen, Info, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { RETIREMENT_SUMS_2026, SRS_CAP_SC_PR, SRS_CAP_FOREIGNER } from "../config/constants.js";
import { TooltipBox } from "../SharedComponents.jsx";
import { FreqToggle } from "../SharedComponents.jsx";

// SidebarAssets
// Receives all state as props — no direct App state access.
// Shared props: inputs, setInputs, inputErrors, openSections, toggleSection,
//              handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency
// Section-specific props: isForeigner, projection, leEditingId, setLeEditingId, leFormState, setLeFormState
export default function SidebarAssets({ inputs, setInputs, inputErrors, openSections, toggleSection, handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency,
  isForeigner, projection, leEditingId, setLeEditingId, leFormState, setLeFormState }) {
  return (
    <>
              <div onClick={() => toggleSection("property")} tabIndex={0} className="sidebar-section-header" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection("property"); } }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none", background: openSections.has("property") ? "rgba(var(--clr-blue-rgb),0.06)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--clr-blue)" }}>
                  <Home style={{ width: 14, height: 14 }} /><span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>Property & Timelines</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{openSections.has("property") ? "▲" : "▼"}</span>
              </div>
              {openSections.has("property") && <div style={{ padding: "0 16px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                  {/* Timelines */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[["contributionStopAge", "Contrib Stop Age"], ["housingStopAge", "Housing Stop Age"]].map(([n, l]) => (
                      <div key={n}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: inputErrors[n] ? "var(--clr-red)" : "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>
                          {l}{inputErrors[n] && <span style={{ marginLeft: 4, fontSize: 9, color: "var(--clr-red)" }}>⚠</span>}
                        </label>
                        <input type="text" inputMode="decimal" name={n} value={getDisplayValue(n, inputs[n])} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={() => setFocusedField(n)} aria-label={l} aria-invalid={!!inputErrors[n]} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors[n] ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                      </div>
                    ))}
                  </div>

                  {/* Inflation */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>Inflation Rate (%)</label>
                    <input type="text" inputMode="decimal" name="inflationRate" value={inputs.inflationRate} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Inflation rate" style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.inflationRate ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                    {inputErrors.inflationRate && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.inflationRate}</p>}
                  </div>

                  {/* Property details */}
                  <div style={{ paddingTop: 8, borderTop: "1px solid rgba(var(--clr-blue-rgb),0.15)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase" }}>Include Property in Net Worth</label>
                      <button onClick={() => setInputs(p => ({ ...p, includeProperty: !p.includeProperty }))} aria-pressed={!!inputs.includeProperty} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: inputs.includeProperty ? "var(--clr-emerald)" : "var(--bg-input)", color: inputs.includeProperty ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>{inputs.includeProperty ? "ON" : "OFF"}</button>
                    </div>
                    <div style={{ opacity: inputs.includeProperty ? 1 : 0.4, pointerEvents: inputs.includeProperty ? "auto" : "none", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>Property Value ($)</label>
                        <input type="text" inputMode="decimal" name="propertyValue" value={getDisplayValue("propertyValue", inputs.propertyValue)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Property value" onFocus={() => setFocusedField("propertyValue")} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.propertyValue ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                        {inputErrors.propertyValue && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.propertyValue}</p>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>Prop Growth (%)</label>
                          <input type="text" inputMode="decimal" name="propertyGrowthRate" value={inputs.propertyGrowthRate} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.propertyGrowthRate ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>
                            Type
                            <TooltipBox id="t-leasehold" text="Freehold: no lease decay. Leasehold: enter remaining lease years — property growth decelerates when lease falls below 60 years." />
                          </div>
                          <button onClick={() => setInputs(p => ({ ...p, propertyLeasehold: !p.propertyLeasehold }))} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid var(--border-strong)", cursor: "pointer", background: inputs.propertyLeasehold ? "rgba(var(--clr-blue-rgb),0.15)" : "var(--bg-muted)", color: inputs.propertyLeasehold ? "var(--clr-blue)" : "var(--text-muted)" }}>
                            {inputs.propertyLeasehold ? "Leasehold" : "Freehold"}
                          </button>
                        </div>
                      </div>
                      {inputs.propertyLeasehold && (
                        <div>
                          <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>Remaining Lease (years)</div>
                          <input type="text" inputMode="decimal" name="propertyLeaseYears" value={inputs.propertyLeaseYears} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>Growth decelerates when lease &lt; 60 yrs</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Housing loan — locked for foreigners (no OA account) */}
                  {!isForeigner && <div style={{ paddingTop: 8, borderTop: "1px solid rgba(var(--clr-blue-rgb),0.15)" }}>
                    <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>
                      Housing Loan — OA Outflow ($/yr) <FreqToggle freqKey="housingFreq" durKey="housingDur" inputs={inputs} setInputs={setInputs} />
                      <TooltipBox id="t-housing-prop" text="Annual OA deduction for mortgage repayment. Stops at Housing Stop Age. Tracked for CPF refund on property sale." />
                    </div>
                    <input type="text" inputMode="decimal" name="housingOutflow" value={getDisplayValue("housingOutflow", inputs.housingOutflow)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Annual housing loan outflow" onFocus={() => setFocusedField("housingOutflow")} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.housingOutflow ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                    {inputErrors.housingOutflow && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.housingOutflow}</p>}
                  </div>}

                  {/* OA Downpayment — locked for foreigners (no OA account) */}
                  {!isForeigner && <div>
                    <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>
                      OA Downpayment
                      <TooltipBox id="t-dp-prop" text="One-time OA deduction for property purchase downpayment. Applied once at the specified age if OA balance permits." />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <input type="text" inputMode="decimal" name="plannedDownpaymentOA" placeholder="Amount ($)" value={inputs.plannedDownpaymentOA} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                      <input type="text" inputMode="decimal" name="downpaymentAge" placeholder="Age" value={inputs.downpaymentAge} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                    </div>
                    <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>Amount ($) · Age of purchase</p>
                  </div>}

                  {/* Sell Property */}
                  <div style={{ paddingTop: 8, borderTop: "1px solid rgba(var(--clr-blue-rgb),0.15)" }}>
                    <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>
                      Sell Property at Age
                      <TooltipBox id="t-sell-prop" text="When you sell your property, CPF requires refund of OA principal withdrawn for housing + 2.5%/yr accrued interest. The full refund is credited to OA. Property value is removed from net worth at the sale age." />
                    </div>
                    <input type="text" inputMode="decimal" name="sellPropertyAge" value={inputs.sellPropertyAge} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} placeholder="0 = no sale" aria-label="Age to sell property" style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.sellPropertyAge ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} />
                    {inputErrors.sellPropertyAge && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.sellPropertyAge}</p>}
                    {(Number(inputs.sellPropertyAge) || 0) > 0 && <p style={{ fontSize: 10, color: "var(--clr-blue)", marginTop: 4, lineHeight: 1.5 }}>Sale at age {inputs.sellPropertyAge}: OA principal + 2.5%/yr interest refunded to OA.{inputs.usePropertyPledge ? " Pledge active: RA restored to FRS first." : ""} Property removed from net worth.</p>}
                  </div>

                  {/* Property Pledge — hidden for foreigners (requires CPF RA; SC/PR only) */}
                  {!isForeigner && <div style={{ paddingTop: 8, borderTop: "1px solid rgba(var(--clr-blue-rgb),0.15)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>
                          Property Pledge (BRS only)
                          <TooltipBox id="t-pledge" text="A CPF Property Pledge lets you use your property as security so only BRS ($110,200) needs to remain in RA at 55. The pledged sum (RA above BRS) stays in RA earning 4% until you apply to CPF to withdraw it as cash directly to your bank account — it does NOT move to OA. Payouts will be significantly lower (~$730–$790/mo vs ~$1,350–$1,450/mo at FRS). Property must have lease to age 95. HDB 2-room Flexi and Lease Buyback Scheme properties ineligible." />
                        </div>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Only BRS needed in RA at 55 · pledged sum stays in RA at 4% · withdraw as cash via CPF application</p>
                      </div>
                      <button onClick={() => setInputs(p => ({ ...p, usePropertyPledge: !p.usePropertyPledge }))} aria-pressed={!!inputs.usePropertyPledge} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: inputs.usePropertyPledge ? "var(--clr-emerald)" : "var(--bg-input)", color: inputs.usePropertyPledge ? "var(--ctrl-on-text)" : "var(--text-muted)", flexShrink: 0, marginTop: 2 }}>{inputs.usePropertyPledge ? "ON" : "OFF"}</button>
                    </div>
                    {inputs.usePropertyPledge && (() => {
                      const ca = Number(inputs.currentAge) || 35;
                      const cy = Number(inputs.currentYear) || 2026;
                      const yearsTo55 = Math.max(0, 55 - ca);
                      const projBRS55 = Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, Math.max(0, (cy + yearsTo55) - 2026)));
                      const projFRS55 = projBRS55 * 2;
                      const approxPledgedAmount = Math.max(0, projFRS55 - projBRS55);
                      return (
                        <div style={{ background: "rgba(var(--clr-blue-rgb),0.04)", border: "1px solid rgba(var(--clr-blue-rgb),0.2)", borderRadius: 10, padding: "10px 12px" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.05em" }}>🏠 Pledge RA Withdrawal</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.5 }}>
                            Pledged funds sit in RA (4%) until you apply to CPF to withdraw. Only RA above BRS can be withdrawn as cash. Estimated pledgeable amount at age 55: <strong style={{ color: "var(--text-bright)" }}>{formatCurrency(approxPledgedAmount)}</strong> (FRS − BRS at age 55 in {cy + yearsTo55}).
                          </p>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>Withdrawal Amount ($)</label>
                              <input type="text" inputMode="decimal" name="pledgeWithdrawalAmount" value={inputs.pledgeWithdrawalAmount} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Pledge RA withdrawal amount" style={{ width: "100%", padding: "8px 12px", background: "rgba(var(--clr-blue-rgb),0.05)", border: "1px solid rgba(var(--clr-blue-rgb),0.2)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>Max = RA − BRS at withdrawal age</p>
                            </div>
                            <div>
                              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>Withdrawal Age</label>
                              <input type="text" inputMode="decimal" name="pledgeWithdrawalAge" value={inputs.pledgeWithdrawalAge} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} aria-label="Pledge RA withdrawal age" min="55" style={{ width: "100%", padding: "8px 12px", background: "rgba(var(--clr-blue-rgb),0.05)", border: `1px solid ${inputErrors.pledgeWithdrawalAge ? "var(--clr-red)" : "rgba(var(--clr-blue-rgb),0.2)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                              {inputErrors.pledgeWithdrawalAge && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.pledgeWithdrawalAge}</p>}
                              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>Min age 55 · applied once</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>}


                  {/* Property Monetisation — hidden for foreigners (LBS = HDB/SC-only; SHB = SC-only; RA top-up requires CPF RA) */}
                  {!isForeigner && <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid rgba(var(--clr-blue-rgb),0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 800, color: "var(--clr-blue)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                          Property Monetisation
                          <TooltipBox id="t-prop-mon" text="Model a one-time property monetisation event. Choose your scheme — Downgrade (sell and buy smaller), LBS (Lease Buyback — sell tail-end of HDB lease to HDB, stay in flat, from age 65), or SHB (Silver Housing Bonus — downgrade to 3-room or smaller HDB with CPF RA bonus). The field labels, tooltips, and validations update per scheme. The engine credits cash proceeds to private assets and RA top-up directly to RA as a one-time event at your chosen age. Note: if modelling a property sale via 'Sell Property at Age', the CPF OA refund on that sale is handled separately." />
                        </p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Downgrade · LBS · Silver Housing Bonus · one-time event</p>
                      </div>
                      <button onClick={() => setInputs(p => ({ ...p, propMonetiseEnabled: !p.propMonetiseEnabled }))} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: inputs.propMonetiseEnabled ? "var(--clr-blue)" : "var(--bg-input)", color: inputs.propMonetiseEnabled ? "var(--ctrl-on-text)" : "var(--text-muted)", flexShrink: 0 }}>{inputs.propMonetiseEnabled ? "ON" : "OFF"}</button>
                    </div>
                    {inputs.propMonetiseEnabled && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {/* Scheme selector — labels, tooltips, validation, and guidance text are scheme-specific */}
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>Scheme</label>
                          <div style={{ display: "flex", background: "var(--bg-input)", padding: 3, borderRadius: 8, border: "1px solid var(--border-strong)", gap: 2 }}>
                            {[["downgrade", "Downgrade"], ["lbs", "LBS"], ["shb", "Silver HB"]].map(([val, label]) => (
                              <button key={val} onClick={() => setInputs(p => ({ ...p, propMonetiseScheme: val }))} style={{ flex: 1, padding: "4px 6px", borderRadius: 6, fontSize: 9, fontWeight: 700, border: "none", cursor: "pointer", background: (inputs.propMonetiseScheme ?? "downgrade") === val ? "var(--clr-blue)" : "transparent", color: (inputs.propMonetiseScheme ?? "downgrade") === val ? "var(--ctrl-on-text)" : "var(--text-muted)", whiteSpace: "nowrap" }}>{label}</button>
                            ))}
                          </div>
                          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                            {(inputs.propMonetiseScheme ?? "downgrade") === "downgrade" && "Sell existing home, buy smaller. Enter net cash after CPF OA refund (handled by Sell Property at Age), agent fees, stamp duty, and replacement home cost. Any voluntary RA top-up from proceeds is optional."}
                            {(inputs.propMonetiseScheme ?? "downgrade") === "lbs" && "Sell tail-end of HDB lease to HDB; you stay in your flat for life. Available from age 65 (SC only). HDB pays an annuity premium directly into RA (enter in RA field below); you may also receive a smaller cash component. ⚠ Monthly LBS income is not modelled as a cash stream — add it as private income in Decumulation & Goals if needed."}
                            {(inputs.propMonetiseScheme ?? "downgrade") === "shb" && "Downgrade to a 3-room or smaller HDB; govt tops up RA as a CPF bonus. Cash bonus (if any) enters private assets; CPF RA bonus enters RA. Bonus amount depends on flat type — verify the exact figures with CPF Board before entering."}
                          </p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>Age of Event</label>
                            <input type="text" inputMode="decimal" name="propMonetiseAge" value={inputs.propMonetiseAge} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.propMonetiseAge ? "var(--clr-red)" : "rgba(var(--clr-blue-rgb),0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                            {inputErrors.propMonetiseAge && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.propMonetiseAge}</p>}
                          </div>
                          <div>
                            <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>
                              {(inputs.propMonetiseScheme ?? "downgrade") === "downgrade" && "Net Cash Proceeds ($)"}
                              {(inputs.propMonetiseScheme ?? "downgrade") === "lbs" && "LBS Cash Component ($)"}
                              {(inputs.propMonetiseScheme ?? "downgrade") === "shb" && "Cash Bonus ($)"}
                              {(inputs.propMonetiseScheme ?? "downgrade") === "downgrade" && <TooltipBox id="t-pm-cash" text="Net cash received into your bank account after all deductions: sale price minus CPF OA refund (the OA refund is handled by 'Sell Property at Age'), agent commissions, stamp duties, and the cost of your replacement home. This amount is credited to your private assets at the event age." />}
                              {(inputs.propMonetiseScheme ?? "downgrade") === "lbs" && <TooltipBox id="t-pm-cash" text="The cash component HDB pays you at LBS completion — typically a small amount after the annuity premium is deducted and routed to RA. Many LBS recipients receive $0 cash (all proceeds go to RA as annuity premium). Enter 0 if your LBS deal has no cash component. Credited to private assets." />}
                              {(inputs.propMonetiseScheme ?? "downgrade") === "shb" && <TooltipBox id="t-pm-cash" text="Any cash Silver Housing Bonus amount. Note: the SHB bonus is primarily credited to RA (enter in the RA field below), not paid as cash. This field is for any residual cash payout. Enter 0 if no cash component applies to your specific SHB type. Credited to private assets." />}
                            </div>
                            <input type="text" inputMode="decimal" name="propMonetiseCashProceeds" value={getDisplayValue("propMonetiseCashProceeds", inputs.propMonetiseCashProceeds)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => { setFocusedField("propMonetiseCashProceeds"); e.target.select(); }} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.propMonetiseCashProceeds ? "var(--clr-red)" : "rgba(var(--clr-blue-rgb),0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                            {inputErrors.propMonetiseCashProceeds && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.propMonetiseCashProceeds}</p>}
                          </div>
                        </div>
                        <div>
                          <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-blue)", textTransform: "uppercase", marginBottom: 4 }}>
                            {(inputs.propMonetiseScheme ?? "downgrade") === "downgrade" && "RA Top-up — Voluntary ($)"}
                            {(inputs.propMonetiseScheme ?? "downgrade") === "lbs" && "Annuity Premium to RA ($)"}
                            {(inputs.propMonetiseScheme ?? "downgrade") === "shb" && "CPF RA Bonus ($)"}
                            {(inputs.propMonetiseScheme ?? "downgrade") === "downgrade" && <TooltipBox id="t-pm-ra" text="Optional: voluntarily top up RA from your net proceeds. This grows at 4%/yr and boosts monthly CPF LIFE payouts. Leave as 0 if you prefer to keep the cash in private assets. Cannot push RA above ERS ($440,800)." />}
                            {(inputs.propMonetiseScheme ?? "downgrade") === "lbs" && <TooltipBox id="t-pm-ra" text="The annuity premium HDB pays directly into your RA — this is the core LBS mechanism. The amount depends on your flat type, remaining lease, and RA balance. It cannot exceed ERS ($440,800). This directly increases your CPF LIFE monthly payout. Check the CPF Board LBS calculator for your exact figure." />}
                            {(inputs.propMonetiseScheme ?? "downgrade") === "shb" && <TooltipBox id="t-pm-ra" text="The CPF RA bonus credited under SHB. Amount varies by flat type: typically $30,000 for 3-room or smaller, or $15,000 for 2-room Flexi. A soft warning fires if you enter more than $90,000. Confirm the exact figure with CPF Board before using this tool for financial decisions." />}
                          </div>
                          <input type="text" inputMode="decimal" name="propMonetiseRaTopup" value={getDisplayValue("propMonetiseRaTopup", inputs.propMonetiseRaTopup)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => { setFocusedField("propMonetiseRaTopup"); e.target.select(); }} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.propMonetiseRaTopup ? "var(--clr-red)" : "rgba(var(--clr-blue-rgb),0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                          {inputErrors.propMonetiseRaTopup && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.propMonetiseRaTopup}</p>}
                          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
                            {(inputs.propMonetiseScheme ?? "downgrade") === "downgrade" && "Credited to RA at event age · boosts CPF LIFE payout · reduces property value in projection"}
                            {(inputs.propMonetiseScheme ?? "downgrade") === "lbs" && "HDB annuity premium → RA · boosts CPF LIFE payout · capped at ERS ($440,800)"}
                            {(inputs.propMonetiseScheme ?? "downgrade") === "shb" && "SHB RA bonus → RA · boosts CPF LIFE payout · typically $15,000–$30,000"}
                          </p>
                          {(inputs.propMonetiseScheme ?? "downgrade") === "lbs" && (
                            <div style={{ marginTop: 6, background: "rgba(var(--clr-blue-rgb),0.06)", border: "1px solid rgba(var(--clr-blue-rgb),0.2)", borderRadius: 8, padding: "8px 10px", fontSize: 10, color: "#93c5fd", lineHeight: 1.5 }}>
                              💡 <strong>LBS monthly payout not modelled:</strong> After LBS, HDB pays you a monthly income for the duration of the sold lease tail. This stream is not modelled as a recurring cash flow here. To include it, add the estimated annual LBS payout as a recurring private income amount in the <strong>Decumulation &amp; Goals</strong> panel.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>}

                  {/* Foreigner note — shown only when citizenship = Foreigner, explains what is hidden */}
                  {isForeigner && (
                    <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid rgba(var(--clr-amber-rgb),0.2)", fontSize: 10, color: "#fde68a", background: "rgba(var(--clr-amber-rgb),0.06)", border: "1px solid rgba(var(--clr-amber-rgb),0.2)", borderRadius: 8, padding: "8px 12px", lineHeight: 1.6 }}>
                      🔒 <strong style={{ color: "var(--clr-amber)" }}>Not available to foreigners:</strong> Housing OA Outflow, OA Downpayment, Property Pledge (BRS mode), and Property Monetisation (LBS/SHB) require a CPF account (SC or PR). Property value tracking and Sell Property at Age remain active.
                    </div>
                  )}
                </div>
              </div>}
            </div>
            {/* Private Assets — accumulation inputs: cash, savings, growth, SRS */}
            <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "visible", marginTop: 12, marginBottom: 0 }}>
              <div onClick={() => toggleSection("privateAssets")} tabIndex={0} className="sidebar-section-header" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection("privateAssets"); } }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none", background: openSections.has("privateAssets") ? "rgba(var(--clr-purple-rgb),0.06)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--clr-purple)" }}>
                  <Briefcase style={{ width: 14, height: 14 }} /><span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>Private Assets</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{openSections.has("privateAssets") ? "▲" : "▼"}</span>
              </div>
              {openSections.has("privateAssets") && <div style={{ padding: "0 16px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  
                  {/* Private Assets */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-violet2)", textTransform: "uppercase", marginBottom: 4 }}>Current Private Assets ($)</label>
                    <input type="text" inputMode="decimal" name="currentPrivateAssets" value={getDisplayValue("currentPrivateAssets", inputs.currentPrivateAssets)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => { setFocusedField("currentPrivateAssets"); e.target.select(); }} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-violet2)", textTransform: "uppercase", marginBottom: 4 }}>Annual Saving</label>
                      <input type="text" inputMode="decimal" name="annualPrivateSaving" value={getDisplayValue("annualPrivateSaving", inputs.annualPrivateSaving)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => { setFocusedField("annualPrivateSaving"); e.target.select(); }} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-violet2)", textTransform: "uppercase", marginBottom: 4 }}>Growth (%)</label>
                      <input type="text" inputMode="decimal" name="privateAssetGrowthRate" value={inputs.privateAssetGrowthRate} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                    </div>
                  </div>

                  {/* SRS — Supplementary Retirement Scheme */}
                  <div style={{ paddingTop: 8, borderTop: "1px solid rgba(14,165,233,0.2)", marginTop: 4 }}>
                    <div style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 800, color: "#0ea5e9", textTransform: "uppercase", marginBottom: 3, letterSpacing: "0.06em" }}>
                        SRS — Supplementary Retirement Scheme
                        <TooltipBox id="t-srs" text="SRS is a voluntary tax-deferred savings scheme. SC/PR: contributions up to $15,300/yr are deductible from chargeable income. Foreigners: cap is $35,700/yr (no CPF, so SRS is the main tax-deferred vehicle). At statutory retirement age (63), 50% of withdrawals are taxable. All funds must be withdrawn within 10 years of first withdrawal." />
                      </p>
                      <p style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>Voluntary · tax-deductible contributions · 50% of withdrawals taxable · 10-yr drawdown window from age 63</p>
                    </div>

                    {/* POL-3 fix: annual cap varies by citizenship — foreigner $35,700, SC/PR $15,300 */}
                    {(() => {
                      const isForeigner = inputs.citizenStatus === 'foreigner';
                      const capAmt = isForeigner ? SRS_CAP_FOREIGNER : SRS_CAP_SC_PR; // P2 fix: use module constants
                      return (
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>
                          Annual cap: <strong style={{ color: isForeigner ? "var(--clr-amber3)" : "var(--text-bright)" }}>{formatCurrency(capAmt)}</strong>
                          {isForeigner
                            ? <span style={{ color: "var(--clr-amber3)" }}> · Foreigner rate (no CPF; SRS is your primary tax-deferred scheme)</span>
                            : <> · SC/PR · set citizenship in Profile</>}
                        </p>
                      );
                    })()}

                    {/* SRS fields grid */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", marginBottom: 4 }}>Current Balance ($)</label>
                          <input type="text" inputMode="decimal" name="srsBalance" value={getDisplayValue("srsBalance", inputs.srsBalance)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => { setFocusedField("srsBalance"); e.target.select(); }} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.srsBalance ? "var(--clr-red)" : "rgba(14,165,233,0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                          {inputErrors.srsBalance && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.srsBalance}</p>}
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", marginBottom: 4 }}>Annual Contribution ($)</label>
                          <input type="text" inputMode="decimal" name="srsAnnualContribution" value={getDisplayValue("srsAnnualContribution", inputs.srsAnnualContribution)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => { setFocusedField("srsAnnualContribution"); e.target.select(); }} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.srsAnnualContribution ? "var(--clr-red)" : "rgba(14,165,233,0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                          {inputErrors.srsAnnualContribution && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.srsAnnualContribution}</p>}
                          {/* Live SRS tax-saving badge */}
                          {(() => {
                            const _srsCap  = isForeigner ? SRS_CAP_FOREIGNER : SRS_CAP_SC_PR; // P2 fix: use module constants
                            const _srsElig = Math.min(Number(inputs.srsAnnualContribution) || 0, _srsCap);
                            const _srsTax  = Math.round(_srsElig * estimatedTaxRate);
                            if (_srsElig <= 0 || _srsTax <= 0) return null;
                            return (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, padding: "7px 10px", borderRadius: 7, background: "rgba(14,165,233,0.10)", border: "1px solid rgba(14,165,233,0.28)" }}>
                                <div>
                                  <span style={{ fontSize: 9, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.04em" }}>💰 Est. Tax Saved (SRS)</span>
                                  <p style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>
                                    ~{Math.round(estimatedTaxRate * 100)}% marginal rate · 50% of withdrawals taxable from 63
                                  </p>
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 900, color: "#38bdf8", fontFamily: "monospace", whiteSpace: "nowrap", marginLeft: 8 }}>
                                  {formatCurrency(_srsTax)}<span style={{ fontSize: 9, fontWeight: 400, color: "#7dd3fc", marginLeft: 3 }}>/yr</span>
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", marginBottom: 4 }}>Contrib Stop Age</label>
                          <input type="text" inputMode="decimal" name="srsContribStopAge" value={inputs.srsContribStopAge} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.srsContribStopAge ? "var(--clr-red)" : "rgba(14,165,233,0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                          {inputErrors.srsContribStopAge && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.srsContribStopAge}</p>}
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", marginBottom: 4 }}>Return Rate (%)</label>
                          <input type="text" inputMode="decimal" name="srsReturnRate" value={inputs.srsReturnRate} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.srsReturnRate ? "var(--clr-red)" : "rgba(14,165,233,0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                          {inputErrors.srsReturnRate && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.srsReturnRate}</p>}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", marginBottom: 4 }}>
                            Drawdown Start Age
                            <TooltipBox id="t-srs-draw" text="Minimum age 63 (statutory retirement age). 50% of each annual withdrawal is taxable income. Must fully deplete within 10 years of first withdrawal." />
                          </div>
                          <input type="text" inputMode="decimal" name="srsDrawdownStartAge" value={inputs.srsDrawdownStartAge} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.srsDrawdownStartAge ? "var(--clr-red)" : "rgba(14,165,233,0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                          {inputErrors.srsDrawdownStartAge && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.srsDrawdownStartAge}</p>}
                        </div>
                        <div>
                          <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#0ea5e9", textTransform: "uppercase", marginBottom: 4 }}>
                            Drawdown Years
                            <TooltipBox id="t-srs-yrs" text="Number of years over which the SRS balance is drawn down evenly. Max 10 years — IRAS requires full withdrawal within 10 years of first withdrawal." />
                          </div>
                          <input type="text" inputMode="decimal" name="srsDrawdownYears" value={inputs.srsDrawdownYears} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.srsDrawdownYears ? "var(--clr-red)" : "rgba(14,165,233,0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                          {inputErrors.srsDrawdownYears && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.srsDrawdownYears}</p>}
                        </div>
                      </div>
                      {/* Live SRS projection summary */}
                      {(Number(inputs.srsBalance) > 0 || Number(inputs.srsAnnualContribution) > 0) && (() => {
                        const bal = Number(inputs.srsBalance) || 0;
                        const contrib = Math.min(Number(inputs.srsAnnualContribution) || 0, isForeigner ? SRS_CAP_FOREIGNER : SRS_CAP_SC_PR); // P2 fix: use module constants
                        const rate = (Number(inputs.srsReturnRate) || 0) / 100;
                        const stopAge = Number(inputs.srsContribStopAge) || 63;
                        const drawAge = Math.max(Number(inputs.srsDrawdownStartAge) || 63, 63);
                        const ca = Number(inputs.currentAge) || 35;
                        const yrsToStop = Math.max(0, Math.min(stopAge, drawAge) - ca);
                        let projBal = bal;
                        for (let i = 0; i < yrsToStop; i++) { projBal = projBal * (1 + rate) + contrib; }
                        for (let i = yrsToStop; i < drawAge - ca; i++) { projBal = projBal * (1 + rate); }
                        const drawYrs = Math.min(Math.max(Number(inputs.srsDrawdownYears) || 10, 1), 10);
                        const annualDraw = drawYrs > 0 ? Math.round(projBal / drawYrs) : projBal;
                        return (
                          <div style={{ background: "rgba(14,165,233,0.06)", borderRadius: 8, padding: "8px 10px", marginTop: 2 }}>
                            <p style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 700, marginBottom: 4 }}>Projection at drawdown age {drawAge}:</p>
                            <p style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.6 }}>
                              Est. balance: <strong style={{ color: "var(--text-bright)" }}>{formatCurrency(Math.round(projBal))}</strong><br/>
                              Annual draw: <strong style={{ color: "var(--text-bright)" }}>{formatCurrency(annualDraw)}</strong> × {drawYrs} yrs<br/>
                              Monthly equiv: <strong style={{ color: "#0ea5e9" }}>{formatCurrency(Math.round(annualDraw / 12))}/mo</strong> <span style={{ color: "var(--text-muted)" }}>(50% taxable)</span>
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>


                </div>
              </div>}
            </div>

            {/* ── Rev #D2: Life Events / Stress Testing panel ── */}
            {(() => {
              const lifeEvents = Array.isArray(inputs.lifeEvents) ? inputs.lifeEvents : [];
              const enabledCount = lifeEvents.filter(e => e.enabled !== false).length;
              // leEditingId / leFormState are top-level component state (hoisted from here — BUG-2 fix).
              const leErrors = (inputErrors.lifeEvents || []);
              const getEvErr = (id, field) => {
                const idx = lifeEvents.findIndex(e => e.id === id);
                const evErr = leErrors.find(e => e.idx === idx);
                return evErr ? evErr[field] : null;
              };
              const startEdit = (ev) => { setLeFormState({ ...ev }); setLeEditingId(ev.id); };
              const startNew = () => {
                const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `le-${Date.now()}`;
                setLeFormState({ id, type: 'retrenchment', label: 'Retrenchment', startAge: Number(inputs.currentAge) || 35, endAge: (Number(inputs.currentAge) || 35) + 1, magnitude: 0, enabled: true, drawSource: 'oa_then_private', destination: 'private' });
                setLeEditingId('new');
              };
              const saveEvent = () => {
                if (!leFormState.type || leFormState.startAge === "" || leFormState.startAge === undefined || leFormState.startAge === null) return;
                const isPoint = leFormState.type === 'windfall' || leFormState.type === 'early_retirement';
                // BUG-LOW fix: block saving range events with endAge < startAge or missing endAge.
                // validateInputs already shows the UI error; without this guard the bad event
                // was committed to inputs.lifeEvents and then silently skipped by the engine
                // (the age filter never matched), giving the user no indication it was inactive.
                if (!isPoint) {
                  const sa = Number(leFormState.startAge);
                  const ea = leFormState.endAge === "" || leFormState.endAge === null || leFormState.endAge === undefined
                    ? NaN : Number(leFormState.endAge);
                  if (isNaN(ea) || ea < sa) return; // error already visible in validateInputs UI
                }
                const ev = { ...leFormState, endAge: isPoint ? leFormState.startAge : leFormState.endAge };
                if (leEditingId === 'new') {
                  setInputs(p => ({ ...p, lifeEvents: [...(p.lifeEvents || []), ev] }));
                } else {
                  setInputs(p => ({ ...p, lifeEvents: (p.lifeEvents || []).map(e => e.id === ev.id ? ev : e) }));
                }
                setLeEditingId(null); setLeFormState({});
              };
              const deleteEvent = (id) => setInputs(p => ({ ...p, lifeEvents: (p.lifeEvents || []).filter(e => e.id !== id) }));
              const toggleEvent = (id) => setInputs(p => ({ ...p, lifeEvents: (p.lifeEvents || []).map(e => e.id === id ? { ...e, enabled: e.enabled === false } : e) }));
              const toggleAll = () => {
                const anyEnabled = lifeEvents.some(e => e.enabled !== false);
                setInputs(p => ({ ...p, lifeEvents: (p.lifeEvents || []).map(e => ({ ...e, enabled: !anyEnabled })) }));
              };
              const isPoint = leFormState.type === 'windfall' || leFormState.type === 'early_retirement';
              return (
                <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: 16, overflow: "visible", marginTop: 12, marginBottom: 12 }}>
                  {/* Header */}
    </>
  );
}
