import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Activity, AlertTriangle, Info, Scale, SlidersHorizontal } from "lucide-react";
import { formatCurrency } from "../utils/helpers.js";

// LifeTab — receives all needed data and handlers as props.
// No direct App state access — pure function of its props.
export default function LifeTab({ inputs, debouncedInputs, displayProjection, sensitivityData, highlightPlan, setHighlightPlan, viewMode, setViewMode, basicPremiumPct, setBasicPremiumPct, payoutAge65, isForeigner, intersectionEscVsStd, intersectionStdVsBasic, intersectionEscVsBasic, intersectionEscPayVsStdPay }) {
  return (
              <div style={{ background: "var(--bg-panel)", border: "1px solid var(--border-subtle)", padding: 24, borderRadius: 24, display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="life-chart-header" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>Chart Projection (Age {inputs.payoutAge} – 95)</h3>
                  {/* B6: CPF LIFE eligibility info bar */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(var(--clr-purple-rgb),0.06)", border: "1px solid rgba(var(--clr-purple-rgb),0.2)", fontSize: 10, color: "var(--text-muted)" }}>
                    {[
                      ["🏛 Eligibility", "SC & PR only"],
                      ["📅 Born", "1958 or after"],
                      ["💰 RA threshold", "≥ $60,000 for auto-enrolment"],
                      ["⏱ Payout start", "Age 65–70 (your choice)"],
                      ["📈 Deferral bonus", "+7%/yr past 65"],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "var(--text-subtle)", fontSize: 9 }}>{label}:</span>
                        <span style={{ fontWeight: 700, color: "var(--text-highlight)", fontSize: 10 }}>{val}</span>
                        <span style={{ color: "rgba(var(--clr-purple-rgb),0.3)", marginLeft: 2, fontSize: 9 }}>|</span>
                      </div>
                    ))}
                    <span style={{ fontSize: 9, color: "var(--text-subtle)", alignSelf: "center" }}>Projections assume enrolment. Members below $60k RA may not auto-enrol but can apply.</span>
                  </div>
                  {/* P1 fix: Foreigner gate — CPF LIFE is SC/PR only. Show a prominent warning when
                      citizenStatus === 'foreigner' so the user knows the payout estimates below do not apply.
                      The chart is not suppressed — foreigners may be exploring what-if SC/PR scenarios. */}
                  {isForeigner && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 12, background: "rgba(var(--clr-amber-rgb),0.08)", border: "2px solid rgba(var(--clr-amber-rgb),0.45)" }}>
                      <AlertTriangle style={{ width: 18, height: 18, color: "var(--clr-amber3)", flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 11, lineHeight: 1.65, color: "var(--text-muted)" }}>
                        <span style={{ fontWeight: 800, color: "var(--clr-amber3)", fontSize: 12 }}>CPF LIFE is not available to foreigners.</span>
                        {" "}CPF LIFE is restricted to <strong>Singapore Citizens and Permanent Residents</strong> born in <strong>1958 or after</strong>.
                        As a foreigner, you have no CPF account and are not eligible for CPF LIFE, RA top-ups, RSTU, MRSS, or MMSS.
                        <br />
                        <span style={{ color: "var(--text-subtle)", fontSize: 10, marginTop: 4, display: "block" }}>
                          All CPF LIFE charts and analysis below are hidden for foreigners.
                          Your primary tax-deferred retirement vehicle is <strong>SRS</strong> (Supplementary Retirement Scheme) — contributions up to <strong>$35,700/yr</strong> are tax-deductible.
                          Update your citizenship in the <strong>Profile</strong> sidebar panel if this is incorrect.
                        </span>
                      </div>
                    </div>
                  )}
                  {/* life-chart-header closes here — the ternary below must be at the same
                      level as life-chart-header, not nested inside it, so the SC/PR fragment
                      can include all subsequent sibling sections without invalid JSX nesting. */}
                </div>
                {/* Gate all SC/PR content. Foreigners → locked SRS redirect panel.
                    Previously the chart, breakeven cards, and sensitivity table were shown
                    with RA=0, producing misleading "Beyond Age 95" crossover cards and $0
                    sensitivity rows. Now fully suppressed and replaced. */}
                {isForeigner ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "28px 24px", borderRadius: 16, background: "rgba(var(--clr-amber-rgb),0.05)", border: "2px dashed rgba(var(--clr-amber-rgb),0.3)", textAlign: "center" }}>
                    <div style={{ fontSize: 32 }}>🔒</div>
                    <p style={{ fontSize: 14, fontWeight: 900, color: "var(--clr-amber)", margin: 0 }}>CPF LIFE — Not Available to Foreigners</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
                      CPF LIFE is a mandatory annuity scheme for <strong style={{ color: "var(--text-bright)" }}>Singapore Citizens and Permanent Residents</strong> only.
                      As a foreigner you have no CPF account, no RA, and no eligibility for any CPF LIFE plan — the chart and analysis below would only show $0 payouts and are therefore not displayed.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 500, margin: "0 auto", width: "100%" }}>
                      {[
                        ["💰 Your retirement scheme", "SRS (Supplementary Retirement Scheme)", "#0ea5e9"],
                        ["📋 Annual contribution cap", "$35,700 / yr (foreigner rate)", "var(--clr-green)"],
                        ["🧾 Tax deduction", "SRS contributions are fully tax-deductible", "var(--clr-violet)"],
                        ["📊 Manage SRS", "Use the SRS panel in the sidebar", "var(--clr-amber)"],
                      ].map(([lbl, desc, color]) => (
                        <div key={lbl} style={{ padding: "10px 14px", borderRadius: 10, background: "var(--bg-muted)", border: "1px solid var(--border-subtle)", textAlign: "left" }}>
                          <p style={{ fontSize: 10, fontWeight: 800, color, margin: "0 0 4px" }}>{lbl}</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{desc}</p>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 10, color: "var(--text-subtle)", margin: 0 }}>
                      Switch citizenship to <strong>SC</strong> or <strong>PR</strong> in the Profile panel to explore CPF LIFE plan comparisons.
                    </p>
                  </div>
                ) : (
                  <>
                  {/* LIFE tab intro — collapsible via native <details> (no hooks) */}
                  <details style={{ borderRadius: 12, background: "var(--bg-panel-muted)", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
                    <summary style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none", listStyle: "none", outline: "none" }}>
                      <p style={{ fontWeight: 700, color: "var(--text-highlight)", margin: 0, fontSize: 12 }}>📊 LIFE Tab — How to Read This Tab</p>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>▼ Show</span>
                    </summary>
                    <div style={{ padding: "0 16px 12px", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.7 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8, marginBottom: 8 }}>
                        {[
                          ["📈 The Line Chart", "Shows monthly payout, annual payout, bequest, or cumulative total yield from age " + inputs.payoutAge + " to 95 for all three LIFE plans simultaneously. Toggle view modes using the buttons above the chart."],
                          ["Standard Plan (grey)", "Level flat monthly payout for life. 100% of RA transferred as premium. Predictable income but no inflation protection."],
                          ["Escalating Plan (green)", "Monthly payout starts ~20% lower than Standard but grows at 2%/yr. Surpasses Standard eventually — see the crossover age below."],
                          ["Basic Plan (amber)", "RA is split: a % is premium (pool), the rest stays in your personal RA earning 4% and funds your own payouts until ~age 90. After 90, the pool takes over."],
                          ["📐 Breakeven / Crossover", "The age where one plan's cumulative total yield overtakes another. Switch to 'Total Yield' view to see the dotted reference lines on the chart."],
                          ["📋 Sensitivity Table", "Shows starting monthly payouts and all crossover ages for every payout age from 65 to 70. Green row = your current selection."],
                        ].map(([title, desc]) => (
                          <div key={title} style={{ padding: "8px 10px", borderRadius: 8, background: "var(--bg-muted)", border: "1px solid var(--border-subtle)" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-highlight)", marginBottom: 3 }}>{title}</div>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", lineHeight: 1.5 }}>{desc}</div>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 10, color: "var(--text-subtle)" }}>💡 <strong>Tip:</strong> Use the plan selector (Standard / Escalating / Basic) to highlight one plan's line. The other two are dimmed for clarity. Hover over the chart to see exact values at any age.</p>
                    </div>
                  </details>
                  <div style={{ display: "flex", background: "var(--bg-input)", padding: 4, borderRadius: 10, gap: 2, alignSelf: "flex-start" }}>
                    {["standard", "escalating", "basic"].map(plan => (
                      <button key={plan} onClick={() => setHighlightPlan(plan)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 800, textTransform: "uppercase", border: "none", cursor: "pointer", background: highlightPlan === plan ? "var(--clr-emerald)" : "transparent", color: highlightPlan === plan ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>
                        {plan}
                      </button>
                    ))}
                  </div>
                {/* Payout Premium Sliders - Standard & Escalating only (Basic has its own slider below) */}
                <div style={{ background: "var(--bg-base)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "14px 18px" }}>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: "var(--text-bright)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><SlidersHorizontal style={{ width: 13, height: 13, color: "var(--clr-amber)" }} />CPF LIFE Premium Structure</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-slate)" }}>Standard Plan Premium</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--clr-slate)" }}>100% (Fixed)</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: "var(--clr-slate)", width: "100%", marginBottom: 4 }} />
                      <p style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>Fixed at 100%. Full RA transferred to CPF Board as premium. Flat monthly payout for life.</p>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--clr-emerald)" }}>Escalating Plan Premium</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--clr-emerald)" }}>100% (Fixed)</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: "var(--clr-emerald)", width: "100%", marginBottom: 4 }} />
                      <p style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>Fixed at 100%. Full RA transferred to CPF Board as premium. Payout grows 2%/yr for life.</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", background: "var(--bg-base)", padding: 4, borderRadius: 12, border: "1px solid var(--border-subtle)", gap: 2 }}>
                  {[["payout", "Monthly Payout"], ["annualPayout", "Annual Payout"], ["bequest", "Bequest"], ["total", "Total Yield"]].map(([id, label]) => (
                    <button key={id} onClick={() => setViewMode(id)} style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase", border: "none", cursor: "pointer", background: viewMode === id ? "var(--clr-emerald)" : "transparent", color: viewMode === id ? "var(--ctrl-on-text)" : "var(--text-muted)" }}>
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ height: 350 }}>
                  <ResponsiveContainer width="99%" height="100%">
                    <LineChart data={displayProjection.filter(d => d.age >= payoutAge65)}> {/* BUG-51 fix: use debounced payoutAge65 */}
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis dataKey="age" stroke="var(--chart-text)" fontSize={11} tick={{ fill: "var(--chart-text)", fontWeight: 600 }} label={{ value: "Age", position: "insideBottomRight", offset: -5, fill: "var(--chart-text)", fontSize: 9 }} />
                      <YAxis tickFormatter={v => `$${v > 999 ? (v / 1000).toFixed(0) + "k" : v}`} stroke="var(--chart-text)" fontSize={11} tick={{ fill: "var(--chart-text)", fontWeight: 600 }} label={{ value: "Amount ($)", angle: -90, position: "insideLeft", offset: 14, fill: "var(--chart-text)", fontSize: 9, style: { textAnchor: "middle" } }} />
                      <Tooltip contentStyle={{ background: "var(--tooltip-bg)", backdropFilter: "blur(4px)", border: "1px solid var(--tooltip-border)", borderRadius: 8, fontSize: 10, padding: "6px 8px" }} itemStyle={{ padding: 0, color: "var(--tooltip-text)" }} labelStyle={{ fontSize: 10, color: "var(--tooltip-label)", marginBottom: 2 }} formatter={v => formatCurrency(v)} wrapperStyle={{ pointerEvents: "none" }} />
                      <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: 9, fontWeight: 600, color: "var(--text-main)" }} />
                      {viewMode === "total" && intersectionEscVsStd && <ReferenceLine x={intersectionEscVsStd} stroke="var(--clr-amber3)" strokeWidth={1.5} strokeDasharray="4 4" label={{ position: "insideTopLeft", value: `Break-Even Age ${intersectionEscVsStd}`, fill: "var(--clr-amber3)", fontSize: 9, fontWeight: "bold" }} />}
                      {viewMode === "total" && intersectionStdVsBasic && <ReferenceLine x={intersectionStdVsBasic} stroke="var(--clr-blue2)" strokeWidth={1.5} strokeDasharray="4 4" label={{ position: "insideBottomRight", value: `Std>Basic Age ${intersectionStdVsBasic}`, fill: "var(--clr-blue2)", fontSize: 9, fontWeight: "bold" }} />}
                      {viewMode === "payout" && intersectionEscPayVsStdPay && <ReferenceLine x={intersectionEscPayVsStdPay} stroke="var(--clr-emerald)" strokeWidth={1.5} strokeDasharray="4 4" label={{ position: "insideTopLeft", value: `Esc>Std Pay Age ${intersectionEscPayVsStdPay}`, fill: "var(--clr-emerald)", fontSize: 9, fontWeight: "bold" }} />}
                      <Line isAnimationActive={false} type="monotone" dataKey={viewMode === "payout" ? "standardMonthly" : viewMode === "annualPayout" ? "standardAnnual" : viewMode === "total" ? "standardTotal" : "standardBequest"} stroke="var(--clr-slate)" strokeWidth={highlightPlan === "standard" ? 4 : 2} strokeDasharray={highlightPlan === "standard" ? "" : "6 3"} opacity={highlightPlan === "standard" ? 1 : 0.65} dot={false} name="Standard" />
                      <Line isAnimationActive={false} type="monotone" dataKey={viewMode === "payout" ? "escalatingMonthly" : viewMode === "annualPayout" ? "escalatingAnnual" : viewMode === "total" ? "escalatingTotal" : "escalatingBequest"} stroke="var(--clr-emerald)" strokeWidth={highlightPlan === "escalating" ? 4 : 2} strokeDasharray={highlightPlan === "escalating" ? "" : "6 3"} opacity={highlightPlan === "escalating" ? 1 : 0.65} dot={false} name="Escalating" />
                      <Line isAnimationActive={false} type="monotone" dataKey={viewMode === "payout" ? "basicMonthly" : viewMode === "annualPayout" ? "basicAnnual" : viewMode === "total" ? "basicTotal" : "basicBequest"} stroke="var(--clr-amber3)" strokeWidth={highlightPlan === "basic" ? 4 : 2} strokeDasharray={highlightPlan === "basic" ? "" : "6 3"} opacity={highlightPlan === "basic" ? 1 : 0.65} dot={false} name="Basic" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Info cards */}
                <div className="rg-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[["Standard/Escalating Bequest", "Beneficiaries receive total premium minus cumulative payouts. Interest not included.", "var(--clr-slate)"], ["Total Yield", "Cumulative payouts received plus remaining bequest. Switch to Total Yield to see breakeven lines.", "var(--clr-blue)"]].map(([title, text, color]) => (
                    <div key={title} style={{ padding: 14, borderRadius: 12, background: "var(--bg-panel-muted)", border: "1px solid var(--border-subtle)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                      <strong style={{ color }}>{title}: </strong>{text}
                    </div>
                  ))}
                  {/* Basic plan card with embedded slider */}
                  <div style={{ padding: 14, borderRadius: 12, background: "rgba(var(--clr-amber3-rgb),0.06)", border: "2px solid rgba(var(--clr-amber3-rgb),0.3)", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    <strong style={{ color: "var(--clr-amber3)" }}>Basic Bequest: </strong>Before age 90 (Phase 1): remaining personal RA balance <em>plus</em> a full refund of the premium paid — CPF policy returns the full premium if death occurs before the pool phase. After 90 (Phase 2): unused pool premium minus any payouts already drawn from the pool. Higher % → larger pool premium, smaller retained RA, lower Phase 1 payout.
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(var(--clr-amber3-rgb),0.2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--clr-amber3)", display: "flex", alignItems: "center", gap: 4 }}><SlidersHorizontal style={{ width: 11, height: 11 }} />Basic Premium</span>
                        <span style={{ fontSize: 12, fontWeight: 900, color: "var(--clr-amber)", fontFamily: "monospace" }}>{basicPremiumPct}%</span>
                      </div>
                      <input type="range" min={10} max={20} step={1} value={basicPremiumPct} onChange={e => setBasicPremiumPct(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--clr-amber3)", margin: "2px 0" }} />
                      <p style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3 }}>10%–20% of RA deducted as life-pool premium. Drag to see live impact on chart above.</p>
                    </div>
                  </div>
                </div>
                {/* Breakeven Analysis */}
                <div style={{ background: "var(--bg-base)", border: "1px solid var(--border-strong)", borderRadius: 16, padding: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 900, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}><Activity style={{ width: 14, height: 14, color: "var(--clr-amber)" }} />Plan Breakeven &amp; Crossover Analysis</h4>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 14 }}>All crossover ages based on cumulative Total Yield. Switch to "Total Yield" view to see reference lines.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      ["Standard vs. Escalating", "Escalating Overtakes Standard", intersectionEscVsStd, "var(--clr-amber)", "rgba(var(--clr-amber3-rgb),0.1)", "rgba(var(--clr-amber3-rgb),0.2)", "Esc starts ~20% lower but grows 2%/yr. Takes decades for cumulative total yield to catch up. Break-Even Age shows when Escalating surpasses Standard."],
                      ["Standard vs. Basic", "Standard Overtakes Basic", intersectionStdVsBasic, "var(--clr-blue)", "rgba(var(--clr-blue2-rgb),0.1)", "rgba(var(--clr-blue2-rgb),0.2)", "In early retirement, Basic yields more total value because the 90% retained RA earns compound interest into your bequest. Once Basic RA depletes at 90, Standard overtakes."],
                      ["Escalating vs. Basic", "Escalating Overtakes Basic", intersectionEscVsBasic, "var(--clr-violet2)", "rgba(var(--clr-purple-rgb),0.1)", "rgba(var(--clr-purple-rgb),0.2)", "Basic's high early bequest makes it lead initially, but Escalating's 2% annual growth compounds fastest over the extreme long term, eventually surpassing Basic."],
                      ["Monthly Payout Crossover", "Esc Monthly Payout Exceeds Standard", intersectionEscPayVsStdPay, "var(--clr-green)", "rgba(var(--clr-emerald-rgb),0.1)", "rgba(var(--clr-emerald-rgb),0.2)", "At 2%/yr compounding, Escalating monthly payout eventually exceeds Standard's fixed amount. This is the age your monthly cheque is larger under Escalating."]
                    ].map(([cardTitle, label, age, color, bg, border, note]) => (
                      <div key={label} style={{ padding: 14, borderRadius: 12, background: bg, border: `1px solid ${border}` }}>
                        <p style={{ fontSize: 13, fontWeight: 900, color, marginBottom: 4 }}>{cardTitle}</p>
                        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
                        <p style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace", color, marginBottom: 6 }}>{age ? `Age ${age}` : "Beyond Age 95"}</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Sensitivity Table */}
                <div style={{ background: "var(--bg-base)", border: "1px solid var(--border-strong)", borderRadius: 16, padding: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 900, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><Scale style={{ width: 14, height: 14, color: "var(--clr-blue)" }} />Payout Age Sensitivity Table</h4>
                  <p style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
                    Each row shows estimated monthly payouts at each payout age, based on 2026 CPF Board data. Deferral increases payouts because RA grows further and the payout period shortens. The green-highlighted row is your current payout age selection.
                    <br /><strong style={{ color: "var(--text-bright)" }}>Column guide: </strong>
                    <span style={{ color: "var(--clr-slate)" }}>Std</span> = Standard monthly · <span style={{ color: "var(--clr-green)" }}>Esc</span> = Escalating monthly · <span style={{ color: "var(--clr-orange)" }}>Bas</span> = Basic monthly · <span style={{ color: "var(--clr-amber)" }}>Esc&gt;Std</span> = age when Escalating cumulative total overtakes Standard · <span style={{ color: "var(--clr-blue)" }}>Std&gt;Bas</span> = age when Standard overtakes Basic · <span style={{ color: "var(--clr-violet2)" }}>Esc&gt;Bas</span> = age when Escalating overtakes Basic.
                  </p>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "monospace" }}>
                      <thead><tr style={{ borderBottom: "1px solid var(--border-strong)" }}>
                        <th style={{ padding: "8px", textAlign: "left", color: "var(--text-muted)", fontWeight: 800, fontSize: 9, textTransform: "uppercase" }}>Payout Age</th>
                        <th style={{ padding: "8px", textAlign: "right", color: "var(--clr-slate)", fontWeight: 800, fontSize: 9, textTransform: "uppercase" }}>Std $/mo</th>
                        <th style={{ padding: "8px", textAlign: "right", color: "var(--clr-green)", fontWeight: 800, fontSize: 9, textTransform: "uppercase" }}>Esc $/mo</th>
                        <th style={{ padding: "8px", textAlign: "right", color: "var(--clr-orange)", fontWeight: 800, fontSize: 9, textTransform: "uppercase" }}>Bas $/mo</th>
                        <th style={{ padding: "8px", textAlign: "right", color: "var(--clr-amber)", fontWeight: 800, fontSize: 9, textTransform: "uppercase" }}>Esc&gt;Std</th>
                        <th style={{ padding: "8px", textAlign: "right", color: "var(--clr-blue)", fontWeight: 800, fontSize: 9, textTransform: "uppercase" }}>Std&gt;Bas</th>
                        <th style={{ padding: "8px", textAlign: "right", color: "var(--clr-violet2)", fontWeight: 800, fontSize: 9, textTransform: "uppercase" }}>Esc&gt;Bas</th>
                      </tr></thead>
                      <tbody>{sensitivityData.map(row => {
                        const isCurrent = row.pAge === (Number(inputs.payoutAge) || 65);
                        return (<tr key={row.pAge} style={{ borderBottom: "1px solid var(--border-subtle)", background: isCurrent ? "rgba(var(--clr-emerald-rgb),0.08)" : "" }}>
                          <td style={{ padding: "8px", fontWeight: 800, color: isCurrent ? "var(--clr-green)" : "var(--text-muted)" }}>Age {row.pAge}{isCurrent ? "  ◀ " : ""}</td>
                          <td style={{ padding: "8px", textAlign: "right", color: "var(--text-highlight)" }}>{row.stdMonthly > 0 ? `$${row.stdMonthly.toLocaleString()}` : "—"}</td>
                          <td style={{ padding: "8px", textAlign: "right", color: "var(--clr-green)" }}>{row.escMonthly > 0 ? `$${row.escMonthly.toLocaleString()}` : "—"}</td>
                          <td style={{ padding: "8px", textAlign: "right", color: "var(--clr-orange)" }}>{row.basMonthly > 0 ? `$${row.basMonthly.toLocaleString()}` : "—"}</td>
                          <td style={{ padding: "8px", textAlign: "right", color: "var(--clr-amber)", fontWeight: 700 }}>{row.escVsStd ? `Age ${row.escVsStd}` : ">95"}</td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#93c5fd", fontWeight: 700 }}>{row.stdVsBasic ? `Age ${row.stdVsBasic}` : ">95"}</td>
                          <td style={{ padding: "8px", textAlign: "right", color: "#d8b4fe", fontWeight: 700 }}>{row.escVsBasic ? `Age ${row.escVsBasic}` : ">95"}</td>
                        </tr>);
                      })}</tbody>
                    </table>
                  </div>
                </div>
                  </>
                )}
              </div>
            )}
  );
}
