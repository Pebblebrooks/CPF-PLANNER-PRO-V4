import React from "react";
import {
  User, ChevronDown, ChevronUp, SlidersHorizontal,
  Info, AlertTriangle,
} from "lucide-react";
import { CPF_RATES } from "../config/constants.js";
import { TooltipBox } from "../SharedComponents.jsx";

// SidebarProfile
// Receives all state as props — no direct App state access.
// Shared props: inputs, setInputs, inputErrors, openSections, toggleSection,
//              handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency
// Section-specific props: is55Plus, isForeigner, isSelfEmployed, projection, handleSwitchToRSS
export default function SidebarProfile({ inputs, setInputs, inputErrors, openSections, toggleSection, handleInputChange, handleBlur, handleKeyDown, getDisplayValue, formatCurrency,
  is55Plus, isForeigner, isSelfEmployed, projection, handleSwitchToRSS }) {
  return (
    <>
              <div onClick={() => toggleSection("profile")} tabIndex={0} className="sidebar-section-header" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSection("profile"); } }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer", userSelect: "none", background: openSections.has("profile") ? "rgba(56,189,248,0.08)" : "transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <User style={{ width: 14, height: 14, color: "var(--clr-sky)" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--clr-sky)" }}>Profile & Balances</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: saveStatus === "Saving..." ? "rgba(var(--clr-amber-rgb),0.1)" : "rgba(56,189,248,0.12)", color: saveStatus === "Saving..." ? "var(--clr-amber)" : "var(--clr-sky)" }}>
                    {saveStatus === "Saving..." ? <Loader2 style={{ width: 10, height: 10 }} /> : <CheckCircle2 style={{ width: 10, height: 10 }} />}{saveStatus}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{openSections.has("profile") ? "▲" : "▼"}</span>
                </div>
              </div>
              {openSections.has("profile") && <div style={{ padding: "0 16px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div><label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-sky)", textTransform: "uppercase", marginBottom: 4 }}>Name</label>
                    <input type="text" name="name" placeholder="e.g. John Doe" onFocus={(e) => e.target.select()} value={inputs.name} onChange={handleInputChange} aria-label="Member name" style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "flex-end" }}>
                    {[["currentYear", "Curr Year"], ["currentAge", "Curr Age"]].map(([n, l]) => (
                      <div key={n} style={{ minWidth: 0 }}>{/* minWidth:0 lets 1fr cells shrink below content width */}
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: inputErrors[n] ? "var(--clr-red)" : "var(--clr-sky)", textTransform: "uppercase", marginBottom: 4 }}>{l}{inputErrors[n] && <span style={{ marginLeft: 4, fontSize: 9, color: "var(--clr-red)" }}>⚠</span>}</label>
                        <input type="text" inputMode="decimal" name={n} value={getDisplayValue(n, inputs[n])} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={() => setFocusedField(n)} aria-label={l} aria-invalid={!!inputErrors[n]} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: `1px solid ${inputErrors[n] ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                        {/* Short errors (e.g. currentYear) stay inline; currentAge long errors rendered below the grid */}
                        {inputErrors[n] && n !== "currentAge" && <p style={{ fontSize: 10, color: "var(--clr-red)", marginTop: 4, marginBottom: 0, lineHeight: 1.4, wordBreak: "break-word" }}>⚠ {inputErrors[n]}</p>}
                      </div>
                    ))}
                    <div>
                      <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: inputs.cpfScheme === 'rss' ? "var(--text-muted)" : "var(--clr-sky)", textTransform: "uppercase", marginBottom: 4 }}>
                        Payout At {isForeigner && <span style={{ fontSize: 9, color: "var(--clr-amber3)", marginLeft: 4 }}>🔒 CPF LIFE N/A</span>}
                        {inputs.cpfScheme === 'rss' && <span style={{ fontSize: 9, color: "var(--clr-amber3)", marginLeft: 4 }}>🔒 RSS only</span>}
                      </div>
                      <div style={{ opacity: (isForeigner || inputs.cpfScheme === 'rss') ? 0.3 : 1, pointerEvents: (isForeigner || inputs.cpfScheme === 'rss') ? "none" : "auto", position: "relative" }}>
                        <select name="payoutAge" value={inputs.payoutAge} onChange={handleInputChange} aria-label="CPF LIFE payout start age" disabled={inputs.cpfScheme === 'rss'} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                          {[65, 66, 67, 68, 69, 70].map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      {inputs.cpfScheme === 'rss' && (
                        <p style={{ fontSize: 9, color: "#93c5fd", margin: "3px 0 0", lineHeight: 1.5 }}>Uses RSS Payout Start Age below</p>
                      )}
                    </div>
                  </div>
                  {/* currentAge error shown full-width below the grid — message is too long for a 1fr column */}
                  {inputErrors.currentAge && (
                    <p style={{ fontSize: 10, color: "var(--clr-red)", margin: "2px 0 0", lineHeight: 1.5 }}>⚠ {inputErrors.currentAge}</p>
                  )}
                  {/* A9: Age-conditional info banners for minors */}
                  {(Number(inputs.currentAge) || 0) < 16 && (Number(inputs.currentAge) || 0) >= 0 && (
                    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(var(--clr-amber-rgb),0.08)", border: "1px solid rgba(var(--clr-amber-rgb),0.35)", fontSize: 10, color: "var(--clr-amber)", lineHeight: 1.5 }}>
                      👶 <strong>Under 16:</strong> Parents or guardians manage CPF transactions on the member's behalf. Cash top-ups to SA/MA and OA→SA transfers are supported. CPFIS (age 18+) and CPF nominations (age 16+) are not available.
                    </div>
                  )}
                  {(Number(inputs.currentAge) || 0) >= 16 && (Number(inputs.currentAge) || 0) < 18 && (
                    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(var(--clr-blue-rgb),0.08)", border: "1px solid rgba(var(--clr-blue-rgb),0.3)", fontSize: 10, color: "#93c5fd", lineHeight: 1.5 }}>
                      ℹ️ <strong>Age 16–17:</strong> CPF nominations are available. CPFIS requires age 18+ and is disabled in the Outflows section below.
                    </div>
                  )}
                  {/* Gender toggle — affects CPF LIFE monthly payout ratio; locked for foreigners */}
                  <div style={{ opacity: isForeigner ? 0.35 : 1, pointerEvents: isForeigner ? "none" : "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "var(--bg-muted)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Users style={{ width: 13, height: 13, color: "var(--clr-sky)" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-highlight)", textTransform: "uppercase" }}>Gender</span>
                      <TooltipBox id="t-gender" text={isForeigner ? "Gender affects CPF LIFE payouts (SC/PR only). Not applicable for foreigners." : "Affects CPF LIFE payout. Female payouts are ~7% lower than male (0.93× multiplier) due to longer life expectancy — the annuity pool must fund more years. Estimates based on 2026 CPF Board data."} />
                      {isForeigner && <span style={{ fontSize: 9, color: "var(--clr-amber3)", marginLeft: 2 }}>🔒 CPF LIFE N/A</span>}
                    </div>
                    <div style={{ display: "flex", background: "var(--bg-panel)", padding: 3, borderRadius: 7, gap: 2 }}>
                      <button onClick={() => setInputs(p => ({ ...p, isMale: true }))} aria-pressed={inputs.isMale !== false} style={{ padding: "4px 12px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: inputs.isMale !== false ? "var(--clr-sky)" : "transparent", color: inputs.isMale !== false ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>Male</button>
                      <button onClick={() => setInputs(p => ({ ...p, isMale: false }))} aria-pressed={inputs.isMale === false} style={{ padding: "4px 12px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: inputs.isMale === false ? "var(--clr-blue)" : "transparent", color: inputs.isMale === false ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>Female</button>
                    </div>
                  </div>
                  </div>

                  {/* Citizenship status — global gate for MRSS, MMSS, PR tenure warnings, and foreigner CPF lock */}
                  <div style={{ padding: "10px 12px", borderRadius: 10, background: isForeigner ? "rgba(var(--clr-amber-rgb),0.06)" : "var(--bg-muted)", border: `1px solid ${isForeigner ? "rgba(var(--clr-amber-rgb),0.35)" : "var(--border-subtle)"}` }}>
                    {/* Row 1: SC / PR / Foreigner toggle */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (inputs.citizenStatus || 'SC') === 'PR' || isForeigner ? 8 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isForeigner ? "var(--clr-amber)" : "var(--text-highlight)", textTransform: "uppercase" }}>Citizenship</span>
                        <TooltipBox id="t-citizenship" text="Select SC (Singapore Citizen), PR (Permanent Resident), or Foreigner. SC/PR have CPF accounts — all CPF schemes, contributions, and top-ups apply. Foreigners have no CPF — all CPF sections are locked. Foreigners can use SRS (up to $35,700/yr), Property, and Private Assets. MRSS and MMSS are SC-only." />
                      </div>
                      <div style={{ display: "flex", background: "var(--bg-panel)", padding: 3, borderRadius: 7, gap: 2 }}>
                        <button onClick={() => setInputs(p => ({ ...p, citizenStatus: 'SC' }))}
                          style={{ padding: "4px 11px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                            background: (inputs.citizenStatus || 'SC') === 'SC' ? "var(--clr-sky)" : "transparent",
                            color: (inputs.citizenStatus || 'SC') === 'SC' ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>SC</button>
                        <button onClick={() => setInputs(p => ({ ...p, citizenStatus: 'PR', mrssGrant: 0, mmssGrant: 0 }))}
                          style={{ padding: "4px 11px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                            background: (inputs.citizenStatus || 'SC') === 'PR' ? "var(--clr-amber)" : "transparent",
                            color: (inputs.citizenStatus || 'SC') === 'PR' ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>PR</button>
                        <button onClick={() => {
                          setInputs(p => ({ ...p,
                            citizenStatus: 'foreigner',
                            // Clear all CPF fields — foreigners have no CPF account
                            oaBalance: 0, saBalance: 0, maBalance: 0,
                            empOaCont: 0, empSaCont: 0, empMaCont: 0,
                            vc3aCash: 0, vcSaTopup: 0, vcMaCash: 0, vcVhr: 0,
                            annualGovGrant: 0, mrssGrant: 0, mmssGrant: 0, wisAmount: 0,
                            cpfisOaAmount: 0, cpfisSaAmount: 0,
                            oaToSaTransfer: 0, oaToMaTransfer: 0,
                            housingOutflow: 0, oaEduLoan: 0, oaWithdrawalAt55: 0,
                            oaDrawdownMonthly: 0, oaDrawdownStartAge: 0, oaDrawdownFloor: 0,
                            dieWithZeroEnabled: false,
                            usePropertyPledge: false, propMonetiseEnabled: false, // Q1: CPF/HDB-specific property schemes not available to foreigners
                          }));
                          // Q3: auto-collapse CPF-specific sections so the sidebar shows only relevant panels
                          setOpenSections(prev => {
                            const next = new Set(prev);
                            ['contribs', 'topups', 'outflows', 'transfers'].forEach(id => next.delete(id));
                            try { localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify([...next])); } catch {}
                            return next;
                          });
                        }}
                          style={{ padding: "4px 11px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                            background: isForeigner ? "var(--clr-amber3)" : "transparent",
                            color: isForeigner ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>Foreigner</button>
                      </div>
                    </div>
                    {/* Foreigner info banner */}
                    {isForeigner && (
                      <div style={{ fontSize: 10, color: "#fde68a", lineHeight: 1.6, background: "rgba(var(--clr-amber-rgb),0.08)", borderRadius: 7, padding: "6px 10px" }}>
                        🌐 <strong style={{ color: "var(--clr-amber)" }}>No CPF account</strong> — CPF sections collapsed &amp; locked. Your primary tax-deferred vehicle is <strong>SRS</strong> (up to $35,700/yr). Property value tracking and Private Assets remain fully active. Property Pledge and Monetisation (LBS/SHB) are SC/PR-only and are hidden.
                      </div>
                    )}
                    {/* Row 2: PR Tenure — only shown when PR is selected */}
                    {(inputs.citizenStatus || 'SC') === 'PR' && (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-amber)", textTransform: "uppercase" }}>PR Tenure</span>
                            <TooltipBox id="t-prYear" text="PR Year 1: 9% total contributions (5% employee + 4% employer). Year 2: intermediate rates. Year 3+: full SC/PR rates (37% total ≤55). Select the year that applies to your current PR status." />
                          </div>
                          <div style={{ display: "flex", background: "var(--bg-panel)", padding: 3, borderRadius: 7, gap: 2 }}>
                            {[[1,"Yr 1"],[2,"Yr 2"],[3,"Yr 3+"]].map(([val,label]) => (
                              <button key={val} onClick={() => setInputs(p => ({ ...p, prYear: val }))}
                                style={{ padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                                  background: (inputs.prYear || 3) === val ? "var(--clr-amber)" : "transparent",
                                  color: (inputs.prYear || 3) === val ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {(inputs.prYear || 3) < 3 && (
                          <div style={{ marginBottom: 6 }}>
                            {/* G/G vs F/G rate type toggle — only relevant for PR Year 1 or 2 */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-amber)", textTransform: "uppercase" }}>Rate Type</span>
                                <TooltipBox id="t-prRateType" text="G/G (default): Both employer and employee pay graduated rates — no application needed. F/G (Full ER): Employer pays full 17% while employee still pays graduated (lower) rates — requires a voluntary joint application by both parties to CPF Board. F/G boosts the employee's CPF savings without extra cost to the employee." />
                              </div>
                              <div style={{ display: "flex", background: "var(--bg-panel)", padding: 3, borderRadius: 7, gap: 2 }}>
                                {[["GG", "G/G"], ["FG", "F/G"]].map(([val, label]) => (
                                  <button key={val} onClick={() => setInputs(p => ({ ...p, prRateType: val }))}
                                    style={{ padding: "3px 12px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                                      background: (inputs.prRateType || 'GG') === val ? "var(--clr-amber)" : "transparent",
                                      color: (inputs.prRateType || 'GG') === val ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Warning box with rate-type-aware messaging */}
                            <div style={{ background: "rgba(var(--clr-amber-rgb),0.1)", border: "1px solid rgba(var(--clr-amber-rgb),0.3)", borderRadius: 6, padding: "5px 8px" }}>
                              <p style={{ fontSize: 10, color: "#fcd34d", margin: 0, lineHeight: 1.5 }}>
                                {(inputs.prRateType || 'GG') === 'FG'
                                  ? (inputs.prYear || 3) === 1
                                    ? "⚠ F/G Year 1: Employer pays full 17%, employee pays 5%. Total 22% (≤55). Requires joint CPF application."
                                    : "⚠ F/G Year 2: Employer pays full rates, employee pays graduated rates. Requires joint CPF application."
                                  : (inputs.prYear || 3) === 1
                                    ? "⚠ G/G Year 1: Both pay graduated rates — 9% total (≤55). Default arrangement, no application needed."
                                    : "⚠ G/G Year 2: Both pay graduated rates — 24% total (≤55). Default arrangement, no application needed."}
                              </p>
                            </div>
                          </div>
                        )}
                        <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0 }}>
                          MRSS and MMSS grants not available to PRs
                        </p>
                      </div>
                    )}
                    {(inputs.citizenStatus || 'SC') === 'SC' && (
                      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, marginBottom: 0 }}>Full SC rates apply · MRSS and MMSS available</p>
                    )}
                  </div>
                  {/* PwD toggle — shown for SC members only (PRs cannot receive MRSS anyway) */}
                  {(inputs.citizenStatus || 'SC') === 'SC' && (
                    <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 8, background: inputs.isPwD ? "rgba(var(--clr-purple-rgb),0.08)" : "var(--bg-muted)", border: `1px solid ${inputs.isPwD ? "rgba(var(--clr-purple-rgb),0.35)" : "var(--border-subtle)"}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: inputs.isPwD ? "var(--clr-violet2)" : "var(--text-muted)", textTransform: "uppercase" }}>Person with Disabilities</span>
                        <TooltipBox id="t-isPwD" text="PwD members may qualify for MRSS below age 55 (from 2026), provided their combined OA + SA balance is below the Basic Retirement Sum (BRS). For members aged 55 and above, the standard MRSS eligibility applies regardless of PwD status. SC only — this flag has no effect for PR members." />
                      </div>
                      <button
                        onClick={() => setInputs(p => ({ ...p, isPwD: !p.isPwD }))}
                        style={{ padding: "3px 12px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", background: inputs.isPwD ? "var(--clr-violet2)" : "var(--bg-panel)", color: inputs.isPwD ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>
                        {inputs.isPwD ? "ON" : "OFF"}
                      </button>
                    </div>
                  )}

                  {/* ── CPF SCHEME — RSS vs CPF LIFE (SC/PR only; foreigners have no CPF) ── */}
                  {/* Birth-year auto-suggest banner: shown when estimated birth year < 1958    */}
                  {!isForeigner && (() => {
                    const _estBirthYear = (Number(inputs.currentYear) || 2026) - (Number(inputs.currentAge) || 0);
                    const _isRSSLikely  = _estBirthYear > 0 && _estBirthYear < 1958;
                    const _isRSSMode    = inputs.cpfScheme === 'rss';
                    return _isRSSLikely && !_isRSSMode ? (
                      <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 8, background: "rgba(var(--clr-amber-rgb),0.08)", border: "1px solid rgba(var(--clr-amber-rgb),0.35)", fontSize: 10, color: "#fcd34d", lineHeight: 1.6 }}>
                        📋 <strong style={{ color: "var(--clr-amber)" }}>Born before 1958?</strong> You may be on the <strong>Retirement Sum Scheme (RSS)</strong> rather than CPF LIFE. Switch below — RSS members receive a fixed monthly drawdown from RA until it depletes, not a lifetime annuity.
                      </div>
                    ) : null;
                  })()}

                  {/* CPF Scheme toggle — SC/PR only */}
                  {!isForeigner && (
                    <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10, background: inputs.cpfScheme === 'rss' ? "rgba(var(--clr-blue-rgb),0.06)" : "var(--bg-muted)", border: `1px solid ${inputs.cpfScheme === 'rss' ? "rgba(var(--clr-blue-rgb),0.4)" : "var(--border-subtle)"}` }}>
                      {/* Row 1: label + toggle */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: inputs.cpfScheme === 'rss' ? 10 : 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: inputs.cpfScheme === 'rss' ? "var(--clr-blue)" : "var(--text-highlight)", textTransform: "uppercase" }}>CPF Scheme</span>
                          <TooltipBox id="t-cpfScheme" text="CPF LIFE (default): available to SC/PR born in 1958 or after. Payouts are for life — longevity risk is pooled. Three plan options: Standard, Escalating, Basic. RSS (Retirement Sum Scheme): for members born before 1958. A fixed monthly payout is drawn directly from your RA each month until the balance is depleted (~age 80–90 depending on balance and payout). You may migrate to CPF LIFE voluntarily up to age 80." />
                        </div>
                        <div style={{ display: "flex", background: "var(--bg-panel)", padding: 3, borderRadius: 7, gap: 2 }}>
                          <button
                            onClick={() => setInputs(p => ({ ...p, cpfScheme: 'cpf_life' }))}
                            style={{ padding: "4px 10px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                              background: (inputs.cpfScheme || 'cpf_life') === 'cpf_life' ? "var(--clr-sky)" : "transparent",
                              color: (inputs.cpfScheme || 'cpf_life') === 'cpf_life' ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>
                            CPF LIFE
                          </button>
                          <button
                            onClick={handleSwitchToRSS}
                            style={{ padding: "4px 14px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                              background: inputs.cpfScheme === 'rss' ? "var(--clr-blue)" : "transparent",
                              color: inputs.cpfScheme === 'rss' ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>
                            RSS
                          </button>
                        </div>
                      </div>

                      {/* RSS field group — only shown when RSS mode is active */}
                      {inputs.cpfScheme === 'rss' && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {/* RSS Payout Start Age */}
                          <div>
                            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", marginBottom: 3 }}>
                              RSS Payout Start Age
                              <TooltipBox id="t-rssStart" text="The age at which CPF Board began paying your fixed monthly RSS amount. For most pre-1958 members this was age 60 or 62 (older cohorts), or 65 (newer cohorts). Check your CPF statement — it will show the date payouts began." />
                            </label>
                            <input type="text" inputMode="numeric" name="rssPayoutStartAge"
                              value={inputs.rssPayoutStartAge ?? 65}
                              onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                              style={{ width: "100%", padding: "7px 10px", background: "var(--bg-input)", border: `1px solid ${inputErrors.rssPayoutStartAge ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 7, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                            {inputErrors.rssPayoutStartAge && <p style={{ fontSize: 9, color: "var(--clr-red)", margin: "2px 0 0" }}>{inputErrors.rssPayoutStartAge}</p>}
                          </div>

                          {/* RSS Monthly Payout */}
                          <div>
                            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", marginBottom: 3 }}>
                              RSS Monthly Payout ($/mo)
                              <TooltipBox id="t-rssPay" text="Your fixed CPF Board monthly payout under RSS. Find this on your CPF statement or the CPF website — log in and check under 'My Retirement'. This amount is fixed by CPF Board and does not change year to year under RSS." />
                            </label>
                            <input type="text" inputMode="decimal" name="rssMonthlyPayout"
                              value={getDisplayValue('rssMonthlyPayout', inputs.rssMonthlyPayout)}
                              onFocus={() => setFocusedField('rssMonthlyPayout')}
                              onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                              placeholder="e.g. 700"
                              style={{ width: "100%", padding: "7px 10px", background: "var(--bg-input)", border: `1px solid ${inputErrors.rssMonthlyPayout ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 7, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                            {inputErrors.rssMonthlyPayout && <p style={{ fontSize: 9, color: "var(--clr-red)", margin: "2px 0 0" }}>{inputErrors.rssMonthlyPayout}</p>}
                            {/* PMT-based estimate helper — informational only, never feeds projection */}
                            {(() => {
                              const _ra = Number(inputs.saBalance) || 0;
                              const _age = Number(inputs.currentAge) || 0;
                              if (_ra <= 0 || _age <= 0 || (Number(inputs.rssMonthlyPayout) || 0) > 0) return null;
                              const _r = CPF_RATES.RA / 12;
                              const _n = Math.max(12, (85 - _age) * 12);
                              const _est = _r > 0 ? Math.round(_ra * _r / (1 - Math.pow(1 + _r, -_n))) : Math.round(_ra / _n);
                              return _est > 0 ? (
                                <p style={{ fontSize: 9, color: "#93c5fd", margin: "3px 0 0", lineHeight: 1.5 }}>
                                  💡 Estimate based on RA {formatCurrency(_ra)} at 4%/yr: <strong style={{ fontFamily: "monospace" }}>{formatCurrency(_est)}/mo</strong> — verify against your CPF statement.
                                </p>
                              ) : null;
                            })()}
                          </div>

                          {/* ── Migration choice: Stay on RSS vs Migrate to CPF LIFE ── */}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase" }}>At Payout Age</span>
                              <TooltipBox id="t-migrate" text="RSS members may voluntarily migrate to CPF LIFE at any age up to 80. Upon migration: your remaining RA becomes the CPF LIFE premium and CPF Board recomputes your monthly payout (guaranteed for life regardless of how long you live). RA must be ≥ $60,000 at migration. Staying on RSS means the fixed monthly payout continues until RA depletes — after which payouts stop." />
                            </div>
                            {/* Binary Stay / Migrate toggle */}
                            <div style={{ display: "flex", background: "var(--bg-panel)", padding: 3, borderRadius: 7, gap: 2, marginBottom: 8 }}>
                              <button
                                onClick={() => setInputs(p => ({ ...p, lifeMigrationAge: 0 }))}
                                style={{ flex: 1, padding: "5px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                                  background: inputs.lifeMigrationAge === 0 ? "var(--clr-blue)" : "transparent",
                                  color: inputs.lifeMigrationAge === 0 ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>
                                📋 Stay on RSS
                              </button>
                              <button
                                onClick={() => setInputs(p => ({ ...p, lifeMigrationAge: p.lifeMigrationAge > 0 ? p.lifeMigrationAge : (Number(p.currentAge) || 65) + 1 }))}
                                style={{ flex: 1, padding: "5px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer",
                                  background: inputs.lifeMigrationAge !== 0 ? "var(--clr-purple)" : "transparent",
                                  color: inputs.lifeMigrationAge !== 0 ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>
                                🔄 Migrate to CPF LIFE
                              </button>
                            </div>

                            {/* Stay on RSS: informational note about depletion */}
                            {inputs.lifeMigrationAge === 0 && (
                              <div style={{ background: "rgba(var(--clr-blue-rgb),0.06)", border: "1px solid rgba(var(--clr-blue-rgb),0.2)", borderRadius: 6, padding: "6px 9px" }}>
                                <p style={{ fontSize: 9, color: "#93c5fd", margin: 0, lineHeight: 1.6 }}>
                                  📋 RA will be drawn down at <strong>{formatCurrency(Number(inputs.rssMonthlyPayout) || 0)}/mo</strong> until balance reaches $0 — payouts stop at depletion. See the <strong>RSS tab</strong> for your projected depletion age.
                                </p>
                              </div>
                            )}

                            {/* Migrate to CPF LIFE: age input + plan selector */}
                            {/* Use !== 0 (not || 0 > 0) so an empty string during mid-edit
                                does not collapse the section — handleBlur recovers "" → 0. */}
                            {inputs.lifeMigrationAge !== 0 && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {/* Migration age input */}
                                <div>
                                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#c4b5fd", textTransform: "uppercase", marginBottom: 3 }}>
                                    Migrate at Age <span style={{ fontWeight: 400, textTransform: "none", color: "var(--text-muted)" }}>(must be &gt; current age, ≤ 80)</span>
                                  </label>
                                  <input type="text" inputMode="numeric" name="lifeMigrationAge"
                                    value={inputs.lifeMigrationAge ?? ""}
                                    onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown}
                                    placeholder="e.g. 72"
                                    style={{ width: "100%", padding: "7px 10px", background: "var(--bg-input)", border: `1px solid ${inputErrors.lifeMigrationAge ? "var(--clr-red)" : "var(--border-strong)"}`, borderRadius: 7, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                                  {inputErrors.lifeMigrationAge && <p style={{ fontSize: 9, color: "var(--clr-red)", margin: "2px 0 0" }}>{inputErrors.lifeMigrationAge}</p>}
                                </div>

                                {/* CPF LIFE plan selector at migration */}
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: "#c4b5fd", textTransform: "uppercase" }}>CPF LIFE Plan</span>
                                    <TooltipBox id="t-lifePlanMig" text="Standard: fixed monthly payout for life — highest immediate income, simplest. Escalating: starts ~20% lower than Standard, rises 2%/yr — best long-run value if you live past ~80. Basic: lowest payout; a portion of RA is retained as a cash-refundable reserve (for your estate) until it depletes, then a lower pool annuity kicks in." />
                                  </div>
                                  <div style={{ display: "flex", background: "var(--bg-panel)", padding: 3, borderRadius: 7, gap: 2 }}>
                                    {[
                                      { key: 'bas', label: 'Basic', desc: 'Lower · RA reserve' },
                                      { key: 'std', label: 'Standard', desc: 'Fixed · CPF default' },
                                      { key: 'esc', label: 'Escalating', desc: '2%/yr · Best long-run' },
                                    ].map(({ key, label, desc }) => (
                                      <button key={key}
                                        onClick={() => setInputs(p => ({ ...p, lifePlanAtMigration: key }))}
                                        title={desc}
                                        style={{ flex: 1, padding: "5px 4px", borderRadius: 5, fontSize: 9, fontWeight: 700, border: "none", cursor: "pointer", lineHeight: 1.3,
                                          background: (inputs.lifePlanAtMigration || 'std') === key ? "var(--clr-purple)" : "transparent",
                                          color: (inputs.lifePlanAtMigration || 'std') === key ? "#ffffff" : "var(--text-muted)" }}>
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                  <p style={{ fontSize: 9, color: "#c4b5fd", margin: "4px 0 0", lineHeight: 1.5 }}>
                                    {{bas: "💼 Basic — lowest payout; RA reserve refundable to estate until depleted, then pool phase.", std: "📌 Standard — fixed payout for life. CPF Board default at migration.", esc: "📈 Escalating — starts lower, rises 2%/yr. Maximises long-run income if you live past ~80."}[inputs.lifePlanAtMigration || 'std']}
                                  </p>
                                </div>

                                {/* Informational note on migration outcome */}
                                {(() => {
                                  const planNames = { bas: 'Basic', std: 'Standard', esc: 'Escalating' };
                                  const planName = planNames[inputs.lifePlanAtMigration || 'std'];
                                  return (
                                    <div style={{ background: "rgba(var(--clr-purple-rgb),0.07)", border: "1px solid rgba(var(--clr-purple-rgb),0.25)", borderRadius: 6, padding: "6px 9px" }}>
                                      <p style={{ fontSize: 11, color: "#c4b5fd", margin: 0, lineHeight: 1.6 }}>
                                        🔄 At age <strong>{inputs.lifeMigrationAge}</strong>, remaining RA becomes your CPF LIFE premium. RSS drawdown stops. <strong>{planName}</strong> plan payouts begin — guaranteed for life. See the <strong>RSS tab</strong> for projected amounts.
                                      </p>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Info note */}
                          <div style={{ background: "rgba(var(--clr-blue-rgb),0.07)", border: "1px solid rgba(var(--clr-blue-rgb),0.2)", borderRadius: 6, padding: "5px 8px" }}>
                            <p style={{ fontSize: 11, color: "#93c5fd", margin: 0, lineHeight: 1.6 }}>
                              📋 <strong>RSS mode active.</strong> The RSS tab shows your drawdown curve, depletion age, and migration payout comparison. Switching to "Migrate to CPF LIFE" above unlocks Basic, Standard, and Escalating plan projections.
                            </p>
                          </div>
                        </div>
                      )}
                      {(inputs.cpfScheme || 'cpf_life') === 'cpf_life' && (
                        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 0, marginBottom: 0 }}>CPF LIFE — lifetime annuity · born 1958 or after · LIFE tab active</p>
                      )}
                    </div>
                  )}
                  {/* CPF Balances + Goal Trackers — locked for foreigners.
                      Structure: position:relative gate → opacity/pointer-events dim → content
                                              → overlay (absolute, inside gate) → gate closes.
                      The overlay MUST be inside position:relative before it closes so
                      inset:0 is contained to this block and does not cover the whole sidebar. */}
                  <div style={{ position: "relative" }}>
                    {/* Single opacity wrapper covers BOTH balance inputs AND goal trackers */}
                    <div style={{ opacity: isForeigner ? 0.2 : 1, pointerEvents: isForeigner ? "none" : "auto" }}>
                      {/* Balance inputs */}
                      {[["oaBalance", "Ordinary (OA)"], ["saBalance", is55Plus ? "Retirement (RA)" : "Special (SA)"], ["maBalance", "MediSave (MA)"]].map(([n, l]) => (
                        <div key={n}>
                          <div style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--clr-sky)", textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
                          <input type="text" inputMode="decimal" name={n} value={getDisplayValue(n, inputs[n])} onChange={handleInputChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={() => setFocusedField(n)} aria-label={l + ' balance'} style={{ width: "100%", padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-bright)", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
                        </div>
                      ))}
                      {/* Goal Trackers */}
                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
                        {/* SA/RA Goal */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 700, color: "var(--text-highlight)", marginBottom: 8 }}>
                            <span>{is55Plus ? "RA" : "SA"} Goal <TooltipBox id="t-ers" text={`Basic Retirement Sum (BRS): ${formatCurrency(currentBRS)} · Full Retirement Sum (FRS): ${formatCurrency(currentFRS)} · Enhanced Retirement Sum (ERS): ${formatCurrency(currentERS)}`} /></span>
                            <span style={{ color: currentSaRa >= currentFRS ? "var(--clr-sky)" : "var(--clr-amber)", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                              {Math.round((currentSaRa / currentFRS) * 100)}%{currentSaRa >= currentFRS ? " ✓" : ""}
                            </span>
                          </div>
                          <div style={{ width: "100%", background: "var(--bg-input)", borderRadius: 999, height: 10, overflow: "hidden", position: "relative" }}>
                            {[25, 50].map(p => <div key={p} style={{ position: "absolute", top: 0, bottom: 0, left: `${p}%`, width: 1, background: "var(--bg-base)", zIndex: 1 }} />)}
                            <div style={{ height: 10, borderRadius: 999, background: "linear-gradient(90deg,#3b82f6,#06b6d4)", width: `${saRaVisualWidth}%`, transition: "width 0.8s" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-subtle)", marginTop: 4, fontFamily: "monospace" }}>
                            <span>0</span><span>BRS</span><span>FRS</span><span>ERS</span>
                          </div>
                        </div>
                        {/* MA Goal */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, fontWeight: 700, color: "var(--text-highlight)", marginBottom: 8 }}>
                            <span>MA Goal <TooltipBox id="t-bhs" text={`Basic Healthcare Sum (BHS): ${formatCurrency(currentBHS)}. MA cap — excess flows to SA (before 55) or RA (after 55).`} /></span>
                            <span style={{ color: currentMa >= currentBHS ? "var(--clr-sky)" : "var(--clr-blue)", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>
                              {Math.round(Number(bhsPercentText))}%{currentMa >= currentBHS ? " ✓" : ""}
                            </span>
                          </div>
                          <div style={{ width: "100%", background: "var(--bg-input)", borderRadius: 999, height: 10, overflow: "hidden", position: "relative" }}>
                            {[25, 50, 75].map(p => <div key={p} style={{ position: "absolute", top: 0, bottom: 0, left: `${p}%`, width: 1, background: "var(--bg-base)", zIndex: 1 }} />)}
                            <div style={{ height: 10, borderRadius: 999, background: "linear-gradient(90deg,#8b5cf6,#6366f1)", width: `${bhsVisualWidth}%`, transition: "width 0.8s" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-subtle)", marginTop: 4, fontFamily: "monospace" }}>
                            <span>0</span><span>25%</span><span>50%</span><span>75%</span><span>MAX</span>
                          </div>
                        </div>
                      </div>{/* /Goal Trackers */}
                    </div>{/* /opacity+pointerEvents dim wrapper — closes before overlay */}
                    {/* Overlay: position:absolute is contained by position:relative parent above */}
                    {isForeigner && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, zIndex: 10, pointerEvents: "all" }}>
                        <div style={{ background: "rgba(15,23,42,0.82)", border: "1px solid rgba(var(--clr-amber-rgb),0.4)", borderRadius: 10, padding: "8px 16px", fontSize: 10, color: "var(--clr-amber)", fontWeight: 700, textAlign: "center" }}>
                          🔒 No CPF account — balances &amp; goals not applicable
                        </div>
                      </div>
                    )}
                  </div>{/* /position:relative gate — overlay is contained here */}
                </div>{/* /flex column L5279 */}
              </div>}{/* /openSections profile body */}
            </div>{/* /profile section outer */}
            {/* Mandatory Contribs */}
            <div style={{ position: "relative" }}>
            {isForeigner && (
              <div style={{ position: "absolute", inset: 0, zIndex: 20, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.55)", pointerEvents: "all" }}>
                <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(var(--clr-amber-rgb),0.4)", borderRadius: 10, padding: "8px 18px", fontSize: 10, color: "var(--clr-amber)", fontWeight: 700 }}>🔒 CPF scheme — not available to foreigners</div>
              </div>
            )}
            <div style={{ opacity: isForeigner ? 0.2 : 1, pointerEvents: isForeigner ? "none" : "auto", background: "var(--bg-panel)", border: `1px solid ${isSelfEmployed ? "rgba(var(--clr-orange-rgb),0.3)" : "var(--border-subtle)"}`, borderRadius: 16, overflow: "hidden" }}>
    </>
  );
}
