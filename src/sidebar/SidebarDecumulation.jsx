import React from "react";
import { Target, AlertTriangle, Info, Clock, ArrowRightLeft } from "lucide-react";
import { TooltipBox } from "../SharedComponents.jsx";

// SidebarDecumulation
// Receives all state as props — no direct App state access.
// Shared props: inputs, setInputs, inputErrors, openSections, toggleSection,
//              handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency
// Section-specific props: isForeigner, debouncedInputs, projection, projectionByAge, gapAlert, rstuRef, effectiveOaDrawMonthly, effectiveOaDrawStartAge, oaExhaustAge
export default function SidebarDecumulation({ inputs, setInputs, inputErrors, openSections, toggleSection, handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency,
  isForeigner, debouncedInputs, projection, projectionByAge, gapAlert, rstuRef, effectiveOaDrawMonthly, effectiveOaDrawStartAge, oaExhaustAge }) {
  return (
    <>
              <div onClick={() => toggleSection("decumulation")} tabIndex={0} className="sidebar-section-header" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection("decumulation"); } }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none", background: openSections.has("decumulation") ? "rgba(244,63,94,0.06)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f43f5e" }}>
                  <Target style={{ width: 14, height: 14 }} /><span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>Decumulation &amp; Goals</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{openSections.has("decumulation") ? "▲" : "▼"}</span>
              </div>
              {openSections.has("decumulation") && <div style={{ padding: "0 16px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Monthly Goal */}
                  <div style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, padding: 12, marginBottom: 4 }}>
                    <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#f43f5e", textTransform: "uppercase", marginBottom: 4 }}>
                      Target Retirement Income ($/mo)
                      <TooltipBox id="t-target-inc" text="Your desired total monthly income in retirement — covering all expenses. Compared against the combined total of CPF LIFE + OA Drawdown + SRS + Private Assets in the Strategy tab. Use ⚡ Fill Gap below to automatically set the OA Drawdown amount needed to close any shortfall." />
                    </div>
                    <input type="text" inputMode="decimal" name="targetMonthlyIncome" value={getDisplayValue("targetMonthlyIncome", inputs.targetMonthlyIncome)} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => { setFocusedField("targetMonthlyIncome"); e.target.select(); }} aria-label="Target monthly income" style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "monospace", fontWeight: 700 }} />
                  </div>


                  {/* OA Drawdown — locked for foreigners (no OA account) */}
                  <div style={{ position: "relative" }}>
                  {isForeigner && (
                    <div style={{ position: "absolute", inset: 0, zIndex: 20, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.55)", pointerEvents: "all" }}>
                      <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(var(--clr-amber-rgb),0.4)", borderRadius: 10, padding: "8px 18px", fontSize: 10, color: "var(--clr-amber)", fontWeight: 700 }}>🔒 OA Drawdown — no CPF account for foreigners</div>
                    </div>
                  )}
                  <div style={{ opacity: isForeigner ? 0.2 : 1, pointerEvents: isForeigner ? "none" : "auto", paddingTop: 8, borderTop: "1px solid rgba(244,63,94,0.15)", marginTop: 4 }}>
                    {/* Change 5: DwZ-managed state */}
                    {(() => {
                      const dwzOn = !!inputs.dieWithZeroEnabled;
                      const dwzPmt = projection._dwzOaMonthly || 0;
                      const pa = payoutAge65; // CQ-2 fix: cosmetic — keeps "from age X" banner in sync with debounced data
                      return (
                        <>
                          <div style={{ background: "rgba(var(--clr-amber-rgb),0.06)", border: "1px solid rgba(var(--clr-amber-rgb),0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: "var(--clr-amber)", textTransform: "uppercase", marginBottom: 3, letterSpacing: "0.06em" }}>
                              OA Drawdown
                              <TooltipBox id="t-oa-draw" text="Draw monthly cash from OA after CPF LIFE starts — supplements shortfall against your retirement income goal. OA continues earning 2.5%/yr on remaining balance. Drawdown stops when OA falls to your chosen floor (bequest reserve). Set Start Age to 0 to disable." />
                            </p>
                            <p style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5 }}>Supplements CPF LIFE payout · OA earns 2.5%/yr on remaining balance · set floor to preserve bequest</p>
                          </div>
                          {/* DwZ amber banner — shown when Die with Zero is active */}
                          {dwzOn && (
                            <div style={{ background: "rgba(var(--clr-amber-rgb),0.08)", border: "1px solid rgba(var(--clr-amber-rgb),0.35)", borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 9, color: "#fde68a", lineHeight: 1.6 }}>
                              ⏳ <strong style={{ color: "var(--clr-amber)" }}>Managed by Die with Zero</strong> — the OA draw ({dwzPmt > 0 ? `${formatCurrency(dwzPmt)}/mo from age ${pa}` : "$0/mo"}) is computed automatically. Disable Die with Zero above to edit manually.
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8, opacity: dwzOn ? 0.45 : 1, pointerEvents: dwzOn ? "none" : "auto" }}>
                      <div>
                        <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-amber)", textTransform: "uppercase", marginBottom: 4 }}>
                          Start Age
                          <TooltipBox id="t-oa-draw-age" text="Age to begin OA drawdown. Must be at or after your CPF LIFE payout age. Set to 0 to disable." />
                        </div>
                        <input type="text" inputMode="decimal" name="oaDrawdownStartAge" value={inputs.oaDrawdownStartAge} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => e.target.select()} readOnly={dwzOn} tabIndex={dwzOn ? -1 : undefined} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.oaDrawdownStartAge ? "var(--clr-red)" : "rgba(var(--clr-amber-rgb),0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box", cursor: dwzOn ? "not-allowed" : "text" }} />
                        {inputErrors.oaDrawdownStartAge && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.oaDrawdownStartAge}</p>}
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>0 = disabled · ≥ payout age</p>
                      </div>
                      <div>
                        <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-amber)", textTransform: "uppercase", marginBottom: 4 }}>
                          Monthly Draw ($)
                          <TooltipBox id="t-oa-draw-amt" text="Monthly cash drawn from OA to supplement CPF LIFE. OA continues earning 2.5%/yr on the remaining balance. Draw stops automatically when OA hits the bequest floor. Use ⚡ Fill Gap to auto-calculate the exact amount needed to meet your retirement income target." />
                        </div>
                        <input type="text" inputMode="decimal" name="oaDrawdownMonthly" value={inputs.oaDrawdownMonthly} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => e.target.select()} readOnly={dwzOn} tabIndex={dwzOn ? -1 : undefined} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.oaDrawdownMonthly ? "var(--clr-red)" : "rgba(var(--clr-amber-rgb),0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box", cursor: dwzOn ? "not-allowed" : "text" }} />
                        {inputErrors.oaDrawdownMonthly && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.oaDrawdownMonthly}</p>}
                      </div>
                    </div>
                          {/* ⚡ Fill Gap button — auto-sets OA draw to close income shortfall */}
                          {/* Hidden when DwZ is ON — draw is engine-managed */}
                          {!dwzOn && (() => {
                            const target = Number(inputs.targetMonthlyIncome) || 0;
                            if (target <= 0) return null;
                      const pa = payoutAge65; // CQ-2 fix: use debounced value to match payoutProjection/projection data
                      const cpfLife = payoutByAge.get(pa)?.[`${highlightPlan}Monthly`] || 0; // E5 fix: O(1)
                      // H5 fix: use debouncedInputs (not live inputs) so Fill Gap reads the same
                      // SRS parameters the projection was computed from during the debounce window.
                      const srsStart = Math.max(Number(debouncedInputs.srsDrawdownStartAge) || 63, 63);
                      const srsYears = Math.min(Math.max(Number(debouncedInputs.srsDrawdownYears) || 10, 1), 10);
                      // H5 fix: replace O(n) projection.find() calls with O(1) projectionByAge.get()
                      const srsRowAtStart = projectionByAge.get(srsStart);
                      const srsBalAtStart = srsRowAtStart?.srsBalance || 0;
                      const srsRate = Math.max(0, (Number(debouncedInputs.srsReturnRate) || 0) / 100);
                      const srsMo = srsYears > 0
                        ? Math.round((srsRate > 0
                            ? srsBalAtStart * srsRate / (1 - Math.pow(1 + srsRate, -srsYears))
                            : srsBalAtStart / srsYears) / 12)
                        : 0;
                      const privRow = projectionByAge.get(pa) || {};
                      const prevPrivRow = projectionByAge.get(pa - 1) || {};
                      const privMo = Math.max(0, Math.round(((prevPrivRow.privateAssets || 0) - (privRow.privateAssets || 0)) / 12));
                      const nonOaDraw = cpfLife + srsMo + privMo;
                      const requiredOADraw = Math.max(0, Math.round(target - nonOaDraw));
                      const currentDraw = Number(inputs.oaDrawdownMonthly) || 0;
                      const alreadyMet = nonOaDraw >= target;
                      return (
                        <div style={{ marginBottom: 8 }}>
                          {alreadyMet ? (
                            <div style={{ background: "rgba(var(--clr-emerald-rgb),0.08)", border: "1px solid rgba(var(--clr-emerald-rgb),0.25)", borderRadius: 8, padding: "8px 12px", fontSize: 9, color: "#6ee7b7" }}>
                              ✓ Income target met by CPF LIFE + SRS + Private Assets — no OA drawdown needed.
                            </div>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button
                                onClick={() => setInputs(p => ({
                                  ...p,
                                  oaDrawdownMonthly: requiredOADraw,
                                  // UX-1 fix: always use Math.max(pa, existing) so a pre-existing start age below
                                  // payoutAge (e.g. 55 when pa=65) is corrected, not silently preserved.
                                  oaDrawdownStartAge: Math.max(pa, p.oaDrawdownStartAge > 0 ? p.oaDrawdownStartAge : pa)
                                }))}
                                style={{ flex: 1, background: currentDraw === requiredOADraw ? "rgba(var(--clr-amber-rgb),0.15)" : "var(--clr-amber)", color: currentDraw === requiredOADraw ? "var(--clr-amber)" : "var(--ctrl-on-text)", fontWeight: 800, padding: "7px 10px", borderRadius: 8, fontSize: 10, border: currentDraw === requiredOADraw ? "1px solid rgba(var(--clr-amber-rgb),0.4)" : "none", cursor: "pointer", textAlign: "center" }}
                              >
                                ⚡ Fill Gap — Set Draw to {formatCurrency(requiredOADraw)}/mo
                              </button>
                            </div>
                          )}
                          <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                            Gap = {formatCurrency(target)}/mo target − {formatCurrency(nonOaDraw)}/mo (CPF LIFE + SRS + Private) = <strong style={{ color: alreadyMet ? "var(--clr-emerald)" : "var(--clr-amber)" }}>{alreadyMet ? "No gap" : formatCurrency(requiredOADraw) + "/mo needed from OA"}</strong>
                          </p>
                        </div>
                            );
                          })()
                          }
                          {/* Bequest Floor — dims with the grid when DwZ ON */}
                          <div>
                            <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-amber)", textTransform: "uppercase", marginBottom: 4 }}>
                              OA Bequest Floor ($)
                              <TooltipBox id="t-oa-floor" text="Minimum OA balance to preserve at all times. Drawdown stops when OA reaches this amount. Set to 0 to allow full depletion. When Die with Zero is active, floor is set to $0 automatically." />
                            </div>
                            <input type="text" inputMode="decimal" name="oaDrawdownFloor" value={inputs.oaDrawdownFloor} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={(e) => e.target.select()} readOnly={dwzOn} tabIndex={dwzOn ? -1 : undefined} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${inputErrors.oaDrawdownFloor ? "var(--clr-red)" : "rgba(var(--clr-amber-rgb),0.3)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box", cursor: dwzOn ? "not-allowed" : "text" }} />
                            {inputErrors.oaDrawdownFloor && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {inputErrors.oaDrawdownFloor}</p>}
                            <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>0 = deplete fully · preserves bequest from OA</p>
                          </div>
                          {/* OA exhaustion + sustainability warning — uses effectiveOaDraw* so DwZ is reflected */}
                          {(() => {
                            const drawActive = effectiveOaDrawStartAge > 0 && effectiveOaDrawMonthly > 0;
                            if (!drawActive) return null;
                            const exhaustAge = oaExhaustAge;
                            // NEWBug-1 fix: use projectionByAge Map (O(1)) — was projection.find() O(n)
                            const oaAtDrawStart = projectionByAge.get(effectiveOaDrawStartAge)?.oa || 0;
                            const annualDraw = effectiveOaDrawMonthly * 12;
                            const annualInterest = oaAtDrawStart * 0.025;
                            const isEroding = annualDraw > annualInterest;
                            return (
                              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                                <div style={{ background: exhaustAge ? "rgba(244,63,94,0.07)" : "rgba(var(--clr-emerald-rgb),0.07)", border: `1px solid ${exhaustAge ? "rgba(244,63,94,0.25)" : "rgba(var(--clr-emerald-rgb),0.25)"}`, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>OA Exhaustion</span>
                                  <span style={{ fontSize: 11, fontWeight: 900, fontFamily: "monospace", color: exhaustAge ? "#f43f5e" : "var(--clr-emerald)" }}>
                                    {exhaustAge ? `Age ${exhaustAge}` : "Sustains to 95+"}
                                  </span>
                                </div>
                                {isEroding && (
                                  <div style={{ background: "rgba(var(--clr-amber-rgb),0.07)", border: "1px solid rgba(var(--clr-amber-rgb),0.25)", borderRadius: 8, padding: "8px 12px", fontSize: 9, color: "#fde68a", lineHeight: 1.5 }}>
                                    ⚠ Draw ({formatCurrency(effectiveOaDrawMonthly)}/mo) exceeds OA interest ({formatCurrency(Math.round(annualInterest / 12))}/mo) — principal is being depleted.{exhaustAge ? ` OA reaches floor at age ${exhaustAge}.` : ""}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      );
                    })()}
                  </div>{/* /OA Drawdown inner */}
                  </div>{/* /OA Drawdown gate wrapper */}

                  {/* ── Die with Zero ── */}
                  <div style={{ paddingTop: 8, borderTop: "1px solid rgba(244,63,94,0.2)", marginTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 800, color: "#f43f5e", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                          Die with Zero
                          <TooltipBox id="t-dwz" text="Based on Bill Perkins' concept: spend your liquid assets fully by a chosen age instead of leaving unspent wealth. The tool computes the optimal monthly draw from OA and Private Assets using the PMT annuity formula so both reach $0 at your target age. RA/CPF LIFE and MA cannot be depleted — these are governed by CPF Board rules." />
                        </p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Deplete OA + Private Assets by a target age · RA/MA excluded (CPF rules)</p>
                      </div>
                      <button onClick={() => setInputs(p => ({ ...p, dieWithZeroEnabled: !p.dieWithZeroEnabled }))} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: inputs.dieWithZeroEnabled ? "#f43f5e" : "var(--bg-input)", color: inputs.dieWithZeroEnabled ? "#fff" : "var(--text-muted)", flexShrink: 0 }}>{inputs.dieWithZeroEnabled ? "ON" : "OFF"}</button>
                    </div>
                    {inputs.dieWithZeroEnabled && (() => {
                      // Change 4: pmtOA is now sourced directly from the two-pass projection.
                      // The engine has already computed and applied this draw — no Apply button needed.
                      const pa       = payoutAge65; // CQ-2 fix: use debounced value to match projection/payoutProjection data
                      const dwzAge   = Number(inputs.dieWithZeroAge) || 85;
                      const n        = Math.max(1, dwzAge - pa);
                      const pmtOA    = projection._dwzOaMonthly || 0;  // from two-pass engine (OA)
                      // P1-D fix: read pmtPriv from the engine's stored value (_dwzPrivMonthly),
                      // which was computed by the DWZ two-pass and injected into the final engine run.
                      // The old local recalculation was display-only and never matched actual engine deductions.
                      const pmtPriv  = projection._dwzPrivMonthly || 0; // from two-pass engine (private)
                      // NEWBug-1 fix: use O(1) Map lookups and debouncedInputs to match projection data source.
                      // projection.find() was O(n) and live inputs.* caused transient mismatches during debounce.
                      const paRow         = projectionByAge.get(pa) || {};
                      const oaAtPayout    = paRow.oa || 0;
                      const privAtPayout  = paRow.privateAssets || 0;
                      const cpfLife       = payoutByAge.get(pa)?.[`${highlightPlan}Monthly`] || 0;
                      const totalMonthly  = cpfLife + pmtOA + pmtPriv;
                      const srsDwzStart   = Math.max(Number(debouncedInputs.srsDrawdownStartAge) || 63, 63);
                      const srsDwzYrs     = Math.min(Math.max(Number(debouncedInputs.srsDrawdownYears) || 10, 1), 10);
                      const srsAtStart    = projectionByAge.get(srsDwzStart)?.srsBalance || 0;
                      // P2-B fix: PMT annuity formula to match engine depletion (was naive balance/years/12)
                      const srsDwzRate    = Math.max(0, (Number(debouncedInputs.srsReturnRate) || 0) / 100);
                      const srsAnnualDwz  = srsDwzYrs > 0
                        ? (srsDwzRate > 0
                            ? Math.round(srsAtStart * srsDwzRate / (1 - Math.pow(1 + srsDwzRate, -srsDwzYrs)))
                            : Math.round(srsAtStart / srsDwzYrs))
                        : srsAtStart;
                      const srsMoDwz      = Math.round(srsAnnualDwz / 12);
                      const srsWarning    = dwzAge > srsDwzStart + srsDwzYrs;
                      const dwzAgeErr     = inputErrors.dieWithZeroAge;
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {/* Target depletion age input */}
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#f43f5e", textTransform: "uppercase", marginBottom: 4 }}>Target Age (Deplete by)</label>
                            <input type="text" inputMode="decimal" name="dieWithZeroAge" value={inputs.dieWithZeroAge} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={e => e.target.select()} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-muted)", border: `1px solid ${dwzAgeErr ? "var(--clr-red)" : "rgba(244,63,94,0.35)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                            {dwzAgeErr
                              ? <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 2 }}>⚠ {dwzAgeErr}</p>
                              : <>
                                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>Age {pa} (payout) → Age {dwzAge} = {n} year drawdown window</p>
                                  {/* NX3 fix: disclose residual OA if correction was needed */}
                                  {(projection._dwzResidualOa || 0) > 500 && (
                                    <p style={{ fontSize: 10, color: "var(--clr-amber)", marginTop: 3 }}>
                                      ⚠ OA projected to retain ~{formatCurrency(Math.round(projection._dwzResidualOa / 1000) * 1000)} at age {dwzAge} due to ongoing contributions — draw auto-corrected upward to compensate.
                                    </p>
                                  )}
                                </>
                            }
                          </div>
                          {/* Auto-applied badge — replaces the old ⚡ Apply button */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(var(--clr-emerald-rgb),0.08)", border: "1px solid rgba(var(--clr-emerald-rgb),0.25)", borderRadius: 8, padding: "7px 12px" }}>
                            <span style={{ fontSize: 14 }}>✓</span>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 800, color: "var(--clr-emerald)", margin: 0 }}>OA Draw auto-applied to projection</p>
                              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, marginTop: 1 }}>{pmtOA > 0 ? `${formatCurrency(pmtOA)}/mo drawn from OA starting age ${pa}` : "OA balance at payout age is $0 — no draw computed"}</p>
                            </div>
                          </div>
                          {/* Computed PMT summary table */}
                          <div style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 10, padding: "12px 14px" }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: "#f43f5e", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.06em" }}>Computed Draw Schedule (PMT)</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                              {[
                                // OA Draw — hidden for foreigners (no OA account)
                                ...(!isForeigner ? [["OA Draw/mo", pmtOA > 0 ? formatCurrency(pmtOA) : "—", "var(--clr-amber)", `OA at age ${pa}: ${formatCurrency(oaAtPayout)} · 2.5%/yr · ${n}yr window`]] : []),
                                ["SRS Draw/mo", srsMoDwz > 0 ? formatCurrency(srsMoDwz) : "—", "#0ea5e9", `IRAS-governed: max 10yr from age ${srsDwzStart}`],
                                ["Private Draw/mo", pmtPriv > 0 ? formatCurrency(pmtPriv) : "—", "var(--clr-emerald)", `Private assets ${formatCurrency(privAtPayout)} at age ${pa}`],
                                // CPF LIFE — hidden for foreigners (no CPF account, $0 payout is misleading)
                                ...(!isForeigner ? [["CPF LIFE/mo", formatCurrency(cpfLife), "var(--clr-purple)", "Lifetime annuity — cannot be depleted"]] : []),
                              ].map(([lbl, val, color, note]) => (
                                <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 5, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                  <div>
                                    <span style={{ fontSize: 10, fontWeight: 700, color }}>{lbl}</span>
                                    <p style={{ fontSize: 8, color: "var(--text-subtle)", margin: 0, marginTop: 1 }}>{note}</p>
                                  </div>
                                  <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 12, color }}>{val}</span>
                                </div>
                              ))}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-bright)" }}>Total/mo</span>
                                <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 14, color: "#f43f5e" }}>{formatCurrency(totalMonthly + srsMoDwz)}</span>
                              </div>
                            </div>
                          </div>
                          {/* CPF constraints notice */}
                          <div style={{ background: "rgba(var(--clr-amber-rgb),0.06)", border: "1px solid rgba(var(--clr-amber-rgb),0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 9, color: "#fde68a", lineHeight: 1.6 }}>
                            {isForeigner ? (
                              <><strong style={{ color: "var(--clr-amber)" }}>Foreigner constraints:</strong> OA, RA, and MA are not applicable — only SRS and Private Assets are included in the draw schedule. SRS is capped at a 10-year withdrawal window by IRAS regardless of target age.
                              {srsWarning && <span style={{ color: "var(--clr-red)" }}> ⚠ Your Die with Zero age ({dwzAge}) exceeds your SRS window ({srsDwzStart + srsDwzYrs}) — SRS depletes at age {srsDwzStart + srsDwzYrs}.</span>}</>
                            ) : (
                              <><strong style={{ color: "var(--clr-amber)" }}>CPF Constraints:</strong> RA and MA cannot be depleted by choice — RA funds CPF LIFE for life; MA withdrawals are limited to approved medical uses. SRS is capped at a 10-year withdrawal window by IRAS regardless of target age.
                              {srsWarning && <span style={{ color: "var(--clr-red)" }}> ⚠ Your Die with Zero age ({dwzAge}) exceeds your SRS window ({srsDwzStart + srsDwzYrs}) — SRS depletes at age {srsDwzStart + srsDwzYrs}.</span>}</>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>


                </div>
              </div>}
            </div>
            {/* Gap Alert — compact summary banner; full detail card lives under RSTU in Inflows.
                Hidden for foreigners: no CPF account means no RA, no FRS, no gap concept. */}
            {gapAlert && !isForeigner && (
              <div style={{ borderRadius: 10, padding: "9px 12px", border: `1px solid ${gapAlert.isUrgent ? "rgba(239,68,68,0.3)" : "rgba(var(--clr-amber3-rgb),0.3)"}`, background: gapAlert.isUrgent ? "rgba(239,68,68,0.07)" : "rgba(var(--clr-amber3-rgb),0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <AlertTriangle style={{ width: 12, height: 12, color: gapAlert.isUrgent ? "var(--clr-red)" : "var(--clr-amber)", flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: gapAlert.isUrgent ? "#fca5a5" : "#fcd34d", lineHeight: 1.3 }}>
                    RA gap: <strong>{formatCurrency(gapAlert.frsGap)}</strong> short of FRS · +{formatCurrency(gapAlert.annualTopUp)}/yr needed
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpenSections(prev => {
                      const next = new Set(prev);
                      next.add("topups");
                      try { localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify([...next])); } catch { }
                      return next;
                    });
                    setTimeout(() => rstuRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
                  }}
                  style={{ flexShrink: 0, padding: "4px 9px", borderRadius: 6, fontSize: 10, fontWeight: 800, border: `1px solid ${gapAlert.isUrgent ? "rgba(239,68,68,0.4)" : "rgba(var(--clr-amber3-rgb),0.4)"}`, background: gapAlert.isUrgent ? "rgba(239,68,68,0.12)" : "rgba(var(--clr-amber3-rgb),0.12)", color: gapAlert.isUrgent ? "var(--clr-red)" : "var(--clr-amber)", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                  Fix in Inflows ↗
                </button>
              </div>
            )}
          </div>
          {/* Confidence badge — pinned at sidebar bottom, always visible */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, background: "var(--bg-base)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 700, color: "var(--clr-green)", background: "rgba(var(--clr-emerald-rgb),0.08)", border: "1px solid rgba(var(--clr-emerald-rgb),0.2)", borderRadius: 20, padding: "3px 8px" }}>
              <span>📅</span> 2026 CPF Rates
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 700, color: "var(--clr-slate)", background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 20, padding: "3px 8px" }}>
              <span>🎓</span> Educational Tool
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, fontWeight: 700, color: "var(--clr-blue)", background: "rgba(var(--clr-blue2-rgb),0.08)", border: "1px solid rgba(var(--clr-blue2-rgb),0.2)", borderRadius: 20, padding: "3px 8px" }}>
              <span>🔒</span> Data stays local
            </span>
          </div>
    </>
  );
}
