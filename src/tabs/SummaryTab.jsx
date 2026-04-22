import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart, Pie as RechartsPie, Cell as RechartsCell,
} from "recharts";
import { Activity, Bell, Gift, Info, PieChart, Printer, ShieldCheck, SlidersHorizontal, Target } from "lucide-react";
import { CPF_RATES, RETIREMENT_SUMS_2026, SRS_CAP_SC_PR, SRS_CAP_FOREIGNER } from "../config/constants.js";
import { formatCurrency } from "../utils/helpers.js";

// SummaryTab — receives all needed data and handlers as props.
// No direct App state access — pure function of its props.
export default function SummaryTab({ inputs, setInputs, debouncedInputs, projection, projectionByAge, accumulationByAge, payoutByAge, lifePlans, payoutProjection, gapAlert, milestones, isRSSMode, summaryRefAge, totalCpfAtPayout, payoutAgeData, payoutAge65, raAfterTransfer, raOaTransfer, cumulativeCashTopUps, cumulativeRaInterest, effectiveOaDrawMonthly, effectiveOaDrawStartAge, isForeigner, is55Plus, highlightPlan, isRealDollars, viewMode, showWhatIf, whatIfProjection, whatIfPayoutAge, whatIfSaTopup, whatIfHousing, whatIfSalaryBump, whatIfContribStop, whatIfOaDrawdown, whatIfSrsContrib, whatIfPrivGrowth, setShowWhatIf, setWhatIfPayoutAge, setWhatIfSaTopup, setWhatIfHousing, setWhatIfSalaryBump, setWhatIfContribStop, setWhatIfOaDrawdown, setWhatIfSrsContrib, setWhatIfPrivGrowth }) {
  return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Summary tab intro — collapsible via native <details> (no hooks) */}
                <details style={{ borderRadius: 14, background: "var(--bg-panel-muted)", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
                  <summary style={{ padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none", listStyle: "none", outline: "none" }}>
                    <p style={{ fontWeight: 700, color: "var(--text-highlight)", margin: 0, fontSize: 12 }}>📋 Summary Tab — What You're Looking At</p>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>▼ Show</span>
                  </summary>
                  <div style={{ padding: "0 18px 14px", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
                      {(() => {
                        // R7 fix: two items are CPF LIFE-specific — swap them for RSS-appropriate text
                        // when RSS mode is active. All other items remain valid for both schemes.
                        const isRssDesc = debouncedInputs.cpfScheme === 'rss';
                        const rssPayAmt = Number(inputs.rssMonthlyPayout) || 0;
                        return [
                        ["💰 Projected Total CPF", isRssDesc
                          ? "Your total OA + MA + RA balance — the nest egg being drawn down each month under RSS."
                          : "Your total OA + MA + RA balance at your chosen payout age. This is the nest egg that funds CPF LIFE payouts."],
                        ["📊 Account Balances", "Breakdown of OA, MA, SA, and RA at payout age. SA shows 'Merged into RA' for members aged 55+."],
                        [isRssDesc ? "📈 RSS Drawdown Profile" : "💵 CPF LIFE Starting Payouts", isRssDesc
                          ? `Fixed monthly RSS draw (${rssPayAmt > 0 ? formatCurrency(rssPayAmt) + "/mo" : "not yet set"}) from RA until depletion. See the RSS tab for projected depletion age and migration options.`
                          : "Estimated monthly payout under each LIFE plan (Standard, Escalating, Basic) based on your RA at payout age."],
                        ["📈 Key Statistics Row", "Five KPIs: total contributions made, total outflows, net worth at 65, net worth at 95, and estimated annual RSTU tax savings."],
                        ["📅 Contribution Timeline", isRssDesc
                          ? "Gantt chart showing when contributions, housing outflows, and RSS drawdown are active across your lifetime."
                          : "Gantt chart showing when contributions, housing outflows, LIFE payouts, and each plan phase are active across your lifetime."],
                        ["🎯 FRS Tracker", "Projected RA at age 55 vs BRS/FRS/ERS targets. Shows if you're on track and how much more is needed."],
                        ["🥧 Net Worth Breakdown", "Doughnut chart of OA + MA + RA + Property at payout age. Shows how your wealth is distributed across buckets."],
                        ["🔔 Milestone Alerts", isRssDesc
                          ? "Automatic alerts for key events like BHS reached, OA drawdown exhaustion, RSS depletion age, and property sale."
                          : "Automatic alerts for key events like BRS/FRS/ERS achievement, SA closure, BHS reached, OA drawdown exhaustion, and payout start."],
                        ["🔧 What-If Explorer", isRssDesc
                          ? "Drag sliders to test how changing RSTU top-ups, housing outflow, salary, or OA drawdown affects your total CPF balance."
                          : "Drag sliders to test how changing payout age, RSTU top-ups, housing outflow, or salary affects your total CPF. Type any amount in the SA/RA field to override the $40k slider limit."],
                        ["🏠 Estate Planning", "Shows estimated estate value (CPF bequest + OA + MA + property) if death occurs at each age from 65 to 95. Includes a Total Estate summary at your payout age."],
                        ["📋 Strategy Tab", isRssDesc
                          ? "Holistic decumulation planner — set a Target Monthly Income, use ⚡ Fill Gap to auto-calculate the OA Drawdown needed, and view all income streams (RSS, OA Drawdown, SRS, Private Assets) in a Gantt and income table."
                          : "Holistic decumulation planner — set a Target Monthly Income, use ⚡ Fill Gap to auto-calculate the OA Drawdown needed, and view all income streams (CPF LIFE, OA Drawdown, SRS, Private Assets) in a Gantt and income table. OA Exhaustion Age shown live."],
                      ];})().map(([title, desc]) => (
                        <div key={title} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--bg-muted)", border: "1px solid var(--border-subtle)" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-highlight)", marginBottom: 3 }}>{title}</div>
                          <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
                {isRealDollars ? (
                  <div style={{ background: "rgba(var(--clr-blue2-rgb),0.15)", border: "1px solid rgba(var(--clr-blue2-rgb),0.3)", padding: 10, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#93c5fd", borderRadius: 10 }}>Displaying Real Dollars (Adjusted for {inputs.inflationRate}% Inflation)</div>
                ) : (
                  <div style={{ background: "var(--bg-muted)", border: "1px solid var(--border-strong)", padding: 10, textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", borderRadius: 10 }}>Displaying Nominal Dollars</div>
                )}
                {/* Property Pledge Active Notice */}
                {inputs.usePropertyPledge && (() => {
                  // REM-2a fix: replaced O(n) projection.find() with O(1) projectionByAge.get()
                  const age55Row = projectionByAge.get(55);
                  const age55OA = age55Row?.oa ?? 0;
                  const age55RA = age55Row?.ra ?? 0;
                  // Without pledge, RA would be ≈ cohortFRS. With pledge it's ≈ BRS.
                  // The OA difference is the pledge benefit — show it clearly.
                  const ca = Number(inputs.currentAge) || 35;
                  const yearsTo55 = Math.max(0, 55 - ca);
                  const baseYear = Number(inputs.currentYear) || 2026;
                  const pledgeBRS = Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1 + (Number(inputs.retirementSumGrowth)||3)/100, Math.max(0, (baseYear + yearsTo55) - 2026)));
                  return (
                    <div style={{ background: "rgba(var(--clr-amber-rgb),0.08)", border: "1px solid rgba(var(--clr-amber-rgb),0.3)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <Target style={{ width: 16, height: 16, color: "var(--clr-amber)", flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 11, color: "var(--clr-amber)", lineHeight: 1.5, margin: 0 }}>
                        <strong>Property Pledge Active:</strong> At age 55, only BRS (~{formatCurrency(pledgeBRS)}) is retained in RA. RA savings above BRS remain in RA (still earning 4%) until you apply to CPF to withdraw them as cash. Use the <strong>Pledge RA Withdrawal</strong> fields in the Property & Timelines panel to enter the amount and age at which you plan to withdraw pledged funds as cash. These funds leave the RA directly — not via OA. See the Accumulation chart for the OA spike at age 55.
                      </p>
                    </div>
                  );
                })()}
                {/* 20% RA-to-OA Transfer Notice */}
                {raOaTransfer > 0 && (
                  <div style={{ background: "rgba(var(--clr-emerald-rgb),0.08)", border: "1px solid rgba(var(--clr-emerald-rgb),0.25)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <ShieldCheck style={{ width: 16, height: 16, color: "var(--clr-green)", flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: "var(--clr-green)", lineHeight: 1.5, margin: 0 }}>
                      <strong>CPF Policy — 20% RA-to-OA Transfer at Age {inputs.payoutAge}:</strong> Approx. {formatCurrency(raOaTransfer)} is transferred from RA to OA. Transfer base = RA ({formatCurrency(raAtPayout)}) − govt grants, housing grants, MRSS, MMSS &amp; all voluntary SA/RA top-ups ({formatCurrency(cumulativeCashTopUps)}) − SA/RA interest accumulated ({formatCurrency(cumulativeRaInterest)}) = {formatCurrency(raTransferBase)}, × 20%. CPF LIFE payouts are calculated on <strong>RA after transfer ({formatCurrency(raAfterTransfer)})</strong> — the 20% deducted to OA reduces the RA balance and correspondingly lowers your monthly payout.
                    </p>
                  </div>
                )}
                {/* Hero — two-panel split */}
                {/* ── Hero Panel: Left (deep navy + stats) + Right (account balances) ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="hero-split">

                  {/* LEFT: projected total + nominal/real + 3 stat rings */}
                  <div style={{ background: "var(--hero-left-bg)", borderRadius: 16, padding: "22px", color: "var(--hero-text)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <svg style={{ position: "absolute", right: 0, top: 0, opacity: 0.07, pointerEvents: "none" }} width="160" height="160" viewBox="0 0 100 100">
                      <path d="M10 90 L80 20 M55 20 L80 20 L80 45" fill="none" stroke="var(--hero-arrow)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {/* Top block: numbers — always use raw projection, never displayAccumulation */}
                    {(() => {
                      const rawRow = projectionByAge.get(summaryRefAge) || {}; // S2 fix: use summaryRefAge (currentAge for RSS, payoutAge65 for LIFE)
                      const nominalTotal = (rawRow.oa || 0) + (rawRow.sa || 0) + (rawRow.ma || 0) + (rawRow.ra || 0);
                      const years = Math.max(0, summaryRefAge - Number(inputs.currentAge));
                      const inflRate = (Number(inputs.inflationRate) || 2) / 100;
                      const realTotal = Math.round(nominalTotal / Math.pow(1 + inflRate, years));
                      return (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 16 }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--hero-label)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                            {isRSSMode ? `Current CPF Balance (Age ${summaryRefAge})` : `Projected Total CPF Balance at Age ${inputs.payoutAge}`}
                          </p>
                          <div className="hero-nums-row" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
                            <div>
                              <p className="hero-nom" style={{ fontSize: 32, fontWeight: 500, margin: 0, letterSpacing: "-0.5px", lineHeight: 1.1, color: "#ffffff" }}>{formatCurrency(nominalTotal)}</p>
                              <p style={{ fontSize: 10, color: "var(--hero-label)", marginTop: 4 }}>Nominal (future $)</p>
                            </div>
                            <div className="hero-divider-v" style={{ width: 1, height: 48, background: "var(--hero-divider)" }} />
                            <div>
                              <p className="hero-real" style={{ fontSize: 24, fontWeight: 500, margin: 0, letterSpacing: "-0.3px", lineHeight: 1.1, color: "var(--hero-text)", opacity: 0.75 }}>{formatCurrency(realTotal)}</p>
                              <p style={{ fontSize: 10, color: "var(--hero-label)", marginTop: 4 }}>Real (today's $, {inputs.inflationRate || 2}% infl.)</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    {/* How this was calculated — collapsible assumptions panel */}
                    {(() => {
                      const pa = summaryRefAge; // S2 fix: RSS uses currentAge, LIFE uses payoutAge65
                      const ca = Number(inputs.currentAge) || 35;
                      const paRow = projectionByAge.get(pa) || {}; // CQ-2 perf: O(1) Map lookup
                      const totalInj = paRow.cumulativeInjected || 0;
                      const totalInt = paRow.cumulativeInterest || 0;
                      const totalOut = paRow.cumulativeOutflow || 0;
                      const startBal = (Number(inputs.oaBalance)||0) + (Number(inputs.saBalance)||0) + (Number(inputs.maBalance)||0);
                      return (
                        <details style={{ marginTop: 10, marginBottom: 6 }}>
                          <summary style={{ fontSize: 9, fontWeight: 700, color: "var(--hero-label)", cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", listStyle: "none", outline: "none", display: "flex", alignItems: "center", gap: 4 }}>
                            <span>▸</span> How this was calculated
                          </summary>
                          <div style={{ marginTop: 8, fontSize: 9, color: "var(--hero-label)", lineHeight: 1.8, paddingLeft: 2 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px" }}>
                              <span>Opening balances (age {ca})</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>+{formatCurrency(startBal)}</span>
                              <span>Contributions &amp; inflows</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>+{formatCurrency(totalInj)}</span>
                              <span>Interest earned (2.5–4% p.a.)</span><span style={{ fontFamily: "monospace", textAlign: "right" }}>+{formatCurrency(totalInt)}</span>
                              <span>Outflows (housing, medical, etc.)</span><span style={{ fontFamily: "monospace", textAlign: "right", color: "var(--clr-red)" }}>−{formatCurrency(totalOut)}</span>
                              <span style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 3, fontWeight: 700, color: "var(--clr-green)" }}>= Total at age {pa}</span>
                              <span style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 3, fontFamily: "monospace", textAlign: "right", fontWeight: 700, color: "var(--clr-green)" }}>{formatCurrency(startBal + totalInj + totalInt - totalOut)}</span>
                            </div>
                            <p style={{ marginTop: 6, fontSize: 8, opacity: 0.55, lineHeight: 1.5, margin: "6px 0 0" }}>Annual compounding · BOY convention · 2026 CPF rates · Verify with CPF Board tools</p>
                          </div>
                        </details>
                      );
                    })()}
                    {/* Divider */}
                    <div style={{ height: 1, background: "var(--hero-divider)", marginBottom: 16 }} />
                    {/* Bottom block: 3 stat rings */}
                    {(() => {
                      const pa = summaryRefAge; // S2 fix: RSS uses currentAge, LIFE uses payoutAge65
                      const paRowBase = projectionByAge.get(pa) || {}; // CQ-2 perf: O(1) Map lookup
                      const totalInt = paRowBase.cumulativeInterest || 0;
                      const totalInj = paRowBase.cumulativeInjected || 0;
                      const tot = totalInt + totalInj || 1;
                      const intPct = Math.round((totalInt / tot) * 100);
                      const injPct = 100 - intPct;
                      const ratio = totalInj > 0 ? (totalInt / totalInj) : 0;
                      const ratioPct = Math.min(100, Math.round(ratio * 100));
                      const r = 18, circ = 2 * Math.PI * r;
                      const arc = (p) => (p / 100) * circ;
                      return (
                        <div className="hero-stats-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          {[
                            { val: `$${Math.round(totalInt / 1000)}k`, lbl: "Interest earned", pct: intPct, color: "var(--clr-blue)", tc: "#93c5fd", dash: arc(intPct) },
                            { val: `$${Math.round(totalInj / 1000)}k`, lbl: "Total inflows", pct: injPct, color: "var(--clr-green)", tc: "#6ee7b7", dash: arc(injPct) },
                            { val: `${ratio.toFixed(2)}×`, lbl: "Interest / contribution", pct: ratioPct, color: "var(--clr-amber3)", tc: "var(--clr-amber)", dash: arc(ratioPct) },
                          ].map(({ val, lbl, pct, color, tc, dash }) => (
                            <div key={lbl} style={{ background: "var(--hero-card-bg)", borderRadius: 10, padding: "10px", display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                              <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0, overflow: "visible" }}>
                                <circle cx="24" cy="24" r={r} fill="none" stroke="var(--hero-ring-bg)" strokeWidth="4" />
                                <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
                                  strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 24 24)" />
                                <text x="24" y="28" textAnchor="middle" fill={tc} fontSize="8.5" fontWeight="500">{pct}%</text>
                              </svg>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--hero-text)" }}>{val}</div>
                                <div style={{ fontSize: 9, color: "var(--hero-label)", marginTop: 2, lineHeight: 1.3 }}>{lbl}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* RIGHT: 2×2 account balance cards with rings */}
                  <div style={{ background: "var(--hero-right-bg)", border: "1px solid var(--hero-border)", borderRadius: 16, padding: 20, color: "var(--hero-text)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: "var(--hero-label)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                      {isRSSMode ? `Current Account Balances (Age ${summaryRefAge})` : `Account Balances at Age ${inputs.payoutAge}`}
                    </p>
                    {(() => {
                      const tot2 = (payoutAgeData.oa || 0) + (payoutAgeData.ma || 0) + (payoutAgeData.ra || 0) || 1;
                      const accts = [
                        { label: "Ordinary (OA)", val: payoutAgeData.oa, color: "var(--clr-blue)", tc: "#93c5fd", closed: false },
                        { label: "Special (SA)", val: null, color: "var(--clr-slate)", tc: "var(--clr-slate)", closed: true },
                        { label: "MediSave (MA)", val: payoutAgeData.ma, color: "var(--clr-green)", tc: "#6ee7b7", closed: false },
                        { label: "Retirement (RA)", val: payoutAgeData.ra, color: "var(--clr-violet)", tc: "#c4b5fd", closed: false },
                      ];
                      const r2 = 18, circ2 = 2 * Math.PI * r2;
                      return (
                        <div className="hero-acct-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1 }}>
                          {accts.map(({ label, val, color, tc, closed }) => {
                            const pct = closed ? 0 : Math.round(((val || 0) / tot2) * 100);
                            const dash = (pct / 100) * circ2;
                            return (
                              <div key={label} style={{ background: "var(--hero-acct-bg)", border: "1px solid var(--hero-acct-border)", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 10, overflow: "hidden", opacity: closed ? 0.45 : 1 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 9, fontWeight: 600, color: "var(--hero-label)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>{label}</p>
                                  {closed
                                    ? <p style={{ fontSize: 12, color: "var(--hero-label)", fontStyle: "italic", margin: 0 }}>Merged into RA</p>
                                    : <><p style={{ fontSize: 15, fontWeight: 500, color: tc, margin: 0, fontFamily: "monospace" }}>{formatCurrency(val)}</p>
                                      <p style={{ fontSize: 9, color: "var(--hero-label)", marginTop: 3 }}>{pct}% of total</p></>
                                  }
                                </div>
                                <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0, overflow: "visible" }}>
                                  <circle cx="24" cy="24" r={r2} fill="none" stroke="var(--hero-ring-bg)" strokeWidth="4" />
                                  {!closed && <circle cx="24" cy="24" r={r2} fill="none" stroke={color} strokeWidth="4"
                                    strokeDasharray={`${dash} ${circ2}`} strokeLinecap="round" transform="rotate(-90 24 24)" />}
                                  <text x="24" y="28" textAnchor="middle" fill={closed ? "rgba(255,255,255,0.25)" : tc} fontSize="9" fontWeight="500">{closed ? "—" : `${pct}%`}</text>
                                </svg>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {/* LIFE Plans — hidden for foreigners and RSS members (no CPF LIFE eligibility) */}
                {/* S6 fix: added !isRSSMode guard — RSS members were seeing CPF LIFE cards showing $0
                    for all three plans, which was confusing and implied missing data.
                    Show a compact RSS summary card in its place instead. */}
                {!isForeigner && !isRSSMode && (
                <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", margin: 0 }}>CPF LIFE Starting Payouts (Monthly)</p>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: inputs.isMale !== false ? "rgba(var(--clr-green-rgb),0.15)" : "rgba(var(--clr-blue-rgb),0.15)", color: inputs.isMale !== false ? "var(--clr-green)" : "var(--clr-blue)", border: `1px solid ${inputs.isMale !== false ? "rgba(var(--clr-green-rgb),0.3)" : "rgba(var(--clr-blue-rgb),0.3)"}` }}>
                      {inputs.isMale !== false ? "Male selected" : "Female selected"}
                    </span>
                  </div>
                  <div className="life-plans-grid rg-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {Object.entries(lifePlans).map(([key, plan]) => (
                      <div key={key} style={{ background: "var(--bg-muted)", padding: 16, borderRadius: 12, border: "1px solid var(--border-strong)", display: "flex", flexDirection: "column", gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-highlight)", textTransform: "capitalize" }}>{key} Plan</span>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 9, color: inputs.isMale !== false ? "var(--clr-green)" : "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginBottom: 2 }}>{inputs.isMale !== false ? "Male ✓" : "Male"}</div>
                            <div style={{ fontSize: inputs.isMale !== false ? 20 : 15, fontWeight: 900, color: inputs.isMale !== false ? "var(--clr-green)" : "var(--text-muted)" }}>{formatCurrency(applyInflation(plan.startM, inputs.payoutAge))}</div>
                          </div>
                          <div style={{ width: 1, height: 24, background: "var(--border-strong)" }}></div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 9, color: inputs.isMale === false ? "var(--clr-blue)" : "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginBottom: 2 }}>{inputs.isMale === false ? "Female ✓" : "Female"}</div>
                            <div style={{ fontSize: inputs.isMale === false ? 20 : 15, fontWeight: 900, color: inputs.isMale === false ? "var(--clr-blue)" : "var(--text-muted)" }}>{formatCurrency(applyInflation(plan.startF, inputs.payoutAge))}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}
                {/* S6: RSS members see a compact drawdown summary in place of CPF LIFE plans */}
                {!isForeigner && isRSSMode && (() => {
                  const rssMonSum = Number(inputs.rssMonthlyPayout) || 0;
                  const rssStSum  = Number(inputs.rssPayoutStartAge) || 65;
                  const rssDepSum = (() => {
                    let bal = Number(inputs.saBalance) || 0;
                    const annual = rssMonSum * 12;
                    if (annual <= 0) return null;
                    for (let age = Number(inputs.currentAge) || 68; age <= 95; age++) {
                      bal = bal * (1 + CPF_RATES.RA) - annual;
                      if (bal <= 0) return age;
                    }
                    return ">95";
                  })();
                  return (
                    <div style={{ background: "var(--bg-panel)", border: "1px solid rgba(var(--clr-blue-rgb),0.3)", borderRadius: 20, padding: 24 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--clr-blue)", marginBottom: 16 }}>RSS Drawdown Summary</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                        {[
                          ["Monthly Payout", rssMonSum > 0 ? formatCurrency(rssMonSum) + "/mo" : "Not set", rssMonSum > 0 ? "var(--clr-green)" : "var(--clr-red)"],
                          ["Payout Start Age", `Age ${rssStSum}`, "var(--clr-amber)"],
                          ["Est. Depletion Age", rssDepSum ? `Age ${rssDepSum}` : "—", rssDepSum && rssDepSum !== ">95" && rssDepSum < 85 ? "var(--clr-red)" : "var(--clr-green)"],
                        ].map(([label, val, color]) => (
                          <div key={label} style={{ background: "var(--bg-muted)", padding: 16, borderRadius: 12, border: "1px solid var(--border-strong)" }}>
                            <p style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginBottom: 8 }}>{label}</p>
                            <p style={{ fontSize: 20, fontWeight: 900, color, fontFamily: "monospace" }}>{val}</p>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 12 }}>
                        CPF LIFE plans are not applicable under RSS. Switch to <strong style={{ color: "var(--clr-purple)" }}>CPF LIFE</strong> scheme to compare Standard, Escalating, and Basic plan payouts. See the <strong style={{ color: "var(--clr-blue)" }}>RSS tab</strong> for the full drawdown curve and migration analysis.
                      </p>
                    </div>
                  );
                })()}
                {/* Goal Tracking Card — hidden for foreigners (CPF LIFE plan basis is irrelevant) */}
                {/* FIX: Previously only CPF LIFE was included in "Projected" — OA draw, SRS, and private
                    assets were ignored, so Fill Gap had no visible effect on this card.
                    Now totalProjected = CPF LIFE + OA Draw + SRS + Private, matching the Strategy tab. */}
                {!isForeigner && (() => {
                  const target = Number(inputs.targetMonthlyIncome) || 0;
                  if (target > 0) {
                    // ── CPF LIFE payout for the highlighted plan (inflation-adjusted when Real $ mode is on) ──
                    const planPayout = lifePlans[highlightPlan]?.[inputs.isMale !== false ? 'startM' : 'startF'] || 0;
                    const realPlanPayout = applyInflation(planPayout, inputs.payoutAge);

                    // ── OA Drawdown contribution (only counted if draw starts at or before payout age) ──
                    const oaDraw = (effectiveOaDrawStartAge > 0 && effectiveOaDrawStartAge <= payoutAge65)
                      ? effectiveOaDrawMonthly : 0;

                    // ── SRS monthly income at drawdown start age (same formula as Fill Gap button) ──
                    const srsStart  = Math.max(Number(inputs.srsDrawdownStartAge) || 63, 63);
                    const srsYears  = Math.min(Math.max(Number(inputs.srsDrawdownYears) || 10, 1), 10);
                    const srsBal    = projectionByAge.get(srsStart)?.srsBalance || 0;
                    const srsRate   = Math.max(0, (Number(inputs.srsReturnRate) || 0) / 100);
                    const srsMo     = srsYears > 0
                      ? Math.round((srsRate > 0
                          ? srsBal * srsRate / (1 - Math.pow(1 + srsRate, -srsYears))
                          : srsBal / srsYears) / 12)
                      : 0;

                    // ── Private asset drawdown: annual decrease in private assets at payout age ÷ 12 ──
                    const privMo = Math.max(0, Math.round(
                      ((projectionByAge.get(payoutAge65 - 1)?.privateAssets || 0) -
                       (projectionByAge.get(payoutAge65)?.privateAssets || 0)) / 12));

                    // ── Total projected income across all streams ──
                    const totalProjected = realPlanPayout + oaDraw + srsMo + privMo;
                    const gap = totalProjected - target;
                    const isShortfall = gap < 0;
                    const hasOtherSources = oaDraw > 0 || srsMo > 0 || privMo > 0;

                    return (
                      <div style={{ background: isShortfall ? "rgba(244,63,94,0.08)" : "rgba(var(--clr-emerald-rgb),0.08)", border: `1px solid ${isShortfall ? "rgba(244,63,94,0.3)" : "rgba(var(--clr-emerald-rgb),0.3)"}`, borderRadius: 16, padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: isShortfall ? "#f472b6" : "var(--clr-green)", margin: "0 0 6px 0" }}>
                              Retirement Income Goal — Total Projected Income
                            </p>
                            <p style={{ fontSize: 24, fontWeight: 900, color: isShortfall ? "#f43f5e" : "var(--clr-emerald)", margin: 0, fontFamily: "monospace" }}>
                              {isShortfall ? "-" : "+"}{formatCurrency(Math.abs(gap))} <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "sans-serif" }}>/ mo {isShortfall ? "shortfall" : "surplus"}</span>
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "0 0 4px 0", textTransform: "uppercase", fontWeight: 700 }}>Target: {formatCurrency(target)}/mo</p>
                            <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "0 0 3px 0", textTransform: "uppercase", fontWeight: 700 }}>Projected: {formatCurrency(totalProjected)}/mo</p>
                            {/* Breakdown line — only shown when supplementary sources are active */}
                            {hasOtherSources && (
                              <p style={{ fontSize: 9, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                                {highlightPlan.charAt(0).toUpperCase() + highlightPlan.slice(1)} Plan {formatCurrency(realPlanPayout)}
                                {oaDraw > 0  && ` + OA Draw ${formatCurrency(oaDraw)}`}
                                {srsMo > 0   && ` + SRS ${formatCurrency(srsMo)}`}
                                {privMo > 0  && ` + Private ${formatCurrency(privMo)}`}
                              </p>
                            )}
                          </div>
                        </div>
                        {isShortfall && (
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid rgba(244,63,94,0.15)`, fontSize: 11, color: "#fda4af", lineHeight: 1.5 }}>
                            <strong>Actionable Insight:</strong> To close this gap of {formatCurrency(Math.abs(gap))}/mo, you could use <strong>⚡ Fill Gap</strong> in the OA Drawdown panel to auto-set the exact OA draw needed, increase voluntary RSTU top-ups to your SA/RA, delay your Payout Age to allow RA to grow further, or build up your <strong>Private Assets</strong> portfolio to generate supplementary income.
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Stats Row */}
                <div className="rg-5" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
                  {/* CQ-2 perf: use pre-built Maps instead of 4× O(n) .find() calls */}
                  {/* M2 fix: append Nom. badge when real-dollar mode is on — these 4 cards always read from
                   projectionByAge/payoutByAge (nominal), while surrounding hero uses displayAccumulation (deflated). */}
                  {/* S2 fix: IIFE so const declarations are valid in JSX. summaryRefAge = currentAge for RSS
                      (payoutAge65 is in the past), payoutAge65 for LIFE. */}
                  {(() => {
                    const rssNW = isRSSMode
                      ? ((projectionByAge.get(summaryRefAge)?.oa || 0) + (projectionByAge.get(summaryRefAge)?.ma || 0) + (projectionByAge.get(summaryRefAge)?.ra || 0))
                      : (payoutByAge.get(summaryRefAge)?.[`${highlightPlan}NetWorth`] || 0);
                    return [[`Cumulative Top-ups${isRealDollars ? ' · Nom.' : ''}`, projectionByAge.get(summaryRefAge)?.cumulativeInjected || 0, "var(--clr-green)"], [`Cumulative Outflow${isRealDollars ? ' · Nom.' : ''}`, projectionByAge.get(summaryRefAge)?.cumulativeOutflow || 0, "#f472b6"], [`Net Worth @ ${summaryRefAge}${isRealDollars ? ' · Nom.' : ''}`, rssNW, "var(--clr-blue)"], [`Net Worth @ 95${isRealDollars ? ' · Nom.' : ''}`, payoutByAge.get(95)?.[`${highlightPlan}NetWorth`] || 0, "var(--text-bright)"]].map(([label, val, color]) => (
                      <div key={label} style={{ padding: 16, borderRadius: 16, background: "var(--bg-panel-muted)", border: "1px solid var(--border-subtle)" }}>
                        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
                        <p style={{ fontSize: 14, fontWeight: 900, color, fontFamily: "monospace" }}>{formatCurrency(val)}</p>
                      </div>
                    ));
                  })()}
                  <div style={{ padding: 16, borderRadius: 16, background: "rgba(var(--clr-amber3-rgb),0.05)", border: "1px solid rgba(var(--clr-amber3-rgb),0.2)" }}>
                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--clr-amber2)", marginBottom: 6 }}>Est. Tax Savings (RSTU)</p>
                    <p style={{ fontSize: 14, fontWeight: 900, color: "var(--clr-amber)", fontFamily: "monospace" }}>{formatCurrency(estimatedTaxSavings)}<span style={{ fontSize: 9, color: "#92400e", marginLeft: 4 }}>/ yr</span></p>
                    {currentSaRa >= currentFRS && <p style={{ fontSize: 9, color: "var(--clr-amber2)", marginTop: 4 }}>SA/RA ≥ FRS — top-ups earn no tax relief (ERS top-ups permitted but unrelieved)</p>}
                    {currentSaRa < currentFRS && eligibleRSTU < (Number(inputs.vcSaTopup) || 0) && <p style={{ fontSize: 9, color: "var(--clr-amber2)", marginTop: 4 }}>Relief capped at FRS headroom ({formatCurrency(Math.max(0, currentFRS - currentSaRa))})</p>}
                  </div>
                </div>
                {/* Stats Row explanation */}
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--bg-panel-muted)", border: "1px solid var(--border-subtle)", fontSize: 10, color: "var(--text-muted)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--text-highlight)" }}>Key Statistics explained: </strong>
                  <strong style={{ color: "var(--clr-green)" }}>Cumulative Top-ups</strong> = all contributions + inflows made from your current age to payout age. &nbsp;
                  <strong style={{ color: "#f472b6" }}>Cumulative Outflow</strong> = all housing and medical deductions over the same period. &nbsp;
                  <strong style={{ color: "var(--clr-blue)" }}>Net Worth @ payout age / 95</strong> = OA + MA + RA + Property at that age under the highlighted LIFE plan. &nbsp;
                  <strong style={{ color: "var(--clr-amber)" }}>Est. Tax Savings (RSTU)</strong> = annual tax relief estimate from your RSTU cash top-up, capped at $8,000 and FRS headroom.
                </div>
                {/* ── Contribution Timeline Gantt ── */}
                {(() => {
                  const ca = Number(inputs.currentAge) || 35;
                  const payoutAge = payoutAge65; // CQ-2 fix: cosmetic — keeps Gantt bar positions in sync with debounced data
                  const contribStop = Number(inputs.contributionStopAge) || 65;
                  const housingStop = Number(inputs.housingStopAge) || 55;
                  const lifeStart = payoutAge;
                  const pool90 = 90;
                  const END = 95;
                  const START = ca;
                  const totalSpan = END - START;
                  const pct = (a, b) => `${Math.max(0, Math.min(100, ((a - START) / totalSpan) * 100)).toFixed(1)}%`;
                  const width = (a, b) => `${Math.max(0, Math.min(100, ((Math.min(b, END) - Math.max(a, START)) / totalSpan) * 100)).toFixed(1)}%`;
                  const left = (a) => `${Math.max(0, ((a - START) / totalSpan) * 100).toFixed(1)}%`;
                  const hasRSTU = (Number(inputs.vcSaTopup) || 0) > 0;
                  const hasVC3A = (Number(inputs.vc3aCash) || 0) > 0;
                  const phases = [
                    // Contributions and housing phases — excluded for foreigners (no CPF account)
                    ...(!isForeigner ? [
                      { label: "Contributions Active", from: ca, to: contribStop, color: "var(--clr-blue2)", bg: "rgba(var(--clr-blue2-rgb),0.15)", border: "rgba(var(--clr-blue2-rgb),0.5)" },
                      { label: "Housing Outflow (OA)", from: ca, to: housingStop, color: "#f472b6", bg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.5)" },
                      ...(hasRSTU ? [{ label: `RSTU Top-up ($${Math.round((Number(inputs.vcSaTopup) || 0) / 1000)}k/yr)`, from: ca, to: contribStop, color: "var(--clr-green)", bg: "rgba(var(--clr-green-rgb),0.1)", border: "rgba(var(--clr-green-rgb),0.4)" }] : []),
                      ...(hasVC3A ? [{ label: `VC3A Lump-sum ($${Math.round((Number(inputs.vc3aCash) || 0) / 1000)}k/yr)`, from: ca, to: contribStop, color: "var(--clr-violet)", bg: "rgba(var(--clr-violet-rgb),0.1)", border: "rgba(var(--clr-violet-rgb),0.4)" }] : []),
                      // S3 fix: for RSS members show RSS Drawdown bar instead of 5 CPF LIFE bars.
                      // CPF LIFE bars are meaningless for RSS members and were causing the Gantt to
                      // show "CPF LIFE Payouts" spanning the full age range at $0.
                      ...(isRSSMode ? [
                        { label: `RSS Drawdown (${formatCurrency(Number(inputs.rssMonthlyPayout) || 0)}/mo)`, from: Number(inputs.rssPayoutStartAge) || 65, to: END, color: "var(--clr-blue)", bg: "rgba(var(--clr-blue-rgb),0.12)", border: "rgba(var(--clr-blue-rgb),0.5)" },
                      ] : [
                        // CPF LIFE plan phases — SC/PR on LIFE scheme only
                        { label: "CPF LIFE Payouts", from: lifeStart, to: END, color: "var(--clr-emerald)", bg: "rgba(var(--clr-emerald-rgb),0.12)", border: "rgba(var(--clr-emerald-rgb),0.5)" },
                        { label: "Standard — Level Payouts", from: lifeStart, to: END, color: "var(--clr-indigo2)", bg: "rgba(var(--clr-indigo2-rgb),0.1)", border: "rgba(var(--clr-indigo2-rgb),0.4)" },
                        { label: "Escalating — Growing Payouts", from: lifeStart, to: END, color: "var(--clr-cyan)", bg: "rgba(var(--clr-cyan-rgb),0.08)", border: "rgba(var(--clr-cyan-rgb),0.4)" },
                        { label: "Basic — RA Self-Funds (to 90)", from: lifeStart, to: Math.min(pool90, END), color: "var(--clr-amber3)", bg: "rgba(var(--clr-amber3-rgb),0.12)", border: "rgba(var(--clr-amber3-rgb),0.5)" },
                        { label: "Basic — Pool Phase (90+)", from: pool90, to: END, color: "var(--clr-orange)", bg: "rgba(var(--clr-orange-rgb),0.15)", border: "rgba(var(--clr-orange-rgb),0.5)" },
                      ]),
                    ] : [
                      // Foreigner: show only SRS drawdown period if configured
                      { label: "SRS Drawdown Window", from: Math.max(Number(inputs.srsDrawdownStartAge) || 63, 63), to: Math.min(Math.max(Number(inputs.srsDrawdownStartAge) || 63, 63) + (Number(inputs.srsDrawdownYears) || 10), END), color: "#0ea5e9", bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.4)" },
                    ]),
                  ];
                  const markers = (!isForeigner
                    ? (isRSSMode
                        ? [ca, Number(inputs.rssPayoutStartAge) || 65, END]
                        : [ca, contribStop, housingStop, lifeStart, pool90, END])
                    : [ca, END]
                  ).filter((v, i, a) => v >= ca && v <= END && a.indexOf(v) === i).sort((a, b) => a - b);
                  return (
                    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", borderRadius: 20, padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <Activity style={{ width: 15, height: 15, color: "var(--clr-blue)" }} />
                        <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--text-bright)", margin: 0 }}>Contribution Timeline Overview</h4>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>Age {ca} → 95</span>
                      </div>
                      {/* Age ruler */}
                      <div style={{ position: "relative", height: 20, marginBottom: 4 }}>
                        {markers.map(age => (
                          <div key={age} style={{ position: "absolute", left: left(age), transform: "translateX(-50%)", fontSize: 9, color: "var(--text-muted)", fontWeight: 700, fontFamily: "monospace" }}>
                            {age}
                          </div>
                        ))}
                      </div>
                      {/* Tick lines */}
                      <div style={{ position: "relative", height: 4, marginBottom: 8, background: "var(--border-subtle)", borderRadius: 2 }}>
                        {markers.map(age => (
                          <div key={age} style={{ position: "absolute", left: left(age), width: 2, height: "100%", background: "var(--text-muted)", transform: "translateX(-50%)" }} />
                        ))}
                      </div>
                      {/* Phase bars */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {phases.filter(p => p.from < END && p.to > ca).map((phase, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: "clamp(90px, 22vw, 160px)", flexShrink: 0, fontSize: 10, fontWeight: 700, color: phase.color, textAlign: "right", paddingRight: 4 }}>{phase.label}</div>
                            <div style={{ flex: 1, position: "relative", height: 20, background: "var(--bg-muted)", borderRadius: 4 }}>
                              <div style={{
                                position: "absolute",
                                left: left(Math.max(phase.from, ca)),
                                width: width(phase.from, phase.to),
                                height: "100%",
                                background: phase.bg,
                                border: `1px solid ${phase.border}`,
                                borderRadius: 4,
                                display: "flex", alignItems: "center", justifyContent: "center"
                              }}>
                                <span style={{ fontSize: 9, fontWeight: 800, color: phase.color, whiteSpace: "nowrap" }}>
                                  {Math.max(phase.from, ca)}–{Math.min(phase.to, END)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, fontSize: 10, color: "var(--text-muted)", lineHeight: 1.6 }}>
                        <Info style={{ width: 11, height: 11, display: "inline", marginRight: 6, color: "var(--clr-blue)" }} />
                        Adjust <strong style={{ color: "var(--text-main)" }}>Contrib Stop Age</strong>, <strong style={{ color: "var(--text-main)" }}>Housing Stop Age</strong> and <strong style={{ color: "var(--text-main)" }}>Payout Age</strong> in the sidebar to update this timeline.
                      </div>
                    </div>
                  );
                })()}
                {/* FRS Tracker — hidden for foreigners (no CPF account, no RA) */}
                {!isForeigner && (() => {
                  const currentAge = Number(inputs.currentAge) || 35;
                  const isAlreadyPast55 = currentAge >= 55;
                  // If already past 55, use the RA from the first projection row (current state)
                  // REM-2b fix: replaced O(n) projection.find() with O(1) projectionByAge.get()
                  const frsRow55 = isAlreadyPast55
                    ? projection[0]  // current balances
                    : projectionByAge.get(55);
                  const raAt55Proj = frsRow55 ? (isAlreadyPast55 ? (frsRow55.ra || 0) : (frsRow55.ra || 0)) : 0;
                  const yt55 = Math.max(0, (Number(inputs.currentYear || 2026) + Math.max(0, 55 - currentAge)) - 2026);
                  const projBRS55 = Math.round(RETIREMENT_SUMS_2026.BRS * Math.pow(1.03, yt55));
                  const projFRS55 = Math.round(RETIREMENT_SUMS_2026.FRS * Math.pow(1.03, yt55));
                  const projERS55 = projFRS55 * 2;
                  const frsProgress = Math.min(100, (raAt55Proj / projERS55) * 100);
                  const frsShortfall = projFRS55 - raAt55Proj; // negative = surplus
                  let statusLabel = "Below BRS", statusColor = "var(--clr-red)", borderColor = "rgba(239,68,68,0.3)", bgColor = "rgba(239,68,68,0.08)";
                  if (raAt55Proj >= projERS55) { statusLabel = "ERS Achieved ✓"; statusColor = "#38bdf8"; borderColor = "rgba(56,189,248,0.3)"; bgColor = "rgba(56,189,248,0.08)"; }
                  else if (raAt55Proj >= projFRS55) { statusLabel = "FRS Achieved ✓"; statusColor = "var(--clr-green)"; borderColor = "rgba(var(--clr-green-rgb),0.3)"; bgColor = "rgba(var(--clr-green-rgb),0.08)"; }
                  else if (raAt55Proj >= projBRS55) { statusLabel = "BRS Met — FRS Gap"; statusColor = "var(--clr-amber)"; borderColor = "rgba(var(--clr-amber-rgb),0.3)"; bgColor = "rgba(var(--clr-amber-rgb),0.08)"; }
                  const trackerTitle = isAlreadyPast55 ? `Current RA vs FRS Target (Age ${currentAge})` : "FRS Tracker — Projected RA at 55";
                  return (
                    <div style={{ padding: 20, borderRadius: 20, border: `1px solid ${borderColor}`, background: bgColor }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Target style={{ width: 16, height: 16, color: "var(--clr-green)" }} /><span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{trackerTitle}</span></div>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 999, border: `1px solid ${borderColor}`, color: statusColor, background: bgColor }}>{statusLabel}</span>
                      </div>
                      <div className="rg-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                        {[
                          [isAlreadyPast55 ? `RA at ${currentAge}` : "Projected RA @ 55", raAt55Proj, statusColor],
                          ["FRS Target @ 55", projFRS55, "var(--text-highlight)"],
                          [frsShortfall > 0 ? "FRS Shortfall" : "FRS Surplus", Math.abs(frsShortfall), frsShortfall > 0 ? "var(--clr-red)" : "var(--clr-green)"]
                        ].map(([l, v, c]) => (
                          <div key={l} style={{ textAlign: "center" }}><p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--text-subtle)", marginBottom: 4 }}>{l}</p><p style={{ fontSize: 18, fontWeight: 900, color: c, fontFamily: "monospace" }}>{frsShortfall <= 0 && l.includes("Surplus") ? "+" : ""}{formatCurrency(v)}</p></div>
                        ))}
                      </div>
                      <div style={{ height: 10, background: "var(--bg-input)", borderRadius: 999, overflow: "hidden", position: "relative", marginBottom: 6 }}>
                        {[25, 50].map(p => <div key={p} style={{ position: "absolute", top: 0, bottom: 0, left: `${p}%`, width: 1, background: "var(--bg-base)", zIndex: 1 }} />)}
                        <div style={{ height: 10, borderRadius: 999, background: `linear-gradient(90deg,${statusColor},${statusColor}99)`, width: `${frsProgress}%`, transition: "width 0.8s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-muted)", fontWeight: 700 }}>
                        <span>$0</span><span style={{ position: "relative", left: "25%" }}>BRS</span><span style={{ position: "relative", left: "25%" }}>FRS</span><span>ERS</span>
                      </div>
                      {frsShortfall > 0 && raAt55Proj < projFRS55 && raAt55Proj >= projBRS55 && (
                        <p style={{ marginTop: 8, fontSize: 10, color: "var(--clr-amber)" }}>BRS met. Top up {formatCurrency(frsShortfall)} more to reach FRS and unlock higher LIFE payouts.</p>
                      )}
                      {frsShortfall > 0 && raAt55Proj < projBRS55 && (
                        <p style={{ marginTop: 8, fontSize: 10, color: "var(--clr-red)" }}>Top up {formatCurrency(projBRS55 - raAt55Proj)} to reach BRS, then {formatCurrency(frsShortfall)} to reach FRS.</p>
                      )}
                      {frsShortfall <= 0 && raAt55Proj < projERS55 && (
                        <p style={{ marginTop: 8, fontSize: 10, color: "var(--clr-green)" }}>FRS achieved ✓ Top up {formatCurrency(projERS55 - raAt55Proj)} more to reach ERS for maximum payouts.</p>
                      )}
                      {raAt55Proj >= projERS55 && (
                        <p style={{ marginTop: 8, fontSize: 10, color: "var(--clr-sky)" }}>ERS achieved ✓ Maximum CPF LIFE payout unlocked.</p>
                      )}
                    </div>
                  );
                })()}
                {/* Doughnut */}
                {(() => {
                  const oaVal = payoutAgeData.oa || 0;
                  const maVal = payoutAgeData.ma || 0;
                  const raVal = payoutAgeData.ra || 0;
                  const propVal = inputs.includeProperty ? (payoutAgeData.propertyValue || Number(inputs.propertyValue) || 0) : 0;
                  const privAsset = payoutAgeData.privateAssets || 0;
                  const srsVal = payoutAgeData.srsBalance || 0;
                  const slices = [{ name: "OA", value: Math.max(0, oaVal || 0), color: "#1d4ed8" }, { name: "MA", value: Math.max(0, maVal || 0), color: "#059669" }, { name: "RA", value: Math.max(0, raVal || 0), color: "var(--clr-purple2)" }, { name: "Property", value: Math.max(0, propVal || 0), color: "#f43f5e" }, { name: "Private Assets", value: Math.max(0, privAsset || 0), color: "var(--clr-violet2)" }, { name: "SRS", value: Math.max(0, srsVal || 0), color: "#0ea5e9" }].filter(s => s.value > 0);
                  const total = slices.reduce((s, d) => s + d.value, 0);
                  if (total === 0) return null;
                  const RADIAN = Math.PI / 180;
                  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    if (percent < 0.05) return null;
                    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + r * Math.cos(-midAngle * RADIAN); const y = cy + r * Math.sin(-midAngle * RADIAN);
                    return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
                  };
                  return (
                    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                        <PieChart style={{ width: 18, height: 18, color: "var(--clr-blue)" }} /><h3 style={{ fontSize: 16, fontWeight: 800 }}>Net Worth Breakdown at Age {inputs.payoutAge}</h3>
                      </div>
                      <div className="pie-chart-wrap" style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                        <div style={{ width: 240, height: 240, flexShrink: 0, minWidth: 0 }}>
                          <ResponsiveContainer width="99%" height="100%">
                            <RechartsPieChart>
                              <RechartsPie isAnimationActive={false} data={slices} cx="50%" cy="50%" innerRadius={55} outerRadius={105} paddingAngle={3} dataKey="value" labelLine={false} label={renderLabel}>
                                {slices.map((entry, i) => <RechartsCell key={i} fill={entry.color} stroke="transparent" />)}
                              </RechartsPie>
                              <Tooltip formatter={(v, n) => [formatCurrency(v), n]} contentStyle={{ background: "var(--tooltip-bg)", backdropFilter: "blur(4px)", border: "1px solid var(--tooltip-border)", borderRadius: 8, fontSize: 11, padding: "6px 10px" }} itemStyle={{ padding: 0, color: "var(--tooltip-text)" }} wrapperStyle={{ pointerEvents: "none" }} />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="pie-legend" style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {slices.map(s => (
                            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, background: "var(--bg-muted)", border: "1px solid var(--border-strong)", minWidth: 0 }}>
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</p><p style={{ fontSize: 13, fontWeight: 900, color: "var(--text-main)" }}>{formatCurrency(s.value)}</p></div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>{((s.value / total) * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                          <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, background: "var(--bg-panel-muted)", border: "1px solid var(--border-strong)" }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--clr-indigo)", flexShrink: 0 }} />
                            <div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)" }}>Total Net Worth</p><p style={{ fontSize: 18, fontWeight: 900, color: "var(--text-bright)" }}>{formatCurrency(total)}</p></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* Estate Planning Panel */}
                {(() => {
                  const ages = [65, 70, 75, 80, 85, 90, 95];
                  const plan = highlightPlan;
                  const isRSSEstate = debouncedInputs.cpfScheme === 'rss';
                  return (
                    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <Gift style={{ width: 18, height: 18, color: "var(--clr-violet)" }} />
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Estate at Death — Bequest Projection</h3>
                        {!isRSSEstate && <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 999, background: "rgba(var(--clr-violet-rgb),0.1)", border: "1px solid rgba(var(--clr-violet-rgb),0.3)", color: "var(--clr-violet)", textTransform: "uppercase", fontWeight: 700 }}>{plan}</span>}
                        {isRSSEstate && <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 999, background: "rgba(var(--clr-blue-rgb),0.1)", border: "1px solid rgba(var(--clr-blue-rgb),0.3)", color: "var(--clr-blue)", textTransform: "uppercase", fontWeight: 700 }}>RSS</span>}
                      </div>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
                        {isRSSEstate
                          ? "Estimated estate value if death occurs at each age. Under RSS, bequest = remaining RA balance (direct — no CPF LIFE pool mechanics) + OA + MA + property."
                          : `Estimated estate value if death occurs at each age. Includes CPF bequest (RA premium refund minus payouts drawn), remaining OA, MA balance, and property value. Under the `}{!isRSSEstate && <strong style={{ color: "var(--text-bright)" }}>{plan}</strong>}{!isRSSEstate && " plan."}
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10 }}>
                        {ages.map(age => {
                          const aRow = accumulationByAge.get(age);
                          if (!aRow) return null;
                          const oa   = aRow.oa || 0;
                          const ma   = aRow.ma || 0;
                          const ra   = aRow.ra || 0;
                          const prop = inputs.includeProperty ? (aRow.propertyValue || 0) : 0;
                          // RSS: bequest = RA balance (direct) + OA + MA + property
                          // CPF LIFE: bequest from payoutProjection (premium refund mechanics)
                          let bequest, total;
                          if (isRSSEstate) {
                            bequest = ra; // remaining RA balance
                            total   = bequest + oa + ma + prop;
                          } else {
                            const pRow = payoutByAge.get(age);
                            if (!pRow) return null;
                            bequest = pRow[`${plan}Bequest`] || 0;
                            total   = bequest + oa + ma + prop;
                          }
                          const rssPayoutStart = Number(debouncedInputs.rssPayoutStartAge) || 65;
                          const isPayout = isRSSEstate ? age >= rssPayoutStart : age >= payoutAge65;
                          return (
                            <div key={age} style={{ background: "var(--bg-muted)", borderRadius: 12, padding: 12, border: `1px solid ${age === (isRSSEstate ? rssPayoutStart : payoutAge65) ? (isRSSEstate ? "rgba(var(--clr-blue-rgb),0.4)" : "rgba(var(--clr-violet-rgb),0.4)") : "var(--border-subtle)"}`, opacity: isPayout ? 1 : 0.5 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Age {age}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: isRSSEstate ? "var(--clr-blue)" : "var(--clr-violet)", marginBottom: 4 }}>{formatCurrency(total)}</div>
                              <div style={{ fontSize: 8, color: "var(--text-subtle)", lineHeight: 1.5 }}>
                                <div>CPF: {formatCurrency(bequest + oa + ma)}</div>
                                {prop > 0 && <div>Property: {formatCurrency(prop)}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ gridColumn: "1/-1", background: "var(--bg-panel-muted)", borderRadius: 10, padding: "10px 14px", border: "1px solid var(--border-strong)", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-highlight)", textTransform: "uppercase" }}>Estimated Total Estate at Age {isRSSEstate ? (debouncedInputs.rssPayoutStartAge || 65) : inputs.payoutAge}</span>
                        {(() => {
                          const refAge = isRSSEstate ? (Number(debouncedInputs.rssPayoutStartAge) || 65) : payoutAge65;
                          const ar = accumulationByAge.get(refAge);
                          if (!ar) return null;
                          let tot;
                          if (isRSSEstate) {
                            tot = (ar.ra || 0) + (ar.oa || 0) + (ar.ma || 0) + (inputs.includeProperty ? (ar.propertyValue || 0) : 0);
                          } else {
                            const pr = payoutByAge.get(refAge);
                            if (!pr) return null;
                            tot = (pr[`${highlightPlan}Bequest`] || 0) + (ar.oa || 0) + (ar.ma || 0) + (inputs.includeProperty ? (ar.propertyValue || 0) : 0);
                          }
                          return <span style={{ fontSize: 16, fontWeight: 700, color: isRSSEstate ? "var(--clr-blue)" : "var(--clr-violet)", fontFamily: "monospace" }}>{formatCurrency(tot)}</span>;
                        })()}
                      </div>
                      <p style={{ fontSize: 9, color: "var(--text-subtle)", marginTop: 8, gridColumn: "1/-1" }}>
                        {isRSSEstate
                          ? "* Before RSS payout start: CPF bequest = total OA + MA + RA (death benefit). After payout start: bequest = remaining RA balance (RSS has no pooled insurance — full balance passes to nominees). OA and MA pass to nominated beneficiaries in full."
                          : "* Before payout age: CPF bequest = total OA+MA+RA (death benefit). After payout age: CPF LIFE bequest = premium paid minus cumulative payouts received. OA and MA balances pass to nominated beneficiaries in full."}
                      </p>
                    </div>
                  );
                })()}

                {/* Milestones */}
                {milestones.length > 0 && (
                  <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Bell style={{ width: 18, height: 18, color: "var(--clr-amber)" }} /><h3 style={{ fontSize: 16, fontWeight: 800 }}>Milestone Alerts</h3></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, background: "var(--bg-input)", color: "var(--text-muted)", padding: "4px 10px", borderRadius: 999, border: "1px solid var(--border-strong)" }}>{milestones.length} milestone{milestones.length !== 1 ? "s" : ""} detected</span>
                        <button onClick={printMilestoneReport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: "rgba(var(--clr-amber3-rgb),0.1)", border: "1px solid rgba(var(--clr-amber3-rgb),0.3)", color: "#fcd34d", cursor: "pointer" }}>
                          <Printer style={{ width: 11, height: 11 }} />Print Report
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {milestones.map((m, idx) => {
                        const colors = { success: { bg: "rgba(var(--clr-emerald-rgb),0.08)", border: "rgba(var(--clr-emerald-rgb),0.25)", badge: "rgba(var(--clr-emerald-rgb),0.15)", badgeText: "var(--clr-green)", dot: "var(--clr-green)" }, gold: { bg: "rgba(var(--clr-amber3-rgb),0.08)", border: "rgba(var(--clr-amber3-rgb),0.25)", badge: "rgba(var(--clr-amber3-rgb),0.15)", badgeText: "var(--clr-amber)", dot: "var(--clr-amber)" }, teal: { bg: "rgba(20,184,166,0.08)", border: "rgba(20,184,166,0.25)", badge: "rgba(20,184,166,0.15)", badgeText: "#2dd4bf", dot: "#2dd4bf" }, warning: { bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", badge: "rgba(249,115,22,0.15)", badgeText: "var(--clr-orange)", dot: "var(--clr-orange)" }, danger: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", badge: "rgba(239,68,68,0.15)", badgeText: "var(--clr-red)", dot: "var(--clr-red)" } }[m.type] || { bg: "rgba(var(--clr-blue2-rgb),0.08)", border: "rgba(var(--clr-blue2-rgb),0.25)", badge: "rgba(var(--clr-blue2-rgb),0.15)", badgeText: "var(--clr-blue)", dot: "var(--clr-blue)" };
                        return (<div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, borderRadius: 14, border: `1px solid ${colors.border}`, background: colors.bg }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.dot, flexShrink: 0, marginTop: 4 }} />
                          <div><div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", padding: "2px 8px", borderRadius: 999, background: colors.badge, color: colors.badgeText }}>Age {m.age}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: colors.badgeText }}>{m.label}</span>
                          </div><p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{m.detail}</p></div>
                        </div>);
                      })}
                    </div>
                    <p style={{ marginTop: 16, fontSize: 10, color: "var(--text-muted)" }}>Milestones update automatically as you adjust inputs.</p>
                  </div>
                )}
                {/* What-If */}
                <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}><SlidersHorizontal style={{ width: 18, height: 18, color: "var(--clr-green)" }} /><h3 style={{ fontSize: 16, fontWeight: 800 }}>What-If Explorer</h3><span style={{ fontSize: 9, background: "var(--bg-input)", color: "var(--text-muted)", padding: "3px 8px", borderRadius: 999, border: "1px solid var(--border-strong)" }}>Live Simulation</span></div>
                    <button onClick={(e) => {
                      const target = e.currentTarget;
                      const willShow = !showWhatIf;
                      setShowWhatIf(willShow);
                      if (willShow) {
                        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                      }
                    }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 12, fontSize: 11, fontWeight: 700, border: `1px solid ${showWhatIf ? "rgba(var(--clr-emerald-rgb),0.5)" : "var(--border-strong)"}`, background: showWhatIf ? "rgba(var(--clr-emerald-rgb),0.15)" : "var(--bg-input)", color: showWhatIf ? "var(--clr-green)" : "var(--text-muted)", cursor: "pointer" }}>
                      <SlidersHorizontal style={{ width: 13, height: 13 }} />{showWhatIf ? "Close Explorer" : "Open What-If Explorer"}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>Drag sliders to explore how changes affect your total CPF balance — without modifying saved inputs.</p>
                  {showWhatIf && (() => {
                    // Bug-WI5 fix: use debouncedInputs (not live inputs) for all fallback values
                    // so the UI effXX variables stay consistent with whatIfProjection useMemo.
                    const effPA  = whatIfPayoutAge   !== null ? whatIfPayoutAge   : (Number(debouncedInputs.payoutAge) || 65);
                    const effST  = whatIfSaTopup     !== null ? whatIfSaTopup     : (Number(debouncedInputs.vcSaTopup) || 0);
                    const effH   = whatIfHousing     !== null ? whatIfHousing     : (Number(debouncedInputs.housingOutflow) || 0);
                    const effSB  = whatIfSalaryBump  !== null ? whatIfSalaryBump  : 0;
                    const effCS  = whatIfContribStop !== null ? whatIfContribStop : (Number(debouncedInputs.contributionStopAge) || 65);
                    const effOAD = whatIfOaDrawdown  !== null ? whatIfOaDrawdown  : (Number(debouncedInputs.oaDrawdownMonthly) || 0);
                    const effSRS = whatIfSrsContrib  !== null ? whatIfSrsContrib  : (Number(debouncedInputs.srsAnnualContribution) || 0);
                    const effPG  = whatIfPrivGrowth  !== null ? whatIfPrivGrowth  : (Number(debouncedInputs.privateAssetGrowthRate) || 0);
                    // Bug-WI1 fix: engine row.total = oa+sa+ma+ra only — privateAssets and srsBalance
                    // are separate fields. Add them explicitly for accurate summary totals.
                    // Fix-SumAge: read base at effPA (not payoutAge65) so both sides compare the same age.
                    // Fix-RD: accumulationByAge is already deflated when isRealDollars=true; apply the same
                    // deflation to whatIfTotal so summary card and chart are on the same scale.
                    const basePARow   = accumulationByAge.get(effPA);
                    const baseTotal   = (basePARow?.total || 0) + (basePARow?.privateAssets || 0) + (basePARow?.srsBalance || 0);
                    const wiLastRow   = whatIfProjection?.rows[whatIfProjection.rows.length - 1];
                    const _wiSumInflD = isRealDollars ? (Number(debouncedInputs.inflationRate) || 0) / 100 : 0;
                    const _wiSumCaD   = Number(debouncedInputs.currentAge) || 35;
                    const _wiSumDeflate = (val) => (isRealDollars && val)
                      ? Math.round(val / Math.pow(1 + _wiSumInflD, Math.max(0, effPA - _wiSumCaD)))
                      : val;
                    const whatIfTotal = wiLastRow
                      ? _wiSumDeflate((wiLastRow.oa + wiLastRow.sa + wiLastRow.ma + wiLastRow.ra) + (wiLastRow.privateAssets || 0) + (wiLastRow.srsBalance || 0))
                      : 0;
                    const delta = whatIfTotal - baseTotal;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -8 }}>
                          <button onClick={() => { setWhatIfPayoutAge(null); setWhatIfSaTopup(null); setWhatIfHousing(null); setWhatIfSalaryBump(null); setWhatIfContribStop(null); setWhatIfOaDrawdown(null); setWhatIfSrsContrib(null); setWhatIfPrivGrowth(null); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-strong)", cursor: "pointer" }}>
                            ↺ Reset sliders
                          </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                          {/* SA/RA Top-up — special: slider 0–40k + free-text override */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-highlight)" }}>
                                {is55Plus ? "Annual RA Top-up" : "Annual SA Top-up"}
                                <span style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 400, marginLeft: 4 }}>{Number(inputs.currentAge) < 55 ? "(SA → FRS)" : "(RA → ERS)"}</span>
                              </label>
                              <input
                                type="text" inputMode="decimal" min={0} step={500}
                                value={effST}
                                onChange={e => setWhatIfSaTopup(Math.max(0, Number(e.target.value) || 0))}
                                style={{ width: 90, padding: "3px 8px", borderRadius: 6, fontSize: 13, fontWeight: 900, fontFamily: "monospace", color: "var(--clr-green)", background: "var(--bg-input)", border: "1px solid var(--border-strong)", outline: "none", textAlign: "right" }}
                              />
                            </div>
                            <input type="range" min={0} max={40000} step={500} value={Math.min(effST, 40000)}
                              onChange={e => setWhatIfSaTopup(Number(e.target.value))}
                              onMouseUp={e => setWhatIfSaTopup(Number(e.target.value))}
                              onTouchEnd={e => setWhatIfSaTopup(Number(e.target.value))}
                              style={{ width: "100%", accentColor: "var(--clr-green)", cursor: "pointer" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--border-strong)", marginTop: 2 }}>
                              <span>$0</span>
                              <span style={{ color: "var(--text-subtle)", fontSize: 8 }}>type above for any amount</span>
                              <span>$40k</span>
                            </div>
                            {(() => {
                              const ca3 = Number(inputs.currentAge) || 35;
                              const headroom = ca3 < 55 ? Math.max(0, currentFRS - (currentSaRa || 0)) : Math.max(0, currentERS - (currentSaRa || 0));
                              const target = ca3 < 55 ? "FRS" : "ERS";
                              return headroom > 0 ? (
                                <p style={{ fontSize: 9, color: "var(--text-subtle)", marginTop: 3 }}>
                                  {target} headroom remaining: <strong style={{ color: "var(--clr-green)" }}>{formatCurrency(headroom)}</strong>
                                </p>
                              ) : (<p style={{ fontSize: 9, color: "var(--clr-green)", marginTop: 3 }}>{target} already met ✓</p>);
                            })()}
                          </div>
                          {/* Other original 3 sliders */}
                          {[[`Payout Age`, effPA, 65, 70, 1, setWhatIfPayoutAge, "var(--clr-green)", `${effPA}`], [`Annual Housing Outflow`, effH, 0, Math.max(60000, (Number(inputs.housingOutflow) || 0) * 2), 500, setWhatIfHousing, "var(--clr-orange)", formatCurrency(effH)], [`Salary Increase (%)`, effSB, 0, 50, 5, setWhatIfSalaryBump, "var(--clr-blue)", `${effSB}%`]].map(([label, val, min, max, step, setter, color, display]) => (
                            <div key={label}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-highlight)" }}>{label}</label>
                                <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color }}>{display}</span>
                              </div>
                              <input type="range" min={min} max={max} step={step} value={val}
                                onChange={e => setter(Number(e.target.value))}
                                onMouseUp={e => setter(Number(e.target.value))}
                                onTouchEnd={e => setter(Number(e.target.value))}
                                style={{ width: "100%", accentColor: color, cursor: "pointer" }} />
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--border-strong)", marginTop: 2 }}><span>{min}</span><span>{max}</span></div>
                            </div>
                          ))}

                          {/* Rev #12 — Contribution Stop Age */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-highlight)" }}>
                                Contribution Stop Age
                                <span style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 400, marginLeft: 4 }}>(mandatory + voluntary)</span>
                              </label>
                              <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: "var(--clr-amber)" }}>Age {effCS}</span>
                            </div>
                            <input type="range" min={Number(inputs.currentAge) || 35} max={75} step={1} value={effCS}
                              onChange={e => setWhatIfContribStop(Number(e.target.value))}
                              onMouseUp={e => setWhatIfContribStop(Number(e.target.value))}
                              onTouchEnd={e => setWhatIfContribStop(Number(e.target.value))}
                              style={{ width: "100%", accentColor: "var(--clr-amber)", cursor: "pointer" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--border-strong)", marginTop: 2 }}>
                              <span>Age {Number(inputs.currentAge) || 35}</span><span>Age 75</span>
                            </div>
                            <p style={{ fontSize: 9, color: "var(--text-subtle)", marginTop: 3 }}>
                              Sidebar value: <strong>Age {Number(inputs.contributionStopAge) || 65}</strong>
                            </p>
                          </div>

                          {/* Rev #12 — OA Monthly Drawdown (always shown; engine injects effPA as start age when sidebar is 0) */}
                          <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-highlight)" }}>
                                  OA Monthly Drawdown
                                  {(Number(inputs.oaDrawdownStartAge) || 0) > 0
                                    ? <span style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 400, marginLeft: 4 }}>(from age {Number(inputs.oaDrawdownStartAge)})</span>
                                    : <span style={{ fontSize: 9, color: "var(--clr-amber)", fontWeight: 400, marginLeft: 4 }}>(start age defaults to payout age {effPA})</span>
                                  }
                                </label>
                                <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: "var(--clr-red)" }}>${effOAD}/mo</span>
                              </div>
                              <input type="range" min={0} max={Math.max(5000, (Number(inputs.oaDrawdownMonthly) || 0) * 2)} step={100} value={effOAD}
                                onChange={e => setWhatIfOaDrawdown(Number(e.target.value))}
                                onMouseUp={e => setWhatIfOaDrawdown(Number(e.target.value))}
                                onTouchEnd={e => setWhatIfOaDrawdown(Number(e.target.value))}
                                style={{ width: "100%", accentColor: "var(--clr-red)", cursor: "pointer" }} />
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--border-strong)", marginTop: 2 }}>
                                <span>$0</span><span>${Math.max(5000, (Number(inputs.oaDrawdownMonthly) || 0) * 2).toLocaleString()}/mo</span>
                              </div>
                              <p style={{ fontSize: 9, color: "var(--text-subtle)", marginTop: 3 }}>
                                Sidebar value: <strong>${Number(inputs.oaDrawdownMonthly) || 0}/mo</strong>
                                {(Number(inputs.oaDrawdownStartAge) || 0) === 0 && (
                                  <span style={{ color: "var(--clr-amber)", marginLeft: 4 }}>· Set OA Drawdown Start Age in sidebar to fix the start age.</span>
                                )}
                              </p>
                            </div>

                          {/* Rev #12 — SRS Annual Contribution */}
                          {!isForeigner && (
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-highlight)" }}>
                                  SRS Annual Contribution
                                  <span style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 400, marginLeft: 4 }}>(cap ${((inputs.citizenStatus || "SC") === "foreigner" ? SRS_CAP_FOREIGNER : SRS_CAP_SC_PR).toLocaleString()})</span>
                                </label>
                                <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: "var(--clr-violet)" }}>{formatCurrency(effSRS)}/yr</span>
                              </div>
                              <input type="range" min={0} max={(inputs.citizenStatus || "SC") === "foreigner" ? SRS_CAP_FOREIGNER : SRS_CAP_SC_PR} step={500} value={effSRS}
                                onChange={e => setWhatIfSrsContrib(Number(e.target.value))}
                                onMouseUp={e => setWhatIfSrsContrib(Number(e.target.value))}
                                onTouchEnd={e => setWhatIfSrsContrib(Number(e.target.value))}
                                style={{ width: "100%", accentColor: "var(--clr-violet)", cursor: "pointer" }} />
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--border-strong)", marginTop: 2 }}>
                                <span>$0</span><span>Max</span>
                              </div>
                              <p style={{ fontSize: 9, color: "var(--text-subtle)", marginTop: 3 }}>
                                Sidebar value: <strong>{formatCurrency(Number(inputs.srsAnnualContribution) || 0)}/yr</strong>
                              </p>
                            </div>
                          )}

                          {/* Rev #12 — Private Asset Growth Rate */}
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-highlight)" }}>
                                Private Asset Growth Rate
                                <span style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 400, marginLeft: 4 }}>(annual %)</span>
                              </label>
                              <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: "var(--clr-blue)" }}>{effPG}%</span>
                            </div>
                            <input type="range" min={0} max={12} step={0.5} value={effPG}
                              onChange={e => setWhatIfPrivGrowth(Number(e.target.value))}
                              onMouseUp={e => setWhatIfPrivGrowth(Number(e.target.value))}
                              onTouchEnd={e => setWhatIfPrivGrowth(Number(e.target.value))}
                              style={{ width: "100%", accentColor: "var(--clr-blue)", cursor: "pointer" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--border-strong)", marginTop: 2 }}>
                              <span>0%</span><span>12%</span>
                            </div>
                            <p style={{ fontSize: 9, color: "var(--text-subtle)", marginTop: 3 }}>
                              Sidebar value: <strong>{Number(inputs.privateAssetGrowthRate) || 0}%</strong>
                            </p>
                            {(Number(inputs.currentPrivateAssets) || 0) === 0 && (Number(inputs.annualPrivateSaving) || 0) === 0 && (
                              <p style={{ fontSize: 9, color: "var(--clr-amber)", marginTop: 4, lineHeight: 1.5 }}>
                                ⚠ No private asset balance or annual saving configured — this slider has no effect. Add a current balance or annual saving in the <strong>Private Assets</strong> sidebar section first.
                              </p>
                            )}
                          </div>

                        </div>
                        {whatIfProjection && (
                          <div className="rg-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                            {[["Base Total", baseTotal, "var(--text-muted)"], ["What-If Total", whatIfTotal, "var(--clr-green)"], ["Difference", delta, delta >= 0 ? "var(--clr-green)" : "var(--clr-red)"], ["Change %", null, delta >= 0 ? "var(--clr-green)" : "var(--clr-red)"]].map(([label, val, color], i) => (
                              <div key={label} style={{ background: "var(--bg-base)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 12 }}>
                                <p style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
                                <p style={{ fontSize: 13, fontWeight: 900, fontFamily: "monospace", color }}>{i === 3 ? baseTotal > 0 ? `${delta >= 0 ? "+" : ""}${((delta / baseTotal) * 100).toFixed(1)}%` : "N/A" : `${delta >= 0 && i === 2 ? "+" : ""}${formatCurrency(Math.abs(val))}`}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {whatIfProjection && (
                          <div style={{ height: 280 }}>
                            <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 8 }}>Blue = base · Green = what-if · <span style={{ color: "var(--text-subtle)" }}>Hover for account breakdown</span></p>
                            <ResponsiveContainer width="99%" height="100%">
                              <LineChart data={(() => {
                                // Bug-WI3 fix: base line must terminate at payoutAge65 — the what-if
                                // line then visibly extends beyond it when effPA > payoutAge65.
                                // Previously both lines shared the same age range (max of the two),
                                // making the what-if extension invisible since the base line overlapped it.
                                // Bug-WI4 fix: O(1) Map lookups replace O(n²) .find() per chart row.
                                // Bug-WI1 fix: privateAssets + srsBalance included in both line totals
                                // and exposed as separate fields for the breakdown tooltip.
                                const wiRowMap  = new Map((whatIfProjection?.rows || []).map(r => [r.age, r]));
                                const startAge  = displayAccumulation[0]?.age ?? (Number(debouncedInputs.currentAge) || 35);
                                const endAge    = Math.max(payoutAge65, effPA);
                                // Fix-RD: base line reads from accumulationByAge (already deflated when
                                // isRealDollars=true). What-if rows are raw nominal engine output — apply
                                // the identical per-age deflation factor so both lines share the same scale.
                                const _wiChartInflD = isRealDollars ? (Number(debouncedInputs.inflationRate) || 0) / 100 : 0;
                                const _wiChartCaD   = Number(debouncedInputs.currentAge) || 35;
                                const _wiChartDefl  = (val, age) =>
                                  (isRealDollars && val != null)
                                    ? Math.round(val / Math.pow(1 + _wiChartInflD, Math.max(0, age - _wiChartCaD)))
                                    : val;
                                const chartRows = [];
                                for (let age = startAge; age <= endAge; age++) {
                                  const b = accumulationByAge.get(age);
                                  const w = wiRowMap.get(age);
                                  // Deflate each what-if field individually so tooltip breakdown is also correct
                                  const wOA  = w ? _wiChartDefl(w.oa,  age) : null;
                                  const wSA  = w ? _wiChartDefl(w.sa,  age) : null;
                                  const wMA  = w ? _wiChartDefl(w.ma,  age) : null;
                                  const wRA  = w ? _wiChartDefl(w.ra,  age) : null;
                                  const wPrv = w ? _wiChartDefl(w.privateAssets || 0, age) : null;
                                  const wSRS = w ? _wiChartDefl(w.srsBalance    || 0, age) : null;
                                  chartRows.push({
                                    age,
                                    // Base line: null beyond payoutAge65 so the line terminates there
                                    baseTotal: (b && age <= payoutAge65) ? ((b.total || 0) + (b.privateAssets || 0) + (b.srsBalance || 0)) : null,
                                    baseOA:  b?.oa  ?? null, baseSA: b?.sa ?? null,
                                    baseMA:  b?.ma  ?? null, baseRA: b?.ra ?? null,
                                    basePrv: b?.privateAssets ?? null, baseSRS: b?.srsBalance ?? null,
                                    // What-if line: deflated to match base scale when isRealDollars=true
                                    whatIfTotal: w ? ((wOA + wSA + wMA + wRA) + wPrv + wSRS) : null,
                                    whatIfOA: wOA, whatIfSA: wSA,
                                    whatIfMA: wMA, whatIfRA: wRA,
                                    whatIfPrv: wPrv, whatIfSRS: wSRS,
                                  });
                                }
                                return chartRows;
                              })()}
                                margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                                <XAxis dataKey="age" type="number" domain={["dataMin", "dataMax"]} stroke="var(--chart-text)" fontSize={10} tickCount={8} />
                                <YAxis tickFormatter={v => `$${v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} stroke="var(--chart-text)" fontSize={10} width={52} />
                                <Tooltip
                                  cursor={{ stroke: "var(--chart-cursor)", strokeWidth: 1, strokeDasharray: "4 3" }}
                                  wrapperStyle={{ pointerEvents: "none", zIndex: 100 }}
                                  content={({ active, payload, label }) => {
                                    if (!active || !payload?.length) return null;
                                    const base = payload.find(p => p.dataKey === "baseTotal");
                                    const wi = payload.find(p => p.dataKey === "whatIfTotal");
                                    const d = payload[0]?.payload || {};
                                    const diff = (wi?.value ?? 0) - (base?.value ?? 0);
                                    return (
                                      <div style={{ background: "var(--tooltip-bg)", backdropFilter: "blur(8px)", border: "1px solid var(--tooltip-border)", borderRadius: 10, padding: "10px 14px", fontSize: 10, minWidth: 210 }}>
                                        <p style={{ color: "var(--clr-slate)", fontWeight: 800, marginBottom: 8, fontSize: 11 }}>Age {label}</p>
                                        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: "3px 10px", alignItems: "center" }}>
                                          <span style={{ color: "#64748b", fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}></span>
                                          <span style={{ color: "var(--clr-blue2)", fontSize: 9, fontWeight: 800, textAlign: "right" }}>BASE</span>
                                          <span style={{ color: "var(--clr-emerald)", fontSize: 9, fontWeight: 800, textAlign: "right" }}>WHAT-IF</span>
                                          {[["OA", d.baseOA, d.whatIfOA, "var(--clr-blue)"], ["SA/RA", (d.baseSA||0)+(d.baseRA||0), (d.whatIfSA||0)+(d.whatIfRA||0), "var(--clr-green)"], ["MA", d.baseMA, d.whatIfMA, "var(--clr-violet)"], ["Private", d.basePrv, d.whatIfPrv, "var(--clr-orange)"], ["SRS", d.baseSRS, d.whatIfSRS, "var(--clr-amber)"]].map(([lbl, bv, wv, c]) => (
                                            <>
                                              <span style={{ color: c, fontWeight: 700 }}>{lbl}</span>
                                              <span style={{ color: "#e2e8f0", fontFamily: "monospace", textAlign: "right" }}>{formatCurrency(bv ?? 0)}</span>
                                              <span style={{ color: wv != null ? "#e2e8f0" : "#64748b", fontFamily: "monospace", textAlign: "right" }}>{wv != null ? formatCurrency(wv) : "—"}</span>
                                            </>
                                          ))}
                                          <span style={{ color: "var(--mc-total-color)", fontWeight: 800, borderTop: "1px solid var(--mc-total-border)", paddingTop: 4 }}>Total</span>
                                          <span style={{ color: "var(--clr-blue2)", fontFamily: "monospace", fontWeight: 800, textAlign: "right", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 4 }}>{formatCurrency(base?.value ?? 0)}</span>
                                          <span style={{ color: wi?.value != null ? "var(--clr-emerald)" : "#64748b", fontFamily: "monospace", fontWeight: 800, textAlign: "right", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 4 }}>{wi?.value != null ? formatCurrency(wi.value) : "—"}</span>
                                        </div>
                                        {wi?.value != null && base?.value != null && (
                                          <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: 9, color: "#64748b", fontWeight: 700 }}>Difference</span>
                                            <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 11, color: diff >= 0 ? "var(--clr-emerald)" : "var(--clr-red)" }}>{diff >= 0 ? "+" : ""}{formatCurrency(diff)}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }}
                                />
                                <Legend verticalAlign="top" height={20} iconSize={6} wrapperStyle={{ fontSize: 9, fontWeight: 600, color: "var(--text-main)" }} />
                                <Line isAnimationActive={false} type="monotone" dataKey="baseTotal" stroke="var(--clr-blue2)" strokeWidth={2} dot={false} name="Base" activeDot={{ r: 4, fill: "var(--clr-blue2)", stroke: "#fff", strokeWidth: 1.5 }} />
                                <Line isAnimationActive={false} type="monotone" dataKey="whatIfTotal" stroke="var(--clr-emerald)" strokeWidth={2.5} dot={false} name={`What-If (PA:${effPA})`} activeDot={{ r: 4, fill: "var(--clr-emerald)", stroke: "#fff", strokeWidth: 1.5 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
  );
}
